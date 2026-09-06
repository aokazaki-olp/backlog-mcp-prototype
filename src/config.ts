/**
 * config.ts
 *
 * @description 環境変数を検証し、Backlog の baseUrl を組み立てる（受け取らない）
 */

import { dirname, isAbsolute, resolve } from 'node:path';
import { config as loadEnvFile } from '@dotenvx/dotenvx';
import { BACKLOG_DOMAINS, ConfigError } from './contract.ts';
import { isInside, resolveAttachmentRoot } from './attach/localFile.ts';
import { toError } from './shared/toError.ts';
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
 * 鍵まわりの2つのパス。**復号にも、添付の拒否にも要る**ので1箇所で解決する。
 *
 * 添付側が要るのは「このサーバ自身の設定ファイルはどれか」であって、中身ではない。
 */
const envFilePaths = (
  env: NodeJS.ProcessEnv,
): { readonly envFile: string; readonly envKeysFile: string } => ({
  envFile: resolve(required(env, 'BACKLOG_ENV_FILE')),
  envKeysFile: resolve(required(env, 'BACKLOG_ENV_KEYS_FILE')),
});

/** dotenvx が復号できなかった値に残す接頭辞。 */
const CIPHERTEXT_PREFIX = 'encrypted:';

/** `.env` の中で API キーを入れておくキー名。 */
const API_KEY_NAME = 'BACKLOG_API_KEY';

/**
 * API キーを**環境変数から締め出す**。env で受け取るのは2つのファイルのパスだけ。
 *
 * **攻撃者を想定した防御ではない。** 秘密鍵は平文でディスクにあり、Windows では
 * パーミッションも当てにできない（`fs` の `mode` は Windows で「書き込み可否」しか
 * 表せない — Node 公式ドキュメントで確認）。**両方のファイルを読める相手には効かない。**
 *
 * 塞いでいるのは**不注意で漏れる経路**のほうで、そちらのほうが桁違いに起きやすい。
 *
 * 1. 環境変数は LLM のコンテキストに入り込みうる
 * 2. `.mcp.json` を除外し忘れて追跡される
 *
 * どちらも「秘密を env にも `.mcp.json` にも置かない」ことで消える。手段として暗号文
 * （`.env`）と秘密鍵（`.env.keys`）を別の場所に置き、**片方だけ漏れても意味を成さない**
 * 形にする。守れるのは「リポジトリが流出する」「env が覗かれる」の2経路だけで、
 * それ以上は主張しない。
 *
 * 呼び方は実機で確かめてある（dotenvx 2.23.0）。
 *
 * - `processEnv` に自前のオブジェクトを渡すと **`process.env` を汚さない**
 * - `strict: true` で**復号できなければ送出する**（鍵なし・鍵の取り違え・鍵ファイル不在の
 *   3通りとも `DECRYPTION_FAILED` を確認）
 *
 * @param env - 環境変数
 * @returns 復号した API キー
 * @throws {ConfigError} パスが無い場合、復号できない場合、値が空の場合
 */
const decryptApiKey = (env: NodeJS.ProcessEnv): string => {
  const { envFile, envKeysFile } = envFilePaths(env);
  const decrypted: Record<string, string> = {};

  try {
    loadEnvFile({
      path: [envFile],
      envKeysFile,
      // process.env ではなくこのオブジェクトへ書かせる
      processEnv: decrypted,
      // 復号できなければ黙って進まず送出させる
      strict: true,
      quiet: true,
    });
  } catch (e) {
    // 値そのものは載せない。パスも載せない（どちらも秘密の在り処になる）
    throw new ConfigError('API キーを復号できませんでした', { cause: toError(e) });
  }

  const apiKey = decrypted[API_KEY_NAME];
  if (apiKey === undefined || apiKey === '') {
    throw new ConfigError(`${envFile} に ${API_KEY_NAME} がありません`);
  }
  // strict が効いていれば到達しない。ライブラリの挙動に防御を預けないための保険
  // （上流のテストは strict × 復号失敗の組み合わせを直接カバーしていない）
  if (apiKey.startsWith(CIPHERTEXT_PREFIX)) {
    throw new ConfigError(`${API_KEY_NAME} が復号されていません`);
  }
  return apiKey;
};

/**
 * 差し替えられる依存。**テストから復号を差し込むためだけ**に使う（規約 §7）。
 *
 * env からは触れないので、設定として危険な値を表現できるようにはならない。
 */
export interface ConfigOverrides {
  readonly resolveApiKey?: (env: NodeJS.ProcessEnv) => string;
}

/**
 * 添付を許すディレクトリを決める。**未設定なら `null`（添付の口そのものが開かない）。**
 *
 * 既定を置かない。置くと「どこが読めるか」が暗黙になり、設定を書いていない利用者が
 * 知らないディレクトリを開けてしまう。相対指定の基準は `logDir` と同じくポリシー
 * ファイルのディレクトリにする（`cwd` は宣言した場所で変わるので基準にしない）。
 */
const resolveAttachmentsRoot = (value: string | undefined, policyPath: string): string | null => {
  if (value === undefined || value === '') {
    return null;
  }
  return resolveAttachmentRoot(dirname(policyPath), value);
};

/**
 * **このサーバ自身の設定ファイル**を並べる。添付として送り出せないようにするために持つ。
 *
 * `decryptApiKey` を差し替えているとき（テスト）は env のパスが無いので、**あるものだけ**を
 * 並べる。本番経路では `decryptApiKey` が2つとも必須にしているので、必ず3つそろう。
 *
 * ここで `realpath` を使わない — **比較は開いたファイルの識別で行う**ので、パスは入口として
 * 渡すだけでよい（`src/attach/localFile.ts`）。
 */
const selfPathsOf = (env: NodeJS.ProcessEnv, policyPath: string): readonly string[] => {
  const paths = [policyPath];
  for (const name of ['BACKLOG_ENV_FILE', 'BACKLOG_ENV_KEYS_FILE']) {
    const value = env[name];
    if (value !== undefined && value !== '') {
      paths.push(resolve(value));
    }
  }
  return Object.freeze(paths);
};

/**
 * 書き込み先どうし・読み取りルートとの**重なり**を弾く。
 *
 * ダウンロード先は「人が開ける場所」を指すので、**ブラウザが第三者のファイルを落とす場所**と
 * 重なりうる。そこが添付の読み取りルートと重なると、**ブラウザが落とした任意のファイルを
 * Backlog へ上げられる**経路ができる。監査ログの出力先と重なれば、第三者由来のファイルが
 * ログに紛れる。
 *
 * **どちらが親でも駄目**なので両向きに見る。同一パスも弾く（`isInside` は自分自身を
 * `false` にするため、別に比べる）。
 */
const rejectOverlap = (
  downloadsDir: string,
  others: readonly { readonly path: string | null; readonly label: string }[],
): void => {
  for (const other of others) {
    if (other.path === null) {
      continue;
    }
    if (
      downloadsDir === other.path ||
      isInside(other.path, downloadsDir) ||
      isInside(downloadsDir, other.path)
    ) {
      throw new ConfigError(
        `BACKLOG_DOWNLOADS_DIR は ${other.label} と重ねられません（片方がもう片方の中にあります）`,
      );
    }
  }
};

/**
 * 添付のダウンロード先。**未設定なら `null`**（バイナリを保存する口が開かない）。
 *
 * **既定を置かない。** OS 既定のダウンロードフォルダを推測して既定にする案は採らない —
 * Windows の既定は Known Folder として移動でき、Linux は XDG でロケール依存の名前に
 * なりうる（**未確認**）。当たっているかに関係なく、**確かめていない値を既定にしない**。
 * 既定を置くと「設定を書いていない利用者が、知らないディレクトリへ書く」状態にもなる
 * （`BACKLOG_ATTACHMENTS_ROOT` と同じ立て方）。
 *
 * 相対指定の基準はほかと同じくポリシーファイルのディレクトリ。
 */
const resolveDownloadsDir = (value: string | undefined, policyPath: string): string | null => {
  if (value === undefined || value === '') {
    return null;
  }
  return resolveAttachmentRoot(dirname(policyPath), value);
};

/**
 * 環境変数から設定を組み立てる。
 *
 * **URL を受け取らない。** スペースID とドメイン（閉じた3値）だけを受け、
 * `https://{spaceId}.{domain}` をこちらで組み立てる。スキーム・ホスト・パスを
 * 外から差し替える経路が存在しないので、ホスト検証そのものが不要になる。
 *
 * **API キーも受け取らない。** 暗号化された `.env` から復号する（`decryptApiKey`）。
 * 平文の環境変数で渡す口は用意していない — 用意すると「暗号化したつもりで平文のまま
 * 動いている」状態が作れてしまう。
 *
 * 唯一 I/O を含むのが鍵の復号で、そこだけ `overrides` で差し替えられる。
 *
 * @param env - 環境変数（`process.env` を渡す。テストでは任意のオブジェクト）
 * @param overrides - テストから復号を差し込む口
 * @returns 確定した設定
 * @throws {ConfigError} 必須の環境変数が無い場合、値の形式が不正な場合、復号できない場合
 */
export const loadConfig = (
  env: NodeJS.ProcessEnv,
  overrides: ConfigOverrides = {},
): ServerConfig => {
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

  const attachmentsRoot = resolveAttachmentsRoot(env['BACKLOG_ATTACHMENTS_ROOT'], policyPath);
  const logDir = resolveLogDir(env['BACKLOG_LOG_DIR'], policyPath);
  const selfPaths = selfPathsOf(env, policyPath);
  const downloadsDir = resolveDownloadsDir(env['BACKLOG_DOWNLOADS_DIR'], policyPath);
  if (downloadsDir !== null) {
    rejectOverlap(downloadsDir, [
      { path: attachmentsRoot, label: 'BACKLOG_ATTACHMENTS_ROOT' },
      { path: logDir, label: '監査ログの出力先' },
      // 設定ファイルそのものを潰さない。読み取り側の selfPaths と対にする
      ...selfPaths.map(path => ({ path, label: 'このサーバ自身の設定ファイル' })),
    ]);
  }

  return Object.freeze({
    spaceId,
    domain,
    // 組み立てた値。受け取った値ではない。
    baseUrl: `https://${spaceId}.${domain}`,
    apiKey: (overrides.resolveApiKey ?? decryptApiKey)(env),
    policyPath,
    logDir,
    attachmentsRoot,
    selfPaths,
    downloadsDir,
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
