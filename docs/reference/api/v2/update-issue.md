---
title: 課題情報の更新
slug: update-issue
method: PATCH
path: "/api/v2/issues/:issueIdOrKey"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-issue/"
fetched: 2026-08-30
---

# 課題情報の更新

```http
PATCH /api/v2/issues/:issueIdOrKey
```

参加しているプロジェクトの課題を更新します。  
更新したい課題は、[課題一覧の取得](./get-issue-list.md)から検索できます。  
自分が参加しているプロジェクトの一覧は[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
制限なし
```

## URLパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 以下のいずれかを指定します。<br>・課題のID<br>・課題キー<br>課題のIDと課題キーは[課題一覧の取得](./get-issue-list.md)から取得できます。 |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| summary | string | 課題の件名 |
| parentIssueId | int | 課題の親課題のID。<br>課題のIDは[課題情報の取得](./get-issue.md)から取得できます。 |
| description | string | 課題の詳細。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |
| statusId | int | 課題の状態のID。<br>状態のIDは[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。 |
| resolutionId | int | 課題の完了理由のID。<br>完了理由のIDは[完了理由一覧の取得](get-resolution-list)から取得できます。 |
| startDate | string | 課題の開始日（yyyy-MM-dd） |
| dueDate | string | 課題の期限日（yyyy-MM-dd） |
| estimatedHours | int | 課題の予定時間 |
| actualHours | int | 課題の実績時間 |
| issueTypeId | int | 課題の種別のID。<br>種別のIDは[種別一覧の取得](./get-issue-type-list.md)から取得できます。 |
| categoryId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のカテゴリーのID。<br>カテゴリーのIDは[カテゴリー一覧の取得](./get-category-list.md)から取得できます。 |
| versionId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のバージョンのID。<br>バージョンのIDは[バージョン(マイルストーン)一覧の取得](./get-version-milestone-list.md)から取得できます。 |
| milestoneId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のマイルストーンのID。<br>バージョンのIDは[バージョン(マイルストーン)一覧の取得](./get-version-milestone-list.md)から取得できます。 |
| priorityId | int | 課題の優先度のID。<br>優先度のIDは[優先度一覧の取得](./get-priority-list.md)から取得できます。 |
| assigneeId | int | 課題の担当者のユーザーのID。<br>ユーザーのIDは[プロジェクトユーザー一覧の取得](./get-project-user-list.md)から取得できます。 |
| notifiedUserId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の追加の通知を受け取るユーザーのID。<br>ユーザーのIDは[プロジェクトユーザー一覧の取得](./get-project-user-list.md)から取得できます。 |
| attachmentId[]<br>（[複数指定可](../guides/tips.md)） | int | [添付ファイル送信](./post-attachment-file.md)が返すID |
| comment | string | コメント。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |

## カスタム属性

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_{id} | - | カスタム属性の値。<br>・テキスト属性: 文字列<br>・数値属性: 数値<br>・日付属性: 日付（yyyy-MM-dd）<br>・リスト属性: 値のID<br>値のIDとカスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |
| customField_{id}_otherValue | - | リスト属性のその他入力の値。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |

## リクエストの例

```bash
curl --request PATCH \
--url "https://{{YOUR-DOMAIN}}/api/v2/issues/SAMPLE1-1?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data summary="Update issue summary" \
--data description="Update issue description" \
--data statusId=3 \
--data resolutionId=3 \
--data startDate="2024-05-01" \
--data dueDate="2024-06-01" \
--data estimatedHours=40 \
--data actualHours=20 \
--data issueTypeId=2 \
--data 'categoryId[]=2' \
--data 'versionId[]=2' \
--data 'milestoneId[]=2' \
--data priorityId=2 \
--data assigneeId=2 \
--data 'notifiedUserId[]=3' \
--data comment="Update this issue"
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
{
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
        "projectId": 1,
        "name": "未対応",
        "color": "#ed8077",
        "displayOrder": 1000
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
            "archived": false,
            "displayOrder": 0
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
    "sharedFiles": [],
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
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
