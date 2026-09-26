# 使い方: python3 foe_cut.py 画像 出力の頭 白の基準
import sys
from PIL import Image
import numpy as np
from collections import deque
path, head, thr = sys.argv[1], sys.argv[2], int(sys.argv[3])
a=np.array(Image.open(path).convert('RGB')).astype(int); H,W,_=a.shape
white=(a.min(axis=2)>=thr)&((a.max(axis=2)-a.min(axis=2))<=14)
bg=np.zeros((H,W),bool); q=deque()
for x in range(W):
    for y in (0,H-1):
        if white[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
for y in range(H):
    for x in (0,W-1):
        if white[y,x] and not bg[y,x]: bg[y,x]=True; q.append((y,x))
while q:
    y,x=q.popleft()
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny,nx=y+dy,x+dx
        if 0<=ny<H and 0<=nx<W and white[ny,nx] and not bg[ny,nx]: bg[ny,nx]=True; q.append((ny,nx))
# ★囲まれた 背景（脚の あいだ など）：外周と つながらない 白の 塊でも、真っ白で 広ければ 背景
pure=(a.min(axis=2)>=244)&((a.max(axis=2)-a.min(axis=2))<=10)&~bg
seen=np.zeros((H,W),bool)
for y in range(H):
    for x in range(W):
        if pure[y,x] and not seen[y,x]:
            q=deque([(y,x)]); seen[y,x]=True; pts=[]
            while q:
                cy,cx=q.popleft(); pts.append((cy,cx))
                for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                    ny,nx=cy+dy,cx+dx
                    if 0<=ny<H and 0<=nx<W and pure[ny,nx] and not seen[ny,nx]: seen[ny,nx]=True; q.append((ny,nx))
            if len(pts)>=400:
                for cy,cx in pts: bg[cy,cx]=True
fg=~bg
lab=np.zeros((H,W),int); n=0; info=[]
for y in range(H):
    for x in range(W):
        if fg[y,x] and lab[y,x]==0:
            n+=1; lab[y,x]=n; q=deque([(y,x)]); ys=[]; xs=[]
            while q:
                cy,cx=q.popleft(); ys.append(cy); xs.append(cx)
                for dy in (-1,0,1):
                    for dx in (-1,0,1):
                        ny,nx=cy+dy,cx+dx
                        if 0<=ny<H and 0<=nx<W and fg[ny,nx] and lab[ny,nx]==0: lab[ny,nx]=n; q.append((ny,nx))
            info.append((n,len(ys),np.mean(xs),np.mean(ys),min(xs),max(xs),min(ys),max(ys)))
info.sort(key=lambda t:-t[1]); big=sorted(info[:2], key=lambda t:t[2])
owner=np.zeros(n+1,int)
for i in info:
    inside=[k for k,b in enumerate(big) if b[4]<=i[2]<=b[5] and b[6]<=i[3]<=b[7]]
    d=[(i[2]-b[2])**2+(i[3]-b[3])**2 for b in big]
    owner[i[0]]=(inside[0] if len(inside)==1 else int(np.argmin(d)))+1
own=owner[lab]
for k in (1,2):
    mask=(own==k)&fg; ys,xs=np.where(mask); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    out=np.dstack([a[y0:y1,x0:x1], np.where(mask[y0:y1,x0:x1],255,0)]).astype(np.uint8)
    Image.fromarray(out).save(f'{head}{k-1}.png'); print(f'{head}{k-1}.png', x1-x0, y1-y0, '塊', len(info))
