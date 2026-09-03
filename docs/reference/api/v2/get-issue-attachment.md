---
title: 課題添付ファイルのダウンロード
slug: get-issue-attachment
method: GET
path: "/api/v2/issues/:issueIdOrKey/attachments/:attachmentId"
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-issue-attachment/"
fetched: 2026-08-30
---

# 課題添付ファイルのダウンロード

```http
GET /api/v2/issues/:issueIdOrKey/attachments/:attachmentId
```

課題の添付ファイルをダウンロードします。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
課題の登録のみ
制限なし
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| issueIdOrKey | string | 課題のID または 課題キー |
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
