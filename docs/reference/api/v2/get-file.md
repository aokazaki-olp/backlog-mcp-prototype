---
title: 共有ファイルのダウンロード
slug: get-file
method: GET
path: "/api/v2/projects/:projectIdOrKey/files/:sharedFileId"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-file/"
fetched: 2026-08-30
---

# 共有ファイルのダウンロード

```http
GET /api/v2/projects/:projectIdOrKey/files/:sharedFileId
```

共有ファイルを取得します。

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
| id | int | 共有ファイルのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/octet-stream
Content-Disposition:attachment;filename="sharedFile.doc"
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
