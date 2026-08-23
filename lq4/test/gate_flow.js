'use strict';
// ルミナクエストIV / 「一度の 会話で 先へ すすめるか」の けんしょう
// 使い方： node test/gate_flow.js
//
// ★書いた りゆう：技師に 会話が 何本も あり、さきに 合う ものが えらばれる ため、
//   「父の 話」だけが 出て 手間賃の 会話に とどかず、依頼を すませた はずなのに
//   試験場の 門が 開かない ことが あった。
//   遊ぶ 手順を そのまま なぞって、どの 道すじでも 詰まらない ことを たしかめる。
const fs = require('fs'), vm = require('vm');
const ctx = {console, window:{}, localStorage:undefined}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
const log=[];
C.bind(C.NullView, {msg(l,d){ l.forEach(x=>log.push(x)); d&&d(); }, menu(i,t,cb){cb(0);},
                    hud(){}, label(){}}, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>l.indexOf(w)>=0); }

function talkGishi(){
  log.length=0;
  C.G.mode='field'; C.P.map='lower_dist'; C.P.x=5; C.P.y=6; C.P.dir='back';
  C.interact();
}
function seeMaw(){
  C.G.mode='field'; C.P.map='pipe_path'; C.P.x=8; C.P.y=8; C.P.dir='back';
  C.interact();
}
function kill(k){
  C.P.map='pipe_path';
  for(let i=0;i<k;i++){ C.G.mode='field'; C.startBattle();
    C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; }); }
}

// ============ みちすじ A：あぎとを 見てから 3体 たおして 報告 ============
{
  C.freshState(); C.G.tactic='gungan';
  talkGishi();
  T('A 依頼を うける', C.G.flags.ch0_errandTaken===true);
  seeMaw();
  T('A あぎとに 出会う', C.G.flags.ch0_mawFled===true);
  kill(3);
  T('A ノルマ たっせい', C.G.flags.ch0_errandDone===true);
  const g=C.P.gold;
  talkGishi();
  T('A 一度の 会話で 手間賃を もらえる', C.P.gold===g+120, C.P.gold+' ← '+g);
  T('A 一度の 会話で 父の 話も 出る', said('お前の 父さんが、同じ ことを'));
  T('A 一度の 会話で 門が 開く', !C.wardBlocks('trial_yard'));
  T('A クエストが 片づく', C.G.quests.ch0_q0_errand==='clear');
}

// ============ みちすじ B：3体 たおしてから あぎとを 見て 報告 ============
{
  C.freshState(); C.G.tactic='gungan';
  talkGishi(); kill(3);
  T('B ノルマ たっせい', C.G.flags.ch0_errandDone===true);
  seeMaw();
  const g=C.P.gold;
  talkGishi();
  T('B 一度の 会話で 手間賃を もらえる', C.P.gold===g+120, C.P.gold+' ← '+g);
  T('B 一度の 会話で 門が 開く', !C.wardBlocks('trial_yard'));
}

// ============ みちすじ C：あぎとを 見ずに 3体だけ たおして 報告 ============
{
  C.freshState(); C.G.tactic='gungan';
  talkGishi(); kill(3);
  const g=C.P.gold;
  talkGishi();
  T('C 一度の 会話で 手間賃を もらえる', C.P.gold===g+120, C.P.gold+' ← '+g);
  T('C 一度の 会話で 門が 開く', !C.wardBlocks('trial_yard'));
  T('C 父の 話は まだ 出ない', !C.G.flags.ch0_mawTold);
  // あとから あぎとを 見て 報告 すれば 父の 話が 出る
  seeMaw(); talkGishi();
  T('C あとから 父の 話が 出る', C.G.flags.ch0_mawTold===true);
}

// ============ ふるい セーブでも 人が 二重に ならない か ============
//   ★立ち位置を まとめる 前の セーブだと、仲間の セレンと
//     地図の セレンが 2人 ならんで 見えた。一度 話せば 直る こと。
{
  C.freshState();
  ['ch0_errandPaid','ch0_started','ch0_trialDone','ch0_sparDone','ch0_serenJoined']
    .forEach(f=>C.G.flags[f]=true);
  C.setTile('trial_yard',9,4,'n');          // 地図に のこった セレン
  C.party.push(C.mkMember('seren',3));      // すでに 仲間
  T('ふるい セーブ：地図にも いる', C.tileAt('trial_yard',9,4)==='n');
  log.length=0;
  C.G.mode='field'; C.P.map='trial_yard'; C.P.x=9; C.P.y=5; C.P.dir='back';
  C.interact();
  T('話すと 地図から 消える', C.tileAt('trial_yard',9,4)==='.', C.tileAt('trial_yard',9,4));
  T('見おくりの ことばが 出る', said('日が 暮れる'), log.join(' / ').slice(0,50));
  T('仲間は そのまま', C.party.length===2 && C.party[1].cls==='seren');
}

// ============ 「行けと 言われた 先」が その 時点で できて いるか ============
//   ★2つの 会話に 分けて いた ため、1回 話した だけでは
//     点検路に 群れが 置かれず、行っても 誰も いなかった。
{
  C.freshState(); C.G.chapters={}; C.switchChapter(2);
  C.G.flags.ch1_taskTaken = true;
  log.length=0;
  C.G.mode='field'; C.P.map='lower_dist'; C.P.x=5; C.P.y=6; C.P.dir='back';
  C.interact();
  T('技師の 話は 一度で 済む', C.G.flags.ch1_pipeTold && C.G.flags.ch1_swarmTold,
    JSON.stringify({pipe:C.G.flags.ch1_pipeTold, swarm:C.G.flags.ch1_swarmTold}));
  T('言われた 先に 群れが いる', C.tileAt('pipe_path',8,7)==='B', C.tileAt('pipe_path',8,7));
  T('言われた 先の 昇降口が 開く', C.tileAt('lower_dist',1,13)==='D', C.tileAt('lower_dist',1,13));
  T('点検路の クエストが たつ', C.G.quests.ch1_q5_swarm==='active');
}

// ============ 仲間に なった 人は その場に のこる ============
//   ★party[k] が 見るのは trail[k-1]。さきあたまに 入れると
//     2人めが うけとって しまい、3人めが うしろへ ワープした。
{
  C.freshState(); C.G.chapters={}; C.switchChapter(3);
  C.G.flags.ch2_taskTaken = true;
  // じっさいに 庭園を あるいて ノエの となりへ
  C.G.mode='field'; C.P.map='garden'; C.P.x=13; C.P.y=8; C.G.trail=[[13,9],[13,9]];
  C.G.mode='field'; C.stepField(0,-1);
  C.G.mode='field'; C.stepField(0,-1);
  const before = C.G.trail[0].slice();
  C.G.mode='field'; C.P.dir='back'; C.interact();
  T('3人に なる', C.party.length===3 && C.party[2].cls==='noe', C.party.map(p=>p.cls).join(','));
  T('あたらしい 人が その場に のこる',
    C.G.trail[1] && C.G.trail[1][0]===13 && C.G.trail[1][1]===5,
    JSON.stringify(C.G.trail.slice(0,2)));
  T('もとから いた 人は うごかない',
    C.G.trail[0][0]===before[0] && C.G.trail[0][1]===before[1],
    JSON.stringify(C.G.trail[0])+' ← '+JSON.stringify(before));
  C.G.mode='field'; C.stepField(0,1);
  T('うごくと 順に ついてくる',
    C.G.trail[0][0]===13 && C.G.trail[0][1]===6,
    JSON.stringify(C.G.trail.slice(0,2)));
}

// ============ 世界地図から 早く 行けて しまわないか ============
//   ★世界地図の ちてんを 実マップに つないだ とき、けっかいを 付け忘れると
//     序章の うちに 第2章の ばしょへ 入れて しまう。
{
  // ★「どこは 何章から」を ここに 書いて おく。
  //   けっかいを 消しても この 表と 合わなく なって 落ちる。
  const FROM = {
    lower_dist: 1,   // 序章から
    pipe_path:  1,
    mid_dist:   1,
    world:      1,
    garden:     3,   // 第2章から（上層区の 中）
    furnace:    3,   // 第2章から（さらに 案内が いる）
    watchtower: 3,
    upper_dist: 3,
    mid_post:   2, mid_arch: 2, old_pipe: 2,
    // ---- 第3章：雲海港と 地上 ----
    sky_port:   4,   // 第3章から（降下の 出発点）
    ground:     4, ice_camp: 4, ice_cave: 4,
    well_town:  4, well_cave: 4, coral_bay: 4, sea_cave: 4,
    furnace_core: 3,
    trial_yard: 1, rift_yard: 1, home_forge: 1,
  };
  const W = C.MAPS.world.warpsXY || {};
  Object.keys(W).forEach(k=>{
    const to = W[k].to;
    const need = FROM[to];
    T('行き先の 章が きめて ある '+to, need!==undefined, '表に ない');
    if(need===undefined || need<=1) return;
    for(let no=1; no<need; no++){
      C.freshState(); C.G.chapter = no;
      const cd0 = vm.runInContext('CHAPTERS_DATA', ctx).CH[no];
      ((cd0 && cd0.setFlags) || []).forEach(f=>C.G.flags[f]=true);
      T('第'+(no-1)+'章では 世界地図から '+to+' へ 行けない', C.wardBlocks(to),
        '早く 入れて しまう（'+k+'）／けっかいを 付け忘れて いない か');
    }
  });
}

// ============ すべての けっかいが いつか 開くか ============
{
  C.freshState();
  // ★けっかいは 章ごと。その 章に なって いないと 閉じない。
  Object.keys(C.WARDS).forEach(mp=>{
    const wd = C.WARDS[mp];
    // ★その 章より 前は、めじるしが 立って いても 通さない
    if(wd.chapter > 1){
      C.G.chapter = wd.chapter - 1;
      C.G.flags[wd.flag] = true;
      T('けっかい '+mp+' は 前の 章では 通さない', C.wardBlocks(mp));
      T('けっかい '+mp+' に 前の 章むけの ことばが ある', !!wd.msgEarly);
      C.G.flags[wd.flag] = false;
    }
    C.G.chapter = wd.chapter;
    C.G.flags[wd.flag] = false;
    T('けっかい '+mp+' は はじめ 閉じている（第'+wd.chapter+'章）', C.wardBlocks(mp));
    C.G.flags[wd.flag] = true;
    T('けっかい '+mp+' は めじるしで 開く', !C.wardBlocks(mp));
  });
  C.G.chapter = 1;
}

console.log('\n--- gate_flow: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
