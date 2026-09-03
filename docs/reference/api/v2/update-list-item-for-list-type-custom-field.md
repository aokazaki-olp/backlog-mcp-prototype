---
title: 選択リストカスタム属性のリスト項目の更新
slug: update-list-item-for-list-type-custom-field
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/customFields/:id/items/:itemId"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-list-item-for-list-type-custom-field/"
fetched: 2026-08-30
---

# 選択リストカスタム属性のリスト項目の更新

```http
PATCH /api/v2/projects/:projectIdOrKey/customFields/:id/items/:itemId
```

選択リスト形式のカスタム属性のリスト項目を更新します。 指定されたカスタム属性が選択リスト形式でない場合はエラーになります。

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
| itemId | int | リスト項目のID |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name | string | リスト項目の名前 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 8,
    "projectId": 5,
    "typeId": 5,
    "name": "language",
    "description": "",
    "required": false,
    "applicableIssueTypes": [ ],
    "allowAddItem": true,
    "items": [
        {
            "id": 1,
            "name": "java",
            "displayOrder": 0
        },
        // ...
    ]
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
