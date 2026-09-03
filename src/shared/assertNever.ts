/**
 * assertNever.ts
 *
 * @description 型で閉じた union の網羅を証明し、実データが型を裏切った場合に送出する
 */

/**
 * 到達しないはずの分岐で送出する。
 *
 * 型が閉じていることをコンパイラに証明させると同時に、`as` を通った値・realm 越えの値・
 * 古いビルドの永続データが来たときに実行時にも落とす。
 *
 * **外部入力に使ってはならない。** 型が閉じていないので網羅を証明できず、単に throw する
 * だけの遠回りになる。
 *
 * @param value - 到達しないはずの値
 * @returns 戻らない
 * @throws {Error} 常に送出する
 */
export const assertNever = (value: never): never => {
  throw new Error(`到達しないはずの分岐に到達しました: ${JSON.stringify(value)}`);
};
