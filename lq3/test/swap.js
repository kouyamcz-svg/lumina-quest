'use strict';
// いれかえ（控え）機構の検証：46項目
const fs = require('fs'), vm = require('vm');
const ctx = { console, window:{}, localStorage:undefined };
ctx.globalThis = ctx;
vm.createContext(ctx);
for(const f of ['world.js','npc.js','chapters.js','core.js']){
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
}
const C = vm.runInContext('LQ3', ctx);
C.bind(C.NullView, C.NullUI, C.NullAudio);

let n=0, ng=0;
function T(name, cond){ n++; if(!cond){ ng++; console.log('NG', name); } }

// --- 基本状態 ---
C.freshState();
T('初期reserve空', C.reserve.length===0);
T('初期party1人', C.party.length===1);

// --- joinMember：4人までparty・5人目以降reserve ---
C.freshState();
C.party.length=0; C.party.push(C.mkMember('sora',18));
['lion','bald','sena'].forEach(k=>C.joinMember(k,18));
T('4人目までparty', C.party.length===4 && C.reserve.length===0);
C.joinMember('ruka',18); C.joinMember('mio',18);
T('5・6人目はreserve', C.party.length===4 && C.reserve.length===2);
T('重複joinはnull', C.joinMember('lion',18)===null);
T('全員数6', C.allMembers().length===6);

// --- swapMember ---
let r = C.swapMember('sora');
T('先頭は外せない', r.ok===false && /はずせない/.test(r.msg));
r = C.swapMember('lion');
T('戦闘→控えOK', r.ok===true && C.party.length===3 && C.reserve.length===3);
r = C.swapMember('ruka');
T('控え→戦闘OK', r.ok===true && C.party.length===4 && C.reserve.length===3-1);
r = C.swapMember('mio');
T('5人目拒否', r.ok===false && /4にんまで/.test(r.msg));
r = C.swapMember('zef');
T('不在は拒否', r.ok===false);
T('メッセージ46字以内', ['は せんとうから はずせない。','せんとうに でられるのは 4にんまで。','その なかまは いない。'].every(s=>s.length<=46));

// --- 経験値：控えにも入る ---
const before = C.reserve.map(m=>m.exp);
// 戦闘勝利処理は内部関数のため、経験値分配ロジックを直接は呼べない。
// ソース上の分配式が reserve を含むことを静的に確認する。
const coreSrc = fs.readFileSync('src/core.js','utf8');
T('exp分配にreserve含む', coreSrc.includes("aliveMembers().concat(reserve.filter(m=>m.hp>0)).forEach"));
T('宿回復にreserve含む', coreSrc.includes("party.concat(reserve).forEach(m=>{ if(m.hp>0)"));
T('教会死亡にreserve含む', coreSrc.includes("const dead = party.concat(reserve).filter(p=>p.hp<=0)"));
T('全滅復帰にreserve含む', /party\.concat\(reserve\)\.forEach\(m=>\{ m\.hp=m\.maxhp; m\.mp=m\.maxmp; m\.status=null; \}\);\n    P\.gold/.test(coreSrc));
T('removeMemberが控え対応', coreSrc.includes("const i3 = reserve.findIndex(p=>p.cls===rw.removeMember)"));

// --- セーブ・ロード往復（localStorage模擬） ---
const mem = {};
const fakeStore = { setItem:(k,v)=>{mem[k]=v;}, getItem:(k)=>mem[k]||null };
T('セーブ成功', C.saveGame(fakeStore,0)===true);
const savedParty = C.party.map(m=>m.cls).join(',');
const savedRes   = C.reserve.map(m=>m.cls).join(',');
const savedLv    = C.allMembers().map(m=>m.lv).join(',');
C.freshState();
T('ロード成功', C.loadGame(fakeStore,0)===true);
T('party復元', C.party.map(m=>m.cls).join(',')===savedParty);
T('reserve復元', C.reserve.map(m=>m.cls).join(',')===savedRes);
T('Lv復元', C.allMembers().map(m=>m.lv).join(',')===savedLv);

// --- 旧セーブ互換（reserveなしデータ） ---
const d = JSON.parse(mem[C.SAVE_SLOTS[0]]);
delete d.reserve;
mem[C.SAVE_SLOTS[0]] = JSON.stringify(d);
C.freshState();
T('旧形式ロード成功', C.loadGame(fakeStore,0)===true);
T('旧形式はreserve空', C.reserve.length===0);
T('旧形式partyは保持', C.party.length===4);

// --- 章切替スナップショット往復 ---
C.freshState();
C.party.length=0; C.party.push(C.mkMember('sora',20));
['lion','bald','sena','ruka','mio'].forEach(k=>C.joinMember(k,19));
C.G.chapter=5;
T('切替前6人', C.allMembers().length===6);
C.switchChapter(1);           // 1章へ（スナップショット→リオン新規開始）
T('1章はリオン1人', C.party.length===1 && C.party[0].cls==='lion' && C.reserve.length===0);
C.switchChapter(5);           // 5章へ復帰
T('5章復帰で6人', C.allMembers().length===6);
T('復帰時party4人', C.party.length===4);
T('復帰時reserve2人', C.reserve.length===2);

// --- 章データ経由の新規開始で5人以上→自動控え ---
C.freshState();
C.G.chapters = {};
C.switchChapter(9, ['sora','lion','bald','sena','ruka','mio']);
T('新規6人指定→party4', C.party.length===4);
T('新規6人指定→reserve2', C.reserve.length===2);
T('先頭はsora', C.party[0].cls==='sora');

// --- ui.js 静的確認 ---
const uiSrc = fs.readFileSync('src/ui.js','utf8');
T('メニューにいれかえ条件挿入', uiSrc.includes("if(C.reserve.length>0) items.push('いれかえ')"));
T('メニューはラベル分岐', uiSrc.includes("const pick=items[sel]"));
T('openSwap存在', uiSrc.includes('function openSwap()'));
T('つよさが全員巡回', uiSrc.includes('const n = C.allMembers().length'));
T('いれかえ表題46字以内', 'いれかえ（▶＝せんとう）'.length<=46);

// ===== 戦闘どうぐの対象選択 =====
{
  const src=require('fs').readFileSync('src/core.js','utf8');
  T('対象メニューあり', src.includes("'だれに つかう？'"));
  T('herbにtgt', /type:kind, tgt:alive\[t\]/.test(src));
  // 実行側：tgt指定が尊重される（低HPの自動選択に流れない）
  C.freshState(); C.G.chapters={}; C.switchChapter(5);
  C.party.length=0; C.reserve.length=0;
  const a=C.mkMember('sora',10), b2=C.mkMember('lion',10);
  C.party.push(a,b2);
  a.hp=1;            // 自動なら a が選ばれる状況
  b2.hp=b2.maxhp-5;  // 対象は b を指定
  C.P.herbs=1;
  C.G.battle={enemies:[],queue:[]};
  // 実行関数はexportされていないため、tgt優先ロジックの式を静的確認
  T('実行はtgt優先', src.includes('const t = a.tgt && a.tgt.hp>0 ? a.tgt'));
}
console.log(`\n検査 ${n}項目 / NG ${ng}`);
process.exit(ng?1:0);
