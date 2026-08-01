'use strict';
// ゆめくい連戦（a→b）の勝率実測
const fs=require('fs'), vm=require('vm');
const ctx={console,window:{},localStorage:undefined}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx,{filename:f});
const C=vm.runInContext('LQ3',ctx);
C.bind(C.NullView,C.NullUI,C.NullAudio);
const GEAR={ sora:[26,24], lion:[20,22], sena:[14,18], mio:[16,20] };
function fight(lv){
  C.freshState(); C.G.chapters={};
  C.switchChapter(6);
  C.party.length=0; C.reserve.length=0;
  for(const cls of ['sora','lion','sena','mio']){
    const m=C.mkMember(cls,lv);
    m.weapon={kind:'w',name:'x',v:GEAR[cls][0]};
    m.armor={kind:'a',name:'x',v:GEAR[cls][1]};
    C.party.push(m);
  }
  C.G.tactic='gungan'; C.P.herbs=10; C.P.waters=3;
  C.G.flags.ch6_metRei=true;
  C.NullUI.msgLog.length=0;
  C.startBattle('dreameater_a');
  let guard=0;
  while(C.G.battle && guard++<800) C.beginRound();
  if(guard>=800) return 'stuck';
  const log=C.NullUI.msgLog.join('');
  return log.includes('ぜんめつ') ? 0 : (log.includes('しんのすがた') ? 1 : 'nochain');
}
for(const lv of [24,23]){
  let w=0, other=0;
  for(let i=0;i<200;i++){
    const r=fight(lv);
    if(r===1) w++; else if(r!==0) other++;
  }
  console.log(`ゆめくい連戦 Lv${lv} (4人): 勝率 ${(w/2).toFixed(1)}% ${other?('異常:'+other):''}`);
}
