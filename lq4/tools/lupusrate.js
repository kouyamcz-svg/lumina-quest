const fs=require('fs'),vm=require('vm');const c={console,window:{},localStorage:undefined};c.globalThis=c;vm.createContext(c);
for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync('/home/claude/lq4/src/'+f,'utf8'),c,{filename:f});
const C=vm.runInContext('LQ4',c);
C.bind(C.NullView,{msg(l,d){d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
const W={io:26,seren:28,noe:16,amane:16}, A={io:25,seren:25,noe:19,amane:19};
const N=Number(process.argv[2]||80);
for(const hp of process.argv.slice(3).map(Number)){
  C.MIDBOSS.lupus.hp=hp; const row=[];
  for(const lv of [32,33,34]){ let win=0;
    for(let t=0;t<N;t++){ C.freshState(); C.G.chapter=4; C.G.tactic='gungan'; C.party.length=0;
      ['io','seren','noe','amane'].forEach(k=>{ const m=C.mkMember(k,lv); m.weapon={kind:'w',name:'w',v:W[k]}; m.armor={kind:'a',name:'a',v:A[k]}; C.party.push(m); });
      C.P.herbs=10; C.P.map='shrine_hill'; C.G.mode='field'; try{ C.startBattle('lupus'); }catch(e){} if(C.G.flags.ch3_lupusDown) win++; }
    row.push('Lv'+lv+' '+Math.round(win/N*100)+'%'); }
  console.log('HP', hp, '｜', row.join('  '));
}
