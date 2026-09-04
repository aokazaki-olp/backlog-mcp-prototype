import assert from 'node:assert/strict';
import { set } from '@dotenvx/dotenvx';
import { mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';
import { loadConfig } from '../src/config.ts';
import { ConfigError } from '../src/contract.ts';

/**
 * **API キーの復号を実ファイルで確かめる。**
 *
 * ここだけはモックにしない。守りたい性質が「ライブラリがどう振る舞うか」に乗っており、
 * しかも**上流のテストがその組み合わせを直接カバーしていない**ため。
 *
 * 具体的には、dotenvx の `strict` のテストは `MISSING_ENV_FILE` / `MISSING_KEY` だけで、
 * **「復号失敗 + strict」は無い**。実装（`src/lib/resolvers/envs.js` の
 * `unresolvedEncryptedErrors`）は正しいが、回帰しても上流は気づかない。
 * だからこちら側で固定する。
 *
 * 鍵は判別できる文字列にして、**出力全体を走査する**（`tests/leak.test.ts` と同じ手）。
 */

const API_KEY = 'secret-key-value';

/**
 * 暗号化された `.env` と `.env.keys` を作る。
 *
 * `set` は既定で暗号化し、鍵ペアが無ければ作って `envKeysFile` に書く。**出力先を
 * 明示すること** — CLI の `encrypt` は `.env.keys` をカレントディレクトリに書くので、
 * 同じつもりで書くとリポジトリ直下に鍵ファイルが落ちる。
 */
const seal = async (root: string, value: string): Promise<{ env: string; keys: string }> => {
  const env = join(root, '.env');
  const keys = join(root, '.env.keys');
  writeFileSync(env, '');
  await set('BACKLOG_API_KEY', value, { path: env, envKeysFile: keys });
  return { env, keys };
};

const makeRoot = (): string => mkdtempSync(join(tmpdir(), 'backlog-mcp-key-'));

const envFor = (env: string, keys: string): Record<string, string> => ({
  BACKLOG_SPACE_ID: 'example',
  BACKLOG_POLICY: join(env, '..', 'backlog-policy.json'),
  BACKLOG_ENV_FILE: env,
  BACKLOG_ENV_KEYS_FILE: keys,
});

let root: string;
let sealed: { env: string; keys: string };

before(async () => {
  root = makeRoot();
  sealed = await seal(root, API_KEY);
});

describe('API キーの復号', () => {
  it('暗号化された .env から復号できる', () => {
    const config = loadConfig(envFor(sealed.env, sealed.keys));

    assert.equal(config.apiKey, API_KEY);
  });

  it('.env に平文は残っていない（暗号化されている）', () => {
    const text = readFileSync(sealed.env, 'utf8');

    assert.doesNotMatch(text, new RegExp(API_KEY));
    // 引用符の有無は書いた経路で変わる（CLI の encrypt は付けず、set は付ける）
    assert.match(text, /BACKLOG_API_KEY="?encrypted:/);
  });

  it('process.env を汚さない', () => {
    loadConfig(envFor(sealed.env, sealed.keys));

    assert.equal(process.env['BACKLOG_API_KEY'], undefined);
    assert.equal(process.env['DOTENV_PUBLIC_KEY'], undefined);
  });
});

describe('API キーの復号 — 復号できなければ起動しない', () => {
  it('鍵ファイルが無ければ送出する', () => {
    assert.throws(
      () => loadConfig(envFor(sealed.env, join(root, 'nonexistent', '.env.keys'))),
      ConfigError,
    );
  });

  it('別の鍵ペアでは送出する（黙って暗号文を返さない）', async () => {
    const otherRoot = makeRoot();
    const other = await seal(otherRoot, 'different-value');

    assert.throws(() => loadConfig(envFor(sealed.env, other.keys)), ConfigError);
  });

  it('鍵ファイルを退避すると送出する', () => {
    const moved = `${sealed.keys}.bak`;
    renameSync(sealed.keys, moved);
    try {
      assert.throws(() => loadConfig(envFor(sealed.env, sealed.keys)), ConfigError);
    } finally {
      renameSync(moved, sealed.keys);
    }
  });

  it('パスが無ければ送出する', () => {
    const { BACKLOG_ENV_FILE: _f, ...noFile } = envFor(sealed.env, sealed.keys);
    const { BACKLOG_ENV_KEYS_FILE: _k, ...noKeys } = envFor(sealed.env, sealed.keys);

    assert.throws(() => loadConfig(noFile), ConfigError);
    assert.throws(() => loadConfig(noKeys), ConfigError);
  });

  it('.env に BACKLOG_API_KEY が無ければ送出する', () => {
    const emptyRoot = makeRoot();
    const envFile = join(emptyRoot, '.env');
    writeFileSync(envFile, 'OTHER=1\n');

    assert.throws(() => loadConfig(envFor(envFile, sealed.keys)), ConfigError);
  });
});

describe('API キーの復号 — 失敗しても値を漏らさない', () => {
  it('エラーのメッセージに鍵も暗号文も載らない', async () => {
    const otherRoot = makeRoot();
    const other = await seal(otherRoot, 'different-value');
    const ciphertext = readFileSync(sealed.env, 'utf8');

    try {
      loadConfig(envFor(sealed.env, other.keys));
      assert.fail('復号できてはいけない');
    } catch (e) {
      assert.ok(e instanceof ConfigError);
      // cause まで辿っても値が出ないこと
      const dumped = `${e.message} ${e.cause instanceof Error ? e.cause.message : ''}`;
      assert.doesNotMatch(dumped, new RegExp(API_KEY));
      assert.doesNotMatch(dumped, /encrypted:/);
      assert.ok(!ciphertext.includes(dumped));
    }
  });
});
