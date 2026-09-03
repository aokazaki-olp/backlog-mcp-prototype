#!/usr/bin/env bash
#
# verify-rules.sh — 規約 §8.3 の検証義務を果たす
#
# 「禁止するもの」は違反コードを1件書いて **落ちる** ことを、
# 「通すための土台」は準拠コードを1件書いて **通る** ことを、
# 「対象範囲の指定」は範囲の端にファイルを置いて **入る／入らない** を確かめる。
#
# 警告ゼロで通ることは「守られている」の証拠にならない（ルールを緩めても緑になる）ため、
# 設定を変えたとき・依存を更新したときは必ずこれを回す。
#
# このスクリプトを shell で書いているのは、`child_process` の import を lint で禁止して
# いるため。検証には子プロセスの起動が要るが、規則の意図は「サーバが子プロセスを
# 起動しないこと」なので、JS で書かないことで両立させている。

set -uo pipefail
cd "$(dirname "$0")/.."

PROBE_DIR="src/_probe"
PASS=0
FAIL=0

cleanup() { rm -rf "$PROBE_DIR"; }
trap cleanup EXIT

# 違反コードを置いて lint が落ちることを確かめる
expect_lint_error() {
  local name="$1" content="$2"
  mkdir -p "$PROBE_DIR"
  printf '%s\n' "$content" >"$PROBE_DIR/probe.ts"
  if npx eslint "$PROBE_DIR/probe.ts" >/dev/null 2>&1; then
    printf '  \033[31m✖\033[0m %s — 落ちなかった\n' "$name"
    FAIL=$((FAIL + 1))
  else
    printf '  \033[32m✔\033[0m %s\n' "$name"
    PASS=$((PASS + 1))
  fi
  rm -rf "$PROBE_DIR"
}

# 特定の層に違反コードを置いて lint が落ちることを確かめる（層の境界の検証用）
expect_layer_error() {
  local name="$1" path="$2" content="$3"
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$content" >"$path"
  if npx eslint "$path" >/dev/null 2>&1; then
    printf '  \033[31m✖\033[0m %s — 落ちなかった\n' "$name"
    FAIL=$((FAIL + 1))
  else
    printf '  \033[32m✔\033[0m %s\n' "$name"
    PASS=$((PASS + 1))
  fi
  rm -f "$path"
}

# 違反コードを置いて型チェックが落ちることを確かめる
expect_type_error() {
  local name="$1" content="$2"
  mkdir -p "$PROBE_DIR"
  printf '%s\n' "$content" >"$PROBE_DIR/probe.ts"
  if npx tsc --noEmit >/dev/null 2>&1; then
    printf '  \033[31m✖\033[0m %s — 落ちなかった\n' "$name"
    FAIL=$((FAIL + 1))
  else
    printf '  \033[32m✔\033[0m %s\n' "$name"
    PASS=$((PASS + 1))
  fi
  rm -rf "$PROBE_DIR"
}

# 準拠コードを置いて通ることを確かめる（土台の確認）
expect_lint_ok() {
  local name="$1" content="$2"
  mkdir -p "$PROBE_DIR"
  printf '%s\n' "$content" >"$PROBE_DIR/probe.ts"
  if npx eslint "$PROBE_DIR/probe.ts" >/dev/null 2>&1; then
    printf '  \033[32m✔\033[0m %s\n' "$name"
    PASS=$((PASS + 1))
  else
    printf '  \033[31m✖\033[0m %s — 通らなかった\n' "$name"
    npx eslint "$PROBE_DIR/probe.ts" 2>&1 | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
  rm -rf "$PROBE_DIR"
}

echo '── 型システム（規約 §4）'
expect_lint_error 'any を禁止する' \
  'export const f = (x: any): string => String(x);'
expect_lint_error '非 null アサーション `!` を禁止する' \
  'export const f = (xs: readonly string[]): string => xs[0]!;'
expect_lint_error '公開関数の戻り値型を要求する' \
  'export const f = (x: string) => x.length;'
expect_type_error 'enum を禁止する（消去可能構文だけを許す）' \
  'export enum Color { Red, Blue }'
expect_type_error 'パラメータプロパティを禁止する（同上）' \
  'export class A { constructor(public readonly x: number) {} }'
expect_type_error 'インデックスアクセスを厳しくする' \
  'const xs: string[] = []; export const f = (): number => xs[0].length;'

echo
echo '── 実行できない構文（規約 §4.8 — lint でしか止められない）'
expect_lint_error 'デコレータ構文を禁止する' \
  'const d = (_t: unknown): void => {};
export class A { @d method(): void {} }'
expect_lint_error '`accessor` フィールドを禁止する' \
  'export class A { accessor x = 1; }'

echo
echo '── モジュール（規約 §2.2）'
expect_lint_error '相対 import の `.js` を禁止する（静的）' \
  "import { toError } from '../shared/toError.js';
export const f = (): unknown => toError;"
expect_lint_error '相対 import の `.js` を禁止する（動的）' \
  "export const f = async (): Promise<unknown> => import('../shared/toError.js');"
# src/libs/ は借り物の生成物で実ファイルが `.js`。規約の趣旨は「実ファイルの拡張子を書く」
# なので、そこへの `.js` は正しい。例外が libs だけに効いていることを確かめる。
expect_lint_ok 'libs へは `.js` を書ける（実ファイルが `.js` だから）' \
  "import { BacklogApiClient } from '../libs/BacklogApiClient.js';
export const f = (): unknown => BacklogApiClient;"

echo
echo '── 構文・スタイル（規約 §5）'
expect_lint_error 'forEach を禁止する' \
  'export const f = (xs: readonly number[]): void => { xs.forEach(() => undefined); };'
expect_lint_error 'var を禁止する' \
  'export const f = (): number => { var n = 1; return n; };'
expect_lint_error 'ブロック省略を禁止する' \
  'export const f = (x: boolean): number => { if (x) return 1; return 0; };'
expect_lint_error 'Yoda 条件を禁止する' \
  'export const f = (x: number): boolean => { if (1 === x) { return true; } return false; };'
expect_lint_error '`.then()` チェーンを禁止する' \
  'export const f = (p: Promise<number>): void => { void p.then(() => undefined); };'
expect_lint_error '1行あたりの文の数を1に制限する' \
  'const a = 1; const b = 2;
export const f = (): number => a + b;'
expect_lint_error '等価演算子を厳格にする（null は除外）' \
  "export const f = (x: string): boolean => { if (x == 'a') { return true; } return false; };"
expect_lint_error 'switch の網羅性を検査する' \
  "type Kind = 'a' | 'b';
export const f = (k: Kind): number => {
  switch (k) {
    case 'a': {
      return 1;
    }
  }
  return 0;
};"

echo
echo '── この設計に固有の禁止'
expect_lint_error '`child_process` の import を禁止する' \
  "import { execSync } from 'node:child_process';
export const f = (): unknown => execSync;"
expect_layer_error 'tool 層から libs 層への import を禁止する' \
  'src/tool/_probe.ts' \
  "import { BacklogApiClient } from '../libs/BacklogApiClient.js';
export const f = (): unknown => BacklogApiClient;"
expect_layer_error 'policy 層から domain 層への import を禁止する' \
  'src/policy/_probe.ts' \
  "import { resolveMasters } from '../domain/masters.ts';
export const f = (): unknown => resolveMasters;"
expect_layer_error 'domain 層から tool 層への import を禁止する' \
  'src/domain/_probe.ts' \
  "import { buildTools } from '../tool/tools.ts';
export const f = (): unknown => buildTools;"

echo
echo '── 抑制コメント（規約 §4.7）'
expect_lint_error '不要になった抑制コメントを検出する' \
  '// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 発火しない箇所
export const f = (x: string): number => x.length;'

echo
echo '── 土台（通ることを確かめる）'
expect_lint_ok '準拠コードは通る' \
  "import { toError } from '../shared/toError.ts';
export const f = (e: unknown): string => toError(e).message;"

echo
echo '── 対象範囲（規約 §8.3）'
check_scope() {
  local name="$1" path="$2" expected="$3" content="$4"
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$content" >"$path"
  local actual='out'
  if ! npx eslint "$path" >/dev/null 2>&1; then
    actual='in'
  fi
  rm -f "$path"
  if [ "$actual" = "$expected" ]; then
    printf '  \033[32m✔\033[0m %s（%s）\n' "$name" "$expected"
    PASS=$((PASS + 1))
  else
    printf '  \033[31m✖\033[0m %s — 期待 %s、実際 %s\n' "$name" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

# `var` はテストでも緩めていないので、範囲に入っているかの指標に使える。
# （戻り値型の要求はテストでは意図的に off にしているため、指標にならない）
VAR_VIOLATION='export const f = (): number => { var n = 1; return n; };'
check_scope 'src/ は範囲に入る' 'src/_probe/probe.ts' 'in' "$VAR_VIOLATION"
check_scope 'tests/ は範囲に入る' 'tests/_probe/probe.test.ts' 'in' "$VAR_VIOLATION"

# 規約 §7.1「実行可能性のガードは緩めない」— テストでもデコレータは禁止のまま
check_scope 'テストでもデコレータ禁止は残る' 'tests/_probe/probe.test.ts' 'in' \
  'const d = (_t: unknown): void => {};
export class A { @d method(): void {} }'
rmdir tests/_probe 2>/dev/null || true

echo
echo "── 結果: 成功 ${PASS} / 失敗 ${FAIL}"
[ "$FAIL" -eq 0 ]
