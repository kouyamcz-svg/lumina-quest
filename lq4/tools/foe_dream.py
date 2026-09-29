# 終章：夢の 内界の 敵と、メーアの 仮の 絵（前の 章の 敵の 形で 色だけ 変える）
#   使い方： python3 tools/foe_dream.py   → art/foes/<新しい名>.png
import re, base64, io, colorsys
from PIL import Image
import numpy as np
SRC=open('assets.js').read()
def mon(k):
    m=re.search(r"\n  "+k+r":\{w:\d+,h:\d+,src:'data:image/png;base64,([^']*)'",SRC)
    return Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
# 色の 決め方：(紫の にじみ の 色相・明るさ倍・彩度倍), (その他 の 色相・明るさ倍・彩度倍)
MODES={
 'dream': ((0.12,1.10,1.0),(0.72,1.05,0.35)),   # 夢：にじみは 金、体は 淡い 藤色
 'soutei':((0.10,1.00,0.9),(0.09,1.00,0.30)),   # 装丁：金と 古い 紙
 'rantei':((0.98,0.90,1.1),(0.95,0.75,0.45)),   # 乱丁：暗い 紅
 'hakushi':((0.60,1.60,0.05),(0.60,1.70,0.04)), # 白紙：ほとんど 白
}
JOBS={'yumeboshi':('kamigarasu','dream'), 'yumekazura':('kudamukade','dream'), 'yumemori_kage':('wasuremono','dream'),
}
for new,(src,mode) in JOBS.items():
    (hp,lp,sp),(ho,lo,so)=MODES[mode]
    a=np.array(mon(src)).astype(float); out=a.copy()
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            if a[y,x,3]==0: continue
            r,g,b=a[y,x,:3]/255; h,l,s=colorsys.rgb_to_hls(r,g,b)
            if s>0.15 and 0.66<h<0.95: h2,l2,s2=hp,min(0.95,l*lp),min(1,s*sp)
            else: h2,l2,s2=ho,min(0.95,l*lo),min(1,s*so+0.05)
            if mode=='hakushi': l2=min(0.97,0.55+l*0.5)
            out[y,x,:3]=np.array(colorsys.hls_to_rgb(h2,l2,s2))*255
    Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(f'art/foes/{new}.png'); print(new,a.shape[1],a.shape[0])
