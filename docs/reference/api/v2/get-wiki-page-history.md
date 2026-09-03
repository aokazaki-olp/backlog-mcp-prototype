---
title: Wikiページ更新履歴一覧の取得
slug: get-wiki-page-history
method: GET
path: "/api/v2/wikis/:wikiId/history"
category: wikis
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-wiki-page-history/"
fetched: 2026-08-30
---

# Wikiページ更新履歴一覧の取得

【お知らせ】2026年7月14日から、Wikiの提供方針を以下のとおり変更します。

- 新規スペース：Wikiはご利用いただけません
- 既存スペース：新規プロジェクトのWikiは初期設定がオフになります。プロジェクト設定からオンに切り替えられます

詳しくは、[新規スペースへのWiki提供終了と初期設定の変更について](https://backlog.com/ja/blog/backlog-update-wiki-end-of-support-new-spaces/)を参照してください。

---

Wiki関連のAPIは引き続きご利用いただけます。将来的なWikiの廃止に伴うAPIへの影響は、スケジュール確定後に十分な周知期間を設けて改めてご案内します。

```http
GET /api/v2/wikis/:wikiId/history
```

Wikiページの更新履歴の一覧を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| wikiId | int | WikiページのID |

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| minId | int | 最小ID |
| maxId | int | 最大ID |
| count | int | 取得上限(1-100) 指定が無い場合は20 |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
[
    {
        "pageId": 1,
        "version": 1,
        "name": "test",
        "content": "hello world",
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
        "created":"2014-06-24T05:04:48Z"
    },
    // ...
]
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
