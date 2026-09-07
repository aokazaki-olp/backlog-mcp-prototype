/**
 * suppressed.ts
 *
 * @description 破棄中の失敗に隠れた「本来の失敗原因」を取り出す（規約 §6.3）
 */

/**
 * `SuppressedError` のフィールドの向きは直感と逆で、`error` が**破棄時**、
 * `suppressed` が**本体**（本来の失敗原因）を持つ。素朴に `message` を読むと
 * **どちらの原因も取れない**。
 *
 * 判定に `instanceof` を使わないのは realm を跨ぐと誤判定するため（規約 §6.2）。
 * **`Error.isSuppressedError` は存在しない**ので、`Error.isError` と構造で判定する。
 * 2つとも検査するのは、片方だけでは他方が絞れず型エラーになるため。
 */
const isSuppressed = (value: unknown): value is Error & { suppressed: unknown; error: unknown } =>
  Error.isError(value) && 'suppressed' in value && 'error' in value;

/**
 * 本来の失敗原因を取り出す。**入れ子になっていても最後まで辿る**
 * （`using` が複数あるスコープでは `SuppressedError` が積み重なる）。
 *
 * @param value - catch した値
 * @returns 本体側の失敗。`SuppressedError` でなければそのまま返す
 */
export const primaryError = (value: unknown): unknown =>
  isSuppressed(value) ? primaryError(value.suppressed) : value;

/**
 * 破棄中にも失敗していたか。**本来の原因を報告するとき、後始末の失敗を落とさない**
 * ための印（規約 §5.4 — 黙って捨てない）。
 *
 * @param value - catch した値
 * @returns 破棄側の失敗を伴っていれば true
 */
export const hasDisposalFailure = (value: unknown): boolean => isSuppressed(value);
