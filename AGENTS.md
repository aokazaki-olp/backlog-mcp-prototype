# Agent Directives

- すべてのユーザー向け出力を日本語で書くこと。
- Always respond in Japanese（日本語）.

## 調べ物の作法（裏取り）

外部の仕様・API・バージョンを扱うときは、**記憶で答えず裏を取る**。「知っている」と思った時点で適用する。**作法は `research-workflow` スキルに従う**。

このプロジェクトは環境差を避けて hook を使わない方針であり、**統制は作法でしか持たせられない**。

### 一次情報源

| 対象               | 参照先                    |
| ------------------ | ------------------------- |
| Backlog API        | `developer.nulab.com`     |
| MCP                | `modelcontextprotocol.io` |
| Claude API・モデル | [[claude-api]] スキル     |

---

## コーディング規約

@CODING_RULES.md

### 完了報告の前に `npm run check` を通す

規約 §8.3 が要求する束ねたコマンド。`lint` / `format`（検査モード）/ `typecheck` / `test` を1本で回す。

```bash
npm run check
```

**これが緑にならないうちは完了と報告しない。** ローカルと CI で同じものを実行する。

固定したバージョンとその理由は `VERSIONS.md` にある。Node は型注釈除去が stable な版（24.12 / 25.2 以降）が必要。

### 設定や依存を変えたら `npm run verify:rules` を回す

```bash
npm run verify:rules
```

規約 §8.1 の各要求について、**違反コードを1件書いて落ちることを確かめる**（通すための土台は通ることを、対象範囲は範囲の端で入る／入らないを確かめる）。

**警告ゼロで `npm run check` が通ることは「守られている」の証拠にならない** — ルールを緩めても同じく緑になるため。実際、導入時にこの検証で次の2つを検出している。

- `eslint-config-prettier` が `curly` と `max-statements-per-line` を無効化していた（§8.1 は lint 側でも塞ぐことを要求している）
- 別のルールがたまたま拾っていたせいで、プローブが偽陽性になっていた

### 借り物・生成物は検査範囲の外にある

規約 §8.3 の範囲の切り方に従い、次は `lint` / `format` の対象から外してある（`.prettierignore` / `eslint.config.js`）。**抑制コメントで対処しない。同期や再生成で上書きされるため。**

| 対象                                | 正本                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `CODING_RULES.md`                   | `aokazaki-olp/coding-rules`                                              |
| `.agents/skills/` `.claude/skills/` | 別リポジトリ                                                             |
| `docs/reference/`                   | 生成物（`tools/backlog-docs/`）                                          |
| `src/libs/`                         | `aokazaki-olp/libraries`（**ローカル編集禁止**。`SOURCE.md` に版を記録） |

## スキル

### 配置

- **`.agents/skills/` が正本、`.claude/skills/` が副本**。両者は常に一致させる（`diff -r .agents/skills .claude/skills` で差分ゼロ）。
- スキルを追加・更新するときは正本を編集し、副本へ反映する。副本だけを直さない。
- **副本はシンボリックリンクではなくコピーにする**。シンボリックリンクは Windows と Linux / macOS で挙動が異なるため。

### 作業ログ

作業の節目ごとに、経緯を日次ログへ追記する。ユーザーの依頼を待たず自発的に行う。**発火条件と記録内容は `activity-log` スキルに従う**。

### Obsidian vault の読み書き

Obsidian vault へノート／ログを読み書きする前に、**必ず `obsidian-config` を先に適用**し、vault パス・保存先フォルダ・ファイル名・タイムゾーンを解決する。

記法や `.base` / `.canvas` の構文は各操作スキルに従い、**保存先とファイル名は `obsidian-config` に従う**。操作スキル側は `obsidian-config` を参照しないため、呼び出す側がこの順序を守ること。
