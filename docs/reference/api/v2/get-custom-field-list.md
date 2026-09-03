---
title: カスタム属性一覧の取得
slug: get-custom-field-list
method: GET
path: "/api/v2/projects/:projectIdOrKey/customFields"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-custom-field-list/"
fetched: 2026-08-30
---

# カスタム属性一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/customFields
```

参加しているプロジェクトのカスタム属性一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー<br>自分が参加しているプロジェクトの一覧は[プロジェクト一覧の取得](./get-project-list.md)から取得できます。 |

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/projects/{{PROJECT_ID_OR_KEY}}/customFields?apiKey=$API_KEY"
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

`{{PROJECT_ID_OR_KEY}}` には、プロジェクトのIDまたはプロジェクトキーを記入してください。

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
        "id": 1,
        "projectId": 5,
        "typeId": 6,
        "name": "custom",
        "description": "",
        "required": false,
        "applicableIssueTypes": [],
        "allowAddItem": false,
        "items": [
            {
                "id": 1,
                "name": "Windows 8",
                "displayOrder": 0
            },
            // ...
        ]
    },
    {
        "id": 2,
        "typeId": 1,
        "name": "バグ専用属性",
        "description": "",
        "required": false,
        "applicableIssueTypes": [1]
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
