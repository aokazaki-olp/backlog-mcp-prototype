# MCP 仕様リファレンス（ミラー）

[modelcontextprotocol.io](https://modelcontextprotocol.io) が公開している Model Context Protocol の仕様・ガイド・拡張仕様を Markdown 化したもの。

- 取得日: 2026-09-06
- 対象の版: `2025-06-18`、`2025-11-25`、`2026-07-28`（`2026-07-28` が最新リリース版。`/specification` はここへ転送される）
- ページ数: 137
- 機械可読な索引: [pages.json](pages.json)
- 一次情報は上記サイト。内容が食い違う場合は本ミラーではなく公式ドキュメントを正とする。
- 再生成: [`tools/mcp-docs/`](../../../tools/mcp-docs/README.md)（手書きしないこと。編集しても次の生成で上書きされる）

この 3 版を選んでいるのは、本リポジトリの [`src/mcp/protocol.ts`](../../../src/mcp/protocol.ts) がこの 3 つを対応版として宣言しているため。

## スキーマ

仕様書が authoritative と呼んでいるのは TypeScript スキーマの方。サイトの `schema` ページはそれを typedoc で描画したものなので、実体はリポジトリから取って併置している。

取得元: [`https://github.com/modelcontextprotocol/modelcontextprotocol`](https://github.com/modelcontextprotocol/modelcontextprotocol/tree/e76e9c572c6f2bfcb730357101acc90f2f802e02/schema)（commit `e76e9c572c6f`）

| 版 | TypeScript | JSON Schema | 描画版 |
| --- | --- | --- | --- |
| `2025-06-18` | [schema.ts](schema/2025-06-18/schema.ts) | [schema.json](schema/2025-06-18/schema.json) | [schema.md](specification/2025-06-18/schema.md) |
| `2025-11-25` | [schema.ts](schema/2025-11-25/schema.ts) | [schema.json](schema/2025-11-25/schema.json) | [schema.md](specification/2025-11-25/schema.md) |
| `2026-07-28` | [schema.ts](schema/2026-07-28/schema.ts) | [schema.json](schema/2026-07-28/schema.json) | [schema.md](specification/2026-07-28/schema.md) |

## 仕様（74 ページ）

### `2025-06-18`

| ページ | 内容 |
| --- | --- |
| [Architecture](specification/2025-06-18/architecture.md) | The Model Context Protocol (MCP) follows a client-host-server architecture wh… |
| [Overview](specification/2025-06-18/basic.md) | The Model Context Protocol consists of several key components that work toget… |
| [Authorization](specification/2025-06-18/basic/authorization.md) | The Model Context Protocol provides authorization capabilities at the transpo… |
| [Lifecycle](specification/2025-06-18/basic/lifecycle.md) | The Model Context Protocol (MCP) defines a rigorous lifecycle for client-serv… |
| [Transports](specification/2025-06-18/basic/transports.md) | MCP uses JSON-RPC to encode messages. JSON-RPC messages MUST be UTF-8 encoded. |
| [Cancellation](specification/2025-06-18/basic/utilities/cancellation.md) | The Model Context Protocol (MCP) supports optional cancellation of in-progres… |
| [Ping](specification/2025-06-18/basic/utilities/ping.md) | The Model Context Protocol includes an optional ping mechanism that allows ei… |
| [Progress](specification/2025-06-18/basic/utilities/progress.md) | The Model Context Protocol (MCP) supports optional progress tracking for long… |
| [Key Changes](specification/2025-06-18/changelog.md) | This document lists changes made to the Model Context Protocol (MCP) specific… |
| [Elicitation](specification/2025-06-18/client/elicitation.md) | Elicitation is newly introduced in this version of the MCP specification and… |
| [Roots](specification/2025-06-18/client/roots.md) | The Model Context Protocol (MCP) provides a standardized way for clients to e… |
| [Sampling](specification/2025-06-18/client/sampling.md) | The Model Context Protocol (MCP) provides a standardized way for servers to r… |
| [Specification](specification/2025-06-18/index.md) | This specification defines the authoritative protocol requirements, based on… |
| [Schema Reference](specification/2025-06-18/schema.md) | A response to a request that indicates an error occurred. |
| [Overview](specification/2025-06-18/server.md) | Servers provide the fundamental building blocks for adding context to languag… |
| [Prompts](specification/2025-06-18/server/prompts.md) | The Model Context Protocol (MCP) provides a standardized way for servers to e… |
| [Resources](specification/2025-06-18/server/resources.md) | The Model Context Protocol (MCP) provides a standardized way for servers to e… |
| [Tools](specification/2025-06-18/server/tools.md) | The Model Context Protocol (MCP) allows servers to expose tools that can be i… |
| [Completion](specification/2025-06-18/server/utilities/completion.md) | The Model Context Protocol (MCP) provides a standardized way for servers to o… |
| [Logging](specification/2025-06-18/server/utilities/logging.md) | The Model Context Protocol (MCP) provides a standardized way for servers to s… |
| [Pagination](specification/2025-06-18/server/utilities/pagination.md) | The Model Context Protocol (MCP) supports paginating list operations that may… |

### `2025-11-25`

| ページ | 内容 |
| --- | --- |
| [Architecture](specification/2025-11-25/architecture.md) | The Model Context Protocol (MCP) follows a client-host-server architecture wh… |
| [Overview](specification/2025-11-25/basic.md) | The Model Context Protocol consists of several key components that work toget… |
| [Authorization](specification/2025-11-25/basic/authorization.md) | The Model Context Protocol provides authorization capabilities at the transpo… |
| [Lifecycle](specification/2025-11-25/basic/lifecycle.md) | The Model Context Protocol (MCP) defines a rigorous lifecycle for client-serv… |
| [Transports](specification/2025-11-25/basic/transports.md) | MCP uses JSON-RPC to encode messages. JSON-RPC messages MUST be UTF-8 encoded. |
| [Cancellation](specification/2025-11-25/basic/utilities/cancellation.md) | The Model Context Protocol (MCP) supports optional cancellation of in-progres… |
| [Ping](specification/2025-11-25/basic/utilities/ping.md) | The Model Context Protocol includes an optional ping mechanism that allows ei… |
| [Progress](specification/2025-11-25/basic/utilities/progress.md) | The Model Context Protocol (MCP) supports optional progress tracking for long… |
| [Tasks](specification/2025-11-25/basic/utilities/tasks.md) | Tasks were introduced in version 2025-11-25 of the MCP specification and are… |
| [Key Changes](specification/2025-11-25/changelog.md) | This document lists changes made to the Model Context Protocol (MCP) specific… |
| [Elicitation](specification/2025-11-25/client/elicitation.md) | The Model Context Protocol (MCP) provides a standardized way for servers to r… |
| [Roots](specification/2025-11-25/client/roots.md) | The Model Context Protocol (MCP) provides a standardized way for clients to e… |
| [Sampling](specification/2025-11-25/client/sampling.md) | The Model Context Protocol (MCP) provides a standardized way for servers to r… |
| [Specification](specification/2025-11-25/index.md) | This specification defines the authoritative protocol requirements, based on… |
| [Schema Reference](specification/2025-11-25/schema.md) | A response to a request that indicates an error occurred. |
| [Overview](specification/2025-11-25/server.md) | Servers provide the fundamental building blocks for adding context to languag… |
| [Prompts](specification/2025-11-25/server/prompts.md) | The Model Context Protocol (MCP) provides a standardized way for servers to e… |
| [Resources](specification/2025-11-25/server/resources.md) | The Model Context Protocol (MCP) provides a standardized way for servers to e… |
| [Tools](specification/2025-11-25/server/tools.md) | The Model Context Protocol (MCP) allows servers to expose tools that can be i… |
| [Completion](specification/2025-11-25/server/utilities/completion.md) | The Model Context Protocol (MCP) provides a standardized way for servers to o… |
| [Logging](specification/2025-11-25/server/utilities/logging.md) | The Model Context Protocol (MCP) provides a standardized way for servers to s… |
| [Pagination](specification/2025-11-25/server/utilities/pagination.md) | The Model Context Protocol (MCP) supports paginating list operations that may… |

### `2026-07-28`

| ページ | 内容 |
| --- | --- |
| [Architecture](specification/2026-07-28/architecture.md) | The Model Context Protocol (MCP) follows a client-host-server architecture wh… |
| [Overview](specification/2026-07-28/basic.md) | The Model Context Protocol consists of several key components that work toget… |
| [Authorization](specification/2026-07-28/basic/authorization.md) | The Model Context Protocol provides authorization capabilities at the transpo… |
| [Authorization Server Discovery](specification/2026-07-28/basic/authorization/authorization-server-discovery.md) | This document describes the mechanisms by which MCP servers advertise their a… |
| [Client Registration](specification/2026-07-28/basic/authorization/client-registration.md) | MCP supports three client registration mechanisms. Choose based on your scena… |
| [Authorization Security Considerations](specification/2026-07-28/basic/authorization/security-considerations.md) | This document outlines security requirements that implementers MUST consider… |
| [Overview](specification/2026-07-28/basic/patterns.md) | This page defines the message patterns of the core protocol: the ways a clien… |
| [Cancellation](specification/2026-07-28/basic/patterns/cancellation.md) | The Model Context Protocol (MCP) supports optional cancellation of in-progres… |
| [Multi Round-Trip Requests](specification/2026-07-28/basic/patterns/mrtr.md) | Multi Round-Trip Requests (MRTR) was introduced in this version of the MCP sp… |
| [Progress](specification/2026-07-28/basic/patterns/progress.md) | The Model Context Protocol (MCP) supports optional progress tracking for long… |
| [Subscriptions](specification/2026-07-28/basic/patterns/subscriptions.md) | subscriptions/listen opens a long-lived notification stream from the server t… |
| [Overview](specification/2026-07-28/basic/transports.md) | This page defines what a transport must provide to carry MCP messages, the st… |
| [stdio](specification/2026-07-28/basic/transports/stdio.md) | In the stdio transport, the client launches the MCP server as a subprocess. T… |
| [Streamable HTTP](specification/2026-07-28/basic/transports/streamable-http.md) | Streamable HTTP was introduced in protocol version 2025-03-26 as a replacemen… |
| [Versioning and Compatibility](specification/2026-07-28/basic/versioning.md) | This page defines how a client and server agree on what they are speaking: th… |
| [Key Changes](specification/2026-07-28/changelog.md) | This document lists changes made to the Model Context Protocol (MCP) specific… |
| [Elicitation](specification/2026-07-28/client/elicitation.md) | The Model Context Protocol (MCP) provides a standardized way for servers to r… |
| [Roots](specification/2026-07-28/client/roots.md) | The Model Context Protocol (MCP) provides a standardized way for clients to e… |
| [Sampling](specification/2026-07-28/client/sampling.md) | The Model Context Protocol (MCP) provides a standardized way for servers to r… |
| [Deprecated Features](specification/2026-07-28/deprecated.md) | This page is the registry of specification features that are currently in the… |
| [Specification](specification/2026-07-28/index.md) | This specification defines the authoritative protocol requirements, based on… |
| [Schema Reference](specification/2026-07-28/schema.md) | A response to a request that indicates an error occurred. |
| [Overview](specification/2026-07-28/server.md) | Servers provide the fundamental building blocks for adding context to languag… |
| [Discovery](specification/2026-07-28/server/discover.md) | server/discover lets a client query a server's supported protocol versions, c… |
| [Prompts](specification/2026-07-28/server/prompts.md) | The Model Context Protocol (MCP) provides a standardized way for servers to e… |
| [Resources](specification/2026-07-28/server/resources.md) | The Model Context Protocol (MCP) provides a standardized way for servers to e… |
| [Tools](specification/2026-07-28/server/tools.md) | The Model Context Protocol (MCP) allows servers to expose tools that can be i… |
| [Caching](specification/2026-07-28/server/utilities/caching.md) | The Model Context Protocol (MCP) supports caching for some results. This allo… |
| [Completion](specification/2026-07-28/server/utilities/completion.md) | The Model Context Protocol (MCP) provides a standardized way for servers to o… |
| [Logging](specification/2026-07-28/server/utilities/logging.md) | The Model Context Protocol (MCP) provides a standardized way for servers to s… |
| [Pagination](specification/2026-07-28/server/utilities/pagination.md) | The Model Context Protocol (MCP) supports paginating list operations that may… |

## ガイド（55 ページ）

### `2025-06-18`

| ページ | 内容 |
| --- | --- |
| [Build an MCP client](guides/2025-06-18/develop/build-client.md) | Get started building your own client that can integrate with all MCP servers. |
| [Build an MCP server](guides/2025-06-18/develop/build-server.md) | Get started building your own server to use in Claude for Desktop and other clients. |
| [Build with Agent Skills](guides/2025-06-18/develop/build-with-agent-skills.md) | Use agent skills to guide AI coding assistants through MCP server design and implementation |
| [Client Best Practices](guides/2025-06-18/develop/clients/client-best-practices.md) | Patterns for scaling MCP host applications across many servers and tools. |
| [Connect to local MCP servers](guides/2025-06-18/develop/connect-local-servers.md) | Learn how to extend Claude Desktop with local MCP servers to enable file system access and other powerful integrations |
| [Connect to remote MCP Servers](guides/2025-06-18/develop/connect-remote-servers.md) | Learn how to connect Claude to remote MCP servers and extend its capabilities with internet-hosted tools and data sources |
| [What is the Model Context Protocol (MCP)?](guides/2025-06-18/getting-started/intro.md) | MCP (Model Context Protocol) is an open-source standard for connecting AI app… |
| [Architecture overview](guides/2025-06-18/learn/architecture.md) | This overview of the Model Context Protocol (MCP) discusses its scope and cor… |
| [Understanding MCP clients](guides/2025-06-18/learn/client-concepts.md) | MCP clients are instantiated by host applications to communicate with particu… |
| [Understanding MCP servers](guides/2025-06-18/learn/server-concepts.md) | MCP servers are programs that expose specific capabilities to AI applications… |
| [Versioning](guides/2025-06-18/learn/versioning.md) | The Model Context Protocol uses string-based version identifiers following th… |
| [SDKs](guides/2025-06-18/sdk.md) | Official SDKs for building with Model Context Protocol |
| [Debugging](guides/2025-06-18/tools/debugging.md) | A comprehensive guide to debugging Model Context Protocol (MCP) integrations |
| [MCP Inspector](guides/2025-06-18/tools/inspector.md) | In-depth guide to using the MCP Inspector for testing and debugging Model Context Protocol servers |
| [Understanding Authorization in MCP](guides/2025-06-18/tutorials/security/authorization.md) | Learn how to implement secure authorization for MCP servers using OAuth 2.1 to protect sensitive resources and operations |
| [Security Best Practices](guides/2025-06-18/tutorials/security/security_best_practices.md) | Security considerations, attack vectors, and best practices for MCP implementations |

### `2025-11-25`

| ページ | 内容 |
| --- | --- |
| [Build an MCP client](guides/2025-11-25/develop/build-client.md) | Get started building your own client that can integrate with all MCP servers. |
| [Build an MCP server](guides/2025-11-25/develop/build-server.md) | Get started building your own server to use in Claude for Desktop and other clients. |
| [Build with Agent Skills](guides/2025-11-25/develop/build-with-agent-skills.md) | Use agent skills to guide AI coding assistants through MCP server design and implementation |
| [Client Best Practices](guides/2025-11-25/develop/clients/client-best-practices.md) | Patterns for scaling MCP host applications across many servers and tools. |
| [Connect to local MCP servers](guides/2025-11-25/develop/connect-local-servers.md) | Learn how to extend Claude Desktop with local MCP servers to enable file system access and other powerful integrations |
| [Connect to remote MCP Servers](guides/2025-11-25/develop/connect-remote-servers.md) | Learn how to connect Claude to remote MCP servers and extend its capabilities with internet-hosted tools and data sources |
| [What is the Model Context Protocol (MCP)?](guides/2025-11-25/getting-started/intro.md) | MCP (Model Context Protocol) is an open-source standard for connecting AI app… |
| [Architecture overview](guides/2025-11-25/learn/architecture.md) | This overview of the Model Context Protocol (MCP) discusses its scope and cor… |
| [Understanding MCP clients](guides/2025-11-25/learn/client-concepts.md) | MCP clients are instantiated by host applications to communicate with particu… |
| [Understanding MCP servers](guides/2025-11-25/learn/server-concepts.md) | MCP servers are programs that expose specific capabilities to AI applications… |
| [Versioning](guides/2025-11-25/learn/versioning.md) | The Model Context Protocol uses string-based version identifiers following th… |
| [SDKs](guides/2025-11-25/sdk.md) | Official SDKs for building with Model Context Protocol |
| [Debugging](guides/2025-11-25/tools/debugging.md) | A comprehensive guide to debugging Model Context Protocol (MCP) integrations |
| [MCP Inspector](guides/2025-11-25/tools/inspector.md) | In-depth guide to using the MCP Inspector for testing and debugging Model Context Protocol servers |
| [Understanding Authorization in MCP](guides/2025-11-25/tutorials/security/authorization.md) | Learn how to implement secure authorization for MCP servers using OAuth 2.1 to protect sensitive resources and operations |
| [Security Best Practices](guides/2025-11-25/tutorials/security/security_best_practices.md) | Security considerations, attack vectors, and best practices for MCP implementations |

### `2026-07-28`

| ページ | 内容 |
| --- | --- |
| [Build an MCP client](guides/2026-07-28/develop/build-client.md) | Get started building your own client that can integrate with all MCP servers. |
| [Build an MCP server](guides/2026-07-28/develop/build-server.md) | Get started building your own server to use in Claude for Desktop and other clients. |
| [Build with Agent Skills](guides/2026-07-28/develop/build-with-agent-skills.md) | Use agent skills to guide AI coding assistants through MCP server design and implementation |
| [Client Best Practices](guides/2026-07-28/develop/clients/client-best-practices.md) | Patterns for scaling MCP host applications across many servers and tools. |
| [Connect to local MCP servers](guides/2026-07-28/develop/connect-local-servers.md) | Learn how to extend Claude Desktop with local MCP servers to enable file system access and other powerful integrations |
| [Connect to remote MCP Servers](guides/2026-07-28/develop/connect-remote-servers.md) | Learn how to connect Claude to remote MCP servers and extend its capabilities with internet-hosted tools and data sources |
| [What is the Model Context Protocol (MCP)?](guides/2026-07-28/getting-started/intro.md) | MCP (Model Context Protocol) is an open-source standard for connecting AI app… |
| [Architecture overview](guides/2026-07-28/learn/architecture.md) | This overview of the Model Context Protocol (MCP) discusses its scope and cor… |
| [Understanding MCP clients](guides/2026-07-28/learn/client-concepts.md) | MCP clients are instantiated by host applications to communicate with particu… |
| [Understanding MCP servers](guides/2026-07-28/learn/server-concepts.md) | MCP servers are programs that expose specific capabilities to AI applications… |
| [Versioning](guides/2026-07-28/learn/versioning.md) | The Model Context Protocol uses string-based version identifiers following th… |
| [SDKs](guides/2026-07-28/sdk.md) | Official SDKs for building with Model Context Protocol |
| [Debugging](guides/2026-07-28/tools/debugging.md) | A comprehensive guide to debugging Model Context Protocol (MCP) integrations |
| [MCP Inspector](guides/2026-07-28/tools/inspector.md) | Interactive developer tooling for testing and debugging MCP servers, in the browser, on the command line, and in the terminal |
| [Authorization](guides/2026-07-28/tools/inspector/authorization.md) | How the MCP Inspector performs OAuth, re-authorizes mid-session, and shares tokens between its clients |
| [CLI client](guides/2026-07-28/tools/inspector/cli.md) | Scripting the MCP Inspector: methods, output formats, exit codes, and CI recipes |
| [Configuration and flags](guides/2026-07-28/tools/inspector/configuration.md) | Catalog vs. config files, which client owns which flag, and every environment variable |
| [Protocol eras](guides/2026-07-28/tools/inspector/protocol-eras.md) | How the Inspector negotiates legacy vs. modern MCP, and how every feature is handled between protocol eras |
| [Recipes](guides/2026-07-28/tools/inspector/recipes.md) | Practical guides for transports, importing configs, reviewing MCP Apps, Docker, and network hosting |
| [TUI client](guides/2026-07-28/tools/inspector/tui.md) | The terminal MCP Inspector: navigation, tabs, and keyboard reference |
| [Web client](guides/2026-07-28/tools/inspector/web.md) | A tab-by-tab walkthrough of the graphical MCP Inspector |
| [Understanding Authorization in MCP](guides/2026-07-28/tutorials/security/authorization.md) | Learn how to implement secure authorization for MCP servers using OAuth 2.1 to protect sensitive resources and operations |
| [Security Best Practices](guides/2026-07-28/tutorials/security/security_best_practices.md) | Security considerations, attack vectors, and best practices for MCP implementations |

## 拡張仕様（8 ページ）

| ページ | 内容 |
| --- | --- |
| [Build an MCP App](extensions/apps/build.md) | Getting started guide for building interactive UI applications with MCP Apps |
| [MCP Apps](extensions/apps/overview.md) | Interactive UI applications that render inside MCP hosts like Claude Desktop |
| [Enterprise-Managed Authorization](extensions/auth/enterprise-managed-authorization.md) | Centralized access control for MCP in enterprise environments via identity providers |
| [OAuth Client Credentials](extensions/auth/oauth-client-credentials.md) | Machine-to-machine authentication for MCP using the OAuth 2.0 client credentials flow |
| [Authorization Extensions](extensions/auth/overview.md) | Supplementary authorization mechanisms for the Model Context Protocol |
| [Extension Support Matrix](extensions/client-matrix.md) | Which MCP clients implement which official extensions |
| [Extensions Overview](extensions/overview.md) | Optional extensions to the Model Context Protocol |
| [Tasks](extensions/tasks/overview.md) | Asynchronous task execution for long-running MCP operations |

## 変換で加えた手

原文に忠実な変換を優先しているが、次の 4 点だけは手を入れている。

| 対象 | 扱い |
| --- | --- |
| 全ページ冒頭のブロック引用（「llms.txt を取得せよ」） | 落とす。本文ではなく取得側への指示であり、ミラーに残すと読み手への指示として働く |
| `<div id="enable-section-numbers" />` | 落とす（Mintlify の描画指示で中身が無い） |
| サイト絶対パスのリンク | 対象内はミラー内の相対パスへ、対象外は絶対 URL へ書き換える |
| `schema` ページの typedoc HTML | 型ごとの見出し・シグネチャ・説明に組み直す。見出しは原文の `` ### `型名` `` を保つので `schema#型名` のアンカーは解決する。メンバー個別のアンカー（`#tool-description` 等）は失われるので、厳密に追うときは [schema.ts](schema/2026-07-28/schema.ts) を見る |

MDX コンポーネントは原文のまま残している（Markdown ビューアでは描画されない）。内訳は次のとおり。

| コンポーネント | ページ数 |
| --- | --- |
| `<Note>` | 46 |
| `<Card>` | 39 |
| `<CardGroup>` | 37 |
| `<Warning>` | 37 |
| `<Frame>` | 28 |
| `<Steps>` | 17 |
| `<Step>` | 17 |
| `<CodeGroup>` | 16 |
| `<Tabs>` | 15 |
| `<Tab>` | 15 |
| `<Info>` | 10 |
| `<Accordion>` | 9 |
| `<Tip>` | 9 |
| `<AccordionGroup>` | 6 |
| `<Icon>` | 4 |
| `<Tooltip>` | 3 |
| `<Badge>` | 3 |
| `<Tree>` | 1 |
| `<CHECK>` | 1 |

## 原文側の癖

公式サイトの側にある挙動。ミラーは追随しているだけなので、公式側が直せば次の再生成で消える。

### 版をまたぐ転送

版付きのパスが、別の版のページへ転送される。ミラーは転送先（＝実際に表示されるページ）へリンクしている。

| 参照されているパス | 実際の転送先 |
| --- | --- |
| `/specification/2025-06-18/basic/security_best_practices` | `/docs/2025-11-25/tutorials/security/security_best_practices` |

### 別名パス

`/specification/latest/...` は最新リリース版（`2026-07-28`）への別名で、9 通りのパスが原文から参照されている。ミラーでは解決済みの版へリンクしている。
