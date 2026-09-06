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
  /** projectKey → プロジェクト単位のマスタ。**許可されたプロジェクト全部**が入る。 */
  readonly perProject: ReadonlyMap<string, ProjectMasters>;
}

/**
 * プロジェクトごとに定義されるマスタ。
 *
 * 課題の作成・更新（名前 → ID）と、検索の絞り込み（同じく名前 → ID）の両方で要る。
 * どれも `{ id, name, projectId, … }` を返す（ミラーで確認）。
 */
export interface ProjectMasters {
  /** 課題種別の名前 → id。`create_issue` の必須項目。 */
  readonly issueTypeIds: ReadonlyMap<string, number>;
  /** 状態の名前 → id。 */
  readonly statusIds: ReadonlyMap<string, number>;
  /** カテゴリーの名前 → id。**空でありうる**（定義していないプロジェクト）。 */
  readonly categoryIds: ReadonlyMap<string, number>;
  /** バージョン・マイルストーンの名前 → id。同じ1本の応答から作る。**空でありうる**。 */
  readonly versionIds: ReadonlyMap<string, number>;
  /**
   * 担当者の表示名・ログイン名 → id。
   *
   * **表示名は一意ではない。** 同名が複数いるキーはここに入れず、`ambiguousUserNames` へ回す。
   * 黙ってどちらかを選ばない（規約 §5.4）。
   */
  readonly userIds: ReadonlyMap<string, number>;
  /** 表示名が重複していて引けないもの。案内のために持つ。 */
  readonly ambiguousUserNames: ReadonlySet<string>;
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

/** 空の応答を許す版。カテゴリーやバージョンは定義していないプロジェクトがある。 */
const toNameToIdAllowingEmpty = (value: unknown, where: string): ReadonlyMap<string, number> => {
  if (!Array.isArray(value)) {
    throw new MasterDataError(`${where} の応答が配列ではありません`);
  }
  if (value.length === 0) {
    return freezeMap(new Map<string, number>());
  }
  return toNameToId(value, where);
};

/**
 * プロジェクトの参加者を名前とログイン名の両方から引けるようにする。
 *
 * **表示名（`name`）は一意ではない。** 同名が2人いるとどちらを指すか決まらないので、
 * そのキーは引けなくして `ambiguousUserNames` に入れる。ログイン名（`userId`）は一意なので
 * そのまま入れる。**黙って先勝ちにしない**（規約 §5.4 — 別人に割り当てるのは静かな失敗）。
 */
const toUserIds = (
  value: unknown,
  where: string,
): { readonly userIds: ReadonlyMap<string, number>; readonly ambiguous: ReadonlySet<string> } => {
  if (!Array.isArray(value)) {
    throw new MasterDataError(`${where} の応答が配列ではありません`);
  }

  const byName = new Map<string, number>();
  const ambiguous = new Set<string>();
  const result = new Map<string, number>();

  for (const item of value) {
    if (!isNamedId(item)) {
      throw new MasterDataError(`${where} の応答に { id, name } でない要素が含まれています`);
    }
    const existing = byName.get(item.name);
    if (existing !== undefined && existing !== item.id) {
      ambiguous.add(item.name);
    }
    byName.set(item.name, item.id);

    // ログイン名は一意。表示名が曖昧でも、こちらでは必ず指せる
    if (isRecord(item) && typeof item['userId'] === 'string' && item['userId'] !== '') {
      result.set(item['userId'], item.id);
    }
  }

  for (const [name, id] of byName) {
    if (!ambiguous.has(name)) {
      result.set(name, id);
    }
  }

  if (result.size === 0) {
    throw new MasterDataError(`${where} の応答が空です`);
  }
  return { userIds: freezeMap(result), ambiguous: Object.freeze(ambiguous) };
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
 * 1プロジェクトぶんのマスタを引く。5本は互いに独立なので並列に投げる（規約 §5.3）。
 *
 * **書き込みを許したプロジェクトでしか呼ばない。** read しか無いプロジェクトのぶんまで
 * 引くと、使わない呼び出しが起動時に並ぶ。
 */
const resolveProjectMasters = async (
  gateway: BacklogGateway,
  projectKey: string,
  projectId: number,
): Promise<ProjectMasters> => {
  const base = `/projects/${String(projectId)}`;
  const [issueTypes, statuses, categories, versions, users] = await Promise.all([
    gateway.send({ endpoint: `${base}/issueTypes`, method: 'GET' }),
    gateway.send({ endpoint: `${base}/statuses`, method: 'GET' }),
    gateway.send({ endpoint: `${base}/categories`, method: 'GET' }),
    gateway.send({ endpoint: `${base}/versions`, method: 'GET' }),
    gateway.send({ endpoint: `${base}/users`, method: 'GET' }),
  ]);

  const { userIds, ambiguous } = toUserIds(users, `GET ${base}/users（${projectKey}）`);

  return Object.freeze({
    // 種別と状態はプロジェクトに必ず1つ以上ある。空なら応答の形を疑う
    issueTypeIds: toNameToId(issueTypes, `GET ${base}/issueTypes（${projectKey}）`),
    statusIds: toNameToId(statuses, `GET ${base}/statuses（${projectKey}）`),
    categoryIds: toNameToIdAllowingEmpty(categories, `GET ${base}/categories（${projectKey}）`),
    versionIds: toNameToIdAllowingEmpty(versions, `GET ${base}/versions（${projectKey}）`),
    userIds,
    ambiguousUserNames: ambiguous,
  });
};

/**
 * 起動時のマスタを一度だけ解決する。
 *
 * スペース直下の4本は互いに独立なので並列に投げる（規約 §5.3）。そのあと、**許可された
 * プロジェクト全部**についてプロジェクト単位のマスタを引く（1プロジェクトあたり5本）。
 *
 * 以前は書き込みを許したプロジェクトだけに絞っていたが、**「状態で絞る」「担当者で絞る」は
 * read の操作**なので前提が変わった。ここも並列なので、増えるのは同時実行数であって直列の
 * 待ち時間ではない。上限はポリシーが列挙した数（ワイルドカードが無いので人が書いた数）。
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

  const perProject = new Map<string, ProjectMasters>();
  const resolved = await Promise.all(
    [...projectIds].map(async ([projectKey, projectId]) => {
      return [projectKey, await resolveProjectMasters(gateway, projectKey, projectId)] as const;
    }),
  );
  for (const [projectKey, masters] of resolved) {
    perProject.set(projectKey, masters);
  }

  return Object.freeze({
    projectIds,
    priorityIds: toNameToId(priorities, 'GET /priorities'),
    resolutionIds: toNameToId(resolutions, 'GET /resolutions'),
    myUserId: toMyUserId(myself),
    perProject: freezeMap(perProject),
  });
};

/**
 * プロジェクト単位のマスタを取り出す。
 *
 * 許可された全プロジェクトを引いているので、ポリシーの判定を先に通っていれば必ずある。
 * 無いのは組み立ての誤りなので送出する。
 *
 * @param masters - 解決済みマスタ
 * @param projectKey - プロジェクトキー
 * @returns そのプロジェクトのマスタ
 * @throws {MasterDataError} 引いていない場合
 */
export const projectMastersOf = (masters: Masters, projectKey: string): ProjectMasters => {
  const found = masters.perProject.get(projectKey);
  if (found === undefined) {
    throw new MasterDataError(`${projectKey} のマスタを起動時に引いていません`);
  }
  return found;
};

/** 名前を挙げるときの上限。全部並べると長くなりすぎる。 */
const MAX_LISTED_NAMES = 20;

/**
 * 名前から ID を引く。**引けなければ送出する**（既定に落とさない）。
 *
 * 選べる名前をメッセージに載せる。LLM が自分で言い直せるようにするためで、
 * **どれも Backlog の管理者が付けた名前**（第三者の自由記述ではない）。
 *
 * @param map - 名前 → id
 * @param name - 引きたい名前
 * @param what - 何のマスタか（メッセージに出す）
 * @returns id
 * @throws {MasterDataError} 引けない場合
 */
export const lookupName = (
  map: ReadonlyMap<string, number>,
  name: string,
  what: string,
): number => {
  const id = map.get(name);
  if (id !== undefined) {
    return id;
  }
  const names = [...map.keys()];
  const listed = names.slice(0, MAX_LISTED_NAMES).join(' / ');
  const suffix =
    names.length > MAX_LISTED_NAMES ? ` ほか${String(names.length - MAX_LISTED_NAMES)}件` : '';
  throw new MasterDataError(
    names.length === 0
      ? `${what}「${name}」は指定できません（このプロジェクトには定義がありません）`
      : `${what}「${name}」は見つかりません（選べるのは ${listed}${suffix}）`,
  );
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
