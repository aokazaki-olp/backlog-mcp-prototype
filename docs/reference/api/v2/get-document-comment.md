---
title: ドキュメントコメントの取得
slug: get-document-comment
method: GET
path: "/api/v2/documents/:documentId/comments"
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-document-comment/"
fetched: 2026-08-30
---

# ドキュメントコメントの取得

```http
GET /api/v2/documents/:documentId/comments
```

ドキュメントのコメントの一覧を取得します。  
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

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents/$DOCUMENT_ID/comments?apiKey=$API_KEY"
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
        "id": "019d465a795177e3a63069a79bbfe0e8",
        "documentId": "019d46599c2d7e19adfa562d5b9019a6",
        "statusId": 0,
        "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"What's this?\"}]}]}",
        "plain": "What's this?",
        "commentType": "comment",
        "createdUserId": 2,
        "created": "2026-04-01T00:03:47Z",
        "updatedUserId": 2,
        "updated": "2026-04-01T00:03:47Z",
        "createdUser": {
            "id": 2,
            "userId": "admin",
            "uniqueId": null,
            "name": "管理者",
            "mailAddress": "yamamoto@nulab.co.jp",
            "roleType": 1,
            "lang": null,
            "icon": "icons/person_168.gif"
        },
        "replies": [
            {
                "id": "019d4661a4cc781ba6d94ac1d73e3af6",
                "documentId": "019d46599c2d7e19adfa562d5b9019a6",
                "commentId": "019d465a795177e3a63069a79bbfe0e8",
                "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"This is the one we talked about before.\"}]}]}",
                "plain": "This is the one we talked about before.",
                "createdUserId": 5,
                "created": "2026-04-01T00:11:37Z",
                "updatedUserId": 5,
                "updated": "2026-04-01T00:11:37Z",
                "createdUser": {
                    "id": 5,
                    "userId": "test02",
                    "uniqueId": null,
                    "name": "Test Two",
                    "mailAddress": "test02@a.com",
                    "roleType": 2,
                    "lang": null,
                    "icon": "icons/default/09.png"
                }
            }
        ]
    },
    {
        "id": "019d465ab46f7418999f1c2818550f39",
        "documentId": "019d46599c2d7e19adfa562d5b9019a6",
        "statusId": 0,
        "content": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"It's OK.\"}]}]}",
        "plain": "It's OK.",
        "commentType": "comment",
        "createdUserId": 2,
        "created": "2026-04-01T00:04:02Z",
        "updatedUserId": 2,
        "updated": "2026-04-01T00:04:02Z",
        "createdUser": {
            "id": 2,
            "userId": "admin",
            "uniqueId": null,
            "name": "管理者",
            "mailAddress": "yamamoto@nulab.co.jp",
            "roleType": 1,
            "lang": null,
            "icon": "icons/person_168.gif"
        },
        "replies": []
    }
]
```
