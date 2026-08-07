'use strict';
// ルミナクエストIV / 序章 通しテスト（M0 垂直スライス）
// 使い方： node test/ch0_tour.js
//   家 → 下層区 → 試験場 → グラン → 木人 → セレン加入 → 広場 → ウンブラ → 章末 → セーブ/ロード
const fs = require('fs'), vm = require('vm');

// localStorage の かわり（セーブの けんしょうよう）
const store = {};
const fakeLS = {
  getItem:k=> (k in store ? store[k] : null),
  setItem:(k,v)=>{ store[k]=String(v); },
  removeItem:k=>{ delete store[k]; },
};
const ctx = {console, window:{}, localStorage:fakeLS}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);

// メッセージを ためる UI（NullUI と おなじく すぐ すすむ）
const log = [];
const UI = {
  msg(lines, done){ lines.forEach(l=>log.push(l)); done && done(); },
  menu(items, title, onPick){ onPick(0); },
  hud(){}, label(){}, openTrade(){},
};
C.bind(C.NullView, UI, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(word){ return log.some(l=>l.indexOf(word)>=0); }
function clearLog(){ log.length = 0; }
// むいた ほうこうの ますを しらべる（interact は むきの ますを みる）
function face(dir){ C.P.dir = dir; }
function walkTo(map,x,y){ C.P.map=map; C.P.x=x; C.P.y=y; C.G.mode='field'; }

C.freshState();
C.G.tactic = 'gungan';        // せんとうは じどうで さいごまで はしらせる

// ===== 1. はじまり =====
T('はじまりは イオの家', C.P.map==='home_forge' && C.P.x===4 && C.P.y===5);
T('パーティは イオ ひとり', C.party.length===1 && C.party[0].cls==='io');
T('父の 剣を もつ', C.party[0].weapon && C.party[0].weapon.v===4);
T('章データが ひける', !!C.chData() && C.chData().id==='ch0_trial');

// ===== 2. 家 → 下層区 =====
C.doWarp(C.MAPS.home_forge.warpsXY['4,6']);
T('下層区へ でる', C.P.map==='lower_dist' && C.P.x===3 && C.P.y===11);
T('壁に うまって いない', C.walkable('lower_dist', C.P.x, C.P.y));

// ===== 3. 試験前は 木人と たたかえない =====
clearLog();
walkTo('lower_dist', 10, 14);
C.doWarp(C.MAPS.lower_dist.warpsXY['10,14']);
T('試験場へ はいる', C.P.map==='trial_yard');
T('onEnter が たつ', C.G.flags.ch0_enteredYard===true);
clearLog();
walkTo('trial_yard', 6, 5); face('back');      // 上の (6,4) が B
C.interact();
T('試験前は 木人と たたかえない', said('騎士団長に 話を'), log.join(' / ').slice(0,60));
T('たたかいに なって いない', !C.G.battle);

// ===== 3.5 試験前は 北の門で とめられる（あるいて たしかめる）=====
clearLog();
walkTo('trial_yard', 6, 7); C.stepField(0,1);       // 下層区（10,13）へ
C.G.mode='field';
for(let i=0;i<14;i++) C.stepField(0,-1);
T('試験前は 広場へ いけない', C.P.map==='lower_dist', C.P.map);
T('とめられた わけが でる', said('人どおり'), log.join(' / ').slice(0,60));
walkTo('trial_yard', 6, 5);

// ===== 4. グランに はなす =====
clearLog();
walkTo('trial_yard', 3, 3); face('back');       // 上の (3,2) が グラン
C.interact();
T('グランと はなせる', said('試験を 始める'), log.join(' / ').slice(0,60));
T('ch0_started が たつ', C.G.flags.ch0_started===true);
T('クエストが はじまる', C.G.quests.ch0_q1_trial==='active');

// ===== 5. 見習い試験（木人） =====
clearLog();
walkTo('trial_yard', 6, 5); face('back');
C.interact();
T('木人に かてる', C.G.flags.ch0_trialDone===true);
T('試験の むすびが でる', said('実技、一位'), log.join(' / ').slice(0,80));
T('クエストが すすむ', C.G.quests.ch0_q1_trial==='clear' && C.G.quests.ch0_q2_umbra==='active');
const lvAfterTrial = C.party[0].lv;

// ===== 6. セレンが なかまに なる =====
clearLog();
walkTo('trial_yard', 9, 3); face('back');       // 上の (9,2) が セレン
C.interact();
T('セレンが くわわる', C.party.length===2 && C.party[1].cls==='seren');
T('セレンは せんとうと おなじLv', C.party[1].lv===lvAfterTrial, C.party[1].lv+'/'+lvAfterTrial);
T('セレンは 槍を もつ', C.party[1].weapon && C.party[1].weapon.name.indexOf('槍')>=0);

// ===== 7. 広場（夜）へ =====
//   ★ここは API（doWarp）では なく、じっさいに あるいて ためす。
//     LQ3で「文書には あるのに UIを とおる みちが なかった」ふぐあいが あった。
function walkPath(steps){ for(const [dx,dy] of steps) C.stepField(dx,dy); }

walkTo('trial_yard', 6, 7);
walkPath([[0,1]]);                                  // 南の でぐちを ふむ
T('あるいて 下層区へ もどれる', C.P.map==='lower_dist', C.P.map+' '+C.P.x+','+C.P.y);

// 試験場から もどった ばしょ（10,13）から 北の門（10,0）まで 大通りを あるく
C.G.mode='field';
walkPath(new Array(14).fill([0,-1]));
T('道づたいに 北の門へ たどりつける（とちゅうで つっかえない）',
  C.P.map==='rift_yard', C.P.map+' '+C.P.x+','+C.P.y);
T('広場へ はいれる', C.P.map==='rift_yard');
T('裂け目の めじるしが たつ', C.G.flags.ch0_riftOpen===true);
T('まちの ようすが かわる', C.G.townState==='NIGHT_RIFT');

// ===== 8. ざこ戦で そだつ（ウンブラの まえに Lv4〜5へ）=====
{
  let battles = 0;
  while(C.party[0].lv < 5 && battles < 200){
    C.G.mode='field'; C.startBattle(); battles++;
    if(C.aliveMembers().length===0){ C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; }); }
    C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; });   // 宿に とまった てい
  }
  T('ざこ戦で Lv5に とどく（'+battles+'せん）', C.party[0].lv>=5 && battles<200);
}

// ===== 9. ウンブラ戦（Lv5・2人）=====
{
  let win = 0;
  const snapshot = C.party.map(p=>({lv:p.lv, hp:p.maxhp, mp:p.maxmp}));
  for(let i=0;i<100;i++){
    C.party.forEach((p,k)=>{ p.hp=snapshot[k].hp; p.mp=snapshot[k].mp; p.status=null; p.buffs=null; });
    C.G.mode='field'; C.G.battle=null;
    C.startBattle('umbra');
    if(C.aliveMembers().length>0) win++;
  }
  // §5：到達Lvで だいたい 90%。M0は チュートリアルなので ひろめに とる
  T('ウンブラ 勝率（'+win+'%）', win>=70 && win<=100);
}

// ===== 10. 章末と セーブ/ロード =====
clearLog();
C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; p.status=null; });
C.G.flags.ch0_umbraDown = true;
C.triggerChapterEnd();
T('章末が でる', said('天空騎士団 所属だ'), log.join(' / ').slice(0,80));
T('ch0_cleared が たつ', C.G.flags.ch0_cleared===true);

const goldBefore = C.P.gold, lvBefore = C.party[0].lv;
T('セーブできる', C.saveGame(0)===true, C.lastSaveError);
C.freshState();
T('セーブは lq3と ぶつからない', Object.keys(store).every(k=>k.indexOf('LQ4_')===0), Object.keys(store).join(','));
T('ロードできる', C.loadGame(0)===true);
T('ロード：なかまが もどる', C.party.length===2 && C.party[1].cls==='seren');
T('ロード：Lvが もどる', C.party[0].lv===lvBefore);
T('ロード：おかねが もどる', C.P.gold===goldBefore);
T('ロード：めじるしが もどる', C.G.flags.ch0_umbraDown===true);

console.log('\n--- ch0_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
