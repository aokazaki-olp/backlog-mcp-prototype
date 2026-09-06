import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * 全域で禁止する import。
 *
 * `child_process` は「子プロセスを起動できる権限は権限モデル全体を無効化する」ため
 * （Deno の `--allow-run` と同じ議論。MCP 関連 CVE の最多カテゴリでもある）。
 */
const FORBIDDEN_MODULES = [
  {
    name: 'child_process',
    message: '子プロセスを起動しない。HTTP とファイル読み込み以外の外部作用を持たせない。',
  },
  {
    name: 'node:child_process',
    message: '子プロセスを起動しない。HTTP とファイル読み込み以外の外部作用を持たせない。',
  },
];

/**
 * 相対 import に `.js` を書かせない（実ファイルは `.ts`。規約 §2.2）。
 *
 * ただし `src/libs/` だけは例外。あそこは借り物をコンパイルした生成物で、
 * **実ファイルが `.js`** である。規約の趣旨は「実ファイルの拡張子を書く」なので、
 * libs へは `.js` を書くのが正しい。
 */
const RELATIVE_JS_PATTERNS = [
  {
    group: ['./*.js', '../*.js', './**/*.js', '../**/*.js', '!**/libs/*.js'],
    message: '相対 import には実ファイルの拡張子 `.ts` を書く（規約 §2.2）。',
  },
];

/**
 * 層をまたぐ import を禁止する設定を組み立てる。
 *
 * flat config では後続ブロックがルール設定を丸ごと置き換えるため、
 * 全域の禁止事項を毎回混ぜ直す必要がある。
 *
 * @param extraPatterns - その層に固有の禁止パターン
 * @returns `no-restricted-imports` のオプション
 */
const restrictedImports = (extraPatterns = []) => [
  'error',
  {
    paths: FORBIDDEN_MODULES,
    patterns: [...RELATIVE_JS_PATTERNS, ...extraPatterns],
  },
];

/** 実行できない TypeScript 構文（規約 §4.8）。コンパイラもバンドラも素通りさせるため lint でしか止められない。 */
const UNRUNNABLE_SYNTAX = [
  {
    selector: 'Decorator',
    message:
      'デコレータ構文は Node の型注釈除去を通過して実行時に SyntaxError になる（規約 §4.8）。',
  },
  {
    selector: 'AccessorProperty',
    message:
      '`accessor` フィールドは Node の型注釈除去を通過して実行時に SyntaxError になる（規約 §4.8）。',
  },
];

/** 動的 import の相対パスに `.js` を書かせない（静的 import 用のルールでは捕まらない）。 */
const DYNAMIC_IMPORT_JS = {
  selector: 'ImportExpression > Literal[value=/^\\.\\.?\\/.*\\.js$/]',
  message: '相対 import には実ファイルの拡張子 `.ts` を書く（規約 §2.2）。動的 import も同じ。',
};

/** `.then()` チェーンを禁止する（規約 §5.3）。 */
const NO_THEN_CHAIN = {
  selector: 'CallExpression > MemberExpression[property.name="then"]',
  message: '`.then()` チェーンではなく async / await を使う（規約 §5.3）。',
};

/** 本体コードの共通ルール。 */
const commonRules = {
  'no-restricted-imports': restrictedImports(),
  'no-restricted-syntax': ['error', ...UNRUNNABLE_SYNTAX, DYNAMIC_IMPORT_JS, NO_THEN_CHAIN],
  'no-restricted-properties': [
    'error',
    { property: 'forEach', message: '`forEach` ではなく `for...of` を使う（規約 §5.1）。' },
  ],
  'no-var': 'error',
  curly: ['error', 'all'],
  yoda: 'error',
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-fallthrough': 'error',
  'max-statements-per-line': ['error', { max: 1 }],
};

export default tseslint.config(
  {
    // 借り物・生成物は検査範囲の外（規約 §8.3）。`tools/*/raw/` はミラー生成が
    // 取得した原文で、schema.ts 等の他所のコードが混ざる。
    ignores: ['node_modules/', 'dist/', 'docs/reference/', 'src/libs/', 'tools/*/raw/'],
  },

  // 不要になった抑制コメントを検出してビルドを落とす（規約 §4.7・§8.1）
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // ── 設定ファイル・スクリプト（ESM の .js / .mjs）─────────────────
  // 型注釈を持たないので型情報を使う lint の対象にしない（規約 §8.1）。
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.nodeBuiltin,
    },
    rules: commonRules,
  },

  // ── 本体（Node が直接実行する .ts / .mts）─────────────────────────
  {
    files: ['src/**/*.ts', 'src/**/*.mts', 'tests/**/*.ts', 'tests/**/*.mts', '*.ts'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.nodeBuiltin,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...commonRules,

      // 「厳格」プリセットに含まれないので明示的に足す（規約 §8.1）
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // 未使用は3種すべてで `_` 接頭辞を除外する（規約 §3）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // node:test の宣言関数は Promise を返すが、戻り値を捨ててよい（規約 §8.1）
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['describe', 'it', 'test', 'suite'] },
          ],
        },
      ],
    },
  },

  // ── 層の境界（規約 §2.6・Electron の preload 分離に倣う）─────────
  // Electron は3プロセスで構造的に語彙を分けるが、こちらは1プロセスなので lint で代替する。
  {
    files: ['src/tool/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImports([
        {
          group: ['**/libs/**'],
          message: 'tool 層は HTTP を知らない。api 呼び出しは domain 層を経由する。',
        },
      ]),
    },
  },
  {
    files: ['src/policy/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImports([
        {
          group: ['**/libs/**', '**/domain/**', '**/tool/**'],
          message:
            'policy 層は projectKey と toolName しか知らない。エンドポイントも HTTP も知らない。',
        },
      ]),
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': restrictedImports([
        {
          group: ['**/tool/**', '**/policy/**'],
          message: 'domain 層は MCP もスコープも知らない（依存は一方向。規約 §2.6）。',
        },
      ]),
    },
  },

  // ── テスト（規約 §7.1: 本体と同じ制約をかけない）─────────────────
  // ただし実行可能性のガード（デコレータ・accessor）は緩めない。
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  prettier,

  // ── 整形ツールが消すが、規約が要求するもの ─────────────────────────
  // eslint-config-prettier は `curly` と `max-statements-per-line` を off にする。
  // 規約 §8.1 は「整形ツールは一行化を展開するが、整形を通さない経路が残るので
  // lint 側でも塞ぐ」と要求しているため、prettier の後で復活させる。
  // （§8.3 の検証で、無効化されていたことを実際に検出した）
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts', '**/*.mts'],
    rules: {
      curly: ['error', 'all'],
      'max-statements-per-line': ['error', { max: 1 }],
    },
  },
);
