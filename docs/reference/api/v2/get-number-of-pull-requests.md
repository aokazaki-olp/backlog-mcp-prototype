---
title: プルリクエスト数の取得
slug: get-number-of-pull-requests
method: GET
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/count"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-number-of-pull-requests/"
fetched: 2026-08-30
---

# プルリクエスト数の取得

```http
GET /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/count
```

プルリクエストの数を取得します。

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

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| statusId[]<br>[(複数指定可)](../guides/tips.md) | int | 状態のID |
| assigneeId[]<br>[(複数指定可)](../guides/tips.md) | int | 担当者のID |
| issueId[]<br>[(複数指定可)](../guides/tips.md) | int | 関連課題のID |
| createdUserId[]<br>[(複数指定可)](../guides/tips.md) | int | 登録者のID |
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
    "count": 10
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
