'use strict';
// 第5章 巡回パートの検証：データ整合・物語フロー・到達性BFS
const fs = require('fs'), vm = require('vm');
const ctx = { console, window:{}, localStorage:undefined };
ctx.globalThis = ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js']){
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
}
const C = vm.runInContext('LQ3', ctx);
C.bind(C.NullView, C.NullUI, C.NullAudio);
const src = fs.readFileSync('src/core.js','utf8');

let n=0, ng=0;
function T(name, cond){ n++; if(!cond){ ng++; console.log('NG', name); } }

// ============ 1. データ整合 ============
const shardKeys=['shardhound','shardgolem','shardsis','shardeater'];
shardKeys.forEach(k=>T('MIDBOSS存在:'+k, !!C.MIDBOSS[k]));
// artキーが素材に存在（assets.jsのMON定義を文字列検査）
const assets = fs.readFileSync('assets.js','utf8');
['yumebanken','golem','sisA','regretshadow'].forEach(a=>
  T('MON素材あり:'+a, assets.includes(a+':')));
// byMapCh の敵キーがすべて実在
const enemyKeys = new Set(C.ENEMIES.map(e=>e.key));
const bymapch = src.match(/const byMapCh = \{([\s\S]*?)\};/)[1];
const refs = [...bymapch.matchAll(/'(\w+)'/g)].map(m=>m[1]).filter(k=>!k.includes(':'));
refs.filter(k=>!/^\d/.test(k)).forEach(k=>{
  if(!k.match(/^5$/)) T('敵キー実在:'+k, enemyKeys.has(k) || k.startsWith('5'));
});
// だいじなもの
['shard_n','shard_e','shard_s','shard_w'].forEach(k=>T('だいじなもの:'+k, !!C.KEY_ITEMS[k]));
// クエスト定義
['ch5_q4_north','ch5_q5_east','ch5_q6_south','ch5_q7_west'].forEach(q=>T('クエスト:'+q, !!C.QUESTS[q]));

// 台詞46文字以内（ch5の全msg）
const chSrc = fs.readFileSync('src/chapters.js','utf8');
const ch5seg = chSrc.slice(chSrc.indexOf("  5: {"), chSrc.indexOf('// 終章'));
let tooLong=[];
for(const m of ch5seg.matchAll(/'([^'\\]*)'/g)){
  const s=m[1];
  if(s.length>46 && /[ぁ-んァ-ン]/.test(s)) tooLong.push(s);
}
T('台詞46字以内 (超過'+tooLong.length+'件)', tooLong.length===0);
if(tooLong.length) tooLong.slice(0,5).forEach(s=>console.log('  長すぎ:',s.length,s));

// ============ 2. 物語フロー（ヘッドレス実走） ============
C.freshState();
C.G.chapters={};
C.switchChapter(5);
T('5章開始:ソラ単独', C.party.length===1 && C.party[0].cls==='sora');
T('開始時ふね無し', !C.G.ship && !C.G.aboard);

// ゆめのぬし討伐→報告 相当のフラグを立てる
C.G.flags.ch5_started=true; C.G.flags.ch5_beatLord=true; C.G.flags.ch5_reported=true;
C.party[0].lv=15;
T('出航前は船なし', !C.G.ship);

// 出航（ルミア）
T('ルミアevent発火', C.runTalkEvent('ルミア')===true);
T('ch5_sailed', !!C.G.flags.ch5_sailed);
T('ふね係留(48,24)', C.G.ship && C.G.ship.x===48 && C.G.ship.y===24);
T('ルミアevent再発火しない', C.runTalkEvent('ルミア')===false);

// 乗降・海上移動（実際のstepFieldで）
C.P.map='world'; C.P.x=48; C.P.y=25; C.G.mode='field'; C.G.busy=false;
C.stepField(0,-1);
T('ふれて乗船', C.G.aboard===true && C.P.x===48 && C.P.y===24);
C.stepField(-1,0);
T('海上を西へ', C.G.aboard===true && C.P.x===47);
C.stepField(-1,0); C.stepField(-1,0);
T('さらに西へ', C.P.x===45);
C.P.x=46; C.P.y=24;                      // (46,23)は山
C.stepField(0,-1);
T('山には進めない', C.P.y===24 && C.G.aboard===true);
// 下船→船が残る→再乗船（浜(45,22)）
C.P.x=45; C.P.y=23;
C.stepField(0,-1);
T('接岸で下船(45,22)', C.G.aboard===false && C.P.y===22);
T('ふねは(45,23)に残る', C.G.ship.x===45 && C.G.ship.y===23);
C.stepField(0,1);
T('再乗船できる', C.G.aboard===true && C.P.y===23);
// 岸へ戻って下船
C.P.x=48; C.P.y=24;
C.stepField(0,1);
T('接岸で下船', C.G.aboard===false && C.P.x===48 && C.P.y===25);
T('ふねは海に残る', C.G.ship.x===48 && C.G.ship.y===24);
// 乗船中セーブ→ロード復元
C.P.x=48; C.P.y=25; C.stepField(0,-1); C.stepField(-1,0);   // 再乗船して(47,24)
const mem2={}; const st2={setItem:(k,v)=>{mem2[k]=v;},getItem:(k)=>mem2[k]||null};
T('海上セーブ', C.saveGame(st2,0)===true);
C.freshState();
T('海上ロード', C.loadGame(st2,0)===true);
T('船上に復帰', C.G.aboard===true && C.P.map==='world' && C.P.x===47 && C.P.y===24);
C.G.aboard=false; C.G.ship={x:48,y:24};
// リターン随行（静的確認は後段。ここでは係留表の整合）
T('係留表5港', Object.keys(C.MOORS).length===5);

// 北：リオン合流
C.P.map='versa_town';
T('きしだんちょうevent', C.runTalkEvent('きしだんちょう')===true);
T('リオン合流Lv15', C.party.length===2 && C.party[1].cls==='lion' && C.party[1].lv===15);
let bi=C.bossInfoAt('versa_dgn2');
T('versa_dgn2=かけらのばんけん', bi && bi.key==='shardhound' && bi.needFlag==='ch5_north');
T('ばんけん解禁済', !!C.G.flags.ch5_north);
C.G.flags.ch5_shard1=true;   // 討伐相当

// 東：バルド合流
C.P.map='zaal_town';
T('しょうかいちょうevent', C.runTalkEvent('しょうかいちょう')===true);
T('バルド合流', C.party.length===3 && C.party[2].cls==='bald');
T('zaal_dgn2=ねむりぬし', C.bossInfoAt('zaal_dgn2').key==='shardgolem');
C.G.flags.ch5_shard2=true;

// 南：セナ・ルカ合流→5人→控え発生
C.P.map='minamo_port';
T('ししょうevent', C.runTalkEvent('うらないの ししょう')===true);
T('セナ・ルカ合流で5人', C.allMembers().length===5);
T('せんとう4・ひかえ1', C.party.length===4 && C.reserve.length===1);
T('ひかえ=ルカ', C.reserve[0].cls==='ruka');
T('minamo_dgn2=しまい', C.bossInfoAt('minamo_dgn2').key==='shardsis');
C.G.flags.ch5_shard3=true;

// 西：ミオ合流→6人
C.P.map='elde_town';
T('でしevent(合流)', C.runTalkEvent('ゼフの でし')===true);
T('ミオ合流で6人', C.allMembers().length===6 && C.reserve.length===2);
T('elde_top=ゆめくいのつかい', C.bossInfoAt('elde_top').key==='shardeater');
C.G.flags.ch5_shard4=true;

// 浮上→結末
const msgCount=C.NullUI.msgLog.length;
T('でしevent(浮上)', C.runTalkEvent('ゼフの でし')===true);
T('worldTour成立', !!C.G.flags.ch5_worldTour);
T('結末発火(ch5_cleared)', !!C.G.flags.ch5_cleared);
T('完結メッセージ表示', C.NullUI.msgLog.slice(msgCount).join('').includes('かんけつ'));

// ============ 3. 他章への影響なし ============
C.freshState(); C.G.chapters={};
C.switchChapter(1);
T('ch1:versa_dgn2は従来ボス', C.bossInfoAt('versa_dgn2').key==='yumebanken');
T('ch1:船なし', !C.G.ship);
C.P.map='world'; C.P.x=48; C.P.y=25; C.G.mode='field'; C.G.busy=false;
C.stepField(0,-1);
T('ch1:海に入れない', C.P.y===25 && !C.G.aboard);
T('ch1:ルミアevent不発', C.runTalkEvent('ルミア')===false);
C.freshState(); C.G.chapters={};
C.switchChapter(3);
T('ch3:minamo_dgn2は従来ボス', C.bossInfoAt('minamo_dgn2').key==='shadowsis_a');

// ============ 4. 到達性BFS（第5章文脈） ============
// 町の上陸地点 → 世界 → ダンジョン最奥Bタイルの隣接マスまで
function bfs(startMap, sx, sy, goalMap, gx, gy){
  const seen=new Set(); const q=[[startMap,sx,sy]];
  const key=(m,x,y)=>m+':'+x+','+y;
  seen.add(key(startMap,sx,sy));
  let steps=0;
  while(q.length && steps++<250000){
    const [m,x,y]=q.shift();
    if(m===goalMap && Math.abs(x-gx)+Math.abs(y-gy)===1) return true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx, ny=y+dy;
      const mp=C.MAPS[m]; if(!mp) continue;
      // ワープ
      const w=(mp.warpsXY||{})[nx+','+ny];
      if(w && C.MAPS[w.to]){
        const k2=key(w.to,w.x,w.y);
        if(!seen.has(k2)){ seen.add(k2); q.push([w.to,w.x,w.y]); }
        continue;
      }
      // こぶね（第5章は かいきん）
      if(m==='minamo_port' && nx===15 && ny===2){
        const k2=key('world',50,60);
        if(!seen.has(k2)){ seen.add(k2); q.push(['world',50,60]); }
        continue;
      }
      if(m==='world' && nx===49 && ny===60){
        const k2=key('minamo_port',14,3);
        if(!seen.has(k2)){ seen.add(k2); q.push(['minamo_port',14,3]); }
        continue;
      }
      if(!C.walkable(m,nx,ny)) continue;
      const k2=key(m,nx,ny);
      if(!seen.has(k2)){ seen.add(k2); q.push([m,nx,ny]); }
    }
  }
  return false;
}
C.freshState(); C.G.chapters={}; C.switchChapter(5);
Object.assign(C.G.flags,{ch5_sailed:true,ch5_north:true,ch5_east:true,ch5_south:true,ch5_west:true,
  ch5_shard1:true,ch5_shard2:true,ch5_shard3:true});
T('BFS:ヴェルサ→氷窟最深部', bfs('versa_town',13,18,'versa_dgn2',8,3));
// 海の連結性：トロス係留点から全係留点＋島へ
{
  const rows=C.MAPS.world.tiles, W2=rows[0].length, H2=rows.length;
  const at=(x,y)=>(y>=0&&y<H2&&x>=0&&x<W2)?rows[y][x]:' ';
  const seen=new Set(['48,24']); const q=[[48,24]];
  while(q.length){ const [x,y]=q.shift();
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=nx+','+ny;
      if(at(nx,ny)==='~'&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}
    }}
  for(const [nm,mp] of Object.entries(C.MOORS))
    T('海路連結:'+nm, seen.has(mp.x+','+mp.y));
  T('海路連結:むこうのしま', seen.has('48,60'));
}
// 随行の静的確認
T('リターンで随行', src.includes('moorShipFor(d.map)'));
T('全滅で随行', src.includes('moorShipFor(h.map)'));
T('BFS:ザール→砂の遺跡最深部', bfs('zaal_town',14,18,'zaal_dgn2',8,3));
T('BFS:ミナモ→海食洞最深部', bfs('minamo_port',13,18,'minamo_dgn2',8,3));
T('BFS:エルデ→塔頂上', bfs('elde_town',12,16,'elde_top',8,3));

// ===== 中ボス：かいどうの デスナイト =====
{
  C.freshState(); C.G.chapters={};
  C.switchChapter(5);
  T('道ボス:マップ', !!C.MAPS.old_road);
  T('道ボス:MIDBOSS', !!C.MIDBOSS.dknight);
  T('道ボス:素材', require('fs').readFileSync('assets.js','utf8').includes('dknight:{w:'));
  T('道ボス:クエスト', !!C.QUESTS.ch5_q0_road);
  // 封鎖→おさ→討伐→おさ→洞窟クエストの順序
  const b0=C.bossInfoAt('old_road');
  T('道ボス:未達で封鎖', b0 && b0.needFlag==='ch5_roadQuest' && !C.G.flags.ch5_roadQuest);
  C.P.map='toros';
  T('おさ1回目=街道クエスト', C.runTalkEvent('むらの おさ')===true);
  T('roadQuest', !!C.G.flags.ch5_roadQuest);
  T('cave未解禁', !C.G.flags.ch5_started);
  C.G.flags.ch5_roadClear=true;   // 討伐相当
  T('おさ2回目=洞窟クエスト', C.runTalkEvent('むらの おさ')===true);
  T('started', !!C.G.flags.ch5_started);
  // ワールド⇄みはりだいの往復とボス隣接
  function bfsW(sm,sx,sy,gm,gx,gy){
    const seen=new Set([sm+':'+sx+','+sy]); const q=[[sm,sx,sy]]; let st=0;
    while(q.length && st++<400000){
      const [m,x,y]=q.shift();
      if(m===gm && Math.abs(x-gx)+Math.abs(y-gy)<=1) return true;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy, mp=C.MAPS[m]; if(!mp) continue;
        const w=(mp.warpsXY||{})[nx+','+ny];
        if(w && C.MAPS[w.to]){ const k=w.to+':'+w.x+','+w.y;
          if(!seen.has(k)){ seen.add(k); q.push([w.to,w.x,w.y]); } continue; }
        if(!C.walkable(m,nx,ny)) continue;
        const k=m+':'+nx+','+ny;
        if(!seen.has(k)){ seen.add(k); q.push([m,nx,ny]); }
      }
    }
    return false;
  }
  T('BFS:トロス→デスナイト', bfsW('toros',7,13,'old_road',7,2));
  T('BFS:洞窟出口→トロス(孤島回帰防止)', bfsW('world',47,48,'toros',7,13));
  T('BFS:みはりだい→洞窟', bfsW('old_road',7,9,'cave1',6,10));
  (C.byMap.old_road||[]).forEach(k=>T('道敵実在:'+k, C.ENEMIES.some(e=>e.key===k)));
}

// ===== LQ1モンスター（旧大陸地帯） =====
{
  const eKeys2=new Set(C.ENEMIES.map(e=>e.key));
  ['puyo','goblin','bat','thief','skel'].forEach(k=>T('LQ1敵:'+k, eKeys2.has(k)));
  const az=(C.MAPS.world.encZones||[]).find(z=>z.name==='きゅうたいりくの のはら');
  T('旧大陸地帯あり', !!az);
  T('地帯にトロス周辺(48,30)', az && 48>=az.x0&&48<=az.x1&&30>=az.y0&&30<=az.y1);
  T('地帯に洞窟前(47,49)', az && 47>=az.x0&&47<=az.x1&&49>=az.y0&&49<=az.y1);
  // 他地帯と重ならない
  const others=(C.MAPS.world.encZones||[]).filter(z=>z!==az);
  const ov=others.some(z=>!(az.x1<z.x0||z.x1<az.x0||az.y1<z.y0||z.y1<az.y0));
  T('他地帯と非重複', !ov);
  const assets2=require('fs').readFileSync('assets.js','utf8');
  ['puyo:','goblin:','bat:','thief:','skel:'].forEach(k=>T('LQ1素材:'+k, assets2.includes('  '+k+'{w:')));
}
{
  const seg = require('fs').readFileSync('src/core.js','utf8').match(/const byMapCh = \{[\s\S]*?\};/)[0];
  T('回帰:5:world上書きなし(序盤即死防止)', !seg.includes("'5:world':"));
}
console.log(`\n検査 ${n}項目 / NG ${ng}`);
process.exit(ng?1:0);
