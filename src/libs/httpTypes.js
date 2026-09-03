/**
 * httpTypes.ts
 * @description HTTP Transport 層の共通型・エラー定義
 */
// ============================================================================
// Errors
// ============================================================================
/**
 * HTTP 非2xxレスポンスを表すエラー。
 *
 * **注意**: `request.body` にはリクエストボディがそのまま含まれる場合がある。
 * ロガーに渡す前に機密フィールド（トークン・パスワード等）を redact すること。
 */
export class HttpError extends Error {
    status;
    body;
    headers;
    text;
    request;
    bytes;
    name = 'HttpError';
    constructor(message, status, body, headers = {}, text = '', request, 
    /** 生バイト。RawResponse.bytes と同じ契約（組み込み transport は常に埋める）。 */
    bytes) {
        super(message);
        this.status = status;
        this.body = body;
        this.headers = headers;
        this.text = text;
        this.request = request;
        this.bytes = bytes;
    }
}
/** リトライ上限に達した場合にスローされるエラー。 */
export class RetryExhaustedError extends Error {
    name = 'RetryExhaustedError';
    constructor(message, options) {
        super(message, options);
    }
}
