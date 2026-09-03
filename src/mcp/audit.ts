/**
 * audit.ts
 *
 * @description ツール呼び出しを JSONL で記録する。プロンプトインジェクションに対して
 *              実際に効く2つ（被害の上限を下げる・検出可能にする）のうちの後者
 */

import type { McpHandlers, ToolDefinition, ToolResult } from './protocol.ts';

/**
 * 監査ログの書き出し先。
 *
 * **stdout は使えない。** stdio トランスポートでは stdout が JSON-RPC の通信路そのもので、
 * 1行でも混ぜるとクライアントとの接続が壊れる。
 */
export interface AuditSink {
  write(line: string): void;
}

/** 既定の書き出し先。stderr へ1行1レコードで出す。 */
export const stderrAuditSink: AuditSink = {
  write(line: string): void {
    process.stderr.write(`${line}\n`);
  },
};

/**
 * 記録する引数。**本文は記録しない。**
 *
 * 「誰がどの資源に触ったか」は監査に要るが、コメント本文まで落とすとログが
 * 第三者の書いたテキストの置き場になる（本文の長さだけを別に記録する）。
 */
const IDENTIFYING_ARGS = ['issueKey', 'projectKey'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const identify = (args: unknown): Record<string, string> => {
  if (!isRecord(args)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const name of IDENTIFYING_ARGS) {
    const value = args[name];
    if (typeof value === 'string') {
      result[name] = value.slice(0, 64);
    }
  }
  return result;
};

const argNames = (args: unknown): readonly string[] => (isRecord(args) ? Object.keys(args) : []);

/**
 * 1件の監査レコードを書く。
 *
 * @param sink - 書き出し先
 * @param record - 記録する内容（`ts` は自動で付く）
 */
export const writeAudit = (sink: AuditSink, record: Readonly<Record<string, unknown>>): void => {
  sink.write(JSON.stringify({ ts: new Date().toISOString(), ...record }));
};

/**
 * ハンドラを包んで、`tools/call` を1件ずつ記録する。
 *
 * 拒否（ポリシー違反・未知のツール名）も記録する。**拒否こそ記録に値する**ため、
 * 成功だけを残す作りにしない。
 *
 * @param handlers - 包む対象
 * @param sink - 書き出し先
 * @returns 記録する版のハンドラ
 */
export const withAudit = (handlers: McpHandlers, sink: AuditSink): McpHandlers => ({
  listTools(): readonly ToolDefinition[] {
    return handlers.listTools();
  },

  async callTool(name: string, args: unknown): Promise<ToolResult> {
    const startedAt = performance.now();
    const record = (ok: boolean, extra: Readonly<Record<string, unknown>> = {}): void => {
      writeAudit(sink, {
        event: 'tools/call',
        tool: name,
        ok,
        ms: Math.round(performance.now() - startedAt),
        args: argNames(args),
        ...identify(args),
        ...extra,
      });
    };

    try {
      const result = await handlers.callTool(name, args);
      record(result.isError !== true);
      return result;
    } catch (e) {
      // 握りつぶさない（規約 §5.4）。記録してから元の例外をそのまま投げ直す。
      record(false, { thrown: Error.isError(e) ? e.name : 'unknown' });
      throw e;
    }
  },
});
