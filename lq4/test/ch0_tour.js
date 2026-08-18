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

// ===== 2.5 依頼の まえは 試験場に 入れない =====
//   ★まえは たのまれごとを とばして 試験に 行けて しまい、
//     点検路も かげの あぎとも 見ずに 話が すすんで いた。
clearLog();
walkTo('lower_dist', 10, 13); C.G.mode='field';
C.stepField(0,1);
T('依頼まえは 試験場に 入れない（あるく）', C.P.map==='lower_dist', C.P.map);
T('門番が ことわる', said('受付は 鐘 ふたつ あとだ'), log.join(' / ').slice(0,50));
C.G.mode='field';
C.doWarp(C.MAPS.lower_dist.warpsXY['10,14']);
T('依頼まえは 試験場に 入れない（ワープ）', C.P.map==='lower_dist', C.P.map);

// ===== 3. 試験前は 木人と たたかえない =====
clearLog();
C.G.flags.ch0_errandPaid = true;          // 依頼を すませた てい（本すじは 4.5 で とおす）
walkTo('lower_dist', 10, 14);
C.doWarp(C.MAPS.lower_dist.warpsXY['10,14']);
T('依頼を すませると 入れる', C.P.map==='trial_yard');
T('試験場へ はいる', C.P.map==='trial_yard');
T('onEnter が たつ', C.G.flags.ch0_enteredYard===true);
clearLog();
walkTo('trial_yard', 3, 5); face('back');      // 上の (3,4) が 木人
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
walkTo('trial_yard', 3, 5);

// ===== 4. グランに はなす =====
clearLog();
walkTo('trial_yard', 3, 3); face('back');       // 上の (3,2) が グラン
C.interact();
T('グランと はなせる', said('試験を 始める'), log.join(' / ').slice(0,60));
T('ch0_started が たつ', C.G.flags.ch0_started===true);
T('クエストが はじまる', C.G.quests.ch0_q1_trial==='active');

// ===== 4.5 炉技師の おつかい（フィールドへ 出る）=====
{
  clearLog();
  // 2.5 で さきに 立てた めじるしを もどして、ほんらいの すじで 通す
  C.G.flags.ch0_errandPaid = false;
  walkTo('lower_dist', 5, 6); face('back');     // 上の (5,5) が 技師
  C.interact();
  T('おつかいを うける', C.G.flags.ch0_errandTaken===true);
  T('ノルマが たつ', C.G.quota && C.G.quota.need===3, JSON.stringify(C.G.quota));
  T('クエストが たつ', C.G.quests.ch0_q0_errand==='active');
  // ★東門 → 世界地図 → 点検路 へ あるいて 入る
  walkTo('lower_dist', 19, 6); C.G.mode='field';
  C.stepField(1,0);
  T('東門から 外へ 出る', C.P.map==='world', C.P.map);
  C.G.mode='field'; C.P.x=13; C.P.y=24; C.P.dir='right';
  C.interact();
  T('点検路へ 入れる', C.P.map==='pipe_path', C.P.map+' '+C.P.x+','+C.P.y);
  T('点検路の めじるしが たつ', C.G.flags.ch0_enteredPipe===true);

  // 点検路で 3たい たおす
  C.G.tactic='gungan';
  for(let i=0;i<3;i++){ C.G.mode='field'; C.startBattle(); C.party.forEach(p=>{p.hp=p.maxhp;p.mp=p.maxmp;}); }
  T('3たいで ノルマ たっせい', C.G.flags.ch0_errandDone===true, JSON.stringify(C.G.quota));

  // 光珠灯 ふたつで おくの 壁が ひらく
  C.G.tactic='manual';
  T('はじめは 点検口が しまっている', C.tileAt('pipe_path',9,5)==='K', C.tileAt('pipe_path',9,5));
  // ★灯りを 点けずに 奥へ 行けては いけない（ぬけ道が あった）
  {
    const walk=(x,y)=>C.walkable('pipe_path',x,y);
    const seen=new Set(['13,13']); const q=[[13,13]];
    while(q.length){const [x,y]=q.shift();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);
        if(!seen.has(k)&&walk(x+dx,y+dy)){seen.add(k);q.push([x+dx,y+dy]);}}}
    T('灯り 前は おくの 間に 入れない', !seen.has('8,7') && !seen.has('7,6'),
      [...seen].filter(k=>k==='8,7'||k==='7,6').join(' '));
  }
  // 扉を しらべると あけ方が わかる
  clearLog();
  C.G.mode='field'; C.P.map='pipe_path'; C.P.x=9; C.P.y=4; C.P.dir='front';
  C.interact();
  T('点検口に あけ方が 書いてある', said('灯り 二基'), log.join(' / ').slice(0,60));
  C.G.mode='field'; C.P.map='pipe_path'; C.P.x=2; C.P.y=6; C.P.dir='right'; C.interact();
  C.G.mode='field'; C.P.x=14; C.P.y=8; C.P.dir='left'; C.interact();
  T('管に 光が 通ると おくが ひらく', C.tileAt('pipe_path',9,5)==='.', C.tileAt('pipe_path',9,5));

  // あぎと 初戦（にげられる。たたかいには ならない）
  clearLog();
  C.G.mode='field'; C.P.x=8; C.P.y=8; C.P.dir='back';
  C.interact();
  T('あぎとに 出会う', C.G.flags.ch0_mawFled===true);
  T('たたかいには ならない', !C.G.battle);
  T('にげた ことが わかる', said('逃げた。追えない'), log.join(' / ').slice(-60));
  T('あぎとは その場から 消える', C.tileAt('pipe_path',8,7)==='.', C.tileAt('pipe_path',8,7));

  // 技師に 報告（父の 話）
  clearLog();
  walkTo('lower_dist', 5, 6); face('back'); C.interact();
  T('技師が 父の 話を する', said('お前の 父さんが、同じ ことを'), log.join(' / ').slice(0,60));
  T('めじるしが たつ', C.G.flags.ch0_mawTold===true);

  // ---- 家に もどって 父の 道具棚を しらべる ----
  clearLog();
  C.doWarp(C.MAPS.lower_dist.warpsXY['3,12']);
  T('家に もどれる', C.P.map==='home_forge', C.P.map);
  C.G.mode='field'; C.P.x=11; C.P.y=7; C.P.dir='back';
  C.interact();
  T('父の 覚え書きを 読める', C.G.flags.ch0_notebookRead===true);
  T('十年前で 止まって いる', said('気の せいだと 思いたい'), log.join(' / ').slice(0,70));
  T('記録に 残らない 話', said('下の 者の 話は 記録に 残らない'));

  clearLog();
  const h1=C.P.herbs;
  C.G.mode='field'; C.P.x=3; C.P.y=7; C.P.dir='back';
  C.interact();
  T('おばさんが 父の ことを 話す', C.G.flags.ch0_auntTold===true);
  T('薬草を もらえる', C.P.herbs===h1+3, C.P.herbs+' ← '+h1);
  T('帰らなかった 夜の 話', said('一度も 帰って こなかった 夜'));
  C.doWarp(C.MAPS.home_forge.warpsXY['7,10']);
  clearLog();
  C.G.tactic='manual';
  const g0=C.P.gold;
  walkTo('lower_dist', 5, 6); face('back');
  C.interact();
  T('手間賃を もらえる', C.P.gold===g0+120, C.P.gold+' ← '+g0);
  T('伏線の せりふが でる', said('湧く もとを'), log.join(' / ').slice(-60));
  T('クエストが 片づく', C.G.quests.ch0_q0_errand==='clear');
}

// ===== 5. 見習い試験（木人 → セレンとの 模擬戦）=====
clearLog();
walkTo('trial_yard', 3, 5); face('back');
C.G.tactic='gungan';
C.interact();
T('木人に かてる', C.G.flags.ch0_trialDone===true);
T('前半の むすびが でる', said('東の 立ち合いへ'), log.join(' / ').slice(0,80));
T('この 時点では まだ 首席発表は ない', !said('首席'));

clearLog();
walkTo('trial_yard', 9, 5); face('back');
C.interact();
T('セレンと 模擬戦に なる', C.G.flags.ch0_sparDone===true);
T('模擬戦の むすびが でる', said('実技一位、イオ'), log.join(' / ').slice(0,90));
T('家格の 話が 出る', said('家格も 見る'));
T('クエストが すすむ', C.G.quests.ch0_q1_trial==='clear' && C.G.quests.ch0_q2_umbra==='active');
C.G.tactic='manual';
const lvAfterTrial = C.party[0].lv;

// ===== 6. セレンが なかまに なる =====
clearLog();
walkTo('trial_yard', 9, 5); face('back');       // 上の (9,4) に セレン本人が 立つ
T('立ち合いの あと 本人が その ますに 立つ',
  C.tileAt('trial_yard',9,4)==='n', C.tileAt('trial_yard',9,4));
C.interact();
T('セレンが くわわる', C.party.length===2 && C.party[1].cls==='seren');
T('セレンは せんとうと おなじLv', C.party[1].lv===lvAfterTrial, C.party[1].lv+'/'+lvAfterTrial);
T('セレンは 槍を もつ', C.party[1].weapon && C.party[1].weapon.name.indexOf('槍')>=0);
T('地図の セレンが 消える（2人に ならない）',
  C.tileAt('trial_yard',9,4)==='.', C.tileAt('trial_yard',9,4));

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
  T('まだ 入れない ちてんは 物語で 断られる', said('許可証'), log.join(' / ').slice(0,50));
  T('中の 人の ことばが 画面に 出ない', !said('作られます') && !said('未実装'));
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
T('中ボスの ますが 地図に ある', C.tileAt('rift_yard',16,9)==='B', C.tileAt('rift_yard',16,9));
// 中ボスを たおすと 道が あき、奥の 宝箱に とどく
{
  const tac=C.G.tactic; C.G.tactic='gungan';
  C.G.mode='field'; C.P.map='rift_yard'; C.P.x=15; C.P.y=9; C.P.dir='right';
  C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; });
  C.interact();
  T('中ボスに かてる', C.G.flags.ch0_mawDown===true);
  T('倒すと 道が あく', C.tileAt('rift_yard',16,9)==='.', C.tileAt('rift_yard',16,9));
  C.G.tactic=tac;
  // もとの ばしょ（うめた 穴の うえ）へ もどす
  C.G.mode='field'; C.P.map='rift_yard'; C.P.x=5; C.P.y=11;
}
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
  T('子ども：走っていって 消える', C.tileAt('rift_yard',2,13)==='.', C.tileAt('rift_yard',2,13));
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
  // ★覚え書きを 読んで いれば、グランに 父の ことを 聞ける
  if(C.G.flags.ch0_notebookRead){
    clearLog();
    C.G.mode='field'; C.P.map='rift_yard'; C.P.x=12; C.P.y=4; C.P.dir='back';
    C.interact();
    T('グランに 父の ことを 聞ける', C.G.flags.ch0_askedFather===true);
    T('グランが 覚えて いる', said('だが おれは 覚えている'), log.join(' / ').slice(0,70));
    T('報告を 通すと 約束する', said('おれが 必ず 上へ 通す'));
  }
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
