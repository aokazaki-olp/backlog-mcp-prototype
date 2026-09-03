---
title: ユーザーの最近の活動の取得
slug: get-user-recent-updates
method: GET
path: "/api/v2/users/:userId/activities"
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-user-recent-updates/"
fetched: 2026-08-30
---

# ユーザーの最近の活動の取得

```http
GET /api/v2/users/:userId/activities
```

ユーザーの最近の活動の一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| userId | int | ユーザーのID |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| activityTypeId[]<br>[(複数指定可)](../guides/tips.md) | int | type(1-17) |
| minId | int | 最小ID |
| maxId | int | 最大ID |
| count | int | 取得上限(1-100) 指定が無い場合は20 |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

2022年2月9日にレスポンスボディからnotificationsのコンテンツが削除され空の配列になります。 詳しくは[こちら](https://backlog.com/ja/product-updates/announcement/backlog-will-changes-to-the-get-recent-updates-apis/)をご確認下さい。

```json
[
    {
        "id": 3153,
        "project": {
            "id": 92,
            "projectKey": "SUB",
            "name": "サブタスク",
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
        "type": 2,
        "content": {
            "id": 4809,
            "key_id": 121,
            "summary": "コメント",
            "description": "",
            "comment": {
                "id": 7237,
                "content": ""
            },
            "changes": [
                {
                    "field": "milestone",
                    "new_value": " R2014-07-23",
                    "old_value": "",
                    "type": "standard"
                },
                {
                    "field": "status",
                    "new_value": "4",
                    "old_value": "1",
                    "type": "standard"
                }
            ]
        },
        "notifications": [],
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
        "created": "2013-12-27T07:50:44Z"
    },
    // ...
]
```

## レスポンス説明

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| type | int | 最近の更新の種別：<br>1:課題の追加<br>2:課題の更新<br>3:課題にコメント<br>4:課題の削除<br>5:Wikiを追加<br>6:Wikiを更新<br>7:Wikiを削除<br>8:共有ファイルを追加<br>9:共有ファイルを更新<br>10:共有ファイルを削除<br>11:Subversionコミット<br>12:GITプッシュ<br>13:GITリポジトリ作成<br>14:課題をまとめて更新<br>15:プロジェクトに参加<br>16:プロジェクトから脱退<br>17:コメントにお知らせを追加<br>18:プルリクエストの追加<br>19:プルリクエストの更新<br>20:プルリクエストにコメント<br>21:プルリクエストの削除<br>22:マイルストーンの追加<br>23:マイルストーンの更新<br>24:マイルストーンの削除<br>25:グループがプロジェクトに参加<br>26:グループがプロジェクトから脱退 |
| reason | int | 通知の種別：<br>1:課題の担当者に設定<br>2:課題にコメント<br>3:課題の追加<br>4:課題の更新<br>5:ファイルを追加<br>6:プロジェクトユーザーの追加<br>9:その他<br>10:プルリクエストの担当者に設定<br>11:プルリクエストにコメント<br>12:プルリクエストの追加<br>13:プルリクエストの更新 |

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
