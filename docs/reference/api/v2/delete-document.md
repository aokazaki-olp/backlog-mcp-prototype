---
title: ドキュメントの削除
slug: delete-document
method: DELETE
path: "/api/v2/documents/:documentId"
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/delete-document/"
fetched: 2026-08-30
---

# ドキュメントの削除

```http
DELETE /api/v2/documents/:documentId
```

ドキュメントを削除します。  
APIを実行するユーザーは、対象のドキュメントが属するプロジェクトに参加している必要があります。  
参加していないプロジェクトのドキュメントを指定した場合、エラーが返されます。

## 実行可能な権限

```
管理者
プロジェクト管理者
```

## URLパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| documentId (必須) | String | ドキュメントのID |

## リクエストの例

```bash
curl --request DELETE \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents/$DOCUMENT_ID?apiKey=$API_KEY"
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

## レスポンス例

### レスポンスボディ

```json
{
    "id": "019b4e27b88b7cc4ae16d72c3de62299",
    "projectId": 17,
    "title": "test18",
    "json": null,
    "plain": null,
    "statusId": 1,
    "emoji": "👍",
    "createdUserId": 2,
    "created": "2025-12-24T02:19:42Z",
    "updatedUserId": 2,
    "updated": "2025-12-24T02:19:42Z"
}
```
