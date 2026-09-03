---
title: 課題コメントの取得
slug: get-comment-list
method: GET
path: "/api/v2/issues/:issueIdOrKey/comments"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-comment-list/"
fetched: 2026-08-30
---

# 課題コメントの取得

```http
GET /api/v2/issues/:issueIdOrKey/comments
```

課題に登録されているコメントの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 課題のID または 課題キー |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
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

```json
[
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
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
