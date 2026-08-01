'use strict';
// デスナイト（ソラ単独・父の剣w8/旅の衣a6）の勝率実測
const fs=require('fs'), vm=require('vm');
const ctx={console,window:{},localStorage:undefined}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx,{filename:f});
const C=vm.runInContext('LQ3',ctx);
C.bind(C.NullView,C.NullUI,C.NullAudio);
function fight(lv,herbs){
  C.freshState(); C.G.chapters={};
  C.switchChapter(5);
  C.party.length=0; C.reserve.length=0;
  const m=C.mkMember('sora',lv);
  m.weapon={kind:'w',name:'ちちの かたみの けん',v:8};
  m.armor={kind:'a',name:'たびの ころも',v:6};
  C.party.push(m);
  C.G.tactic='gungan'; C.P.herbs=herbs; C.P.waters=2;
  C.NullUI.msgLog.length=0;
  C.startBattle('dknight');
  let g=0; while(C.G.battle && g++<400) C.beginRound();
  return C.NullUI.msgLog.join('').includes('ぜんめつ')?0:1;
}
for(const [lv,hb] of [[4,6],[3,6],[5,6]]){
  let w=0; for(let i=0;i<200;i++) w+=fight(lv,hb);
  console.log(`デスナイト Lv${lv} やくそう${hb}: 勝率 ${(w/2).toFixed(1)}%`);
}
