/**
 * BacklogApiClient.ts
 * @description Backlog API のプロトコル層クライアント。
 *              認証(API Key ヘッダ or OAuth 2.0 Bearer)・レート制限リトライ・エラー正規化・
 *              ロギング・baseUrl 構築のみを提供する。
 *              課題・プロジェクト・Wiki 等のドメインメソッドは呼び出し側で .use() する。
 *
 * 使用例:
 *   const client = BacklogApiClient.create('https://example.backlog.jp', { apiKey: 'xxxxxxxx' });
 *   const projects = await client.get('/projects');
 *
 *   // OAuth 2.0 アクセストークンの場合
 *   const client = BacklogApiClient.create('https://example.backlog.jp', { accessToken: 'yyyyyyyy' });
 */
import type { BaseClient } from './ApiClient.js';
import type { Logger } from './LoggerFacade.js';
import type { RawResponse, Transport } from './httpTypes.js';
/** Backlog API のエラーコード体系（1〜13）。 */
declare const BACKLOG_ERROR_CODE: {
    readonly INTERNAL: 1;
    readonly LICENCE: 2;
    readonly LICENCE_EXPIRED: 3;
    readonly ACCESS_DENIED: 4;
    readonly UNAUTHORIZED_OPERATION: 5;
    readonly NO_RESOURCE: 6;
    readonly INVALID_REQUEST: 7;
    readonly SPACE_OVER_CAPACITY: 8;
    readonly RESOURCE_OVERFLOW: 9;
    readonly TOO_LARGE_FILE: 10;
    readonly AUTHENTICATION: 11;
    readonly REQUIRED_MFA: 12;
    readonly TOO_MANY_REQUESTS: 13;
};
export declare class BacklogApiError extends Error {
    readonly code: number;
    readonly errors: unknown;
    readonly response?: RawResponse | undefined;
    readonly name = "BacklogApiError";
    constructor(message: string, code: number, errors: unknown, response?: RawResponse | undefined);
}
interface BacklogRetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    logger?: Logger;
}
export declare const BacklogCore: {
    withRetry: (transport: Transport, options?: BacklogRetryOptions) => Transport;
};
/** API キー方式（Backlog-API-Key ヘッダ）または OAuth 2.0 のアクセストークン。 */
export type BacklogAuth = {
    apiKey: string;
} | {
    accessToken: string;
};
export interface BacklogClientOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    logger?: Logger;
    transport?: Transport;
}
export declare const BacklogApiClient: {
    create: <TResponse = unknown>(spaceUrl: string, auth: BacklogAuth, options?: BacklogClientOptions) => BaseClient<TResponse>;
};
export { BACKLOG_ERROR_CODE };
