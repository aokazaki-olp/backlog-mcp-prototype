---
title: 認証と認可
slug: auth
source: "https://developer.nulab.com/ja/docs/backlog/auth/"
fetched: 2026-08-30
---

# 認証と認可

## API Key

リクエストにユーザーごとに発行された API キーを付加して認証する方式です。 リソースへのアクセス時に、発行された API キーをクエリパラメーター “apiKey” またはリクエストヘッダー “Backlog-API-Key” として付加することで認証が行えます。

### リクエスト例

```
https://xx.backlog.jp/api/v2/users/myself?apiKey=abcdefghijklmn
```

URLがbacklog.comの場合は次のようになります。

```
https://xx.backlog.com/api/v2/users/myself?apiKey=abcdefghijklmn
```

### リクエスト例（リクエストヘッダー）

API キーはクエリパラメーターの代わりにリクエストヘッダー “Backlog-API-Key” で送信することもできます。

```http
GET /api/v2/users/myself
HTTP/1.1
Host: xx.backlog.jp (URLがbacklog.comの場合はxx.backlog.comになります)
Backlog-API-Key: abcdefghijklmn
```

## OAuth 2.0

OAuth2認可フレームワーク(RFC 6749)で定められた認可コードによる認可(Authorization Code Grant)を使用してAPIにアクセスすることができます。

ここで使用するclient_idとclient_secretを取得するには、[Backlog Developer サイト](https://backlog.com/developer/applications/)でアプリケーション登録を行ってください。

### 認可リクエスト

#### メソッド

```
GET
```

#### URL

```
/OAuth2AccessRequest.action
```

認可エンドポイントです。 ユーザからの許可が得られた場合、redirect_uriに認可コードを含めてリダイレクトを行います。

#### クエリパラメーター

| 名前 | 型 | 説明 |
| --- | --- | --- |
| response_type (必須) | string | 値は”code”で固定 |
| client_id (必須) | string |  |
| redirect_uri (必須) | string | [開発アプリケーション](https://backlog.com/developer/applications/) ページで設定したものと同じUri |
| state | string |  |

### アクセストークンリクエスト

#### メソッド

```
POST
```

#### URL

```
/api/v2/oauth2/token
```

トークンエンドポイントです。 認可エンドポイントのリダイレクトから取得した認可コードを使用して、有効なアクセストークン及びリフレッシュトークンを取得できます。

#### リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| grant_type (必須) | string | 値は”authorization_code”で固定 |
| code (必須) | string | 認可エンドポイントのリダイレクトから取得した認可コード |
| redirect_uri (必須) | string | [開発アプリケーション](https://backlog.com/developer/applications/) ページで設定したものと同じUri |
| client_id (必須) | string |  |
| client_secret (必須) | string |  |

#### レスポンス例

##### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

##### レスポンスボディ

```json
{
    "access_token": "YOUR_ACCESS_TOKEN",
    "token_type":"Bearer",
    "expires_in":3600,
    "refresh_token":"YOUR_REFRESH_TOKEN"
}
```

### アクセストークンを使用したAPIアクセス

トークンエンドポイントから取得したアクセストークンをAuthorizationヘッダーに含めてAPIを呼び出すことができます

```http
GET /api/v2/space
HTTP/1.1
Host: example.backlog.jp (URLがbacklog.comの場合はexample.backlog.comになります)
Authorization: Bearer YOUR_ACCESS_TOKEN
```

認証エラーが発生した場合、ステータスコード401を返却します。 エラーの詳細はレスポンスのWWW-Authenticateヘッダーを確認して下さい。

- アクセストークンが間違っている場合

```
"Bearer error="invalid_token", error_description="The access token is invalid"
```

- アクセストークンの有効期限切れの場合

```
"Bearer error="invalid_token", error_description="The access token expired"
```

### アクセストークンの更新

アクセストークンは新規に生成されてから3600秒（1時間）で有効期限切れになります。リフレッシュトークンを使ってトークンエンドポイントから有効なアクセストークンを取得することができます。

#### メソッド

```
POST
```

#### URL

```
/api/v2/oauth2/token
```

#### リクエストパラメーター

```
Content-Type:application/x-www-form-urlencoded
```

| パラメーター名 | 型 | 内容 |
| --- | --- | --- |
| grant_type (必須) | string | 値は”refresh_token”で固定 |
| client_id (必須) | string |  |
| client_secret (必須) | string |  |
| refresh_token (必須) | string |  |

#### レスポンス例

##### ステータスライン / レスポンスヘッダ

```http
HTTP/1.1 200 OK
Content-Type:application/json;charset=utf-8
```

##### レスポンスボディ

```json
{
    "access_token": "YOUR_ACCESS_TOKEN",
    "token_type":"Bearer",
    "expires_in":3600,
    "refresh_token":"YOUR_REFRESH_TOKEN"
}
```
