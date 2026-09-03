---
title: 状態の追加
slug: add-status
method: POST
path: "/api/v2/projects/:projectIdOrKey/statuses"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-status/"
fetched: 2026-08-30
---

# 状態の追加

```http
POST /api/v2/projects/:projectIdOrKey/statuses
```

プロジェクトに状態を追加します。 1プロジェクトにつき8個まで状態を追加できます。 標準の4つの状態と合わせると、合計12個の状態を設定できます。

## 実行可能な権限

```
管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name (必須) | string | 状態の名前 |
| color (必須) | string | 状態の背景色：以下から指定<br>”#ea2c00"<br>"#e87758"<br>"#e07b9a"<br>"#868cb7"<br>"#3b9dbd"<br>"#4caf93"<br>"#b0be3c"<br>"#eda62a"<br>"#f42858"<br>"#393939” |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 101,
    "projectId": 1,
    "name": "レビュー待ち",
    "color": "#e87758",
    "displayOrder": 3999
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
