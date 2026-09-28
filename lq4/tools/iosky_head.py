from PIL import Image
import numpy as np, colorsys, importlib.util
spec=importlib.util.spec_from_file_location('r2','/tmp/iosky_recolor2.py'); r2=importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
SILVER=r2.SILVER; TEAL=r2.TEAL; TEAL_L=r2.TEAL_L; TEAL_D=r2.TEAL_D; GOLD=r2.GOLD; cls=r2.cls; lum=r2.lum
OLc=(38,32,48)
def body_only(src,pose):
    # 胴から下は 前の 描き替えを そのまま 使い、頭は 元の 髪に 戻す
    o=r2.recolor(src,pose); a=np.array(Image.open(src).convert('RGBA'))
    face_top=None; H,W,_=a.shape
    for y in range(6,16):
        if sum(1 for x in range(W) if a[y,x,3]>0 and cls(a[y,x])=='W')>=2: face_top=y; break
    hb=(face_top-2) if (face_top and not pose.startswith('back')) else 9
    o[:hb+1]=a[:hb+1]
    return o,a,hb
PAD=4
def sleek(src,pose):
    o0,a0,hb=body_only(src,pose); H,W0,_=o0.shape
    o=np.zeros((H,W0+PAD*2,4),np.uint8); o[:,PAD:PAD+W0]=o0
    a=np.zeros((H,W0+PAD*2,4),np.uint8); a[:,PAD:PAD+W0]=a0
    W=W0+PAD*2
    back=pose.startswith('back'); side=pose.startswith('side'); front=pose.startswith('front')
    new=np.zeros((H,W),bool)
    def put(y,x,col,force=False):
        if 0<=y<H and 0<=x<W:
            if o[y,x,3]==0: new[y,x]=True
            o[y,x]=[*col,255]
    # ① 額の 細い 帯（髪の 上だけ）。上は 白銀、下は 金
    xs=[x for x in range(W) if a[hb,x,3]>0 and cls(a[hb,x])!='K']
    if not xs: return o
    L0,R0=xs[0],xs[-1]
    for x in range(L0,R0+1):
        if a[hb,x,3]>0 and cls(a[hb,x])!='K': o[hb,x,:3]=SILVER[3]
    # ② 額の 中央から 上へ 細い とがり（正面・横）
    if front or side:
        cx=(L0+R0)//2 if front else L0+2
        put(hb,cx,TEAL_L); put(hb-1,cx,TEAL); put(hb-2,cx,TEAL_L); put(hb-3,cx,SILVER[4])
    # ③ 翼：帯の 端から 斜め 上 後ろへ（2本の 羽を 重ねる）
    def wing(ex,d):
        # 外側の 長い 羽
        pts=[(0,0),(-1,1),(-2,1),(-3,2),(-4,3),(-5,3),(-6,4)]
        for i,(dy,dx) in enumerate(pts):
            put(hb+dy, ex+d*dx, SILVER[4] if i<3 else (TEAL_L if i<6 else SILVER[4]))
        # 内側の 羽（少し 下から、短く）
        for i,(dy,dx) in enumerate([(0,1),(-1,2),(-2,3),(-3,4)]):
            put(hb+1+dy, ex+d*dx, SILVER[2] if i<2 else TEAL)
        # 根元は 金の 留め具
        put(hb, ex, GOLD)
    if side: wing(R0, 1)                 # 横向き（左を 向く）：後ろ＝右へ
    else: wing(L0,-1); wing(R0, 1)
    # ④ 新しく 足した ところの 外側に 暗い 縁
    m=o[...,3]>0
    for y in range(H):
        for x in range(W):
            if m[y,x]: continue
            if any(0<=y+dy<H and 0<=x+dx<W and new[y+dy,x+dx] for dy,dx in ((1,0),(-1,0),(0,1),(0,-1))):
                o[y,x]=[*OLc,255]
    cols=np.where(o[...,3].any(axis=0))[0]
    return o[:, cols.min():cols.max()+1]
if __name__=='__main__':
    for p in ('front','side','back','frontW','sideW','backW'):
        Image.fromarray(sleek(f'/tmp/io_{p}.png', p)).save(f'/tmp/ioSky3_{p}.png')
    ks=['front','frontW','side','sideW','back','backW']; ims=[Image.open(f'/tmp/ioSky3_{k}.png') for k in ks]
    S=8; c=Image.new('RGBA',(sum(i.width*S+20 for i in ims),42*S),(106,122,96,255)); x=10
    for i in ims:
        b=i.resize((i.width*S,i.height*S),Image.NEAREST); c.alpha_composite(b,(x,c.height-b.height-4)); x+=b.width+20
    c.save('/tmp/ioSky3_all.png'); print('ok')
