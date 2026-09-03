# Backlog API リファレンス（日本語版ミラー）

[developer.nulab.com](https://developer.nulab.com/ja/docs/backlog/) が公開している Backlog API v2 ドキュメントの日本語版を Markdown 化したもの。

- 取得日: 2026-08-30
- エンドポイント数: 152
- 機械可読な索引: [endpoints.json](endpoints.json)（method / path / パラメーター / 権限を抽出したもの）
- 一次情報は上記サイト。内容が食い違う場合は本ミラーではなく公式ドキュメントを正とする。
- 再生成: [`tools/backlog-docs/`](../../../tools/backlog-docs/README.md)（手書きしないこと。編集しても次の生成で上書きされる）

## ガイド

| ページ | 内容 |
| --- | --- |
| [Backlog API とは](guides/overview.md) | Backlog API の概要・できること・CORS・Webhook |
| [クイックスタート](guides/getting-started.md) | API キー発行から最初のリクエストを送るまでの手順 |
| [認証と認可](guides/auth.md) | API キー方式と OAuth 2.0 方式の認証・認可 |
| [レート制限](guides/rate-limit.md) | ユーザーあたりの 1 分間リクエスト数の制限と応答ヘッダ |
| [エラーレスポンス](guides/error-response.md) | エラー時のレスポンス形式とエラーコード一覧 |
| [Tips](guides/tips.md) | 配列パラメーターの指定方法など利用上のヒント |
| [ライブラリ](guides/libraries.md) | 公式・コミュニティ製の API ライブラリ一覧 |
| [変更履歴](guides/changelog.md) | API 仕様の変更履歴 |

## エンドポイント

### スペース (`/space`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/space` | [スペース情報の取得](v2/get-space.md) |
| `GET` | `/api/v2/space/activities` | [最近の更新の取得](v2/get-recent-updates.md) |
| `POST` | `/api/v2/space/attachment` | [添付ファイルの送信](v2/post-attachment-file.md) |
| `GET` | `/api/v2/space/diskUsage` | [スペースの容量使用状況の取得](v2/get-space-disk-usage.md) |
| `GET` | `/api/v2/space/image` | [スペースアイコン画像の取得](v2/get-space-logo.md) |
| `GET` | `/api/v2/space/licence` | [ライセンス情報の取得](v2/get-licence.md) |
| `GET` | `/api/v2/space/notification` | [スペースのお知らせの取得](v2/get-space-notification.md) |
| `PUT` | `/api/v2/space/notification` | [スペースのお知らせの更新](v2/update-space-notification.md) |

### アクティビティ (`/activities`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/activities/:activityId` | [アクティビティの取得](v2/get-activity.md) |

### レート制限 (`/rateLimit`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/rateLimit` | [レート制限情報の取得](v2/get-rate-limit.md) |

### ユーザー (`/users`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/users` | [ユーザー一覧の取得](v2/get-user-list.md) |
| `GET` | `/api/v2/users/:userId` | [ユーザー情報の取得](v2/get-user.md) |
| `GET` | `/api/v2/users/:userId/activities` | [ユーザーの最近の活動の取得](v2/get-user-recent-updates.md) |
| `GET` | `/api/v2/users/:userId/icon` | [ユーザーアイコンの取得](v2/get-user-icon.md) |
| `GET` | `/api/v2/users/:userId/stars` | [ユーザーの受け取ったスター一覧の取得](v2/get-received-star-list.md) |
| `GET` | `/api/v2/users/:userId/stars/count` | [ユーザーの受け取ったスターの数の取得](v2/count-user-received-stars.md) |
| `GET` | `/api/v2/users/:userId/watchings` | [ウォッチ一覧の取得](v2/get-watching-list.md) |
| `GET` | `/api/v2/users/:userId/watchings/count` | [ウォッチ数の取得](v2/count-watching.md) |
| `GET` | `/api/v2/users/myself` | [認証ユーザー情報の取得](v2/get-own-user.md) |
| `GET` | `/api/v2/users/myself/recentlyViewedIssues` | [自分が最近見た課題一覧の取得](v2/get-list-of-recently-viewed-issues.md) |
| `POST` | `/api/v2/users/myself/recentlyViewedIssues` | [自分が最近見た課題の追加](v2/add-recently-viewed-issue.md) |
| `GET` | `/api/v2/users/myself/recentlyViewedProjects` | [自分が最近見たプロジェクト一覧の取得](v2/get-list-of-recently-viewed-projects.md) |
| `GET` | `/api/v2/users/myself/recentlyViewedWikis` | [自分が最近見たWiki一覧の取得](v2/get-list-of-recently-viewed-wikis.md) |
| `POST` | `/api/v2/users/myself/recentlyViewedWikis` | [自分が最近見たWikiの追加](v2/add-recently-viewed-wiki.md) |

### チーム (`/teams`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/teams` | [チーム一覧の取得](v2/get-list-of-teams.md) |
| `GET` | `/api/v2/teams/:teamId` | [チーム情報の取得](v2/get-team.md) |
| `GET` | `/api/v2/teams/:teamId/icon` | [チームアイコンの取得](v2/get-team-icon.md) |

### プロジェクト (`/projects`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/projects` | [プロジェクト一覧の取得](v2/get-project-list.md) |
| `POST` | `/api/v2/projects` | [プロジェクトの追加](v2/add-project.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey` | [プロジェクトの削除](v2/delete-project.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey` | [プロジェクト情報の取得](v2/get-project.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey` | [プロジェクト情報の更新](v2/update-project.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/activities` | [プロジェクトの最近の活動の取得](v2/get-project-recent-updates.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/administrators` | [プロジェクト管理者の削除](v2/delete-project-administrator.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/administrators` | [プロジェクト管理者一覧の取得](v2/get-list-of-project-administrators.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/administrators` | [プロジェクト管理者の追加](v2/add-project-administrator.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/categories` | [カテゴリー一覧の取得](v2/get-category-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/categories` | [カテゴリーの追加](v2/add-category.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/categories/:id` | [カテゴリーの削除](v2/delete-category.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/categories/:id` | [カテゴリー情報の更新](v2/update-category.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/customFields` | [カスタム属性一覧の取得](v2/get-custom-field-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/customFields` | [カスタム属性の追加](v2/add-custom-field.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/customFields/:id` | [カスタム属性の削除](v2/delete-custom-field.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/customFields/:id` | [カスタム属性の更新](v2/update-custom-field.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/customFields/:id/items` | [選択リストカスタム属性のリスト項目の追加](v2/add-list-item-for-list-type-custom-field.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/customFields/:id/items/:itemId` | [選択リストカスタム属性のリスト項目の削除](v2/delete-list-item-for-list-type-custom-field.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/customFields/:id/items/:itemId` | [選択リストカスタム属性のリスト項目の更新](v2/update-list-item-for-list-type-custom-field.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/diskUsage` | [プロジェクトの容量使用状況の取得](v2/get-project-disk-usage.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/files/:sharedFileId` | [共有ファイルのダウンロード](v2/get-file.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/files/metadata/:path` | [共有ファイル一覧の取得](v2/get-list-of-shared-files.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/image` | [プロジェクトアイコンの取得](v2/get-project-icon.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/issueTypes` | [種別一覧の取得](v2/get-issue-type-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/issueTypes` | [種別の追加](v2/add-issue-type.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/issueTypes/:id` | [種別の削除](v2/delete-issue-type.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/issueTypes/:id` | [種別情報の更新](v2/update-issue-type.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/statuses` | [プロジェクトの状態一覧の取得](v2/get-status-list-of-project.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/statuses` | [状態の追加](v2/add-status.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/statuses/:id` | [状態の削除](v2/delete-status.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/statuses/:id` | [状態情報の更新](v2/update-status.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/statuses/updateDisplayOrder` | [状態の並び替え](v2/update-order-of-status.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/teams` | [プロジェクトチームの削除](v2/delete-project-team.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/teams` | [プロジェクトチーム一覧の取得](v2/get-project-team-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/teams` | [プロジェクトチームの追加](v2/add-project-team.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/users` | [プロジェクトユーザーの削除](v2/delete-project-user.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/users` | [プロジェクトユーザー一覧の取得](v2/get-project-user-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/users` | [プロジェクトユーザーの追加](v2/add-project-user.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/versions` | [バージョン(マイルストーン)一覧の取得](v2/get-version-milestone-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/versions` | [バージョン(マイルストーン)の追加](v2/add-version-milestone.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/versions/:id` | [バージョン(マイルストーン)の削除](v2/delete-version.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/versions/:id` | [バージョン(マイルストーン)情報の更新](v2/update-version-milestone.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/webhooks` | [Webhook一覧の取得](v2/get-list-of-webhooks.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/webhooks` | [Webhookの追加](v2/add-webhook.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/webhooks/:webhookId` | [Webhookの削除](v2/delete-webhook.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/webhooks/:webhookId` | [Webhookの取得](v2/get-webhook.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/webhooks/:webhookId` | [Webhookの更新](v2/update-webhook.md) |

### 課題 (`/issues`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/issues` | [課題一覧の取得](v2/get-issue-list.md) |
| `POST` | `/api/v2/issues` | [課題の追加](v2/add-issue.md) |
| `DELETE` | `/api/v2/issues/:issueIdOrKey` | [課題の削除](v2/delete-issue.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey` | [課題情報の取得](v2/get-issue.md) |
| `PATCH` | `/api/v2/issues/:issueIdOrKey` | [課題情報の更新](v2/update-issue.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/attachments` | [課題添付ファイル一覧の取得](v2/get-list-of-issue-attachments.md) |
| `DELETE` | `/api/v2/issues/:issueIdOrKey/attachments/:attachmentId` | [課題添付ファイルの削除](v2/delete-issue-attachment.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/attachments/:attachmentId` | [課題添付ファイルのダウンロード](v2/get-issue-attachment.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/comments` | [課題コメントの取得](v2/get-comment-list.md) |
| `POST` | `/api/v2/issues/:issueIdOrKey/comments` | [課題コメントの追加](v2/add-comment.md) |
| `DELETE` | `/api/v2/issues/:issueIdOrKey/comments/:commentId` | [課題コメントの削除](v2/delete-comment.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/comments/:commentId` | [課題コメント情報の取得](v2/get-comment.md) |
| `PATCH` | `/api/v2/issues/:issueIdOrKey/comments/:commentId` | [課題コメント情報の更新](v2/update-comment.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/comments/:commentId/notifications` | [課題コメントのお知らせ一覧の取得](v2/get-list-of-comment-notifications.md) |
| `POST` | `/api/v2/issues/:issueIdOrKey/comments/:commentId/notifications` | [課題コメントにお知らせを追加](v2/add-comment-notification.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/comments/count` | [課題コメント数の取得](v2/count-comment.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/participants` | [課題の参加者一覧の取得](v2/get-issue-participant-list.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/relatedIssues` | [関連課題一覧の取得](v2/get-list-of-related-issues.md) |
| `POST` | `/api/v2/issues/:issueIdOrKey/relatedIssues` | [関連課題の追加](v2/add-related-issue.md) |
| `DELETE` | `/api/v2/issues/:issueIdOrKey/relatedIssues/:relatedIssueId` | [関連課題の削除](v2/remove-related-issue.md) |
| `GET` | `/api/v2/issues/:issueIdOrKey/sharedFiles` | [課題共有ファイル一覧の取得](v2/get-list-of-linked-shared-files.md) |
| `POST` | `/api/v2/issues/:issueIdOrKey/sharedFiles` | [課題に共有ファイルをリンク](v2/link-shared-files-to-issue.md) |
| `DELETE` | `/api/v2/issues/:issueIdOrKey/sharedFiles/:id` | [課題の共有ファイルのリンクを解除](v2/remove-link-to-shared-file-from-issue.md) |
| `GET` | `/api/v2/issues/count` | [課題数の取得](v2/count-issue.md) |

### Wiki (`/wikis`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/wikis` | [Wikiページ一覧の取得](v2/get-wiki-page-list.md) |
| `POST` | `/api/v2/wikis` | [Wikiページの追加](v2/add-wiki-page.md) |
| `DELETE` | `/api/v2/wikis/:wikiId` | [Wikiページの削除](v2/delete-wiki-page.md) |
| `GET` | `/api/v2/wikis/:wikiId` | [Wikiページ情報の取得](v2/get-wiki-page.md) |
| `PATCH` | `/api/v2/wikis/:wikiId` | [Wikiページ情報の更新](v2/update-wiki-page.md) |
| `GET` | `/api/v2/wikis/:wikiId/attachments` | [Wiki添付ファイル一覧の取得](v2/get-list-of-wiki-attachments.md) |
| `POST` | `/api/v2/wikis/:wikiId/attachments` | [Wiki添付ファイルの追加](v2/attach-file-to-wiki.md) |
| `DELETE` | `/api/v2/wikis/:wikiId/attachments/:attachmentId` | [Wiki添付ファイルの削除](v2/remove-wiki-attachment.md) |
| `GET` | `/api/v2/wikis/:wikiId/attachments/:attachmentId` | [Wiki添付ファイルのダウンロード](v2/get-wiki-page-attachment.md) |
| `GET` | `/api/v2/wikis/:wikiId/history` | [Wikiページ更新履歴一覧の取得](v2/get-wiki-page-history.md) |
| `GET` | `/api/v2/wikis/:wikiId/sharedFiles` | [Wiki共有ファイル一覧の取得](v2/get-list-of-shared-files-on-wiki.md) |
| `POST` | `/api/v2/wikis/:wikiId/sharedFiles` | [Wikiに共有ファイルをリンク](v2/link-shared-files-to-wiki.md) |
| `DELETE` | `/api/v2/wikis/:wikiId/sharedFiles/:id` | [Wikiの共有ファイルのリンクを解除](v2/remove-link-to-shared-file-from-wiki.md) |
| `GET` | `/api/v2/wikis/:wikiId/stars` | [Wikiページのスター一覧の取得](v2/get-wiki-page-star.md) |
| `GET` | `/api/v2/wikis/count` | [Wikiページ数の取得](v2/count-wiki-page.md) |
| `GET` | `/api/v2/wikis/tags` | [Wikiページタグ一覧の取得](v2/get-wiki-page-tag-list.md) |

### ドキュメント (`/documents`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/documents` | [ドキュメント一覧の取得](v2/get-document-list.md) |
| `POST` | `/api/v2/documents` | [ドキュメントの追加](v2/add-document.md) |
| `DELETE` | `/api/v2/documents/:documentId` | [ドキュメントの削除](v2/delete-document.md) |
| `GET` | `/api/v2/documents/:documentId` | [ドキュメント情報の取得](v2/get-document.md) |
| `GET` | `/api/v2/documents/:documentId/attachments/:attachmentId` | [ドキュメント添付ファイルの取得](v2/get-document-attachments.md) |
| `GET` | `/api/v2/documents/:documentId/comments` | [ドキュメントコメントの取得](v2/get-document-comment.md) |
| `DELETE` | `/api/v2/documents/:documentId/tags` | [ドキュメントタグの削除](v2/remove-document-tag.md) |
| `POST` | `/api/v2/documents/:documentId/tags` | [ドキュメントタグの追加](v2/add-document-tag.md) |
| `GET` | `/api/v2/documents/count` | [ドキュメント数の取得](v2/count-document.md) |
| `GET` | `/api/v2/documents/tree` | [ドキュメントツリーの取得](v2/get-document-tree.md) |

### Git (`/git`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories` | [Gitリポジトリ一覧の取得](v2/get-list-of-git-repositories.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName` | [Gitリポジトリの取得](v2/get-git-repository.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests` | [プルリクエスト一覧の取得](v2/get-pull-request-list.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests` | [プルリクエストの追加](v2/add-pull-request.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number` | [プルリクエストの取得](v2/get-pull-request.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number` | [プルリクエストの更新](v2/update-pull-request.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/attachments` | [プルリクエスト添付ファイル一覧の取得](v2/get-list-of-pull-request-attachment.md) |
| `DELETE` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/attachments/:attachmentId` | [プルリクエスト添付ファイルの削除](v2/delete-pull-request-attachments.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/attachments/:attachmentId` | [プルリクエスト添付ファイルのダウンロード](v2/download-pull-request-attachment.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments` | [プルリクエストコメントの取得](v2/get-pull-request-comment.md) |
| `POST` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments` | [プルリクエストコメントの追加](v2/add-pull-request-comment.md) |
| `PATCH` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments/:commentId` | [プルリクエストコメント情報の更新](v2/update-pull-request-comment-information.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/:number/comments/count` | [プルリクエストコメント数の取得](v2/get-number-of-pull-request-comments.md) |
| `GET` | `/api/v2/projects/:projectIdOrKey/git/repositories/:repoIdOrName/pullRequests/count` | [プルリクエスト数の取得](v2/get-number-of-pull-requests.md) |

### お知らせ (`/notifications`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/notifications` | [お知らせ一覧の取得](v2/get-notification.md) |
| `POST` | `/api/v2/notifications/:id/markAsRead` | [お知らせの既読化](v2/read-notification.md) |
| `GET` | `/api/v2/notifications/count` | [お知らせ数の取得](v2/count-notification.md) |
| `POST` | `/api/v2/notifications/markAsRead` | [お知らせ数のリセット](v2/reset-unread-notification-count.md) |

### ウォッチ (`/watchings`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `POST` | `/api/v2/watchings` | [ウォッチの追加](v2/add-watching.md) |
| `DELETE` | `/api/v2/watchings/:watchingId` | [ウォッチの削除](v2/delete-watching.md) |
| `GET` | `/api/v2/watchings/:watchingId` | [ウォッチ情報の取得](v2/get-watching.md) |
| `PATCH` | `/api/v2/watchings/:watchingId` | [ウォッチの更新](v2/update-watching.md) |
| `POST` | `/api/v2/watchings/:watchingId/markAsRead` | [ウォッチの既読化](v2/mark-watching-as-read.md) |

### スター (`/stars`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `POST` | `/api/v2/stars` | [スターの追加](v2/add-star.md) |
| `DELETE` | `/api/v2/stars/:starId` | [スターの削除](v2/remove-star.md) |

### 優先度 (`/priorities`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/priorities` | [優先度一覧の取得](v2/get-priority-list.md) |

### 完了理由 (`/resolutions`)

| メソッド | パス | 概要 |
| --- | --- | --- |
| `GET` | `/api/v2/resolutions` | [完了理由一覧の取得](v2/get-resolution-list.md) |

## 原文側の既知の表記ゆれ・不備

公式ドキュメントの記述そのものに含まれる揺れ・誤記。ミラーは原文に忠実な変換を優先しており、これらを正規化していない。以下は生成時に実データから自動検出したもので、公式側が修正すれば次の再生成で消える。

### パラメーターの型表記

同じ意味の型が大文字小文字・語彙違いで混在している。`endpoints.json` の `parameters[].type` には原文の値をそのまま入れている。

| 型 | 件数 |
| --- | --- |
| `int` | 212 |
| `string` | 211 |
| `boolean` | 49 |
| `String` | 15 |
| `Number` | 4 |
| （記載なし） | 1 |
| `Boolean` | 1 |

型の記載が無いのは [post-attachment-file](v2/post-attachment-file.md)（原文の表が「パラメーター名 / 内容」の 2 列しかない）。

### 権限（role）の記述形式

「実行可能な権限」節の構造がページによって違う。

- 99 件: `すべての権限` `管理者` のような単一の値
- 52 件: 「**権限** … / **制限** …」の 2 段構成。`endpoints.json` の `role` には平坦化した文字列が入る
- 1 件: 「実行可能な権限」節そのものが無い（[get-issue-participant-list](v2/get-issue-participant-list.md)）

### 節見出しの表記ゆれ

同じ節が、空白の有無や括弧の全角半角違いで複数の書き方をされている。

| 表記 | ページ数 |
| --- | --- |
| URL パラメーター | 106 |
| URLパラメーター | 7 |
| カスタム属性を指定した検索 (テキスト属性) | 1 |
| カスタム属性を指定した検索（テキスト属性） | 1 |
| カスタム属性を指定した検索 (リスト属性) | 1 |
| カスタム属性を指定した検索（リスト属性） | 1 |
| カスタム属性を指定した検索 (数値属性) | 1 |
| カスタム属性を指定した検索（数値属性） | 1 |
| カスタム属性を指定した検索 (日付属性) | 1 |
| カスタム属性を指定した検索（日付属性） | 1 |

### 1 ページにしか出てこない節見出し

そのページ固有の正当な節も含むが、誤記も混じっている（「レスポンス例」であるべき箇所が「レスポンス名」になっている等）。

| 見出し | ページ |
| --- | --- |
| URL parameters | [get-activity](v2/get-activity.md) |
| レスポンス名 | [get-status-list-of-project](v2/get-status-list-of-project.md) |

### 個別ページの不備

| 対象 | 内容 |
| --- | --- |
| `get-group-icon` | 公式ドキュメント内から参照されているが、ページ自体が存在しない（404） |
| [get-issue-participant-list](v2/get-issue-participant-list.md) | 原文の見出しレベルが 1 段ずれている（変換時に繰り上げ済み） |
| [get-list-of-git-repositories](v2/get-list-of-git-repositories.md) | コードブロックの中に見出し記法 `### レスポンスボディ` が混入している |
| [get-notification](v2/get-notification.md) | コードブロックの中に見出し記法 `### レスポンスボディ` が混入している |
