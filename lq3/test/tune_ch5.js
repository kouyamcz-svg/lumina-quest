'use strict';
// かけらボス勝率実測（さくせん＝ガンガンいこうぜ・100戦）
const fs=require('fs'), vm=require('vm');
const ctx={console,window:{},localStorage:undefined}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx,{filename:f});
const C=vm.runInContext('LQ3',ctx);
C.bind(C.NullView,C.NullUI,C.NullAudio);

const GEAR={
  sora:{w:{kind:'w',name:'x',v:8},  a:{kind:'a',name:'x',v:6}},
  lion:{w:{kind:'w',name:'x',v:15}, a:{kind:'a',name:'x',v:14}},
  bald:{w:{kind:'w',name:'x',v:13}, a:{kind:'a',name:'x',v:11}},
  sena:{w:{kind:'w',name:'x',v:10}, a:{kind:'a',name:'x',v:12}},
  ruka:{w:{kind:'w',name:'x',v:12}, a:{kind:'a',name:'x',v:11}},
  mio: {w:{kind:'w',name:'x',v:14}, a:{kind:'a',name:'x',v:17}},
};
function setup(comp, lv){
  C.freshState(); C.G.chapters={};
  C.switchChapter(5);
  C.party.length=0; C.reserve.length=0;
  comp.forEach(cls=>{
    const m=C.mkMember(cls,lv);
    m.weapon=Object.assign({},GEAR[cls].w); m.armor=Object.assign({},GEAR[cls].a);
    C.party.push(m);
  });
  C.G.tactic='gungan';
  C.P.herbs=8; C.P.waters=2;
  Object.assign(C.G.flags,{ch5_north:true,ch5_east:true,ch5_south:true,ch5_west:true});
}
const BOSS_MAP={shardhound:'versa_dgn2',shardgolem:'zaal_dgn2',shardsis:'minamo_dgn2',shardeater:'elde_top'};
function fight(bossKey, comp, lv){
  setup(comp, lv);
  if(BOSS_MAP[bossKey]) C.P.map=BOSS_MAP[bossKey];   // ★pairボスはマップ判定で2体になる
  C.NullUI.msgLog.length=0;
  C.startBattle(bossKey);
  let guard=0;
  while(C.G.battle && guard++<400) C.beginRound();
  const log=C.NullUI.msgLog.join('');
  if(guard>=400) return 'stuck';
  return log.includes('ぜんめつ') ? 0 : 1;
}
const CASES=[
  ['shardhound', ['sora','lion'], 15],
  ['shardgolem', ['sora','lion','bald'], 16],
  ['shardsis',   ['sora','lion','bald','sena'], 17],
  ['shardeater', ['sora','lion','sena','mio'], 18],
];
const N=100;
for(const [boss,comp,lv] of CASES){
  for(const d of [0,-1]){
    let w=0, stuck=0;
    for(let i=0;i<N;i++){
      const r=fight(boss,comp,lv+d);
      if(r==='stuck') stuck++; else w+=r;
    }
    console.log(`${boss} Lv${lv+d} (${comp.length}人): 勝率 ${w}% ${stuck?('stuck:'+stuck):''}`);
  }
}
