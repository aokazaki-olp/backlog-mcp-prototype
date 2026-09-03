---
title: スペース情報の取得
slug: get-space
method: GET
path: /api/v2/space
category: space
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-space/"
fetched: 2026-08-30
---

# スペース情報の取得

```http
GET /api/v2/space
```

スペースの情報を取得します。

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
    "spaceKey": "nulab",
    "name": "Nulab Inc.",
    "ownerId": 1,
    "lang": "ja",
    "timezone": "Asia/Tokyo",
    "reportSendTime": "08:00:00",
    "textFormattingRule": "markdown",
    "created": "2008-07-06T15:00:00Z",
    "updated": "2013-06-18T07:55:37Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
