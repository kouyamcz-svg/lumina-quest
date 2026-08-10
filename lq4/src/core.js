'use strict';
// ============================================================
// ルミナクエストIV / コア層（DOM・THREE非依存＝ヘッドレス実行可）
// 描画は V.*（ビュー）、UIは U.*（メッセージ/メニュー）、音は A.* 経由
// ============================================================
const LQ4 = (function(){

// ---------------- データ：クラス・呪文 ----------------
const LV_CAP = 60;   // §5 CAP60（やり込み）
const SPELL_DEFS = {
  // ============ イオ（剣・主人公）：単体火力と光の継承 ============
  kabutowari: {name:'兜割り',      mp:3, type:'defdown', cut:8},
  renzan:     {name:'連斬',        mp:5, type:'dmg', min:26, max:34},
  yoroikudaki:{name:'鎧砕き',      mp:8, type:'defdown', cut:16},
  tenkuuken:  {name:'天空剣',      mp:9, type:'dmg', min:44, max:58},
  kenpunagi:  {name:'剣風・薙ぎ',  mp:12,type:'dmgall', min:30, max:42},
  seikousen:  {name:'星鋼閃',      mp:16,type:'dmg', min:84, max:108},
  amagakeken: {name:'天翔剣',      mp:22,type:'dmg', min:118,max:150},
  seikou_kiwa:{name:'星鋼閃・極',  mp:40,type:'dmgall', min:110,max:145},

  // ============ セレン（槍）：速攻と貫通 ============
  shippuutsuki:{name:'疾風突き',   mp:2, type:'dmg', min:14, max:20},
  yoroidooshi:{name:'鎧通し',      mp:4, type:'defdown', cut:10},
  nidantsuki: {name:'二段突き',    mp:6, type:'dmg', min:30, max:40},
  nagiharai:  {name:'薙ぎ払い',    mp:8, type:'dmgall', min:22, max:32},
  ryuuseitsuki:{name:'流星突き',   mp:10,type:'dmg', min:52, max:68},
  kansen:     {name:'貫閃',        mp:14,type:'dmg', min:78, max:100},
  amatsuranuki:{name:'天貫き',     mp:18,type:'dmg', min:100,max:128},
  ginu:       {name:'銀雨',        mp:20,type:'dmgall', min:60, max:80},
  ryuuseigun: {name:'流星群',      mp:30,type:'dmgall', min:92, max:120},
  kansen_kiwa:{name:'極・貫閃',    mp:36,type:'dmg', min:160,max:200},

  // ============ ノエ（夢術）：回復と弱体 ============
  heal:       {name:'ヒール',      mp:3, type:'heal', min:20, max:28},
  mezamashi:  {name:'目覚まし',    mp:2, type:'cure'},
  madoromi:   {name:'まどろみ',    mp:4, type:'inflict', st:'sleep',   p:0.65},
  hiira:      {name:'ヒーラ',      mp:6, type:'heal', min:45, max:60},
  yumeomori:  {name:'ゆめおもり',  mp:6, type:'inflict', st:'slow',    p:0.50, all:true},
  yumeutsutsu:{name:'ゆめうつつ',  mp:7, type:'inflict', st:'confuse', p:0.55},
  hiiga:      {name:'ヒーガ',      mp:12,type:'heal', min:95, max:135},
  yumenotobari:{name:'ゆめの とばり',mp:12,type:'inflict', st:'sleep', p:0.40, all:true},
  healall:    {name:'ヒールオール',mp:16,type:'healall', min:50, max:70},
  hiiraall:   {name:'ヒーラオール',mp:26,type:'healall', min:95, max:130},
  hiija:      {name:'ヒージャ',    mp:14,type:'heal', min:150,max:200},
  // ★敵の状態は1枠しか もてない ため、眠りが かからなかった 相手には 鈍りを かける
  //   （技リストの「眠り＋鈍り 同時」を 1枠で 表す）
  tokoyo:     {name:'とこよの ゆめ',mp:24,type:'inflict', st:'sleep', st2:'slow', p:0.35, p2:0.55, all:true},

  // ============ アマネ（光術）：攻撃と支援 ============
  spark:      {name:'スパーク',    mp:2, type:'dmg', min:12, max:18},
  hikari_tate:{name:'ひかりの たて',mp:5, type:'buff', stat:'def', mul:1.30, turns:3, all:true},
  spara:      {name:'スパーラ',    mp:5, type:'dmg', min:26, max:34},
  hikari_ken: {name:'ひかりの つるぎ',mp:6,type:'buff', stat:'atk', mul:1.25, turns:3},
  hikari_uzu: {name:'ひかりの うず',mp:10,type:'dmgall', min:26, max:36},
  sparga:     {name:'スパーガ',    mp:8, type:'dmg', min:42, max:56},
  hayate:     {name:'はやての ひかり',mp:7,type:'buff', stat:'agi', mul:1.30, turns:3, all:true},
  revive:     {name:'リヴァイブ',  mp:12,type:'revive'},
  holyray:    {name:'ひかりの あらし',mp:16,type:'dmgall', min:42, max:56},
  sparja:     {name:'スパージャ',  mp:18,type:'dmg', min:88, max:116},
  hikari_taika:{name:'ひかりの たいか',mp:26,type:'dmgall', min:74, max:98},
  judgment:   {name:'ばんぶつの ひかり',mp:34,type:'dmg', min:140,max:185},
  shiratatsu: {name:'しらたつの いのり',mp:34,type:'healall', min:110,max:150},

  // ============ 共通（移動） ============
  ret:        {name:'リターン',    mp:8, type:'return'},
};
const CLASSES = {
  // イオ（16・主人公／地上生まれの見習い騎士）剣
  io:   {name:'イオ',  hp:18,mp:4, atk:6,def:4,agi:5, g:{hp:6,mp:2,atk:3,def:2,agi:2},
         learns:[{lv:5,key:'kabutowari'},{lv:9,key:'renzan'},{lv:15,key:'yoroikudaki'},
                 {lv:20,key:'tenkuuken'},{lv:26,key:'kenpunagi'},{lv:32,key:'seikousen'},
                 {lv:40,key:'holyray'},{lv:46,key:'amagakeken'},
                 {lv:52,key:'judgment'},{lv:58,key:'seikou_kiwa'}]},
  // セレン（16・上層貴族の首席）槍：最速・単体特化
  seren:{name:'セレン',hp:16,mp:6, atk:5,def:3,agi:9, g:{hp:5,mp:3,atk:3,def:2,agi:3},
         learns:[{lv:3,key:'shippuutsuki'},{lv:8,key:'yoroidooshi'},{lv:12,key:'nidantsuki'},
                 {lv:18,key:'nagiharai'},{lv:23,key:'ryuuseitsuki'},{lv:29,key:'kansen'},
                 {lv:37,key:'amatsuranuki'},{lv:44,key:'ginu'},
                 {lv:50,key:'ryuuseigun'},{lv:57,key:'kansen_kiwa'}]},
  // ノエ（14・夢守りの少年）夢術：回復と弱体
  noe:  {name:'ノエ',  hp:13,mp:10,atk:3,def:3,agi:5, g:{hp:4,mp:5,atk:1,def:2,agi:2},
         learns:[{lv:3,key:'heal'},{lv:6,key:'mezamashi'},{lv:9,key:'madoromi'},
                 {lv:14,key:'hiira'},{lv:17,key:'yumeomori'},{lv:21,key:'yumeutsutsu'},
                 {lv:26,key:'hiiga'},{lv:31,key:'yumenotobari'},{lv:35,key:'healall'},
                 {lv:42,key:'hiiraall'},{lv:47,key:'hiija'},{lv:55,key:'tokoyo'}]},
  // アマネ（15・白竜の声を聞く巫女）光術：攻撃と支援
  amane:{name:'アマネ',hp:14,mp:12,atk:3,def:3,agi:6, g:{hp:4,mp:5,atk:2,def:2,agi:2},
         learns:[{lv:5,key:'spark'},{lv:9,key:'hikari_tate'},{lv:12,key:'spara'},
                 {lv:17,key:'hikari_ken'},{lv:20,key:'hikari_uzu'},{lv:24,key:'sparga'},
                 {lv:28,key:'hayate'},{lv:34,key:'revive'},{lv:38,key:'holyray'},
                 {lv:45,key:'sparja'},{lv:50,key:'hikari_taika'},{lv:56,key:'shiratatsu'}]},
};
const TACTICS = {manual:'命令させろ', gungan:'ガンガンいこうぜ', inochi:'命大事に'};

// ---------------- データ：敵（悪夢獣。名づけは星座名＝ボス級のみ） ----------------
// 序章〜第1章ぶん。倒すと黒い紙片になって消える（ノエだけが顔色を変える伏線）。
const ENEMIES = [
  // ---- 序章 下層区（Lv1〜5）----
  {key:'kagekakera', name:'影のかけら',   hp:16, atk:5,  def:3,  agi:5,  exp:16, gold:6,  minLv:1},
  {key:'shihenchu',  name:'紙片蟲',       hp:20, atk:6,  def:5,  agi:6,  exp:22, gold:8,  minLv:1},
  {key:'akumuga',    name:'悪夢蛾',       hp:22, atk:7,  def:4,  agi:11, exp:28, gold:9,  minLv:2,
   inflict:{type:'sleep', p:0.16}},
  {key:'yamiinu',    name:'闇犬',         hp:28, atk:9,  def:5,  agi:9,  exp:36, gold:12,  minLv:2,
   skill:{p:0.24, mul:1.20, name:'かみつき'}},
  {key:'sumibami',   name:'すすばみ',     hp:34, atk:11, def:7,  agi:7,  exp:48, gold:16, minLv:4},
  // ---- 第1章 下層区の亀裂（Lv8〜11）※M1で ふやす ----
  {key:'kansuiki',   name:'管漏れの影',   hp:46, atk:15, def:10, agi:8,  exp:26, gold:18, minLv:7,
   skill:{p:0.26, mul:1.25, name:'にじみだし'}},
  {key:'hakoyami',   name:'箱闇',         hp:58, atk:17, def:14, agi:6,  exp:34, gold:24, minLv:8,
   brace:{p:0.20, name:'ふたを とじた！'}},
];
const MIDBOSS = {
  // ---- 序章：見習い試験の的（チュートリアル戦。負けても やりなおせる）----
  trialdummy:{key:'trialdummy', name:'訓練用の 木人', hp:34, atk:3, def:4, agi:2, acts:1,
    exp:40, gold:0, art:'nushicrab',
    brace:{p:0.15, name:'かまえを かためた！'}},
  // ---- 序章ボス：悪夢獣 ウンブラ（影の座）----
  umbra:{key:'umbra', name:'あくむじゅう ウンブラ', hp:160, atk:11, def:8, agi:10, acts:1,
    exp:140, gold:90, art:'rev_shadow', scale:1.30,
    skill:{p:0.28, mul:1.25, name:'かげの つめ'},
    aoe:{p:0.16, lo:6, hi:10, name:'くらやみの さざなみ'},
    inflict:{type:'sleep', p:0.18},
    charge:{p:0.18, mul:1.9, tell:'かげが ふくれあがって いる…', name:'よるを ひきよせる'},
    enrage:{at:0.35, atk:1.12, name:'かげが ざわめきだした！'}},
};
const EXP_MUL = {};
// ★章べつの でかた（きょうつう byMap より ゆうせん）
const byMapCh = {};
const byMap = {
  rift_yard: ['kagekakera','shihenchu','akumuga','yamiinu','sumibami'],
  world:     ['kagekakera','shihenchu','akumuga','yamiinu','sumibami'],
};

// ---------------- データ：マップ ----------------
// 共通タイル: _ ゆか / # かべ / f き / w みず / r みち / o いわ
//   I やどや / P きょうかい / S みせ / D とびら(ワープ) / n むらびと
//   t たいまつ / C たからばこ / > した階段 / < うえ階段 / B ボス
const MAPS = {
  // 共通タイル: . ゆか / # かべ / o いわ / r みち / t あかり
  //   I やどや / P きょうかい / S みせ / n じゅうみん / C たからばこ / B ボス
  // ※ M0は かりの タイル（天空様式：白石・光珠灯・雲海縁 は M1で 新規に する）

  // ============ 天空大陸 ルミナリア（フィールド）============
  //   ★マップIDは 'world'。まわりは 雲海（~）で 落ちられない。
  //   ★序章で 入れるのは 下層区（V）だけ。ほかの ちてんは Q（これから つくる）。
  world:{name:'天空大陸 ルミナリア', theme:'world', enc:true, encRate:0.07, encGrace:5,
    encZones:[
      {x0:4,  y0:20, x1:39, y1:27, name:'下層の たな'},
      {x0:6,  y0:12, x1:37, y1:20, name:'中層の たな'},
      {x0:11, y0:4,  x1:32, y1:12, name:'上層の たな'},
    ],
    tiles:[
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~...~.~~~~....~~.~~~~~~~~~~~",
    "~~~~~~~~~~~..........r...f.......~~~~~~~~~~~",
    "~~~~~~~~~~~.........rQr..........~~~~~~~~~~~",
    "~~~~~~~~~~~..........rr.......r..~~~~~~~~~~~",
    "~~~~~~~~~~~..........,rrrrrrrrQr.~~~~~~~~~~~",
    "~~~~~~~~~~~...........r.......r..~~~~~~~~~~~",
    "~~~~~~~~~~~........^^rr^^^...,..f~~~~~~~~~~~",
    "~~~~~~~~~~~........^^rr^^^...o...~~~~~~~~~~~",
    "~~~~~~...f...^.......fr...............~~~~~~",
    "~~~~~~...rrrrrrrrrrrrrr...............~~~~~~",
    "~~~~~~,.rQr....o......r...............~~~~~~",
    "~~~~~~.f.r............r.f...,.........~~~~~~",
    "~~~~~~.o.............rQrrrrrrrrrrrr.f.~~~~~~",
    "~~~~~~....f........^..r..o.......rQr..~~~~~~",
    "~~~~~~.f...f..fffffff.r...........r...~~~~~~",
    "~~~~~~.^....o.fffffff.r...............~~~~~~",
    "~~~~..................r.....^...........~~~~",
    "~~~~......^.rrrrrrrrrrr...^............~~~~~",
    "~~~~........r.....................^.f...~~~~",
    "~~~~........r.f......f.................~~~~~",
    "~~~~.......rVr....,.^..........f.......~~~~~",
    "~~~~........r..o.......^................~~~~",
    "~~~~.~.o...~.~~~.~~.~..~.~~~.~~.~..~~~..~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",],
    warpsXY:{
      '12,24':{to:'lower_dist', x:19, y:6}
    }},

  // ============ 序章：イオの家（父の鍛冶場） ============
  // 父の 鍛冶場。左に 炉、右に 道具棚。奥が 寝間。
  home_forge:{name:'イオの家（父の鍛冶場）', theme:'village', enc:false, tiles:[
    "###############",
    "#t...........t#",
    "#..###...###..#",
    "#..#C#...#e#..#",
    "#..#.#...#.#..#",
    "#.............#",
    "#..n.......e..#",
    "#.............#",
    "#t...........t#",
    "#.............#",
    "#######.#######"],
    warpsXY:{
      '7,10':{to:'lower_dist', x:3, y:11}
    }},

  // ============ 序章：下層区（地上生まれの移民と労働者の街） ============
  // ★でぐちは かならず 見て わかる ように する：
  //   G＝北の門／D＝イオの家の とびら／r＝道。ただの ゆかに ワープを おかない。
  lower_dist:{name:'下層区', theme:'village', enc:false, tiles:[
    "##########G##########",
    "#.........r.........#",
    "#.#####...r...#####.#",
    "#.#####...r...#####.#",
    "#.##I##...r...##S##.#",
    "#....n.t..r..t....n.#",
    "#rrrrrrrrrrrrrrrrrrrG",
    "#.....o..tr...o.....#",
    "#.#P##....r....####.#",
    "#.####....r.n..####.#",
    "#.####....r....####.#",
    "#rrrrrrrrrrrrrr####r#",
    "#.#D#..tn.r..t.####.#",
    "#.###.....r......C..#",
    "##########r##########"],
    warpsXY:{
      '3,12' :{to:'home_forge', x:7, y:9},
      '10,14':{to:'trial_yard', x:6, y:8},
      '10,0' :{to:'rift_yard',  x:10, y:13},
      '20,6' :{to:'world',      x:13, y:24}
    }},

  // ============ 序章：騎士団 見習い試験場 ============
  trial_yard:{name:'見習い試験場', theme:'village', enc:false, tiles:[
    "#############",
    "#...........#",
    "#..n.....n..#",
    "#...........#",
    "#.....B.....#",
    "#...........#",
    "#..n........#",
    "#...........#",
    "######.######"],
    warpsXY:{
      '6,8':{to:'lower_dist', x:10, y:13}
    }},

  // ============ 序章：夜の広場（黒い裂け目） ============
  // ★みちのりを ながく とり、わき道を 2本 つける（宝箱／逃げ遅れた子）。
  //   まっすぐな ろうかを ならべる だけの 水増しに しない。
  //   ★しかけ2つ：①岩(O)を 穴(x)に 押しこんで 足場を つくる
  //                ②光珠灯(L)を ふたつ ともすと 奥の 扉(K)が ひらく
  //   ★1ますの ろうかに かざりの 岩(o)を おかない（通れなくなる）。
  rift_yard:{name:'裂け目の広場', theme:'dream', enc:true, encRate:0.10, encGrace:4, tiles:[
    "#####################",
    "#####################",
    "####...............##",
    "####..o...B...o....##",
    "####...............##",
    "################K####",
    "#####L######L###.####",
    "##.................##",
    "###.#################",
    "##...............C.##",
    "##xxxxxxxxxxxxxxxxx##",
    "##.................##",
    "##...O.......O.....##",
    "##n....O...........##",
    "##########G##########"],
    warpsXY:{
      '10,14':{to:'lower_dist', x:10, y:1}
    }},
};

// ---------------- データ：店・宿 ----------------
const SHOPS = {
  'lower_dist:S':[
    {kind:'h',  name:'薬草',         v:20, price:8},
    {kind:'wtr',name:'魔法の 聖水', v:30, price:60},
    {kind:'w',  name:'鍛冶場の 短剣',    v:4,  price:80},
    {kind:'a',  name:'作業着',           v:3,  price:60},
    {kind:'w',  name:'見習いの 槍',      v:6,  price:180},
    {kind:'a',  name:'なめし革の 胴',    v:6,  price:200},
  ],
};
const INN_PRICE = {lower_dist:6};
// ---------------- 状態 ----------------
let G, P, party, reserve = [];
function startChapter(no){
  const ch=(WORLD.CHAPTERS||[]).find(x=>x.no===no);
  if(!ch) return;
  V.chapterCard('第'+no+'章', ch.title);
}
function freshState(){
  G = {mode:'field', menu:null, battle:null, flags:{}, visited:{}, gotTreasure:{},
       tactic:'manual', dex:{}, trail:[], stepFlip:false, cleared:false,
       chapter:1, chapters:{}, townState:'NORMAL', night:false, quests:{}, steps:0,
       ship:null, aboard:false, tileEdits:{}};      // ★しかけで 書きかえた ます
  if(!MAPS_ORIG) snapshotMaps();
  restoreMaps();                                    // ★しかけを もとに もどす
  P = {map:'home_forge', x:7, y:8, dir:'front', gold:40, herbs:3, waters:0,
       equipBag:[], keyItems:{}, goods:{}};
  party = [mkMember('io',1)];
  reserve = [];
  party[0].weapon = {kind:'w',name:'父の 打った 剣',v:4};
  party[0].armor  = {kind:'a',name:'見習いの 胴着',v:2};
  G.visited.home_forge = true;
}
// ---------------- まちの 状態 ----------------
function setTownState(id){
  if(!WORLD.TOWN_STATES[id]) return false;
  G.townState = id;
  V.buildMap(P.map); V.setActors(true); U.hud();
  return true;
}
function setNight(v){
  G.night = !!v;
  V.buildMap(P.map); V.setActors(true);
  return G.night;
}
// 章ごとの ふっきてん（ぜんめつしたとき 戻る まち）
// ※ 章データ（chapters.js）に うつした。ここは よびだしの ための のこり。
const HOME = {
  1:{map:'lower_dist', x:10, y:3, name:'下層区の 光珠堂'},
};
// ★ぜんめつの もどりさき：しんだ ばしょに いちばん ちかい まち・むら・しろ。
//   ダンジョンなら その ちほうの まち、ワールドなら きょりが いちばん ちかい ところ。
function deathPoint(){
  const cd = chData();
  const spots = (cd && cd.returnSpots || []).filter(s=>MAPS[s.map] && walkable(s.map,s.x,s.y));
  if(!spots.length) return homePoint();
  const named = (s)=>({map:s.map, x:s.x, y:s.y, name:WORLD.mapName(s.map)});
  const regionHits = (P.map !== 'world')
    ? spots.filter(s=>(WORLD.MAP_IDS[s.map]||{}).region === (WORLD.MAP_IDS[P.map]||{}).region)
    : [];
  if(regionHits.length===1) return named(regionHits[0]);
  // ワールド（または ちほうに まちが ない）：ワールドの いりぐち ざひょうで きょり ひかく
  const wxy = {};
  const ww = (MAPS.world && MAPS.world.warpsXY) || {};
  Object.keys(ww).forEach(k=>{
    const w=ww[k];
    if(!wxy[w.to]){ const [x,y]=k.split(',').map(Number); wxy[w.to]={x,y}; }
  });
  const px = (P.map==='world') ? P.x : ((wxy[P.map]||{}).x ?? P.x);
  const py = (P.map==='world') ? P.y : ((wxy[P.map]||{}).y ?? P.y);
  let best=null, bd=1e9;
  (regionHits.length ? regionHits : spots).forEach(s=>{
    const c = wxy[s.map]; if(!c) return;
    const d = Math.abs(c.x-px)+Math.abs(c.y-py);
    if(d<bd){ bd=d; best=s; }
  });
  return best ? named(best) : homePoint();
}
function homePoint(){
  // ★章データの home を さいゆうせん（章を ふやしても ここを さわらない）。
  //   これを わすれると、第2章で ぜんめつしても 第1章の まちへ もどされる。
  const cd = chData();
  if(cd && cd.home && MAPS[cd.home.map] && walkable(cd.home.map, cd.home.x, cd.home.y)){
    return cd.home;
  }
  const h = HOME[G.chapter] || HOME[1];
  return MAPS[h.map] ? h : HOME[1];
}
function townStateDef(){ return WORLD.TOWN_STATES[G.townState] || WORLD.TOWN_STATES.NORMAL; }
function mkMember(cls, lv){
  const c = CLASSES[cls];
  const m = {cls, name:c.name, lv:1, exp:0,
    maxhp:c.hp, maxmp:c.mp, batk:c.atk, bdef:c.def, agi:c.agi,
    weapon:null, armor:null, status:null};
  for(let i=1;i<lv;i++){
    m.lv++; m.maxhp+=c.g.hp; m.maxmp+=c.g.mp; m.batk+=c.g.atk; m.bdef+=c.g.def;
    if(m.lv%2===0) m.agi+=c.g.agi;
  }
  m.hp=m.maxhp; m.mp=m.maxmp;
  return m;
}
function expNext(m){ return m.lv>=LV_CAP ? Infinity : m.lv*m.lv*6; }
// ★LQ4：buff（あじかたの きょうか）を のせる。buffs={atk:{mul,until},...}
function buffMul(m, stat){
  const b = m && m.buffs && m.buffs[stat];
  if(!b) return 1;
  return b.mul || 1;
}
function mAtk(m){ return Math.round((m.batk + (m.weapon?m.weapon.v:0)) * buffMul(m,'atk')); }
function mDef(m){ return Math.round((m.bdef + (m.armor?m.armor.v:0)) * buffMul(m,'def')); }
// ★技の ひょうじ：なまえの あとに しゅるいを つける。
//   なまえだけでは たんたい／ぜんたい／しゅびさげが わかりにくい ため。
// ★イオ・セレンは 剣技／槍技、ノエ・アマネは 夢術／光術。
//   「じゅもんを となえる」で ひとくくりに しない。
function castVerb(m){
  return (m && (m.cls==='io' || m.cls==='seren')) ? 'を 放った！' : 'を 唱えた！';
}
const SPELL_TAG = {dmg:'単体', dmgall:'全体', heal:'回復',
                   healall:'全体回復', cure:'状態', revive:'蘇生',
                   defdown:'守り下げ', 'return':'移動',
                   inflict:'状態', buff:'強化'};
function spellLabel(s){
  const tag = SPELL_TAG[s.type] || '';
  return s.name + '　' + s.mp + (tag ? '　' + tag : '');
}
function knownSpells(m){
  return CLASSES[m.cls].learns.filter(l=>m.lv>=l.lv)
    .map(l=>Object.assign({key:l.key}, SPELL_DEFS[l.key]));
}
function aliveMembers(){ return party.filter(p=>p.hp>0); }
function actableMembers(){ return party.filter(p=>p.hp>0 && p.status!=='sleep'); }

// ---------------- マップ ----------------
// 章ごとの きまりごとは src/chapters.js に まとめてある。
const CHD = (typeof CHAPTERS_DATA!=='undefined') ? CHAPTERS_DATA
          : (typeof require!=='undefined' ? require('./chapters.js') : null);
function chData(){ return CHD ? CHD.get(G.chapter||1) : null; }

const SOLID = new Set(['#','f','w','o','T','F','K','~','^','H','e','y','j',
                       'O','x','L','l']);
// ★しかけ用の タイル（IVから）
//   O 動かせる岩（押せる）／x 穴（岩で 埋まる）／L 消えた光珠灯／l ついた光珠灯
//   K 施錠された扉（かぎで あく）
const GIMMICK_TILES = new Set(['O','x','L','l','K']);

// ============================================================
// タイルの 書きかえ（しかけの ため）
//   MAPS の 文字列を じかに 書きかえる。こうすると 描画・当たり判定・
//   監査が すべて そのまま ついてくる（読みかえの 通し忘れが 起きない）。
//   もとの すがたは MAPS_ORIG に とっておき、はじめから／ロード時に もどす。
// ============================================================
let MAPS_ORIG = null;
function snapshotMaps(){
  MAPS_ORIG = {};
  Object.keys(MAPS).forEach(k=>{ MAPS_ORIG[k] = MAPS[k].tiles.slice(); });
}
function restoreMaps(){
  if(!MAPS_ORIG) return;
  Object.keys(MAPS_ORIG).forEach(k=>{ MAPS[k].tiles = MAPS_ORIG[k].slice(); });
}
function setTile(map,x,y,ch){
  const m = MAPS[map]; if(!m) return false;
  const row = m.tiles[y];
  if(row===undefined || x<0 || x>=row.length) return false;
  m.tiles[y] = row.slice(0,x) + ch + row.slice(x+1);
  G.tileEdits = G.tileEdits || {};
  G.tileEdits[map+':'+x+','+y] = ch;
  return true;
}
function applyTileEdits(){
  restoreMaps();
  const ed = G.tileEdits || {};
  Object.keys(ed).forEach(k=>{
    const [map, xy] = k.split(':');
    const [x,y] = xy.split(',').map(Number);
    const m = MAPS[map]; if(!m) return;
    const row = m.tiles[y]; if(row===undefined) return;
    m.tiles[y] = row.slice(0,x) + ed[k] + row.slice(x+1);
  });
}
function tileAt(map,x,y){
  const m = MAPS[map]; if(!m) return '#';
  if(y<0||x<0||y>=m.tiles.length||x>=m.tiles[y].length) return '#';
  return m.tiles[y][x];
}
function isBlocked(ch){
  return SOLID.has(ch) || ch==='I' || ch==='P' || ch==='S' || ch==='W' || ch==='M'
      || ch==='n' || ch==='C' || ch==='B'
      || ch==='Q';                                   // Q は しらべる たいしょう
}
function walkable(map,x,y){ return !isBlocked(tileAt(map,x,y)); }
function warpAt(map,x,y){
  const m = MAPS[map]; if(!m) return null;
  if(m.warpsXY && m.warpsXY[x+','+y]) return m.warpsXY[x+','+y];
  const ch = tileAt(map,x,y);
  if(m.warps && m.warps[ch]) return m.warps[ch];
  return null;
}

// ---------------- メッセージ／ビューの差し替え口 ----------------
// 実UI版が上書きする。既定はヘッドレス（即時進行）。
const NullView = {
  buildMap(){}, setActors(){}, fx(kind,data,done){ done&&done(); },
  battleEnter(_,done){ done&&done(); }, battleLeave(done){ done&&done(); },
  refresh(){}, chest(){}, fade(_,done){ done&&done(); }, chapterCard(_,__,done){ done&&done(); },
  pop(){},
  setDream(){},
};
const NullUI = {
  msgLog: [],
  msg(lines, done){ lines.forEach(l=>NullUI.msgLog.push(l)); done&&done(); },
  openTrade(){},
  menu(items, title, onPick){ onPick(0); },
  hud(){}, label(){},
};
const NullAudio = {hit(){},ehit(){},heal(){},lvup(){},win(){},lose(){},cue(){},
  cursor(){},ok(){},cancel(){},door(){},chest(){},item(){},buy(){},
  encounter(){},crit(){},miss(){},spell(){},defeat(){},flee(){},
  bgm(){}, battleBgm(){}, bgmStop(){}};
let V = NullView, U = NullUI, A = NullAudio;
function bind(view, ui, audio){ V=view||NullView; U=ui||NullUI; A=audio||NullAudio; }

// ---------------- フィールド行動 ----------------
// ---------------- しらべる（Aボタン）----------------
// むいている ほうこうの 1ますを しらべる。DQと おなじ そうさ。
function facing(){
  const d = P.dir||'front';
  const dx = d==='left' ? -1 : d==='right' ? 1 : 0;
  const dy = d==='back' ? -1 : d==='front' ? 1 : 0;
  return {x:P.x+dx, y:P.y+dy, dx, dy};
}
function interact(){
  if(G.mode!=='field' || G.busy) return false;
  const f = facing();
  const nx = f.x, ny = f.y, dx = f.dx, dy = f.dy;
  const ch = tileAt(P.map,nx,ny);
  // 施設・人物は「ぶつかって」作用
  if(ch==='n'){ talkNPC(nx,ny); return; }
  if(ch==='I'){ useInn(); return; }
  if(ch==='P'){ useChurch(); return; }
  if(ch==='S'||ch==='W'||ch==='M'){ openShop(ch); return; }
  if(ch==='C'){ openChest(nx,ny); return; }
  if(ch==='A'||ch==='V'||ch==='X'){          // ワールドの ちてん
    const w=warpAt(P.map,nx,ny);
    if(w){
      // ★けっかい：じょうけんが そろうまで はいれない
      const wd = WARDS[w.to];
      if(wd && (G.chapter||1)===wd.chapter && !G.flags[wd.flag]){
        G.mode='msg';
        U.msg(wd.msg, ()=>{ G.mode='field'; });
        return;
      }
      doWarp(w); return;
    }
  }
  if(ch==='Q'){                               // まだ いけない ちほう
    G.mode='msg';
    U.msg(['光珠灯の 列が、雲の 上へ 続いている。',
           'だが いまの ' + (party[0] ? party[0].name : '彼ら') + 'に、ここから 先へ 進む 手だては ない。',
           '（この 場所は これから 作られます）'], ()=>{ G.mode='field'; });
    return;
  }
  if(ch==='B'){ triggerBoss(nx,ny); return; }
  // ★しかけ（IVから）
  if(ch==='L' || ch==='l'){ toggleLamp(nx,ny); return; }
  if(ch==='x'){
    G.mode='msg';
    U.msg(['深い 穴が あいている。','……なにか 埋めれば 渡れそうだ。'], ()=>{ G.mode='field'; });
    return;
  }
  if(ch==='O'){
    G.mode='msg';
    U.msg(['大きな 岩だ。押せば 動きそうだ。'], ()=>{ G.mode='field'; });
    return;
  }
  if(ch==='K'){ openLockedDoor(nx,ny); return; }
  // なにも なければ
  G.mode='msg';
  U.msg(['そこには なにも ない。'], ()=>{ G.mode='field'; });
  return true;
}

// ★ワールドは あるくと ちたいめいが かわる。うごいた あとに つけかえる
function refreshAreaLabel(){
  if(P.map!=='world') return;
  const nm = areaName('world', P.x, P.y);
  if(nm !== G._areaLabel){ G._areaLabel = nm; U.label(nm); }
}
function stepField(dx,dy){
  if(G.mode!=='field' || G.busy) return;
  const nx=P.x+dx, ny=P.y+dy;
  const ch = tileAt(P.map,nx,ny);
  // ★ぶ使っただけでは なにも おきない。しらべるのは Aボタン（interact）。
  //   ワープの ます（もん・かいだん・ちてん）は ふんだら すすむ。
  P.dir = dy<0?'back' : dy>0?'front' : (dx<0?'left':'right');
  // ★ふね：もやって ある ふねに あるいて ふれると のる
  if(!G.aboard && P.map==='world' && G.ship && nx===G.ship.x && ny===G.ship.y){
    G.aboard=true;
    G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
    P.x=nx; P.y=ny; G.stepFlip=!G.stepFlip;
    V.setActors(); refreshAreaLabel();
    return;
  }
  // ★ふね：うみを すすむ／りくに あがる（うみでは まものは でない）
  if(G.aboard){
    if(ch==='~'){
      G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
      P.x=nx; P.y=ny; G.stepFlip=!G.stepFlip;
      V.setActors(); refreshAreaLabel();
      return;
    }
    if(walkable(P.map,nx,ny)){
      G.ship={x:P.x, y:P.y};                 // ふねを のこして あがる
      G.aboard=false;
    }else return;
  }
  // ★動かせる岩（O）：むこうが 床なら 押せる。穴（x）なら 埋まる。
  if(ch==='O'){ pushRock(nx,ny,dx,dy); return; }
  if(!walkable(P.map,nx,ny)) return;
  G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
  P.dir = dy<0?'back' : dy>0?'front' : (dx<0?'left':'right');   // むきを おぼえる
  P.x=nx; P.y=ny; G.stepFlip=!G.stepFlip;
  V.setActors(); refreshAreaLabel();
  const w = warpAt(P.map,nx,ny);
  // ★けっかい：じょうけんが そろうまで はいれない
  if(w){
    const wd = WARDS[w.to];
    if(wd && (G.chapter||1)===wd.chapter && !G.flags[wd.flag]){
      G.mode='msg';
      U.msg(wd.msg, ()=>{ G.mode='field'; });
      return;
    }
  }
  if(w){ doWarp(w); return; }
  if(MAPS[P.map].enc) maybeEncounter();
}
// ★施錠された扉：章データの locks に かかれた かぎが いる。
function openLockedDoor(nx,ny){
  const lk = ((chData()||{}).locks||{})[P.map+':'+nx+','+ny];
  G.mode='msg';
  if(!lk){ U.msg(['固く 閉ざされている。'], ()=>{ G.mode='field'; }); return; }
  if(!lk.key || !hasKey(lk.key)){          // かぎの ない 扉は べつの しかけで あける
    U.msg(lk.lockMsg || ['鍵が かかっている。'], ()=>{ G.mode='field'; });
    return;
  }
  setTile(P.map,nx,ny,'.');
  A.door && A.door();
  V.refresh && V.refresh();
  U.msg(lk.openMsg || ['鍵を 使った。扉が 開いた。'], ()=>{ G.mode='field'; });
}

// ★岩を おす。むこうが 床なら ずらす。穴なら 岩ごと 埋まって 道に なる。
function pushRock(rx,ry,dx,dy){
  const tx = rx+dx, ty = ry+dy;
  const t = tileAt(P.map,tx,ty);
  if(t==='x'){                                  // 穴を 埋める
    setTile(P.map,rx,ry,'.');
    setTile(P.map,tx,ty,'.');
    A.door && A.door();
    G.mode='msg';
    U.msg(['岩が 穴に はまった。','足場が できた。'], ()=>{ G.mode='field'; V.refresh&&V.refresh(); });
    return;
  }
  if(t!=='.' && t!=='r'){                       // 押せない
    G.mode='msg';
    U.msg(['岩は びくとも しない。'], ()=>{ G.mode='field'; });
    return;
  }
  setTile(P.map,rx,ry,'.');
  setTile(P.map,tx,ty,'O');
  A.door && A.door();
  G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
  P.x=rx; P.y=ry; G.stepFlip=!G.stepFlip;
  V.setActors(); V.refresh&&V.refresh();
}

// ★岩づまり すくい：穴が ひとつも 埋まって おらず、どの岩も もう 押せない ときは
//   その マップの しかけを もとに もどす。手づまりで 進めなく なるのを ふせぐ。
function gimmickRescue(map){
  const m = MAPS[map], org = MAPS_ORIG && MAPS_ORIG[map];
  if(!m || !org) return false;
  const pitsNow = m.tiles.join('').split('x').length-1;
  const pitsOrg = org.join('').split('x').length-1;
  if(pitsOrg===0 || pitsNow<pitsOrg) return false;      // 穴が ない／もう 埋めた
  let canPush = false;
  for(let y=0;y<m.tiles.length && !canPush;y++){
    for(let x=0;x<m.tiles[y].length && !canPush;x++){
      if(m.tiles[y][x] !== 'O') continue;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const t = tileAt(map,x+dx,y+dy);
        const back = tileAt(map,x-dx,y-dy);
        if((t==='.'||t==='r'||t==='x') && !isBlocked(back)) canPush = true;
      });
    }
  }
  if(canPush) return false;
  m.tiles = org.slice();
  Object.keys(G.tileEdits||{}).forEach(k=>{ if(k.indexOf(map+':')===0) delete G.tileEdits[k]; });
  return true;
}

// ★光珠灯：しらべると つく／消える。ぜんぶ つくと 章データの lampGate が ひらく。
function toggleLamp(nx,ny){
  const cur = tileAt(P.map,nx,ny);
  setTile(P.map,nx,ny, cur==='L' ? 'l' : 'L');
  A.item && A.item();
  V.refresh && V.refresh();
  const lines = [cur==='L' ? '光珠に 火が ともった。' : '光珠の 火が 消えた。'];
  const gate = (chData()||{}).lampGates && (chData()||{}).lampGates[P.map];
  if(gate && allLampsLit(P.map)){
    gate.open.forEach(o=>setTile(P.map,o.x,o.y,o.ch||'.'));
    if(gate.flag) G.flags[gate.flag]=true;
    lines.push(...(gate.msg||['どこかで 石の きしむ 音が した。']));
    V.refresh && V.refresh();
  }
  G.mode='msg';
  U.msg(lines, ()=>{ G.mode='field'; });
}
function allLampsLit(map){
  const m = MAPS[map]; if(!m) return false;
  return !m.tiles.some(r=>r.indexOf('L')>=0);
}

// ワールドマップは ばしょによって なまえが かわる
function areaName(map,x,y){
  if(map==='world' && tileAt(map,x,y)==='~') return '雲海';
  const m=MAPS[map];
  if(!m || !m.encZones) return WORLD.mapName(map);
  const z=(m.encZones||[]).find(z=>x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1);
  return z ? z.name : WORLD.mapName(map);
}
function doWarp(w){
  G.busy=true;
  if(A.door) A.door();
  V.fade(1, ()=>{
    P.map=w.to; P.x=w.x; P.y=w.y; P.dir='front';
    if(gimmickRescue(w.to)) G._rescued = true;      // ★岩づまりを もとに もどした
    G.trail=[[w.x,w.y],[w.x,w.y]];
    G.visited[w.to]=true;
    // ★章データの onEnter / onEnterState
    {
      const cd = chData();
      if(cd){
        if(cd.onEnter && cd.onEnter[w.to]) G.flags[cd.onEnter[w.to]] = true;
        if(cd.onEnterState && cd.onEnterState[w.to] && WORLD.TOWN_STATES[cd.onEnterState[w.to]])
          G.townState = cd.onEnterState[w.to];
      }
    }
    if(TRADE_MARKET[w.to]) G.marketTick = (G.marketTick|0) + 1;   // そうばが うごく
    V.buildMap(w.to); V.setActors(); U.label(areaName(w.to, w.x, w.y));
    A.bgm(w.to);
    V.fade(0, ()=>{ G.busy=false; G.mode='field'; });   // メッセージ中から呼ばれても操作可へ戻す
  });
}
let encSteps = 0;
function maybeEncounter(){
  encSteps++;
  const m = MAPS[P.map];
  let rate = (m && m.encRate!==undefined) ? m.encRate : 0.085;
  const grace = (m && m.encGrace!==undefined) ? m.encGrace : 3;
  // ★もりの なかは みとおしが わるく、まものに あいやすい
  if(tileAt(P.map,P.x,P.y)===',') rate *= 1.8;
  if(encSteps<grace) return;                 // たたかいの ちょくごに また、を ふせぐ
  if(Math.random()<rate){ encSteps=0; startBattle(null); }
}

// ---------------- NPC・施設 ----------------
function talkNPC(x,y){
  const entry = NPCDATA.npcAt(P.map, x, y);
  G.mode='msg';
  if(!entry){ U.msg(['「……」'], ()=>{ G.mode='field'; }); return; }
  const lines = NPCDATA.pickLines(entry, {townState:G.townState, flags:G.flags, chapter:(G.chapter||1)});
  // ★ものがたりの できごとが ある ときは、そちらを だす（ふだんの せりふは ださない）。
  //   りょうほう だすと おなじ ことを 2かい いう ことに なる（じっさいに でた ふぐあい）。
  //   ★IVでは 章に よらず つねに 章データを 見る（LQ3の 「1章だけ 別あつかい」を やめた）。
  if(runTalkEvent(entry.name)) return;
  U.msg(lines, ()=>{ G.mode='field'; });
}
// ---------------- クエスト ----------------
// ---------------- 章データの ものがたりを うごかす ----------------
// chapters.js の talkEvents を じょうから みて、さいしょに あてはまった ものを おこなう。
// これに よって、章を ふやす ときに ここを さわらなくて すむ。
function matchEvent(e){
  const F = G.flags;
  if(e.unless && F[e.unless]) return false;                 // もう おきている
  if(e.cond && !e.cond.every(f=>F[f])) return false;         // まえの じょうけんが そろって いない
  if(e.when && e.when.state && G.townState !== e.when.state) return false;
  if(e.needKey && !hasKey(e.needKey)) return false;
  if(e.needGold && P.gold < e.needGold) return false;
  if(e.needQuota && !(G.quota && G.quota.n >= G.quota.need)) return false;  // ★いらいが おわって いない
  return true;
}
function runTalkEvent(npcName){
  const cd = chData();
  if(!cd || !cd.talkEvents) return false;
  const e = cd.talkEvents.find(ev => ev.npc === npcName && matchEvent(ev));
  if(!e) return false;

  (e.set || []).forEach(f => { G.flags[f] = true; });
  if(e.setState && WORLD.TOWN_STATES[e.setState]) G.townState = e.setState;
  if(e.takeKey) takeKey(e.takeKey);
  if(e.giveKey) giveKey(e.giveKey);
  if(e.moor){ G.ship={x:e.moor[0], y:e.moor[1]}; G.aboard=false; }   // ★ふねを さずける
  if(e.heal){ party.concat(reserve).forEach(m=>{ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; }); U.hud(); }
  if(e.join){                                    // ★なかまが くわわる（'lead'＝せんとうと おなじLv）
    (Array.isArray(e.join)?e.join:[e.join]).forEach(j=>{
      const lv = j.lv==='lead' ? (party[0]?party[0].lv:1) : (j.lv||1);
      const m = joinMember(j.cls, lv);
      if(m){                                     // そぶりの 装備を もって くる
        if(j.weapon) m.weapon = Object.assign({}, j.weapon);
        if(j.armor)  m.armor  = Object.assign({}, j.armor);
      }
    });
  }
  if(e.startQuota){                              // ★いらいを うける
    G.quota = {n:0, need:e.startQuota.need|0, flag:e.startQuota.flag};
  }
  if(e.clearQuota) G.quota = null;
  if(e.takeGold) P.gold = Math.max(0, P.gold - e.takeGold);
  if(e.gold) P.gold += e.gold;
  if(e.herbs) P.herbs += e.herbs;
  // ★ますを 書きかえる（人が あらわれる・道が ひらく など）。
  //   IVの しかけ（setTile）を ものがたりからも つかえる ように する。
  if(e.setTiles){
    (Array.isArray(e.setTiles)?e.setTiles:[e.setTiles]).forEach(o=>{
      setTile(o.map||P.map, o.x, o.y, o.ch||'.');
    });
    V.refresh && V.refresh();
  }
  Object.keys(e.quest || {}).forEach(q => questAdvance(q, e.quest[q]));

  const lines = (e.msg || []).slice();
  if(e.img && V.showScene) V.showScene(e.img);   // ★いちまいえ を せなかに ひょうじ
  U.msg(lines, () => {
    if(e.img && V.hideScene) V.hideScene();
    U.hud();
    // 章の おわりに たっしたか
    if(cd.ending && cd.ending.trigger && G.flags[cd.ending.trigger] && !G.flags[(cd.ending.set||[])[0]]){
      triggerChapterEnd();
      return;
    }
    G.mode = 'field';
  });
  return true;
}
// ---------------- 章の しめくくり（データから）----------------
// 章の おわりに 「つぎへ すすむ」か「この しょうを つづける」を えらばせる
function offerNextChapter(next, title, isFinal){
  if(isFinal){
    G.mode = 'msg';
    U.msg(['＊＊ ルミナクエスト IV　完結 ＊＊',
           '',
           'ながい たびに おつきあい いただき、',
           'ありがとう ございました！',
           'せかいは、めざめの あさを むかえた。'],
          () => { G.mode='field'; });
    return;
  }
  const ready = next && CHD && CHD.has(next);
  G.mode = 'msg';
  if(!ready){
    U.msg(['＊＊ ' + (title||'') + ' 完結 ＊＊',
           '（つづきの しょうは これから つくります）'], () => { G.mode='field'; });
    return;
  }
  const nc = CHD.get(next);
  U.msg(['＊＊ ' + (title||'') + ' 完結 ＊＊',
         'つぎは 第' + next + 'しょう「' + nc.title + '」。'], () => {
    G.mode = 'menu';
    U.menu(['第' + next + 'しょうへ すすむ', 'この しょうを つづける'], 'これから', (k) => {
      if(k === 0){
        switchChapter(next);
        G.mode = 'msg';
        V.buildMap(P.map); V.setActors(true);
        U.label(WORLD.mapName(P.map)); U.hud();
        A.bgm(P.map);
        // ★しょうの はじまりの せつめい（opening）を ここでも だす。
        //   まえは ニューゲームで その しょうから はじめた とき しか でて おらず、
        //   ふつうに すすめると ぜんしょうで せつめいが とんで いた。
        V.chapterCard('第' + next + 'しょう', nc.title, () => {
          const open = nc.opening;
          if(open && open.length) U.msg(open.slice(), () => { G.mode = 'field'; });
          else G.mode = 'field';
        });
      }else G.mode = 'field';
    });
  });
}
function triggerChapterEnd(){
  const cd = chData();
  if(!cd || !cd.ending){ G.mode='field'; return; }
  const en = cd.ending;
  (en.set || []).forEach(f => { G.flags[f] = true; });
  G.cleared = true;
  Object.keys(en.quest || {}).forEach(q => questAdvance(q, en.quest[q]));
  G.mode = 'msg';
  if(en.img && V.showScene) V.showScene(en.img);   // ★エンディングの いちまいえ
  U.msg(en.msg || ['……'], () => {
    if(en.img && V.hideScene) V.hideScene();
    const card = en.card || {title:'', sub:''};
    V.chapterCard(card.title, card.sub, () => { offerNextChapter(en.next, cd.title, en.final); });
  });
}
function questOnTalk(npcName){
  // ★IVは 章データ（chapters.js）の talkEvents だけで ものがたりが うごく。
  //   コアに 章の きめうちを かかない（LQ3で 5章に 1章の しょりが もれた ふぐあい）。
  runTalkEvent(npcName);
}
function questAdvance(id, state){
  if(!NPCDATA.QUESTS[id]) return;
  G.quests[id]=state;
}
function questList(){
  // ★いまの しょうの クエストだけを だす（べつの しょうの まぎれこみ よけ）
  const ch = G.chapter||1;
  return Object.keys(G.quests).filter(k=>G.quests[k]==='active')
    .map(k=>NPCDATA.QUESTS[k])
    .filter(q=>q && (!q.chapter || q.chapter===ch));
}
function useInn(){
  const price = INN_PRICE[P.map]||10;
  G.mode='msg';
  if(P.gold>=price){
    U.msg(['宿屋へ ようこそ。一晩 '+price+'ゴールドです。',
           '…おはようございます！ みなさん げんきに なりました！'], ()=>{
      P.gold-=price;
      party.concat(reserve).forEach(m=>{ if(m.hp>0){ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; } });
      A.heal(); U.hud(); G.mode='field';
    });
  }else{
    U.msg(['宿屋へ ようこそ。一晩 '+price+'ゴールドです。',
           'おきゃくさん、おかねが たりないようで…'], ()=>{ G.mode='field'; });
  }
}
function useChurch(){
  const dead = party.concat(reserve).filter(p=>p.hp<=0);
  G.mode='msg';
  if(dead.length){
    const cost = 30*dead.length;
    if(P.gold>=cost){
      U.msg(['神官「祈りましょう…」',
             '（'+cost+'ゴールドを おさめた）',
             '倒れた なかまが 目を 覚ました！'], ()=>{
        P.gold-=cost;
        dead.forEach(p=>{ p.hp=Math.ceil(p.maxhp/2); p.status=null; });
        A.heal(); U.hud(); G.mode='field';
      });
      return;
    }
    U.msg(['しんかんさま「いのりには '+cost+'ゴールドが ひつようです…」'], ()=>{ G.mode='field'; });
    return;
  }
  party.concat(reserve).forEach(p=>{ p.status=null; });
  U.msg(['しんかんさま「みなさん ごぶじで なにより」',
         '（けがれが きよめられた）'], ()=>{ A.heal(); G.mode='field'; });
}
function openChest(x,y){
  const key = P.map+':'+x+','+y;
  G.mode='msg';
  if(G.gotTreasure[key]){ U.msg(['たからばこは からっぽだ。'], ()=>{ G.mode='field'; }); return; }
  G.gotTreasure[key]=true;
  if(A.chest) A.chest();
  V.chest(x,y);
  const r=Math.random();
  if(r<0.45){
    const g=30+Math.floor(Math.random()*40); P.gold+=g;
    U.msg(['宝箱を 開けた！', g+'ゴールドを てにいれた！'], ()=>{ U.hud(); G.mode='field'; });
  }else if(r<0.8){
    P.herbs+=2;
    U.msg(['宝箱を 開けた！','薬草を 2つ てにいれた！'], ()=>{ G.mode='field'; });
  }else{
    P.waters+=1;
    U.msg(['宝箱を 開けた！','魔法の 聖水を てにいれた！'], ()=>{ G.mode='field'; });
  }
}
// ボスの ばしょ・とうじょうの ことば・倒した あとは 章データから ひく
function bossInfoAt(map){
  if(!CHD) return null;
  // まず いまの 章、なければ ぜんしょうから さがす（えがきは どの マップでも ひく）
  const here = CHD.bossAt(G.chapter||1, map);
  if(here) return here;
  for(const no of CHD.list()){
    const b = CHD.bossAt(no, map);
    if(b) return b;
  }
  return null;
}
function triggerBoss(x,y){
  // ★章データに かかれた ボスを ひく（章を ふやしても ここは さわらない）
  const bi = bossInfoAt(P.map);
  if(bi){
    G.mode='msg';
    if(bi.clearedFlag && G.flags[bi.clearedFlag]){
      U.msg(bi.after || ['もう だれも いない。'], ()=>{ G.mode='field'; });
      return;
    }
    // ★いらいを うけて いないと たたかいに ならない
    if(bi.needFlag && !G.flags[bi.needFlag]){
      U.msg(bi.lockMsg || ['まだ ここには ようが ない。'], ()=>{ G.mode='field'; });
      return;
    }
    // ★だいじなものが ないと たたかいに ならない
    if(bi.needKey && !hasKey(bi.needKey)){
      U.msg(bi.lockMsg || ['まだ ここには はいれない。'], ()=>{ G.mode='field'; });
      return;
    }
    U.msg(bi.intro || ['まものが たちふさがった！'], ()=>{ startBattle(bi.key); });
    return;
  }
  if(G.flags.desgran){
    G.mode='msg';
    U.msg(['まおうの きえた あとに、こげた いわだけが のこっている。'], ()=>{ G.mode='field'; });
    return;
  }
  G.mode='msg';
  U.msg(['どうくつの さいおくに、ぜつぼうの ちからが とぐろを まいている。',
         'デスグラン「よくぞ ここまで きたな、ちいさき ひかりよ。',
         'すべてを のみこむ やみを、その めに やきつけよ！」',
         'まおう デスグランが たちふさがった！'], ()=>{ startBattle('desgran1'); });
}
function openShop(kind){
  const list = SHOPS[P.map+':'+(kind||'S')]; if(!list) return;
  G.mode='menu';
  const items = list.map(it=>it.name+'　'+it.price+'G').concat(['やめる']);
  U.menu(items, 'なにを かいますか？', (sel)=>{
    if(sel>=list.length){ G.mode='field'; return; }
    const it = list[sel];
    G.mode='msg';
    if(P.gold < it.price){ U.msg(['ゴールドが たりないようです。'], ()=>{ G.mode='field'; }); return; }
    P.gold -= it.price;
    if(it.kind==='h'){ P.herbs++; U.msg([it.name+'を かった！'], ()=>{ U.hud(); G.mode='field'; }); return; }
    if(it.kind==='wtr'){ P.waters++; U.msg([it.name+'を かった！'], ()=>{ U.hud(); G.mode='field'; }); return; }
    // その わくが いちばん よわい なかまに 装備（きゅう装備は ふくろへ）
    const slot = it.kind==='w'?'weapon':'armor';
    const target = party.slice().sort((a,b)=>
      ((a[slot]?a[slot].v:0)-(b[slot]?b[slot].v:0)))[0];
    if(target[slot] && target[slot].v>=it.v){
      U.msg(['すでに もっと よい 装備を つけています。'], ()=>{ P.gold+=it.price; U.hud(); G.mode='field'; });
      return;
    }
    if(target[slot]) P.equipBag.push(target[slot]);
    target[slot] = {kind:it.kind, name:it.name, v:it.v};
    U.msg([it.name+'を かった！', target.name+'が 装備した！'], ()=>{ U.hud(); G.mode='field'; });
  });
}

// ---------------- 戦闘 ----------------
// ひとり たびの あいだは 状態 いじょうを うけにくくする
function statusText(type){
  return type==='sleep'   ? '眠ってしまった！'
       : type==='confuse' ? '混乱した！'
       : type==='freeze'  ? '凍りついた！'
       : type==='slow'    ? 'うごきが にぶった！'
       : '状態が おかしい！';
}
// にぶっていると 素早さが はんぶんに なる（こうどうは できる）
function effAgi(m){
  const base = m.status==='slow' ? m.agi*0.5 : m.agi;
  return base * buffMul(m,'agi');
}
// ★LQ4：てき がわの 状態 いじょう
const ESTATUS_MSG = {
  sleep:  'は 眠ってしまった！',
  confuse:'は 混乱した！',
  slow:   'の うごきが にぶった！',
};
const ESTATUS_WAKE = {
  sleep:  'は 目を 覚ました！',
  confuse:'は 正気に 戻った！',
  slow:   'の 動きが 戻った！',
};
const ESTATUS_WAKE_P = {sleep:0.30, confuse:0.34, slow:0.28};
function eEffAgi(e){ return e.status==='slow' ? e.agi*0.5 : e.agi; }
// ボスは 状態 いじょうが かかりにくい（p はんげん）。immune:true なら むこう
function inflictHit(e, st, p){
  if(e.immune) return false;
  if(e.immuneSt && e.immuneSt.indexOf(st)>=0) return false;
  const q = e.boss ? p*0.5 : p;
  return Math.random() < q;
}
function inflictP(e){
  if(!e.inflict) return 0;
  return party.length===1 ? e.inflict.p*0.6 : e.inflict.p;
}
function makeEnemy(def){
  const e = JSON.parse(JSON.stringify(def));
  e.maxhp = e.hp; e.dispName = e.name; e.status = null;
  return e;
}
function startBattle(kind){
  if(A.battleBgm) A.battleBgm(kind ? 'boss' : 'battle');
  let enemies;
  if(kind){
    enemies = [makeEnemy(MIDBOSS[kind])];
    enemies[0].boss = true;                 // ★LQ4：状態 いじょうは はんげん
    // ★そうしボス：章データに pair が あれば 2たいで あらわれる
    {
      const bi = bossInfoAt(P.map);
      if(bi && bi.key === kind && bi.pair && MIDBOSS[bi.pair]){
        const e2 = makeEnemy(MIDBOSS[bi.pair]); e2.boss = true; enemies.push(e2);
      }
    }
  }else{
    // レベルが たりない まものは まだ でてこない（はじまりの ちいきを あんぜんに たもつ）
    let all = byMapCh[(G.chapter||1)+':'+P.map] || byMap[P.map];
    if(!all){
      const m=MAPS[P.map];
      const z=(m&&m.encZones||[]).find(z=>P.x>=z.x0&&P.x<=z.x1&&P.y>=z.y0&&P.y<=z.y1);
      all = z ? z.pool : ['icicleslime'];
    }
    const plv = party[0].lv;
    let pool = all.filter(k=>{
      const e = ENEMIES.find(x=>x.key===k);
      return !e || !e.minLv || e.minLv<=plv;
    });
    // どれも でられない ＝ レベルが たりないのに おくへ きた ばあい。
    // ここは まもらない（ふかいりの きけんは のこす）
    if(!pool.length) pool = all;
    const lv = party[0].lv;
    const byLv    = lv<4 ? 1 : (lv<9 ? 2 : 3);          // レベルが ひくいうちは たいぐんに ならない
    // ★ひとりの ときも、そだつに つれて かずを ふやす。
    //   2たい どまりだと 経験値が たまらず、レベルあげが ながすぎる
    //   （第2章で Lv12まで 188せん かかっていた）。
    const byParty = party.length===1 ? (lv<5 ? 1 : lv<9 ? 2 : 3)
                                     : party.length+1;
    const maxN = Math.min(byLv, byParty);
    const n = Math.min(maxN, 1 + (Math.random()<0.45?1:0) + (Math.random()<0.18?1:0));
    enemies = [];
    for(let i=0;i<n;i++){
      const key = pool[Math.floor(Math.random()*pool.length)];
      enemies.push(makeEnemy(ENEMIES.find(x=>x.key===key)));
    }
  }
  // おなじ しゅるいが ふくすう いるときは A・B・C を つけて みわけられるように する
  const cnt0={};
  enemies.forEach(e=>{ cnt0[e.name]=(cnt0[e.name]||0)+1; });
  const idx={};
  enemies.forEach(e=>{
    if(cnt0[e.name]>1){
      idx[e.name]=(idx[e.name]||0)+1;
      e.dispName = e.name + 'ABCDEF'.charAt(idx[e.name]-1);
    }
  });
  enemies.forEach(e=>{ const d=G.dex[e.key]=G.dex[e.key]||{seen:0,kill:0}; d.seen++; });
  party.forEach(p=>{ p.buffs = null; });   // ★LQ4：バフは せんとうごとに リセット
  G.battle = {enemies, named:kind||null, round:0, order:[], queue:[], fled:false};
  G.mode='battle';
  // ★ここで A.bgm() を よぶと きょくが とまる（bgm は フィールドようで、
  //   いまは とめる しょりに なっている）。せんとうきょくは startBattle で たのむ。
  V.battleEnter(enemies, ()=>{
    const cnt={}; enemies.forEach(e=>{ cnt[e.name]=(cnt[e.name]||0)+1; });
    const intro = Object.keys(cnt).map(n=>cnt[n]>1?n+' '+cnt[n]+'たい':n).join('と ')+'が 現れた！';
    U.msg([intro], ()=>beginRound());
  });
}
function beginRound(){
  const b=G.battle; if(!b) return;
  b.round++;
  if(b.round>200){ endBattle(false); return; }  // 安全弁
  b.queue=[];
  // ★ボスの「みがまえ」は 1ラウンドで とける
  b.enemies.forEach(e=>{ if(e.braced && e.bracedAt < b.round) e.braced=false; });
  // 状態 いじょうの 回復 はんてい
  // ひとりの ときは、眠り・混乱で なにも できない じかんが ながすぎるため さめやすくする
  const solo = party.length===1;
  const wakeSleep   = solo ? 0.60 : 0.34;
  const wakeConfuse = solo ? 0.62 : 0.38;
  const wakeFreeze  = solo ? 0.62 : 0.40;   // 凍りは とけやすい
  const wakeSlow    = 0.30;                 // 鈍りは こうどうできるので きゅうさいは しない
  // ★なおった ことを かならず しらせる。
  //   しらせが ないと 「じねんに なおらない」と おもわれて しまう。
  const RECOVER_MSG = {
    sleep:  'は 目を 覚ました！',
    confuse:'は 正気に 戻った！',
    freeze: 'の 凍りが とけた！',
    slow:   'の 動きが 戻った！',
  };
  const healed = [];
  party.forEach(m=>{
    const st = m.status;
    let ok = false;
    if(st==='sleep'   && Math.random()<wakeSleep)   ok = true;
    else if(st==='confuse' && Math.random()<wakeConfuse) ok = true;
    else if(st==='freeze'  && Math.random()<wakeFreeze)  ok = true;
    else if(st==='slow'    && Math.random()<wakeSlow)    ok = true;
    if(ok){ m.status = null; healed.push(m.name + (RECOVER_MSG[st] || 'は 元に 戻った！')); }
  });
  // ★LQ4：てきの 状態 いじょうも さめる
  b.enemies.filter(e=>e.hp>0 && e.status).forEach(e=>{
    if(Math.random() < (ESTATUS_WAKE_P[e.status]||0.3)){
      const st=e.status; e.status=null;
      healed.push(e.dispName + (ESTATUS_WAKE[st]||'は 元に 戻った！'));
    }
  });
  // ★LQ4：あじかたの バフの きげんぎれ
  party.forEach(m=>{
    if(!m.buffs) return;
    Object.keys(m.buffs).forEach(k=>{
      if(m.buffs[k].until < b.round){
        delete m.buffs[k];
        healed.push(m.name+'の '+(BUFF_JP[k]||k)+'が 元に 戻った。');
      }
    });
  });
  if(healed.length){
    U.msg(healed, ()=>{ U.hud(); collectCommands(0); });
    return;
  }
  collectCommands(0);
}
function collectCommands(i){
  const b=G.battle; if(!b) return;
  const list = party.filter(p=>p.hp>0);
  if(i>=list.length){ resolveRound(); return; }
  const m = list[i];
  if(m.status==='sleep'){ b.queue.push({actor:m, type:'sleep'}); collectCommands(i+1); return; }
  if(m.status==='confuse'){ b.queue.push({actor:m, type:'confused'}); collectCommands(i+1); return; }
  if(m.status==='freeze'){ b.queue.push({actor:m, type:'frozen'}); collectCommands(i+1); return; }
  if(G.tactic!=='manual'){ b.queue.push(autoCommand(m)); collectCommands(i+1); return; }
  G.menu={kind:'battle'};
  const items=['攻撃','技','道具','防御','逃げる'];
  U.menu(items, m.name, (sel)=>{
    if(sel===0){
      chooseTarget(m, (tgt)=>{
        if(tgt===null){ collectCommands(i); return; }        // 戻る
        b.queue.push({actor:m, type:'attack', tgt}); collectCommands(i+1);
      });
    }
    else if(sel===1){
      const sp = knownSpells(m).filter(s=>s.mp<=m.mp);
      if(!sp.length){ G.mode='msg'; U.msg(['つかえる 技が ない！'], ()=>{ G.mode='battle'; collectCommands(i); }); return; }
      U.menu(sp.map(spellLabel).concat(['戻る']), m.name+'　技', (k)=>{
        if(k>=sp.length){ collectCommands(i); return; }
        const chosen=sp[k];
        if(chosen.type==='dmg' || chosen.type==='defdown'
           || (chosen.type==='inflict' && !chosen.all)){      // あいてを えらぶ 技
          chooseTarget(m, (tgt)=>{
            if(tgt===null){ collectCommands(i); return; }
            b.queue.push({actor:m, type:'spell', sp:chosen, tgt}); collectCommands(i+1);
          });
          return;
        }
        // ★回復・状態回復・そせいは 「誰に 使うか」を えらぶ
        if(spellNeedsTarget(chosen)){
          chooseMember(m, chosen, (tgt)=>{
            if(tgt===null){ collectCommands(i); return; }
            b.queue.push({actor:m, type:'spell', sp:chosen, tgt}); collectCommands(i+1);
          });
          return;
        }
        b.queue.push({actor:m, type:'spell', sp:chosen}); collectCommands(i+1);
      });
    }
    else if(sel===2){
      const opts=[];
      if(P.herbs>0) opts.push('薬草 '+P.herbs);
      if(P.waters>0) opts.push('魔法の 聖水 '+P.waters);
      if(!opts.length){ G.mode='msg'; U.msg(['道具が ない！'], ()=>{ G.mode='battle'; collectCommands(i); }); return; }
      U.menu(opts.concat(['戻る']), '道具', (k)=>{
        if(k>=opts.length){ collectCommands(i); return; }
        const kind = opts[k].startsWith('薬草') ? 'herb' : 'water';
        // ★誰に 使うかを えらぶ（1にんの ときは そのまま）
        const alive = party.filter(p=>p.hp>0);
        if(alive.length<=1){
          b.queue.push({actor:m, type:kind, tgt:alive[0]}); collectCommands(i+1); return;
        }
        const names = alive.map(p=> p.name+'　HP'+p.hp+'/'+p.maxhp+(kind==='water' ? '　MP'+p.mp+'/'+p.maxmp : ''));
        U.menu(names.concat(['戻る']), '誰に 使う？', (t)=>{
          if(t>=alive.length){ collectCommands(i); return; }
          b.queue.push({actor:m, type:kind, tgt:alive[t]}); collectCommands(i+1);
        });
      });
    }
    else if(sel===3){ b.queue.push({actor:m, type:'guard'}); collectCommands(i+1); }
    else { b.queue.push({actor:m, type:'flee'}); collectCommands(i+1); }
  });
}
function bestHeal(m, need){
  const sp = knownSpells(m).filter(s=>s.type==='heal' && s.mp<=m.mp).sort((a,b)=>b.max-a.max);
  if(!sp.length) return null;
  const enough = sp.filter(s=>s.max>=need).sort((a,b)=>a.mp-b.mp);
  return enough[0] || sp[0];      // まかなえる いちばん やすい 技／なければ さいだい
}
// あいてが 2たい いじょう なら えらばせる。1たいなら そのまま。
// ★せんとうちゅうに 「誰に 使うか」を えらぶ。
//   ひとりしか いない ときは きかない。
const STATUS_JP = {sleep:'眠り', confuse:'混乱', freeze:'凍り', slow:'鈍り'};
const BUFF_JP   = {atk:'攻撃力', def:'守備力', agi:'素早さ'};
function chooseMember(m, sp, done){
  const alive = (sp.type==='revive') ? party.filter(p=>p.hp<=0) : aliveMembers();
  if(!alive.length){ done(null); return; }
  if(alive.length===1){ done(alive[0]); return; }
  const label = alive.map(p=>{
    if(sp.type==='heal')  return p.name + '　HP' + p.hp + '/' + p.maxhp;
    if(sp.type==='cure')  return p.name + '　' + (p.status ? (STATUS_JP[p.status]||p.status) : 'そうかい');
    return p.name;
  });
  U.menu(label.concat(['戻る']), sp.name + '　誰に？', (k)=>{
    done(k >= alive.length ? null : alive[k]);
  });
}
function chooseTarget(m, cb){
  const alive = G.battle.enemies.filter(e=>e.hp>0);
  if(alive.length<=1){ cb(alive[0]||null); return; }
  U.menu(alive.map(e=>e.dispName).concat(['戻る']), '誰を 狙う？', (k)=>{
    cb(k>=alive.length ? null : alive[k]);
  });
}
function autoCommand(m){
  const b=G.battle;
  const sp = knownSpells(m).filter(s=>s.mp<=m.mp);
  // ① 倒れた なかまの そせい
  const dead = party.find(p=>p.hp<=0);
  if(dead){
    const rv = sp.find(s=>s.type==='revive');
    if(rv) return {actor:m, type:'spell', sp:rv, tgt:dead};
  }
  // ②-a ぜんたい回復（3にん いじょう きずついていたら）
  const hurtAll = party.filter(p=>p.hp>0 && p.hp<p.maxhp*0.62);
  if(hurtAll.length>=2){
    const ha = sp.filter(s=>s.type==='healall').sort((a,c)=>c.max-a.max)[0];
    if(ha) return {actor:m, type:'spell', sp:ha};
  }
  // ② 回復（のこりHPの わりあいで はんだん）
  const wounded = party.filter(p=>p.hp>0 && p.hp<p.maxhp)
                       .sort((a,c)=>a.hp/a.maxhp - c.hp/c.maxhp);
  if(wounded.length){
    const tgt = wounded[0], need = tgt.maxhp - tgt.hp, ratio = tgt.hp/tgt.maxhp;
    const limit = (G.tactic==='inochi') ? 0.62 : 0.42;
    if(ratio < limit){
      const h = bestHeal(m, need);
      if(h) return {actor:m, type:'spell', sp:h, tgt};
      if(P.herbs>0 && ratio<0.34) return {actor:m, type:'herb', tgt};
    }
  }
  // ③ MPぎれなら せいすい
  if(m.maxmp>0 && m.mp<6 && P.waters>0 && knownSpells(m).some(s=>s.type==='heal'))
    return {actor:m, type:'water', tgt:m};
  // ④ 攻撃
  const alive = b.enemies.filter(e=>e.hp>0);
  const dmg = sp.filter(s=>s.type==='dmg'||s.type==='dmgall');
  if(dmg.length && alive.length>=2){
    const all = dmg.find(s=>s.type==='dmgall');
    if(all && m.mp >= all.mp*2) return {actor:m, type:'spell', sp:all};
  }
  const single = dmg.filter(s=>s.type==='dmg').sort((a,c)=>c.max-a.max)[0];
  if(single && m.mp > single.mp*3 && mAtk(m) < single.max)
    return {actor:m, type:'spell', sp:single,
            tgt:alive.slice().sort((x,y)=>x.hp-y.hp)[0]};   // ぶつりが よわい なかまは 技
  const weakest = alive.slice().sort((x,y)=>x.hp-y.hp)[0];
  return {actor:m, type:'attack', tgt:weakest};
}
function resolveRound(){
  const b=G.battle; if(!b) return;
  const acts = b.queue.slice();
  b.enemies.filter(e=>e.hp>0).forEach(e=>{
    const n = e.acts||1;
    for(let i=0;i<n;i++) acts.push({enemy:e, type:'enemy'});
  });
  acts.sort((a,c)=>{
    const av = a.actor?effAgi(a.actor):eEffAgi(a.enemy);
    const cv = c.actor?effAgi(c.actor):eEffAgi(c.enemy);
    return (cv+Math.random()*4)-(av+Math.random()*4);
  });
  party.forEach(p=>p.guard=false);
  stepAction(acts,0);
}
function stepAction(acts,i){
  const b=G.battle; if(!b) return;
  if(b.enemies.every(e=>e.hp<=0)){ victory(); return; }
  if(aliveMembers().length===0){ defeat(); return; }
  if(i>=acts.length){ beginRound(); return; }
  const a = acts[i];
  const next = ()=>stepAction(acts,i+1);
  if(a.type==='enemy'){
    if(a.enemy.hp<=0){ next(); return; }
    enemyAct(a.enemy, next); return;
  }
  if(a.actor.hp<=0){ next(); return; }
  memberAct(a, next);
}
function memberAct(a, done){
  const b=G.battle, m=a.actor;
  const alive = b.enemies.filter(e=>e.hp>0);
  if(a.type==='sleep'){ U.msg([m.name+'は 眠っている…'], done); return; }
  if(a.type==='frozen'){ U.msg([m.name+'は 凍りついて うごけない！'], done); return; }
  if(a.type==='confused'){ // 混乱：てきか みかたか わからなくなる
    const allies=aliveMembers().filter(p=>p!==m);
    if(Math.random()<0.45 && allies.length){
      const t2=allies[Math.floor(Math.random()*allies.length)];
      const d2=Math.max(1, Math.floor(mAtk(m)*0.6) - Math.floor(mDef(t2)/2));
      t2.hp-=d2; A.hit(); U.hud();
      const l=[m.name+'は 混乱している！', m.name+'は '+t2.name+'を 攻撃！',
               t2.name+'は '+d2+'の ダメージを 受けた！'];
      if(t2.hp<=0){ t2.hp=0; t2.status=null; l.push(t2.name+'は 倒れた…'); }
      U.msg(l, done); return;
    }
    U.msg([m.name+'は 混乱している！', m.name+'は ふらふらと あるきまわった。'], done);
    return;
  }
  if(a.type==='guard'){ m.guard=true; U.msg([m.name+'は みを まもっている。'], done); return; }
  if(a.type==='flee'){
    if(b.named){ U.msg(['逃げられない！'], done); return; }
    if(Math.random()<0.6){ b.fled=true; if(A.flee) A.flee();
      U.msg([m.name+'たちは にげだした！'], ()=>endBattle(false)); }
    else U.msg([m.name+'は にげようとしたが まわりこまれた！'], done);
    return;
  }
  if(a.type==='herb'){
    if(P.herbs<=0){ done(); return; }
    P.herbs--;
    const t = a.tgt && a.tgt.hp>0 ? a.tgt : aliveMembers().sort((x,y)=>x.hp/x.maxhp-y.hp/y.maxhp)[0];
    const h = Math.min(t.maxhp-t.hp, 20+Math.floor(Math.random()*9));
    t.hp+=h; A.heal(); U.hud();
    V.fx('heal',{member:t}, ()=>{
      V.pop({side:'party', index:party.indexOf(t), text:'+'+h, kind:'heal'});
      U.msg([m.name+'は 薬草を 使った！', t.name+'の HPが '+h+' 回復！'], done);
    });
    return;
  }
  if(a.type==='water'){
    if(P.waters<=0){ done(); return; }
    P.waters--;
    const t = a.tgt && a.tgt.hp>0 ? a.tgt : aliveMembers().filter(p=>p.maxmp>0).sort((x,y)=>x.mp-y.mp)[0]||m;
    const h = Math.min(t.maxmp-t.mp, 30);
    t.mp+=h; A.heal(); U.hud();
    U.msg([m.name+'は 魔法の 聖水を 使った！', t.name+'の MPが '+h+' 回復！'], done);
    return;
  }
  if(a.type==='spell'){
    const sp=a.sp;
    if(m.mp<sp.mp){ U.msg([m.name+'は MPが たりない！'], done); return; }
    m.mp-=sp.mp; U.hud();
    if(sp.type==='heal'){
      const t = a.tgt && a.tgt.hp>0 ? a.tgt : aliveMembers().sort((x,y)=>x.hp/x.maxhp-y.hp/y.maxhp)[0];
      const h = Math.min(t.maxhp-t.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
      t.hp+=h; A.heal(); U.hud();
      V.fx('heal',{member:t}, ()=>{
        V.pop({side:'party', index:party.indexOf(t), text:'+'+h, kind:'heal'});
        U.msg([m.name+'は '+sp.name+castVerb(m), t.name+'の HPが '+h+' 回復！'], done);
      });
      return;
    }
    if(sp.type==='healall'){
      const targets=aliveMembers();
      const lines=[m.name+'は '+sp.name+castVerb(m)];
      A.heal();
      targets.forEach(tg=>{
        const h=Math.min(tg.maxhp-tg.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
        if(h>0){ tg.hp+=h; lines.push(tg.name+'の HPが '+h+' 回復！'); }
      });
      if(lines.length===1) lines.push('しかし 効果が なかった。');
      U.hud();
      V.fx('heal',{}, ()=>U.msg(lines, done));
      return;
    }
    if(sp.type==='cure'){
      const t = party.find(p=>p.status) || m;
      t.status=null; A.heal();
      U.msg([m.name+'は '+sp.name+castVerb(m), t.name+'の 状態が 戻った。'], done);
      return;
    }
    if(sp.type==='revive'){
      const t = party.find(p=>p.hp<=0);
      if(!t){ U.msg(['しかし 効果が なかった。'], done); return; }
      t.hp=Math.ceil(t.maxhp/2); t.status=null; A.heal(); U.hud();
      U.msg([m.name+'は '+sp.name+castVerb(m), t.name+'は 生き返った！'], done);
      return;
    }
    if(sp.type==='dmgall'){
      const lines=[m.name+'は '+sp.name+castVerb(m)];
      A.hit();
      V.fx('spellall',{}, ()=>{
        alive.forEach(e=>{
          const d = sp.min+Math.floor(Math.random()*(sp.max-sp.min+1));
          e.hp-=d; V.pop({enemy:e, text:d, kind:'dmg'});
          lines.push(e.dispName+'に '+d+'の ダメージ！');
          if(e.hp<=0){ e.hp=0; lines.push(e.dispName+'を 倒した！'); killed(e); }
        });
        U.msg(lines, done);
      });
      return;
    }
    if(A.spell) A.spell();
    // ★LQ4 inflict：あいてに 状態 いじょうを あたえる
    if(sp.type==='inflict'){
      const live = b.enemies.filter(e=>e.hp>0);
      if(!live.length){ done(); return; }
      const tgts = sp.all ? live : [ (a.tgt && a.tgt.hp>0) ? a.tgt : live[0] ];
      const lines=[m.name+'は '+sp.name+castVerb(m)];
      let any=false;
      // ★st2 が ある 技は、1つめが かからなかった とき（または すでに かかって
      //   いる とき）に 2つめを ためす。てきの 状態は 1つしか もてない ため、
      //   「眠り＋鈍り どうじ」は こう いう かたちで あらわす（とこよの ゆめ）。
      const cands = sp.st2 ? [sp.st, sp.st2] : [sp.st];
      tgts.forEach(tg=>{
        let done2 = false;
        for(const st of cands){
          if(tg.status===st){                       // すでに その 状態
            if(st===cands[cands.length-1]){
              lines.push(tg.dispName+'は すでに '+(STATUS_JP[st]||st)+'。'); done2=true;
            }
            continue;
          }
          if(inflictHit(tg, st, (st===sp.st ? sp.p : (sp.p2 || sp.p)))){
            tg.status = st; any=true; done2=true;
            V.pop({enemy:tg, text:(STATUS_JP[st]||st)+'！', kind:'status'});
            lines.push(tg.dispName + (ESTATUS_MSG[st]||'の 状態が かわった！'));
            break;
          }
        }
        if(!done2){
          lines.push(tg.dispName+'には 効かなかった。');
          V.pop({enemy:tg, text:'ミス', kind:'miss'});
        }
      });
      if(any) V.refresh();
      U.msg(lines, done);
      return;
    }
    // ★LQ4 buff：みかたを nターン きょうかする
    if(sp.type==='buff'){
      const tgts = sp.all ? aliveMembers()
                          : [ (a.tgt && a.tgt.hp>0) ? a.tgt : m ];
      const until = (b.round|0) + (sp.turns||3);
      const lines=[m.name+'は '+sp.name+castVerb(m)];
      tgts.forEach(tg=>{
        tg.buffs = tg.buffs || {};
        const cur = tg.buffs[sp.stat];
        // かさねがけは のびるだけ（ばいりつは たかいほうを のこす）
        tg.buffs[sp.stat] = {mul: Math.max(sp.mul||1.25, cur?cur.mul:0), until: Math.max(until, cur?cur.until:0)};
        lines.push(tg.name+'の '+(BUFF_JP[sp.stat]||sp.stat)+'が 上がった！');
      });
      U.hud();
      U.msg(lines, done);
      return;
    }
    // ★defdown：あいての 守備力を さげる
    if(sp.type==='defdown'){
      const alive = b.enemies.filter(e=>e.hp>0);
      if(!alive.length){ done(); return; }
      const tg = (a.tgt && a.tgt.hp>0) ? a.tgt : alive[0];
      const cut = sp.cut || 8;
      const before = eDef(tg);
      tg.defDown = {v:Math.min((tg.def|0), ((tg.defDown&&tg.defDown.v)||0) + cut)};
      const after = eDef(tg);
      const lines=[m.name+'は '+sp.name+castVerb(m)];
      if(after < before) lines.push(tg.dispName+'の 守備力が さがった！');
      else lines.push(tg.dispName+'には 効かなかった。');
      U.msg(lines, done);
      return;
    }
    // dmg（単体）：えらんだ あいてが たおれていたら ほかへ
    const t = (a.tgt && a.tgt.hp>0) ? a.tgt : alive[0];
    if(!t){ done(); return; }
    const d = sp.min+Math.floor(Math.random()*(sp.max-sp.min+1));
    A.hit();
    V.fx('spell',{target:t}, ()=>{
      V.pop({enemy:t, text:d, kind:'dmg'});
      t.hp-=d;
      const lines=[m.name+'は '+sp.name+castVerb(m), t.dispName+'に '+d+'の ダメージ！'];
      if(t.hp<=0){ t.hp=0; lines.push(t.dispName+'を 倒した！'); killed(t); }
      U.msg(lines, done);
    });
    return;
  }
  // 通常攻撃：えらんだ あいてが たおれていたら ほかへ
  const t = (a.tgt && a.tgt.hp>0) ? a.tgt
          : alive[Math.floor(Math.random()*alive.length)];
  if(!t){ done(); return; }
  const crit = Math.random()<1/16;
  let d = Math.max(1, mAtk(m) - Math.floor(eDef(t)/2) + Math.floor(Math.random()*5) - 2);
  if(crit) d = Math.floor(d*2);
  if(t.tough) d = crit ? Math.max(2, Math.floor(d*0.3)) : (Math.random()<0.5?1:2); // めったに きかない
  A.hit();
  V.fx('attack',{member:m, target:t}, ()=>{
    t.hp-=d;
    V.pop({enemy:t, text:d, kind:crit?'crit':'dmg'});
    const lines=[m.name+'の 攻撃！'];
    if(crit) lines.push('会心の 一撃！！');
    lines.push(t.dispName+'に '+d+'の ダメージ！');
    if(t.hp<=0){ t.hp=0; lines.push(t.dispName+'を 倒した！'); killed(t); }
    U.msg(lines, done);
  });
}
// ★てきの 守備力（よわめられて いれば さがる）
function eDef(e){
  const cut = e.defDown ? e.defDown.v : 0;
  let d = Math.max(0, (e.def|0) - cut);
  if(e.braced)   d = d + Math.floor((e.def|0)*0.5) + 4;  // みがまえ：かたい
  if(e.charging) d = Math.floor(d*0.5);                  // ためこみ中は すきだらけ
  return Math.max(0, d);
}
function killed(e){ const d=G.dex[e.key]=G.dex[e.key]||{seen:1,kill:0}; d.kill++;
  // ★いらい（倒した かずを かぞえる）
  if(G.quota && G.quota.n < G.quota.need){
    G.quota.n++;
    if(G.quota.n >= G.quota.need) G.flags[G.quota.flag] = true;
  }
  if(A.defeat) A.defeat(); V.refresh(); }
// ★ためわざの かいほう（1ラウンド ためて、つぎの ラウンドに はなつ）
function releaseCharge(e, alive, done){
  const c = e.charge, lines = [];
  e.charging = false;
  A.cue(); A.ehit();
  if(c.aoe){
    lines.push(e.dispName+'の '+c.name+'！');
    V.fx('enemyaoe',{from:e}, ()=>{
      alive.forEach(m=>{
        let d = Math.floor(e.atk*(c.mul||1.5)) - Math.floor(mDef(m)/3)
              + Math.floor(Math.random()*7) - 3;
        d = Math.max(1, d);
        if(m.guard) d = Math.max(1, Math.ceil(d*0.4));
        m.hp -= d;
        V.pop({side:'party', index:party.indexOf(m), text:d, kind:'pdmg'});
        lines.push(m.name+'は '+d+'の ダメージ！'+(m.guard?'（防御）':''));
        if(m.hp<=0){ m.hp=0; m.status=null; lines.push(m.name+'は 倒れた…'); }
      });
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  const t = alive[Math.floor(Math.random()*alive.length)];
  let d = Math.max(1, Math.floor(e.atk*(c.mul||2.0)) - Math.floor(mDef(t)/2)
                    + Math.floor(Math.random()*7) - 3);
  if(t.guard) d = Math.max(1, Math.ceil(d*0.4));
  V.fx('enemyattack',{target:t, from:e}, ()=>{
    t.hp -= d;
    lines.push(e.dispName+'の '+c.name+'！',
               t.name+'は '+d+'の ダメージを 受けた！'+(t.guard?'（防御）':''));
    if(t.hp<=0){ t.hp=0; t.status=null; lines.push(t.name+'は 倒れた…'); }
    U.hud(); U.msg(lines, done);
  });
}
function enemyAct(e, done){
  const alive = aliveMembers();
  if(!alive.length){ defeat(); return; }
  const lines=[];
  const rnd = (G.battle && G.battle.round) || 0;
  // ★LQ4：眠っている てきは こうどう できない
  if(e.status==='sleep'){ U.msg([e.dispName+'は 眠っている…'], done); return; }
  // ★LQ4：混乱した てきは なかまを たたく ことが ある
  if(e.status==='confuse' && Math.random()<0.5){
    const mates = G.battle.enemies.filter(x=>x.hp>0 && x!==e);
    if(!mates.length){ U.msg([e.dispName+'は 混乱して あばれている！'], done); return; }
    const t2 = mates[Math.floor(Math.random()*mates.length)];
    const d2 = Math.max(1, Math.floor(e.atk*0.7) - Math.floor(eDef(t2)/2));
    A.ehit();
    t2.hp -= d2;
    const l=[e.dispName+'は 混乱している！', e.dispName+'は '+t2.dispName+'を 攻撃！',
             t2.dispName+'に '+d2+'の ダメージ！'];
    if(t2.hp<=0){ t2.hp=0; l.push(t2.dispName+'を 倒した！'); killed(t2); }
    V.refresh();
    U.msg(l, done);
    return;
  }
  // ★けいたい へんか：HPが しきいちを われたら 1どだけ ちからを かいほうする
  if(e.enrage && !e.enraged && e.hp>0 && e.hp <= e.maxhp*(e.enrage.at||0.4)){
    e.enraged = true;
    e.atk = Math.floor(e.atk * (e.enrage.atk||1.15));
    if(e.charge && e.enrage.chargeP) e.charge.p = e.enrage.chargeP;
    if(e.aoe && e.enrage.aoeP)       e.aoe.p    = e.enrage.aoeP;
    e.charging = false;                      // ためを キャンセルして すがたを かえる
    A.cue(); V.refresh();
    U.msg([e.dispName+'は '+(e.enrage.name||'ちからを かいほうした！'),
           e.dispName+'の 攻撃力が 上がった！'], done);
    return;
  }
  // ★ためわざ：ためた つぎの ラウンドで はなつ
  if(e.charging && rnd > e.chargeAt) return releaseCharge(e, alive, done);
  // ★ためわざ：ためこみ（この ラウンドは こうどうを すてる）
  if(e.charge && !e.charging && Math.random() < e.charge.p){
    e.charging = true; e.chargeAt = rnd;
    A.cue();
    U.msg([e.dispName+'は '+(e.charge.tell||'ちからを ためこんで いる…')], done);
    return;
  }
  // ★みがまえ：1ラウンド かたくなる
  if(e.brace && !e.braced && !e.charging && Math.random() < e.brace.p){
    e.braced = true; e.bracedAt = rnd;
    A.cue();
    U.msg([e.dispName+'は '+(e.brace.name||'みを かためた！')], done);
    return;
  }
  // にげる（ルスライム）
  if(e.fleeP && Math.random()<e.fleeP){
    e.hp=0; e.fled=true; V.refresh();
    U.msg([e.dispName+'は すばやく にげだした！'], ()=>{
      const b2=G.battle;
      if(b2 && b2.enemies.every(x=>x.hp<=0)){
        if(b2.enemies.every(x=>x.fled)) U.msg(['……にがして しまった。'], ()=>endBattle(false));
        else victory();
        return;
      }
      done();
    });
    return;
  }
  // とくぎ
  if(e.skill && Math.random()<e.skill.p){
    const ts=alive[Math.floor(Math.random()*alive.length)];
    let ds=Math.max(1, Math.floor(e.atk*e.skill.mul) - Math.floor(mDef(ts)/2) + Math.floor(Math.random()*5)-2);
    if(ts.guard) ds=Math.max(1, Math.ceil(ds*0.4));
    A.cue(); A.ehit();
    V.fx('enemyattack',{target:ts, from:e}, ()=>{
      ts.hp-=ds;
      V.pop({side:'party', index:party.indexOf(ts), text:ds, kind:'pdmg'});
      lines.push(e.dispName+'の '+e.skill.name+'！',
                 ts.name+'は '+ds+'の ダメージを 受けた！'+(ts.guard?'（防御）':''));
      if(e.drain){
        const h=Math.min(e.maxhp-e.hp, Math.floor(ds*e.drain));
        if(h>0){ e.hp+=h; lines.push(e.dispName+'は HPを '+h+' 吸い取った！'); }
      }
      if(ts.hp<=0){ ts.hp=0; ts.status=null; lines.push(ts.name+'は 倒れた…'); }
      else if(e.inflict && Math.random()<inflictP(e) && !ts.status){
        ts.status=e.inflict.type;
        lines.push(ts.name+'は '+statusText(e.inflict.type));
      }
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  // 技
  if(e.spell && Math.random()<e.spell.p){
    const sp=e.spell;
    if(sp.kind==='heal'){
      const hurt=(G.battle.enemies.filter(x=>x.hp>0&&x.hp<x.maxhp)
                  .sort((a2,b2)=>a2.hp/a2.maxhp-b2.hp/b2.maxhp))[0];
      const tg=hurt||e;
      const h=Math.min(tg.maxhp-tg.hp, sp.lo+Math.floor(Math.random()*(sp.hi-sp.lo+1)));
      tg.hp+=h; A.heal();
      U.msg([e.dispName+'は '+sp.name+castVerb(m),
             tg.dispName+'の きずが ふさがった！ HPが '+h+' 回復！'], done);
      return;
    }
    const tp=alive[Math.floor(Math.random()*alive.length)];
    let dp=sp.lo+Math.floor(Math.random()*(sp.hi-sp.lo+1));
    dp=Math.max(1, dp - Math.floor(mDef(tp)/5));
    if(tp.guard) dp=Math.max(1, Math.ceil(dp*0.5));
    A.cue(); A.ehit();
    V.fx('enemyattack',{target:tp, from:e}, ()=>{
      tp.hp-=dp;
      V.pop({side:'party', index:party.indexOf(tp), text:dp, kind:'pdmg'});
      lines.push(e.dispName+'は '+sp.name+castVerb(m),
                 tp.name+'は '+dp+'の ダメージを 受けた！');
      if(tp.hp<=0){ tp.hp=0; tp.status=null; lines.push(tp.name+'は 倒れた…'); }
      else{
        const inf = e.spellInflict || e.inflict;     // うたは ねむらせ、まなざしは にぶらせる
        if(inf && Math.random()<inflictP({inflict:inf}) && !tp.status){
          tp.status=inf.type;
          lines.push(tp.name+'は '+statusText(inf.type));
        }
      }
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  // ぜんたいわざ
  if(e.aoe && Math.random()<e.aoe.p){
    lines.push(e.dispName+'は '+e.aoe.name+'を はなった！');
    A.cue(); A.ehit();
    V.fx('enemyaoe',{from:e}, ()=>{
      alive.forEach(m=>{
        let d = e.aoe.lo + Math.floor(Math.random()*(e.aoe.hi-e.aoe.lo+1));
        d = Math.max(1, d - Math.floor(mDef(m)/4));   // いき・ぜんたいわざにも 装備が きく
        if(m.guard) d = Math.max(1, Math.ceil(d*0.4));
        m.hp-=d; lines.push(m.name+'は '+d+'の ダメージ！'+(m.guard?'（防御）':''));
        if(m.hp<=0){ m.hp=0; m.status=null; lines.push(m.name+'は 倒れた…'); }
      });
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  const t = alive[Math.floor(Math.random()*alive.length)];
  let d = Math.max(1, e.atk - Math.floor(mDef(t)/2) + Math.floor(Math.random()*5) - 2);
  if(t.guard) d = Math.max(1, Math.ceil(d*0.4));
  A.cue(); A.ehit();
  V.fx('enemyattack',{target:t, from:e}, ()=>{
    t.hp-=d;
    lines.push(e.dispName+'の 攻撃！', t.name+'は '+d+'の ダメージを 受けた！'+(t.guard?'（防御）':''));
    if(e.drain){
      const h=Math.min(e.maxhp-e.hp, Math.floor(d*e.drain));
      if(h>0){ e.hp+=h; lines.push(e.dispName+'は HPを '+h+' 吸い取った！'); }
    }
    if(t.hp<=0){ t.hp=0; t.status=null; lines.push(t.name+'は 倒れた…'); }
    else if(e.inflict && Math.random()<inflictP(e) && !t.status){
      t.status=e.inflict.type;
      lines.push(t.name+'は '+statusText(e.inflict.type));
    }
    U.hud(); U.msg(lines, done);
  });
}
// けいたい へんかの れんせん（HP・MPは ひきつぐ）
function bossPhase(next, lines){
  showMsg2(lines, ()=>{
    G.battle=null; G.menu=null;
    startBattle(next);
  });
}
function showMsg2(lines, cb){ U.msg(lines, cb); }
function victory(){
  const b=G.battle;
  if(A.bgmStop) A.bgmStop();      // しょうりBGMは はいし。せんとうきょくを とめるだけ。
  const got = b.enemies.filter(e=>!e.fled);
  // ★ばしょに よって 経験値が かわる（かせぎばを つくる）
  const mul = EXP_MUL[P.map] || 1;
  const exp = Math.round(got.reduce((a,e)=>a+e.exp,0) * mul);
  const gold = got.reduce((a,e)=>a+e.gold,0);
  P.gold += gold;
  A.win();
  const lines=['魔物たちを 倒した！','経験値 '+exp+'、'+gold+'ゴールドを 獲得！'];
  let leveled=false;
  aliveMembers().concat(reserve.filter(m=>m.hp>0)).forEach(m=>{
    m.exp += exp;
    while(m.exp >= expNext(m)){
      m.exp -= expNext(m); m.lv++; leveled=true;
      const g = CLASSES[m.cls].g;
      m.maxhp+=g.hp; m.maxmp+=g.mp; m.batk+=g.atk; m.bdef+=g.def;
      if(m.lv%2===0) m.agi+=g.agi;
      m.hp=m.maxhp; m.mp=m.maxmp;
      lines.push(m.name+'は レベル'+m.lv+'に 上がった！');
      const ns = CLASSES[m.cls].learns.find(l=>l.lv===m.lv);
      if(ns) lines.push(m.name+'は '+SPELL_DEFS[ns.key].name+'を 覚えた！');
    }
  });
  if(leveled) A.lvup();
  // ★章データの ボスごほうび（IVは どの章も これだけで うごく）
  {
    const cd = chData();
    const rw = cd && cd.bossReward && cd.bossReward[b.named];
    if(rw){
      (rw.set||[]).forEach(f=>{ G.flags[f]=true; });
      if(rw.giveKey) giveKey(rw.giveKey);
      // ★なかまが たびだつ／たおれる（ゼフの ぎせい）
      if(rw.removeMember){
        const i2 = party.findIndex(p=>p.cls===rw.removeMember);
        if(i2>=0) party.splice(i2,1);
        else{ const i3 = reserve.findIndex(p=>p.cls===rw.removeMember);
              if(i3>=0) reserve.splice(i3,1); }
        V.setActors(true); U.hud();
      }
      if(rw.takeKey) takeKey(rw.takeKey);
      if(rw.setTiles){
        (Array.isArray(rw.setTiles)?rw.setTiles:[rw.setTiles]).forEach(o=>{
          setTile(o.map||P.map, o.x, o.y, o.ch||'.');
        });
        V.refresh && V.refresh();
      }
      if(rw.setState && WORLD.TOWN_STATES[rw.setState]) G.townState = rw.setState;
      Object.keys(rw.quest||{}).forEach(q=>questAdvance(q, rw.quest[q]));
      lines.push(...(rw.msg||[]));
    }
  }
  U.hud();
  // ★れんせん：ボスが すがたを かえる（HP・MPは そのまま）
  const _cd6 = chData();
  const nxRw = (b && b.named && _cd6 && _cd6.bossReward) ? _cd6.bossReward[b.named] : null;
  if(nxRw && nxRw.nextBoss && MIDBOSS[nxRw.nextBoss]){
    U.msg(lines, ()=>{ startBattle(nxRw.nextBoss); });
    return;
  }
  U.msg(lines, ()=>endBattle(true));
}
function defeat(){
  A.lose();
  U.msg(['全滅して しまった…'], ()=>{
    party.concat(reserve).forEach(m=>{ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; });
    P.gold = Math.floor(P.gold/2);
    G.battle=null;
    G.busy=true;
    if(A.bgmStop) A.bgmStop();
    V.battleLeave(()=>{
      const h=deathPoint();
      moorShipFor(h.map);                      // ★ふねも いえの はまへ
      P.map=h.map; P.x=h.x; P.y=h.y; G.trail=[[h.x,h.y],[h.x,h.y]];
      V.buildMap(h.map); V.setActors(); U.label(WORLD.mapName(h.map)); U.hud();
      A.bgm(h.map);
      G.mode='field'; G.busy=false;
      U.msg(['気がつくと '+h.name+'に いた。','（ゴールドを 半分 落とした…）'], ()=>{});
    });
  });
}
function endBattle(won){
  // ★せんとうが おわったら 状態 いじょうは とける。
  //   のこったままだと、あるいて いる あいだ ずっと 混乱の ままに なる。
  party.forEach(p=>{ if(p.hp>0) p.status=null; p.buffs=null; });
  G.battle=null; G.menu=null;
  G.busy=true;
  V.battleLeave(()=>{
    A.bgm(P.map);
    G.mode='field'; G.busy=false; V.setActors(); U.hud();
  });
}

// ---------------- ぎょうしょう（あきない）----------------
// バルドは しょうにん。まちごとに そうばが ちがう ものを はこんで もうける。
// おなじ まちで かって うっても そんを する ように、うりねは かいねの 85%。
const TRADE_GOODS = {
  nuno:   {key:'nuno',   name:'ぬの',          base:20},
  spice:  {key:'spice',  name:'こうしんりょう',  base:60},
  glass:  {key:'glass',  name:'がらすだま',     base:40},
  dates:  {key:'dates',  name:'ほしたなつめ',   base:15},
  silver: {key:'silver', name:'ぎんの かざり',  base:120},
};
// まちごとの そうば（1.0が きじゅん）
const TRADE_MARKET = {};   // ★行商ミニは M2（2章・湧き水の町）で 使う
function tradeTowns(){ return Object.keys(TRADE_MARKET); }
// そうばは まちに はいる たびに すこし ゆれる
function marketSeed(map){
  const t = (G.marketTick|0);
  let h = 0, s = map + ':' + t;
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function tradePrice(map, key){
  const g = TRADE_GOODS[key], mk = TRADE_MARKET[map];
  if(!g || !mk) return null;
  const wave = ((marketSeed(map + key) % 41) - 20) / 100;   // ±20%
  return Math.max(1, Math.round(g.base * mk[key] * (1 + wave)));
}
function sellPrice(map, key){
  const p = tradePrice(map, key);
  return p === null ? null : Math.max(1, Math.round(p * 0.85));
}
function goodsCount(key){ return (P.goods && P.goods[key]) | 0; }
function goodsTotal(){ return Object.values(P.goods || {}).reduce((a,b)=>a+(b|0), 0); }
const GOODS_LIMIT = 30;                       // かつげる かず
function buyGood(map, key, n){
  const p = tradePrice(map, key);
  if(p === null) return {ok:false, msg:'ここでは あつかって いない。'};
  n = Math.max(1, n|0);
  if(goodsTotal() + n > GOODS_LIMIT) return {ok:false, msg:'これいじょうは かつげない。'};
  const cost = p * n;
  if(P.gold < cost) return {ok:false, msg:'ゴールドが たりない。'};
  P.gold -= cost;
  P.goods = P.goods || {};
  P.goods[key] = goodsCount(key) + n;
  return {ok:true, msg:TRADE_GOODS[key].name + 'を ' + n + 'こ しいれた！（' + cost + 'G）', cost};
}
function sellGood(map, key, n){
  const p = sellPrice(map, key);
  if(p === null) return {ok:false, msg:'ここでは ひきとって もらえない。'};
  const have = goodsCount(key);
  if(have <= 0) return {ok:false, msg:'もって いない。'};
  n = Math.min(have, Math.max(1, n|0));
  const gain = p * n;
  P.gold += gain;
  P.goods[key] = have - n;
  if(P.goods[key] <= 0) delete P.goods[key];
  // ★はじめて もうけたら しょうかいちょうが ほめる（ものがたりの めじるし）
  G.tradeProfit = (G.tradeProfit | 0) + gain;
  return {ok:true, msg:TRADE_GOODS[key].name + 'を ' + n + 'こ うった！（' + gain + 'G）', gain};
}
// ---------------- 技（せんとうの そとで 使う）----------------
// そとで つかえるのは 回復・状態 回復・そせい だけ。
// 攻撃 技は 「ここでは つかえない」。
// ★けっかい：ここを とおるには じょうけんが いる
const WARDS = {
  rift_yard: {chapter:1, flag:'ch0_trialDone',
    msg:['広場へ つづく 道は、まだ 昼の 人どおりで にぎわって いる。',
         'イオ「……試験が おわってから だな」']},
};
// ★ふね・こぶねは IVでは つかわない（飛翔グライダーは M2いこう）
const FERRY = {};
const FERRY_BACK = null;
const FIELD_SPELL = {heal:true, cure:true, revive:true, healall:true, 'return':true};
// リターンで いける ばしょ（いちど おとずれた ところ だけ）
// ★リターンさきは 「いまの しょうの ちほう」だけ。
//   しょうは それぞれ べつの ものがたりなので、ほかの ちほうへ とんでは いけない
//   （第2章の バルドが 第1章の まちへ とんで、リオンあての せりふが でる ふぐあいが あった）。
function allReturnSpots(){
  if(!CHD) return [];
  const cd = CHD.get(G.chapter||1);
  return (cd && cd.returnSpots) ? cd.returnSpots.slice() : [];
}
function returnDestinations(){
  return allReturnSpots()
    .filter(s=>MAPS[s.map] && G.visited[s.map])
    .map(s=>({...s, name:WORLD.mapName(s.map)}));
}
// どうくつの なかでは つかえない（DQと おなじ）
function canReturnHere(){
  const th = (MAPS[P.map]||{}).theme;
  return th!=='ice' && th!=='cave';
}
function castReturn(ci, di){
  const m = party[ci], sp = SPELL_DEFS.ret;
  const list = returnDestinations();
  const d = list[di];
  if(!m || !d) return {ok:false, lines:['どこへ いく？']};
  if(!canReturnHere()) return {ok:false, lines:['ここでは 使えない。','そとへ でなければ ならない。']};
  if(m.mp < sp.mp) return {ok:false, lines:['MPが たりない！']};
  m.mp -= sp.mp;
  moorShipFor(d.map);                          // ★ふねも いきさきの はまへ
  return {ok:true, warp:{to:d.map, x:d.x, y:d.y},
          lines:[m.name+'は リターンを 唱えた！','光に 包まれ、空へ 舞い上がった——']};
}
function fieldSpells(m){
  return knownSpells(m).filter(s=>FIELD_SPELL[s.type]);
}
function spellNeedsTarget(sp){ return sp.type==='heal' || sp.type==='cure' || sp.type==='revive'
                                   || (sp.type==='buff' && !sp.all); }
function castField(ci, key, ti){
  const m = party[ci];
  const sp = SPELL_DEFS[key];
  if(!m || !sp) return {ok:false, lines:['その 技は 使えない。']};
  if(m.hp<=0)   return {ok:false, lines:[m.name+'は 倒れている。']};
  if(!FIELD_SPELL[sp.type]) return {ok:false, lines:['ここでは つかっても しかたが ない。']};
  if(m.mp < sp.mp) return {ok:false, lines:['MPが たりない！']};

  const t = (ti===undefined||ti===null) ? null : party[ti];
  const lines = [m.name+'は '+sp.name+castVerb(m)];

  if(sp.type==='heal'){
    if(!t) return {ok:false, lines:['誰に 使う？']};
    if(t.hp<=0) return {ok:false, lines:[t.name+'は 倒れている。リヴァイブが ひつよう だ。']};
    if(t.hp>=t.maxhp) return {ok:false, lines:[t.name+'の HPは まんたんだ。']};
    m.mp -= sp.mp;
    const v = Math.min(t.maxhp-t.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
    t.hp += v;
    lines.push(t.name+'の HPが '+v+' 回復した！');
  }else if(sp.type==='healall'){
    const alive = party.filter(x=>x.hp>0 && x.hp<x.maxhp);
    if(!alive.length) return {ok:false, lines:['みんな げんきだ。']};
    m.mp -= sp.mp;
    alive.forEach(x=>{
      const v = Math.min(x.maxhp-x.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
      x.hp += v;
      lines.push(x.name+'の HPが '+v+' 回復した！');
    });
  }else if(sp.type==='cure'){
    if(!t) return {ok:false, lines:['誰に 使う？']};
    if(!t.status) return {ok:false, lines:[t.name+'は なんとも ない。']};
    m.mp -= sp.mp;
    t.status = null;
    lines.push(t.name+'の からだが らくに なった！');
  }else if(sp.type==='revive'){
    if(!t) return {ok:false, lines:['誰に 使う？']};
    if(t.hp>0) return {ok:false, lines:[t.name+'は たおれていない。']};
    m.mp -= sp.mp;
    t.hp = Math.max(1, Math.floor(t.maxhp*0.5));
    t.status = null;
    lines.push(t.name+'は いきを ふきかえした！');
  }
  return {ok:true, lines};
}
// ---------------- だいじなもの（キーアイテム）----------------
const KEY_ITEMS = {
  fathersword:{key:'fathersword', name:'父の 打った 剣',
    desc:'地上生まれの 名工が 打った 一振り。天空鋼では ない、ただの 鋼。'},
};
function hasKey(id){ return !!(P.keyItems && P.keyItems[id]); }
function giveKey(id){ P.keyItems = P.keyItems || {}; P.keyItems[id] = true; }
function takeKey(id){ if(P.keyItems) delete P.keyItems[id]; }
function keyItemList(){
  return Object.keys(P.keyItems||{}).map(k=>KEY_ITEMS[k]).filter(Boolean);
}
// ---------------- 道具（せんとうの そとで 使う）----------------
function itemList(){
  const out=[];
  if(P.herbs>0)  out.push({kind:'h',   name:'薬草',         num:P.herbs});
  if(P.waters>0) out.push({kind:'wtr', name:'魔法の 聖水', num:P.waters});
  return out;
}
function useItemField(kind, mi){
  const m = party[mi];
  if(!m) return {ok:false, lines:['誰に 使う？']};
  if(kind==='h'){
    if(P.herbs<=0) return {ok:false, lines:['薬草を もっていない。']};
    if(m.hp<=0)    return {ok:false, lines:[m.name+'は 倒れている。きょうかいへ いこう。']};
    if(m.hp>=m.maxhp) return {ok:false, lines:[m.name+'の HPは まんたんだ。']};
    P.herbs--;
    const h=Math.min(m.maxhp-m.hp, 20+Math.floor(Math.random()*9));
    m.hp+=h;
    return {ok:true, lines:[m.name+'は 薬草を 使った！', m.name+'の HPが '+h+' 回復！']};
  }
  if(kind==='wtr'){
    if(P.waters<=0) return {ok:false, lines:['魔法の 聖水を もっていない。']};
    if(m.maxmp<=0)  return {ok:false, lines:[m.name+'は 技を 使えない。']};
    if(m.mp>=m.maxmp) return {ok:false, lines:[m.name+'の MPは まんたんだ。']};
    P.waters--;
    const h=Math.min(m.maxmp-m.mp, 30);
    m.mp+=h;
    return {ok:true, lines:[m.name+'は 魔法の 聖水を 使った！', m.name+'の MPが '+h+' 回復！']};
  }
  return {ok:false, lines:['使えない。']};
}
// ---------------- 装備 ----------------
function slotOf(it){ return it && it.kind==='w' ? 'weapon' : 'armor'; }
function equipCandidates(slot){
  return (P.equipBag||[]).map((it,i)=>({it,i})).filter(x=>slotOf(x.it)===slot);
}
function equipFromBag(mi, bagIndex){
  const m=party[mi], it=P.equipBag[bagIndex];
  if(!m||!it) return {ok:false, lines:['装備できない。']};
  const slot=slotOf(it);
  const cur=m[slot];
  m[slot]=it;
  P.equipBag.splice(bagIndex,1);
  if(cur) P.equipBag.push(cur);
  return {ok:true, lines:[m.name+'は '+it.name+'を 装備した！'
    + (cur ? '（'+cur.name+'は ふくろへ）' : '')]};
}
function unequip(mi, slot){
  const m=party[mi];
  if(!m||!m[slot]) return {ok:false, lines:['はずす ものが ない。']};
  const cur=m[slot];
  m[slot]=null; P.equipBag.push(cur);
  return {ok:true, lines:[m.name+'は '+cur.name+'を はずした。']};
}
function equipSummary(mi){
  const m=party[mi];
  return [m.name+'　攻撃 '+mAtk(m)+'　しゅび '+mDef(m),
          '　右手：'+(m.weapon?m.weapon.name+'（+'+m.weapon.v+'）':'なし'),
          '　体：'+(m.armor ?m.armor.name +'（+'+m.armor.v +'）':'なし')];
}
// ---------------- セーブ ----------------
const SAVE_VERSION = 2;
const SAVE_SLOTS = ['LQ4_SAVE_1','LQ4_SAVE_2','LQ4_SAVE_3'];
let lastSaveError = null;

function store(s){
  if(s) return s;
  try{ return (typeof localStorage!=='undefined') ? localStorage : null; }catch(e){ return null; }
}
// --- v1 → v2：章べつパーティの あずかり所を つくる ---
const MIGRATIONS = {
  1:(d)=>{
    d.chapters = d.chapters || {};
    const ch = d.chapter || 1;
    d.chapters[ch] = {party:d.party||[], gold:d.gold||0, flags:d.flags||{}};
    d.world = d.world || {visited:d.visited||{}, gotTreasure:d.gotTreasure||{}, dex:d.dex||{}};
    d.v = 2; return d;
  },
};
function migrate(d){
  let guard=0;
  while((d.v||1) < SAVE_VERSION && guard++<20){
    const f = MIGRATIONS[d.v||1];
    if(!f){ d.v = SAVE_VERSION; break; }
    d = f(d);
  }
  return d;
}
function snapshotChapter(){          // いまの 章の 状態を あずける
  G.chapters = G.chapters || {};
  G.chapters[G.chapter] = {
    party: party.map(serializeMember),
    reserve: reserve.map(serializeMember),
    ship: G.ship, aboard: G.aboard,
    gold: P.gold, herbs: P.herbs, waters: P.waters,
    map: P.map, x: P.x, y: P.y, dir: P.dir,
    flags: JSON.parse(JSON.stringify(G.flags||{})),
    visited: JSON.parse(JSON.stringify(G.visited||{})),   // ★しょうごとの あしあと
  };
}
function serializeMember(m){
  return {cls:m.cls, lv:m.lv, exp:m.exp, hp:m.hp, mp:m.mp,
          weapon:m.weapon, armor:m.armor, status:m.status};
}
// --- 防御てき ふくげん：こわれた セーブでも おちない ---
function reviveMember(o){
  const cls = CLASSES[o.cls] ? o.cls : 'sora';
  if(cls !== o.cls) console.warn('[save] しらない クラス: '+o.cls+' → '+cls);
  const lv = Math.max(1, Math.min(LV_CAP, o.lv|0 || 1));
  const m = mkMember(cls, lv);          // のうりょくちは クラスとLvから さいけいさん
  m.exp = Math.max(0, o.exp|0);
  m.weapon = o.weapon || null;
  m.armor  = o.armor  || null;
  m.status = ['sleep','confuse','freeze','slow'].includes(o.status) ? o.status : null;
  m.hp = Math.max(0, Math.min(m.maxhp, (o.hp===undefined? m.maxhp : o.hp|0)));
  m.mp = Math.max(0, Math.min(m.maxmp, (o.mp===undefined? m.maxmp : o.mp|0)));
  return m;
}
function safeLanding(map, x, y){
  if(!MAPS[map]) return {map:'lower_dist', x:8, y:6};   // マップが きえていたら はじまりへ
  if(walkable(map,x,y)) return {map,x,y};
  for(let r=1;r<=6;r++){                                   // かべの なかなら ちかくへ おしだす
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      if(walkable(map,x+dx,y+dy)) return {map, x:x+dx, y:y+dy};
    }
  }
  return {map:'lower_dist', x:8, y:6};
}
function saveGame(s, slot){
  const st = store(s); if(!st) return false;
  try{
    snapshotChapter();
    st.setItem(SAVE_SLOTS[slot||0], JSON.stringify({
      v:SAVE_VERSION, at:Date.now(),
      map:P.map, x:P.x, y:P.y, dir:P.dir,
      gold:P.gold, herbs:P.herbs, waters:P.waters, equipBag:P.equipBag, keyItems:P.keyItems,
      goods:P.goods, marketTick:G.marketTick, tradeProfit:G.tradeProfit, quota:G.quota,
      party: party.map(serializeMember),
      reserve: reserve.map(serializeMember),
      ship:G.ship, aboard:G.aboard,
      chapter:G.chapter, chapters:G.chapters,
      flags:G.flags, quests:G.quests,
      world:{visited:G.visited, gotTreasure:G.gotTreasure, dex:G.dex},
      tactic:G.tactic, cleared:G.cleared, townState:G.townState, night:G.night,
      tileEdits:G.tileEdits,                    // ★しかけの じょうたい
    }));
    lastSaveError=null;
    return true;
  }catch(e){ lastSaveError='ほぞんに しっぱいしました'; return false; }
}
function loadGame(s, slot){
  const st = store(s); if(!st) return false;
  let d;
  try{
    const raw = st.getItem(SAVE_SLOTS[slot||0]);
    if(!raw){ lastSaveError='きろくが ありません'; return false; }
    d = JSON.parse(raw);
  }catch(e){ lastSaveError='きろくが よめませんでした（データが こわれています）'; return false; }
  try{
    d = migrate(d);
    P.gold = Math.max(0, d.gold|0);
    P.herbs = Math.max(0, d.herbs|0);
    P.waters = Math.max(0, d.waters|0);
    P.equipBag = Array.isArray(d.equipBag) ? d.equipBag : [];
    P.keyItems = (d.keyItems && typeof d.keyItems==='object') ? d.keyItems : {};
    P.goods = (d.goods && typeof d.goods==='object') ? d.goods : {};
    // ★しかけ：まず もとの マップに もどしてから、きろくぶんを あてなおす。
    //   （ロード前に 押した 岩が のこったままに ならない ように）
    if(!MAPS_ORIG) snapshotMaps();
    G.tileEdits = (d.tileEdits && typeof d.tileEdits==='object') ? d.tileEdits : {};
    applyTileEdits();
    G.marketTick = d.marketTick|0; G.tradeProfit = d.tradeProfit|0;
    G.quota = d.quota || null;
    P.dir = d.dir || 'front';
    G.ship = (d.ship && typeof d.ship.x==='number') ? {x:d.ship.x|0, y:d.ship.y|0} : null;
    // ★うみの うえで きろくして いたら、そのまま ふねの うえに もどす
    if(d.aboard && d.map==='world' && tileAt('world', d.x|0, d.y|0)==='~'){
      G.aboard = true;
      P.map='world'; P.x=d.x|0; P.y=d.y|0;
    }else{
      G.aboard = false;
      const land = safeLanding(d.map, d.x|0, d.y|0);
      P.map = land.map; P.x = land.x; P.y = land.y;
    }

    party.length = 0; reserve.length = 0;
    const ps = Array.isArray(d.party) && d.party.length ? d.party : [{cls:'lion',lv:1}];
    ps.forEach(o=>party.push(reviveMember(o)));
    (Array.isArray(d.reserve) ? d.reserve : []).forEach(o=>reserve.push(reviveMember(o)));

    G.chapter   = d.chapter || 1;
    G.chapters  = d.chapters || {};
    G.flags     = Object.assign({}, d.flags||{});
    G.quests    = d.quests || {};
    const w     = d.world || {};
    G.visited   = w.visited || d.visited || {};
    G.gotTreasure = w.gotTreasure || d.gotTreasure || {};
    G.dex       = w.dex || d.dex || {};
    G.tactic    = TACTICS[d.tactic] ? d.tactic : 'manual';
    G.cleared   = !!d.cleared;
    G.townState = WORLD.TOWN_STATES[d.townState] ? d.townState : 'NORMAL';
    // ★townStateは 1章せんようの えんしゅつ。2章いこうの きろくに のこって いたら けす
    //   （1章クエスト もれこみ ふぐあいの なごりで、5章の トロスが むらさきに なっていた）
    if((G.chapter||1) !== 1) G.townState = 'NORMAL';
    G.night     = !!d.night;
    G.trail     = [[P.x,P.y],[P.x,P.y]];
    lastSaveError = null;
    return true;
  }catch(e){
    lastSaveError='きろくの ふくげんに しっぱいしました';
    return false;
  }
}
function saveInfo(s, slot){
  const st = store(s); if(!st) return null;
  try{
    const raw = st.getItem(SAVE_SLOTS[slot||0]);
    if(!raw) return null;
    const d = JSON.parse(raw);
    const lead = (d.party&&d.party[0]) ? (CLASSES[d.party[0].cls]||{}).name : '？';
    return {ver:d.v||1, chapter:d.chapter||1, lead, lv:(d.party&&d.party[0]?d.party[0].lv:1),
            gold:d.gold||0, map:WORLD.mapName(d.map||'')};
  }catch(e){ return {broken:true}; }
}
// 章の きりかえ（M2いこうで 使う）
function switchChapter(no, newParty){
  snapshotChapter();
  G.chapter = no;
  const saved = (G.chapters||{})[no];
  party.length = 0; reserve.length = 0;
  if(saved && saved.party && saved.party.length){
    saved.party.forEach(o=>party.push(reviveMember(o)));
    (saved.reserve||[]).forEach(o=>reserve.push(reviveMember(o)));
    P.gold = saved.gold|0; P.herbs = saved.herbs|0; P.waters = saved.waters|0;
    G.ship = (saved.ship && typeof saved.ship.x==='number') ? {x:saved.ship.x, y:saved.ship.y} : null;
    if(saved.aboard && saved.map==='world' && tileAt('world', saved.x|0, saved.y|0)==='~'){
      G.aboard=true;
      P.map='world'; P.x=saved.x|0; P.y=saved.y|0; P.dir=saved.dir||'front';
    }else{
      G.aboard=false;
      const land = safeLanding(saved.map, saved.x|0, saved.y|0);
      P.map=land.map; P.x=land.x; P.y=land.y; P.dir=saved.dir||'front';
    }
    G.flags = Object.assign({}, saved.flags||{});
    G.visited = Object.assign({}, saved.visited||{});
    G.visited[P.map] = true;
  }else{
    // ★はじめて その章に はいる ときは、章データの とおりに はじめる
    const cd = CHD ? CHD.get(no) : null;
    const cls = (newParty && newParty.length) ? newParty
              : (cd && cd.party) ? cd.party : ['sora'];
    // ★はじまりの レベル。かずでも、なかまごとの ひょうでも よい。
    //   （ゼフは ながねんの けんじゃ なので、はじめから たかい）
    const sl = cd && cd.startLv;
    const lvOf = (k)=>{
      if(sl == null) return 1;
      if(typeof sl === 'number') return sl;
      return sl[k] || 1;
    };
    G.townState = 'NORMAL';   // ★まちの 状態は 章ごとに リセット（1章せんようの しくみ）
    const inh = cd && cd.inheritParty ? (G.chapters||{})[cd.inheritParty] : null;
    if(inh && inh.party && inh.party.length){
      // ★まえの しょうの なかま・レベル・装備・しょじひんを ひきつぐ
      inh.party.forEach(o=>{ const m=reviveMember(o);
        if(party.length<4) party.push(m); else reserve.push(m); });
      (inh.reserve||[]).forEach(o=>{ const m=reviveMember(o);
        if(party.length<4) party.push(m); else reserve.push(m); });
      P.gold=inh.gold|0; P.herbs=inh.herbs|0; P.waters=inh.waters|0;
      allMembers().forEach(m=>{ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; });
    }else{
      cls.forEach((k,i)=>{ const m = mkMember(k, lvOf(k));
        if(i<4) party.push(m); else reserve.push(m); });   // ★せんとうは 4にんまで
    }
    if(cd){
      if(cd.start){
        const land = safeLanding(cd.start.map, cd.start.x|0, cd.start.y|0);
        P.map=land.map; P.x=land.x; P.y=land.y; P.dir=cd.start.dir||'front';
      }
      G.visited = {};                       // ★ほかの しょうの きろくを もちこさない
    G.ship = null; G.aboard = false;      // ★ふねは しょうごと
      if(cd.gold!==undefined)   P.gold   = cd.gold|0;
      if(cd.herbs!==undefined)  P.herbs  = cd.herbs|0;
      if(cd.waters!==undefined) P.waters = cd.waters|0;
      if(cd.equip && party[0]){
        if(cd.equip.weapon) party[0].weapon = Object.assign({}, cd.equip.weapon);
        if(cd.equip.armor)  party[0].armor  = Object.assign({}, cd.equip.armor);
      }
      G.visited[P.map] = true;
    }
  }
  G.trail=[[P.x,P.y],[P.x,P.y]];
  return true;
}

// ---------------- ふね（じゆうこうかい）----------------
// うみタイルを じぶんで こいで わたる。りくに ふれると あがり、ふねは のこる。
// リターンや ぜんめつの ときは、いきさきの はまへ ふねが ついてくる（まいご ふせぎ）。
const MOORS = {};   // IVでは ふねを つかわない
function moorShipFor(mapId){
  G.aboard=false;
  if(G.ship && MOORS[mapId]) G.ship={x:MOORS[mapId].x, y:MOORS[mapId].y};
}

// ---------------- なかまの 入れ替え（ひかえ） ----------------
function allMembers(){ return party.concat(reserve); }
function joinMember(cls, lv){                 // ごうりゅう。5にんめ いこうは ひかえへ
  if(allMembers().some(m=>m.cls===cls)) return null;
  const m = mkMember(cls, lv||1);
  if(party.length<4) party.push(m); else reserve.push(m);
  if(V.setActors) V.setActors(true); U.hud();
  return m;
}
function swapMember(cls){                     // せんとう ⇄ ひかえ
  const pi = party.findIndex(m=>m.cls===cls);
  if(pi===0) return {ok:false, msg:party[0].name+'は せんとうから はずせない。'};
  if(pi>0){ reserve.push(party.splice(pi,1)[0]);
            if(V.setActors) V.setActors(true); U.hud(); return {ok:true}; }
  const ri = reserve.findIndex(m=>m.cls===cls);
  if(ri<0)  return {ok:false, msg:'その なかまは いない。'};
  if(party.length>=4) return {ok:false, msg:'せんとうに でられるのは 4にんまで。'};
  party.push(reserve.splice(ri,1)[0]);
  if(V.setActors) V.setActors(true); U.hud();
  return {ok:true};
}
// ---------------- 公開 ----------------
return {
  // データ
  MAPS, ENEMIES, MIDBOSS, CLASSES, SPELL_DEFS, SHOPS, INN_PRICE, byMap, byMapCh, TACTICS, LV_CAP,
  // ★しかけ（IVから）
  setTile, applyTileEdits, restoreMaps, snapshotMaps, allLampsLit, GIMMICK_TILES,
  pushRock, toggleLamp, gimmickRescue,
  // ★LQ4：けんしょうよう（テストから 戦闘を 1てずつ たたく）
  memberAct, enemyAct, endBattle, buffMul, eEffAgi, inflictHit,
  get NPC_LINES(){return NPCDATA.NPCS;}, WORLD, QUESTS:NPCDATA.QUESTS,
  // 状態アクセサ
  get G(){return G;}, get P(){return P;}, get party(){return party;}, get reserve(){return reserve;},
  freshState, allMembers, joinMember, swapMember, mkMember, expNext, mAtk, mDef, knownSpells, spellLabel, aliveMembers,
  // マップ
  tileAt, isBlocked, walkable, warpAt,
  // 行動
  stepField, interact, facing, doWarp, startBattle, beginRound, saveGame, loadGame,
  runTalkEvent, questOnTalk, questList, deathPoint, triggerChapterEnd, offerNextChapter, homePoint,
  saveInfo, switchChapter, SAVE_SLOTS, SAVE_VERSION,
  get lastSaveError(){return lastSaveError;},
  useInn, useChurch, openShop, talkNPC,
  moorShipFor, MOORS,
  itemList, useItemField, equipCandidates, equipFromBag, unequip, equipSummary, slotOf,
  fieldSpells, castField, spellNeedsTarget,
  returnDestinations, canReturnHere, castReturn, allReturnSpots, bossInfoAt, chData,
  KEY_ITEMS, hasKey, giveKey, takeKey, keyItemList,
  TRADE_GOODS, TRADE_MARKET, tradeTowns, tradePrice, sellPrice,
  goodsCount, goodsTotal, buyGood, sellGood, GOODS_LIMIT,
  setTownState, setNight, townStateDef, questList, questAdvance, startChapter,
  // 差し替え
  bind, NullView, NullUI, NullAudio,
};
})();

