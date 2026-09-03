---
title: 状態の並び替え
slug: update-order-of-status
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/statuses/updateDisplayOrder"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-order-of-status/"
fetched: 2026-08-30
---

# 状態の並び替え

```http
PATCH /api/v2/projects/:projectIdOrKey/statuses/updateDisplayOrder
```

状態の表示順を変更します。

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
| statusId[]<br>[(複数指定可)](../guides/tips.md) | int | 表示順に並べた、状態のIDのリスト。そのプロジェクトで使える全ての状態を渡してください。表示順には以下の制限があります<br>・未対応は先頭にあること<br>・完了は末尾にあること<br>・処理中は処理済みよりも前にあること |

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
        "id": 1,
        "projectId": 1,
        "name": "未対応",
        "color": "#ed8077",
        "displayOrder": 1000
    },
    {
        "id": 101,
        "projectId": 1,
        "name": "調査待ち",
        "color": "#ed8077",
        "displayOrder": 1001
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
