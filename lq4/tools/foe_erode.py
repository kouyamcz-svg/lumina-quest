# 第5章：悪夢に 蝕まれた 敵（第2〜3章の 敵の 形で 色だけ 変える）
#   使い方： python3 tools/foe_erode.py   → art/foes/<新しい名>.png
#   紫の にじみ → 暗い 紅、青・水色 → 灰、それ以外は 少し 暗く 赤みを 足す。形と ドットは そのまま
import re, base64, io, colorsys
from PIL import Image
import numpy as np
SRC=open('assets.js').read()
def mon(k):
    m=re.search(r"\n  "+k+r":\{w:\d+,h:\d+,src:'data:image/png;base64,([^']*)'",SRC)
    return Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
JOBS={'kuroikui':'hikarikui','shokumukade':'kudamukade','kokujugara':'nukegara'}
for new,src in JOBS.items():
    im=mon(src); a=np.array(im).astype(float)
    out=a.copy(); nP=nB=0
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            if a[y,x,3]==0: continue
            r,g,b=a[y,x,:3]/255; h,l,s=colorsys.rgb_to_hls(r,g,b)
            if s>0.15 and 0.66<h<0.95:            # 紫 → 暗い 紅
                h2=0.985; l2=l*0.95; s2=min(1,s*1.15); nP+=1
            elif s>0.12 and 0.45<h<=0.66:         # 青・水色 → 灰（少し 冷たい）
                h2=0.62; l2=l*0.78; s2=s*0.12; nB+=1
            else:                                  # その他 → 暗く、赤みを 少し
                h2=0.03; l2=l*0.80; s2=min(1,s*0.5+0.05)
            out[y,x,:3]=np.array(colorsys.hls_to_rgb(h2,l2,s2))*255
    Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(f'art/foes/{new}.png')
    print(new, im.size, '紫', nP, '青', nB)
