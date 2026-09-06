/**
 * protocol.ts
 *
 * @description MCP の JSON-RPC 2.0 メッセージを解釈して応答を組み立てる（I/O を持たない）
 */

import { assertNever } from '../shared/assertNever.ts';

export const JSONRPC_VERSION = '2.0';

/**
 * 応答できるプロトコル版。クライアントが要求した版がこの中にあればそれを返し、
 * 無ければ既定を返す（クライアントが対応できなければ切断する、が仕様の定め）。
 *
 * 一次情報: `modelcontextprotocol/modelcontextprotocol` の `schema/<版>/schema.ts`。
 */
export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-11-25', '2026-07-28'] as const;

export const DEFAULT_PROTOCOL_VERSION = '2025-11-25';

/** JSON-RPC 2.0 の標準エラーコード。 */
export const RPC_ERROR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

export type RpcErrorCode = (typeof RPC_ERROR)[keyof typeof RPC_ERROR];

/** JSON-RPC の id。通知には無い。 */
export type RpcId = string | number | null;

export interface RpcSuccess {
  readonly jsonrpc: typeof JSONRPC_VERSION;
  readonly id: RpcId;
  readonly result: unknown;
}

export interface RpcFailure {
  readonly jsonrpc: typeof JSONRPC_VERSION;
  readonly id: RpcId;
  readonly error: { readonly code: number; readonly message: string };
}

export type RpcResponse = RpcSuccess | RpcFailure;

/** MCP のツール定義。`tools/list` にそのまま載る形。 */
export interface ToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly annotations: {
    readonly readOnlyHint: boolean;
    readonly destructiveHint: boolean;
    readonly idempotentHint: boolean;
    readonly openWorldHint: boolean;
  };
}

/** `tools/call` の結果。 */
export interface ToolResult {
  readonly content: readonly { readonly type: 'text'; readonly text: string }[];
  readonly isError?: boolean;
}

/** プロトコル層が呼ぶ先。ツールの中身は知らない。 */
export interface McpHandlers {
  listTools(): readonly ToolDefinition[];
  callTool(name: string, args: unknown): Promise<ToolResult>;
}

export interface ServerInfo {
  readonly name: string;
  readonly version: string;
  /** LLM に向けた自然言語のガイダンス。仕様がこの用途を想定している。 */
  readonly instructions: string;
}

// ============================================================================
// 受信メッセージの検証（外部入力なので unknown で受ける。規約 §4.6）
// ============================================================================

interface RpcRequest {
  readonly id: RpcId | undefined;
  readonly method: string;
  readonly params: Record<string, unknown> | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRpcId = (value: unknown): value is RpcId =>
  typeof value === 'string' || typeof value === 'number' || value === null;

const parseRequest = (message: unknown): RpcRequest | null => {
  if (!isRecord(message)) {
    return null;
  }
  if (message['jsonrpc'] !== JSONRPC_VERSION) {
    return null;
  }
  if (typeof message['method'] !== 'string') {
    return null;
  }
  const rawId = message['id'];
  const rawParams = message['params'];
  return {
    id: rawId === undefined ? undefined : isRpcId(rawId) ? rawId : null,
    method: message['method'],
    params: isRecord(rawParams) ? rawParams : undefined,
  };
};

/**
 * 応答に使う id を引き直す。
 *
 * **`handleMessage` が投げたときのためにある。** 投げてしまうと応答の id が取れないが、
 * 1件のリクエストには必ず1件の応答を返さなければならない。
 *
 * @param message - `JSON.parse` した結果（未検証の外部データ）
 * @returns 応答に使う id。通知（`id` を持たない）なら `undefined`
 */
export const rpcIdOf = (message: unknown): RpcId | undefined => {
  const request = parseRequest(message);
  return request === null ? null : request.id;
};

const success = (id: RpcId, result: unknown): RpcSuccess => ({
  jsonrpc: JSONRPC_VERSION,
  id,
  result,
});

const failure = (id: RpcId, code: RpcErrorCode, message: string): RpcFailure => ({
  jsonrpc: JSONRPC_VERSION,
  id,
  error: { code, message },
});

// ============================================================================
// メソッド
// ============================================================================

/** 応答するメソッド。ここに無いものは METHOD_NOT_FOUND を返す。 */
const METHODS = ['initialize', 'server/discover', 'ping', 'tools/list', 'tools/call'] as const;

type Method = (typeof METHODS)[number];

const isMethod = (value: string): value is Method => (METHODS as readonly string[]).includes(value);

const negotiateVersion = (params: Record<string, unknown> | undefined): string => {
  const requested = params?.['protocolVersion'];
  if (
    typeof requested === 'string' &&
    (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return DEFAULT_PROTOCOL_VERSION;
};

const initializeResult = (
  params: Record<string, unknown> | undefined,
  serverInfo: ServerInfo,
): unknown => ({
  protocolVersion: negotiateVersion(params),
  capabilities: { tools: {} },
  serverInfo: { name: serverInfo.name, version: serverInfo.version },
  instructions: serverInfo.instructions,
});

const discoverResult = (serverInfo: ServerInfo): unknown => ({
  supportedVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
  capabilities: { tools: {} },
  instructions: serverInfo.instructions,
});

// ============================================================================
// 公開 API
// ============================================================================

/**
 * 受信した1件のメッセージを処理して、返すべき応答を組み立てる。I/O を持たない。
 *
 * 通知（`id` を持たないメッセージ）には `null` を返す。JSON-RPC では通知に応答しない。
 *
 * @param message - `JSON.parse` した結果（未検証の外部データ）
 * @param handlers - ツールの一覧と実行
 * @param serverInfo - サーバ名・版・LLM 向けガイダンス
 * @returns 送るべき応答。通知なら `null`
 */
export const handleMessage = async (
  message: unknown,
  handlers: McpHandlers,
  serverInfo: ServerInfo,
): Promise<RpcResponse | null> => {
  const request = parseRequest(message);
  if (request === null) {
    return failure(null, RPC_ERROR.INVALID_REQUEST, 'JSON-RPC 2.0 のリクエストではありません');
  }

  // 通知には応答しない。未知の通知も黙って捨てる（仕様どおり）。
  if (request.id === undefined) {
    return null;
  }
  const id = request.id;

  if (!isMethod(request.method)) {
    return failure(id, RPC_ERROR.METHOD_NOT_FOUND, `未対応のメソッドです: ${request.method}`);
  }

  switch (request.method) {
    case 'initialize': {
      return success(id, initializeResult(request.params, serverInfo));
    }
    case 'server/discover': {
      return success(id, discoverResult(serverInfo));
    }
    case 'ping': {
      return success(id, {});
    }
    case 'tools/list': {
      return success(id, { tools: handlers.listTools() });
    }
    case 'tools/call': {
      const name = request.params?.['name'];
      if (typeof name !== 'string') {
        return failure(id, RPC_ERROR.INVALID_PARAMS, 'name には string を指定してください');
      }
      const result = await handlers.callTool(name, request.params?.['arguments']);
      return success(id, result);
    }
    default: {
      return assertNever(request.method);
    }
  }
};
