---
title: プロジェクトユーザーの削除
slug: delete-project-user
method: DELETE
path: "/api/v2/projects/:projectIdOrKey/users"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/delete-project-user/"
fetched: 2026-08-30
---

# プロジェクトユーザーの削除

```http
DELETE /api/v2/projects/:projectIdOrKey/users
```

プロジェクトからユーザーを削除します。

## 実行可能な権限

```
管理者
プロジェクト管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| userId | int | 削除するユーザーのID |

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
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
