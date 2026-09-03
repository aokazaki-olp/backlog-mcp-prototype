#!/usr/bin/env bash
#
# sync-libs.sh — aokazaki-olp/libraries から src/libs/ を生成する
#
# `src/libs/` は**借り物の生成物**であり、ローカルで編集しない。
# 修正が必要になったら元リポ側で直し、このスクリプトで作り直す。
#
# ## なぜコピーではなくコンパイルなのか
#
# libraries は**旧規約のままが正しい**（新規約を入れると全モジュールの改修になる）。
# そのコードをそのままコピーすると、本リポジトリでは2つ落ちる。
#
#   1. `HttpError` / `BacklogApiError` がパラメータプロパティを使っており、
#      Node の型注釈除去では実行できない
#      （TypeScript parameter property is not supported in strip-only mode）
#   2. 相対 import が `.js` なので、実ファイルが `.ts` だと解決できない
#
# **どちらもコンパイルすれば消える。** libraries 自身が `nodejs/tsconfig.json` に
# `outDir` / `declaration` を持っており、コンパイルされる前提で書かれている。
# 出力後は `.js` が実ファイルになるので、ソースの `./ApiClient.js` もそのまま正しい。
#
# 規約 §1.3（適用範囲は実行モデルで決める）・§8（実行モデルごとに設定を分ける）に従い、
# `src/libs/` は「コンパイルを通す実行モデル」として `tsconfig.libs.json` を持つ。
#
# ## 使い方
#
#   tools/sync-libs.sh <libraries のパス> <ref>
#   例: tools/sync-libs.sh ../libraries origin/claude/backlog-api-client-libraries-51jyj7

set -euo pipefail
cd "$(dirname "$0")/.."

LIBRARIES_PATH="${1:?libraries リポジトリのパスを指定してください}"
REF="${2:?同期する ref を指定してください}"

SRC_DIR=".libs-src"
DEST="src/libs"

# BacklogApiClient から到達可能なモジュールだけ。閉じたグラフになっている。
FILES=(
  httpTypes.ts
  LoggerFacade.ts
  HttpCore.ts
  ApiClient.ts
  BacklogApiClient.ts
)

COMMIT="$(git -C "$LIBRARIES_PATH" rev-parse "$REF")"
COMMIT_DATE="$(git -C "$LIBRARIES_PATH" show -s --format=%cI "$COMMIT")"

cleanup() { rm -rf "$SRC_DIR"; }
trap cleanup EXIT

rm -rf "$SRC_DIR" "$DEST"
mkdir -p "$SRC_DIR"

for file in "${FILES[@]}"; do
  git -C "$LIBRARIES_PATH" show "$COMMIT:nodejs/src/$file" >"$SRC_DIR/$file"
done

# ソースを置いた場所を rootDir にして、src/libs/ へ出力する。
cat >"$SRC_DIR/tsconfig.json" <<'EOF'
{
  "extends": "../tsconfig.libs.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "../src/libs"
  },
  "include": ["*.ts"]
}
EOF

npx tsc --project "$SRC_DIR/tsconfig.json"

cat >"$DEST/SOURCE.md" <<EOF
# src/libs/ の出所

**このディレクトリは借り物の生成物。ローカルで編集しない。**
正本は \`aokazaki-olp/libraries\`。修正が必要になったら元リポ側で直し、
\`tools/sync-libs.sh\` で作り直す。

| 項目 | 値 |
| --- | --- |
| リポジトリ | \`aokazaki-olp/libraries\` |
| ref | \`$REF\` |
| コミット | \`$COMMIT\` |
| コミット日時 | $COMMIT_DATE |
| 同期元 | \`nodejs/src/\` |

## 取り込んだモジュール

$(printf -- '- `%s`\n' "${FILES[@]}")

\`BacklogApiClient\` から到達可能なものだけ（閉じたグラフ）。

## コピーではなくコンパイルしている理由

libraries は**旧規約のままが正しい**（新規約を入れると全モジュールの改修になる）。
そのままコピーすると本リポジトリでは2つ落ちる。

1. \`HttpError\` / \`BacklogApiError\` が**パラメータプロパティ**を使っており、Node の
   型注釈除去では実行できない（\`TypeScript parameter property is not supported in strip-only mode\`）
2. 相対 import が \`.js\` なので、実ファイルが \`.ts\` だと解決できない

コンパイルすると両方とも消える。出力後は \`.js\` が実ファイルになるので、
ソースの \`./ApiClient.js\` という書き方もそのまま正しくなる。

規約 §1.3（適用範囲は実行モデルで決める）・§8（実行モデルごとに設定を分ける）に従い、
\`src/libs/\` は「コンパイルを通す実行モデル」として \`tsconfig.libs.json\` を持つ。
本体の設定と違い \`erasableSyntaxOnly\` も \`strict\` も付けない（借り物を新規約の
厳しさで検査しても直せない。§8.3「借り物・生成物は対象から外す」）。

**\`.ts\` のソースは残していない。** 上のコミットハッシュと \`tools/sync-libs.sh\` で
再現できる。残すと本体の tsconfig / lint が拾ってしまう。

## 未反映の上流修正

- **\`BacklogApiClient.create()\` の \`spaceUrl\` 検証が \`typeof string && !== ''\` だけ**で、
  スキームもホストも見ていない。任意ホストへ \`Backlog-API-Key\` ヘッダごと送れてしまう。
  本リポジトリでは **URL を受け取らず \`src/config.ts\` で組み立てる**ことで回避しているため
  実害はないが、libraries 側は \`SalesforceAuth.normalizeTokenHost\` に倣った検証を
  入れるべき（\`spaceUrl\` を受ける API である以上、そこでも検証すべき）。
EOF

echo "生成しました: $DEST（$COMMIT）"
ls -1 "$DEST"
