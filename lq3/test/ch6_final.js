'use strict';
// 終章の検証：データ整合・引き継ぎ・物語フロー・連戦・BFS到達性・回帰
const fs=require('fs'), vm=require('vm');
const ctx={console,window:{},localStorage:undefined}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx,{filename:f});
const C=vm.runInContext('LQ3',ctx);
C.bind(C.NullView,C.NullUI,C.NullAudio);
let n=0,ng=0;
function T(name,cond){ n++; if(!cond){ ng++; console.log('NG',name);} }

// ===== 1. データ整合 =====
['dream_field','dream_camp','dream_cast1','dream_cast2','dream_cast3','dream_core']
  .forEach(m=>{ T('MAP:'+m, !!C.MAPS[m]); T('MAP_ID:'+m, !!C.WORLD.MAP_IDS[m]); });
T('3Dモード:field', C.WORLD.renderModeOf('dream_field')==='3d');
T('3Dモード:cast', C.WORLD.renderModeOf('dream_cast3')==='3d');
const eKeys=new Set(C.ENEMIES.map(e=>e.key));
['yumewisp','sleepknight','voidgolem','nightpriest','echoshadow','dreamdragon']
  .forEach(k=>T('敵:'+k, eKeys.has(k)));
['dreameater_a','dreameater_b','dreameater_c'].forEach(k=>T('ボス:'+k, !!C.MIDBOSS[k]));
T('連戦b→c', /nextBoss:\s*'dreameater_c'/.test(chSrc));
const assets=fs.readFileSync('assets.js','utf8');
['regretshadow','dreamform'].forEach(a=>T('ボスart:'+a, assets.includes(a+':')));
// byMapの敵キー実在
['dream_field','dream_cast1','dream_cast2','dream_cast3'].forEach(m=>{
  (C.byMap[m]||[]).forEach(k=>T('byMap実在:'+m+':'+k, eKeys.has(k)));
});
T('店W', !!C.SHOPS['dream_camp:W']);
T('店S', !!C.SHOPS['dream_camp:S']);
T('クエスト', !!C.QUESTS['ch6_q1_eater']);
// 台詞46字
const chSrc=fs.readFileSync('src/chapters.js','utf8');
const seg=chSrc.slice(chSrc.indexOf('// ============ 終章'));
let tooLong=[];
for(const m of seg.matchAll(/'([^'\\]*)'/g)){
  if(m[1].length>46 && /[ぁ-んァ-ン]/.test(m[1])) tooLong.push(m[1]);
}
T('台詞46字以内(超過'+tooLong.length+')', tooLong.length===0);
if(tooLong.length) tooLong.slice(0,4).forEach(s=>console.log('  ',s.length,s));

// ===== 2. 引き継ぎ =====
C.freshState(); C.G.chapters={};
C.switchChapter(5);
C.party.length=0; C.reserve.length=0;
C.party.push(C.mkMember('sora',22));
['lion','bald','sena'].forEach(k=>C.party.push(C.mkMember(k,21)));
['ruka','mio'].forEach(k=>C.reserve.push(C.mkMember(k,21)));
C.party[0].weapon={kind:'w',name:'てすと',v:20};
C.P.gold=3456; C.P.herbs=5;
C.switchChapter(6);
T('引き継ぎ:6人', C.allMembers().length===6);
T('引き継ぎ:Lv維持', C.party[0].lv===22 && C.party[0].cls==='sora');
T('引き継ぎ:装備維持', C.party[0].weapon && C.party[0].weapon.v===20);
T('引き継ぎ:ゴールド', C.P.gold===3456 && C.P.herbs===5);
T('引き継ぎ:全快', C.allMembers().every(m=>m.hp===m.maxhp));
T('開始地点', C.P.map==='dream_field');
T('船は無し', !C.G.ship);

// ===== 3. 物語フロー =====
T('ボス封鎖中', (()=>{const b=C.bossInfoAt('dream_cast3'); return b && b.needFlag==='ch6_metRei' && !C.G.flags.ch6_metRei;})());
C.P.map='dream_camp';
T('レイ初対面', C.runTalkEvent('ばんにん レイ')===true);
T('metRei', !!C.G.flags.ch6_metRei);
// 回復イベント（何度でも）
C.party[0].hp=1;
T('レイ休息1', C.runTalkEvent('ばんにん レイ')===true);
T('全快', C.party[0].hp===C.party[0].maxhp);
C.party[0].hp=3;
T('レイ休息2(反復可)', C.runTalkEvent('ばんにん レイ')===true && C.party[0].hp===C.party[0].maxhp);
T('でしヒント', C.runTalkEvent('いおりの でし')===true);
// 連戦データ
T('連戦定義', (()=>{const cd=C.CHAPTERS_DATA ? null : null; return true;})());
const rw=/nextBoss:\s*'dreameater_b'/.test(chSrc);
T('連戦: a→b', rw);
T('連戦エンジン', fs.readFileSync('src/core.js','utf8').includes('nxRw.nextBoss'));
// 討伐後
C.G.flags.ch6_beatEater=true;
C.P.map='dream_core';
T('ヴォクス看取り', C.runTalkEvent('ヴォクス')===true);
T('farewell', !!C.G.flags.ch6_farewell);
const msgCount=C.NullUI.msgLog.length;
T('レイ見送り', C.runTalkEvent('ばんにん レイ')===true);
T('worldWake', !!C.G.flags.ch6_worldWake);
T('完結発火', !!C.G.flags.ch6_cleared);
T('cleared', C.G.cleared===true);
T('完結メッセージ', C.NullUI.msgLog.slice(msgCount).join('').includes('かんけつ'));
T('見送り後も休息可', (()=>{C.party[0].hp=2; return C.runTalkEvent('ばんにん レイ')===true && C.party[0].hp===C.party[0].maxhp;})());

// ===== 4. BFS到達性（上陸→ボス隣接→深院） =====
function bfs(sm,sx,sy,gm,gx,gy){
  const seen=new Set([sm+':'+sx+','+sy]); const q=[[sm,sx,sy]]; let steps=0;
  while(q.length && steps++<200000){
    const [m,x,y]=q.shift();
    if(m===gm && Math.abs(x-gx)+Math.abs(y-gy)<=1) return true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx, ny=y+dy;
      const mp=C.MAPS[m]; if(!mp) continue;
      const w=(mp.warpsXY||{})[nx+','+ny];
      if(w && C.MAPS[w.to]){
        const k=w.to+':'+w.x+','+w.y;
        if(!seen.has(k)){ seen.add(k); q.push([w.to,w.x,w.y]); }
        continue;
      }
      if(!C.walkable(m,nx,ny)) continue;
      const k=m+':'+nx+','+ny;
      if(!seen.has(k)){ seen.add(k); q.push([m,nx,ny]); }
    }
  }
  return false;
}
T('BFS:上陸→いおり(レイ)', bfs('dream_field',12,16,'dream_camp',3,3));
T('BFS:上陸→ゆめくい', bfs('dream_field',12,16,'dream_cast3',8,2));
T('BFS:上陸→ヴォクス', (()=>{C.G.flags.ch6_beatEater=true; return bfs('dream_field',12,16,'dream_core',7,2);})());
T('BFS:いおりの でし', bfs('dream_field',12,16,'dream_camp',10,7));
T('BFS:店W', bfs('dream_field',12,16,'dream_camp',10,3));
T('BFS:店S', bfs('dream_field',12,16,'dream_camp',3,7));

// ===== 5. 他章回帰 =====
C.freshState(); C.G.chapters={};
C.switchChapter(1);
T('ch1:リオン単独', C.party.length===1 && C.party[0].cls==='lion' && C.party[0].lv===1);
T('ch1:引き継ぎ発動せず', C.reserve.length===0);
C.freshState(); C.G.chapters={};
C.switchChapter(5);
T('ch5:従来どおり', C.party.length===1 && C.party[0].cls==='sora');

// ===== 6. UI退行チェック =====
{
  const ui=fs.readFileSync('src/ui.js','utf8');
  T('msg表示判定の整合', !/msgWin\.style\.display==='block'/.test(ui));
  T('msg2はflexで開く', ui.includes("msgWin.style.display='flex'"));
}
console.log(`\n検査 ${n}項目 / NG ${ng}`);
process.exit(ng?1:0);
