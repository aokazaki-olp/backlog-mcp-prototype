---
title: 共有ファイル一覧の取得
slug: get-list-of-shared-files
method: GET
path: "/api/v2/projects/:projectIdOrKey/files/metadata/:path"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-list-of-shared-files/"
fetched: 2026-08-30
---

# 共有ファイル一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/files/metadata/:path
```

共有ファイルの一覧を取得します。

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
| path | string | ディレクトリのパス |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |
| offset | int |  |
| count | int | 取得上限(1-1000) 指定が無い場合は1000 |

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
        "id": 825952,
        "projectId": 5,
        "type": "file",
        "dir": "/プレスリリース/20091130/",
        "name": "20091130.txt",
        "size": 4836,
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
        "created": "2009-11-30T01:22:21Z",
        "updatedUser": null,
        "updated": "2009-11-30T01:22:21Z"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
