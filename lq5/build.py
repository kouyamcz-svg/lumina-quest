# Ⅴ：src/template.html から index.html を 作る（絵の データは assets.js に 分ける）
#   python3 build.py
#   ★絵（spr・wobj・rabbit・title）は 別の ファイル assets.js に 出す（指示、2026-10-27）。
#     ゲームを 直しても 絵が 変わらなければ、ブラウザに 残った assets.js が 使われ、読み直すのは index.html（約0.5MB）だけ。
#     index.html は assets.js?v=（中身の ハッシュ）で 読むので、絵が 変わった ときだけ 新しく 読み込まれる。
import json, os, hashlib
D=os.path.dirname(os.path.abspath(__file__))
rd=lambda f: open(os.path.join(D,'src',f),encoding='utf8').read()
a=('window.LQ5_SPR='+rd('spr.json').strip()+';\n'+'window.LQ5_WOBJ='+rd('wobj.json').strip()+';\n'+
   'window.LQ5_RAB='+rd('rabbit.json').strip()+';\n'+'window.LQ5_TITLE='+json.dumps(rd('title.b64').strip())+';\n')
open(os.path.join(D,'assets.js'),'w',encoding='utf8').write(a)
h=hashlib.md5(a.encode('utf8')).hexdigest()[:10]
t=rd('template.html').replace('__ASSETS_V__',h)
open(os.path.join(D,'index.html'),'w',encoding='utf8').write(t)
print('index.html', len(t.encode('utf8')), 'assets.js', len(a.encode('utf8')))
