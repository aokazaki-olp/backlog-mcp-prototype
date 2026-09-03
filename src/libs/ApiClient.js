/**
 * ApiClient.ts
 * @description REST API用クライアント（baseUrl + endpoint 方式）
 *
 * 設計思想:
 *   - extend() でTransportデコレータを積み重ねる（イミュータブル）
 *   - use() でドメインメソッドをプラグインとして追加
 *   - call() が async になった以外、GAS版と同じAPI
 */
import { LoggerFacade } from './LoggerFacade.js';
import { HttpCore } from './HttpCore.js';
// ============================================================================
// URL・クエリ文字列ユーティリティ
// ============================================================================
const trimRightSlash = (s) => s.replace(/\/+$/, '');
const trimLeftSlash = (s) => s.replace(/^\/+/, '');
const encodeKeyValue = (key, value) => `${encodeURIComponent(String(key))}=${encodeURIComponent(String(value))}`;
const buildQueryString = (query) => {
    if (!query) {
        return '';
    }
    const parts = [];
    for (const [k, v] of Object.entries(query)) {
        if (v == null) {
            continue;
        }
        if (Array.isArray(v)) {
            for (const item of v) {
                parts.push(encodeKeyValue(k, item));
            }
        }
        else {
            parts.push(encodeKeyValue(k, v));
        }
    }
    return parts.join('&');
};
const buildUrl = (baseUrl, endpoint, query) => {
    const base = trimRightSlash(baseUrl);
    const path = `/${trimLeftSlash(endpoint ?? '')}`;
    const url = base + path;
    const queryString = buildQueryString(query);
    if (!queryString) {
        return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + queryString;
};
// ============================================================================
// form フィールドの振り分け（urlencoded スカラー / multipart ファイル）
// ============================================================================
const isFilePart = (v) => typeof v === 'object' && v !== null && v.kind === 'file';
/**
 * RequestOptions.form をスカラー（payload）とファイル（files）に振り分ける
 *
 * @param form - 呼び出し側が指定した form フィールド
 * @returns payload（urlencoded 用スカラー）と files（multipart 用、無ければ undefined）
 * @throws {TypeError} スカラーの配列（ファイルの配列以外の配列）が渡された場合（未対応）
 */
const splitFormFields = (form) => {
    const payload = {};
    let files;
    for (const [key, value] of Object.entries(form)) {
        // buildQueryString と同じ規約: null/undefined のフィールドは省略する（"null"/"undefined" という文字列を送らない）
        if (value == null) {
            continue;
        }
        if (Array.isArray(value)) {
            // 空配列は「値なし」として省略する（every() は空配列に vacuously true を返すため、
            // ここで先に弾かないとファイルの配列と誤判定され、files にも payload にも現れず沈黙して消える）
            if (value.length === 0) {
                continue;
            }
            if (value.every(isFilePart)) {
                files ??= {};
                files[key] = value;
                continue;
            }
            throw new TypeError(`form.${key} には配列を指定できません（ファイルの配列のみ対応。スカラーの配列は未対応）`);
        }
        if (isFilePart(value)) {
            files ??= {};
            files[key] = value;
            continue;
        }
        payload[key] = String(value);
    }
    return { payload, files };
};
// ============================================================================
// Bearer認証デコレータ
// ============================================================================
/**
 * Bearer認証をTransportに追加する
 *
 * @param transport - ラップ対象Transport
 * @param token - Bearerトークン
 * @returns 認証付きTransport
 */
const withBearerAuth = (transport, token) => ({
    fetch: (url, options) => {
        const headers = HttpCore.cloneHeaders(options?.headers);
        headers['Authorization'] = `Bearer ${token}`;
        return transport.fetch(url, { ...options, headers });
    },
});
// ============================================================================
// クエリパラメータ認証デコレータ
// ============================================================================
/**
 * クエリパラメータ認証を Transport に追加する
 * （API キーや認証ID が URL クエリで渡される API 向け）
 *
 * @param transport - ラップ対象 Transport
 * @param params - URL に追加する認証用クエリパラメータ
 * @returns 認証付き Transport
 */
const withQueryAuth = (transport, params) => {
    const authQuery = buildQueryString(params);
    return {
        fetch: (url, options) => {
            if (!authQuery) {
                return transport.fetch(url, options);
            }
            const separator = url.includes('?') ? '&' : '?';
            return transport.fetch(url + separator + authQuery, options);
        },
    };
};
/**
 * HTTPクライアントを作成する
 *
 * @param config - クライアント設定
 * @returns クライアント（call/get/post/put/patch/delete/extend/use）。use() は TypeError をスローする場合がある
 * @remarks use() で追加した plugin メソッドは HTTP メソッド名（get/post/put/patch/delete）と同名でも plugin が優先される
 */
const createClient = (config) => {
    const baseUrl = trimRightSlash(config.baseUrl);
    const transport = config.transport ?? HttpCore.createTransport();
    const log = LoggerFacade.createLogger(config.logger);
    const headers = config.headers ?? {};
    const responseHandler = config.responseHandler;
    const call = async (request) => {
        const method = (request.method ?? 'GET').toUpperCase();
        const url = buildUrl(baseUrl, request.endpoint, request.query);
        const mergedHeaders = HttpCore.mergeHeaders(headers, request.headers);
        const options = {
            method,
            headers: mergedHeaders,
        };
        const hasRawBody = typeof request.rawBody === 'string';
        const hasForm = request.form != null;
        const hasBody = request.body != null;
        const canHaveBody = !/^(GET|HEAD|DELETE)$/.test(method);
        if (hasRawBody) {
            if (canHaveBody) {
                options.payload = request.rawBody;
            }
            else {
                log?.warn(`[HTTP] ⚠ ${method}リクエストでrawBodyが検出されました。無視されます。 url=${url}`);
            }
        }
        else if (hasForm) {
            if (canHaveBody) {
                // request.form は非 null 確定（hasForm）
                const { payload, files } = splitFormFields(request.form);
                options.payload = payload;
                if (files) {
                    options.files = files;
                }
            }
            else {
                log?.warn(`[HTTP] ⚠ ${method}リクエストでformが検出されました。無視されます。 url=${url}`);
            }
        }
        else if (hasBody) {
            if (canHaveBody) {
                options.payload = JSON.stringify(request.body);
                if (!HttpCore.hasHeader(mergedHeaders, 'Content-Type')) {
                    mergedHeaders['Content-Type'] = 'application/json; charset=utf-8';
                }
            }
            else {
                log?.warn(`[HTTP] ⚠ ${method}リクエストでbodyが検出されました。無視されます。 url=${url}`);
            }
        }
        if (typeof request.timeoutMs === 'number') {
            options.timeoutMs = request.timeoutMs;
        }
        const rawResponse = await transport.fetch(url, options);
        return responseHandler
            ? responseHandler(rawResponse, request)
            : rawResponse; // responseHandler 省略時は RawResponse === TResponse を呼び出し側が保証する
    };
    const extend = (decorator) => createClient({
        baseUrl,
        logger: config.logger,
        headers: HttpCore.cloneHeaders(headers),
        transport: decorator(transport),
        responseHandler,
    });
    const createExtended = (additionalMethods) => {
        // eslint-disable-next-line prefer-const
        let client;
        const use = ((pluginOrName, fn) => {
            let newMethods;
            if (typeof pluginOrName === 'string') {
                if (!fn) {
                    throw new TypeError('use(name, fn) の形式では fn を指定してください');
                }
                newMethods = { [pluginOrName]: fn(client) };
            }
            else {
                newMethods = pluginOrName(client);
                if (typeof newMethods !== 'object' || newMethods === null || Array.isArray(newMethods)) {
                    throw new TypeError('plugin の戻り値には Object を指定してください');
                }
            }
            return createExtended({ ...additionalMethods, ...newMethods });
        }); // use のオーバーロードシグネチャは条件型で表現されており、実装シグネチャと型が一致しない
        const httpMethods = {
            get: (endpoint, query, options) => call({ ...options, method: 'GET', endpoint, query }),
            post: (endpoint, body, options) => call({ ...options, method: 'POST', endpoint, body }),
            put: (endpoint, body, options) => call({ ...options, method: 'PUT', endpoint, body }),
            patch: (endpoint, body, options) => call({ ...options, method: 'PATCH', endpoint, body }),
            delete: (endpoint, options) => 
            // Omit<Partial<RequestOptions>, 'body' | 'rawBody' | 'form'> はスプレッド時に Partial<RequestOptions> として推論されないためキャスト
            call({ ...options, method: 'DELETE', endpoint }),
        };
        // plugin が HTTP メソッド名（delete 等）と同名メソッドを定義した場合に plugin を優先するため
        // httpMethods を先に展開し additionalMethods で後勝ちにする。call/extend/use は常に保持。
        client = {
            ...httpMethods,
            ...additionalMethods,
            call,
            extend,
            use,
        }; // スプレッド合成は型システムで証明不能: additionalMethods ∪ HttpMethods
        return client;
    };
    // 追加メソッド無しの初期クライアント。空オブジェクトを空メソッド集合の起点にする
    return createExtended({});
};
export const ApiClient = {
    withBearerAuth,
    withQueryAuth,
    createClient,
};
