---
title: 状態情報の更新
slug: update-status
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/statuses/:id"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-status/"
fetched: 2026-08-30
---

# 状態情報の更新

```http
PATCH /api/v2/projects/:projectIdOrKey/statuses/:id
```

追加した状態の情報を更新します。

## 実行可能な権限

```
管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |
| id | int | 状態のID |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name | string | 状態の名前 |
| color | string | 状態の背景色；以下から指定<br>”#ea2c00"<br>"#e87758"<br>"#e07b9a"<br>"#868cb7"<br>"#3b9dbd"<br>"#4caf93"<br>"#b0be3c"<br>"#eda62a"<br>"#f42858"<br>"#393939” |

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
