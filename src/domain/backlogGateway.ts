/**
 * backlogGateway.ts
 *
 * @description 借り物のクライアントから `BacklogGateway` を組み立てる唯一の場所
 */

import { BacklogApiClient } from '../libs/BacklogApiClient.js';
import { assertNever } from '../shared/assertNever.ts';
import type { ResolvedRequest, ServerConfig } from '../contract.ts';
import type { Transport } from '../libs/httpTypes.js';
import type { BacklogGateway } from './gateway.ts';

/**
 * 差し替えられる依存。**テストのための注入口**（規約 §7「モックの既定は依存注入」）。
 *
 * env からは触れない。設定として危険な値を表現できるようにはしていない
 * （URL を受け取らず組み立てる、という設計はここでも崩さない）。
 *
 * **`logger` を口に含めていないのは意図的。** `HttpCore.withLogger` は失敗時に例外
 * オブジェクトごとロガーへ渡し、got のネットワークエラーはリクエストヘッダを持つ。
 * ログに API キーが載る経路になりうるので、**足すなら先にその経路を確かめる**。
 */
export interface GatewayOverrides {
  readonly transport?: Transport;
  readonly maxRetries?: number;
  readonly baseDelayMs?: number;
}

/**
 * Backlog API の呼び出し面を作る。
 *
 * `libs/` を知ってよいのはこの層まで（tool 層と policy 層は lint で禁止している）。
 * 渡す `baseUrl` は `config.ts` が**組み立てた**値で、env から受けた URL ではない。
 *
 * 書き込み系は form-urlencoded で送る（Backlog API がそれを取る）。
 *
 * @param config - 起動時に確定した設定
 * @param overrides - 差し替える依存（テスト用）
 * @returns 解決済みリクエストを送る面
 */
export const createBacklogGateway = (
  config: ServerConfig,
  overrides: GatewayOverrides = {},
): BacklogGateway => {
  const client = BacklogApiClient.create(config.baseUrl, { apiKey: config.apiKey }, overrides);

  // バイナリの応答は `body` が null になり、生バイトは `bytes` にしか入らない。
  // Transport のデコレータで移し替えて、焼き込まれた responseHandler に拾わせる
  const bytesClient = client.extend(transport => ({
    async fetch(url, options) {
      const response = await transport.fetch(url, options);
      return { ...response, body: response.bytes };
    },
  }));

  return {
    async sendBytes(request: ResolvedRequest): Promise<Uint8Array> {
      const raw: unknown = await bytesClient.get(request.endpoint, request.query);
      if (!(raw instanceof Uint8Array)) {
        // 生バイトが取れないのは想定外。黙って空を返さない（規約 §5.4）
        throw new Error(`${request.endpoint} からバイト列を受け取れませんでした`);
      }
      return raw;
    },

    async send(request: ResolvedRequest): Promise<unknown> {
      switch (request.method) {
        case 'GET': {
          return await client.get(request.endpoint, request.query);
        }
        case 'POST': {
          return await client.call({
            endpoint: request.endpoint,
            method: 'POST',
            form: request.form,
          });
        }
        case 'PATCH': {
          return await client.call({
            endpoint: request.endpoint,
            method: 'PATCH',
            form: request.form,
          });
        }
        default: {
          return assertNever(request.method);
        }
      }
    },
  };
};
