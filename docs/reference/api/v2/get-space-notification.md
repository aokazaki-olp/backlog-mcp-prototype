---
title: スペースのお知らせの取得
slug: get-space-notification
method: GET
path: /api/v2/space/notification
category: space
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-space-notification/"
fetched: 2026-08-30
---

# スペースのお知らせの取得

```http
GET /api/v2/space/notification
```

スペースのお知らせの情報を取得します。

## 実行可能な権限

```
すべての権限
```

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "content": "Notification",
    "updated": "2013-06-18T07:55:37Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
