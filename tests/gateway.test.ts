import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBacklogGateway } from '../src/domain/backlogGateway.ts';
import { resolveMasters } from '../src/domain/masters.ts';
import type { ServerConfig } from '../src/contract.ts';
import type { FetchOptions, RawResponse, Transport } from '../src/libs/httpTypes.js';

/**
 * `send` のモックより1段下 —— **実際に出ていく HTTP の形**を見る。
 *
 * ここまで降りないと、URL・メソッド・ヘッダ・ボディの形は誰も見ていないことになる。
 * 借り物のクライアント自体は上流（`libraries`）でテスト済みなので、ここで確かめるのは
 * **うちが組み立てた `ResolvedRequest` がどう渡るか**。
 */

interface Call {
  readonly url: string;
  readonly options: FetchOptions | undefined;
}

const CONFIG: ServerConfig = {
  spaceId: 'example',
  domain: 'backlog.jp',
  baseUrl: 'https://example.backlog.jp',
  apiKey: 'secret-key-value',
  policyPath: '/dev/null',
  logDir: '/dev/null',
  readOnly: false,
};

/** 記録するだけの Transport。応答は固定。 */
const makeTransport = (body: unknown = {}): Transport & { readonly calls: Call[] } => {
  const calls: Call[] = [];
  return {
    calls,
    fetch(url, options): Promise<RawResponse> {
      calls.push({ url, options });
      return Promise.resolve({ status: 200, headers: {}, body, text: '' });
    },
  };
};

describe('createBacklogGateway — URL', () => {
  it('組み立てた baseUrl に /api/v2 が付く', async () => {
    const transport = makeTransport();

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues/PROJ-1',
      method: 'GET',
    });

    assert.equal(transport.calls[0]?.url, 'https://example.backlog.jp/api/v2/issues/PROJ-1');
  });

  it('クエリの配列は同じキーを繰り返して並ぶ', async () => {
    const transport = makeTransport([]);

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues',
      method: 'GET',
      query: { 'projectId[]': [102, 103], count: 20 },
    });

    assert.equal(
      transport.calls[0]?.url,
      'https://example.backlog.jp/api/v2/issues?projectId%5B%5D=102&projectId%5B%5D=103&count=20',
    );
  });
});

describe('GET /projects に all=true を送らない', () => {
  it('URL にクエリ文字列が一切付かない', async () => {
    const transport = makeTransport();
    const gateway = createBacklogGateway(CONFIG, { transport });

    await gateway.send({ endpoint: '/projects', method: 'GET' });

    // 「all を false で送る」ではなく「? そのものが無い」
    assert.equal(transport.calls[0]?.url, 'https://example.backlog.jp/api/v2/projects');
  });

  it('起動時のマスタ解決を通しても付かない', async () => {
    const transport = makeTransport();
    // マスタ解決は4本叩くので、エンドポイントごとに応答を出し分ける
    const responses: Record<string, unknown> = {
      '/api/v2/projects': [{ id: 101, projectKey: 'PROJ' }],
      '/api/v2/priorities': [{ id: 2, name: '高' }],
      '/api/v2/resolutions': [{ id: 0, name: '対応済み' }],
      '/api/v2/users/myself': { id: 42 },
    };
    const routing: Transport & { readonly calls: Call[] } = {
      calls: transport.calls,
      fetch(url, options): Promise<RawResponse> {
        transport.calls.push({ url, options });
        const path = new URL(url).pathname;
        return Promise.resolve({ status: 200, headers: {}, body: responses[path], text: '' });
      },
    };

    await resolveMasters(createBacklogGateway(CONFIG, { transport: routing }), ['PROJ']);

    for (const call of routing.calls) {
      assert.doesNotMatch(call.url, /\?/);
      assert.doesNotMatch(call.url, /all/);
    }
  });
});

describe('createBacklogGateway — メソッドとボディ', () => {
  it('POST は form をスカラーの payload として渡す（urlencoded の経路）', async () => {
    const transport = makeTransport();

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues/PROJ-1/comments',
      method: 'POST',
      form: { content: 'コメント本文' },
    });

    const call = transport.calls[0];
    assert.equal(call?.options?.method, 'POST');
    // 文字列ではなくオブジェクト。got 側で form-urlencoded になる分岐に入る
    assert.deepEqual(call.options.payload, { content: 'コメント本文' });
  });

  it('POST でも URL にボディが混ざらない', async () => {
    const transport = makeTransport();

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues/PROJ-1/comments',
      method: 'POST',
      form: { content: 'コメント本文' },
    });

    assert.equal(
      transport.calls[0]?.url,
      'https://example.backlog.jp/api/v2/issues/PROJ-1/comments',
    );
  });

  it('PATCH も通る（ツールはまだ無いが口は開いている）', async () => {
    const transport = makeTransport();

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues/PROJ-1',
      method: 'PATCH',
      form: { summary: '新しい件名' },
    });

    const call = transport.calls[0];
    assert.equal(call?.options?.method, 'PATCH');
    assert.deepEqual(call.options.payload, { summary: '新しい件名' });
  });

  it('ファイルパートは付かない（添付は次段階）', async () => {
    const transport = makeTransport();

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues/PROJ-1/comments',
      method: 'POST',
      form: { content: 'x' },
    });

    assert.equal(transport.calls[0]?.options?.files, undefined);
  });
});

describe('createBacklogGateway — 認証ヘッダ', () => {
  it('Backlog-API-Key ヘッダに載る（クエリパラメータではない）', async () => {
    const transport = makeTransport();

    await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/projects',
      method: 'GET',
    });

    const call = transport.calls[0];
    assert.equal(call?.options?.headers?.['Backlog-API-Key'], 'secret-key-value');
    assert.doesNotMatch(call.url, /secret-key-value/);
  });
});

describe('createBacklogGateway — 応答', () => {
  it('body だけを返す（status も headers も上の層に渡さない）', async () => {
    const transport = makeTransport({ issueKey: 'PROJ-1' });

    const result = await createBacklogGateway(CONFIG, { transport }).send({
      endpoint: '/issues/PROJ-1',
      method: 'GET',
    });

    assert.deepEqual(result, { issueKey: 'PROJ-1' });
  });
});
