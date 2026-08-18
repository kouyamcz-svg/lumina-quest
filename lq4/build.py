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
# ★時こくは 日本時間で 書く。まえは 世界標準時（UTC）で 出して いた ため、
#   画面の 時こくと 手もとの 時計が 9時間 ずれて 見え、
#   「ふるい ままだ」と まちがえる もとに なった。
_jst = datetime.timezone(datetime.timedelta(hours=9))
info = {"ver":"M0",
        "at":datetime.datetime.now(_jst).strftime('%Y-%m-%d %H:%M')+" JST",
        "assets_sha":asha,"lines":counts}
shell = shell.replace('{{BUILD_INFO}}',
    '<script>window.LQ4_BUILD='+json.dumps(info, ensure_ascii=False)+';</script>')
# ★アセットの版クエリを つけかえ（iPhoneのキャッシュずれ ふせぎ）
import re as _re
shell = _re.sub(r'assets\.js\?v=[0-9a-f]+', 'assets.js?v='+asha, shell)

# ★みじかい 印（この ばんの sha）を 画面にも 出す
_pre = hashlib.sha1(shell.encode('utf-8')).hexdigest()[:8]
shell = shell.replace('"assets_sha"', '"build":"'+_pre+'","assets_sha"', 1)

open('index.html','w').write(shell)

# ★サービスワーカーの キャッシュ名を ビルドごとに かえる。
#   ここを 固定に して いた ため、ふるい index.html が いつまでも
#   のこり、なおした はずの ものが 端末に とどかなかった。
bsha = hashlib.sha1(shell.encode('utf-8')).hexdigest()[:8]
sw = open('sw.js', encoding='utf-8').read()
sw2 = _re.sub(r"const CACHE='lq4-[0-9a-zA-Z]+';", "const CACHE='lq4-"+bsha+"';", sw)
assert sw2 != sw or ("lq4-"+bsha) in sw, 'sw.js の CACHE を みつけられない'
open('sw.js','w',encoding='utf-8').write(sw2)

print('index.html', len(shell)//1024, 'KB /', json.dumps(counts))
print('sw CACHE = lq4-'+bsha)
