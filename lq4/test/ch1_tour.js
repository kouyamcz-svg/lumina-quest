'use strict';
// ルミナクエストIV / 第1章 通しテスト
// 使い方： node test/ch1_tour.js
//   中層区で 任務 → 下層区の 技師 → 旧管路（岩・灯り）→ オボロ → 章末
const fs = require('fs'), vm = require('vm');
const store = {};
const fakeLS = {getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);},
                removeItem:k=>{delete store[k];}};
const ctx = {console, window:{}, localStorage:fakeLS}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);

const log=[];
C.bind(C.NullView, {msg(l,d){ l.forEach(x=>log.push(x)); d&&d(); }, menu(i,t,cb){cb(0);},
                    hud(){}, label(){}, openTrade(){}}, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>l.indexOf(w)>=0); }
function clearLog(){ log.length=0; }
function stand(map,x,y,dir){ C.G.mode='field'; C.P.map=map; C.P.x=x; C.P.y=y; if(dir) C.P.dir=dir; }
function talk(map,x,y,dir){ clearLog(); stand(map,x,y,dir); C.interact(); }

// ===== 0. 章えらびで 直接 はじめた ばあい（ひきつぐ ものが ない）=====
{
  C.freshState();
  C.G.chapters = {};                 // 序章の きろくが ない てい
  C.switchChapter(2);
  T('直接：二人 いる', C.party.length===2 && C.party[1].cls==='seren',
    C.party.map(p=>p.cls).join(','));
  T('直接：Lv8', C.party[0].lv===8, ''+C.party[0].lv);
  T('直接：ふたりとも 武器を もつ',
    !!(C.party[0].weapon && C.party[1].weapon),
    JSON.stringify([C.party[0].weapon, C.party[1].weapon]));
  T('直接：セレンも 防具を もつ', !!C.party[1].armor);
}

// ===== 1. 序章から つづけて 第1章へ =====
C.freshState();
// 序章を おえた てい（二人・Lv8・そこそこの 装備）
C.party.length = 0;
C.party.push(C.mkMember('io', 8));
C.party.push(C.mkMember('seren', 8));
C.party[0].weapon={kind:'w',name:'天空鋼の 短剣',v:9};
C.party[0].armor ={kind:'a',name:'騎士団の 胴',v:8};
C.party[1].weapon={kind:'w',name:'白木の 長槍',v:11};
C.party[1].armor ={kind:'a',name:'銀の 胸当て',v:9};
C.P.gold = 300; C.P.herbs = 5;
C.G.flags.ch0_cleared = true;
C.switchChapter(2);
T('第1章に なる', C.G.chapter===2);
T('はじまりは 下層区', C.P.map==='lower_dist', C.P.map+' '+C.P.x+','+C.P.y);
T('二人 いる', C.party.length===2 && C.party[0].cls==='io' && C.party[1].cls==='seren',
  C.party.map(p=>p.cls).join(','));
T('Lv8 で はじまる', C.party[0].lv===8, ''+C.party[0].lv);
T('そだてた 装備を ひきつぐ', C.party[0].weapon.v===9 && C.party[1].weapon.v===11,
  JSON.stringify([C.party[0].weapon.v, C.party[1].weapon.v]));
T('おかねも ひきつぐ', C.P.gold===300, ''+C.P.gold);
T('章データが ひける', C.chData() && C.chData().id==='ch1_lower');
// ★序章の 人・ボスが 地図に のこって いない こと
//   （上層に 呼ばれて いる はずの 団長が 試験場に 立って いた）
T('団長は 試験場に いない',  C.tileAt('trial_yard',3,2)==='.', C.tileAt('trial_yard',3,2));
T('木人は かたづいて いる',  C.tileAt('trial_yard',3,4)==='.', C.tileAt('trial_yard',3,4));
T('立ち合いの セレンも いない', C.tileAt('trial_yard',9,4)==='.', C.tileAt('trial_yard',9,4));
T('広場の 団長も いない',    C.tileAt('rift_yard',12,3)==='.', C.tileAt('rift_yard',12,3));
T('ウンブラは いない',       C.tileAt('rift_yard',10,3)==='.', C.tileAt('rift_yard',10,3));
T('序章の あぎとも いない',  C.tileAt('pipe_path',8,7)==='.', C.tileAt('pipe_path',8,7));
// 試験官は のこるが、第1章の せりふを 言う
{
  clearLog();
  stand('trial_yard', 3, 7, 'back'); C.interact();
  T('試験官が 第1章の 話を する', said('もう 四日'), log.join(' / ').slice(0,60));
}

// ===== 2. 中層区へ（世界地図ごし）=====
stand('lower_dist', 19, 6, 'right');
C.stepField(1,0);
T('東門から 外へ 出る', C.P.map==='world', C.P.map);
stand('world', 21, 16, 'right');
C.interact();
T('中層区へ 入れる', C.P.map==='mid_dist', C.P.map+' '+C.P.x+','+C.P.y);
T('中層区の めじるしが たつ', C.G.flags.ch1_enteredMid===true);

// ===== 3. 上層へは まだ 行けない =====
talk('mid_dist', 10, 1, 'back');
T('上層の 石段で 断られる', said('許可証は 中層までだ'), log.join(' / ').slice(0,60));
T('中層区から 出て いない', C.P.map==='mid_dist');

// ===== 4. 任務を うける =====
talk('mid_dist', 5, 6, 'back');
T('任務を うける', C.G.flags.ch1_taskTaken===true);
T('期限が 示される', said('三日'), log.join(' / ').slice(0,80));
T('クエストが たつ', C.G.quests.ch1_q1_survey==='active');

// ===== 5. 上層の 使い（差別の 噂）=====
talk('mid_dist', 14, 6, 'back');
T('噂を 聞く', C.G.flags.ch1_heardSlur===true);
T('セレンが 立場を 言う', said('怒って いい 立場'), log.join(' / ').slice(-60));

// ===== 5.5 詰所：団長の 不在と 上からの 圧 =====
stand('mid_dist', 13, 9, 'right');
C.stepField(1,0);
T('詰所へ 入れる', C.P.map==='mid_post', C.P.map+' '+C.P.x+','+C.P.y);
talk('mid_post', 6, 4, 'back');
T('副長の 話を 聞く', C.G.flags.ch1_postHeard===true);
T('団長が 上層に 呼ばれて いる', said('上層へ 呼ばれた'), log.join(' / ').slice(0,60));
T('結論が 先に ある', said('結論が 先に あって'));

// ===== 5.7 記録庫：十年前の 封鎖申請 =====
stand('mid_post', 6, 8, 'front'); C.stepField(0,1);
T('中層区へ もどる', C.P.map==='mid_dist', C.P.map);
stand('mid_dist', 13, 11, 'right');
C.stepField(1,0);
T('記録庫へ 入れる', C.P.map==='mid_arch', C.P.map+' '+C.P.x+','+C.P.y);
talk('mid_arch', 2, 3, 'back');
T('十年前の 申請を 見つける', C.G.flags.ch1_foundPaper===true);
T('封鎖の 理由が 書いてある', said('予算 未計上'), log.join(' / ').slice(0,90));
T('グランの 名が ある', said('立会　グラン'));
talk('mid_arch', 6, 6, 'back');
T('記録係が 綴りの 薄さを 言う', said('やけに 薄い'), log.join(' / ').slice(-60));
stand('mid_arch', 6, 8, 'front'); C.stepField(0,1);

// ===== 6. 下層区の 技師：旧管路の 入口が ひらく =====
T('はじめは 昇降口が ない', C.tileAt('lower_dist',1,13)!=='D', C.tileAt('lower_dist',1,13));
talk('lower_dist', 5, 6, 'back');
T('技師が 三の 管を 教える', said('三の 管'), log.join(' / ').slice(0,80));
T('十年 前に 塞いだ 話', said('直す 金が 下りなかった'));
T('昇降口が ひらく', C.tileAt('lower_dist',1,13)==='D', C.tileAt('lower_dist',1,13));
T('クエストが すすむ', C.G.quests.ch1_q1_survey==='clear' && C.G.quests.ch1_q2_pipe==='active');

// ===== 6.5 下層区：行方不明の 見習い =====
talk('lower_dist', 12, 12, 'front');
T('見習い探しを たのまれる', C.G.flags.ch1_sonAsked===true);
T('西の 昇降口と 言われる', said('西の 昇降口'), log.join(' / ').slice(0,70));
T('クエストが たつ', C.G.quests.ch1_q4_son==='active');

// ===== 6.7 点検路の 群れ：かんむれ（旧管路の 前）=====
talk('lower_dist', 5, 6, 'back');
T('点検路の 詰まりを 告げられる', C.G.flags.ch1_swarmTold===true);
T('半年前の あぎとに つながる', said('口だけの、あれ'), log.join(' / ').slice(0,120));
T('クエストが たつ', C.G.quests.ch1_q5_swarm==='active');
T('点検路に 群れが 置かれる', C.tileAt('pipe_path',8,7)==='B', C.tileAt('pipe_path',8,7));
// ★第1章でも 点検路の しかけが 効く（序章の 章データは 見に いかない）
T('点検口は しまって いる', C.tileAt('pipe_path',9,5)==='K', C.tileAt('pipe_path',9,5));
T('灯りは 消えて いる', C.tileAt('pipe_path',3,6)==='L' && C.tileAt('pipe_path',13,8)==='L');
clearLog();
stand('pipe_path', 9, 6, 'back'); C.interact();
T('点検口に 説明が 出る', said('灯り 二基'), log.join(' / ').slice(0,60));
stand('pipe_path', 2, 6, 'right'); C.interact();
T('灯り ひとつでは 開かない', C.tileAt('pipe_path',9,5)==='K');
stand('pipe_path', 14, 8, 'left'); C.interact();
T('灯り ふたつで 開く', C.tileAt('pipe_path',9,5)==='.', C.tileAt('pipe_path',9,5));

// ★群れを 散らす まえは 旧管路に 下りられない
stand('lower_dist', 2, 13, 'left');
C.stepField(-1,0);
T('先に 旧管路へは 行けない', C.P.map==='lower_dist', C.P.map);
T('技師が 止める', said('まず 点検路だ'), log.join(' / ').slice(0,60));

clearLog();
C.G.tactic='gungan';
// ★ものがたりの たしかめが 目当て。つよさの つりあいは test/tune_ch1.js で 別に はかる。
C.party.length=0;
C.party.push(C.mkMember('io',12)); C.party.push(C.mkMember('seren',12));
C.party[0].weapon={kind:'w',name:'剣',v:9}; C.party[0].armor={kind:'a',name:'胴',v:8};
C.party[1].weapon={kind:'w',name:'槍',v:11};C.party[1].armor={kind:'a',name:'胸当',v:9};
C.P.herbs=8;
const g5=C.P.gold;
stand('pipe_path', 8, 8, 'back');
C.interact();
T('かんむれに かてる', C.G.flags.ch1_swarmDown===true);
T('半年前と くらべる', said('あの ときは 一匹'), log.join(' / ').slice(0,150));
T('束ねられて いた と 言う', said('手綱'));
T('行き先が 旧管路だと わかる', said('旧管路ね'));
T('倒すと 道が あく', C.tileAt('pipe_path',8,7)==='.', C.tileAt('pipe_path',8,7));
T('クエストが 片づく', C.G.quests.ch1_q5_swarm==='clear');
C.G.tactic='manual';
// 技師に 報告して 礼を もらう
{
  const g6=C.P.gold;
  talk('lower_dist', 5, 6, 'back');
  T('技師に 報告できる', C.G.flags.ch1_swarmPaid===true);
  T('礼を もらえる', C.P.gold===g6+160, C.P.gold+' ← '+g6);
  T('旧管路へ 向かえと 言われる', said('旧管路だ'), log.join(' / ').slice(-70));
}

// ★倒す 前の 「管の 底」は 過去形で 言わない
{
  clearLog();
  stand('old_pipe', 13, 5, 'front'); C.interact();
  T('倒す前は 過去形で 言わない', !said('いた あたり'), log.join(' / ').slice(0,60));
  T('倒す前の 手がかりが 出る', said('黒い すじが 走っている'));
}

// ===== 7. 旧管路へ =====
stand('lower_dist', 2, 13, 'left');
C.stepField(-1,0);
T('旧管路へ 入れる', C.P.map==='old_pipe', C.P.map+' '+C.P.x+','+C.P.y);
T('旧管路の めじるしが たつ', C.G.flags.ch1_enteredPipe===true);

// ===== 8. 亀裂は 岩で 埋める =====
T('はじめは 亀裂が ある', C.tileAt('old_pipe',1,19)==='x', C.tileAt('old_pipe',1,19));
{
  // ★亀裂を 埋める まえは 北へ 行けない
  const walk=(x,y)=>C.walkable('old_pipe',x,y);
  const seen=new Set(['10,27']); const q=[[10,27]];
  while(q.length){ const [x,y]=q.shift();
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const k=(x+dx)+','+(y+dy);
      if(!seen.has(k)&&walk(x+dx,y+dy)){ seen.add(k); q.push([x+dx,y+dy]); } } }
  T('亀裂の 北へは そのままでは 行けない', ![...seen].some(k=>Number(k.split(',')[1])<16));
  T('岩が 4つ ある', C.MAPS.old_pipe.tiles.join('').split('O').length-1===4);
}
stand('old_pipe', 1, 21, 'back');
C.stepField(0,-1);                       // 岩(1,17)を 北へ おす → 亀裂(1,16)に はまる
T('亀裂が うまる', C.tileAt('old_pipe',1,19)==='.', C.tileAt('old_pipe',1,19));
for(let i=0;i<3;i++){ C.G.mode='field'; C.stepField(0,-1); }
T('むこうへ わたれる', C.P.y<=18, 'y='+C.P.y);

// ===== 8.7 見習いを 見つける =====
C.party.forEach(p=>{ p.hp=1; });
talk('old_pipe', 19, 24, 'front');
T('見習いを 見つける', C.G.flags.ch1_sonFound===true);
T('奥から 声が した と 言う', said('人の 声みたいな'), log.join(' / ').slice(0,90));
T('知らない 名を 呼ばれた', said('名前を 呼ばれた'));
T('手当てで 全快', C.party.every(p=>p.hp===p.maxhp));

// ===== 9. 破れた 管を 見る =====
talk('old_pipe', 1, 17, 'back');
T('破れ目を 見る', C.G.flags.ch1_sawBreach===true);
T('内側から 溶けている', said('中から'), log.join(' / ').slice(0,80));
T('十年 閉じこめた 話', said('閉じこめた'));

// ===== 10. 灯り 2つで 最奥が ひらく =====
T('はじめは 隔壁が しまっている', C.tileAt('old_pipe',10,7)==='K', C.tileAt('old_pipe',10,7));
talk('old_pipe', 10, 8, 'back');
T('あけかたの ヒントが でる', said('両脇の 灯り'), log.join(' / ').slice(0,70));
stand('old_pipe', 4, 10, 'left'); C.interact();
T('灯り ひとつでは まだ ひらかない', C.tileAt('old_pipe',10,7)==='K');
stand('old_pipe', 20, 17, 'back'); C.interact();
T('灯り ふたつで ひらく', C.tileAt('old_pipe',10,7)==='.', C.tileAt('old_pipe',10,7));

// ===== 11. オボロ =====
clearLog();
C.G.tactic='gungan';
// ★ものがたりの たしかめが 目当て。つよさの つりあいは test/tune_ch1.js で 別に はかる。
C.party.length=0;
C.party.push(C.mkMember('io',13)); C.party.push(C.mkMember('seren',13));
C.party[0].weapon={kind:'w',name:'剣',v:9}; C.party[0].armor={kind:'a',name:'胴',v:8};
C.party[1].weapon={kind:'w',name:'槍',v:11};C.party[1].armor={kind:'a',name:'胸当',v:9};
C.P.herbs=8;
stand('old_pipe', 10, 6, 'back');
C.interact();
T('オボロの 名が 出る', said('オボロ'), log.join(' / ').slice(0,90));
T('申請書の 文言を 口に する', said('シュウゼン'), log.join(' / ').slice(0,200));
T('十年 かけて 育った と わかる', said('食べた ぶん 育つ'));
T('オボロに かてる', C.G.flags.ch1_oboroDown===true);
T('原因は 管だと わかる', said('人の 血じゃ ない'));
T('千年ぶん 溜めている と 言う', said('千年ぶん 溜めてる'));
T('クエストが 片づく', C.G.quests.ch1_q2_pipe==='clear');

// ===== 11.2 上層の 使いに 結果を つきつける =====
talk('mid_dist', 14, 6, 'back');
T('使いに 結果を 言う', C.G.flags.ch1_slurAnswered===true);
T('読む 者が いるかは 別、と 言われる', said('読む 者が いるかは'), log.join(' / ').slice(0,90));
T('家の ためと 釘を さされる', said('深入りなさいません'));

// ===== 11.3 母に 報せる =====
{
  const g0=C.P.gold;
  talk('lower_dist', 12, 12, 'front');
  T('母に 報せる', C.G.flags.ch1_sonThanked===true);
  T('礼を もらえる', C.P.gold===g0+180, C.P.gold+' ← '+g0);
  T('知らない 名だった と 言う', said('自分の 名では なかった'));
  T('クエストが 片づく', C.G.quests.ch1_q4_son==='clear');
}

// ===== 11.4 宿の 夜：セレンの 立場 =====
talk('mid_dist', 3, 6, 'back');
T('宿で 夜の 場面に なる', C.G.flags.ch1_innTalk===true);
T('綴りの 名が 消える 理由', said('書いても 意味が ない'), log.join(' / ').slice(0,120));
T('セレンが 自分の 家を 言う', said('わたしの 家は、その'));

// ===== 11.5 管の 底：濁った 光珠の かけら =====
talk('old_pipe', 13, 5, 'front');
T('かけらを 拾う', C.G.flags.ch1_foundShard===true);
T('炉から 来た 珠だと わかる', said('炉から 来た 珠'), log.join(' / ').slice(0,80));

// ===== 11.7 詰所へ 報告 =====
C.party.forEach(p=>{ p.hp=1; p.mp=0; });
talk('mid_post', 6, 4, 'back');
T('報告できる', C.G.flags.ch1_reported===true);
T('通らない 書類でも 綴りに 残る', said('綴りには 残る'), log.join(' / ').slice(-70));
T('手当てで 全快', C.party.every(p=>p.hp===p.maxhp));

// ===== 12. 章末：炉の 光が 濁っている =====
clearLog();
C.G.tactic='manual';
C.triggerChapterEnd();
T('章末が でる', said('炉の 光が、この十年'), log.join(' / ').slice(-90));
T('炉が もとだと ほのめかす', said('もとの 火が 弱ってる'));
T('第2章へ つながる', said('今度は 上へ'));
T('原因が 調査中に されて しまう', said('原因　調査中'));
T('団長の 名だけが 残って いる', said('名が 残って いるのは'));
T('ch1_cleared が たつ', C.G.flags.ch1_cleared===true);

// ===== 13. セーブ/ロード =====
const g=C.P.gold, lv=C.party[0].lv;
T('セーブできる', C.saveGame(0)===true, C.lastSaveError);
C.freshState();
T('ロードできる', C.loadGame(0)===true);
T('ロード：章が もどる', C.G.chapter===2);
T('ロード：なかまが もどる', C.party.length===2);
T('ロード：しかけが もどる', C.tileAt('old_pipe',1,19)==='.' && C.tileAt('old_pipe',10,7)==='.');
T('ロード：おかねが もどる', C.P.gold===g);
T('ロード：Lvが もどる', C.party[0].lv===lv);

console.log('\n--- ch1_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
