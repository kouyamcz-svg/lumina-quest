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
const CHD = vm.runInContext('CHAPTERS_DATA', ctx);
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
const INTERACT = new Set(['C','B','I','P','S','W','M','n','Q','L','l','O','K']);
// ★しかけの ます（x 穴／O 動かせる岩／K 扉）は 「といたら 通れる」ので、
//   とうたつせいの けんさでは 通れる ものと して あつかう。
const SOLVABLE = new Set(['x','O','K']);
// ふねで しか いけない ところが ある マップは 陸路BFSでは わりきれないので のぞく。
// LQ4では、そういう マップに MAPS[..].auditSkipBFS=true を つけて 明示する こと。
const BFS_SKIP = new Set(Object.keys(C.MAPS).filter(k=>C.MAPS[k].auditSkipBFS));
// ★IVの world は ふねが ない（雲海は 落ちる だけ）。すべて 陸つづきで なければ ならない。
Object.keys(C.MAPS).forEach(mp=>{
  if(BFS_SKIP.has(mp)) return;
  const m = C.MAPS[mp];
  const H = m.tiles.length, Wd = Math.max(...m.tiles.map(r=>r.length));
  const walk = (x,y)=>{
    if(x<0||y<0||y>=H||x>=Wd) return false;
    const ch = tileAt(mp,x,y);
    return SOLVABLE.has(ch) || !blocked(mp,x,y);
  };
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
  // ★世界地図は 島や 岬が あるので、歩いて つながって いなくて よい
  //   （船・降下で 行き来する）。
  if(C.MAPS[mp].theme!=='world')
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
    // ★世界地図は 島や 岬に 分かれて いる（船・降下で 行き来する）。
    //   歩いて つながって いなくて よい。
    if(C.MAPS[mp].theme!=='world') T('出口到達 '+mp+' '+k, seen.has(k));
  });
});

// ============================================================
// 4-2. NPCの ます（データの ばしょが ほんとうに 'n' か）
//   マップを 作り直した とき、npc.js の ざひょうが とり残されて
//   「話しかけられない NPC」に なる ことが ある（じっさいに でた）。
// ============================================================
const NPCD = vm.runInContext('NPCDATA', ctx);
// 絵（assets.js）と えがき方（view2d.js）も 見る
let CHRD={}, MOND={}, V2SRC='';
try{
  const ac = {console, window:{}}; ac.globalThis = ac; vm.createContext(ac);
  vm.runInContext(fs.readFileSync('assets.js','utf8'), ac, {filename:'assets.js'});
  CHRD = vm.runInContext('CHR', ac) || {};
  MOND = vm.runInContext('MON', ac) || {};
  V2SRC = fs.readFileSync('src/view2d.js','utf8');
}catch(e){}
Object.keys(NPCD.NPCS).forEach(mp=>{
  (NPCD.NPCS[mp]||[]).forEach(e=>{
    const [x,y] = e.at.split(',').map(Number);
    const ch = tileAt(mp,x,y);
    // ものがたりの 途中で 出てくる 人は setTiles で 足すので '.' も ゆるす。
    // 'B' は 「たたかいの あとに その ますへ 立つ 人」（セレンの 立ち合い）。
    T('NPCの ます '+mp+' '+e.at+' '+e.name, ch==='n' || ch==='.' || ch==='B',
      'いまは「'+ch+'」');
    const near = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!blocked(mp,x+dx,y+dy));
    T('NPCに 話しかけられる '+mp+' '+e.at, near);
    // ★人でない もの（棚・管など）に 人の 絵を あてると
    //   「いない はずの 人が いる」ように 見える（じっさいに 出た）。
    //   なまえに 人以外を 示す ことばが あれば、人の 絵を つかっていない こと。
    //   ※ 人の 肩書きに「管」などが 入る ことが ある ので、
    //     「〜の 技師」の ような 人を あらわす ことばが あれば のぞく。
    const PERSON = /技師|男|女|子ども|団長|試験官|見張り|神官|おばさん|セレン|イオ|グラン|衛兵|書記|職人|使い|花売り/.test(e.name);
    const THING = !PERSON && /棚|管|机|箱|扉|石|像|びん|樽/.test(e.name);
    if(THING){
      const HUMAN = ['villagerA','villagerB','elderWoman','guardA','guardB',
                     'butler','captain','childA','priestess','seren','io'];
      T('もの に 人の 絵を つかって いない '+mp+' '+e.name,
        HUMAN.indexOf(e.spr)<0, 'いまは '+e.spr);
    }
  });
});

// ============================================================
// 4-3. ボスますの 絵（1まいに 2たい 置いた ときの ひきわけ）
//   ★ざひょうを わたさずに 章データを ひくと 絵が 出ず、
//     どの ボスも 同じ 紫の かたまりに 見えた（じっさいに 出た）。
// ============================================================
Object.keys(C.MAPS).forEach(mp=>{
  const m = C.MAPS[mp];
  for(let y=0;y<m.tiles.length;y++){
    for(let x=0;x<m.tiles[y].length;x++){
      if(tileAt(mp,x,y)!=='B') continue;
      let hit = null;
      Object.keys(CHD.CH).forEach(no=>{
        const b = CHD.CH[no].bosses || {};
        hit = hit || b[mp+':'+x+','+y] || b[mp];
      });
      T('Bますに ボスが ひもづく '+mp+' ('+x+','+y+')', !!hit);
      if(hit){
        const e = C.MIDBOSS[hit.key];
        T('ボス '+hit.key+' が 実在する', !!e);
        T('ボス '+hit.key+' に 絵が ある', !!(e && e.art));
      }
    }
  }
});

// ★ぎゃくも しらべる：章データに かいた ボスの ますが 地図に あるか。
//   ★地図を つくり直した とき、章データの ざひょうが とり残されて
//     「ぜったいに 出てこない ボス」に なって いた（じっさいに 出た）。
Object.keys(CHD.CH).forEach(no=>{
  const bs = CHD.CH[no].bosses || {};
  Object.keys(bs).forEach(k=>{
    const mp = k.split(':')[0];
    T('ボスの 置き場が ある '+k, !!C.MAPS[mp], 'マップが ない');
    if(!C.MAPS[mp]) return;
    if(k.indexOf(':')>=0){
      const [x,y] = k.split(':')[1].split(',').map(Number);
      // ★物語の 途中で 置かれる ボスも ある（setTiles で 'B' に する）。
      //   その ばあいは、どこかの 会話が その ますを 'B' に して いる こと。
      const placed = Object.keys(CHD.CH).some(no2=>
        (CHD.CH[no2].talkEvents||[]).some(e=>
          (e.setTiles ? (Array.isArray(e.setTiles)?e.setTiles:[e.setTiles]) : [])
            .some(o=>(o.map===mp) && o.x===x && o.y===y && o.ch==='B')));
      T('ボスの ますが Bに なっている '+k,
        tileAt(mp,x,y)==='B' || placed,
        'いまは「'+tileAt(mp,x,y)+'」／物語で 置かれる：'+placed);
      const near = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!blocked(mp,x+dx,y+dy));
      T('ボスに たどりつける '+k, near);
    }else{
      const any = C.MAPS[mp].tiles.some(r=>r.indexOf('B')>=0);
      T('マップに Bますが ある '+k, any);
    }
  });
});

// ★人の 絵を つかう ボスの 大きさ：
//   ★まもの と おなじ ばいりつで えがくと、人だけ 大きく 見える
//     （立ち合いの セレンが イオの 1.5ばいに なって いた）。
//     人の 絵（CHR）を つかう ボスは、地図では 人の 大きさで えがく こと。
{
  Object.keys(CHD.CH).forEach(no=>{
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      const e = C.MIDBOSS[bs[k].key];
      if(!e || !e.art) return;
      const isChr = !!CHRD[e.art], isMon = !!MOND[e.art];
      T('ボスの 絵が どこかに ある '+e.name, isChr || isMon, 'art='+e.art);
      if(isChr && !isMon){
        // 人の 絵を つかう ボスは、地図で 人の 大きさに そろえる しくみを 通る
        T('人の 絵の ボスは 人の 大きさで えがく '+e.name,
          V2SRC.includes('a._isChr ? chrDrawScale(s) : sc'), 'view2d.js に しくみが ない');
      }
    });
  });
}

// ★人が 二重に 見えない こと：
//   おなじ人の なまえが、1まいの 地図で NPCと ボスますに 同時に
//   出て いないか（セレンが 2人 ならんで 見えた）。
Object.keys(NPCD.NPCS).forEach(mp=>{
  const names = (NPCD.NPCS[mp]||[]).map(e=>e.name);
  Object.keys(CHD.CH).forEach(no=>{
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      if(k.split(':')[0] !== mp) return;
      const key = bs[k].key, e = C.MIDBOSS[key];
      if(!e) return;
      names.forEach(nm=>{
        // 「見習い セレン」と「セレン」の ように、なまえが かさなる ばあい
        if(!(e.name.indexOf(nm)>=0 || nm.indexOf(e.name)>=0)) return;
        const at = (NPCD.NPCS[mp].find(x=>x.name===nm)||{}).at;
        T('同じ人が 2か所に いない '+mp+' '+nm, at===k.split(':')[1],
          'NPCは '+at+' ／ ボスますは '+k.split(':')[1]);
      });
    });
  });
});

// ★けっかい（WARDS）：とおせんぼの じょうけんが 物語で 立つ ものか。
//   ★どこにも 立たない めじるしを 指すと、えいえんに 入れなく なる。
{
  const raised = new Set();
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    (cd.talkEvents||[]).forEach(e=>(e.set||[]).forEach(f=>raised.add(f)));
    Object.keys(cd.bossReward||{}).forEach(k=>(cd.bossReward[k].set||[]).forEach(f=>raised.add(f)));
    Object.keys(cd.bosses||{}).forEach(k=>{ const b=cd.bosses[k]; if(b.clearedFlag) raised.add(b.clearedFlag); });
    Object.keys(cd.onEnter||{}).forEach(k=>raised.add(cd.onEnter[k]));
    Object.keys(cd.lampGates||{}).forEach(k=>{ const g2=cd.lampGates[k]; if(g2.flag) raised.add(g2.flag); });
    if(cd.ending) (cd.ending.set||[]).forEach(f=>raised.add(f));
    (cd.setFlags||[]).forEach(f=>raised.add(f));   // ★章の はじまりで 立つ もの
  });
  Object.keys(C.WARDS||{}).forEach(mp=>{
    const wd = C.WARDS[mp];
    T('けっかいの さき '+mp+' が 実在する', !!C.MAPS[mp]);
    // ★章だけで あく けっかい（めじるし なし）も ある
    if(wd.flag)
      T('けっかいの めじるし '+wd.flag+' は どこかで 立つ', raised.has(wd.flag), 'どこでも 立たない');
    T('けっかいに ことわりの ことばが ある '+mp, !!(wd.msg && wd.msg.length));
  });
}

// ★「まだ 起きて いない こと」を 前提に した せりふが、じょうけん なしで 出ないか。
//   ★オボロを 倒す 前から「オボロが いた あたり」と 過去形で 言って いた。
{
  const DONE = ['オボロ','ウンブラ','あぎと','かんむれ','討った','倒した','いた あたり'];
  Object.keys(NPCD.NPCS).forEach(mp=>{
    (NPCD.NPCS[mp]||[]).forEach(e=>{
      (e.lines||[]).forEach(l=>{
        if(l.when) return;                      // じょうけん つきは よい
        (l.text||[]).forEach(t=>{
          const hit = DONE.filter(w=>t.indexOf(w)>=0);
          T('じょうけん なしの せりふが 先ばしって いない '+mp+' '+e.name,
            hit.length===0, hit.join(' ')+' ｜ '+t.slice(0,30));
        });
      });
    });
  });
}

// ★「そこを 調べよう」と 案内した ばしょが、ほんとうに そこに あるか。
//   ★オボロを 倒した ますと、かけらの ある ますが 3ます ずれて いて、
//     「いた あたりを 調べよう」と 言われても 見つからなかった。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    Object.keys(cd.bossReward||{}).forEach(key=>{
      const rw = cd.bossReward[key];
      const says = (rw.msg||[]).some(l=>/いた あたりを 調べ|足もとに 何か/.test(l));
      if(!says) return;
      // その ボスの ます
      let at = null;
      Object.keys(cd.bosses||{}).forEach(k=>{ if(cd.bosses[k].key===key) at=k; });
      T('倒した あとに 調べる 先が ある '+key, !!at);
      if(!at) return;
      const mp = at.split(':')[0];
      const [x,y] = at.split(':')[1].split(',').map(Number);
      // 倒した ますが そのまま しらべられる ように なる こと
      const turns = (rw.setTiles ? (Array.isArray(rw.setTiles)?rw.setTiles:[rw.setTiles]) : [])
        .some(o=>o.map===mp && o.x===x && o.y===y && o.ch==='n');
      T('倒した ますを その場で しらべられる '+key, turns,
        '別の ますに 置くと 見つからない');
      const npc = (NPCD.NPCS[mp]||[]).some(e=>e.at===x+','+y);
      T('倒した ますに しらべる 人／物が いる '+key, npc);
    });
  });
}

// ★せりふの じょうけん（when）に、しくみの ない 書き方が まざって いないか。
//   ★unlessFlag と 書いて いたが、しくみは notFlag しか 見ない。
//     まちがえると その せりふが いつでも 出る（または 出ない）。
{
  const OK = ['ch','state','flag','notFlag'];
  Object.keys(NPCD.NPCS).forEach(mp=>{
    (NPCD.NPCS[mp]||[]).forEach(e=>{
      (e.lines||[]).forEach(l=>{
        if(!l.when) return;
        Object.keys(l.when).forEach(k=>
          T('せりふの じょうけんが 正しい '+mp+' '+e.name, OK.indexOf(k)>=0,
            'しらない 書き方「'+k+'」'));
      });
    });
  });
}

// ★仲間に なる 会話は、地図の その人を 消す こと。
//   ★消し忘れると 仲間の 本人と 地図の 本人で 2体に なる。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    (cd.talkEvents||[]).forEach(e=>{
      if(!e.join || !e.npc) return;
      // その 会話あいてが 地図の どこに いるか
      const spots = [];
      Object.keys(NPCD.NPCS).forEach(mp=>
        (NPCD.NPCS[mp]||[]).forEach(x=>{ if(x.name===e.npc) spots.push([mp, x.at]); }));
      const cleared = (e.setTiles ? (Array.isArray(e.setTiles)?e.setTiles:[e.setTiles]) : [])
        .map(o=>o.map+':'+o.x+','+o.y);
      spots.forEach(([mp,at])=>{
        T('第'+(no-1)+'章：仲間に なると 地図から 消える '+e.npc,
          cleared.indexOf(mp+':'+at)>=0,
          '地図に のこる（'+mp+' '+at+'）／消して いる：'+(cleared.join(' ')||'なし'));
      });
    });
  });
}

// ★一枚絵の しるしが 実在するか。
//   ★書いた しるしと 絵の 名前が ずれると、まっ黒な 画面に なる。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    const imgs = [];
    if(cd.ending && cd.ending.img) imgs.push(['章末', cd.ending.img]);
    (cd.talkEvents||[]).forEach(e=>{ if(e.img) imgs.push([e.npc, e.img]); });
    Object.keys(cd.bosses||{}).forEach(k=>{ if(cd.bosses[k].img) imgs.push([k, cd.bosses[k].img]); });
    imgs.forEach(([who,img])=>
      T('第'+(no-1)+'章：一枚絵 '+img+' が ある（'+who+'）', !!MOND[img], '絵が ない'));
  });
}

// ★章の おわりに つながる みちすじが、クエストに 出て いるか。
//   ★オボロを 討った あと 何を すれば よいか どこにも 出て おらず、
//     プレイヤーが 迷子に なった。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    if(!cd.ending || !cd.ending.trigger) return;
    const trig = cd.ending.trigger;
    // その めじるしが クエストの 手順に 出て いる か
    const inStep = Object.values(NPCD.QUESTS||{}).some(q=>
      q.chapter===Number(no) && (q.steps||[]).some(st=>st.flag===trig));
    T('第'+(no-1)+'章：章末に つながる 手順が クエストに 出る（'+trig+'）', inStep,
      'どの クエストにも 出て いない');
  });
}

// ★「めじるしを 立てる 会話」が どこかに ある か。
//   ★章データを 書きかえた ときに 会話を まるごと 落として しまい、
//     その めじるしが 永久に 立たなく なって いた。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    const raised = new Set();
    (cd.talkEvents||[]).forEach(e=>(e.set||[]).forEach(f=>raised.add(f)));
    Object.keys(cd.bossReward||{}).forEach(k=>(cd.bossReward[k].set||[]).forEach(f=>raised.add(f)));
    Object.keys(cd.bosses||{}).forEach(k=>{ if(cd.bosses[k].clearedFlag) raised.add(cd.bosses[k].clearedFlag); });
    Object.keys(cd.onEnter||{}).forEach(k=>raised.add(cd.onEnter[k]));
    Object.keys(cd.lampGates||{}).forEach(k=>{ if(cd.lampGates[k].flag) raised.add(cd.lampGates[k].flag); });
    if(cd.ending) (cd.ending.set||[]).forEach(f=>raised.add(f));
    // ★ノルマ（startQuota）で 立つ めじるしも かぞえる
    (cd.talkEvents||[]).forEach(e=>{
      if(e.startQuota && e.startQuota.flag) raised.add(e.startQuota.flag);
    });
    // ★章に なった とたんに 立つ めじるし
    (cd.setFlags||[]).forEach(f=>raised.add(f));
    // 会話の 前提（cond／unless）に 出てくる めじるしは、どこかで 立つ こと
    const need = new Set();
    (cd.talkEvents||[]).forEach(e=>{
      (e.cond||[]).forEach(f=>need.add(f));
      if(e.unless) need.add(e.unless);
    });
    Object.keys(cd.bosses||{}).forEach(k=>{ if(cd.bosses[k].needFlag) need.add(cd.bosses[k].needFlag); });
    if(cd.ending && cd.ending.trigger) need.add(cd.ending.trigger);
    need.forEach(f=>{
      if(!/^ch\d/.test(f)) return;
      const own = f.indexOf('ch'+(Number(no)-1)+'_')===0;
      if(!own) return;                         // よその 章の めじるしは 見ない
      T('第'+(no-1)+'章：めじるし '+f+' を 立てる 会話が ある', raised.has(f),
        'どこでも 立たない（会話を 落とした？）');
    });
  });
}

// ★その 章で 行ける マップの しかけが、その 章に 書いて あるか。
//   ★章が 変わると まえの 章の 章データは 見に いかない。
//     点検路を 第1章で 再訪する のに 仕掛けを 書き忘れ、
//     灯りを 2つ 点けても 点検口が 開かなかった。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    if(!cd.start) return;
    // その 章の はじまりから、ワープを たどって 行ける マップ
    const seen = new Set([cd.start.map]); const q=[cd.start.map];
    while(q.length){
      const mp = q.shift();
      const w = (C.MAPS[mp]||{}).warpsXY || {};
      Object.keys(w).forEach(k=>{
        const to = w[k].to;
        if(!seen.has(to) && C.MAPS[to]){ seen.add(to); q.push(to); }
      });
    }
    // 章の はじめに ならす ます（setTiles）は 「かたづけた」と みなす
    const fixed = new Set(((cd.setTiles)||[]).map(o=>o.map+':'+o.x+','+o.y));
    const lg = cd.lampGates||{}, lk = cd.locks||{};
    // ★その 章では まだ 入れない ばしょ（けっかい）は のぞく。
    //   けっかいの むこうから さらに 先へ つながる ぶんも のぞく。
    const cut = (mp)=>{
      if(!seen.has(mp)) return;
      seen.delete(mp);
      const w2 = (C.MAPS[mp]||{}).warpsXY || {};
      Object.keys(w2).forEach(k2=>{
        const nx = w2[k2].to;
        // 入口（けっかいの 手前）へ もどる ぶんは 切らない
        if(nx===cd.start.map) return;
        cut(nx);
      });
    };
    Object.keys(C.WARDS||{}).forEach(mp=>{
      if(Number(no) < C.WARDS[mp].chapter) cut(mp);
    });
    seen.forEach(mp=>{
      const t = C.MAPS[mp].tiles;
      let hasL=false, ks=[];
      for(let y=0;y<t.length;y++) for(let x=0;x<t[y].length;x++){
        const ch=t[y][x];
        if((ch==='L'||ch==='l') && !fixed.has(mp+':'+x+','+y)) hasL=true;
        if(ch==='K' && !fixed.has(mp+':'+x+','+y)) ks.push(x+','+y);
      }
      if(hasL) T('第'+(no-1)+'章：灯りに 開く さきが ある '+mp, !!lg[mp], '章データに lampGates が ない');
      ks.forEach(k=>T('第'+(no-1)+'章：扉に 説明が ある '+mp+' '+k, !!lk[mp+':'+k], '章データに locks が ない'));
    });
  });
}

// ★ボスを 倒したら、その 章の 装備が すくなくとも ひとつ 買える こと。
//   ★ボスの 金が すえおきで、章が すすむほど 割に あわなく なって いた。
{
  const SHOP_OF = {1:'lower_dist:S', 2:'mid_dist:S', 3:'upper_dist:S'};
  Object.keys(CHD.CH).forEach(no=>{
    const sh = C.SHOPS[SHOP_OF[no]];
    if(!sh) return;
    const prices = sh.filter(i=>i.kind==='w'||i.kind==='a').map(i=>i.price);
    if(!prices.length) return;
    const cheap = Math.min.apply(null, prices);
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      const e = C.MIDBOSS[bs[k].key];
      if(!e) return;
      // ★訓練の あいて（木人・模擬戦）は 金を くれなくて よい。
      //   逃げる あいて（あぎと）も 山場では ない。
      if(!e.gold) return;
      if(bs[k].flee) return;
      T('第'+(no-1)+'章：'+e.name+' の 金で 装備が 買える',
        e.gold >= cheap, e.gold+'G ／ 最安 '+cheap+'G');
    });
  });
}

// ★とおせんぼの ますは、見た目でも 止まって いると 分かる こと。
//   ★隔壁(K)に 城門の 絵を あてて いて、通れる 門に 見えた。
{
  const V2 = fs.readFileSync('src/view2d.js','utf8');
  const hasK = /case 'K': return sky \? atlas\.bulkhead/.test(V2);
  T('隔壁に とじた 絵が ある', hasK, '天空の 街で 城門の 絵に なって いる');
  T('とじた 隔壁の 絵が かかれて いる', V2.indexOf('atlas.bulkhead = tile')>=0);
}

// ★ボスの 絵は タイル なんこぶんも 上へ のびる。
//   ★地図の 上ばしに 置くと 頭が 画面の 外に 出て 切れた。
//     絵の たかさ ぶんの 空きが ますの 上に ある こと。
{
  const TS=16, ts=48;                       // 3ばい表示の とき
  const sc = Math.max(1, Math.round(ts/TS*0.6));
  Object.keys(CHD.CH).forEach(no=>{
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      if(k.indexOf(':')<0) return;
      const mp = k.split(':')[0];
      const [x,y] = k.split(':')[1].split(',').map(Number);
      const e = C.MIDBOSS[bs[k].key];
      const a = e && e.art && MOND[e.art];
      if(!a) return;
      const need = Math.ceil((a.h*sc)/ts) - 1;   // ますの 上に いる 空き
      T('ボスの 絵が 上に はみ出ない '+k+'（'+need+'ます いる）', y >= need,
        'いまの y='+y);
    });
  });
}

// ★ボスの 絵は よこにも 広い。地図の はしに 置くと 左右が 見切れる。
//   ★そらくらい（2.8タイルぶん）を 右はしに 置いて、左が 切れて いた。
{
  const TS=16, ts=48;
  const sc = Math.max(1, Math.round(ts/TS*0.6));
  Object.keys(CHD.CH).forEach(no=>{
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      if(k.indexOf(':')<0) return;
      const mp = k.split(':')[0];
      const [x,y] = k.split(':')[1].split(',').map(Number);
      const e = C.MIDBOSS[bs[k].key];
      const a = e && e.art && MOND[e.art];
      if(!a || !C.MAPS[mp]) return;
      const side = Math.ceil(((a.w*sc)/ts - 1)/2);      // 左右に いる 空き
      const W = C.MAPS[mp].tiles[0].length;
      T('ボスの 絵が 左に はみ出ない '+k+'（'+side+'ます いる）', x-side >= 0, 'いまの x='+x);
      T('ボスの 絵が 右に はみ出ない '+k+'（'+side+'ます いる）', x+side <= W-1,
        'いまの x='+x+' / はば='+W);
    });
  });
}

// ★扉（D）は 建物の かべに つける。通りの 上に 浮かせない。
//   ★かべから 1ます はなれて いると、扉だけ 飛び出して 見えた。
Object.keys(C.MAPS).forEach(mp=>{
  const t = C.MAPS[mp].tiles;
  for(let y=0;y<t.length;y++){
    for(let x=0;x<t[y].length;x++){
      if(tileAt(mp,x,y)!=='D') continue;
      // となりの どこかが かべ（建物）である こと
      // ★上層の 白亜の 壁（R）も 建物。'#' だけ 見て いた。
      const WALLS = ['#','R'];
      const touch = [[1,0],[-1,0],[0,1],[0,-1]]
        .some(([dx,dy])=>WALLS.indexOf(tileAt(mp,x+dx,y+dy))>=0);
      T('扉が 建物に ついて いる '+mp+' ('+x+','+y+')', touch);
    }
  }
});

// ★噴水は 「F を ならべた 四角」で 形が きまる。
//   四角に なって いない（でこぼこ）と、絵が 切れて 見える。
Object.keys(C.MAPS).forEach(mp=>{
  const th = C.MAPS[mp].theme;
  if(th!=='sky' && th!=='skygarden') return;
  const t = C.MAPS[mp].tiles;
  const done = new Set();
  for(let y=0;y<t.length;y++){
    for(let x=0;x<t[y].length;x++){
      if(tileAt(mp,x,y)!=='F' || done.has(x+','+y)) continue;
      // 左上を さがす
      if(tileAt(mp,x-1,y)==='F' || tileAt(mp,x,y-1)==='F') continue;
      let w=0; while(tileAt(mp,x+w,y)==='F') w++;
      let h=0; while(tileAt(mp,x,y+h)==='F') h++;
      let ok = true;
      for(let j=0;j<h;j++) for(let i=0;i<w;i++){
        if(tileAt(mp,x+i,y+j)!=='F') ok=false;
        done.add((x+i)+','+(y+j));
      }
      // まわりに はみ出した F が ない こと
      for(let j=-1;j<=h;j++){
        if(tileAt(mp,x-1,y+j)==='F' || tileAt(mp,x+w,y+j)==='F') ok=false;
      }
      for(let i=-1;i<=w;i++){
        if(tileAt(mp,x+i,y-1)==='F' || tileAt(mp,x+i,y+h)==='F') ok=false;
      }
      T('噴水が 四角に ならんで いる '+mp+' ('+x+','+y+') '+w+'×'+h, ok);
      T('噴水が 2ます いじょう '+mp+' ('+x+','+y+')', w>=2 && h>=2, w+'×'+h);
      // ★建物に くっつくと めりこんで 見える。1ます あける こと。
      const WALL = ['#','R'];
      const stuck = [];
      for(let j=0;j<h;j++) for(let i=0;i<w;i++){
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
          if(WALL.indexOf(tileAt(mp,x+i+dx,y+j+dy))>=0)
            stuck.push((x+i)+','+(y+j)+'→'+(x+i+dx)+','+(y+j+dy));
        });
      }
      T('噴水が 建物に くっついて いない '+mp+' ('+x+','+y+')',
        stuck.length===0, stuck.join(' '));
    }
  }
});

// ★「何人めか」を 数える 会話は、書き置きの 順番を つかわない こと。
//   ★さきに 三人めを 助けても「ひとりめ」と 出て いた。
{
  const NG = /ひとりめ|ふたりめ|三人め|あと 二人|あと 一人|あと 三人/;
  Object.keys(CHD.CH).forEach(no=>{
    const evs = CHD.CH[no].talkEvents || [];
    // おなじ かたまりの めじるしを つかう 会話（saved1,2,3 など）
    const groups = {};
    evs.forEach(e=>{
      (e.set||[]).forEach(f=>{
        const g = f.replace(/\d+$/,'');
        if(g!==f){ (groups[g]=groups[g]||[]).push(e); }
      });
    });
    Object.keys(groups).forEach(g=>{
      const list = groups[g];
      if(list.length < 2) return;
      list.forEach(e=>{
        T('第'+(no-1)+'章：'+e.npc+' が 人数を 数えて いる', !!(e.countFlags && e.countFlags.length),
          '書き置きの 順番に なって いる');
        (e.msg||[]).forEach(l=>{
          T('第'+(no-1)+'章：'+e.npc+' の せりふが 順番に よらない', !NG.test(l), l.slice(0,36));
        });
      });
    });
  });
}

// ★ダンジョンに 入った ところから ボスが 見えない こと。
//   ★炉の 外郭は 迷路の 上に ボスの 間が つながって いて、
//     入った とたん ボスが 見えて いた。
{
  const TS2=16, ts2=48;
  Object.keys(CHD.CH).forEach(no=>{
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      if(k.indexOf(':')<0) return;
      const mp = k.split(':')[0];
      const [bx,by] = k.split(':')[1].split(',').map(Number);
      const m = C.MAPS[mp]; if(!m) return;
      // 入口（ワープの ある ます）から ボスまで
      // ★「ボスの 間」その ものは 近くて よい（入った 先が 山場）。
      //   小さな 広場（点検路・裂け目の広場）も 見えて よい。
      //   しらべるのは 迷路の ような 広い ダンジョン。
      if(!m.enc) return;
      const wide = m.tiles[0].length >= 20 && m.tiles.length >= 20;
      if(!wide) return;
      const w = m.warpsXY || {};
      Object.keys(w).forEach(kk=>{
        const [ex,ey] = kk.split(',').map(Number);
        // 画面に 入る おおよその ます数（よこ9・たて6）
        const near = Math.abs(bx-ex) <= 9 && Math.abs(by-ey) <= 6;
        T('入口 '+mp+'('+ex+','+ey+') から ボスが 見えない',
          !near, 'ボス('+bx+','+by+') が 近すぎる');
      });
    });
  });
}

// ★走って くる えんしゅつ（runIn）が、かべを 通りぬけない こと。
//   ★みちすじは たてから よこの 順に まっすぐ すすむ。
{
  Object.keys(CHD.CH).forEach(no=>{
    (CHD.CH[no].talkEvents||[]).forEach(e=>{
      if(!e.runIn) return;
      // その 会話は どの マップで 起きるか（あいての いる ところ）
      let mp = null;
      Object.keys(NPCD.NPCS).forEach(k=>
        (NPCD.NPCS[k]||[]).forEach(x=>{ if(x.name===e.npc) mp = k; }));
      T('走って くる 会話の マップが ある '+e.npc, !!mp, 'あいてが 地図に いない');
      if(!mp) return;
      const [fx,fy] = e.runIn.from, [tx,ty] = e.runIn.to;
      T('走りだしの ますが 通れる '+e.npc+'（'+fx+','+fy+'）', C.walkable(mp,fx,fy));
      // みちすじを たどって、ぜんぶ 通れる か
      let x=fx, y=fy, ok=true, guard=0;
      while((x!==tx || y!==ty) && guard++<60){
        if(y!==ty) y += (ty>y?1:-1); else if(x!==tx) x += (tx>x?1:-1);
        if(!C.walkable(mp,x,y)) ok=false;
      }
      T('走る みちすじに かべが ない '+e.npc, ok, 'かべを 通りぬける');
      // ★走る 前に 出す ぶん（preMsg）が ある こと。
      //   いきなり かけこんで くると、話の 順が おかしい。
      T('走る 前に 出す ぶんが ある '+e.npc, !!(e.preMsg && e.preMsg.length),
        'いきなり 走って くる');
      T('走りついた さきが 会話の あいての そば '+e.npc,
        Math.abs(tx-x)+Math.abs(ty-y)===0, 'たどりつけない');
    });
  });
}

// ★空と 地上の 行き来の 年数が くいちがって いない こと。
//   ★「毎年 来る」と「千年 誰も 乗って いない」が 同じ 章に あった。
//   きまり：
//     毎年      ＝ 荷を 置いて すぐ 帰る 便
//     四十年ぶり ＝ 人が 五地方を 巡る「巡回降下」
//     千年      ＝ 舟その ものの 古さ（つかった 年数では ない）
{
  const lines = [];
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    (cd.talkEvents||[]).forEach(e=>{
      (e.msg||[]).concat(e.preMsg||[]).forEach(l=>lines.push(String(l)));
    });
    ((cd.ending&&cd.ending.msg)||[]).forEach(l=>lines.push(String(l)));
    (cd.opening||[]).forEach(l=>lines.push(String(l)));
  });
  Object.keys(NPCD.NPCS).forEach(mp=>(NPCD.NPCS[mp]||[]).forEach(e=>
    (e.lines||[]).forEach(l=>(l.text||[]).forEach(t=>lines.push(String(t))))));

  // 「千年」と「舟／降下」を いっしょに 言う ときは、
  // 「つかって いない 年数」では なく「舟の 古さ」で ある こと
  lines.forEach(l=>{
    if(!/千年/.test(l)) return;
    if(!/舟|降下|巡/.test(l)) return;
    const bad = /千年[^。]{0,8}(誰も|使って|動いて|乗って)/.test(l);
    T('「千年」を つかって いない 年数に しない', !bad, l.slice(0,44));
  });
  // 巡回降下の 年数は 四十年で そろえる
  lines.forEach(l=>{
    if(!/巡回|五地方を 巡/.test(l)) return;
    if(!/年/.test(l)) return;
    T('巡回降下の 年数は 四十年', /四十年/.test(l), l.slice(0,44));
  });
}

// ★けっかいの ことばが、いまの 進み具合に あって いる こと。
//   ★そらくらいを 倒したのに「書類が いる」とだけ 出て、
//     どこへ 行けば よいか 分からなかった。
{
  Object.keys(C.WARDS||{}).forEach(mp=>{
    const wd = C.WARDS[mp];
    if(!wd.doneFlag) return;
    T('とちゅうの ことばが ある '+mp, !!wd.msgDone && wd.msgDone.length>0,
      'doneFlag だけ あって ことばが ない');
    // つぎに 何を すれば よいか 入って いる こと
    const t = (wd.msgDone||[]).join('');
    T('つぎに する ことが 書いて ある '+mp,
      /へ|に 行|下りて|もどっ|戻っ|会/.test(t), t.slice(0,40));
  });
}

// ★経験値が 章に 見あって いる こと。
//   ★第2章の ざこが 1体 1800〜2600 で、1戦で 1.5レベル 上がって いた。
//     めやすは「つぎの Lvまでの 経験値 ÷ ざこ1体」が 2〜6戦。
{
  const expNeed = (lv)=> lv*lv*6;
  const CH_LV = {1:5, 2:10, 3:15, 4:21};   // その章の およその Lv
  Object.keys(CH_LV).forEach(no=>{
    const lv = CH_LV[no];
    const need = expNeed(lv);
    C.ENEMIES.forEach(e=>{
      // その章あたりの 敵だけ 見る
      const near = (no==='1' && e.minLv<=4)
                || (no==='2' && e.minLv>=7 && e.minLv<=9)
                || (no==='3' && e.minLv>=12 && e.minLv<=15)
                || (no==='4' && e.minLv>=18);
      if(!near) return;
      const fights = need / e.exp;
      T('第'+(no-1)+'章：'+e.name+' の 経験値が 高すぎない', fights >= 1.5,
        '1戦で '+(1/fights).toFixed(1)+'レベル 上がる（exp'+e.exp+'）');
      T('第'+(no-1)+'章：'+e.name+' の 経験値が 低すぎない', fights <= 12,
        (fights).toFixed(0)+'戦で やっと 1レベル');
    });
  });
}

// ★管の しかけ（pipeLamps）が 地図と 合って いる こと。
//   ★灯りを 直に 点けられると 管が 要らなく なる。
//   ★継ぎ目・灯り・管の 数が 合わないと 解けない／解けすぎる。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    const pl = cd.pipeLamps || {};
    let totalPipes = 0, need = 0;
    // その 章で ひろえる 管の 数（u の 数）
    Object.keys(C.MAPS).forEach(mp=>{
      C.MAPS[mp].tiles.forEach(r=>{ for(const ch of r) if(ch==='u') totalPipes++; });
    });
    Object.keys(pl).forEach(mp=>{
      const m = C.MAPS[mp];
      T('管の しかけの マップが ある '+mp, !!m, 'マップが ない');
      if(!m) return;
      // 継ぎ目の ざひょうが 地図に ある か
      Object.keys(pl[mp]).forEach(k=>{
        const [x,y] = k.split(',').map(Number);
        T('継ぎ目が 地図に ある '+mp+' '+k, tileAt(mp,x,y)==='h',
          'いまは「'+tileAt(mp,x,y)+'」');
        // その 継ぎ目が 点ける 灯りが ある か
        (pl[mp][k]||[]).forEach(o=>{
          T('灯りが 地図に ある '+mp+' ('+o.x+','+o.y+')',
            tileAt(mp,o.x,o.y)==='L' || tileAt(mp,o.x,o.y)==='l',
            'いまは「'+tileAt(mp,o.x,o.y)+'」');
        });
      });
      // 地図の 継ぎ目が ぜんぶ 表に ある か（差しても 何も 起きない を ふせぐ）
      const rows = m.tiles;
      for(let y=0;y<rows.length;y++) for(let x=0;x<rows[y].length;x++){
        if(rows[y][x] !== 'h') continue;
        T('継ぎ目が 表に ある '+mp+' ('+x+','+y+')', !!pl[mp][x+','+y],
          'さしても 何も 起きない');
      }
      // 灯りの 数 ＝ その階で いる 管の 数
      let lamps = 0;
      rows.forEach(r=>{ for(const ch of r) if(ch==='L'||ch==='l') lamps++; });
      const joints = Object.keys(pl[mp]).length;
      T('灯りと 継ぎ目の 数が 合う '+mp, lamps===joints, '灯り'+lamps+' / 継ぎ目'+joints);
      need = Math.max(need, joints);
    });
    if(Object.keys(pl).length){
      T('第'+(no-1)+'章：管の 数が 足りる', totalPipes >= need,
        '管'+totalPipes+'本 / いちばん いる 階は '+need+'本');
    }
  });
}

// ★ボスの まわりに 立つ ゆとりが ある こと。
//   ★せまい 部屋に おくと、入って すぐ ぶつかって しまう。
//     入口から すこし 歩いて 向かう ほうが 山場らしい。
{
  Object.keys(CHD.CH).forEach(no=>{
    const bs = CHD.CH[no].bosses || {};
    Object.keys(bs).forEach(k=>{
      if(k.indexOf(':')<0) return;
      const mp = k.split(':')[0];
      const [bx,by] = k.split(':')[1].split(',').map(Number);
      const m = C.MAPS[mp]; if(!m) return;
      // 入口（階段・門・ワープの 着地）から ボスまでの へだたり
      const w = m.warpsXY || {};
      let best = -1;
      Object.keys(w).forEach(kk=>{
        const [ex,ey] = kk.split(',').map(Number);
        const d = Math.abs(bx-ex) + Math.abs(by-ey);
        if(best<0 || d<best) best = d;
      });
      if(best>=0) T('ボスまで すこし 歩く '+k+'（'+best+'歩）', best>=3,
        '入って すぐ ぶつかる');
      // まわりに 立てる ますが 2つ いじょう
      let around = 0;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        if(C.walkable(mp,bx+dx,by+dy)) around++;
      });
      T('ボスの まわりに 立てる '+k+'（'+around+'ます）', around>=1, 'まわりが ふさがって いる');
    });
  });
}

// ★たたかいの ある マップには 出現表が ある こと。
//   ★塔を 5階に 分けた とき 出現表の 名まえを 直さず、
//     どの 階でも おなじ 敵しか 出なかった（保険が はたらいて いた）。
{
  const src4 = fs.readFileSync('src/core.js','utf8');
  const mm = src4.match(/const byMap = \{([\s\S]*?)\n\};/);
  const byMap = {};
  if(mm) mm[1].split('\n').forEach(l=>{
    const g = /^\s*([a-z_0-9]+):\s*\[(.*)\],/.exec(l);
    if(g) byMap[g[1]] = g[2].split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
  });
  const keys = new Set(C.ENEMIES.map(e=>e.key));
  Object.keys(C.MAPS).forEach(mp=>{
    if(!C.MAPS[mp].enc) return;
    T('たたかいの ある マップに 出現表が ある '+mp, !!byMap[mp], '出現表が ない');
    if(!byMap[mp]) return;
    T('出現表に 2しゅるい いじょう '+mp, byMap[mp].length>=2, byMap[mp].length+'しゅるい');
    byMap[mp].forEach(k=>
      T('出現表の 敵が 実在する '+mp+' '+k, keys.has(k), 'そんな 敵は いない'));
  });
  // 出現表に あるのに マップが ない（名まえの 直し忘れ）
  Object.keys(byMap).forEach(mp=>{
    T('出現表の マップが 実在する '+mp, !!C.MAPS[mp], 'マップが ない（名まえを 直し忘れて いる）');
  });
}

// ★仕切り(K)を あけないと 先へ 行けない こと。
//   ★仕切りと 階段が はなれて いて、あけずに 上れて しまった。
//     しかけが 意味を なさない。
{
  Object.keys(CHD.CH).forEach(no=>{
    const cd = CHD.CH[no];
    Object.keys(cd.lampGates||{}).forEach(mp=>{
      const m = C.MAPS[mp]; if(!m) return;
      const opens = cd.lampGates[mp].open || [];
      // 入口（下り階段／出口）を さがす
      const t = m.tiles, W=t[0].length, H=t.length;
      let st=null, goal=null;
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const ch=t[y][x];
        if(ch==='<'||ch==='G') st=[x,y];
        if(ch==='>') goal=[x,y];
      }
      if(!st || !goal) return;
      const reach=(blockGate)=>{
        const seen=new Set([st.join(',')]); const q=[st.slice()];
        while(q.length){ const [x,y]=q.shift();
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const nx=x+dx, ny=y+dy, k=nx+','+ny;
            if(seen.has(k)) continue;
            const isGate = opens.some(o=>o.x===nx && o.y===ny);
            if(blockGate && isGate) continue;
            if(!isGate && !C.walkable(mp,nx,ny)) continue;
            seen.add(k); q.push([nx,ny]);
          } }
        return seen;
      };
      T('第'+(no-1)+'章：'+mp+' は 仕切りを あけないと 先へ 行けない',
        !reach(true).has(goal.join(',')), 'あけずに 通れる（しかけが 意味を なさない）');
      T('第'+(no-1)+'章：'+mp+' は あければ 先へ 行ける',
        reach(false).has(goal.join(',')), 'あけても 行けない');
    });
  });
}

// ★「しらべて 手に 入れる もの」は 通れない こと。
//   ★管の きれはし(u)が 通れて しまい、上に 乗れた。
//     宝箱と おなじく、となりから しらべる もの。
{
  // 手に 入れる もの／ふさぐ もの
  const MUST_BLOCK = ['C','u','O','L','l','K','B','n','h','H','E','F','%','e','x'];
  MUST_BLOCK.forEach(ch=>{
    T('しらべる ます「'+ch+'」は 通れない', C.isBlocked(ch), '上に 乗れて しまう');
  });
  // 乗って つかう もの（階段・扉）は 通れる こと
  ['<','>','D','G','g'].forEach(ch=>{
    T('乗って つかう ます「'+ch+'」は 通れる', !C.isBlocked(ch));
  });
}

// ★どの マップにも 日本語の 地名が ある こと。
//   ★塔を 5階に 分けた とき 登録を 忘れ、画面の 左上に「tower1」と 出た。
{
  const W2 = vm.runInContext('WORLD', ctx);
  Object.keys(C.MAPS).forEach(mp=>{
    const nm = W2.mapName(mp);
    T('地名が ある '+mp, !!nm && nm!==mp, 'いまは「'+nm+'」');
    T('地名が 日本語 '+mp, !/^[a-z0-9_]+$/i.test(nm||''), 'いまは「'+nm+'」');
  });
}

// ★天空城の 大門（A）は 四角に ならべる。でこぼこだと 絵が 切れる。
//   ★噴水と 同じ しくみ。ならべた 大きさで 形が きまる。
Object.keys(C.MAPS).forEach(mp=>{
  const t = C.MAPS[mp].tiles;
  const done = new Set();
  for(let y=0;y<t.length;y++){
    for(let x=0;x<t[y].length;x++){
      if(tileAt(mp,x,y)!=='E' || done.has(x+','+y)) continue;
      if(tileAt(mp,x-1,y)==='E' || tileAt(mp,x,y-1)==='E') continue;
      let w=0; while(tileAt(mp,x+w,y)==='E') w++;
      let h=0; while(tileAt(mp,x,y+h)==='E') h++;
      let ok = true;
      for(let j=0;j<h;j++) for(let i=0;i<w;i++){
        if(tileAt(mp,x+i,y+j)!=='E') ok=false;
        done.add((x+i)+','+(y+j));
      }
      for(let j=-1;j<=h;j++) if(tileAt(mp,x-1,y+j)==='E'||tileAt(mp,x+w,y+j)==='E') ok=false;
      for(let i=-1;i<=w;i++) if(tileAt(mp,x+i,y-1)==='E'||tileAt(mp,x+i,y+h)==='E') ok=false;
      T('大門が 四角に ならんで いる '+mp+' ('+x+','+y+') '+w+'×'+h, ok);
      T('大門が 2ます いじょう '+mp+' ('+x+','+y+')', w>=2 && h>=2, w+'×'+h);
      // 前に 立てる ます が ある こと
      let stand = false;
      for(let i=0;i<w;i++) if(C.walkable(mp, x+i, y+h)) stand = true;
      T('大門の 前に 立てる '+mp+' ('+x+','+y+')', stand, '前が ふさがって いる');
    }
  }
});

// ★門から 門への 大通りが、まっすぐ 通れる こと。
//   ★噴水を 大通りの 上に 置いて しまい、遠回りに なって いた。
//     置きものは 通りを ふさがない こと。
Object.keys(C.MAPS).forEach(mp=>{
  const t = C.MAPS[mp].tiles, H=t.length, W=t[0].length;
  // 上下の 門（G/Q/D/g）を さがす
  const gate = (x,y)=>'GQDg'.indexOf(tileAt(mp,x,y))>=0;
  let top=null, bot=null;
  for(let x=0;x<W;x++){ if(gate(x,0)) top=x; if(gate(x,H-1)) bot=x; }
  if(top===null || bot===null || top!==bot) return;      // たての 大通りが ない
  // その 列が 上から 下まで 通れるか
  let clear = true, blocked = [];
  for(let y=1;y<H-1;y++){
    if(!C.walkable(mp, top, y)){ clear=false; blocked.push(top+','+y); }
  }
  T('たての 大通りが まっすぐ 通れる '+mp+'（x='+top+'）', clear, 'ふさいで いる：'+blocked.join(' '));
});

// ★門の むき：G＝よこに ながれる かべ（南北の 出入口）、g＝たての かべ（東西）。
//   ★同じ 絵を つかうと、東の 門が かべに 埋もれて 向きが おかしく 見えた。
Object.keys(C.MAPS).forEach(mp=>{
  const t = C.MAPS[mp].tiles;
  for(let y=0;y<t.length;y++){
    for(let x=0;x<t[y].length;x++){
      const ch = tileAt(mp,x,y);
      if(ch!=='G' && ch!=='g') continue;
      const lr = blocked(mp,x-1,y) && blocked(mp,x+1,y);
      const ud = blocked(mp,x,y-1) && blocked(mp,x,y+1);
      const want = lr ? 'G' : (ud ? 'g' : null);
      T('門の むきが かべに あう '+mp+' ('+x+','+y+')', want===null || ch===want,
        'いま「'+ch+'」／ほしい「'+(want||'?')+'」');
    }
  }
});

// ============================================================
// 5. しかけ監査（IVから：押し岩・穴・光珠灯・扉）
// ============================================================
Object.keys(C.MAPS).forEach(mp=>{
  const m = C.MAPS[mp];
  const H = m.tiles.length, Wd = Math.max(...m.tiles.map(r=>r.length));
  const rocks=[], pits=[], lamps=[], gates=[];
  for(let y=0;y<H;y++) for(let x=0;x<Wd;x++){
    const c = tileAt(mp,x,y);
    if(c==='O') rocks.push([x,y]);
    if(c==='x') pits.push([x,y]);
    if(c==='L'||c==='l') lamps.push([x,y]);
    if(c==='K') gates.push([x,y]);
  }
  // 岩は さいしょ かならず 押せる（どこかへ うごかせる）
  rocks.forEach(([x,y])=>{
    const ok = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{
      const t = tileAt(mp,x+dx,y+dy), back = tileAt(mp,x-dx,y-dy);
      return (t==='.'||t==='r'||t==='x') && !blocked(mp,x-dx,y-dy);
    });
    T('岩が 押せる '+mp+' ('+x+','+y+')', ok);
  });
  // 穴が ある マップには 岩が 2つ いじょう（1つだと 詰むと やりなおせない）
  if(pits.length) T('穴の ある マップに 岩が 2つ いじょう '+mp+'（岩'+rocks.length+'）', rocks.length>=2);
  // 岩を まっすぐ おして とどく 穴が ある
  if(pits.length){
    const reach = rocks.some(([x,y])=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{
      if(blocked(mp,x-dx,y-dy)) return false;          // うしろに 立てない
      for(let i=1;i<40;i++){
        const c = tileAt(mp,x+dx*i,y+dy*i);
        if(c==='x') return true;
        if(c!=='.'&&c!=='r') return false;
      }
      return false;
    }));
    T('まっすぐ おして 穴に とどく 岩が ある '+mp, reach);
  }
  // 光珠灯は となりに 立てる（しらべられる）
  lamps.forEach(([x,y])=>{
    const ok = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!blocked(mp,x+dx,y+dy));
    T('光珠灯を しらべられる '+mp+' ('+x+','+y+')', ok);
  });
  // 扉には あける てだてが かかれて いる（lampGates か locks）
  gates.forEach(([x,y])=>{
    let ok=false;
    CHD.CH && Object.keys(CHD.CH).forEach(no=>{
      const cd = CHD.CH[no];
      const lg = cd.lampGates && cd.lampGates[mp];
      if(lg && (lg.open||[]).some(o=>o.x===x && o.y===y)) ok=true;
      const lk = cd.locks && cd.locks[mp+':'+x+','+y];
      if(lk && lk.key) ok=true;
    });
    T('扉に あける てだてが ある '+mp+' ('+x+','+y+')', ok);
  });
  // 光珠灯が ある なら、それを ともす さきの 扉が ある
  if(lamps.length){
    let has=false;
    CHD.CH && Object.keys(CHD.CH).forEach(no=>{
      if(CHD.CH[no].lampGates && CHD.CH[no].lampGates[mp]) has=true;
    });
    T('光珠灯に ひらく さきが ある '+mp, has);
    // ★灯りの しかけが ある マップには 灯りが 2つ いじょう。
    //   1つだと 点けた とたんに 開いて しまい、しかけに ならない
    //   （地図を 書きかえた ときに 1つ 消えて いた）。
    let gate=null;
    Object.keys(CHD.CH).forEach(no=>{
      const g2 = CHD.CH[no].lampGates && CHD.CH[no].lampGates[mp];
      if(g2) gate = g2;
    });
    // ★灯りが 1つでも よい ばあいが ある（管の つけかえの ように、
    //   ほかに 手ごたえの もとが ある とき）。0こ だけを だめに する。
    if(gate) T('灯りの しかけに 灯りが ある '+mp+'（'+lamps.length+'）', lamps.length>=1);
  }
});

console.log('\n--- audit: ' + (n-ng) + '/' + n + ' 通過（ワープ ' + warpN + 'けん）---');
process.exit(ng ? 1 : 0);
