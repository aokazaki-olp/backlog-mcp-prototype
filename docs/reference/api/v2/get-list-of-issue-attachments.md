---
title: 課題添付ファイル一覧の取得
slug: get-list-of-issue-attachments
method: GET
path: "/api/v2/issues/:issueIdOrKey/attachments"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-list-of-issue-attachments/"
fetched: 2026-08-30
---

# 課題添付ファイル一覧の取得

```http
GET /api/v2/issues/:issueIdOrKey/attachments
```

課題の添付ファイルの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 課題のID または 課題キー |

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
        "id": 8,
        "name": "IMG0088.png",
        "size": 5563,
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
        "created":"2014-10-28T09:24:43Z"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
