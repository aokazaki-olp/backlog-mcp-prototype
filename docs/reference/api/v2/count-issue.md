---
title: 課題数の取得
slug: count-issue
method: GET
path: /api/v2/issues/count
category: issues
source: "https://developer.nulab.com/ja/docs/backlog/api/2/count-issue/"
fetched: 2026-08-30
---

# 課題数の取得

```http
GET /api/v2/issues/count
```

課題の数を取得します。

## 実行可能な権限

```
すべての権限
```

## クエリパラメーター

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| projectId[]<br>[(複数指定可)](../guides/tips.md) | int | プロジェクトのID |
| issueTypeId[]<br>[(複数指定可)](../guides/tips.md) | int | 種別のID |
| categoryId[]<br>[(複数指定可)](../guides/tips.md) | int | カテゴリーのID |
| versionId[]<br>[(複数指定可)](../guides/tips.md) | int | 発生バージョンのID |
| milestoneId[]<br>[(複数指定可)](../guides/tips.md) | int | マイルストーンのID |
| statusId[]<br>[(複数指定可)](../guides/tips.md) | int | 状態のID |
| priorityId[]<br>[(複数指定可)](../guides/tips.md) | int | 優先度のID |
| assigneeId[]<br>[(複数指定可)](../guides/tips.md) | int | 担当者のID |
| createdUserId[]<br>[(複数指定可)](../guides/tips.md) | int | 登録者のID |
| resolutionId[]<br>[(複数指定可)](../guides/tips.md) | int | 完了理由のID |
| parentChild | int | 親子課題の条件<br>0: すべて<br>1: 子課題以外<br>2: 子課題<br>3: 親課題でも子課題でもない課題<br>4: 親課題 |
| attachment | boolean | 添付ファイルを含む場合はtrue |
| sharedFile | boolean | 共有ファイルを含む場合はtrue |
| sort | string | 課題一覧のソートに使用する属性名<br>”issueType"<br>"category"<br>"version"<br>"milestone"<br>"summary"<br>"status"<br>"priority"<br>"attachment"<br>"sharedFile"<br>"created"<br>"createdUser"<br>"updated"<br>"updatedUser"<br>"assignee"<br>"startDate"<br>"dueDate"<br>"estimatedHours"<br>"actualHours"<br>"childIssue"<br>"customField_${id}“ |
| order | string | ”asc”または”desc” 指定が無い場合は”desc” |
| offset | int |  |
| count | int | 取得上限(1-100) 指定が無い場合は20 |
| createdSince | string | 登録日 (yyyy-MM-dd) |
| createdUntil | string | 登録日 (yyyy-MM-dd) |
| updatedSince | string | 更新日 (yyyy-MM-dd) |
| updatedUntil | string | 更新日 (yyyy-MM-dd) |
| startDateSince | string | 開始日 (yyyy-MM-dd) |
| startDateUntil | string | 開始日 (yyyy-MM-dd) |
| dueDateSince | string | 期限日 (yyyy-MM-dd) |
| dueDateUntil | string | 期限日 (yyyy-MM-dd) |
| hasDueDate | boolean | falseを指定すると、期限日が設定されていない課題を返します。trueの指定はサポートされておらず、エラーが返されます。 |
| id[]<br>[(複数指定可)](../guides/tips.md) | int | 課題のID |
| parentIssueId[]<br>[(複数指定可)](../guides/tips.md) | int | 親課題のID |
| keyword | string | 検索キーワード |

## カスタム属性を指定した検索 (テキスト属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id} | string | 検索キーワード |

## カスタム属性を指定した検索 (数値属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id}_min | int | 最小値 |
| customField_${id}_max | int | 最大値 |

## カスタム属性を指定した検索 (日付属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id}_min | string | 最小値 |
| customField_${id}_max | string | 最大値 |

## カスタム属性を指定した検索 (リスト属性)

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| customField_${id}[]<br>[(複数指定可)](../guides/tips.md) | int | 値のID |

## レスポンス例

### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

### レスポンスボディ

```json
{
    "count": 43
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
