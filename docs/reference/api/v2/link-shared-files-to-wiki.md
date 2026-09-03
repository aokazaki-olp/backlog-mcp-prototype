---
title: Wikiに共有ファイルをリンク
slug: link-shared-files-to-wiki
method: POST
path: "/api/v2/wikis/:wikiId/sharedFiles"
category: wikis
source: "https://developer.nulab.com/ja/docs/backlog/api/2/link-shared-files-to-wiki/"
fetched: 2026-08-30
---

# Wikiに共有ファイルをリンク

【お知らせ】2026年7月14日から、Wikiの提供方針を以下のとおり変更します。

- 新規スペース：Wikiはご利用いただけません
- 既存スペース：新規プロジェクトのWikiは初期設定がオフになります。プロジェクト設定からオンに切り替えられます

詳しくは、[新規スペースへのWiki提供終了と初期設定の変更について](https://backlog.com/ja/blog/backlog-update-wiki-end-of-support-new-spaces/)を参照してください。

---

Wiki関連のAPIは引き続きご利用いただけます。将来的なWikiの廃止に伴うAPIへの影響は、スケジュール確定後に十分な周知期間を設けて改めてご案内します。

```http
POST /api/v2/wikis/:wikiId/sharedFiles
```

Wikiに共有ファイルをリンクします。

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

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| fileId[] (必須) | int | 共有ファイルのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 4056,
    "projectId": 5,
    "type": "file",
    "dir": "/design/",
    "name": "site.png",
    "size": 2735,
    "createdUser": {
        "id": 5686,
        "userId": "takada",
        "name": "takada",
        "roleType":2,
        "lang":"ja",
        "nulabAccount": {
            "nulabId": "r4iGCWu4mU64aGUJykJH4GhBwdAXMTAtVRQ5RwZTDpeaECoBs2",
            "name": "takada",
            "uniqueId": "takada"
        },
        "mailAddress":"takada@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "created": "2009-02-27T03:26:15Z",
    "updatedUser": {
        "id": 5686,
        "userId": "takada",
        "name": "takada",
        "roleType": 2,
        "lang": "ja",
        "nulabAccount": {
            "nulabId": "r4iGCWu4mU64aGUJykJH4GhBwdAXMTAtVRQ5RwZTDpeaECoBs2",
            "name": "takada",
            "uniqueId": "takada"
        },
        "mailAddress": "takada@nulab.example",
        "lastLoginTime": "2022-09-01T06:35:39Z"
    },
    "updated":"2010-05-02T17:37:10Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
