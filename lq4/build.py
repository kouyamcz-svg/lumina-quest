#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# src/*.js + shell.html → index.html（再作成版。ビルド情報は従来形式を踏襲）
import hashlib, json, datetime

MODS = ['world','npc','chapters','bgm','view2d','core','view','ui']

shell = open('shell.html').read()
counts = {}
for m in MODS:
    src = open(f'src/{m}.js').read()
    counts[m] = src.count('\n') + 1
    shell = shell.replace('<script>{{MOD:'+m+'}}</script>', '<script>'+src+'</script>')

assets = open('assets.js','rb').read()
asha = hashlib.sha1(assets).hexdigest()[:8]
info = {"ver":"M0","at":datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        "assets_sha":asha,"lines":counts}
shell = shell.replace('{{BUILD_INFO}}',
    '<script>window.LQ4_BUILD='+json.dumps(info, ensure_ascii=False)+';</script>')
# ★アセットの版クエリを つけかえ（iPhoneのキャッシュずれ ふせぎ）
import re as _re
shell = _re.sub(r'assets\.js\?v=[0-9a-f]+', 'assets.js?v='+asha, shell)

open('index.html','w').write(shell)
print('index.html', len(shell)//1024, 'KB /', json.dumps(counts))
