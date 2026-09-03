/**
 * masters.ts
 *
 * @description 起動時に一度だけ引く内部マスタ（projectKey↔projectId、優先度・完了理由の名前↔ID）
 */

import { MasterDataError } from '../contract.ts';
import { freezeMap } from '../shared/freezeCollection.ts';
import type { BacklogGateway } from './gateway.ts';

/** `{ id, name }` の形をとる Backlog のマスタ要素。 */
interface NamedId {
  readonly id: number;
  readonly name: string;
}

/**
 * ツールには公開せず内部で持つマスタ。
 *
 * これらのエンドポイントはプロジェクトに属さない（`GET /priorities` などスペース直下）ため
 * ツールとして出すとスコープで表現できない。しかし課題の作成・更新に必要な数値 ID の
 * 出どころなので、起動時に解決して名前↔ID の変換だけを提供する。
 *
 * LLM には `priority: "高"` のような**名前**を渡させ、数値 ID には触れさせない。
 */
export interface Masters {
  /** projectKey → projectId。ポリシーで許可されたプロジェクトのみ。 */
  readonly projectIds: ReadonlyMap<string, number>;
  /** 優先度の名前 → id。 */
  readonly priorityIds: ReadonlyMap<string, number>;
  /** 完了理由の名前 → id。 */
  readonly resolutionIds: ReadonlyMap<string, number>;
  /** API キーの持ち主。「自分の担当課題」を引くのに要る。 */
  readonly myUserId: number;
}

// ============================================================================
// 外部データの検証（規約 §4.6: unknown で受けて型ガードで絞る）
// ============================================================================

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNamedId = (value: unknown): value is NamedId =>
  isRecord(value) && typeof value['id'] === 'number' && typeof value['name'] === 'string';

const toNameToId = (value: unknown, where: string): ReadonlyMap<string, number> => {
  if (!Array.isArray(value)) {
    throw new MasterDataError(`${where} の応答が配列ではありません`);
  }
  const result = new Map<string, number>();
  for (const item of value) {
    if (!isNamedId(item)) {
      throw new MasterDataError(`${where} の応答に { id, name } でない要素が含まれています`);
    }
    result.set(item.name, item.id);
  }
  if (result.size === 0) {
    throw new MasterDataError(`${where} の応答が空です`);
  }
  return freezeMap(result);
};

interface BacklogProject {
  readonly id: number;
  readonly projectKey: string;
}

const isBacklogProject = (value: unknown): value is BacklogProject =>
  isRecord(value) && typeof value['id'] === 'number' && typeof value['projectKey'] === 'string';

const toMyUserId = (value: unknown): number => {
  if (!isRecord(value) || typeof value['id'] !== 'number') {
    throw new MasterDataError('GET /users/myself の応答に id がありません');
  }
  return value['id'];
};

// ============================================================================
// 解決
// ============================================================================

/**
 * 参加しているプロジェクトから、要求されたキーだけを解決する。
 *
 * **`all=true` を送らない。** `GET /projects` の `all` は既定 `false` で「参加している
 * プロジェクトのみ」を返す（管理者権限のときだけ有効なパラメータ）。送らないことで、
 * 管理者の API キーを使ってもスペース全体には広がらない。
 */
const resolveProjectIds = async (
  gateway: BacklogGateway,
  projectKeys: readonly string[],
): Promise<ReadonlyMap<string, number>> => {
  // クエリを一切渡さない。`all` を「false で送る」のではなく「送らない」。
  const response = await gateway.send({ endpoint: '/projects', method: 'GET' });

  if (!Array.isArray(response)) {
    throw new MasterDataError('GET /projects の応答が配列ではありません');
  }

  const available = new Map<string, number>();
  for (const item of response) {
    if (!isBacklogProject(item)) {
      throw new MasterDataError('GET /projects の応答に projectKey / id でない要素があります');
    }
    available.set(item.projectKey, item.id);
  }

  const resolved = new Map<string, number>();
  const missing: string[] = [];
  for (const projectKey of projectKeys) {
    const projectId = available.get(projectKey);
    if (projectId === undefined) {
      missing.push(projectKey);
      continue;
    }
    resolved.set(projectKey, projectId);
  }

  // 黙って落とさない（規約 §5.4）。解決できないキーが1つでもあれば起動しない。
  if (missing.length > 0) {
    throw new MasterDataError(
      `ポリシーのプロジェクトを解決できません: ${missing.join(', ')}。` +
        'スペースに存在し、この API キーの持ち主が参加しているか確認してください',
    );
  }

  return freezeMap(resolved);
};

/**
 * 起動時のマスタを一度だけ解決する。
 *
 * 4本の呼び出しは互いに独立なので並列に投げる（規約 §5.3）。
 *
 * @param gateway - Backlog API を叩くもの
 * @param projectKeys - 解決したいプロジェクトキー（ポリシーが許可したもの）
 * @returns 凍結済みのマスタ
 * @throws {MasterDataError} 応答の形が想定と違う場合、要求されたキーを解決できない場合
 */
export const resolveMasters = async (
  gateway: BacklogGateway,
  projectKeys: readonly string[],
): Promise<Masters> => {
  if (projectKeys.length === 0) {
    throw new MasterDataError('解決するプロジェクトキーが1つもありません');
  }

  const [projectIds, priorities, resolutions, myself] = await Promise.all([
    resolveProjectIds(gateway, projectKeys),
    gateway.send({ endpoint: '/priorities', method: 'GET' }),
    gateway.send({ endpoint: '/resolutions', method: 'GET' }),
    gateway.send({ endpoint: '/users/myself', method: 'GET' }),
  ]);

  return Object.freeze({
    projectIds,
    priorityIds: toNameToId(priorities, 'GET /priorities'),
    resolutionIds: toNameToId(resolutions, 'GET /resolutions'),
    myUserId: toMyUserId(myself),
  });
};

/**
 * projectKey を projectId に変換する。
 *
 * マスタに無いキーは**ポリシーで許可されていないか、そもそも存在しない**。
 * どちらにせよ API へ到達させない。
 *
 * @param masters - 解決済みマスタ
 * @param projectKey - プロジェクトキー
 * @returns projectId
 * @throws {MasterDataError} 解決できない場合
 */
export const toProjectId = (masters: Masters, projectKey: string): number => {
  const projectId = masters.projectIds.get(projectKey);
  if (projectId === undefined) {
    throw new MasterDataError(`未解決のプロジェクトキーです: ${projectKey}`);
  }
  return projectId;
};

/**
 * 許可されたプロジェクトキーすべての projectId を返す。
 *
 * 絞り込みパラメータを**ポリシー由来の値で上書き**するために使う（LLM が渡した
 * `projectId` は採用しない）。
 *
 * @param masters - 解決済みマスタ
 * @param projectKeys - 対象のプロジェクトキー
 * @returns projectId の配列（入力の順序を保つ）
 * @throws {MasterDataError} 解決できないキーが含まれる場合
 */
export const toProjectIds = (masters: Masters, projectKeys: readonly string[]): readonly number[] =>
  projectKeys.map(projectKey => toProjectId(masters, projectKey));
