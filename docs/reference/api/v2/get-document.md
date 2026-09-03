---
title: ドキュメント情報の取得
slug: get-document
method: GET
path: "/api/v2/documents/:documentId"
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-document/"
fetched: 2026-08-30
---

# ドキュメント情報の取得

```http
GET /api/v2/documents/:documentId
```

ドキュメントページの情報を取得します。  
APIを実行するユーザーは、対象のドキュメントが属するプロジェクトに参加している必要があります。  
参加していないプロジェクトのドキュメントを指定した場合、エラーが返されます。

## 実行可能な権限

```
すべての権限
```

## URLパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| documentId (必須) | string | ドキュメントのID |

## リクエストの例

```bash
curl --request GET \
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
  "id": "0193b335c62173de9547bab5dd0b5324",
  "projectId": 1,
  "title": "top",
  "plain": "hello",
  "json": "{}",
  "statusId": 1,
  "emoji": null,
  "attachments": [
    {
      "id": 22067,
      "name": "test.png",
      "size": 8718,
      "createdUser": {
        "id": 3,
        "userId": "uchida",
        "name": "uchida",
        "roleType": 2,
        "lang": "ja",
        "mailAddress": "uchida@nulab.com",
        "nulabAccount": {
          "nulabId": "aaa",
          "name": "uchida",
          "uniqueId": "uchida",
          "iconUrl": "https://photo"
        },
        "keyword": "uchida",
        "lastLoginTime": "2025-05-22T23:04:03Z"
        },
        "created": "2025-05-29T02:19:54Z"
      }
  ],
  "tags": [
    {
      "id": 1,
      "name": "Backlog"
    }
  ],
  "createdUser": {
    "id": 2,
    "userId": "uchida",
    "name": "内田優一",
    "roleType": 1,
    "lang": "ja",
    "mailAddress": "uchida@nulab.com",
    "nulabAccount": null,
    "keyword": "内田優一 YUICHI UCHIDA",
    "lastLoginTime": "2025-05-28T22:24:36Z"
  },
  "created": "2024-12-06T01:08:56Z",
  "updatedUser": {
    "id": 2,
    "userId": "uchida",
    "name": "内田優一",
    "roleType": 1,
    "lang": "ja",
    "mailAddress": "uchida@nulab.com",
    "nulabAccount": null,
    "keyword": "内田優一 YUICHI UCHIDA",
    "lastLoginTime": "2025-05-28T22:24:36Z"
  },
  "updated": "2025-04-28T01:47:02Z"
}
```
