---
title: カテゴリー一覧の取得
slug: get-category-list
method: GET
path: "/api/v2/projects/:projectIdOrKey/categories"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-category-list/"
fetched: 2026-08-30
---

# カテゴリー一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/categories
```

プロジェクトに登録されているカテゴリーの一覧を返します。

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
        "id": 12,
        "projectId": 5,
        "name": "開発",
        "displayOrder": 0
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
