---
title: 状態の削除
slug: delete-status
method: DELETE
path: "/api/v2/projects/:projectIdOrKey/statuses/:id"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/delete-status/"
fetched: 2026-08-30
---

# 状態の削除

```http
DELETE /api/v2/projects/:projectIdOrKey/statuses/:id
```

プロジェクトから状態を削除します。

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
| substituteStatusId (必須) | int | 紐づく課題を付け替える先の状態のID。<br>削除対象の状態が設定されている課題がある場合、このパラメーターで指定した状態へ一括変更します。 |

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
