'use strict';
// ルミナクエストIV / オボロの 勝率実測（§5：到達Lv≈90% ／ 1つ下 50〜80%）
// 使い方： node test/tune_oboro.js
// ★第1章の 想定Lvは 8〜11。旧管路を あるいて たどりつく ころ。
const fs=require('fs'),vm=require('vm');
const c={console,window:{},localStorage:undefined};c.globalThis=c;vm.createContext(c);
for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync('src/'+f,'utf8'),c,{filename:f});
const C=vm.runInContext('LQ4',c);
let lost=false;
C.bind(C.NullView,{msg(l,d){if(l.some(x=>String(x).indexOf('全滅')>=0))lost=true;d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
function set(lv){
  C.freshState(); C.G.chapter=2; C.G.tactic='gungan'; C.party.length=0;
  C.party.push(C.mkMember('io',lv)); C.party.push(C.mkMember('seren',lv));
  C.party[0].weapon={kind:'w',name:'剣',v:9};  C.party[0].armor={kind:'a',name:'胴',v:8};
  C.party[1].weapon={kind:'w',name:'槍',v:11}; C.party[1].armor={kind:'a',name:'胸当',v:9};
  C.P.herbs=5;
}
for(const lv of [8,9,10,11,12]){
  let w=0; for(let i=0;i<200;i++){ set(lv); C.P.map='old_pipe'; C.G.mode='field'; lost=false;
    C.startBattle('oboro'); if(!lost) w++; }
  console.log('Lv'+lv+'　勝率 '+(w/2).toFixed(1)+'%');
}
