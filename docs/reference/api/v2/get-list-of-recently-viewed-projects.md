---
title: 自分が最近見たプロジェクト一覧の取得
slug: get-list-of-recently-viewed-projects
method: GET
path: /api/v2/users/myself/recentlyViewedProjects
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-list-of-recently-viewed-projects/"
fetched: 2026-08-30
---

# 自分が最近見たプロジェクト一覧の取得

```http
GET /api/v2/users/myself/recentlyViewedProjects
```

APIとの認証に使用しているユーザーが最近見たプロジェクトの一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |
| offset | int |  |
| count | int | 取得上限(1-100) 指定が無い場合は20 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "project": {
        "id": 1,
        "projectKey": "TEST",
        "name": "test",
        "chartEnabled": true,
        "useResolvedForChart": true,
        "subtaskingEnabled": true,
        "projectLeaderCanEditProjectLeader": false,
        "useWiki": true,
        "useDocument": true,
        "useFileSharing": true,
        "useWikiTreeView": true,
        "useSubversion": false,
        "useGit": false,
        "useOriginalImageSizeAtWiki": false,
        "textFormattingRule": "backlog",
        "archived": false,
        "displayOrder": 3,
        "useDevAttributes": true
    },
    "updated": "2014-07-11T01:59:07Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
