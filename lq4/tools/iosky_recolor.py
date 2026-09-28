from PIL import Image
import numpy as np, colorsys
SILVER=[(62,74,88),(118,134,148),(174,188,198),(218,228,234),(244,248,250)]
TEAL_D=(38,112,114); TEAL=(72,166,158); TEAL_L=(146,218,204)
GOLD=(210,170,78); GOLD_D=(150,112,44); GEM=(156,230,250)
def lum(p): return (0.3*int(p[0])+0.59*int(p[1])+0.11*int(p[2]))/255
def cls(p):
    r,g,b=[int(v) for v in p[:3]]; h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
    if l<0.16: return 'K'
    if b>r+12 and l<0.45: return 'N'
    if abs(r-g)<14 and abs(g-b)<14: return 'G'
    return 'W'
def silver(p, lift=0):
    L=lum(p); i=max(0,min(4,int(L*5.0)+lift)); return SILVER[i]
def recolor(src, pose):
    a=np.array(Image.open(src).convert('RGBA')); H,W,_=a.shape; o=a.copy()
    back=pose.startswith('back'); side=pose.startswith('side'); front=pose.startswith('front')
    # 顔の 始まり（肌の ある 最初の 行）
    face_top=None
    for y in range(6,16):
        if sum(1 for x in range(W) if a[y,x,3]>0 and cls(a[y,x])=='W')>=2: face_top=y; break
    helm_bot = (face_top-2) if (face_top and not back) else 9     # 兜の 下の 縁
    # ① 兜：頭の 上半分の 髪を 白銀に
    for y in range(0, helm_bot+1):
        for x in range(W):
            p=a[y,x]
            if p[3]==0 or cls(p)=='K': continue
            if cls(p)=='N': o[y,x,:3]=SILVER[min(4,1+int(lum(p)*9))]
    # 兜の 形を 丸く 整える（髪の とがった 輪郭を 消す）
    xs0=[x for x in range(W) if a[helm_bot,x,3]>0 and cls(a[helm_bot,x])!='K']
    if xs0:
        L0,R0=xs0[0],xs0[-1]; cxh=(L0+R0)/2; rx=(R0-L0)/2+0.6
        ry=max(5.0, rx*0.95); cy=helm_bot+0.5
        for y in range(0, helm_bot+1):
            for x in range(W):
                inside=((x-cxh)/rx)**2+((y-cy)/ry)**2<=1.0
                if inside:
                    if o[y,x,3]==0 or cls(a[y,x])!='N' or True:
                        t=(cy-y)/ry; sh=(x-cxh)/rx
                        i=3 if sh<0.2 else 2
                        if t>0.75 and sh<0.1: i=4
                        if sh>0.65: i=1
                        o[y,x]=[*SILVER[i],255]
                else:
                    o[y,x,3]=0
        # 外側に 暗い 縁
        OLc=(38,32,48)
        m=o[...,3]>0
        for y in range(0, helm_bot+1):
            for x in range(W):
                if m[y,x]: continue
                if any(0<=y+dy<H and 0<=x+dx<W and m[y+dy,x+dx] for dy,dx in ((1,0),(-1,0),(0,1),(0,-1))):
                    o[y,x]=[*OLc,255]
    # 兜の 下の 縁は 金の 線、正面は 額に 宝玉
    for x in range(W):
        if o[helm_bot,x,3]>0 and tuple(o[helm_bot,x,:3])!=(38,32,48): o[helm_bot,x,:3]=GOLD
    xs=[x for x in range(W) if a[helm_bot,x,3]>0 and cls(a[helm_bot,x])!='K']
    if xs and front:
        gx=(xs[0]+xs[-1])//2; o[helm_bot,gx,:3]=TEAL; o[helm_bot-1,gx,:3]=TEAL_L
    if xs and side:
        gx=xs[0]+1; o[helm_bot,gx,:3]=TEAL
    # てっぺんの 青緑の 飾り（いちばん 上の 見える 行の まんなか）
    top=[y for y in range(H) if o[y,:,3].any()][0]
    txs=[x for x in range(W) if o[top+1,x,3]>0]
    if txs:
        cx=(txs[0]+txs[-1])//2 if not side else txs[len(txs)//2]
        for y in range(max(0,top-1), top+3):
            o[y,cx]=[*(TEAL_L if y<=top else TEAL),255]
    # 翼：兜の 両脇（横向きは 後ろ側だけ）に 3段
    def put(y,x,col):
        if 0<=y<H and 0<=x<W and o[y,x,3]==0: o[y,x]=[*col,255]
    wy=helm_bot-3
    row=[x for x in range(W) if o[wy,x,3]>0]
    if row:
        L0,R0=row[0],row[-1]
        sides=[(R0,1)] if side else [(L0,-1),(R0,1)]
        for ex,d in sides:
            for dy,dx,col in [(0,d,TEAL),(-1,d,TEAL_L),(-1,2*d,TEAL),(-2,2*d,TEAL_L),(1,d,TEAL_D)]:
                put(wy+dy, ex+dx, col)
    # ② 胴：白銀を 主に（いちばん 濃い 影だけ 濃い 銀）、ベルトは 金
    for y in range(20,31):
        for x in range(W):
            p=a[y,x]
            if p[3]==0: continue
            c=cls(p)
            if c in ('K','G'): continue
            if y in (28,29) and c=='W' and lum(p)<0.62: o[y,x,:3]=GOLD if lum(p)>0.4 else GOLD_D; continue
            o[y,x,:3]=silver(p, lift=1)
    if front:                                         # 胸の 光珠
        for yy,xx in ((23,W//2),(23,W//2-1)):
            if o[yy,xx,3]>0 and cls(a[yy,xx])!='K': o[yy,xx,:3]=GEM
    # ③ 腰から 下：白の 前垂れ（まんなかに 青緑の 線）と 白銀の すね当て
    for y in range(31,H):
        for x in range(W):
            p=a[y,x]
            if p[3]==0: continue
            c=cls(p)
            if c in ('K','G'): continue
            if 31<=y<=34 and c=='N': o[y,x,:3]=TEAL_D if lum(p)<0.2 else TEAL
            else: o[y,x,:3]=silver(p, lift=1)
    if front or pose.startswith('back'):
        cx=W//2
        for y in range(30,35):
            for x in (cx-1,cx):
                if a[y,x,3]>0 and cls(a[y,x])!='K': o[y,x,:3]=SILVER[4] if x==cx-1 else SILVER[3]
            if a[y,cx,3]>0 and y%2==0: o[y,cx,:3]=TEAL
    return o
if __name__=='__main__':
    for p in ('front','side','back','frontW','sideW','backW'):
        Image.fromarray(recolor(f'/tmp/io_{p}.png', p)).save(f'/tmp/ioSky2_{p}.png')
    ks=['front','frontW','side','sideW','back','backW']; ims=[Image.open(f'/tmp/ioSky2_{k}.png') for k in ks]
    S=8; c=Image.new('RGBA',(sum(i.width*S+20 for i in ims),42*S),(106,122,96,255)); x=10
    for i in ims:
        b=i.resize((i.width*S,i.height*S),Image.NEAREST); c.alpha_composite(b,(x,c.height-b.height-4)); x+=b.width+20
    c.save('/tmp/ioSky2_all.png'); print('ok')
