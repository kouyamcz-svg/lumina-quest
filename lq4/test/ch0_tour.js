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
T('はじまりは イオの家', C.P.map==='home_forge' && C.P.x===7 && C.P.y===8, C.P.x+','+C.P.y);
T('パーティは イオ ひとり', C.party.length===1 && C.party[0].cls==='io');
T('父の 剣を もつ', C.party[0].weapon && C.party[0].weapon.v===4);
T('章データが ひける', !!C.chData() && C.chData().id==='ch0_trial');

// ===== 2. 家 → 下層区 =====
C.doWarp(C.MAPS.home_forge.warpsXY['7,10']);
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

// ===== 7.2 天空大陸（フィールド）へ 出られる =====
{
  walkTo('lower_dist', 19, 6); C.G.mode='field';
  C.stepField(1,0);                                  // 東の門
  T('フィールドへ 出られる', C.P.map==='world', C.P.map+' '+C.P.x+','+C.P.y);
  T('雲海には 落ちない', C.walkable('world', C.P.x, C.P.y));
  // 下層区へ もどる（V を しらべる）
  C.G.mode='field'; C.P.x=13; C.P.y=24; C.P.dir='left';
  C.interact();
  T('ちてんから 町へ 入れる', C.P.map==='lower_dist', C.P.map+' '+C.P.x+','+C.P.y);
  // まだ 作って いない ちてん
  clearLog();
  C.P.map='world'; C.P.x=23; C.P.y=16; C.P.dir='left'; C.G.mode='field';
  C.interact();
  T('未完成の ちてんは 断られる', said('これから 作られます'), log.join(' / ').slice(0,50));
  walkTo('lower_dist', 10, 13);
}

// ===== 7.5 しかけを といて ボスの間まで あるく（UIを とおる みち）=====
function goField(){ C.G.mode='field'; }
function walkG(steps){ for(const [dx,dy] of steps){ goField(); C.stepField(dx,dy); } }
function faceDo(dir){ goField(); C.P.dir=dir; C.interact(); }
C.P.map='rift_yard'; C.P.x=10; C.P.y=13; goField();
walkG([[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]]);      // (5,13)へ
walkG([[0,-1],[0,-1]]);                            // 岩を 2かい おして 穴を うめる
T('しかけ：穴が うまる', C.tileAt('rift_yard',5,10)==='.', C.tileAt('rift_yard',5,10));
walkG([[0,-1],[0,-1],[0,-1]]);                     // 穴を こえて 中段へ
T('しかけ：穴を こえられる', C.P.y<=10, 'y='+C.P.y);
// (3,9)→(3,8)→(3,7) 上段へ
while(C.P.x>3){ goField(); C.stepField(-1,0); }
while(C.P.y>7){ goField(); C.stepField(0,-1); }
T('上段へ 出られる', C.P.y===7 && C.P.map==='rift_yard', C.P.x+','+C.P.y);
// 光珠灯 ふたつ
while(C.P.x<5){ goField(); C.stepField(1,0); }
faceDo('back');
while(C.P.x<12){ goField(); C.stepField(1,0); }
faceDo('back');
T('しかけ：扉が ひらく', C.tileAt('rift_yard',16,5)==='.', C.tileAt('rift_yard',16,5));
// 扉を くぐって ボスの間へ
while(C.P.x<16){ goField(); C.stepField(1,0); }
walkG([[0,-1],[0,-1],[0,-1]]);
T('ボスの間へ たどりつける', C.P.y<=4, C.P.x+','+C.P.y);
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

// ===== 9.5 ウンブラ撃破後 =====
{
  C.freshState();
  C.G.tactic='gungan';
  ['ch0_started','ch0_trialDone','ch0_serenJoined'].forEach(f=>C.G.flags[f]=true);
  // ★Lvは mkMember で つくる。lv を あとから ぬりかえても のうりょくちは 上がらない
  C.party.length = 0;
  C.party.push(C.mkMember('io', 6));
  C.party.push(C.mkMember('seren', 6));
  C.P.map='rift_yard'; C.P.x=10; C.P.y=4; C.G.mode='field';
  clearLog();
  C.startBattle('umbra');
  T('撃破：紙片の えがきが でる', said('夢の 切れはし'), log.join(' / ').slice(0,60));
  T('撃破：グランが あらわれる', C.tileAt('rift_yard',12,3)==='n', C.tileAt('rift_yard',12,3));
  T('撃破：報告クエストが たつ', C.G.quests.ch0_q3_report==='active');

  // 子どもに 話す（ごほうび）
  clearLog();
  const g0=C.P.gold, h0=C.P.herbs;
  C.G.mode='field'; C.P.map='rift_yard'; C.P.x=3; C.P.y=13; C.P.dir='left';
  C.interact();
  T('子ども：礼を もらえる', C.P.gold===g0+30 && C.P.herbs===h0+2,
    C.P.gold+'/'+C.P.herbs+' ← '+g0+'/'+h0);
  T('子ども：めじるしが たつ', C.G.flags.ch0_childSaved===true);
  T('子ども：2かいめは くりかえさない', (()=>{
    const g1=C.P.gold; C.G.mode='field'; C.P.dir='left'; C.interact(); return C.P.gold===g1;
  })());

  // 下層区の せりふが 変わる
  clearLog();
  C.G.mode='field'; C.P.map='lower_dist'; C.P.x=8; C.P.y=11; C.P.dir='front';
  C.interact();
  T('町の せりふが 撃破後に 変わる', said('団長さま'), log.join(' / ').slice(0,60));

  // グランに 報告 → 章末
  clearLog();
  C.party.forEach(p=>{ p.hp=1; p.mp=0; });
  C.G.mode='field'; C.P.map='rift_yard'; C.P.x=12; C.P.y=4; C.P.dir='back';
  C.interact();
  T('グラン：入団の やりとり', said('震えたまま 立てたなら'), log.join(' / ').slice(0,60));
  T('グラン：手当てで 全快', C.party.every(p=>p.hp===p.maxhp && p.mp===p.maxmp));
  T('グラン：報告クエストが 片づく', C.G.quests.ch0_q3_report==='clear');
  T('章末が つづけて でる', said('正騎士に 任ずる'), log.join(' / ').slice(-80));
  T('章末：セレンの しめ', said('次は わたしも 下りる'));
  T('章末：ノエの 伏線', said('どこかに 戻ったって'));
  T('ch0_cleared が たつ', C.G.flags.ch0_cleared===true);
}

// ===== 10. 章末と セーブ/ロード =====
clearLog();
C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; p.status=null; });
C.G.flags.ch0_umbraDown = true;
C.triggerChapterEnd();
T('章末が でる', said('正騎士に 任ずる'), log.join(' / ').slice(0,80));
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
