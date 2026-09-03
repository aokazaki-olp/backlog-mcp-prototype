---
title: カテゴリーの追加
slug: add-category
method: POST
path: "/api/v2/projects/:projectIdOrKey/categories"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-category/"
fetched: 2026-08-30
---

# カテゴリーの追加

```http
POST /api/v2/projects/:projectIdOrKey/categories
```

プロジェクトにカテゴリーを追加します。

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

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name (必須) | string | カテゴリーの名前 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 1,
    "projectId": 5,
    "name": "開発",
    "displayOrder": 0
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
