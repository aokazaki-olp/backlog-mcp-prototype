/**
 * make-dist.mjs
 *
 * @description 配る一式（tgz とひな型と README）を `dist-package/` に集める
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * **圧縮まではしない。** Node に zip が無く、クロスプラットフォームに書くと割に合わない。
 * 集めたフォルダを手で zip して渡す（Windows なら `Compress-Archive`）。
 *
 * 集める理由は自動化そのものではなく、**版がずれた一式を配らないこと**。tgz の名前は
 * `package.json` の版で決まるので、手で集めると古い tgz と新しい README が混ざりうる。
 */
const root = dirname(import.meta.dirname);
const out = join(root, 'dist-package');

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const tarball = `backlog-mcp-${version}.tgz`;

if (!existsSync(join(root, tarball))) {
  throw new Error(`${tarball} がありません。先に npm pack を走らせてください`);
}

// 前回の残りを持ち越さない（古い版の tgz が同居すると、どれを渡すか分からなくなる）
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const items = [tarball, 'README.md', '.env.example', 'backlog-policy.example.json'];
for (const name of items) {
  cpSync(join(root, name), join(out, name));
}

const missing = items.filter(name => !existsSync(join(out, name)));
if (missing.length > 0) {
  throw new Error(`集められませんでした: ${missing.join(', ')}`);
}

console.log(`${out} に ${readdirSync(out).length} 件そろえました（zip にして渡す）`);
for (const name of readdirSync(out).sort()) {
  console.log(`  ${name}`);
}
