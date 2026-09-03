---
title: 種別の削除
slug: delete-issue-type
method: DELETE
path: "/api/v2/projects/:projectIdOrKey/issueTypes/:id"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/delete-issue-type/"
fetched: 2026-08-30
---

# 種別の削除

```http
DELETE /api/v2/projects/:projectIdOrKey/issueTypes/:id
```

プロジェクトから種別を削除します。

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
| substituteIssueTypeId (必須) | int | 紐づく課題を付け替える先の種別のID |

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
