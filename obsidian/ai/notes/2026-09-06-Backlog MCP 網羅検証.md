---
title: Backlog MCP 網羅検証
date: 2026-09-06
tags:
  - backlog-mcp
  - 検証
aliases:
  - MCP ツール網羅検証
---

# Backlog MCP 網羅検証

「ユーザーがプロジェクト内で AI を使ってやりたいこと・やれること」をエッジケース込みで網羅的にシナリオ化し、実 Backlog スペースで叩いた結果。API 仕様（152エンドポイント）との突き合わせによる**欲しいのに無いもの**も含む。

経緯は [[2026-09-06]] の日次ログにある。

> [!info] 検証環境
> - スペース: `nlabsdbx.backlog.com`（試用、期間限定）
> - プロジェクト: `SALES`（課題16件・Git リポジトリ `sandbox`・PR 2件・ドキュメント4件）
> - ポリシー: `can: write` / `toolsets: ["issue","git","document","activity"]`
> - 鍵: 一般ユーザー「てすと」（`roleType: 2` 制限なし）
> - 経路: **実 MCP クライアント**（`mcp__backlog__*`）。本番と同じ
> - 基準: `fe51cb8`（ツール19本）

---

## 1. 検証した全件

### 1.1 読み取り系

| # | 試したこと | 結果 |
|---|---|---|
| R-1 | `search_issues` 引数なし | 16件（本文込みで数万文字） |
| R-2 | `count=14`（ちょうど全件） | 14件・`truncated` なし。**誤検知なし** |
| R-3 | `count=13`（1件不足） | `truncated: true` + `note` |
| R-4 | `count=5` / `count=1` | 打ち切り明示 |
| R-5 | `keyword` ヒットなし | `{"items": []}` |
| R-6 | `keyword=""`（空文字） | エラーにならず全件扱い |
| R-7 | `keyword="マイルストーン"` | SALES-11 のみ |
| R-8 | `get_issue` 正常 | 全キー確認。数値 ID なし |
| R-9 | `get_issue_comments`（コメント0件） | `{"items": []}` |
| R-10 | `list_git_repositories` | `sandbox`。`pushedAt` 反映 |
| R-11 | `list_pull_requests` | PR 2件 |
| R-12 | `get_pull_request` | `base` / `branch` / `relatedIssueKey` |
| R-13 | `get_pull_request_comments` | 投稿分を読み戻し |
| R-14 | `search_documents` | 本文まで全文（切り詰めなし） |
| R-15 | `list_project_activities` | `activityTypeId` は数値のまま |
| R-16 | `list_project_masters` | 数値 ID なしで全マスタ |

### 1.2 検索の絞り込み（`fe51cb8` で追加された14引数）

| # | 試したこと | 結果 |
|---|---|---|
| F-1 | `status="完了"` | 1件だけ |
| F-2 | `projectKey` なしで `status` 指定 | **理由つきで拒否**「状態や種別の名前はプロジェクトごとに違うため」 |
| F-3 | `assignedToMe: true` | 鍵の持ち主の課題だけ |
| F-4 | `noDueDate: true` | 期限なしの2件のみ |
| F-5 | `dueDateSince/Until`（09-10〜09-11） | 4件のみ |
| F-6 | `issueType` + `priority` の併用 | 効く |
| F-7 | `sort=dueDate` × `order=asc` | 効く |
| F-8 | `sort=created` × `order=desc` | 効く |
| F-9 | `sort=summary` × `order=asc` | 効く |
| F-10 | `offset=12` | 13件目以降。**21件目以降にも到達できるようになった** |
| F-11 | `category="会場手配"`（定義が空） | 「このプロジェクトには定義がありません」 |
| F-12 | 絞り込み + `truncated` の併用 | 正しく出る |

### 1.3 書き込み系

| # | 試したこと | 結果 |
|---|---|---|
| W-1 | `create_issue` 正常 | SALES-13 / SALES-14 作成 |
| W-2 | `create_issue` + 添付 | `attachmentCount: 1` |
| W-3 | `update_issue`（状態・優先度・コメント同時） | `changeLog` に2項目まとめて |
| W-4 | `update_issue`（状態「完了」+ 完了理由） | 同時設定可 |
| W-5 | `update_issue`（ログイン名で担当者） | `*hKXgXDllj6` で解決 |
| W-6 | `add_issue_comment` | 投稿・読み戻し |
| W-7 | `create_pull_request` | PR #2 作成。`relatedIssueKey` は課題キーのまま |
| W-8 | `update_pull_request` | 件名変更＋コメント |
| W-9 | `add_pull_request_comment` | `attached: false` を明示 |
| W-10 | `create_document` | 作成（**更新 API が無いので後から直せない**） |

### 1.4 エッジケース

| # | 確かめたこと | 結果 |
|---|---|---|
| E-1 | `SALES-9999`（存在しない課題） | Backlog のエラーを `<untrusted>` で囲んで返す |
| E-2 | `sales-1`（小文字） | 拒否。**ただし文言が「数値 ID」で実態と合わない**（後に `fe51cb8` で改善） |
| E-3 | `12345`（数値 ID） | 拒否 |
| E-4 | `OTHER-1`（スコープ外） | **API 到達前**に拒否 |
| E-5 | `SALES2`（`SALES` の接頭辞） | 拒否。**前方一致の取り違えなし** |
| E-6 | `delete_issue`（存在しないツール名） | 拒否 |
| E-7 | `get_wiki_page`（ポリシー外の toolset） | 一覧に出ず、直接呼んでも拒否 |
| E-8 | `projectId: [999]` の注入 | **無視され正しい結果** |
| E-9 | `count=0` / `count=100` | 前者は拒否、後者は上限20へ切り下げ |
| E-10 | 変更項目なしの `update_issue` | 「1つ以上指定してください」。**黙って成功にしない** |
| E-11 | `dueDate="2026/09/30"` | ローカルで拒否（`yyyy-MM-dd` 要求） |
| E-12 | `dueDate="2026-13-45"`（形式は正・日付は不正） | **Backlog が `error.date` で拒否** |
| E-13 | 存在しない `issueType` / `status` / カテゴリー | **候補を列挙して**拒否。API 到達前 |
| E-14 | `repository="../../../space"` | サーバ側で拒否（`/ \ ? # %` と `.` `..` 不可） |
| E-15 | `branch="../../../etc/passwd"` | Backlog が `branch.notFound` |
| E-16 | 存在しない PR 番号 / リポジトリ | 囲んで返す |

### 1.5 プロンプトインジェクションと囲み

| # | 確かめたこと | 結果 |
|---|---|---|
| P-1 | コメント本文に `IGNORE ALL PREVIOUS INSTRUCTIONS` | `<untrusted>` の内側に収まる |
| P-2 | 本文に裸の `</untrusted>` | **nonce があるので抜けられない** |
| P-3 | ドキュメントのタイトルに `" onload="alert(1)"` | `source` 属性で `_` に落ちる |
| P-4 | タイトルに改行 + `</untrusted>` | 1行に収まる |
| P-5 | 200文字超のタイトル | 60文字で切って `…`。**項目名（`:title`）は残る** |
| P-6 | 日本語のタイトル | **読める形のまま**（`\p{L}` に漢字・かなが含まれる） |

### 1.6 添付ファイル

| # | 確かめたこと | 結果 |
|---|---|---|
| A-1 | 通常の `.md` | 添付成功 |
| A-2 | `../../../etc/passwd` | 拒否 |
| A-3 | 絶対パス `/etc/hostname` | 拒否 |
| A-4 | **symlink → `/etc/passwd`** | 拒否。`realpath` で追ってから判定 |
| A-5 | `.env.2`（暗号文） | 拒否（拡張子 allowlist） |
| A-6 | `backlog-policy.json`（設定ファイル本体） | 拒否 |
| A-7 | **別名の複製**（内容同一） | 拒否（内容照合） |
| A-8 | `logs/probe.log`（出力先ディレクトリ配下） | 拒否（**拡張子でなくディレクトリ封じ込め**） |
| A-9 | 監査ログを `logs/` の外へ `.log` でコピー | **通る**（下記の抜け道） |
| A-10 | `BACKLOG_ATTACHMENTS_ROOT` 未設定 | 口ごと開かない（fail-closed） |

### 1.7 権限（`roleType`）

同じ鍵の権限を段階的に変えて実測。

| | 1 管理者 | 2 制限なし | 3 課題の登録のみ | 4 課題の閲覧のみ |
|---|---|---|---|---|
| 起動（マスタ解決） | OK | OK | OK | OK |
| 読み取り3本 | OK | OK | OK | OK |
| `add_issue_comment` | OK | OK | OK | **拒否** |
| Git 系4本 | OK | OK | — | **全部拒否** |

ヘルプセンターの権限表と**完全に一致**した。

### 1.8 子課題（`fe51cb8` の修正確認）

SALES-4 → SALES-15 → SALES-16 の3階層で実測。

| 課題 | `hasParent` | `childIssues` | 位置 |
|---|---|---|---|
| SALES-13 / 14 | false | **項目なし** | 階層外 |
| SALES-15 | true | `{total:1, closed:0}` | **中間**（親も子もいる） |
| SALES-16 | true | 項目なし | 末端 |

`total: 0` の課題では項目ごと消える。囲みも外れている（数値2つなので正しい）。

---

## 2. 欲しいのに無いもの

> [!warning] 上位3件は `fe51cb8` で解消済み
> 検索の絞り込み・マスタ一覧・`childIssueSummary` は実装された。以下は**残っているもの**。

### 2.1 PR の差分・コミットが読めない ⭐

`GET .../pullRequests/:number` で分かるのは `base` / `branch` / `summary` / `description` とコメントだけ。**実際のコードが読めない。**

「PR #2 をレビューして」と言われても、レビューできるのは説明文と既存コメントのみ。ローカルに clone がある前提で Bash と併用するしかない。

Backlog API に diff / commit 一覧のエンドポイントが**そもそも無い**（152本を確認）。**API 側の制約**であってサーバの欠落ではない。

### 2.2 添付ファイルをダウンロードできない ⭐

上げられるのに下ろせない。`GET /issues/:key/attachments` → `.../attachments/:attachmentId` は API にあるがツールが無い。

一覧は `{ id, name, size }` を返すので、**ファイル名で指定して chain で到達できる**（`get_wiki_page` と同じ形）。数値 ID を LLM に渡す必要はない。

エラーログ・スクリーンショット・仕様書を添付で渡す運用で、AI が肝心の材料を読めない。

> [!question] 判断が要る
> 外部バイト列を LLM のコンテキストへ流し込む新しい経路になる。`<untrusted>` の設計（現状テキストのみ）を拡張する判断が必要。

### 2.3 カスタム属性の値が読めない ⭐

`customFieldCount: 5` としか出ない。要素の形は実データで解明済み。

```json
{ "id": 692819, "fieldTypeId": 6, "name": "選択リスト",
  "value": [{ "id": 2, "name": "b", "displayOrder": 1 }] }
```

**属性名は要素の `name` に直接入っており、リスト型の値も ID ではなくオブジェクト。** 定義の起動時解決は要らない。返す段で要素の `id` とリスト項目の `id` を落とすだけ。

顧客名・環境・重要度をカスタム属性で管理しているプロジェクトでは、**業務上いちばん重要な情報が見えない**。

### 2.4 `truncated` が「あと何件か」を言わない

残り1件なのか500件なのか分からない。`GET /issues/count` は `GET /issues` と**同じ絞り込みパラメータ一式**を取る（実測で `{"count":12}` を確認済み）。

`PlannedCall` に「2本投げて合成する」形が無いのが障害。`chain`（応答から次を決める）とは別の構造が要る。

### 2.5 関連課題・子課題の一覧が読めない

`childIssues` で件数は分かるようになったが、**どの課題が子なのかは分からない**。`GET /issues/:key/relatedIssues` もツールが無い。

依存関係グラフを辿れない。「この課題をブロックしているのは何か」が答えられない。

### 2.6 Wiki の `can: "write"` が空振りする

`TOOLSETS` に `wiki`、`CAN_LEVELS` に `write` があるが、Wiki のツールは2本ともに `requires: 'read'`。

**`{ toolsets: ["wiki"], can: "write" }` は `read` と完全に同じ集合になる。**

`notification` を語彙から削除した判断（「書けるのに何も許可されないポリシーを作れなくする」）と**同型の問題が `can` の軸で残っている**。

`POST /wikis` は `projectId` を取るので `filter` で表現でき、`PATCH /wikis/:wikiId` は `get_wiki_page` と同じ `chain` で到達できる。

> [!note] Backlog にドキュメントの更新 API が無い
> 「AI が書いた文書を後から直す」経路がスペース全体で存在しない。Wiki は `PATCH` を持っているので、ここを埋めると解消する。

### 2.7 コメントを訂正できない

`PATCH /issues/:key/comments/:commentId` はあるが、出力から `id` を落としているのでコメントを特定できない。誤った内容をコメントしたら**訂正を重ねるしかない**。

`commentId` を LLM に渡さずに指す方法が自明でない（時刻？ n番目？）ので設計判断が要る。

### 2.8 一括更新が無い

10件の状態を変えるには `update_issue` を10回呼ぶ。監査ログも10行。

### 2.9 子課題を作れない

`create_issue` に `parentIssueId` の口が無い。「この課題を3つに分解して」ができない。

### 2.10 PR をマージ・クローズできない

`PATCH .../pullRequests/:number` のパラメータに `status` が無い。**Backlog API 全体に存在しない**（152本を確認）ので API 側の制約。

---

## 3. 見つけた問題

### 3.1 `assignees` に同じ人が2回出る（未修正）

```json
"assignees": ["*hKXgXDllj6", "てすと", "岡崎 有寛"]
```

`*hKXgXDllj6` と `てすと` は**同一人物**。実際は2人だが3件並ぶ。

`ProjectMasters.userIds` が表示名とログイン名の**両方をキーに持つ引き当て表**で、`src/tool/tools.ts:1335` がそのキーをそのまま並べているのが原因。

指定する側はどちらでも通るので実害は無いが、**LLM が人数を数えると3人に見える**。

> [!tip] 直し方の案
> 引き当て表（`userIds`）はそのまま残し、**一覧用に「1人1件」の正本リストを別に持つ**。表示名が一意ならその表示名、同名がいて指せないならログイン名を採る。

### 3.2 監査ログのコピーは添付できる（未修正・実害小）

`logs/` の外に `.log` 拡張子でコピーすると通る。設定ファイル側は「中身が同じなら拒否」まで見ているので、**ログ側とで基準が揃っていない**。

ただし監査ログの中身は `ts` / `event` / `tool` / `ok` / `ms` / 引数の**キー名** / `issueKey` で、秘密もコメント本文も入らない。内容比較まで広げるとログが増えるたびに読み直すことになるので、**現状のままが妥当とも言える**。

### 3.3 囲みの固定文言が短い項目を12倍にする

```
囲みの固定部分  168文字
件名の実体       15文字   → 12.2倍
14件×2フィールドの固定部分だけで 4,704文字（本文の実体合計は 7,969文字）
```

設計の帰結であって欠陥ではないが、**「AI に一覧を見せて判断させる」用途で効いてくる**。

対処するなら囲みを弱めるのではなく、**一覧で本文を返さない選択肢**（件名だけモード）のほうが筋がよさそう。絞り込みが入った後の実データで測り直してから判断するのが順当。

### 3.4 `.mcp.json` の env はクライアントがキャッシュする

MCP ツールでの再起動では反映されず、**VS Code の再起動が要る**。`/proc/<pid>/environ` を見るまで原因に辿り着けなかった。

サーバの問題ではないが、実運用で「設定を直したのに効かない」という形で必ず踏む。

---

## 4. 意図的に落ちていて妥当なもの

`DESIGN.md` の原則と一致しており、再検討は不要と判断。

- **削除系すべて**（22本）— `CAN_LEVELS` に `delete` が無い以上、ポリシーにどう書いても表現できない
- **スペース直下のエンドポイント**（`GET /space` 系・`GET /users` 系・`GET /teams` 系）— プロジェクトで絞れない
- **`GET /notifications` 系** — 同上。語彙から外した経緯がコードに残っている
- **`POST /stars`** — 数値 ID しか受けない
- **`notifiedUserId[]`** — 「LLM に通知先を決めさせない」
- **`list_project_activities` の `activityTypeId[]`** — 対応表が一次情報に存在せず、名前で受けられない
- **`get_issue` の `expand[]`** — **Backlog が受け付けないと実測で確定**。単体取得に子課題の件数を足す手段は存在しない

---

## 5. 未確認のまま残るもの

| 項目 | 要るもの |
|---|---|
| `list_wiki_pages` / `get_wiki_page` | **Wiki が使えるスペース**（このスペースは 2026-07-14 以降作成のため提供対象外） |
| 4000字超の本文の打ち切り | 4000字を超える課題本文（最長は SALES-7 の1121字） |
| 同名ユーザーの曖昧性（`ambiguousUserNames`） | 同じ表示名のユーザーをもう1人 |
| スペースID のハイフン位置 | 記載のある一次情報（未発見。DNS が構造的に禁じるので実害なし） |

---

## 6. 試用スペースに残したもの

**このサーバに削除ツールが無いので、UI からしか消せない。**

- 課題 SALES-13 / SALES-14（検証で作成・更新）
- SALES-1 / SALES-2 / SALES-13 / SALES-14 の検証コメント
- PR #1（コメント3件）/ PR #2
- Git ブランチ `main` / `feature/pr-check` / `feature/pr-tools`
- ドキュメント3件（`"` 入り・改行入り・長いタイトル）
