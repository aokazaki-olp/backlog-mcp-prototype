#!/usr/bin/env python3
"""raw/*.md（modelcontextprotocol.io の .md 版）をミラー用の Markdown へ変換する。

サイトが配る .md は本文そのものだが、そのままでは使えない部分が 3 つある。

1. 全ページの先頭に「llms.txt を取得せよ」という指示のブロック引用が入っている
   （本文ではなく取得側への指示なので落とす）
2. リンクがサイト絶対パス（`/specification/...`）で書かれている
3. `schema` ページだけ typedoc の HTML がそのまま入っており Markdown として読めない
"""
import html
import os
import re

SITE = 'https://modelcontextprotocol.io'

# 先頭に必ず入る「Documentation Index」のブロック引用。
PREAMBLE = re.compile(r'\A(?:>[^\n]*\n)+\s*')

# Mintlify の描画指示。中身を持たないので落とす。
RENDER_HINT = re.compile(r'^<div id="enable-section-numbers" />\n\n?', re.M)


def normalize_path(path):
    """サイトのパスを比較用に正規化する（`.md`・末尾の `/`・`/index` を落とす）"""
    path = path.split('?')[0]
    if path.endswith('.md'):
        path = path[: -len('.md')]
    path = path.rstrip('/')
    if path.endswith('/index'):
        path = path[: -len('/index')]
    return path or '/'


def rewrite_target(target, site_path, page_map, out_file, redirects):
    """リンク先 1 つを、ミラー内の相対パスかサイトの絶対 URL に書き換える"""
    if not target or target.startswith(('#', 'mailto:', 'data:')):
        return target
    frag = ''
    if '#' in target:
        target, frag = target.split('#', 1)
        frag = '#' + frag
    if target.startswith(('http://', 'https://')):
        if not target.startswith(SITE + '/') and target != SITE:
            return target + frag
        path = target[len(SITE) :] or '/'
    elif target.startswith('/'):
        path = target
    else:
        path = os.path.normpath(os.path.join(os.path.dirname(site_path), target))
    path = normalize_path(path)
    path = normalize_path(redirects.get(path, path))
    local = page_map.get(path)
    if local is None:
        return SITE + path + frag
    rel = os.path.relpath(local, os.path.dirname(out_file))
    return rel + frag


def rewrite_links(md, site_path, page_map, out_file, redirects):
    """インラインリンク・参照定義・`href=` 属性のリンク先を書き換える"""

    def sub(target):
        return rewrite_target(target, site_path, page_map, out_file, redirects)

    md = re.sub(
        r'(\]\()([^)\s]+)(\))',
        lambda m: m.group(1) + sub(m.group(2)) + m.group(3),
        md,
    )
    md = re.sub(
        r'(?m)^(\[[^\]]+\]:\s+)(\S+)$',
        lambda m: m.group(1) + sub(m.group(2)),
        md,
    )
    md = re.sub(
        r'(href=")([^"]+)(")',
        lambda m: m.group(1) + sub(m.group(2)) + m.group(3),
        md,
    )
    return md


def detag(s, keep_links=True):
    """typedoc の HTML 断片を Markdown へ落とす

    @param keep_links - `<a>` を Markdown リンクにする。シグネチャの中は
        コードフェンスに入れるためリンク記法が素通しになるので、そこでは外す
    """
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'</p>\s*<p>', '\n\n', s)
    s = re.sub(r'<code>(.*?)</code>', lambda m: '`' + re.sub(r'<[^>]+>', '', m.group(1)) + '`', s, flags=re.S)
    s = re.sub(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>',
               lambda m: (('[' + re.sub(r'<[^>]+>', '', m.group(2)).strip() + '](' + m.group(1) + ')')
                          if keep_links else re.sub(r'<[^>]+>', '', m.group(2)).strip()),
               s, flags=re.S)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = re.sub(r'\\([\\`*{}\[\]$_])', r'\1', s)
    s = re.sub(r'\n[ \t]+', '\n', s)
    return s.strip()


TYPE_BLOCK = re.compile(r'(?m)^(?=## |<div class="type">)')
MEMBER = re.compile(r'<section class="tsd-panel tsd-member">(.*?)</section>', re.S)


def convert_schema(md):
    """typedoc が出力した HTML を、型ごとの見出し＋シグネチャ＋説明に組み直す

    見出しは原文の `### \\`TypeName\\`` をそのまま使うので、他ページからの
    `schema#typename` アンカーがミラー内でも解決する。
    """
    out = ['# Schema Reference', '']
    for block in TYPE_BLOCK.split(md):
        if block.startswith('## '):
            out += [block.split('\n')[0].strip(), '']
            continue
        if not block.startswith('<div class="type">'):
            continue
        name = re.search(r'###\s+(.+)', block)
        out += [f'### {name.group(1).strip()}' if name else '### (名前不明)', '']
        comment = re.search(r'<div class="tsd-comment[^"]*">(.*?)</div>', block, re.S)
        if comment:
            out += [detag(comment.group(1)), '']
        sig = re.search(r'<div class="tsd-signature">(.*?)</div>', block, re.S)
        if sig:
            out += ['```ts', detag(sig.group(1), keep_links=False), '```', '']
        for sec in MEMBER.findall(block):
            head = re.search(r'<div class="tsd-anchor-link"[^>]*>\s*<span>(.*?)</span>', sec, re.S)
            if not head:
                continue
            out += [f'#### `{detag(head.group(1), keep_links=False)}`', '']
            body = re.search(r'<div class="tsd-comment[^"]*">(.*?)</div>', sec, re.S)
            if body:
                out += [detag(body.group(1)), '']
    return '\n'.join(out).rstrip() + '\n'


def convert(raw_path, site_path, page_map, out_file, redirects):
    """raw のページ 1 枚をミラー用の Markdown にする"""
    md = open(raw_path, encoding='utf-8').read()
    md = PREAMBLE.sub('', md)
    if normalize_path(site_path).endswith('/schema'):
        md = convert_schema(md)
    else:
        md = RENDER_HINT.sub('', md)
    md = rewrite_links(md, normalize_path(site_path), page_map, out_file, redirects)
    return md.strip() + '\n'
