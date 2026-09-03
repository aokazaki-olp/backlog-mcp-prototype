---
title: プルリクエストの更新
slug: update-pull-request
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-pull-request/"
fetched: 2026-08-30
---

# プルリクエストの更新

```http
PATCH /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number
```

プルリクエストを更新します。

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
| number | int | プルリクエストの番号 |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| summary | string | プルリクエストの件名 |
| description | string | プルリクエストの詳細。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |
| issueId | int | 関連課題のID |
| assigneeId | int | プルリクエストの担当者のID |
| notifiedUserId[]<br>[(複数指定可)](../guides/tips.md) | int | プルリクエストの登録の通知を受け取るユーザーのID |
| comment | string | コメント。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
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
        "id": 1,
        "projectId": 1,
        "issueKey": "BLG-1",
        "keyId": 1,
        "issueType": {
            "id": 2,
            "projectId" :1,
            "name": "タスク",
            "color": "#7ea800",
            "displayOrder": 0
        },
        "summary": "first issue",
        "description": "",
        "resolution": null,
        "priority": {
            "id": 3,
            "name": "中"
        },
        "status": {
            "id": 1,
            "name": "未対応"
        },
        "assignee": {
            "id": 2,
            "userId": "eguchi",
            "name": "eguchi",
            "roleType" :2,
            "lang": null,
            "nulabAccount": {
                "nulabId": "tSaVeJfRxLURSAkgfbNAfCbM7PqddYLJ3nG3BELjx6eSTbu8LD",
                "name": "eguchi",
                "uniqueId": "eguchi"
            },
            "mailAddress": "eguchi@nulab.example",
            "lastLoginTime": "2022-09-01T06:35:39Z"
        },
        "category": [],
        "versions": [],
        "milestone": [
            {
                "id": 30,
                "projectId": 1,
                "name": "wait for release",
                "description": "",
                "startDate": null,
                "releaseDueDate": null,
                "archived": false
            }
        ],
        "startDate": null,
        "dueDate": null,
        "estimatedHours": null,
        "actualHours": null,
        "parentIssueId": null,
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
        "created": "2012-07-23T06:10:15Z",
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
        "updated": "2013-02-07T08:09:49Z",
        "customFields": [],
        "attachments": [
            {
                "id": 1,
                "name": "IMGP0088.JPG",
                "size": 85079
            },
            // ...
        ],
        "sharedFiles": [
            {
                "id": 454403,
                "projectId": 5,
                "type": "file",
                "dir": "/ユーザアイコン/",
                "name": "01_サラリーマン.png",
                "size": 2735,
                "createdUser": {
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
                "created": "2009-02-27T03:26:15Z",
                "updatedUser": {
                    "id": 5686,
                    "userId": "takada",
                    "name": "takada",
                    "roleType": 2,
                    "lang": "ja",
                    "nulabAccount": {
                        "nulabId": "r4iGCWu4mU64aGUJykJH4GhBwdAXMTAtVRQ5RwZTDpeaECoBs2",
                        "name": "takada",
                        "uniqueId": "takada"
                    },
                    "mailAddress": "takada@nulab.example",
                    "lastLoginTime": "2022-09-01T06:35:39Z"
                },
                "updated":"2009-03-03T16:57:47Z"
            },
            // ...
        ],
        "stars": [
            {
                "id": 10,
                "comment": null,
                "url": "https://xx.backlog.jp/view/BLG-1",
                "title": "[BLG-1] first issue | 課題の表示 - Backlog",
                "presenter": {
                    "id": 2,
                    "userId": "eguchi",
                    "name": "eguchi",
                    "roleType": 2,
                    "lang": "ja",
                    "nulabAccount": {
                        "nulabId": "tSaVeJfRxLURSAkgfbNAfCbM7PqddYLJ3nG3BELjx6eSTbu8LD",
                        "name": "eguchi",
                        "uniqueId": "eguchi"
                    },
                    "mailAddress": "eguchi@nulab.example",
                    "lastLoginTime": "2022-09-01T06:35:39Z"
                },
                "created":"2013-07-08T10:24:28Z"
            },
            // ...
        ]
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
    "updated":"2015-04-23T03:04:14Z",
    "attachments": [],
    "stars": []
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
