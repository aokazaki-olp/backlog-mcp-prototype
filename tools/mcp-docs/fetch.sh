#!/usr/bin/env bash
# links.tsv のページを raw/ へ、schema.ts / schema.json を raw/schema/ へ取得する。
set -u
BASE="https://modelcontextprotocol.io"
GH_RAW="https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol"
GH_REF="${GH_REF:-main}"
SCHEMA_VERSIONS="2025-06-18 2025-11-25 2026-07-28"

mkdir -p raw raw/schema

fetch_one() {
  url="$1"
  out="$2"
  if [ -s "$out" ]; then echo "SKIP $out"; return 0; fi
  for _ in 1 2 3; do
    code=$(curl -sSL --compressed -m 45 -w "%{http_code}" -o "$out" "$url")
    if [ "$code" = "200" ] && [ -s "$out" ]; then echo "OK   $out"; return 0; fi
    sleep 2
  done
  echo "FAIL $url (last=$code)"
  rm -f "$out"
  return 1
}

fetch_page() {
  path="$1"
  slug=$(echo "$path" | sed 's#^/##; s#\.md$##; s#/#__#g')
  fetch_one "${BASE}${path}" "raw/${slug}.md"
}
export -f fetch_one fetch_page
export BASE

cut -f1 links.tsv | xargs -P 4 -I{} bash -c 'fetch_page "$@"' _ {}

# スキーマの実体。サイトの schema.md は typedoc の HTML なので、仕様書自身が
# authoritative と呼ぶリポジトリ側のファイルを取る。
for v in $SCHEMA_VERSIONS; do
  for f in schema.ts schema.json; do
    fetch_one "${GH_RAW}/${GH_REF}/schema/${v}/${f}" "raw/schema/${v}__${f}"
  done
done

# 再現できるように、取得時点の commit を記録する。
curl -sSL --compressed -m 30 \
  "https://api.github.com/repos/modelcontextprotocol/modelcontextprotocol/commits/${GH_REF}" \
  | sed -n 's/^  "sha": "\(.*\)",$/\1/p' | head -1 > raw/schema/COMMIT
echo "commit=$(cat raw/schema/COMMIT)"

# 対象外に見えるサイト内リンクの転送先を調べて記録する。別名パス
# （/specification/latest）や別セクションへの転送が原文に混ざっており、
# 転送先が対象内ならミラー内で辿れるべきなので、ここで実際の挙動を残す。
: > raw/redirects.tsv
python3 list-unmapped.py | while read -r path; do
  read -r code final < <(curl -sSL --compressed -m 30 -o /dev/null \
    -w "%{http_code} %{url_effective}" "${BASE}${path}"; echo)
  printf '%s\t%s\t%s\n' "$path" "$code" "${final#$BASE}" >> raw/redirects.tsv
done
echo "redirects=$(wc -l < raw/redirects.tsv)"
