---
title: プロジェクト情報の取得
slug: get-project
method: GET
path: "/api/v2/projects/:projectIdOrKey"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-project/"
fetched: 2026-08-30
---

# プロジェクト情報の取得

```http
GET /api/v2/projects/:projectIdOrKey
```

プロジェクトの情報を取得します。

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
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 1,
    "projectKey": "TEST",
    "name": "test",
    "chartEnabled": false,
    "useResolvedForChart": false,
    "subtaskingEnabled": false,
    "grandchildIssueEnabled": false,
    "projectLeaderCanEditProjectLeader": false,
    "useWiki": true,
    "useDocument": true,
    "useFileSharing": true,
    "useWikiTreeView": true,
    "useOriginalImageSizeAtWiki": false,
    "useSubversion": true,
    "useGit": true,
    "textFormattingRule": "markdown",
    "archived":false,
    "displayOrder": 2147483646,
    "useDevAttributes": true
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
