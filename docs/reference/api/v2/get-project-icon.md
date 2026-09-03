---
title: プロジェクトアイコンの取得
slug: get-project-icon
method: GET
path: "/api/v2/projects/:projectIdOrKey/image"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-project-icon/"
fetched: 2026-08-30
---

# プロジェクトアイコンの取得

```http
GET /api/v2/projects/:projectIdOrKey/image
```

プロジェクトのアイコン画像を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

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
