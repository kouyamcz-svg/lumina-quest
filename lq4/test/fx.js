'use strict';
// ルミナクエストIV / 技ごとの 見た目の けんしょう
// 使い方： node test/fx.js
//
// ★書いた りゆう：技も 通常こうげきも おなじ ひとつの えんしゅつ だった ため、
//   画面を 見ても 何を したのか わからなかった。
//   技ごとに 見た目が わりあたって いる ことを 数で 押さえる。
const fs = require('fs'), vm = require('vm');
const ctx = {console, window:{}, localStorage:undefined}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
const D = C.SPELL_DEFS;
const V2 = fs.readFileSync('src/view2d.js','utf8');
const CORE = fs.readFileSync('src/core.js','utf8');

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }

// ① どの 技かを えんしゅつに わたして いる
T('単体技に 技の しるしを わたす', CORE.indexOf("V.fx('spell',{target:t, key:")>=0);
T('全体技に 技の しるしを わたす', CORE.indexOf("V.fx('spellall',{key:")>=0);
T('えんしゅつが しるしを うけとる', V2.indexOf("key:(data && data.key)")>=0);

// ② 見た目の ひょうが ある
const m = V2.match(/const FX_STYLE = \{([\s\S]*?)\n\};/);
T('見た目の ひょうが ある', !!m);
const styled = new Set();
if(m) (m[1].match(/^\s{2}([a-z_]+):/gm)||[]).forEach(x=>styled.add(x.trim().replace(':','')));
T('見た目が 5つ いじょう ある', styled.size>=5, ''+styled.size);

// ③ イオ・セレンの ダメージ技には 見た目が ある
['io','seren'].forEach(cls=>{
  C.CLASSES[cls].learns.forEach(l=>{
    const sp = D[l.key];
    if(!sp || (sp.type!=='dmg' && sp.type!=='dmgall')) return;
    T(C.CLASSES[cls].name+'：技「'+sp.name+'」に 見た目が ある', styled.has(l.key), l.key);
  });
});

// ④ 見た目が みんな 同じでは 意味が ない
if(m){
  const body = m[1];
  const slashes = new Set((body.match(/slash:'[a-z]+'/g)||[]).map(x=>x));
  const cols    = new Set((body.match(/col:\[[^\]]*\]/g)||[]).map(x=>x));
  T('切りかたが 3しゅるい いじょう ある', slashes.size>=3, ''+slashes.size);
  T('色づかいが 5しゅるい いじょう ある', cols.size>=5, ''+cols.size);
}

// ⑤ 技の しるし（key）が 技オブジェクトに 入って いる
['io','seren'].forEach(cls=>{
  const mem = C.mkMember(cls, 40);
  const sp = C.knownSpells(mem);
  T(C.CLASSES[cls].name+'：技に しるしが ついて いる',
    sp.length>0 && sp.every(x=>!!x.key), JSON.stringify(sp.slice(0,1)));
});

console.log('\n--- fx: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
