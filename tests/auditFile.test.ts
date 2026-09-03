import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { loadConfig } from '../src/config.ts';
import { ConfigError } from '../src/contract.ts';
import { createFileAuditSink, multiAuditSink } from '../src/mcp/audit.ts';
import type { AuditSink } from '../src/mcp/audit.ts';

/**
 * 出力先の解決と、ファイルへの書き出し。
 *
 * **テスト自身は temp を使う**（消えてよいので）。既定の出力先に temp を採らないのは
 * 別の理由 — 監査ログは消えては困る。
 */
const makeRoot = (): string => mkdtempSync(join(tmpdir(), 'backlog-mcp-test-'));

const baseEnv = (policyPath: string): Record<string, string> => ({
  BACKLOG_SPACE_ID: 'example',
  BACKLOG_API_KEY: 'secret-key-value',
  BACKLOG_POLICY: policyPath,
});

describe('loadConfig — ログの出力先', () => {
  it('既定はポリシーファイルの隣の logs/', () => {
    const root = makeRoot();
    const policyPath = join(root, 'backlog-policy.json');

    const config = loadConfig(baseEnv(policyPath));

    assert.equal(config.logDir, join(root, 'logs'));
  });

  it('相対指定はポリシーファイルのディレクトリから解決する', () => {
    const root = makeRoot();
    const policyPath = join(root, 'conf', 'backlog-policy.json');

    const config = loadConfig({ ...baseEnv(policyPath), BACKLOG_LOG_DIR: '../audit' });

    assert.equal(config.logDir, join(root, 'audit'));
  });

  it('cwd を基準にしない（cwd が変わっても結果が変わらない）', () => {
    const root = makeRoot();
    const policyPath = join(root, 'backlog-policy.json');
    const env = { ...baseEnv(policyPath), BACKLOG_LOG_DIR: 'logs' };

    const before = loadConfig(env).logDir;
    const previous = process.cwd();
    process.chdir(tmpdir());
    const after2 = loadConfig(env).logDir;
    process.chdir(previous);

    assert.equal(before, after2);
    assert.equal(before, join(root, 'logs'));
  });

  it('絶対指定はそのまま使う', () => {
    const root = makeRoot();
    const target = join(makeRoot(), 'elsewhere');

    const config = loadConfig({
      ...baseEnv(join(root, 'backlog-policy.json')),
      BACKLOG_LOG_DIR: target,
    });

    assert.equal(config.logDir, target);
  });

  it('ポリシーのパスも絶対に解決する（基準が後から動かない）', () => {
    const config = loadConfig(baseEnv('./backlog-policy.json'));

    assert.equal(config.policyPath, join(process.cwd(), 'backlog-policy.json'));
  });

  it('describeConfig に出力先が出る', async () => {
    const { describeConfig } = await import('../src/config.ts');
    const root = makeRoot();

    const text = describeConfig(loadConfig(baseEnv(join(root, 'backlog-policy.json'))));

    assert.match(text, /log=/);
    assert.doesNotMatch(text, /secret-key-value/);
  });
});

describe('createFileAuditSink', () => {
  it('audit-YYYY-MM-DD.jsonl に1行ずつ追記する', () => {
    const dir = join(makeRoot(), 'logs');
    const sink = createFileAuditSink(dir);

    sink.write(JSON.stringify({ event: 'tools/call', tool: 'get_issue' }));
    sink.write(JSON.stringify({ event: 'tools/call', tool: 'search_issues' }));

    const files = readdirSync(dir);
    assert.equal(files.length, 1);
    assert.match(files[0] ?? '', /^audit-\d{4}-\d{2}-\d{2}\.jsonl$/);

    const lines = readFileSync(join(dir, files[0] ?? ''), 'utf8')
      .trimEnd()
      .split('\n');
    assert.equal(lines.length, 2);
    for (const line of lines) {
      const record = JSON.parse(line) as { event: string };
      assert.equal(record.event, 'tools/call');
    }
  });

  it('ファイル名の日付は記録の ts と同じ日を指す（どちらも UTC）', () => {
    const dir = join(makeRoot(), 'logs');
    const sink = createFileAuditSink(dir);

    sink.write(JSON.stringify({ ts: new Date().toISOString(), event: 'startup' }));

    const file = readdirSync(dir)[0] ?? '';
    const record = JSON.parse(readFileSync(join(dir, file), 'utf8').trim()) as { ts: string };
    assert.equal(file, `audit-${record.ts.slice(0, 10)}.jsonl`);
  });

  it('ディレクトリが無ければ作る', () => {
    const dir = join(makeRoot(), 'a', 'b', 'c');

    createFileAuditSink(dir).write('{}');

    assert.ok(statSync(dir).isDirectory());
  });

  it('ファイルは所有者だけが読める（0600）', () => {
    const dir = join(makeRoot(), 'logs');

    createFileAuditSink(dir).write('{}');

    const file = readdirSync(dir)[0] ?? '';
    assert.equal(statSync(join(dir, file)).mode & 0o777, 0o600);
  });

  it('既存のファイルを切り詰めない（追記で開く）', () => {
    const dir = join(makeRoot(), 'logs');
    mkdirSync(dir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    writeFileSync(join(dir, `audit-${date}.jsonl`), '{"event":"前回の記録"}\n');

    createFileAuditSink(dir).write('{"event":"今回"}');

    const lines = readFileSync(join(dir, `audit-${date}.jsonl`), 'utf8')
      .trimEnd()
      .split('\n');
    assert.equal(lines.length, 2);
    assert.match(lines[0] ?? '', /前回の記録/);
  });
});

describe('createFileAuditSink — 書けなければ送出する（起動させない）', () => {
  it('ディレクトリを作れない場所を指定したら ConfigError', () => {
    const root = makeRoot();
    // ファイルを作り、その下をディレクトリとして要求する
    const asFile = join(root, 'not-a-dir');
    writeFileSync(asFile, 'x');

    assert.throws(() => createFileAuditSink(join(asFile, 'logs')), ConfigError);
  });

  it('原因を cause に残す', () => {
    const root = makeRoot();
    const asFile = join(root, 'not-a-dir');
    writeFileSync(asFile, 'x');

    try {
      createFileAuditSink(join(asFile, 'logs'));
      assert.fail('送出されるべき');
    } catch (e) {
      assert.ok(e instanceof ConfigError);
      assert.ok(Error.isError(e.cause));
    }
  });
});

describe('multiAuditSink', () => {
  it('すべての出口へ同じ行を流す', () => {
    const a: string[] = [];
    const b: string[] = [];
    const sinkOf = (into: string[]): AuditSink => ({
      write(line: string): void {
        into.push(line);
      },
    });

    multiAuditSink([sinkOf(a), sinkOf(b)]).write('{"event":"x"}');

    assert.deepEqual(a, ['{"event":"x"}']);
    assert.deepEqual(b, ['{"event":"x"}']);
  });
});
