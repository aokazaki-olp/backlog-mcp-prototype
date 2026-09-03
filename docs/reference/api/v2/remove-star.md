---
title: スターの削除
slug: remove-star
method: DELETE
path: "/api/v2/stars/:starId"
category: stars
source: "https://developer.nulab.com/ja/docs/backlog/api/2/remove-star/"
fetched: 2026-08-30
---

# スターの削除

```http
DELETE /api/v2/stars/:starId
```

課題、コメント、Wikiのスターを1つ削除します。

## 実行可能な権限

```
すべての権限
```

## URLパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| starId | int | スターのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 204 NO_CONTENT
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください。
