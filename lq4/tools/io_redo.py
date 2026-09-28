from PIL import Image, ImageFilter
import numpy as np
from collections import Counter
S=40/316
KEYS=[(k,p) for k in ('io','ioSky') for p in ('front','side','back','frontW','sideW','backW')]
def load(k,p): return Image.open(f'/tmp/rd_{k}_{p}.png').convert('RGBA')
def sz(im): w,h=im.size; return max(1,int(round(w*S))), max(1,int(round(h*S)))
def fix(out):
    r,g,b=[out[...,i].astype(int) for i in range(3)]
    out[((r-g)>60)&((b-g)>60),3]=0
    return out
def box(im):
    tw,th=sz(im); a=np.array(im).astype(float); pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
    s=np.array(Image.fromarray(np.clip(pm,0,255).astype(np.uint8)).resize((tw,th),Image.BOX)).astype(float)
    al=s[...,3:4]; rgb=np.where(al>0, s[...,:3]*255/np.maximum(al,1),0)
    return fix(np.dstack([np.clip(rgb,0,255), np.where(al[...,0]>=120,255,0)]).astype(np.uint8))
def mode(im):
    tw,th=sz(im); a=np.array(im).astype(int); h,w,_=a.shape; sy=h/th; sx=w/tw
    out=np.zeros((th,tw,4),np.uint8)
    for ty in range(th):
        for tx in range(tw):
            blk=a[int(ty*sy):max(int(ty*sy)+1,int((ty+1)*sy)), int(tx*sx):max(int(tx*sx)+1,int((tx+1)*sx))].reshape(-1,4)
            op=blk[blk[:,3]>128]
            if len(op)<len(blk)*0.5: continue
            keys=[tuple(p[:3]//12) for p in op]; k=Counter(keys).most_common(1)[0][0]
            sel=np.array([p[:3] for p,kk in zip(op,keys) if kk==k]); out[ty,tx,:3]=np.median(sel,axis=0); out[ty,tx,3]=255
    return fix(out)
def quant(im, pal):
    tw,th=sz(im); a=np.array(im).astype(float); pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
    s=np.array(Image.fromarray(np.clip(pm,0,255).astype(np.uint8)).resize((tw,th),Image.LANCZOS)).astype(float)
    al=s[...,3:4]; rgb=np.where(al>0, s[...,:3]*255/np.maximum(al,1),0)
    rgbI=Image.fromarray(np.clip(rgb,0,255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1,percent=50,threshold=2))
    q=np.array(rgbI.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB'))
    return fix(np.dstack([q, np.where(al[...,0]>=110,255,0)]).astype(np.uint8))
def palette():
    px=[]
    for k,p in KEYS:
        a=np.array(load(k,p)); px.append(a[a[...,3]>0][:,:3])
    return Image.fromarray(np.concatenate(px)[None].astype(np.uint8)).quantize(colors=28, method=Image.MEDIANCUT)
