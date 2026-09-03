---
title: ドキュメント一覧の取得
slug: get-document-list
method: GET
path: /api/v2/documents
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-document-list/"
fetched: 2026-08-30
---

# ドキュメント一覧の取得

```http
GET /api/v2/documents
```

ドキュメントページの一覧を取得します。  
APIを実行するユーザーが参加しているプロジェクトのドキュメントのみ取得できます。  
`projectId[]`パラメーターで指定したプロジェクトに参加していない場合、そのプロジェクトのドキュメントは取得結果に含まれません。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectId[]<br>[(複数指定可)](../guides/tips.md) | Number | プロジェクトのID。<br>プロジェクトのIDは[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。 |
| keyword | String | 検索キーワード |
| sort | String | ・created<br>・updated |
| order | String | 一覧の並び順。指定が無い場合はdescが使われます。<br>・asc: 昇順<br>・desc: 降順 |
| offset (必須) | Number | 取得開始位置。0以上の整数を指定してください。 |
| count | Number | 件数の上限。1〜100の範囲で指定してください。指定が無い場合は20が使われます。 |

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents?apiKey=$API_KEY" \
--data 'projectId[]=123' \
--data 'projectId[]=456' \
--data keyword=検索ワード \
--data sort=updated \
--data order=desc \
--data offset=0 \
--data count=20
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
    "id": "01939983409c79d5a06a49859789e38f",
    "projectId": 1,
    "title": "ドキュメント機能へようこそ",
    "plain": "hello",
    "json": "{}",
    "statusId": 1,
    "emoji": "\uD83C\uDF89",
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
  },
  {
    "id": "0193b335c62173de9547bab5dd0b5324",
    "projectId": 1,
    "title": "top",
    "plain": "hello",
    "json": "{}",
    "statusId": 1,
    "emoji": null,
    "attachments": [],
    "tags": [],
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
  // ...
]
```
