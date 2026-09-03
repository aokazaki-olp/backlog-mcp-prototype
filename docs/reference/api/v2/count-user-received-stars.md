---
title: ユーザーの受け取ったスターの数の取得
slug: count-user-received-stars
method: GET
path: "/api/v2/users/:userId/stars/count"
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/count-user-received-stars/"
fetched: 2026-08-30
---

# ユーザーの受け取ったスターの数の取得

```http
GET /api/v2/users/:userId/stars/count
```

ユーザーの受け取ったスターの数を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| userId | int | ユーザーのID |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| since | string | 指定した日付以降のスターをカウント (yyyy-MM-dd) |
| until | string | 指定した日付以前のスターをカウント (yyyy-MM-dd) |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "count":54
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
