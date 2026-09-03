---
title: 課題の共有ファイルのリンクを解除
slug: remove-link-to-shared-file-from-issue
method: DELETE
path: "/api/v2/issues/:issueIdOrKey/sharedFiles/:id"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/remove-link-to-shared-file-from-issue/"
fetched: 2026-08-30
---

# 課題の共有ファイルのリンクを解除

```http
DELETE /api/v2/issues/:issueIdOrKey/sharedFiles/:id
```

課題にリンクされた共有ファイルのリンクを解除します。

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
| issueIdOrKey | string | 課題のID または 課題キー |
| id | int | 共有ファイルのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 4056,
    "projectId": 5,
    "type": "file",
    "dir": "/design/",
    "name": "site.png",
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
    "updated":"2010-05-02T17:37:10Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
