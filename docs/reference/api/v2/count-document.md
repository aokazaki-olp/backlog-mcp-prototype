---
title: ドキュメント数の取得
slug: count-document
method: GET
path: /api/v2/documents/count
category: documents
source: "https://developer.nulab.com/ja/docs/backlog/api/2/count-document/"
fetched: 2026-08-30
---

# ドキュメント数の取得

```http
GET /api/v2/documents/count
```

プロジェクト内のドキュメントの数を取得します。  
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

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey (必須) | String | プロジェクトのID またはプロジェクトキー |

## リクエストの例

```bash
curl --request GET \
--url "https://{{YOUR-DOMAIN}}/api/v2/documents/count?apiKey=$API_KEY&projectIdOrKey=TEST"
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

## レスポンス例

### レスポンスボディ

```json
{
    "count": 11
}
```
