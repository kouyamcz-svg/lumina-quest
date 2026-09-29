'use strict';
// ルミナクエストIV / 第5章（蝕まれる大陸）通しテスト
// 使い方： node test/ch5_tour.js
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
C.bind(Object.assign({}, C.NullView, {
        showScene(k){ scene.push('show:'+k); }, hideScene(){ scene.push('hide'); },
        runner(o){ o.done && o.done(); }, runnerClear(){},
       }),
       {msg(l,d){ l.forEach(x=>log.push(x)); d&&d(); },
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

// ===== 0. 第5章を はじめる =====
C.freshState();
C.G.flags.ch4_cleared = true;
C.switchChapter(6);
T('第5章に なる', C.G.chapter===6);
T('章データが ひける', C.chData() && C.chData().id==='ch5_eclipse');
T('はじまりは 下層区', C.P.map==='lower_dist', C.P.map);
T('仲間は 4人', C.party.length===4 && C.party.map(m=>m.cls).join(',')==='io,seren,noe,amane');
T('天空の 鎧の 印', C.G.flags.sky_armor===true);
T('はじめの 目的は 東門の 見張り', /東門の 見張り/.test(C.currentGoal()||''), C.currentGoal());
['pipe_path','old_pipe','tower1'].forEach(m=>T(m+' は 封鎖', C.wardBlocks(m)));
T('光珠炉は まだ 通さない', C.wardBlocks('furnace'));
T('裂け目の広場は 通れる', !C.wardBlocks('rift_yard'));
T('庭園は 通れる', !C.wardBlocks('garden'));
T('庭園に ノエは 立って いない（一行に いる）', C.tileAt('garden',13,5)==='.');
T('裂け目の広場の 穴は 片づいて いる', C.tileAt('rift_yard',9,10)==='.' && C.tileAt('rift_yard',16,9)==='.');
T('ゆりかごの 前に グラン', C.tileAt('cradle',7,4)==='B');

// ===== 0b. 下層区の 人々（危機感）=====
talk('lower_dist', 8, 13, 'back');  T('荷運びの 男（第5章）', said('荷車が 勝手に 転がって'));
talk('lower_dist', 5, 6, 'back');   T('光珠管の 技師（第5章）', said('炉の 鼓動が 乱れて'));
talk('lower_dist', 12, 14, 'back'); T('見習いの 母（第5章）', said('床に、細い ひびが'));
talk('lower_dist', 12, 10, 'back'); T('うわさずきの 男（第5章）', said('城を 出たきり'));
// ===== 0c. 中層区・上層区の 人々（危機感）=====
[['mid_dist',5,6,'back','団長の 机の 書類'],['mid_dist',14,6,'back','上層の 方々が 先に'],['mid_dist',7,12,'front','棚が 全部 片側に'],
 ['mid_dist',3,6,'back','逃げて きた 人を 入れて'],['mid_dist',16,12,'front','花なんて 誰も'],['mid_dist',2,12,'back','上りだけに した'],
 ['upper_dist',9,5,'back','炉の 鼓動が 乱れて いる'],['upper_dist',11,5,'back','上層の 者から だ'],['upper_dist',8,10,'front','花瓶が 全部 割れた'],
 ['upper_dist',4,8,'front','昇降機は 止めた']].forEach(([m,x,y,d,w])=>{ talk(m,x,y,d); T(m+' の 人（第5章）：'+w, said(w), log.join(' / ').slice(0,60)); });
// ===== 1. 東門の 見張り =====
talk('rift_yard', 10, 4, 'back');
T('見張りに 会う 前は 裂け目の 悪夢に 挑めない', !C.G.flags.ch5_riftDown && said('見張りに 様子を 聞こう'), log.join(' / ').slice(0,80));
talk('lower_dist', 18, 6, 'back');
T('見張りが 裂け目を 伝える', C.G.flags.ch5_evac===true && said('北の 広場に また 裂け目'));
T('頼みごとが 始まる', C.G.quests.ch5_q1_gran==='active');
T('目的が 裂け目の広場に', /裂け目の広場/.test(C.currentGoal()||''), C.currentGoal());

// ===== 2. 裂け目の広場 =====
stand('lower_dist', 10, 1, 'back'); C.stepField(0,-1);
T('下層区の 北から 裂け目の広場へ', C.P.map==='rift_yard', C.P.map);
strong(70);
talk('rift_yard', 10, 4, 'back');
T('クラテルを 倒す', C.G.flags.ch5_riftDown===true && said('「クラテル」と 記す'));
T('地の 文に「序章」と 出ない', !said('序章'));
T('クラテルは「この 魔物」', said('この魔物を「クラテル」'));
T('人々は 戦いの 間に 逃げて いる', said('もう 南の 路地へ 逃げた 後') && !said('逃げ遅れた 人々は'));
T('杯の 声は 崩れた 直後', log.findIndex(l=>/崩れた 杯の 底から/.test(l)) < log.findIndex(l=>/迎えに 行こう/.test(l)));
T('倒した 後に メーアの 名が 出る', said('メーア、サマ') && said('名前を、言った'));
T('庭園へ 案内', said('空中庭園へ'));
T('ボスの ますが 消える', C.tileAt('rift_yard',10,3)==='.');

talk('lower_dist', 12, 14, 'back'); T('裂け目の 後の 見習いの 母', said('広場の 子たちを 助けて'));
talk('lower_dist', 8, 13, 'back');  T('裂け目の 後の 荷運びの 男', said('礼を 言いたがってた'));
// ===== 3. 空中庭園 =====
T('炉は まだ 通さない', C.wardBlocks('furnace'));
talk('garden', 9, 3, 'back');
T('摘まれた 花', C.G.flags.ch5_granNews===true && said('一輪だけ 摘んで'));
T('近衛の 報せ', said('単身、光珠炉へ'));
T('奥様と 庭番は 避難', C.tileAt('garden',9,2)==='.' && C.tileAt('garden',5,12)==='.');
T('光珠炉が 開く', !C.wardBlocks('furnace'));

talk('lower_dist', 12, 10, 'back'); T('報せの 後の うわさずきの 男', said('団長が 炉に 入ったって'));
talk('upper_dist', 9, 5, 'back');  T('報せの 後の 炉の 主任', said('半日も もたん'));
talk('upper_dist', 4, 8, 'front'); T('報せの 後の 炉の 技師', said('昇降機が 動いた 跡'));
talk('mid_dist', 2, 12, 'back');   T('裂け目の 後の 石段の 衛兵', said('裂け目を 払ったのは'));
// ===== 4. 光珠炉 =====
stand('upper_dist', 17, 11, 'back'); C.stepField(0,-1);
T('上層区から 光珠炉の 外郭へ', C.P.map==='furnace', C.P.map);
T('外郭の 隔壁は 開いて いる', C.tileAt('furnace',10,6)==='.');
stand('furnace', 10, 6, 'back'); C.stepField(0,-1);
T('炉心の 手前へ', C.P.map==='furnace_core', C.P.map);
talk('furnace_core', 11, 7, 'back');
T('炉心の 壁から ゆりかごの 前へ', C.P.map==='cradle' && said('隔壁が 半分 開いて'), C.P.map+' '+C.P.x+','+C.P.y);
stand('cradle', 7, 9, 'front'); C.stepField(0,1);
T('ゆりかごの 前から 戻れる', C.P.map==='furnace_core', C.P.map);
talk('furnace_core', 11, 7, 'back');
T('何度でも 奥へ 進める', C.P.map==='cradle');
T('ゆりかごの 前の 戦闘の 背景は 屋内', C.MAPS.cradle.bbg==='indoor');
talk('cradle', 7, 2, 'back');
T('ゆりかごの 扉は 開かない', said('今は 開けちゃ いけない'));

// ===== 5. グラン（2形態）=====
strong(70);
talk('cradle', 7, 5, 'back');
T('グランの 台詞', said('堕ちるのが 正しい') && said('守れって 教えた 順番'));
T('第1形態の あと 第2形態へ', said('悪夢を 纏う グランとの 戦い'));
T('グランを 倒す', C.G.flags.ch5_granFell===true && said('いつか 私が 終わらせに 来る'));
T('花が 残る', C.tileAt('cradle',7,4)==='n' && said('花が 一輪だけ'));
T('頼みごとが 片づく 前（花が 残って いる）', /花を 拾う/.test(C.currentGoal()||''), C.currentGoal());

// ===== 6. 花 → 章末 =====
scene.length=0;
talk('cradle', 7, 5, 'back');
T('花を 拾う', C.G.flags.ch5_flower===true && said('花を 拾い上げた'));
T('章末が 出る', said('最後ノ 一頁ガ') && said('第5章　完'));
T('ch5_cleared が たつ', C.G.flags.ch5_cleared===true);
T('章末は まっ暗な 画面に 文字だけ', scene.indexOf('show:__dark')>=0, scene.join(','));
T('章の 終わりで 目的は なくなる', C.currentGoal()===null, C.currentGoal());

// ===== 絵 =====
{
  const actx={console, window:{}}; actx.globalThis=actx; vm.createContext(actx);
  vm.runInContext(fs.readFileSync('assets.js','utf8')+';globalThis.__CHR=CHR;globalThis.__MON=MON;', actx, {filename:'assets.js'});
  const CH=actx.__CHR, MN=actx.__MON, FO=C.ENEMIES||[];
  ['kuroikui','shokumukade','kokujugara'].forEach(k=>{ const e=FO.find(x=>x.key===k); T('敵 '+k+' の 絵', e && MN[e.art]); });
  T('クラテルの 絵', MN.crater && C.MIDBOSS.crater.art==='crater');
  T('色変えの あくむへん（第5章）は 使わない', !MN.akumuhen5 && !C.MIDBOSS.akumuhen5);
  T('グラン 第1形態の 絵（騎士団長）', CH[C.MIDBOSS.gran1.art]);
  T('グラン 第2形態の 絵', CH[C.MIDBOSS.gran2.art]);
  T('床の 花の 絵', CH.granFlower);
}

T('クエスト画面が 章の 途中で 空に ならない', __GAPS.length===0, __GAPS.map(g=>g.from+'（'+g.n+'）').join(' / '));
console.log('\n--- ch5_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
