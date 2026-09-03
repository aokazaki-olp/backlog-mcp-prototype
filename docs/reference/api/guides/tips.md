---
title: Tips
slug: tips
source: "https://developer.nulab.com/ja/docs/backlog/tips/"
fetched: 2026-08-30
---

# Tips

## 使い方について

### リスト形式のパラメータを複数指定する

`activityTypeIds[]`など`[]`が付いているパラメータは、アクセス時に下記のような記述をすることで複数指定ができます。

`&activityTypeIds[]=111&activityTypeIds[]=222& ...`

### テキスト内でユーザーをメンションする

`content`、`description`、`comment`などのテキストには、下記の記法でメンションが付けられます。`notifiedUserId[]`に指定しなくても対象ユーザーに通知が届きます。

| 記法 | 対象 |
| --- | --- |
| `<@U{id}>` | ユーザー。`{id}`は[プロジェクトユーザー一覧の取得](../v2/get-project-user-list.md)で返る数値の`id`。 |
| `<@T{id}>` | チーム。`{id}`は[プロジェクトチーム一覧の取得](../v2/get-project-team-list.md)で返る数値の`id`。 |
| `<@project>` | プロジェクトのメンバー全員 |

- プロジェクトに参加していないユーザーには、通知は届きません。
- 存在しないIDを指定した場合は、メンションとして扱われず、通知も届きません。
