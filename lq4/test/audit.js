'use strict';
// ルミナクエストIV / 静的監査・ワープ監査・BFS到達性
// 使い方： node test/audit.js     （lq4/ 直下で）
// LQ3構想書 §7 の 2〜4 に あたる。M0の 完了じょうけん。
const fs = require('fs'), vm = require('vm');

const ctx = {console, window:{}, localStorage:undefined}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
C.bind(C.NullView, C.NullUI, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){
  n++;
  if(!cond){ ng++; console.log('NG', name, detail!==undefined ? '  '+detail : ''); }
}

// ============================================================
// 1. 重複キー検出（JSは後勝ちで だまって うわがきされる：地雷集 §10-1）
// ============================================================
function dupKeys(src, filename){
  const dups = [];
  let i=0, line=1;
  const stack = [new Map()];       // オブジェクトごとの キーひょう
  const isObj = [true];
  while(i < src.length){
    const c = src[i];
    if(c==='\n'){ line++; i++; continue; }
    // コメント
    if(c==='/' && src[i+1]==='/'){ while(i<src.length && src[i]!=='\n') i++; continue; }
    if(c==='/' && src[i+1]==='*'){ const e=src.indexOf('*/', i+2);
      line += (src.slice(i, e<0?src.length:e).match(/\n/g)||[]).length; i = e<0?src.length:e+2; continue; }
    // 文字列
    if(c==='"' || c==="'" || c==='`'){
      const q=c; i++;
      while(i<src.length && src[i]!==q){ if(src[i]==='\\') i++; if(src[i]==='\n') line++; i++; }
      i++; continue;
    }
    if(c==='{'){ stack.push(new Map()); isObj.push(true); i++; continue; }
    if(c==='['){ stack.push(new Map()); isObj.push(false); i++; continue; }
    if(c==='}' || c===']'){ stack.pop(); isObj.pop(); i++; continue; }
    // キー候補： 識別子 or 'クオート' の直後に :
    const m = /^([A-Za-z_$][\w$]*|'[^']*')\s*:/.exec(src.slice(i));
    if(m && isObj[isObj.length-1]){
      // 三項演算子の : や ラベルを できるだけ よける（直前が ? や 英数字なら みおくる）
      const before = src.slice(Math.max(0,i-40), i).replace(/\s+$/,'');
      const prev = before.slice(-1);
      if(prev==='{' || prev===',' || prev===''){
        const key = m[1];
        const tbl = stack[stack.length-1];
        if(tbl.has(key)) dups.push(filename+':'+line+' '+key+'（さいしょは '+tbl.get(key)+'ぎょうめ）');
        else tbl.set(key, line);
      }
      i += m[0].length; continue;
    }
    i++;
  }
  return dups;
}
let allDups = [];
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  allDups = allDups.concat(dupKeys(fs.readFileSync('src/'+f,'utf8'), f));
T('重複キーなし（'+allDups.length+'けん）', allDups.length===0);
allDups.slice(0,20).forEach(d=>console.log('   dup:', d));

// ============================================================
// 2. 参照の実在（敵キー・呪文キー・マップID）
// ============================================================
const eKeys = new Set(C.ENEMIES.map(e=>e.key));
Object.keys(C.byMap||{}).forEach(mp=>{
  (C.byMap[mp]||[]).forEach(k=> T('byMap敵実在 '+mp+':'+k, eKeys.has(k)));
});
Object.keys(C.byMapCh||{}).forEach(mp=>{
  (C.byMapCh[mp]||[]).forEach(k=> T('byMapCh敵実在 '+mp+':'+k, eKeys.has(k)));
});
Object.keys(C.MAPS).forEach(mp=>{
  (C.MAPS[mp].encZones||[]).forEach((z,zi)=>{
    (z.pool||[]).forEach(k=> T('encZone敵実在 '+mp+'#'+zi+':'+k, eKeys.has(k)));
  });
});
Object.keys(C.CLASSES||{}).forEach(cl=>{
  (C.CLASSES[cl].learns||[]).forEach(l=>
    T('呪文実在 '+cl+':'+l.key, !!C.SPELL_DEFS[l.key]));
});

// ============================================================
// 3. ワープ監査（地雷集 §10-2：LQ3で 壁うまり2けん・おしもどし1けん）
// ============================================================
const tileAt = (map,x,y)=>{
  const m=C.MAPS[map]; if(!m) return '#';
  const row=m.tiles[y]; if(row===undefined) return '#';
  const ch=row[x]; return ch===undefined ? '#' : ch;
};
const blocked = (map,x,y)=> C.isBlocked ? C.isBlocked(tileAt(map,x,y)) : false;
const isWarpSq = (map,x,y)=>{
  const m=C.MAPS[map]; if(!m) return false;
  if(m.warpsXY && m.warpsXY[x+','+y]) return true;
  const ch=tileAt(map,x,y);
  return !!(m.warps && m.warps[ch]);
};
let warpN = 0;
Object.keys(C.MAPS).forEach(mp=>{
  const m = C.MAPS[mp];
  Object.keys(m.warpsXY||{}).forEach(k=>{
    warpN++;
    const [sx,sy] = k.split(',').map(Number);
    const w = m.warpsXY[k];
    const tag = mp+' ('+k+')→'+w.to+' ('+w.x+','+w.y+')';
    T('ワープ発地が床 '+tag, !blocked(mp,sx,sy), tileAt(mp,sx,sy));
    T('ワープ先マップ実在 '+tag, !!C.MAPS[w.to]);
    if(!C.MAPS[w.to]) return;
    T('ワープ着地が床 '+tag, !blocked(w.to,w.x,w.y), tileAt(w.to,w.x,w.y));
    // 着地が ワープますでも、それが 「もどりの ワープ」なら よい（往復の かいだん）。
    // それ いがいは 着いた とたんに とばされる おそれが ある。
    if(isWarpSq(w.to,w.x,w.y)){
      const back = (C.MAPS[w.to].warpsXY||{})[w.x+','+w.y];
      const ok = back && back.to===mp && Math.abs(back.x-sx)<=1 && Math.abs(back.y-sy)<=1;
      T('ワープ着地がワープますでない（往復はゆるす） '+tag, !!ok,
        back ? '→'+back.to+' ('+back.x+','+back.y+')' : 'ばけたますに ちゃくち');
    }
  });
});

// ============================================================
// 4. BFS到達性（孤立床ゼロ／宝箱・イベント・出口に とどく）
// ============================================================
// しらべる ますは 「となりに 立てるか」で はんてい する
const INTERACT = new Set(['C','B','I','P','S','W','M','n','Q']);
// ふねで しか いけない ところが ある マップは 陸路BFSでは わりきれないので のぞく。
// LQ4では、そういう マップに MAPS[..].auditSkipBFS=true を つけて 明示する こと。
const BFS_SKIP = new Set(Object.keys(C.MAPS).filter(k=>C.MAPS[k].auditSkipBFS));
if(C.MAPS.world) BFS_SKIP.add('world');   // LQ3ざんぞん：ふね まえていの ワールドマップ
Object.keys(C.MAPS).forEach(mp=>{
  if(BFS_SKIP.has(mp)) return;
  const m = C.MAPS[mp];
  const H = m.tiles.length, Wd = Math.max(...m.tiles.map(r=>r.length));
  const walk = (x,y)=> x>=0&&y>=0&&y<H&&x<Wd && !blocked(mp,x,y);
  // 出発点：ワープ発地 → なければ さいしょの 床
  let start = null;
  const wk = Object.keys(m.warpsXY||{})[0];
  if(wk){ const [x,y]=wk.split(',').map(Number); if(walk(x,y)) start=[x,y]; }
  if(!start){
    outer: for(let y=0;y<H;y++) for(let x=0;x<Wd;x++) if(walk(x,y)){ start=[x,y]; break outer; }
  }
  if(!start){ T('BFS出発点 '+mp, false, '床が ない'); return; }
  const seen = new Set([start.join(',')]);
  const q = [start];
  while(q.length){
    const [x,y] = q.shift();
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
      const nx=x+dx, ny=y+dy, k=nx+','+ny;
      if(!seen.has(k) && walk(nx,ny)){ seen.add(k); q.push([nx,ny]); }
    });
  }
  // 孤立床
  const orphans = [];
  for(let y=0;y<H;y++) for(let x=0;x<Wd;x++)
    if(walk(x,y) && !seen.has(x+','+y)) orphans.push(x+','+y);
  T('孤立床ゼロ '+mp+'（'+orphans.length+'）', orphans.length===0, orphans.slice(0,6).join(' '));
  // しらべるます：となりに 立てるか
  const unreach = [];
  for(let y=0;y<H;y++) for(let x=0;x<Wd;x++){
    if(!INTERACT.has(tileAt(mp,x,y))) continue;
    const ok = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((x+dx)+','+(y+dy)));
    if(!ok) unreach.push(tileAt(mp,x,y)+'@'+x+','+y);
  }
  T('しらべるます到達 '+mp+'（'+unreach.length+'）', unreach.length===0, unreach.slice(0,6).join(' '));
  // 出口（ワープ発地）が すべて つながっているか
  Object.keys(m.warpsXY||{}).forEach(k=>{
    T('出口到達 '+mp+' '+k, seen.has(k));
  });
});

console.log('\n--- audit: ' + (n-ng) + '/' + n + ' 通過（ワープ ' + warpN + 'けん）---');
process.exit(ng ? 1 : 0);
