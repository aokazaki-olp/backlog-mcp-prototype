import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PolicyError } from '../src/contract.ts';
import {
  explainPolicy,
  isAllowed,
  listedTools,
  loadPolicy,
  projectKeysFor,
} from '../src/policy/policy.ts';

describe('loadPolicy — 記法の展開', () => {
  it('文字列で書いたら read になる', () => {
    const policy = loadPolicy({ projects: ['SALES'] });

    assert.equal(isAllowed(policy, 'SALES', 'get_issue'), true);
    assert.equal(isAllowed(policy, 'SALES', 'search_issues'), true);
    assert.equal(isAllowed(policy, 'SALES', 'add_issue_comment'), false);
  });

  it('can: comment で書き込み系が1段だけ開く', () => {
    const policy = loadPolicy({ projects: [{ key: 'PROJ', can: 'comment' }] });

    assert.equal(isAllowed(policy, 'PROJ', 'add_issue_comment'), true);
    assert.equal(isAllowed(policy, 'PROJ', 'get_issue'), true);
  });

  it('toolsets は交差で絞る（広げない）', () => {
    const policy = loadPolicy({
      projects: [{ key: 'INFRA', can: 'write', toolsets: ['git'] }],
    });

    // git の toolset にはまだツールが無いので、can が write でも何も開かない
    assert.equal(isAllowed(policy, 'INFRA', 'get_issue'), false);
    assert.equal(isAllowed(policy, 'INFRA', 'add_issue_comment'), false);
    assert.equal(isAllowed(policy, 'INFRA', 'list_wiki_pages'), false);
  });

  it('プロジェクトごとに can を変えられる', () => {
    const policy = loadPolicy({
      projects: ['SALES', { key: 'PROJ', can: 'comment' }],
    });

    assert.equal(isAllowed(policy, 'PROJ', 'add_issue_comment'), true);
    assert.equal(isAllowed(policy, 'SALES', 'add_issue_comment'), false);
  });

  it('許可していないプロジェクトは常に false', () => {
    const policy = loadPolicy({ projects: [{ key: 'PROJ', can: 'write' }] });

    assert.equal(isAllowed(policy, 'OTHER', 'get_issue'), false);
    assert.equal(isAllowed(policy, '', 'get_issue'), false);
  });
});

describe('loadPolicy — fail-closed', () => {
  const rejects = (source: unknown, hint: string): void => {
    assert.throws(() => loadPolicy(source), PolicyError, hint);
  };

  it('projects が無ければ送出する', () => {
    rejects({}, 'projects 必須');
  });

  it('projects が空配列なら送出する（ワイルドカードは無い）', () => {
    rejects({ projects: [] }, '空の projects');
  });

  it('未知の can（タイポ）は既定へ落とさず送出する', () => {
    rejects({ projects: [{ key: 'PROJ', can: 'wirte' }] }, 'can のタイポ');
  });

  it('未知の toolset は送出する', () => {
    rejects({ projects: [{ key: 'PROJ', toolsets: ['issues'] }] }, 'toolset のタイポ');
  });

  it('未知の項目は送出する', () => {
    rejects({ projects: [{ key: 'PROJ', cans: 'write' }] }, 'エントリの未知項目');
    rejects({ projects: ['PROJ'], allow: '*' }, 'トップレベルの未知項目');
  });

  it('プロジェクトキーの形式を検証する', () => {
    rejects({ projects: ['proj'] }, '小文字');
    rejects({ projects: ['PROJ-1'] }, 'ハイフン');
    rejects({ projects: ['*'] }, 'ワイルドカードらしき文字列');
    rejects({ projects: [''] }, '空文字');
  });

  it('重複したプロジェクトキーは送出する', () => {
    rejects({ projects: ['PROJ', { key: 'PROJ', can: 'write' }] }, '重複');
  });

  it('オブジェクトでも配列でもないものを弾く', () => {
    rejects(null, 'null');
    rejects([], '配列');
    rejects('PROJ', '文字列');
    rejects({ projects: [42] }, '数値エントリ');
  });
});

describe('loadPolicy — readOnly の上書き', () => {
  it('全プロジェクトを read に切り下げる', () => {
    const source = {
      projects: [
        { key: 'PROJ', can: 'write' },
        { key: 'SALES', can: 'comment' },
      ],
    };

    const normal = loadPolicy(source);
    const readOnly = loadPolicy(source, { readOnly: true });

    assert.equal(isAllowed(normal, 'PROJ', 'add_issue_comment'), true);
    assert.equal(isAllowed(readOnly, 'PROJ', 'add_issue_comment'), false);
    assert.equal(isAllowed(readOnly, 'SALES', 'add_issue_comment'), false);
  });

  it('読み取りは残る（絞る方向にしか効かない）', () => {
    const policy = loadPolicy({ projects: [{ key: 'PROJ', can: 'write' }] }, { readOnly: true });

    assert.equal(isAllowed(policy, 'PROJ', 'get_issue'), true);
    assert.equal(isAllowed(policy, 'PROJ', 'search_issues'), true);
  });
});

describe('正規形', () => {
  it('書き方が違っても権限が同じならハッシュが同じ', () => {
    const written = loadPolicy({ projects: ['SALES'] });
    const explicit = loadPolicy({
      projects: [
        {
          key: 'SALES',
          can: 'read',
          toolsets: ['issue', 'wiki', 'document', 'git', 'notification', 'activity'],
        },
      ],
    });

    assert.equal(written.hash, explicit.hash);
  });

  it('権限が変わればハッシュが変わる', () => {
    const a = loadPolicy({ projects: [{ key: 'PROJ', can: 'read' }] });
    const b = loadPolicy({ projects: [{ key: 'PROJ', can: 'comment' }] });

    assert.notEqual(a.hash, b.hash);
  });

  it('列挙順が違ってもハッシュは同じ', () => {
    const a = loadPolicy({ projects: ['AAA', 'BBB'] });
    const b = loadPolicy({ projects: ['BBB', 'AAA'] });

    assert.equal(a.hash, b.hash);
  });

  it('実行時にも変更できない', () => {
    const policy = loadPolicy({ projects: ['SALES'] });

    assert.throws(() => {
      (policy.scopes as Map<string, Set<string>>).set('EVIL', new Set(['add_issue_comment']));
    }, TypeError);

    const tools = policy.scopes.get('SALES');
    assert.ok(tools);
    assert.throws(() => {
      (tools as Set<string>).add('add_issue_comment');
    }, TypeError);

    assert.equal(isAllowed(policy, 'EVIL', 'add_issue_comment'), false);
    assert.equal(isAllowed(policy, 'SALES', 'add_issue_comment'), false);
  });
});

describe('tools/list とハンドラが同じ集合を見る', () => {
  it('listedTools はいずれかのプロジェクトで許可されたものだけ', () => {
    const policy = loadPolicy({ projects: ['SALES', { key: 'PROJ', can: 'comment' }] });

    const listed = listedTools(policy);
    assert.equal(listed.has('add_issue_comment'), true);
    assert.equal(listed.has('get_issue'), true);
  });

  it('read だけなら書き込みツールは一覧に出ない', () => {
    const policy = loadPolicy({ projects: ['SALES'] });

    assert.equal(listedTools(policy).has('add_issue_comment'), false);
  });

  it('projectKeysFor は上書き用のプロジェクト集合を決定的に返す', () => {
    const policy = loadPolicy({
      projects: ['ZZZ', 'AAA', { key: 'MMM', can: 'comment' }],
    });

    assert.deepEqual(projectKeysFor(policy, 'search_issues'), ['AAA', 'MMM', 'ZZZ']);
    assert.deepEqual(projectKeysFor(policy, 'add_issue_comment'), ['MMM']);
  });
});

describe('explainPolicy', () => {
  it('ハッシュとプロジェクトごとの許可を出す', () => {
    const policy = loadPolicy({ projects: ['SALES'] });
    const text = explainPolicy(policy);

    assert.match(text, /policy hash=[0-9a-f]{16}/);
    assert.match(text, /SALES: /);
  });
});
