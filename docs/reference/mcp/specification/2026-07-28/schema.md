---
title: Schema Reference
section: specification
version: 2026-07-28
source: "https://modelcontextprotocol.io/specification/2026-07-28/schema"
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

A result that indicates success but carries no data.

```ts
EmptyResult: Result
```

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

Consumers SHOULD take steps to ensure URLs serving icons are from the
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

Optional specifier for the theme this icon is designed for. `"light"` indicates
the icon is designed to be used with a light background, and `"dark"` indicates
the icon is designed to be used with a dark background.

If not provided, the client should assume the icon can be used with any theme.

### `InputResponseRequestParams`

Common params for any request.

```ts
interface InputResponseRequestParams {
  _meta: RequestMetaObject;
  inputResponses?: InputResponses;
  requestState?: string;
}
```

#### `inputResponses?: InputResponses`

#### `requestState?: string`

### `JSONArray`

```ts
JSONArray: JSONValue[]
```

### `JSONObject`

```ts
JSONObject: { [key: string]: JSONValue }
```

### `JSONValue`

```ts
JSONValue: string | number | boolean | null | JSONObject | JSONArray
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

### `MetaObject`

Represents the contents of a `_meta` field, which clients and servers use to attach additional metadata to their interactions.

Certain key names are reserved by MCP for protocol-level metadata; implementations MUST NOT make assumptions about values at these keys. Additionally, specific schema definitions may reserve particular names for purpose-specific metadata, as declared in those definitions.

Valid keys have two segments:

Prefix:  Optional — if specified, MUST be a series of labels separated by dots (`.`), followed by a slash (`/`). Labels MUST start with a letter and end with a letter or digit. Interior characters may be letters, digits, or hyphens (`-`). Implementations SHOULD use reverse DNS notation (e.g., `com.example/` rather than `example.com/`). Any prefix where the second label is `modelcontextprotocol` or `mcp` is reserved for MCP use. For example: `io.modelcontextprotocol/`, `dev.mcp/`, `org.modelcontextprotocol.api/`, and `com.mcp.tools/` are all reserved. However, `com.example.mcp/` is NOT reserved, as the second label is `example`.  Name:  Unless empty, MUST start and end with an alphanumeric character (`[a-z0-9A-Z]`). Interior characters may be alphanumeric, hyphens (`-`), underscores (`_`), or dots (`.`).

```ts
MetaObject: Record\string, unknown>
```

### `NotificationMetaObject`

Extends [MetaObject](#metaobject) with additional notification-specific fields. All key naming rules from `MetaObject` apply.

```ts
interface NotificationMetaObject {
  "io.modelcontextprotocol/subscriptionId"?: RequestId;
  [key: string]: unknown;
}
```

#### `"io.modelcontextprotocol/subscriptionId"?: RequestId`

Identifies the subscription stream a notification was delivered on. The
server MUST include this key on every notification delivered via a [subscriptions/listen](#subscriptionslistenrequest) stream, so the
client can correlate the notification with the originating subscription.
The key is absent on notifications not delivered via a subscription
stream (e.g. progress notifications for an in-flight request), which is
why it is optional here.

The value is the JSON-RPC ID of the `subscriptions/listen` request that
opened the stream.

### `NotificationParams`

Common params for any notification.

```ts
interface NotificationParams {
  _meta?: NotificationMetaObject;
}
```

#### `_meta?: NotificationMetaObject`

### `PaginatedRequestParams`

Common params for paginated requests.

```ts
interface PaginatedRequestParams {
  _meta: RequestMetaObject;
  cursor?: string;
}
```

#### `cursor?: string`

An opaque token representing the current pagination position.
If provided, the server should return results starting after this cursor.

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

### `RequestMetaObject`

Extends [MetaObject](#metaobject) with additional request-specific fields. All key naming rules from `MetaObject` apply.

```ts
interface RequestMetaObject {
  progressToken?: ProgressToken;
  "io.modelcontextprotocol/protocolVersion": string;
  "io.modelcontextprotocol/clientInfo"?: Implementation;
  "io.modelcontextprotocol/clientCapabilities": ClientCapabilities;
  "io.modelcontextprotocol/logLevel"?: LoggingLevel;
  [key: string]: unknown;
}
```

#### `progressToken?: ProgressToken`

If specified, the caller is requesting out-of-band progress notifications for this request (as represented by [notifications/progress](#progressnotification)). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.

#### `"io.modelcontextprotocol/protocolVersion": string`

The MCP Protocol Version being used for this request. Required.

For the HTTP transport, this value MUST match the `MCP-Protocol-Version`
header; otherwise the server MUST return a `400 Bad Request`. If the
server does not support the requested version, it MUST return an [UnsupportedProtocolVersionError](#unsupportedprotocolversionerror).

#### `"io.modelcontextprotocol/clientInfo"?: Implementation`

Identifies the client software making the request. Clients SHOULD
include this field on every request unless specifically configured not
to do so.

The [Implementation](#implementation) schema requires `name` and `version`; other
fields are optional.

The value is self-reported by the client and is not verified by the
protocol. It is intended for display, logging, and debugging. Servers
SHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for
security decisions.

#### `"io.modelcontextprotocol/clientCapabilities": ClientCapabilities`

The client's capabilities for this specific request. Required.

Capabilities are declared per-request rather than once at initialization;
an empty object means the client supports no optional capabilities.
Servers MUST NOT infer capabilities from prior requests.

### `RequestParams`

Common params for any request.

```ts
interface RequestParams {
  _meta: RequestMetaObject;
}
```

#### `_meta: RequestMetaObject`

### `Result`

Common result fields.

```ts
interface Result {
  _meta?: ResultMetaObject;
  resultType: string;
  [key: string]: unknown;
}
```

#### `_meta?: ResultMetaObject`

#### `resultType: string`

Indicates the type of the result, which allows the client to determine
how to parse the result object.

Servers implementing this protocol version MUST include this field.
For backward compatibility, when a client receives a result from a
server implementing an earlier protocol version (which does not include `resultType`), the client MUST treat the absent field as `"complete"`.

### `ResultMetaObject`

Extends [MetaObject](#metaobject) with additional result-specific fields. All key naming rules from `MetaObject` apply.

```ts
interface ResultMetaObject {
  "io.modelcontextprotocol/serverInfo"?: Implementation;
  [key: string]: unknown;
}
```

#### `"io.modelcontextprotocol/serverInfo"?: Implementation`

Identifies the server software producing the response. Servers SHOULD
include this field on every response unless specifically configured not
to do so.

The [Implementation](#implementation) schema requires `name` and `version`; other
fields are optional.

The value is self-reported by the server and is not verified by the
protocol. It is intended for display, logging, and debugging. Clients
SHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for
security decisions.

### `ResultType`

Indicates the type of a [Result](#result) object, allowing the client to
determine how to parse the response.

complete - the request completed successfully and the result contains the final content.
input_required - the request requires additional input and the result contains an [InputRequiredResult](#inputrequiredresult) object with instructions for the client to provide additional input before retrying the original request.

```ts
ResultType: "complete" | "input_required" | string
```

### `Role`

The sender or recipient of messages and data in a conversation.

```ts
Role: "user" | "assistant"
```

## Errors

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

### `HEADER_MISMATCH`

Error code returned when the HTTP headers of a request do not match the
corresponding values in the request body, or required headers are
missing or malformed.

```ts
HEADER_MISMATCH: -32020
```

### `HeaderMismatchError`

Returned when a server rejects a request because the values in the HTTP
headers do not match the corresponding values in the request body, or
because required headers are missing or malformed. For HTTP, the response
status code MUST be `400 Bad Request`.

```ts
interface HeaderMismatchError {
  jsonrpc: "2.0";
  id?: RequestId;
  error: Error & { code: -32020 };
}
```

#### `error: Error & { code: -32020 }`

### `InternalError`

A JSON-RPC error indicating that an internal error occurred on the receiver. This error is returned when the receiver encounters an unexpected condition that prevents it from fulfilling the request.

```ts
interface InternalError {
  message: string;
  data?: unknown;
  code: -32603;
}
```

#### `code: -32603`

The error type that occurred.

### `InvalidParamsError`

A JSON-RPC error indicating that the method parameters are invalid or malformed.

In MCP, this error is returned in various contexts when request parameters fail validation:  Tools: Unknown tool name or invalid tool arguments Prompts: Unknown prompt name or missing required arguments Pagination: Invalid or expired cursor values Logging: Invalid log level Elicitation: Server requests an elicitation mode not declared in client capabilities Sampling: Missing tool result or tool results mixed with other content

```ts
interface InvalidParamsError {
  message: string;
  data?: unknown;
  code: -32602;
}
```

#### `code: -32602`

The error type that occurred.

### `InvalidRequestError`

A JSON-RPC error indicating that the request is not a valid request object. This error is returned when the message structure does not conform to the JSON-RPC 2.0 specification requirements for a request (e.g., missing required fields like `jsonrpc` or `method`, or using invalid types for these fields).

```ts
interface InvalidRequestError {
  message: string;
  data?: unknown;
  code: -32600;
}
```

#### `code: -32600`

The error type that occurred.

### `MethodNotFoundError`

A JSON-RPC error indicating that the requested method does not exist or is not available.

In MCP, a server returns this error when a client invokes a method the server does not implement — either a genuinely unknown method, or one gated behind a server capability the server did not advertise (e.g., calling `prompts/list` when the `prompts` capability was not advertised).

A request that requires a client capability the client did not declare is signalled instead by [MissingRequiredClientCapabilityError](#missingrequiredclientcapabilityerror) (`-32021`).

```ts
interface MethodNotFoundError {
  message: string;
  data?: unknown;
  code: -32601;
}
```

#### `code: -32601`

The error type that occurred.

### `MISSING_REQUIRED_CLIENT_CAPABILITY`

Error code returned when a server requires a client capability that was
not declared in the request's `clientCapabilities`.

```ts
MISSING_REQUIRED_CLIENT_CAPABILITY: -32021
```

### `MissingRequiredClientCapabilityError`

Returned when processing a request requires a capability the client did not
declare in `clientCapabilities`. For HTTP, the response status code MUST be `400 Bad Request`.

```ts
interface MissingRequiredClientCapabilityError {
  jsonrpc: "2.0";
  id?: RequestId;
  error: Error & {
    code: -32021;
    data: { requiredCapabilities: ClientCapabilities };
  };
}
```

#### `error: Error & {    code: -32021;    data: { requiredCapabilities: ClientCapabilities }; }`

### `ParseError`

A JSON-RPC error indicating that invalid JSON was received by the server. This error is returned when the server cannot parse the JSON text of a message.

```ts
interface ParseError {
  message: string;
  data?: unknown;
  code: -32700;
}
```

#### `code: -32700`

The error type that occurred.

### `UNSUPPORTED_PROTOCOL_VERSION`

Error code returned when the request's protocol version is not supported
by the server.

```ts
UNSUPPORTED_PROTOCOL_VERSION: -32022
```

### `UnsupportedProtocolVersionError`

Returned when the request's protocol version is unknown to the server or
unsupported (e.g., a known experimental or draft version the server has
chosen not to implement). For HTTP, the response status code MUST be `400 Bad Request`.

```ts
interface UnsupportedProtocolVersionError {
  jsonrpc: "2.0";
  id?: RequestId;
  error: Error & {
    code: -32022;
    data: { supported: string[]; requested: string };
  };
}
```

#### `error: Error & {    code: -32022;    data: { supported: string[]; requested: string }; }`

## Content

### `AudioContent`

Audio provided to or from an LLM.

```ts
interface AudioContent {
  type: "audio";
  data: string;
  mimeType: string;
  annotations?: Annotations;
  _meta?: MetaObject;
}
```

#### `type: "audio"`

#### `data: string`

The base64-encoded audio data.

#### `mimeType: string`

The MIME type of the audio. Different providers may support different audio types.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: MetaObject`

### `BlobResourceContents`

Example: Image file contents[](#blobresourcecontents-example-image-file-contents){
"uri": "file:///example.png",
"mimeType": "image/png",
"blob": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
} Copy

```ts
interface BlobResourceContents {
  uri: string;
  mimeType?: string;
  _meta?: MetaObject;
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
  _meta?: MetaObject;
}
```

#### `type: "resource"`

#### `resource: TextResourceContents | BlobResourceContents`

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: MetaObject`

### `ImageContent`

An image provided to or from an LLM.

```ts
interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
  annotations?: Annotations;
  _meta?: MetaObject;
}
```

#### `type: "image"`

#### `data: string`

The base64-encoded image data.

#### `mimeType: string`

The MIME type of the image. Different providers may support different image types.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: MetaObject`

### `ResourceLink`

A resource that the server is capable of reading, included in a prompt or tool call result.

Note: resource links returned by tools are not guaranteed to appear in the results of [resources/list](#listresourcesrequest) requests.

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
  _meta?: MetaObject;
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
  _meta?: MetaObject;
}
```

#### `type: "text"`

#### `text: string`

The text content of the message.

#### `annotations?: Annotations`

Optional annotations for the client.

#### `_meta?: MetaObject`

### `TextResourceContents`

Example: Text file contents[](#textresourcecontents-example-text-file-contents){
"uri": "file:///example.txt",
"mimeType": "text/plain",
"text": "Resource content"
} Copy

```ts
interface TextResourceContents {
  uri: string;
  mimeType?: string;
  _meta?: MetaObject;
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
  _meta: RequestMetaObject;
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

### `CompleteResultResponse`

A successful response from the server for a [completion/complete](#completerequest) request.

```ts
interface CompleteResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: CompleteResult;
}
```

#### `result: CompleteResult`

### `CompleteResult`

The result returned by the server for a [completion/complete](#completerequest) request.

```ts
interface CompleteResult {
  _meta?: ResultMetaObject;
  resultType: string;
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

The result returned by the client for an [elicitation/create](#elicitrequest) request.

```ts
interface ElicitResult {
  action: "accept" | "decline" | "cancel";
  content?: { [key: string]: string | number | boolean | string[] };
}
```

#### `action: "accept" | "decline" | "cancel"`

The user action in response to the elicitation.  `"accept"`: User submitted the form/confirmed the action `"decline"`: User explicitly declined the action `"cancel"`: User dismissed without making an explicit choice

#### `content?: { [key: string]: string | number | boolean | string[] }`

The submitted form data, only present when action is `"accept"` and mode was `"form"`.
Contains values matching the requested schema.
Omitted for out-of-band mode responses.

### `BooleanSchema`

Example: Boolean input schema[](#booleanschema-example-boolean-input-schema){
"type": "boolean",
"title": "Display Name",
"description": "Description text",
"default": false
} Copy

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
  mode: "url";
  message: string;
  url: string;
}
```

#### `mode: "url"`

The elicitation mode.

#### `message: string`

The message to present to the user explaining why the interaction is needed.

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

Use [TitledSingleSelectEnumSchema](#titledsingleselectenumschema) instead.
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

Example: Number input schema[](#numberschema-example-number-input-schema){
"type": "number",
"title": "Display Name",
"description": "Description text",
"minimum": 0,
"maximum": 100,
"default": 50
} Copy

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

Example: Email input schema[](#stringschema-example-email-input-schema){
"type": "string",
"title": "Display Name",
"description": "Description text",
"minLength": 3,
"maxLength": 50,
"format": "email",
"default": "[user@example.com](mailto:user@example.com)"
} Copy

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

## `notifications/cancelled`

### `CancelledNotification`

This notification is sent by the client to indicate that it is cancelling a request it previously issued.

On stdio, the server also sends this notification, solely to terminate a [subscriptions/listen](#subscriptionslistenrequest) stream: it references the ID of the `subscriptions/listen` request that opened the stream. Servers MUST NOT use this notification to cancel any other request.

The request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.

This notification indicates that the result will be unused, so any associated processing SHOULD cease.

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
  _meta?: NotificationMetaObject;
  requestId: RequestId;
  reason?: string;
}
```

#### `requestId: RequestId`

The ID of the request to cancel.

This MUST correspond to the ID of a request the client previously issued.

#### `reason?: string`

An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.

## `notifications/message`

### `LoggingMessageNotification`

JSONRPCNotification of a log message passed from server to client. The client opts in by setting `"io.modelcontextprotocol/logLevel"` in a request's `_meta`.

```ts
interface LoggingMessageNotification {
  jsonrpc: "2.0";
  method: "notifications/message";
  params: LoggingMessageNotificationParams;
}
```

### `LoggingMessageNotificationParams`

Parameters for a `notifications/message` notification.

```ts
interface LoggingMessageNotificationParams {
  _meta?: NotificationMetaObject;
  level: LoggingLevel;
  logger?: string;
  data: unknown;
}
```

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

Parameters for a [notifications/progress](#progressnotification) notification.

```ts
interface ProgressNotificationParams {
  _meta?: NotificationMetaObject;
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

An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This is only delivered on a [subscriptions/listen](#subscriptionslistenrequest) stream when the client requested it via the `promptsListChanged` filter field.

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

An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This is only delivered on a [subscriptions/listen](#subscriptionslistenrequest) stream when the client requested it via the `resourcesListChanged` filter field.

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

A notification from the server to the client, informing it that a resource has changed and may need to be read again. This is only sent for resources the client opted in to via the `resourceSubscriptions` field of a [subscriptions/listen](#subscriptionslistenrequest) request.

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
  _meta?: NotificationMetaObject;
  uri: string;
}
```

#### `uri: string`

The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.

## `notifications/subscriptions/acknowledged`

### `SubscriptionsAcknowledgedNotification`

Sent by the server to acknowledge that a [subscriptions/listen](#subscriptionslistenrequest) subscription has been
established and to report which notification types it agreed to honor.

This notification MUST be the first message the server sends carrying the
subscription's ID in `io.modelcontextprotocol/subscriptionId`. The server MUST
NOT send any notification on the subscription before acknowledging it. On
stdio, where every subscription shares one channel, this ordering is defined
per subscription ID and not per channel: messages belonging to other
subscriptions MAY be interleaved before it.

```ts
interface SubscriptionsAcknowledgedNotification {
  jsonrpc: "2.0";
  method: "notifications/subscriptions/acknowledged";
  params: SubscriptionsAcknowledgedNotificationParams;
}
```

#### `method: "notifications/subscriptions/acknowledged"`

#### `params: SubscriptionsAcknowledgedNotificationParams`

### `SubscriptionsAcknowledgedNotificationParams`

Parameters for a [notifications/subscriptions/acknowledged](#subscriptionsacknowledgednotification) notification.

```ts
interface SubscriptionsAcknowledgedNotificationParams {
  _meta?: NotificationMetaObject;
  notifications: SubscriptionFilter;
}
```

#### `notifications: SubscriptionFilter`

The subset of requested notification types the server agreed to honor.
Only includes notification types the server actually supports; if the
client requested an unsupported type (e.g., `promptsListChanged` when
the server has no prompts), it is omitted from this set.

## `notifications/tools/list_changed`

### `ToolListChangedNotification`

An optional notification from the server to the client, informing it that the list of tools it offers has changed. This is only delivered on a [subscriptions/listen](#subscriptionslistenrequest) stream when the client requested it via the `toolsListChanged` filter field.

```ts
interface ToolListChangedNotification {
  jsonrpc: "2.0";
  method: "notifications/tools/list_changed";
  params?: NotificationParams;
}
```

#### `method: "notifications/tools/list_changed"`

#### `params?: NotificationParams`

## Multi Round-Trip

### `InputRequests`

A map of server-initiated requests that the client must fulfill.
Keys are server-assigned identifiers; values are the request objects.

```ts
InputRequests: any
```

### `InputRequiredResult`

An InputRequiredResult sent by the server to indicate that additional input is needed
before the request can be completed.

At least one of `inputRequests` or `requestState` MUST be present.

```ts
interface InputRequiredResult {
  _meta?: ResultMetaObject;
  resultType: string;
  inputRequests?: InputRequests;
  requestState?: string;
  [key: string]: unknown;
}
```

#### `inputRequests?: InputRequests`

#### `requestState?: string`

### `InputResponses`

A map of client responses to server-initiated requests.
Keys correspond to the keys in the [InputRequests](#inputrequests) map;
values are the client's result for each request.

```ts
InputResponses: any
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
  _meta: RequestMetaObject;
  inputResponses?: InputResponses;
  requestState?: string;
  name: string;
  arguments?: { [key: string]: string };
}
```

#### `name: string`

The name of the prompt or prompt template.

#### `arguments?: { [key: string]: string }`

Arguments to use for templating the prompt.

### `GetPromptResultResponse`

A successful response from the server for a [prompts/get](#getpromptrequest) request.

```ts
interface GetPromptResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: InputRequiredResult | GetPromptResult;
}
```

#### `result: InputRequiredResult | GetPromptResult`

### `GetPromptResult`

The result returned by the server for a [prompts/get](#getpromptrequest) request.

```ts
interface GetPromptResult {
  _meta?: ResultMetaObject;
  resultType: string;
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

This is similar to [SamplingMessage](#samplingmessage), but also supports the embedding of
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
  params: PaginatedRequestParams;
  method: "prompts/list";
}
```

#### `method: "prompts/list"`

### `ListPromptsResultResponse`

A successful response from the server for a [prompts/list](#listpromptsrequest) request.

```ts
interface ListPromptsResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: ListPromptsResult;
}
```

#### `result: ListPromptsResult`

### `ListPromptsResult`

The result returned by the server for a [prompts/list](#listpromptsrequest) request.

```ts
interface ListPromptsResult {
  _meta?: ResultMetaObject;
  resultType: string;
  nextCursor?: string;
  ttlMs: number;
  cacheScope: "public" | "private";
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
  _meta?: MetaObject;
}
```

#### `description?: string`

An optional description of what this prompt provides

#### `arguments?: PromptArgument[]`

A list of arguments to use for templating the prompt.

#### `_meta?: MetaObject`

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
  params: PaginatedRequestParams;
  method: "resources/list";
}
```

#### `method: "resources/list"`

### `ListResourcesResultResponse`

A successful response from the server for a [resources/list](#listresourcesrequest) request.

```ts
interface ListResourcesResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: ListResourcesResult;
}
```

#### `result: ListResourcesResult`

### `ListResourcesResult`

The result returned by the server for a [resources/list](#listresourcesrequest) request.

```ts
interface ListResourcesResult {
  _meta?: ResultMetaObject;
  resultType: string;
  nextCursor?: string;
  ttlMs: number;
  cacheScope: "public" | "private";
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
  _meta?: MetaObject;
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

#### `_meta?: MetaObject`

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
  _meta: RequestMetaObject;
  inputResponses?: InputResponses;
  requestState?: string;
  uri: string;
}
```

### `ReadResourceResultResponse`

A successful response from the server for a [resources/read](#readresourcerequest) request.

```ts
interface ReadResourceResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: InputRequiredResult | ReadResourceResult;
}
```

#### `result: InputRequiredResult | ReadResourceResult`

### `ReadResourceResult`

The result returned by the server for a [resources/read](#readresourcerequest) request.

```ts
interface ReadResourceResult {
  _meta?: ResultMetaObject;
  resultType: string;
  ttlMs: number;
  cacheScope: "public" | "private";
  contents: (TextResourceContents | BlobResourceContents)[];
  [key: string]: unknown;
}
```

#### `contents: (TextResourceContents | BlobResourceContents)[]`

## `resources/templates/list`

### `ListResourceTemplatesRequest`

Sent from the client to request a list of resource templates the server has.

```ts
interface ListResourceTemplatesRequest {
  jsonrpc: "2.0";
  id: RequestId;
  params: PaginatedRequestParams;
  method: "resources/templates/list";
}
```

#### `method: "resources/templates/list"`

### `ListResourceTemplatesResultResponse`

A successful response from the server for a [resources/templates/list](#listresourcetemplatesrequest) request.

```ts
interface ListResourceTemplatesResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: ListResourceTemplatesResult;
}
```

#### `result: ListResourceTemplatesResult`

### `ListResourceTemplatesResult`

The result returned by the server for a [resources/templates/list](#listresourcetemplatesrequest) request.

```ts
interface ListResourceTemplatesResult {
  _meta?: ResultMetaObject;
  resultType: string;
  nextCursor?: string;
  ttlMs: number;
  cacheScope: "public" | "private";
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
  _meta?: MetaObject;
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

#### `_meta?: MetaObject`

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
  method: "roots/list";
  params?: { _meta?: MetaObject };
}
```

### `ListRootsResult`

The result returned by the client for a [roots/list](#listrootsrequest) request.
This result contains an array of [Root](#root) objects, each representing a root directory
or file that the server can operate on.

```ts
interface ListRootsResult {
  roots: Root[];
}
```

### `Root`

Represents a root directory or file that the server can operate on.

```ts
interface Root {
  uri: string;
  name?: string;
  _meta?: MetaObject;
}
```

## `sampling/createMessage`

### `CreateMessageRequest`

A request from the server to sample an LLM via the client. The client has full discretion over which model to select. The client should also inform the user before beginning sampling, to allow them to inspect the request (human in the loop) and decide whether to approve it.

```ts
interface CreateMessageRequest {
  method: "sampling/createMessage";
  params: CreateMessageRequestParams;
}
```

### `CreateMessageRequestParams`

Parameters for a `sampling/createMessage` request.

```ts
interface CreateMessageRequestParams {
  messages: SamplingMessage[];
  modelPreferences?: ModelPreferences;
  systemPrompt?: string;
  includeContext?: "none" | "thisServer" | "allServers";
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: JSONObject;
  tools?: Tool[];
  toolChoice?: ToolChoice;
}
```

### `CreateMessageResult`

The result returned by the client for a [sampling/createMessage](#createmessagerequest) request.
The client should inform the user before returning the sampled message, to allow them
to inspect the response (human in the loop) and decide whether to allow the server to see it.

```ts
interface CreateMessageResult {
  model: string;
  stopReason?: string;
  role: Role;
  content: SamplingMessageContentBlock | SamplingMessageContentBlock[];
  _meta?: MetaObject;
}
```

### `ModelHint`

Hints to use for model selection.

Keys not declared here are currently left unspecified by the spec and are up
to the client to interpret.

```ts
interface ModelHint {
  name?: string;
}
```

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

### `SamplingMessage`

Describes a message issued to or received from an LLM API.

```ts
interface SamplingMessage {
  role: Role;
  content: SamplingMessageContentBlock | SamplingMessageContentBlock[];
  _meta?: MetaObject;
}
```

### `SamplingMessageContentBlock`

Deprecated

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

### `ToolResultContent`

The result of a tool use, provided by the user back to the assistant.

```ts
interface ToolResultContent {
  type: "tool_result";
  toolUseId: string;
  content: ContentBlock[];
  structuredContent?: unknown;
  isError?: boolean;
  _meta?: MetaObject;
}
```

### `ToolUseContent`

A request from the assistant to call a tool.

```ts
interface ToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: { [key: string]: unknown };
  _meta?: MetaObject;
}
```

## `server/discover`

### `DiscoverRequest`

A request from the client asking the server to advertise its supported
protocol versions, capabilities, and other metadata. Servers MUST
implement `server/discover`. Clients MAY call it but are not required
to — version negotiation can also happen inline via per-request `_meta`.

```ts
interface DiscoverRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "server/discover";
  params: RequestParams;
}
```

#### `method: "server/discover"`

#### `params: RequestParams`

### `DiscoverResultResponse`

A successful response from the server for a [server/discover](#discoverrequest) request.

```ts
interface DiscoverResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: DiscoverResult;
}
```

#### `result: DiscoverResult`

### `DiscoverResult`

The result returned by the server for a [server/discover](#discoverrequest) request.

```ts
interface DiscoverResult {
  _meta?: ResultMetaObject;
  resultType: string;
  supportedVersions: string[];
  capabilities: ServerCapabilities;
  instructions?: string;
  ttlMs: number;
  cacheScope: "public" | "private";
  [key: string]: unknown;
}
```

#### `supportedVersions: string[]`

MCP Protocol Versions this server supports. The client should choose a
version from this list for use in subsequent requests.

#### `capabilities: ServerCapabilities`

The capabilities of the server.

#### `instructions?: string`

Natural-language guidance describing the server and its features.

This can be used by clients to improve an LLM's understanding of
available tools (e.g., by including it in a system prompt). It should
focus on information that helps the model use the server effectively
and should not duplicate information already in tool descriptions.

### `ClientCapabilities`

Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.

```ts
interface ClientCapabilities {
  experimental?: { [key: string]: JSONObject };
  roots?: {};
  sampling?: { context?: JSONObject; tools?: JSONObject };
  elicitation?: { form?: JSONObject; url?: JSONObject };
  extensions?: { [key: string]: JSONObject };
}
```

#### `experimental?: { [key: string]: JSONObject }`

Experimental, non-standard capabilities that the client supports.

#### `elicitation?: { form?: JSONObject; url?: JSONObject }`

Present if the client supports elicitation from the server.

#### `extensions?: { [key: string]: JSONObject }`

Optional MCP extensions that the client supports. Keys are extension identifiers
(e.g., "io.modelcontextprotocol/oauth-client-credentials"), and values are
per-extension settings objects. An empty object indicates support with no settings.

Keys MUST follow the [`_meta` key naming rules](#metaobject), with a
mandatory prefix.

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

The version of this implementation.

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
  experimental?: { [key: string]: JSONObject };
  logging?: JSONObject;
  completions?: JSONObject;
  prompts?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  tools?: { listChanged?: boolean };
  extensions?: { [key: string]: JSONObject };
}
```

#### `experimental?: { [key: string]: JSONObject }`

Experimental, non-standard capabilities that the server supports.

#### `completions?: JSONObject`

Present if the server supports argument autocompletion suggestions.

#### `prompts?: { listChanged?: boolean }`

Present if the server offers any prompt templates.

#### `resources?: { subscribe?: boolean; listChanged?: boolean }`

Present if the server offers any resources to read.

#### `tools?: { listChanged?: boolean }`

Present if the server offers any tools to call.

#### `extensions?: { [key: string]: JSONObject }`

Optional MCP extensions that the server supports. Keys are extension identifiers
(e.g., "io.modelcontextprotocol/tasks"), and values are per-extension settings
objects. An empty object indicates support with no settings.

Keys MUST follow the [`_meta` key naming rules](#metaobject), with a
mandatory prefix.

## `subscriptions/listen`

### `SubscriptionsListenRequest`

Sent from the client to open a long-lived channel for receiving notifications
outside the context of a specific request. Replaces the previous HTTP GET
endpoint and ensures consistent behavior between HTTP and STDIO.

```ts
interface SubscriptionsListenRequest {
  jsonrpc: "2.0";
  id: RequestId;
  method: "subscriptions/listen";
  params: SubscriptionsListenRequestParams;
}
```

#### `method: "subscriptions/listen"`

#### `params: SubscriptionsListenRequestParams`

### `SubscriptionsListenRequestParams`

Parameters for a [subscriptions/listen](#subscriptionslistenrequest) request.

```ts
interface SubscriptionsListenRequestParams {
  _meta: RequestMetaObject;
  notifications: SubscriptionFilter;
}
```

#### `notifications: SubscriptionFilter`

The notifications the client opts in to on this stream. The server MUST NOT send notification types the client has not explicitly
requested.

### `SubscriptionsListenResultResponse`

A successful response from the server for a [subscriptions/listen](#subscriptionslistenrequest)
request, sent when the server tears the subscription down gracefully.

```ts
interface SubscriptionsListenResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: SubscriptionsListenResult;
}
```

#### `result: SubscriptionsListenResult`

### `SubscriptionsListenResult`

The response to a [subscriptions/listen](#subscriptionslistenrequest)
request, signalling that the subscription has ended gracefully (for example,
during server shutdown). Because the listen stream is long-lived, this result
is sent only when the server tears the subscription down; an abrupt transport
close carries no response. The result body is otherwise empty.

```ts
interface SubscriptionsListenResult {
  resultType: string;
  _meta: SubscriptionsListenResultMetaObject;
  [key: string]: unknown;
}
```

#### `_meta: SubscriptionsListenResultMetaObject`

### `SubscriptionFilter`

The set of notification types a client may opt in to on a [subscriptions/listen](#subscriptionslistenrequest) request.

Each notification type is opt-in; the server MUST NOT send
notification types the client has not explicitly requested here.

```ts
interface SubscriptionFilter {
  toolsListChanged?: boolean;
  promptsListChanged?: boolean;
  resourcesListChanged?: boolean;
  resourceSubscriptions?: string[];
}
```

#### `toolsListChanged?: boolean`

If true, receive [notifications/tools/list_changed](#toollistchangednotification).

#### `promptsListChanged?: boolean`

If true, receive [notifications/prompts/list_changed](#promptlistchangednotification).

#### `resourcesListChanged?: boolean`

If true, receive [notifications/resources/list_changed](#resourcelistchangednotification).

#### `resourceSubscriptions?: string[]`

Subscribe to [notifications/resources/updated](#resourceupdatednotification) for these resource URIs.
Replaces the former `resources/subscribe` RPC.

### `SubscriptionsListenResultMetaObject`

Extends [ResultMetaObject](#resultmetaobject) with the subscription-stream identifier carried by a [SubscriptionsListenResult](#subscriptionslistenresult). All key naming rules from `MetaObject` apply.

```ts
interface SubscriptionsListenResultMetaObject {
  "io.modelcontextprotocol/serverInfo"?: Implementation;
  "io.modelcontextprotocol/subscriptionId": RequestId;
  [key: string]: unknown;
}
```

#### `"io.modelcontextprotocol/subscriptionId": RequestId`

Identifies the subscription stream this response closes, so the client can
correlate it with the originating subscription — mirroring the same key on
the stream's notifications. The value is the JSON-RPC ID of the `subscriptions/listen` request that opened the stream (and equals this
response's `id`).

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
  _meta: RequestMetaObject;
  inputResponses?: InputResponses;
  requestState?: string;
  name: string;
  arguments?: { [key: string]: unknown };
}
```

#### `name: string`

The name of the tool.

#### `arguments?: { [key: string]: unknown }`

Arguments to use for the tool call.

### `CallToolResultResponse`

A successful response from the server for a [tools/call](#calltoolrequest) request.

```ts
interface CallToolResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: InputRequiredResult | CallToolResult;
}
```

#### `result: InputRequiredResult | CallToolResult`

### `CallToolResult`

The result returned by the server for a [tools/call](#calltoolrequest) request.

```ts
interface CallToolResult {
  _meta?: ResultMetaObject;
  resultType: string;
  content: ContentBlock[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
}
```

#### `content: ContentBlock[]`

A list of content objects that represent the unstructured result of the tool call.

#### `structuredContent?: unknown`

An optional JSON value that represents the structured result of the tool call.

This can be any JSON value (object, array, string, number, boolean, or null)
that conforms to the tool's outputSchema if one is defined.

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
  params: PaginatedRequestParams;
  method: "tools/list";
}
```

#### `method: "tools/list"`

### `ListToolsResultResponse`

A successful response from the server for a [tools/list](#listtoolsrequest) request.

```ts
interface ListToolsResultResponse {
  jsonrpc: "2.0";
  id: RequestId;
  result: ListToolsResult;
}
```

#### `result: ListToolsResult`

### `ListToolsResult`

The result returned by the server for a [tools/list](#listtoolsrequest) request.

```ts
interface ListToolsResult {
  _meta?: ResultMetaObject;
  resultType: string;
  nextCursor?: string;
  ttlMs: number;
  cacheScope: "public" | "private";
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
  inputSchema: { $schema?: string; type: "object"; [key: string]: unknown };
  outputSchema?: { $schema?: string; [key: string]: unknown };
  annotations?: ToolAnnotations;
  _meta?: MetaObject;
}
```

#### `description?: string`

A human-readable description of the tool.

This can be used by clients to improve the LLM's understanding of available tools. It can be thought of like a "hint" to the model.

#### `inputSchema: { $schema?: string; type: "object"; [key: string]: unknown }`

A JSON Schema object defining the expected parameters for the tool.

Tool arguments are always JSON objects, so `type: "object"` is required at the root.
Beyond that, any JSON Schema 2020-12 keyword may appear alongside `type` — including
composition keywords (`oneOf`, `anyOf`, `allOf`, `not`), conditional keywords
(`if`/`then`/`else`), reference keywords (`$ref`, `$defs`, `$anchor`), and any other
standard validation or annotation keywords.

Property schemas may carry an `x-mcp-header` annotation to mirror the
argument value into an HTTP header on the Streamable HTTP transport. See
the Streamable HTTP transport specification for the validity and
extraction rules.

Defaults to JSON Schema 2020-12 when no explicit `$schema` is provided.

#### `outputSchema?: { $schema?: string; [key: string]: unknown }`

An optional JSON Schema object defining the structure of the tool's output returned in
the structuredContent field of a [CallToolResult](#calltoolresult). This can be any valid JSON Schema 2020-12.

Defaults to JSON Schema 2020-12 when no explicit `$schema` is provided.

#### `annotations?: ToolAnnotations`

Optional additional tool information.

Display name precedence order is: `title`, `annotations.title`, then `name`.

#### `_meta?: MetaObject`

### `ToolAnnotations`

Additional properties describing a [Tool](#tool) to clients.

NOTE: all properties in `ToolAnnotations` are hints.
They are not guaranteed to provide a faithful description of
tool behavior (including descriptive properties like `title`).

Clients should never make tool use decisions based on `ToolAnnotations`
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
