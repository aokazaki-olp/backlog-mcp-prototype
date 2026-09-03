---
title: ユーザーの受け取ったスター一覧の取得
slug: get-received-star-list
method: GET
path: "/api/v2/users/:userId/stars"
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-received-star-list/"
fetched: 2026-08-30
---

# ユーザーの受け取ったスター一覧の取得

```http
GET /api/v2/users/:userId/stars
```

ユーザーの受け取ったスターの一覧を取得します。

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
| minId | int | 最小ID |
| maxId | int | 最大ID |
| count | int | 取得上限(1-100) 指定が無い場合は20 |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
[
    {
        "id":75,
        "comment":null,
        "url": "https://xx.backlog.jp/view/BLG-1",
        "title": "[BLG-1] first issue | 課題の表示 - Backlog",
        "presenter":{
            "id":1,
            "userId": "admin",
            "name":"admin",
            "roleType":1,
            "lang":"ja",
            "nulabAccount": {
                "nulabId": "Prm9ZD9DQD5snNWcSYSwZiQoA9WFBUEa2ySznrSnSQRhdC2X8G",
                "name": "admin",
                "uniqueId": "admin"
            },
            "mailAddress":"eguchi@nulab.example",
            "lastLoginTime": "2022-09-01T06:35:39Z"
        },
        "created":"2014-01-23T10:55:19Z"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
