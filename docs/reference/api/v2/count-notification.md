---
title: お知らせ数の取得
slug: count-notification
method: GET
path: /api/v2/notifications/count
category: notifications
source: "https://developer.nulab.com/ja/docs/backlog/api/2/count-notification/"
fetched: 2026-08-30
---

# お知らせ数の取得

```http
GET /api/v2/notifications/count
```

自分の受け取ったお知らせの数を取得します。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| alreadyRead | boolean |  |
| resourceAlreadyRead | boolean |  |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "count": 138
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
