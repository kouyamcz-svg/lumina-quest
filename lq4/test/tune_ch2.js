'use strict';
// ルミナクエストIV / 第2章の 通し実測
// 使い方： node test/tune_ch2.js [かいすう]
// ★上層区 → 庭園（ノエ加入）→ 炉の外郭 を 実さいに 歩いて はかる。
const fs=require('fs'),vm=require('vm');
const ctx={console,window:{},localStorage:undefined}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'),ctx,{filename:f});
const C=vm.runInContext('LQ4',ctx);
let lost=false;
C.bind(C.NullView,{msg(l,d){ if(l.some(x=>String(x).indexOf('全滅')>=0)) lost=true; d&&d(); },
                   menu(i,t,cb){cb(0);}, hud(){}, label(){}}, C.NullAudio);

const N=Number(process.argv[2]||120);
const lvs={}; let win=0, wipe=0;
// いまの ばしょから (tx,ty) まで 道を さがして あるく
function route(map,tx,ty){
  const key=(x,y)=>x+','+y;
  const prev={}; const q=[[C.P.x,C.P.y]]; prev[key(C.P.x,C.P.y)]=null;
  let goal=null;
  while(q.length){
    const [x,y]=q.shift();
    if(x===tx&&y===ty){ goal=[x,y]; break; }
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx, ny=y+dy, k=key(nx,ny);
      if(k in prev) continue;
      if(!C.walkable(map,nx,ny)) continue;
      prev[k]=[x,y]; q.push([nx,ny]);
    }
  }
  if(!goal) return false;
  const path=[]; let cur=goal;
  while(cur){ path.unshift(cur); cur=prev[key(cur[0],cur[1])]; }
  for(let i=1;i<path.length;i++){
    C.G.mode='field';
    C.stepField(path[i][0]-path[i-1][0], path[i][1]-path[i-1][1]);
    if(C.P.map!==map) return false;
  }
  return true;
}
for(let t=0;t<N;t++){
  C.freshState(); C.G.chapter=3; C.G.tactic='gungan'; C.party.length=0;
  const io=C.mkMember('io',13), se=C.mkMember('seren',13), no=C.mkMember('noe',13);
  io.weapon={kind:'w',name:'w',v:16}; io.armor={kind:'a',name:'a',v:14};
  se.weapon={kind:'w',name:'w',v:18}; se.armor={kind:'a',name:'a',v:15};
  no.weapon={kind:'w',name:'w',v:9};  no.armor={kind:'a',name:'a',v:11};
  C.party.push(io,se,no); C.P.herbs=8; lost=false;

  // 炉の 外郭を ひとまわり（入口 → 灯りA → 灯りB → 隔壁 → ボス前）
  C.P.map='furnace'; C.P.x=10; C.P.y=19; C.G.mode='field';
  route('furnace',3,9);
  route('furnace',20,13);
  route('furnace',17,17);
  C.G.mode='field'; C.startBattle('sorakurai');
  // 町へ もどって 回復（物語じょう 主任に 会いに 行ける）
  C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; p.status=null; });
  C.P.herbs=8;
  C.P.map='furnace'; C.P.x=10; C.P.y=19; C.G.mode='field';
  route('furnace',10,7);
  const lv=C.party[0].lv; lvs[lv]=(lvs[lv]||0)+1;
  if(lost) wipe++;
  lost=false; C.G.mode='field'; C.startBattle('fornax');
  if(!lost) win++;
}
console.log('ボス前の Lv ぶんぷ', JSON.stringify(lvs));
console.log('みちみちの 全滅', wipe+'/'+N);
console.log('フォルナクス 勝率 '+(win*100/N).toFixed(1)+'%');
