---
title: Webhookの更新
slug: update-webhook
method: PATCH
path: "/api/v2/projects/:projectIdOrKey/webhooks/:webhookId"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/update-webhook/"
fetched: 2026-08-30
---

# Webhookの更新

```http
PATCH /api/v2/projects/:projectIdOrKey/webhooks/:webhookId
```

プロジェクトに登録されているWebhookの設定を更新します。リクエストパラメーターで指定した項目のみが更新されます。  
更新したいWebhookは[Webhook一覧の取得](./get-list-of-webhooks.md)から取得できます。

## 実行可能な権限

```
管理者
プロジェクト管理者
```

## URL パラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectIdOrKey | string | 以下のいずれかを指定します。<br>・プロジェクトのID<br>・プロジェクトキー<br>プロジェクトのIDとプロジェクトキーは[プロジェクト一覧の取得](./get-project-list.md)から取得できます。 |
| webhookId | string | WebhookのID。<br>WebhookのIDは[Webhook一覧の取得](./get-list-of-webhooks.md)から取得できます。 |

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name | string | Webhookの名前 |
| description | string | Webhookの説明 |
| hookUrl | string | イベントの通知先のURL |
| allEvent | boolean | 全てのイベントを通知するかどうか |
| activityTypeIds[]<br>（[複数指定可](../guides/tips.md)） | int | 通知するイベントのID |

## リクエストの例

```bash
curl --request PATCH \
--url "https://{{YOUR-DOMAIN}}/api/v2/projects/{{PROJECT_ID_OR_KEY}}/webhooks/{{WEBHOOK_ID}}?apiKey=$API_KEY" \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data name="Updated webhook" \
--data hookUrl="https://example.com/webhook" \
--data allEvent=true
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
