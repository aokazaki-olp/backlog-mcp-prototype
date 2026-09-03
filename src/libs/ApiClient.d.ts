/**
 * ApiClient.ts
 * @description REST API用クライアント（baseUrl + endpoint 方式）
 *
 * 設計思想:
 *   - extend() でTransportデコレータを積み重ねる（イミュータブル）
 *   - use() でドメインメソッドをプラグインとして追加
 *   - call() が async になった以外、GAS版と同じAPI
 */
import type { Logger } from './LoggerFacade.js';
import type { RawResponse, RequestOptions, Transport } from './httpTypes.js';
export type ResponseHandler<T = unknown> = (response: RawResponse, request: RequestOptions) => T;
type HttpMethods<TResponse> = {
    get(endpoint: string, query?: Record<string, unknown>, options?: Partial<RequestOptions>): Promise<TResponse>;
    post(endpoint: string, body?: unknown, options?: Partial<RequestOptions>): Promise<TResponse>;
    put(endpoint: string, body?: unknown, options?: Partial<RequestOptions>): Promise<TResponse>;
    patch(endpoint: string, body?: unknown, options?: Partial<RequestOptions>): Promise<TResponse>;
    delete(endpoint: string, options?: Omit<Partial<RequestOptions>, 'body' | 'rawBody' | 'form'>): Promise<TResponse>;
};
type BaseClient<TResponse = unknown, TMethods extends object = Record<string, never>> = HttpMethods<TResponse> & TMethods & {
    call(request: RequestOptions): Promise<TResponse>;
    extend(decorator: (transport: Transport) => Transport): BaseClient<TResponse>;
    use<TNew extends object>(plugin: (client: BaseClient<TResponse, TMethods>) => TNew): BaseClient<TResponse, TMethods & TNew>;
    use<TName extends string, TFn>(name: TName, fn: (client: BaseClient<TResponse, TMethods>) => TFn): BaseClient<TResponse, TMethods & Record<TName, TFn>>;
};
interface ClientConfig<TResponse = unknown> {
    baseUrl: string;
    transport?: Transport;
    logger?: Logger;
    headers?: Record<string, string>;
    responseHandler?: ResponseHandler<TResponse>;
}
export declare const ApiClient: {
    withBearerAuth: (transport: Transport, token: string) => Transport;
    withQueryAuth: (transport: Transport, params: Record<string, string>) => Transport;
    createClient: <TResponse = unknown>(config: ClientConfig<TResponse>) => BaseClient<TResponse>;
};
/**
 * クライアントにメソッドを追加するプラグイン
 *
 * @typeParam TResponse - クライアントのレスポンス型（`BaseClient<TResponse>` に一致させる）
 * @typeParam TNew - プラグインが追加するメソッドの型
 */
export type Plugin<TResponse, TNew extends object> = (client: BaseClient<TResponse>) => TNew;
export type { BaseClient, ClientConfig };
