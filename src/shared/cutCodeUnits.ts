/**
 * cutCodeUnits.ts
 *
 * @description 文字列を上限で切る。**サロゲートペアの途中で切らない**
 */

/** 上位サロゲートの範囲。下位（0xDC00〜0xDFFF）が続いて初めて1文字になる。 */
const HIGH_SURROGATE_START = 0xd800;
const HIGH_SURROGATE_END = 0xdbff;

/**
 * 上限で切る。**サロゲートペアの途中で切らない。**
 *
 * `length` も `slice` も UTF-16 の**符号単位**で数えるので、BMP の外の文字
 * （絵文字・拡張漢字）は2単位を占める。上限がその境目に落ちると**片割れだけが残り**、
 * 単独では文字にならない（`JSON.stringify` は孤立エスケープ `\ud842` として出す）。
 *
 * 上限そのものは符号単位のまま扱う — 目的は「際限なく長い文字列を通さない」ことなので、
 * **数え方を変えずに境目だけ避ける**。避けるぶん1単位短くなることはあるが、
 * 上限を超える方向へはずれない。
 *
 * @param text - 切る対象
 * @param maxLength - 上限（UTF-16 の符号単位）
 * @returns 上限以内に収めた文字列
 */
export const cutCodeUnits = (text: string, maxLength: number): string => {
  const cut = text.slice(0, maxLength);
  const last = cut.charCodeAt(cut.length - 1);
  // 上位サロゲートで終わっているなら、下位が次に続いていたはず。片割れを落とす
  return last >= HIGH_SURROGATE_START && last <= HIGH_SURROGATE_END ? cut.slice(0, -1) : cut;
};
