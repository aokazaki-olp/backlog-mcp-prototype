import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { SERVER_INFO } from '../src/server.ts';

/**
 * **版の出所は `package.json` ひとつ。**
 *
 * `package.json` の版は tgz のファイル名を決め、`SERVER_INFO.version` は `initialize` で
 * クライアントへ返る値を決める。**両方にリテラルを書くと、`npm version` で片方だけ進み、
 * 「tgz の名前は新しいのにクライアントが見る版は古い」という嘘ができる。**
 *
 * 配る前は1人が clone して動かすだけだったので実害が無かったが、配ると実害になる。
 */
describe('版', () => {
  it('package.json と SERVER_INFO が一致する', () => {
    const packageJson = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
    ) as { version: string };

    assert.equal(SERVER_INFO.version, packageJson.version);
  });

  it('版が空でない', () => {
    assert.notEqual(SERVER_INFO.version, '');
  });
});
