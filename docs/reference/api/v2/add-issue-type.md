---
title: 種別の追加
slug: add-issue-type
method: POST
path: "/api/v2/projects/:projectIdOrKey/issueTypes"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-issue-type/"
fetched: 2026-08-30
---

# 種別の追加

```http
POST /api/v2/projects/:projectIdOrKey/issueTypes
```

プロジェクトに種別を追加します。

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
| name (必須) | string | 種別の名前 |
| color (必須) | string | 種別の背景色：以下から指定<br>”#e30000"<br>"#990000"<br>"#934981"<br>"#814fbc"<br>"#2779ca"<br>"#007e9a"<br>"#7ea800"<br>"#ff9200"<br>"#ff3265"<br>"#666665” |
| templateSummary | string | 課題テンプレートの件名 |
| templateDescription | string | 課題テンプレートの詳細 |

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
    "projectId": 1,
    "name": "バグ",
    "color": "#990000",
    "displayOrder": 0,
    "templateSummary": "件名",
    "templateDescription": "詳細"
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
