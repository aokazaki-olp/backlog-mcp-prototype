/**
 * tools.ts
 *
 * @description MCP ツールの定義とハンドラ。input（検証・ポリシー判定・解決）→ api → output の3段
 */

import {
  ApiFailureError,
  AttachmentError,
  ScopeDeniedError,
  TOOL_NAMES,
  TOOL_SPECS,
} from '../contract.ts';
import { isAllowed, listedTools, projectKeysFor } from '../policy/policy.ts';
import { lookupName, projectMastersOf, toProjectId, toProjectIds } from '../domain/masters.ts';
import { MasterDataError } from '../contract.ts';
import { limitCount, wrapUntrusted } from './untrusted.ts';
import { assertNever } from '../shared/assertNever.ts';
import { toError } from '../shared/toError.ts';
import type {
  AttachmentFile,
  FormValue,
  ResolvedPolicy,
  ResolvedRequest,
  ToolName,
} from '../contract.ts';
import type { BacklogGateway } from '../domain/gateway.ts';
import type { Masters, ProjectMasters } from '../domain/masters.ts';
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
  /** 添付を許すディレクトリ。`null` なら添付の引数そのものを受け付けない。 */
  readonly attachmentsRoot?: string | null;
}

export interface ToolContext extends PlanContext {
  readonly gateway: BacklogGateway;
  /** ローカルファイルの読み取り。**差し替えられる**（規約 §7）。 */
  readonly readAttachment?: (root: string, requested: string) => Promise<AttachmentFile>;
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
      readonly kind: 'attach';
      /** 利用者が指定したパス。**ルートの中に収まっているかは読み取り側が検証する。** */
      readonly localPath: string;
      readonly next: (file: AttachmentFile) => PlannedCall;
    }
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
 * 1回のツール呼び出しで許す手数の上限。
 *
 * **暴走を止めるための箱であって、予算ではない。** 今の最長は4手
 * （添付の読み取り → アップロード → 関連課題の ID 解決 → 本体）で、上限ちょうどにしない。
 * 上限に達したら黙って止めず送出する（規約 §5.4）。
 */
const MAX_HOPS = 6;

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

/**
 * URL のパス1区画として受け取る。**引数がエンドポイントを差し替えられないようにする。**
 *
 * 借り物の `buildUrl` は `baseUrl + endpoint` の文字列連結で、正規化は URL パーサが行う。
 * つまり `..` を含む区画を素通しすると**別のエンドポイントに到達する**（手元で確認:
 * `/projects/1/git/repositories/../../../../space/pullRequests` → `/api/v2/space/pullRequests`）。
 * MCP の CVE で最多のパス検証バイパスと同型なので、組み立てる前に弾く。
 *
 * 拒むのは**URL の意味を変えうる文字だけ**（`spaceId` の DNS ラベル検証と同じ立て方）。
 * Backlog 側の命名規則には寄せない — 正当なリポジトリ名を弾く方が害が大きい。
 */
const PATH_SEGMENT_PATTERN = /^[^/\\?#%]+$/;

const requiredPathSegment = (args: Record<string, unknown>, name: string): string => {
  const value = requiredString(args, name);
  if (!PATH_SEGMENT_PATTERN.test(value) || value === '.' || value === '..') {
    throw new TypeError(
      `${name} に URL の意味を変える文字は使えません（/ \\ ? # % と . .. は不可）`,
    );
  }
  return encodeURIComponent(value);
};

/** 1 以上の整数として受け取る。**ID ではなくプロジェクト内の連番**（プルリクエスト番号）。 */
const requiredPositiveInteger = (args: Record<string, unknown>, name: string): number => {
  const value = args[name];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new TypeError(`${name} には 1 以上の整数を指定してください`);
  }
  return value;
};

/**
 * 引数のプロジェクトキーをポリシーに照らし、**解決済みの projectId** を返す。
 *
 * 許可の確認と ID 解決を1つにしてあるので、**確認しないまま ID を得る書き方ができない**。
 */
const resolveProjectKey = (
  context: PlanContext,
  toolName: ToolName,
  args: Record<string, unknown>,
): { readonly projectKey: string; readonly projectId: number } => {
  const projectKey = requiredString(args, 'projectKey');
  if (!isAllowed(context.policy, projectKey, toolName)) {
    throw new ScopeDeniedError(
      `プロジェクト ${projectKey} では ${toolName} を実行できません`,
      toolName,
      projectKey,
    );
  }
  return { projectKey, projectId: toProjectId(context.masters, projectKey) };
};

/** `yyyy-MM-dd` だけを受ける。Backlog が受け付ける形をこちらで固定する。 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalDate = (args: Record<string, unknown>, name: string): string | undefined => {
  const value = optionalString(args, name);
  if (value === undefined) {
    return undefined;
  }
  if (!DATE_PATTERN.test(value)) {
    throw new TypeError(`${name} には yyyy-MM-dd の形式で指定してください`);
  }
  return value;
};

/** 工数。**ID ではない実測値**なので数値のまま受ける。 */
const optionalHours = (args: Record<string, unknown>, name: string): number | undefined => {
  const value = args[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} には 0 以上の数値を指定してください`);
  }
  return value;
};

/** 日付と工数をまとめて載せる。作成と更新で同じ扱いなので1つにする。 */
const putSchedule = (form: Record<string, FormValue>, args: Record<string, unknown>): void => {
  for (const name of ['startDate', 'dueDate'] as const) {
    const value = optionalDate(args, name);
    if (value !== undefined) {
      form[name] = value;
    }
  }
  for (const name of ['estimatedHours', 'actualHours'] as const) {
    const value = optionalHours(args, name);
    if (value !== undefined) {
      form[name] = value;
    }
  }
};

/**
 * 名前で受けた項目を ID に直してフォームへ載せる。**指定が無ければ載せない。**
 *
 * `update_issue` は「指定した項目だけ変える」ので、`undefined` を送らないことが要件になる。
 */
const putResolved = (
  form: Record<string, FormValue>,
  key: string,
  name: string | undefined,
  resolve: (name: string) => number,
): void => {
  if (name === undefined) {
    return;
  }
  form[key] = resolve(name);
};

/**
 * 担当者の名前 → ユーザー ID。**表示名が重複していたら送出する。**
 *
 * 同名が複数いるとどちらを指すか決まらない。黙って先勝ちにすると**別人に割り当てる**
 * ので、ログイン名で指すよう案内して止める（規約 §5.4）。
 */
const resolveAssignee = (project: ProjectMasters, name: string): number => {
  if (project.ambiguousUserNames.has(name)) {
    throw new MasterDataError(
      `担当者「${name}」は同名のユーザーが複数います。ログイン名（userId）で指定してください`,
    );
  }
  return lookupName(project.userIds, name, '担当者');
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

/**
 * API へ要求する件数。**返したい数より1件多く要求する。**
 *
 * 絞り込みの `count` をそのまま渡すと API は必ず `count` 件までしか返さないので、
 * `limitCount` の判定が成立しえない。**実際に削っているのは API 側**で、そこを見ないと
 * 打ち切りを黙って成功として返すことになる（規約 §5.4）。
 *
 * 1件多く返ってきたら「まだある」と確定する。余分な1件は `limitCount` が捨てる。
 * `count` の上限は `maxCount` なので、+1 しても API 側の上限 100 は超えない
 * (`GET /issues` / `GET /issues/:issueIdOrKey/comments` とも 1〜100)。
 */
const probeCount = (count: number): number => count + 1;

// ============================================================================
// output — フィールドを絞り、第三者のテキストを囲む
// ============================================================================

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/**
 * `{ name: ... }` の形から name だけを取る。
 *
 * **ユーザーオブジェクトを出力に載せる唯一の経路。** Backlog のユーザーは
 * `id` / `userId` / `name` / `roleType` / `lang` / `nulabAccount` / `mailAddress` /
 * `lastLoginTime` を持ち、`assignee` / `createdUser` / `updatedUser` /
 * `stars[].presenter` / `notifications[].user` すべてが同じ形をしている。
 * **ここを通す限り `name` しか出ない** ので、経路を増やさないことが要件になる。
 */
const pickName = (value: unknown): string | undefined =>
  isRecord(value) ? pickString(value['name']) : undefined;

/** `[{ name: ... }, ...]` から名前だけを並べる。空なら undefined（キーごと出さない）。 */
const pickNames = (value: unknown): readonly string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const names = value.map(pickName).filter(name => name !== undefined);
  return names.length === 0 ? undefined : names;
};

/** 数値をそのまま取る。**ID には使わない** — 工数のような実測値だけ。 */
const pickNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined;

/**
 * 配列の件数。中身（`id` やファイル名）は出さず、あるという事実だけ返す。
 *
 * 空なら `undefined`（キーごと出さない）。`0` を全件に載せるとノイズになるので、
 * `pickNames` と同じ約束にする — **無いことは「キーが無い」で表す**。
 */
const countOf = (value: unknown): number | undefined =>
  Array.isArray(value) && value.length > 0 ? value.length : undefined;

/**
 * カスタム属性に値が入っているか。
 *
 * 未設定は `value: null`、リスト型の未選択は `[]`（実データで確認）。
 */
const hasCustomFieldValue = (value: unknown): boolean =>
  value != null && !(Array.isArray(value) && value.length === 0);

/**
 * **値が入っている**カスタム属性の件数。空なら `undefined`（キーごと出さない）。
 *
 * `countOf` を使えないのは、`customFields` が**定義されている属性を値の有無に
 * かかわらず全部並べる**ため。素の件数はプロジェクトの定義数であり、どの課題でも
 * 同じ値になって、その課題について何も言わない。
 */
const filledCustomFieldCount = (value: unknown): number | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const filled = value.filter(item => isRecord(item) && hasCustomFieldValue(item['value'])).length;
  return filled === 0 ? undefined : filled;
};

/**
 * 出力から**数値 ID を落とす**。
 *
 * Backlog の `projectId` / `issueId` は連番なので、返すとスコープ外の資源の存在を
 * 推測できる。返した値が別の操作への入口にならないようにする（Electron が
 * `IpcRendererEvent` を渡すなと言うのと同型）。
 *
 * **項目はミラーの応答例から決めている**（`docs/reference/api/v2/get-issue.md`。
 * 一覧は `childIssueSummary` が1つ増えるだけで同じ形）。実データではなく仕様で決まる。
 *
 * | 扱い | 項目 |
 * | --- | --- |
 * | 落とす | `id` / `projectId` / `keyId`（連番。`issueKey` があれば足りる） |
 * | 落とす | `sharedFiles` / `stars`（使わない。`stars[].presenter` はユーザーごと入る） |
 * | 畳む | `parentIssueId` → `hasParent` / `attachments` → 件数 / `customFields` → **値が入っている**件数（下記） |
 *
 * **`customFields` は値が入っている件数だけ返す**（`filledCustomFieldCount`）。
 * 定義されている属性は値の有無にかかわらず全部並ぶので、素の件数では意味を成さない。
 *
 * 要素の形は実データで確認した（2026-09-06。仕様書の応答例は8箇所すべて `[]` で、
 * ここだけ仕様から決められなかった）。
 *
 * ```json
 * { "id": 692819, "fieldTypeId": 6, "name": "選択リスト",
 *   "value": [{ "id": 2, "name": "b", "displayOrder": 1 }] }
 * ```
 *
 * **中身を返すかは別の判断として残す。** 属性名は要素の `name` に直接入っており、
 * リスト型の値も ID ではなく `{ id, name }` だった（仕様書の「リスト=値のID」は
 * 送信側の話で、応答には当てはまらない）。**定義の起動時解決は要らない。**
 * 返す段になったら、要素の `id` とリスト項目の `id` の両方を落とすこと。
 */
const shapeIssue = (raw: unknown, limits: ToolLimits): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: '課題の形が想定と違います' };
  }
  const issueKey = pickString(raw['issueKey']) ?? '(不明)';
  const wrap = (text: string, field: string): string =>
    wrapUntrusted(text, {
      source: `backlog:issue:${issueKey}:${field}`,
      maxLength: limits.maxTextLength,
    });
  const summary = pickString(raw['summary']);
  const description = pickString(raw['description']);
  const childIssueSummary = pickString(raw['childIssueSummary']);

  return {
    issueKey,
    // 件名も第三者が書ける。一覧では本文より先に読まれるので、囲まないと素通しになる
    summary: summary === undefined ? undefined : wrap(summary, 'summary'),
    issueType: pickName(raw['issueType']),
    status: pickName(raw['status']),
    priority: pickName(raw['priority']),
    resolution: pickName(raw['resolution']),
    assignee: pickName(raw['assignee']),
    category: pickNames(raw['category']),
    milestone: pickNames(raw['milestone']),
    versions: pickNames(raw['versions']),
    startDate: pickString(raw['startDate']),
    dueDate: pickString(raw['dueDate']),
    estimatedHours: pickNumber(raw['estimatedHours']),
    actualHours: pickNumber(raw['actualHours']),
    // 連番 ID は落とすが、「子課題である」事実は残す
    hasParent: pickNumber(raw['parentIssueId']) !== undefined,
    attachmentCount: countOf(raw['attachments']),
    // 中身は出さない。値が入っている数だけ伝える（定義数ではない）
    customFieldCount: filledCustomFieldCount(raw['customFields']),
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    updatedUser: pickName(raw['updatedUser']),
    updated: pickString(raw['updated']),
    description: description === undefined ? undefined : wrap(description, 'description'),
    childIssueSummary:
      childIssueSummary === undefined ? undefined : wrap(childIssueSummary, 'childIssueSummary'),
  };
};

/**
 * 変更履歴を1つの塊にする。
 *
 * `field` は Backlog の語彙だが `newValue` / `originalValue` は第三者が書いた
 * 文字列なので、呼び出し側で全体を囲む。
 */
const renderChangeLog = (raw: unknown): string | undefined => {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const lines: string[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const field = pickString(entry['field']) ?? '(不明な項目)';
    const originalValue = pickString(entry['originalValue']) ?? '(なし)';
    const newValue = pickString(entry['newValue']) ?? '(なし)';
    lines.push(`${field}: ${originalValue} → ${newValue}`);
  }
  return lines.length === 0 ? undefined : lines.join('\n');
};

/**
 * **状態変更だけのコメントを「空のコメント」にしない。**
 *
 * Backlog は「未対応 → 処理中」のような操作もコメントとして返す。そのとき
 * **`content` は `null`** で、変わった内容は `changeLog` に入る（ミラーの
 * `get-comment-list.md` で確認）。`changeLog` を落とすと中身のない `<untrusted>`
 * だけが並び、呼び出し側からは空のコメントに見える（規約 §5.4 の沈黙の失敗）。
 *
 * `id` / `projectId` / `issueId` / `stars` / `notifications` は落とす。
 *
 * **課題とプルリクエストで応答の形が同じ**なので共用する（ミラーの `get-comment-list.md` と
 * `get-pull-request-comment.md` で確認）。違うのは出所ラベルだけなので引数で受ける。
 *
 * @param source - `<untrusted>` に載せる出所（例: `backlog:issue:PROJ-1`）
 */
const shapeComment = (
  raw: unknown,
  source: string,
  limits: ToolLimits,
): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'コメントの形が想定と違います' };
  }
  const wrap = (text: string, field: string): string =>
    wrapUntrusted(text, {
      source: `${source}:${field}`,
      maxLength: limits.maxTextLength,
    });
  const content = pickString(raw['content']);
  const changeLog = renderChangeLog(raw['changeLog']);

  return {
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    updated: pickString(raw['updated']),
    content: content === undefined || content === '' ? undefined : wrap(content, 'comment'),
    changeLog: changeLog === undefined ? undefined : wrap(changeLog, 'comment:changeLog'),
    // どちらも無いのは想定外の形。黙って空を返さない
    note:
      content === undefined && changeLog === undefined
        ? '本文も変更履歴も無いコメントです'
        : undefined,
  };
};

/** 一覧の1件。**`content` は一覧の応答に無い**（本文は `shapeWikiPageDetail`）。 */
const shapeWikiPage = (raw: unknown): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'Wiki ページの形が想定と違います' };
  }
  return {
    name: pickString(raw['name']),
    tags: pickNames(raw['tags']),
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    updatedUser: pickName(raw['updatedUser']),
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
    tags: pickNames(raw['tags']),
    attachmentCount: countOf(raw['attachments']),
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    updatedUser: pickName(raw['updatedUser']),
    updated: pickString(raw['updated']),
    content: wrapUntrusted(pickString(raw['content']) ?? '', {
      source: `backlog:wiki:${projectKey}:${name}:content`,
      maxLength: limits.maxTextLength,
    }),
  };
};

/**
 * Git リポジトリの1件。**`name` が次のツールへ渡す識別子**になる。
 *
 * `id` / `projectId` は落とす。`repoIdOrName` は名前を受けるので、数値 ID を返す必要が無い
 * （原則4 — 名前で受け、ID はサーバ内に留める）。`sshUrl` / `httpUrl` は落とす —
 * 認証情報を含みうる形をそのまま LLM へ渡さない。
 */
const shapeRepository = (raw: unknown, limits: ToolLimits): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'Git リポジトリの形が想定と違います' };
  }
  const name = pickString(raw['name']);
  const description = pickString(raw['description']);
  return {
    name,
    // 説明は第三者が書ける
    description:
      description === undefined || description === ''
        ? undefined
        : wrapUntrusted(description, {
            source: `backlog:repository:${name ?? '(不明)'}:description`,
            maxLength: limits.maxTextLength,
          }),
    pushedAt: pickString(raw['pushedAt']),
    created: pickString(raw['created']),
    updated: pickString(raw['updated']),
  };
};

/**
 * プルリクエストの1件。
 *
 * `number` は**リポジトリ内の連番**で、パスがポリシー由来（プロジェクト → リポジトリ）
 * なので、これを返しても別プロジェクトへの入口にならない。逆に `id` / `projectId` /
 * `repositoryId` はスペース全体で連番なので落とす。
 *
 * `issue` は関連課題。`issueKey` だけ拾えば課題側のツールへ繋がる（数値 ID は載せない）。
 */
const shapePullRequest = (
  raw: unknown,
  source: string,
  limits: ToolLimits,
): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'プルリクエストの形が想定と違います' };
  }
  const wrap = (text: string, field: string): string =>
    wrapUntrusted(text, { source: `${source}:${field}`, maxLength: limits.maxTextLength });
  const summary = pickString(raw['summary']);
  const description = pickString(raw['description']);
  const issue = raw['issue'];

  return {
    number: pickNumber(raw['number']),
    status: pickName(raw['status']),
    base: pickString(raw['base']),
    branch: pickString(raw['branch']),
    assignee: pickName(raw['assignee']),
    relatedIssueKey: isRecord(issue) ? pickString(issue['issueKey']) : undefined,
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    updatedUser: pickName(raw['updatedUser']),
    updated: pickString(raw['updated']),
    closeAt: pickString(raw['closeAt']),
    mergeAt: pickString(raw['mergeAt']),
    attachmentCount: countOf(raw['attachments']),
    // 件名も本文も第三者が書ける
    summary: summary === undefined ? undefined : wrap(summary, 'summary'),
    description: description === undefined ? undefined : wrap(description, 'description'),
  };
};

/**
 * ドキュメントの1件。**一覧に本文（`plain`）が入っている。**
 *
 * `GET /documents/:documentId` は一覧と同じ形を返す（ミラーで確認）ので、Wiki のような
 * 2往復も、単体取得のツールも要らない。したがって `id` を返す必要も無い
 * （返した値が別の操作への入口にならないこと）。
 *
 * `json` は本文の構造化表現で `plain` と重複するため落とす。`statusId` / `emoji` /
 * `projectId` も落とす（状態の名前はミラーに無く、番号のままでは意味を成さない）。
 *
 * **一覧の `plain` は本文の全文である**（実スペースで確認。約1,300文字のドキュメントが
 * 末尾まで入っており、切り詰めは無かった）。ミラーの応答例だけでは決まらなかった点。
 */
const shapeDocument = (raw: unknown, limits: ToolLimits): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: 'ドキュメントの形が想定と違います' };
  }
  const title = pickString(raw['title']);
  const plain = pickString(raw['plain']);
  const wrap = (text: string, field: string): string =>
    wrapUntrusted(text, {
      source: `backlog:document:${title ?? '(無題)'}:${field}`,
      maxLength: limits.maxTextLength,
    });

  return {
    tags: pickNames(raw['tags']),
    attachmentCount: countOf(raw['attachments']),
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    updatedUser: pickName(raw['updatedUser']),
    updated: pickString(raw['updated']),
    // 表題も本文も第三者が書ける
    title: title === undefined ? undefined : wrap(title, 'title'),
    content: plain === undefined || plain === '' ? undefined : wrap(plain, 'content'),
  };
};

/**
 * 活動の1件。
 *
 * **`content` の形は活動の種別ごとに違う**（課題・Wiki・PR などで別物）。全種別を推測で
 * 読むと外れたとき黙って空になるので、**どの種別にもある値だけ**を取り、それ以外は返さない。
 *
 * `content.key_id` は**プロジェクト内の連番**なので、`projectKey` と組めば課題キーになる。
 * 数値 ID を渡す代わりに `issueKey` を返し、詳細は `get_issue` へ繋ぐ（原則4）。
 * `id` / `project` / `notifications` は落とす（`project` はプロジェクトの設定一式が入っている）。
 *
 * > **未確認**: 活動種別 ID（1〜49）と名前の対応表はミラーに無い。番号のまま返す。
 */
const shapeActivity = (
  raw: unknown,
  projectKey: string,
  limits: ToolLimits,
): Record<string, unknown> => {
  if (!isRecord(raw)) {
    return { error: '活動の形が想定と違います' };
  }
  const content = raw['content'];
  const summary = isRecord(content) ? pickString(content['summary']) : undefined;
  const keyId = isRecord(content) ? pickNumber(content['key_id']) : undefined;

  return {
    // Backlog の活動種別 ID。名前の対応表は API ドキュメントに無いので番号のまま返す
    activityTypeId: pickNumber(raw['type']),
    // key_id はプロジェクト内の連番。projectKey と組めば課題キーになり、get_issue へ繋がる
    issueKey: keyId === undefined ? undefined : `${projectKey}-${String(keyId)}`,
    createdUser: pickName(raw['createdUser']),
    created: pickString(raw['created']),
    summary:
      summary === undefined || summary === ''
        ? undefined
        : wrapUntrusted(summary, {
            source: `backlog:activity:${projectKey}:summary`,
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
 * `relatedIssueKey` が指定されていれば、**課題キーを ID に直してから**本体を送る。
 *
 * `issueId` は数値なので、そのまま受けると原則4（数値 ID を LLM に触らせない）に反する。
 * 課題キーで受けて `GET /issues/:issueKey` の応答から `id` を採る（Wiki の名前 → ID と同じ形）。
 *
 * **関連課題の側もポリシーで確認する。** `resolveIssueKey` を通すので、**その課題の
 * プロジェクトでも同じツールが許可されていなければ拒否**される。Backlog 自体はもっと緩いが、
 * **ポリシーが覆っていないプロジェクトへ読みに行かない**方を採る。
 */
const withRelatedIssue = (
  context: PlanContext,
  toolName: ToolName,
  args: Record<string, unknown>,
  send: (issueId?: number) => PlannedCall,
): PlannedCall => {
  const relatedIssueKey = optionalString(args, 'relatedIssueKey');
  if (relatedIssueKey === undefined) {
    return send();
  }
  const { issueKey } = resolveIssueKey(context, toolName, relatedIssueKey);
  return {
    kind: 'chain',
    request: { endpoint: `/issues/${issueKey}`, method: 'GET' },
    next: raw => {
      const id = isRecord(raw) ? pickNumber(raw['id']) : undefined;
      if (id === undefined) {
        // 関連づけたつもりで付いていない、を作らない（規約 §5.4）
        throw new Error(`関連課題 ${issueKey} の ID を受け取れませんでした`);
      }
      return send(id);
    },
  };
};

/**
 * `file` が指定されていれば、**アップロードしてからコメントする**3手に開く。
 *
 * 添付は独立したツールにしない。`attachmentId` が LLM の手に渡ると「上げたファイルを
 * 別プロジェクトの課題に貼る」経路ができるため、**上げた ID はサーバ内に留めて
 * そのまま貼る**（原則4 と同じ形）。
 *
 * **1コメントにつき1件だけ。** 借り物の `ApiClient` はフォームのスカラー配列を
 * `TypeError` で弾く（通るのはファイルの配列だけ）ので、複数を送るには上流を直す必要がある。
 * 複数が本当に要る場面が出るまで、**型と実行時が一致している側に寄せる**。
 * 引数が単数なので、利用者から見て「黙って1件に減らされた」にはならない。
 */
const withOptionalAttachment = (
  context: PlanContext,
  args: Record<string, unknown>,
  post: (attachmentId?: number) => PlannedCall,
): PlannedCall => {
  const file = optionalString(args, 'file');
  if (file === undefined) {
    return post();
  }
  if (context.attachmentsRoot == null) {
    throw new AttachmentError(
      'このサーバでは添付を受け付けていません（BACKLOG_ATTACHMENTS_ROOT が未設定）',
    );
  }
  return {
    kind: 'attach',
    localPath: file,
    next: attachment => ({
      kind: 'chain',
      request: { endpoint: '/space/attachment', method: 'POST', form: { file: attachment } },
      next: raw => {
        const id = isRecord(raw) ? pickNumber(raw['id']) : undefined;
        if (id === undefined) {
          // 上げたつもりで貼られていない、を作らない（規約 §5.4）
          throw new Error('添付ファイルの送信に成功しましたが ID を受け取れませんでした');
        }
        return post(id);
      },
    }),
  };
};

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
        count: probeCount(count),
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
          query: { count: probeCount(count), order: 'desc' },
        },
        shape: raw => {
          const { items, truncated } = limitCount(asArray(raw, 'GET /issues/*/comments'), count);
          return listPayload(
            items.map(item => shapeComment(item, `backlog:issue:${issueKey}`, limits)),
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

    case 'list_git_repositories': {
      const { projectId } = resolveProjectKey(context, toolName, args);
      return {
        kind: 'send',
        request: { endpoint: `/projects/${String(projectId)}/git/repositories`, method: 'GET' },
        shape: raw => {
          const { items, truncated } = limitCount(
            asArray(raw, 'GET /projects/*/git/repositories'),
            limits.maxCount,
          );
          return listPayload(
            items.map(item => shapeRepository(item, limits)),
            truncated,
            limits.maxCount,
          );
        },
      };
    }

    case 'list_pull_requests': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const repository = requiredPathSegment(args, 'repository');
      const count = boundedCount(args, limits);
      return {
        kind: 'send',
        request: {
          endpoint: `/projects/${String(projectId)}/git/repositories/${repository}/pullRequests`,
          method: 'GET',
          query: { count: probeCount(count) },
        },
        shape: raw => {
          const { items, truncated } = limitCount(
            asArray(raw, 'GET /projects/*/git/repositories/*/pullRequests'),
            count,
          );
          return listPayload(
            items.map(item =>
              shapePullRequest(item, `backlog:pr:${projectKey}/${repository}`, limits),
            ),
            truncated,
            count,
          );
        },
      };
    }

    case 'get_pull_request': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const repository = requiredPathSegment(args, 'repository');
      const number = requiredPositiveInteger(args, 'number');
      return {
        kind: 'send',
        request: {
          endpoint: `/projects/${String(projectId)}/git/repositories/${repository}/pullRequests/${String(number)}`,
          method: 'GET',
        },
        shape: raw =>
          shapePullRequest(raw, `backlog:pr:${projectKey}/${repository}#${String(number)}`, limits),
      };
    }

    case 'get_pull_request_comments': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const repository = requiredPathSegment(args, 'repository');
      const number = requiredPositiveInteger(args, 'number');
      const count = boundedCount(args, limits);
      return {
        kind: 'send',
        request: {
          endpoint: `/projects/${String(projectId)}/git/repositories/${repository}/pullRequests/${String(number)}/comments`,
          method: 'GET',
          query: { count: probeCount(count), order: 'desc' },
        },
        shape: raw => {
          const { items, truncated } = limitCount(
            asArray(raw, 'GET /projects/*/git/repositories/*/pullRequests/*/comments'),
            count,
          );
          const source = `backlog:pr:${projectKey}/${repository}#${String(number)}`;
          return listPayload(
            items.map(item => shapeComment(item, source, limits)),
            truncated,
            count,
          );
        },
      };
    }

    case 'add_pull_request_comment': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const repository = requiredPathSegment(args, 'repository');
      const number = requiredPositiveInteger(args, 'number');
      const content = requiredString(args, 'content');
      const post = (attachmentId?: number): PlannedCall => ({
        kind: 'send',
        // notifiedUserId は載せない。LLM に通知先を決めさせない（add_issue_comment と同じ）。
        request: {
          endpoint: `/projects/${String(projectId)}/git/repositories/${repository}/pullRequests/${String(number)}/comments`,
          method: 'POST',
          form:
            attachmentId === undefined ? { content } : { content, 'attachmentId[]': attachmentId },
        },
        shape: raw => ({
          projectKey,
          repository,
          number,
          posted: true,
          attached: attachmentId !== undefined,
          created: isRecord(raw) ? pickString(raw['created']) : undefined,
        }),
      });
      return withOptionalAttachment(context, args, post);
    }

    case 'search_documents': {
      const count = boundedCount(args, limits);
      // projectId はポリシー由来。引数から受け取る口を作っていない。
      const query: Record<string, unknown> = {
        'projectId[]': scopedProjectIds(context, toolName),
        // offset は API の必須パラメータ（ミラーで確認）。ページングの口は開けない
        offset: 0,
        count: probeCount(count),
        sort: 'updated',
        order: 'desc',
      };
      const keyword = optionalString(args, 'keyword');
      if (keyword !== undefined) {
        query['keyword'] = keyword;
      }
      return {
        kind: 'send',
        request: { endpoint: '/documents', method: 'GET', query },
        shape: raw => {
          const { items, truncated } = limitCount(asArray(raw, 'GET /documents'), count);
          return listPayload(
            items.map(item => shapeDocument(item, limits)),
            truncated,
            count,
          );
        },
      };
    }

    case 'create_document': {
      const { projectId } = resolveProjectKey(context, toolName, args);
      // title / content は API では任意だが、こちらでは必須にする。
      // 無題・空のドキュメントを作れる口を開けない（規約 §5.4）
      const form: Record<string, FormValue> = {
        projectId,
        title: requiredString(args, 'title'),
        content: requiredString(args, 'content'),
      };
      // parentId は載せない（ドキュメントの ID。原則2・原則4）。addLast はそれとセット、
      // emoji は表示上の飾りなので、いずれもツール面に出さない。
      // 添付も載せない — POST /documents は attachmentId[] を受け付けない（ミラーで確認）
      return {
        kind: 'send',
        request: { endpoint: '/documents', method: 'POST', form },
        shape: raw => shapeDocument(raw, limits),
      };
    }

    case 'list_project_activities': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const count = boundedCount(args, limits);
      return {
        kind: 'send',
        request: {
          endpoint: `/projects/${String(projectId)}/activities`,
          method: 'GET',
          query: { count: probeCount(count), order: 'desc' },
        },
        shape: raw => {
          const { items, truncated } = limitCount(
            asArray(raw, 'GET /projects/*/activities'),
            count,
          );
          return listPayload(
            items.map(item => shapeActivity(item, projectKey, limits)),
            truncated,
            count,
          );
        },
      };
    }

    case 'create_issue': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const project = projectMastersOf(masters, projectKey);
      const summary = requiredString(args, 'summary');

      // 必須の3つは名前で受けて ID に直す。数値 ID を受ける口は作っていない
      const form: Record<string, FormValue> = {
        projectId,
        summary,
        issueTypeId: lookupName(
          project.issueTypeIds,
          requiredString(args, 'issueType'),
          '課題種別',
        ),
        priorityId: lookupName(masters.priorityIds, requiredString(args, 'priority'), '優先度'),
      };

      const description = optionalString(args, 'description');
      if (description !== undefined) {
        form['description'] = description;
      }
      putResolved(form, 'assigneeId', optionalString(args, 'assignee'), name =>
        resolveAssignee(project, name),
      );
      // 配列は借り物が弾くので単数で受ける（引数が単数なので黙って減らされることはない）
      putResolved(form, 'categoryId[]', optionalString(args, 'category'), name =>
        lookupName(project.categoryIds, name, 'カテゴリー'),
      );
      putResolved(form, 'milestoneId[]', optionalString(args, 'milestone'), name =>
        lookupName(project.versionIds, name, 'マイルストーン'),
      );
      putSchedule(form, args);

      const post = (attachmentId?: number): PlannedCall => ({
        kind: 'send',
        // notifiedUserId は載せない。LLM に通知先を決めさせない
        request: {
          endpoint: '/issues',
          method: 'POST',
          form: attachmentId === undefined ? form : { ...form, 'attachmentId[]': attachmentId },
        },
        shape: raw => shapeIssue(raw, limits),
      });
      return withOptionalAttachment(context, args, post);
    }

    case 'update_issue': {
      const { issueKey, projectKey } = resolveIssueKey(
        context,
        toolName,
        requiredString(args, 'issueKey'),
      );
      const project = projectMastersOf(masters, projectKey);
      const form: Record<string, FormValue> = {};

      for (const name of ['summary', 'description', 'comment'] as const) {
        const value = optionalString(args, name);
        if (value !== undefined) {
          form[name] = value;
        }
      }
      putResolved(form, 'statusId', optionalString(args, 'status'), name =>
        lookupName(project.statusIds, name, '状態'),
      );
      putResolved(form, 'resolutionId', optionalString(args, 'resolution'), name =>
        lookupName(masters.resolutionIds, name, '完了理由'),
      );
      putResolved(form, 'priorityId', optionalString(args, 'priority'), name =>
        lookupName(masters.priorityIds, name, '優先度'),
      );
      putResolved(form, 'issueTypeId', optionalString(args, 'issueType'), name =>
        lookupName(project.issueTypeIds, name, '課題種別'),
      );
      putResolved(form, 'assigneeId', optionalString(args, 'assignee'), name =>
        resolveAssignee(project, name),
      );
      putResolved(form, 'categoryId[]', optionalString(args, 'category'), name =>
        lookupName(project.categoryIds, name, 'カテゴリー'),
      );
      putResolved(form, 'milestoneId[]', optionalString(args, 'milestone'), name =>
        lookupName(project.versionIds, name, 'マイルストーン'),
      );
      putSchedule(form, args);

      // 何も指定されていない更新は「成功したが何も変わっていない」になる（規約 §5.4）
      if (Object.keys(form).length === 0 && optionalString(args, 'file') === undefined) {
        throw new TypeError('変更する項目を1つ以上指定してください');
      }

      const post = (attachmentId?: number): PlannedCall => ({
        kind: 'send',
        request: {
          endpoint: `/issues/${issueKey}`,
          method: 'PATCH',
          form: attachmentId === undefined ? form : { ...form, 'attachmentId[]': attachmentId },
        },
        shape: raw => shapeIssue(raw, limits),
      });
      return withOptionalAttachment(context, args, post);
    }

    case 'create_pull_request': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const project = projectMastersOf(masters, projectKey);
      const repository = requiredPathSegment(args, 'repository');

      const form: Record<string, FormValue> = {
        summary: requiredString(args, 'summary'),
        description: requiredString(args, 'description'),
        // ブランチ名はフォームに載る（パスではない）ので、空でないことだけを見る
        base: requiredString(args, 'base'),
        branch: requiredString(args, 'branch'),
      };
      putResolved(form, 'assigneeId', optionalString(args, 'assignee'), name =>
        resolveAssignee(project, name),
      );

      const endpoint = `/projects/${String(projectId)}/git/repositories/${repository}/pullRequests`;
      const post = (attachmentId?: number): PlannedCall =>
        withRelatedIssue(context, toolName, args, issueId => ({
          kind: 'send',
          // notifiedUserId は載せない。LLM に通知先を決めさせない
          request: {
            endpoint,
            method: 'POST',
            form: {
              ...form,
              ...(issueId === undefined ? {} : { issueId }),
              ...(attachmentId === undefined ? {} : { 'attachmentId[]': attachmentId }),
            },
          },
          shape: raw => shapePullRequest(raw, `backlog:pr:${projectKey}/${repository}`, limits),
        }));
      return withOptionalAttachment(context, args, post);
    }

    case 'update_pull_request': {
      const { projectKey, projectId } = resolveProjectKey(context, toolName, args);
      const project = projectMastersOf(masters, projectKey);
      const repository = requiredPathSegment(args, 'repository');
      const number = requiredPositiveInteger(args, 'number');

      const form: Record<string, FormValue> = {};
      for (const name of ['summary', 'description', 'comment'] as const) {
        const value = optionalString(args, name);
        if (value !== undefined) {
          form[name] = value;
        }
      }
      putResolved(form, 'assigneeId', optionalString(args, 'assignee'), name =>
        resolveAssignee(project, name),
      );

      // 何も指定されていない更新は「成功したが何も変わっていない」になる（規約 §5.4）
      if (
        Object.keys(form).length === 0 &&
        optionalString(args, 'relatedIssueKey') === undefined &&
        optionalString(args, 'file') === undefined
      ) {
        throw new TypeError('変更する項目を1つ以上指定してください');
      }

      const source = `backlog:pr:${projectKey}/${repository}#${String(number)}`;
      const endpoint = `/projects/${String(projectId)}/git/repositories/${repository}/pullRequests/${String(number)}`;
      const post = (attachmentId?: number): PlannedCall =>
        withRelatedIssue(context, toolName, args, issueId => ({
          kind: 'send',
          request: {
            endpoint,
            method: 'PATCH',
            form: {
              ...form,
              ...(issueId === undefined ? {} : { issueId }),
              ...(attachmentId === undefined ? {} : { 'attachmentId[]': attachmentId }),
            },
          },
          shape: raw => shapePullRequest(raw, source, limits),
        }));
      return withOptionalAttachment(context, args, post);
    }

    case 'add_issue_comment': {
      const { issueKey } = resolveIssueKey(context, toolName, requiredString(args, 'issueKey'));
      const content = requiredString(args, 'content');
      const post = (attachmentId?: number): PlannedCall => ({
        kind: 'send',
        // notifiedUserId は載せない。LLM に通知先を決めさせない。
        request: {
          endpoint: `/issues/${issueKey}/comments`,
          method: 'POST',
          form:
            attachmentId === undefined ? { content } : { content, 'attachmentId[]': attachmentId },
        },
        shape: raw => ({
          issueKey,
          posted: true,
          attached: attachmentId !== undefined,
          created: isRecord(raw) ? pickString(raw['created']) : undefined,
        }),
      });
      return withOptionalAttachment(context, args, post);
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
 * 黙って成功にしない）。今の最長は3手（添付の読み取り → アップロード → コメント）。
 *
 * **ローカルファイルを読むのもここだけ。** `planToolCall` は純関数のままにしたいので、
 * 「どのパスを読むか」だけを `attach` で返させ、実際の読み取りは差し替え可能な依存に渡す。
 * 検証（ルート配下か・拡張子と中身が釣り合うか）はその依存が持つ（`attach/localFile.ts`）。
 */
const runTool = async (
  context: ToolContext,
  toolName: ToolName,
  args: Record<string, unknown>,
): Promise<unknown> => {
  let planned = planToolCall(context, toolName, args);

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (planned.kind === 'attach') {
      const root = context.attachmentsRoot;
      if (root == null) {
        throw new AttachmentError('添付は設定されていません（BACKLOG_ATTACHMENTS_ROOT が未設定）');
      }
      const read = context.readAttachment;
      if (read === undefined) {
        throw new AttachmentError('添付の読み取りが組み立てられていません');
      }
      planned = planned.next(await read(root, planned.localPath));
      continue;
    }
    const raw = await sendRequest(context, planned.request);
    if (planned.kind === 'send') {
      return planned.shape(raw);
    }
    planned = planned.next(raw);
  }
  throw new Error(`${toolName} が ${String(MAX_HOPS)} 手で終わりませんでした`);
};

// ============================================================================
// ツール定義（inputSchema）
// ============================================================================

const COUNT_PROPERTY = {
  type: 'integer',
  minimum: 1,
  description: '取得件数の希望値。サーバ側の上限で切り下げられます。',
} as const;

const NAMED_PROPERTIES = {
  issueType: { type: 'string', description: '課題種別の名前（例: バグ）。数値 ID は不可' },
  priority: { type: 'string', description: '優先度の名前（例: 高）' },
  status: { type: 'string', description: '状態の名前（例: 処理中）' },
  resolution: { type: 'string', description: '完了理由の名前（例: 対応済み）' },
  assignee: {
    type: 'string',
    description: '担当者の表示名またはログイン名。同名が複数いる場合はログイン名で指定する',
  },
  category: { type: 'string', description: 'カテゴリーの名前。1件のみ' },
  milestone: { type: 'string', description: 'マイルストーンの名前。1件のみ' },
} as const;

const SCHEDULE_PROPERTIES = {
  startDate: { type: 'string', description: '開始日（yyyy-MM-dd）' },
  dueDate: { type: 'string', description: '期限日（yyyy-MM-dd）' },
  estimatedHours: { type: 'number', minimum: 0, description: '予定時間' },
  actualHours: { type: 'number', minimum: 0, description: '実績時間' },
} as const;

const RELATED_ISSUE_KEY_PROPERTY = {
  type: 'string',
  description:
    '関連づける課題のキー（例: PROJ-123）。数値 ID は不可。その課題のプロジェクトも許可されている必要があります。',
} as const;

const FILE_PROPERTY = {
  type: 'string',
  description:
    '添付するファイル。サーバに設定されたディレクトリからの相対パス。1コメントにつき1件。省略可。',
} as const;

const PROJECT_KEY_PROPERTY = {
  type: 'string',
  description: 'プロジェクトキー（例: PROJ）。許可されていなければ拒否されます。',
} as const;

const REPOSITORY_PROPERTY = {
  type: 'string',
  description: 'リポジトリ名。list_git_repositories が返す name をそのまま渡します。',
} as const;

const PULL_REQUEST_NUMBER_PROPERTY = {
  type: 'integer',
  minimum: 1,
  description: 'プルリクエスト番号。list_pull_requests が返す number をそのまま渡します。',
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
      file: FILE_PROPERTY,
    },
    required: ['issueKey', 'content'],
    additionalProperties: false,
  },
  list_git_repositories: {
    type: 'object',
    properties: { projectKey: PROJECT_KEY_PROPERTY },
    required: ['projectKey'],
    additionalProperties: false,
  },
  search_documents: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: '検索キーワード' },
      count: COUNT_PROPERTY,
    },
    additionalProperties: false,
  },
  create_document: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      title: { type: 'string', description: 'ドキュメントのタイトル' },
      content: { type: 'string', description: 'ドキュメントの本文（Markdown）' },
    },
    required: ['projectKey', 'title', 'content'],
    additionalProperties: false,
  },
  list_project_activities: {
    type: 'object',
    properties: { projectKey: PROJECT_KEY_PROPERTY, count: COUNT_PROPERTY },
    required: ['projectKey'],
    additionalProperties: false,
  },
  list_pull_requests: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      repository: REPOSITORY_PROPERTY,
      count: COUNT_PROPERTY,
    },
    required: ['projectKey', 'repository'],
    additionalProperties: false,
  },
  get_pull_request: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      repository: REPOSITORY_PROPERTY,
      number: PULL_REQUEST_NUMBER_PROPERTY,
    },
    required: ['projectKey', 'repository', 'number'],
    additionalProperties: false,
  },
  get_pull_request_comments: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      repository: REPOSITORY_PROPERTY,
      number: PULL_REQUEST_NUMBER_PROPERTY,
      count: COUNT_PROPERTY,
    },
    required: ['projectKey', 'repository', 'number'],
    additionalProperties: false,
  },
  create_issue: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      summary: { type: 'string', description: '課題の件名' },
      issueType: NAMED_PROPERTIES.issueType,
      priority: NAMED_PROPERTIES.priority,
      description: { type: 'string', description: '課題の詳細（Markdown）' },
      assignee: NAMED_PROPERTIES.assignee,
      category: NAMED_PROPERTIES.category,
      milestone: NAMED_PROPERTIES.milestone,
      ...SCHEDULE_PROPERTIES,
      file: FILE_PROPERTY,
    },
    required: ['projectKey', 'summary', 'issueType', 'priority'],
    additionalProperties: false,
  },
  update_issue: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: '課題キー（例: PROJ-123）。数値 ID は不可' },
      summary: { type: 'string', description: '課題の件名' },
      description: { type: 'string', description: '課題の詳細（Markdown）' },
      comment: { type: 'string', description: '変更と一緒に残すコメント' },
      status: NAMED_PROPERTIES.status,
      resolution: NAMED_PROPERTIES.resolution,
      priority: NAMED_PROPERTIES.priority,
      issueType: NAMED_PROPERTIES.issueType,
      assignee: NAMED_PROPERTIES.assignee,
      category: NAMED_PROPERTIES.category,
      milestone: NAMED_PROPERTIES.milestone,
      ...SCHEDULE_PROPERTIES,
      file: FILE_PROPERTY,
    },
    required: ['issueKey'],
    additionalProperties: false,
  },
  create_pull_request: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      repository: REPOSITORY_PROPERTY,
      summary: { type: 'string', description: 'プルリクエストの件名' },
      description: { type: 'string', description: '本文（Markdown）' },
      base: { type: 'string', description: 'マージ先のブランチ名' },
      branch: { type: 'string', description: 'マージされるブランチ名' },
      assignee: NAMED_PROPERTIES.assignee,
      relatedIssueKey: RELATED_ISSUE_KEY_PROPERTY,
      file: FILE_PROPERTY,
    },
    required: ['projectKey', 'repository', 'summary', 'description', 'base', 'branch'],
    additionalProperties: false,
  },
  update_pull_request: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      repository: REPOSITORY_PROPERTY,
      number: PULL_REQUEST_NUMBER_PROPERTY,
      summary: { type: 'string', description: 'プルリクエストの件名' },
      description: { type: 'string', description: '本文（Markdown）' },
      comment: { type: 'string', description: '変更と一緒に残すコメント' },
      assignee: NAMED_PROPERTIES.assignee,
      relatedIssueKey: RELATED_ISSUE_KEY_PROPERTY,
      file: FILE_PROPERTY,
    },
    required: ['projectKey', 'repository', 'number'],
    additionalProperties: false,
  },
  add_pull_request_comment: {
    type: 'object',
    properties: {
      projectKey: PROJECT_KEY_PROPERTY,
      repository: REPOSITORY_PROPERTY,
      number: PULL_REQUEST_NUMBER_PROPERTY,
      content: { type: 'string', description: 'コメント本文（Markdown）' },
      file: FILE_PROPERTY,
    },
    required: ['projectKey', 'repository', 'number', 'content'],
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
