---
title: アクティビティの取得
slug: get-activity
method: GET
path: "/api/v2/activities/:activityId"
category: activities
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-activity/"
fetched: 2026-08-30
---

# アクティビティの取得

```http
GET /api/v2/activities/:activityId
```

アクティビティの詳細を返します。

## 実行可能な権限

```
すべての権限
```

## URL parameters

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| activityId | int | アクティビティのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
  "id": 3153,
  "project": {
    "id": 92,
    "projectKey": "SUB",
    "name": "Subtasking",
    "chartEnabled": true,
    "useResolvedForChart": true,
    "subtaskingEnabled": true,
    "projectLeaderCanEditProjectLeader": false,
    "useWiki": true,
    "useDocument": true,
    "useFileSharing": true,
    "useSubversion": true,
    "useGit": true,
    "useWikiTreeView": true,
    "useOriginalImageSizeAtWiki": false,
    "textFormattingRule": "backlog",
    "archived": false,
    "displayOrder": 3,
    "useDevAttributes": true
  },
  "type": 0,
  "content": {
    "id": 92,
    "key_id": 121,
    "summary": "Comment",
    "description": "string",
    "comment": {
      "id": 7237,
      "content": "Comment"
    },
    "changes": [
      {
        "field": "milestone",
        "new_value": "R2014-07-23",
        "old_value": null,
        "type": "standard"
      }
    ]
  },
  "notifications": [
    {
      "id": 25,
      "alreadyRead": false,
      "reason": 2,
      "user": {
        "id": 25,
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
      }
    }
  ],
  "createdUser": {
    "id": 25,
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
}
```

## レスポンス説明

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| type | int | 最近の更新の種別：<br>1:課題の追加<br>2:課題の更新<br>3:課題にコメント<br>4:課題の削除<br>5:Wikiを追加<br>6:Wikiを更新<br>7:Wikiを削除<br>8:共有ファイルを追加<br>9:共有ファイルを更新<br>10:共有ファイルを削除<br>11:Subversionコミット<br>12:GITプッシュ<br>13:GITリポジトリ作成<br>14:課題をまとめて更新<br>15:ユーザーがプロジェクトに参加<br>16:ユーザーがプロジェクトから脱退<br>17:コメントにお知らせを追加<br>18:プルリクエストの追加<br>19:プルリクエストの更新<br>20:プルリクエストにコメント<br>21:プルリクエストの削除<br>22:マイルストーンの追加<br>23:マイルストーンの更新<br>24:マイルストーンの削除<br>25:グループがプロジェクトに参加<br>26:グループがプロジェクトから脱退<br>36:ドキュメントの追加<br>37:ドキュメントの削除<br>38:ドキュメントのタイトル更新<br>39:ドキュメントの更新<br>40:ドキュメントにコメント<br>41:ドキュメントのコメント更新<br>42:ドキュメントのコメント削除<br>43:ドキュメントのコメントに返信<br>44:ドキュメントのコメント返信更新<br>45:ドキュメントのコメント返信削除<br>46:ドキュメントに添付ファイル追加<br>48:ドキュメントをまとめて追加<br>49:ドキュメントでメンション |
| reason | int | 通知の種別：<br>1:課題の担当者に設定<br>2:課題にコメント<br>3:課題の追加<br>4:課題の更新<br>5:ファイルを追加<br>6:プロジェクトユーザーの追加<br>9:その他<br>10:プルリクエストの担当者に設定<br>11:プルリクエストにコメント<br>12:プルリクエストの追加<br>13:プルリクエストの更新<br>14:ドキュメントにコメント<br>15:ドキュメントのコメントに返信<br>17:ドキュメントでメンション |

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
