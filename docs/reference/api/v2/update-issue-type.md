---
title: 種別情報の更新
slug: update-issue-type
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/issueTypes/:id"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-issue-type/"
fetched: 2026-08-30
---

# 種別情報の更新

```http
PATCH /api/v2/projects/:projectIdOrKey/issueTypes/:id
```

種別の情報を更新します。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
制限なし
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |
| id | int | 種別のID |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name | string | 種別の名前 |
| color | string | 種別の背景色 |
| templateSummary | string | 課題テンプレートの件名 |
| templateDescription | string | 課題テンプレートの詳細 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 1,
    "projectId": 1,
    "name": "バグ",
    "color": "#990000",
    "displayOrder": 0,
    "templateSummary": "件名",
    "templateDescription": "詳細"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
