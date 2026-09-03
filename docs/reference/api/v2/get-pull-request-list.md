---
title: プルリクエスト一覧の取得
slug: get-pull-request-list
method: GET
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-pull-request-list/"
fetched: 2026-08-30
---

# プルリクエスト一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests
```

プルリクエストの一覧を取得します。

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

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| statusId[]<br>[(複数指定可)](../guides/tips.md) | int | 状態のID |
| assigneeId[]<br>[(複数指定可)](../guides/tips.md) | int | 担当者のID |
| issueId[]<br>[(複数指定可)](../guides/tips.md) | int | 関連課題のID |
| createdUserId[]<br>[(複数指定可)](../guides/tips.md) | int | 登録者のID |
| offset | int |  |
| count | int | 取得上限(1-100) 指定が無い場合は20 |

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
        "id": 2,
        "projectId": 3,
        "repositoryId": 5,
        "number": 1,
        "summary": "test",
        "description": "test data",
        "base": "master",
        "branch": "develop",
        "status": {
            "id": 1,
            "name": "Open"
        },
        "assignee": {
            "id": 5,
            "userId": "testuser2",
            "name": "testuser2",
            "roleType": 1,
            "lang": null,
            "nulabAccount": {
                "nulabId": "J884YBYbiDBZcN4tj7rzcKcv8EYhekYcGfGtZ5oo7fCiGPnCjM",
                "name": "testuser2",
                "uniqueId": "testuser2"
            },
            "mailAddress": "testuser2@nulab.test",
            "lastLoginTime": "2022-09-01T06:35:39Z"
        },
        "issue": {
            "id": 31
        },
        "baseCommit": null,
        "branchCommit": null,
        "mergeCommit": null,
        "closeAt": null,
        "mergeAt": null,
        "createdUser":{
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
        "created": "2015-04-23T03:04:14Z",
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
        "updated":"2015-04-23T03:04:14Z"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
