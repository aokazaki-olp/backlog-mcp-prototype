import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';
import { AttachmentError } from '../src/contract.ts';
import { isInside, readAttachment } from '../src/attach/localFile.ts';

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
    await assert.rejects(() => readAttachment(root, 'note.md', { maxBytes: 3 }), AttachmentError);
  });

  it('上限ちょうどは通る', async () => {
    const file = await readAttachment(root, 'data.csv', { maxBytes: 1024 });

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
