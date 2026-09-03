---
title: プロジェクト管理者一覧の取得
slug: get-list-of-project-administrators
method: GET
path: "/api/v2/projects/:projectIdOrKey/administrators"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-list-of-project-administrators/"
fetched: 2026-08-30
---

# プロジェクト管理者一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/administrators
```

プロジェクト管理者に設定されているユーザーの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

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
        "id": 5686,
        "userId": "takada",
        "name": "takada",
        "roleType":2,
        "lang":"ja",
        "nulabAccount": {
            "nulabId": "r4iGCWu4mU64aGUJykJH4GhBwdAXMTAtVRQ5RwZTDpeaECoBs2",
            "name": "takada",
            "uniqueId": "takada"
        },
        "mailAddress":"takada@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
