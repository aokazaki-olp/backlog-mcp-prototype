---
title: プロジェクトの状態一覧の取得
slug: get-status-list-of-project
method: GET
path: "/api/v2/projects/:projectIdOrKey/statuses"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-status-list-of-project/"
fetched: 2026-08-30
---

# プロジェクトの状態一覧の取得

```http
GET /api/v2/projects/:projectIdOrKey/statuses
```

プロジェクト固有の課題に設定できる状態一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| Parameter Name | Type | Description |
| --- | --- | --- |
| projectIdOrKey | String | Project ID or Project Key |

## レスポンス名

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
[
    {
        "id": 1,
        "projectId": 1,
        "name": "未対応",
        "color": "#ed8077",
        "displayOrder": 1000
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
