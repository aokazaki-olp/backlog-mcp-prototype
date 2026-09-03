---
title: ライセンス情報の取得
slug: get-licence
method: GET
path: /api/v2/space/licence
category: space
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-licence/"
fetched: 2026-08-30
---

# ライセンス情報の取得

```http
GET /api/v2/space/licence
```

ライセンスの情報を取得します。

## 実行可能な権限

```
すべての権限
```

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "active": true,
    "attachmentLimit": 0,
    "attachmentLimitPerFile": 10485760,
    "attachmentNumLimit": 50,
    "attribute": true,
    "attributeLimit": 100,
    "burndown": true,
    "commentLimit": 0,
    "componentLimit": 0,
    "fileSharing": true,
    "gantt": true,
    "git": true,
    "issueLimit": 0,
    "licenceTypeId": 51,
    "limitDate": "2019-01-02T15:00:00Z",
    "nulabAccount": true,
    "parentChildIssue": true,
    "grandchildIssueEnabled": false,
    "postIssueByMail": true,
    "projectLimit": 0,
    "pullRequestAttachmentLimitPerFile": 10485760,
    "pullRequestAttachmentNumLimit": 50,
    "remoteAddress": true,
    "remoteAddressLimit": 100,
    "startedOn": "2018-01-03T15:00:00Z",
    "storageLimit": 1073741824000,
    "subversion": true,
    "subversionExternal": true,
    "userLimit": 0,
    "versionLimit": 0,
    "wikiAttachment": true,
    "wikiAttachmentLimitPerFile": 10485760,
    "wikiAttachmentNumLimit": 50
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
