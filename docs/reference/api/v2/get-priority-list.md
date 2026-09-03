---
title: 優先度一覧の取得
slug: get-priority-list
method: GET
path: /api/v2/priorities
category: priorities
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-priority-list/"
fetched: 2026-08-30
---

# 優先度一覧の取得

```http
GET /api/v2/priorities
```

課題に設定できる優先度の一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
[
    {
        "id": 2,
        "name": "高"
    },
    {
        "id": 3,
        "name": "中"
    },
    {
        "id": 4,
        "name": "低"
    }
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
