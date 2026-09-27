'use strict';
// ★場面に いない 人物が 話して いないか ／ 方角つきの 人物が その 方角に 立って いるか
//   ★見つかった もの：
//     ・湧き水の町で 東の 集落長が 西（左）、西の 集落長が 東（右）に 立って いた
//     ・ゼノスと アマネが 山道に いた ころの 台詞が、山道・山頂に 残って いた
//     ・ナミが 浜に 残って いるのに、海蝕洞の 中で 話して いた
const fs=require('fs'), vm=require('vm');
const ctx={console, window:{}, localStorage:undefined}; ctx.globalThis=ctx; vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js']) vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C=vm.runInContext('LQ4',ctx), N=vm.runInContext('NPCDATA',ctx), CHD=vm.runInContext('CHAPTERS_DATA',ctx);
let n=0, ng=0;
function T(name, ok, info){ n++; if(!ok){ ng++; console.log('NG '+name+(info?'   '+info:'')); } }

// ① 方角つきの 人物
Object.keys(N.NPCS).forEach(mp=>{ const m=C.MAPS[mp]; if(!m) return; const W=m.tiles[0].length, H=m.tiles.length;
  (N.NPCS[mp]||[]).forEach(p=>{ const d=(p.name.match(/^(東|西|北|南)の/)||[])[1]; if(!d) return;
    const [x,y]=p.at.split(',').map(Number);
    const ok = d==='東'? x>W/2 : d==='西'? x<W/2 : d==='北'? y<H/2 : y>H/2;
    T(mp+' の '+p.name+' は '+d+' 側に 立つ', ok, '('+x+','+y+') 幅'+W+'×高'+H);
  });
});

// ② ダンジョンの 仕掛け・ボスの 場面で 話す 人
//   その 章で 仲間に いる 人 ＋ その 地図に 立って いる 人 だけ
const PARTY = {1:['イオ','セレン'], 2:['イオ','セレン'], 3:['イオ','セレン','ノエ'], 4:['イオ','セレン','ノエ']};
// アマネは 第3章の 山頂の あと（庵で 加入）から。祠の丘と ルプスだけ
const LATE = {4:{'アマネ':k=>/shrine_hill|^lupus$/.test(k)}};
// ★居合わせた 人（仲間では ない が その 場に いる と 本文に ある）
const PRESENT = {'1:umbra':['ノエ'],   // 「見物に 出ていた 夢守りの 少年」
                 '1:trial_yard:9,4':['試験官'], '1:seren_spar':['試験官']};
const names = mp => [].concat(...(N.NPCS[mp]||[]).map(p=>[p.name, p.name.split(' ').pop(), p.name.replace(/^.*の /,'')]));
const speakers = txt => [...new Set([...txt.matchAll(/(?:^|\n)([^\s「」＊。、\n]{1,8})「/g)].map(m=>m[1]))];
for(const ch of [1,2,3,4]){ const d=CHD.get(ch);
  const scenes=[];
  for(const kind of ['locks','bosses']) Object.keys(d[kind]||{}).forEach(k=>{ const e=d[kind][k];
    scenes.push({k, mp:k.split(':')[0], txt:[].concat(e.lockMsg||[],e.intro||[],e.after||[]).join('\n')}); });
  Object.keys(d.bossReward||{}).forEach(k=>{
    const b=Object.keys(d.bosses||{}).find(bk=>d.bosses[bk].key===k);
    scenes.push({k, mp:b?b.split(':')[0]:'', txt:(d.bossReward[k].msg||[]).join('\n')}); });
  scenes.forEach(sc=>{
    const ok=new Set([].concat(PARTY[ch], names(sc.mp), PRESENT[ch+':'+sc.k]||[]));
    const late=LATE[ch]||{}; Object.keys(late).forEach(nm=>{ if(late[nm](sc.k)) ok.add(nm); });
    // ボスの 名（「この影を」などの 地の文の かけらは のぞく）
    speakers(sc.txt).filter(s=>!/この|その|あの/.test(s)).forEach(s=>{
      T('第'+(ch-1)+'章 '+sc.k+' で 話す '+s+' は その 場に いる', ok.has(s));
    });
  });
}
// ③ 台詞の 話し手（女・男 など）と 絵の 性別が 合う こと
//   ★水汲みの 女・集落の 女が ひげの 男の 絵（villagerB）だった
{
  const femSpr=new Set(['elderWoman','townGirl','priestess','valeElder','amane','seren']);
  const maleSpr=new Set(['villagerA','villagerB','captain','guardA','guardB','butler','elder','zenos','noe']);
  Object.keys(N.NPCS).forEach(mp=>(N.NPCS[mp]||[]).forEach(p=>{
    const fName=/女|娘|母|婆|婦|少女|おばさん/.test(p.name);
    if(fName) T(mp+' の '+p.name+' は 女性の 絵', !maleSpr.has(p.spr), p.spr);
    const txt=JSON.stringify(p.lines||[]);
    [...new Set([...txt.matchAll(/"([^"「」]{1,8})「/g)].map(m=>m[1]))].forEach(sp=>{
      if(/^(女|娘|母|婆|老女|おばさん|婦人|少女)$/.test(sp)) T(mp+' の '+p.name+'（話し手「'+sp+'」）は 女性の 絵', !maleSpr.has(p.spr), p.spr);
      if(/^(男|親父|おやじ|爺|主人|親方)$/.test(sp)) T(mp+' の '+p.name+'（話し手「'+sp+'」）は 男性の 絵', !femSpr.has(p.spr), p.spr);
    });
  }));
}
// ④ 人の 印（n）には かならず 人物の 設定が ある こと
//   ★設定が ないと 既定の 村人の 絵で 立ち、話しかけても「……」だけ だった（8か所）
Object.keys(C.MAPS).forEach(mp=>C.MAPS[mp].tiles.forEach((r,y)=>{
  for(let x=0;x<r.length;x++) if(r[x]==='n') T(mp+' ('+x+','+y+') の 人に 設定が ある', !!N.npcAt(mp,x,y));
}));
// ⑤ 同じ 町に 同じ 顔の 女性が 並ばない こと
Object.keys(N.NPCS).forEach(mp=>{
  const f=(N.NPCS[mp]||[]).filter(p=>/女|娘|母|婆|婦|おばさん|古老/.test(p.name)).map(p=>p.spr);
  const dup=f.filter((k,i)=>f.indexOf(k)!==i);
  T(mp+' に 同じ 顔の 女性が 並ばない', dup.length===0, dup.join(','));
});
// ⑥ 祠の丘：祠の 跡は 石の 台（建てたら 祠）、台詞の「村の 者」が 丘に いる、周りは 石壁で ない
{
  const sh=N.NPCS.shrine_hill||[], ruin=sh.find(p=>p.name==='祠の 跡');
  T('祠の 跡は 石の 台の 絵', ruin && ruin.spr==='shrineRuin', ruin&&ruin.spr);
  T('祠を 建てたら 祠の 絵', ruin && ruin.sprWhen && ruin.sprWhen.flag==='ch3_shrineBuilt' && ruin.sprWhen.spr==='shrine');
  T('祠の丘に 村の 者が いる', sh.some(p=>p.name==='村の 者'));
  T('祠の丘の 周りは 石壁で ない', !C.MAPS.shrine_hill.tiles.join('').includes('#'));
  const V2src=fs.readFileSync('src/view2d.js','utf8');
  T('2D は 物語の 進み具合で 人の 絵を 切りかえる', /e\.sprWhen && C\.G && C\.G\.flags && C\.G\.flags\[e\.sprWhen\.flag\]/.test(V2src));
}
// ⑦ ルプス：ボスらしい 大きさ／地図では 戦う まで ふつうの 狼
{
  const cx={console,window:{}}; cx.globalThis=cx; vm.createContext(cx);
  vm.runInContext(fs.readFileSync('assets.js','utf8'), cx);
  const MON=vm.runInContext('MON', cx);
  T('ルプスの 絵は ボスらしい 高さ（60以上）', MON.lupus && MON.lupus.h>=60, MON.lupus && (MON.lupus.w+'x'+MON.lupus.h));
  T('ルプスの 絵は 同じ 島の はぐれ狼より 大きい', MON.lupus.w*MON.lupus.h > MON.hagureookami.w*MON.hagureookami.h);
  const bi=CHD.get(4).bosses['shrine_hill:10,3'];
  T('祠の丘の 地図では ふつうの 狼（mapArt）', bi && bi.mapArt==='hagureookami' && !!MON.hagureookami);
  const U=fs.readFileSync('src/ui.js','utf8');
  T('状態の 枠が 出て いれば 窓を その 下に 置く', /function placeCmdWin\(\)/.test(U) && /hud\(\); placeCmdWin\(\);/.test(U));
  T('戦闘中は 地名を 隠す', /labelEl\.style\.visibility = inBattle \? 'hidden'/.test(U));
}
console.log('\n--- scene_cast: '+(n-ng)+'/'+n+' 通過 ---');
process.exit(ng?1:0);
