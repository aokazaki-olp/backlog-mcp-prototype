---
title: チーム情報の取得
slug: get-team
method: GET
path: "/api/v2/teams/:teamId"
category: teams
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-team/"
fetched: 2026-08-30
---

# チーム情報の取得

```http
GET /api/v2/teams/:teamId
```

チームの情報を取得します。

## 実行可能な権限

```
管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| teamId | int | チームのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 1,
    "name": "test",
    "members": [
        {
            "id": 2,
            "userId": "developer",
            "name": "developer",
            "roleType": 2,
            "lang": null,
            "nulabAccount": {
                "nulabId": "wZmTYcgsR75zebBQpyYRNES4cBZySC5rRizXxNeLJ83swN4nrS",
                "name": "developer",
                "uniqueId": "developer"
            },
            "mailAddress": "developer@nulab.example",
            "lastLoginTime": "2022-09-01T06:35:39Z"
        }
    ],
    "displayOrder": null,
    "createdUser": {
        "id": 1,
        "userId": "admin",
        "name": "admin",
        "roleType": 1,
        "lang": "ja",
        "nulabAccount": {
            "nulabId": "Prm9ZD9DQD5snNWcSYSwZiQoA9WFBUEa2ySznrSnSQRhdC2X8G",
            "name": "admin",
            "uniqueId": "admin"
        },
        "mailAddress": "eguchi@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "created": "2013-05-30T09:11:36Z",
    "updatedUser": {
        "id": 1,
        "userId": "admin",
        "name": "admin",
        "roleType": 1,
        "lang": "ja",
        "nulabAccount": {
            "nulabId": "Prm9ZD9DQD5snNWcSYSwZiQoA9WFBUEa2ySznrSnSQRhdC2X8G",
            "name": "admin",
            "uniqueId": "admin"
        },
        "mailAddress": "eguchi@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "updated": "2013-05-30T09:11:36Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
