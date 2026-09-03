---
title: チームアイコンの取得
slug: get-team-icon
method: GET
path: "/api/v2/teams/:teamId/icon"
category: teams
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-team-icon/"
fetched: 2026-08-30
---

# チームアイコンの取得

```http
GET /api/v2/teams/:teamId/icon
```

チームアイコン画像を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| teamId | int | チームのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/octet-stream
Content-Disposition:attachment;filename="team_168.gif"
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
