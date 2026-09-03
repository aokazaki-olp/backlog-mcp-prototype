---
title: プロジェクトの削除
slug: delete-project
method: DELETE
path: "/api/v2/projects/:projectIdOrKey"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/delete-project/"
fetched: 2026-08-30
---

# プロジェクトの削除

```http
DELETE /api/v2/projects/:projectIdOrKey
```

プロジェクトを削除します。

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
    "id": 1,
    "projectKey": "TEST",
    "name": "test",
    "chartEnabled": false,
    "useResolvedForChart": false,
    "subtaskingEnabled": false,
    "projectLeaderCanEditProjectLeader": false,
    "useWiki": true,
    "useDocument": true,
    "useFileSharing": true,
    "useWikiTreeView": true,
    "useOriginalImageSizeAtWiki": false,
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
