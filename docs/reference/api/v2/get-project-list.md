---
title: プロジェクト一覧の取得
slug: get-project-list
method: GET
path: /api/v2/projects
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-project-list/"
fetched: 2026-08-30
---

# プロジェクト一覧の取得

```http
GET /api/v2/projects
```

プロジェクトの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| archived | boolean | 省略された場合は全てのプロジェクト、falseの場合はアーカイブされていないプロジェクト、trueの場合はアーカイブされたプロジェクトを返します。 |
| all | boolean | ユーザが管理者権限の場合のみ有効なパラメータです。trueの場合はすべてのプロジェクト、falseの場合は参加しているプロジェクトのみを返します。初期値はfalse。 |

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
        "useSubversion": true,
        "useGit": true,
        "useOriginalImageSizeAtWiki": false,
        "textFormattingRule": "markdown",
        "archived":false,
        "displayOrder": 2147483646,
        "useDevAttributes": true
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
