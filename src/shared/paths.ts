/**
 * paths.ts
 *
 * @description パスの計算だけを行う純関数。**ファイルを触らない**
 */

import { isAbsolute, relative, resolve } from 'node:path';

/**
 * `root` の中に収まっているかを判定する。**純関数**。
 *
 * **`startsWith` を使わない。** `/repo` と `/repo-evil` を取り違えるため
 * （CVE-2025-53109 / 53110 が prefix matching と symlink の両方で踏んだ形）。
 * `path.relative` の結果が `..` で始まらず、絶対パスでもなく、空でもないことを見る。
 *
 * @param realRoot - 解決済みのルート（symlink を追ったもの）
 * @param realPath - 解決済みの対象パス
 * @returns ルート配下なら true
 */
export const isInside = (realRoot: string, realPath: string): boolean => {
  const rel = relative(realRoot, realPath);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
};

/** 設定のルートを絶対パスに直す。基準は呼び出し側が決める（cwd に依存させない）。 */
export const resolveAttachmentRoot = (baseDir: string, value: string): string =>
  isAbsolute(value) ? value : resolve(baseDir, value);
