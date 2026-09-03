/**
 * audit.ts
 *
 * @description ツール呼び出しを JSONL で記録する。プロンプトインジェクションに対して
 *              実際に効く2つ（被害の上限を下げる・検出可能にする）のうちの後者
 */

import { closeSync, mkdirSync, openSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigError } from '../contract.ts';
import { toError } from '../shared/toError.ts';
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

/**
 * stderr へ1行1レコードで出す。
 *
 * **これだけを出口にしない。** MCP 仕様は「クライアントは stderr を capture / forward /
 * **ignore** してよい」と定めており、残るかどうかがクライアント次第になる。
 * 被害の検出を監査ログに預けている設計なので、耐久性を他人に委ねない。
 */
export const stderrAuditSink: AuditSink = {
  write(line: string): void {
    process.stderr.write(`${line}\n`);
  },
};

/** 複数の出口へ同じ行を流す。1つが失敗したら起動を続けない（黙って片方だけ書かない）。 */
export const multiAuditSink = (sinks: readonly AuditSink[]): AuditSink => ({
  write(line: string): void {
    for (const sink of sinks) {
      sink.write(line);
    }
  },
});

/** ファイル名に使う日付。レコードの `ts`（UTC）と同じ日を指すよう UTC で切る。 */
const utcDate = (now: Date): string => now.toISOString().slice(0, 10);

/**
 * ディレクトリへ `audit-YYYY-MM-DD.jsonl` を追記する出口を作る。
 *
 * **ローテーションを実装しない。** 日付が変わればファイルが変わるので、世代管理は
 * ファイル名で足りる。**古いログの削除もしない** — 監査ログを黙って消す機能は作らない。
 *
 * **同期書き込みにする。** 非同期バッファはプロセスが落ちたときに直近の行を失う。
 * 1ツール呼び出しにつき1行しか書かないので、同期のコストは払える。
 *
 * ファイル記述子はプロセスと同じ寿命で持つ（`using` でスコープ解放しない）。
 * 書き込みが同期なので閉じ忘れで失うものが無く、stderr と同じ扱いでよい。
 *
 * @param dir - 出力先ディレクトリ（絶対パス）
 * @returns 追記する出口
 * @throws {ConfigError} ディレクトリを作れない・書けない場合（起動させない）
 */
export const createFileAuditSink = (dir: string): AuditSink => {
  try {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  } catch (e) {
    throw new ConfigError(`監査ログの出力先を作れません: ${dir}`, { cause: toError(e) });
  }

  let openedDate = '';
  let fd = -1;

  const fdFor = (date: string): number => {
    if (date === openedDate) {
      return fd;
    }
    if (fd !== -1) {
      closeSync(fd);
    }
    // 追記のみ。0600 は新規作成時にだけ効く
    fd = openSync(join(dir, `audit-${date}.jsonl`), 'a', 0o600);
    openedDate = date;
    return fd;
  };

  try {
    fdFor(utcDate(new Date()));
  } catch (e) {
    throw new ConfigError(`監査ログを書き出せません: ${dir}`, { cause: toError(e) });
  }

  return {
    write(line: string): void {
      writeSync(fdFor(utcDate(new Date())), `${line}\n`);
    },
  };
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
