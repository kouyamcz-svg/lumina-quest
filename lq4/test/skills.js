'use strict';
// ルミナクエストIV / 技が つかう だけの ねうちが あるか
// 使い方： node test/skills.js
//
// ★書いた りゆう：技の いりょくが 固定値だった ため、レベルと 装備で
//   のびる 通常こうげきに 追いこされ、MPを 払って 弱く なって いた。
//   「技は いつでも 通常より 強い」を 数で 押さえる。
const fs = require('fs'), vm = require('vm');
const ctx = {console, window:{}, localStorage:undefined}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
const D = C.SPELL_DEFS;

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }

// その Lvで もちうる 武器（章の 店の 品を めやすに）
const WEAP = lv => lv<8 ? 4 : lv<14 ? 9 : lv<22 ? 14 : 20;
const atkOf = (m)=> m.batk + (m.weapon ? m.weapon.v : 0);
const expect = (m,s)=> ((s.min+s.max)/2) + atkOf(m)*(s.pw||0);

['io','seren'].forEach(cls=>{
  const cl = C.CLASSES[cls];
  for(let lv=3; lv<=40; lv+=1){
    const m = C.mkMember(cls, lv);
    const wv = WEAP(lv);
    m.weapon = {kind:'w', name:'w', v:wv};
    const a = atkOf(m);
    const norm = Math.max(1, a - 7);                 // てきの 守備 15 の とき
    const learned = cl.learns.filter(l=>l.lv<=lv).map(l=>D[l.key]).filter(Boolean);
    const single = learned.filter(s=>s.type==='dmg');
    if(!single.length) continue;
    // ① いちばん 強い 技は 通常より 強い
    const best = single.map(s=>expect(m,s)).sort((x,y)=>y-x)[0];
    T(cl.name+' Lv'+lv+'：いちばん 強い 技が 通常より 強い',
      best > norm*1.15, '技'+Math.round(best)+' / 通常'+norm);
    // ② どの 技も 通常を 下まわらない（つかい道の ない 技を つくらない）
    single.forEach(s=>{
      T(cl.name+' Lv'+lv+'：技「'+s.name+'」が 通常より 弱く ない',
        expect(m,s) >= norm, Math.round(expect(m,s))+' / '+norm);
    });
    // ③ MPが つづく（いちばん 安い 技を 5回は 撃てる）
    const cheap = single.map(s=>s.mp).sort((x,y)=>x-y)[0];
    T(cl.name+' Lv'+lv+'：安い 技を 5回は 撃てる', m.maxmp >= cheap*5,
      'MP'+m.maxmp+' / '+cheap);
  }
});

// ④ 序盤に 「打撃いがいの 手」が ある
[['io',6],['seren',6],['io',12],['seren',12]].forEach(([cls,lv])=>{
  const ls = C.CLASSES[cls].learns.filter(l=>l.lv<=lv).map(l=>D[l.key]).filter(Boolean);
  T(C.CLASSES[cls].name+' Lv'+lv+'：手が 2つ いじょう ある', ls.length>=2, ''+ls.length);
  const kinds = new Set(ls.map(s=>s.type));
  T(C.CLASSES[cls].name+' Lv'+lv+'：ダメージ いがいの 手も ある',
    kinds.size>=2, [...kinds].join(' '));
});

// ⑤ 自動戦闘で 技が えらばれる
{
  const log=[];
  C.bind(C.NullView, {msg(l,d){ l.forEach(x=>log.push(String(x))); d&&d(); },
                      menu(i,t,cb){cb(0);}, hud(){}, label(){}}, C.NullAudio);
  const used = new Set();
  for(let i=0;i<30;i++){
    C.freshState(); C.G.chapter=2; C.G.tactic='gungan'; C.party.length=0;
    const io=C.mkMember('io',12), se=C.mkMember('seren',12);
    io.weapon={kind:'w',name:'w',v:9}; se.weapon={kind:'w',name:'w',v:11};
    C.party.push(io); C.party.push(se);
    log.length=0; C.P.map='old_pipe'; C.G.mode='field'; C.startBattle('oboro');
    log.forEach(l=>{ ['連斬','二段突き','陽炎突き','兜割り','鎧通し'].forEach(x=>{
      if(l.indexOf(x)>=0) used.add(x); }); });
  }
  T('自動戦闘で 技を つかう', used.size>0, [...used].join(' '));
}

console.log('\n--- skills: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
