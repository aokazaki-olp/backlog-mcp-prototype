---
title: プロジェクト情報の更新
slug: update-project
method: PATCH
path: "/api/v2/projects/:projectIdOrKey"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-project/"
fetched: 2026-08-30
---

# プロジェクト情報の更新

```http
PATCH /api/v2/projects/:projectIdOrKey
```

プロジェクトの情報を更新します。

## 実行可能な権限

```
管理者
プロジェクト管理者
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
| name | string | プロジェクト名 |
| key | string | プロジェクトキー |
| chartEnabled | boolean | チャートを使用するかどうか |
| useResolvedForChart | boolean | 「処理済み」以降を「完了」とみなすどうか |
| subtaskingEnabled | boolean | 親子課題を使用するかどうか |
| grandchildIssueEnabled | boolean | 親子課題に3階層目を使用するかどうか<br>`subtaskingEnabled` が `true` の場合のみ有効です。 |
| projectLeaderCanEditProjectLeader | boolean | プロジェクト管理者も他のプロジェクト管理者を指定可能にする |
| useWiki | boolean | Wikiを使用するかどうか |
| useDocument | boolean | ドキュメントを使用するかどうか |
| useFileSharing | boolean | 共有ファイルを使用するかどうか |
| useWikiTreeView | boolean | Wikiツリー表示を有効にするかどうか |
| useSubversion | boolean | Subversionを使用するかどうか |
| useGit | boolean | Gitを使用するかどうか |
| useOriginalImageSizeAtWiki | boolean | Wikiの画像をオリジナルのサイズで表示するかどうか |
| textFormattingRule | string | テキスト整形のルール backlog または markdown |
| archived | boolean | プロジェクトの一覧に表示するかどうか |
| useDevAttributes | boolean | 優先度、マイルストーン、発生バージョンを使用するかどうか |

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
