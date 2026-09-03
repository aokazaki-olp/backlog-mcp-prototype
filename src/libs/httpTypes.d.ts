/**
 * httpTypes.ts
 * @description HTTP Transport 層の共通型・エラー定義
 */
export interface FetchOptions {
    method?: string;
    headers?: Record<string, string>;
    /** JSON文字列 or form-urlencodedオブジェクト */
    payload?: string | Record<string, string>;
    /** multipart のファイルパート。payload と併せて送られる。組み込み transport は常に FormData として送信する。 */
    files?: Record<string, FilePart | readonly FilePart[]>;
    timeoutMs?: number;
}
export interface RawResponse {
    status: number;
    headers: Record<string, string | string[]>;
    body: unknown;
    text: string;
    /** 生バイト。組み込み transport は常に埋める。独自 transport では欠ける場合がある。 */
    bytes?: Uint8Array;
}
export interface Transport {
    fetch(url: string, options?: FetchOptions): Promise<RawResponse>;
}
/** multipart のファイルパート。data の型は実行環境ごとに異なる（Node: Uint8Array / GAS: Blob）。 */
export interface FilePart {
    kind: 'file';
    filename: string;
    contentType?: string;
    data: Uint8Array;
}
type FormValue = string | number | boolean | FilePart;
/** RequestOptions.form の値。呼び出し側はスカラーとファイルを混ぜて書ける。 */
export type FormFields = Record<string, FormValue | readonly FormValue[]>;
export interface RequestOptions {
    endpoint?: string;
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, unknown>;
    body?: unknown;
    /** JSON.stringify を経由せず payload に直接セットされる生文字列（CSV アップロード等） */
    rawBody?: string;
    /** フォームとして送る。FilePart を含めば multipart。body / rawBody とは排他。 */
    form?: FormFields;
    timeoutMs?: number;
}
/**
 * HTTP 非2xxレスポンスを表すエラー。
 *
 * **注意**: `request.body` にはリクエストボディがそのまま含まれる場合がある。
 * ロガーに渡す前に機密フィールド（トークン・パスワード等）を redact すること。
 */
export declare class HttpError extends Error {
    readonly status: number;
    readonly body: unknown;
    readonly headers: Record<string, string | string[]>;
    readonly text: string;
    readonly request?: RequestOptions | undefined;
    /** 生バイト。RawResponse.bytes と同じ契約（組み込み transport は常に埋める）。 */
    readonly bytes?: Uint8Array | undefined;
    readonly name = "HttpError";
    constructor(message: string, status: number, body: unknown, headers?: Record<string, string | string[]>, text?: string, request?: RequestOptions | undefined, 
    /** 生バイト。RawResponse.bytes と同じ契約（組み込み transport は常に埋める）。 */
    bytes?: Uint8Array | undefined);
}
/** リトライ上限に達した場合にスローされるエラー。 */
export declare class RetryExhaustedError extends Error {
    readonly name = "RetryExhaustedError";
    constructor(message: string, options?: ErrorOptions);
}
export {};
