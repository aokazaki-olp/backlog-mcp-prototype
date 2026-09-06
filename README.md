# backlog-mcp

Backlog を Claude Code / Claude Desktop から扱う MCP サーバ。**インハウス利用・非公開**。

## これは何のためにあるか

公式の [`nulab/backlog-mcp-server`](https://github.com/nulab/backlog-mcp-server) は既にある。約50ツールを持つが、read-only モードもプロジェクト allowlist も無い。

**このサーバの存在理由は機能追加ではない。** Backlog の API キーは発行ユーザーの全権限で届き、Backlog 側に「このプロジェクトだけ」を表現する手段はユーザーの権限設定しかない。

> **このサーバの役割は、Backlog が提供していないスコープ層を補うこと。**

したがって、ツールは少ない方が正しい。削除系のツールは作らない（ポリシーにどう書いても表現できない）。

**なぜその形以外を採らなかったかは [`DESIGN.md`](./DESIGN.md) にある**（原則の体系・捨てた案・未解決）。

## 設定

**環境変数が受け取るのはパスだけ。秘密は1つも入らない。**

| 環境変数                   | 必須 | 内容                                                                               |
| -------------------------- | :--: | ---------------------------------------------------------------------------------- |
| `BACKLOG_SPACE_ID`         |  ✔   | スペースID **だけ**。URL は受け取らない                                            |
| `BACKLOG_ENV_FILE`         |  ✔   | **暗号化された** `.env` のパス                                                     |
| `BACKLOG_ENV_KEYS_FILE`    |  ✔   | 秘密鍵（`.env.keys`）のパス                                                        |
| `BACKLOG_POLICY`           |  ✔   | ポリシーファイルのパス                                                             |
| `BACKLOG_DOMAIN`           |      | `backlog.jp`（既定）/ `backlog.com` / `backlogtool.com`                            |
| `BACKLOG_LOG_DIR`          |      | 監査ログの出力先。既定は**ポリシーファイルの隣**の `logs/`                         |
| `BACKLOG_ATTACHMENTS_ROOT` |      | 添付を許すディレクトリ。**未設定なら添付の口そのものが開かない**（既定は置かない） |
| `BACKLOG_READ_ONLY`        |      | `1` または `true` で全プロジェクトを `read` に切り下げる                           |

URL ではなくスペースID を受けるのは、`https` 以外のスキーム・任意ホスト・パス注入を**設定として表現できなくする**ため。接続先は `https://{spaceId}.{domain}` としてサーバ側で組み立てる。

### API キーを env に置かない

**攻撃者を想定した防御ではない。** 秘密鍵は同じディスクに平文で置くので、**両方のファイルを読める相手には効かない**。塞いでいるのは**不注意で漏れる経路**のほうで、そちらのほうが桁違いに起きやすい。

1. 環境変数は LLM のコンテキストに入り込みうる
2. `.mcp.json` を除外し忘れて追跡される

**env が受け取るのは2つのファイルのパスだけ。** 秘密が env にも `.mcp.json` にも載らないので、どちらの事故も起きない。手段として `.env` の値を公開鍵暗号（dotenvx）にかけ、暗号文と秘密鍵を別の場所へ置く — **片方だけ漏れても意味を成さない**。

まず `.env` を作り、**エディタで**1行書く。

```
BACKLOG_API_KEY=xxxxxxxx
```

次に暗号化する。**秘密鍵の出力先はここで指定する**（指定しないとカレントディレクトリに書かれる）。

```bash
npx dotenvx encrypt -f .env -fk ~/.backlog-mcp/keys/.env.keys
```

`.env` の値は暗号文に置き換わるので置き場所は自由（`.gitignore` は `.env*` を無視している）。秘密鍵は上のとおり**リポジトリの外**へ出す。

> **秘密をコマンドラインに書かない。** シェルは実行した行をファイルに残す。PowerShell の PSReadLine は既定が `HistorySaveStyle = SaveIncrementally` で、**1コマンドごとに** `%APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt` へ追記する（Microsoft のドキュメントで確認）。`password` / `token` / `apikey` / `secret` を含む行を除外する仕組みは入っているが（PSReadLine の `History.cs`）、**`BACKLOG_API_KEY` はどれにも当たらない** — `apikey` にアンダースコアが無いため。`.gitignore` が見ているのはリポジトリだけで、履歴ファイルは見ていない。

**守れるのは2経路だけ。** 「リポジトリが流出する」「env が覗かれる」。それ以上は主張しない。

> Windows ではファイルのパーミッションに頼れない。Node のドキュメントによれば `mkdir` の `mode` は **Not supported on Windows**、`chmod` は **書き込み可否しか変えられず、所有者 / グループ / その他の区別は無い**。だから分けるのは**置き場所**で行う。

### ポリシー

```json
{
  "projects": [
    "SALES",
    { "key": "PROJ", "can": "write" },
    { "key": "INFRA", "can": "comment", "toolsets": ["issue"] }
  ]
}
```

- `SALES` / `PROJ` / `INFRA` は**架空のプロジェクトキー**（Backlog 側に実在するもの。`PROJ-123` の接頭辞）。ポリシーの語彙ではない
- **文字列で書いたら `read`。** 細かくしたいときだけオブジェクトにする
- `can` は `read` < `comment` < `write` の単一値。**削除はこの語彙に存在しない**
- `toolsets` は `issue` / `wiki` / `document` / `git` / `activity`。省略すると全部。**語彙にある語はすべてツールを持つ**（持たない語は載せない — 書けるのに何も許可されないポリシーを作れなくするため）
- **`projects` は必須で、ワイルドカードは用意しない。** 対象は列挙する

未知の項目・未知の値・空の `projects`・解決できないプロジェクトキーは、いずれも**起動失敗**にする。タイポが黙って既定に落ちない。

### 接続例（Claude Code の `.mcp.json`）

```json
{
  "mcpServers": {
    "backlog": {
      "command": "node",
      "args": ["/path/to/backlog-mcp/src/main.ts"],
      "env": {
        "BACKLOG_SPACE_ID": "example",
        "BACKLOG_ENV_FILE": "${LOCALAPPDATA}/backlog-mcp/.env",
        "BACKLOG_ENV_KEYS_FILE": "${LOCALAPPDATA}/backlog-mcp/keys/.env.keys",
        "BACKLOG_POLICY": "/path/to/backlog-policy.json"
      }
    }
  }
}
```

`node` は **24.12 以降**が要る（`package.json` の `engines` を参照。型注釈除去が stable な版）。リポジトリを clone して使う場合は**ビルドが要らない** — Node が `.ts` を直接実行し、`src/libs/` は生成物ごとコミットしてあるので `npm ci` だけで動く。**配る場合は下記の tgz を使う。**

起動時に stderr へ接続先・展開したポリシー・書き込みを許可したプロジェクトを出す。

### 配る — `npm pack` した tgz を `npx` で使う

**配布物にはビルドが要る。** Node は **`node_modules` の下にある `.ts` を型注釈除去しない**（`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`。手元で確認）。`npx` で入れたパッケージは必ず `node_modules` に置かれるので、**`.ts` のままでは配れない**。

```bash
npm run dist    # build → pack → dist-package/ に一式を集める
```

`dist-package/` に4点そろう。**あとは手で zip して渡す**（Windows なら `Compress-Archive -Path dist-package\* -DestinationPath backlog-mcp-0.1.0.zip`）。

| 中身                          | 用途                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `backlog-mcp-<version>.tgz`   | 本体。`npx --package=` に渡す                        |
| `README.md`                   | これ                                                 |
| `.env.example`                | API キーのひな型。**暗号化の手順もここに書いてある** |
| `backlog-policy.example.json` | ポリシーのひな型                                     |

**圧縮までは自動化していない。** Node に zip が無く、クロスプラットフォームに書くと割に合わないため。集めるところだけ script にしてあるのは自動化のためではなく、**版がずれた一式を配らないため**（tgz の名前は `package.json` の版で決まるので、手で集めると古い tgz と新しい README が混ざる）。

**版を上げるときは `npm version patch` → `npm run check` → `npm run dist`。** 版の出所は `package.json` ひとつなので、これだけで tgz の名前・`initialize` が返す `serverInfo.version`・監査ログの3つが揃う。

受け取る側は `.mcp.json` からこう起動する。**tgz のパスは `--package=` で渡し、コマンド名を別に書く**（`npx <tgz>` だと npx が tgz を実行ファイルとして扱って失敗する）。

```json
{
  "mcpServers": {
    "backlog": {
      "command": "npx",
      "args": ["--yes", "--package=C:/share/backlog-mcp-0.1.0.tgz", "backlog-mcp"],
      "env": {
        "BACKLOG_SPACE_ID": "example",
        "BACKLOG_ENV_FILE": "${LOCALAPPDATA}/backlog-mcp/.env",
        "BACKLOG_ENV_KEYS_FILE": "${LOCALAPPDATA}/backlog-mcp/keys/.env.keys",
        "BACKLOG_POLICY": "C:/work/backlog-policy.json"
      }
    }
  }
}
```

**受け取る側も設定は自分で書く。** tgz に入るのは `dist/` だけで、**API キーもポリシーも含まれない**（`files` を `dist` に限ってある）。ポリシーを書かなければ起動しないので、「配ったら全開放」にはならない。

> **`package.json` の `private: true` は外していない。** `npm pack` はこれでも動く。外すと公開レジストリへ `npm publish` できてしまうので、**事故防止としてそのまま残す**。

### 初回の接続確認

`stdin` が閉じれば終了するので、JSON-RPC を流し込めばそのまま疎通確認になる。

```bash
npm ci
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize"}' \
              '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | BACKLOG_SPACE_ID=example \
    BACKLOG_ENV_FILE=~/.backlog-mcp/.env \
    BACKLOG_ENV_KEYS_FILE=~/.backlog-mcp/keys/.env.keys \
    BACKLOG_POLICY=./backlog-policy.json \
    node src/main.ts
```

**起動に失敗すれば exit 1 で、stdout には1バイトも出ない**（fail-closed）。理由は stderr に出て、`cause` まで辿って表示する。

> **`npm start` を作っていないのは意図的。** npm は `> backlog-mcp@0.1.0 start` のような行を **stdout** に出す。stdio トランスポートでは stdout が JSON-RPC の通信路そのものなので、それだけでクライアントとの接続が壊れる。起動は常に `node src/main.ts` を直接指す。

最初に転ぶとしたら `GET /projects` の応答の形。ポリシーのプロジェクトを1つでも解決できなければ `MasterDataError` で起動しない。

## 監査ログ

ツール呼び出しを1件1行の JSONL で記録する。**拒否も残す**（拒否こそ記録に値する）。**コメント本文は残さない** — 監査に要るのは「誰がどの資源に触ったか」で、本文まで落とすとログが第三者の書いたテキストの置き場になる。

残す識別子は `issueKey` / `projectKey` / `repository` / `number` / `file`。**`file` だけは扱いが違う** — 利用者が書いたパスであって第三者のテキストではなく、しかも**ローカルのファイルを外へ送り出す**操作を指す。監査の目的そのものなので、**拒否された場合も「何を送ろうとしたか」を残す**。

出力先は `<policy dir>/logs/audit-YYYY-MM-DD.jsonl`（`BACKLOG_LOG_DIR` で変更可。相対指定は**ポリシーファイルのディレクトリ**から解決する）。

- **ファイルと stderr の両方に出す。** MCP 仕様は「クライアントは stderr を capture / forward / **ignore** してよい」と定めているので、stderr だけを出口にすると残るかどうかがクライアント次第になる
- **書けなければ起動しない。** 監査に寄りかかった設計が監査なしで動くのは、防御について嘘をつくことになる
- **ローテーションも自動削除もしない。** 日付でファイルが分かれるだけ。古いログを消すのは運用の判断
- 同期書き込み（プロセスが落ちても直近の行を失わない）
- パーミッションは POSIX でのみ `0700` / `0600` を指定する。**Windows では効かない**（Node の `mkdir` の `mode` は Not supported on Windows、`chmod` は書き込み可否しか変えられない）。**保護として数えない** — 実際に効くのは置き場所のディレクトリ側

`/tmp` を既定にしていないのは、systemd の既定で**10日後に消える**（`tmpfiles.d/tmp.conf` の `q /tmp 1777 root root 10d`）ため。OS が定期的に消す場所に置いた監査ログは、監査ログとして機能しない。

## ツール

| ツール                      | `toolset` | 必要な `can` |
| --------------------------- | --------- | ------------ |
| `search_issues`             | issue     | read         |
| `get_issue`                 | issue     | read         |
| `get_issue_comments`        | issue     | read         |
| `add_issue_comment`         | issue     | comment      |
| `create_issue`              | issue     | write        |
| `update_issue`              | issue     | write        |
| `list_wiki_pages`           | wiki      | read         |
| `get_wiki_page`             | wiki      | read         |
| `list_git_repositories`     | git       | read         |
| `list_pull_requests`        | git       | read         |
| `get_pull_request`          | git       | read         |
| `get_pull_request_comments` | git       | read         |
| `add_pull_request_comment`  | git       | comment      |
| `search_documents`          | document  | read         |
| `list_project_activities`   | activity  | read         |

`tools/list` に載るのはポリシーが許可したものだけだが、**一覧に出さないことは防御ではない**（クライアントは任意の名前で `tools/call` できる）ので、ハンドラ側でも必ず確認する。

**行ごとのレビューコメントは作れない。** Backlog のプルリクエストコメント API のパラメータは `content` / `attachmentId[]` / `notifiedUserId[]` の3つだけで、ファイル名も行番号も position も無い（ミラーで確認）。1レビュー = 1コメントとして、本文に `src/main.ts:42` の形で参照を書く。

### 書き込みも名前で受ける

`POST /issues` の必須は `projectId` / `summary` / `issueTypeId` / `priorityId` で**すべて数値 ID**、`PATCH /issues/:issueIdOrKey` も同様。素直に作ると「数値 ID を LLM に触らせない」設計に反するので、**起動時にマスタを解決して名前で受ける**。

```
✗ create_issue(projectId: 101, issueTypeId: 1, priorityId: 2)
✓ create_issue(projectKey: "PROJ", issueType: "バグ", priority: "高")
```

**未知の名前は起動時マスタに無いので送出する。** 既定に落とさず、選べる名前をメッセージに挙げる（どれも Backlog の管理者が付けた名前で、第三者の自由記述ではない）。

**担当者の表示名は一意ではない。** ユーザーは `{ id, userId, name }` を持ち、`name` は表示名。**同名が2人いたら表示名では引けなくして、ログイン名（`userId`）で指すよう返す**。黙って先勝ちにすると別人に割り当てることになる。

**プロジェクト単位のマスタは、`can: "write"` を許したプロジェクトだけ引く。** 種別・状態・カテゴリー・バージョン・参加者の5本を、書き込み可能なプロジェクトごとに起動時に引く（read や comment しか無いプロジェクトでは1本も引かない）。

**載せていないもの**: `parentIssueId`（数値 ID しか受けない。親を指定するなら1往復増える）／`notifiedUserId[]`（LLM に通知先を決めさせない）。`categoryId[]` と `milestoneId[]` は**単数で受ける**（借り物がスカラーの配列を弾くため。引数が単数なので黙って減らされることはない）。

**`update_issue` は指定した項目だけ変える。** 何も指定しない更新は「成功したが何も変わっていない」になるので送出する。

### 添付は単独のツールにしない

`add_issue_comment` と `add_pull_request_comment` が任意で `file` を取る。**アップロード専用のツールは作らない。**

`attachmentId` が LLM の手に渡ると「上げたファイルを別プロジェクトの課題に貼る」経路ができるので、**サーバ内で上げてそのまま貼る**（数値 ID を LLM に触らせないのと同じ形）。1回のツール呼び出しが「読む → 上げる → 貼る」の3手になり、監査ログには**1件**として残る。

**`BACKLOG_ATTACHMENTS_ROOT` を設定しないと `file` を受け付けない。** 既定を置かないのは、置いた瞬間に「どこが読めるか」が暗黙になるため。MCP 仕様 2026-07-28 で `roots` が非推奨になり（SEP-2577）、クライアントから受け取る道も塞がれているので、設定で明示する以外に安全な決め方が無い。

検証は**順序に意味がある**。入れ替えると成立しない。

1. `realpath` で解決する（`path.resolve` は symlink を追わない）
2. ルート配下かを `path.relative` で判定する。**`startsWith` は使わない**（`/repo` と `/repo-evil` を取り違える）
3. 受け付ける拡張子に限る（テキスト: `.md` `.txt` `.csv` `.log` `.json` / バイナリ: `.png` `.jpg` `.jpeg` `.gif` `.pdf`）
4. **ハンドルを開き、以降はパスを再解決しない**（`stat` もマジックバイトもハンドル経由。TOCTOU）
5. 通常ファイルであること・サイズ上限（既定 10MiB）
6. 中身と拡張子を突き合わせる

> 同型の CVE がある: CVE-2025-53109 / 53110（`@modelcontextprotocol/server-filesystem`, High, CWE-59）。**prefix matching と symlink の両方**で踏まれているので、両方をテストで固定してある。

**テキストとバイナリで求めるものが逆になる。** バイナリはマジックバイトが拡張子と一致すること、テキストは**バイナリを示さないこと** + UTF-8 として読めること。`file-type` 22.0.2 で実機確認した（2026-09-05）— `.txt` `.md` `.csv` `.json` `.log` は空ファイル・BOM つき・HTML を入れても `undefined` が返る。**ただし中身が `<?xml` で始まると `xml` と判定される**ので、「判定不能だけを許す」と正当なテキストを弾く。許容する型として `xml` を名前で挙げてある。

**1コメントにつき1件まで。** 借り物の `ApiClient` はフォームのスカラー配列を `TypeError` で弾く（通るのはファイルの配列だけ）ので、複数を送るには上流を直す必要がある。引数が単数なので、利用者から見て「黙って減らされた」にはならない。

**通知（`GET /notifications`）はツールにしない。** 絞り込みパラメータが `minId` / `maxId` / `count` / `order` / `senderId` しか無く、スペース全体の自分宛て通知を返す。**プロジェクトで絞る手段が無いので、3軸で表現できない**（原則3）。`toolsets` の語彙からも外してある。

**ドキュメントは単体取得のツールを作っていない。** `GET /documents/:documentId` と一覧は応答の形が同じで、**一覧に本文（`plain`）が入っている**。Wiki と違って2往復が要らない。

**リポジトリ名はパスに載るので検証している。** 借り物の URL 組み立ては文字列連結で、正規化は URL パーサが行う。`..` を素通しすると `/projects/101/git/repositories/../../../../space/pullRequests` が `/api/v2/space/pullRequests` になり、**別のエンドポイントに到達する**（手元で確認）。`/` `\\` `?` `#` `%` と `.` `..` を弾き、残りは `encodeURIComponent` で載せる。

### 数値 ID を受け取るツールは作らない

Wiki の本文は `GET /wikis/:wikiId` にしか無く、**一覧は `content` を返さない**。とはいえ `wikiId` を引数に取るツールを作ると、スコープ外の Wiki に到達できてしまう（連番なので総当たりも効く）。

そこで `get_wiki_page` は `projectKey` と `name` だけを受け、**サーバ内で2往復する**。

1. ポリシー由来の `projectIdOrKey` で一覧を引く ← ここでスコープが確定する
2. 応答から名前が一致するページの `id` を取る ← `id` はサーバ内に留まる
3. `GET /wikis/:id` で本文を取り、`<untrusted>` で囲んで返す

2本目の `id` は「許可プロジェクトで絞った一覧の応答」からしか採らないので、**到達できる Wiki は定義上すべて許可プロジェクトのもの**。課題の作成で `issueTypeId` ではなく `issueType: "バグ"` を受けるのと同じ形で、**数値 ID を LLM に触らせない**。

課題の指定は**課題キー**（`PROJ-123`）のみ。数値の課題 ID は受け付けない（プロジェクトをローカルで判定できなくなるため）。検索対象のプロジェクトはポリシー由来の値で組み立てるので、引数では広げられない。

### 返す項目は API ドキュメントから決めている

`docs/reference/api/v2/` のミラー（応答例つき）を読んで決めた。**実データを見て決めたものではない。**

| 扱い             | 項目                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **名前で返す**   | `issueType` / `status` / `priority` / `resolution` / `assignee` / `category` / `milestone` / `versions` / `createdUser` / `updatedUser` |
| **そのまま返す** | `startDate` / `dueDate` / `estimatedHours` / `actualHours` / `created` / `updated`（連番 ID ではないので推測に使えない）                |
| **囲んで返す**   | `summary` / `description` / `childIssueSummary` / コメントの `content` と `changeLog` / Wiki の `content`（第三者が書ける）             |
| **畳む**         | `parentIssueId` → `hasParent` / `attachments` → `attachmentCount` / `customFields` → `customFieldCount`（後述）                         |
| **落とす**       | `id` / `projectId` / `keyId`（連番）、`sharedFiles` / `stars`（`stars[].presenter` はユーザーオブジェクトごと入る）                     |

件数と名前の配列は、**空なら項目ごと出さない**（`0` や `[]` を全課題に載せるとノイズになる）。無いことは「項目が無い」で表す。

**ユーザーオブジェクトは `name` しか出さない。** Backlog のユーザーは `id` / `userId` / `name` / `roleType` / `lang` / `nulabAccount` / `mailAddress` / `lastLoginTime` を持ち、`assignee` / `createdUser` / `updatedUser` / `stars[].presenter` / `notifications[].user` すべてが同じ形。**出力へ載せる経路を1つ（`pickName`）に限る**ことで担保していて、テストで固定してある。

### `customFields` は「値が入っている件数」だけ返す

**素の件数では意味を成さない。** `customFields` は**プロジェクトで定義されている属性を、値の有無に
かかわらず全部並べる**ので、配列の長さは定義数であり、どの課題でも同じ値になる。未設定は
`value: null`、リスト型の未選択は `[]`。**値が入っているものだけ数える**（0 なら項目ごと出さない）。

要素の形は**仕様書から決められなかった唯一の項目**だった（応答例8箇所すべてが `[]`）。実データで
確認済み（2026-09-06）。

```json
{
  "id": 692819,
  "fieldTypeId": 6,
  "name": "選択リスト",
  "value": [{ "id": 2, "name": "b", "displayOrder": 1 }]
}
```

**中身を返すかは別の判断として残している。** 属性名は要素の `name` に直接入っており、リスト型の値も
ID ではなく `{ id, name }` だった（仕様書の「リスト=値のID」は**送信側**の話で、応答には当てはまらない）。
**定義の起動時解決は要らない。** 返す段になったら、要素の `id` とリスト項目の `id` の両方を落とすこと。

## プロンプトインジェクションについて

課題・コメント・Wiki の本文は**第三者が書ける untrusted な入力**で、MCP サーバ側でインジェクションを防ぐことはできない。

このサーバが返す本文は `<untrusted>` で囲み、`instructions` とツール説明にも扱いを書いてあるが、**これは緩和であって防御ではない**。効くかどうかはクライアントとモデル次第で、保証にならない。**「対策済み」として数えないこと。**

実際に効くのは次の2つで、囲みは3つ目の気休めに当たる。

1. **ツール面を絞って被害の上限を下げる**（このサーバの設計そのもの）
2. **監査ログで検出可能にする**

## 開発

```bash
npm run check         # lint / format 検査 / typecheck / test / build
npm run verify:rules  # 規約 §8.1 の各要求が実際に効いているかを確かめる
```

`build` を `check` に束ねてあるのは規約 §8.3 の要求（**配布物を作るなら `build` も束ねる** — §8.1 には出力時にしか現れない要求がある）。実際、束ねる前は**`src/libs/` が dist に入らない**ことと**テストが dist に混ざる**ことに気づけなかった。**出力の中身はコマンドの合否に現れない**ので、配る前には `npm pack` して中身を見る。

`npm run check` が緑にならないうちは完了と扱わない。設定や依存を変えたら `verify:rules` も回す（**警告ゼロで通ることは「守られている」の証拠にならない**）。

`src/libs/` は `aokazaki-olp/libraries` の生成物。**ローカルで編集しない**（`tools/sync-libs.sh` で作り直す）。
