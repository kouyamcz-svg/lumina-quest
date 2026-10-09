import math, json
g=[list(r) for r in open('big.txt').read().split('\n')]; H,W=len(g),len(g[0])
# 西側（x<=38）を 作り直す。国境の 山並み（x39-40）と 砦は そのまま
for y in range(10,45):
    for x in range(0,39): g[y][x]='~'
def land(x,y):
    # アルディアの 大地：西へ 広い 楕円＋ 海岸の ゆらぎ
    cx,cy,rx,ry=22,28,19,13.5
    a=math.atan2(y-cy,x-cx); k=1+.09*math.sin(a*4+1)+.06*math.sin(a*9)
    return ((x-cx)/rx)**2+((y-cy)/ry)**2 < k*k
for y in range(H):
    for x in range(0,39):
        if land(x,y): g[y][x]='.'
# 国境の 山並みに つなぐ（東の 端は 山並みまで 陸）
for y in range(16,41):
    for x in range(33,39):
        if g[y][x]=='~' and any(g[y][xx]!='~' for xx in range(28,33)): g[y][x]='.'
def fill(cells,ch):
    for (x,y) in cells:
        if 0<=x<39 and g[y][x]!='~': g[y][x]=ch
def ell(cx,cy,rx,ry):
    return [(x,y) for y in range(int(cy-ry),int(cy+ry)+1) for x in range(int(cx-rx),int(cx+rx)+1) if ((x-cx)/(rx+.01))**2+((y-cy)/(ry+.01))**2<=1]
# 北の 山地（王都の 背後）・南西の 丘・国境の 手前の 岩山
fill(ell(16,18,5,1.6),'^'); fill(ell(27,19,3,1.2),'^'); fill(ell(10,36,3,1.3),'^'); fill(ell(31,36,2.5,1.2),'^')
# 森
for e in [(8,22,3,2),(22,22,3,1.6),(30,22,2.5,1.4),(18,33,3.5,2),(26,38,3,1.5),(7,29,2,2)]: fill(ell(*e),',')
# 川：国境の 山並みから 西の 海へ（y=27 前後）
ry=lambda x: 27+round(math.sin(x/5)*1.2)
prev=None
for x in range(1,39):
    y=ry(x)
    ys=[y] if prev is None else range(min(prev,y),max(prev,y)+1)
    for yy in ys:
        if g[yy][x]!='~': g[yy][x]='r'
    prev=y
# 街道：砦（39,24-25）の 西 → 西へ → 王都
CAPX,CAPY=12,23
for x in range(CAPX+2,39): g[25][x]='='
for y in range(CAPY+2,26): g[y][CAPX]='='; g[y][CAPX+1]='=' if y==25 else g[y][CAPX+1]
# 王都（2×2）
for dy in (0,1):
    for dx in (0,1): g[CAPY+dy][CAPX+dx]='C'
# ルーエ：国境の 山並みの すぐ 西、川の 南。北へ 道と 橋
RX,RY=34,31
g[RY][RX]='V'
for y in range(26,RY): g[y][RX]='='
g[ry(RX)][RX]='b'
# 西の 港町（第4章の 予定地。いまは 印だけ）
PX,PY=4,29
json.dump({'CAP':[CAPX,CAPY],'RUE':[RX,RY],'PORT':[PX,PY],'BRIDGE':[RX,ry(RX)]},open('ardia.json','w'))
open('big2.txt','w').write('\n'.join(''.join(r) for r in g))
for r in g[10:46]: print(''.join(r[:60]))
