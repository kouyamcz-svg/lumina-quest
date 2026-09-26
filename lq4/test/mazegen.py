# -*- coding: utf-8 -*-
# ★迷路を つくる（穴掘り法）。地方ごとに 種と 大きさを かえ、形を ちがえる。
#   入口＝下の まん中、隔壁 K と 奥への 口 D＝上の まん中。
#   灯り L ふたつ と 宝箱 C は、入口から 遠い 行き止まりに おく。
import random, sys
from collections import deque

def gen(W, H, seed, loops=0.0, rooms=0):
    rnd = random.Random(seed)
    g = [['#']*W for _ in range(H)]
    cw, ch = (W-1)//2, (H-1)//2
    # ★上 3行は 隔壁の ため あける
    def cell(cx, cy): return 1+cx*2, 1+cy*2
    vis = [[False]*cw for _ in range(ch)]
    st = [(cw//2, ch-1)]
    vis[ch-1][cw//2] = True
    x0,y0 = cell(cw//2, ch-1); g[y0][x0]='.'
    while st:
        cx, cy = st[-1]
        nb = [(cx+dx, cy+dy, dx, dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))
              if 0<=cx+dx<cw and 0<=cy+dy<ch and not vis[cy+dy][cx+dx]]
        if not nb: st.pop(); continue
        nx, ny, dx, dy = rnd.choice(nb)
        vis[ny][nx] = True
        x,y = cell(cx,cy); g[y+dy][x+dx]='.'
        x,y = cell(nx,ny); g[y][x]='.'
        st.append((nx,ny))
    # ★ぐるりと まわれる 道（行き止まりを へらす）
    walls = [(x,y) for y in range(2,H-2) for x in range(2,W-2)
             if g[y][x]=='#' and ((g[y][x-1]=='.' and g[y][x+1]=='.') or (g[y-1][x]=='.' and g[y+1][x]=='.'))]
    rnd.shuffle(walls)
    for (x,y) in walls[:int(len(walls)*loops)]: g[y][x]='.'
    # ★ひろい 部屋
    for _ in range(rooms):
        rw, rh = rnd.choice([3,5]), rnd.choice([3,5])
        rx = 1+2*rnd.randrange(0,(W-rw-1)//2)
        ry = 3+2*rnd.randrange(0,(H-rh-5)//2)
        for yy in range(ry, ry+rh):
            for xx in range(rx, rx+rw):
                if 0<yy<H-1 and 0<xx<W-1: g[yy][xx]='.'
    return g

def place(g, W, H):
    mid = W//2 if (W//2)%2==1 else W//2-1
    # 入口（下）
    g[H-1][mid] = '.'
    ent = (mid, H-1)
    # ★上に 2行 足して、そこへ 隔壁 K と 奥への 口 D を おく
    top1 = ['#']*W; top0 = ['#']*W
    top0[mid]='D'; top1[mid]='K'
    g.insert(0, top1); g.insert(0, top0)
    H += 2
    ent = (mid, H-1)
    # K の すぐ 下（迷路の 1行目）を 床に
    if g[2][mid]=='#': g[2][mid]='.'
    if g[3][mid]=='#': g[3][mid]='.'
    # 入口からの 距離
    d = {ent:0}; q = deque([ent])
    while q:
        x,y = q.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx,y+dy
            if 0<=nx<W and 0<=ny<H and (nx,ny) not in d and g[ny][nx]=='.':
                d[(nx,ny)] = d[(x,y)]+1; q.append((nx,ny))
    # 行き止まり（となりの 床が 1つ）
    def floors_around(x,y): return sum(1 for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))
                                        if 0<=x+dx<W and 0<=y+dy<H and g[y+dy][x+dx]=='.')
    ends = sorted([p for p in d if floors_around(*p)==1 and p!=ent and p[1]>4],
                  key=lambda p:-d[p])
    # 左右に 分けて 灯りを おく（遠い ものから）
    left  = [p for p in ends if p[0] <  mid]
    right = [p for p in ends if p[0] >  mid]
    lamps = []
    for side in (left, right):
        if side:
            x,y = side[0]
            # 行き止まりの 奥の かべを 灯りに する
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny = x+dx,y+dy
                if 0<nx<W-1 and 0<ny<H-1 and g[ny][nx]=='#':
                    g[ny][nx] = 'L'; lamps.append((nx,ny)); break
    # 宝箱：のこりの 行き止まりで いちばん 遠い もの
    used = set(p for side in (left,right) for p in side[:1])
    rest = [p for p in ends if p not in used]
    chest = None
    if rest:
        x,y = rest[0]
        g[y][x] = 'C'; chest = (x,y)
    return ent, lamps, chest, d, H

def verify(g, W, H, ent):
    d = {ent:0}; q = deque([ent])
    BLOCK = set('#KDLC')
    while q:
        x,y = q.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx,y+dy
            if 0<=nx<W and 0<=ny<H and (nx,ny) not in d and g[ny][nx] not in BLOCK:
                d[(nx,ny)] = d[(x,y)]+1; q.append((nx,ny))
    floors = [(x,y) for y in range(H) for x in range(W) if g[y][x]=='.']
    bad = [p for p in floors if p not in d]
    def near(p): return any((p[0]+dx,p[1]+dy) in d for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
    return d, bad, near

if __name__=='__main__':
    W,H,seed,loops,rooms = int(sys.argv[1]),int(sys.argv[2]),int(sys.argv[3]),float(sys.argv[4]),int(sys.argv[5])
    g = gen(W,H,seed,loops,rooms)
    ent, lamps, chest, _, H = place(g,W,H)
    d, bad, near = verify(g,W,H,ent)
    mid = ent[0]
    print('大きさ',W,'x',H,' 歩ける',len(d),' とどかない',len(bad),
          ' 灯り',lamps,[near(l) for l in lamps],' 箱',chest,near(chest) if chest else None,
          ' 隔壁まで',d.get((mid,2),'-'),'歩')
    for r in g: print(''.join(r))
