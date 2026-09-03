import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigError } from '../src/contract.ts';
import { describeConfig, loadConfig } from '../src/config.ts';

const base = {
  BACKLOG_SPACE_ID: 'example',
  BACKLOG_API_KEY: 'secret-key-value',
  BACKLOG_POLICY: './backlog-policy.json',
};

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
    assert.throws(
      () => loadConfig({ BACKLOG_SPACE_ID: 'example', BACKLOG_POLICY: './p.json' }),
      ConfigError,
    );
    assert.throws(
      () => loadConfig({ BACKLOG_SPACE_ID: 'example', BACKLOG_API_KEY: 'k' }),
      ConfigError,
    );
  });

  it('空文字は未設定として扱う', () => {
    assert.throws(() => loadConfig({ ...base, BACKLOG_API_KEY: '' }), ConfigError);
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
