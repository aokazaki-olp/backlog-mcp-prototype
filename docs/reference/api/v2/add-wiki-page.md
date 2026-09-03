---
title: Wikiページの追加
slug: add-wiki-page
method: POST
path: /api/v2/wikis
category: wikis
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-wiki-page/"
fetched: 2026-08-30
---

# Wikiページの追加

【お知らせ】2026年7月14日から、Wikiの提供方針を以下のとおり変更します。

- 新規スペース：Wikiはご利用いただけません
- 既存スペース：新規プロジェクトのWikiは初期設定がオフになります。プロジェクト設定からオンに切り替えられます

詳しくは、[新規スペースへのWiki提供終了と初期設定の変更について](https://backlog.com/ja/blog/backlog-update-wiki-end-of-support-new-spaces/)を参照してください。

---

Wiki関連のAPIは引き続きご利用いただけます。将来的なWikiの廃止に伴うAPIへの影響は、スケジュール確定後に十分な周知期間を設けて改めてご案内します。

```http
POST /api/v2/wikis
```

WIkiの新しいページを追加します。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
制限なし
```

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectId (必須) | int | プロジェクトのID |
| name (必須) | string | ページ名 |
| content (必須) | string | ページの内容 |
| mailNotify | boolean | ページの追加をメールで通知する場合はtrue |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 201 CREATED
Content-Type:application/json;charset=utf-8
Location:https://xx.backlog.jp/alias/wiki/1
```

### レスポンスボディ

```json
{
    "id": 1,
    "projectId": 1,
    "name": "Home",
    "content": "test",
    "tags": [
        {
            "id": 12,
            "name": "議事録"
        }
    ],
    "attachments": [],
    "sharedFiles": [],
    "stars": [],
    "createdUser": {
        "id": 1,
        "userId": "admin",
        "name": "admin",
        "roleType": 1,
        "lang": "ja",
        "nulabAccount": {
            "nulabId": "Prm9ZD9DQD5snNWcSYSwZiQoA9WFBUEa2ySznrSnSQRhdC2X8G",
            "name": "admin",
            "uniqueId": "admin"
        },
        "mailAddress": "eguchi@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "created": "2012-07-23T06:09:48Z",
    "updatedUser": {
        "id": 1,
        "userId": "admin",
        "name": "admin",
        "roleType": 1,
        "lang": "ja",
        "nulabAccount": {
            "nulabId": "Prm9ZD9DQD5snNWcSYSwZiQoA9WFBUEa2ySznrSnSQRhdC2X8G",
            "name": "admin",
            "uniqueId": "admin"
        },
        "mailAddress": "eguchi@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "updated": "2012-07-23T06:09:48Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
