---
title: 関連課題一覧の取得
slug: get-list-of-related-issues
method: GET
path: "/api/v2/issues/:issueIdOrKey/relatedIssues"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-list-of-related-issues/"
fetched: 2026-08-30
---

# 関連課題一覧の取得

```http
GET /api/v2/issues/:issueIdOrKey/relatedIssues
```

課題に設定されている関連課題の一覧を取得します。  
レスポンスの各課題には、通常の課題情報に加えて関連の種類を示す`type`フィールドが含まれます（現在は常に`RELATES`です）。  
課題のIDと課題キーは[課題一覧の取得](./get-issue-list.md)から取得できます。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 以下のいずれかを指定します。<br>・課題のID<br>・課題キー<br>課題のIDと課題キーは[課題一覧の取得](./get-issue-list.md)から取得できます。 |

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/issues/SAMPLE-1/relatedIssues?apiKey=$API_KEY"
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

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
        "projectId": 1,
        "issueKey": "BLG-2",
        "keyId": 2,
        "issueType": {
            "id": 2,
            "projectId": 1,
            "name": "タスク",
            "color": "#7ea800",
            "displayOrder": 0
        },
        "summary": "second issue",
        "description": "",
        "resolution": null,
        "priority": {
            "id": 3,
            "name": "中"
        },
        "status": {
            "id": 1,
            "projectId": 1,
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
        "updated": "2012-07-23T06:10:15Z",
        "customFields": [],
        "attachments": [],
        "sharedFiles": [],
        "externalFileLinks": [],
        "stars": [],
        "type": "RELATES"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください。
