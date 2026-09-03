---
title: ウォッチ数の取得
slug: count-watching
method: GET
path: "/api/v2/users/:userId/watchings/count"
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/count-watching/"
fetched: 2026-08-30
---

# ウォッチ数の取得

```http
GET /api/v2/users/:userId/watchings/count
```

ウォッチの数を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| userId | int | ユーザーのID |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| resourceAlreadyRead | boolean | 既読かどうか。trueの場合は既読のウォッチ、falseの場合は未読のウォッチ、指定しない場合は両方のウォッチを返します。指定が無い場合は両方 |
| alreadyRead | boolean | ウォッチメニューの一覧表示後に更新されたウォッチの件数を返します。trueの場合はウォッチメニューを表示した後に更新されていない(既読状態の)件数を返します。falseの場合はウォッチメニューを表示した後に更新された(未読状態の)ウォッチの件数を返します。指定が無い場合は両方を合わせた件数を返します。resourceAlreadyReadが指定してある場合、alreadyReadは使用されません。 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "count": 138
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
