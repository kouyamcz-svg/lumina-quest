'use strict';
// ルミナクエストIV / inflict・buff の 戦闘検証（M0 完了じょうけん）
// 使い方： node test/battle_inflict.js
// ※ NullUI は menu に そくじ 0ばんで こたえる ため、startBattle を よぶと
//   せんとうが さいごまで はしって しまう。ここでは G.battle を てで くみ、
//   memberAct / enemyAct / beginRound を 1てずつ たたいて しくみを ためす。
const fs = require('fs'), vm = require('vm');
const ctx = {console, window:{}, localStorage:undefined}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
C.bind(C.NullView, C.NullUI, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }

const SP_SLEEP  = {name:'まどろみ',      mp:4, type:'inflict', st:'sleep', p:1.0};
const SP_SLOWA  = {name:'ゆめおもり',    mp:6, type:'inflict', st:'slow',  p:1.0, all:true};
const SP_SHIELD = {name:'ひかりの たて', mp:5, type:'buff', stat:'def', mul:1.30, turns:3, all:true};
const SP_SWORD  = {name:'ひかりの つるぎ',mp:6, type:'buff', stat:'atk', mul:1.25, turns:3};

function mkFoe(name, over){
  return Object.assign({key:'testfoe', name, dispName:name, hp:200, maxhp:200,
                        atk:20, def:10, agi:10, status:null}, over||{});
}
function setup(foes){
  C.freshState();
  C.party.length = 0; C.reserve.length = 0;
  C.party.push(C.mkMember('io', 10));
  C.party.push(C.mkMember('noe', 10));
  C.party.forEach(p=>{ p.mp = 99; p.buffs = null; p.status = null; });
  C.G.tactic = 'manual';
  C.G.mode = 'battle';
  C.G.battle = {enemies: foes, named:null, round:1, order:[], queue:[], fled:false};
  return C.G.battle;
}

// ============ 1. inflict：たんたい ============
let b = setup([mkFoe('てきA'), mkFoe('てきB')]);
C.memberAct({actor:C.party[0], type:'spell', sp:SP_SLEEP, tgt:b.enemies[0]}, ()=>{});
T('inflict：ねむらせられる', b.enemies[0].status==='sleep', 'status='+b.enemies[0].status);
T('inflict：ほかの てきには かからない', b.enemies[1].status===null);
T('inflict：MPを つかう', C.party[0].mp === 99 - SP_SLEEP.mp, 'mp='+C.party[0].mp);

let acted = false;
const hpBefore = C.party.map(p=>p.hp);
C.enemyAct(b.enemies[0], ()=>{ acted = true; });
T('ねむった てきは こうどうしない', acted && C.party.every((p,i)=>p.hp===hpBefore[i]));

// ============ 2. inflict：ぜんたい ＋ slow で すばやさ はんげん ============
b = setup([mkFoe('てきA'), mkFoe('てきB'), mkFoe('てきC')]);
C.memberAct({actor:C.party[0], type:'spell', sp:SP_SLOWA}, ()=>{});
T('inflict(all)：ぜんいんに かかる', b.enemies.every(e=>e.status==='slow'),
  b.enemies.map(e=>e.status).join(','));
T('slow：すばやさ はんげん', C.eEffAgi(b.enemies[0]) === b.enemies[0].agi*0.5);

// ============ 3. ボスは かかりにくい（p はんげん）／immune ============
{
  const boss = mkFoe('ボス', {boss:true});
  let hit = 0;
  for(let i=0;i<4000;i++) if(C.inflictHit(boss, 'sleep', 0.5)) hit++;
  const rate = hit/4000;
  T('ボスは p はんげん（'+rate.toFixed(3)+'）', rate>0.225 && rate<0.275);
  let hit2 = 0;
  const mob = mkFoe('ざこ');
  for(let i=0;i<4000;i++) if(C.inflictHit(mob, 'sleep', 0.5)) hit2++;
  T('ざこは そのまま（'+(hit2/4000).toFixed(3)+'）', hit2/4000>0.475 && hit2/4000<0.525);
  T('immune：まったく きかない', !C.inflictHit(mkFoe('無効', {immune:true}), 'sleep', 1.0));
  T('immuneSt：しゅるいべつに むこう',
    !C.inflictHit(mkFoe('無効', {immuneSt:['sleep']}), 'sleep', 1.0) &&
     C.inflictHit(mkFoe('無効', {immuneSt:['sleep']}), 'slow', 1.0));
}

// ============ 3.5 st2：1つめが かからなかったら 2つめ（とこよの ゆめ）============
{
  const SP_TOKOYO = C.SPELL_DEFS.tokoyo;
  T('とこよの ゆめに st2 が ある', SP_TOKOYO && SP_TOKOYO.st==='sleep' && SP_TOKOYO.st2==='slow');

  // 1つめ かならず あたる → ねむり
  b = setup([mkFoe('てき')]);
  C.memberAct({actor:C.party[0], type:'spell',
    sp:{name:'x', mp:1, type:'inflict', st:'sleep', st2:'slow', p:1.0}}, ()=>{});
  T('st2：1つめが あたれば ねむり', b.enemies[0].status==='sleep', b.enemies[0].status);

  // 1つめ ぜったい はずれ → 2つめ（にぶり）
  b = setup([mkFoe('てき')]);
  C.memberAct({actor:C.party[0], type:'spell',
    sp:{name:'x', mp:1, type:'inflict', st:'sleep', st2:'slow', p:0.0, p2:1.0}}, ()=>{});
  T('st2：1つめが はずれたら にぶり', b.enemies[0].status==='slow', b.enemies[0].status);

  // すでに ねむって いる → 2つめに まわる
  b = setup([mkFoe('てき')]);
  b.enemies[0].status = 'sleep';
  C.memberAct({actor:C.party[0], type:'spell',
    sp:{name:'x', mp:1, type:'inflict', st:'sleep', st2:'slow', p:1.0, p2:1.0}}, ()=>{});
  T('st2：すでに ねむって いれば にぶりへ', b.enemies[0].status==='slow', b.enemies[0].status);

  // どちらも はずれ
  b = setup([mkFoe('てき')]);
  C.memberAct({actor:C.party[0], type:'spell',
    sp:{name:'x', mp:1, type:'inflict', st:'sleep', st2:'slow', p:0.0, p2:0.0}}, ()=>{});
  T('st2：どちらも はずれたら なにも つかない', b.enemies[0].status===null, b.enemies[0].status);

  // ぜんたい＋st2：ぜんいんに どちらかが つく
  b = setup([mkFoe('A'), mkFoe('B'), mkFoe('C')]);
  C.memberAct({actor:C.party[0], type:'spell',
    sp:{name:'x', mp:1, type:'inflict', st:'sleep', st2:'slow', p:0.5, p2:1.0, all:true}}, ()=>{});
  T('st2(all)：ぜんいんに どちらかが つく',
    b.enemies.every(e=>e.status==='sleep'||e.status==='slow'),
    b.enemies.map(e=>e.status).join(','));
}

// ============ 4. buff：ぜんたい・たんたい・きげん ============
b = setup([mkFoe('てき')]);
b.round = 1;
const defBefore = C.party.map(p=>C.mDef(p));
C.memberAct({actor:C.party[1], type:'spell', sp:SP_SHIELD}, ()=>{});
T('buff(all)：ぜんいんに つく', C.party.every(p=>p.buffs && p.buffs.def));
T('buff：しゅびりょくが あがる',
  C.party.every((p,i)=> C.mDef(p) > defBefore[i]),
  C.party.map((p,i)=>defBefore[i]+'→'+C.mDef(p)).join(' '));
const atkBefore = C.mAtk(C.party[0]);
C.memberAct({actor:C.party[1], type:'spell', sp:SP_SWORD, tgt:C.party[0]}, ()=>{});
T('buff(たんたい)：えらんだ ひとだけ',
  !!C.party[0].buffs.atk && !C.party[1].buffs.atk);
T('buff：こうげきりょくが あがる', C.mAtk(C.party[0]) > atkBefore,
  atkBefore+'→'+C.mAtk(C.party[0]));
T('buff きげん until = round + turns', C.party[0].buffs.atk.until === 1+3);

b.round = 4;            // beginRound で 5 に なる → until(4) < 5 で きれる
C.beginRound();
T('buff：きげんぎれで きえる',
  !C.party[0].buffs || !C.party[0].buffs.atk, JSON.stringify(C.party[0].buffs));

// ============ 5. てきの じょうたいも さめる（beginRound） ============
{
  const foes = [mkFoe('てきA'), mkFoe('てきB'), mkFoe('てきC'), mkFoe('てきD'),
                mkFoe('てきE'), mkFoe('てきF'), mkFoe('てきG'), mkFoe('てきH')];
  setup(foes);
  foes.forEach(e=>{ e.status = 'sleep'; });
  // beginRound は そのまま ラウンドを さいごまで はしらせる ため、
  // まいかい せんとうを くみなおして 「さめる はんてい」だけを かぞえる。
  let rounds = 0;
  while(foes.some(e=>e.status) && rounds < 60){
    foes.forEach(e=>{ e.hp = e.maxhp; });
    C.G.mode = 'battle';
    C.G.battle = {enemies: foes, named:null, round:1, order:[], queue:[], fled:false};
    C.beginRound();
    rounds++;
  }
  T('てきの ねむりは いつか さめる（'+rounds+'ラウンド）',
    foes.every(e=>e.status===null), foes.map(e=>e.status).join(','));
}

// ============ 6. せんとうご・せんとうまえに のこらない ============
b = setup([mkFoe('てき')]);
C.memberAct({actor:C.party[0], type:'spell', sp:SP_SHIELD}, ()=>{});
C.party[0].status = 'confuse';
C.endBattle(false);
T('せんとうご：バフが きえる', C.party.every(p=>!p.buffs));
T('せんとうご：じょうたいが きえる', C.party.every(p=>!p.status));

console.log('\n--- battle_inflict: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
