/**
 * copy-libs.mjs
 *
 * @description 借り物の生成物（`src/libs/`）を dist へ運ぶ。tsc は `.js` / `.d.ts` を見ないため
 */

import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * `src/libs/` は `.ts` ではなく **`.js` + `.d.ts` の生成物**（`tools/sync-libs.sh` が作る）。
 * `tsconfig.build.json` の `include` は `.ts` だけを拾うので、ここは1つも入らない。
 *
 * **拾われないことに気づけるのは出力を見たときだけ**なので（型チェックもテストも通る）、
 * コピーを別の手順として明示し、欠けていれば失敗させる。
 */
const root = dirname(import.meta.dirname);
const from = join(root, 'src', 'libs');
const to = join(root, 'dist', 'libs');

if (!existsSync(from)) {
  throw new Error(`借り物の生成物が見つかりません: ${from}（tools/sync-libs.sh で作る）`);
}
if (!existsSync(join(root, 'dist'))) {
  throw new Error('dist がありません。先に tsc を走らせてください');
}

cpSync(from, to, { recursive: true });

if (!existsSync(join(to, 'BacklogApiClient.js'))) {
  throw new Error(`${to} にコピーされていません`);
}

console.log(`copied ${from} -> ${to}`);
