---
title: プルリクエストコメント情報の更新
slug: update-pull-request-comment-information
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments/:commentId"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-pull-request-comment-information/"
fetched: 2026-08-30
---

# プルリクエストコメント情報の更新

```http
PATCH /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments/:commentId
```

プルリクエストコメントの情報を更新します。

認証ユーザー自身が登録したコメントのみ更新することが出来ます。

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
| commentId | int | コメントのID |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| content | string | コメントの本文。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 35,
    "content": "from api",
    "changeLog": [
        {
            "field": "dependentIssue",
            "newValue": "GIT-3",
            "originalValue": null
        }
    ],
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
    "created":"2015-05-14T01:53:38Z",
    "updated":"2015-05-14T01:53:38Z",
    "stars":[],
    "notifications":[]
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
