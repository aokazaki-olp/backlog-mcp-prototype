/**
 * stdio.ts
 *
 * @description 改行区切りの JSON-RPC を読み書きするループ。判断は protocol / tool 層が持つ
 */

import { createInterface } from 'node:readline';
import { handleMessage, JSONRPC_VERSION, RPC_ERROR } from './protocol.ts';
import type { McpHandlers, ServerInfo } from './protocol.ts';

/**
 * 通信路。**書き出し先を差し替えられるようにしてある**ので、
 * 「JSON-RPC 以外を書かない」をテストで確かめられる。
 */
export interface StdioChannel {
  readonly input: NodeJS.ReadableStream;
  write(line: string): void;
}

/**
 * stdin から1行ずつ読み、応答を1行ずつ書く。
 *
 * 1件ずつ順に処理する。MCP は並行処理を許すが、並行にするとポリシー判定と監査ログの
 * 順序が読めなくなるので取らない。
 *
 * **この関数が書くのは JSON-RPC のメッセージだけ。** ログの類は監査ログ（stderr）へ出す。
 *
 * @param channel - 入力ストリームと書き出し先
 * @param handlers - ツールの一覧と実行
 * @param serverInfo - サーバ名・版・LLM 向けガイダンス
 */
export const serve = async (
  channel: StdioChannel,
  handlers: McpHandlers,
  serverInfo: ServerInfo,
): Promise<void> => {
  const lines = createInterface({ input: channel.input, crlfDelay: Infinity });

  for await (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      channel.write(
        JSON.stringify({
          jsonrpc: JSONRPC_VERSION,
          id: null,
          error: { code: RPC_ERROR.PARSE, message: 'JSON として解釈できません' },
        }),
      );
      continue;
    }

    const response = await handleMessage(message, handlers, serverInfo);
    if (response !== null) {
      channel.write(JSON.stringify(response));
    }
  }
};
