/**
 * contract.ts
 *
 * @description 層をまたいで共有する型と、ツールの静的な仕様表。実装を持たない葉モジュール。
 */

// ============================================================================
// 権限の語彙
// ============================================================================

/**
 * 権限の3段。順序に意味がある（添字が大きいほど強い）。
 *
 * 列挙（`['read','write']`）にしないのは、`['write']` との差が曖昧になるため。
 * 削除はこの語彙に存在しないので、ポリシーにどう書いても表現できない。
 */
export const CAN_LEVELS = ['read', 'comment', 'write'] as const;

export type Can = (typeof CAN_LEVELS)[number];

/**
 * 機能領域。`document` を `wiki` と分けているのは Backlog で別機能だから。
 *
 * `user` / `space` / `priority` / `resolution` は含まない。プロジェクトに属さず
 * スコープで表現できないため、起動時に解決して内部マスタとして持つ（ツールにしない）。
 *
 * **`notification` も同じ理由で含まない。** `GET /notifications` はプロジェクトの
 * 絞り込みパラメータを持たず（`minId` / `maxId` / `count` / `order` / `senderId` のみ。
 * ミラーで確認）、スペース全体の自分宛て通知を返す。**3軸で表現できないので載せない**
 * （原則3）。語彙に残すと「書けるのに何も許可されない」ポリシーが作れてしまう。
 */
export const TOOLSETS = ['issue', 'wiki', 'document', 'git', 'activity'] as const;

export type Toolset = (typeof TOOLSETS)[number];

/** 仮実装で公開するツール。 */
export const TOOL_NAMES = [
  'search_issues',
  'get_issue',
  'get_issue_comments',
  'list_wiki_pages',
  'get_wiki_page',
  'list_git_repositories',
  'list_pull_requests',
  'get_pull_request',
  'get_pull_request_comments',
  'search_documents',
  'list_project_activities',
  'add_issue_comment',
  'create_issue',
  'update_issue',
  'create_pull_request',
  'update_pull_request',
  'add_pull_request_comment',
  'create_document',
  'list_project_masters',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

// ============================================================================
// ツールの静的な仕様
// ============================================================================

/**
 * プロジェクトの特定方法。エンドポイントは3種に割れる。
 *
 * - `key`: 課題キー等の引数からローカルに判定できる。API 到達前に弾ける
 * - `filter`: 絞り込みパラメータをポリシー由来の値で上書きできる
 *
 * 数値 ID しか受けない経路（`GET /wikis/:wikiId` 等）はツールにしないため、この型に無い。
 */
export type ScopeKind = 'key' | 'filter';

export interface ToolSpec {
  readonly toolset: Toolset;
  /** このツールを使うのに必要な `can` の下限。 */
  readonly requires: Can;
  readonly scopeKind: ScopeKind;
  readonly title: string;
  readonly description: string;
  /** MCP の ToolAnnotations に載せる。仕様上ヒントであり、防御には使わない。 */
  readonly readOnly: boolean;
}

/**
 * ツール名 → 仕様の全単射。
 *
 * mapped type にしているのは完全性チェックのため。`TOOL_NAMES` にツールを足して
 * ここに書き忘れるとコンパイルエラーになる（`electron-prototype` の
 * `EXPECTED_API_KEYS` と同じ手）。
 */
export const TOOL_SPECS: { readonly [K in ToolName]: ToolSpec } = {
  search_issues: {
    toolset: 'issue',
    requires: 'read',
    scopeKind: 'filter',
    title: '課題を検索する',
    description:
      '許可されたプロジェクトの課題を検索する。検索対象のプロジェクトはサーバ側で決まり、引数では変更できない。',
    readOnly: true,
  },
  get_issue: {
    toolset: 'issue',
    requires: 'read',
    scopeKind: 'key',
    title: '課題を取得する',
    description:
      '課題キー（例: PROJ-123）を指定して課題を取得する。カスタム属性の中身は返さず、件数だけを customFieldCount で返す。',
    readOnly: true,
  },
  get_issue_comments: {
    toolset: 'issue',
    requires: 'read',
    scopeKind: 'key',
    title: '課題のコメントを取得する',
    description: '課題キー（例: PROJ-123）を指定してコメント一覧を取得する。',
    readOnly: true,
  },
  list_wiki_pages: {
    toolset: 'wiki',
    requires: 'read',
    scopeKind: 'filter',
    title: 'Wiki ページ一覧を取得する',
    description: '許可されたプロジェクトの Wiki ページ一覧を取得する。',
    readOnly: true,
  },
  get_wiki_page: {
    toolset: 'wiki',
    requires: 'read',
    scopeKind: 'filter',
    title: 'Wiki ページの本文を取得する',
    description:
      'プロジェクトキーとページ名を指定して Wiki ページの本文を取得する。ページ名は list_wiki_pages が返す name をそのまま渡す。',
    readOnly: true,
  },
  list_git_repositories: {
    toolset: 'git',
    requires: 'read',
    scopeKind: 'filter',
    title: 'Git リポジトリ一覧を取得する',
    description: '許可されたプロジェクトの Git リポジトリ一覧を取得する。',
    readOnly: true,
  },
  list_pull_requests: {
    toolset: 'git',
    requires: 'read',
    scopeKind: 'filter',
    title: 'プルリクエスト一覧を取得する',
    description:
      'プロジェクトキーとリポジトリ名を指定してプルリクエスト一覧を取得する。リポジトリ名は list_git_repositories が返す name をそのまま渡す。',
    readOnly: true,
  },
  get_pull_request: {
    toolset: 'git',
    requires: 'read',
    scopeKind: 'filter',
    title: 'プルリクエストを取得する',
    description:
      'プロジェクトキー・リポジトリ名・プルリクエスト番号を指定して取得する。番号は list_pull_requests が返す number をそのまま渡す。',
    readOnly: true,
  },
  get_pull_request_comments: {
    toolset: 'git',
    requires: 'read',
    scopeKind: 'filter',
    title: 'プルリクエストのコメントを取得する',
    description:
      'プロジェクトキー・リポジトリ名・プルリクエスト番号を指定してコメント一覧を取得する。',
    readOnly: true,
  },
  search_documents: {
    toolset: 'document',
    requires: 'read',
    scopeKind: 'filter',
    title: 'ドキュメントを検索する',
    description:
      '許可されたプロジェクトのドキュメントを検索し、本文まで返す。検索対象のプロジェクトはサーバ側で決まり、引数では変更できない。',
    readOnly: true,
  },
  create_document: {
    toolset: 'document',
    requires: 'write',
    scopeKind: 'filter',
    title: 'ドキュメントを作成する',
    description:
      'プロジェクトキー・タイトル・本文を指定してドキュメントを作成する。本文は Markdown。Backlog に更新の API が無いので、作成したドキュメントを後から書き換えることはできない。',
    readOnly: false,
  },
  list_project_masters: {
    toolset: 'issue',
    requires: 'read',
    scopeKind: 'filter',
    title: '指定できる名前の一覧を取得する',
    description:
      'プロジェクトで使える状態・課題種別・カテゴリー・マイルストーン・担当者と、スペース共通の優先度・完了理由の名前を返す。課題の作成・更新・検索でこれらを名前で指定する前に引く。',
    readOnly: true,
  },
  list_project_activities: {
    toolset: 'activity',
    requires: 'read',
    scopeKind: 'filter',
    title: 'プロジェクトの最近の活動を取得する',
    description:
      'プロジェクトキーを指定して最近の活動を取得する。関連する課題があれば issueKey を返すので、詳細は get_issue で取得する。',
    readOnly: true,
  },
  add_issue_comment: {
    toolset: 'issue',
    requires: 'comment',
    scopeKind: 'key',
    title: '課題にコメントする',
    description: '課題キー（例: PROJ-123）を指定してコメントを追加する。',
    readOnly: false,
  },
  create_issue: {
    toolset: 'issue',
    requires: 'write',
    scopeKind: 'filter',
    title: '課題を作成する',
    description:
      'プロジェクトキーを指定して課題を作成する。種別・優先度・担当者・カテゴリー・マイルストーンは**名前**で指定する（数値 ID は受け付けない）。',
    readOnly: false,
  },
  update_issue: {
    toolset: 'issue',
    requires: 'write',
    scopeKind: 'key',
    title: '課題を更新する',
    description:
      '課題キー（例: PROJ-123）を指定して課題を更新する。状態・完了理由・優先度・担当者は**名前**で指定する。指定した項目だけが変わる。',
    readOnly: false,
  },
  create_pull_request: {
    toolset: 'git',
    requires: 'write',
    scopeKind: 'filter',
    title: 'プルリクエストを作成する',
    description:
      'プロジェクトキーとリポジトリ名を指定してプルリクエストを作成する。担当者は名前で、関連課題は課題キー（例: PROJ-123）で指定する（数値 ID は受け付けない）。',
    readOnly: false,
  },
  update_pull_request: {
    toolset: 'git',
    requires: 'write',
    scopeKind: 'filter',
    title: 'プルリクエストを更新する',
    description:
      'プルリクエスト番号を指定して更新する。指定した項目だけが変わる。担当者は名前で、関連課題は課題キーで指定する。',
    readOnly: false,
  },
  add_pull_request_comment: {
    toolset: 'git',
    requires: 'comment',
    scopeKind: 'filter',
    title: 'プルリクエストにコメントする',
    description:
      'プロジェクトキー・リポジトリ名・プルリクエスト番号を指定してコメントを追加する。行ごとのコメントは Backlog API に存在しないので、本文に src/main.ts:42 の形で参照を書く。',
    readOnly: false,
  },
};

// ============================================================================
// ポリシーの正規形
// ============================================================================

/**
 * ポリシーを展開した正規形。`projectKey` → 許可されたツール名の集合。
 *
 * `can` / `toolsets` はどれもこの集合への畳み込みであり、記法の違いはここで消える。
 * `tools/list` の生成とハンドラの確認は、どちらもこの同じ集合を参照する。
 */
export type ScopeSet = ReadonlyMap<string, ReadonlySet<ToolName>>;

export interface ResolvedPolicy {
  readonly scopes: ScopeSet;
  /** 監査用。記法ではなく正規形に対して取るので、書き方を変えても権限が同じならハッシュが同じ。 */
  readonly hash: string;
}

// ============================================================================
// 層間の受け渡し
// ============================================================================

/**
 * フォームに載せられる値。
 *
 * Backlog の書き込み系は form-urlencoded を取る。**添付（ファイルパート）はここに含めない** —
 * 添付は次段階で、ローカルファイルの検証を通した経路からしか載せられないようにする。
 *
 * **配列を含めない。** 借り物の `ApiClient` はフォームのスカラー配列を `TypeError` で弾く
 * （通るのはファイルの配列だけ）。型で「書ける」と言って実行時に落ちる状態を作らないため、
 * ここはスカラーだけにしてある。`notifiedUserId[]` のような配列が要るのは次段階なので、
 * **そのとき上流を直すか回避するかを決める**（今決めても使わない）。
 */
export type FormValue = string | number | boolean | AttachmentFile;

export type FormFields = Readonly<Record<string, FormValue>>;

/**
 * multipart に載せるファイル。**借り物の `FilePart` と同じ形にしてある。**
 *
 * `libs/` の型をそのまま使わないのは、tool 層が `libs/` を import できないため
 * （lint で禁止している）。形を合わせてあるので gateway でそのまま渡せる。
 */
export interface AttachmentFile {
  readonly kind: 'file';
  readonly filename: string;
  readonly contentType: string;
  readonly data: Uint8Array;
}

/**
 * input 層が組み立てて api 層へ渡す、解決済みのリクエスト。
 *
 * ここに載る `projectId` は**すでにポリシー由来**である。api 層に「上書き」という
 * 概念を持ち込まないため、絞り込みは input 層で完結させる。この型を境にすることで、
 * スコープが効いているかの検証が I/O 抜きの純関数テストになる。
 */
export interface ResolvedRequest {
  readonly endpoint: string;
  readonly method: 'GET' | 'POST' | 'PATCH';
  readonly query?: Readonly<Record<string, unknown>>;
  readonly form?: FormFields;
}

/**
 * 添付ファイルを受け付けられない。**API に到達する前に返す。**
 *
 * ルート外・未知の拡張子・中身と拡張子の不一致・サイズ超過をまとめて表す。
 */
export class AttachmentError extends Error {
  override readonly name = 'AttachmentError';
}

/** ポリシー違反。API に到達する前に返す。 */
export class ScopeDeniedError extends Error {
  override readonly name = 'ScopeDeniedError';
  readonly toolName: string;
  readonly projectKey: string | null;

  constructor(message: string, toolName: string, projectKey: string | null) {
    super(message);
    this.toolName = toolName;
    this.projectKey = projectKey;
  }
}

/**
 * Backlog API の呼び出しが失敗した。
 *
 * **メッセージは第三者（Backlog サーバ）が書いた文字列を含む**ので、組み立てる側が
 * `<untrusted>` で囲んでからこの型に載せる。元の例外は `cause` に残す。
 */
export class ApiFailureError extends Error {
  override readonly name = 'ApiFailureError';
}

/** ポリシー記法の不備。起動時に投げて、サーバを立ち上げない。 */
export class PolicyError extends Error {
  override readonly name = 'PolicyError';
}

/**
 * 環境変数の不備。起動時に投げて、サーバを立ち上げない。
 *
 * **メッセージに値そのものを載せない。** API キーが混ざる経路を作らないため。
 */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

/**
 * 起動時のマスタ解決の失敗。起動時に投げて、サーバを立ち上げない。
 *
 * `resolution` を名前に使わないのは、Backlog の「完了理由（resolutions）」と
 * 語がぶつかるため（層をまたいで同じ語を違う意味で使わない）。
 */
export class MasterDataError extends Error {
  override readonly name = 'MasterDataError';
}

/** Backlog のスペースが載るドメイン。一次情報ミラーで確認した閉じた3値。 */
export const BACKLOG_DOMAINS = ['backlog.jp', 'backlog.com', 'backlogtool.com'] as const;

export type BacklogDomain = (typeof BACKLOG_DOMAINS)[number];

/**
 * 起動時に確定する設定。
 *
 * `baseUrl` は**受け取った値ではなく組み立てた値**である。env から URL を受けないので、
 * `https` 以外のスキーム・任意ホスト・パス注入は設定として表現できない。
 */
export interface ServerConfig {
  readonly spaceId: string;
  readonly domain: BacklogDomain;
  readonly baseUrl: string;
  readonly apiKey: string;
  /** 絶対パスに解決済み。ログの出力先の基準にもなる。 */
  readonly policyPath: string;
  /**
   * 監査ログの出力先（絶対パス）。
   *
   * 相対指定は**ポリシーファイルのディレクトリから**解決する。`cwd` を基準にしないのは、
   * MCP サーバの `cwd` が宣言した場所で変わるため（クライアントのドキュメントで確認）。
   * ポリシーは必須なので、基準が無い状態が作れない。
   */
  readonly logDir: string;
  /**
   * 添付を許すディレクトリ（絶対パス）。**未設定なら添付機能そのものが無い。**
   *
   * 既定を置かないのは、置いた瞬間に「どこが読めるか」が暗黙になるため。MCP 仕様 2026-07-28 で
   * `roots` が非推奨になり、**クライアントから受け取る道も塞がれている**（SEP-2577）ので、
   * 設定で明示する以外に安全な決め方が無い。相対指定はポリシーファイルのディレクトリから解決する。
   */
  readonly attachmentsRoot: string | null;
  /**
   * **このサーバ自身の設定ファイル**（絶対パス）。添付として送り出せないようにするために持つ。
   *
   * `BACKLOG_ENV_FILE` / `BACKLOG_ENV_KEYS_FILE` / `BACKLOG_POLICY` が指すファイルそのもの。
   * **名前で塞がない** — これらのパスは利用者が決めるので、拡張子の allowlist では漏れる
   * （env を `secrets.json` と名付ければ `.json` として通ってしまう）。
   */
  readonly selfPaths: readonly string[];
  readonly readOnly: boolean;
}
