#!/usr/bin/env python3
"""raw/*.html から docs/reference/api/ 一式（Markdown / endpoints.json / README）を生成する。"""
import json
import os
import re
import sys
from collections import Counter, OrderedDict, defaultdict

import convert as C

OUT = sys.argv[1]
C.KNOWN_API = {f[len('api__2__'):-len('.html')] for f in os.listdir('raw')
               if f.startswith('api__2__')}
FETCHED = '2026-08-30'
BASE = 'https://developer.nulab.com/ja/docs/backlog/'

GUIDES = OrderedDict([
    ('overview', '_index'),
    ('getting-started', 'getting-started'),
    ('auth', 'auth'),
    ('rate-limit', 'rate-limit'),
    ('error-response', 'error-response'),
    ('tips', 'tips'),
    ('libraries', 'libraries'),
    ('changelog', 'changelog'),
])

GUIDE_DESC = {
    'overview': 'Backlog API の概要・できること・CORS・Webhook',
    'getting-started': 'API キー発行から最初のリクエストを送るまでの手順',
    'auth': 'API キー方式と OAuth 2.0 方式の認証・認可',
    'rate-limit': 'ユーザーあたりの 1 分間リクエスト数の制限と応答ヘッダ',
    'error-response': 'エラー時のレスポンス形式とエラーコード一覧',
    'tips': '配列パラメーターの指定方法など利用上のヒント',
    'libraries': '公式・コミュニティ製の API ライブラリ一覧',
    'changelog': 'API 仕様の変更履歴',
}

CATEGORY_LABEL = {
    'space': 'スペース', 'users': 'ユーザー', 'groups': 'グループ',
    'teams': 'チーム', 'projects': 'プロジェクト', 'issues': '課題',
    'wikis': 'Wiki', 'git': 'Git', 'documents': 'ドキュメント',
    'notifications': 'お知らせ', 'watchings': 'ウォッチ', 'stars': 'スター',
    'statuses': '状態', 'priorities': '優先度', 'resolutions': '完了理由',
    'issueTypes': '種別', 'activities': 'アクティビティ',
    'rateLimit': 'レート制限',
}
CATEGORY_ORDER = ['space', 'activities', 'rateLimit', 'users', 'groups',
                  'teams', 'projects', 'issues', 'wikis', 'documents', 'git',
                  'notifications', 'watchings', 'stars', 'statuses',
                  'priorities', 'resolutions']


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


def split_sections(md):
    """'## 見出し' 単位に本文を分割する"""
    secs = OrderedDict()
    cur, buf = None, []
    for line in md.split('\n'):
        m = re.match(r'^## (.+)$', line)
        if m:
            if cur is not None:
                secs[cur] = '\n'.join(buf).strip()
            cur, buf = m.group(1).strip(), []
        else:
            (buf if cur is not None else []).append(line)
    if cur is not None:
        secs[cur] = '\n'.join(buf).strip()
    return secs


def parse_table(block):
    rows = []
    lines = [l for l in block.split('\n') if l.strip().startswith('|')]
    if len(lines) < 3:
        return rows
    for l in lines[2:]:
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        if not cells or not cells[0]:
            continue
        desc = cells[2] if len(cells) > 2 else (cells[1] if len(cells) > 1 else '')
        name, required, multiple = parse_param_name(cells[0])
        rows.append(OrderedDict([
            ('name', name),
            ('type', plain(cells[1]) if len(cells) > 2 else ''),
            ('required', required),
            ('multiple', multiple),
            ('description', plain(desc)),
        ]))
    return rows


def parse_param_name(raw):
    """'projectId（必須）' 等の注記をフラグとして切り出し、素のパラメーター名を返す"""
    s = plain(raw).replace('`', '')
    required = '必須' in s
    multiple = '複数指定可' in s
    s = re.sub(r'[（(][^)）]*[)）]', '', s)
    return s.strip(' 　*'), required, multiple


def plain(s):
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = s.replace('<br>', ' ').replace('&lt;', '<')
    s = re.sub(r'\\([\\`*])', r'\1', s)
    return re.sub(r'\s+', ' ', s).strip()


def first_paragraph(md):
    body = re.sub(r'^#\s.*$', '', md, count=1, flags=re.M)
    body = re.sub(r'```.*?```', '', body, flags=re.S)
    for blk in body.split('\n\n'):
        b = blk.strip()
        if b and not b.startswith(('#', '|', '-', '>')):
            return plain(b.split('  \n')[0])
    return ''


def count_source_h1(path):
    d = C.DOM()
    d.feed(open(path, encoding='utf-8').read())
    node = C.find_markdown_div(d.root)
    return sum(1 for n in C.walk(node) if n.tag == 'h1')


def fence_lines(md):
    """コードフェンスの中身の行を返す"""
    inside, out = False, []
    for line in md.split('\n'):
        if line.startswith('```'):
            inside = not inside
            continue
        if inside:
            out.append(line)
    return out


os.makedirs(f'{OUT}/v2', exist_ok=True)
os.makedirs(f'{OUT}/guides', exist_ok=True)

# ---- ガイドページ ----
guide_md = []
for slug, raw in GUIDES.items():
    md = C.convert(f'raw/{raw}.html', 'guides')
    guide_md.append(md)
    title = (re.search(r'^# (.+)$', md, re.M) or [None, slug])[1]
    fm = front_matter(OrderedDict([
        ('title', title), ('slug', slug),
        ('source', BASE + ('' if raw == '_index' else raw + '/')),
        ('fetched', FETCHED),
    ]))
    open(f'{OUT}/guides/{slug}.md', 'w', encoding='utf-8').write(fm + md)

# ---- API ページ ----
endpoints = []
md_by_slug = {}
src_h1 = {}
for f in sorted(os.listdir('raw')):
    if not f.startswith('api__2__'):
        continue
    slug = f[len('api__2__'):-len('.html')]
    md = C.convert(f'raw/{f}', 'v2')
    md_by_slug[slug] = md
    src_h1[slug] = count_source_h1(f'raw/{f}')
    title = (re.search(r'^# (.+)$', md, re.M) or [None, slug])[1]
    m = re.search(r'```http\n(GET|POST|PUT|PATCH|DELETE)\s+(\S+)', md)
    method, path = m.group(1), m.group(2)
    seg = path.split('/')[3] if len(path.split('/')) > 3 else ''
    category = seg if not seg.startswith(':') else 'other'
    if '/git/' in path:
        category = 'git'
    secs = split_sections(md)

    role = ''
    for k, v in secs.items():
        if '権限' in k:
            role = plain(re.sub(r'```', '', v))
            break
    params = OrderedDict()
    for k, v in secs.items():
        if 'パラメーター' not in k or '追加パラメーター' in k:
            continue
        key = ('url' if 'URL' in k else
               'query' if 'クエリ' in k else
               'request' if 'リクエスト' in k else k)
        rows = parse_table(v)
        if rows:
            params.setdefault(key, []).extend(rows)

    endpoints.append(OrderedDict([
        ('slug', slug), ('title', title), ('method', method), ('path', path),
        ('category', category), ('role', role),
        ('summary', first_paragraph(md)),
        ('doc', f'{BASE}api/2/{slug}/'), ('file', f'v2/{slug}.md'),
        ('parameters', params),
    ]))

    fm = front_matter(OrderedDict([
        ('title', title), ('slug', slug), ('method', method), ('path', path),
        ('category', category), ('source', f'{BASE}api/2/{slug}/'),
        ('fetched', FETCHED),
    ]))
    open(f'{OUT}/v2/{slug}.md', 'w', encoding='utf-8').write(fm + md)

endpoints.sort(key=lambda e: (CATEGORY_ORDER.index(e['category'])
                              if e['category'] in CATEGORY_ORDER else 99,
                              e['path'], e['method']))

json.dump(OrderedDict([
    ('source', BASE), ('language', 'ja'), ('fetchedAt', FETCHED),
    ('apiVersion', 'v2'), ('count', len(endpoints)), ('endpoints', endpoints),
]), open(f'{OUT}/endpoints.json', 'w', encoding='utf-8'),
    ensure_ascii=False, indent=2)
open(f'{OUT}/endpoints.json', 'a', encoding='utf-8').write('\n')

# ---- README ----
by_cat = defaultdict(list)
for e in endpoints:
    by_cat[e['category']].append(e)
cats = [c for c in CATEGORY_ORDER if c in by_cat] + \
       sorted(c for c in by_cat if c not in CATEGORY_ORDER)

L = []
L.append('# Backlog API リファレンス（日本語版ミラー）\n')
L.append(f'[developer.nulab.com]({BASE}) が公開している Backlog API v2 '
         f'ドキュメントの日本語版を Markdown 化したもの。\n')
L.append(f'- 取得日: {FETCHED}')
L.append(f'- エンドポイント数: {len(endpoints)}')
L.append('- 機械可読な索引: [endpoints.json](endpoints.json)'
         '（method / path / パラメーター / 権限を抽出したもの）')
L.append('- 一次情報は上記サイト。内容が食い違う場合は本ミラーではなく'
         '公式ドキュメントを正とする。')
L.append('- 再生成: [`tools/backlog-docs/`](../../../tools/backlog-docs/README.md)'
         '（手書きしないこと。編集しても次の生成で上書きされる）\n')
L.append('## ガイド\n')
L.append('| ページ | 内容 |')
L.append('| --- | --- |')
for slug in GUIDES:
    p = f'{OUT}/guides/{slug}.md'
    body = open(p, encoding='utf-8').read()
    t = re.search(r'^title: (.+)$', body, re.M).group(1).strip('"')
    desc = GUIDE_DESC.get(slug) or first_paragraph(
        re.sub(r'^---.*?---\n', '', body, flags=re.S))[:59]
    L.append(f'| [{t}](guides/{slug}.md) | {desc} |')
L.append('')
L.append('## エンドポイント\n')
for c in cats:
    label = CATEGORY_LABEL.get(c, c)
    L.append(f'### {label} (`/{c}`)\n')
    L.append('| メソッド | パス | 概要 |')
    L.append('| --- | --- | --- |')
    for e in by_cat[c]:
        L.append(f'| `{e["method"]}` | `{e["path"]}` | '
                 f'[{e["title"]}](v2/{e["slug"]}.md) |')
    L.append('')

# ---- 原文側の表記ゆれ・不備（生成時に自動検出） ----
L.append('## 原文側の既知の表記ゆれ・不備\n')
L.append('公式ドキュメントの記述そのものに含まれる揺れ・誤記。ミラーは原文に'
         '忠実な変換を優先しており、これらを正規化していない。'
         '以下は生成時に実データから自動検出したもので、'
         '公式側が修正すれば次の再生成で消える。\n')

types = Counter(p['type'] for e in endpoints
                for v in e['parameters'].values() for p in v)
L.append('### パラメーターの型表記\n')
L.append('同じ意味の型が大文字小文字・語彙違いで混在している。'
         '`endpoints.json` の `parameters[].type` には原文の値をそのまま入れている。\n')
L.append('| 型 | 件数 |')
L.append('| --- | --- |')
for t, n in sorted(types.items(), key=lambda kv: (-kv[1], kv[0])):
    L.append(f'| {"`" + t + "`" if t else "（記載なし）"} | {n} |')
no_type = sorted({e['slug'] for e in endpoints
                  for v in e['parameters'].values() for p in v if not p['type']})
if no_type:
    L.append('')
    L.append('型の記載が無いのは ' +
             '、'.join(f'[{s}](v2/{s}.md)' for s in no_type) +
             '（原文の表が「パラメーター名 / 内容」の 2 列しかない）。')
L.append('')

nested = sorted(e['slug'] for e in endpoints if e['role'].startswith('**'))
no_role = sorted(e['slug'] for e in endpoints if not e['role'])
plain_role = len(endpoints) - len(nested) - len(no_role)
L.append('### 権限（role）の記述形式\n')
L.append('「実行可能な権限」節の構造がページによって違う。\n')
L.append(f'- {plain_role} 件: `すべての権限` `管理者` のような単一の値')
L.append(f'- {len(nested)} 件: 「**権限** … / **制限** …」の 2 段構成。'
         '`endpoints.json` の `role` には平坦化した文字列が入る')
if no_role:
    L.append(f'- {len(no_role)} 件: 「実行可能な権限」節そのものが無い（'
             + '、'.join(f'[{s}](v2/{s}.md)' for s in no_role) + '）')
L.append('')

h2 = Counter()
where = defaultdict(list)
for slug, md in md_by_slug.items():
    for h in set(re.findall(r'^## (.+)$', md, re.M)):
        h2[h] += 1
        where[h].append(slug)
def norm_heading(h):
    """空白・括弧幅の違いを潰した比較用のキー"""
    return re.sub(r'\s+', '', h).translate(str.maketrans('（）', '()'))


groups = defaultdict(list)
for h, n in h2.items():
    groups[norm_heading(h)].append((h, n))
varied = {k: v for k, v in groups.items() if len(v) > 1}
if varied:
    L.append('### 節見出しの表記ゆれ\n')
    L.append('同じ節が、空白の有無や括弧の全角半角違いで複数の書き方をされている。\n')
    L.append('| 表記 | ページ数 |')
    L.append('| --- | --- |')
    for k in sorted(varied):
        # 同数の行が挿入順（set の反復順＝hash 乱数化依存）で並ばないよう表記でも揃える
        for h, n in sorted(varied[k], key=lambda x: (-x[1], x[0])):
            L.append(f'| {h} | {n} |')
    L.append('')

singles = sorted((h, where[h][0]) for h, n in h2.items()
                 if n == 1 and len(groups[norm_heading(h)]) == 1)
if singles:
    L.append('### 1 ページにしか出てこない節見出し\n')
    L.append('そのページ固有の正当な節も含むが、誤記も混じっている'
             '（「レスポンス例」であるべき箇所が「レスポンス名」になっている等）。\n')
    L.append('| 見出し | ページ |')
    L.append('| --- | --- |')
    for h, slug in singles:
        L.append(f'| {h} | [{slug}](v2/{slug}.md) |')
    L.append('')

flaws = []
for slug, md in md_by_slug.items():
    stray = [l for l in fence_lines(md) if re.match(r'^#{1,6} ', l)]
    if stray:
        flaws.append((slug, 'コードブロックの中に見出し記法 '
                            f'`{stray[0].strip()}` が混入している'))
    if src_h1.get(slug) == 0:
        flaws.append((slug, '原文の見出しレベルが 1 段ずれている'
                            '（変換時に繰り上げ済み）'))
dead = sorted({m for md in list(md_by_slug.values()) + guide_md
               for m in re.findall(
                   r'https://developer\.nulab\.com/ja/docs/backlog/api/2/([a-z0-9-]+)',
                   md)})
for slug in dead:
    flaws.append((slug, '公式ドキュメント内から参照されているが、'
                        'ページ自体が存在しない（404）'))
if flaws:
    L.append('### 個別ページの不備\n')
    L.append('| 対象 | 内容 |')
    L.append('| --- | --- |')
    for slug, note in sorted(flaws):
        link = (f'[{slug}](v2/{slug}.md)' if slug in md_by_slug else f'`{slug}`')
        L.append(f'| {link} | {note} |')
    L.append('')

open(f'{OUT}/README.md', 'w', encoding='utf-8').write('\n'.join(L))

# ---- 出力内の相対リンクが解決できることを確かめる ----
# 原文には裸の相対 href（`href="get-resolution-list"`）が混ざる。書き換えを取りこぼすと
# ミラー内で辿れないリンクになるが、生成そのものは成功してしまうので明示的に検査する。
broken = []
for root, _, names in os.walk(OUT):
    for name in names:
        if not name.endswith('.md'):
            continue
        src = os.path.join(root, name)
        for label, href in re.findall(r'\[([^\]]*)\]\(([^)]+)\)',
                                    open(src, encoding='utf-8').read()):
            path = href.split('#')[0]
            if not path or path.startswith(('http://', 'https://', 'mailto:')):
                continue
            target = os.path.normpath(os.path.join(root, path))
            if os.path.relpath(target, OUT).startswith('..'):
                continue  # 出力の外を指すリンクは生成側の責任範囲外
            if not os.path.exists(target):
                broken.append(f'{os.path.relpath(src, OUT)}: [{label}]({href})')
if broken:
    raise SystemExit('解決できない相対リンク:\n  ' + '\n  '.join(broken))

print(f'endpoints={len(endpoints)} categories={cats}')
