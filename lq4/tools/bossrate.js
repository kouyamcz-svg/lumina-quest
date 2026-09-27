const fs=require('fs'),vm=require('vm');
function make(){ const c={console,window:{},localStorage:undefined}; c.globalThis=c; vm.createContext(c);
  for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync('/home/claude/lq4/src/'+f,'utf8'),c,{filename:f});
  return vm.runInContext('LQ4',c); }
const C=make();
C.bind(C.NullView,{msg(l,d){d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
// ボスと 挑む レベル・仲間・装備（第3章の 通しテストと 同じ 考え方）
const W={io:[21,26],seren:[20,28],noe:[12,16],amane:[14,16]}, A={io:[19,25],seren:[19,25],noe:[15,19],amane:[15,19]};
const FL={akumuhen:'ch3_riezeSaved',akumuhen2:'ch3_veinFound',akumuhen3:'ch3_namiSaved',akumuhen4:'ch3_peakCleared',lupus:'ch3_lupusDown'};
const LV=(process.env.LV||'').split(',').map(Number);
const cases=[['akumuhen','ice_core',LV[0]||24,['io','seren','noe'],0],['akumuhen2','well_core',LV[1]||27,['io','seren','noe'],0],
             ['akumuhen3','sea_core',LV[2]||29,['io','seren','noe'],0],['akumuhen4','peak_core',LV[3]||30,['io','seren','noe'],1],['lupus','shrine_hill',LV[4]||33,['io','seren','noe','amane'],1]];
const N=Number(process.argv[2]||60);
cases.forEach(([key,map,lv,pt,late])=>{
  let win=0, turns=0, spellDmg={};
  for(let t=0;t<N;t++){
    C.freshState(); C.G.chapter=4; C.G.tactic='gungan'; C.party.length=0;
    pt.forEach(k=>{ const m=C.mkMember(k,lv); m.weapon={kind:'w',name:'w',v:W[k][late]}; m.armor={kind:'a',name:'a',v:A[k][late]}; C.party.push(m); });
    C.P.herbs=10; C.P.map=map; C.G.mode='field';
    try{ C.startBattle(key); }catch(e){}
    if(C.G.flags[FL[key]]) win++;
  }
  console.log(key.padEnd(10), 'Lv'+lv, pt.length+'人', '勝率', Math.round(win/N*100)+'%');
});
