#!/usr/bin/env bash
#
# sync-libs.sh — aokazaki-olp/libraries から src/libs/ へ同期する
#
# 規約 §9 相当（electron-prototype CODING_RULES §9）:
#   src/libs/ はコピー元リポジトリが正本。**ローカルで直接編集しない。**
#   修正が必要になったら、まず元リポ側に PR を出してマージしてから同期する。
#
# 唯一の例外が、下記「拡張子の書き換え」。これは人手の編集ではなく
# **同期処理の一部として機械的に適用する変換**であり、毎回同じ結果になる。
#
#   libraries 側の相対 import は `.js`（旧規約）だが、本リポジトリは Node の
#   型注釈除去で `.ts` を直接実行するため、実ファイルの拡張子でしか解決できない
#   （新 CODING_RULES §2.2）。libraries が `.ts` へ移行したらこの変換は不要になる。
#
# 使い方:
#   tools/sync-libs.sh <libraries のパス> <ref>
#   例: tools/sync-libs.sh ../libraries origin/claude/backlog-api-client-libraries-51jyj7

set -euo pipefail
cd "$(dirname "$0")/.."

LIBRARIES_PATH="${1:?libraries リポジトリのパスを指定してください}"
REF="${2:?同期する ref を指定してください}"
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

rm -rf "$DEST"
mkdir -p "$DEST"

for file in "${FILES[@]}"; do
  git -C "$LIBRARIES_PATH" show "$COMMIT:nodejs/src/$file" |
    # 相対 import の拡張子だけを .js → .ts に書き換える。
    # パッケージ import（'got' 等）には触れない。
    sed -E "s|(from '\.{1,2}/[^']*)\.js'|\1.ts'|g; s|(import\('\.{1,2}/[^']*)\.js'|\1.ts'|g" \
      >"$DEST/$file"
done

cat >"$DEST/SOURCE.md" <<EOF
# src/libs/ の出所

**このディレクトリはローカルで編集しない。** 正本は下記リポジトリ。
修正が必要になったら元リポ側に PR を出してマージし、\`tools/sync-libs.sh\` で同期し直す。

| 項目 | 値 |
| --- | --- |
| リポジトリ | \`aokazaki-olp/libraries\` |
| ref | \`$REF\` |
| コミット | \`$COMMIT\` |
| コミット日時 | $COMMIT_DATE |
| 同期元 | \`nodejs/src/\` |

## 同期したファイル

$(printf -- '- `%s`\n' "${FILES[@]}")

\`BacklogApiClient\` から到達可能なモジュールだけを取っている（閉じたグラフ）。

## 同期時に適用した変換

**相対 import の拡張子を \`.js\` → \`.ts\` に書き換えている。**

libraries 側は旧規約に従って \`.js\` を書いているが、本リポジトリは Node の型注釈除去で
\`.ts\` を直接実行するため、実ファイルの拡張子でしか解決できない（新 \`CODING_RULES.md\` §2.2）。
パッケージ import（\`got\` 等）には触れていない。

これは人手の編集ではなく **\`tools/sync-libs.sh\` が毎回同じように適用する機械的変換**である。
libraries 側が \`.ts\` へ移行したらこの変換は不要になる。

## 未反映の上流修正

- **\`BacklogApiClient.create()\` の \`spaceUrl\` 検証が \`typeof string && !== ''\` だけ**で、
  スキームもホストも見ていない。任意ホストへ \`Backlog-API-Key\` ヘッダごと送れてしまう。
  本リポジトリでは **URL を受け取らず \`src/config.ts\` で組み立てる**ことで回避しているため
  実害はないが、libraries 側は \`SalesforceAuth.normalizeTokenHost\` に倣った検証を入れるべき。
EOF

echo "同期しました: $DEST（$COMMIT）"
