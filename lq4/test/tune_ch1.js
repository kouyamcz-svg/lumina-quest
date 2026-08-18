'use strict';
// ルミナクエストIV / 第1章の 通し実測
// 使い方： node test/tune_ch1.js [かいすう]
// ★点検路 → 町で 回復 → 旧管路 → オボロ、という 物語どおりの すじで はかる。
// 第1章：中層区から あるいて オボロに たどりつく ときの Lvと 勝率
const fs=require('fs'),vm=require('vm');
const c={console,window:{},localStorage:undefined};c.globalThis=c;vm.createContext(c);
for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync('src/'+f,'utf8'),c,{filename:f});
const C=vm.runInContext('LQ4',c);
let lost=false;
C.bind(C.NullView,{msg(l,d){if(l.some(x=>String(x).indexOf('全滅')>=0))lost=true;d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
const lvs={}; let win=0, wipe=0;
const N=Number(process.argv[2]||150);
for(let t=0;t<N;t++){
  C.freshState(); C.G.chapter=2; C.G.tactic='gungan'; C.party.length=0;
  C.party.push(C.mkMember('io',8)); C.party.push(C.mkMember('seren',8));
  C.party[0].weapon={kind:'w',name:'w',v:9};  C.party[0].armor={kind:'a',name:'a',v:8};
  C.party[1].weapon={kind:'w',name:'w',v:11}; C.party[1].armor={kind:'a',name:'a',v:9};
  C.P.herbs=5; lost=false;
  // 点検路を ひとまわり（かんむれ 込み）
  C.P.map='pipe_path'; C.P.x=13; C.P.y=13; C.G.mode='field';
  const path=[];
  const push=(n,d)=>{ for(let i=0;i<n;i++) path.push(d); };
  push(11,[-1,0]); push(10,[0,-1]); push(11,[1,0]); push(10,[0,1]);
  for(const [dx,dy] of path){ C.G.mode='field'; C.stepField(dx,dy); }
  C.G.mode='field'; C.startBattle('kanmure');
  // ★ここで いちど 町へ もどる（物語じょう 技師に 報告する）。宿と 店を 通る てい。
  C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; p.status=null; });
  C.P.herbs = 8;
  // 旧管路を ひとまわり
  C.P.map='old_pipe'; C.P.x=9; C.P.y=15; C.G.mode='field';
  const p2=[];
  push2(p2,13,[-1,0]); push2(p2,2,[0,-1]); push2(p2,15,[1,0]); push2(p2,3,[0,-1]);
  push2(p2,15,[-1,0]); push2(p2,3,[0,-1]); push2(p2,7,[1,0]);
  function push2(a,n,d){ for(let i=0;i<n;i++) a.push(d); }
  for(const [dx,dy] of p2){ C.G.mode='field'; C.stepField(dx,dy); }
  const lv=C.party[0].lv; lvs[lv]=(lvs[lv]||0)+1;
  if(lost) wipe++;
  lost=false; C.G.mode='field'; C.startBattle('oboro');
  if(!lost) win++;
}
console.log('ボス前の Lv ぶんぷ', JSON.stringify(lvs));
console.log('みちみちの 全滅', wipe+'/'+N);
console.log('オボロ 勝率 '+(win*100/N).toFixed(1)+'%');
