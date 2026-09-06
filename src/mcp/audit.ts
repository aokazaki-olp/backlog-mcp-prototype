/**
 * audit.ts
 *
 * @description ツール呼び出しを JSONL で記録する。プロンプトインジェクションに対して
 *              実際に効く2つ（被害の上限を下げる・検出可能にする）のうちの後者
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import SonicBoomModule from 'sonic-boom';
import { ConfigError } from '../contract.ts';
import { toError } from '../shared/toError.ts';
import type { McpHandlers, ToolDefinition, ToolResult } from './protocol.ts';
import type { SonicBoom } from 'sonic-boom';

/**
 * 監査ログの書き出し先。
 *
 * **stdout は使えない。** stdio トランスポートでは stdout が JSON-RPC の通信路そのもので、
 * 1行でも混ぜるとクライアントとの接続が壊れる。
 *
 * **`write` は投げる。** 起動時だけでなく**稼働中にも書けなくなる**（ディスク満杯・
 * アンマウント・出力先の消失）。投げたときサーバを止めるのは `withAudit` と `serve` の役目で、
 * 実装側は失敗を握りつぶさない（規約 §5.4）。
 */
export interface AuditSink {
  write(line: string): void;
}

/**
 * 稼働中に監査ログへ書けなくなったことを表す。**サーバを止める合図**で、
 * 止め方は `stdio.ts` の `serve` が1箇所で決める。
 *
 * **`result` を持つのは、記録できなかった呼び出しが既に実行済みだから。**
 * 捨てて失敗として返すと成功が失敗に化ける（それ自体が直す対象）。
 */
export class AuditUnwritableError extends Error {
  override readonly name = 'AuditUnwritableError';
  /** 記録できなかった呼び出しの結果。手元にあれば捨てない */
  readonly result: ToolResult | undefined;
  /** 記録しようとした時点で処理中だった例外（規約 §6.3 の `suppressed` と同じ向き） */
  readonly suppressed: unknown;

  constructor(result: ToolResult | undefined, suppressed: unknown, options?: ErrorOptions) {
    super('監査ログに記録できません', options);
    this.result = result;
    this.suppressed = suppressed;
  }
}

/**
 * 停止するとき、直前の1件の応答に添える告知。
 *
 * **宛先は利用者で、LLM はその経路にすぎない。** 理由が付いた形で利用者に届く経路は
 * これしかない — stderr は MCP 仕様上クライアントが ignore してよく、プロセスの終了は
 * 「切断された」しか運ばない。
 *
 * **`isError` には載せない。** 仕様は `isError` を「モデルが自己修正して**再試行**するための
 * feedback」と定義しており、ここで再試行されると実行済みの操作が二重に走る。
 */
export const AUDIT_STOP_NOTICE = [
  '監査ログに記録できないため、このサーバは停止します。',
  '直前の操作は実行された可能性があります。同じ操作を再実行しないでください。',
  '利用者へ: 監査ログの出力先（BACKLOG_LOG_DIR。既定はポリシーファイルの隣の logs/）が',
  '書き込める状態か、ディスクに空きがあるかを確かめてから起動し直してください。',
].join('\n');

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

/**
 * 複数の出口へ同じ行を流す。**1つが失敗したらそこで送出する**（黙って片方だけ書かない）。
 *
 * 起動時なら起動しない、稼働中なら停止する。どちらも呼び出し側の判断で、ここは失敗を伝えるだけ。
 */
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
 * **記述子の管理は `sonic-boom` に委ねる。** 手書きの状態機械は「閉じてから開く」形になり、
 * 開けなかったときに閉じ済みの番号が残った（L1-1）。`reopen` は**開けてから閉じる**ので、
 * 失敗しても古い出力先が生きたまま残る。
 *
 * ファイル記述子はプロセスと同じ寿命で持つ（`using` でスコープ解放しない）。
 * 書き込みが同期なので閉じ忘れで失うものが無く、stderr と同じ扱いでよい。
 *
 * @param dir - 出力先ディレクトリ（絶対パス）
 * @param now - 現在時刻。**テストのための注入口**（規約 §7）。安全側の既定を持つので、
 *              渡し忘れても挙動は変わらない
 * @returns 追記する出口
 * @throws {ConfigError} ディレクトリを作れない・書けない場合（起動させない）
 */
export const createFileAuditSink = (dir: string, now: () => Date = () => new Date()): AuditSink => {
  try {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  } catch (e) {
    throw new ConfigError(`監査ログの出力先を作れません: ${dir}`, { cause: toError(e) });
  }

  const pathFor = (date: string): string => join(dir, `audit-${date}.jsonl`);

  let openedDate = utcDate(now());
  let stream: SonicBoom;
  try {
    // 追記のみ。0600 は新規作成時にだけ効く
    stream = new SonicBoomModule.SonicBoom({
      dest: pathFor(openedDate),
      append: true,
      mode: 0o600,
      sync: true,
    });
  } catch (e) {
    throw new ConfigError(`監査ログを書き出せません: ${dir}`, { cause: toError(e) });
  }

  // **リスナを付けないと落ちる。** 記述子を閉じ損ねた場合など、非同期に流れてくる失敗があり、
  // リスナの無い 'error' は uncaughtException になってプロセスごと落ちる。受け取って
  // 次の `write` で送出する（黙って捨てない。規約 §5.4）。
  // **一度失敗したら以後も失敗させる。** ローテーション成功後の close 失敗のような
  // 実害の無い失敗でも止まりうるが、fail-closed の側へ倒す
  let failed: Error | undefined;
  stream.on('error', (e: Error) => {
    failed ??= e;
  });

  return {
    write(line: string): void {
      if (failed !== undefined) {
        throw failed;
      }
      const date = utcDate(now());
      if (date !== openedDate) {
        // 開けなければここで送出する。`openedDate` は更新しないので、状態は前日のまま整合する
        stream.reopen(pathFor(date));
        openedDate = date;
      }
      stream.write(`${line}\n`);
    },
  };
};

/**
 * 記録する引数。**「何に触ったか」だけ。本文は記録しない。**
 *
 * 「誰がどの資源に触ったか」は監査に要るが、コメント本文まで落とすとログが
 * 第三者の書いたテキストの置き場になる。だから `content` / `summary` / `description` /
 * `comment` は載せない。
 *
 * **`file` は別扱いで載せる。** これは利用者が書いたパスであって第三者のテキストではなく、
 * しかも**ローカルのファイルを Backlog へ送り出す**操作を指す。監査の目的そのものなので、
 * 拒否された場合も含めて「何を送ろうとしたか」を残す。
 *
 * `repository` と `number` はプルリクエストの識別子。これが無いと「どの PR にコメントしたか」が
 * 残らない。
 */
const IDENTIFYING_ARGS = ['issueKey', 'projectKey', 'repository', 'number', 'file'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * 識別子だけを取り出す。**文字列と数値の両方を拾う**（PR 番号は数値）。
 *
 * 値は64文字で切る。長さで記録が壊れないようにするためで、識別子としてはこれで足りる。
 */
const identify = (args: unknown): Record<string, string | number> => {
  if (!isRecord(args)) {
    return {};
  }
  const result: Record<string, string | number> = {};
  for (const name of IDENTIFYING_ARGS) {
    const value = args[name];
    if (typeof value === 'string') {
      result[name] = value.slice(0, 64);
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[name] = value;
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

    let result: ToolResult;
    try {
      result = await handlers.callTool(name, args);
    } catch (e) {
      // 握りつぶさない（規約 §5.4）。記録してから元の例外をそのまま投げ直す。
      try {
        record(false, { thrown: Error.isError(e) ? e.name : 'unknown' });
      } catch (sinkError) {
        // 記録そのものが失敗した。**元の例外を落とさない**（規約 §6.2）
        throw new AuditUnwritableError(undefined, e, { cause: toError(sinkError) });
      }
      throw e;
    }

    try {
      record(result.isError !== true);
    } catch (sinkError) {
      // **結果を捨てない。** ツールは既に実行済みで、捨てると成功が失敗に化ける
      throw new AuditUnwritableError(result, undefined, { cause: toError(sinkError) });
    }
    return result;
  },
});
