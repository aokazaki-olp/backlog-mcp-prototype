---
title: 課題コメント数の取得
slug: count-comment
method: GET
path: "/api/v2/issues/:issueIdOrKey/comments/count"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/count-comment/"
fetched: 2026-08-30
---

# 課題コメント数の取得

```http
GET /api/v2/issues/:issueIdOrKey/comments/count
```

課題に登録されているコメントの数を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 課題のID または 課題キー |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "count": 10
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
