# 禁書庫の 敵（第2章の 敵の 形を 使い、色だけ 変える）
#   使い方： python3 tools/foe_recolor.py   → art/foes/<新しい名>.png を 作る
#   もとの 絵の 色を「紙の 色（生成り）」と「にじみの 色（紫）」に 分け、
#   明るさを それぞれ 別の 色の 段に 置き換える（形・明暗・ドットは そのまま）
import re, base64, io, colorsys
from PIL import Image
import numpy as np
SRC=open('assets.js').read()
def mon(k):
    m=re.search(r"\b"+k+r":\{[^}]*?src:'data:image/png;base64,([^']*)'",SRC)
    return Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
def ramp(stops, t):
    t=np.clip(t,0,1); out=np.zeros(t.shape+(3,))
    xs=np.linspace(0,1,len(stops)); st=np.array(stops,float)
    for c in range(3): out[...,c]=np.interp(t,xs,st[:,c])
    return out
JOBS={
 # 黒表紙の騎士：黒と 鈍い 銀
 'kokuhyoushi':('kamikishi', [(8,8,12),(22,22,30),(44,46,56),(96,100,112),(178,182,192)],
                             [(10,10,16),(34,32,48),(70,66,92),(120,116,140)]),
 # 墨羽の カラス：墨の 黒と 藍
 'sumibane':   ('kamigarasu',[(5,6,12),(14,18,34),(26,34,66),(50,64,112),(98,116,168)],
                             [(6,8,18),(18,24,54),(34,50,100),(70,96,160)]),
 # 呪い帳面：くすんだ 赤茶と 黒
 'noroichou':  ('susurichou',[(18,8,8),(52,22,18),(92,44,34),(132,74,56),(172,116,92)],
                             [(12,6,8),(40,12,16),(80,22,28),(130,44,48)]),
}
for new,(src,paper,aura) in JOBS.items():
    im=mon(src); a=np.array(im).astype(float); al=a[...,3]>0
    rgb=a[...,:3]/255
    L=(0.3*rgb[...,0]+0.59*rgb[...,1]+0.11*rgb[...,2])
    h=np.zeros(L.shape); s=np.zeros(L.shape)
    for y,x in zip(*np.where(al)):
        hh,ll,ss=colorsys.rgb_to_hls(*rgb[y,x]); h[y,x]=hh; s[y,x]=ss
    purple=al&(s>0.18)&(h>0.62)&(h<0.95)
    lo,hi=np.percentile(L[al],2),np.percentile(L[al],99)
    t=(L-lo)/max(hi-lo,1e-3)
    out=a.copy()
    out[...,:3]=np.where(purple[...,None], ramp(aura,t), ramp(paper,t))
    # 光る 目・芯（明るく 彩度の 高い 水色）は 残す
    keep=al&(s>0.25)&(h>0.45)&(h<0.72)&(L>0.42)
    out[keep,:3]=a[keep,:3]
    # 目・芯の 光（彩度の 高い 紫）は 別の 光の 色に（赤／冷たい 白）
    lt=np.zeros(L.shape)
    for y,x in zip(*np.where(al)): lt[y,x]=colorsys.rgb_to_hls(*rgb[y,x])[1]
    glow=al&(s>0.6)&(h>0.70)&(h<0.86)
    # 目の ある 場所だけ（にじみの 飛び散りまで 光らせない）
    BOX={'noroichou':(20,16,29,28)}.get(new)
    if BOX:
        m=np.zeros(L.shape,bool); m[BOX[1]:BOX[3],BOX[0]:BOX[2]]=True; glow&=m
    GL={'noroichou':[(110,14,24),(210,40,44),(255,150,120)]}.get(new)
    if GL and BOX: out[glow,:3]=ramp(GL, lt[glow]/0.45)
    else: glow=glow&False
    Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(f'art/foes/{new}.png')
    print(new, im.size, '紫', int(purple.sum()), '/', int(al.sum()), '目', int(keep.sum()), '光', int(glow.sum()))
