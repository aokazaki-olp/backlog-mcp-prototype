---
title: プルリクエスト添付ファイルのダウンロード
slug: download-pull-request-attachment
method: GET
path: "/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/attachments/:attachmentId"
category: git
source: "https://developer.nulab.com/ja/docs/backlog/api/2/download-pull-request-attachment/"
fetched: 2026-08-30
---

# プルリクエスト添付ファイルのダウンロード

```http
GET /api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/attachments/:attachmentId
```

プルリクエストの添付ファイルをダウンロードします。

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
| attachmentId | int | 添付ファイルのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/octet-stream
Content-Disposition:attachment;filename="attachment.doc"
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
