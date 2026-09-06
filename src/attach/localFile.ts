/**
 * localFile.ts
 *
 * @description 添付するローカルファイルを検証して読み込む。**唯一のファイル読み取り面**
 */

import { open, realpath, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { AttachmentError } from '../contract.ts';
import { toError } from '../shared/toError.ts';
import type { AttachmentFile } from '../contract.ts';

/**
 * 受け付ける拡張子と、その中身に求めるもの。
 *
 * **テキストとバイナリで求めるものが逆になる。**
 *
 * - バイナリ: マジックバイトが拡張子と**一致すること**
 * - テキスト: マジックバイトが**バイナリを示さないこと** + UTF-8 として読めること
 *
 * 実機で確認した（`file-type` 22.0.2、2026-09-05）。`.txt` / `.md` / `.csv` / `.json` /
 * `.log` は空ファイル・BOM つき・HTML を入れても `undefined` が返る。
 *
 * > **例外がある。** 中身が `<?xml` で始まると `{ ext: 'xml' }` が返る。テキストなのに
 * > 「判定不能である」という条件を満たさないので、**`undefined` だけを許すと正当な
 * > テキストを弾く**。だから許容する型として `xml` を名前で挙げる。
 */
const TEXT_EXTENSIONS: Readonly<Record<string, string>> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.log': 'text/plain',
  '.json': 'application/json',
};

/** テキストの中身として現れてよい判定結果。判定不能（`undefined`）に加えてこれだけ許す。 */
const TEXT_LIKE_TYPES: readonly string[] = ['xml'];

/** 拡張子 → `file-type` が返す `ext`。一致を要求する。 */
const BINARY_EXTENSIONS: Readonly<Record<string, string>> = {
  '.png': 'png',
  '.jpg': 'jpg',
  '.jpeg': 'jpg',
  '.gif': 'gif',
  '.pdf': 'pdf',
};

/**
 * ファイルの識別。**パス文字列ではなくこれで比べる。**
 *
 * 主戦場が Windows なので、パス文字列の比較では取り逃がす。
 *
 * - Windows のパスは**大文字小文字を区別しない**（`C:\\x\\.env` と `C:\\X\\.ENV` は同じファイル）
 * - **8.3 形式の短い名前**（`PROGRA~1`）でも同じファイルを別の文字列で指せる
 *
 * 識別で比べれば、**すでに開いたハンドルそのもの**を見ることになるので TOCTOU の隙も無い。
 *
 * > **未確認**: Windows の `ino` は NTFS のファイルインデックスが入るはずだが、この環境で
 * > 確かめられない。ネットワーク共有などで `0` になる例が知られているので、
 * > **`0` のときは大文字小文字を無視したパス比較へ落とす**（`isSameFile`）。
 */
interface FileIdentity {
  readonly dev: number;
  readonly ino: number;
  readonly path: string;
}

/** `ino` が使えるなら識別で、使えないならパスで比べる。 */
const isSameFile = (a: FileIdentity, b: FileIdentity): boolean => {
  if (a.ino !== 0 && b.ino !== 0) {
    return a.dev === b.dev && a.ino === b.ino;
  }
  // 識別が取れない環境向けの落としどころ。Windows を想定して大文字小文字を無視する
  return a.path.toLowerCase() === b.path.toLowerCase();
};

/**
 * **このサーバ自身の設定ファイル**の識別を集める。
 *
 * 読めないものは黙って飛ばす（存在しない設定ファイルは拒否の対象にならない）。**拒否の
 * 網が狭くなるだけで、広くはならない**ので、ここで送出はしない。
 */
const identitiesOf = async (paths: readonly string[]): Promise<readonly FileIdentity[]> => {
  const found: FileIdentity[] = [];
  for (const path of paths) {
    try {
      const real = await realpath(path);
      const info = await stat(real);
      found.push({ dev: info.dev, ino: info.ino, path: real });
    } catch {
      // 解決できないパスは比較対象にならない
    }
  }
  return found;
};

export interface AttachmentLimits {
  /** これを超えるファイルは読まない。 */
  readonly maxBytes: number;
}

export const DEFAULT_ATTACHMENT_LIMITS: AttachmentLimits = { maxBytes: 10 * 1024 * 1024 };

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

/** 拡張子から期待する中身を決める。未知の拡張子は受け付けない。 */
const contentRuleFor = (
  path: string,
): { readonly kind: 'text' | 'binary'; readonly contentType: string; readonly ext: string } => {
  const suffix = extname(path).toLowerCase();
  const text = TEXT_EXTENSIONS[suffix];
  if (text !== undefined) {
    return { kind: 'text', contentType: text, ext: suffix };
  }
  const binary = BINARY_EXTENSIONS[suffix];
  if (binary !== undefined) {
    return { kind: 'binary', contentType: '', ext: binary };
  }
  const allowed = [...Object.keys(TEXT_EXTENSIONS), ...Object.keys(BINARY_EXTENSIONS)].join(' / ');
  throw new AttachmentError(`添付できない拡張子です（受け付けるのは ${allowed}）`);
};

/** 中身が拡張子と釣り合っているかを見る。**バイト列だけを見るので再オープンしない。** */
const verifyContent = async (
  bytes: Uint8Array,
  rule: { readonly kind: 'text' | 'binary'; readonly contentType: string; readonly ext: string },
): Promise<string> => {
  const detected = await fileTypeFromBuffer(bytes);

  if (rule.kind === 'binary') {
    if (detected === undefined || detected.ext !== rule.ext) {
      throw new AttachmentError(
        `中身が拡張子と一致しません（拡張子は ${rule.ext}、中身は ${detected?.ext ?? '判定不能'}）`,
      );
    }
    return detected.mime;
  }

  if (detected !== undefined && !TEXT_LIKE_TYPES.includes(detected.ext)) {
    throw new AttachmentError(
      `テキストとして添付できません（中身が ${detected.ext} と判定されました）`,
    );
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (e) {
    throw new AttachmentError('UTF-8 として読めないのでテキストとして添付できません', {
      cause: toError(e),
    });
  }
  return rule.contentType;
};

/**
 * 添付するファイルを検証して読み込む。**検証してから読むまでの隙を作らない。**
 *
 * 順序に意味がある。入れ替えると検証が成立しない。
 *
 * 1. `realpath` で解決する（`resolve` は symlink を追わない）
 * 2. ルート配下かを `path.relative` で判定する（`isInside`）
 * 3. 拡張子を受け付けるものに限る
 * 4. **ハンドルを開き、以降はパスを再解決しない**（`stat` もハンドル経由）
 * 5. 通常ファイルであること・サイズ上限を見る
 * 6. 読み込んだバイト列でマジックバイトを判定する（**ファイルを開き直さない**）
 *
 * 4〜6 を1つのハンドルで通すのが TOCTOU 対策。`fileTypeFromFile` を使うとパスを
 * 開き直すので使わない。ハンドルは `await using` でスコープを抜けるときに閉じる。
 *
 * @param root - 添付を許すディレクトリ。設定で与える（クライアントからは変えられない）
 * @param requested - 利用者が指定したパス。ルートからの相対でも絶対でもよい
 * @param limits - サイズ上限
 * @returns multipart に載せるファイルパート
 * @throws {AttachmentError} ルート外・未知の拡張子・中身の不一致・サイズ超過・読めない場合
 */
export interface AttachmentOptions {
  readonly limits?: AttachmentLimits;
  /**
   * **このサーバ自身の設定ファイル**（`BACKLOG_ENV_FILE` / `BACKLOG_ENV_KEYS_FILE` /
   * `BACKLOG_POLICY` が指すもの）。ここに当たるファイルは添付として送り出さない。
   *
   * **主防御ではない。** 設定ファイルを添付ルートの外に置くのが主で、これは
   * ルートを広く取ってしまった場合に効く2枚目（README の例はポリシーをリポジトリ直下に
   * 置くので、作業ディレクトリをルートにすると配下に入りやすい）。
   */
  readonly selfPaths?: readonly string[];
}

export const readAttachment = async (
  root: string,
  requested: string,
  options: AttachmentOptions = {},
): Promise<AttachmentFile> => {
  const limits = options.limits ?? DEFAULT_ATTACHMENT_LIMITS;
  if (requested === '') {
    throw new AttachmentError('添付するファイルのパスを指定してください');
  }

  const realRoot = await realpath(root).catch((e: unknown) => {
    throw new AttachmentError('添付のルートディレクトリを解決できません', { cause: toError(e) });
  });
  const candidate = isAbsolute(requested) ? requested : join(realRoot, requested);

  const realPath = await realpath(candidate).catch((e: unknown) => {
    // パスそのものは載せない（存在の有無を細かく漏らさない）
    throw new AttachmentError('添付するファイルが見つかりません', { cause: toError(e) });
  });

  if (!isInside(realRoot, realPath)) {
    throw new AttachmentError('添付できるのは設定したルートの中のファイルだけです');
  }

  const rule = contentRuleFor(realPath);

  await using handle = await open(realPath).catch((e: unknown) => {
    throw new AttachmentError('添付するファイルを開けません', { cause: toError(e) });
  });

  // 以降はハンドル経由。パスを再解決しない（ここが TOCTOU の境目）
  const info = await handle.stat();
  if (!info.isFile()) {
    throw new AttachmentError('添付できるのは通常のファイルだけです');
  }

  // **開いたハンドルそのもの**と突き合わせる。名前や拡張子では塞がない
  // （env のパスは利用者が決めるので、`secrets.json` と名付ければ allowlist を通ってしまう）
  const self = { dev: info.dev, ino: info.ino, path: realPath };
  for (const denied of await identitiesOf(options.selfPaths ?? [])) {
    if (isSameFile(self, denied)) {
      // どのファイルだったかは書かない（設定の在り処を教えることになる）
      throw new AttachmentError('このサーバ自身の設定ファイルは添付できません');
    }
  }
  if (info.size > limits.maxBytes) {
    throw new AttachmentError(
      `ファイルが大きすぎます（上限 ${String(limits.maxBytes)} バイト、実際 ${String(info.size)} バイト）`,
    );
  }

  const bytes = new Uint8Array(info.size);
  const { bytesRead } = await handle.read(bytes, 0, info.size, 0);
  if (bytesRead !== info.size) {
    // 途中で切り詰められたものを黙って送らない（規約 §5.4）
    throw new AttachmentError('添付するファイルを最後まで読めませんでした');
  }

  const contentType = await verifyContent(bytes, rule);

  return { kind: 'file', filename: basename(realPath), contentType, data: bytes };
};

/** 設定のルートを絶対パスに直す。基準は呼び出し側が決める（cwd に依存させない）。 */
export const resolveAttachmentRoot = (baseDir: string, value: string): string =>
  isAbsolute(value) ? value : resolve(baseDir, value);
