/**
 * gateway.ts
 *
 * @description Backlog API を叩く唯一の面。受け取るのは解決済みのリクエストだけ
 */

import type { ResolvedRequest } from '../contract.ts';

/**
 * ツール実装とマスタ解決が使う唯一の I/O 面。
 *
 * **エンドポイントとパラメータを組み立てる余地をここに残さない。** 受け取るのは
 * input 層が組み立て済みの `ResolvedRequest` だけで、絞り込みの上書きはこの面に届く前に
 * 終わっている（api 層に「上書き」という概念を持ち込まない）。
 *
 * `BacklogApiClient` の型をそのまま引き回さないのは、上の層に HTTP の語彙
 * （status・headers・Transport・`extend` / `use`）を持ち込まないため。
 */
export interface BacklogGateway {
  send(request: ResolvedRequest): Promise<unknown>;
}
