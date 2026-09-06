---
title: Schema Reference
section: specification
version: 2025-11-25
source: "https://modelcontextprotocol.io/specification/2025-11-25/schema"
fetched: 2026-09-06
---

# Schema Reference

## JSON-RPC

### `JSONRPCErrorResponse`

A response to a request that indicates an error occurred.

```ts
interface JSONRPCErrorResponse {
  jsonrpc: "2.0";
  id?: RequestId;
  error: Error;
}
```

#### `jsonrpc: "2.0"`

#### `id?: RequestId`

#### `error: Error`

### `JSONRPCMessage`

Refers to any valid JSON-RPC object that can be decoded off the wire, or encoded to be sent.

```ts
JSONRPCMessage: JSONRPCRequest | JSONRPCNotification | JSONRPCResponse
```

### `JSONRPCNotification`

A notification which does not expect a response.

```ts
interface JSONRPCNotification {
  method: string;
  params?: { [key: string]: any };
  jsonrpc: "2.0";
}
```

#### `jsonrpc: "2.0"`

### `JSONRPCRequest`

A request that expects a response.

```ts
interface JSONRPCRequest {
  method: string;
  params?: { [key: string]: any };
  jsonrpc: "2.0";
  id: RequestId;
}
```

#### `jsonrpc: "2.0"`

#### `id: RequestId`

### `JSONRPCResponse`

A response to a request, containing either the result or error.

```ts
JSONRPCResponse: JSONRPCResultResponse | JSONRPCErrorResponse
```

### `JSONRPCResultResponse`

A successful (non-error) response to a request.

```ts
interface JSONRPCResultResponse {
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

Describes who the intended audience of this object or data is.

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

### `Error`

The error type that occurred.

```ts
interface Error {
  code: number;
  message: string;
  data?: unknown;
}
```

#### `code: number`

The error type that occurred.

#### `message: string`

A short description of the error. The message SHOULD be limited to a concise single sentence.

#### `data?: unknown`

Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).

### `Icon`

An optionally-sized icon that can be displayed in a user interface.

```ts
interface Icon {
  src: string;
  mimeType?: string;
  sizes?: string[];
  theme?: "light" | "dark";
}
```

#### `src: string`

A standard URI pointing to an icon resource. May be an HTTP/HTTPS URL or a `data:` URI with Base64-encoded image data.

Consumers SHOULD takes steps to ensure URLs serving icons are from the
same domain as the client/server or a trusted domain.

Consumers SHOULD take appropriate precautions when consuming SVGs as they can contain
executable JavaScript.

#### `mimeType?: string`

Optional MIME type override if the source MIME type is missing or generic.
For example: `"image/png"`, `"image/jpeg"`, or `"image/svg+xml"`.

#### `sizes?: string[]`

Optional array of strings that specify sizes at which the icon can be used.
Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.

If not provided, the client should assume that the icon can be used at any size.

#### `theme?: "light" | "dark"`

Optional specifier for the theme this icon is designed for. `light` indicates
the icon is designed to be used with a light background, and `dark` indicates
the icon is designed to be used with a dark background.

If not provided, the client should assume the icon can be used with any theme.

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
  icons?: Icon[];
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
  jsonrpc: "2.0";
  id: RequestId;
  method: "completion/complete";
  params: CompleteRequestParams;
}
```

#### `method: "completion/complete"`

#### `params: CompleteRequestParams`

### `CompleteRequestParams`

Parameters for a `completion/complete` request.

```ts
interface CompleteRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  ref: PromptReference | ResourceTemplateReference;
  argument: { name: string; value: string };
  context?: { arguments?: { [key: string]: string } };
}
```

#### `ref: PromptReference | ResourceTemplateReference`

#### `argument: { name: string; value: string }`

The argument's information

#### `context?: { arguments?: { [key: string]: string } }`

Additional, optional context for completions

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
  jsonrpc: "2.0";
  id: RequestId;
  method: "elicitation/create";
  params: ElicitRequestParams;
}
```

#### `method: "elicitation/create"`

#### `params: ElicitRequestParams`

### `ElicitRequestParams`

The parameters for a request to elicit additional information from the user via the client.

```ts
ElicitRequestParams: ElicitRequestFormParams | ElicitRequestURLParams
```

### `ElicitResult`

The client's response to an elicitation request.

```ts
interface ElicitResult {
  _meta?: { [key: string]: unknown };
  action: "accept" | "decline" | "cancel";
  content?: { [key: string]: string | number | boolean | string[] };
  [key: string]: unknown;
}
```

#### `action: "accept" | "decline" | "cancel"`

The user action in response to the elicitation.  "accept": User submitted the form/confirmed the action "decline": User explicitly decline the action "cancel": User dismissed without making an explicit choice

#### `content?: { [key: string]: string | number | boolean | string[] }`

The submitted form data, only present when action is "accept" and mode was "form".
Contains values matching the requested schema.
Omitted for out-of-band mode responses.

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

### `ElicitRequestFormParams`

The parameters for a request to elicit non-sensitive information from the user via a form in the client.

```ts
interface ElicitRequestFormParams {
  task?: TaskMetadata;
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  mode?: "form";
  message: string;
  requestedSchema: {
    $schema?: string;
    type: "object";
    properties: { [key: string]: PrimitiveSchemaDefinition };
    required?: string[];
  };
}
```

#### `mode?: "form"`

The elicitation mode.

#### `message: string`

The message to present to the user describing what information is being requested.

#### `requestedSchema: {    $schema?: string;    type: "object";    properties: { [key: string]: PrimitiveSchemaDefinition };    required?: string[]; }`

A restricted subset of JSON Schema.
Only top-level properties are allowed, without nesting.

### `ElicitRequestURLParams`

The parameters for a request to elicit information from the user via a URL in the client.

```ts
interface ElicitRequestURLParams {
  task?: TaskMetadata;
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  mode: "url";
  message: string;
  elicitationId: string;
  url: string;
}
```

#### `mode: "url"`

The elicitation mode.

#### `message: string`

The message to present to the user explaining why the interaction is needed.

#### `elicitationId: string`

The ID of the elicitation, which must be unique within the context of the server.
The client MUST treat this ID as an opaque value.

#### `url: string`

The URL that the user should navigate to.

### `EnumSchema`

```ts
EnumSchema:
  | SingleSelectEnumSchema
  | MultiSelectEnumSchema
  | LegacyTitledEnumSchema
```

### `LegacyTitledEnumSchema`

Use TitledSingleSelectEnumSchema instead.
This interface will be removed in a future version.

```ts
interface LegacyTitledEnumSchema {
  type: "string";
  title?: string;
  description?: string;
  enum: string[];
  enumNames?: string[];
  default?: string;
}
```

#### `type: "string"`

#### `title?: string`

#### `description?: string`

#### `enum: string[]`

#### `enumNames?: string[]`

(Legacy) Display names for enum values.
Non-standard according to JSON schema 2020-12.

#### `default?: string`

### `MultiSelectEnumSchema`

```ts
MultiSelectEnumSchema:
  | UntitledMultiSelectEnumSchema
  | TitledMultiSelectEnumSchema
```

### `NumberSchema`

```ts
interface NumberSchema {
  type: "number" | "integer";
  title?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  default?: number;
}
```

#### `type: "number" | "integer"`

#### `title?: string`

#### `description?: string`

#### `minimum?: number`

#### `maximum?: number`

#### `default?: number`

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

### `SingleSelectEnumSchema`

```ts
SingleSelectEnumSchema:
  | UntitledSingleSelectEnumSchema
  | TitledSingleSelectEnumSchema
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
  default?: string;
}
```

#### `type: "string"`

#### `title?: string`

#### `description?: string`

#### `minLength?: number`

#### `maxLength?: number`

#### `format?: "uri" | "email" | "date" | "date-time"`

#### `default?: string`

### `TitledMultiSelectEnumSchema`

Schema for multiple-selection enumeration with display titles for each option.

```ts
interface TitledMultiSelectEnumSchema {
  type: "array";
  title?: string;
  description?: string;
  minItems?: number;
  maxItems?: number;
  items: { anyOf: { const: string; title: string }[] };
  default?: string[];
}
```

#### `type: "array"`

#### `title?: string`

Optional title for the enum field.

#### `description?: string`

Optional description for the enum field.

#### `minItems?: number`

Minimum number of items to select.

#### `maxItems?: number`

Maximum number of items to select.

#### `items: { anyOf: { const: string; title: string }[] }`

Schema for array items with enum options and display labels.

#### `default?: string[]`

Optional default value.

### `TitledSingleSelectEnumSchema`

Schema for single-selection enumeration with display titles for each option.

```ts
interface TitledSingleSelectEnumSchema {
  type: "string";
  title?: string;
  description?: string;
  oneOf: { const: string; title: string }[];
  default?: string;
}
```

#### `type: "string"`

#### `title?: string`

Optional title for the enum field.

#### `description?: string`

Optional description for the enum field.

#### `oneOf: { const: string; title: string }[]`

Array of enum options with values and display labels.

#### `default?: string`

Optional default value.

### `UntitledMultiSelectEnumSchema`

Schema for multiple-selection enumeration without display titles for options.

```ts
interface UntitledMultiSelectEnumSchema {
  type: "array";
  title?: string;
  description?: string;
  minItems?: number;
  maxItems?: number;
  items: { type: "string"; enum: string[] };
  default?: string[];
}
```

#### `type: "array"`

#### `title?: string`

Optional title for the enum field.

#### `description?: string`

Optional description for the enum field.

#### `minItems?: number`

Minimum number of items to select.

#### `maxItems?: number`

Maximum number of items to select.

#### `items: { type: "string"; enum: string[] }`

Schema for the array items.

#### `default?: string[]`

Optional default value.

### `UntitledSingleSelectEnumSchema`

Schema for single-selection enumeration without display titles for options.

```ts
interface UntitledSingleSelectEnumSchema {
  type: "string";
  title?: string;
  description?: string;
  enum: string[];
  default?: string;
}
```

#### `type: "string"`

#### `title?: string`

Optional title for the enum field.

#### `description?: string`

Optional description for the enum field.

#### `enum: string[]`

Array of enum values to choose from.

#### `default?: string`

Optional default value.

## `initialize`

### `InitializeRequest`

This request is sent from the client to the server when it first connects, asking it to begin initialization.

```ts
interface InitializeRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "initialize";
  params: InitializeRequestParams;
}
```

#### `method: "initialize"`

#### `params: InitializeRequestParams`

### `InitializeRequestParams`

Parameters for an `initialize` request.

```ts
interface InitializeRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: Implementation;
}
```

#### `protocolVersion: string`

The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.

#### `capabilities: ClientCapabilities`

#### `clientInfo: Implementation`

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
  sampling?: { context?: object; tools?: object };
  elicitation?: { form?: object; url?: object };
  tasks?: {
    list?: object;
    cancel?: object;
    requests?: {
      sampling?: { createMessage?: object };
      elicitation?: { create?: object };
    };
  };
}
```

#### `experimental?: { [key: string]: object }`

Experimental, non-standard capabilities that the client supports.

#### `roots?: { listChanged?: boolean }`

Present if the client supports listing roots.

#### `sampling?: { context?: object; tools?: object }`

Present if the client supports sampling from an LLM.

#### `elicitation?: { form?: object; url?: object }`

Present if the client supports elicitation from the server.

#### `tasks?: {    list?: object;    cancel?: object;    requests?: {        sampling?: { createMessage?: object };        elicitation?: { create?: object };    }; }`

Present if the client supports task-augmented requests.

### `Implementation`

Describes the MCP implementation.

```ts
interface Implementation {
  icons?: Icon[];
  name: string;
  title?: string;
  version: string;
  description?: string;
  websiteUrl?: string;
}
```

#### `version: string`

#### `description?: string`

An optional human-readable description of what this implementation does.

This can be used by clients or servers to provide context about their purpose
and capabilities. For example, a server might describe the types of resources
or tools it provides, while a client might describe its intended use case.

#### `websiteUrl?: string`

An optional URL of the website for this implementation.

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
  tasks?: {
    list?: object;
    cancel?: object;
    requests?: { tools?: { call?: object } };
  };
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

#### `tasks?: {    list?: object;    cancel?: object;    requests?: { tools?: { call?: object } }; }`

Present if the server supports task-augmented requests.

## `logging/setLevel`

### `SetLevelRequest`

A request from the client to the server, to enable or adjust logging.

```ts
interface SetLevelRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "logging/setLevel";
  params: SetLevelRequestParams;
}
```

#### `method: "logging/setLevel"`

#### `params: SetLevelRequestParams`

### `SetLevelRequestParams`

Parameters for a `logging/setLevel` request.

```ts
interface SetLevelRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  level: LoggingLevel;
}
```

#### `level: LoggingLevel`

The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/message.

## `notifications/cancelled`

### `CancelledNotification`

This notification can be sent by either side to indicate that it is cancelling a previously-issued request.

The request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.

This notification indicates that the result will be unused, so any associated processing SHOULD cease.

A client MUST NOT attempt to cancel its `initialize` request.

For task cancellation, use the `tasks/cancel` request instead of this notification.

```ts
interface CancelledNotification {
  jsonrpc: "2.0";
  method: "notifications/cancelled";
  params: CancelledNotificationParams;
}
```

#### `method: "notifications/cancelled"`

#### `params: CancelledNotificationParams`

### `CancelledNotificationParams`

Parameters for a `notifications/cancelled` notification.

```ts
interface CancelledNotificationParams {
  _meta?: { [key: string]: unknown };
  requestId?: RequestId;
  reason?: string;
}
```

#### `requestId?: RequestId`

The ID of the request to cancel.

This MUST correspond to the ID of a request previously issued in the same direction.
This MUST be provided for cancelling non-task requests.
This MUST NOT be used for cancelling tasks (use the `tasks/cancel` request instead).

#### `reason?: string`

An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.

## `notifications/initialized`

### `InitializedNotification`

This notification is sent from the client to the server after initialization has finished.

```ts
interface InitializedNotification {
  jsonrpc: "2.0";
  method: "notifications/initialized";
  params?: NotificationParams;
}
```

#### `method: "notifications/initialized"`

#### `params?: NotificationParams`

## `notifications/tasks/status`

### `TaskStatusNotification`

An optional notification from the receiver to the requestor, informing them that a task's status has changed. Receivers are not required to send these notifications.

```ts
interface TaskStatusNotification {
  jsonrpc: "2.0";
  method: "notifications/tasks/status";
  params: TaskStatusNotificationParams;
}
```

#### `method: "notifications/tasks/status"`

#### `params: TaskStatusNotificationParams`

### `TaskStatusNotificationParams`

Parameters for a `notifications/tasks/status` notification.

```ts
TaskStatusNotificationParams: NotificationParams & Task
```

## `notifications/message`

### `LoggingMessageNotification`

JSONRPCNotification of a log message passed from server to client. If no logging/setLevel request has been sent from the client, the server MAY decide which messages to send automatically.

```ts
interface LoggingMessageNotification {
  jsonrpc: "2.0";
  method: "notifications/message";
  params: LoggingMessageNotificationParams;
}
```

#### `method: "notifications/message"`

#### `params: LoggingMessageNotificationParams`

### `LoggingMessageNotificationParams`

Parameters for a `notifications/message` notification.

```ts
interface LoggingMessageNotificationParams {
  _meta?: { [key: string]: unknown };
  level: LoggingLevel;
  logger?: string;
  data: unknown;
}
```

#### `level: LoggingLevel`

The severity of this log message.

#### `logger?: string`

An optional name of the logger issuing this message.

#### `data: unknown`

The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.

## `notifications/progress`

### `ProgressNotification`

An out-of-band notification used to inform the receiver of a progress update for a long-running request.

```ts
interface ProgressNotification {
  jsonrpc: "2.0";
  method: "notifications/progress";
  params: ProgressNotificationParams;
}
```

#### `method: "notifications/progress"`

#### `params: ProgressNotificationParams`

### `ProgressNotificationParams`

Parameters for a `notifications/progress` notification.

```ts
interface ProgressNotificationParams {
  _meta?: { [key: string]: unknown };
  progressToken: ProgressToken;
  progress: number;
  total?: number;
  message?: string;
}
```

#### `progressToken: ProgressToken`

The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.

#### `progress: number`

The progress thus far. This should increase every time progress is made, even if the total is unknown.

#### `total?: number`

Total number of items to process (or total progress required), if known.

#### `message?: string`

An optional message describing the current progress.

## `notifications/prompts/list_changed`

### `PromptListChangedNotification`

An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This may be issued by servers without any previous subscription from the client.

```ts
interface PromptListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/prompts/list_changed";
  params?: NotificationParams;
}
```

#### `method: "notifications/prompts/list_changed"`

#### `params?: NotificationParams`

## `notifications/resources/list_changed`

### `ResourceListChangedNotification`

An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This may be issued by servers without any previous subscription from the client.

```ts
interface ResourceListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/resources/list_changed";
  params?: NotificationParams;
}
```

#### `method: "notifications/resources/list_changed"`

#### `params?: NotificationParams`

## `notifications/resources/updated`

### `ResourceUpdatedNotification`

A notification from the server to the client, informing it that a resource has changed and may need to be read again. This should only be sent if the client previously sent a resources/subscribe request.

```ts
interface ResourceUpdatedNotification {
  jsonrpc: "2.0";
  method: "notifications/resources/updated";
  params: ResourceUpdatedNotificationParams;
}
```

#### `method: "notifications/resources/updated"`

#### `params: ResourceUpdatedNotificationParams`

### `ResourceUpdatedNotificationParams`

Parameters for a `notifications/resources/updated` notification.

```ts
interface ResourceUpdatedNotificationParams {
  _meta?: { [key: string]: unknown };
  uri: string;
}
```

#### `uri: string`

The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.

## `notifications/roots/list_changed`

### `RootsListChangedNotification`

A notification from the client to the server, informing it that the list of roots has changed.
This notification should be sent whenever the client adds, removes, or modifies any root.
The server should then request an updated list of roots using the ListRootsRequest.

```ts
interface RootsListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/roots/list_changed";
  params?: NotificationParams;
}
```

#### `method: "notifications/roots/list_changed"`

#### `params?: NotificationParams`

## `notifications/tools/list_changed`

### `ToolListChangedNotification`

An optional notification from the server to the client, informing it that the list of tools it offers has changed. This may be issued by servers without any previous subscription from the client.

```ts
interface ToolListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/tools/list_changed";
  params?: NotificationParams;
}
```

#### `method: "notifications/tools/list_changed"`

#### `params?: NotificationParams`

## `notifications/elicitation/complete`

### `ElicitationCompleteNotification`

An optional notification from the server to the client, informing it of a completion of a out-of-band elicitation request.

```ts
interface ElicitationCompleteNotification {
  jsonrpc: "2.0";
  method: "notifications/elicitation/complete";
  params: { elicitationId: string };
}
```

#### `method: "notifications/elicitation/complete"`

#### `params: { elicitationId: string }`

The ID of the elicitation that completed.

## `ping`

### `PingRequest`

A ping, issued by either the server or the client, to check that the other party is still alive. The receiver must promptly respond, or else may be disconnected.

```ts
interface PingRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "ping";
  params?: RequestParams;
}
```

#### `method: "ping"`

#### `params?: RequestParams`

## `tasks`

### `CreateTaskResult`

A response to a task-augmented request.

```ts
interface CreateTaskResult {
  _meta?: { [key: string]: unknown };
  task: Task;
  [key: string]: unknown;
}
```

#### `task: Task`

### `RelatedTaskMetadata`

Metadata for associating messages with a task.
Include this in the `_meta` field under the key `io.modelcontextprotocol/related-task`.

```ts
interface RelatedTaskMetadata {
  taskId: string;
}
```

#### `taskId: string`

The task identifier this message is associated with.

### `Task`

Data associated with a task.

```ts
interface Task {
  taskId: string;
  status: TaskStatus;
  statusMessage?: string;
  createdAt: string;
  lastUpdatedAt: string;
  ttl: number | null;
  pollInterval?: number;
}
```

#### `taskId: string`

The task identifier.

#### `status: TaskStatus`

Current task state.

#### `statusMessage?: string`

Optional human-readable message describing the current task state.
This can provide context for any status, including:  Reasons for "cancelled" status Summaries for "completed" status Diagnostic information for "failed" status (e.g., error details, what went wrong)

#### `createdAt: string`

ISO 8601 timestamp when the task was created.

#### `lastUpdatedAt: string`

ISO 8601 timestamp when the task was last updated.

#### `ttl: number | null`

Actual retention duration from creation in milliseconds, null for unlimited.

#### `pollInterval?: number`

Suggested polling interval in milliseconds.

### `TaskMetadata`

Metadata for augmenting a request with task execution.
Include this in the `task` field of the request parameters.

```ts
interface TaskMetadata {
  ttl?: number;
}
```

#### `ttl?: number`

Requested duration in milliseconds to retain task from creation.

### `TaskStatus`

The status of a task.

```ts
TaskStatus: "working" | "input_required" | "completed" | "failed" | "cancelled"
```

## `tasks/get`

### `GetTaskRequest`

A request to retrieve the state of a task.

```ts
interface GetTaskRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "tasks/get";
  params: { taskId: string };
}
```

#### `method: "tasks/get"`

#### `params: { taskId: string }`

The task identifier to query.

### `GetTaskResult`

The response to a tasks/get request.

```ts
GetTaskResult: Result & Task
```

## `tasks/result`

### `GetTaskPayloadRequest`

A request to retrieve the result of a completed task.

```ts
interface GetTaskPayloadRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "tasks/result";
  params: { taskId: string };
}
```

#### `method: "tasks/result"`

#### `params: { taskId: string }`

The task identifier to retrieve results for.

### `GetTaskPayloadResult`

The response to a tasks/result request.
The structure matches the result type of the original request.
For example, a tools/call task would return the CallToolResult structure.

```ts
interface GetTaskPayloadResult {
  _meta?: { [key: string]: unknown };
  [key: string]: unknown;
}
```

## `tasks/list`

### `ListTasksRequest`

A request to retrieve a list of tasks.

```ts
interface ListTasksRequest {
  jsonrpc: "2.0";
  id: RequestId;
  params?: PaginatedRequestParams;
  method: "tasks/list";
}
```

#### `method: "tasks/list"`

### `ListTasksResult`

The response to a tasks/list request.

```ts
interface ListTasksResult {
  _meta?: { [key: string]: unknown };
  nextCursor?: string;
  tasks: Task[];
  [key: string]: unknown;
}
```

#### `tasks: Task[]`

## `tasks/cancel`

### `CancelTaskRequest`

A request to cancel a task.

```ts
interface CancelTaskRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "tasks/cancel";
  params: { taskId: string };
}
```

#### `method: "tasks/cancel"`

#### `params: { taskId: string }`

The task identifier to cancel.

### `CancelTaskResult`

The response to a tasks/cancel request.

```ts
CancelTaskResult: Result & Task
```

## `prompts/get`

### `GetPromptRequest`

Used by the client to get a prompt provided by the server.

```ts
interface GetPromptRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "prompts/get";
  params: GetPromptRequestParams;
}
```

#### `method: "prompts/get"`

#### `params: GetPromptRequestParams`

### `GetPromptRequestParams`

Parameters for a `prompts/get` request.

```ts
interface GetPromptRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  name: string;
  arguments?: { [key: string]: string };
}
```

#### `name: string`

The name of the prompt or prompt template.

#### `arguments?: { [key: string]: string }`

Arguments to use for templating the prompt.

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
  jsonrpc: "2.0";
  id: RequestId;
  params?: PaginatedRequestParams;
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
  icons?: Icon[];
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
  jsonrpc: "2.0";
  id: RequestId;
  params?: PaginatedRequestParams;
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
  icons?: Icon[];
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
  jsonrpc: "2.0";
  id: RequestId;
  method: "resources/read";
  params: ReadResourceRequestParams;
}
```

#### `method: "resources/read"`

#### `params: ReadResourceRequestParams`

### `ReadResourceRequestParams`

Parameters for a `resources/read` request.

```ts
interface ReadResourceRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  uri: string;
}
```

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
  jsonrpc: "2.0";
  id: RequestId;
  method: "resources/subscribe";
  params: SubscribeRequestParams;
}
```

#### `method: "resources/subscribe"`

#### `params: SubscribeRequestParams`

### `SubscribeRequestParams`

Parameters for a `resources/subscribe` request.

```ts
interface SubscribeRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  uri: string;
}
```

## `resources/templates/list`

### `ListResourceTemplatesRequest`

Sent from the client to request a list of resource templates the server has.

```ts
interface ListResourceTemplatesRequest {
  jsonrpc: "2.0";
  id: RequestId;
  params?: PaginatedRequestParams;
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
  icons?: Icon[];
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
  jsonrpc: "2.0";
  id: RequestId;
  method: "resources/unsubscribe";
  params: UnsubscribeRequestParams;
}
```

#### `method: "resources/unsubscribe"`

#### `params: UnsubscribeRequestParams`

### `UnsubscribeRequestParams`

Parameters for a `resources/unsubscribe` request.

```ts
interface UnsubscribeRequestParams {
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  uri: string;
}
```

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
  jsonrpc: "2.0";
  id: RequestId;
  method: "roots/list";
  params?: RequestParams;
}
```

#### `method: "roots/list"`

#### `params?: RequestParams`

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
  jsonrpc: "2.0";
  id: RequestId;
  method: "sampling/createMessage";
  params: CreateMessageRequestParams;
}
```

#### `method: "sampling/createMessage"`

#### `params: CreateMessageRequestParams`

### `CreateMessageRequestParams`

Parameters for a `sampling/createMessage` request.

```ts
interface CreateMessageRequestParams {
  task?: TaskMetadata;
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  messages: SamplingMessage[];
  modelPreferences?: ModelPreferences;
  systemPrompt?: string;
  includeContext?: "none" | "thisServer" | "allServers";
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: object;
  tools?: Tool[];
  toolChoice?: ToolChoice;
}
```

#### `messages: SamplingMessage[]`

#### `modelPreferences?: ModelPreferences`

The server's preferences for which model to select. The client MAY ignore these preferences.

#### `systemPrompt?: string`

An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.

#### `includeContext?: "none" | "thisServer" | "allServers"`

A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
The client MAY ignore this request.

Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.

#### `temperature?: number`

#### `maxTokens: number`

The requested maximum number of tokens to sample (to prevent runaway completions).

The client MAY choose to sample fewer tokens than the requested maximum.

#### `stopSequences?: string[]`

#### `metadata?: object`

Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.

#### `tools?: Tool[]`

Tools that the model may use during generation.
The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.

#### `toolChoice?: ToolChoice`

Controls how the model uses tools.
The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
Default is `{ mode: "auto" }`.

### `CreateMessageResult`

The client's response to a sampling/createMessage request from the server.
The client should inform the user before returning the sampled message, to allow them
to inspect the response (human in the loop) and decide whether to allow the server to see it.

```ts
interface CreateMessageResult {
  _meta?: { [key: string]: unknown };
  model: string;
  stopReason?: string;
  role: Role;
  content: SamplingMessageContentBlock | SamplingMessageContentBlock[];
  [key: string]: unknown;
}
```

#### `model: string`

The name of the model that generated the message.

#### `stopReason?: string`

The reason why sampling stopped, if known.

Standard values:  "endTurn": Natural end of the assistant's turn "stopSequence": A stop sequence was encountered "maxTokens": Maximum token limit was reached "toolUse": The model wants to use one or more tools  This field is an open string to allow for provider-specific stop reasons.

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
  content: SamplingMessageContentBlock | SamplingMessageContentBlock[];
  _meta?: { [key: string]: unknown };
}
```

#### `role: Role`

#### `content: SamplingMessageContentBlock | SamplingMessageContentBlock[]`

#### `_meta?: { [key: string]: unknown }`

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `SamplingMessageContentBlock`

```ts
SamplingMessageContentBlock:
  | TextContent
  | ImageContent
  | AudioContent
  | ToolUseContent
  | ToolResultContent
```

### `ToolChoice`

Controls tool selection behavior for sampling requests.

```ts
interface ToolChoice {
  mode?: "none" | "required" | "auto";
}
```

#### `mode?: "none" | "required" | "auto"`

Controls the tool use ability of the model:  "auto": Model decides whether to use tools (default) "required": Model MUST use at least one tool before completing "none": Model MUST NOT use any tools

### `ToolResultContent`

The result of a tool use, provided by the user back to the assistant.

```ts
interface ToolResultContent {
  type: "tool_result";
  toolUseId: string;
  content: ContentBlock[];
  structuredContent?: { [key: string]: unknown };
  isError?: boolean;
  _meta?: { [key: string]: unknown };
}
```

#### `type: "tool_result"`

#### `toolUseId: string`

The ID of the tool use this result corresponds to.

This MUST match the ID from a previous ToolUseContent.

#### `content: ContentBlock[]`

The unstructured result content of the tool use.

This has the same format as CallToolResult.content and can include text, images,
audio, resource links, and embedded resources.

#### `structuredContent?: { [key: string]: unknown }`

An optional structured result object.

If the tool defined an outputSchema, this SHOULD conform to that schema.

#### `isError?: boolean`

Whether the tool use resulted in an error.

If true, the content typically describes the error that occurred.
Default: false

#### `_meta?: { [key: string]: unknown }`

Optional metadata about the tool result. Clients SHOULD preserve this field when
including tool results in subsequent sampling requests to enable caching optimizations.

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

### `ToolUseContent`

A request from the assistant to call a tool.

```ts
interface ToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: { [key: string]: unknown };
  _meta?: { [key: string]: unknown };
}
```

#### `type: "tool_use"`

#### `id: string`

A unique identifier for this tool use.

This ID is used to match tool results to their corresponding tool uses.

#### `name: string`

The name of the tool to call.

#### `input: { [key: string]: unknown }`

The arguments to pass to the tool, conforming to the tool's input schema.

#### `_meta?: { [key: string]: unknown }`

Optional metadata about the tool use. Clients SHOULD preserve this field when
including tool uses in subsequent sampling requests to enable caching optimizations.

See [General fields: `_meta`](basic.md#meta) for notes on `_meta` usage.

## `tools/call`

### `CallToolRequest`

Used by the client to invoke a tool provided by the server.

```ts
interface CallToolRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "tools/call";
  params: CallToolRequestParams;
}
```

#### `method: "tools/call"`

#### `params: CallToolRequestParams`

### `CallToolRequestParams`

Parameters for a `tools/call` request.

```ts
interface CallToolRequestParams {
  task?: TaskMetadata;
  _meta?: { progressToken?: ProgressToken; [key: string]: unknown };
  name: string;
  arguments?: { [key: string]: unknown };
}
```

#### `name: string`

The name of the tool.

#### `arguments?: { [key: string]: unknown }`

Arguments to use for the tool call.

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
  jsonrpc: "2.0";
  id: RequestId;
  params?: PaginatedRequestParams;
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
  icons?: Icon[];
  name: string;
  title?: string;
  description?: string;
  inputSchema: {
    $schema?: string;
    type: "object";
    properties?: { [key: string]: object };
    required?: string[];
  };
  execution?: ToolExecution;
  outputSchema?: {
    $schema?: string;
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

#### `inputSchema: {    $schema?: string;    type: "object";    properties?: { [key: string]: object };    required?: string[]; }`

A JSON Schema object defining the expected parameters for the tool.

#### `execution?: ToolExecution`

Execution-related properties for this tool.

#### `outputSchema?: {    $schema?: string;    type: "object";    properties?: { [key: string]: object };    required?: string[]; }`

An optional JSON Schema object defining the structure of the tool's output returned in
the structuredContent field of a CallToolResult.

Defaults to JSON Schema 2020-12 when no explicit $schema is provided.
Currently restricted to type: "object" at the root level.

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
will have no additional effect on its environment.

(This property is meaningful only when `readOnlyHint == false`)

Default: false

#### `openWorldHint?: boolean`

If true, this tool may interact with an "open world" of external
entities. If false, the tool's domain of interaction is closed.
For example, the world of a web search tool is open, whereas that
of a memory tool is not.

Default: true

### `ToolExecution`

Execution-related properties for a tool.

```ts
interface ToolExecution {
  taskSupport?: "forbidden" | "optional" | "required";
}
```

#### `taskSupport?: "forbidden" | "optional" | "required"`

Indicates whether this tool supports task-augmented execution.
This allows clients to handle long-running operations through polling
the task system.  "forbidden": Tool does not support task-augmented execution (default when absent) "optional": Tool may support task-augmented execution "required": Tool requires task-augmented execution  Default: "forbidden"
