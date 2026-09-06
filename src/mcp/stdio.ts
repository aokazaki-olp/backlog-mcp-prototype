/**
 * stdio.ts
 *
 * @description 改行区切りの JSON-RPC を読み書きするループ。判断は protocol / tool 層が持つ
 */

import { createInterface } from 'node:readline';
import { toError } from '../shared/toError.ts';
import { AUDIT_STOP_NOTICE, AuditUnwritableError } from './audit.ts';
import { handleMessage, rpcIdOf, JSONRPC_VERSION, RPC_ERROR } from './protocol.ts';
import type { McpHandlers, RpcId, RpcResponse, ServerInfo, ToolResult } from './protocol.ts';

/**
 * 通信路。**書き出し先を差し替えられるようにしてある**ので、
 * 「JSON-RPC 以外を書かない」をテストで確かめられる。
 */
export interface StdioChannel {
  readonly input: NodeJS.ReadableStream;
  write(line: string): void;
}

/**
 * ループが終わった理由。**「入力が閉じた」と「止めた」は別物**で、呼び出し側の後始末が違う。
 */
export type ServeOutcome =
  { readonly kind: 'input-closed' } | { readonly kind: 'stopped'; readonly reason: Error };

/** 監査に記録できなくなったときの最終応答。**結果を捨てず、告知を1ブロック足す。** */
const auditStopPayload = (id: RpcId, result: ToolResult | undefined): unknown => {
  if (result === undefined) {
    return {
      jsonrpc: JSONRPC_VERSION,
      id,
      error: { code: RPC_ERROR.INTERNAL, message: AUDIT_STOP_NOTICE },
    };
  }
  // 成功を失敗に化けさせない。`isError` はツールの結果のまま据え置く
  const content: ToolResult['content'] = [
    ...result.content,
    { type: 'text', text: AUDIT_STOP_NOTICE },
  ];
  return { jsonrpc: JSONRPC_VERSION, id, result: { ...result, content } };
};

/**
 * stdin から1行ずつ読み、応答を1行ずつ書く。
 *
 * 1件ずつ順に処理する。MCP は並行処理を許すが、並行にするとポリシー判定と監査ログの
 * 順序が読めなくなるので取らない。
 *
 * **1件のリクエストには必ず1件の応答を返す**（通知を除く）。ハンドラが投げても
 * `INTERNAL` を返して読み続ける — 応答を返さずに黙って次へ行くと、呼び出し側は待ち続ける。
 *
 * **この関数が書くのは JSON-RPC のメッセージだけ。** ログの類は監査ログ（stderr）へ出す。
 *
 * 例外で終わらない。**止めた理由は戻り値で返す** — 送出すると呼び出し側が起動の失敗と
 * 区別できない。
 *
 * @param channel - 入力ストリームと書き出し先
 * @param handlers - ツールの一覧と実行
 * @param serverInfo - サーバ名・版・LLM 向けガイダンス
 * @returns ループが終わった理由
 */
export const serve = async (
  channel: StdioChannel,
  handlers: McpHandlers,
  serverInfo: ServerInfo,
): Promise<ServeOutcome> => {
  const lines = createInterface({ input: channel.input, crlfDelay: Infinity });

  /** 書き出す。**書けなければその理由を返す** — 応答を返す先が無いので畳むしかない。 */
  const write = (payload: unknown): Error | undefined => {
    try {
      channel.write(JSON.stringify(payload));
      return undefined;
    } catch (e) {
      return toError(e);
    }
  };

  for await (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      const broken = write({
        jsonrpc: JSONRPC_VERSION,
        id: null,
        error: { code: RPC_ERROR.PARSE, message: 'JSON として解釈できません' },
      });
      if (broken !== undefined) {
        return { kind: 'stopped', reason: broken };
      }
      continue;
    }

    let response: RpcResponse | null;
    try {
      response = await handleMessage(message, handlers, serverInfo);
    } catch (e) {
      const id = rpcIdOf(message);
      if (e instanceof AuditUnwritableError) {
        // 監査に記録できない。直前の1件にだけ応答して畳む（意図した停止）。
        // ここで書けなかった場合の理由は捨てる — どのみち畳むうえ、報告すべきは監査の失敗のほう
        if (id !== undefined) {
          void write(auditStopPayload(id, e.result));
        }
        return { kind: 'stopped', reason: e };
      }
      if (id === undefined) {
        // 通知には応答しない（仕様どおり）
        continue;
      }
      const broken = write({
        jsonrpc: JSONRPC_VERSION,
        id,
        error: { code: RPC_ERROR.INTERNAL, message: '処理中に内部エラーが発生しました' },
      });
      if (broken !== undefined) {
        return { kind: 'stopped', reason: broken };
      }
      continue;
    }

    if (response !== null) {
      const broken = write(response);
      if (broken !== undefined) {
        return { kind: 'stopped', reason: broken };
      }
    }
  }

  return { kind: 'input-closed' };
};
