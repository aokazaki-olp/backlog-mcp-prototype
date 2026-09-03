#!/usr/bin/env bash
set -u
BASE="https://developer.nulab.com"
fetch_one() {
  path="$1"
  slug=$(echo "$path" | sed 's#^/ja/docs/backlog/##; s#/$##; s#/#__#g')
  [ -z "$slug" ] && slug="_index"
  out="raw/${slug}.html"
  if [ -s "$out" ]; then echo "SKIP $slug"; return 0; fi
  for i in 1 2 3; do
    code=$(curl -sSL --compressed -m 45 -w "%{http_code}" -o "$out" "${BASE}${path}")
    if [ "$code" = "200" ] && [ -s "$out" ]; then echo "OK   $slug"; return 0; fi
    sleep 2
  done
  echo "FAIL $path (last=$code)"
  rm -f "$out"
  return 1
}
export -f fetch_one
export BASE
xargs -a ja-links.txt -P 4 -I{} bash -c 'fetch_one "$@"' _ {}
