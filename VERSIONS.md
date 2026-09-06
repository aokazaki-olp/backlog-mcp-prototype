# 固定したバージョンとその理由

`CODING_RULES.md` §8.1 の「固定した版とその理由は `package.json` の隣に書き、本規約には書かない」に対応する文書。

## Node — `>=24.12.0`

規約の baseline は「型注釈除去（type stripping）が stable」。**Node 24.12 / 25.2 で stable になった**ため、これを下限にする。

開発では **v24.20.0（LTS Krypton）** を使っている。24.16.0 以降を選んだのは `fs.glob` の `followSymlinks` オプション（既定 `false`）が入っているため。添付ファイル対応で必要になる。

## TypeScript — `6.0.3`（固定、キャレットなし）

**最新は 7.0.2 だが採用しない。** `typescript-eslint` 8.69.0 の peerDependencies が `typescript: >=4.8.4 <6.1.0` で、TypeScript 7 では**型情報を使う lint が動かない**。

規約 §8.1 は次のように定めている。

> 型情報を使う lint が動く組み合わせを選ぶ。コンパイラの最新版が lint 側の対応範囲より先に進んでいることは珍しくない。速い方を採るか lint を維持するかは、**この規約を機械強制できるかどうか**で決める（§1.2）。

これに従い lint 側を維持する。`<6.1.0` を満たす最新が 6.0.3。

**typescript-eslint が TypeScript 7 に対応したら、この固定を外して再検証する**（§8.3 の「依存を更新したときも同じ確認をする」）。

## 実行時依存 — `got` のみ

`src/libs/` へ vendoring した `BacklogApiClient` が `HttpCore.createTransport()` で `got` を使うため。推移的依存は 23 パッケージで、いずれも HTTP クライアントの構成要素（HTTP サーバ・OAuth・子プロセス起動は含まれない）。

## 実行時依存 — `sonic-boom`（2026-09-07 追加）

監査ログの記述子とローテーションを委ねる。**5.0.1 / MIT / 推移的依存は `atomic-sleep` の1つだけ**（65リリース・2017-12-23 以降）。

pino の書き出し先そのもので、**ロガーではない** — レベルの概念が無いので、`DESIGN.md` §5 が
ログのフレームワークを捨てた理由（`LOG_LEVEL=error` で監査が黙って消える）は掛からない。
`sync` / `fsync` / `append` / `mode` / `reopen` が揃っており、手書きしていた部分と1対1で対応する。

採った理由は**記述子の扱いの向き**。手書きの `fdFor` は「閉じてから開く」形で、開けなかったときに
閉じ済みの番号が残り、その番号を他人が取ると**巻き添えの書き込みが監査ログのファイルへ入っていた**
（実測。`EBADF` は出ないので誰も気づかない）。`reopen` は**開けてから閉じる**のでこの状態が作れない。

**import の書き方に制約がある。** `.d.ts` は `export default` と `export class SonicBoom` の両方を
宣言しているが、実行時の名前付き export は Node の lexer が検出できず `SyntaxError` になる。
逆に既定 import は型の側で namespace 扱いになり `new` できない。**両方を満たすのは次の形だけ**
（`as` は要らない）。

```ts
import SonicBoomModule from 'sonic-boom';
import type { SonicBoom } from 'sonic-boom'; // 型だけ。実行時に消える
new SonicBoomModule.SonicBoom({ dest, append: true, mkdir: true, mode: 0o600, sync: true });
```

**`'error'` リスナは必ず付ける。** 非同期に流れてくる失敗があり、リスナの無い `'error'` は
`uncaughtException` になってプロセスごと落ちる。付けるかどうかは「続けるか止めるか」ではなく
**「制御された停止か、既定のクラッシュか」**の選択になる。

### `@modelcontextprotocol/sdk` を採らなかった理由

公式 SDK（1.30.0）の推移的依存は **91 パッケージ**で、`express` / `hono` / `@hono/node-server` / `cors` / `express-rate-limit`（HTTP トランスポート）、`jose` / `pkce-challenge`（OAuth 2.1）、`eventsource`（SSE）、そして **`cross-spawn`**（子プロセス起動）を含む。

本サーバは **stdio 専用**でこれらを一切使わない。加えて、

- 本プロジェクトは CVE の傾向（コマンドインジェクションが最多）と Deno の `--allow-run` の議論を根拠に、**`child_process` の import を lint で禁止**している。SDK を入れると依存ツリーにその機能が入り、規則の意図と食い違う
- SDK の High 3件のうち 2件（DNS rebinding: CVE-2025-66414 / クライアント間データ漏洩: CVE-2026-25536）は `StreamableHTTPServerTransport` 由来で、**使わない機能のために攻撃面を負う**ことになる

MCP over stdio は改行区切りの JSON-RPC 2.0 であり、必要なメソッドは `initialize` / `notifications/initialized` / `tools/list` / `tools/call` / `ping` に限られる。自前実装し、プロトコルの追従は自分たちで負う。

参照した仕様は `schema/2026-07-28/schema.ts`（`LATEST_PROTOCOL_VERSION = "2026-07-28"`）。
