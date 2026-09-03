---
title: ユーザー情報の取得
slug: get-user
method: GET
path: "/api/v2/users/:userId"
category: users
source: "https://developer.nulab.com/ja/docs/backlog/api/2/get-user/"
fetched: 2026-08-30
---

# ユーザー情報の取得

```http
GET /api/v2/users/:userId
```

ユーザー情報を取得します。

## 実行可能な権限

```
すべての権限
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| userId | int | ユーザーのID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
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
}
```

## レスポンス説明

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| lang | string | ユーザーの言語設定。<br>`"en"` 英語<br>`"ja"` 日本語<br>`null` 未指定 |
| roleType | int | ユーザーの権限。<br>`1` 管理者<br>`2` 一般ユーザー、ゲスト（制限：制限なし）<br>`3` 一般ユーザー、ゲスト（制限：課題の登録のみ）<br>`4` 一般ユーザー、ゲスト（制限：課題の閲覧のみ） |

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
