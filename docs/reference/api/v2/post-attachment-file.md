---
title: 添付ファイルの送信
slug: post-attachment-file
method: POST
path: /api/v2/space/attachment
category: space
source: "https://developer.nulab.com/ja/docs/backlog/api/2/post-attachment-file/"
fetched: 2026-08-30
---

# 添付ファイルの送信

```http
POST /api/v2/space/attachment
```

課題やコメント、Wikiにファイルを添付するために、Backlogスペースにファイルをアップロードします。アップロードが成功すると、添付ファイルのIDが返されます。

このIDは、[課題の追加](./add-issue.md)、[課題情報の更新](./update-issue.md)、[コメントの追加](./add-comment.md)などのAPIで `attachmentId[]` パラメータに指定することで、それぞれの項目にファイルを添付できます。

送信されたファイルは、いずれかの項目に添付された後に削除されます。また、どこにも添付されなかった場合は1時間後に自動的に削除されます。

## 実行可能な権限

**権限**

```
すべての権限
```

**制限**

```
課題の登録のみ
制限なし
```

## リクエストパラメーター

```
// 全体
--- Content-Type:multipart/form-data
// ファイル部のパート
--- Content-Disposition: form-data; name="file"; filename="ファイル名"
--- Content-Type: application/octet-stream 等
```

`Content-Type: multipart/form-data`では、以下のパラメータを送信します。

| パラメーター名 | 内容 |
| --- | --- |
| file（必須） | 添付するファイル |

## リクエストの例

```bash
curl --request POST \
--url "https://{{YOUR-DOMAIN}}/api/v2/space/attachment?apiKey=$API_KEY" \
--header 'Content-Type: multipart/form-data' \
--form file=@/path/to/your/file.txt
```

`{{YOUR-DOMAIN}}`には、対象のスペースのドメインを記入してください。ドメインは、以下のいずれかです。スペースIDが不明の場合は、[スペースIDとは？](https://support-ja.backlog.com/hc/ja/articles/360036151593)を参照してください。

- https://[スペースID].backlog.com
- https://[スペースID].backlog.jp
- https://[スペースID].backlogtool.com

`/path/to/your/file.txt` には、添付したいファイルのパスを記入してください。

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
    "name": "test.txt",
    "size": 8857
}
```

## エラーレスポンス

[エラーレスポンス](../guides/error-response.md)を参照してください。

## 制限事項

[レート制限](../guides/rate-limit.md)を参照してください
