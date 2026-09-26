
module.exports=function(C,V,vm,ctx){
const errs=[]; const log=[];
const U={msg(l,d){ l.forEach(x=>log.push(String(x))); d&&d(); }, menu(i,t,cb){cb(0);}, hud(){}, label(){}, refresh(){}, openTrade(){}};
C.bind(V, U, C.NullAudio);
C.freshState(); C.G.chapter=4; C.party.length=0; ['io','seren','noe'].forEach(k=>C.party.push(C.mkMember(k,22)));
V.init();
const shot=(name)=>{ let t=0; for(let i=0;i<30;i++){ t+=33; try{ V.loop(t);}catch(e){ errs.push(name+': '+e.message); break; } }
  const d=vm.runInContext('__dbg()',ctx); console.log(name.padEnd(14), 'map='+C.P.map.padEnd(10), '3D='+(!d.is2D), 'scene='+d.n); };
try{
  C.P.map='ground'; C.G.mode='field'; C.P.x=53; C.P.y=10; V.buildMap('ground'); V.setActors(true); shot('地上');
  C.G.mode='field'; C.stepField(0,-1); shot('氷窟に入る');
  for(let i=0;i<3;i++){ C.G.mode='field'; C.G.busy=false; C.stepField(0,-1); } shot('氷窟を歩く');
  C.G.mode='field'; C.G.busy=false; C.P.x=10; C.P.y=26; C.stepField(0,1); shot('氷窟から出る');
  C.P.map='well_town'; C.P.x=12; C.P.y=8; V.buildMap('well_town'); V.setActors(true); C.G.mode='field'; C.G.busy=false; C.stepField(0,-1); shot('地下水路に入る');
  const before=vm.runInContext('__dbg()',ctx).n;
  C.setTile('well_cave',11,1,'.'); shot('隔壁があく');
}catch(e){ errs.push('例外: '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')); }
console.log('エラー:', errs.length? errs.join(' / ') : 'なし');
};