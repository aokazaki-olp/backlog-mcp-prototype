/**
 * config.ts
 *
 * @description 環境変数を検証し、Backlog の baseUrl を組み立てる（受け取らない）
 */

import { dirname, isAbsolute, resolve } from 'node:path';
import { BACKLOG_DOMAINS, ConfigError } from './contract.ts';
import type { BacklogDomain, ServerConfig } from './contract.ts';

/**
 * スペースID として受け付ける形。**DNS ラベルとして安全であること**だけを条件にする。
 *
 * セキュリティ上必要なのはこれだけで、`/` `:` `@` `.` が入らなければ組み立てた URL の
 * 意味を変えられない。Backlog 側の制約（半角英小文字・数字・ハイフン、3〜10文字、
 * 先頭末尾のハイフン不可 — **一次情報未確認**）はこの部分集合なので、そちらに合わせて
 * 厳しくして正当なスペースIDを弾くリスクは取らない。形式外のIDは Backlog 側が 404 を返す。
 */
const SPACE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const DEFAULT_DOMAIN: BacklogDomain = 'backlog.jp';

const isBacklogDomain = (value: string): value is BacklogDomain =>
  (BACKLOG_DOMAINS as readonly string[]).includes(value);

/** 既定の出力先。ポリシーの隣に置く。 */
const DEFAULT_LOG_DIR_NAME = 'logs';

/**
 * 監査ログの出力先を決める。
 *
 * 相対指定は**ポリシーファイルのディレクトリから**解決する。`cwd` は宣言した場所で
 * 変わるので基準にしない。既定はポリシーの隣（`<policy dir>/logs`）で、
 * 「何が許可されていたか」と「何が行われたか」が同じ場所に並ぶ。
 *
 * **temp を既定にしない。** `/tmp` は systemd の既定で10日後に消え（`tmpfiles.d/tmp.conf`）、
 * かつ `1777`（全ユーザー書き込み可）である。OS が定期的に消す場所に置いた監査ログは、
 * 監査ログとして機能しない。
 */
const resolveLogDir = (raw: string | undefined, policyPath: string): string => {
  if (raw === undefined || raw === '') {
    return resolve(dirname(policyPath), DEFAULT_LOG_DIR_NAME);
  }
  return isAbsolute(raw) ? raw : resolve(dirname(policyPath), raw);
};

const required = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name];
  if (value === undefined || value === '') {
    throw new ConfigError(`${name} は必須です`);
  }
  return value;
};

/**
 * 環境変数から設定を組み立てる。純関数。
 *
 * **URL を受け取らない。** スペースID とドメイン（閉じた3値）だけを受け、
 * `https://{spaceId}.{domain}` をこちらで組み立てる。スキーム・ホスト・パスを
 * 外から差し替える経路が存在しないので、ホスト検証そのものが不要になる。
 *
 * @param env - 環境変数（`process.env` を渡す。テストでは任意のオブジェクト）
 * @returns 確定した設定
 * @throws {ConfigError} 必須の環境変数が無い場合、値の形式が不正な場合
 */
export const loadConfig = (env: NodeJS.ProcessEnv): ServerConfig => {
  const spaceId = required(env, 'BACKLOG_SPACE_ID');
  if (!SPACE_ID_PATTERN.test(spaceId)) {
    throw new ConfigError(
      'BACKLOG_SPACE_ID にはスペースID だけを指定してください（URL やパスは受け付けません）。' +
        '使えるのは半角英小文字・数字・ハイフンで、先頭と末尾はハイフン以外です',
    );
  }

  const rawDomain = env['BACKLOG_DOMAIN'];
  if (rawDomain !== undefined && rawDomain !== '' && !isBacklogDomain(rawDomain)) {
    throw new ConfigError(`BACKLOG_DOMAIN が不正です（使えるのは ${BACKLOG_DOMAINS.join(' / ')}）`);
  }
  const domain: BacklogDomain =
    rawDomain === undefined || rawDomain === '' ? DEFAULT_DOMAIN : rawDomain;

  const rawReadOnly = env['BACKLOG_READ_ONLY'];

  // 絶対パスにしておく。ログの出力先の基準になるので、後から cwd が動いてもずれない
  const policyPath = resolve(required(env, 'BACKLOG_POLICY'));

  return Object.freeze({
    spaceId,
    domain,
    // 組み立てた値。受け取った値ではない。
    baseUrl: `https://${spaceId}.${domain}`,
    apiKey: required(env, 'BACKLOG_API_KEY'),
    policyPath,
    logDir: resolveLogDir(env['BACKLOG_LOG_DIR'], policyPath),
    readOnly: rawReadOnly === '1' || rawReadOnly === 'true',
  });
};

/**
 * 設定を人が読める1行にする。stderr と監査ログへ出す。
 *
 * **API キーは含めない。** 値そのものが出る経路を作らない。
 *
 * @param config - 確定した設定
 * @returns 1行の説明
 */
export const describeConfig = (config: ServerConfig): string =>
  `space=${config.baseUrl} policy=${config.policyPath} log=${config.logDir}${config.readOnly ? ' read-only' : ''}`;
