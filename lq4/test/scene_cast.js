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
console.log('\n--- scene_cast: '+(n-ng)+'/'+n+' 通過 ---');
process.exit(ng?1:0);
