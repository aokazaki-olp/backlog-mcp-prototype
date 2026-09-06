#!/usr/bin/env python3
"""raw/ から docs/reference/mcp/ 一式（Markdown / pages.json / README）を生成する。"""
import json
import os
import re
import shutil
import sys
from collections import Counter, OrderedDict, defaultdict

import convert as C

OUT = sys.argv[1]
FETCHED = '2026-09-06'
SITE = C.SITE
GH = 'https://github.com/modelcontextprotocol/modelcontextprotocol'
VERSIONS = ('2025-06-18', '2025-11-25', '2026-07-28')
LATEST = '2026-07-28'

SECTION_LABEL = OrderedDict([
    ('specification', '仕様'),
    ('guides', 'ガイド'),
    ('extensions', '拡張仕様'),
])


def load_links():
    rows = []
    for line in open('links.tsv', encoding='utf-8'):
        if not line.strip():
            continue
        cells = line.rstrip('\n').split('\t')
        path, title = cells[0], cells[1]
        desc = cells[2] if len(cells) > 2 else ''
        rows.append((C.normalize_path(path), title, desc))
    return rows


def load_redirects():
    """fetch 時に記録した転送先。404 は転送ではないので地図に入れない"""
    redirects = {}
    dead = []
    path = 'raw/redirects.tsv'
    if not os.path.exists(path):
        return redirects, dead
    for line in open(path, encoding='utf-8'):
        if not line.strip():
            continue
        src, code, final = line.rstrip('\n').split('\t')
        if code != '200':
            dead.append((src, code))
        elif C.normalize_path(final) != src:
            redirects[src] = C.normalize_path(final)
    return redirects, dead


def classify(path):
    """サイトのパスから (section, version, ミラー内の相対パス) を決める"""
    parts = path.strip('/').split('/')
    if parts[0] == 'specification':
        version, rest = parts[1], parts[2:]
        return 'specification', version, '/'.join(['specification', version] + (rest or ['index'])) + '.md'
    if parts[0] == 'docs':
        version, rest = parts[1], parts[2:]
        return 'guides', version, '/'.join(['guides', version] + (rest or ['index'])) + '.md'
    if parts[0] == 'extensions':
        rest = parts[1:] or ['index']
        return 'extensions', None, '/'.join(['extensions'] + rest) + '.md'
    raise SystemExit(f'対象外のパス: {path}')


def front_matter(d):
    lines = ['---']
    for k, v in d.items():
        if v is None:
            continue
        s = str(v)
        if re.search(r'[:#\[\]{}&*?|<>=!%@`"\']', s) or s != s.strip():
            s = '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
        lines.append(f'{k}: {s}')
    lines.append('---')
    return '\n'.join(lines) + '\n\n'


# コードフェンス。MDX コンポーネントの中では字下げされるので先頭の空白を許す。
FENCE = re.compile(r'(?ms)^[ \t]*```.*?^[ \t]*```[ \t]*$')


def summary(body, limit=78):
    """本文の最初の段落を 1 行の説明に畳む（llms.txt に説明が無いページ用）"""
    text = FENCE.sub('', body)
    text = re.sub(r'(?m)^#.*$', '', text)
    text = re.sub(r'(?s)<[A-Za-z][^>]*>', '', text)
    for block in text.split('\n\n'):
        b = block.strip()
        if not b or b.startswith(('|', '-', '*', '>', '<', '[')):
            continue
        b = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', b)
        b = re.sub(r'[`*]', '', b)
        b = re.sub(r'\s+', ' ', b).strip()
        if not b:
            continue
        return b if len(b) <= limit else b[: limit - 1].rstrip() + '…'
    return ''


def raw_name(path):
    """正規化で `/index` を落としたパスから raw/ のファイル名に戻す"""
    for candidate in (path, path + '/index'):
        name = 'raw/' + candidate.strip('/').replace('/', '__') + '.md'
        if os.path.exists(name):
            return name
    return 'raw/' + path.strip('/').replace('/', '__') + '.md'


links = load_links()
redirects, dead = load_redirects()

page_map = {}
for path, _title, _desc in links:
    page_map[path] = classify(path)[2]

# ---- ページを変換して書き出す ----
pages = []
bodies = {}
for path, title, desc in links:
    section, version, local = classify(path)
    src = raw_name(path)
    if not os.path.exists(src):
        # llms.txt にあるのに raw/ に無い＝取得が落ちている。黙って減らさない。
        raise SystemExit(f'未取得のページがある: {path}（fetch.sh を回し直すこと）')
    body = C.convert(src, path, page_map, local, redirects)
    bodies[local] = body
    os.makedirs(os.path.join(OUT, os.path.dirname(local)), exist_ok=True)
    fm = front_matter(OrderedDict([
        ('title', title), ('section', section), ('version', version),
        ('source', SITE + path), ('fetched', FETCHED),
    ]))
    open(os.path.join(OUT, local), 'w', encoding='utf-8').write(fm + body)
    pages.append(OrderedDict([
        ('section', section), ('version', version), ('title', title),
        ('description', desc or summary(body)), ('sitePath', path),
        ('source', SITE + path), ('file', local),
    ]))

# ---- スキーマの実体（サイトの schema ページは typedoc の HTML なので別途取る）----
commit = open('raw/schema/COMMIT', encoding='utf-8').read().strip()
schema_files = []
for version in VERSIONS:
    os.makedirs(f'{OUT}/schema/{version}', exist_ok=True)
    for name in ('schema.ts', 'schema.json'):
        shutil.copyfile(f'raw/schema/{version}__{name}', f'{OUT}/schema/{version}/{name}')
        schema_files.append(OrderedDict([
            ('version', version), ('file', f'schema/{version}/{name}'),
            ('source', f'{GH}/blob/{commit}/schema/{version}/{name}'),
        ]))

json.dump(OrderedDict([
    ('source', SITE), ('language', 'en'), ('fetchedAt', FETCHED),
    ('versions', list(VERSIONS)), ('latest', LATEST),
    ('schemaCommit', commit),
    ('count', len(pages)), ('pages', pages), ('schema', schema_files),
]), open(f'{OUT}/pages.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(f'{OUT}/pages.json', 'a', encoding='utf-8').write('\n')

# ---- README ----
by_section = defaultdict(lambda: defaultdict(list))
for p in pages:
    by_section[p['section']][p['version']].append(p)

L = []
L.append('# MCP 仕様リファレンス（ミラー）\n')
L.append(f'[modelcontextprotocol.io]({SITE}) が公開している Model Context Protocol の'
         '仕様・ガイド・拡張仕様を Markdown 化したもの。\n')
L.append(f'- 取得日: {FETCHED}')
L.append(f'- 対象の版: ' + '、'.join(f'`{v}`' for v in VERSIONS) +
         f'（`{LATEST}` が最新リリース版。`/specification` はここへ転送される）')
L.append(f'- ページ数: {len(pages)}')
L.append('- 機械可読な索引: [pages.json](pages.json)')
L.append('- 一次情報は上記サイト。内容が食い違う場合は本ミラーではなく公式ドキュメントを正とする。')
L.append('- 再生成: [`tools/mcp-docs/`](../../../tools/mcp-docs/README.md)'
         '（手書きしないこと。編集しても次の生成で上書きされる）\n')
L.append('この 3 版を選んでいるのは、本リポジトリの'
         ' [`src/mcp/protocol.ts`](../../../src/mcp/protocol.ts) が'
         'この 3 つを対応版として宣言しているため。\n')

L.append('## スキーマ\n')
L.append('仕様書が authoritative と呼んでいるのは TypeScript スキーマの方。'
         'サイトの `schema` ページはそれを typedoc で描画したものなので、'
         '実体はリポジトリから取って併置している。\n')
L.append(f'取得元: [`{GH}`]({GH}/tree/{commit}/schema)（commit `{commit[:12]}`）\n')
L.append('| 版 | TypeScript | JSON Schema | 描画版 |')
L.append('| --- | --- | --- | --- |')
for version in VERSIONS:
    L.append(f'| `{version}` | [schema.ts](schema/{version}/schema.ts) | '
             f'[schema.json](schema/{version}/schema.json) | '
             f'[schema.md](specification/{version}/schema.md) |')
L.append('')

for section, label in SECTION_LABEL.items():
    versions = sorted(by_section[section], key=lambda v: (v is None, v))
    total = sum(len(by_section[section][v]) for v in versions)
    L.append(f'## {label}（{total} ページ）\n')
    for version in versions:
        if version is not None:
            L.append(f'### `{version}`\n')
        L.append('| ページ | 内容 |')
        L.append('| --- | --- |')
        for p in sorted(by_section[section][version], key=lambda p: p['file']):
            rel = os.path.relpath(p['file'], '.')
            L.append(f'| [{p["title"]}]({rel}) | {p["description"] or "—"} |')
        L.append('')

# ---- 変換で加えた手（忠実性の限界を明示する）----
mdx = Counter()
for local, body in bodies.items():
    prose = FENCE.sub('', body)
    prose = re.sub(r'`[^`\n]*`', '', prose)
    # 行頭か空白の直後だけを見る。`List<String>` のようなジェネリクスを拾わないため。
    for tag in set(re.findall(r'(?:^|[\s(])<([A-Z][A-Za-z]*)[ />]', prose)):
        mdx[tag] += 1

L.append('## 変換で加えた手\n')
L.append('原文に忠実な変換を優先しているが、次の 4 点だけは手を入れている。\n')
L.append('| 対象 | 扱い |')
L.append('| --- | --- |')
L.append('| 全ページ冒頭のブロック引用（「llms.txt を取得せよ」） | 落とす。'
         '本文ではなく取得側への指示であり、ミラーに残すと読み手への指示として働く |')
L.append('| `<div id="enable-section-numbers" />` | 落とす（Mintlify の描画指示で中身が無い） |')
L.append('| サイト絶対パスのリンク | 対象内はミラー内の相対パスへ、対象外は絶対 URL へ書き換える |')
L.append(f'| `schema` ページの typedoc HTML | 型ごとの見出し・シグネチャ・説明に組み直す。'
         f'見出しは原文の `` ### `型名` `` を保つので `schema#型名` のアンカーは解決する。'
         f'非推奨メンバーは原文が取り消し線で示すので `(deprecated)` と付記する。'
         f'メンバー個別のアンカー（`#tool-description` 等）は失われるので、'
         f'厳密に追うときは [schema.ts](schema/{LATEST}/schema.ts) を見る |')
L.append('')
if mdx:
    L.append('MDX コンポーネントは原文のまま残している'
             '（Markdown ビューアでは描画されない）。内訳は次のとおり。\n')
    L.append('| コンポーネント | ページ数 |')
    L.append('| --- | --- |')
    # 件数が同じ行の順序を確定させる。most_common() は同数を挿入順で並べ、その挿入順は
    # set の反復順（hash 乱数化に依存）から来るので、揃えないと実行ごとに出力が変わる。
    for tag, n in sorted(mdx.items(), key=lambda kv: (-kv[1], kv[0])):
        L.append(f'| `<{tag}>` | {n} |')
    L.append('')

# ---- 原文側の癖（生成時に自動検出）----
L.append('## 原文側の癖\n')
L.append('公式サイトの側にある挙動。ミラーは追随しているだけなので、'
         '公式側が直せば次の再生成で消える。\n')

odd = [(src, dst) for src, dst in sorted(redirects.items())
       if re.search(r'/(\d{4}-\d{2}-\d{2})/', src)
       and re.search(r'/(\d{4}-\d{2}-\d{2})/', dst)
       and re.search(r'/(\d{4}-\d{2}-\d{2})/', src).group(1)
       != re.search(r'/(\d{4}-\d{2}-\d{2})/', dst).group(1)]
if odd:
    L.append('### 版をまたぐ転送\n')
    L.append('版付きのパスが、別の版のページへ転送される。'
             'ミラーは転送先（＝実際に表示されるページ）へリンクしている。\n')
    L.append('| 参照されているパス | 実際の転送先 |')
    L.append('| --- | --- |')
    for src, dst in odd:
        L.append(f'| `{src}` | `{dst}` |')
    L.append('')

referenced = set()
for body in bodies.values():
    referenced.update(re.findall(r'https://modelcontextprotocol\.io(/[^)\s"#]*)', body))
dead = [(src, code) for src, code in dead if src in referenced]
if dead:
    L.append('### 到達できない参照先\n')
    L.append('ミラーのページから参照されているが、取得時に 200 を返さなかったパス。\n')
    L.append('| パス | ステータス |')
    L.append('| --- | --- |')
    for src, code in sorted(dead):
        L.append(f'| `{src}` | {code} |')
    L.append('')

alias = sorted(s for s in redirects if s.startswith('/specification/latest'))
if alias:
    L.append('### 別名パス\n')
    L.append(f'`/specification/latest/...` は最新リリース版（`{LATEST}`）への別名で、'
             f'{len(alias)} 通りのパスが原文から参照されている。'
             'ミラーでは解決済みの版へリンクしている。\n')

open(f'{OUT}/README.md', 'w', encoding='utf-8').write('\n'.join(L))

# ---- 出力のリンクを検査する ----
# 検査は 2 つある。`rewrite_target` は page_map に無いパスを必ず絶対 URL に落とすので、
# 書き換えの取りこぼしは「壊れた相対リンク」ではなく「ミラー内へ張れるはずなのに絶対 URL
# のまま」という形で現れる。前者だけを見ても発火しない。
broken, escaped = [], []
for root, _, names in os.walk(OUT):
    for name in names:
        if not name.endswith('.md'):
            continue
        src = os.path.join(root, name)
        text = open(src, encoding='utf-8').read()
        found = (re.findall(r'\[([^\]]*)\]\(([^)\s]+)\)', text)
                 + re.findall(r'(?m)^\[([^\]]+)\]:\s+(\S+)$', text))
        for label, href in found:
            path = href.split('#')[0]
            if not path or path.startswith(('http://', 'https://', 'mailto:', 'data:')):
                continue
            target = os.path.normpath(os.path.join(root, path))
            if os.path.relpath(target, OUT).startswith('..'):
                continue  # 出力の外を指すリンクは生成側の責任範囲外
            if not os.path.exists(target):
                broken.append(f'{os.path.relpath(src, OUT)}: [{label}]({href})')
        # front matter の `source` は原文の所在なので、絶対 URL のままが正しい
        body = re.sub(r'\A---\n.*?\n---\n', '', text, flags=re.S)
        for ref in re.findall(re.escape(SITE) + r'(/[^)\s"\']*)', body):
            path = C.normalize_path(ref.split('#')[0])
            if C.normalize_path(redirects.get(path, path)) in page_map:
                escaped.append(f'{os.path.relpath(src, OUT)}: {SITE}{ref}')
if broken:
    raise SystemExit('解決できない相対リンク:\n  ' + '\n  '.join(broken))
if escaped:
    raise SystemExit('ミラー内へ張れるはずが絶対 URL のまま:\n  ' + '\n  '.join(escaped))

print(f'pages={len(pages)} schema={len(schema_files)} redirects={len(redirects)} dead={len(dead)}')
