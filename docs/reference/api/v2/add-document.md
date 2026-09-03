---
title: ドキュメントの追加
slug: add-document
method: POST
path: /api/v2/documents
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-document/"
fetched: 2026-08-30
---

# ドキュメントの追加

```http
POST /api/v2/documents
```

ドキュメントを追加します。  
APIを実行するユーザーは、指定したプロジェクトに参加している必要があります。  
参加していないプロジェクトを指定した場合、エラーが返されます。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
制限なし
```

## リクエストパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectId<br>(必須) | Number | プロジェクトのID。<br>プロジェクトのIDは[プロジェクトの状態一覧の取得](./get-status-list-of-project.md)から取得できます。 |
| title | String | ドキュメントのタイトル。 |
| content | String | ドキュメントの内容。Markdown形式で記述できます。 |
| emoji | String | ドキュメントタイトル横に表示される絵文字。 |
| parentId | String | 親ドキュメントのID。このIDを指定した場合、ドキュメントはツリー上でparentIdのドキュメントの子として作成されます。 |
| addLast | Boolean | trueにした場合、ドキュメントはツリー上の兄弟ドキュメントの中で末尾に作成されます。デフォルトはfalseで先頭に追加されます。 |

## リクエストの例

```bash
curl --request POST \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data projectId=1 \
--data title="ドキュメントのタイトル" \
--data content="# 見出し\nドキュメントの内容です。" \
--data emoji="📝" \
--data addLast=true
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
    "projectId": 1,
    "title": "document title",
    "json": {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {
                    "id": "NmU",
                    "level": 1
                },
                "content": [
                    {
                        "type": "text",
                        "text": "head"
                    }
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "hello"
                    }
                ]
            }
        ]
    },
    "plain": "# head \n hello",
    "statusId": 1,
    "emoji": "👍",
    "createdUserId": 2,
    "created": "2025-12-24T02:19:42Z",
    "updatedUserId": 2,
    "updated": "2025-12-24T02:19:42Z"
}
```
