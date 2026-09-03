---
title: クイックスタート
slug: getting-started
source: "https://developer.nulab.com/ja/docs/backlog/getting-started/"
fetched: 2026-08-30
---

# クイックスタート

このページでは、Backlog API を実際に使い始めるまでの手順を紹介します。まずは動かしてみたいという方は、以下の順に進めてください。

## 1. Backlog API を利用する準備

Backlog API を利用するには、**API キー** または **OAuth 2.0 のアクセストークン** のいずれかが必要です。

- **API キー** — もっとも簡単な方法です。Backlog にログインし、**個人設定 > API** からAPI キーを発行できます。
- **OAuth 2.0** — 他の Backlog ユーザーの代わりに API を呼び出すアプリケーションを作る場合はこちらを利用します。[Backlog Developer サイト](https://backlog.com/developer/applications/) にアプリケーションを登録し、`client_id` と `client_secret` を取得してください。

詳細は[認証と認可](./auth.md)を参照してください。

## 2. 最初のリクエストを送る

ではリクエストを送ってみましょう。 `/api/v2/users/myself` は認証済みユーザー自身の情報を返すエンドポイントです。 以下を実行し、認証情報が正しく設定できているかを確認してください。

また、以下のように`apiKey` クエリパラメーターで渡すこともできます。

```bash
curl "https://{{YOUR-DOMAIN}}/api/v2/users/myself?apiKey=YOUR_API_KEY"
```

OAuth 2.0 のアクセストークンを利用する場合は、`Authorization` ヘッダーで送信してください。

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://{{YOUR-DOMAIN}}/api/v2/users/myself"
```

## 3. レスポンスを確認する

### 成功したとき

成功すると、HTTP `200 OK` とともに、認証済みユーザーの情報が JSON で返されます。

```json
{
  "id": 1,
  "userId": "admin",
  "name": "admin",
  "roleType": 1,
  "lang": "ja",
  "mailAddress": "admin@example.com"
}
```

### 失敗したとき

失敗すると、 `4xx` または `5xx` のステータスコードとともに、`errors` 配列を含む内容が JSON で返されます

```json
{
  "errors": [
    {
      "message": "Authentication failure.",
      "code": 11,
      "moreInfo": ""
    }
  ]
}
```

なお、OAuth 2.0 のアクセストークンによる認証失敗は例外で、`errors` 配列ではなくステータスコード `401` と `WWW-Authenticate` レスポンスヘッダーでエラー内容が返されます。詳細は[認証と認可](./auth.md)を参照してください。

よくある原因:

- API キーが誤っている、または別スペースのキーを使っている — URL のドメインを確認してください。
- アクセストークンの有効期限が切れている — リフレッシュしてください。詳細は[認証と認可](./auth.md)を参照してください。

エラーコードの一覧は[エラーレスポンス](./error-response.md)を参照してください。

## 次に読むページ

- [認証と認可](./auth.md) — API キーと OAuth 2.0 の詳細
- [レート制限](./rate-limit.md) — API ごと・ユーザーごとのリクエスト上限
- [API リスト](../v2/get-space.md) — 呼び出せる全エンドポイント
- [ライブラリ](./libraries.md) — 各種プログラミング言語向けの公式・有志ライブラリ
