# src/libs/ の出所

**このディレクトリは借り物の生成物。ローカルで編集しない。**
正本は `aokazaki-olp/libraries`。修正が必要になったら元リポ側で直し、
`tools/sync-libs.sh` で作り直す。

| 項目 | 値 |
| --- | --- |
| リポジトリ | `aokazaki-olp/libraries` |
| ref | `origin/claude/backlog-api-client-libraries-51jyj7` |
| コミット | `2dfe413813eed7cf2a02813fb7b1893bd023a5c5` |
| コミット日時 | 2026-09-02T11:34:53+00:00 |
| 同期元 | `nodejs/src/` |

## 取り込んだモジュール

- `httpTypes.ts`
- `LoggerFacade.ts`
- `HttpCore.ts`
- `ApiClient.ts`
- `BacklogApiClient.ts`

`BacklogApiClient` から到達可能なものだけ（閉じたグラフ）。

## コピーではなくコンパイルしている理由

libraries は**旧規約のままが正しい**（新規約を入れると全モジュールの改修になる）。
そのままコピーすると本リポジトリでは2つ落ちる。

1. `HttpError` / `BacklogApiError` が**パラメータプロパティ**を使っており、Node の
   型注釈除去では実行できない（`TypeScript parameter property is not supported in strip-only mode`）
2. 相対 import が `.js` なので、実ファイルが `.ts` だと解決できない

コンパイルすると両方とも消える。出力後は `.js` が実ファイルになるので、
ソースの `./ApiClient.js` という書き方もそのまま正しくなる。

規約 §1.3（適用範囲は実行モデルで決める）・§8（実行モデルごとに設定を分ける）に従い、
`src/libs/` は「コンパイルを通す実行モデル」として `tsconfig.libs.json` を持つ。
本体の設定と違い `erasableSyntaxOnly` も `strict` も付けない（借り物を新規約の
厳しさで検査しても直せない。§8.3「借り物・生成物は対象から外す」）。

**`.ts` のソースは残していない。** 上のコミットハッシュと `tools/sync-libs.sh` で
再現できる。残すと本体の tsconfig / lint が拾ってしまう。

## 未反映の上流修正

- **`BacklogApiClient.create()` の `spaceUrl` 検証が `typeof string && !== ''` だけ**で、
  スキームもホストも見ていない。任意ホストへ `Backlog-API-Key` ヘッダごと送れてしまう。
  本リポジトリでは **URL を受け取らず `src/config.ts` で組み立てる**ことで回避しているため
  実害はないが、libraries 側は `SalesforceAuth.normalizeTokenHost` に倣った検証を
  入れるべき（`spaceUrl` を受ける API である以上、そこでも検証すべき）。
