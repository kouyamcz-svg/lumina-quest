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

// ★なかまごとの 役わりが かぶって いない こと。
//   ★ノエは 攻撃呪文を ひとつも 覚えず、回復が いらない 場面で
//     手持ち無沙汰に なって いた。かと いって 光の術（アマネ）より
//     強く すると、アマネの 立場が なくなる。
{
  const atkOf2 = (m)=> m.batk + (m.weapon ? m.weapon.v : 0);
  const top = (cls, lv, ty)=>{
    const m = C.mkMember(cls, lv);
    m.weapon = {kind:'w', name:'w', v:9};
    const ls = C.CLASSES[cls].learns.filter(l=>l.lv<=lv)
                 .map(l=>D[l.key]).filter(x=>x && x.type===ty);
    if(!ls.length) return 0;
    return Math.max.apply(null,
      ls.map(x=>((x.min+x.max)/2) + atkOf2(m)*(x.pw||0)));
  };
  // ① ノエは せめ手を もつ（第2章の ころには 使える）
  T('ノエが 攻撃呪文を 覚える', top('noe',13,'dmg') > 0, '手が ない');
  T('ノエの せめが 通常こうげきより 強い', (()=>{
    const m = C.mkMember('noe',17); m.weapon={kind:'w',name:'w',v:9};
    return top('noe',17,'dmg') > atkOf2(m)-7;
  })(), 'つかう いみが ない');
  // ② まっすぐな 火力は アマネの 役目
  [25,40].forEach(lv=>{
    T('Lv'+lv+'：単体の 火力は アマネが 上',
      top('amane',lv,'dmg') >= top('noe',lv,'dmg'),
      'ノエ '+Math.round(top('noe',lv,'dmg'))+' / アマネ '+Math.round(top('amane',lv,'dmg')));
  });
  // ③ ノエの せめには 状態いじょうが そえて ある（削り役）
  {
    const ls = C.CLASSES.noe.learns.map(l=>D[l.key])
                 .filter(x=>x && (x.type==='dmg'||x.type==='dmgall'));
    T('ノエの せめに 状態いじょうが そえて ある',
      ls.some(x=>x.inflict), '削り役に なって いない');
  }
}

console.log('\n--- skills: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
