---
title: 課題の追加
slug: add-issue
method: POST
path: /api/v2/issues
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-issue/"
fetched: 2026-08-30
---

# 課題の追加

```http
POST /api/v2/issues
```

参加しているプロジェクトに新しい課題を追加します。  
新しい課題を子課題として追加する場合は、`parentIssueId`に親課題のIDを指定してください。  
自分が参加しているプロジェクトの一覧は[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
課題の登録のみ
制限なし
```

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectId（必須） | int | 課題を登録するプロジェクトのID。<br>プロジェクトのIDは[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。 |
| summary（必須） | string | 課題の件名 |
| parentIssueId | int | 課題の親課題のID。<br>課題のIDは[課題情報の取得](./get-issue.md)から取得できます。 |
| description | string | 課題の詳細。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |
| startDate | string | 課題の開始日 (yyyy-MM-dd) |
| dueDate | string | 課題の期限日 (yyyy-MM-dd) |
| estimatedHours | int | 課題の予定時間 |
| actualHours | int | 課題の実績時間 |
| issueTypeId（必須） | int | 課題の種別のID。<br>課題種別のIDは[種別一覧の取得](./get-issue-type-list.md)から取得できます。 |
| categoryId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のカテゴリーのID。<br>カテゴリーのIDは[カテゴリー一覧の取得](./get-category-list.md)から取得できます。 |
| versionId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のバージョンのID。<br>バージョンのIDは[バージョン(マイルストーン)一覧の取得](./get-version-milestone-list.md)から取得できます。 |
| milestoneId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のマイルストーンのID。<br>マイルストーンのIDは[バージョン(マイルストーン)一覧の取得](./get-version-milestone-list.md)から取得できます。 |
| priorityId（必須） | int | 課題の優先度のID。<br>優先度のIDは[優先度一覧の取得](./get-priority-list.md)から取得できます。 |
| assigneeId | int | 課題の担当者のユーザーのID。<br>ユーザーのIDは[プロジェクトユーザー一覧の取得](./get-project-user-list.md)から取得できます。 |
| notifiedUserId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の追加の通知を受け取るユーザーのID。<br>ユーザーのIDは[プロジェクトユーザー一覧の取得](./get-project-user-list.md)から取得できます。 |
| attachmentId[]<br>（[複数指定可](../guides/tips.md)） | int | [添付ファイル送信](./post-attachment-file.md)が返すID |

## カスタム属性

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_{id} | - | カスタム属性の値。<br>・テキスト属性: 文字列<br>・数値属性: 数値<br>・日付属性: 日付 (yyyy-MM-dd)<br>・リスト属性: 値のID<br>値のIDとカスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |
| customField_{id}_otherValue | - | リスト属性のその他入力の値。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |

## リクエストの例

```bash
curl --request POST \
--url "https://{{YOUR-DOMAIN}}/api/v2/issues?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data projectId=1 \
--data summary="New issue summary" \
--data description="New issue description" \
--data startDate="2024-04-01" \
--data dueDate="2024-05-01" \
--data estimatedHours=30 \
--data actualHours=10 \
--data issueTypeId=2 \
--data 'categoryId[]=1' \
--data 'categoryId[]=2' \
--data 'versionId[]=1' \
--data 'milestoneId[]=1' \
--data priorityId=2 \
--data assigneeId=1 \
--data 'notifiedUserId[]=1' \
--data 'notifiedUserId[]=2'
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 201 CREATED
Content-Type:application/json;charset=utf-8
Location:https://xx.backlog.jp/view/BLG-5742
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
    "updated": "2012-07-23T06:10:15Z",
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
    "stars": []
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
