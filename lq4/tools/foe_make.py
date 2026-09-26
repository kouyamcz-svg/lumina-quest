import sys
from PIL import Image
import numpy as np
def box(path, tw, th):
    a=np.array(Image.open(path).convert('RGBA')).astype(float)
    pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
    s=np.array(Image.fromarray(np.clip(pm,0,255).astype(np.uint8)).resize((tw,th),Image.BOX)).astype(float)
    al=s[...,3:4]; rgb=np.where(al>0, s[...,:3]*255/np.maximum(al,1), 0)
    return np.dstack([np.clip(rgb,0,255), np.where(al[...,0]>=110,255,0)])
def finish(a):
    H,W,_=a.shape; op=a[...,3]>0; rgb=a[...,:3]
    m=rgb[op].mean(axis=0); rgb=np.where(op[...,None], np.clip((rgb-m)*1.12+m,0,255), rgb)
    edge=np.zeros((H,W),bool)
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        sh=np.zeros((H,W),bool)
        ys=slice(max(0,dy),H+min(0,dy)); yd=slice(max(0,-dy),H+min(0,-dy))
        xs=slice(max(0,dx),W+min(0,dx)); xd=slice(max(0,-dx),W+min(0,-dx))
        sh[yd,xd]=~op[ys,xs]; edge|=sh
    edge|=np.pad(np.zeros((H-2,W-2),bool),1,constant_values=True); edge&=op
    rgb=np.where(edge[...,None], rgb*0.62, rgb)
    return Image.fromarray(np.dstack([rgb,a[...,3]]).astype(np.uint8))
for arg in sys.argv[1:]:
    src,out,tw,th=arg.split(':'); finish(box(src,int(tw),int(th))).save(out); print(out, tw, th)
