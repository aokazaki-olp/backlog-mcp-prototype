---
title: プロジェクトユーザー一覧の取得
slug: get-project-user-list
method: GET
path: "/api/v2/projects/:projectIdOrKey/users"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-project-user-list/"
fetched: 2026-08-30
---

# プロジェクトユーザー一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/users
```

プロジェクトのユーザーの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| excludeGroupMembers | boolean | グループを介してプロジェクトに参加しているメンバーを除く |

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
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
