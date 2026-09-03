/**
 * main.ts
 *
 * @description エントリ。process の口を `runServer` に渡すだけ。判断は各層に置く
 */

import { runServer } from './server.ts';
import { toError } from './shared/toError.ts';
import type { StdioChannel } from './mcp/stdio.ts';

/** stdout に流してよいのは JSON-RPC のメッセージだけ。ログは stderr と監査ログのファイル。 */
const stdioChannel: StdioChannel = {
  input: process.stdin,
  write(line: string): void {
    process.stdout.write(`${line}\n`);
  },
};

/** 失敗の原因を stderr へ。`cause` を辿って落とさない（規約 §6.2）。 */
const describeFailure = (value: unknown): string => {
  const parts: string[] = [];
  let current: unknown = value;
  while (Error.isError(current)) {
    parts.push(`${current.name}: ${current.message}`);
    current = current.cause;
  }
  if (parts.length === 0) {
    parts.push(String(value));
  }
  return parts.join('\n  caused by ');
};

try {
  await runServer(stdioChannel, process.env);
} catch (e) {
  process.stderr.write(`起動に失敗しました\n  ${describeFailure(toError(e))}\n`);
  process.exitCode = 1;
}
