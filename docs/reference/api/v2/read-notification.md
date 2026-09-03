---
title: お知らせの既読化
slug: read-notification
method: POST
path: "/api/v2/notifications/:id/markAsRead"
category: notifications
source: "https://developer.nulab.com/ja/docs/backlog/api/2/read-notification/"
fetched: 2026-08-30
---

# お知らせの既読化

```http
POST /api/v2/notifications/:id/markAsRead
```

お知らせを既読にします。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| id | int | お知らせのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 204 NO_CONTENT
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
