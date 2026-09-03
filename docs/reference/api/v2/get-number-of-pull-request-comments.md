---
title: プルリクエストコメント数の取得
slug: get-number-of-pull-request-comments
method: GET
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments/count"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-number-of-pull-request-comments/"
fetched: 2026-08-30
---

# プルリクエストコメント数の取得

```http
GET /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments/count
```

プルリクエストに登録されているコメントの数を取得します。

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
| repoIdOrName | string | リポジトリのID または リポジトリ名 |
| number | int | プルリクエストの番号 |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "count": 10
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
