---
title: ドキュメントタグの追加
slug: add-document-tag
method: POST
path: "/api/v2/documents/:documentId/tags"
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-document-tag/"
fetched: 2026-08-30
---

# ドキュメントタグの追加

```http
POST /api/v2/documents/:documentId/tags
```

ドキュメントにタグを追加します。  
APIを実行するユーザーは、対象のドキュメントが属するプロジェクトに参加している必要があります。  
参加していないプロジェクトのドキュメントを指定した場合、エラーが返されます。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
制限なし
```

## URLパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| documentId (必須) | String | ドキュメントのID |

## リクエストパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| tagNames[]<br>[(複数指定可)](../guides/tips.md) | String | 追加するタグ名 |

## リクエストの例

```bash
curl --request POST \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents/$DOCUMENT_ID/tags?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data 'tagNames[]=tag1' \
--data 'tagNames[]=tag2'
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

## レスポンス例

### レスポンスボディ

```json
[
    {
        "id": 11,
        "name": "tag1"
    },
    {
        "id": 12,
        "name": "tag2"
    }
]
```
