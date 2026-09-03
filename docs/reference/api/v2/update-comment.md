---
title: 課題コメント情報の更新
slug: update-comment
method: PATCH
path: "/api/v2/issues/:issueIdOrKey/comments/:commentId"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-comment/"
fetched: 2026-08-30
---

# 課題コメント情報の更新

```http
PATCH /api/v2/issues/:issueIdOrKey/comments/:commentId
```

課題コメントの情報を更新します。

認証ユーザー自身が登録したコメントのみ更新することが出来ます。

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

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 課題のID または 課題キー |
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
    "id": 6586,
    "projectId": 5,
    "issueId": 50,
    "content": "テスト",
    "changeLog": null,
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
    "created": "2013-08-05T06:15:06Z",
    "updated": "2013-08-05T06:15:06Z",
    "stars": [],
    "notifications": []
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
