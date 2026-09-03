---
title: スターの追加
slug: add-star
method: POST
path: /api/v2/stars
category: stars
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-star/"
fetched: 2026-08-30
---

# スターの追加

```http
POST /api/v2/stars
```

課題、コメント、Wikiにスターを1つ追加します。

## 実行可能な権限

```
すべての権限
```

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueId | int | 課題のID |
| commentId | int | コメントのID |
| wikiId | int | WikiページのID |
| pullRequestId | int | プルリクエストのID |
| pullRequestCommentId | int | プルリクエストコメントのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 204 NO_CONTENT
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
