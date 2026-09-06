---
title: Schema Reference
section: specification
version: 2025-06-18
source: "https://modelcontextprotocol.io/specification/2025-06-18/schema"
fetched: 2026-09-06
---

# Schema Reference

## JSON-RPC

### `JSONRPCError`

A response to a request that indicates an error occurred.

```ts
interface JSONRPCError {
  jsonrpc: "2.0";
  id: RequestId;
  error: { code: number; message: string; data?: unknown };
}
```

#### `jsonrpc: "2.0"`

#### `id: RequestId`

#### `error: { code: number; message: string; data?: unknown }`

The error type that occurred.

### `JSONRPCMessage`

Refers to any valid JSON-RPC object that can be decoded off the wire, or encoded to be sent.

```ts
JSONRPCMessage:
  | JSONRPCRequest
  | JSONRPCNotification
  | JSONRPCResponse
  | JSONRPCError
```

### `JSONRPCNotification`

A notification which does not expect a response.

```ts
interface JSONRPCNotification {
  method: string;
  params?: { _meta?: { [key: string]: unknown }; [key: string]: unknown };
  jsonrpc: "2.0";
}
```

#### `jsonrpc: "2.0"`

### `JSONRPCRequest`

A request that expects a response.

```ts
interface JSONRPCRequest {
  method: string;
  params?: {
    _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
    [key: string]: unknown;
  };
  jsonrpc: "2.0";
  id: RequestId;
}
```

#### `jsonrpc: "2.0"`

#### `id: RequestId`

### `JSONRPCResponse`

A successful (non-error) response to a request.

```ts
interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: Result;
}
```

#### `jsonrpc: "2.0"`

#### `id: RequestId`

#### `result: Result`

## Common Types

### `Annotations`

Optional annotations for the client. The client can use annotations to inform how objects are used or displayed

```ts
interface Annotations {
  audience?: Role[];
  priority?: number;
  lastModified?: string;
}
```

#### `audience?: Role[]`

Describes who the intended customer of this object or data is.

It can include multiple entries to indicate content useful for multiple audiences (e.g., `["user", "assistant"]`).

#### `priority?: number`

Describes how important this data is for operating the server.

A value of 1 means "most important," and indicates that the data is
effectively required, while 0 means "least important," and indicates that
the data is entirely optional.

#### `lastModified?: string`

The moment the resource was last modified, as an ISO 8601 formatted string.

Should be an ISO 8601 formatted string (e.g., "2025-01-12T15:00:58Z").

Examples: last activity timestamp in an open file, timestamp when the resource
was attached, etc.

### `Cursor`

An opaque token used to represent a cursor for pagination.

```ts
Cursor: string
```

### `EmptyResult`

A response that indicates success but carries no data.

```ts
EmptyResult: Result
```

### `LoggingLevel`

The severity of a log message.

These map to syslog message severities, as specified in RFC-5424: [[https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1](https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1)](https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1)

```ts
LoggingLevel:
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "emergency"
```

### `ProgressToken`

A progress token, used to associate progress notifications with the original request.

```ts
ProgressToken: string | number
```

### `RequestId`

A uniquely identifying ID for a request in JSON-RPC.

```ts
RequestId: string | number
```

### `Result`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

```ts
interface Result {
  _meta?: { [key: string]: unknown };
  [key: string]: unknown;
}
```

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `Role`

The sender or recipient of messages and data in a conversation.

```ts
Role: "user" | "assistant"
```

## Content

### `AudioContent`

Audio provided to or from an LLM.

```ts
interface AudioContent {
  type: "audio";
  data: string;
  mimeType: string;
  annotations?: Annotations;
  _meta?: { [key: string]: unknown };
}
```

#### `type: "audio"`

#### `data: string`

The base64-encoded audio data.

#### `mimeType: string`

The MIME type of the audio. Different providers may support different audio types.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `BlobResourceContents`

The URI of this resource.

```ts
interface BlobResourceContents {
  uri: string;
  mimeType?: string;
  _meta?: { [key: string]: unknown };
  blob: string;
}
```

#### `blob: string`

A base64-encoded string representing the binary data of the item.

### `ContentBlock`

```ts
ContentBlock:
  | TextContent
  | ImageContent
  | AudioContent
  | ResourceLink
  | EmbeddedResource
```

### `EmbeddedResource`

The contents of a resource, embedded into a prompt or tool call result.

It is up to the client how best to render embedded resources for the benefit
of the LLM and/or the user.

```ts
interface EmbeddedResource {
  type: "resource";
  resource: TextResourceContents | BlobResourceContents;
  annotations?: Annotations;
  _meta?: { [key: string]: unknown };
}
```

#### `type: "resource"`

#### `resource: TextResourceContents | BlobResourceContents`

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `ImageContent`

An image provided to or from an LLM.

```ts
interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
  annotations?: Annotations;
  _meta?: { [key: string]: unknown };
}
```

#### `type: "image"`

#### `data: string`

The base64-encoded image data.

#### `mimeType: string`

The MIME type of the image. Different providers may support different image types.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `ResourceLink`

A resource that the server is capable of reading, included in a prompt or tool call result.

Note: resource links returned by tools are not guaranteed to appear in the results of `resources/list` requests.

```ts
interface ResourceLink {
  name: string;
  title?: string;
  uri: string;
  description?: string;
  mimeType?: string;
  annotations?: Annotations;
  size?: number;
  _meta?: { [key: string]: unknown };
  type: "resource_link";
}
```

#### `type: "resource_link"`

### `TextContent`

Text provided to or from an LLM.

```ts
interface TextContent {
  type: "text";
  text: string;
  annotations?: Annotations;
  _meta?: { [key: string]: unknown };
}
```

#### `type: "text"`

#### `text: string`

The text content of the message.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `TextResourceContents`

The URI of this resource.

```ts
interface TextResourceContents {
  uri: string;
  mimeType?: string;
  _meta?: { [key: string]: unknown };
  text: string;
}
```

#### `text: string`

The text of the item. This must only be set if the item can actually be represented as text (not binary data).

## `completion/complete`

### `CompleteRequest`

A request from the client to the server, to ask for completion options.

```ts
interface CompleteRequest {
  method: "completion/complete";
  params: {
    ref: PromptReference | ResourceTemplateReference;
    argument: { name: string; value: string };
    context?: { arguments?: { [key: string]: string } };
  };
}
```

#### `method: "completion/complete"`

#### `params: {    ref: PromptReference | ResourceTemplateReference;    argument: { name: string; value: string };    context?: { arguments?: { [key: string]: string } }; }`

The argument's information

### `CompleteResult`

The server's response to a completion/complete request

```ts
interface CompleteResult {
  _meta?: { [key: string]: unknown };
  completion: { values: string[]; total?: number; hasMore?: boolean };
  [key: string]: unknown;
}
```

#### `completion: { values: string[]; total?: number; hasMore?: boolean }`

An array of completion values. Must not exceed 100 items.

### `PromptReference`

Identifies a prompt.

```ts
interface PromptReference {
  name: string;
  title?: string;
  type: "ref/prompt";
}
```

#### `type: "ref/prompt"`

### `ResourceTemplateReference`

A reference to a resource or resource template definition.

```ts
interface ResourceTemplateReference {
  type: "ref/resource";
  uri: string;
}
```

#### `type: "ref/resource"`

#### `uri: string`

The URI or URI template of the resource.

## `elicitation/create`

### `ElicitRequest`

A request from the server to elicit additional information from the user via the client.

```ts
interface ElicitRequest {
  method: "elicitation/create";
  params: {
    message: string;
    requestedSchema: {
      type: "object";
      properties: { [key: string]: PrimitiveSchemaDefinition };
      required?: string[];
    };
  };
}
```

#### `method: "elicitation/create"`

#### `params: {    message: string;    requestedSchema: {        type: "object";        properties: { [key: string]: PrimitiveSchemaDefinition };        required?: string[];    }; }`

The message to present to the user.

### `ElicitResult`

The client's response to an elicitation request.

```ts
interface ElicitResult {
  _meta?: { [key: string]: unknown };
  action: "accept" | "decline" | "cancel";
  content?: { [key: string]: string | number | boolean };
  [key: string]: unknown;
}
```

#### `action: "accept" | "decline" | "cancel"`

The user action in response to the elicitation.  "accept": User submitted the form/confirmed the action "decline": User explicitly declined the action "cancel": User dismissed without making an explicit choice

#### `content?: { [key: string]: string | number | boolean }`

The submitted form data, only present when action is "accept".
Contains values matching the requested schema.

### `BooleanSchema`

```ts
interface BooleanSchema {
  type: "boolean";
  title?: string;
  description?: string;
  default?: boolean;
}
```

#### `type: "boolean"`

#### `title?: string`

#### `description?: string`

#### `default?: boolean`

### `EnumSchema`

```ts
interface EnumSchema {
  type: "string";
  title?: string;
  description?: string;
  enum: string[];
  enumNames?: string[];
}
```

#### `type: "string"`

#### `title?: string`

#### `description?: string`

#### `enum: string[]`

#### `enumNames?: string[]`

### `NumberSchema`

```ts
interface NumberSchema {
  type: "number" | "integer";
  title?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
}
```

#### `type: "number" | "integer"`

#### `title?: string`

#### `description?: string`

#### `minimum?: number`

#### `maximum?: number`

### `PrimitiveSchemaDefinition`

Restricted schema definitions that only allow primitive types
without nested objects or arrays.

```ts
PrimitiveSchemaDefinition:
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | EnumSchema
```

### `StringSchema`

```ts
interface StringSchema {
  type: "string";
  title?: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  format?: "uri" | "email" | "date" | "date-time";
}
```

#### `type: "string"`

#### `title?: string`

#### `description?: string`

#### `minLength?: number`

#### `maxLength?: number`

#### `format?: "uri" | "email" | "date" | "date-time"`

## `initialize`

### `InitializeRequest`

This request is sent from the client to the server when it first connects, asking it to begin initialization.

```ts
interface InitializeRequest {
  method: "initialize";
  params: {
    protocolVersion: string;
    capabilities: ClientCapabilities;
    clientInfo: Implementation;
  };
}
```

#### `method: "initialize"`

#### `params: {    protocolVersion: string;    capabilities: ClientCapabilities;    clientInfo: Implementation; }`

The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.

### `InitializeResult`

After receiving an initialize request from the client, the server sends this response.

```ts
interface InitializeResult {
  _meta?: { [key: string]: unknown };
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: Implementation;
  instructions?: string;
  [key: string]: unknown;
}
```

#### `protocolVersion: string`

The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.

#### `capabilities: ServerCapabilities`

#### `serverInfo: Implementation`

#### `instructions?: string`

Instructions describing how to use the server and its features.

This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.

### `ClientCapabilities`

Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.

```ts
interface ClientCapabilities {
  experimental?: { [key: string]: object };
  roots?: { listChanged?: boolean };
  sampling?: object;
  elicitation?: object;
}
```

#### `experimental?: { [key: string]: object }`

Experimental, non-standard capabilities that the client supports.

#### `roots?: { listChanged?: boolean }`

Present if the client supports listing roots.

#### `sampling?: object`

Present if the client supports sampling from an LLM.

#### `elicitation?: object`

Present if the client supports elicitation from the server.

### `Implementation`

Describes the name and version of an MCP implementation, with an optional title for UI representation.

```ts
interface Implementation {
  name: string;
  title?: string;
  version: string;
}
```

#### `version: string`

### `ServerCapabilities`

Capabilities that a server may support. Known capabilities are defined here, in this schema, but this is not a closed set: any server can define its own, additional capabilities.

```ts
interface ServerCapabilities {
  experimental?: { [key: string]: object };
  logging?: object;
  completions?: object;
  prompts?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  tools?: { listChanged?: boolean };
}
```

#### `experimental?: { [key: string]: object }`

Experimental, non-standard capabilities that the server supports.

#### `logging?: object`

Present if the server supports sending log messages to the client.

#### `completions?: object`

Present if the server supports argument autocompletion suggestions.

#### `prompts?: { listChanged?: boolean }`

Present if the server offers any prompt templates.

#### `resources?: { subscribe?: boolean; listChanged?: boolean }`

Present if the server offers any resources to read.

#### `tools?: { listChanged?: boolean }`

Present if the server offers any tools to call.

## `logging/setLevel`

### `SetLevelRequest`

A request from the client to the server, to enable or adjust logging.

```ts
interface SetLevelRequest {
  method: "logging/setLevel";
  params: { level: LoggingLevel };
}
```

#### `method: "logging/setLevel"`

#### `params: { level: LoggingLevel }`

The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/message.

## `notifications/cancelled`

### `CancelledNotification`

This notification can be sent by either side to indicate that it is cancelling a previously-issued request.

The request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.

This notification indicates that the result will be unused, so any associated processing SHOULD cease.

A client MUST NOT attempt to cancel its `initialize` request.

```ts
interface CancelledNotification {
  method: "notifications/cancelled";
  params: { requestId: RequestId; reason?: string };
}
```

#### `method: "notifications/cancelled"`

#### `params: { requestId: RequestId; reason?: string }`

The ID of the request to cancel.

This MUST correspond to the ID of a request previously issued in the same direction.

## `notifications/initialized`

### `InitializedNotification`

This notification is sent from the client to the server after initialization has finished.

```ts
interface InitializedNotification {
  params?: { _meta?: { [key: string]: unknown }; [key: string]: unknown };
  method: "notifications/initialized";
}
```

#### `method: "notifications/initialized"`

## `notifications/message`

### `LoggingMessageNotification`

Notification of a log message passed from server to client. If no logging/setLevel request has been sent from the client, the server MAY decide which messages to send automatically.

```ts
interface LoggingMessageNotification {
  method: "notifications/message";
  params: { level: LoggingLevel; logger?: string; data: unknown };
}
```

#### `method: "notifications/message"`

#### `params: { level: LoggingLevel; logger?: string; data: unknown }`

The severity of this log message.

## `notifications/progress`

### `ProgressNotification`

An out-of-band notification used to inform the receiver of a progress update for a long-running request.

```ts
interface ProgressNotification {
  method: "notifications/progress";
  params: {
    progressToken: ProgressToken;
    progress: number;
    total?: number;
    message?: string;
  };
}
```

#### `method: "notifications/progress"`

#### `params: {    progressToken: ProgressToken;    progress: number;    total?: number;    message?: string; }`

The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.

## `notifications/prompts/list_changed`

### `PromptListChangedNotification`

An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This may be issued by servers without any previous subscription from the client.

```ts
interface PromptListChangedNotification {
  params?: { _meta?: { [key: string]: unknown }; [key: string]: unknown };
  method: "notifications/prompts/list_changed";
}
```

#### `method: "notifications/prompts/list_changed"`

## `notifications/resources/list_changed`

### `ResourceListChangedNotification`

An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This may be issued by servers without any previous subscription from the client.

```ts
interface ResourceListChangedNotification {
  params?: { _meta?: { [key: string]: unknown }; [key: string]: unknown };
  method: "notifications/resources/list_changed";
}
```

#### `method: "notifications/resources/list_changed"`

## `notifications/resources/updated`

### `ResourceUpdatedNotification`

A notification from the server to the client, informing it that a resource has changed and may need to be read again. This should only be sent if the client previously sent a resources/subscribe request.

```ts
interface ResourceUpdatedNotification {
  method: "notifications/resources/updated";
  params: { uri: string };
}
```

#### `method: "notifications/resources/updated"`

#### `params: { uri: string }`

The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.

## `notifications/roots/list_changed`

### `RootsListChangedNotification`

A notification from the client to the server, informing it that the list of roots has changed.
This notification should be sent whenever the client adds, removes, or modifies any root.
The server should then request an updated list of roots using the ListRootsRequest.

```ts
interface RootsListChangedNotification {
  params?: { _meta?: { [key: string]: unknown }; [key: string]: unknown };
  method: "notifications/roots/list_changed";
}
```

#### `method: "notifications/roots/list_changed"`

## `notifications/tools/list_changed`

### `ToolListChangedNotification`

An optional notification from the server to the client, informing it that the list of tools it offers has changed. This may be issued by servers without any previous subscription from the client.

```ts
interface ToolListChangedNotification {
  params?: { _meta?: { [key: string]: unknown }; [key: string]: unknown };
  method: "notifications/tools/list_changed";
}
```

#### `method: "notifications/tools/list_changed"`

## `ping`

### `PingRequest`

A ping, issued by either the server or the client, to check that the other party is still alive. The receiver must promptly respond, or else may be disconnected.

```ts
interface PingRequest {
  params?: {
    _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
    [key: string]: unknown;
  };
  method: "ping";
}
```

#### `method: "ping"`

## `prompts/get`

### `GetPromptRequest`

Used by the client to get a prompt provided by the server.

```ts
interface GetPromptRequest {
  method: "prompts/get";
  params: { name: string; arguments?: { [key: string]: string } };
}
```

#### `method: "prompts/get"`

#### `params: { name: string; arguments?: { [key: string]: string } }`

The name of the prompt or prompt template.

### `GetPromptResult`

The server's response to a prompts/get request from the client.

```ts
interface GetPromptResult {
  _meta?: { [key: string]: unknown };
  description?: string;
  messages: PromptMessage[];
  [key: string]: unknown;
}
```

#### `description?: string`

An optional description for the prompt.

#### `messages: PromptMessage[]`

### `PromptMessage`

Describes a message returned as part of a prompt.

This is similar to `SamplingMessage`, but also supports the embedding of
resources from the MCP server.

```ts
interface PromptMessage {
  role: Role;
  content: ContentBlock;
}
```

#### `role: Role`

#### `content: ContentBlock`

## `prompts/list`

### `ListPromptsRequest`

Sent from the client to request a list of prompts and prompt templates the server has.

```ts
interface ListPromptsRequest {
  params?: { cursor?: string };
  method: "prompts/list";
}
```

#### `method: "prompts/list"`

### `ListPromptsResult`

The server's response to a prompts/list request from the client.

```ts
interface ListPromptsResult {
  _meta?: { [key: string]: unknown };
  nextCursor?: string;
  prompts: Prompt[];
  [key: string]: unknown;
}
```

#### `prompts: Prompt[]`

### `Prompt`

A prompt or prompt template that the server offers.

```ts
interface Prompt {
  name: string;
  title?: string;
  description?: string;
  arguments?: PromptArgument[];
  _meta?: { [key: string]: unknown };
}
```

#### `description?: string`

An optional description of what this prompt provides

#### `arguments?: PromptArgument[]`

A list of arguments to use for templating the prompt.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `PromptArgument`

Describes an argument that a prompt can accept.

```ts
interface PromptArgument {
  name: string;
  title?: string;
  description?: string;
  required?: boolean;
}
```

#### `description?: string`

A human-readable description of the argument.

#### `required?: boolean`

Whether this argument must be provided.

## `resources/list`

### `ListResourcesRequest`

Sent from the client to request a list of resources the server has.

```ts
interface ListResourcesRequest {
  params?: { cursor?: string };
  method: "resources/list";
}
```

#### `method: "resources/list"`

### `ListResourcesResult`

The server's response to a resources/list request from the client.

```ts
interface ListResourcesResult {
  _meta?: { [key: string]: unknown };
  nextCursor?: string;
  resources: Resource[];
  [key: string]: unknown;
}
```

#### `resources: Resource[]`

### `Resource`

A known resource that the server is capable of reading.

```ts
interface Resource {
  name: string;
  title?: string;
  uri: string;
  description?: string;
  mimeType?: string;
  annotations?: Annotations;
  size?: number;
  _meta?: { [key: string]: unknown };
}
```

#### `uri: string`

The URI of this resource.

#### `description?: string`

A description of what this resource represents.

This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.

#### `mimeType?: string`

The MIME type of this resource, if known.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `size?: number`

The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.

This can be used by Hosts to display file sizes and estimate context window usage.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

## `resources/read`

### `ReadResourceRequest`

Sent from the client to the server, to read a specific resource URI.

```ts
interface ReadResourceRequest {
  method: "resources/read";
  params: { uri: string };
}
```

#### `method: "resources/read"`

#### `params: { uri: string }`

The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.

### `ReadResourceResult`

The server's response to a resources/read request from the client.

```ts
interface ReadResourceResult {
  _meta?: { [key: string]: unknown };
  contents: (TextResourceContents | BlobResourceContents)[];
  [key: string]: unknown;
}
```

#### `contents: (TextResourceContents | BlobResourceContents)[]`

## `resources/subscribe`

### `SubscribeRequest`

Sent from the client to request resources/updated notifications from the server whenever a particular resource changes.

```ts
interface SubscribeRequest {
  method: "resources/subscribe";
  params: { uri: string };
}
```

#### `method: "resources/subscribe"`

#### `params: { uri: string }`

The URI of the resource to subscribe to. The URI can use any protocol; it is up to the server how to interpret it.

## `resources/templates/list`

### `ListResourceTemplatesRequest`

Sent from the client to request a list of resource templates the server has.

```ts
interface ListResourceTemplatesRequest {
  params?: { cursor?: string };
  method: "resources/templates/list";
}
```

#### `method: "resources/templates/list"`

### `ListResourceTemplatesResult`

The server's response to a resources/templates/list request from the client.

```ts
interface ListResourceTemplatesResult {
  _meta?: { [key: string]: unknown };
  nextCursor?: string;
  resourceTemplates: ResourceTemplate[];
  [key: string]: unknown;
}
```

#### `resourceTemplates: ResourceTemplate[]`

### `ResourceTemplate`

A template description for resources available on the server.

```ts
interface ResourceTemplate {
  name: string;
  title?: string;
  uriTemplate: string;
  description?: string;
  mimeType?: string;
  annotations?: Annotations;
  _meta?: { [key: string]: unknown };
}
```

#### `uriTemplate: string`

A URI template (according to RFC 6570) that can be used to construct resource URIs.

#### `description?: string`

A description of what this template is for.

This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.

#### `mimeType?: string`

The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

## `resources/unsubscribe`

### `UnsubscribeRequest`

Sent from the client to request cancellation of resources/updated notifications from the server. This should follow a previous resources/subscribe request.

```ts
interface UnsubscribeRequest {
  method: "resources/unsubscribe";
  params: { uri: string };
}
```

#### `method: "resources/unsubscribe"`

#### `params: { uri: string }`

The URI of the resource to unsubscribe from.

## `roots/list`

### `ListRootsRequest`

Sent from the server to request a list of root URIs from the client. Roots allow
servers to ask for specific directories or files to operate on. A common example
for roots is providing a set of repositories or directories a server should operate
on.

This request is typically used when the server needs to understand the file system
structure or access specific locations that the client has permission to read from.

```ts
interface ListRootsRequest {
  params?: {
    _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
    [key: string]: unknown;
  };
  method: "roots/list";
}
```

#### `method: "roots/list"`

### `ListRootsResult`

The client's response to a roots/list request from the server.
This result contains an array of Root objects, each representing a root directory
or file that the server can operate on.

```ts
interface ListRootsResult {
  _meta?: { [key: string]: unknown };
  roots: Root[];
  [key: string]: unknown;
}
```

#### `roots: Root[]`

### `Root`

Represents a root directory or file that the server can operate on.

```ts
interface Root {
  uri: string;
  name?: string;
  _meta?: { [key: string]: unknown };
}
```

#### `uri: string`

The URI identifying the root. This must start with file:// for now.
This restriction may be relaxed in future versions of the protocol to allow
other URI schemes.

#### `name?: string`

An optional name for the root. This can be used to provide a human-readable
identifier for the root, which may be useful for display purposes or for
referencing the root in other parts of the application.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

## `sampling/createMessage`

### `CreateMessageRequest`

A request from the server to sample an LLM via the client. The client has full discretion over which model to select. The client should also inform the user before beginning sampling, to allow them to inspect the request (human in the loop) and decide whether to approve it.

```ts
interface CreateMessageRequest {
  method: "sampling/createMessage";
  params: {
    messages: SamplingMessage[];
    modelPreferences?: ModelPreferences;
    systemPrompt?: string;
    includeContext?: "none" | "thisServer" | "allServers";
    temperature?: number;
    maxTokens: number;
    stopSequences?: string[];
    metadata?: object;
  };
}
```

#### `method: "sampling/createMessage"`

#### `params: {    messages: SamplingMessage[];    modelPreferences?: ModelPreferences;    systemPrompt?: string;    includeContext?: "none" | "thisServer" | "allServers";    temperature?: number;    maxTokens: number;    stopSequences?: string[];    metadata?: object; }`

The server's preferences for which model to select. The client MAY ignore these preferences.

### `CreateMessageResult`

The client's response to a sampling/create_message request from the server. The client should inform the user before returning the sampled message, to allow them to inspect the response (human in the loop) and decide whether to allow the server to see it.

```ts
interface CreateMessageResult {
  _meta?: { [key: string]: unknown };
  model: string;
  stopReason?: string;
  role: Role;
  content: TextContent | ImageContent | AudioContent;
  [key: string]: unknown;
}
```

#### `model: string`

The name of the model that generated the message.

#### `stopReason?: string`

The reason why sampling stopped, if known.

### `ModelHint`

Hints to use for model selection.

Keys not declared here are currently left unspecified by the spec and are up
to the client to interpret.

```ts
interface ModelHint {
  name?: string;
}
```

#### `name?: string`

A hint for a model name.

The client SHOULD treat this as a substring of a model name; for example:  `claude-3-5-sonnet` should match `claude-3-5-sonnet-20241022` `sonnet` should match `claude-3-5-sonnet-20241022`, `claude-3-sonnet-20240229`, etc. `claude` should match any Claude model  The client MAY also map the string to a different provider's model name or a different model family, as long as it fills a similar niche; for example:  `gemini-1.5-flash` could match `claude-3-haiku-20240307`

### `ModelPreferences`

The server's preferences for model selection, requested of the client during sampling.

Because LLMs can vary along multiple dimensions, choosing the "best" model is
rarely straightforward.  Different models excel in different areas—some are
faster but less capable, others are more capable but more expensive, and so
on. This interface allows servers to express their priorities across multiple
dimensions to help clients make an appropriate selection for their use case.

These preferences are always advisory. The client MAY ignore them. It is also
up to the client to decide how to interpret these preferences and how to
balance them against other considerations.

```ts
interface ModelPreferences {
  hints?: ModelHint[];
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}
```

#### `hints?: ModelHint[]`

Optional hints to use for model selection.

If multiple hints are specified, the client MUST evaluate them in order
(such that the first match is taken).

The client SHOULD prioritize these hints over the numeric priorities, but
MAY still use the priorities to select from ambiguous matches.

#### `costPriority?: number`

How much to prioritize cost when selecting a model. A value of 0 means cost
is not important, while a value of 1 means cost is the most important
factor.

#### `speedPriority?: number`

How much to prioritize sampling speed (latency) when selecting a model. A
value of 0 means speed is not important, while a value of 1 means speed is
the most important factor.

#### `intelligencePriority?: number`

How much to prioritize intelligence and capabilities when selecting a
model. A value of 0 means intelligence is not important, while a value of 1
means intelligence is the most important factor.

### `SamplingMessage`

Describes a message issued to or received from an LLM API.

```ts
interface SamplingMessage {
  role: Role;
  content: TextContent | ImageContent | AudioContent;
}
```

#### `role: Role`

#### `content: TextContent | ImageContent | AudioContent`

## `tools/call`

### `CallToolRequest`

Used by the client to invoke a tool provided by the server.

```ts
interface CallToolRequest {
  method: "tools/call";
  params: { name: string; arguments?: { [key: string]: unknown } };
}
```

#### `method: "tools/call"`

#### `params: { name: string; arguments?: { [key: string]: unknown } }`

### `CallToolResult`

The server's response to a tool call.

```ts
interface CallToolResult {
  _meta?: { [key: string]: unknown };
  content: ContentBlock[];
  structuredContent?: { [key: string]: unknown };
  isError?: boolean;
  [key: string]: unknown;
}
```

#### `content: ContentBlock[]`

A list of content objects that represent the unstructured result of the tool call.

#### `structuredContent?: { [key: string]: unknown }`

An optional JSON object that represents the structured result of the tool call.

#### `isError?: boolean`

Whether the tool call ended in an error.

If not set, this is assumed to be false (the call was successful).

Any errors that originate from the tool SHOULD be reported inside the result
object, with `isError` set to true, not as an MCP protocol-level error
response. Otherwise, the LLM would not be able to see that an error occurred
and self-correct.

However, any errors in finding the tool, an error indicating that the
server does not support tool calls, or any other exceptional conditions,
should be reported as an MCP error response.

## `tools/list`

### `ListToolsRequest`

Sent from the client to request a list of tools the server has.

```ts
interface ListToolsRequest {
  params?: { cursor?: string };
  method: "tools/list";
}
```

#### `method: "tools/list"`

### `ListToolsResult`

The server's response to a tools/list request from the client.

```ts
interface ListToolsResult {
  _meta?: { [key: string]: unknown };
  nextCursor?: string;
  tools: Tool[];
  [key: string]: unknown;
}
```

#### `tools: Tool[]`

### `Tool`

Definition for a tool the client can call.

```ts
interface Tool {
  name: string;
  title?: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: { [key: string]: object };
    required?: string[];
  };
  outputSchema?: {
    type: "object";
    properties?: { [key: string]: object };
    required?: string[];
  };
  annotations?: ToolAnnotations;
  _meta?: { [key: string]: unknown };
}
```

#### `description?: string`

A human-readable description of the tool.

This can be used by clients to improve the LLM's understanding of available tools. It can be thought of like a "hint" to the model.

#### `inputSchema: {    type: "object";    properties?: { [key: string]: object };    required?: string[]; }`

A JSON Schema object defining the expected parameters for the tool.

#### `outputSchema?: {    type: "object";    properties?: { [key: string]: object };    required?: string[]; }`

An optional JSON Schema object defining the structure of the tool's output returned in
the structuredContent field of a CallToolResult.

#### `annotations?: ToolAnnotations`

Optional additional tool information.

Display name precedence order is: title, annotations.title, then name.

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `ToolAnnotations`

Additional properties describing a Tool to clients.

NOTE: all properties in ToolAnnotations are hints.
They are not guaranteed to provide a faithful description of
tool behavior (including descriptive properties like `title`).

Clients should never make tool use decisions based on ToolAnnotations
received from untrusted servers.

```ts
interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}
```

#### `title?: string`

A human-readable title for the tool.

#### `readOnlyHint?: boolean`

If true, the tool does not modify its environment.

Default: false

#### `destructiveHint?: boolean`

If true, the tool may perform destructive updates to its environment.
If false, the tool performs only additive updates.

(This property is meaningful only when `readOnlyHint == false`)

Default: true

#### `idempotentHint?: boolean`

If true, calling the tool repeatedly with the same arguments
will have no additional effect on the its environment.

(This property is meaningful only when `readOnlyHint == false`)

Default: false

#### `openWorldHint?: boolean`

If true, this tool may interact with an "open world" of external
entities. If false, the tool's domain of interaction is closed.
For example, the world of a web search tool is open, whereas that
of a memory tool is not.

Default: true
