# mcp-docs

[modelcontextprotocol.io](https://modelcontextprotocol.io) が公開している Model Context
Protocol の仕様・ガイド・拡張仕様を取得して `docs/reference/mcp/` を再生成するスクリプト。

対象の版は `2025-06-18` / `2025-11-25` / `2026-07-28`。この 3 つは
[`src/mcp/protocol.ts`](../../src/mcp/protocol.ts) が対応版として宣言しているもの。

## 使い方

```bash
cd tools/mcp-docs

# 1. ページ一覧を更新する（ページの増減・版の追加を取り込む）
curl -sSL https://modelcontextprotocol.io/llms.txt -o llms.txt
python3 - <<'PY'
import re
txt = open('llms.txt', encoding='utf-8').read()
rows = re.findall(r'^- \[([^\]]*)\]\((https://modelcontextprotocol\.io[^)]*)\)(?::\s*(.*))?$', txt, re.M)
VERS = ('2025-06-18', '2025-11-25', '2026-07-28')
keep = re.compile(r'https://modelcontextprotocol\.io/(?:(?:specification|docs)/(?:%s)/|extensions/)' % '|'.join(VERS))
out, seen = [], set()
for title, url, desc in rows:
    if not keep.match(url) or url in seen:
        continue
    seen.add(url)
    out.append('\t'.join((url.replace('https://modelcontextprotocol.io', ''), title, (desc or '').strip())))
open('links.tsv', 'w', encoding='utf-8').write('\n'.join(sorted(out)) + '\n')
PY
rm llms.txt

# 2. 本文とスキーマを raw/ に取得する（取得済みのファイルはスキップ）
./fetch.sh

# 3. Markdown / pages.json / README を生成する
python3 build.py ../../docs/reference/mcp
```

`build.py` 冒頭の `FETCHED` を実行日に更新してから生成すること。版を増減するときは
`build.py` の `VERSIONS` / `LATEST` と、上の一覧生成の `VERS` を揃える。

## ファイル

| ファイル | 役割 |
| --- | --- |
| `links.tsv` | 取得対象 137 ページの「パス / 題名 / 説明」。`llms.txt` から生成する |
| `fetch.sh` | 本文を `raw/` へ並列ダウンロード（3 回リトライ）。あわせてスキーマの実体と、対象外リンクの転送先を取得する |
| `list-unmapped.py` | `raw/` から「対象一覧に無いサイト内リンク先」を列挙する（`fetch.sh` が転送先調査に使う） |
| `convert.py` | 前置きの除去・リンクの書き換え・`schema` ページの HTML 変換 |
| `build.py` | 変換結果から `specification/` `guides/` `extensions/` `schema/` `pages.json` `README.md` を生成。生成後にリンクを 2 つの観点で検査し、1 件でも引っかかれば失敗する（下記） |

`raw/` は生成物なのでコミットしない。

## 生成後の検査

`rewrite_target` は `page_map` に無いパスを**必ず絶対 URL に落とす**。そのため書き換えの
取りこぼしは「壊れた相対リンク」としては現れない。相対リンクだけを見る検査は構造上発火
しないので、2 つの観点で見る。

| 観点 | 何を捕まえるか |
| --- | --- |
| 相対リンクが解決できるか | 出力の配置と書き換えのずれ |
| ミラー内へ張れるはずのパスが絶対 URL のまま残っていないか | 書き換えの取りこぼし（素の URL など、`rewrite_links` が扱わない書き方） |

front matter の `source` は原文の所在なので、絶対 URL のままが正しい。検査の対象外にしている。

## サイトの `.md` 版をそのまま使わない理由

このサイトは全ページに `.md` 版を持っており本文はきれいだが、3 つだけ手を入れている。
何をどう変えたかは生成物側の
[`docs/reference/mcp/README.md`](../../docs/reference/mcp/README.md) に、生成時の実データ
から書き出している。

- **全ページ冒頭に「llms.txt を取得せよ」というブロック引用が入る。** 本文ではなく取得側
  への指示なので落とす。残すとミラーの読み手（人間とは限らない）への指示として働く
- **リンクがサイト絶対パスで書かれている。** 対象内はミラー内の相対パスへ、対象外は絶対
  URL へ書き換える。別名パス（`/specification/latest`）や別セクションへ転送されるパスが
  混ざるので、転送先は `fetch.sh` が実際に調べて `raw/redirects.tsv` に記録する
- **`schema` ページだけ typedoc の HTML がそのまま入っている**（Markdown として読めない）。
  型ごとの見出し・シグネチャ・説明に組み直す

## スキーマの実体は GitHub から取る

仕様書自身が authoritative と呼んでいるのは TypeScript スキーマの方で、サイトの `schema`
ページはその描画結果にすぎない。`fetch.sh` は
[`modelcontextprotocol/modelcontextprotocol`](https://github.com/modelcontextprotocol/modelcontextprotocol)
から版ごとの `schema.ts` / `schema.json` を取り、取得時点の commit を `raw/schema/COMMIT`
に記録する（`GH_REF` で参照を変えられる）。
