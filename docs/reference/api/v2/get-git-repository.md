---
title: Gitリポジトリの取得
slug: get-git-repository
method: GET
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-git-repository/"
fetched: 2026-08-30
---

# Gitリポジトリの取得

```http
GET /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName
```

Gitリポジトリを取得します。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
制限なし
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |
| repoIdOrName | string | リポジトリのID または リポジトリ名 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id":1,
    "projectId":151,
    "name":"app",
    "description":"",
    "hookUrl":null,
    "httpUrl":"https://xx.backlog.jp/git/BLG/app.git",
    "sshUrl":"xx@xx.git.backlog.jp:/BLG/app.git",
    "displayOrder":0,
    "pushedAt":null,
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
