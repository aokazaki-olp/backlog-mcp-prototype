---
title: 課題コメントのお知らせ一覧の取得
slug: get-list-of-comment-notifications
method: GET
path: "/api/v2/issues/:issueIdOrKey/comments/:commentId/notifications"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-list-of-comment-notifications/"
fetched: 2026-08-30
---

# 課題コメントのお知らせ一覧の取得

```http
GET /api/v2/issues/:issueIdOrKey/comments/:commentId/notifications
```

課題コメントのお知らせ一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 課題のID または 課題キー |
| commentId | int | コメントのID |

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
        "id":22,
        "alreadyRead":false,
        "reason":2,
        "user":{
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
    "resourceAlreadyRead":false
    },
    // ...
]
```

## レスポンス説明

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| reason | int | 通知の種別：<br>1:課題の担当者に設定<br>2:課題にコメント<br>3:課題の追加<br>4:課題の更新<br>5:ファイルを追加<br>6:プロジェクトユーザーの追加<br>9:その他<br>10:プルリクエストの担当者に設定<br>11:プルリクエストにコメント<br>12:プルリクエストの追加<br>13:プルリクエストの更新 |

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
