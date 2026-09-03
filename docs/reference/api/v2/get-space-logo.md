---
title: スペースアイコン画像の取得
slug: get-space-logo
method: GET
path: /api/v2/space/image
category: space
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-space-logo/"
fetched: 2026-08-30
---

# スペースアイコン画像の取得

```http
GET /api/v2/space/image
```

スペースのアイコン画像を取得します。

## 実行可能な権限

```
すべての権限
```

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/octet-stream
Content-Disposition:attachment;filename="logo_mark.png"
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
