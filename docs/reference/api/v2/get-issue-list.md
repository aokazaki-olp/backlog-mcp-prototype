---
title: 課題一覧の取得
slug: get-issue-list
method: GET
path: /api/v2/issues
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-issue-list/"
fetched: 2026-08-30
---

# 課題一覧の取得

```http
GET /api/v2/issues
```

参加しているプロジェクトから課題を取得します。  
クエリパラメーターで指定された条件で、取得する課題を絞り込むことができます。  
自分が参加しているプロジェクトの一覧は[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectId[]<br>（[複数指定可](../guides/tips.md)） | int | プロジェクトのID。<br>プロジェクトのIDは[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。 |
| issueTypeId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の種別のID。<br>種別のIDは[種別一覧の取得](./get-issue-type-list.md)から取得できます。 |
| categoryId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のカテゴリーのID。<br>カテゴリーのIDは[カテゴリー一覧の取得](./get-category-list.md)から取得できます。 |
| versionId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のバージョンのID。<br>バージョンのIDは[バージョン(マイルストーン)一覧の取得](./get-version-milestone-list.md)から取得できます。 |
| milestoneId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のマイルストーンのID。<br>マイルストーンのIDは[バージョン(マイルストーン)一覧の取得](./get-version-milestone-list.md)から取得できます。 |
| statusId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の状態のID。<br>状態のIDは[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。 |
| priorityId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の優先度のID。<br>優先度のIDは[優先度一覧の取得](./get-priority-list.md)から取得できます。 |
| assigneeId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の担当者のユーザーのID。<br>ユーザーのIDは[プロジェクトユーザー一覧の取得](./get-project-user-list.md)から取得できます。 |
| createdUserId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の登録者のユーザーのID。<br>ユーザーのIDは[プロジェクトユーザー一覧の取得](./get-project-user-list.md)から取得できます。 |
| resolutionId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の完了理由のID。<br>完了理由のIDは[完了理由一覧の取得](./get-resolution-list.md)から取得できます。 |
| parentChild | int | 親子課題の条件。指定が無い場合は0が使われます。<br>・0: すべて<br>・1: 子課題以外<br>・2: 2階層または3階層<br>・3: 階層なし<br>・4: 子課題あり<br>・5: 3階層目<br>・6: 2階層目<br>・7: 最上位<br>・8: 3階層以外<br>・9: 最上位（3階層）以外<br>・10: 最下層 |
| attachment | boolean | 課題が添付ファイルを含むかどうか。<br>・true：添付ファイルを含む課題<br>・false：添付ファイルを含まない課題 |
| sharedFile | boolean | 課題が共有ファイルを含むかどうか。<br>・true：共有ファイルを含む課題<br>・false：共有ファイルを含まない課題 |
| sort | string | 課題一覧の並び順に使用する属性。<br>・issueType<br>・category<br>・version<br>・milestone<br>・summary<br>・status<br>・priority<br>・attachment<br>・sharedFile<br>・created<br>・createdUser<br>・updated<br>・updatedUser<br>・assignee<br>・startDate<br>・dueDate<br>・estimatedHours<br>・actualHours<br>・childIssue<br>・customField_${id}<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |
| order | string | 課題一覧の並び順。指定が無い場合はdescが使われます。<br>・asc: 昇順<br>・desc: 降順 |
| offset | int | 課題の取得開始位置。0以上の整数を指定してください。 |
| count | int | 課題の件数の上限。1〜100の範囲で指定してください。指定が無い場合は20が使われます。 |
| createdSince | string | 課題の登録日の期間の開始（yyyy-MM-dd） |
| createdUntil | string | 課題の登録日の期間の終了（yyyy-MM-dd） |
| updatedSince | string | 課題の更新日の期間の開始（yyyy-MM-dd） |
| updatedUntil | string | 課題の更新日の期間の終了（yyyy-MM-dd） |
| startDateSince | string | 課題の開始日の期間の開始（yyyy-MM-dd） |
| startDateUntil | string | 課題の開始日の期間の終了（yyyy-MM-dd） |
| dueDateSince | string | 課題の期限日の期間の開始（yyyy-MM-dd） |
| dueDateUntil | string | 課題の期限日の期間の終了（yyyy-MM-dd） |
| hasDueDate | boolean | falseを指定すると、期限日が設定されていない課題を返します。trueの指定はサポートされておらず、エラーが返されます。 |
| id[]<br>（[複数指定可](../guides/tips.md)） | int | 課題のID。<br>課題のIDは[課題情報の取得](./get-issue.md)から取得できます。 |
| parentIssueId[]<br>（[複数指定可](../guides/tips.md)） | int | 課題の親課題のID。<br>課題のIDは[課題情報の取得](./get-issue.md)から取得できます。 |
| keyword | string | 検索キーワード |
| expand[]<br>（[複数指定可](../guides/tips.md)） | string | 拡張フィールドの指定。<br>・`childIssueSummary`: 直下の子課題の総件数（`total`）および完了件数（`closed`）を `childIssueSummary` オブジェクトとしてレスポンスに含めます。省略時はレスポンスに含まれません。 |

## カスタム属性を指定した検索（テキスト属性）

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id} | string | 検索キーワード。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |

## カスタム属性を指定した検索（数値属性）

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id}_min | int | カスタム属性の最小値。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |
| customField_${id}_max | int | カスタム属性の最大値。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |

## カスタム属性を指定した検索（日付属性）

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id}_min | string | カスタム属性の開始日（yyyy-MM-dd）。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |
| customField_${id}_max | string | カスタム属性の終了日（yyyy-MM-dd）。<br>カスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |

## カスタム属性を指定した検索（リスト属性）

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id}[]<br>（[複数指定可](../guides/tips.md)） | int | カスタム属性の値のID。<br>値のIDとカスタム属性のIDは[カスタム属性一覧の取得](./get-custom-field-list.md)から取得できます。 |

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/issues?apiKey=$API_KEY" \
--data 'projectId[]=123' \
--data 'projectId[]=456' \
--data 'issueTypeId[]=1' \
--data 'issueTypeId[]=2' \
--data 'categoryId[]=1' \
--data 'categoryId[]=2' \
--data parentChild=0 \
--data attachment=false \
--data sharedFile=false \
--data sort=updated \
--data order=desc \
--data keyword=hoge \
--data offset=1 \
--data count=10 \
--data createdSince=2020-04-01
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
        "childIssueSummary": {
            "total": 3,
            "closed": 1
        },
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
    }
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
