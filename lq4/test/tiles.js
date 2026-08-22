'use strict';
// ルミナクエストIV / タイル描画の けんさ
// 使い方： node test/tiles.js
//
// view2d.js の タイル生成を DOMなしで はしらせ、
//   ・すべての タイルが つくれる
//   ・マップが つかう 文字に 絵が わりあたっている
//   ・ワールドの ちけい（skyTerrain の さきも）が えがける
// を たしかめる。
//
// ★これを 書いた りゆう：atlas の なかみを「ならび」と きめつけて
//   indexOf を よび、天空大陸で 画面が 落ちた。同じ 事故を 二度と 起こさない。
const fs = require('fs'), vm = require('vm');
const TS = 16;

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }

// ---- さいしょうげんの canvas もどき ----
function mkCanvas(w,h){
  const data = new Uint8ClampedArray(w*h*4);
  const nop = ()=>{};
  const ctx = {
    imageSmoothingEnabled:false, fillStyle:'#000', strokeStyle:'#000',
    globalAlpha:1, lineWidth:1, font:'', textAlign:'',
    fillRect(x,y,ww,hh){
      const c = parse(this.fillStyle);
      for(let j=Math.round(y);j<Math.round(y+hh);j++)
        for(let i=Math.round(x);i<Math.round(x+ww);i++){
          if(i<0||j<0||i>=w||j>=h) continue;
          const o=(j*w+i)*4, A=c[3]*this.globalAlpha;
          data[o]=data[o]*(1-A)+c[0]*A; data[o+1]=data[o+1]*(1-A)+c[1]*A;
          data[o+2]=data[o+2]*(1-A)+c[2]*A; data[o+3]=Math.max(data[o+3],A*255);
        }
    },
    drawImage(img,dx,dy){
      if(!img || !img._data) throw new Error('drawImage に 絵で ない ものが きた');
      const sw=img.width, sh=img.height;
      for(let j=0;j<sh;j++)for(let i=0;i<sw;i++){
        const so=(j*sw+i)*4, X=Math.round(dx||0)+i, Y=Math.round(dy||0)+j;
        if(X<0||Y<0||X>=w||Y>=h) continue;
        const o=(Y*w+X)*4, A=img._data[so+3]/255; if(!A) continue;
        data[o]=data[o]*(1-A)+img._data[so]*A; data[o+1]=data[o+1]*(1-A)+img._data[so+1]*A;
        data[o+2]=data[o+2]*(1-A)+img._data[so+2]*A; data[o+3]=Math.max(data[o+3],A*255);
      }
    },
    getImageData(){ return {data}; }, putImageData:nop,
    save:nop, restore:nop, beginPath:nop, moveTo:nop, lineTo:nop, closePath:nop,
    fill:nop, stroke:nop, arc:nop, ellipse:nop, translate:nop, scale:nop, rotate:nop,
    clearRect:nop, strokeRect:nop, clip:nop, rect:nop, quadraticCurveTo:nop,
    fillText:nop, strokeText:nop, setTransform:nop,
    createLinearGradient(){ return {addColorStop:nop}; },
    measureText(){ return {width:0}; },
  };
  return {width:w, height:h, _data:data, getContext(){ return ctx; }};
}
function parse(s){
  if(typeof s!=='string') return [0,0,0,1];
  let m=/^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
  if(m){ const v=parseInt(m[1],16);
    return [(v>>16)&255,(v>>8)&255,v&255, m[2]?parseInt(m[2],16)/255:1]; }
  m=/^#([0-9a-f]{3})$/i.exec(s);
  if(m){ const v=parseInt(m[1],16); return [((v>>8)&15)*17,((v>>4)&15)*17,(v&15)*17,1]; }
  m=/rgba?\(([^)]+)\)/.exec(s);
  if(m){ const p=m[1].split(',').map(Number); return [p[0],p[1],p[2],p.length>3?p[3]:1]; }
  return [0,0,0,1];
}

// ---- view2d.js から タイル生成の ぶぶんだけ とりだす ----
const src = fs.readFileSync('src/view2d.js','utf8');
const i0 = src.indexOf('const P16 = {');
const i1 = src.indexOf('// ---------------- たてもの');
T('view2d.js から タイル定義を とりだせる', i0>=0 && i1>i0);
const body = src.slice(i0, i1);

const sb = {console, Math, document:{createElement:()=>mkCanvas(TS,TS)}};
sb.window = sb; sb.globalThis = sb;
vm.createContext(sb);
let atlas = null, boom = null;
try{
  vm.runInContext('const TS=16; let atlas={};'+body+
    '\nif(typeof buildAtlas==="function") buildAtlas();\nglobalThis.__atlas=atlas;', sb, {filename:'tiles'});
  atlas = sb.__atlas;
}catch(e){ boom = e; }
T('タイルが つくれる', !boom, boom && boom.message);
if(!atlas){ console.log('\n--- tiles: ' + (n-ng) + '/' + n + ' 通過 ---'); process.exit(1); }

// ---- 1. すべての タイルが 中身の ある 絵に なっている ----
Object.keys(atlas).forEach(k=>{
  const a = atlas[k];
  const list = Array.isArray(a) ? a : [a];
  T('タイル '+k+' に 中身が ある', list.length>0 && list.every(t=>t && t._data));
  const filled = list.every(t=>{
    for(let p=3;p<t._data.length;p+=4) if(t._data[p]>0) return true;
    return false;
  });
  T('タイル '+k+' が まっさらで ない', filled);
});

// ---- 2. 天空様式の タイルが そろっている ----
['skystone','skyroad','skywall','cloudedge','skygrass','orblamp','skyrail','pipeH','pipeV',
 'bulkhead','skyfountain','flowerbed','plaza','crackstone','richwall',
 'pipeItem','jointOff','jointOn'].forEach(k=>{
  T('天空様式 '+k+' が ある', !!atlas[k]);
});

// ---- 3. ちけいの さしかえ（skyTerrain）の さきが 実在する ----
//   ★天空大陸で 落ちた ところ。ならびか 1まいかを きめつけない。
const TERRAINS = ['plain','snowfield','desert','beach','sea','lake','highway'];
const SKY_MAP = {sea:'cloudedge', lake:'cloudedge', highway:'skyroad'};
TERRAINS.forEach(t=>{
  T('ちけい '+t+' の 絵が ある', !!atlas[t]);
  const st = SKY_MAP[t] || t;
  T('天空版 '+t+'→'+st+' の 絵が ある', !!atlas[st]);
  // ならびでも 1まいでも おなじ ように あつかえる こと
  const a = atlas[st];
  const arr = Array.isArray(a) ? a : [a];
  T('天空版 '+st+' を ならびとして あつかえる', arr.length>0 && arr.indexOf(arr[0])===0);
});

// ---- 4. マップが つかう 文字に 絵が わりあたっている ----
{
  const c2 = {console, window:{}, localStorage:undefined}; c2.globalThis = c2;
  vm.createContext(c2);
  for (const f of ['world.js','npc.js','chapters.js','core.js'])
    vm.runInContext(fs.readFileSync('src/'+f,'utf8'), c2, {filename:f});
  const C = vm.runInContext('LQ4', c2);
  // 文字→絵 の わりあては tileArt が もつ。ここでは 「絵の ない 文字」が
  // マップに 出て いないかを、しられている 文字の ひょうで しらべる。
  const KNOWN = new Set([...'.#rowft^,:=_~welnCBIPSWMQAVXjZFGgDOxLlKpq%;RuhHE<>*t'].concat(['G','D','O','x','L','l']));
  Object.keys(C.MAPS).forEach(mp=>{
    const used = new Set();
    C.MAPS[mp].tiles.forEach(row=>{ for(const ch of row) used.add(ch); });
    const unknown = [...used].filter(ch=>!KNOWN.has(ch));
    T('マップ '+mp+' に しらない 文字が ない', unknown.length===0, unknown.join(' '));
  });
}


// ★噴水は 「F を ならべた 大きさ」で 形が きまる。
//   えを かく しくみが tileArt から よべる ところに ある こと。
//   ★いちど buildAtlas の 中に 書いて しまい、外から よべなかった。
{
  const src2 = fs.readFileSync('src/view2d.js','utf8');
  const iPart = src2.indexOf('\nfunction fountPart');
  const iAt   = src2.indexOf('\nfunction fountAt');
  const iArt  = src2.indexOf('\nfunction tileArt');
  T('噴水の えが 外から よべる（fountPart）', iPart>=0, '中に 入って いる');
  T('噴水の わりふりが 外から よべる（fountAt）', iAt>=0, '中に 入って いる');
  T('tileArt より 先に かかれて いる', iPart>=0 && iAt>=0 && iAt<iArt);
  T('tileArt が ますの ざひょうを うけとる',
    /function tileArt\(ch, theme, tx, ty\)/.test(src2));
  T('噴水に ざひょうを わたして いる', /fountAt\(tx, ty\)/.test(src2));
  T('大きさから わりふりを きめて いる',
    /fountPart\(tw, th, x-x0, y-y0\)/.test(src2));
}


// ★えがく がわで うわがき される 文字を、しかけに つかって いない こと。
//   ★継ぎ目に j を つかって いたが、j は LQ3の「船着き場」。
//     えがく がわが 先に 船を うわがきして、管が 船に 見えた。
{
  const src3 = fs.readFileSync('src/view2d.js','utf8');
  const over = new Set();
  const re3 = /ch==='(\w)'\)\{[\s\S]{0,220}?atlas\.boat/g;
  let mm;
  while((mm = re3.exec(src3))) over.add(mm[1]);
  // ★じっさいの 地図で つかって いる 文字を しらべる。
  //   「つかう よてい」では なく「いま おいて ある」ものを 見る。
  const fs2=require('fs'), vm2=require('vm');
  const c4={console,window:{},localStorage:undefined}; c4.globalThis=c4;
  vm2.createContext(c4);
  for(const f of ['world.js','npc.js','chapters.js','core.js'])
    vm2.runInContext(fs2.readFileSync('src/'+f,'utf8'), c4, {filename:f});
  const C4 = vm2.runInContext('LQ4', c4);
  const inUse = new Set();
  Object.keys(C4.MAPS).forEach(mp=>{
    if(C4.MAPS[mp].theme==='world') return;          // 世界地図は 船を つかう
    [...C4.MAPS[mp].tiles.join('')].forEach(ch=>inUse.add(ch));
  });
  [...inUse].sort().forEach(ch=>{
    if(!over.has(ch)) return;
    T('地図の 文字「'+ch+'」が 船に 上書きされない', false,
      'えがく がわが 船を かさねる（LQ3の 船着き場と ぶつかって いる）');
  });
  T('船と ぶつかる 文字が ない', ![...inUse].some(ch=>over.has(ch)),
    [...inUse].filter(ch=>over.has(ch)).join(' '));
}


// ★おなじ 文字を ふたつ 書くと、先の ほうしか つかわれない。
//   ★大門に A を つかったが、A は 世界地図の「城の アイコン」と かぶって いて、
//     門の 絵が 一度も 出て いなかった。
{
  const src4 = fs.readFileSync('src/view2d.js','utf8');
  const i0 = src4.indexOf('function tileArt');
  const i1 = src4.indexOf('\nfunction ', i0+10);
  const body4 = src4.slice(i0, i1<0 ? src4.length : i1);
  const seen4 = {};
  let mm4; const re4 = /case '(.)':/g;
  while((mm4 = re4.exec(body4))) seen4[mm4[1]] = (seen4[mm4[1]]||0) + 1;
  Object.keys(seen4).forEach(ch=>{
    T('文字「'+ch+'」の わりあてが ひとつ', seen4[ch]===1,
      seen4[ch]+'かしょ ある（先の ほうしか つかわれない）');
  });
}

console.log('\n--- tiles: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
