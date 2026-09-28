from PIL import Image
import numpy as np
def diffrow(a,y): return np.abs(a[y].astype(int)-a[y-1].astype(int)).sum()
def diffcol(a,x): return np.abs(a[:,x].astype(int)-a[:,x-1].astype(int)).sum()
CHIN=21
def plan(a, dr=5, dc=4, prot=()):
    H,W,_=a.shape; head=a[:CHIN+1].copy(); body=a[CHIN+1:].copy()
    rows=list(range(head.shape[0])); drop_rows=[]
    for _ in range(dr):
        cand=[(diffrow(head,i),i) for i in range(2,head.shape[0]-1) if rows[i] not in prot]; cand.sort(); i=cand[0][1]
        drop_rows.append(rows[i]); head=np.delete(head,i,axis=0); del rows[i]
    cols=list(range(W)); drop_cols=[]
    for _ in range(dc):
        cand=[(diffcol(head,i),i) for i in range(2,head.shape[1]-2) if head[:,i,3].any()]; cand.sort(); i=cand[0][1]
        drop_cols.append(cols[i]); head=np.delete(head,i,axis=1); del cols[i]
    nb=body.shape[0]; b=body; brows=list(range(nb)); dups=[]
    for lo,hi in [(1,nb//2),(2,nb//2+1),(nb//2+2,nb-2),(nb//2+3,nb-1),(3,nb//2+2)][:dr]:
        cand=[(diffrow(b,i),i) for i in range(max(1,lo),min(b.shape[0]-1,hi))]; cand.sort(); i=cand[0][1]
        dups.append(brows[i]); b=np.insert(b,i,b[i],axis=0); brows.insert(i,brows[i])
    return drop_rows, drop_cols, dups
def apply(a, pl, off=0):
    drop_rows, drop_cols, dups = pl
    H,W,_=a.shape
    head=a[:CHIN+1]; body=a[CHIN+1:]
    keep_r=[y for y in range(head.shape[0]) if y not in drop_rows]
    dc=set(c+off for c in drop_cols)
    keep_c=[x for x in range(W) if x not in dc]
    h2=head[keep_r][:,keep_c]
    # 頭を 体の 中心に
    h3=np.zeros((h2.shape[0],W,4),np.uint8); 
    cx=lambda img:(lambda xs:(xs.min()+xs.max())/2)(np.where(img[...,3].any(axis=0))[0])
    sh=int(round(cx(head)-cx(np.concatenate([h2,np.zeros((h2.shape[0],W-h2.shape[1],4),np.uint8)],axis=1))))
    h3[:, max(0,sh):max(0,sh)+h2.shape[1]] = h2[:, :W-max(0,sh)]
    b=body.copy(); order=list(range(b.shape[0]))
    for d in dups:
        i=order.index(d); b=np.insert(b,i,b[i],axis=0); order.insert(i,d)
    out=np.concatenate([h3,b],axis=0)
    assert out.shape[0]==H
    cols=np.where(out[...,3].any(axis=0))[0]
    return out[:,cols.min():cols.max()+1]
def offset(io, sky):
    # 体（25〜39行）の 見える ところが いちばん 重なる ずれ
    best=None
    for off in range(0, sky.shape[1]-io.shape[1]+1):
        s=np.abs((sky[25:40, off:off+io.shape[1], 3]>0).astype(int) - (io[25:40,:,3]>0).astype(int)).sum()
        if best is None or s<best[0]: best=(s,off)
    return best[1]
