/**
 * toError.ts
 *
 * @description catch した unknown を Error に正規化する（`as Error` を散在させないため）
 */

/**
 * 任意の値を `Error` に正規化する。
 *
 * 判定に `instanceof` を使わないのは realm を跨ぐと誤判定するため（`node:vm`・worker・
 * 別 realm 由来の Error）。`Error` でない値は捨てずに `cause` に入れる。
 *
 * @param value - catch した値
 * @returns Error インスタンス
 */
export const toError = (value: unknown): Error => {
  if (Error.isError(value)) {
    return value;
  }
  return new Error(`Error ではない値が送出されました: ${String(value)}`, { cause: value });
};
