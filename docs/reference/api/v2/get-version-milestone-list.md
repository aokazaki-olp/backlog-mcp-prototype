---
title: バージョン(マイルストーン)一覧の取得
slug: get-version-milestone-list
method: GET
path: "/api/v2/projects/:projectIdOrKey/versions"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-version-milestone-list/"
fetched: 2026-08-30
---

# バージョン(マイルストーン)一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/versions
```

プロジェクトに登録されているバージョン(マイルストーン)の一覧を返します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

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
        "id": 3,
        "projectId": 1,
        "name": "いますぐ",
        "description": "",
        "startDate": null,
        "releaseDueDate": null,
        "archived": false,
        "displayOrder": 0
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
