---
title: カスタム属性の追加
slug: add-custom-field
method: POST
path: "/api/v2/projects/:projectIdOrKey/customFields"
category: projects
source: "https://developer.nulab.com/ja/docs/backlog/api/2/add-custom-field/"
fetched: 2026-08-30
---

# カスタム属性の追加

```http
POST /api/v2/projects/:projectIdOrKey/customFields
```

プロジェクトに新しいカスタム属性を追加します。

## 実行可能な権限

```
管理者
プロジェクト管理者
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
| typeId (必須) | int | カスタム属性の形式<br>1: 文字列<br>2: 文章<br>3: 数値<br>4: 日付<br>5: 単一リスト<br>6: 複数リスト<br>7: チェックボックス<br>8: ラジオ |
| name (必須) | string | カスタム属性の名前 |
| applicableIssueTypes[]<br>[(複数指定可)](../guides/tips.md) | int | カスタム属性を有効にする種別ID<br>空の場合、すべての課題種別で有効 |
| description | string | カスタム属性の説明 |
| required | boolean | 必須な属性とする場合はtrue |

## 追加パラメーター (数値属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| min | int | 最小値 |
| max | int | 最大値 |
| initialValue | int | 初期値 |
| unit | string | 単位 |

## 追加パラメーター (日付属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| min | string | 最小値 (yyyy-MM-dd) |
| max | string | 最大値 (yyyy-MM-dd) |
| initialValueType | int | 1:当日 2: 当日 + initialShift 3:指定日 |
| initialDate | string | 初期値 (yyyy-MM-dd) |
| initialShift | int | 差分日数 |

## 追加パラメーター (リスト属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| items[]<br>[(複数指定可)](../guides/tips.md) | string | リスト項目 |
| allowInput | boolean | その他直接入力を許可 |
| allowAddItem | boolean | 項目の追加を許可 |

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
    "projectId": 5,
    "typeId": 1,
    "name": "バグ専用属性",
    "description": "",
    "required": false,
    "applicableIssueTypes": [1]
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
