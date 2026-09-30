'use strict';
// ルミナクエストIV / 終章（夢の内界）通しテスト
// 使い方： node test/fin_tour.js
const fs = require('fs'), vm = require('vm');
const store = {};
const fakeLS = {getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);},
                removeItem:k=>{delete store[k];}};
const ctx = {console, window:{}, localStorage:fakeLS}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);

const log=[], scene=[];
let __built=null; const allLog=[];
C.bind(Object.assign({}, C.NullView, {
        showScene(k){ scene.push('show:'+k); }, hideScene(){ scene.push('hide'); },
        runner(o){ o.done && o.done(); }, runnerClear(){},
        buildMap(m){ __built=m; },
       }),
       {msg(l,d){ l.forEach(x=>{ log.push(x); allLog.push(x); }); d&&d(); },
        menu(i,t,cb){ cb(t==='これから' ? 1 : 0); },
        hud(){}, label(){}, openTrade(){}}, C.NullAudio);

let n=0, ng=0;
// ★クエスト画面が 空に なる 区間を はかる（章の 途中で「やることが ない」に ならない こと）
//   ★第0〜3章の すべてで、章の はじめ・地方の あいだ・ボスの あとに 空に なって いた。
const __GAPS=[]; let __gap=null;
function __probeQuest(name){ try{
  const ch=C.G.chapter; const q=C.questList().length, g=C.currentGoal&&C.currentGoal();
  const cleared=Object.keys(C.G.flags).some(k=>/_cleared$/.test(k)&&C.G.flags[k]&&k.startsWith('ch'+(ch-1)+'_'));
  if(!q && !g && !cleared && C.G.mode!=='battle'){ if(!__gap){ __gap={from:name,n:0}; __GAPS.push(__gap);} __gap.n++; } else __gap=null;
}catch(e){} }
function T(name, cond, detail){ __probeQuest(String(name)); n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>String(l).indexOf(w)>=0); }
function clearLog(){ log.length=0; }
function stand(map,x,y,dir){ C.G.mode='field'; C.P.map=map; C.P.x=x; C.P.y=y; if(dir) C.P.dir=dir; }
function talk(map,x,y,dir){ clearLog(); stand(map,x,y,dir); C.interact(); }
//   下層区 → 東門の 見張り → 裂け目の広場（あくむへん）→ 空中庭園（摘まれた 花・近衛）→
//   光珠炉の 外郭 → 炉心の 手前 → ゆりかごの 前（グラン 2形態）→ 床の 花 → 章末
function strong(lv){
  C.party.length=0;
  ['io','seren','noe','amane'].forEach((k,j)=>{ const m=C.mkMember(k,lv); m.weapon={kind:'w',name:'w',v:[26,28,16,16][j]}; m.armor={kind:'a',name:'a',v:[34,25,19,19][j]}; C.party.push(m); });
}


// ===== 0. 終章を はじめる =====
C.freshState();
C.G.flags.ch5_cleared = true;
C.switchChapter(7);
T('終章に なる', C.G.chapter===7 && C.chData().id==='fin_dream');
T('はじまりは 神殿の 最奥', C.P.map==='temple', C.P.map);
T('仲間は 4人', C.party.length===4);
T('はじめの 目的は 白竜', /白竜/.test(C.currentGoal()||''), C.currentGoal());
['archive1','cradle','furnace','rift_yard'].forEach(m=>T(m+' は 封鎖', C.wardBlocks(m)));

// ===== 1. 白竜の 背で 夢へ =====
scene.length=0;
talk('temple', 8, 4, 'back');
T('白竜に 乗って 夢の 内界へ', C.G.flags.fin_dive===true && C.P.map==='dream1', C.P.map);
T('白竜の 背で 夢へ の 一枚絵', scene.indexOf('show:scene_fin_fly')>=0, scene.join(','));
stand('dream1', 7, 9, 'front'); C.stepField(0,1);
T('夢から 神殿へ 戻れる', C.P.map==='temple', C.P.map);
talk('temple', 8, 4, 'back');
T('何度でも 夢へ', C.P.map==='dream1');

// ===== 2. 四季 =====
[['dream1',3,4,'麦を まく','dream2'],['dream2',4,5,'珊瑚','dream3'],['dream3',3,7,'守る 剣に なる','dream4'],['dream4',4,4,'春は 必ず','dream_depths']].forEach(([m,x,y,w,nx])=>{
  talk(m,x,y,'back'); T(m+' の 人', said(w));
  stand(m,7,1,'back'); C.stepField(0,-1);
  T(m+' から '+nx+' へ', C.P.map===nx, C.P.map);
});
T('夢の 底に 着いた 印', C.G.flags.fin_depths===true);
['春','夏','秋','冬'].forEach(k=>T('はじめて 入った ときに 季節が 出る：'+k, allLog.includes('── 夢の 内界　'+k+' ──')));
T('季節の 文は 一度だけ（春は 2回 入った）', allLog.filter(l=>l==='── 夢の 内界　春 ──').length===1);
T('目的が メーアに', /メーア/.test(C.currentGoal()||''), C.currentGoal());

// ===== 3. メーア（3形態）→ 看取り =====
strong(80);
talk('dream_depths', 7, 6, 'back');
T('メーアの 台詞', said('裏ノ頁') && said('誰ガ 看ル'));
T('装丁 → 乱丁 → 白紙', said('＊ 乱丁 ＊') && said('＊ 白紙 ＊') && said('魔王の 姿に'));
T('白紙は 倒さず 看取る', C.G.flags.fin_mitori===true && said('武器を 収めた') && said('看取ります') && !log.some(l=>/〈白紙〉を 倒した/.test(l)), log.filter(l=>/白紙/.test(l)).join(' / ').slice(0,120));
T('眠る 子が 現れる', C.tileAt('dream_depths',7,5)==='n');
talk('dream_depths', 7, 6, 'back');
T('ヴォクスに 会う', C.G.flags.fin_vox===true && said('ヴォクス「……おにいちゃんたち'));
T('約束', said('もう、わるいゆめを すてないで') && said('約束する'));
T('夢の 外（神殿）へ 戻る', C.P.map==='temple', C.P.map);
T('目的が 白竜に', /白竜/.test(C.currentGoal()||''), C.currentGoal());

// ===== 4. 決断 → 最後の 夜 =====
talk('temple', 8, 4, 'back');
T('白竜と 長老会の 決断', C.G.flags.fin_decide===true && said('雲の 上へ 引き上げる') && said('最後の 夢守り'));
T('夢へは 入らず 鍛冶場へ', C.P.map==='home_forge', C.P.map);
T('目的が 道具棚', /道具棚/.test(C.currentGoal()||''), C.currentGoal());
scene.length=0;
talk('home_forge', 11, 7, 'back');
T('天空鋼の 剣', C.G.flags.fin_sword===true && said('父さん、打てたよ'));
T('鍛冶場の 一枚絵', scene.indexOf('show:scene_fin_forge')>=0, scene.join(','));
T('結末：引き上げ・降下・扉・祠・千年後', said('雲海の 上へ 昇って') && said('五つの 土地へ') && said('「扉」と 呼ばれる') && said('祠に 納めた') && said('千年後') && said('ゆっくりと 引き抜いた'));
T('結末：真っ暗 → 千年後の 祠の 一枚絵 → 真っ暗', (()=>{ const a=scene.indexOf('show:__dark'), b=scene.indexOf('show:scene_fin_shrine'), c=scene.lastIndexOf('show:__dark'); return a>=0 && b>a && c>b; })(), scene.join(','));
T('完結の 文', said('完結') && !said('めざめの あさ'));
T('ch6_cleared', C.G.flags.ch6_cleared===true);
T('終わった あと 目的は ない', C.currentGoal()===null, C.currentGoal());

// ===== 看取りの 仕組み：HPが 決めた 割合を 下回った ところで 止まる =====
{
  C.G.flags.fin_mitori=false; C.G.mode='field'; C.P.map='dream_depths';
  C.startBattle('mera3');
  T('看取りで 戦いが 終わる', C.G.flags.fin_mitori===true);
}
{
  const actx={console, window:{}}; actx.globalThis=actx; vm.createContext(actx);
  vm.runInContext(fs.readFileSync('assets.js','utf8')+';globalThis.__CHR=CHR;globalThis.__MON=MON;', actx, {filename:'assets.js'});
  const CH=actx.__CHR, MN=actx.__MON;
  ['mera1','mera2','mera3'].forEach(k=>T(k+' は 正式な 絵', C.MIDBOSS[k].art===k && MN[k] && !MN['meraTmp'+k.slice(-1)]));
  T('眠る 子は ヴォクスの 絵', CH.vox && C.NPCDATA ? true : !!CH.vox);
  ['scene_fin_fly','scene_fin_forge','scene_fin_shrine'].forEach(k=>T('一枚絵 '+k, MN[k] && MN[k].w===192));
}
T('クエスト画面が 章の 途中で 空に ならない', __GAPS.length===0, __GAPS.map(g=>g.from+'（'+g.n+'）').join(' / '));
console.log('\n--- fin_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
