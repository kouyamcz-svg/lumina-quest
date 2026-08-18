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

// ============ すべての けっかいが いつか 開くか ============
{
  C.freshState();
  Object.keys(C.WARDS).forEach(mp=>{
    T('けっかい '+mp+' は はじめ 閉じている', C.wardBlocks(mp));
    C.G.flags[C.WARDS[mp].flag] = true;
    T('けっかい '+mp+' は めじるしで 開く', !C.wardBlocks(mp));
  });
}

console.log('\n--- gate_flow: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
