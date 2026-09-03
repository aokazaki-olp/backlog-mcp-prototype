---
title: Wiki添付ファイルの削除
slug: remove-wiki-attachment
method: DELETE
path: "/api/v2/wikis/:wikiId/attachments/:attachmentId"
category: wikis
source: "https://developer.nulab.com/ja/docs/backlog/api/2/remove-wiki-attachment/"
fetched: 2026-08-30
---

# Wiki添付ファイルの削除

【お知らせ】2026年7月14日から、Wikiの提供方針を以下のとおり変更します。

- 新規スペース：Wikiはご利用いただけません
- 既存スペース：新規プロジェクトのWikiは初期設定がオフになります。プロジェクト設定からオンに切り替えられます

詳しくは、[新規スペースへのWiki提供終了と初期設定の変更について](https://backlog.com/ja/blog/backlog-update-wiki-end-of-support-new-spaces/)を参照してください。

---

Wiki関連のAPIは引き続きご利用いただけます。将来的なWikiの廃止に伴うAPIへの影響は、スケジュール確定後に十分な周知期間を設けて改めてご案内します。

```http
DELETE /api/v2/wikis/:wikiId/attachments/:attachmentId
```

Wikiの添付ファイルを削除します。

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
| wikiId | int | WikiページのID |
| attachmentId | int | 添付ファイルのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 2,
    "name": "Duke.png",
    "size": 196186,
    "createdUser": {
        "id": 1,
        "userId": "admin",
        "name": "admin",
        "roleType": 1,
        "lang": null,
        "nulabAccount": {
            "nulabId": "Prm9ZD9DQD5snNWcSYSwZiQoA9WFBUEa2ySznrSnSQRhdC2X8G",
            "name": "admin",
            "uniqueId": "admin"
        },
        "mailAddress": "eguchi@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "created": "2014-07-11T06:26:05Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
