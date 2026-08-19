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
  // ★旧管路：じっさいに 道を さがして あるく（かべに ぶつかる 空うちを しない）
  C.P.map='old_pipe'; C.P.x=10; C.P.y=24; C.G.mode='field';
  const route=(tx,ty)=>{
    // いまの ばしょから (tx,ty) の となりまで 道を さがして あるく
    const key=(x,y)=>x+','+y;
    const prev={}; const st=[[C.P.x,C.P.y]]; prev[key(C.P.x,C.P.y)]=null;
    let goal=null;
    while(st.length){
      const [x,y]=st.shift();
      if(Math.abs(x-tx)+Math.abs(y-ty)===0){ goal=[x,y]; break; }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy, k=key(nx,ny);
        if(k in prev) continue;
        if(!C.walkable('old_pipe',nx,ny)) continue;
        prev[k]=[x,y]; st.push([nx,ny]);
      }
    }
    if(!goal) return false;
    const path=[]; let cur=goal;
    while(cur){ path.unshift(cur); cur=prev[key(cur[0],cur[1])]; }
    for(let i=1;i<path.length;i++){
      C.G.mode='field';
      C.stepField(path[i][0]-path[i-1][0], path[i][1]-path[i-1][1]);
      if(C.P.map!=='old_pipe') return false;
    }
    return true;
  };
  route(1,18);                      // 岩の 南まで
  C.G.mode='field'; C.stepField(0,-1);   // 岩を 亀裂へ おす
  route(1,15);                      // 亀裂を こえる
  route(4,7);   C.G.mode='field'; C.P.dir='left';  C.interact();   // 灯りA
  route(20,14); C.G.mode='field'; C.P.dir='back';  C.interact();   // 灯りB
  // ★灯りを 点けた あと、物語じょう いちど 町へ 戻れる（技師へ 報告など）
  C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; p.status=null; });
  C.P.herbs = Math.max(C.P.herbs, 6);
  route(10,5);                      // 隔壁の 下
  route(10,3);                      // ボスの 前
  const lv=C.party[0].lv; lvs[lv]=(lvs[lv]||0)+1;
  if(lost) wipe++;
  lost=false; C.G.mode='field'; C.startBattle('oboro');
  if(!lost) win++;
}
console.log('ボス前の Lv ぶんぷ', JSON.stringify(lvs));
console.log('みちみちの 全滅', wipe+'/'+N);
console.log('オボロ 勝率 '+(win*100/N).toFixed(1)+'%');
