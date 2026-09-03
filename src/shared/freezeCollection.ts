/**
 * freezeCollection.ts
 *
 * @description Map / Set を実行時にも変更不能にする
 */

/**
 * `Object.freeze` は Map / Set の内部スロットを凍結しない。
 * `Object.freeze(new Map())` の後でも `.set()` は通ってしまうため、変更メソッド自体を塞ぐ。
 */
const denyMutators = (target: object, names: readonly string[], label: string): void => {
  for (const name of names) {
    Object.defineProperty(target, name, {
      value: (): never => {
        throw new TypeError(`凍結済みの${label}は変更できません（${name}）`);
      },
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
};

const MAP_MUTATORS = ['set', 'delete', 'clear'] as const;
const SET_MUTATORS = ['add', 'delete', 'clear'] as const;

/**
 * Map を実行時に変更不能にする。
 *
 * 値そのものは凍結しない（必要なら呼び出し側で個別に凍結する）。
 *
 * @param map - 凍結する Map
 * @returns 同一インスタンスを読み取り専用の型で返す
 */
export const freezeMap = <K, V>(map: Map<K, V>): ReadonlyMap<K, V> => {
  denyMutators(map, MAP_MUTATORS, 'Map');
  return Object.freeze(map);
};

/**
 * Set を実行時に変更不能にする。
 *
 * @param set - 凍結する Set
 * @returns 同一インスタンスを読み取り専用の型で返す
 */
export const freezeSet = <T>(set: Set<T>): ReadonlySet<T> => {
  denyMutators(set, SET_MUTATORS, 'Set');
  return Object.freeze(set);
};
