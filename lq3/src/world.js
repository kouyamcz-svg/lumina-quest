'use strict';
// ============================================================
// ルミナクエストIII / 世界設定データ
// 地方・章・マップID・シーン名・街状態を ここに 一元化する。
// ゲームロジック（core.js）は このデータを 参照するだけに する。
// ============================================================
const WORLD = (function(){

// ---------------- 地方 ----------------
const REGIONS = {
  versa:  {id:'versa',  name:'ゆきの おうこく ヴェルサ', dir:'北',   chapter:1,
           climate:'snow',   summary:'雪原と氷窟。王女が眠りから覚めない雪国。'},
  zaal:   {id:'zaal',   name:'たいしょうのまち ザール', dir:'東',   chapter:2,
           climate:'desert', summary:'砂の交易路。隊商と荷車と売買の街。'},
  minamo: {id:'minamo', name:'サンゴぐんとう ミナモ',   dir:'南',   chapter:3,
           climate:'sea',    summary:'小舟で島づたいに渡る珊瑚の群島。'},
  elde:   {id:'elde',   name:'れいほう エルデ', dir:'西',   chapter:4,
           desc:'にしの れいほう。けんじゃの かくれざと。'},
  elde:   {id:'elde',   name:'れいほう エルデ',         dir:'西',   chapter:4,
           climate:'peak',   summary:'夢を研究する賢者の隠れ里がある霊峰。'},
  dream:{id:'dream', name:'ゆめのたいりく',             dir:'中央海', chapter:6,
         climate:'dream'},
  oldland:{id:'oldland',name:'きゅうたいりく',           dir:'中央', chapter:5,
           climate:'temperate',
           summary:'LQ2の世界。トロス・リベリオン・ハルナ等を高精細タイルでリメイク再登場させる。'},
  yume:   {id:'yume',   name:'ゆめの たいりく',         dir:'中央海', chapter:6,
           climate:'dream',  summary:'終章で中央海に浮上する。浮遊島と逆さの城。'},
};

// ---------------- 章 ----------------
// ※ 登場人物名は ここ 1箇所で 管理する（差し替えが きくように）
const CHAPTERS = [
  {no:1, id:'ch1_versa',  title:'わかき きし',           region:'versa',
   heroes:[{id:'lion',   name:'リオン',  role:'しんまい このえへい'}],
   summary:'王女の眠りの謎を追い、雪原と氷窟へ。単独戦闘の教習章。'},
  {no:2, id:'ch2_zaal',   title:'あきないの たび',       region:'zaal',
   heroes:[{id:'bald',   name:'バルド',  role:'ぎょうしょうにん'}],
   summary:'眠り病で止まった隊商をつなぐ。売買と荷車の章。'},
  {no:3, id:'ch3_minamo', title:'みなとの しまい',       region:'minamo',
   heroes:[{id:'sena',   name:'セナ',    role:'うらないし'},
           {id:'ruka',   name:'ルカ',    role:'おどりこ'}],
   summary:'小舟で島を渡り、夢を「視る」力で真相に最初に触れる。'},
  {no:4, id:'ch4_elde',   title:'ろうけんじゃの しょくざい', region:'elde',
   heroes:[{id:'zef',    name:'ゼフ',    role:'ろうけんじゃ'},
           {id:'mio',    name:'ミオ',    role:'でし'}],
   summary:'夢の研究と贖罪。ミオを守りとして送り出す。'},
  {no:5, id:'ch5_oldland',title:'ひかりの こ',           region:'oldland',
   heroes:[{id:'sora',   name:'ソラ',    role:'ひかりの こ'}],
   summary:'母ルミアから光を受け継ぎ、船で北→東→南→西を巡って合流する。'},
  {no:6, id:'final_yume', title:'とびらの むこう',       region:'yume',
   heroes:[],
   summary:'ゆめのたいりくが浮上。最深部の夢喰い神殿へ。'},
];

// ---------------- マップID体系 ----------------
// 命名規則： <地方>_<種別><連番>
//   種別： town / field / cast(城) / dgn(ダンジョン) / in(屋内) / shrine(神殿)
const MAP_IDS = {
  // --- ゆめのたいりく（終章・3D） ---
  dream_field:   {region:'dream', kind:'field', name:'ゆめのたいりく',            scene:'SCENE_DREAM_FIELD'},
  dream_camp:    {region:'dream', kind:'town',  name:'ばんにんの いおり',        scene:'SCENE_DREAM_CAMP'},
  dream_cast1:   {region:'dream', kind:'cast',  name:'さかさのしろ 1かい',        scene:'SCENE_DREAM_CASTLE'},
  dream_cast2:   {region:'dream', kind:'cast',  name:'さかさのしろ 2かい',        scene:'SCENE_DREAM_CASTLE'},
  dream_cast3:   {region:'dream', kind:'cast',  name:'さかさのしろ さいじょうかい', scene:'SCENE_DREAM_CASTLE'},
  dream_core:    {region:'dream', kind:'cast',  name:'ゆめの しんいん',           scene:'SCENE_DREAM_CASTLE'},
  // --- ヴェルサ地方（第1章・実装中） ---
  world:         {region:'versa', kind:'field', name:'ワールドマップ',              scene:'SCENE_WORLD'},
  elde_town:     {region:'elde',  kind:'town', name:'かくれざと エルデ',            scene:'SCENE_ELDE_TOWN'},
  elde_path:     {region:'elde',  kind:'dgn',  name:'れいほう さんどう',            scene:'SCENE_ELDE_CAVE'},
  elde_path2:    {region:'elde',  kind:'dgn',  name:'れいほう さんどう おくち',      scene:'SCENE_ELDE_CAVE'},
  elde_tower:    {region:'elde',  kind:'dgn',  name:'けんきゅうとう 1かい',               scene:'SCENE_ELDE_CAVE'},
  elde_tower2:   {region:'elde',  kind:'dgn',  name:'けんきゅうとう 2かい',          scene:'SCENE_ELDE_CAVE'},
  elde_top:      {region:'elde',  kind:'dgn',  name:'けんきゅうとう 3かい',          scene:'SCENE_ELDE_CAVE'},
  minamo_port:   {region:'minamo',kind:'town', name:'サンゴの みなと',              scene:'SCENE_MINAMO_TOWN'},
  minamo_isle:   {region:'minamo',kind:'town', name:'しおかぜの むら ナギサ',                 scene:'SCENE_MINAMO_TOWN'},
  minamo_rock:   {region:'minamo',kind:'dgn',  name:'にしの いわば',               scene:'SCENE_MINAMO_CAVE'},
  minamo_dgn0:   {region:'minamo',kind:'dgn',  name:'あさせの ほら',               scene:'SCENE_MINAMO_CAVE'},
  minamo_dgn1:   {region:'minamo',kind:'dgn',  name:'かいしょくどう',                scene:'SCENE_MINAMO_CAVE'},
  minamo_dgn2:   {region:'minamo',kind:'dgn',  name:'かいしょくどう さいしんぶ',        scene:'SCENE_MINAMO_CAVE'},
  zaal_town:     {region:'zaal',  kind:'town',  name:'たいしょうのまち ザール',       scene:'SCENE_ZAAL_TOWN'},
  zaal_oasis:    {region:'zaal',  kind:'town',  name:'オアシスの むら サーラ',             scene:'SCENE_ZAAL_TOWN'},
  zaal_dgn1:     {region:'zaal',  kind:'dgn',   name:'すなの いせき',               scene:'SCENE_ZAAL_RUIN'},
  zaal_dgn2:     {region:'zaal',  kind:'dgn',   name:'すなの いせき さいしんぶ',       scene:'SCENE_ZAAL_RUIN'},
  versa_town:    {region:'versa', kind:'town',  name:'おうと ヴェルサリア',         scene:'SCENE_VERSA_TOWN'},
  versa_town2:   {region:'versa', kind:'town',  name:'くすしの むら ミルカ',         scene:'SCENE_VERSA_TOWN2'},
  versa_hut:     {region:'versa', kind:'in',    name:'くすしの いえ',               scene:'SCENE_VERSA_HUT'},
  versa_cast1:   {region:'versa', kind:'cast',  name:'ヴェルサ おうじょう',         scene:'SCENE_VERSA_CASTLE'},
  versa_dgn1:    {region:'versa', kind:'dgn',   name:'こおりの どうくつ',           scene:'SCENE_VERSA_ICECAVE'},
  versa_dgn2:    {region:'versa', kind:'dgn',   name:'こおりの どうくつ さいしんぶ', scene:'SCENE_VERSA_ICECAVE'},
  versa_in_inn:  {planned:true, region:'versa', kind:'in',    name:'やどや',                      scene:'SCENE_VERSA_INN'},
  versa_in_ch:   {planned:true, region:'versa', kind:'in',    name:'きょうかい',                  scene:'SCENE_VERSA_CHURCH'},
  versa_in_wep:  {planned:true, region:'versa', kind:'in',    name:'ぶきや',                      scene:'SCENE_VERSA_WEAPON'},
  versa_in_mag:  {planned:true, region:'versa', kind:'in',    name:'まほうてん',                  scene:'SCENE_VERSA_MAGIC'},
  // --- 旧大陸（第5章・M0資産を退避。到達経路は未接続） ---
  toros:         {region:'oldland', kind:'town', name:'トロスむら',                 scene:'SCENE_OLD_TOROS'},
  cave1:         {region:'oldland', kind:'dgn',  name:'ゆめみの どうくつ B1',       scene:'SCENE_OLD_CAVE1'},
  cave2:         {region:'oldland', kind:'dgn',  name:'ゆめみの どうくつ B2',       scene:'SCENE_OLD_CAVE2'},
  cave3:         {region:'oldland', kind:'dgn',  name:'ゆめみの どうくつ B3',       scene:'SCENE_OLD_CAVE3'},
  toros_h1:      {region:'oldland', kind:'in',   name:'みんか',                     scene:'SCENE_OLD_HOUSE1'},
  toros_h2:      {region:'oldland', kind:'in',   name:'みんか',                     scene:'SCENE_OLD_HOUSE2'},
};

// ---------------- シーン名 ----------------
// ビューの見た目（背景・霧・ライト・演出）を決める識別子
// render: '2d' ＝ ドットえ（まち・フィールド・ダンジョン）／ '3d' ＝ しろの なか だけ
const SCENES = {
  SCENE_DREAM_FIELD:  {render:'3d', theme:'dream',  outdoor:true,  snowfall:false, aurora:true,  footprints:false},
  SCENE_DREAM_CAMP:   {render:'3d', theme:'dream',  outdoor:true,  snowfall:false, aurora:true,  footprints:false},
  SCENE_DREAM_CASTLE: {render:'3d', theme:'castle', outdoor:false, snowfall:false, aurora:false, footprints:false},
  SCENE_WORLD:        {render:'2d', theme:'world',  outdoor:true,  snowfall:false, aurora:true,  footprints:false},
  SCENE_ELDE_TOWN:    {render:'2d', theme:'snow',   outdoor:true,  snowfall:true,  aurora:false, footprints:true},
  SCENE_ELDE_CAVE:    {render:'2d', theme:'ice',    outdoor:false, snowfall:false, aurora:false, footprints:false},
  SCENE_MINAMO_TOWN:  {render:'2d', theme:'coral',  outdoor:true,  snowfall:false, aurora:false, footprints:false},
  SCENE_MINAMO_CAVE:  {render:'2d', theme:'sea',    outdoor:false, snowfall:false, aurora:false, footprints:false},
  SCENE_ZAAL_TOWN:    {render:'2d', theme:'desert', outdoor:true,  snowfall:false, aurora:false, footprints:false},
  SCENE_ZAAL_RUIN:    {render:'2d', theme:'cave',   outdoor:false, snowfall:false, aurora:false, footprints:false},
  SCENE_VERSA_TOWN:   {render:'2d', theme:'snow',   outdoor:true,  snowfall:true,  aurora:true,  footprints:true},
  SCENE_VERSA_TOWN2:  {render:'2d', theme:'snow',   outdoor:true,  snowfall:true,  aurora:true,  footprints:true},
  SCENE_VERSA_HUT:    {render:'2d', theme:'indoor', outdoor:false},
  SCENE_VERSA_CASTLE: {render:'3d', theme:'castle', outdoor:false, snowfall:false, aurora:false, footprints:false},
  SCENE_VERSA_ICECAVE:{render:'2d', theme:'ice',    outdoor:false, snowfall:false, aurora:false, footprints:false},
  SCENE_VERSA_INN:    {render:'2d', theme:'indoor', outdoor:false},
  SCENE_VERSA_CHURCH: {render:'2d', theme:'indoor', outdoor:false},
  SCENE_VERSA_WEAPON: {render:'2d', theme:'indoor', outdoor:false},
  SCENE_VERSA_MAGIC:  {render:'2d', theme:'indoor', outdoor:false},
  SCENE_OLD_TOROS:    {render:'2d', theme:'village',outdoor:true},
  SCENE_OLD_FIELD:    {render:'2d', theme:'field',  outdoor:true},
  SCENE_OLD_CAVE1:    {render:'2d', theme:'cave',   outdoor:false},
  SCENE_OLD_CAVE2:    {render:'2d', theme:'cave',   outdoor:false},
  SCENE_OLD_CAVE3:    {render:'2d', theme:'cave',   outdoor:false},
  SCENE_OLD_HOUSE1:   {render:'2d', theme:'indoor', outdoor:false},
  SCENE_OLD_HOUSE2:   {render:'2d', theme:'indoor', outdoor:false},
};
function renderModeOf(mapId){
  const s = SCENES[(MAP_IDS[mapId]||{}).scene] || {};
  return s.render || '2d';
}

// ---------------- 街の状態 ----------------
// 物語の進行で街の見た目・NPCの台詞・BGMが変わる
const TOWN_STATES = {
  NORMAL: {
    id:'NORMAL', label:'へいおん',
    fog:[0xcfe2f2, 14, 40], sky:0x9ec8e8,
    snowColor:0xffffff, snowRate:1.0, ambient:[0xdfeaff, 0.95],
  },
  SLEEPING_SICKNESS: {
    id:'SLEEPING_SICKNESS', label:'ねむりびょう',
    fog:[0xb8a8d8, 11, 30], sky:0x8c7fae,
    snowColor:0xd6c2f0, snowRate:1.25, ambient:[0xc7b8e8, 0.85],
  },
  DREAM_INVASION: {
    id:'DREAM_INVASION', label:'ゆめの しんしょく',
    fog:[0x7a4fa8, 7, 22], sky:0x4a2f6e,
    snowColor:0xc08cf0, snowRate:1.7, ambient:[0xa070d8, 0.75],
  },
};

function sceneOf(mapId){
  const m = MAP_IDS[mapId];
  return m ? (SCENES[m.scene] || {}) : {};
}
function mapName(mapId){
  const m = MAP_IDS[mapId];
  return m ? m.name : mapId;
}
function regionOf(mapId){
  const m = MAP_IDS[mapId];
  return m ? REGIONS[m.region] : null;
}

return {REGIONS, CHAPTERS, MAP_IDS, SCENES, TOWN_STATES, sceneOf, mapName, regionOf, renderModeOf};
})();

