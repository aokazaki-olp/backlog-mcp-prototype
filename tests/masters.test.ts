import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MasterDataError } from '../src/contract.ts';
import {
  lookupName,
  projectMastersOf,
  resolveMasters,
  toProjectId,
  toProjectIds,
} from '../src/domain/masters.ts';
import type { ResolvedRequest } from '../src/contract.ts';
import type { BacklogGateway } from '../src/domain/gateway.ts';

/**
 * プロジェクト単位のマスタは**許可プロジェクト全部**について引かれるので、個別に定義して
 * いないプロジェクトにも当たり障りのない応答を返す。ここを検証したいテストは
 * `responses` 側で上書きする。
 */
const PROJECT_MASTER_FALLBACK =
  /^\/projects\/\d+\/(issueTypes|statuses|categories|versions|users)$/;

const fallbackFor = (endpoint: string): unknown => {
  if (endpoint.endsWith('/issueTypes')) {
    return [{ id: 1, name: 'タスク' }];
  }
  if (endpoint.endsWith('/statuses')) {
    return [{ id: 1, name: '未対応' }];
  }
  if (endpoint.endsWith('/users')) {
    return [{ id: 1, userId: 'admin', name: '管理者' }];
  }
  return [];
};

/** 呼び出しを記録するだけの gateway。Transport より上の層で差し替える。 */
const makeFetcher = (
  responses: Record<string, unknown>,
): BacklogGateway & { readonly calls: ResolvedRequest[] } => {
  const calls: ResolvedRequest[] = [];
  return {
    calls,
    send(request) {
      calls.push(request);
      if (!(request.endpoint in responses)) {
        if (PROJECT_MASTER_FALLBACK.test(request.endpoint)) {
          return Promise.resolve(fallbackFor(request.endpoint));
        }
        return Promise.reject(new Error(`未定義のエンドポイント: ${request.endpoint}`));
      }
      return Promise.resolve(responses[request.endpoint]);
    },
  };
};

const okResponses = {
  '/projects': [
    { id: 151, projectKey: 'PROJ', name: 'プロジェクト' },
    { id: 152, projectKey: 'SALES', name: '営業' },
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

    const masters = await resolveMasters(fetcher, ['PROJ', 'SALES']);

    assert.deepEqual(
      [...masters.projectIds],
      [
        ['PROJ', 151],
        ['SALES', 152],
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
    assert.equal(projectsCall.method, 'GET');
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
    const masters = await resolveMasters(makeFetcher(okResponses), ['PROJ', 'SALES']);

    assert.equal(toProjectId(masters, 'PROJ'), 151);
    assert.deepEqual(toProjectIds(masters, ['SALES', 'PROJ']), [152, 151]);
  });

  it('未解決のキーは送出する（スペースに存在しても許可されていなければ通さない）', async () => {
    const masters = await resolveMasters(makeFetcher(okResponses), ['PROJ']);

    assert.throws(() => toProjectId(masters, 'OTHER'), MasterDataError);
    assert.throws(() => toProjectIds(masters, ['PROJ', 'OTHER']), MasterDataError);
  });
});

// ============================================================================
// プロジェクト単位のマスタ — 書き込みを許したプロジェクトだけ引く
// ============================================================================

const projectMasterResponses = {
  ...okResponses,
  '/projects/151/issueTypes': [
    { id: 1, projectId: 151, name: 'バグ' },
    { id: 2, projectId: 151, name: 'タスク' },
  ],
  '/projects/151/statuses': [
    { id: 1, projectId: 151, name: '未対応' },
    { id: 3, projectId: 151, name: '処理中' },
  ],
  '/projects/151/categories': [{ id: 12, projectId: 151, name: '開発' }],
  '/projects/151/versions': [{ id: 3, projectId: 151, name: 'いますぐ' }],
  '/projects/151/users': [
    { id: 1, userId: 'admin', name: '管理者', mailAddress: 'admin@example.test' },
    { id: 7, userId: 'yamada', name: '山田太郎', mailAddress: 'yamada@example.test' },
  ],
};

describe('resolveMasters — プロジェクト単位のマスタ', () => {
  it('許可されたプロジェクト全部を引く（read だけのものも含む）', async () => {
    const fetcher = makeFetcher(projectMasterResponses);

    const masters = await resolveMasters(fetcher, ['PROJ', 'SALES']);

    assert.deepEqual([...masters.perProject.keys()].toSorted(), ['PROJ', 'SALES']);
    // SALES（152）も引いている。名前で絞る検索は read の操作なので書き込みで切り分けない
    assert.equal(
      fetcher.calls.some(call => call.endpoint.startsWith('/projects/152/')),
      true,
    );
  });

  it('名前 → ID が引ける', async () => {
    const masters = await resolveMasters(makeFetcher(projectMasterResponses), ['PROJ']);
    const project = projectMastersOf(masters, 'PROJ');

    assert.equal(project.issueTypeIds.get('バグ'), 1);
    assert.equal(project.statusIds.get('処理中'), 3);
    assert.equal(project.categoryIds.get('開発'), 12);
    assert.equal(project.versionIds.get('いますぐ'), 3);
  });

  it('担当者は表示名でもログイン名でも引ける', async () => {
    const masters = await resolveMasters(makeFetcher(projectMasterResponses), ['PROJ']);
    const project = projectMastersOf(masters, 'PROJ');

    assert.equal(project.userIds.get('山田太郎'), 7);
    assert.equal(project.userIds.get('yamada'), 7);
    assert.equal(project.ambiguousUserNames.size, 0);
  });

  it('同名のユーザーがいたら表示名では引けなくする（別人に割り当てない）', async () => {
    const masters = await resolveMasters(
      makeFetcher({
        ...projectMasterResponses,
        '/projects/151/users': [
          { id: 7, userId: 'yamada', name: '山田太郎' },
          { id: 8, userId: 'yamada2', name: '山田太郎' },
        ],
      }),
      ['PROJ'],
    );
    const project = projectMastersOf(masters, 'PROJ');

    assert.equal(project.userIds.get('山田太郎'), undefined);
    assert.equal(project.ambiguousUserNames.has('山田太郎'), true);
    // ログイン名は一意なので引ける
    assert.equal(project.userIds.get('yamada'), 7);
    assert.equal(project.userIds.get('yamada2'), 8);
  });

  it('カテゴリーとバージョンは空でも起動する（定義していないプロジェクトがある）', async () => {
    const masters = await resolveMasters(
      makeFetcher({
        ...projectMasterResponses,
        '/projects/151/categories': [],
        '/projects/151/versions': [],
      }),
      ['PROJ'],
    );
    const project = projectMastersOf(masters, 'PROJ');

    assert.equal(project.categoryIds.size, 0);
    assert.equal(project.versionIds.size, 0);
  });

  it('種別が空なら起動しない（応答の形を疑う）', async () => {
    await assert.rejects(
      () =>
        resolveMasters(makeFetcher({ ...projectMasterResponses, '/projects/151/issueTypes': [] }), [
          'PROJ',
        ]),
      MasterDataError,
    );
  });

  it('引いていないプロジェクトのマスタを求めたら送出する', async () => {
    const masters = await resolveMasters(makeFetcher(projectMasterResponses), ['PROJ']);

    assert.throws(() => projectMastersOf(masters, 'SALES'), MasterDataError);
  });
});

describe('lookupName', () => {
  it('引けなければ送出し、選べる名前を挙げる（既定に落とさない）', () => {
    const map = new Map([
      ['バグ', 1],
      ['タスク', 2],
    ]);

    assert.equal(lookupName(map, 'バグ', '課題種別'), 1);
    assert.throws(() => lookupName(map, '存在しない', '課題種別'), /バグ \/ タスク/);
  });

  it('定義が無いときは「定義がありません」と言う', () => {
    assert.throws(
      () => lookupName(new Map<string, number>(), 'なにか', 'カテゴリー'),
      /定義がありません/,
    );
  });
});
