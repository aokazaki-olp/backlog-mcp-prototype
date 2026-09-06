import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { HttpError } from '../src/libs/httpTypes.js';
import { runServer } from '../src/server.ts';
import type { RawResponse, Transport } from '../src/libs/httpTypes.js';

/**
 * **サーバ1本を丸ごと動かす。**
 *
 * 各層は個別にテスト済みだが、`createHandlers` → `buildHandlers` → `serve` の**配線**は
 * どこも見ていなかった（実スペースに繋がないと成功経路が走らないため）。偽 Transport を
 * 差し込んで、env の読み取りからツールの応答・監査ログまでを1本で確かめる。
 *
 * これが通れば、**実接続で初めて分かるのは「Backlog の応答の形」だけ**になる。
 */

const MASTER_RESPONSES: Record<string, unknown> = {
  '/api/v2/projects': [
    { id: 101, projectKey: 'PROJ' },
    { id: 102, projectKey: 'SALES' },
  ],
  '/api/v2/priorities': [{ id: 2, name: '高' }],
  '/api/v2/resolutions': [{ id: 0, name: '対応済み' }],
  '/api/v2/users/myself': { id: 42 },
  '/api/v2/wikis': [{ id: 112, projectId: 101, name: 'Home' }],
  '/api/v2/wikis/112': {
    id: 112,
    projectId: 101,
    name: 'Home',
    content: 'Wiki の本文。ここも第三者が書ける',
  },
  '/api/v2/projects/101/issueTypes': [
    { id: 1, name: 'バグ' },
    { id: 2, name: 'タスク' },
  ],
  '/api/v2/projects/101/statuses': [
    { id: 1, name: '未対応' },
    { id: 3, name: '処理中' },
  ],
  '/api/v2/projects/101/categories': [],
  '/api/v2/projects/101/versions': [],
  '/api/v2/projects/101/users': [{ id: 7, userId: 'yamada', name: '山田太郎' }],
  '/api/v2/documents': [
    {
      id: 'abc',
      projectId: 101,
      title: '設計メモ',
      plain: '本文',
      createdUser: { id: 1, name: 'u' },
    },
  ],
  '/api/v2/projects/101/activities': [
    {
      id: 1,
      type: 2,
      content: { key_id: 5, summary: 'コメント' },
      createdUser: { id: 1, name: 'u' },
    },
  ],
  '/api/v2/space/attachment': { id: 4242, name: 'review.md', size: 3 },
  '/api/v2/issues': { id: 778, issueKey: 'PROJ-2', summary: '新しい課題' },
  '/api/v2/issues/PROJ-1/comments': { id: 9, created: '2026-09-06T00:00:00Z' },
  '/api/v2/projects/101/git/repositories/app/pullRequests/7/comments': {
    id: 1,
    created: '2026-09-06T00:00:00Z',
  },
  '/api/v2/issues/PROJ-1': {
    id: 777,
    projectId: 101,
    issueKey: 'PROJ-1',
    summary: 'ある課題',
    status: { id: 3, name: '処理中' },
    description: 'ここは第三者が書いた本文',
  },
};

const makeTransport = (): Transport & { readonly urls: string[] } => {
  const urls: string[] = [];
  return {
    urls,
    fetch(url): Promise<RawResponse> {
      urls.push(url);
      const path = new URL(url).pathname;
      if (!(path in MASTER_RESPONSES)) {
        return Promise.reject(
          new HttpError('HTTPエラー 404', 404, { message: 'not found' }, {}, ''),
        );
      }
      return Promise.resolve({ status: 200, headers: {}, body: MASTER_RESPONSES[path], text: '' });
    },
  };
};

interface Run {
  readonly written: string[];
  readonly urls: string[];
  readonly logDir: string;
}

/** env を組み立て、行を流し込み、書き出された行と監査ログを返す。 */
const run = async (
  lines: readonly string[],
  policy: unknown = { projects: ['PROJ'] },
  attachments?: Readonly<Record<string, string>>,
): Promise<Run> => {
  const root = mkdtempSync(join(tmpdir(), 'backlog-mcp-e2e-'));
  const policyPath = join(root, 'backlog-policy.json');
  writeFileSync(policyPath, JSON.stringify(policy));

  // 添付はモックにしない。実ファイルを置いて readAttachment を通す
  const attachmentsRoot = join(root, 'files');
  if (attachments !== undefined) {
    mkdirSync(attachmentsRoot, { recursive: true });
    for (const [name, body] of Object.entries(attachments)) {
      writeFileSync(join(attachmentsRoot, name), body);
    }
  }

  const transport = makeTransport();
  const written: string[] = [];

  await runServer(
    {
      input: Readable.from(lines.map(line => `${line}\n`)),
      write(line: string): void {
        written.push(line);
      },
    },
    {
      BACKLOG_SPACE_ID: 'example',

      BACKLOG_POLICY: policyPath,
      ...(attachments === undefined ? {} : { BACKLOG_ATTACHMENTS_ROOT: attachmentsRoot }),
    },
    { gateway: { transport, maxRetries: 0 }, config: { resolveApiKey: () => 'secret-key-value' } },
  );

  return { written, urls: transport.urls, logDir: join(root, 'logs') };
};

const auditLines = (logDir: string): Record<string, unknown>[] => {
  const file = readdirSync(logDir)[0] ?? '';
  return readFileSync(join(logDir, file), 'utf8')
    .trimEnd()
    .split('\n')
    .map(line => JSON.parse(line) as Record<string, unknown>);
};

const request = (id: number, method: string, params?: Record<string, unknown>): string =>
  JSON.stringify({ jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) });

describe('サーバ1本の通し — 初期化からツール呼び出しまで', () => {
  it('initialize → tools/list → tools/call が JSON-RPC で返る', async () => {
    const { written } = await run([
      request(1, 'initialize', { protocolVersion: '2026-07-28' }),
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      request(2, 'tools/list'),
      request(3, 'tools/call', { name: 'get_issue', arguments: { issueKey: 'PROJ-1' } }),
    ]);

    // 通知には応答しないので3件
    assert.equal(written.length, 3);
    for (const line of written) {
      assert.equal((JSON.parse(line) as { jsonrpc: string }).jsonrpc, '2.0');
    }

    const call = JSON.parse(written[2] ?? '{}') as {
      result: { content: { text: string }[]; isError?: boolean };
    };
    assert.equal(call.result.isError, undefined);
    assert.match(call.result.content[0]?.text ?? '', /PROJ-1/);
  });

  it('tools/list の中身がポリシーと一致する（配線が正しい）', async () => {
    const readOnly = await run([request(1, 'tools/list')], { projects: ['PROJ'] });
    const writable = await run([request(1, 'tools/list')], {
      projects: [{ key: 'PROJ', can: 'comment' }],
    });

    const namesOf = (written: string[]): string[] =>
      (
        JSON.parse(written[0] ?? '{}') as { result: { tools: { name: string }[] } }
      ).result.tools.map(t => t.name);

    assert.equal(namesOf(readOnly.written).includes('add_issue_comment'), false);
    assert.equal(namesOf(writable.written).includes('add_issue_comment'), true);
  });

  it('応答の本文は untrusted で囲まれ、数値 ID は落ちている', async () => {
    const { written } = await run([
      request(1, 'tools/call', { name: 'get_issue', arguments: { issueKey: 'PROJ-1' } }),
    ]);
    const text =
      (JSON.parse(written[0] ?? '{}') as { result: { content: { text: string }[] } }).result
        .content[0]?.text ?? '';

    // ツールの応答は JSON 文字列なので、引用符はエスケープされて届く
    assert.match(text, /<untrusted source=/);
    assert.match(text, /backlog:issue:PROJ-1:description/);
    assert.doesNotMatch(text, /777/);
    assert.doesNotMatch(text, /projectId/);
  });

  it('get_wiki_page は一覧 → 本文の2往復で本文まで届く', async () => {
    const { written, urls } = await run([
      request(1, 'tools/call', {
        name: 'get_wiki_page',
        arguments: { projectKey: 'PROJ', name: 'Home' },
      }),
    ]);

    // 起動時のマスタ解決4本のあとに、一覧 → 本文の順で2本
    assert.deepEqual(
      urls.slice(4).map(url => new URL(url).pathname),
      ['/api/v2/wikis', '/api/v2/wikis/112'],
    );

    const text =
      (JSON.parse(written[0] ?? '{}') as { result: { content: { text: string }[] } }).result
        .content[0]?.text ?? '';
    assert.match(text, /backlog:wiki:PROJ:Home:content/);
    assert.match(text, /Wiki の本文/);
  });

  it('2往復でも監査ログのツール呼び出しは1件', async () => {
    const { logDir } = await run([
      request(1, 'tools/call', {
        name: 'get_wiki_page',
        arguments: { projectKey: 'PROJ', name: 'Home' },
      }),
    ]);

    const calls = auditLines(logDir).filter(record => record['event'] === 'tools/call');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.['ok'], true);
  });

  it('許可外のプロジェクトは API に到達しない', async () => {
    const { written, urls } = await run([
      request(1, 'tools/call', { name: 'get_issue', arguments: { issueKey: 'OTHER-1' } }),
    ]);

    const result = (JSON.parse(written[0] ?? '{}') as { result: { isError?: boolean } }).result;
    assert.equal(result.isError, true);
    // 起動時のマスタ解決4本だけ。ツール由来の呼び出しは1件も出ていない
    assert.equal(urls.length, 4);
    assert.equal(
      urls.some(url => url.includes('OTHER')),
      false,
    );
  });

  it('書き出した行に JSON-RPC 以外が混ざらない', async () => {
    const { written } = await run([
      request(1, 'initialize'),
      '',
      'これは JSON ではない',
      request(2, 'ping'),
    ]);

    for (const line of written) {
      assert.doesNotMatch(line, /\n/);
      assert.ok(JSON.parse(line));
    }
  });
});

describe('サーバ1本の通し — 監査ログ', () => {
  it('startup とツール呼び出しがファイルに並ぶ', async () => {
    const { logDir } = await run([
      request(1, 'tools/call', { name: 'get_issue', arguments: { issueKey: 'PROJ-1' } }),
      request(2, 'tools/call', { name: 'get_issue', arguments: { issueKey: 'OTHER-1' } }),
    ]);

    const records = auditLines(logDir);
    assert.equal(records.length, 3);
    assert.equal(records[0]?.['event'], 'startup');
    // 配った先のログだけで「どの版で動いていたか」が分かること
    assert.match(String(records[0]['version']), /^\d+\.\d+\.\d+/);
    // 正規形のハッシュ。権限が変われば必ず変わる値が起動時に残る
    assert.match(String(records[0]['policyHash']), /^[0-9a-f]{16}$/);
    assert.deepEqual(records[0]['projects'], ['PROJ']);
    assert.equal(records[1]?.['event'], 'tools/call');
    assert.equal(records[1]['ok'], true);
    // 拒否も残る
    assert.equal(records[2]?.['ok'], false);
    assert.equal(records[2]['issueKey'], 'OTHER-1');
  });

  it('API キーはどこにも現れない', async () => {
    const { written, logDir } = await run([
      request(1, 'tools/call', { name: 'get_issue', arguments: { issueKey: 'PROJ-1' } }),
    ]);

    assert.doesNotMatch(written.join('\n'), /secret-key-value/);
    assert.doesNotMatch(
      readFileSync(join(logDir, readdirSync(logDir)[0] ?? ''), 'utf8'),
      /secret-key-value/,
    );
  });
});

describe('サーバ1本の通し — 起動できないとき', () => {
  it('ポリシーが不正なら serve に入らず、startup-failed だけが残る', async () => {
    const root = mkdtempSync(join(tmpdir(), 'backlog-mcp-e2e-'));
    const policyPath = join(root, 'backlog-policy.json');
    writeFileSync(policyPath, JSON.stringify({ projects: [{ key: 'PROJ', cans: 'write' }] }));

    const written: string[] = [];
    await assert.rejects(() =>
      runServer(
        {
          input: Readable.from([`${request(1, 'tools/list')}\n`]),
          write(line: string): void {
            written.push(line);
          },
        },
        {
          BACKLOG_SPACE_ID: 'example',

          BACKLOG_POLICY: policyPath,
        },
        {
          gateway: { transport: makeTransport(), maxRetries: 0 },
          config: { resolveApiKey: () => 'secret-key-value' },
        },
      ),
    );

    // 1行も応答していない
    assert.deepEqual(written, []);

    const records = auditLines(join(root, 'logs'));
    assert.equal(records.length, 1);
    assert.equal(records[0]?.['event'], 'startup-failed');
    assert.equal(records[0]['error'], 'PolicyError');
    // 失敗の報告を受けたときに版が分かること
    assert.match(String(records[0]['version']), /^\d+\.\d+\.\d+/);
  });

  it('ポリシーのプロジェクトを解決できなければ起動しない', async () => {
    const root = mkdtempSync(join(tmpdir(), 'backlog-mcp-e2e-'));
    const policyPath = join(root, 'backlog-policy.json');
    writeFileSync(policyPath, JSON.stringify({ projects: ['MISSING'] }));

    await assert.rejects(() =>
      runServer(
        {
          input: Readable.from([]),
          write(): void {
            assert.fail('起動していないので書き出しは起きない');
          },
        },
        {
          BACKLOG_SPACE_ID: 'example',

          BACKLOG_POLICY: policyPath,
        },
        {
          gateway: { transport: makeTransport(), maxRetries: 0 },
          config: { resolveApiKey: () => 'secret-key-value' },
        },
      ),
    );

    assert.equal(auditLines(join(root, 'logs'))[0]?.['error'], 'MasterDataError');
  });
});

// ============================================================================
// 増えたツールの配線 — 各層のテストでは見えない「組み立て」を通しで見る
// ============================================================================

/** 書き込みまで許すポリシー。プロジェクト単位のマスタが引かれる。 */
const WRITE_POLICY = { projects: [{ key: 'PROJ', can: 'write' }] };

describe('サーバ1本の通し — 書き込み系', () => {
  it('create_issue は名前を ID に直して POST する', async () => {
    const { written, urls } = await run(
      [
        request(1, 'tools/call', {
          name: 'create_issue',
          arguments: {
            projectKey: 'PROJ',
            summary: '新しい課題',
            issueType: 'バグ',
            priority: '高',
            assignee: '山田太郎',
          },
        }),
      ],
      WRITE_POLICY,
    );

    const result = (JSON.parse(written[0] ?? '{}') as { result: { isError?: boolean } }).result;
    assert.equal(result.isError, undefined);
    assert.equal(
      urls.some(url => new URL(url).pathname === '/api/v2/issues'),
      true,
    );
  });

  it('update_issue は PATCH になり、監査に issueKey が残る', async () => {
    const { written, logDir } = await run(
      [
        request(1, 'tools/call', {
          name: 'update_issue',
          arguments: { issueKey: 'PROJ-1', status: '処理中' },
        }),
      ],
      WRITE_POLICY,
    );

    assert.equal(
      (JSON.parse(written[0] ?? '{}') as { result: { isError?: boolean } }).result.isError,
      undefined,
    );
    const call = auditLines(logDir).find(record => record['event'] === 'tools/call');
    assert.equal(call?.['tool'], 'update_issue');
    assert.equal(call['issueKey'], 'PROJ-1');
  });

  it('書き込みを許したプロジェクトのマスタだけを起動時に引く', async () => {
    const writable = await run([request(1, 'ping')], WRITE_POLICY);
    const readOnly = await run([request(1, 'ping')], { projects: ['PROJ'] });

    const perProject = (urls: readonly string[]): string[] =>
      urls
        .map(url => new URL(url).pathname)
        .filter(path => path.startsWith('/api/v2/projects/101/'));

    assert.equal(perProject(writable.urls).length, 5);
    assert.equal(perProject(readOnly.urls).length, 0);
  });
});

describe('サーバ1本の通し — 監査に「何に触ったか」が残る', () => {
  it('PR コメントは repository と number が残る', async () => {
    const { logDir } = await run(
      [
        request(1, 'tools/call', {
          name: 'add_pull_request_comment',
          arguments: { projectKey: 'PROJ', repository: 'app', number: 7, content: 'レビュー' },
        }),
      ],
      { projects: [{ key: 'PROJ', can: 'comment' }] },
    );

    const call = auditLines(logDir).find(record => record['event'] === 'tools/call');
    assert.equal(call?.['ok'], true);
    assert.equal(call['projectKey'], 'PROJ');
    assert.equal(call['repository'], 'app');
    assert.equal(call['number'], 7);
    // 本文は残さない
    assert.equal(JSON.stringify(call).includes('レビュー'), false);
  });

  it('添付は「何を送ったか」が残り、3手でもツール呼び出しは1件', async () => {
    const { written, urls, logDir } = await run(
      [
        request(1, 'tools/call', {
          name: 'add_issue_comment',
          arguments: { issueKey: 'PROJ-1', content: '添付します', file: 'review.md' },
        }),
      ],
      { projects: [{ key: 'PROJ', can: 'comment' }] },
      { 'review.md': '# レビュー\n' },
    );

    assert.equal(
      (JSON.parse(written[0] ?? '{}') as { result: { isError?: boolean } }).result.isError,
      undefined,
    );
    // アップロード → コメントの2本が出ている
    const paths = urls.map(url => new URL(url).pathname);
    assert.equal(paths.includes('/api/v2/space/attachment'), true);
    assert.equal(paths.includes('/api/v2/issues/PROJ-1/comments'), true);

    const calls = auditLines(logDir).filter(record => record['event'] === 'tools/call');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.['file'], 'review.md');
    assert.equal(calls[0]['issueKey'], 'PROJ-1');
    assert.equal(JSON.stringify(calls[0]).includes('添付します'), false);
  });

  it('添付が拒否されても「何を送ろうとしたか」は残る', async () => {
    const { written, logDir } = await run(
      [
        request(1, 'tools/call', {
          name: 'add_issue_comment',
          arguments: { issueKey: 'PROJ-1', content: 'x', file: '../outside.md' },
        }),
      ],
      { projects: [{ key: 'PROJ', can: 'comment' }] },
      { 'review.md': 'ok' },
    );

    assert.equal(
      (JSON.parse(written[0] ?? '{}') as { result: { isError?: boolean } }).result.isError,
      true,
    );
    const call = auditLines(logDir).find(record => record['event'] === 'tools/call');
    assert.equal(call?.['ok'], false);
    assert.equal(call['file'], '../outside.md');
  });
});

describe('サーバ1本の通し — 残りのツールセット', () => {
  it('search_documents と list_project_activities が配線されている', async () => {
    const { written } = await run([
      request(1, 'tools/call', { name: 'search_documents', arguments: {} }),
      request(2, 'tools/call', {
        name: 'list_project_activities',
        arguments: { projectKey: 'PROJ' },
      }),
    ]);

    for (const line of written) {
      const result = (JSON.parse(line) as { result: { isError?: boolean } }).result;
      assert.equal(result.isError, undefined);
    }
    const activities =
      (JSON.parse(written[1] ?? '{}') as { result: { content: { text: string }[] } }).result
        .content[0]?.text ?? '';
    // key_id 5 が projectKey と組み合わさって課題キーになる
    assert.match(activities, /PROJ-5/);
  });

  it('全ツールが tools/list に出せる（定義が壊れていない）', async () => {
    const { written } = await run([request(1, 'tools/list')], WRITE_POLICY);
    const tools = (
      JSON.parse(written[0] ?? '{}') as {
        result: { tools: { name: string; inputSchema: unknown }[] };
      }
    ).result.tools;

    assert.equal(tools.length, 15);
    for (const tool of tools) {
      assert.ok(tool.inputSchema, `${tool.name} の inputSchema が無い`);
    }
  });
});
