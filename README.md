# backlog-mcp

Backlog を Claude Code / Claude Desktop から扱う MCP サーバ。**インハウス利用・非公開**。

## これは何のためにあるか

公式の [`nulab/backlog-mcp-server`](https://github.com/nulab/backlog-mcp-server) は既にある。約50ツールを持つが、read-only モードもプロジェクト allowlist も無い。

**このサーバの存在理由は機能追加ではない。** Backlog の API キーは発行ユーザーの全権限で届き、Backlog 側に「このプロジェクトだけ」を表現する手段はユーザーの権限設定しかない。

> **このサーバの役割は、Backlog が提供していないスコープ層を補うこと。**

したがって、ツールは少ない方が正しい。削除系のツールは作らない（ポリシーにどう書いても表現できない）。

## 設定

**秘密は環境変数、構造はファイル。**

| 環境変数            | 必須 | 内容                                                     |
| ------------------- | :--: | -------------------------------------------------------- |
| `BACKLOG_SPACE_ID`  |  ✔   | スペースID **だけ**。URL は受け取らない                  |
| `BACKLOG_API_KEY`   |  ✔   | Backlog の API キー                                      |
| `BACKLOG_POLICY`    |  ✔   | ポリシーファイルのパス                                   |
| `BACKLOG_DOMAIN`    |      | `backlog.jp`（既定）/ `backlog.com` / `backlogtool.com`  |
| `BACKLOG_READ_ONLY` |      | `1` または `true` で全プロジェクトを `read` に切り下げる |

URL ではなくスペースID を受けるのは、`https` 以外のスキーム・任意ホスト・パス注入を**設定として表現できなくする**ため。接続先は `https://{spaceId}.{domain}` としてサーバ側で組み立てる。

### ポリシー

```json
{
  "projects": [
    "DOCS",
    { "key": "PROJ", "can": "write" },
    { "key": "INFRA", "can": "comment", "toolsets": ["issue"] }
  ]
}
```

- **文字列で書いたら `read`。** 細かくしたいときだけオブジェクトにする
- `can` は `read` < `comment` < `write` の単一値。**削除はこの語彙に存在しない**
- `toolsets` は `issue` / `wiki` / `document` / `git` / `notification` / `activity`。省略すると全部
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
        "BACKLOG_API_KEY": "xxxxxxxx",
        "BACKLOG_POLICY": "/path/to/backlog-policy.json"
      }
    }
  }
}
```

`node` は **24.12 以降**が要る（`package.json` の `engines` を参照。型注釈除去が stable な版）。

起動時に stderr へ接続先・展開したポリシー・書き込みを許可したプロジェクトを出す。ツール呼び出しは JSONL で stderr に記録する（拒否も残す。コメント本文は残さない）。

## ツール

| ツール               | 必要な `can` |
| -------------------- | ------------ |
| `search_issues`      | read         |
| `get_issue`          | read         |
| `get_issue_comments` | read         |
| `list_wiki_pages`    | read         |
| `add_issue_comment`  | comment      |

`tools/list` に載るのはポリシーが許可したものだけだが、**一覧に出さないことは防御ではない**（クライアントは任意の名前で `tools/call` できる）ので、ハンドラ側でも必ず確認する。

課題の指定は**課題キー**（`PROJ-123`）のみ。数値の課題 ID は受け付けない（プロジェクトをローカルで判定できなくなるため）。検索対象のプロジェクトはポリシー由来の値で組み立てるので、引数では広げられない。

## プロンプトインジェクションについて

課題・コメント・Wiki の本文は**第三者が書ける untrusted な入力**で、MCP サーバ側でインジェクションを防ぐことはできない。

このサーバが返す本文は `<untrusted>` で囲み、`instructions` とツール説明にも扱いを書いてあるが、**これは緩和であって防御ではない**。効くかどうかはクライアントとモデル次第で、保証にならない。**「対策済み」として数えないこと。**

実際に効くのは次の2つで、囲みは3つ目の気休めに当たる。

1. **ツール面を絞って被害の上限を下げる**（このサーバの設計そのもの）
2. **監査ログで検出可能にする**

## 開発

```bash
npm run check         # lint / format 検査 / typecheck / test
npm run verify:rules  # 規約 §8.1 の各要求が実際に効いているかを確かめる
```

`npm run check` が緑にならないうちは完了と扱わない。設定や依存を変えたら `verify:rules` も回す（**警告ゼロで通ることは「守られている」の証拠にならない**）。

`src/libs/` は `aokazaki-olp/libraries` の生成物。**ローカルで編集しない**（`tools/sync-libs.sh` で作り直す）。
