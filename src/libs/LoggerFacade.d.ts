/**
 * LoggerFacade.ts
 * @description 各種ロガー実装を統一インターフェースに変換するファサード（SLF4J互換）
 *
 * 対応する実装:
 *   - console (JavaScript標準)
 *   - winston / pino / bunyan (Node.js)
 *   - GAS Logger / BBLog (GAS)
 *   - java.util.logging互換
 */
export interface Logger {
    trace(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}
export declare const LoggerFacade: {
    createLogger: (logger: unknown) => Logger | null;
};
