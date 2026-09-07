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
  /**
   * projectKey → プロジェクト名。**キーだけでは LLM が選べない**ので `tools/list` に出す（根D）。
   *
   * 名前を変えられるのは**管理者 / プロジェクト管理者**だけ（一次情報で確認・2026-09-07）。
   * `status` と同じ「管理者定義」側なので囲まない（根B の分類）。
   */
  readonly projectNames: ReadonlyMap<string, string>;
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
   * **ここから引ける名前は必ず1人を指す。** 複数の人が名乗る名前は入れず、
   * `ambiguousUserNames` へ回す（表示名どうしに限らない。`toUserIds` の表を見ること）。
   * 黙ってどちらかを選ばない（規約 §5.4）。
   */
  readonly userIds: ReadonlyMap<string, number>;
  /** 複数の人が名乗っていて引けない名前。案内のために持つ。 */
  readonly ambiguousUserNames: ReadonlySet<string>;
  /**
   * **1人につき1件**の参加者。`userIds` は表示名とログイン名の両方をキーに持つので、
   * そのまま並べると人数が二重に見える（実データで踏んだ）。数え上げにはこちらを使う。
   */
  readonly members: readonly ProjectMember[];
}

/** プロジェクトの参加者1人。**数値 ID は持たない。** */
export interface ProjectMember {
  /** 表示名。**一意とは限らない**（複数の人が名乗る名前は `ambiguousUserNames` に入る）。 */
  readonly name: string;
  /**
   * ログイン名（Backlog の `userId`）。一意。
   *
   * **省略される**（`userId: null` のユーザーが実在する。実データで確認）。
   * 「無いことはキーが無いことで表す」約束に揃えてある。
   */
  readonly loginName?: string;
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
 * **不変条件: この索引から引ける名前は、必ず1人を指す。**
 *
 * 表示名とログイン名を**同じ索引に入れる**ので、衝突は3通りある。
 *
 * | 衝突 | 例 |
 * | --- | --- |
 * | 表示名 × 表示名 | 同姓同名が2人 |
 * | **ログイン名 × 表示名** | A のログイン名が B の表示名と同じ |
 * | **ログイン名 × ログイン名** | Backlog 側で一意である可能性は高いが、**ミラーに一意性の記述が無い**（未確認） |
 *
 * **どれか1つを検査する形にしない。** 以前は表示名どうしだけを別の Map で数えており、
 * 残る2つが素通りしていた（`assignee` が別人に解決される）。**名前を1つずつ「誰が名乗るか」で
 * 数えれば、3通りとも同じ規則で落ちる。**
 *
 * 引けなくした名前は `ambiguousUserNames` へ回して案内する。**黙って先勝ち・後勝ちにしない**
 * （規約 §5.4 — 別人に割り当てるのは静かな失敗）。
 *
 * **同じ人が同じ名前を2度名乗るのは衝突ではない**（ログイン名と表示名が同じ人）。
 * ここを衝突扱いにすると「指せるのに候補から消える」— 実データで一度踏んだ形になる。
 */
const toUserIds = (
  value: unknown,
  where: string,
): {
  readonly userIds: ReadonlyMap<string, number>;
  readonly ambiguous: ReadonlySet<string>;
  readonly members: readonly ProjectMember[];
} => {
  if (!Array.isArray(value)) {
    throw new MasterDataError(`${where} の応答が配列ではありません`);
  }

  /** 名前 → それを名乗る唯一の id。2人目が名乗った時点で `ambiguous` へ移す。 */
  const claims = new Map<string, number>();
  const ambiguous = new Set<string>();
  const members: ProjectMember[] = [];

  /** 表示名にもログイン名にも同じ規則を当てる。**同じ人が2度名乗るのは衝突ではない。** */
  const claim = (name: string, id: number): void => {
    const claimed = claims.get(name);
    if (claimed !== undefined && claimed !== id) {
      ambiguous.add(name);
      return;
    }
    claims.set(name, id);
  };

  for (const item of value) {
    if (!isNamedId(item)) {
      throw new MasterDataError(`${where} の応答に { id, name } でない要素が含まれています`);
    }
    // ログイン名は**全員が持つとは限らない**（実データで `userId: null` のユーザーを確認）
    const loginName =
      isRecord(item) && typeof item['userId'] === 'string' && item['userId'] !== ''
        ? item['userId']
        : undefined;

    claim(item.name, item.id);
    if (loginName !== undefined) {
      claim(loginName, item.id);
    }
    // ログイン名の有無にかかわらず1件。持たない人を一覧から落とすと、
    // **指定できるのに候補に見えない**（表示名では引ける）
    members.push(
      Object.freeze(loginName === undefined ? { name: item.name } : { name: item.name, loginName }),
    );
  }

  const result = new Map<string, number>();
  for (const [name, id] of claims) {
    if (!ambiguous.has(name)) {
      result.set(name, id);
    }
  }

  if (result.size === 0) {
    throw new MasterDataError(`${where} の応答が空です`);
  }
  return {
    userIds: freezeMap(result),
    ambiguous: Object.freeze(ambiguous),
    members: Object.freeze(members),
  };
};

interface BacklogProject {
  readonly id: number;
  readonly projectKey: string;
}

const isBacklogProject = (value: unknown): value is BacklogProject =>
  isRecord(value) && typeof value['id'] === 'number' && typeof value['projectKey'] === 'string';

/** 名前は**あれば使う**。無ければキーだけで案内する（応答の形を理由に起動を止めない）。 */
const projectNameOf = (value: unknown): string | undefined =>
  isRecord(value) && typeof value['name'] === 'string' && value['name'] !== ''
    ? value['name']
    : undefined;

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
): Promise<{
  readonly projectIds: ReadonlyMap<string, number>;
  readonly projectNames: ReadonlyMap<string, string>;
}> => {
  // クエリを一切渡さない。`all` を「false で送る」のではなく「送らない」。
  const response = await gateway.send({ endpoint: '/projects', method: 'GET' });

  if (!Array.isArray(response)) {
    throw new MasterDataError('GET /projects の応答が配列ではありません');
  }

  const available = new Map<string, number>();
  const names = new Map<string, string>();
  for (const item of response) {
    if (!isBacklogProject(item)) {
      throw new MasterDataError('GET /projects の応答に projectKey / id でない要素があります');
    }
    available.set(item.projectKey, item.id);
    const name = projectNameOf(item);
    if (name !== undefined) {
      names.set(item.projectKey, name);
    }
  }

  const resolved = new Map<string, number>();
  const resolvedNames = new Map<string, string>();
  const missing: string[] = [];
  for (const projectKey of projectKeys) {
    const projectId = available.get(projectKey);
    if (projectId === undefined) {
      missing.push(projectKey);
      continue;
    }
    resolved.set(projectKey, projectId);
    const name = names.get(projectKey);
    if (name !== undefined) {
      resolvedNames.set(projectKey, name);
    }
  }

  // 黙って落とさない（規約 §5.4）。解決できないキーが1つでもあれば起動しない。
  if (missing.length > 0) {
    throw new MasterDataError(
      `ポリシーのプロジェクトを解決できません: ${missing.join(', ')}。` +
        'スペースに存在し、この API キーの持ち主が参加しているか確認してください',
    );
  }

  return { projectIds: freezeMap(resolved), projectNames: freezeMap(resolvedNames) };
};

/**
 * 1プロジェクトぶんのマスタを引く。5本は互いに独立なので並列に投げる（規約 §5.3）。
 *
 * **許可プロジェクト全部について呼ぶ。** 当初は書き込みを許したものだけに絞っていたが、
 * 「状態で絞る」「担当者で絞る」は read の操作なので、書き込みの有無で切り分けられない
 * （下の `resolveMasters` に経緯がある）。
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

  const { userIds, ambiguous, members } = toUserIds(users, `GET ${base}/users（${projectKey}）`);

  return Object.freeze({
    // 種別と状態はプロジェクトに必ず1つ以上ある。空なら応答の形を疑う
    issueTypeIds: toNameToId(issueTypes, `GET ${base}/issueTypes（${projectKey}）`),
    statusIds: toNameToId(statuses, `GET ${base}/statuses（${projectKey}）`),
    categoryIds: toNameToIdAllowingEmpty(categories, `GET ${base}/categories（${projectKey}）`),
    versionIds: toNameToIdAllowingEmpty(versions, `GET ${base}/versions（${projectKey}）`),
    userIds,
    ambiguousUserNames: ambiguous,
    members,
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

  const [projects, priorities, resolutions, myself] = await Promise.all([
    resolveProjectIds(gateway, projectKeys),
    gateway.send({ endpoint: '/priorities', method: 'GET' }),
    gateway.send({ endpoint: '/resolutions', method: 'GET' }),
    gateway.send({ endpoint: '/users/myself', method: 'GET' }),
  ]);

  const perProject = new Map<string, ProjectMasters>();
  const resolved = await Promise.all(
    [...projects.projectIds].map(async ([projectKey, projectId]) => {
      return [projectKey, await resolveProjectMasters(gateway, projectKey, projectId)] as const;
    }),
  );
  for (const [projectKey, masters] of resolved) {
    perProject.set(projectKey, masters);
  }

  return Object.freeze({
    projectIds: projects.projectIds,
    projectNames: projects.projectNames,
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
 * 選べる名前をメッセージに載せる。LLM が自分で言い直せるようにするため。
 *
 * **名前の出所は一様ではない。** 一次情報（`developer.nulab.com`、2026-09-07 確認）では、
 * `status` は「管理者」、`priority` / `resolution` は書き込む口が API に無いが、
 * **`issueType` / `category` / マイルストーン / 担当者は第三者が書ける**
 * （追加も更新も「すべての権限」。担当者の表示名は本人が変更できる）。
 *
 * **候補はメッセージに入れず `candidates` で渡す**（T-2 ③・2026-09-07 裁定）。
 * ここは `domain/` なので `untrusted` を知らない（DESIGN.md §4 の語彙表）。
 * 囲んで文言に組むのは `tool/` 層の seam の仕事で、**この関数は候補を構造で運ぶだけ**。
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
  const listed = names.slice(0, MAX_LISTED_NAMES);
  throw new MasterDataError(
    names.length === 0
      ? `${what}「${name}」は指定できません（このプロジェクトには定義がありません）`
      : `${what}「${name}」は見つかりません`,
    { candidates: listed, omittedCandidates: names.length - listed.length },
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
 * projectId から projectKey を引く。**逆引きは「引けたら返す」**（引けなくても送出しない）。
 *
 * 応答に載っている `projectId` を出力の `projectKey` に直すために使う。**数値 ID は出さない**
 * （原則4）ので、引けなければ**項目ごと落とす** — 推測で埋めるより、無いことを無いと示す。
 * 許可外のプロジェクトが応答に混ざれば引けないので、**そこが黙って通ることもない**。
 *
 * @param masters - 解決済みマスタ
 * @param projectId - Backlog の応答に載っていた数値 ID
 * @returns プロジェクトキー。引けなければ `undefined`
 */
export const projectKeyOf = (masters: Masters, projectId: number): string | undefined => {
  for (const [projectKey, id] of masters.projectIds) {
    if (id === projectId) {
      return projectKey;
    }
  }
  return undefined;
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
