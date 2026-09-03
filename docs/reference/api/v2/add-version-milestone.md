---
title: バージョン(マイルストーン)の追加
slug: add-version-milestone
method: POST
path: "/api/v2/projects/:projectIdOrKey/versions"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-version-milestone/"
fetched: 2026-08-30
---

# バージョン(マイルストーン)の追加

```http
POST /api/v2/projects/:projectIdOrKey/versions
```

プロジェクトにバージョン(マイルストーン)を追加します。

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

## リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| name (必須) | string | バージョンの名前 |
| description | string | バージョンの説明 |
| startDate | string | バージョンの開始日 (yyyy-MM-dd) |
| releaseDueDate | string | バージョンのリリース予定日 (yyyy-MM-dd) |

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
    "projectId": 1,
    "name": "いますぐ",
    "description": "",
    "startDate": null,
    "releaseDueDate": null,
    "archived": false,
    "displayOrder": 0
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
