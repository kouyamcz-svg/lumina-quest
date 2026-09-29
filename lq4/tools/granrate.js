// 第5章の ボスの 勝率（node tools/granrate.js 回数 [boss] [hp:atk ...]）
//   boss：gran（第1形態→第2形態の 連戦）／akumuhen5（裂け目の 中ボス）
const fs=require('fs'),vm=require('vm');const c={console,window:{},localStorage:undefined};c.globalThis=c;vm.createContext(c);
for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f,'utf8'),c,{filename:f});
const C=vm.runInContext('LQ4',c);
let lost=false;
C.bind(C.NullView,{msg(l,d){ if(l.some(x=>/全滅/.test(x))) lost=true; d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
const W={io:26,seren:28,noe:16,amane:16}, A={io:34,seren:25,noe:19,amane:19};
const N=Number(process.argv[2]||60), which=process.argv[3]||'gran';
const specs=process.argv.slice(4); if(!specs.length) specs.push('');
for(const spec of specs){
  const key = which==='gran' ? 'gran1' : which;
  if(spec){ const [hp,atk,hp2,atk2]=spec.split(':').map(Number);
    if(hp) C.MIDBOSS[key].hp=hp; if(atk) C.MIDBOSS[key].atk=atk;
    if(hp2) C.MIDBOSS.gran2.hp=hp2; if(atk2) C.MIDBOSS.gran2.atk=atk2; }
  const flag = which==='gran' ? 'ch5_granFell' : 'ch5_riftDown';
  const row=[];
  for(const lv of [35,36,37,38,39,40]){ let win=0;
    for(let t=0;t<N;t++){ C.freshState(); C.G.chapter=6; C.G.tactic='gungan'; C.party.length=0;
      ['io','seren','noe','amane'].forEach(k=>{ const m=C.mkMember(k,lv); m.weapon={kind:'w',name:'w',v:W[k]}; m.armor={kind:'a',name:'a',v:A[k]}; C.party.push(m); });
      C.P.herbs=10; C.P.map= which==='gran' ? 'cradle' : 'rift_yard'; C.G.mode='field'; lost=false;
      try{ C.startBattle(key); }catch(e){ console.log(e.message); }
      if(C.G.flags[flag] && !lost) win++; }
    row.push('Lv'+lv+' '+Math.round(win/N*100)+'%'); }
  console.log(which, spec||'（いまの 値）', '｜', row.join('  '));
}
