---
title: レート制限情報の取得
slug: get-rate-limit
method: GET
path: /api/v2/rateLimit
category: rateLimit
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-rate-limit/"
fetched: 2026-08-30
---

# レート制限情報の取得

```http
GET /api/v2/rateLimit
```

使用中のAPIキーに対応するユーザーに対して、現在設定されているレート制限に関する情報を取得します。

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
  "rateLimit": {
    "read": {
      "limit": 600,
      "remaining": 600,
      "reset": 1603881873
    },
    "update": {
      "limit": 150,
      "remaining": 150,
      "reset": 1603881873
    },
    "search": {
      "limit": 150,
      "remaining": 150,
      "reset": 1603881873
    },
    "icon": {
      "limit": 60,
      "remaining": 60,
      "reset": 1603881873
    }
  }
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
