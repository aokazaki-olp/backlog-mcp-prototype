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
  /**
   * **バイト列を受け取る**。添付のダウンロードだけが使う。
   *
   * `send` と分けているのは、借り物のクライアントが応答を1通りにしか解けないため。
   * `BacklogApiClient` は `responseHandler: response => response.body` を焼き込んで
   * いて（`src/libs/BacklogApiClient.js`）、**バイナリの応答では `body` が `null` になる**
   * — 組み込みの Transport が `image/*` `application/pdf` などを本文として解かず、
   * `bytes` にだけ入れるため。`src/libs/` はローカル編集できない（AGENTS.md）ので、
   * **公開されている `extend`（Transport のデコレータ）で `bytes` を `body` に移す**
   * 別クライアントを立てて、それをこの口に割り当てる。
   */
  sendBytes(request: ResolvedRequest): Promise<Uint8Array>;
}
