// ★ゲームの 3D描画を ヘッドレスで 動かして PNG に する
//   使い方: xvfb-run -a node shot3d.js <map> <x> <y> <out.png> [chapter]
const fs=require('fs'), vm=require('vm'), path=require('path');
const {createCanvas, Image}=require('canvas');
const createGL=require('gl');
const {PNG}=require('pngjs');
const [,, MAP, PX, PY, OUT, CH] = process.argv;
const W=390, H=500;   // スマホの ゲーム画面 ぐらい
const LQ='/home/claude/lq4';

const gl = createGL(W, H, {preserveDrawingBuffer:true});
function mkCanvas(w,h){ const c=createCanvas(w||300,h||150); c.style={}; c.addEventListener=()=>{}; c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height}); c.clientWidth=c.width; c.clientHeight=c.height; return c; }
const glCanvas = {width:W, height:H, style:{}, clientWidth:W, clientHeight:H,
  addEventListener(){}, removeEventListener(){}, getContext(t){ return (t==='webgl'||t==='experimental-webgl'||t==='webgl2')? gl : null; },
  getBoundingClientRect(){ return {left:0,top:0,width:W,height:H}; } };
const c2d = mkCanvas(W,H);
gl.canvas = glCanvas;

// ★vm の 別の 領域で 作られた 型付き配列を、headless-gl が 分かる 形に なおす
{
  const conv = x => (x && ArrayBuffer.isView(x) && !(x instanceof globalThis[x.constructor.name]))
    ? new globalThis[x.constructor.name](x) : x;
  const proto = Object.getPrototypeOf(gl);
  for(const k of Object.getOwnPropertyNames(proto)){
    const f = gl[k]; if(typeof f!=='function' || k==='getError' || k==='readPixels') continue;
    const g = f.bind(gl);
    gl[k] = (...a) => g(...a.map(conv));
  }
}
// ★headless-gl は 画像や キャンバスを 直接 受けとれない。画素に なおして わたす。
{
  let flipY=false, premul=false;
  const ps = gl.pixelStorei.bind(gl);
  gl.pixelStorei = (p,v)=>{ if(p===0x9240) flipY=!!v; else if(p===0x9241) premul=!!v; else ps(p,v); };
  const tex = gl.texImage2D.bind(gl);
  gl.texImage2D = function(...a){
    if(a.length===6 && a[5] && (a[5].width!==undefined)){
      const [t,l,ifmt,fmt,type,src]=a;
      const w=src.width||1, h=src.height||1;
      const cv=createCanvas(w,h), g=cv.getContext('2d');
      if(flipY){ g.translate(0,h); g.scale(1,-1); }
      try{ g.drawImage(src,0,0); }catch(e){}
      const d=g.getImageData(0,0,w,h).data;
      return tex(t,l,ifmt,w,h,0,fmt,type,new Uint8Array(d.buffer));
    }
    return tex(...a);
  };
}
gl.drawingBufferWidth = W; gl.drawingBufferHeight = H;
function mkImg(){
  const im = new Image(); const L={};
  im.addEventListener=(t,f)=>{ (L[t]=L[t]||[]).push(f); };
  im.removeEventListener=()=>{};
  im.onload=()=>{ (L.load||[]).forEach(f=>f.call(im,{})); };
  im.onerror=(e)=>{ (L.error||[]).forEach(f=>f.call(im,e)); };
  return im;
}
const stage = {clientWidth:W, clientHeight:H, style:{}, appendChild(){}, addEventListener(){}};
const document = {
  getElementById(id){ return id==='gl'?glCanvas : id==='gl2d'?c2d : id==='stage'?stage : (this._e[id]=this._e[id]||{style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){},textContent:'',innerHTML:''}); }, _e:{},
  createElementNS(ns,t){ return this.createElement(t); },
  createElement(t){ if(t==='canvas') return mkCanvas(); if(t==='img') return mkImg(); return {style:{},appendChild(){},addEventListener(){}}; },
  body:{appendChild(){}, style:{}}, addEventListener(){},
};
const ctx = {console, document, Image, devicePixelRatio:1, navigator:{userAgent:'node'},
  setTimeout:(f)=>{ try{f();}catch(e){} return 0; }, clearTimeout(){}, requestAnimationFrame:()=>0, performance:{now:()=>Date.now()},
  addEventListener(){}, localStorage:undefined, HTMLCanvasElement:function(){}, HTMLImageElement:Image,
  ImageBitmap:function(){}, WebGL2RenderingContext:function(){}, WebGLRenderingContext:function(){} };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
const load = f => { try{ return vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:path.basename(f)}); }catch(e){ console.log('LOAD ERR', path.basename(f), String(e && e.message).slice(0,200)); throw new Error('stop'); } };
load('/tmp/gl3d/three.js');
load(LQ+'/assets.js');
for(const f of ['world.js','npc.js','chapters.js','core.js','bgm.js']) { try{ load(LQ+'/src/'+f); }catch(e){ if(f!=='bgm.js') throw e; } }
try{ load(LQ+'/src/view2d.js'); }catch(e){ console.log('view2d skip', e.message.slice(0,80)); }
{ // ★調べる ための 口（撮影ツールの 中だけ）
  let src=fs.readFileSync(LQ+'/src/view.js','utf8');
  src=src.replace('window.LQ4View = {', 'window.__rend=()=>{ cam.updateMatrixWorld(); renderer.render(scene,cam); return renderer.info.render; };\nwindow.__dbg=()=>({scene:!!scene, n:scene?scene.children.length:0, list:(actors.list||[]).length, cam:cam.position.toArray().map(v=>+v.toFixed(2)), is2D, mode, fp:(fp||[]).slice(0,1)});\nwindow.LQ4View = {');
  vm.runInContext(src, ctx, {filename:'view.js'});
}
const C = vm.runInContext('LQ4', ctx), V = vm.runInContext('LQ4View', ctx);
// 画像の 読みこみ（data URL は 同期で ロードされる）
if(MAP==='__flow'){ require('./flow_body.js')(C,V,vm,ctx); process.exit(0); }
C.bind(C.NullView,{msg(l,d){d&&d();},menu(i,t,cb){cb(0);},hud(){},label(){}},C.NullAudio);
C.freshState(); C.G.chapter = Number(CH||4);
C.party.length=0; ['io','seren','noe'].forEach(k=>C.party.push(C.mkMember(k,20)));
C.P.map=MAP; C.P.x=Number(PX); C.P.y=Number(PY); C.P.dir='back'; C.G.mode='field';
C.G.trail=[[C.P.x,C.P.y+1],[C.P.x,C.P.y+2],[C.P.x,C.P.y+3]];
// 3D で えがく ように 強制
const WD = vm.runInContext('WORLD', ctx);
const sc = WD.SCENES[(WD.MAP_IDS[MAP]||{}).scene];
if(sc) sc.render='3d'; else { WD.SCENES.__T={render:'3d',theme:C.MAPS[MAP].theme}; WD.MAP_IDS[MAP].scene='__T'; }
const SETS=(process.env.SETS||'').split(';').filter(Boolean);
SETS.forEach(t=>{ const [mp,x,y,ch]=t.split(','); C.setTile(mp,+x,+y,ch); });
V.init();
V.buildMap(MAP);
V.setActors(true);
// 数フレーム 回して カメラを 寄せる
let t0=0; for(let i=0;i<5;i++){ t0+=33; try{ V.loop(t0);}catch(e){} }
const LATER=(process.env.LATER||'').split(';').filter(Boolean);
LATER.forEach(t=>{ const [mp,x,y,ch]=t.split(','); C.setTile(mp,+x,+y,ch); });
let t=0; for(let i=0;i<40;i++){ t+=33; try{ V.loop(t); }catch(e){ if(i===0) console.log('loop err', e.message.slice(0,160)); } }
console.log('DBG', JSON.stringify(vm.runInContext('__dbg()',ctx)));
console.log('REND', JSON.stringify(vm.runInContext('__rend()',ctx)), 'glErr', gl.getError());
// よみだし
const px = new Uint8Array(W*H*4);
gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);
const png = new PNG({width:W,height:H});
for(let y=0;y<H;y++) for(let x=0;x<W;x++){
  const s=((H-1-y)*W+x)*4, d=(y*W+x)*4;
  png.data[d]=px[s]; png.data[d+1]=px[s+1]; png.data[d+2]=px[s+2]; png.data[d+3]=255;
}
fs.writeFileSync(OUT, PNG.sync.write(png));
console.log('ok', OUT);
