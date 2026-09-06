import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigError } from '../src/contract.ts';
import { describeConfig, loadConfig as loadConfigReal } from '../src/config.ts';

const API_KEY = 'secret-key-value';

const base = {
  BACKLOG_SPACE_ID: 'example',
  BACKLOG_POLICY: './backlog-policy.json',
};

/**
 * 復号だけ差し替える（規約 §7 の依存注入）。
 *
 * この節が見たいのは URL の組み立て・spaceId の検証・readOnly であって、
 * 復号ではない。**復号そのものは `tests/apiKey.test.ts` が実ファイルで確かめる。**
 */
const loadConfig = (env: NodeJS.ProcessEnv): ReturnType<typeof loadConfigReal> =>
  loadConfigReal(env, { resolveApiKey: () => API_KEY });

describe('loadConfig — baseUrl は受け取らず組み立てる', () => {
  it('既定ドメインで組み立てる', () => {
    const config = loadConfig({ ...base });

    assert.equal(config.baseUrl, 'https://example.backlog.jp');
    assert.equal(config.domain, 'backlog.jp');
  });

  it('ドメインを切り替えられる', () => {
    for (const domain of ['backlog.jp', 'backlog.com', 'backlogtool.com']) {
      const config = loadConfig({ ...base, BACKLOG_DOMAIN: domain });
      assert.equal(config.baseUrl, `https://example.${domain}`);
    }
  });

  it('組み立てた URL は常に https で、パスを持たない', () => {
    const config = loadConfig({ ...base, BACKLOG_SPACE_ID: 'a-b-9' });
    const url = new URL(config.baseUrl);

    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'a-b-9.backlog.jp');
    assert.equal(url.pathname, '/');
    assert.equal(url.username, '');
    assert.equal(url.port, '');
  });
});

describe('loadConfig — spaceId に URL を混ぜられない', () => {
  const rejects = (spaceId: string): void => {
    assert.throws(
      () => loadConfig({ ...base, BACKLOG_SPACE_ID: spaceId }),
      ConfigError,
      `拒否されるべき: ${JSON.stringify(spaceId)}`,
    );
  };

  it('スキームつきを弾く', () => {
    rejects('https://evil.example');
    rejects('http://evil.example');
  });

  it('ホストの差し替えを弾く', () => {
    rejects('example.backlog.jp');
    rejects('evil.example');
    rejects('example.backlog.jp.evil.example');
  });

  it('パス・クエリの注入を弾く', () => {
    rejects('example/../evil');
    rejects('example/api/v2');
    rejects('example?x=1');
    rejects('example#f');
  });

  it('資格情報・ポートの注入を弾く', () => {
    rejects('user:pass@evil.example');
    rejects('example:8080');
  });

  it('DNS ラベルとして不正なものを弾く', () => {
    rejects('');
    rejects('Example');
    rejects('-example');
    rejects('example-');
    rejects('例');
    rejects('exa mple');
    rejects('exa_mple');
  });

  it('正当なスペースIDは通る', () => {
    for (const spaceId of ['a', 'ab', 'example', 'my-space', 'x1', '123']) {
      const config = loadConfig({ ...base, BACKLOG_SPACE_ID: spaceId });
      assert.equal(new URL(config.baseUrl).hostname, `${spaceId}.backlog.jp`);
    }
  });
});

describe('loadConfig — fail-closed', () => {
  it('必須の環境変数が無ければ送出する', () => {
    assert.throws(() => loadConfig({}), ConfigError);
    // スペースIDだけ / ポリシーだけ、のどちらでも起動しない
    assert.throws(() => loadConfig({ BACKLOG_SPACE_ID: 'example' }), ConfigError);
    assert.throws(() => loadConfig({ BACKLOG_POLICY: './p.json' }), ConfigError);
  });

  it('鍵ファイルのパスが無ければ送出する（復号を差し替えない実物）', () => {
    assert.throws(() => loadConfigReal({ ...base }), ConfigError);
    assert.throws(() => loadConfigReal({ ...base, BACKLOG_ENV_FILE: './.env' }), ConfigError);
  });

  it('空文字は未設定として扱う', () => {
    assert.throws(() => loadConfig({ ...base, BACKLOG_SPACE_ID: '' }), ConfigError);
  });

  it('平文の BACKLOG_API_KEY を渡しても使われない（暗号化したつもりで平文、を作れない）', () => {
    assert.throws(
      () =>
        loadConfigReal({
          ...base,
          BACKLOG_API_KEY: 'plain-text-key',
        }),
      ConfigError,
    );
  });

  it('未知のドメインは既定へ落とさず送出する', () => {
    assert.throws(() => loadConfig({ ...base, BACKLOG_DOMAIN: 'backlog.co.jp' }), ConfigError);
    assert.throws(() => loadConfig({ ...base, BACKLOG_DOMAIN: 'evil.example' }), ConfigError);
  });
});

describe('loadConfig — readOnly', () => {
  it('1 と true で有効になる', () => {
    assert.equal(loadConfig({ ...base, BACKLOG_READ_ONLY: '1' }).readOnly, true);
    assert.equal(loadConfig({ ...base, BACKLOG_READ_ONLY: 'true' }).readOnly, true);
  });

  it('未指定・それ以外は無効', () => {
    assert.equal(loadConfig({ ...base }).readOnly, false);
    assert.equal(loadConfig({ ...base, BACKLOG_READ_ONLY: '0' }).readOnly, false);
    assert.equal(loadConfig({ ...base, BACKLOG_READ_ONLY: 'yes' }).readOnly, false);
  });
});

describe('API キーが露出しない', () => {
  it('describeConfig に含まれない', () => {
    const config = loadConfig({ ...base });

    assert.doesNotMatch(describeConfig(config), /secret-key-value/);
  });

  it('検証エラーのメッセージに値が載らない', () => {
    const attempts: Record<string, string>[] = [
      { ...base, BACKLOG_SPACE_ID: 'https://secret-key-value.example' },
      { ...base, BACKLOG_DOMAIN: 'secret-key-value' },
    ];

    for (const env of attempts) {
      try {
        loadConfig(env);
        assert.fail('送出されるべき');
      } catch (e) {
        assert.ok(e instanceof ConfigError);
        assert.doesNotMatch(e.message, /secret-key-value/);
      }
    }
  });
});

describe('loadConfig — ダウンロード先は重ねられない', () => {
  const withDirs = (extra: Record<string, string>): NodeJS.ProcessEnv => ({
    ...base,
    BACKLOG_POLICY: '/work/backlog-policy.json',
    ...extra,
  });

  it('未設定なら null（バイナリの口だけが閉じる）', () => {
    assert.equal(loadConfig(withDirs({})).downloadsDir, null);
    // 既定を置かない。OS 既定のダウンロードフォルダを推測しない
    assert.equal(loadConfig(withDirs({ BACKLOG_DOWNLOADS_DIR: '' })).downloadsDir, null);
  });

  it('相対指定はポリシーのディレクトリから解決する', () => {
    const config = loadConfig(withDirs({ BACKLOG_DOWNLOADS_DIR: 'downloads' }));

    assert.equal(config.downloadsDir, '/work/downloads');
  });

  it('添付の読み取りルートと重なったら起動しない', () => {
    // ブラウザが落とした任意のファイルを Backlog へ上げられる経路になる
    const overlaps: readonly (readonly [string, string])[] = [
      ['/work/files', '/work/files'],
      ['/work/files', '/work/files/sub'],
      ['/work/files/sub', '/work/files'],
    ];
    for (const [attachments, downloads] of overlaps) {
      assert.throws(
        () =>
          loadConfig(
            withDirs({
              BACKLOG_ATTACHMENTS_ROOT: attachments,
              BACKLOG_DOWNLOADS_DIR: downloads,
            }),
          ),
        ConfigError,
        `${attachments} と ${downloads}`,
      );
    }
  });

  it('監査ログの出力先と重なったら起動しない', () => {
    assert.throws(
      () =>
        loadConfig(
          withDirs({ BACKLOG_LOG_DIR: '/work/logs', BACKLOG_DOWNLOADS_DIR: '/work/logs/dl' }),
        ),
      ConfigError,
    );
  });

  it('設定ファイルそのものと重なったら起動しない', () => {
    assert.throws(
      () => loadConfig(withDirs({ BACKLOG_DOWNLOADS_DIR: '/work/backlog-policy.json' })),
      ConfigError,
    );
  });

  it('重なっていなければ通る', () => {
    const config = loadConfig(
      withDirs({ BACKLOG_ATTACHMENTS_ROOT: '/work/files', BACKLOG_DOWNLOADS_DIR: '/work/dl' }),
    );

    assert.equal(config.downloadsDir, '/work/dl');
    assert.equal(config.attachmentsRoot, '/work/files');
  });
});
