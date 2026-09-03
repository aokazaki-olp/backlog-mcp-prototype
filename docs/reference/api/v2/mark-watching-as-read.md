---
title: ウォッチの既読化
slug: mark-watching-as-read
method: POST
path: "/api/v2/watchings/:watchingId/markAsRead"
category: watchings
source: "https://developer.nulab.com/ja/docs/backlog/api/2/mark-watching-as-read/"
fetched: 2026-08-30
---

# ウォッチの既読化

```http
POST /api/v2/watchings/:watchingId/markAsRead
```

ウォッチを既読にします。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| watchingId | int | ウォッチのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 204 NO_CONTENT
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
