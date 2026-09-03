/**
 * backlogGateway.ts
 *
 * @description 借り物のクライアントから `BacklogGateway` を組み立てる唯一の場所
 */

import { BacklogApiClient } from '../libs/BacklogApiClient.js';
import { assertNever } from '../shared/assertNever.ts';
import type { ResolvedRequest, ServerConfig } from '../contract.ts';
import type { BacklogGateway } from './gateway.ts';

/**
 * Backlog API の呼び出し面を作る。
 *
 * `libs/` を知ってよいのはこの層まで（tool 層と policy 層は lint で禁止している）。
 * 渡す `baseUrl` は `config.ts` が**組み立てた**値で、env から受けた URL ではない。
 *
 * 書き込み系は form-urlencoded で送る（Backlog API がそれを取る）。
 *
 * @param config - 起動時に確定した設定
 * @returns 解決済みリクエストを送る面
 */
export const createBacklogGateway = (config: ServerConfig): BacklogGateway => {
  const client = BacklogApiClient.create(config.baseUrl, { apiKey: config.apiKey });

  return {
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
