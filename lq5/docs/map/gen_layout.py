import re, random, math
random.seed(5)
s=open('/home/claude/lq/lq5/src/template.html',encoding='utf8').read(); m=re.search(r'const WORLD=\[\n(.*?)\];',s,re.S)
CUR=[r.strip().strip(',').strip('"') for r in m.group(1).split('\n') if r.strip()]
W,H=112,72; OX,OY=10,16
g=[['~']*W for _ in range(H)]
def blob(cx,cy,rx,ry,ch,n=0.18):
    for y in range(H):
        for x in range(W):
            a=math.atan2(y-cy,x-cx); k=1+n*math.sin(a*3+cx)+n*.6*math.sin(a*7+cy)
            if ((x-cx)/rx)**2+((y-cy)/ry)**2 < k*k: g[y][x]=ch
def put(x,y,ch):
    if 0<=x<W and 0<=y<H: g[y][x]=ch
# 大陸（アルディア＋ヴェルナ）
# アルディアは いまの 地図の まま
blob(80,30,30,20,'.')            # ヴェルナの 地
blob(56,40,14,10,'.')            # 南の つなぎ（戦場の 平原）
# ヴェルナ南の 荒れ地・砂地
blob(84,48,18,8,'d',.12)
# 北の 海の 魔王の 島
blob(58,6,7,4,'x',.25)
# 南の 島（海沿いの 町）・西の 島
blob(30,60,11,6,'.',.2); blob(8,50,5,5,'.',.25); blob(104,62,6,4,'.',.25)
# いまの 地図（そのまま 入れる。ただし 東の 端の 海と 南東の 海は 陸に）
for y,row in enumerate(CUR):
    for x,c in enumerate(row):
        X,Y=OX+x,OY+y
        if c=='~' and (x>=44 or (y>=17 and x>=24) ): continue   # ヴェルナ側は 周りの 陸に つなぐ
        g[Y][X]=c
# 国境の 山並みを 南北へ 伸ばす（ヴェルナの 奥は 第2章から）
for y in range(OY+18,OY+30): put(OX+29,y,'^'); put(OX+30,y,'^')
# ドルムの 東の 山（第2章で 開く 峠）
for y in range(14,48):
    if g[y][62]!='~': g[y][62]='^'; g[y][63]='^'
g[OY+9][62]='p'; g[OY+9][63]='p'   # 峠（第2章で 開く）
# ヴェルナの 森（森の 遺跡）・北の 森（屋敷跡）
for (cx,cy,rx,ry) in [(74,22,6,4),(96,20,5,4),(70,36,5,3)]:
    for y in range(cy-ry,cy+ry+1):
        for x in range(cx-rx,cx+rx+1):
            if ((x-cx)/rx)**2+((y-cy)/ry)**2<1 and g[y][x]=='.': g[y][x]=','
# 山
for (cx,cy) in [(88,36),(100,32),(78,42)]:
    for dy in range(-2,3):
        for dx in range(-3,4):
            if abs(dx)+abs(dy)<4 and g[cy+dy][cx+dx]=='.': g[cy+dy][cx+dx]='^'
# 南の 島の 山
for dx in range(-2,3): put(34+dx,59,'^')
# 道（ドルム → 峠 → 帝都）
for x in range(OX+39,92): 
    if g[OY+9][x] in '.,': g[OY+9][x]='='
# 場所
P={'帝都':(92,25,'E'),'森の 遺跡':(74,22,'R'),'側近の 屋敷跡':(96,19,'M'),'西の 港町':(OX+1,OY+13,'P'),'海沿いの 町':(26,60,'T'),'戦場（平原）':(56,40,'B'),'魔王の 城':(58,6,'K'),'南東の 港':(80,52,'Q')}
for k,(x,y,ch) in P.items(): g[y][x]=ch
open('big.txt','w').write('\n'.join(''.join(r) for r in g))
import json; json.dump({'W':W,'H':H,'OX':OX,'OY':OY,'P':P},open('meta.json','w'),ensure_ascii=False)
