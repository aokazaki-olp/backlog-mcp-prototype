---
title: Wiki添付ファイルのダウンロード
slug: get-wiki-page-attachment
method: GET
path: "/api/v2/wikis/:wikiId/attachments/:attachmentId"
category: wikis
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-wiki-page-attachment/"
fetched: 2026-08-30
---

# Wiki添付ファイルのダウンロード

【お知らせ】2026年7月14日から、Wikiの提供方針を以下のとおり変更します。

- 新規スペース：Wikiはご利用いただけません
- 既存スペース：新規プロジェクトのWikiは初期設定がオフになります。プロジェクト設定からオンに切り替えられます

詳しくは、[新規スペースへのWiki提供終了と初期設定の変更について](https://backlog.com/ja/blog/backlog-update-wiki-end-of-support-new-spaces/)を参照してください。

---

Wiki関連のAPIは引き続きご利用いただけます。将来的なWikiの廃止に伴うAPIへの影響は、スケジュール確定後に十分な周知期間を設けて改めてご案内します。

```http
GET /api/v2/wikis/:wikiId/attachments/:attachmentId
```

Wikiの添付ファイルをダウンロードします。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| wikiId | int | WikiページのID |
| attachmentId | int | 添付ファイルのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/octet-stream
Content-Disposition:attachment;filename="attachment.doc"
```

### レスポンスボディ

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
