---
title: Webhookの追加
slug: add-webhook
method: POST
path: "/api/v2/projects/:projectIdOrKey/webhooks"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-webhook/"
fetched: 2026-08-30
---

# Webhookの追加

```http
POST /api/v2/projects/:projectIdOrKey/webhooks
```

プロジェクトにWebhookを追加します。  
Webhookを追加すると、プロジェクトで発生したイベントを`hookUrl`で指定したURLに通知できます。  
対象のプロジェクトは[プロジェクト一覧の取得](./get-project-list.md)から取得できます。

## 実行可能な権限

```
管理者
プロジェクト管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | 以下のいずれかを指定します。<br>・プロジェクトのID<br>・プロジェクトキー<br>プロジェクトのIDとプロジェクトキーは[プロジェクト一覧の取得](./get-project-list.md)から取得できます。 |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name（必須） | string | Webhookの名前 |
| description | string | Webhookの説明 |
| hookUrl（必須） | string | イベントの通知先のURL |
| allEvent（必須） | boolean | 全てのイベントを通知するかどうか |
| activityTypeIds[]<br>（[複数指定可](../guides/tips.md)） | int | 通知するイベントのID |

## リクエストの例

```bash
curl --request POST \
--url "https://{{YOUR-DOMAIN}}/api/v2/projects/{{PROJECT_ID_OR_KEY}}/webhooks?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data name="New webhook" \
--data description="Webhook description" \
--data hookUrl="https://example.com/webhook" \
--data allEvent=false \
--data 'activityTypeIds[]=1' \
--data 'activityTypeIds[]=2' \
--data 'activityTypeIds[]=3'
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "id": 3,
    "name": "webhook",
    "description": "",
    "hookUrl": "http://nulab.test/",
    "allEvent": false,
    "activityTypeIds": [1, 2, 3, 4, 5],
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
    "created": "2014-11-30T01:22:21Z",
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
    "updated": "2014-11-30T01:22:21Z"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
