'use strict';
// ウンブラの 勝率実測（構想書 §5：到達Lv≈90% ／ 1つ下 50〜80%）
// ※ ぜんめつしても core は まちへ もどして 全快させる ため、
//   「aliveMembers>0」では かちまけが わからない。メッセージで はんてい する。
const fs=require('fs'), vm=require('vm');
const ctx={console,window:{},localStorage:undefined}; ctx.globalThis=ctx; vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx,{filename:f});
const C=vm.runInContext('LQ4',ctx);
let lost=false;
C.bind(C.NullView, {
  msg(l,d){ if(l.some(x=>String(x).indexOf('ぜんめつ')>=0)) lost=true; d&&d(); },
  menu(i,t,cb){cb(0);}, hud(){}, label(){}
}, C.NullAudio);

function trial(lv, N){
  let win=0;
  for(let i=0;i<N;i++){
    C.freshState(); C.G.tactic='gungan'; C.party.length=0;
    C.party.push(C.mkMember('io',lv));
    C.party.push(C.mkMember('seren',lv));
    C.party[0].weapon={kind:'w',name:'父の 打った 剣',v:4};
    C.party[0].armor ={kind:'a',name:'見習いの 胴着',v:2};
    C.party[1].weapon={kind:'w',name:'見習いの 槍',v:6};
    C.party[1].armor ={kind:'a',name:'貴族の 胸当て',v:5};
    C.P.herbs=3; C.P.map='rift_yard'; C.G.mode='field';
    lost=false;
    C.startBattle('umbra');
    if(!lost) win++;
  }
  return win*100/N;
}
const N = Number(process.argv[2]||200);
for(const lv of [3,4,5,6]) console.log('Lv'+lv+'　勝率 '+trial(lv,N).toFixed(1)+'%');
