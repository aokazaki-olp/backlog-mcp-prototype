---
title: ユーザーアイコンの取得
slug: get-user-icon
method: GET
path: "/api/v2/users/:userId/icon"
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-user-icon/"
fetched: 2026-08-30
---

# ユーザーアイコンの取得

```http
GET /api/v2/users/:userId/icon
```

ユーザーのアイコン画像を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| userId | int | ユーザーのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/octet-stream
Content-Disposition:attachment;filename="person_168.gif"
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
