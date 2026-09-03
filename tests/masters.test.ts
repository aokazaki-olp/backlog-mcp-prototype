import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MasterDataError } from '../src/contract.ts';
import { resolveMasters, toProjectId, toProjectIds } from '../src/domain/masters.ts';
import type { MasterFetcher } from '../src/domain/masters.ts';

interface Call {
  readonly endpoint: string;
  readonly query: Record<string, unknown> | undefined;
}

/** 呼び出しを記録するだけの fetcher。Transport より上の層で差し替える。 */
const makeFetcher = (
  responses: Record<string, unknown>,
): MasterFetcher & { readonly calls: Call[] } => {
  const calls: Call[] = [];
  return {
    calls,
    get(endpoint, query) {
      calls.push({ endpoint, query });
      if (!(endpoint in responses)) {
        return Promise.reject(new Error(`未定義のエンドポイント: ${endpoint}`));
      }
      return Promise.resolve(responses[endpoint]);
    },
  };
};

const okResponses = {
  '/projects': [
    { id: 151, projectKey: 'PROJ', name: 'プロジェクト' },
    { id: 152, projectKey: 'DOCS', name: 'ドキュメント' },
    { id: 999, projectKey: 'OTHER', name: '別プロジェクト' },
  ],
  '/priorities': [
    { id: 2, name: '高' },
    { id: 3, name: '中' },
    { id: 4, name: '低' },
  ],
  '/resolutions': [
    { id: 0, name: '対応済み' },
    { id: 1, name: '対応しない' },
  ],
  '/users/myself': { id: 42, userId: 'admin', name: 'admin' },
};

describe('resolveMasters', () => {
  it('要求したキーだけを解決する', async () => {
    const fetcher = makeFetcher(okResponses);

    const masters = await resolveMasters(fetcher, ['PROJ', 'DOCS']);

    assert.deepEqual(
      [...masters.projectIds],
      [
        ['PROJ', 151],
        ['DOCS', 152],
      ],
    );
    // 参加していても要求していない OTHER は入らない
    assert.equal(masters.projectIds.has('OTHER'), false);
  });

  it('名前 → ID のマスタを作る', async () => {
    const masters = await resolveMasters(makeFetcher(okResponses), ['PROJ']);

    assert.equal(masters.priorityIds.get('高'), 2);
    assert.equal(masters.resolutionIds.get('対応済み'), 0);
    assert.equal(masters.myUserId, 42);
  });

  it('マスタは実行時にも変更できない', async () => {
    const masters = await resolveMasters(makeFetcher(okResponses), ['PROJ']);

    assert.throws(() => {
      (masters.projectIds as Map<string, number>).set('EVIL', 1);
    }, TypeError);
    assert.throws(() => {
      (masters.priorityIds as Map<string, number>).set('最高', 1);
    }, TypeError);
  });
});

describe('resolveMasters — GET /projects に all=true を送らない', () => {
  it('クエリを一切渡さない', async () => {
    const fetcher = makeFetcher(okResponses);

    await resolveMasters(fetcher, ['PROJ']);

    const projectsCall = fetcher.calls.find(c => c.endpoint === '/projects');
    assert.ok(projectsCall);
    assert.equal(projectsCall.query, undefined);
  });

  it('どの呼び出しにも all が現れない', async () => {
    const fetcher = makeFetcher(okResponses);

    await resolveMasters(fetcher, ['PROJ']);

    for (const call of fetcher.calls) {
      assert.doesNotMatch(JSON.stringify(call.query ?? {}), /all/);
    }
  });
});

describe('resolveMasters — 沈黙の失敗を作らない', () => {
  it('解決できないキーがあれば送出する（黙って落とさない）', async () => {
    const fetcher = makeFetcher(okResponses);

    await assert.rejects(
      () => resolveMasters(fetcher, ['PROJ', 'MISSING']),
      (e: unknown) => {
        assert.ok(e instanceof MasterDataError);
        assert.match(e.message, /MISSING/);
        return true;
      },
    );
  });

  it('キーが空なら送出する', async () => {
    await assert.rejects(() => resolveMasters(makeFetcher(okResponses), []), MasterDataError);
  });
});

describe('resolveMasters — 応答の形を検証する', () => {
  const rejects = async (overrides: Record<string, unknown>): Promise<void> => {
    const fetcher = makeFetcher({ ...okResponses, ...overrides });
    await assert.rejects(() => resolveMasters(fetcher, ['PROJ']), MasterDataError);
  };

  it('配列でない応答を弾く', async () => {
    await rejects({ '/projects': { id: 1 } });
    await rejects({ '/priorities': null });
    await rejects({ '/resolutions': 'x' });
  });

  it('要素の形が違う応答を弾く', async () => {
    await rejects({ '/projects': [{ id: 1 }] });
    await rejects({ '/projects': [{ projectKey: 'PROJ' }] });
    await rejects({ '/priorities': [{ id: 2 }] });
    await rejects({ '/priorities': [{ id: '2', name: '高' }] });
  });

  it('空のマスタを弾く', async () => {
    await rejects({ '/priorities': [] });
    await rejects({ '/resolutions': [] });
  });

  it('id の無い myself を弾く', async () => {
    await rejects({ '/users/myself': { userId: 'admin' } });
    await rejects({ '/users/myself': null });
  });
});

describe('toProjectId / toProjectIds', () => {
  it('解決済みのキーを変換する', async () => {
    const masters = await resolveMasters(makeFetcher(okResponses), ['PROJ', 'DOCS']);

    assert.equal(toProjectId(masters, 'PROJ'), 151);
    assert.deepEqual(toProjectIds(masters, ['DOCS', 'PROJ']), [152, 151]);
  });

  it('未解決のキーは送出する（スペースに存在しても許可されていなければ通さない）', async () => {
    const masters = await resolveMasters(makeFetcher(okResponses), ['PROJ']);

    assert.throws(() => toProjectId(masters, 'OTHER'), MasterDataError);
    assert.throws(() => toProjectIds(masters, ['PROJ', 'OTHER']), MasterDataError);
  });
});
