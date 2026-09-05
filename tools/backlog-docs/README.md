# backlog-docs

[developer.nulab.com](https://developer.nulab.com/ja/docs/backlog/) の Backlog API
ドキュメント（日本語版）を取得して `docs/reference/api/` を再生成するスクリプト。

## 使い方

```bash
cd tools/backlog-docs

# 1. ページ一覧を更新する（エンドポイントの増減を取り込む）
curl -sSL https://developer.nulab.com/ja/docs/backlog/ \
  | grep -oE 'href="/ja/docs/backlog/[^"]*"' \
  | sed 's/href="//;s/"$//' | sort -u > ja-links.txt

# 2. HTML を raw/ に取得する（取得済みのファイルはスキップ）
./fetch.sh

# 3. Markdown / endpoints.json / README を生成する
python3 build.py ../../docs/reference/api
```

`build.py` 冒頭の `FETCHED` を実行日に更新してから生成すること。

## ファイル

| ファイル | 役割 |
| --- | --- |
| `fetch.sh` | `ja-links.txt` のページを `raw/` へ並列ダウンロード（3 回リトライ） |
| `convert.py` | 本文 `div.markdown` を Markdown へ変換。リンクをローカル `.md` へ書き換える |
| `build.py` | 変換結果から `v2/*.md` `guides/*.md` `endpoints.json` `README.md` を生成。生成後、出力内の相対リンクがすべて解決できるか検査し、1 件でも壊れていれば失敗する |
| `ja-links.txt` | 取得対象 160 ページの URL パス一覧 |

`raw/` は生成物なのでコミットしない。
