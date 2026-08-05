'use strict';
// ウンブラの 勝率実測（構想書 §5：到達Lv≈90% ／ 1つ下 50〜80%）
// 使い方： node test/tune_umbra.js [かいすう]
//
// ★2とおり はかる。
//   A) 全快・Lv固定  … 素の つよさを 見る
//   B) 通しどおり     … 下層区から 道を あるいて（ざこ戦で けずられた まま）ボスへ。
//                       じっさいの プレイに ちかい。M0で「いきなり キツい」と なった ため 追加。
// ★ぜんめつしても core は まちへ もどして 全快させる。メッセージで かちまけを 見る こと。
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

function setParty(lv){
  C.freshState(); C.G.tactic='gungan'; C.party.length=0;
  C.party.push(C.mkMember('io',lv));
  C.party.push(C.mkMember('seren',lv));
  C.party[0].weapon={kind:'w',name:'父の 打った 剣',v:4};
  C.party[0].armor ={kind:'a',name:'見習いの 胴着',v:2};
  C.party[1].weapon={kind:'w',name:'見習いの 槍',v:6};
  C.party[1].armor ={kind:'a',name:'貴族の 胸当て',v:5};
  C.P.herbs=3;
}
// 入口(8,11)から ボス前(5,3)までの みちのり
const PATH=[];
for(let i=0;i<7;i++)PATH.push([1,0]);  for(let i=0;i<2;i++)PATH.push([0,-1]);
for(let i=0;i<14;i++)PATH.push([-1,0]);for(let i=0;i<2;i++)PATH.push([0,-1]);
for(let i=0;i<14;i++)PATH.push([1,0]); for(let i=0;i<2;i++)PATH.push([0,-1]);
for(let i=0;i<14;i++)PATH.push([-1,0]);for(let i=0;i<2;i++)PATH.push([0,-1]);
for(let i=0;i<4;i++)PATH.push([1,0]);

function fullHeal(lv, N){
  let win=0;
  for(let i=0;i<N;i++){
    setParty(lv); C.P.map='rift_yard'; C.G.mode='field'; lost=false;
    C.startBattle('umbra'); if(!lost) win++;
  }
  return win*100/N;
}
function throughRun(N){
  let win=0, lvs={}, wipedOnWay=0;
  for(let i=0;i<N;i++){
    setParty(2); C.P.map='rift_yard'; C.P.x=8; C.P.y=11; C.G.mode='field';
    lost=false;
    for(const [dx,dy] of PATH){ C.stepField(dx,dy); if(C.G.mode!=='field') C.G.mode='field'; }
    if(lost) wipedOnWay++;                    // みちみちで ぜんめつ
    const lv=C.party[0].lv; lvs[lv]=(lvs[lv]||0)+1;
    lost=false; C.G.mode='field';
    C.startBattle('umbra');
    if(!lost) win++;
  }
  return {win:win*100/N, lvs, wipedOnWay};
}

const N=Number(process.argv[2]||200);
console.log('A) 全快・Lv固定');
for(const lv of [3,4,5,6]) console.log('   Lv'+lv+'　勝率 '+fullHeal(lv,N).toFixed(1)+'%');
const r=throughRun(N);
console.log('B) 通しどおり（Lv2で 入口 → 道を あるいて ボス）');
console.log('   ボス前の Lv ぶんぷ '+JSON.stringify(r.lvs));
console.log('   みちみちの ぜんめつ '+r.wipedOnWay+'/'+N);
console.log('   ウンブラ 勝率 '+r.win.toFixed(1)+'%');
