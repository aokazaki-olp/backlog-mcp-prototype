/**
 * policy.ts
 *
 * @description ポリシー記法を正規形（projectKey → 許可ツール名の集合）へ展開する
 */

import { createHash } from 'node:crypto';
import { CAN_LEVELS, PolicyError, TOOLSETS, TOOL_NAMES, TOOL_SPECS } from '../contract.ts';
import { freezeMap, freezeSet } from '../shared/freezeCollection.ts';
import type { Can, ResolvedPolicy, ScopeSet, ToolName, Toolset } from '../contract.ts';

/** プロジェクトキーの形式。一次情報より「半角英大文字と半角数字とアンダースコア」。 */
const PROJECT_KEY_PATTERN = /^[A-Z0-9_]+$/;

/** 記法を検証して得られる、1プロジェクト分の設定。 */
interface PolicyEntry {
  readonly projectKey: string;
  readonly can: Can;
  readonly toolsets: ReadonlySet<Toolset>;
}

export interface LoadPolicyOptions {
  /** true のとき、ポリシーの記述を無視して全プロジェクトを `read` に切り下げる。絞る方向にしか効かない。 */
  readonly readOnly?: boolean;
}

// ============================================================================
// 検証
// ============================================================================

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const canRank = (can: Can): number => CAN_LEVELS.indexOf(can);

const isCan = (value: unknown): value is Can =>
  typeof value === 'string' && (CAN_LEVELS as readonly string[]).includes(value);

const isToolset = (value: unknown): value is Toolset =>
  typeof value === 'string' && (TOOLSETS as readonly string[]).includes(value);

const parseProjectKey = (value: unknown, where: string): string => {
  if (typeof value !== 'string' || value === '') {
    throw new PolicyError(`${where}: プロジェクトキーには空でない string を指定してください`);
  }
  if (!PROJECT_KEY_PATTERN.test(value)) {
    throw new PolicyError(
      `${where}: プロジェクトキー "${value}" の形式が不正です（半角英大文字・半角数字・アンダースコアのみ）`,
    );
  }
  return value;
};

const parseToolsets = (value: unknown, where: string): ReadonlySet<Toolset> => {
  if (value === undefined) {
    return new Set(TOOLSETS);
  }
  if (!Array.isArray(value) || value.length === 0) {
    throw new PolicyError(`${where}: toolsets には空でない配列を指定してください`);
  }
  const result = new Set<Toolset>();
  for (const item of value) {
    if (!isToolset(item)) {
      throw new PolicyError(
        `${where}: 未知の toolset ${JSON.stringify(item)}（使えるのは ${TOOLSETS.join(' / ')}）`,
      );
    }
    result.add(item);
  }
  return result;
};

/** エントリに書ける鍵。未知の鍵は起動失敗にする（`cans` のようなタイポを黙って通さない）。 */
const ENTRY_KEYS: readonly string[] = ['key', 'can', 'toolsets'];

const parseEntry = (value: unknown, index: number): PolicyEntry => {
  const where = `projects[${String(index)}]`;

  if (typeof value === 'string') {
    return {
      projectKey: parseProjectKey(value, where),
      can: 'read',
      toolsets: new Set(TOOLSETS),
    };
  }

  if (!isRecord(value)) {
    throw new PolicyError(`${where}: 文字列またはオブジェクトを指定してください`);
  }

  for (const key of Object.keys(value)) {
    if (!ENTRY_KEYS.includes(key)) {
      throw new PolicyError(
        `${where}: 未知の項目 "${key}"（書けるのは ${ENTRY_KEYS.join(' / ')}）`,
      );
    }
  }

  const rawCan = value['can'];
  if (rawCan !== undefined && !isCan(rawCan)) {
    throw new PolicyError(
      `${where}: 未知の can ${JSON.stringify(rawCan)}（使えるのは ${CAN_LEVELS.join(' / ')}）`,
    );
  }

  return {
    projectKey: parseProjectKey(value['key'], where),
    can: rawCan ?? 'read',
    toolsets: parseToolsets(value['toolsets'], where),
  };
};

/** トップレベルに書ける鍵。 */
const ROOT_KEYS: readonly string[] = ['projects'];

const parseEntries = (source: unknown): readonly PolicyEntry[] => {
  if (!isRecord(source)) {
    throw new PolicyError('ポリシーはオブジェクトである必要があります');
  }

  for (const key of Object.keys(source)) {
    if (!ROOT_KEYS.includes(key)) {
      throw new PolicyError(`未知の項目 "${key}"（書けるのは ${ROOT_KEYS.join(' / ')}）`);
    }
  }

  const projects = source['projects'];
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new PolicyError(
      'projects は必須で、空にできません。ワイルドカードは用意していないので、対象を列挙してください',
    );
  }

  const entries: PolicyEntry[] = [];
  const seen = new Set<string>();
  for (const [index, raw] of projects.entries()) {
    const entry = parseEntry(raw, index);
    if (seen.has(entry.projectKey)) {
      throw new PolicyError(`projects[${String(index)}]: "${entry.projectKey}" が重複しています`);
    }
    seen.add(entry.projectKey);
    entries.push(entry);
  }
  return entries;
};

// ============================================================================
// 展開
// ============================================================================

const expand = (entries: readonly PolicyEntry[], readOnly: boolean): ScopeSet => {
  const scopes = new Map<string, ReadonlySet<ToolName>>();

  for (const entry of entries) {
    const effectiveCan: Can = readOnly ? 'read' : entry.can;
    const allowed = new Set<ToolName>();

    for (const toolName of TOOL_NAMES) {
      const spec = TOOL_SPECS[toolName];
      if (!entry.toolsets.has(spec.toolset)) {
        continue;
      }
      if (canRank(effectiveCan) < canRank(spec.requires)) {
        continue;
      }
      allowed.add(toolName);
    }

    scopes.set(entry.projectKey, freezeSet(allowed));
  }

  return freezeMap(scopes);
};

/**
 * 正規形のハッシュ。記法ではなく展開結果に対して取るので、書き方を変えても
 * 権限が同じならハッシュが同じ。逆にハッシュが変わったら必ず権限が変わっている。
 */
const hashScopes = (scopes: ScopeSet): string => {
  const canonical = [...scopes.entries()]
    .map(([projectKey, tools]) => `${projectKey}:${[...tools].sort().join(',')}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
};

// ============================================================================
// 公開 API
// ============================================================================

/**
 * ポリシー記法を検証して正規形へ展開する。純関数。
 *
 * 未知の項目・未知の値・空の projects はすべて送出する。設定ミスが「静かに全開放」では
 * なく「起動しない」に転ぶようにするため、既定へのフォールバックは一切しない。
 *
 * @param source - `JSON.parse` した結果（未検証の外部データ）
 * @param options - 読み取り専用への切り下げ等
 * @returns 展開・凍結済みのポリシー
 * @throws {PolicyError} 記法が不正な場合
 */
export const loadPolicy = (source: unknown, options: LoadPolicyOptions = {}): ResolvedPolicy => {
  const entries = parseEntries(source);
  // expand の中で Map / Set を凍結している。ポリシーを変更するツールは作らないので、
  // 起動後に権限が広がる経路は型でも実行時にも存在しない。
  const scopes = expand(entries, options.readOnly ?? false);

  return Object.freeze({ scopes, hash: hashScopes(scopes) });
};

/**
 * あるプロジェクトでツールが許可されているかを判定する。
 *
 * `tools/list` の生成もハンドラの確認も、この同じ関数を通す。
 *
 * @param policy - 展開済みポリシー
 * @param projectKey - 対象プロジェクトキー
 * @param toolName - 対象ツール名
 * @returns 許可されていれば true
 */
export const isAllowed = (
  policy: ResolvedPolicy,
  projectKey: string,
  toolName: ToolName,
): boolean => policy.scopes.get(projectKey)?.has(toolName) ?? false;

/**
 * いずれかのプロジェクトで許可されているツール名を返す。`tools/list` の生成に使う。
 *
 * @param policy - 展開済みポリシー
 * @returns ツール名の集合
 */
export const listedTools = (policy: ResolvedPolicy): ReadonlySet<ToolName> => {
  const result = new Set<ToolName>();
  for (const tools of policy.scopes.values()) {
    for (const toolName of tools) {
      result.add(toolName);
    }
  }
  return result;
};

/**
 * そのツールが許可されているプロジェクトキーを返す。
 *
 * `scopeKind: 'filter'` のツールが、絞り込みパラメータを**ポリシー由来の値で上書き**
 * するために使う。LLM が渡した値は採用しない。
 *
 * @param policy - 展開済みポリシー
 * @param toolName - 対象ツール名
 * @returns プロジェクトキーの配列（決定的な順序）
 */
export const projectKeysFor = (policy: ResolvedPolicy, toolName: ToolName): readonly string[] => {
  const result: string[] = [];
  for (const [projectKey, tools] of policy.scopes) {
    if (tools.has(toolName)) {
      result.push(projectKey);
    }
  }
  return result.sort();
};

/**
 * 展開結果を人が読める形にする。stderr と監査ログへ出す。
 *
 * 正規形は**読めるが書けない**。ポリシーに書けるのは `projects` / `can` / `toolsets` だけ。
 *
 * @param policy - 展開済みポリシー
 * @returns 複数行の説明
 */
export const explainPolicy = (policy: ResolvedPolicy): string => {
  const lines = [`policy hash=${policy.hash}`];
  for (const [projectKey, tools] of [...policy.scopes.entries()].sort()) {
    const names = [...tools].sort();
    lines.push(`  ${projectKey}: ${names.length === 0 ? '(なし)' : names.join(', ')}`);
  }
  return lines.join('\n');
};
