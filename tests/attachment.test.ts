import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { before, describe, it } from 'node:test';
import { AttachmentError } from '../src/contract.ts';
import {
  isInside,
  readAttachment,
  receiveAttachment,
  saveAttachment,
} from '../src/attach/localFile.ts';

/**
 * **実ファイルで確かめる。** 守りたい性質が `realpath` と symlink の挙動に乗っており、
 * モックにすると検証したいものが消える。
 *
 * 同型の CVE がある: CVE-2025-53109 / 53110（`@modelcontextprotocol/server-filesystem`,
 * High, CWE-59）「path validation bypass via prefix matching and symlink handling」。
 * **prefix matching と symlink の両方**で踏まれているので、両方を固定する。
 */

const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');

let root: string;
let outside: string;

before(() => {
  const base = mkdtempSync(join(tmpdir(), 'backlog-mcp-attach-'));
  root = join(base, 'repo');
  outside = join(base, 'secret');
  mkdirSync(root, { recursive: true });
  mkdirSync(outside, { recursive: true });
  mkdirSync(join(base, 'repo-evil'), { recursive: true });

  writeFileSync(join(root, 'note.md'), '# 見出し\n\n本文\n');
  writeFileSync(join(root, 'data.csv'), 'id,name\n1,テスト\n');
  writeFileSync(join(root, 'image.png'), PNG);
  writeFileSync(join(root, 'doc.xml.txt'), '<?xml version="1.0"?><root/>');
  writeFileSync(join(root, 'fake.png'), 'これは PNG ではない');
  writeFileSync(join(root, 'fake.txt'), PNG);
  writeFileSync(join(root, 'binary.exe'), PNG);
  writeFileSync(join(root, 'broken.txt'), Buffer.from([0xff, 0xfe, 0x00, 0x80]));
  writeFileSync(join(outside, 'secret.md'), '見えてはいけない');
  writeFileSync(join(base, 'repo-evil', 'evil.md'), '別ディレクトリ');

  symlinkSync(join(outside, 'secret.md'), join(root, 'link.md'));
});

describe('isInside — prefix matching を使わない', () => {
  it('接頭辞が同じだけの別ディレクトリを中と判定しない', () => {
    assert.equal(isInside('/repo', '/repo-evil/x.md'), false);
    assert.equal(isInside('/repo', '/repo/x.md'), true);
  });

  it('ルート自身は中に含めない', () => {
    assert.equal(isInside('/repo', '/repo'), false);
  });

  it('親を遡ったパスを中と判定しない', () => {
    assert.equal(isInside('/repo', '/etc/passwd'), false);
    assert.equal(isInside('/repo/a', '/repo/b'), false);
  });
});

describe('readAttachment — ルートの外へ出られない', () => {
  it('相対パスで遡れない', async () => {
    await assert.rejects(() => readAttachment(root, '../secret/secret.md'), AttachmentError);
  });

  it('絶対パスでも外は読めない', async () => {
    await assert.rejects(() => readAttachment(root, join(outside, 'secret.md')), AttachmentError);
  });

  it('symlink を追った先が外なら拒否する（realpath で解決してから判定する）', async () => {
    await assert.rejects(() => readAttachment(root, 'link.md'), AttachmentError);
  });

  it('存在しないファイルは拒否する', async () => {
    await assert.rejects(() => readAttachment(root, 'nope.md'), AttachmentError);
  });

  it('ディレクトリは拒否する', async () => {
    await assert.rejects(() => readAttachment(root, '.'), AttachmentError);
  });

  it('空文字を拒否する', async () => {
    await assert.rejects(() => readAttachment(root, ''), AttachmentError);
  });
});

describe('readAttachment — 拡張子と中身を突き合わせる', () => {
  it('テキストは読める', async () => {
    const file = await readAttachment(root, 'note.md');

    assert.equal(file.kind, 'file');
    assert.equal(file.filename, 'note.md');
    assert.equal(file.contentType, 'text/markdown');
    assert.match(new TextDecoder().decode(file.data), /見出し/);
  });

  it('バイナリは中身が拡張子と一致すれば読める', async () => {
    const file = await readAttachment(root, 'image.png');

    assert.equal(file.contentType, 'image/png');
    assert.equal(file.data.length, PNG.length);
  });

  it('拡張子がバイナリなのに中身がテキストなら拒否する', async () => {
    await assert.rejects(() => readAttachment(root, 'fake.png'), AttachmentError);
  });

  it('拡張子がテキストなのに中身がバイナリなら拒否する', async () => {
    await assert.rejects(() => readAttachment(root, 'fake.txt'), AttachmentError);
  });

  it('UTF-8 として読めないものは拒否する', async () => {
    await assert.rejects(() => readAttachment(root, 'broken.txt'), AttachmentError);
  });

  it('受け付けない拡張子は拒否する', async () => {
    await assert.rejects(() => readAttachment(root, 'binary.exe'), AttachmentError);
  });

  it('中身が XML のテキストは通す（判定不能だけを許すと正当なテキストを弾く）', async () => {
    const file = await readAttachment(root, 'doc.xml.txt');

    assert.equal(file.contentType, 'text/plain');
  });
});

describe('readAttachment — サイズ上限', () => {
  it('上限を超えたら読まずに拒否する', async () => {
    await assert.rejects(
      () => readAttachment(root, 'note.md', { limits: { maxBytes: 3 } }),
      AttachmentError,
    );
  });

  it('上限ちょうどは通る', async () => {
    const file = await readAttachment(root, 'data.csv', { limits: { maxBytes: 1024 } });

    assert.ok(file.data.length > 0);
  });
});

describe('readAttachment — 失敗しても中身を漏らさない', () => {
  it('エラーのメッセージにファイルの中身も外のパスも載らない', async () => {
    try {
      await readAttachment(root, 'link.md');
      assert.fail('拒否されるべき');
    } catch (e) {
      assert.ok(e instanceof AttachmentError);
      assert.doesNotMatch(e.message, /見えてはいけない/);
      assert.doesNotMatch(e.message, /secret/);
    }
  });
});

// ============================================================================
// サーバ自身の設定ファイルは添付として送り出さない
// ============================================================================

/**
 * **名前ではなく識別で拒否する。**
 *
 * `.env` が今たまたま塞がっているのは拡張子 allowlist に載っていないからで、設計ではない。
 * `BACKLOG_ENV_FILE` は任意のパスを取るので、`my.env.txt` や `secrets.json` と名付ければ
 * 拡張子では通ってしまう。**ポリシー（`.json`）はそもそも allowlist を素通りする。**
 */
describe('readAttachment — サーバ自身の設定ファイル', () => {
  let selfRoot: string;
  let policyPath: string;
  let envPath: string;

  before(() => {
    selfRoot = mkdtempSync(join(tmpdir(), 'backlog-mcp-self-'));
    policyPath = join(selfRoot, 'backlog-policy.json');
    // env ファイルを .txt と名付ける。拡張子では塞げないことを示す
    envPath = join(selfRoot, 'my.env.txt');
    writeFileSync(policyPath, JSON.stringify({ projects: ['PROJ'] }));
    writeFileSync(envPath, 'BACKLOG_API_KEY=encrypted:xxxx\n');
    writeFileSync(join(selfRoot, 'note.md'), '# ふつうのファイル\n');
    symlinkSync(policyPath, join(selfRoot, 'link-to-policy.json'));
  });

  it('拒否対象を渡さなければポリシーは添付できてしまう（穴の再現）', async () => {
    const file = await readAttachment(selfRoot, 'backlog-policy.json');

    assert.equal(file.contentType, 'application/json');
  });

  it('ポリシーファイルを拒否する', async () => {
    await assert.rejects(
      () => readAttachment(selfRoot, 'backlog-policy.json', { selfPaths: [policyPath] }),
      AttachmentError,
    );
  });

  it('拡張子を変えた env ファイルも拒否する（名前で塞いでいない証拠）', async () => {
    await assert.rejects(
      () => readAttachment(selfRoot, 'my.env.txt', { selfPaths: [envPath] }),
      AttachmentError,
    );
  });

  it('symlink で別名から指しても拒否する', async () => {
    await assert.rejects(
      () => readAttachment(selfRoot, 'link-to-policy.json', { selfPaths: [policyPath] }),
      AttachmentError,
    );
  });

  it('拒否対象を symlink 経由で渡しても実体で照合する', async () => {
    await assert.rejects(
      () =>
        readAttachment(selfRoot, 'backlog-policy.json', {
          selfPaths: [join(selfRoot, 'link-to-policy.json')],
        }),
      AttachmentError,
    );
  });

  it('関係ないファイルは通る（拒否が広がっていない）', async () => {
    const file = await readAttachment(selfRoot, 'note.md', {
      selfPaths: [policyPath, envPath],
    });

    assert.equal(file.filename, 'note.md');
  });

  it('存在しない拒否対象があっても落ちない（網が狭くなるだけ）', async () => {
    const file = await readAttachment(selfRoot, 'note.md', {
      selfPaths: [join(selfRoot, 'nonexistent.json'), policyPath],
    });

    assert.equal(file.filename, 'note.md');
  });

  it('コピーして別名にしても拒否する（中身で照合する）', async () => {
    const copied = join(selfRoot, 'notes.json');
    writeFileSync(copied, readFileSync(policyPath));

    // 識別は別物になっている（ここが通るからこそ中身の照合が要る）
    assert.notEqual(statSync(copied).ino, statSync(policyPath).ino);

    await assert.rejects(
      () => readAttachment(selfRoot, 'notes.json', { selfPaths: [policyPath] }),
      AttachmentError,
    );
  });

  it('拡張子を変えてコピーしても拒否する', async () => {
    const copied = join(selfRoot, 'memo.txt');
    writeFileSync(copied, readFileSync(envPath));

    await assert.rejects(
      () => readAttachment(selfRoot, 'memo.txt', { selfPaths: [envPath] }),
      AttachmentError,
    );
  });

  it('1バイト違えば通る（中身の一致だけを見ている）', async () => {
    const almost = join(selfRoot, 'almost.json');
    writeFileSync(almost, `${readFileSync(policyPath, 'utf8')} `);

    const file = await readAttachment(selfRoot, 'almost.json', { selfPaths: [policyPath] });

    assert.equal(file.filename, 'almost.json');
  });

  it('空のファイルは「設定と同じ」と判定しない（誤判定を作らない）', async () => {
    const emptyConfig = join(selfRoot, 'empty-config.json');
    const emptyAttachment = join(selfRoot, 'empty-note.md');
    writeFileSync(emptyConfig, '');
    writeFileSync(emptyAttachment, '');

    const file = await readAttachment(selfRoot, 'empty-note.md', {
      selfPaths: [emptyConfig],
    });

    assert.equal(file.data.length, 0);
  });

  it('エラーはどのファイルだったかを書かない（設定の在り処を教えない）', async () => {
    try {
      await readAttachment(selfRoot, 'backlog-policy.json', { selfPaths: [policyPath] });
      assert.fail('拒否されるべき');
    } catch (e) {
      assert.ok(e instanceof AttachmentError);
      assert.doesNotMatch(e.message, /backlog-policy|\.env|my\.env/);
      assert.match(e.message, /設定ファイル/);
    }
  });
});

// ============================================================================
// サーバ自身が書き出したもの（監査ログ）は添付できない
// ============================================================================

describe('readAttachment — 監査ログの出力先', () => {
  let logRoot: string;
  let logDir: string;

  before(() => {
    logRoot = mkdtempSync(join(tmpdir(), 'backlog-mcp-logdir-'));
    logDir = join(logRoot, 'logs');
    mkdirSync(join(logDir, 'old'), { recursive: true });
    writeFileSync(join(logDir, 'audit-2026-09-06.jsonl'), '{"event":"startup"}\n');
    // 拡張子で絞っていないことを示すため、ログ以外の名前も置く
    writeFileSync(join(logDir, 'memo.md'), '# ログの隣に置かれたメモ\n');
    writeFileSync(join(logDir, 'old', 'archived.md'), '# 深い階層\n');
    writeFileSync(join(logRoot, 'note.md'), '# ログの外\n');
    // 接頭辞が同じだけの別ディレクトリ（prefix matching を使っていないことの確認）
    mkdirSync(join(logRoot, 'logs-backup'), { recursive: true });
    writeFileSync(join(logRoot, 'logs-backup', 'note.md'), '# 別ディレクトリ\n');
  });

  it('配下は拡張子を問わず拒否する', async () => {
    for (const requested of ['logs/memo.md', 'logs/old/archived.md']) {
      await assert.rejects(
        () => readAttachment(logRoot, requested, { selfDirs: [logDir] }),
        AttachmentError,
        `拒否されるべき: ${requested}`,
      );
    }
  });

  it('ログの外は通る（拒否が広がっていない）', async () => {
    const file = await readAttachment(logRoot, 'note.md', { selfDirs: [logDir] });

    assert.equal(file.filename, 'note.md');
  });

  it('接頭辞が同じだけの別ディレクトリは通る（prefix matching ではない）', async () => {
    const file = await readAttachment(logRoot, 'logs-backup/note.md', { selfDirs: [logDir] });

    assert.equal(file.filename, 'note.md');
  });

  it('存在しないディレクトリを渡しても落ちない（網が狭くなるだけ）', async () => {
    const file = await readAttachment(logRoot, 'note.md', {
      selfDirs: [join(logRoot, 'nonexistent'), logDir],
    });

    assert.equal(file.filename, 'note.md');
  });

  it('symlink でログの外から指しても拒否する', async () => {
    symlinkSync(join(logDir, 'memo.md'), join(logRoot, 'link-to-log.md'));

    await assert.rejects(
      () => readAttachment(logRoot, 'link-to-log.md', { selfDirs: [logDir] }),
      AttachmentError,
    );
  });
});

// ============================================================================
// 保存側 — Backlog から降ってきたバイト列をディスクへ置く
// ============================================================================

describe('saveAttachment — 第三者が決めるファイル名を安全に置く', () => {
  const newDir = (): string => mkdtempSync(join(tmpdir(), 'backlog-mcp-dl-'));

  it('置ける名前はそのまま使う（直さない）', async () => {
    const dir = newDir();
    const path = await saveAttachment(dir, 'screen shot.png', PNG);

    assert.equal(basename(path), 'screen shot.png');
    assert.deepEqual(readdirSync(dir), ['screen shot.png']);
  });

  it('ルートの外へ出る名前は弾く', async () => {
    const dir = newDir();
    for (const name of ['../evil.png', '..\\evil.png', '/etc/evil.png', '..']) {
      await assert.rejects(() => saveAttachment(dir, name, PNG), AttachmentError, name);
    }

    assert.deepEqual(readdirSync(dir), []);
  });

  it('Windows で意味が変わる名前も弾く', async () => {
    const dir = newDir();
    // 代替データストリーム / 予約名 / 末尾のドットと空白（Windows が黙って落とす）
    for (const name of ['a:b.png', 'CON.png', 'nul.png', 'a.png.', 'a.png ']) {
      await assert.rejects(() => saveAttachment(dir, name, PNG), AttachmentError, name);
    }
  });

  it('保存を許さない拡張子は置かない（人が開く場所なので厳しくする）', async () => {
    const dir = newDir();
    for (const name of ['setup.exe', 'link.lnk', 'run.bat', 'note.txt']) {
      await assert.rejects(() => saveAttachment(dir, name, PNG), AttachmentError, name);
    }
  });

  it('中身が拡張子と合わなければ置かない', async () => {
    const dir = newDir();
    await assert.rejects(
      () => saveAttachment(dir, 'fake.png', new TextEncoder().encode('これは PNG ではない')),
      AttachmentError,
    );
  });

  it('同名があっても上書きしない', async () => {
    const dir = newDir();
    const first = await saveAttachment(dir, 'a.png', PNG);
    const second = await saveAttachment(dir, 'a.png', PNG);

    assert.equal(basename(first), 'a.png');
    assert.equal(basename(second), 'a-2.png');
    assert.equal(readdirSync(dir).length, 2);
  });
});

describe('receiveAttachment — テキストと、それ以外の割り振り', () => {
  it('テキストはディスクを触らずに返す（保存先が未設定でも動く）', async () => {
    const received = await receiveAttachment(
      new TextEncoder().encode('エラーログ\n2行目'),
      'error.log',
      null,
    );

    if (received.kind !== 'text') {
      assert.fail('テキストとして返るはず');
    }
    assert.equal(received.text, 'エラーログ\n2行目');
  });

  it('バイナリは保存先が無ければ送出する（fail-closed）', async () => {
    await assert.rejects(() => receiveAttachment(PNG, 'a.png', null), AttachmentError);
  });

  it('バイナリは保存先があればそこへ置く', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'backlog-mcp-dl-'));
    const received = await receiveAttachment(PNG, 'a.png', dir);

    assert.equal(received.kind, 'saved');
    assert.deepEqual(readdirSync(dir), ['a.png']);
  });

  it('UTF-8 として読めなければテキストとして扱わない', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'backlog-mcp-dl-'));
    // file-type は判定不能（undefined）だが、UTF-8 としては壊れている。
    // 拡張子も保存できないものなので、テキストにもバイナリにも落ちずに送出する
    await assert.rejects(
      () => receiveAttachment(new Uint8Array([0xff, 0xfe, 0xfd]), 'broken.log', dir),
      AttachmentError,
    );
  });
});
