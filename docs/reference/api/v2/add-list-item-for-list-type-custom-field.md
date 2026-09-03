---
title: 選択リストカスタム属性のリスト項目の追加
slug: add-list-item-for-list-type-custom-field
method: POST
path: "/api/v2/projects/:projectIdOrKey/customFields/:id/items"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-list-item-for-list-type-custom-field/"
fetched: 2026-08-30
---

# 選択リストカスタム属性のリスト項目の追加

```http
POST /api/v2/projects/:projectIdOrKey/customFields/:id/items
```

自分が参加しているプロジェクトのカスタム属性（選択リスト）に、新しい選択肢を追加します。 「課題の追加/編集時に選択肢を追加できる」の設定が無効な場合は管理者権限のユーザーのみ呼び出せます。 指定されたカスタム属性が選択リスト形式でない場合はエラーになります。

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
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー<br>自分が参加しているプロジェクトの一覧は[プロジェクト一覧の取得](./get-project-list.md)から取得できます。 |
| id | int | カスタム属性のID<br>カスタム属性のIDは「[カスタム属性一覧の取得](./get-custom-field-list.md)」から取得できます。 |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name（必須） | string | 追加するリスト項目の名前 |

## リクエストの例

```bash
curl --request POST \
--url "https://{{YOUR-DOMAIN}}/api/v2/projects/{{PROJECT_ID_OR_KEY}}/customFields/{{CUSTOM_FIELD_ID}}/items?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data name="新しいリスト項目"
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

`{{PROJECT_ID_OR_KEY}}` には、プロジェクトのIDまたはプロジェクトキーを記入してください。  
`{{CUSTOM_FIELD_ID}}` には、カスタム属性のIDを記入してください。  
`新しいリスト項目` には、追加したいリスト項目の名前を記入してください。

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
