---
title: 課題コメントの追加
slug: add-comment
method: POST
path: "/api/v2/issues/:issueIdOrKey/comments"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-comment/"
fetched: 2026-08-30
---

# 課題コメントの追加

```http
POST /api/v2/issues/:issueIdOrKey/comments
```

課題に新しいコメントを追加します。

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

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| content (必須) | string | コメントの本文。[メンション記法](../guides/tips.md#mention-users-in-text)が使えます。 |
| notifiedUserId[]<br>[(複数指定可)](../guides/tips.md) | int | コメント登録の通知を受け取るユーザーID |
| attachmentId[]<br>[(複数指定可)](../guides/tips.md) | int | 添付ファイルの送信APIが返すID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 201 CREATED
Content-Type:application/json;charset=utf-8
Location:https://xx.backlog.jp/view/BLG-5742#comment-6586
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
