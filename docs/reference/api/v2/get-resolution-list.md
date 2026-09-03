---
title: 完了理由一覧の取得
slug: get-resolution-list
method: GET
path: /api/v2/resolutions
category: resolutions
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-resolution-list/"
fetched: 2026-08-30
---

# 完了理由一覧の取得

```http
GET /api/v2/resolutions
```

課題に設定できる完了理由の一覧を取得します。

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
        "id": 0,
        "name": "対応済み"
    },
    {
        "id": 1,
        "name": "対応しない"
    },
    {
        "id": 2,
        "name": "無効"
    },
    {
        "id": 3,
        "name": "重複"
    },
    {
        "id": 4,
        "name": "再現しない"
    }
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
