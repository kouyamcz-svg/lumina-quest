// 終章の メーアの 勝率（node tools/merarate.js 回数 [a1:a2:a3:h1:h2:h3]：攻撃力と HPを 変えて 測る）
//   boss：gran（第1形態→第2形態の 連戦）／crater（裂け目の 中ボス）
const fs=require('fs'),vm=require('vm');const c={console,window:{},localStorage:undefined};c.globalThis=c;vm.createContext(c);
for(const f of ['world.js','npc.js','chapters.js','core.js'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+f,'utf8'),c,{filename:f});
const C=vm.runInContext('LQ4',c);
let lost=false;
C.bind(C.NullView,{msg(l,d){ if(l.some(x=>/全滅/.test(x))) lost=true; d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
const W={io:26,seren:28,noe:16,amane:16}, A={io:34,seren:25,noe:19,amane:19};
const N=Number(process.argv[2]||40), which='mera';
const specs=process.argv.slice(3); if(!specs.length) specs.push('');
for(const spec of specs){
  if(spec){ const [a1,a2,a3,h1,h2,h3]=spec.split(':').map(Number); if(a1) C.MIDBOSS.mera1.atk=a1; if(a2) C.MIDBOSS.mera2.atk=a2; if(a3) C.MIDBOSS.mera3.atk=a3; if(h1) C.MIDBOSS.mera1.hp=h1; if(h2) C.MIDBOSS.mera2.hp=h2; if(h3) C.MIDBOSS.mera3.hp=h3; }
  const row=[];
  for(const lv of [39,40,41,42,43,44]){ let win=0;
    for(let t=0;t<N;t++){ C.freshState(); C.G.chapter=7; C.G.tactic='gungan'; C.party.length=0;
      ['io','seren','noe','amane'].forEach(k=>{ const m=C.mkMember(k,lv); m.weapon={kind:'w',name:'w',v:W[k]}; m.armor={kind:'a',name:'a',v:A[k]}; C.party.push(m); });
      C.P.herbs=12; C.P.map='dream_depths'; C.G.mode='field'; lost=false;
      try{ C.startBattle('mera1'); }catch(e){ console.log(e.message); }
      if(C.G.flags.fin_mitori && !lost) win++; }
    row.push('Lv'+lv+' '+Math.round(win/N*100)+'%'); }
  console.log('mera', spec||'（いまの 値）', '｜', row.join('  '));

}
