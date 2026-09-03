---
title: お知らせ数のリセット
slug: reset-unread-notification-count
method: POST
path: /api/v2/notifications/markAsRead
category: notifications
source: "https://developer.nulab.com/ja/docs/backlog/api/2/reset-unread-notification-count/"
fetched: 2026-08-30
---

# お知らせ数のリセット

```http
POST /api/v2/notifications/markAsRead
```

自分の受け取ったお知らせの未読数をリセットします。

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
    "count": 4
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
