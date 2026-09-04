/**
 * tools.ts
 *
 * @description MCP ツールの定義とハンドラ。input（検証・ポリシー判定・解決）→ api → output の3段
 */

import { ApiFailureError, ScopeDeniedError, TOOL_NAMES, TOOL_SPECS } from '../contract.ts';
import { isAllowed, listedTools, projectKeysFor } from '../policy/policy.ts';
import { toProjectId, toProjectIds } from '../domain/masters.ts';
import { limitCount, wrapUntrusted } from './untrusted.ts';
import { assertNever } from '../shared/assertNever.ts';
import { toError } from '../shared/toError.ts';
import type { ResolvedPolicy, ResolvedRequest, ToolName } from '../contract.ts';
import type { BacklogGateway } from '../domain/gateway.ts';
import type { Masters } from '../domain/masters.ts';
import type { McpHandlers, ToolDefinition, ToolResult } from '../mcp/protocol.ts';

/** 課題キーの形。接頭辞がプロジェクトキー（半角英大文字・数字・アンダースコア）。 */
const ISSUE_KEY_PATTERN = /^([A-Z0-9_]+)-\d+$/;

export interface ToolLimits {
  /** 一覧系で返す最大件数。 */
  readonly maxCount: number;
  /** 本文の最大文字数。 */
  readonly maxTextLength: number;
}

export const DEFAULT_LIMITS: ToolLimits = { maxCount: 20, maxTextLength: 4000 };

/**
 * input 段と output 段が使うもの。**I/O を含まない。**
 *
 * スコープが効いているかの検証はこの文脈だけで書けるので、境界テストに
 * Transport のモックが要らない。
 */
export interface PlanContext {
  readonly policy: ResolvedPolicy;
  readonly masters: Masters;
  readonly limits: ToolLimits;
}

export interface ToolContext extends PlanContext {
  readonly gateway: BacklogGateway;
}

/**
 * input 段の成果物。**このリクエストは送るだけの状態になっている。**
 *
 * ほとんどのツールは1往復で済む（`send`）が、`GET /wikis/:wikiId` のように
 * **数値 ID しか受けないエンドポイント**へ届くには、先に一覧を引いて名前から
 * ID を解決する往復が要る（`chain`）。
 *
 * - `shape` は応答を整える純関数（フィールドを絞り、第三者のテキストを囲む）
 * - `next` は**応答から次のリクエストを決める純関数**。I/O は `runTool` に留まるので、
 *   「一覧の応答 → 次に何を叩くか」を Transport 抜きで検証できる
 */
export type PlannedCall =
  | {
      readonly kind: 'send';
      readonly request: ResolvedRequest;
      readonly shape: (raw: unknown) => unknown;
    }
  | {
      readonly kind: 'chain';
      readonly request: ResolvedRequest;
      readonly next: (raw: unknown) => PlannedCall;
    };

/**
 * 1回のツール呼び出しで許す往復の上限。
 *
 * 今使うのは2（一覧 → 本文）。上限に達したら黙って止めず送出する（規約 §5.4）。
 */
const MAX_HOPS = 4;

// ============================================================================
// input — 引数の検証（外部入力なので unknown で受ける。規約 §4.6）
// ============================================================================

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requiredString = (args: Record<string, unknown>, name: string): string => {
  const value = args[name];
  if (typeof value !== 'string' || value === '') {
    throw new TypeError(`${name} には空でない string を指定してください`);
  }
  return value;
};

const optionalString = (args: Record<string, unknown>, name: string): string | undefined => {
  const value = args[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new TypeError(`${name} には string を指定してください`);
  }
  return value;
};

/**
 * 課題キーからプロジェクトキーを取り出し、ポリシーに照らす。
 *
 * **API へ到達する前に弾く**（種別 A のエンドポイント）。数値の課題 ID は受け付けない —
 * 受け付けるとローカルで判定できず、スコープ外の課題に到達できてしまう。
 */
const resolveIssueKey = (
  context: PlanContext,
  toolName: ToolName,
  issueKey: string,
): { readonly issueKey: string; readonly projectKey: string } => {
  const matched = ISSUE_KEY_PATTERN.exec(issueKey);
  if (matched === null) {
    throw new TypeError(
      `issueKey には課題キー（例: PROJ-123）を指定してください。数値の課題 ID は受け付けません`,
    );
  }
  // 直前の exec が成功しているのでキャプチャは必ずある。
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- 上の null 検査で確定
  const projectKey = matched[1]!;

  if (!isAllowed(context.policy, projectKey, toolName)) {
    throw new ScopeDeniedError(
      `プロジェクト ${projectKey} では ${toolName} を実行できません`,
      toolName,
      projectKey,
    );
  }
  return { issueKey, projectKey };
};

/**
 * 絞り込みパラメータに載せる projectId を**ポリシーから**決める。
 *
 * LLM が渡した `projectId` は採用しない。引数にその口を作っていないので、
 * そもそも渡せない（「チェックして拒否」ではなく「到達不能」）。
 */
const scopedProjectIds = (context: PlanContext, toolName: ToolName): readonly number[] => {
  const projectKeys = projectKeysFor(context.policy, toolName);
  if (projectKeys.length === 0) {
    throw new ScopeDeniedError(`${toolName} を実行できるプロジェクトがありません`, toolName, null);
  }
  return toProjectIds(context.masters, projectKeys);
};

const boundedCount = (args: Record<string, unknown>, limits: ToolLimits): number => {
  const raw = args['count'];
  if (raw === undefined || raw === null) {
    return limits.maxCount;
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1) {
    throw new TypeError('count には 1 以上の整数を指定してください');
  }
  return Math.min(raw, limits.maxCount);
};

// ============================================================================
// output — フィールドを絞り、第三者のテキストを囲む
// ============================================================================

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/** `{ name: ... }` の形から name だけを取る（数値 ID は落とす）。 */
const pickName = (value: unknown): string | undefined =>
  isRecord(value) ? pickString(value['name']) : undefined;

/**
 * 出力から**数値 ID を落とす**。
 *
 * Backlog の `projectId` / `issueId` は連番なので、返すとスコープ外の資源の存在を
 * 推測できる。返した値が別の操作への入口にならないようにする（Electron が
 * `IpcRendererEvent` を渡すなと言うのと同型）。
 */
const shapeIssue = (raw: unknown, limits: ToolLimits): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: '課題の形が想定と違います' };
  }
  const issueKey = pickString(raw['issueKey']) ?? '(不明)';
  const description = pickString(raw['description']);

  return {
    issueKey,
    summary: pickString(raw['summary']),
    issueType: pickName(raw['issueType']),
    status: pickName(raw['status']),
    priority: pickName(raw['priority']),
    assignee: pickName(raw['assignee']),
    created: pickString(raw['created']),
    updated: pickString(raw['updated']),
    description:
      description === undefined
        ? undefined
        : wrapUntrusted(description, {
            source: `backlog:issue:${issueKey}:description`,
            maxLength: limits.maxTextLength,
          }),
  };
};

const shapeComment = (
  raw: unknown,
  issueKey: string,
  limits: ToolLimits,
): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'コメントの形が想定と違います' };
  }
  const content = pickString(raw['content']) ?? '';
  return {
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    content: wrapUntrusted(content, {
      source: `backlog:issue:${issueKey}:comment`,
      maxLength: limits.maxTextLength,
    }),
  };
};

const shapeWikiPage = (raw: unknown): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'Wiki ページの形が想定と違います' };
  }
  return {
    name: pickString(raw['name']),
    createdUser: pickName(raw['createdUser']),
    updated: pickString(raw['updated']),
  };
};

/**
 * Wiki の本文。**一覧（`shapeWikiPage`）とは別物** — 一覧に `content` は無い。
 *
 * `id` / `projectId` は落とす。返した値が別の操作への入口にならないようにする
 * （そもそも `wikiId` を受け取るツールを作っていないので、返しても使い道が無い）。
 */
const shapeWikiPageDetail = (
  raw: unknown,
  projectKey: string,
  limits: ToolLimits,
): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'Wiki ページの形が想定と違います' };
  }
  const name = pickString(raw['name']) ?? '(不明)';
  return {
    projectKey,
    name,
    createdUser: pickName(raw['createdUser']),
    updated: pickString(raw['updated']),
    content: wrapUntrusted(pickString(raw['content']) ?? '', {
      source: `backlog:wiki:${projectKey}:${name}:content`,
      maxLength: limits.maxTextLength,
    }),
  };
};

const asArray = (value: unknown, where: string): readonly unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${where} の応答が配列ではありません`);
  }
  return value;
};

/**
 * 一覧の応答からページ名に一致する id を取り出す。**純関数**。
 *
 * 呼び出し元が渡すのは「ポリシー由来の `projectIdOrKey` で絞った一覧」なので、
 * ここで取れる id は**定義上すべて許可プロジェクトのもの**。LLM から id を受け取る
 * 口が無いことと合わせて、スコープ外の Wiki へ到達する経路が存在しない。
 *
 * 見つからなければ送出する（規約 §5.4 — 黙って空を返さない）。
 */
const findWikiId = (raw: unknown, name: string): number => {
  for (const item of asArray(raw, 'GET /wikis')) {
    if (!isRecord(item) || item['name'] !== name) {
      continue;
    }
    const id = item['id'];
    if (typeof id === 'number') {
      return id;
    }
  }
  throw new Error(`Wiki ページ「${name}」が見つかりません`);
};

/** 打ち切った事実を必ず出力に載せる（規約 §5.4）。 */
const listPayload = (
  items: readonly unknown[],
  truncated: boolean,
  maxCount: number,
): Record<string, unknown> =>
  truncated
    ? { items, truncated: true, note: `上限 ${String(maxCount)} 件で打ち切りました` }
    : { items };

// ============================================================================
// 各ツール
// ============================================================================

/**
 * 引数を検証し、ポリシーを適用し、送るだけの状態まで組み立てる。**純関数**。
 *
 * ここを抜けた時点で絞り込みはポリシー由来の値に確定している。api 層に渡ってから
 * 上書きするのではなく、**上書きされたものしか作れない**。
 *
 * @param context - ポリシー・マスタ・上限（I/O を含まない）
 * @param toolName - 許可済みのツール名
 * @param args - クライアントから来た引数（未検証）
 * @returns 送るリクエストと、応答を整える関数
 * @throws {TypeError} 引数の形が不正な場合
 * @throws {ScopeDeniedError} ポリシーが許可していないプロジェクトの場合
 */
export const planToolCall = (
  context: PlanContext,
  toolName: ToolName,
  args: Record<string, unknown>,
): PlannedCall => {
  const { limits, masters } = context;

  switch (toolName) {
    case 'search_issues': {
      const count = boundedCount(args, limits);
      // projectId はポリシー由来。引数から受け取る口を作っていない。
      const query: Record<string, unknown> = {
        'projectId[]': scopedProjectIds(context, toolName),
        count,
        sort: 'updated',
        order: 'desc',
      };
      const keyword = optionalString(args, 'keyword');
      if (keyword !== undefined) {
        query['keyword'] = keyword;
      }
      return {
        kind: 'send',
        request: { endpoint: '/issues', method: 'GET', query },
        shape: raw => {
          const { items, truncated } = limitCount(asArray(raw, 'GET /issues'), count);
          return listPayload(
            items.map(item => shapeIssue(item, limits)),
            truncated,
            count,
          );
        },
      };
    }

    case 'get_issue': {
      const { issueKey } = resolveIssueKey(context, toolName, requiredString(args, 'issueKey'));
      return {
        kind: 'send',
        request: { endpoint: `/issues/${issueKey}`, method: 'GET' },
        shape: raw => shapeIssue(raw, limits),
      };
    }

    case 'get_issue_comments': {
      const { issueKey } = resolveIssueKey(context, toolName, requiredString(args, 'issueKey'));
      const count = boundedCount(args, limits);
      return {
        kind: 'send',
        request: {
          endpoint: `/issues/${issueKey}/comments`,
          method: 'GET',
          query: { count, order: 'desc' },
        },
        shape: raw => {
          const { items, truncated } = limitCount(asArray(raw, 'GET /issues/*/comments'), count);
          return listPayload(
            items.map(item => shapeComment(item, issueKey, limits)),
            truncated,
            count,
          );
        },
      };
    }

    case 'list_wiki_pages': {
      const projectKey = requiredString(args, 'projectKey');
      if (!isAllowed(context.policy, projectKey, toolName)) {
        throw new ScopeDeniedError(
          `プロジェクト ${projectKey} では ${toolName} を実行できません`,
          toolName,
          projectKey,
        );
      }
      // 許可を確認したうえで、送るのは解決済みの projectId。
      const query: Record<string, unknown> = { projectIdOrKey: toProjectId(masters, projectKey) };
      const keyword = optionalString(args, 'keyword');
      if (keyword !== undefined) {
        query['keyword'] = keyword;
      }
      return {
        kind: 'send',
        request: { endpoint: '/wikis', method: 'GET', query },
        shape: raw => {
          const { items, truncated } = limitCount(asArray(raw, 'GET /wikis'), limits.maxCount);
          return listPayload(items.map(shapeWikiPage), truncated, limits.maxCount);
        },
      };
    }

    case 'get_wiki_page': {
      const projectKey = requiredString(args, 'projectKey');
      if (!isAllowed(context.policy, projectKey, toolName)) {
        throw new ScopeDeniedError(
          `プロジェクト ${projectKey} では ${toolName} を実行できません`,
          toolName,
          projectKey,
        );
      }
      const name = requiredString(args, 'name');
      return {
        kind: 'chain',
        // 1本目は一覧。projectIdOrKey はポリシー由来なので、返るのは許可プロジェクトの Wiki だけ。
        request: {
          endpoint: '/wikis',
          method: 'GET',
          query: { projectIdOrKey: toProjectId(masters, projectKey) },
        },
        next: raw => ({
          kind: 'send',
          // 2本目の id は 1本目の応答からしか採らない。引数で渡す口は作っていない。
          request: { endpoint: `/wikis/${String(findWikiId(raw, name))}`, method: 'GET' },
          shape: detail => shapeWikiPageDetail(detail, projectKey, limits),
        }),
      };
    }

    case 'add_issue_comment': {
      const { issueKey } = resolveIssueKey(context, toolName, requiredString(args, 'issueKey'));
      const content = requiredString(args, 'content');
      return {
        kind: 'send',
        // notifiedUserId は載せない。LLM に通知先を決めさせない。
        request: {
          endpoint: `/issues/${issueKey}/comments`,
          method: 'POST',
          form: { content },
        },
        shape: raw => ({
          issueKey,
          posted: true,
          created: isRecord(raw) ? pickString(raw['created']) : undefined,
        }),
      };
    }

    default: {
      return assertNever(toolName);
    }
  }
};

/**
 * gateway を呼び、失敗したら**下から来たメッセージを囲んで**投げ直す。
 *
 * `planToolCall` が投げるのはこちらが書いた文言（`ScopeDeniedError` 等）だが、
 * `send` が投げるのは Backlog サーバが書いた文字列を含む（`Backlog API エラー: …`）。
 * 課題本文と同じ untrusted なので、そのまま LLM へ返さない。
 *
 * **層で分けているので、エラー名の一覧を持たなくてよい** — この try の内側から
 * 出てきたものは定義上すべて「下から来たもの」。
 */
const sendRequest = async (context: ToolContext, request: ResolvedRequest): Promise<unknown> => {
  try {
    return await context.gateway.send(request);
  } catch (e) {
    const original = toError(e);
    const wrapped = wrapUntrusted(original.message, {
      source: 'backlog:error',
      maxLength: context.limits.maxTextLength,
    });
    // cause で元を残す（規約 §6.2）。監査ログと stderr には元の形で辿れる
    throw new ApiFailureError(`Backlog API の呼び出しに失敗しました:\n${wrapped}`, {
      cause: original,
    });
  }
};

/**
 * **I/O はここだけ。** 何を送り、応答をどう読むかは `planToolCall` が持つ純関数が決める。
 *
 * `chain` が返るあいだ往復を続ける。上限に達したら送出する（規約 §5.4 — 打ち切りを
 * 黙って成功にしない）。今の最長は2往復（Wiki の一覧 → 本文）。
 */
const runTool = async (
  context: ToolContext,
  toolName: ToolName,
  args: Record<string, unknown>,
): Promise<unknown> => {
  let planned = planToolCall(context, toolName, args);

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const raw = await sendRequest(context, planned.request);
    if (planned.kind === 'send') {
      return planned.shape(raw);
    }
    planned = planned.next(raw);
  }
  throw new Error(`${toolName} が ${String(MAX_HOPS)} 往復で終わりませんでした`);
};

// ============================================================================
// ツール定義（inputSchema）
// ============================================================================

const COUNT_PROPERTY = {
  type: 'integer',
  minimum: 1,
  description: '取得件数の希望値。サーバ側の上限で切り下げられます。',
} as const;

const INPUT_SCHEMAS: { readonly [K in ToolName]: Record<string, unknown> } = {
  search_issues: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: '検索キーワード' },
      count: COUNT_PROPERTY,
    },
    additionalProperties: false,
  },
  get_issue: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: '課題キー（例: PROJ-123）。数値 ID は不可' },
    },
    required: ['issueKey'],
    additionalProperties: false,
  },
  get_issue_comments: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: '課題キー（例: PROJ-123）。数値 ID は不可' },
      count: COUNT_PROPERTY,
    },
    required: ['issueKey'],
    additionalProperties: false,
  },
  list_wiki_pages: {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'プロジェクトキー（例: PROJ）' },
      keyword: { type: 'string', description: '検索キーワード' },
    },
    required: ['projectKey'],
    additionalProperties: false,
  },
  get_wiki_page: {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'プロジェクトキー（例: PROJ）' },
      name: {
        type: 'string',
        description: 'ページ名。list_wiki_pages が返す name をそのまま渡す。数値 ID は不可',
      },
    },
    required: ['projectKey', 'name'],
    additionalProperties: false,
  },
  add_issue_comment: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: '課題キー（例: PROJ-123）。数値 ID は不可' },
      content: { type: 'string', description: 'コメント本文（Markdown）' },
    },
    required: ['issueKey', 'content'],
    additionalProperties: false,
  },
};

const toDefinition = (toolName: ToolName): ToolDefinition => {
  const spec = TOOL_SPECS[toolName];
  return {
    name: toolName,
    title: spec.title,
    description: spec.description,
    inputSchema: INPUT_SCHEMAS[toolName],
    annotations: {
      readOnlyHint: spec.readOnly,
      // 削除系を作っていないので、どのツールも破壊的ではない。
      // 既定が true なので、書かないと全ツールが破壊的扱いになる。
      destructiveHint: false,
      idempotentHint: spec.readOnly,
      openWorldHint: true,
    },
  };
};

// ============================================================================
// 公開 API
// ============================================================================

/**
 * ポリシーからツール一覧とハンドラを組み立てる。
 *
 * `tools/list` に載せる集合と、ハンドラが確認する集合は**同じポリシーから導く**。
 * 一覧に出していないことは防御ではない（クライアントは任意の名前で `tools/call`
 * できる）ので、ハンドラ側でも必ず確認する。
 *
 * @param context - ポリシー・マスタ・API 呼び出し面・上限
 * @returns MCP プロトコル層に渡すハンドラ
 */
export const buildHandlers = (context: ToolContext): McpHandlers => {
  const listed = listedTools(context.policy);

  return {
    listTools(): readonly ToolDefinition[] {
      return TOOL_NAMES.filter(toolName => listed.has(toolName)).map(toDefinition);
    },

    async callTool(name: string, args: unknown): Promise<ToolResult> {
      const toolName = (TOOL_NAMES as readonly string[]).includes(name)
        ? (name as ToolName)
        : undefined;

      // 一覧に出していないツール名でも呼べる。ここで必ず確認する。
      if (toolName === undefined || !listed.has(toolName)) {
        return {
          content: [{ type: 'text', text: `利用できないツールです: ${name}` }],
          isError: true,
        };
      }

      try {
        const payload = await runTool(context, toolName, isRecord(args) ? args : {});
        return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
      } catch (e) {
        const message = Error.isError(e) ? e.message : String(e);
        return { content: [{ type: 'text', text: message }], isError: true };
      }
    },
  };
};
