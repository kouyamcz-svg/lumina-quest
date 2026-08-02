'use strict';
// ============================================================
// ルミナクエストIII / ビュー層（Three.js）
// コア層からは V.* のインタフェースだけを呼ばれる
// ============================================================
(function(){
const C = LQ3;
// そざいは assets.js が さきに よみこまれ、__ASSETS に のっている ぜんてい
const V2 = (typeof globalThis!=='undefined' && globalThis.View2D) ? globalThis.View2D
         : (typeof View2D!=='undefined' ? View2D : null);
const _A = (typeof globalThis!=='undefined' && globalThis.__ASSETS) ? globalThis.__ASSETS : null;
if(!_A) console.error('[view] assets.js が よみこまれていません');
const MON = _A ? _A.MON : {};
const CHR = _A ? _A.CHR : {};

// ---------------- ドット絵 ----------------
const PAL = {
  _:'', k:'#141020',
  S:'#f2c79c', s:'#cf9a70',           // はだ
  W:'#fff8ec', w:'#ddd0b8',           // しろ
  H:'#f2d878', h:'#c8a840',           // きんぱつ
  N:'#5c4a3a', n:'#3d3024',           // ちゃぱつ
  B:'#4a74c0', b:'#2f4d88',           // あお
  G:'#3fa060', g:'#2a6d40',           // みどり
  R:'#c8524a', r:'#8f3530',           // あか
  M:'#c2cade', m:'#7c869c',           // きんぞく
  E:'#3a2a1a',                        // くつ
  P:'#9a6ad0', p:'#6a4098',           // むらさき
  Y:'#f0e060',                        // きいろ
  D:'#20182c', d:'#100c18',           // やみ
  // ---- モンスター用の かいちょう ----
  '1':'#a8834f', '2':'#7d5c36', '3':'#523720',   // ちゃ（ねずみ）
  '4':'#c9a2ea', '5':'#9463cc', '6':'#663a9a',   // むらさき
  '7':'#2b2140', '8':'#150f24',                  // やみ・かげ
  '9':'#efe8f6',                                 // あわい
  q:'#f2a8b8',                                   // ももいろ
  x:'#ffd140', z:'#ff5646',                      // ひかる め
  j:'#6f5b3f', J:'#93794f',                      // どろ
};


const SPR = {
lion:[
"______kkkk______",
"_____kMMMMk_____",
"____kMMMMMMk____",
"____kMmmmMMk____",
"____kSSSSSSk____",
"____kSkSSkSk____",
"____kSSSSSSk____",
"_____kSssSk_____",
"___kkBBBBBBkk___",
"__kMkBBYYBBkMk__",
"__kMkBBYYBBkMk__",
"__kMkBbbbBBkMk__",
"___kkBBBBBBkk___",
"____kBBBBBBk____",
"____kmmmmmmk____",
"____kmmkkmmk____",
"____kmmkkmmk____",
"____kEEkkEEk____",
"___kEEkkkEEk____",
"________________",
],
sora:[
"______kkkk______",
"_____kHHHHk_____",
"____kHHHHHHk____",
"____kHhhhHHk____",
"____kSSSSSSk____",
"____kSkSSkSk____",
"____kSSSSSSk____",
"_____kSssSk_____",
"___kkGGGGGGkk___",
"__kSkGGYYGGkSk__",
"__kSkGGYYGGkSk__",
"__kSkGgggGGkSk__",
"___kkGGGGGGkk___",
"____kGGGGGGk____",
"____kBBBBBBk____",
"____kBBkkBBk____",
"____kBBkkBBk____",
"____knnkknnk____",
"___kEEkkkEEk____",
"________________",
],
lumia:[
"______kkkk______",
"_____kWWWWk_____",
"____kWWWWWWk____",
"____kWwwwWWk____",
"____kSSSSSSk____",
"____kSkSSkSk____",
"____kSSSSSSk____",
"_____kSssSk_____",
"___kkWWWWWWkk___",
"__kSkWWMMWWkSk__",
"__kSkWWMMWWkSk__",
"__kSkWwwwWWkSk__",
"___kkWWWWWWkk___",
"____kWWWWWWk____",
"____kWWWWWWk____",
"____kwWWWWwk____",
"____kwWWWWwk____",
"____kwwwwwwk____",
"____kEEkkEEk____",
"________________",
],
dan:[
"______kkkk______",
"_____kNNNNk_____",
"____kNNNNNNk____",
"____kNnnnNNk____",
"____kSSSSSSk____",
"____kSkSSkSk____",
"____kSSSSSSk____",
"_____kSssSk_____",
"___kkMMMMMMkk___",
"__kSkMMRRMMkSk__",
"__kSkMMRRMMkSk__",
"__kSkMmmmMMkSk__",
"___kkMMMMMMkk___",
"____kMMMMMMk____",
"____knnnnnnk____",
"____knnkknnk____",
"____knnkknnk____",
"____kEEkkEEk____",
"___kEEkkkEEk____",
"________________",
],
npc:[
"______kkkk______",
"_____kNNNNk_____",
"____kNNNNNNk____",
"____kNnnnNNk____",
"____kSSSSSSk____",
"____kSkSSkSk____",
"____kSSSSSSk____",
"_____kSssSk_____",
"___kkbbbbbbkk___",
"__kSkbbbbbbkSk__",
"__kSkbbbbbbkSk__",
"___kkbbbbbbkk___",
"____kbbbbbbk____",
"____kBBBBBBk____",
"____kBBkkBBk____",
"____kBBkkBBk____",
"____knnkknnk____",
"___kEEkkkEEk____",
"________________",
"________________",
],
};

function artCanvas(art, scale){
  const h=art.length, w=art[0].length;
  const c=document.createElement('canvas');
  c.width=w*scale; c.height=h*scale;
  const x=c.getContext('2d');
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const col=PAL[art[j][i]];
    if(!col) continue;
    x.fillStyle=col; x.fillRect(i*scale,j*scale,scale,scale);
  }
  return c;
}
function texFromCanvas(c){
  const t=new THREE.CanvasTexture(c);
  t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter;
  return t;
}
function patTex(draw, px){
  const c=document.createElement('canvas'); c.width=px; c.height=px;
  draw(c.getContext('2d'), px);
  return texFromCanvas(c);
}
const sprCache={};
// せかいでの たかさ（1タイル＝1）
const MON_SIZE={flameslime:2.27,thornwolf:2.48,armycrab:2.69,ghostlamp:2.48,stonecyclops:2.91,hornet:2.38,tornado:2.8,merman:2.59,skullbat:2.38,metalslime:1.9,golem:2.75,shadowmimic:2.64,darkpriest:2.69,icephoenix:2.69,mushmage:2.59,blazedragon:2.85,devilknight:2.8,orcking:2.91,demonlord:3.12,bloodwolf:2.69,firedragon:3.06,madcyclops:3.06,darkguard:2.91,icephoenixlord:2.91,shadowassassin:2.75,killerpanther:2.69,deathbishop:2.91,bluecyclops:3.06,desgran1:4.18,desgran2:4.18,desgran3:4.6,greenslime:2.01,skeleton:2.54,drakybat:2.16,mimic:2.48,wisp:2.22,hoimislime:2.01,mandragora:2.38,madrock:2.16,icicleslime:2.0,frostbat:2.3,yukingon:2.5,blizzardhawk:2.6,frostmermaid:2.7,yumebanken:3.2,yumebanken_f:2.4};
// ---------------- キャラクター（ポーズべつ）----------------
const chrTexCache={};
function chrTex(key,pose){
  const d=CHR[key]; if(!d) return null;
  const p=d[pose]||d.front||d.side||d.back;
  if(!p) return null;
  const k=key+':'+pose;
  if(!chrTexCache[k]){
    const t=new THREE.TextureLoader().load(p);
    t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter;
    chrTexCache[k]=t;
  }
  return chrTexCache[k];
}
// むき → つかう ポーズ
// ※ げんがの よこむきは 「ひだりむき」。したがって みぎへ すすむ ときに はんてんする。
// walk=true の ときは 「いっぽ ふみだした」フレーム（…W）を つかう。
function poseOf(key,dir,walk){
  const d=CHR[key]; if(!d) return {pose:'front',flip:false};
  let base='front', flip=false;
  if(dir==='back'  && d.back){ base='back'; }
  else if(dir==='left'  && d.side){ base='side'; flip=false; }
  else if(dir==='right' && d.side){ base='side'; flip=true; }
  if(walk && d[base+'W']) base=base+'W';
  return {pose:base, flip};
}
function chrBillboard(key,size){
  const d=CHR[key];
  if(!d) return billboard(key,size);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size*d.w/d.h, size),
    new THREE.MeshBasicMaterial({map:chrTex(key,'front'),transparent:true,alphaTest:0.35}));
  m.userData.chr=key; m.userData.pose='front';
  return m;
}
const monTexCache={};
function monTex(key){
  if(!monTexCache[key]){
    const t=new THREE.TextureLoader().load(MON[key].src);
    t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter;
    monTexCache[key]=t;
  }
  return monTexCache[key];
}
function billboard(key, size){
  if(!MON[key] && !SPR[key]){
    console.warn('[view] スプライトが ありません: '+key+' → sora で だいようします');
    key='sora';
  }
  const mon=MON[key];
  if(mon){                                       // こうかいぞうどの まもの（PNG）
    const m=new THREE.Mesh(new THREE.PlaneGeometry(size*mon.w/mon.h, size),
      new THREE.MeshBasicMaterial({map:monTex(key),transparent:true,alphaTest:0.12}));
    m.userData.aspect=mon.w/mon.h;
    return m;
  }
  const art=SPR[key];
  if(!sprCache[key]) sprCache[key]=texFromCanvas(artCanvas(art,8));
  const w=art[0].length, h=art.length;          // size は「たかさ」。よこは アスペクトで きめる
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size*w/h, size),
    new THREE.MeshBasicMaterial({map:sprCache[key],transparent:true,alphaTest:0.4}));
  m.userData.aspect=w/h;
  return m;
}

// ---------------- テクスチャ ----------------
const TEX={};
function initTex(){
  TEX.grass = patTex((x,px)=>{
    x.fillStyle='#4f9a3e'; x.fillRect(0,0,px,px);
    for(let i=0;i<90;i++){ x.fillStyle=i%2?'#428a34':'#5cab4a';
      x.fillRect(Math.random()*px|0,Math.random()*px|0,3,3); }
    x.fillStyle='#78c45e';
    for(let i=0;i<40;i++){ const bx=Math.random()*px|0,by=Math.random()*px|0;
      x.fillRect(bx,by,1,3); x.fillRect(bx+1,by+1,1,2); }
    for(let i=0;i<5;i++){ const bx=Math.random()*(px-4)|0,by=Math.random()*(px-4)|0;
      x.fillStyle=i%2?'#f2ede4':'#e8d050'; x.fillRect(bx,by,2,2);
      x.fillStyle='#d8c840'; x.fillRect(bx,by+2,2,1); }
  },64);
  TEX.road = patTex((x,px)=>{
    x.fillStyle='#6d6152'; x.fillRect(0,0,px,px);
    for(let j=0;j<4;j++){ const off=(j%2)?px/8:0;
      for(let i=-1;i<4;i++){
        const sx=i*(px/4)+off+1, sy=j*(px/4)+1, w=px/4-2, h=px/4-2;
        const t=0.85+Math.random()*0.3;
        x.fillStyle=`rgb(${138*t|0},${124*t|0},${100*t|0})`; x.fillRect(sx,sy,w,h);
        x.fillStyle='rgba(255,240,210,0.25)'; x.fillRect(sx,sy,w,2);
        x.fillStyle='rgba(30,20,10,0.35)'; x.fillRect(sx,sy+h-2,w,2);
      }}
  },64);
  TEX.brick = patTex((x,px)=>{
    x.fillStyle='#454060'; x.fillRect(0,0,px,px);
    for(let j=0;j<5;j++){ const off=(j%2)?px/6:0;
      for(let i=-1;i<4;i++){
        const sx=i*(px/3)+off+1, sy=j*(px/5)+1, w=px/3-2, h=px/5-2;
        const t=0.82+Math.random()*0.36;
        x.fillStyle=`rgb(${92*t|0},${88*t|0},${120*t|0})`; x.fillRect(sx,sy,w,h);
        x.fillStyle='rgba(255,255,255,0.16)'; x.fillRect(sx,sy,w,1);
        x.fillStyle='rgba(0,0,0,0.3)'; x.fillRect(sx,sy+h-1,w,1);
      }}
    x.fillStyle='rgba(70,120,60,0.45)';
    for(let i=0;i<6;i++) x.fillRect(Math.random()*px|0,px-4-(Math.random()*6|0),3,2);
  },64);
  TEX.roof = patTex((x,px)=>{
    x.fillStyle='#5c2622'; x.fillRect(0,0,px,px);
    for(let j=0;j<6;j++){ const off=(j%2)?px/8:0;
      for(let i=-1;i<5;i++){
        const sx=i*(px/4)+off, sy=j*(px/6);
        const t=0.85+Math.random()*0.3;
        x.fillStyle=`rgb(${170*t|0},${72*t|0},${58*t|0})`;
        x.fillRect(sx+1,sy+1,px/4-2,px/6-1);
        x.fillStyle='rgba(255,200,160,0.25)'; x.fillRect(sx+1,sy+1,px/4-2,1);
      }}
  },64);
  TEX.rock = patTex((x,px)=>{
    x.fillStyle='#8f7f52'; x.fillRect(0,0,px,px);
    for(let i=0;i<160;i++){ const t=0.62+Math.random()*0.65;
      x.fillStyle=`rgb(${150*t|0},${132*t|0},${86*t|0})`;
      x.fillRect(Math.random()*px|0,Math.random()*px|0,3,2); }
    x.fillStyle='rgba(255,246,220,0.22)';
    for(let i=0;i<24;i++) x.fillRect(Math.random()*px|0,Math.random()*px|0,4,1);
    x.fillStyle='rgba(30,25,15,0.4)';
    for(let i=0;i<7;i++){ let bx=Math.random()*px,by=Math.random()*px;
      for(let s=0;s<8;s++){ x.fillRect(bx|0,by|0,2,1); bx+=Math.random()*5-2; by+=Math.random()*4-1; } }
  },64);
  TEX.cliff = patTex((x,px)=>{
    x.fillStyle='#232a38'; x.fillRect(0,0,px,px);
    for(let i=0;i<26;i++){ const bx=Math.random()*px|0, w=2+Math.random()*4|0;
      const t=0.6+Math.random()*0.8;
      x.fillStyle=`rgb(${52*t|0},${62*t|0},${84*t|0})`; x.fillRect(bx,0,w,px); }
    x.fillStyle='rgba(200,220,255,0.16)';
    for(let i=0;i<12;i++) x.fillRect(Math.random()*px|0,Math.random()*px*0.4|0,2,3);
  },64);
  TEX.snow = patTex((x,px)=>{
    x.fillStyle='#eef4fb'; x.fillRect(0,0,px,px);
    for(let i=0;i<70;i++){ x.fillStyle=i%2?'#e2ecf7':'#f8fbff';
      x.fillRect(Math.random()*px|0,Math.random()*px|0,3,3); }
    x.fillStyle='rgba(190,210,235,0.55)';           // ゆきの ふきだまり
    for(let i=0;i<14;i++) x.fillRect(Math.random()*px|0,Math.random()*px|0,6,2);
    x.fillStyle='rgba(255,255,255,0.9)';            // きらめき
    for(let i=0;i<10;i++) x.fillRect(Math.random()*px|0,Math.random()*px|0,1,1);
  },64);
  TEX.pave = patTex((x,px)=>{
    x.fillStyle='#8e93a2'; x.fillRect(0,0,px,px);
    for(let j=0;j<4;j++){ const off=(j%2)?px/8:0;
      for(let i=-1;i<4;i++){
        const sx=i*(px/4)+off+1, sy=j*(px/4)+1, w=px/4-2, h=px/4-2;
        const t=0.86+Math.random()*0.26;
        x.fillStyle=`rgb(${162*t|0},${168*t|0},${182*t|0})`; x.fillRect(sx,sy,w,h);
        x.fillStyle='rgba(255,255,255,0.35)'; x.fillRect(sx,sy,w,2);
        x.fillStyle='rgba(40,48,64,0.30)'; x.fillRect(sx,sy+h-2,w,2);
      }}
    x.fillStyle='rgba(240,248,255,0.5)';            // すみに のこる ゆき
    for(let i=0;i<10;i++) x.fillRect(Math.random()*px|0,Math.random()*px|0,4,2);
  },64);
  TEX.whitestone = patTex((x,px)=>{
    x.fillStyle='#b8c0cc'; x.fillRect(0,0,px,px);
    for(let j=0;j<5;j++){ const off=(j%2)?px/6:0;
      for(let i=-1;i<4;i++){
        const sx=i*(px/3)+off+1, sy=j*(px/5)+1, w=px/3-2, h=px/5-2;
        const t=0.9+Math.random()*0.22;
        x.fillStyle=`rgb(${226*t|0},${232*t|0},${240*t|0})`; x.fillRect(sx,sy,w,h);
        x.fillStyle='rgba(255,255,255,0.5)'; x.fillRect(sx,sy,w,1);
        x.fillStyle='rgba(120,130,150,0.4)'; x.fillRect(sx,sy+h-1,w,1);
      }}
  },64);
  TEX.bluetile = patTex((x,px)=>{
    x.fillStyle='#1e3a6e'; x.fillRect(0,0,px,px);
    for(let j=0;j<6;j++){ const off=(j%2)?px/8:0;
      for(let i=-1;i<5;i++){
        const sx=i*(px/4)+off, sy=j*(px/6);
        const t=0.85+Math.random()*0.35;
        x.fillStyle=`rgb(${44*t|0},${92*t|0},${168*t|0})`;
        x.fillRect(sx+1,sy+1,px/4-2,px/6-1);
        x.fillStyle='rgba(190,220,255,0.32)'; x.fillRect(sx+1,sy+1,px/4-2,1);
      }}
  },64);
  TEX.ice = patTex((x,px)=>{
    x.fillStyle='#8fc4e4'; x.fillRect(0,0,px,px);
    for(let i=0;i<60;i++){ const t=0.82+Math.random()*0.34;
      x.fillStyle=`rgb(${150*t|0},${200*t|0},${232*t|0})`;
      x.fillRect(Math.random()*px|0,Math.random()*px|0,5,3); }
    x.fillStyle='rgba(255,255,255,0.55)';
    for(let i=0;i<12;i++){ const bx=Math.random()*px|0,by=Math.random()*px|0;
      x.fillRect(bx,by,6,1); x.fillRect(bx,by,1,5); }
  },64);
  TEX.icewall = patTex((x,px)=>{
    x.fillStyle='#3f6d94'; x.fillRect(0,0,px,px);
    for(let i=0;i<22;i++){ const bx=Math.random()*px|0,w=3+Math.random()*6|0;
      const t=0.7+Math.random()*0.6;
      x.fillStyle=`rgb(${88*t|0},${150*t|0},${196*t|0})`; x.fillRect(bx,0,w,px); }
    x.fillStyle='rgba(230,248,255,0.32)';
    for(let i=0;i<14;i++) x.fillRect(Math.random()*px|0,Math.random()*px*0.5|0,2,4);
  },64);
  TEX.carpet = patTex((x,px)=>{
    x.fillStyle='#7a2530'; x.fillRect(0,0,px,px);
    for(let i=0;i<40;i++){ x.fillStyle=i%2?'#8c2c38':'#661d26';
      x.fillRect(Math.random()*px|0,Math.random()*px|0,4,4); }
    x.fillStyle='#c8a martial'.replace(' martial','850');
    for(let i=0;i<6;i++) x.fillRect(2,i*10+3,px-4,1);
  },64);
  TEX.wood = patTex((x,px)=>{
    x.fillStyle='#7a5a34'; x.fillRect(0,0,px,px);
    for(let i=0;i<8;i++){ const t=0.8+Math.random()*0.4;
      x.fillStyle=`rgb(${122*t|0},${90*t|0},${52*t|0})`;
      x.fillRect(0,i*(px/8),px,px/8-1); }
  },64);
  TEX.water = (()=>{ const t=patTex((x,px)=>{
      x.fillStyle='#1c4f8a'; x.fillRect(0,0,px,px);
      for(let i=0;i<40;i++){ x.fillStyle=i%2?'#2a66aa':'#174276';
        x.fillRect(Math.random()*px|0,Math.random()*px|0,6,2); }
      x.fillStyle='rgba(220,240,255,0.5)';
      for(let i=0;i<10;i++) x.fillRect(Math.random()*px|0,Math.random()*px|0,4,1);
    },64); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; })();
  TEX.battleFloor = (()=>{ const t=patTex((x,px)=>{
      x.fillStyle='#3c3450'; x.fillRect(0,0,px,px);
      const g=px/4;
      for(let j=0;j<4;j++)for(let i=0;i<4;i++){
        const k=0.82+((i*7+j*13)%10)/28;
        x.fillStyle=`rgb(${86*k|0},${76*k|0},${112*k|0})`;
        x.fillRect(i*g+1,j*g+1,g-2,g-2);
        x.fillStyle='rgba(255,255,255,0.12)'; x.fillRect(i*g+1,j*g+1,g-2,1);
      }
    },64); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(8,8); return t; })();
}

// ---------------- 描画基盤 ----------------
let renderer, canvas, stage;
let scene, cam;                     // フィールド用
let batScene, batCam;               // 戦闘用
let actors = {hero:null, f1:null, f2:null};
let fp = [{x:0,y:0},{x:0,y:0},{x:0,y:0}];
let animObjs = [];                  // {mesh,light,ph} 揺れるもの
let waters = [];
let chestLids = {};
let curMap = null, curScene = {}, curNight = false, curTS = null;
let drawCalls = 0;
function countDrawCalls(){
  let n=0;
  if(!scene) return 0;
  scene.traverse(o=>{ if(o.geometry && o.material) n++; });
  return n;
}
let snowfall = null, aurora = null, footprints = [], footIdx = 0, lastFootTile = null;
let mode = 'field';
let fxState = null;
let shake = 0;

const THEME = {
  dream:  {sky:0x241a4e, fog:[0x7a5fb8,13,34], amb:[0xd8c8ff,0.95],sun:[0xffd8f0,0.5]},
  snow:   {sky:0x9ec8e8, fog:[0xcfe2f2,14,40], amb:[0xdfeaff,0.95],sun:[0xffffff,0.55]},
  castle: {sky:0x2a2c44, fog:[0x2a2c44,10,26], amb:[0xc8c0e0,0.85],sun:[0xffe8c0,0.5]},
  ice:    {sky:0x14283c, fog:[0x14283c,8,22],  amb:[0x9ac8f0,0.8], sun:[0xd8f0ff,0.45]},
  village:{sky:0x79b8e8, fog:[0x9ccbe8,12,30], amb:[0xfff2e0,0.9], sun:[0xfff0d8,0.7]},
  field:  {sky:0x79b8e8, fog:[0x9ccbe8,12,30], amb:[0xfff2e0,0.85],sun:[0xfff0d8,0.7]},
  cave:   {sky:0x0a1020, fog:[0x0a1020,9,22],  amb:[0x9aa8d0,0.8], sun:[0xbfd0ff,0.35]},
  indoor: {sky:0x1a1420, fog:[0x1a1420,10,24], amb:[0xffe6c0,0.95],sun:[0xffd8a0,0.4]},
};

let canvas2d=null, is2D=false, lastPoses2D=[];
function init(){
  canvas=document.getElementById('gl');
  canvas2d=document.getElementById('gl2d');
  stage=document.getElementById('stage');
  renderer=new THREE.WebGLRenderer({canvas,antialias:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  initTex();
  cam=new THREE.PerspectiveCamera(32,1,0.1,140);
  batCam=new THREE.PerspectiveCamera(48,1,0.1,120);
  buildBattleScene();
  if(V2 && canvas2d){ V2.init(canvas2d, C, CHR); if(V2.setMon) V2.setMon(MON);
    if(V2.setNpcData && typeof NPCDATA!=='undefined') V2.setNpcData(NPCDATA); }
  fit();
  addEventListener('resize',fit);
}
function fit(){
  const w=stage.clientWidth,h=stage.clientHeight;
  renderer.setSize(w,h,false);
  cam.aspect=w/h; cam.updateProjectionMatrix();
  batCam.aspect=w/h; batCam.updateProjectionMatrix();
  if(V2) V2.resize();
}

// ---- インスタンス描画ヘルパ（drawCallを地形種ごと1つに） ----
function addInstanced(geo, mat, list){
  if(!list.length) return null;
  const im=new THREE.InstancedMesh(geo, mat, list.length);
  const d=new THREE.Object3D();
  list.forEach((p,i)=>{
    d.position.set(p[0],p[1],p[2]);
    if(p[3]!==undefined) d.rotation.y=p[3];
    if(p[4]!==undefined) d.scale.set(p[4],p[5]!==undefined?p[5]:p[4],p[4]);
    else d.scale.set(1,1,1);
    d.updateMatrix(); im.setMatrixAt(i,d.matrix);
  });
  im.instanceMatrix.needsUpdate=true;
  scene.add(im);
  return im;
}

// ---------------- ゆきぐにの タイル ----------------
// じかに Mesh を つくらず、かたちごとに いちらんへ ためる（あとで InstancedMesh に まとめる）
// これを しないと 48×36の こういきマップで ドローコールが 6000をこえて iPhoneが やられる
function buildSnowTile(ch,x,y,topY,ts,put){
  if(ch==='T'){                      // あおい せんとう
    put('towerBody',[x,topY+0.75,y]);
    put('towerRoof',[x,topY+2.1,y]);
    put('towerCap', [x,topY+2.72,y]);
    return true;
  }
  if(ch==='K'){                      // おうじょうの もん
    put('gateBody',[x,topY+1.15,y]);
    put('gateArch',[x,topY+1.95,y+0.28]);
    return true;
  }
  if(ch==='F'){                      // ふんすい
    put('fountBase',[x,topY+0.15,y]);
    put((ts&&ts.id==='DREAM_INVASION')?'fountWaterDark':'fountWater',[x,topY+0.32,y]);
    put('fountPole',[x,topY+0.65,y]);
    return true;
  }
  if(ch==='W'||ch==='M'||ch==='I'||ch==='P'){   // みせ・やど・きょうかい
    put('shop_'+ch,[x,topY+0.6,y]);
    put('shopRoof', [x,topY+1.65,y,Math.PI/4]);
    put('shopCap',  [x,topY+2.0,y,Math.PI/4]);
    put('sign_'+ch, [x,topY+0.74,y+0.5]);
    return true;
  }
  if(ch==='G'){                      // みなみもん
    for(const dx of [-0.45,0.45]){
      put('gatePost',[x+dx,topY+0.95,y]);
      put('gateTip', [x+dx,topY+2.05,y]);
    }
    return true;
  }
  if(ch==='f'){                      // ゆきを かぶった き
    put('snowTrunk',[x,topY+0.3,y]);
    for(let k=0;k<3;k++){
      put('snowCone'+k,[x,topY+0.7+k*0.34,y]);
      put('snowCap'+k, [x,topY+0.94+k*0.34,y]);
    }
    return true;
  }
  return false;
}
// かたち → (ジオメトリ, マテリアル) の じてん。ここに ない かたちは つくられない
function snowShapes(){
  const wh=()=>new THREE.MeshLambertMaterial({map:TEX.whitestone});
  const bl=()=>new THREE.MeshLambertMaterial({map:TEX.bluetile});
  const S={
    towerBody:[new THREE.CylinderGeometry(0.36,0.42,1.5,8), wh()],
    towerRoof:[new THREE.ConeGeometry(0.54,1.2,8), bl()],
    towerCap :[new THREE.SphereGeometry(0.1,6,6), new THREE.MeshBasicMaterial({color:0xf2f6ff})],
    gateBody :[new THREE.BoxGeometry(1,2.3,0.9),
               new THREE.MeshLambertMaterial({map:TEX.whitestone,color:0xdde4f0})],
    gateArch :[new THREE.BoxGeometry(1,0.5,0.55), bl()],
    fountBase:[new THREE.CylinderGeometry(0.48,0.52,0.3,12), wh()],
    fountWater:[new THREE.CylinderGeometry(0.4,0.4,0.06,12),
               new THREE.MeshBasicMaterial({color:0x9fd8f0,transparent:true,opacity:0.9})],
    fountWaterDark:[new THREE.CylinderGeometry(0.4,0.4,0.06,12),
               new THREE.MeshBasicMaterial({color:0x8a4fc0,transparent:true,opacity:0.9})],
    fountPole:[new THREE.CylinderGeometry(0.08,0.12,0.7,8), wh()],
    shopRoof :[new THREE.ConeGeometry(0.84,1.0,4), bl()],
    shopCap  :[new THREE.ConeGeometry(0.62,0.3,4), new THREE.MeshBasicMaterial({color:0xf6faff})],
    gatePost :[new THREE.BoxGeometry(0.18,1.9,0.32), wh()],
    gateTip  :[new THREE.ConeGeometry(0.2,0.36,6), bl()],
    snowTrunk:[new THREE.CylinderGeometry(0.1,0.14,0.6,6),
               new THREE.MeshLambertMaterial({color:0x5a4632})],
  };
  const bodyCol={W:0xd8c8b0, M:0xd0c8e8, I:0xe8dcc0, P:0xf0f0fa};
  const signCol={W:0xc86050, M:0x8a6ad0, I:0xf0d060, P:0xeaeaff};
  Object.keys(bodyCol).forEach(k=>{
    S['shop_'+k]=[new THREE.BoxGeometry(0.96,1.2,0.96),
      new THREE.MeshLambertMaterial({map:TEX.whitestone,color:bodyCol[k]})];
    S['sign_'+k]=[new THREE.PlaneGeometry(0.5,0.3),
      new THREE.MeshBasicMaterial({color:signCol[k]})];
  });
  for(let k=0;k<3;k++){
    const r=0.46-k*0.12;
    S['snowCone'+k]=[new THREE.ConeGeometry(r,0.56,7),
      new THREE.MeshLambertMaterial({color:0x2c5a44})];
    S['snowCap'+k] =[new THREE.ConeGeometry(r*0.9,0.2,7),
      new THREE.MeshBasicMaterial({color:0xf4f9ff})];
  }
  return S;
}
// ---------------- せきせつパーティクル ----------------
function buildSnowfall(ts){
  const n=420;
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    pos[i*3]=(Math.random()-0.5)*34;
    pos[i*3+1]=Math.random()*16;
    pos[i*3+2]=(Math.random()-0.5)*34;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const col=(ts&&ts.id!=='NORMAL')?ts.snowColor:0xffffff;
  const mat=new THREE.PointsMaterial({color:col,size:0.13,transparent:true,opacity:0.9,
    depthWrite:false});
  snowfall=new THREE.Points(geo,mat);
  snowfall.userData.rate=(ts?ts.snowRate:1.0);
  scene.add(snowfall);
}
// ---------------- オーロラ ----------------
function auroraTexture(){
  return patTex((x,px)=>{
    const g=x.createLinearGradient(0,0,0,px);
    g.addColorStop(0.00,'rgba(0,0,0,0)');
    g.addColorStop(0.35,'rgba(90,240,180,0.55)');
    g.addColorStop(0.60,'rgba(120,200,255,0.45)');
    g.addColorStop(0.85,'rgba(180,120,255,0.25)');
    g.addColorStop(1.00,'rgba(0,0,0,0)');
    x.fillStyle=g; x.fillRect(0,0,px,px);
    for(let i=0;i<26;i++){        // たてに ゆれる すじ
      x.fillStyle='rgba(255,255,255,'+(0.05+Math.random()*0.12)+')';
      x.fillRect(Math.random()*px|0,0,2+Math.random()*3|0,px);
    }
  },128);
}
function buildAurora(){
  aurora=new THREE.Group();
  const tex=auroraTexture();
  tex.wrapS=THREE.RepeatWrapping; tex.repeat.set(3,1);
  for(let i=0;i<3;i++){
    const geo=new THREE.PlaneGeometry(46,10,24,1);
    const p=geo.attributes.position;
    for(let k=0;k<p.count;k++){    // ゆるやかに うねらせる
      const xx=p.getX(k);
      p.setZ(k, Math.sin(xx*0.22+i)*2.4);
    }
    geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex.clone(),
      transparent:true, opacity:0.5-i*0.11, blending:THREE.AdditiveBlending,
      depthWrite:false, side:THREE.DoubleSide}));
    m.material.map.wrapS=THREE.RepeatWrapping; m.material.map.repeat.set(3,1);
    m.position.set(0, 13+i*2.2, -16-i*4);
    m.rotation.x=-0.34;
    aurora.add(m);
  }
  scene.add(aurora);
}
// ---------------- ゆきの あしあと ----------------
function initFootprints(){
  footprints=[]; footIdx=0; lastFootTile=null;
  const geo=new THREE.PlaneGeometry(0.34,0.5);
  for(let i=0;i<48;i++){
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x9fb0c8,
      transparent:true, opacity:0, depthWrite:false}));
    m.rotation.x=-Math.PI/2; m.position.set(0,-99,0);
    scene.add(m); footprints.push({mesh:m, life:0});
  }
}
function dropFootprint(x,z,side){
  if(!footprints.length) return;
  const f=footprints[footIdx%footprints.length]; footIdx++;
  f.mesh.position.set(x+(side?0.16:-0.16), 0.075, z+0.1);
  f.mesh.rotation.z=(Math.random()-0.5)*0.3;
  f.life=1.0;
}
function disposeScene(s){
  if(!s) return;
  s.traverse(o=>{
    if(o.geometry) o.geometry.dispose();
    if(o.material){
      const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{ if(m.map && m.map.isCanvasTexture && m.map.__clone) m.map.dispose(); m.dispose(); });
    }
  });
}
// だんさの ある ちけい（どうくつ・こおりの どうくつ）かどうか
function isElevated(mapName){
  const m=C.MAPS[mapName];
  return !!m && (m.theme==='cave' || m.theme==='ice');
}
function darken(hex,k){
  const r=((hex>>16)&255)*k, g=((hex>>8)&255)*k, b=(hex&255)*k;
  return ((r|0)<<16)|((g|0)<<8)|(b|0);
}
function buildMap(name){
  // しろの なか だけ 3D。それ いがいは ドットえ（2D）で えがく
  const mode = (C.WORLD && C.WORLD.renderModeOf) ? C.WORLD.renderModeOf(name) : '2d';
  is2D = (mode==='2d');
  if(canvas2d) canvas2d.style.display = is2D ? 'block' : 'none';
  if(canvas) canvas.style.visibility = is2D ? 'hidden' : 'visible';
  if(is2D){
    curMap = name;
    if(V2){ V2.resize(); V2.buildMap(name); }
    setActors(true);
    return;
  }
  disposeScene(scene);
  const map=C.MAPS[name];
  const th=THEME[map.theme]||THEME.field;
  const sc=(C.WORLD&&C.WORLD.sceneOf)?C.WORLD.sceneOf(name):{};
  const ts=(C.townStateDef?C.townStateDef():null);
  const night=!!(C.G&&C.G.night)&&!!sc.outdoor;
  scene=new THREE.Scene();
  let sky=th.sky, fog=[th.fog[0], th.fog[1]*1.5, th.fog[2]*1.6];
  if(map.theme==='snow' && ts){ sky=ts.sky; fog=[ts.fog[0], ts.fog[1]*1.5, ts.fog[2]*1.6]; }
  if(night){ sky=darken(sky,0.34); fog=[darken(fog[0],0.42), fog[1]*0.85, fog[2]*0.9]; }
  scene.background=new THREE.Color(sky);
  scene.fog=new THREE.Fog(fog[0],fog[1],fog[2]);
  curScene=sc; curNight=night; curTS=ts;
  animObjs=[]; waters=[]; chestLids={};
  curMap=name;

  const rows=map.tiles, H=rows.length, W=rows[0].length;
  const cave = map.theme==='cave' || map.theme==='ice';
  const dream = map.theme==='dream';
  const snow = map.theme==='snow';
  const ice  = map.theme==='ice';
  const cast = map.theme==='castle';
  const baseY = cave?0.25:-0.06;     // 洞窟は台地
  const topY  = cave?0.5:0;
  const G_={}, put=(k,v)=>{ (G_[k]=G_[k]||[]).push(v); };

  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const ch=rows[y][x];
    if(ch==='w'){                    // みず
      put('waterbed',[x,baseY-0.24,y]);
      const wm=new THREE.Mesh(new THREE.PlaneGeometry(1,1),
        new THREE.MeshBasicMaterial({map:TEX.water.clone(),transparent:true,opacity:0.86}));
      wm.material.map.wrapS=wm.material.map.wrapT=THREE.RepeatWrapping;
      wm.rotation.x=-Math.PI/2; wm.position.set(x,topY-0.14,y);
      scene.add(wm); waters.push(wm);
      continue;
    }
    if(ch==='#'){                    // かべ／がんぺき
      if(cave){
        const h=2.2+((x*7+y*13)%5)*0.45;
        put('cliff',[x,h/2,y,0,1,h]);
        put('spike',[x+(((x+y)%3)-1)*0.18,h+0.27,y,(x*3+y)*0.7]);
      }else{
        put('wall',[x,0.8,y]);
      }
      continue;
    }
    // ゆか
    put(ch==='r'?'road':'ground',[x,baseY,y]);
    if(snow && buildSnowTile(ch,x,y,topY,ts,put)) continue;
    if(ice){
      if(ch==='o'){ put('icePillar',[x,topY+0.6,y]); continue; }
      if(ch==='C'||ch==='B'||ch==='t'||ch==='G'||ch==='<'||ch==='>'){ /* 既存処理へ */ }
    }
    if(cast){
      if(ch==='T'){                                  // はしら（だいざ・みぞ・かしらつき）
        put('pillarBase',[x,topY+0.10,y]);
        put('castPillar',[x,topY+1.05,y]);
        put('pillarCap', [x,topY+2.05,y]);
        continue;
      }
      if(ch==='K'){                                  // ぎょくざ
        put('throneSeat',[x,topY+0.42,y]);
        put('throneBack',[x,topY+1.15,y-0.34]);
        put('throneGold',[x,topY+1.72,y-0.34]);
        continue;
      }
      if(ch==='Z'){                                  // ねむる おうじょ（ベッドごと 1まいえ）
        // ★5章で きたの かけらを とった あとは、めざめて たっている
        const awake = C.G && (C.G.chapter||1)===5 && C.G.flags && C.G.flags.ch5_shard1;
        const key = awake ? 'princess' : (CHR.princessBed ? 'princessBed' : 'princess');
        const d = CHR[key];
        if(d){
          const pm = chrBillboard(key, 1.30);
          pm.position.set(x, topY + 1.30*0.5, y);
          pm.userData.bill = true;
          scene.add(pm);
          animObjs.push({mesh:pm, bill:true, ph:0});
        }
        continue;
      }
      if(ch==='D'){ put('castDoor',[x,topY+0.5,y]); continue; }
      if(ch==='#'){                                  // かべ：まどと たれまくを かざる
        const key = (x*7+y*13)%5;
        if(key===0) put('castWindow',[x,topY+1.05,y+0.50]);
        else if(key===2) put('banner',[x,topY+1.05,y+0.50]);
        else if(key===4) put('wallTorch',[x,topY+0.95,y+0.48]);
      }
    }
    if(ch==='f'){                    // もり
      put('leafA',[x,topY+0.5,y,(x*7+y*3)%6]);
      put('leafB',[x-0.28,topY+0.34,y+0.2,0]);
      put('leafB',[x+0.3,topY+0.36,y-0.16,0]);
    }
    if(ch==='o'){ put('rock',[x,topY+0.34,y,(x*5+y*3)%6]); }
    if(ch==='I'||ch==='P'||ch==='S'){   // やど・きょうかい・みせ
      const col = ch==='I'?0x9a7a4a : ch==='P'?0xc8c8d8 : 0x8a5a2a;
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.96,1.0,0.96),
        new THREE.MeshLambertMaterial({map:TEX.brick,color:col}));
      b.position.set(x,topY+0.5,y); scene.add(b);
      const r=new THREE.Mesh(new THREE.ConeGeometry(0.86,0.7,4),
        new THREE.MeshLambertMaterial({map:TEX.roof}));
      r.position.set(x,topY+1.3,y); r.rotation.y=Math.PI/4; scene.add(r);
      // かんばん
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.3),
        new THREE.MeshBasicMaterial({color: ch==='I'?0xf0d060 : ch==='P'?0xeaeaff : 0xf0a050}));
      sign.position.set(x,topY+0.62,y+0.5); scene.add(sign);
    }
    if(ch==='D'){                    // とびら
      const d=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.0,0.9),
        new THREE.MeshLambertMaterial({map:TEX.brick,color:0x8a8296}));
      d.position.set(x,topY+0.5,y); scene.add(d);
      const dr=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.66),
        new THREE.MeshBasicMaterial({map:TEX.wood}));
      dr.position.set(x,topY+0.33,y+0.46); scene.add(dr);
    }
    if(ch==='n'){                    // むらびと・へいし
      let key='villagerB';
      if(typeof NPCDATA!=='undefined' && NPCDATA.npcAt){
        const e=NPCDATA.npcAt(name,x,y);
        if(e && e.spr) key=e.spr;
      }
      const s = CHR[key] ? chrBillboard(key,1.45) : billboard('npc',1.2);
      s.position.set(x, topY+0.74, y); s.userData.bill=true;
      scene.add(s); animObjs.push({mesh:s,bill:true,ph:0});
      const sh=new THREE.Mesh(new THREE.CircleGeometry(0.30,12),
        new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false}));
      sh.rotation.x=-Math.PI/2; sh.position.set(x, topY+0.045, y);
      scene.add(sh);                                  // あしもとの かげ
    }
    if(ch==='t'){                    // たいまつ（かべぎわに よせる）
      let ox=0,oz=0;
      if(C.isBlocked(C.tileAt(name,x-1,y))) ox=-0.38;
      else if(C.isBlocked(C.tileAt(name,x+1,y))) ox=0.38;
      else if(C.isBlocked(C.tileAt(name,x,y-1))) oz=-0.38;
      else oz=0.38;
      const pole=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.8,0.08),
        new THREE.MeshLambertMaterial({color:0x3a2a1a}));
      pole.position.set(x+ox,topY+0.4,y+oz); scene.add(pole);
      const fire=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),
        new THREE.MeshBasicMaterial({color:0xffb050}));
      fire.position.set(x+ox,topY+0.86,y+oz); scene.add(fire);
      const li=new THREE.PointLight(0xff9a40,1.3,4.5);
      li.position.set(x+ox,topY+1.0,y+oz); scene.add(li);
      animObjs.push({mesh:fire,light:li,ph:Math.random()*6});
    }
    if(ch==='C'){                    // たからばこ
      const got=C.G.gotTreasure[name+':'+x+','+y];
      const body=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.34,0.44),
        new THREE.MeshLambertMaterial({map:TEX.wood}));
      body.position.set(x,topY+0.17,y); scene.add(body);
      const lid=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.2,0.46),
        new THREE.MeshLambertMaterial({map:TEX.wood,color:0xc0a070}));
      lid.position.set(x,topY+0.42,y); scene.add(lid);
      const band=new THREE.Mesh(new THREE.BoxGeometry(0.64,0.08,0.48),
        new THREE.MeshBasicMaterial({color:0xd9a832}));
      band.position.set(x,topY+0.3,y); scene.add(band);
      chestLids[x+','+y]=lid;
      if(got){ lid.rotation.x=-0.9; lid.position.y=topY+0.5; }
    }
    if(ch==='B'){                    // ボス（さいおくの けはい）
      // ★まえは desgran1（LQ2の まおう）の えを かりて いたため、
      //   せんとうの すがた（regretshadow）と ちがって いた。
      //   しょうデータから ボスを ひき、せんとうと おなじ えを つかう。
      const bi = C.bossInfoAt ? C.bossInfoAt(name) : null;
      const done = bi && bi.clearedFlag && C.G.flags[bi.clearedFlag];
      if(bi && !done){
        const bd = (C.MIDBOSS && C.MIDBOSS[bi.key]) || null;
        const s=billboard((bd && bd.art) || bi.key, 2.4);
        s.position.set(x,topY+0.75,y); scene.add(s);
        animObjs.push({mesh:s,bill:true,ph:1});
        const li=new THREE.PointLight(0x9a6ad0,1.2,4);
        li.position.set(x,topY+1.0,y); scene.add(li);
      }
    }
    if(ch==='<'||ch==='>'){          // かいだん
      // ★ゆかと どうけいしょくで うもれて いたので、だんを おおきく・しろく し、
      //   きんの ふちどりと ひかりの はしらで「でいりぐち」だと ひとめで わかるように。
      for(let i=0;i<3;i++){
        const st=new THREE.Mesh(new THREE.BoxGeometry(0.94,0.16,0.9-i*0.26),
          new THREE.MeshLambertMaterial({map:TEX.rock,color:0xf2ede2}));
        st.position.set(x,topY+0.02+i*0.15,y+i*0.11); scene.add(st);
        const ed=new THREE.Mesh(new THREE.BoxGeometry(0.98,0.05,0.94-i*0.26),
          new THREE.MeshBasicMaterial({color:0xe8c25a}));
        ed.position.set(x,topY+0.11+i*0.15,y+i*0.11); scene.add(ed);
      }
      const pil=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.46,2.6,10,1,true),
        new THREE.MeshBasicMaterial({color:0xffe9a0, transparent:true, opacity:0.22,
          side:THREE.DoubleSide, depthWrite:false}));
      pil.position.set(x,topY+1.5,y); scene.add(pil);
      const pl=new THREE.PointLight(0xffdd88,1.2,4.5);
      pl.position.set(x,topY+1.0,y); scene.add(pl);
      animObjs.push({mesh:pil,light:pl,ph:x*0.7+y,beam:true});
    }
  }
  // ★warpsXYの うち、かいだん文字（<>）が ない ますにも ひかりの はしらを たてる。
  //   ばんにんの いおりの いりぐち など、しるしゼロで みつからなかった。
  Object.keys(map.warpsXY||{}).forEach(k=>{
    const [wx,wy]=k.split(',').map(Number);
    const ch2=(rows[wy]||'')[wx];
    if(ch2==='<'||ch2==='>') return;
    const pil=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.44,2.4,10,1,true),
      new THREE.MeshBasicMaterial({color:0xa0d8ff, transparent:true, opacity:0.20,
        side:THREE.DoubleSide, depthWrite:false}));
    pil.position.set(wx,topY+1.4,wy); scene.add(pil);
    // ライトは たてない（同時4灯よさんを まもる。はしらだけで じゅうぶん みえる）
    animObjs.push({mesh:pil,ph:wx+wy*0.7,beam:true});
  });
  // インスタンス化（drawCall削減）
  const box=new THREE.BoxGeometry(1,0.12,1);
  const gm=new THREE.MeshLambertMaterial({
    map: snow?TEX.snow : ice?TEX.ice : cast?TEX.carpet : dream?TEX.ice : TEX.grass});
  if(dream) gm.color.setHex(0xc9b2f2);   // ★ゆめのたいりく：あわい むらさきの ゆか
  if(snow && ts && ts.id!=='NORMAL') gm.color.setHex(ts.snowColor);
  addInstanced(box,gm, (G_.ground||[]).map(p=>[p[0],p[1],p[2]]));
  addInstanced(box,new THREE.MeshLambertMaterial({
      map: snow?TEX.pave : ice?TEX.ice : cast?TEX.carpet : TEX.road}),
    (G_.road||[]).map(p=>[p[0],p[1],p[2]]));
  if(cave){
    addInstanced(new THREE.BoxGeometry(1,0.5,1),
      new THREE.MeshLambertMaterial({map: ice?TEX.ice:TEX.rock}),
      (G_.ground||[]).concat(G_.road||[]).map(p=>[p[0],0.25,p[2]]));
    addInstanced(new THREE.BoxGeometry(1,1,1),
      new THREE.MeshLambertMaterial({map: ice?TEX.icewall:TEX.cliff}),
      (G_.cliff||[]).map(p=>[p[0],p[1],p[2],0,1,p[5]]));
    addInstanced(new THREE.ConeGeometry(0.42,0.55,5),new THREE.MeshLambertMaterial({color:0x2c3448}),
      G_.spike||[]);
  }else{
    addInstanced(new THREE.BoxGeometry(1,1.6,1),
      new THREE.MeshLambertMaterial({map:snow?TEX.whitestone:TEX.brick}),
      (G_.wall||[]).map(p=>[p[0],p[1],p[2]]));
    if(snow) addInstanced(new THREE.BoxGeometry(1.04,0.18,1.04),
      new THREE.MeshBasicMaterial({color:0xf4f9ff}),
      (G_.wall||[]).map(p=>[p[0],p[1]+0.82,p[2]]));
  }
  addInstanced(new THREE.IcosahedronGeometry(0.44,0),
    new THREE.MeshLambertMaterial({color:0x2c7a34,flatShading:true}), G_.leafA||[]);
  addInstanced(new THREE.IcosahedronGeometry(0.3,0),
    new THREE.MeshLambertMaterial({color:0x1e5c28,flatShading:true}), G_.leafB||[]);
  addInstanced(new THREE.DodecahedronGeometry(0.42,0),
    new THREE.MeshLambertMaterial({color:0x8a8f9c,flatShading:true}), G_.rock||[]);
  addInstanced(box,new THREE.MeshLambertMaterial({color:0x0d2c50}), (G_.waterbed||[]).map(p=>[p[0],p[1],p[2]]));
  // ゆきぐにの たてもの・せんとう・きを かたちごとに まとめて 1ドローコールへ
  if(ice||cast){
    const wh=()=>new THREE.MeshLambertMaterial({map:TEX.whitestone});
    const S2={
      icePillar:[new THREE.ConeGeometry(0.34,1.2,6),
        new THREE.MeshLambertMaterial({map:TEX.ice,transparent:true,opacity:0.9})],
      castPillar:[new THREE.CylinderGeometry(0.26,0.30,1.9,10), wh()],
      pillarBase:[new THREE.CylinderGeometry(0.38,0.42,0.2,10), wh()],
      pillarCap:[new THREE.CylinderGeometry(0.40,0.34,0.16,10),
        new THREE.MeshLambertMaterial({color:0xd8c48a})],
      throneSeat:[new THREE.BoxGeometry(0.74,0.24,0.66),
        new THREE.MeshLambertMaterial({color:0x8a2a30})],
      throneBack:[new THREE.BoxGeometry(0.74,1.30,0.16),
        new THREE.MeshLambertMaterial({color:0x6e2028})],
      throneGold:[new THREE.BoxGeometry(0.82,0.14,0.22),
        new THREE.MeshLambertMaterial({color:0xd8b040})],
      bedFrame:[new THREE.BoxGeometry(0.90,0.24,1.02),
        new THREE.MeshLambertMaterial({map:TEX.wood})],
      bedSheet:[new THREE.BoxGeometry(0.84,0.14,0.96),
        new THREE.MeshLambertMaterial({color:0xeef0fa})],
      bedPillow:[new THREE.BoxGeometry(0.52,0.12,0.28),
        new THREE.MeshLambertMaterial({color:0xdcd0f0})],
      castWindow:[new THREE.PlaneGeometry(0.52,0.86),
        new THREE.MeshBasicMaterial({color:0x2f5f96})],
      banner:[new THREE.PlaneGeometry(0.42,1.05),
        new THREE.MeshBasicMaterial({color:0x8a2a30})],
      wallTorch:[new THREE.SphereGeometry(0.11,7,7),
        new THREE.MeshBasicMaterial({color:0xffa838})],
      castDoor:[new THREE.BoxGeometry(0.8,1.0,0.2),
        new THREE.MeshLambertMaterial({map:TEX.wood})],
    };
    Object.keys(S2).forEach(k=>{
      const list=G_[k]; if(!list||!list.length) return;
      addInstanced(S2[k][0], S2[k][1], list);
    });
  }
  if(snow){
    const S=snowShapes();
    Object.keys(S).forEach(k=>{
      const list=G_[k];
      if(!list||!list.length) return;
      addInstanced(S[k][0], S[k][1], list);
    });
  }
  drawCalls = countDrawCalls();

  let ambCol=th.amb[0], ambPow=th.amb[1];
  if(snow && ts){ ambCol=ts.ambient[0]; ambPow=ts.ambient[1]; }
  if(night){ ambCol=darken(ambCol,0.45); ambPow*=0.62; }
  scene.add(new THREE.AmbientLight(ambCol,ambPow));
  const sun=new THREE.DirectionalLight(night?0x8fa8d8:th.sun[0], night?0.30:th.sun[1]);
  sun.position.set(5,10,4); scene.add(sun);
  snowfall=null; aurora=null; footprints=[]; footIdx=0;
  if(sc.snowfall) buildSnowfall(ts);
  if(sc.aurora && night) buildAurora();
  if(sc.footprints) initFootprints();

  // 隊列アクター（パーティ人数ぶんだけ つくる）
  actors.list=[];
  C.party.forEach((m,i)=>{
    const b = CHR[m.cls] ? chrBillboard(m.cls, i===0?1.50:1.44)
                         : billboard(m.cls, i===0?1.25:1.20);
    scene.add(b); actors.list.push(b);
  });
  actors.hero=actors.list[0]||null;
  if(cave){
    const lamp=new THREE.PointLight(ice?0xbfe4ff:0xffd090,1.0,4.5); scene.add(lamp); actors.lamp=lamp;
  }else actors.lamp=null;
  setActors(true);
}
let fpMap = null;                     // fp が どの マップの ざひょうか
function setActors(snap){
  const P=C.P, tr=C.G.trail;
  // ★マップが かわったら かならず いちを あわせる。
  //   のこったままだと まえの マップの ざひょうで えがかれ、
  //   がめんの そとに いって すがたが きえる。
  if(fpMap !== P.map){ fpMap = P.map; snap = true; }
  if(is2D){
    if(V2) V2.noteStep(P.x, P.y, !!C.G.stepFlip);
  }else if(curScene && curScene.footprints && !isElevated(curMap)){
    const key=P.x+','+P.y;
    if(key!==lastFootTile){ lastFootTile=key; dropFootprint(P.x,P.y,!!C.G.stepFlip); }
  }
  const yy = isElevated(curMap) ? 1.22 : 0.72;   // だんさの うえに たつ
  // ★2Dでは 3Dの アクターを つくらない ので、actors.list が からに なる。
  //   にんずうを パーティから とる（そうしないと たいれつが つねに 1にんぶん になる）。
  const n = is2D ? C.party.length
                 : (actors.list ? actors.list.length : 1);
  const tgt=[];
  for(let i=0;i<n;i++){
    const t=(i===0)?[P.x,P.y]:(tr[i-1]||[P.x,P.y]);
    tgt.push(t);
  }
  if(snap || fp.length!==n) fp=tgt.map(t=>({x:t[0],y:t[1]}));
  fp._tgt=tgt; fp._y=yy;
}
function chest(x,y){
  const lid=chestLids[x+','+y];
  if(lid){ lid.rotation.x=-0.9; lid.position.y+=0.08; }
}
function refresh(){}

// ---------------- 戦闘シーン ----------------
let foes=[];
function buildBattleScene(){
  batScene=new THREE.Scene();
  batScene.background=new THREE.Color(0x070512);
  batScene.fog=new THREE.Fog(0x070512,8,30);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(30,30),
    new THREE.MeshLambertMaterial({map:TEX.battleFloor}));
  g.rotation.x=-Math.PI/2; batScene.add(g);
  for(let i=0;i<14;i++){
    const a=(i/14)*Math.PI+Math.PI;
    const h=2.5+((i*5)%4)*0.9;
    const p=new THREE.Mesh(new THREE.ConeGeometry(0.7,h,5),
      new THREE.MeshLambertMaterial({color:i%3?0x3a4a80:0x4a5c9c}));
    p.position.set(Math.cos(a)*8.5,h/2,Math.sin(a)*8.5-2);
    p.rotation.y=(i*17)%6; batScene.add(p);
  }
  for(let i=0;i<40;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.035,4,4),
      new THREE.MeshBasicMaterial({color:0xffffff}));
    s.position.set((Math.random()-0.5)*36,6+Math.random()*9,(Math.random()-0.5)*24-6);
    batScene.add(s);
  }
  batScene.add(new THREE.AmbientLight(0x8899bb,0.9));
  const key=new THREE.PointLight(0xb0c8ff,1.0,26); key.position.set(3,6,5); batScene.add(key);
}
function showBattleCanvas(on){
  // せんとうも ドットえ（2D）で えがく。3Dは しろの なかの フィールドだけ。
  if(canvas2d) canvas2d.style.display = on ? 'block' : (is2D ? 'block' : 'none');
  if(canvas)   canvas.style.visibility = on ? 'hidden' : (is2D ? 'hidden' : 'visible');
}
function battleEnter(enemies, done){
  showBattleCanvas(true);
  mode='battle';
  if(V2 && V2.battleEnter){ V2.resize(); V2.battleEnter(enemies, MON, done); return; }
  foes.forEach(f=>{ batScene.remove(f.mesh); if(f.shadow) batScene.remove(f.shadow); });
  foes=[];
  const n=enemies.length;
  enemies.forEach((e,i)=>{
    const size = MON_SIZE[e.key] || 2.3;
    let key = e.key;
    if(!MON[key] && !SPR[key]){
      console.warn('[view] まものの えが ありません: '+key);
      key = MON.icicleslime ? 'icicleslime' : 'sora';
    }
    const m=billboard(key, size);
    const spread = n===1?0:(i-(n-1)/2)*2.6;
    m.position.set(spread, size*0.5, -3.2 - (i%2)*0.6);
    batScene.add(m);
    // せっちえい（そこに いる かんじを つくる）
    const shd=new THREE.Mesh(new THREE.CircleGeometry(size*0.40,18),
      new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.36,depthWrite:false}));
    shd.rotation.x=-Math.PI/2;
    shd.position.set(m.position.x, 0.02, m.position.z+0.1);
    shd.scale.set(1,0.62,1);
    batScene.add(shd);
    foes.push({mesh:m, shadow:shd, enemy:e, base:m.position.clone(), size, ph:Math.random()*6});
  });
  mode='battle';
  fxState={kind:'enter', t:0, done};
}
function battleLeave(done){
  const fin = ()=>{ mode='field'; showBattleCanvas(false); if(done) done(); };
  if(V2 && V2.battleLeave){ V2.battleLeave(fin); return; }
  fxState={kind:'leave', t:0, done:fin};
}
function fx(kind, data, done){
  if(mode==='battle' && V2 && V2.battleFx){ V2.battleFx(kind, data, done); return; }
  // 演出は短く。完了時に done() を呼ぶ
  if(kind==='attack'||kind==='spell'||kind==='spellall'){
    fxState={kind:'pattack', t:0, done, target:data.target};
  }else if(kind==='enemyattack'||kind==='enemyaoe'){
    // こうげきしてくる 1たいだけを うごかす（ぜんいんが せまってこないように）
    const actor = data && data.from ? foes.find(f=>f.enemy===data.from) : null;
    fxState={kind:'eattack', t:0, done, actor, wide:(kind==='enemyaoe')};
  }else if(kind==='heal'){
    fxState={kind:'heal', t:0, done};
  }else{ done&&done(); }
}
function flash(v){
  const f=document.getElementById('flash');
  f.style.transition='none'; f.style.opacity=v;
  requestAnimationFrame(()=>{ f.style.transition='opacity 0.25s'; f.style.opacity=0; });
}
// ---------------- しょうタイトルカード ----------------
function chapterCard(title, sub, done){
  const el=document.getElementById('chapter');
  if(!el){ if(done) done(); return; }
  el.innerHTML='<div class="ct">'+title+'</div><div class="cs">'+(sub||'')+'</div>';
  el.classList.add('show');
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>{ if(done) done(); }, 700);
  }, 2400);
}
function fade(to, done){
  const f=document.getElementById('fade');
  f.style.transition='opacity 0.3s'; f.style.opacity=to;
  if(V2) V2.setFade(0);          // DOMがわの おおいで じゅうぶん
  setTimeout(()=>done&&done(), 330);
}

// ---------------- ループ ----------------
let last=performance.now();
function loop(now){
  const dt=Math.max(0, Math.min(0.05,(now-last)/1000)); last=now;   // まきもどりでも とまらない
  const time=now/1000;
  if(mode==='battle'){
    if(V2 && V2.drawBattle) V2.drawBattle(dt,time);
    else updateBattle(dt,time);
  }
  else if(is2D) update2D(dt,time);
  else if(V2 && V2.mapOn){
    // ★3Dシーンちゅうの「ちず」：2Dキャンバスを かりて ちずだけ えがく。
    //   まえは 3Dでは なにも えがかれず、がめんが こおって みえた。
    if(canvas2d && (canvas2d.width < 4 || canvas2d.height < 4) && V2.resize) V2.resize();
    const g = canvas2d && canvas2d.getContext('2d');
    if(g){
      g.save(); g.setTransform(1,0,0,1,0,0);
      g.fillStyle='#000'; g.fillRect(0,0,canvas2d.width,canvas2d.height);
      g.restore();
    }
    V2.drawMapOverlay(time);
  }
  else updateField(dt,time);
  requestAnimationFrame(loop);
}
// ---------------- 2D（ドットえ）の こうしん ----------------
function update2D(dt,time){
  if(!V2) return;
  // ★えがく まえに かならず そろえる。
  //   fp（ひょうじいち）が たりないと だれも えがかれず、
  //   マップだけ みえて しゅじんこうが きえる（じっさいに おきた）。
  const need = C.party.length;
  if(fp.length !== need || !fp._tgt || fp._tgt.length !== need){
    const tr = C.G.trail || [];
    const rebuilt = [];
    for(let i=0;i<need;i++){
      const t = (i===0) ? [C.P.x, C.P.y] : (tr[i-1] || [C.P.x, C.P.y]);
      rebuilt.push(t);
    }
    fp = rebuilt.map(t=>({x:t[0], y:t[1]}));
    fp._tgt = rebuilt;
    fp._y = isElevated(curMap) ? 1.22 : 0.72;
  }
  const tgt=fp._tgt||[[C.P.x,C.P.y]];
  const objs=[];
  C.party.forEach((m,i)=>{
    if(!fp[i]||!tgt[i]) return;
    fp[i].x += (tgt[i][0]-fp[i].x)*Math.min(1,dt*8);
    fp[i].y += (tgt[i][1]-fp[i].y)*Math.min(1,dt*8);
    let dir=C.P.dir||'front';
    if(i>0 && tgt[i-1]){
      const dx=tgt[i-1][0]-tgt[i][0], dy=tgt[i-1][1]-tgt[i][1];
      if(dx||dy) dir = dy<0?'back' : dy>0?'front' : (dx<0?'left':'right');
    }
    const dist=Math.abs(tgt[i][0]-fp[i].x)+Math.abs(tgt[i][1]-fp[i].y);
    const moving=dist>0.06;
    const pf=poseOf(m.cls, dir, moving && C.G.stepFlip);
    const t=1-Math.min(1,dist);
    objs.push({x:fp[i].x, y:fp[i].y, cls:m.cls, pose:pf.pose, flip:pf.flip,
               bob: moving ? -Math.abs(Math.sin(t*Math.PI))*0.06 : 0});
  });
  lastPoses2D = objs.map(o=>o.pose);
  V2.draw(dt, time, objs);
}
function updateField(dt,time){
  if(!scene) return;
  const objs=actors.list||[];
  if(!objs.length) { renderer.render(scene,cam); return; }
  const tgt=fp._tgt||objs.map(()=>[C.P.x,C.P.y]);
  const yy=fp._y||0.45;
  for(let i=0;i<objs.length;i++){
    if(!objs[i]||!tgt[i]||!fp[i]) continue;
    fp[i].x += (tgt[i][0]-fp[i].x)*Math.min(1,dt*8);
    fp[i].y += (tgt[i][1]-fp[i].y)*Math.min(1,dt*8);
    objs[i].position.set(fp[i].x, yy+(i===0?Math.abs(Math.sin(time*7))*0.02:0), fp[i].y);
    objs[i].quaternion.copy(cam.quaternion);
    const key=objs[i].userData.chr;
    if(key){
      // せんとうは じぶんの むき、なかまは まえの ひとを おいかける むき
      let dir=C.P.dir||'front';
      if(i>0 && tgt[i-1] && tgt[i]){
        const dx=tgt[i-1][0]-tgt[i][0], dy=tgt[i-1][1]-tgt[i][1];
        if(dx||dy) dir = dy<0?'back' : dy>0?'front' : (dx<0?'left':'right');
      }
      // まだ めもりに ついていない ＝ あるいている とちゅう
      const dist=Math.abs(tgt[i][0]-fp[i].x)+Math.abs(tgt[i][1]-fp[i].y);
      const moving = dist>0.06;
      const pf=poseOf(key, dir, moving && C.G.stepFlip);   // ますごとに あしが かわる
      if(objs[i].userData.pose!==pf.pose){
        objs[i].material.map=chrTex(key,pf.pose);
        objs[i].material.needsUpdate=true;
        objs[i].userData.pose=pf.pose;
      }
      objs[i].scale.x = pf.flip?-1:1;
      objs[i].scale.y = 1;
      // あるく はずみ：ふみだす たびに すこし しずんで もどる
      if(moving){
        const t=1-Math.min(1,dist);                       // 0→1 で 1ますぶん
        objs[i].position.y += Math.abs(Math.sin(t*Math.PI))*0.045;
      }
    }else{
      objs[i].scale.x = (C.G.stepFlip ? (i%2?-1:1) : (i%2?1:-1));
    }
  }
  if(actors.lamp) actors.lamp.position.set(fp[0].x,yy+0.6,fp[0].y);
  const cx=fp[0].x, cz=fp[0].y+7.2;
  cam.position.lerp(new THREE.Vector3(cx,14.2,cz),Math.min(1,dt*6));   // ひいた しかく
  cam.lookAt(fp[0].x,0.2,fp[0].y-0.9);
  animObjs.forEach(o=>{
    if(o.bill){ o.mesh.quaternion.copy(cam.quaternion); return; }
    if(o.beam){
      o.mesh.material.opacity = 0.16 + (Math.sin(time*2.2+o.ph)+1)*0.06;
      o.mesh.rotation.y = time*0.5;
      if(o.light) o.light.intensity = 0.9 + Math.sin(time*2.2+o.ph)*0.3;
      return;
    }
    o.mesh.scale.setScalar(1+Math.sin(time*9+o.ph)*0.2);
    if(o.light) o.light.intensity=1.2+Math.sin(time*10+o.ph)*0.3;
  });
  waters.forEach((w,i)=>{ w.material.map.offset.x=time*0.04+i*0.11;
    w.material.map.offset.y=Math.sin(time*0.6+i)*0.03; });
  // せきせつ：カメラの まわりに ふらせ、したまで おちたら うえへ もどす
  if(snowfall){
    const p=snowfall.geometry.attributes.position;
    const rate=snowfall.userData.rate||1;
    for(let i=0;i<p.count;i++){
      let yy=p.getY(i)-dt*(1.1+((i%7)*0.16))*rate;
      let xx=p.getX(i)+Math.sin(time*0.7+i)*dt*0.5;
      if(yy<0){ yy=15+Math.random()*3; xx=(Math.random()-0.5)*34; p.setZ(i,(Math.random()-0.5)*34); }
      p.setY(i,yy); p.setX(i,xx);
    }
    p.needsUpdate=true;
    snowfall.position.set(fp[0].x,0,fp[0].y);
  }
  // オーロラ：ゆっくり ながれ、あかるさが ゆらぐ
  if(aurora){
    aurora.position.set(fp[0].x,0,fp[0].y-4);
    aurora.children.forEach((m,i)=>{
      m.material.map.offset.x = time*(0.012+i*0.006);
      m.material.opacity = (0.5-i*0.11)*(0.72+0.28*Math.sin(time*0.5+i*1.3));
    });
  }
  // あしあと：じかんで うすくなる
  footprints.forEach(f=>{
    if(f.life>0){ f.life-=dt*0.055; f.mesh.material.opacity=Math.max(0,f.life)*0.5;
      if(f.life<=0) f.mesh.position.y=-99; }
  });
  renderer.render(scene,cam);
}
function updateBattle(dt,time){
  let cx=0, cy=1.6, cz=6.0, lx=0, ly=1.2, lz=-3;
  const s=fxState;
  if(s){
    s.t+=dt;
    if(s.kind==='enter'){
      const k=Math.min(1,s.t/0.9), e=1-Math.pow(1-k,3);
      cx=(1-e)*5.0; cy=1.6+(1-e)*0.9; cz=6.0+(1-e)*1.6;
      if(s.t>0.95){ const d=s.done; fxState=null; d&&d(); }
    }else if(s.kind==='pattack'){
      if(s.t<0.18) cz=6.0-s.t*8;
      else if(s.t<0.26){ if(!s.hit){ s.hit=true; shake=0.28; flash(0.45); spawnBurst(s.target); } cz=4.6; }
      else if(s.t<0.6) cz=4.6+(s.t-0.26)*4;
      else { const d=s.done; fxState=null; d&&d(); }
    }else if(s.kind==='eattack'){
      const A=s.actor;
      const move=(z)=>{ if(A) A.mesh.position.z=z; };
      const reach=s.wide?0.7:1.1;                       // ぜんたいわざは おおきく ふみこまない
      if(s.t<0.22){ move((A?A.base.z:0)+s.t*(reach/0.22)); }
      else if(s.t<0.3){ if(!s.hit){ s.hit=true; shake=s.wide?0.38:0.3; flash(s.wide?0.4:0.3); } }
      else if(s.t<0.6){ move((A?A.base.z:0)+reach-(s.t-0.3)*(reach/0.3)); }
      else { if(A) A.mesh.position.z=A.base.z; const d=s.done; fxState=null; d&&d(); }
    }else if(s.kind==='heal'){
      if(s.t>0.3){ const d=s.done; fxState=null; d&&d(); }
    }else if(s.kind==='leave'){
      if(s.t>0.2){ mode='field'; const d=s.done; fxState=null; d&&d(); return; }
    }
  }
  // いきづかい：こきゅう・ゆらぎ・まばたき・せっちえい
  foes.forEach(f=>{
    f.mesh.quaternion.copy(batCam.quaternion);
    if(f.enemy.hp<=0){
      f.mesh.material.transparent=true;
      f.mesh.material.opacity=Math.max(0,f.mesh.material.opacity-dt*2.2);
      f.mesh.position.y += dt*0.5;
      if(f.shadow) f.shadow.material.opacity=Math.max(0,f.shadow.material.opacity-dt*1.6);
      return;
    }
    const br=1+Math.sin(time*2.1+f.ph)*0.035;               // こきゅう
    f.mesh.scale.set(br,2-br,1);
    const sway=Math.sin(time*0.85+f.ph)*0.05;               // からだの ゆらぎ
    f.mesh.position.x=f.base.x+sway;
    f.mesh.position.y=f.base.y+Math.sin(time*1.7+f.ph)*0.03;
    // えんしゅつちゅうの 1たいは z を うごかしているので さわらない
    if(!(fxState && fxState.kind==='eattack' && fxState.actor===f)) f.mesh.position.z=f.base.z;
    if(f.shadow){
      f.shadow.position.x=f.mesh.position.x;
      const k=1+Math.sin(time*2.1+f.ph)*0.04;
      f.shadow.scale.set(k,0.62*k,1);
    }
  });
  parts=parts.filter(p=>{
    p.userData.life-=dt;
    if(p.userData.life<=0){ batScene.remove(p); return false; }
    p.userData.v.y-=dt*9;
    p.position.addScaledVector(p.userData.v,dt);
    return true;
  });
  if(shake>0){ shake-=dt; cx+=(Math.random()-0.5)*shake*1.5; cy+=(Math.random()-0.5)*shake*1.5; }
  batCam.position.set(cx,cy,cz);
  batCam.lookAt(lx,ly,lz);
  renderer.render(batScene,batCam);
}
let parts=[];
function spawnBurst(target){
  const f = target && foes.find(x=>x.enemy===target);
  const pos = f? f.mesh.position : new THREE.Vector3(0,1.4,-3);
  for(let i=0;i<14;i++){
    const p=new THREE.Mesh(new THREE.SphereGeometry(0.08,4,4),
      new THREE.MeshBasicMaterial({color:i%2?0xffd060:0xff6040}));
    p.position.copy(pos);
    p.userData.v=new THREE.Vector3((Math.random()-0.5)*4,Math.random()*4,(Math.random()-0.5)*4);
    p.userData.life=0.65;
    batScene.add(p); parts.push(p);
  }
}

window.LQ3View = {
  init, loop, buildMap, setActors, fx, battleEnter, battleLeave, refresh, chest, fade, chapterCard,
  showMap(id){
    if(!(V2&&V2.showMap)) return;
    if(!is2D && mode!=='battle'){
      // ★じゅんばん だいじ：ひょうじ してから おおきさを はかる。
      //   かくれたまま resize すると 1x1 の キャンバスに なり、
      //   1ドットが がめん いっぱいに のびて みどり いっしょくに なった（じっさいに おきた）。
      if(canvas2d) canvas2d.style.display='block';
      if(canvas)   canvas.style.visibility='hidden';
      V2.resize();
    }
    V2.showMap(id);
  },
  setDream(on){ if(V2&&V2.setDream) V2.setDream(on); },
  debugSnow(){ return V2&&V2.debugSnow ? V2.debugSnow() : null; },
  hideMap(){
    if(!(V2&&V2.hideMap)) return;
    V2.hideMap();
    if(!is2D && mode!=='battle'){
      if(canvas2d) canvas2d.style.display='none';
      if(canvas)   canvas.style.visibility='visible';
    }
  },
  get mode(){return mode;}, get drawCalls(){return drawCalls;}, get is2D(){return is2D;},
  debugPoses(){ return is2D ? lastPoses2D.slice()
                           : (actors.list||[]).map(o=>o.userData.pose).filter(Boolean); },
};
})();
