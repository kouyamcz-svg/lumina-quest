module.exports=function(C,V,vm,ctx){
const errs=[]; const log=[];
const U={msg(l,d){ l.forEach(x=>log.push(String(x))); d&&d(); }, menu(i,t,cb){cb(0);}, hud(){}, label(){}, refresh(){}, openTrade(){}};
C.bind(V, U, C.NullAudio);
C.freshState(); C.G.chapter=4; C.party.length=0; ['io','seren','noe','amane'].forEach(k=>C.party.push(C.mkMember(k,32)));
['ch3_landed','ch3_iceDone','ch3_caravan','ch3_twoHouses','ch3_zenosTold','ch3_zenosMet','ch3_peakCleared','ch3_mountEar'].forEach(f=>C.G.flags[f]=true);
V.init();
const frames=(name)=>{ let t=0; for(let i=0;i<30;i++){ t+=33; try{ V.loop(t);}catch(e){ errs.push(name+': '+e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | ')); break; } } };
try{
  C.G.ship={x:73, y:12}; C.G.aboard=false;   // 東の 島の 北端に 舟を 繋いだ 状態
  [['toros',48,31],['coral_bay',54,59],['shrine_hill',53,32]].forEach(([m,x,y])=>{
    C.P.map='ground'; C.G.mode='field'; C.P.x=x; C.P.y=y; V.buildMap('ground'); V.setActors(true); frames('地上');
    C.G.mode='field'; C.G.busy=false; C.stepField(0,-1); frames(m+' へ 入る');
    console.log('入った:', m, '→', C.P.map);
  });
  C.P.map='ground'; C.P.x=72; C.P.y=12; V.buildMap('ground'); V.setActors(true); frames('地上（舟の そば）');
  console.log('いま:', C.P.map, C.P.x, C.P.y, 'mode', C.G.mode);
  for(let i=0;i<3;i++){ C.G.mode='field'; C.G.busy=false; try{ C.stepField(0,-1); }catch(e){ errs.push('歩く: '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')); } frames('歩く'+i); }
}catch(e){ errs.push('例外: '+e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | ')); }
console.log('メッセージ:', log.slice(0,6).join(' / '));
console.log('エラー:', errs.length? errs.join('\n       ') : 'なし');
};
