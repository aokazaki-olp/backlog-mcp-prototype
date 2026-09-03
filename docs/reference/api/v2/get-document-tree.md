---
title: ドキュメントツリーの取得
slug: get-document-tree
method: GET
path: /api/v2/documents/tree
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-document-tree/"
fetched: 2026-08-30
---

# ドキュメントツリーの取得

```http
GET /api/v2/documents/tree
```

ドキュメントツリーを取得します。  
APIを実行するユーザーは、指定したプロジェクトに参加している必要があります。  
参加していないプロジェクトを指定した場合、エラーが返されます。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey (必須) | string | プロジェクトのID または プロジェクトキー |

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents/tree?apiKey=$API_KEY&projectIdOrKey=TEST"
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

## レスポンス例

### レスポンスボディ

```json
{
  "projectId": 1,
  "activeTree": {
    "id": "Active",
    "children": [
      {
        "id": "01934345404771adb2113d7792bb4351",
        "name": "local test",
        "children": [
          {
            "id": "019347fc760c7b0abff04b44628c94d7",
            "name": "test2",
            "children": [
              {
                "id": "0192ff5990da76c289dee06b1f11fa01",
                "name": "aaatest234",
                "children": []
              }
            ],
            "emoji": "",
          }
        ],
        "emoji": "",
      }
    ]
  },
  "trashTree": {
    "id": "Trash",
    "children": []
  }
}
```
