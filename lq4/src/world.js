'use strict';
// ============================================================
// ルミナクエストIV / 世界設定データ
// 区画・章・マップID・シーン名・街状態を ここに 一元化する。
// ゲームロジック（core.js）は このデータを 参照するだけに する。
// ============================================================
const WORLD = (function(){

// ---------------- 区画（天空大陸ルミナリア＋千年前の地上） ----------------
const REGIONS = {
  sky:    {id:'sky',    name:'天空大陸 ルミナリア', dir:'雲上', chapter:1,
           climate:'sky',  summary:'中央海の上空三千メートル。光珠炉の熱と雲海に囲まれた大陸。'},
  ground: {id:'ground', name:'千年前の 地上',       dir:'地上', chapter:4,
           climate:'temperate', summary:'五地方の原型。降下組が のちの民の起源になる。'},
  dream:  {id:'dream',  name:'夢の 内界',           dir:'夢底', chapter:7,
           climate:'dream', summary:'ヴォクスの夢の中。終章の3D区間。'},
};

// ---------------- 章 ----------------
// ※ 番号は 1＝序章、2＝第1章 …… 7＝終章
const CHAPTERS = [
  {no:1, id:'ch0_trial', title:'見習い試験の日', region:'sky',
   heroes:[{id:'io', name:'イオ', role:'天空騎士団 見習い'}],
   summary:'試験の日の夜、下層区の空に黒い裂け目が開く。ウンブラ戦。'},
  {no:2, id:'ch1_lower', title:'下層区の亀裂',   region:'sky',
   heroes:[{id:'io', name:'イオ'}, {id:'seren', name:'セレン'}],
   summary:'古い光珠管の破れ目から悪夢が漏れている。ボスはオボロ。'},
  {no:3, id:'ch2_garden',title:'空中庭園と炉の火', region:'sky',
   heroes:[{id:'noe', name:'ノエ'}], summary:'減光現象の調査。ボスはフォルナクス。'},
  {no:4, id:'ch3_ground',title:'五つの大地',     region:'ground',
   heroes:[], summary:'五地方降下。ボスはルプス。'},
  {no:5, id:'ch4_library',title:'禁書庫',        region:'sky',
   heroes:[{id:'amane', name:'アマネ'}], summary:'千年前の契約書。アマネ加入。'},
  {no:6, id:'ch5_grand', title:'蝕まれる大陸',   region:'sky',
   heroes:[], summary:'グラン戦（2形態）。'},
  {no:7, id:'ch6_dream', title:'夢の内界',       region:'dream',
   heroes:[], summary:'白竜の背で夢へ潜る。魔王メーア（3形態）。'},
];

// ---------------- マップID ----------------
//   種別： town / field / cast(城) / dgn(ダンジョン) / in(屋内) / shrine(神殿)
const MAP_IDS = {
  world:      {region:'sky', kind:'field',name:'天空大陸 ルミナリア', scene:'SCENE_SKY_FIELD'},
  home_forge: {region:'sky', kind:'in',   name:'イオの家',        scene:'SCENE_SKY_IN'},
  lower_dist: {region:'sky', kind:'town', name:'下層区',          scene:'SCENE_SKY_TOWN'},
  trial_yard: {region:'sky', kind:'town', name:'見習い試験場',    scene:'SCENE_SKY_TOWN'},
  rift_yard:  {region:'sky', kind:'dgn',  name:'裂け目の広場',    scene:'SCENE_SKY_RIFT'},
};

// ---------------- シーン名 ----------------
// render: '2d' ＝ ドット絵（天空大陸の各区は 2Dが 主）
//         '3d' ＝ 飛翔区間・夢の内界 だけ（構想書 §3）
const SCENES = {
  SCENE_SKY_FIELD:{render:'2d', theme:'world',  outdoor:true,  snowfall:false, aurora:false, footprints:false},
  SCENE_SKY_TOWN: {render:'2d', theme:'sky',    outdoor:true,  snowfall:false, aurora:false, footprints:false},
  SCENE_SKY_IN:   {render:'2d', theme:'indoor', outdoor:false},
  SCENE_SKY_RIFT: {render:'2d', theme:'dream',  outdoor:true,  snowfall:false, aurora:true,  footprints:false},
};
function renderModeOf(mapId){
  const s = SCENES[(MAP_IDS[mapId]||{}).scene] || {};
  return s.render || '2d';
}

// ---------------- 街の状態 ----------------
// 悪夢侵食度（構想書 §3-4）は これを 応用して 章進行で 見た目を 変える
const TOWN_STATES = {
  NORMAL: {
    id:'NORMAL', label:'へいおん',
    fog:[0xdfe8f4, 14, 40], sky:0xaecfe8,
    snowColor:0xffffff, snowRate:0.0, ambient:[0xeaf2ff, 0.98],
  },
  NIGHT_RIFT: {
    id:'NIGHT_RIFT', label:'よるの さけめ',
    fog:[0x2a2440, 8, 26], sky:0x1d1930,
    snowColor:0x8a7ad0, snowRate:0.6, ambient:[0x6a5aa0, 0.70],
  },
  EROSION: {
    id:'EROSION', label:'あくむの しんしょく',
    fog:[0x5a3f80, 7, 22], sky:0x3a2a58,
    snowColor:0xa88cf0, snowRate:1.2, ambient:[0x8a70c8, 0.75],
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
