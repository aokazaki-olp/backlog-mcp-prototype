import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
): Promise<Run> => {
  const root = mkdtempSync(join(tmpdir(), 'backlog-mcp-e2e-'));
  const policyPath = join(root, 'backlog-policy.json');
  writeFileSync(policyPath, JSON.stringify(policy));

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
