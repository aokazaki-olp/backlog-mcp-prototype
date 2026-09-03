---
title: ウォッチの追加
slug: add-watching
method: POST
path: /api/v2/watchings
category: watchings
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-watching/"
fetched: 2026-08-30
---

# ウォッチの追加

```http
POST /api/v2/watchings
```

ウォッチを追加します。

## 実行可能な権限

```
すべての権限
```

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey (必須) | string | 課題のID または 課題キー |
| note | string | メモ |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 201 CREATED
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 1,
    "note": "This is a note for the watching.",
    "type": "issue",
    "issue": {
        "id": 4531,
        "projectId": 2,
        "issueKey": "TEST2-17",
        "keyId": 17,
        "issueType": {
            "id": 7,
            "projectId": 2,
            "name": "Bug",
            "color": "#990000",
            "displayOrder": 0
        },
        "summary": "aaa",
        "description": "",
        "resolution": null,
        "priority": {
            "id": 3,
            "name": "Normal"
        },
        "status": {
            "id": 1,
            "projectId": 2,
            "name": "Open",
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
    "lastContentUpdated":"2013-10-31T06:58:59Z",
    "created": "2013-10-31T06:58:59Z",
    "updated": "2013-10-31T06:58:59Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
