---
title: プロジェクトの追加
slug: add-project
method: POST
path: /api/v2/projects
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-project/"
fetched: 2026-08-30
---

# プロジェクトの追加

```http
POST /api/v2/projects
```

新しいプロジェクトを追加します。

## 実行可能な権限

```
管理者
```

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name (必須) | string | プロジェクト名 |
| key (必須) | string | プロジェクトキー(半角英大文字と半角数字とアンダースコアが使用できます) |
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
| useDevAttributes | boolean | 優先度、マイルストーン、発生バージョンを使用するかどうか |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 201 CREATED
Content-Type:application/json;charset=utf-8
Location:https://xx.backlog.jp/projects/BLG
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
