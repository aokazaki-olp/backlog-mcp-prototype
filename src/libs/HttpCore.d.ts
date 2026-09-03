/**
 * HttpCore.ts
 * @description HTTP通信の共通基盤（Transport・デコレータ）
 *
 * 構成:
 *   createTransport  - got を使った基本Transport
 *   withRetry        - 指数バックオフリトライデコレータ
 *   withLogger       - リクエスト/レスポンスロギングデコレータ
 */
import { type Got } from 'got';
import type { Logger } from './LoggerFacade.js';
import type { Transport } from './httpTypes.js';
interface TransportDeps {
    got?: Got;
    /** multipart 送信で使う FormData の生成元（テスト用の差し替え口）。省略時は組み込みの FormData を使う。 */
    formData?: () => FormData;
}
interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    logger?: Logger;
}
export declare const HttpCore: {
    DEFAULT_MAX_RETRIES: number;
    DEFAULT_BASE_DELAY_MS: number;
    cloneHeaders: (headers?: Record<string, string>) => Record<string, string>;
    mergeHeaders: (base: Record<string, string>, override?: Record<string, string>) => Record<string, string>;
    hasHeader: (headers: Record<string, string>, key: string) => boolean;
    createTransport: (deps?: TransportDeps) => Transport;
    withRetry: (transport: Transport, options?: RetryOptions) => Transport;
    withLogger: (transport: Transport, logger?: Logger) => Transport;
};
export type { RetryOptions };
