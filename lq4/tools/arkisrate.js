const fs=require('fs'),vm=require('vm');const c={console,window:{},localStorage:undefined};c.globalThis=c;vm.createContext(c);
for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync('/home/claude/lq4/src/'+f,'utf8'),c,{filename:f});
const C=vm.runInContext('LQ4',c);
let lost=false;
C.bind(C.NullView,{msg(l,d){ if(l.some(x=>/膝を ついた/.test(x))) lost=true; d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
const W={io:26,seren:28,noe:16,amane:16}, A={io:34,seren:25,noe:19,amane:19};
const N=Number(process.argv[2]||60);
for(const spec of process.argv.slice(3)){
  const [hp,atk,acts]=spec.split(':').map(Number); C.MIDBOSS.arkis.hp=hp; if(atk) C.MIDBOSS.arkis.atk=atk; if(acts) C.MIDBOSS.arkis.acts=acts; const row=[];
  for(const lv of [34,35,36]){ let win=0;
    for(let t=0;t<N;t++){ C.freshState(); C.G.chapter=5; C.G.tactic='gungan'; C.party.length=0;
      ['io','seren','noe','amane'].forEach(k=>{ const m=C.mkMember(k,lv); m.weapon={kind:'w',name:'w',v:W[k]}; m.armor={kind:'a',name:'a',v:A[k]}; C.party.push(m); });
      C.P.herbs=10; C.P.map='archive_core'; C.G.mode='field'; lost=false;
      try{ C.startBattle('arkis'); }catch(e){}
      if(C.G.flags.ch4_arkisDone && !lost) win++; }
    row.push('Lv'+lv+' '+Math.round(win/N*100)+'%'); }
  console.log('HP', hp, 'atk', C.MIDBOSS.arkis.atk, 'acts', C.MIDBOSS.arkis.acts, '｜', row.join('  '));
}
