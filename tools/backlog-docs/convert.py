#!/usr/bin/env python3
"""developer.nulab.com の Backlog API ドキュメント(HTML)を Markdown へ変換する。"""
import html as htmlmod
import json
import os
import re
import sys
from html.parser import HTMLParser

VOID = {'br', 'hr', 'img', 'source', 'input', 'meta', 'link'}


class Node:
    def __init__(self, tag=None, attrs=None, text=None, parent=None):
        self.tag = tag
        self.attrs = dict(attrs or {})
        self.text = text
        self.children = []
        self.parent = parent

    def cls(self):
        return self.attrs.get('class', '')


class DOM(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root')
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, parent=self.cur)
        self.cur.children.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, parent=self.cur))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(Node('#text', text=data, parent=self.cur))


def find_markdown_div(node):
    if node.tag == 'div' and 'markdown' in node.cls().split():
        return node
    for c in node.children:
        r = find_markdown_div(c)
        if r:
            return r
    return None


def raw_text(node):
    if node.tag == '#text':
        return node.text or ''
    if node.tag == 'br':
        return '\n'
    return ''.join(raw_text(c) for c in node.children)


# ---------- リンク書き換え ----------
DOC = re.compile(r'^(?:https?://developer\.nulab\.com)?/?(?:ja/)?docs/backlog/?(.*)$')
GUIDES = {'auth', 'changelog', 'error-response', 'getting-started', 'libraries',
          'rate-limit', 'tips'}
KNOWN_API = set()  # build 側が実際に取得できたスラッグを入れる


def rewrite_link(href, kind):
    """kind: 'v2' | 'guides' — 変換対象ファイルが置かれるディレクトリ"""
    if not href:
        return href
    frag = ''
    if '#' in href:
        href, frag = href.split('#', 1)
        frag = '#' + frag
    if href and re.fullmatch(r'[a-z0-9-]+', href):
        # 原文にある裸の相対 href（例 href="get-resolution-list"）。
        # 公式サイトでは現在のページと同じ階層として解決されるので、同じ規則で絶対パス化する
        href = '/ja/docs/backlog/' + ('api/2/' + href if kind == 'v2' else href)
    m = DOC.match(href)
    if not m:
        return href + frag
    rest = m.group(1).strip('/')
    if rest.startswith('api/2/'):
        slug = rest[len('api/2/'):].strip('/')
        if KNOWN_API and slug not in KNOWN_API:
            # 公式ドキュメント側のリンク切れ（404）はそのまま外部URLとして残す
            return 'https://developer.nulab.com/ja/docs/backlog/' + rest + frag
        target = ('./' if kind == 'v2' else '../v2/') + slug + '.md'
    elif rest in GUIDES:
        target = ('../guides/' if kind == 'v2' else './') + rest + '.md'
    elif rest == '':
        target = ('../guides/' if kind == 'v2' else './') + 'overview.md'
    else:
        return 'https://developer.nulab.com/ja/docs/backlog/' + rest + frag
    return target + frag


# ---------- インライン変換 ----------
def esc(s):
    s = s.replace('\\', '\\\\').replace('`', '\\`').replace('*', '\\*')
    return s.replace('<', '&lt;')


def inline(node, kind, in_table=False):
    out = []
    for c in node.children:
        t = c.tag
        if t == '#text':
            txt = re.sub(r'\s+', ' ', c.text or '')
            out.append(esc(txt))
        elif t == 'br':
            out.append('<br>' if in_table else '  \n')
        elif t in ('code', 'kbd', 'samp'):
            body = raw_text(c).strip()
            tick = '`'
            while tick in body:
                tick += '`'
            out.append(f'{tick}{body}{tick}')
        elif t in ('strong', 'b'):
            out.append('**' + inline(c, kind, in_table).strip() + '**')
        elif t in ('em', 'i'):
            out.append('*' + inline(c, kind, in_table).strip() + '*')
        elif t == 'del':
            out.append('~~' + inline(c, kind, in_table).strip() + '~~')
        elif t == 'a':
            label = inline(c, kind, in_table).strip()
            href = rewrite_link(c.attrs.get('href', ''), kind)
            if not label:
                continue
            out.append(f'[{label}]({href})' if href else label)
        elif t == 'img':
            src = c.attrs.get('src', '')
            if src.endswith('external-link.svg'):
                continue  # 外部リンクアイコン（装飾）は落とす
            if src.startswith('/'):
                src = 'https://developer.nulab.com' + src
            out.append(f'![{c.attrs.get("alt", "")}]({src})')
        elif t in ('ul', 'ol') and in_table:
            items = [inline(li, kind, True).strip()
                     for li in c.children if li.tag == 'li']
            out.append('<br>' + '<br>'.join('・' + i for i in items) + '<br>')
        elif t == 'picture':
            out.append(inline(c, kind, in_table))
        elif t in ('source', 'script', 'style', 'svg'):
            continue
        else:
            out.append(inline(c, kind, in_table))
    return ''.join(out)


def fence_lang(body):
    s = body.strip()
    if re.match(r'^(GET|POST|PUT|PATCH|DELETE)\s+/api/', s):
        return 'http'
    if s.startswith('HTTP/'):
        return 'http'
    if s.startswith('curl'):
        return 'bash'
    if s[:1] in '{[':
        return 'json'
    return ''


def code_block(body):
    body = body.strip('\n').rstrip()
    fence = '```'
    while fence in body:
        fence += '`'
    return f'{fence}{fence_lang(body)}\n{body}\n{fence}'


def cell_text(td, kind):
    s = inline(td, kind, True).strip().replace('|', '\\|')
    s = re.sub(r'(?:<br>\s*)+', '<br>', s)
    return re.sub(r'^(?:<br>)+|(?:<br>)+$', '', s).strip()


def table(node, kind):
    heads, rows = [], []
    for tr in [n for n in walk(node) if n.tag == 'tr']:
        cells = [cell_text(td, kind)
                 for td in tr.children if td.tag in ('th', 'td')]
        if not cells:
            continue
        is_head = any(td.tag == 'th' for td in tr.children)
        if is_head and not heads:
            heads = cells
        else:
            rows.append(cells)
    if not heads and not rows:
        return ''
    width = max(len(r) for r in ([heads] if heads else []) + rows)
    if not heads:
        heads = [''] * width

    def pad(r):
        return r + [''] * (width - len(r))

    lines = ['| ' + ' | '.join(pad(heads)) + ' |',
             '|' + '|'.join([' --- '] * width) + '|']
    lines += ['| ' + ' | '.join(pad(r)) + ' |' for r in rows]
    return '\n'.join(lines)


def walk(node):
    for c in node.children:
        yield c
        yield from walk(c)


def blocks(node, kind, depth=0, listctx=None):
    """ブロック要素を Markdown 文字列のリストとして返す"""
    out = []
    for c in node.children:
        t = c.tag
        if t == '#text':
            if (c.text or '').strip():
                out.append(esc(re.sub(r'\s+', ' ', c.text).strip()))
        elif re.fullmatch(r'h[1-6]', t or ''):
            lvl = int(t[1])
            out.append('#' * lvl + ' ' + inline(c, kind).strip())
        elif t == 'p':
            s = inline(c, kind).strip()
            if s:
                out.append(s)
        elif t == 'pre':
            out.append(code_block(raw_text(c)))
        elif t == 'table':
            s = table(c, kind)
            if s:
                out.append(s)
        elif t in ('ul', 'ol'):
            out.append(render_list(c, kind, 0))
        elif t == 'blockquote':
            inner = '\n\n'.join(blocks(c, kind))
            out.append('\n'.join('> ' + l if l else '>'
                                 for l in inner.split('\n')))
        elif t == 'hr':
            out.append('---')
        elif t in ('script', 'style', 'svg', 'noscript', 'source'):
            continue
        elif t in ('picture', 'img'):
            s = inline(c, kind).strip() if t == 'picture' else inline(c.parent, kind)
            if t == 'img':
                src_ = c.attrs.get('src', '')
                if src_.endswith('external-link.svg'):
                    continue
                if src_.startswith('/'):
                    src_ = 'https://developer.nulab.com' + src_
                s = f'![{c.attrs.get("alt", "")}]({src_})'
            if s:
                out.append(s)
        else:
            out.extend(blocks(c, kind, depth + 1))
    return [b for b in out if b]


def render_list(node, kind, depth):
    ordered = node.tag == 'ol'
    lines = []
    idx = 0
    for li in [n for n in node.children if n.tag == 'li']:
        idx += 1
        marker = f'{idx}. ' if ordered else '- '
        # li 直下のインライン部分
        inline_children = Node('li')
        inline_children.children = [c for c in li.children
                                    if c.tag not in ('ul', 'ol', 'pre', 'table')]
        head = inline(inline_children, kind).strip()
        pad = '  ' * depth
        lines.append(pad + marker + head)
        for c in li.children:
            if c.tag in ('ul', 'ol'):
                lines.append(render_list(c, kind, depth + 1))
            elif c.tag == 'pre':
                blk = code_block(raw_text(c))
                lines.append('\n'.join('  ' * (depth + 1) + l
                                       for l in blk.split('\n')))
            elif c.tag == 'table':
                blk = table(c, kind)
                if blk:
                    lines.append('\n'.join('  ' * (depth + 1) + l
                                           for l in blk.split('\n')))
    return '\n'.join(lines)


def normalize_headings(text):
    levels = [len(m.group(1))
              for m in re.finditer(r'^(#{1,6}) \S', text, re.M)]
    if not levels:
        return text
    if min(levels) == 1:
        return demote_extra_h1(text)
    shift = min(levels) - 1
    return demote_extra_h1(
        re.sub(r'^(#{1,6}) ', lambda m: '#' * (len(m.group(1)) - shift) + ' ',
               text, flags=re.M))


def demote_extra_h1(text):
    """h1 は文書タイトルの 1 つだけ残し、以降の h1 は h2 に落とす"""
    seen = False

    def rep(m):
        nonlocal seen
        if not seen:
            seen = True
            return m.group(0)
        return '## ' + m.group(1)

    return re.sub(r'^# (.+)$', rep, text, flags=re.M)


def convert(path, kind):
    raw = open(path, encoding='utf-8').read()
    d = DOM()
    d.feed(raw)
    md_div = find_markdown_div(d.root)
    if md_div is None:
        raise RuntimeError(f'markdown div not found: {path}')
    body = blocks(md_div, kind)
    text = '\n\n'.join(body)
    text = normalize_headings(text)
    # ハードブレーク直後の余白を除去（行末の 2 スペース自体は改行として残す）
    text = re.sub(r'  \n[ \t]+', '  \n', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'
    return text


if __name__ == '__main__':
    print(convert(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'v2'))
