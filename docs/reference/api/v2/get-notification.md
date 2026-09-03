---
title: お知らせ一覧の取得
slug: get-notification
method: GET
path: /api/v2/notifications
category: notifications
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-notification/"
fetched: 2026-08-30
---

# お知らせ一覧の取得

```http
GET /api/v2/notifications
```

自分の受け取ったお知らせの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| minId | int | 最小ID |
| maxId | int | 最大ID |
| count | int | 取得上限(1-100) 指定が無い場合は20 |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |
| senderId | int | 送信者ID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```
### レスポンスボディ
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
[
    {
        "id": 299,
        "alreadyRead": true,
        "reason": 2,
        "resourceAlreadyRead": true,
        "project": {
            "id": 2,
            "projectKey": "TEST2",
            "name": "test2",
            "chartEnabled": true,
            "useResolvedForChart": true,
            "subtaskingEnabled": true,
            "projectLeaderCanEditProjectLeader": false,
            "useWiki": true,
            "useDocument": true,
            "useFileSharing": true,
            "useWikiTreeView": true,
            "useSubversion": true,
            "useGit": true,
            "useOriginalImageSizeAtWiki": false,
            "textFormattingRule": "backlog",
            "archived": false,
            "displayOrder": 3,
            "useDevAttributes": true
        },
        "issue": {
            "id": 4531,
            "projectId": 2,
            "issueKey": "TEST2-17",
            "keyId": 17,
            "issueType": {
                "id": 7,
                "projectId": 2,
                "name": "バグ",
                "color": "#990000",
                "displayOrder": 0
            },
            "summary": "aaa",
            "description": "",
            "resolution": null,
            "priority": {
                "id": 3,
                "name": "中"
            },
            "status": {
                "id": 1,
                "projectId": 2,
                "name": "未対応",
                "color": "#ed8077",
                "displayOrder": 1000
            },
            "assignee": {
                "id": 2,
                "userId": "eguchi",
                "name": "eguchi",
                "roleType": 2,
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
            "milestone": [],
            "startDate": "2013-08-29T15:00:00Z",
            "dueDate": "2013-09-03T15:00:00Z",
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
            "created": "2013-04-23T07:38:59Z",
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
            "updated": "2013-09-06T09:25:41Z",
            "customFields": [],
            "attachments": [],
            "sharedFiles": [],
            "stars": []
        },
        "comment": {
            "id": 7007,
            "projectId": 5,
            "issueId": 50,
            "content": "hoge",
            "changeLog": null,
            "createdUser": {
                "id": 2,
                "userId": "eguchi",
                "name": "eguchi",
                "roleType": 2,
                "lang": null,
                "nulabAccount": {
                    "nulabId": "tSaVeJfRxLURSAkgfbNAfCbM7PqddYLJ3nG3BELjx6eSTbu8LD",
                    "name": "eguchi",
                    "uniqueId": "eguchi"
                },
                "mailAddress": "eguchi@nulab.example",
                "lastLoginTime": "2022-09-01T06:35:39Z"
            },
            "created": "2013-10-31T06:58:58Z",
            "updated": "2013-10-31T06:58:58Z",
            "stars": [],
            "notifications": []
        },
        "repository": null,
        "pullRequest": null,
        "pullRequestComment": null,
        "sender": {
            "id": 2
            "userId": "eguchi",
            "name": "eguchi",
            "roleType": 2,
            "lang": null,
            "nulabAccount": {
                "nulabId": "tSaVeJfRxLURSAkgfbNAfCbM7PqddYLJ3nG3BELjx6eSTbu8LD",
                "name": "eguchi",
                "uniqueId": "eguchi"
            },
            "mailAddress": "eguchi@nulab.example",
            "lastLoginTime": "2022-09-01T06:35:39Z"
        },
        "created": "2013-10-31T06:58:59Z"
    },
    // ...
]
```

## レスポンス説明

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| reason | int | 通知の種別：<br>1:課題の担当者に設定<br>2:課題にコメント<br>3:課題の追加<br>4:課題の更新<br>5:ファイルを追加<br>6:プロジェクトユーザーの追加<br>9:その他<br>10:プルリクエストの担当者に設定<br>11:プルリクエストにコメント<br>12:プルリクエストの追加<br>13:プルリクエストの更新<br>14:ドキュメントにコメント<br>15:ドキュメントのコメントに返信<br>17:ドキュメントでメンション |

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
