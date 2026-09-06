#!/usr/bin/env python3
"""raw/ のページから、ミラー対象に無いサイト内リンク先を重複なく列挙する。

原文には別名パス（`/specification/latest`）や、別セクションへ転送されるパス
（`/specification/<版>/basic/security_best_practices`）が混ざる。転送先が対象内なら
ミラー内で辿れるべきなので、fetch 時に実際の転送先を調べて記録する。
"""
import os
import re
import sys

import convert as C

RAW = 'raw'
targets = set()
for name in sorted(os.listdir(RAW)):
    if not name.endswith('.md'):
        continue
    md = C.PREAMBLE.sub('', open(os.path.join(RAW, name), encoding='utf-8').read())
    here = '/' + name[: -len('.md')].replace('__', '/')
    for pat in (r'\]\(([^)\s]+)\)', r'(?m)^\[[^\]]+\]:\s+(\S+)$', r'href="([^"]+)"'):
        for raw_target in re.findall(pat, md):
            t = raw_target.split('#')[0]
            if not t or t.startswith(('mailto:', 'data:', '#')):
                continue
            if t.startswith(('http://', 'https://')):
                if not t.startswith(C.SITE + '/'):
                    continue
                path = t[len(C.SITE):]
            elif t.startswith('/'):
                path = t
            else:
                path = os.path.normpath(os.path.join(os.path.dirname(C.normalize_path(here)), t))
            targets.add(C.normalize_path(path))

mapped = {C.normalize_path(line.split('\t')[0])
          for line in open('links.tsv', encoding='utf-8') if line.strip()}
for path in sorted(targets - mapped):
    print(path, file=sys.stdout)
