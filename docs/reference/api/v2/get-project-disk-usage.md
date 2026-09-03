---
title: プロジェクトの容量使用状況の取得
slug: get-project-disk-usage
method: GET
path: "/api/v2/projects/:projectIdOrKey/diskUsage"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-project-disk-usage/"
fetched: 2026-08-30
---

# プロジェクトの容量使用状況の取得

```http
GET /api/v2/projects/:projectIdOrKey/diskUsage
```

プロジェクトの容量使用状況の情報を取得します。

## 実行可能な権限

```
管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | プロジェクトのID または プロジェクトキー |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "projectId": 1,
    "issue": 11931,
    "wiki": 0,
    "document": 0,
    "file": 0,
    "subversion": 0,
    "git": 0,
    "gitLFS": 0
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
