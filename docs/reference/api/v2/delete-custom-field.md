---
title: カスタム属性の削除
slug: delete-custom-field
method: DELETE
path: "/api/v2/projects/:projectIdOrKey/customFields/:id"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/delete-custom-field/"
fetched: 2026-08-30
---

# カスタム属性の削除

```http
DELETE /api/v2/projects/:projectIdOrKey/customFields/:id
```

カスタム属性を削除します。

## 実行可能な権限

```
管理者
プロジェクト管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |
| id | int | カスタム属性のID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 2,
    "projectId": 5,
    "typeId": 1,
    "name": "バグ専用属性",
    "description": "",
    "required": false,
    "applicableIssueTypes": [1]
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
