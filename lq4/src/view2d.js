'use strict';
// ============================================================
// ルミナクエストIV / 2Dドットえ レンダラ
// まち・フィールド・ダンジョンは こちらで えがく（3Dは しろの なかだけ）。
// みおろしがた。タイルは きどうじに てつづきで えがいて アトラスに ためる。
// ============================================================
const View2D = (function(){

const TS = 16;                 // SFCと おなじ 16x16ドット
let cv, cx, W = 0, H = 0;      // キャンバスと ろんりサイズ
let atlas = {};                // ch → キャンバス
let curMap = null, curScene = {}, curNight = false, curTS = null;
let camX = 0, camY = 0;        // カメラの ちゅうしん（タイルたんい）
let snow = [], foot = [], flakes = 0;
let snowOn = null;      // ★いま ゆきが ふって いるか（null＝みてい）
let fadeV = 0;
let C = null;                  // LQ4 への さんしょう
let CHRREF = null;             // キャラのスプライト
let imgCache = {};

// ============================================================
// パレット：SFC（1994〜96）を そうてい。さいどは ひかえめ。
// ひかりは つねに みぎうえ。かげは ひだりした。
// ============================================================
const P16 = {
  // くさち（5しょく）
  gr0:'#3a6330', gr1:'#4a7a3a', gr2:'#5e8f47', gr3:'#6f9c52', grS:'#2c4c26',
  // うみ（4しょく＋あわ）
  se0:'#20386e', se1:'#2c4f92', se2:'#3d68ac', se3:'#5a86c4', foam:'#b4cfe8',
  // すな・みち（おうどいろ）
  sd0:'#8a6e40', sd1:'#a88a52', sd2:'#c0a068', sd3:'#d4b880',
  // やま（ちゃ）
  mt0:'#4c3826', mt1:'#6a4f36', mt2:'#8a6a48', mt3:'#a88860', mtS:'#382818',
  // もり（4しょく）
  fo0:'#16290f', fo1:'#22401a', fo2:'#325a26', fo3:'#477a34',
  // ゆき
  sn0:'#9fb0c4', sn1:'#c2d0de', sn2:'#dbe5ef', sn3:'#eef4fa',
  // こおり
  ic0:'#5f86a6', ic1:'#84a8c4', ic2:'#a8c6dc', ic3:'#cfe2ee',
  // いし（しろい かべ）
  st0:'#6a7182', st1:'#8f97a8', st2:'#b4bcc9', st3:'#d6dce5',
  // たてもの
  roof0:'#7a2820', roof1:'#a63c2c', roof2:'#c85a3c', wall0:'#8e8272',
  wall1:'#c8bfa8', wall2:'#e2dcc6', wood0:'#5a3f26', wood1:'#7d5a36',
  win:'#2f5f96', winL:'#4a83b8', gold:'#b89040',
  blk:'#141018',
  // ★天空様式（IVから）。参考画の 昼の街路から 色を ひろった。
  //   白石は 真っ白に しない。目地の 青で 形を 見せる。
  sk0:'#8fa6c8', sk1:'#a9bcd8', sk2:'#c4d2e6', sk3:'#d9e3f0',  // 白石（暗→明）※ゆかは 中あかるさ
  skJ:'#8ea6c8',                                                // 目地の 青
  skR:'#eef3fa', skRj:'#b4c7de',                                // 通り（ゆかより はっきり 明るい）
  sky0:'#5c8fd6', sky1:'#78bbfd', sky2:'#a8d4ff',               // 空・雲海の 影
  orb0:'#2d6ea8', orb1:'#5fb4ee', orb2:'#a8e2ff', orb3:'#eafaff',// 光珠
  skG0:'#4a6a72', skG1:'#5f8a86', skG2:'#7aa89c',               // 青みの 芝
  skD0:'#4a5f80', skD1:'#6a80a4',                               // 濃い 石（柱・台座）
  // ★屋内：床は 木、壁は 濃い 石。同じ 灰色だと 見わけが つかない。
  wd0:'#4a3524', wd1:'#6b4c33', wd2:'#8a6444', wd3:'#a67e56',   // 板の 床
  in0:'#2f3242', in1:'#43485e', in2:'#5b6178', in3:'#7a8098',   // 屋内の 壁
  // ★天空大陸の のはら・木・岩山：ふつうの みどり茶では なく 寒色に よせる
  sg0:'#3c5c52', sg1:'#4e7566', sg2:'#638d78', sg3:'#7fa992',   // 天空の 草
  st0:'#2a4a48', st1:'#3a6560', st2:'#4f8278',                  // 天空の 木
  sm0:'#6a7c9c', sm1:'#8fa0bd', sm2:'#b6c4dc', sm3:'#dee6f2',   // 天空の 岩山（白石）
  // ★かべは ゆかと はっきり 明暗を 分ける（同色で 見わけが つかなかった）
  skW0:'#48597d', skW1:'#63779e', skW2:'#8194b6', skW3:'#a3b3cd',
};

function mk(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function px(n){ return Math.round(n); }

// ---------------- しょきか ----------------
function init(canvas, core, chr){
  cv = canvas; cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = false;
  C = core; CHRREF = chr;
  buildAtlas();
}

// ---- てうちドットの ための ちいさな どうぐ ----
function P(g,x,y,c){ g.fillStyle=c; g.fillRect(x,y,1,1); }
function R(g,x,y,w,h,c){ g.fillStyle=c; g.fillRect(x,y,w,h); }
// ぎざぎざの まる（アンチエイリアスなし）
function blobJag(g,cx0,cy0,r,c,jag){
  g.fillStyle=c;
  for(let y=-r-1;y<=r+1;y++){
    const dy=y/r;
    let half = Math.floor(Math.sqrt(Math.max(0,1-dy*dy))*r + 0.5);
    if(jag) half += ((cx0*7+cy0*13+y*5)%3===0) ? -1 : 0;
    if(half<=0) continue;
    g.fillRect(cx0-half, cy0+y, half*2, 1);
  }
}
// けっていろんてきな ざつおん（まいかい おなじ もように なる＝てうちに みえる）
function nz(x,y,seed){
  const n = Math.sin(x*127.1 + y*311.7 + seed*74.7) * 43758.5453;
  return n - Math.floor(n);
}
function speckle(g,seed,cols,density){
  for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){
    const r = nz(x,y,seed);
    if(r < density) P(g,x,y,cols[Math.floor(nz(x+9,y+3,seed)*cols.length)%cols.length]);
  }
}

function tile(draw){
  const c = mk(TS,TS); const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  draw(g, TS);
  return c;
}
// おなじ ちけいでも 4しゅるい つくって いちで つかいわける
function tileSet(draw, n){
  const arr=[];
  for(let i=0;i<(n||4);i++) arr.push(tile((g,s)=>draw(g,s,i)));
  return arr;
}
function hashPick(x,y,arr){
  if(!arr) return null;
  if(!Array.isArray(arr)) return arr;
  const h = Math.abs(Math.sin(x*127.1 + y*311.7) * 43758.5453);
  return arr[Math.floor((h - Math.floor(h)) * arr.length) % arr.length];
}

// ---- ちけいの ふち：ぎざぎざに かみあわせる（きょくせんは つかわない）----
const TERRAIN_RANK = {sea:0, lake:0, beach:1, desert:2, plain:3, snowfield:4, highway:5};
const edgeMaskCache = {};
function edgeMask(dir){
  if(edgeMaskCache[dir]) return edgeMaskCache[dir];
  const c = mk(TS,TS), g = c.getContext('2d');
  g.fillStyle='#fff';
  const step = (i)=> 3 + ((i*5)%3) + (((i>>1)+i)%2);   // 3〜6ドットの ぎざぎざ
  if(dir==='N'||dir==='S'){
    for(let x=0;x<TS;x++){ const d=step(x);
      if(dir==='N') g.fillRect(x,0,1,d); else g.fillRect(x,TS-d,1,d); }
  }else if(dir==='W'||dir==='E'){
    for(let y=0;y<TS;y++){ const d=step(y);
      if(dir==='W') g.fillRect(0,y,d,1); else g.fillRect(TS-d,y,d,1); }
  }else{
    const cx0 = dir.includes('W') ? 0 : TS, cy0 = dir.includes('N') ? 0 : TS;
    for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){
      const d = Math.abs(x-cx0)+Math.abs(y-cy0);
      if(d <= 5 + ((x+y)%2)) g.fillRect(x,y,1,1);
    }
  }
  edgeMaskCache[dir]=c;
  return c;
}
const edgeTileCache = {};
function edgeTile(terrainCanvas, key, dir){
  const k = key+':'+dir;
  if(edgeTileCache[k]) return edgeTileCache[k];
  const c = mk(TS,TS), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(edgeMask(dir),0,0);
  g.globalCompositeOperation = 'source-in';
  g.drawImage(terrainCanvas,0,0);
  edgeTileCache[k]=c;
  return c;
}

// ============================================================
// タイルの え（すべて 16x16・てうちドット・ぼかしなし）
// ============================================================
function buildAtlas(){
  atlas = {};

  // ---------- くさち：5しょくで まだらに ----------
  atlas.plain = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.gr1);
    speckle(g, v*3+1, [P16.gr0,P16.gr2,P16.gr3], 0.34);
    // くさの ふさ（3ドットの Vじ）を いくつか
    for(let i=0;i<3;i++){
      const x=2+Math.floor(nz(i,v,7)*12), y=2+Math.floor(nz(i+5,v,9)*12);
      P(g,x,y+1,P16.gr0); P(g,x+1,y,P16.gr0); P(g,x+2,y+1,P16.gr0);
      P(g,x+1,y-1,P16.gr3);                       // みぎうえの ひかり
    }
    P(g,15,0,P16.gr3); P(g,0,15,P16.grS);
  });
  atlas.grass = atlas.plain;

  // ---------- うみ：4しょく＋あわ ----------
  atlas.sea = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.se1);
    for(let y=0;y<s;y++){
      const band = (y+v*3)%6;
      if(band===0) R(g,0,y,s,1,P16.se0);
      if(band===3) R(g,0,y,s,1,P16.se2);
    }
    speckle(g, v*5+2, [P16.se0,P16.se2], 0.16);
    // なみがしら（よこ2〜3ドット）
    for(let i=0;i<3;i++){
      const x=(i*6+v*2)%13, y=2+((i*5+v*3)%12);
      R(g,x,y,3,1,P16.se3); P(g,x+3,y+1,P16.foam);
    }
  });
  atlas.lake = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.se2);
    speckle(g, v+11, [P16.se1,P16.se3], 0.22);
    R(g,3+v,5,5,1,P16.foam);
  });
  atlas.water = atlas.lake;

  // ---------- すなはま・みち ----------
  atlas.beach = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.sd2);
    speckle(g, v*7+3, [P16.sd1,P16.sd3], 0.30);
    P(g,15,0,P16.sd3); P(g,0,15,P16.sd0);
  });
  atlas.highway = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.sd1);
    speckle(g, v*11+4, [P16.sd0,P16.sd2], 0.32);
    for(let i=0;i<2;i++){                          // こいしを ちらす
      const x=3+Math.floor(nz(i,v,3)*10), y=3+Math.floor(nz(i+2,v,4)*10);
      P(g,x,y,P16.sd3); P(g,x,y+1,P16.sd0);
    }
  });
  atlas.road = atlas.highway;
  atlas.pave = tileSet((g,s,v)=>{                  // まちの いしだたみ
    R(g,0,0,s,s,P16.st1);
    for(let j=0;j<2;j++){
      const off=(j%2)?4:0;
      for(let i=-1;i<3;i++){
        const bx=i*8+off, by=j*8;
        R(g,bx+1,by+1,6,6,P16.st2);
        R(g,bx+1,by+1,6,1,P16.st3);                // みぎうえの ひかり
        R(g,bx+1,by+6,6,1,P16.st0);                // ひだりしたの かげ
      }
    }
  });

  // ---------- 天空様式（IVから）----------
  // 白石の 床：大きめの 石を ずらして 積む。目地は 青。
  // ★ゆかは 1しゅるいだけに する。tileSet で ずれを 変えると、
  //   となりの タイルと れんがの 目が あわず、ばらばらに 見える（じっさいに 出た）。
  atlas.skystone = tile((g,s)=>{
    R(g,0,0,s,s,P16.skJ);
    // 上の 段：8ドットの 石が 2つ ／ 下の 段：4ドット ずらす
    const brick=(bx,by)=>{
      R(g,bx,by,7,7,P16.sk2);
      R(g,bx,by,7,1,P16.sk3);
      R(g,bx,by,1,7,P16.sk3);
      R(g,bx,by+6,7,1,P16.sk1);
      R(g,bx+6,by,1,7,P16.sk1);
    };
    brick(0,0); brick(8,0);
    brick(-4,8); brick(4,8); brick(12,8);
    P(g,3,3,P16.sk3); P(g,10,11,P16.sk3);
  });
  // 通り：白石より 明るい。目地は ほとんど 見えない。
  atlas.skyroad = tile((g,s)=>{
    R(g,0,0,s,s,P16.skRj);
    const brick=(bx,by)=>{
      R(g,bx,by,7,7,P16.skR);
      R(g,bx,by,7,1,'#ffffff');
      R(g,bx,by,1,7,'#ffffff');
      R(g,bx,by+6,7,1,P16.sk2);
      R(g,bx+6,by,1,7,P16.sk2);
    };
    brick(0,0); brick(8,0); brick(0,8); brick(8,8);
  });
  // 白石の 壁：ゆかより はっきり 暗く する。うえに 笠石、したに 影。
  atlas.skywall = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.skW0);
    for(let j=0;j<4;j++){
      const off=(j%2)?4:0;
      for(let i=-1;i<3;i++){
        const bx=i*8+off, by=j*4;
        R(g,bx+1,by+1,6,3,P16.skW1);
        R(g,bx+1,by+1,6,1,P16.skW2);
      }
    }
    R(g,0,0,s,1,P16.skW3);                    // うえの ふちに ひかり（1ドットだけ）
    R(g,0,s-1,s,1,'#2b3652');                 // したの 影
    if(v%3===0) P(g,3,9,P16.skW2);
  });
  // 雲海の 下地：うごかない ものは しずかに する。
  //   ★白い もくもくを タイルに 焼きこむと、うえで 雲を うごかしても
  //     したの 白と まざって 「うごいて いない」ように 見える。
  //     ここは ほとんど 青だけに して、白い 雲は うえの そうで うごかす。
  atlas.cloudedge = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.sky0);
    for(let y=0;y<s;y++)for(let x=0;x<s;x++){
      const n = nz(x+v*5, y+v*3, v+7);
      if(n < 0.42) P(g,x,y,P16.sky1);
      else if(n > 0.88) P(g,x,y,'#4a72b4');
    }
  });

  // 青みの 芝（上層の 庭園）
  atlas.skygrass = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.skG1);
    speckle(g, v*17+3, [P16.skG0,P16.skG2], 0.30);
    for(let i=0;i<3;i++){
      const gx=(v*5+i*6)%s, gy=(v*3+i*5)%s;
      P(g,gx,gy,P16.skG2); P(g,gx,gy-1,P16.skG2);
    }
  });
  // 光珠灯：石の 柱の うえに 青白い 球。四角く ならない ように 角を おとす。
  atlas.orblamp = tile((g,s)=>{
    R(g,6,9,4,6,P16.skD1);                      // 柱
    R(g,6,9,1,6,P16.sk2);
    R(g,4,15,8,1,P16.skD0);                     // 台座
    R(g,5,14,6,1,P16.skD1);
    R(g,5,7,6,2,P16.sk2);                       // 球うけ
    // 球（まるく）
    R(g,6,2,4,1,P16.orb1);
    R(g,5,3,6,1,P16.orb1);
    R(g,4,4,8,3,P16.orb1);
    R(g,5,7,6,1,P16.orb1);
    R(g,5,4,4,2,P16.orb2);
    R(g,6,4,2,1,P16.orb3); P(g,6,5,P16.orb3);
    P(g,4,4,P16.orb0); P(g,11,4,P16.orb0);
    P(g,4,6,P16.orb0); P(g,11,6,P16.orb0);
    // ひかりの にじみ
    P(g,3,5,'#a8e2ff55'); P(g,12,5,'#a8e2ff55');
    P(g,7,1,'#a8e2ff55'); P(g,8,1,'#a8e2ff55');
  });
  // 白石の 手すり（雲海の へり）：柱と 横木
  atlas.skyrail = tile((g,s)=>{
    R(g,0,5,s,2,P16.sk3);                       // 上の 横木
    R(g,0,7,s,1,P16.sk1);
    for(let x=1;x<s;x+=5){                      // 柱（ふくらみ つき）
      R(g,x,8,3,6,P16.sk2);
      R(g,x,10,3,2,P16.sk3);
      P(g,x,8,P16.sk3);
      R(g,x,13,3,1,P16.sk1);
    }
    R(g,0,14,s,2,P16.sk2);                      // 下の 台
    R(g,0,14,s,1,P16.sk3);
  });

  // ---------- 天空大陸の のはら（IVから）----------
  atlas.skyplain = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.sg1);
    speckle(g, v*13+5, [P16.sg0,P16.sg2], 0.34);
    for(let i=0;i<4;i++){
      const gx=(v*5+i*7)%s, gy=(v*3+i*4)%s;
      P(g,gx,gy,P16.sg3); P(g,gx,(gy+15)%s,P16.sg2);
    }
  });
  // 天空の 木立
  atlas.skywoods = tileSet((g,s,v)=>{
    g.drawImage(hashPick(v,v,atlas.skyplain),0,0);
    const tree=(cx0,cy0)=>{
      R(g,cx0-2,cy0-4,5,4,P16.st1);
      R(g,cx0-3,cy0-3,7,2,P16.st1);
      R(g,cx0-1,cy0-5,3,1,P16.st2);
      R(g,cx0-2,cy0-2,2,1,P16.st2);
      R(g,cx0,cy0,1,2,'#4a3a2e');
      R(g,cx0-3,cy0-1,7,1,P16.st0);
    };
    tree(4+(v%2),7); tree(11,12); tree(9,5);
  });
  // 天空の 岩山：白石の いわ
  atlas.skymount = tileSet((g,s,v)=>{
    g.drawImage(hashPick(v,v,atlas.skyplain),0,0);
    const peak=(bx,by,w)=>{
      for(let i=0;i<w;i++){
        const h=Math.min(w-i, i+1);
        R(g,bx+i,by-h,1,h+1,P16.sm1);
      }
      R(g,bx+1,by-2,1,2,P16.sm2);
      R(g,bx+Math.floor(w/2),by-Math.floor(w/2)-1,1,2,P16.sm3);
      R(g,bx,by,w,1,P16.sm0);
    };
    peak(2+(v%2),13,7); peak(9,15,6);
  });

  // ---------- 光珠管（IVから）----------
  // 街に 光を おくる 白い 管。かべ ぞいに はっている。
  //   p＝よこ向き ／ q＝たて向き。中を 青白い 光が ながれる。
  atlas.pipeH = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.skW1);                     // 下じきは かべ
    R(g,0,4,s,8,P16.sk1);                      // 管の 胴
    R(g,0,4,s,1,P16.sk3);
    R(g,0,11,s,1,P16.skW0);
    R(g,0,7,s,2,P16.orb1);                     // 中を ながれる 光
    R(g,0,7,s,1,P16.orb2);
    if(v%2===0){ R(g,3,3,3,10,P16.skD1); R(g,3,3,3,1,P16.sk3); }   // とめ金
    else { R(g,10,3,3,10,P16.skD1); R(g,10,3,3,1,P16.sk3); }
  });
  atlas.pipeV = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.skW1);
    R(g,4,0,8,s,P16.sk1);
    R(g,4,0,1,s,P16.sk3);
    R(g,11,0,1,s,P16.skW0);
    R(g,7,0,2,s,P16.orb1);
    R(g,7,0,1,s,P16.orb2);
    if(v%2===0){ R(g,3,3,10,3,P16.skD1); R(g,3,3,1,3,P16.sk3); }
    else { R(g,3,10,10,3,P16.skD1); R(g,3,10,1,3,P16.sk3); }
  });

  // ---------- 街の くらしむき（IVから）----------
  // ★下層と 中層の ちがいを 地面で 見せる。
  //   , ＝ 割れた 白石（継ぎ当て。下層）
  //   % ＝ 花壇（中層）
  //   ; ＝ 磨かれた 白石（中層の 広場）
  atlas.crackstone = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.skJ);
    const brick=(bx,by)=>{
      R(g,bx,by,7,7,P16.sk1);              // 中層より くすんだ 石
      R(g,bx,by,7,1,P16.sk2);
      R(g,bx,by+6,7,1,P16.sk0);
    };
    brick(0,0); brick(8,0); brick(-4,8); brick(4,8); brick(12,8);
    // ひび・継ぎ当て
    const cr=[[3,1],[4,2],[5,3],[5,4],[11,9],[12,10],[13,11],[2,12],[3,13]];
    cr.forEach(([x,y],i)=>{ if((i+v)%4!==3) P(g,x,y,'#6f86ab'); });
    if(v%3===0){ R(g,9,2,4,3,'#9aacc6'); R(g,9,2,4,1,'#b8c8de'); }   // あて板
    if(v%3===1){ R(g,2,9,3,3,'#8a9cb8'); }
  });
  atlas.plaza = tile((g,s)=>{
    R(g,0,0,s,s,'#c9d8ee');
    R(g,0,0,s,1,'#eef4fc'); R(g,0,0,1,s,'#eef4fc');
    R(g,0,s-1,s,1,'#a9bcd8'); R(g,s-1,0,1,s,'#a9bcd8');
    // みがいた てり
    R(g,2,2,5,1,'#ffffff'); R(g,9,10,5,1,'#ffffff');
    R(g,2,3,3,1,'#e6eefa');
  });
  atlas.flowerbed = tile((g,s)=>{
    R(g,0,0,s,s,'#8ea6c8');                       // 石の ふち
    R(g,1,1,14,14,'#4e7566');                     // 土と 草
    R(g,1,1,14,1,'#7fa992');
    const put=(x,y,c)=>{ P(g,x,y,c); P(g,x+1,y,c); P(g,x,y+1,c); P(g,x+1,y+1,c); };
    put(3,4,'#e8f0ff'); put(9,3,'#cfe2ff'); put(6,8,'#e8f0ff');
    put(11,9,'#a8d4ff'); put(4,11,'#cfe2ff');
    P(g,3,3,'#ffffff'); P(g,10,4,'#ffffff');
  });

  // ---------- 屋内（IVから）----------
  // 板の 床：たてに ながい 板を ならべる。石の 床と まちがえない ように。
  atlas.woodfloor = tile((g,s)=>{
    R(g,0,0,s,s,P16.wd1);
    for(let i=0;i<4;i++){
      const bx=i*4;
      R(g,bx,0,3,s,P16.wd2);
      R(g,bx,0,1,s,P16.wd3);          // 板の 左に ひかり
      R(g,bx+3,0,1,s,P16.wd0);        // つぎめの 影
    }
    R(g,0,7,s,1,P16.wd0);             // 板の きれめ
    R(g,0,8,s,1,P16.wd1);
    P(g,2,3,P16.wd1); P(g,9,11,P16.wd1); P(g,13,2,P16.wd1);
  });
  // 屋内の 壁：くらい 石。うえに 笠、したに 影。
  atlas.indoorwall = tile((g,s)=>{
    R(g,0,0,s,s,P16.in0);
    for(let j=0;j<4;j++){
      const off=(j%2)?4:0;
      for(let i=-1;i<3;i++){
        const bx=i*8+off, by=j*4;
        R(g,bx+1,by+1,6,3,P16.in1);
        R(g,bx+1,by+1,6,1,P16.in2);
      }
    }
    R(g,0,0,s,1,P16.in3);
    R(g,0,s-1,s,1,'#1c1f2b');
  });
  // 道具棚（屋内の e）
  atlas.shelf = tile((g,s)=>{
    R(g,1,2,14,13,P16.wd1);
    R(g,1,2,14,1,P16.wd3);
    R(g,1,6,14,1,P16.wd0);
    R(g,1,10,14,1,P16.wd0);
    R(g,1,14,14,1,P16.wd0);
    R(g,3,3,3,3,'#9aa6bd'); R(g,8,3,2,3,'#c3a24a');
    R(g,4,7,4,3,'#7a8a6a'); R(g,10,7,3,3,'#9aa6bd');
    R(g,3,11,5,3,'#8a6444'); R(g,10,11,3,3,'#c3a24a');
  });

  // ---------- さばく ----------
  atlas.desert = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.sd2);
    speckle(g, v*13+5, [P16.sd1,P16.sd3], 0.26);
    for(let i=0;i<2;i++){                          // さきゅうの すじ
      const y=3+i*7+v; R(g,1,y,6,1,P16.sd1); R(g,8,y+1,6,1,P16.sd1);
    }
  });

  // ---------- ゆきげん ----------
  atlas.snowfield = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.sn2);
    speckle(g, v*17+6, [P16.sn1,P16.sn3], 0.28);
    for(let i=0;i<2;i++){                          // ゆきの うねり（かげは ひだりした）
      const y=(3+i*7+v*2)%13;
      R(g,1,y,7,1,P16.sn1); R(g,8,y+1,6,1,P16.sn1);
      R(g,1,y+1,7,1,P16.sn0);
    }
    P(g,15,0,P16.sn3);
  });
  atlas.snow = atlas.snowfield;

  // ---------- サンゴの すな・かいがらの みち・かいしょくどう ----------
  atlas.coralsand = tileSet((g,s,v)=>{
    R(g,0,0,s,s,'#e4dcc0');                       // しろっぽい サンゴの すな
    speckle(g, v*23+9, ['#d8cfae','#f0ead6','#cdc2a0'], 0.30);
    // サンゴの かけら
    [[3,5],[11,4],[6,12],[13,10]].forEach(([x,y],i)=>{
      if((v+i)%2) return;
      P(g,x,y,'#e08a8a'); P(g,x+1,y,'#c86a70');
    });
  });
  atlas.coralpath = tileSet((g,s,v)=>{
    R(g,0,0,s,s,'#cbbf9c');
    speckle(g, v*29+3, ['#b8ab88','#ded2b0'], 0.32);
    // ふみかためた かいがら
    for(let i=0;i<3;i++){
      const x=2+((i*5+v*3)%12), y=3+((i*7+v)%11);
      P(g,x,y,'#f2ece0'); P(g,x+1,y,'#d8cfb8'); P(g,x,y+1,'#d8cfb8');
    }
  });
  atlas.seacave = tileSet((g,s,v)=>{
    R(g,0,0,s,s,'#3d4a52');                       // ぬれた いわ
    speckle(g, v*31+5, ['#33404a','#4a5860'], 0.30);
    // しみだす みずの ひかり
    for(let i=0;i<2;i++){
      const x=(i*7+v*3)%14, y=(i*9+v*2)%14;
      P(g,x,y,'#6f8894'); P(g,x+1,y+1,'#5a707c');
    }
  });
  // ---------- こおり ----------
  atlas.ice = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.ic2);
    speckle(g, v*19+7, [P16.ic1,P16.ic3], 0.24);
    // ひびわれ（ちょくせんの ドット）
    const x0=2+v*3;
    for(let i=0;i<6;i++) P(g, x0+((i%2)?1:0), 3+i, P16.ic3);
    for(let i=0;i<4;i++) P(g, 12-i, 10+((i%2)?1:0), P16.ic1);
  });

  // ---------- やま：ひかり みぎうえ／かげ ひだりした ----------
  atlas.mount = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.gr1);
    speckle(g, v+21, [P16.gr0,P16.gr2], 0.2);
    const peaks=[[[5,15,11],[11,16,13]],[[4,16,12],[12,15,10]],
                 [[8,16,14]],[[3,15,9],[9,16,12],[14,15,8]]][v%4];
    peaks.forEach(([cx0,base,h])=>{
      // りんかく（ゴツゴツ）
      for(let y=0;y<h;y++){
        const half = Math.floor((y+1)*0.62) + ((y%3===0)?1:0);
        const yy = base-h+y;
        R(g, cx0-half, yy, half*2+1, 1, P16.mt1);
        R(g, cx0-half, yy, Math.max(1,half), 1, P16.mt0);      // ひだり＝かげ
        R(g, cx0+Math.floor(half*0.3), yy, Math.max(1,half), 1, P16.mt2); // みぎ＝ひかり
        P(g, cx0-half, yy, P16.mtS);
        P(g, cx0+half, yy, P16.mt3);
      }
      // いただきの ハイライト
      P(g, cx0, base-h, P16.mt3); P(g, cx0+1, base-h+1, P16.mt3);
    });
  });

  // ---------- もり：かたまりで・なかは かなり くらく ----------
  atlas.woods = tileSet((g,s,v)=>{
    const sets=[[[5,6,4],[11,9,4]],[[6,9,5],[12,5,3]],
                [[8,7,5]],[[4,8,3],[9,5,4],[12,11,3]]][v%4];
    sets.forEach(([ox,oy,r])=>{
      blobJag(g,ox,oy+1,r+1,P16.fo0,true);        // ふちどり（くろに ちかい）
      blobJag(g,ox,oy,r,P16.fo1,true);            // なかは かなり くらい
      blobJag(g,ox+1,oy-1,Math.max(1,r-2),P16.fo2,false);
      P(g,ox+1,oy-r+1,P16.fo3); P(g,ox+2,oy-r+2,P16.fo3);   // みぎうえの ひかり
    });
  });
  atlas.tree = tileSet((g,s,v)=>{                 // ゆきの き
    R(g,0,0,s,s,P16.sn2);
    speckle(g, v+31, [P16.sn1,P16.sn3], 0.2);
    R(g,7,11,2,4,P16.wood0);
    for(let k=0;k<3;k++){
      const wdt=6-k*2, y=10-k*3;
      for(let i=0;i<wdt;i++) R(g,8-Math.floor(wdt/2)+i, y, 1, 3, P16.fo1);
      R(g,8-Math.floor(wdt/2)+1, y, Math.max(1,wdt-2), 1, P16.sn3);   // つもった ゆき
    }
  });
  atlas.tree_g = atlas.woods;

  // ---------- いわ・つらら ----------
  atlas.rock = tileSet((g,s,v)=>{
    blobJag(g,8,10,5,P16.mt0,true);
    blobJag(g,8,9,4,P16.mt1,true);
    P(g,10,6,P16.mt3); P(g,11,7,P16.mt3);
    P(g,4,13,P16.mtS);
  });
  atlas.icicle = tileSet((g,s,v)=>{
    for(let y=0;y<12;y++){
      const half=Math.floor(y*0.4);
      R(g,8-half,3+y,half*2+1,1,P16.ic2);
      P(g,8+half,3+y,P16.ic3);
      P(g,8-half,3+y,P16.ic0);
    }
  });

  // ---------- かべ ----------
  atlas.wall = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.st1);
    for(let j=0;j<4;j++){
      const off=(j%2)?3:0;
      for(let i=-1;i<4;i++){
        const bx=i*6+off, by=j*4;
        R(g,bx+1,by+1,4,2,P16.st2);
        R(g,bx+1,by+1,4,1,P16.st3);
        R(g,bx+1,by+2,4,1,P16.st0);
      }
    }
    R(g,0,0,s,1,P16.st3); R(g,0,s-1,s,1,P16.st0);
  });
  atlas.icewall = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.ic0);
    for(let x=0;x<s;x+=3) R(g,x+(v%2),0,1,s, x%6? P16.ic1 : P16.ic2);
    R(g,0,0,s,1,P16.ic3); R(g,0,s-1,s,1,'#3d5f7c');
  });
  atlas.rockwall = tileSet((g,s,v)=>{
    R(g,0,0,s,s,P16.mt0);
    speckle(g, v+41, [P16.mtS,P16.mt1], 0.3);
    R(g,0,0,s,1,P16.mt2); R(g,0,s-1,s,1,P16.mtS);
  });

  // ---------- たいまつ・たからばこ・かいだん ----------
  // ★しかけ（IVから）
  // うごかせる岩：ふつうの 岩より あかるく、まわりに ひびを いれて 「押せる」と わからせる
  atlas.rockPush = tile((g,s)=>{
    blobJag(g,8,9,5,P16.mt1,true);
    blobJag(g,8,8,4,P16.mt3,true);
    R(g,3,13,10,1,'#00000033');
    P(g,5,6,'#ffffff55'); P(g,6,5,'#ffffff44');
    P(g,4,10,P16.mt0); P(g,12,10,P16.mt0);
  });
  // 穴：まんなかを くらく、ふちに ハイライト
  atlas.pit = tile((g,s)=>{
    R(g,2,3,12,11,'#1a1520');
    R(g,3,4,10,9,'#0d0a12');
    R(g,2,2,12,1,'#4a4258');
    R(g,2,14,12,1,'#2a2434');
    P(g,3,3,'#6a6078'); P(g,12,3,'#6a6078');
  });
  // 光珠灯（消）：はしらだけ。ついて いないことが ひとめで わかる ように くらい
  atlas.lampOff = tile((g,s)=>{
    R(g,7,7,2,8,'#4a4a58');
    R(g,6,14,4,1,'#3a3a46');
    R(g,6,4,4,4,'#5a5a6a'); R(g,7,5,2,2,'#6a6a7a');
  });
  // 光珠灯（点）：白い ひかりが ともる
  atlas.lampOn = tile((g,s)=>{
    R(g,7,7,2,8,'#6a6a78');
    R(g,6,14,4,1,'#4a4a56');
    R(g,6,4,4,4,'#cfe6ff'); R(g,7,3,2,6,'#ffffff');
    P(g,5,5,'#9fd0ff88'); P(g,10,5,'#9fd0ff88');
    P(g,8,2,'#e8f4ff66');
  });
  atlas.torch = tile((g,s)=>{
    R(g,7,8,2,7,P16.wood0);
    R(g,6,4,4,4,'#c85a20'); R(g,7,3,2,4,'#e08828'); P(g,8,3,'#f0c058');
  });
  atlas.chest = tile((g,s)=>{
    R(g,3,6,10,8,P16.wood0);
    R(g,3,6,10,3,P16.wood1);
    R(g,3,9,10,1,P16.gold);
    R(g,7,9,2,3,P16.gold);
    R(g,3,6,10,1,'#9a7548');
    R(g,3,13,10,1,P16.blk);
  });
  atlas.chest_open = tile((g,s)=>{
    R(g,3,8,10,6,P16.wood0);
    R(g,4,9,8,3,P16.blk);
    R(g,2,4,12,3,P16.wood1);
    R(g,3,13,10,1,P16.blk);
  });
  atlas.stairs = tile((g,s)=>{
    R(g,0,0,s,s,P16.st1);
    for(let i=0;i<4;i++){
      R(g,2+i,2+i*3,s-4-i*2,2,P16.st2);
      R(g,2+i,2+i*3,s-4-i*2,1,P16.st3);
      R(g,2+i,4+i*3,s-4-i*2,1,P16.st0);
    }
  });

  // ---------- たてもの（ふくすうマスで 1けん・やねが つながる）----------
  // DQ4/5の まちは 1マス アイコンでは なく、3x3くらいの たてものが ならぶ。
  // まわりの マスを みて「やねの てっぺん／なかほど／かべ」を えらぶ。
  function roofPiece(kind, side){
    return tile((g,s)=>{
      const R0=P16.roof0, R1=P16.roof1, R2=P16.roof2;
      if(kind==='peak'){
        R(g,0,0,s,4,'rgba(0,0,0,0)');
        for(let y=4;y<s;y++){                       // むねから したへ ひろがる
          const t=(y-4)/(s-4);
          R(g,0,y,s,1, y<6?R0 : (t<0.5?R2:R1));
        }
        R(g,0,4,s,2,R0);                            // むねの ライン
        for(let x=1;x<s;x+=4) R(g,x,7,2,1,R0);      // かわらの すじ
        for(let x=3;x<s;x+=4) R(g,x,11,2,1,R0);
      }else if(kind==='mid'){
        R(g,0,0,s,s,R1);
        for(let x=1;x<s;x+=4){ R(g,x,1,2,1,R0); R(g,x+2,5,2,1,R0);
          R(g,x,9,2,1,R0); R(g,x+2,13,2,1,R0); }
        R(g,0,0,s,1,R2);
      }else{                                        // かべ
        R(g,0,0,s,3,R0);                            // のきした
        R(g,0,3,s,s-3,P16.wall1);
        for(let y=4;y<s;y+=3) R(g,0,y,s,1,P16.wall0);
        R(g,0,s-1,s,1,P16.wall0);
      }
      if(side==='L'){ R(g,0,0,1,s,P16.blk); }
      if(side==='R'){ R(g,s-1,0,1,s,P16.blk); }
    });
  }
  ['peak','mid','wall'].forEach(k=>{
    ['L','M','R'].forEach(sd=>{ atlas['bd_'+k+'_'+sd]=roofPiece(k,sd); });
  });
  // まどと とびら（かべの うえに かさねる）
  atlas.bdWindow = tile((g,s)=>{
    R(g,4,6,8,7,P16.win); R(g,4,6,8,2,P16.winL);
    R(g,3,5,10,1,P16.wall2); R(g,3,13,10,1,P16.wall0);
    R(g,7,6,2,7,P16.wall2);
  });
  function doorTile(signCol){
    return tile((g,s)=>{
      R(g,0,0,s,3,P16.roof0);
      R(g,0,3,s,s-3,P16.wall1);
      R(g,4,5,8,11,P16.wood0);
      R(g,5,6,6,9,P16.wood1);
      R(g,9,11,1,2,P16.gold);
      if(signCol){ R(g,2,3,12,2,signCol); }
    });
  }
  atlas.bdDoor      = doorTile(null);
  atlas.bdDoorInn   = doorTile('#d8b040');
  atlas.bdDoorChurch= doorTile('#dcdce8');
  atlas.bdDoorWeapon= doorTile('#b04038');
  atlas.bdDoorMagic = doorTile('#7048a8');
  atlas.bdDoorShop  = doorTile('#c87830');
  // ---------- こぶね（ふなつきば）----------
  // ★こぶね：したじを もたず、まわりの ちけいの うえに かさねる。
  //   したじを かためがきに して いた ため、しばの うえに すなが うかんで いた。
  atlas.boat = tile((g,s)=>{
    R(g,0,0,s,s,'rgba(0,0,0,0)');
    // みずぎわの かげ
    R(g,2,12,12,2,'rgba(30,50,70,0.28)');
    // ふなばら（よこむき・きの いた）
    R(g,2,8,12,4,P16.wood1);
    R(g,2,8,12,1,'#a98858');
    R(g,1,9,1,3,P16.wood0); R(g,14,9,1,3,P16.wood0);
    R(g,3,12,10,1,P16.wood0);                   // そこ
    for(let x=3;x<13;x+=3) P(g,x,10,P16.wood0); // いたの つぎめ
    // ほばしら と ほ
    R(g,7,2,1,7,P16.wood0);
    R(g,8,3,4,4,'#f2ebdc');                     // ほ
    R(g,8,3,4,1,'#dcd2bc');
    P(g,11,4,'#dcd2bc'); P(g,11,5,'#dcd2bc');
    // ざせき
    R(g,4,9,8,1,'#8a7048');
  });
  // ---------- まちの かざり ----------
  atlas.well = tile((g,s)=>{
    R(g,2,7,12,8,P16.st1);
    R(g,2,7,12,1,P16.st3); R(g,2,14,12,1,P16.st0);
    R(g,4,9,8,5,'#20386e');
    R(g,3,3,1,5,P16.wood0); R(g,12,3,1,5,P16.wood0);
    R(g,2,2,12,2,P16.roof1); R(g,2,2,12,1,P16.roof2);
  });
  atlas.fence = tile((g,s)=>{
    R(g,0,7,s,2,P16.wood1);
    R(g,0,11,s,2,P16.wood1);
    for(let x=1;x<s;x+=6) R(g,x,5,2,10,P16.wood0);
  });
  atlas.flower = tile((g,s)=>{
    g.drawImage(hashPick(0,0,atlas.snowfield),0,0);
    [[4,6,'#c85a7a'],[10,5,'#d8b040'],[7,11,'#7048a8'],[12,10,'#c85a7a']].forEach(([x,y,c])=>{
      R(g,x,y,2,2,c); P(g,x-1,y+1,c); P(g,x+2,y+1,c);
      P(g,x,y+2,'#2f8c44');
    });
  });
  atlas.signpost = tile((g,s)=>{
    R(g,7,6,2,9,P16.wood0);
    R(g,2,3,12,5,P16.wood1);
    R(g,2,3,12,1,'#9a7548');
    R(g,4,5,8,1,P16.wood0); R(g,4,7,6,1,P16.wood0);
  });
  // ---------- たてもの：あかい やね・しろい かべ・あおい まど ----------
  function building(signCol){
    return tile((g,s)=>{
      R(g,2,8,12,7,P16.wall1);                    // しろい かべ
      R(g,2,8,12,1,P16.wall2);
      R(g,2,14,12,1,P16.wall0);
      for(let y=1;y<=6;y++){                      // あかい やね（みぎうえが あかるい）
        const half=Math.min(7, y+1);
        R(g,8-half,7-y,half*2,1,P16.roof1);
        R(g,8,7-y,half,1,P16.roof2);
        R(g,8-half,7-y,2,1,P16.roof0);
      }
      R(g,4,10,3,3,P16.win); R(g,4,10,3,1,P16.winL);   // あおい まど
      R(g,9,10,3,3,P16.win); R(g,9,10,3,1,P16.winL);
      R(g,7,12,3,3,P16.wood0);                    // とびら
      if(signCol) R(g,11,13,3,2,signCol);
    });
  }
  atlas.inn    = building('#d8b040');
  atlas.church = building('#dcdce8');
  atlas.weapon = building('#b04038');
  atlas.magic  = building('#7048a8');
  atlas.shop   = building('#c87830');
  atlas.tower = tile((g,s)=>{
    R(g,5,6,6,9,P16.wall1); R(g,5,6,6,1,P16.wall2); R(g,5,14,6,1,P16.wall0);
    for(let y=1;y<=5;y++){
      const half=Math.min(6,y+1);
      R(g,8-half,5-y,half*2,1,P16.roof1);
      R(g,8,5-y,half,1,P16.roof2);
    }
    R(g,7,9,3,3,P16.win); R(g,7,9,3,1,P16.winL);
  });
  atlas.castgate = tile((g,s)=>{
    R(g,0,0,s,s,P16.st1);
    R(g,1,2,14,13,P16.st2); R(g,1,2,14,1,P16.st3); R(g,1,14,14,1,P16.st0);
    R(g,6,7,4,8,P16.blk);
    for(let i=0;i<4;i++) R(g,6+i,6-Math.min(2,i),1,2,P16.blk);
    R(g,2,2,2,2,P16.st3); R(g,12,2,2,2,P16.st3);
    R(g,5,4,6,1,P16.gold);
  });
  atlas.fountain = tile((g,s)=>{
    R(g,0,0,s,s,P16.st1);
    blobJag(g,8,9,6,P16.st2,false);
    blobJag(g,8,9,5,P16.se2,false);
    P(g,6,7,P16.foam); P(g,10,10,P16.foam);
    R(g,7,3,2,5,P16.st3);
  });
  atlas.door = tile((g,s)=>{
    R(g,0,0,s,s,P16.st1);
    R(g,4,5,8,10,P16.wood0); R(g,4,5,8,1,P16.wood1);
    R(g,5,6,6,8,P16.wood1); R(g,9,10,1,2,P16.gold);
  });
  // ★門は かべの むきで かたちが 変わる。
  //   G＝よこに ながれる かべの 門（南北の 出入口）。柱は 左右
  //   g＝たてに ながれる かべの 門（東西の 出入口）。柱は 上下
  //   同じ 絵を つかうと、東の 門が かべに 埋もれて 向きが おかしく 見える。
  atlas.gate = tile((g,s)=>{
    R(g,0,0,s,s,P16.sd1);
    R(g,1,2,3,13,P16.st2); R(g,12,2,3,13,P16.st2);
    R(g,1,2,3,1,P16.st3);  R(g,12,2,3,1,P16.st3);
    for(let y=0;y<3;y++){ R(g,1,1-y,3,1,P16.roof1); R(g,12,1-y,3,1,P16.roof1); }
  });
  atlas.gateSide = tile((g,s)=>{
    R(g,0,0,s,s,P16.sd1);
    // 上下に よこたわる 柱（たての かべに はまる かたち）
    R(g,0,1,s,3,P16.st2);  R(g,0,12,s,3,P16.st2);
    R(g,0,1,s,1,P16.st3);  R(g,0,12,s,1,P16.st3);
    R(g,0,3,s,1,P16.st0);  R(g,0,14,s,1,P16.st0);
    // かさ木（門の しるし）。左右の はしに 出す
    R(g,0,0,3,1,P16.roof1); R(g,13,0,3,1,P16.roof1);
    R(g,0,15,3,1,P16.roof1); R(g,13,15,3,1,P16.roof1);
  });

  // ---------- ワールドの ちてん ----------
  function marker(draw){ return tile((g,s)=>{ draw(g,s); }); }   // ★はいけいは とうか。ゆかは やきこみの ちけいを つかう
  // しろ：とう2つ＋てんしゅ、ぎざぎざの きょうへき、くろい もん。ひかりは みぎうえ。
  atlas.mCastle = marker((g,s)=>{
    const wallL=P16.st0, wallM=P16.st2, wallH=P16.st3, roofD=P16.roof0, roofM=P16.roof1, roofH=P16.roof2;
    // てんしゅの やね
    for(let i=0;i<4;i++) R(g,8-(i+2),i,(i+2)*2,1, i<2?roofD:roofM);
    // りょうとうの やね
    for(let i=0;i<3;i++){
      R(g,2-((i/2)|0),2+i,2+i,1, i===0?roofD:roofM);
      R(g,12+((i/2)|0)-i,2+i,2+i,1, i===0?roofD:roofM);
    }
    R(g,9,3,3,1,roofH); R(g,13,4,2,1,roofH);        // みぎうえの ひかり
    // かべ
    R(g,1,5,4,11,wallM); R(g,11,5,4,11,wallM); R(g,5,4,6,12,wallM);
    R(g,1,5,1,11,wallL); R(g,5,4,1,12,wallL);       // ひだり＝かげ
    R(g,14,5,1,11,wallH); R(g,10,4,1,12,wallH);     // みぎ＝ひかり
    // きょうへき（ぎざぎざ）
    for(let x=1;x<15;x+=2) R(g,x,5,1,1,'rgba(0,0,0,0)');
    R(g,1,6,14,1,wallH);
    // まど
    [[2,8],[12,8],[7,7]].forEach(([x,y])=>{ R(g,x,y,2,2,P16.win); R(g,x,y,2,1,P16.winL); });
    // もん
    R(g,7,10,2,1,P16.blk); R(g,6,11,4,5,P16.blk);
    R(g,6,11,4,1,'#241c26');
    R(g,1,15,14,1,P16.st0);
  });
  // むら：あかい やねの いえ2けん＋き の さく。まんなかが もん。
  atlas.mVillage = marker((g,s)=>{
    const roofD=P16.roof0, roofM=P16.roof1, roofH=P16.roof2;
    // ひだりの いえ
    for(let i=0;i<4;i++) R(g,4-i,2+i,1+i*2,1, i===0?roofD:roofM);
    R(g,5,4,2,1,roofH); R(g,6,5,2,1,roofH);
    R(g,2,6,5,5,P16.wall1);
    R(g,2,6,1,5,P16.wall0); R(g,6,6,1,5,P16.wall2);
    R(g,4,9,1,2,P16.wood0);
    R(g,3,7,1,1,P16.win);
    // みぎの いえ
    for(let i=0;i<3;i++) R(g,12-i,5+i,1+i*2,1, i===0?roofD:roofM);
    R(g,13,6,2,1,roofH);
    R(g,10,8,5,4,P16.wall1);
    R(g,10,8,1,4,P16.wall0); R(g,14,8,1,4,P16.wall2);
    R(g,12,10,1,2,P16.wood0);
    R(g,11,9,1,1,P16.win);
    // きの さく（まんなかは もんの あきま）
    R(g,1,13,6,1,P16.wood1); R(g,9,13,6,1,P16.wood1);
    R(g,1,14,1,2,P16.wood0); R(g,14,14,1,2,P16.wood0);
    for(let x=2;x<7;x+=2) P(g,x,14,P16.wood0);
    for(let x=10;x<15;x+=2) P(g,x,14,P16.wood0);
  });
  atlas.mCave = marker((g,s)=>{
    const half=[0,0,2,3,4,5,5,6,6,7,7,7,7,7,7,7];
    const jag =[0,0,0,1,0,1,0,0,1,0,0,0,0,0,0,0];
    for(let y=2;y<16;y++){
      const hw=half[y]-jag[y];
      if(hw<=0) continue;
      const x0=8-hw, wdt=hw*2;
      R(g,x0,y,wdt,1,P16.mt1);
      const sh=Math.max(1,Math.round(wdt*0.32));
      R(g,x0,y,sh,1,P16.mt0);                       // ひだり＝かげ
      R(g,x0+wdt-sh,y,sh,1,P16.mt2);                // みぎ＝ひかり
      P(g,x0,y,P16.mtS);                            // ひだりの りんかく
      P(g,x0+wdt-1,y,P16.mt3);                      // みぎうえの ハイライト
    }
    // いわはだの まだら
    [[5,7],[10,6],[4,11],[12,10],[11,14],[3,13],[6,4]].forEach(([x,y])=>{
      P(g,x,y,P16.mt0); P(g,x+1,y,P16.mt2);
    });
    // ★くろい アーチの いりぐち（うえが まるい）
    R(g,7,9,2,1,P16.blk);
    R(g,6,10,4,6,P16.blk);
    P(g,6,9,'#2a2028'); P(g,9,9,'#2a2028');
    R(g,6,10,4,1,'#241c26');                        // おくの かげ
    P(g,5,10,P16.mt3); P(g,10,10,P16.mt0);          // いりぐちの ふち
    // したの かげ
    R(g,1,15,14,1,P16.mtS);
  });
  atlas.mFuture = marker((g,s)=>{
    R(g,4,10,8,5,'#8a8f9a'); R(g,4,10,8,1,'#a8adb8');
    for(let y=1;y<=4;y++){ const half=Math.min(5,y+1); R(g,8-half,9-y,half*2,1,'#6a6f7a'); }
    R(g,6,12,2,2,'#4a4f5a');
  });
}

// ---------------- たてもの（まわりを みて やねを くみたてる）----------------
const BUILD_CHARS = 'HIPWMS';        // H＝かべ／ I P W M S ＝ とびら
function isBuild(rows,x,y){
  if(y<0||y>=rows.length||x<0||x>=rows[0].length) return false;
  return BUILD_CHARS.includes(rows[y][x]);
}
const DOOR_ART = {I:'bdDoorInn', P:'bdDoorChurch', W:'bdDoorWeapon',
                  M:'bdDoorMagic', S:'bdDoorShop'};
function drawBuilding(rows,x,y,dx,dy,ts){
  const ch = rows[y][x];
  const up = isBuild(rows,x,y-1), dn = isBuild(rows,x,y+1);
  const lf = isBuild(rows,x-1,y), rt = isBuild(rows,x+1,y);
  const side = !lf ? 'L' : (!rt ? 'R' : 'M');
  if(ch!=='H'){                                  // とびら
    cx.drawImage(atlas[DOOR_ART[ch]] || atlas.bdDoor, dx, dy, ts, ts);
    return;
  }
  const kind = !up ? 'peak' : (dn ? 'mid' : 'wall');
  cx.drawImage(atlas['bd_'+kind+'_'+side], dx, dy, ts, ts);
  // かべの れつには まどを つける（とびらの まうえは のぞく）
  if(kind==='wall' && side==='M' && ((x+y)%2===0) && !isBuild(rows,x,y+1)){
    cx.drawImage(atlas.bdWindow, dx, dy, ts, ts);
  }
}
// ---------------- タイル → え の わりあて ----------------
function tileArt(ch, theme){
  const ice = theme==='ice', snowT = theme==='snow', cave = theme==='cave';
  const sky = (theme==='sky' || theme==='skygarden');
  switch(ch){
    // ---- ワールドマップ ----
    case '~': return sky?atlas.cloudedge : atlas.sea;
    case '_': return atlas.beach;
    case ',': return sky ? atlas.crackstone : atlas.woods;
    case '^': return atlas.mount;
    case 'A': return atlas.mCastle;
    case 'V': return atlas.mVillage;
    case 'X': return atlas.mCave;
    case 'Q': return atlas.mFuture;
    case '#': return theme==='indoor' ? atlas.indoorwall
            : sky?atlas.skywall : (ice?atlas.icewall : (cave?atlas.rockwall : atlas.wall));
    case 'w': return atlas.water;
    case 'f': return snowT?atlas.tree : atlas.tree_g;
    case 'o': return ice?atlas.icicle : atlas.rock;
    case 'O': return atlas.rockPush;      // ★動かせる岩
    case 'x': return atlas.pit;           // ★穴
    case '%': return atlas.flowerbed;     // ★花壇（中層）
    case ';': return atlas.plaza;         // ★磨かれた 白石（中層の 広場）
    case 'p': return atlas.pipeH;         // ★光珠管（よこ）
    case 'q': return atlas.pipeV;         // ★光珠管（たて）
    case 'L': return atlas.lampOff;       // ★光珠灯（消）
    case 'l': return atlas.lampOn;        // ★光珠灯（点）
    case 't': return (sky||theme==='indoor') ? atlas.orblamp : atlas.torch;
    case 'C': return atlas.chest;
    case 'I': return atlas.inn;
    case 'P': return atlas.church;
    case 'w': return atlas.well;      // ※ ワールドの みずうみは floorで しょり
    case 'e': return theme==='indoor' ? atlas.shelf : (sky?atlas.skyrail : atlas.fence);
    case '*': return atlas.flower;
    case 'y': return atlas.signpost;

    case 'K': return atlas.castgate;
    case 'F': return atlas.fountain;
    case 'G': return atlas.gate;       // よこの かべの 門（南北）
    case 'g': return atlas.gateSide;   // たての かべの 門（東西）
    case 'T': return atlas.tower;
    case 'D': return atlas.door;
    case '<': case '>': return atlas.stairs;
    default:  return null;    // ゆか は したで えがく
  }
}
// ★テーマごとの「じめん」と「みち」。ひょうに して かきわすれを ふせぐ。
//   （desert が ぬけていて、むらの じめんが いしだたみに なる ふぐあいが あった）
const THEME_FLOOR = {
  snow:    {floor:'snow',      road:'pave'},      // ゆきの まち：いしの とおり
  coral:   {floor:'coralsand', road:'coralpath'},// サンゴの みなと：しろい すなに かいがらの みち
  sea:     {floor:'seacave',   road:'seacave'},  // かいしょくどう：ぬれた いわはだ
  desert:  {floor:'desert',    road:'highway'},   // さばくの まち：すなの じめんに ふみかためた みち
  ice:     {floor:'ice',       road:'ice'},
  cave:    {floor:'road',      road:'road'},
  sky:     {floor:'skystone',  road:'skyroad'},   // ★天空大陸：白石の 床に 光の 通り
  skygarden:{floor:'skygrass', road:'skyroad'},   // ★上層の 庭園
  village: {floor:'grass',     road:'road'},
  field:   {floor:'grass',     road:'road'},
  indoor:  {floor:'woodfloor', road:'pave'},      // ★屋内：板の 床。かべは くらい 石
  castle:  {floor:'pave',      road:'pave'},      // ※ しろは 3Dで えがく
  world:   {floor:'plain',     road:'highway'},   // ※ ワールドは タイルごとに きめる
};
function themeArt(theme){ return THEME_FLOOR[theme] || THEME_FLOOR.village; }
function floorArt(theme){ return atlas[themeArt(theme).floor]; }
function roadArt(theme){  return atlas[themeArt(theme).road]; }

// ---- ゆか＋ふち を 1まいに やきこんで ためる ----
// まいフレーム 9かい かさねると おもいので、はじめて みた ときだけ つくる
const DIRS8=[['N',0,-1],['S',0,1],['W',-1,0],['E',1,0],
             ['NW',-1,-1],['NE',1,-1],['SW',-1,1],['SE',1,1]];
let groundCache = {};
// ★天空大陸（skyWorld）では ちけいの 絵を さしかえる。
//   うみ→雲海、みち→白石の 通り。ならびの しくみ（TERRAIN_RANK）は そのまま。
function isSkyWorld(){
  const m = C.MAPS && C.MAPS[curMap];
  return !!(m && m.skyWorld);
}
function skyTerrain(t){
  if(!isSkyWorld()) return t;
  if(t==='sea' || t==='lake') return 'cloudedge';
  if(t==='highway') return 'skyroad';
  if(t==='plain') return 'skyplain';
  return t;
}
// ★雲海：大きな 雲の かたまりが、タイルを またいで つながって ながれる。
//   タイルの 中だけで えがくと ぶつ切りに 見える ので、
//   「せかいの ざひょう」で 雲の いちを きめて、タイルごとに 切り出す。
const CLOUD_L = 4;          // 雲の 間かく（タイル）
const CLOUD_R = 1.8;        // 雲の 大きさ（タイル）※すきまが ないと 動きが 見えない
function cloudJit(gx, gy, k){
  const h = Math.sin(gx*127.1 + gy*311.7 + k*74.7) * 43758.5453;
  return h - Math.floor(h);
}
function drawCloudSea(x, y, dx0, dy0, ts, time, terrainOf){
  cx.save();
  cx.beginPath(); cx.rect(dx0, dy0, ts, ts); cx.clip();
  for(let layer=0; layer<2; layer++){
    const spd = layer ? 0.62 : 0.34;              // タイル／びょう
    const off = time * spd;
    const alpha = layer ? 0.95 : 0.55;
    const col = layer ? '#ffffff' : '#cfe2ff';
    const r = CLOUD_R * (layer ? 1.0 : 1.35);
    // この タイルに かかりうる 雲だけを まわす
    const g0x = Math.floor((x - off - r) / CLOUD_L) - 1;
    const g1x = Math.floor((x - off + r) / CLOUD_L) + 1;
    const g0y = Math.floor((y - r) / CLOUD_L) - 1;
    const g1y = Math.floor((y + r) / CLOUD_L) + 1;
    cx.globalAlpha = alpha;
    cx.fillStyle = col;
    for(let gy=g0y; gy<=g1y; gy++){
      for(let gx=g0x; gx<=g1x; gx++){
        if(cloudJit(gx,gy,layer+3) < 0.44) continue;          // まばらに 抜く（すきまを 作る）
        const jx = (cloudJit(gx,gy,layer)   - 0.5) * CLOUD_L * 0.8;
        const jy = (cloudJit(gx,gy,layer+1) - 0.5) * CLOUD_L * 0.8;
        const cxT = gx*CLOUD_L + jx + off;                    // せかい ざひょう（タイル）
        const cyT = gy*CLOUD_L + jy;
        const rr  = r * (0.65 + cloudJit(gx,gy,layer+2)*0.7);
        // 3つの まるを かさねて もくもくに する
        const px0 = dx0 + (cxT - x)*ts, py0 = dy0 + (cyT - y)*ts;
        cx.beginPath();
        cx.ellipse(px0,             py0,             rr*ts*0.62, rr*ts*0.34, 0, 0, 6.283);
        cx.ellipse(px0 - rr*ts*0.4, py0 + rr*ts*0.1, rr*ts*0.40, rr*ts*0.26, 0, 0, 6.283);
        cx.ellipse(px0 + rr*ts*0.42,py0 + rr*ts*0.06,rr*ts*0.36, rr*ts*0.24, 0, 0, 6.283);
        cx.fill();
      }
    }
  }
  cx.restore();
  cx.globalAlpha = 1;
}

// ★遠くに 浮かぶ 島：雲海の きまった ばしょに、ちいさく えがく。
//   「ここは そらの うえだ」と ひとめで わかる ように する。
const FAR_ISLES = [[6,6],[36,6],[42,10],[11,1],[31,1],[1,1],[21,1],[41,1]];
function drawFarIsle(x, y, dx0, dy0, ts, time){
  if(!FAR_ISLES.some(([ix,iy])=>ix===x && iy===y)) return;
  const sc = ts/TS;
  const bob = Math.sin(time*0.6 + x*1.3)*sc*0.8;
  const R2=(a,b,w,h,col)=>{ cx.fillStyle=col;
    cx.fillRect(Math.round(dx0+a*sc), Math.round(dy0+b*sc+bob), Math.round(w*sc), Math.round(h*sc)); };
  R2(3,7,10,2,'#5d7bb0');      // 島の うわめん
  R2(4,6,8,1,'#8fa8d4');
  R2(5,9,6,2,'#41598a');       // 岩の ね
  R2(6,11,4,2,'#33486f');
  R2(7,13,2,1,'#2a3c5e');
  R2(6,4,2,2,'#c8dcff');       // 上の たてもの
  R2(9,5,2,1,'#c8dcff');
}
// ★崖の 影：大陸の へりの すぐ 下（雲海がわ）を くらくする。
//   「地面が ここで 途切れて 下は 何も ない」ことを 見せる。
function drawCliffShadow(x, y, dx0, dy0, ts, terrainOf){
  const below = terrainOf(x, y+1);
  if(below!=='sea' && below!=='lake') return;
  const sc = ts/TS;
  cx.globalAlpha = 0.45;
  cx.fillStyle = '#1b2a48';
  cx.fillRect(dx0, dy0+Math.round(13*sc), ts, Math.round(3*sc));
  cx.globalAlpha = 0.25;
  cx.fillRect(dx0, dy0+Math.round(11*sc), ts, Math.round(2*sc));
  cx.globalAlpha = 1;
}
function groundTile(x,y,terrainOf){
  const k = curMap+':'+x+','+y;
  const hit = groundCache[k];
  if(hit) return hit;
  const t = terrainOf(x,y);
  const c = mk(TS,TS), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(hashPick(x,y,atlas[skyTerrain(t)]),0,0);
  const rank = TERRAIN_RANK[t]||0;
  DIRS8.forEach(([dir,dx,dy])=>{
    const nt = terrainOf(x+dx,y+dy);
    if(!nt || nt===t) return;
    if((TERRAIN_RANK[nt]||0) <= rank) return;
    // ★atlas の なかみは 「1まい」の ときも 「なんまいかの ならび」の ときも ある。
    //   ならびだと きめつけて indexOf を よんで こわれた（天空大陸で 落ちた）。
    const key = skyTerrain(nt);
    const na = atlas[key];
    const arr = Array.isArray(na) ? na : [na];
    const src = hashPick(x+dx,y+dy,arr);
    g.drawImage(edgeTile(src, key+':'+arr.indexOf(src), dir),0,0);
  });
  groundCache[k] = c;
  return c;
}
// ---------------- マップの じゅんび ----------------
function buildMap(name){
  curMap = name;
  curScene = (C.WORLD && C.WORLD.sceneOf) ? C.WORLD.sceneOf(name) : {};
  curTS = C.townStateDef ? C.townStateDef() : null;
  curNight = !!(C.G && C.G.night) && !!curScene.outdoor;
  snow = []; foot = []; groundCache = {};
  const m = C.MAPS[name];
  // ★ワールドは ちほうごとに てんきが ちがう。
  //   ゆきの ちほう（ヴェルサ・エルデ）に いる ときだけ ゆきを ふらせる。
  snowOn = null;            // ★つぎの えがきで あわせなおす
}
function resize(){
  if(!cv) return;
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio||1, 2);
  cv.width  = Math.max(1, Math.round(r.width*dpr));
  cv.height = Math.max(1, Math.round(r.height*dpr));
  cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  W = cv.width; H = cv.height;
}

// ---------------- あしあと ----------------
let lastTile = null;
function noteStep(x,y,side){
  if(!curScene.footprints) return;
  const k = x+','+y;
  if(k===lastTile) return;
  lastTile = k;
  foot.push({x, y, side:!!side, life:1});
  if(foot.length>40) foot.shift();
}

// ============================================================
// せんとう（2Dドットえ）
// SFCの ように、はいけいは よこいちれつの じめん＋とおくの シルエット。
// ============================================================
let bFoes = [], bFx = null, bShake = 0, bFlash = 0, bParts = [], bTheme = 'plain';
let bBack = null, bEnter = 0;

function battleBackdrop(theme){
  const key = theme;
  if(bBack && bBack.key===key) return bBack;
  const BW = 256, BH = 176;                       // たてを ふやして がめんを うめる
  const c = mk(BW,BH), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const set = {
    snow:  {sky:'#161f36', sky2:'#1e2a45', far:'#2a3f5c', mid:'#44567a',
            gnd:atlas.snowfield, haze:'#39496b'},
    ice:   {sky:'#0d1728', sky2:'#152438', far:'#20344a', mid:'#2e4f6a',
            gnd:atlas.ice,       haze:'#2a4560'},
    cave:  {sky:'#090c14', sky2:'#101520', far:'#181d2a', mid:'#262c3c',
            gnd:atlas.rockwall,  haze:'#202634'},
    world: {sky:'#111a2e', sky2:'#1a2540', far:'#20304a', mid:'#2c4438',
            gnd:atlas.plain,     haze:'#26374e'},
    indoor:{sky:'#100e18', sky2:'#191527', far:'#221d2c', mid:'#332b40',
            gnd:atlas.pave,      haze:'#2a2438'},
  };
  const S = set[theme] || (theme==='village'||theme==='field'||theme==='plain' ? set.world
          : theme==='castle' ? set.indoor : set.world);
  const horizon = 106;

  // ---- そら：2だんの ベタ ＋ ディザで つなぐ（グラデーションは つかわない）----
  R(g,0,0,BW,horizon*0.55,S.sky);
  R(g,0,horizon*0.55,BW,horizon-horizon*0.55,S.sky2);
  for(let y=Math.floor(horizon*0.42);y<Math.floor(horizon*0.62);y++){
    const d = (y-horizon*0.42)/(horizon*0.20);
    for(let x=0;x<BW;x++){
      if(((x+y)%2===0) && nz(x,y,2)<d) P(g,x,y,S.sky2);
      if(((x+y)%2===1) && nz(x,y,3)>d) P(g,x,y,S.sky);
    }
  }
  // ほし
  if(theme!=='cave' && theme!=='indoor' && theme!=='castle'){
    for(let i=0;i<40;i++){
      const x=Math.floor(nz(i,1,3)*BW), y=Math.floor(nz(i,2,5)*(horizon-40));
      P(g,x,y, i%5? '#39496b' : '#8ea2c8');
    }
  }
  // ---- とおくの やまなみ：なめらかな りょうせん（サインの かさねあわせ）----
  function ridge(baseY, amp, freq, phase, col, colLit){
    const h=[];
    for(let x=0;x<BW;x++){
      const t=x/BW*Math.PI*2;
      const v = Math.sin(t*freq+phase)*0.55
              + Math.sin(t*freq*2.3+phase*1.7)*0.28
              + Math.sin(t*freq*4.1+phase*2.9)*0.17;
      h.push(Math.round(baseY - (v*0.5+0.5)*amp));
    }
    for(let x=0;x<BW;x++){
      const y0=h[x];
      R(g,x,y0,1,horizon-y0+2,col);
      // みぎうえの ひかり：りょうせんが みぎさがりの ところを あかるく
      if(x>0 && h[x] >= h[x-1]) P(g,x,y0,colLit);
      // りんかくの ディザ（1ドットの ぎざつきで なじませる）
      if((x%2===0) && x>0 && h[x]!==h[x-1]) P(g,x,y0-1,col);
    }
  }
  ridge(horizon-8, 30, 1.6, 0.7, S.far, S.haze);
  ridge(horizon-1, 18, 2.4, 2.1, S.mid, S.haze);
  // ちへいせんの もや（ディザ2れつ）
  for(let x=0;x<BW;x++){
    if((x+0)%2===0) P(g,x,horizon-1,S.haze);
    if((x+1)%3===0) P(g,x,horizon-2,S.haze);
  }

  // ---- じめん：ちけいの タイルを しきつめる ----
  const gnd = Array.isArray(S.gnd) ? S.gnd[0] : S.gnd;
  const gnd2 = Array.isArray(S.gnd) ? (S.gnd[1]||S.gnd[0]) : S.gnd;
  for(let y=horizon;y<BH;y+=TS)for(let x=0;x<BW;x+=TS){
    g.drawImage(((x/TS + y/TS)%2) ? gnd2 : gnd, x, y);
  }
  // ちへいせん ちかくを ディザで くらくして おくゆきを だす
  for(let y=horizon;y<horizon+10;y++){
    const d=1-(y-horizon)/10;
    for(let x=0;x<BW;x++){
      if(((x+y)%2===0) && nz(x,y,9)<d*0.85) P(g,x,y,S.mid);
    }
  }
  // てまえを だんかいてきに くらく（4だん・ベタ）
  for(let i=0;i<4;i++){
    const y = horizon + Math.floor((BH-horizon)*(i+1)/5);
    g.fillStyle = 'rgba(0,0,0,'+(0.05+i*0.045)+')';
    g.fillRect(0,y,BW,BH-y);
  }
  bBack = {key, canvas:c, w:BW, h:BH, horizon};
  return bBack;
}

function battleEnter2D(enemies, mon, done){
  const m = C.MAPS[C.P.map];
  bTheme = (m && m.theme) || 'plain';
  battleBackdrop(bTheme);
  bFoes = enemies.map((e,i)=>{
    // art が あれば その えを つかう（あたらしい ボスに きそんの えを あてる）。
    // まものの えに なければ キャラの えも さがす（しまいの かげ など）。
    const d = (mon && (mon[e.art] || mon[e.key]))
           || (CHRREF && (CHRREF[e.art] || CHRREF[e.key]))
           || null;
    return {enemy:e, art:d, idx:i, n:enemies.length, ph:nz(i,3,9)*6, fade:1, z:0};
  });
  bParts = []; bShake = 0; bFlash = 0; bEnter = 0;
  bFx = {kind:'enter', t:0, done};
}
function battleFx2D(kind, data, done){
  if(kind==='attack'||kind==='spell'||kind==='spellall'){
    bFx = {kind:'pattack', t:0, done, target:data && data.target};
  }else if(kind==='enemyattack'||kind==='enemyaoe'){
    const actor = data && data.from ? bFoes.find(f=>f.enemy===data.from) : null;
    bFx = {kind:'eattack', t:0, done, actor, wide:(kind==='enemyaoe')};
  }else if(kind==='heal'){
    bFx = {kind:'heal', t:0, done};
  }else if(done) done();
}
function battleLeave2D(done){ bFx = {kind:'leave', t:0, done}; }

// ============================================================
// ★ダメージの ポップアップ（IVから）
//   すうじが とびだすと、なにが おきたか ひとめで わかる。
//   kind: 'dmg'（あかるい白）／'crit'（きん・おおきい）／'heal'（みどり）
//         'status'（むらさき）／'miss'（はいいろ）
// ============================================================
let bPops = [];
const POP_COL = {dmg:'#ffffff', crit:'#ffd257', heal:'#7ef0a0',
                 status:'#c8a8ff', miss:'#b8c0cc', pdmg:'#ff8a7a'};
function pop2D(data){
  if(!cv) return;
  const d = data || {};
  let x = W/2, y = H*0.46;
  if(d.enemy){
    const f = bFoes.find(x2=>x2.enemy===d.enemy);
    if(f){ x = f._cx; y = f._cy - 16; }
  }else if(d.side==='party'){
    const n = Math.max(1, (C.party||[]).length);
    const i = Math.max(0, d.index|0);
    x = W*(0.5 + (i-(n-1)/2)*0.16);
    y = H*0.80;
  }
  bPops.push({x, y, text:String(d.text==null?'':d.text),
    kind:d.kind||'dmg', t:0,
    life:(d.kind==='crit'?1.0:0.8),
    vx:(Math.random()-0.5)*26, vy:-(d.kind==='crit'?150:118)});
  if(bPops.length>24) bPops.splice(0, bPops.length-24);
  if(d.kind==='crit'){ bShake=Math.max(bShake,0.40); bFlash=Math.max(bFlash,0.55); }
  if(d.kind==='status'){ bFlash=Math.max(bFlash,0.30); }
}
function drawPops(dt){
  if(!bPops.length) return;
  const base = Math.max(13, Math.round(H*0.042));
  for(let i=bPops.length-1;i>=0;i--){
    const p=bPops[i];
    p.t += dt;
    if(p.t>=p.life){ bPops.splice(i,1); continue; }
    const k = p.t/p.life;
    const y = p.y + p.vy*p.t + 210*p.t*p.t;      // うちあげて おちる
    const x = p.x + p.vx*p.t;
    const size = base*(p.kind==='crit'?1.5:1.0)*(1 + Math.max(0, 0.35-k*1.6));
    cx.save();
    cx.globalAlpha = k<0.75 ? 1 : (1-(k-0.75)/0.25);
    cx.font = 'bold '+Math.round(size)+'px "Hiragino Kaku Gothic ProN",sans-serif';
    cx.textAlign='center'; cx.textBaseline='middle';
    cx.lineWidth = Math.max(3, size*0.24);
    cx.strokeStyle = 'rgba(12,14,22,0.92)';
    cx.strokeText(p.text, x, y);
    cx.fillStyle = POP_COL[p.kind] || '#fff';
    cx.fillText(p.text, x, y);
    cx.restore();
  }
}

function burst2D(target){
  const f = target ? bFoes.find(x=>x.enemy===target) : bFoes[0];
  const cx0 = f ? f._cx : W/2, cy0 = f ? f._cy : H/2;
  for(let i=0;i<12;i++){
    bParts.push({x:cx0, y:cy0,
      vx:(nz(i,1,11)-0.5)*260, vy:-(60+nz(i,2,12)*220),
      life:0.5, col: i%2 ? '#f0c058' : '#e06038'});
  }
}

function drawBattle(dt, time){
  if(!cv) return;
  const back = battleBackdrop(bTheme);
  // ---- えんしゅつの しんこう ----
  let zoom = 1, ox2 = 0;
  if(bFx){
    bFx.t += dt;
    const s = bFx;
    if(s.kind==='enter'){
      bEnter = Math.min(1, s.t/0.5);
      if(s.t>0.55){ const d=s.done; bFx=null; d&&d(); }
    }else if(s.kind==='pattack'){
      if(s.t<0.16) zoom = 1 + s.t*0.5;
      else if(s.t<0.24){ if(!s.hit){ s.hit=true; bShake=0.26; bFlash=0.5; burst2D(s.target); } zoom=1.08; }
      else if(s.t<0.5) zoom = 1.08 - (s.t-0.24)*0.32;
      else { const d=s.done; bFx=null; d&&d(); }
    }else if(s.kind==='eattack'){
      const reach = s.wide ? 8 : 14;
      if(s.actor){
        if(s.t<0.2) s.actor.z = s.t*(reach/0.2);
        else if(s.t<0.5) s.actor.z = reach-(s.t-0.28)*(reach/0.3);
        else s.actor.z = 0;
      }
      if(s.t>=0.2 && s.t<0.28 && !s.hit){ s.hit=true; bShake=s.wide?0.34:0.26; bFlash=s.wide?0.45:0.3; }
      if(s.t>0.55){ if(s.actor) s.actor.z=0; const d=s.done; bFx=null; d&&d(); }
    }else if(s.kind==='heal'){
      if(s.t>0.3){ const d=s.done; bFx=null; d&&d(); }
    }else if(s.kind==='leave'){
      if(s.t>0.2){ const d=s.done; bFx=null; d&&d(); return; }
    }
  }
  if(bShake>0){ bShake-=dt; ox2 = (nz(time*60|0,1,13)-0.5)*bShake*26; }

  // ---- はいけい：たてを うめる せいすうばい。よこは あふれても よい（ちゅうおうよせ）----
  const sc = Math.max(1, Math.ceil(H/back.h));
  const bw = back.w*sc, bh = back.h*sc;
  cx.fillStyle = '#0a0c14'; cx.fillRect(0,0,W,H);
  const bx = Math.round((W-bw)/2 + ox2), by = Math.round(H-bh);
  cx.drawImage(back.canvas, bx, by, bw, bh);

  // ---- てき ----
  const groundY = by + back.horizon*sc + Math.round((bh-back.horizon*sc)*0.46);
  bFoes.forEach((f,i)=>{
    if(f.enemy.hp<=0){ f.fade = Math.max(0, f.fade - dt*2.2); }
    if(f.fade<=0) return;
    const n = f.n;
    const spread = (n===1) ? 0 : (i-(n-1)/2) * (Math.min(bw,W)*0.28);
    const breathe = 1 + Math.sin(time*2.1+f.ph)*0.03;
    const sway = Math.sin(time*0.85+f.ph)*(sc*1.5);
    // はいけいと おなじ せいすうばい ＝ ドットの あらさが そろう
    // ★てきていぎの scale（ボスの おおきさ ばいりつ）を はんえい
    // ★zoom（ヒットえんしゅつ）は せいすうまるめの そとで かける。
    //   なかに いれると 2ばい→3ばい の だんさに なり、こうげきの たびに
    //   てきが +50% きょだいか して みえた（じっさいに おきた）。
    const esc = Math.max(1, Math.round(sc*0.62*((f.enemy && f.enemy.scale)||1)));
    let hh, ww;
    if(f.art){ hh = f.art.h*esc; ww = f.art.w*esc; }
    else { hh = 48*esc; ww = 48*esc; }
    const cx0 = bx+bw/2 + spread + sway + ox2;
    const cy0 = groundY - f.z*sc - Math.sin(time*1.7+f.ph)*sc;
    f._cx = cx0; f._cy = cy0 - hh*0.5;
    cx.globalAlpha = f.fade;
    // かげ
    cx.fillStyle='rgba(0,0,0,0.35)';
    cx.beginPath(); cx.ellipse(cx0, cy0, ww*0.30, sc*3, 0, 0, Math.PI*2); cx.fill();
    if(f.art){
      const img = getImg(f.art.src || f.art.front);
      if(img.complete && img.naturalWidth){
        const dh = Math.round(hh*breathe*zoom), dw = Math.round(ww/breathe*zoom);
        cx.drawImage(img, Math.round(cx0-dw/2), Math.round(cy0-dh), dw, dh);
      }
    }else{
      cx.fillStyle='#8f4fa0';
      cx.fillRect(Math.round(cx0-ww/2), Math.round(cy0-hh), ww, hh);
    }
    cx.globalAlpha = 1;
  });

  // ---- つぶ ----
  bParts = bParts.filter(p=>{
    p.life -= dt;
    if(p.life<=0) return false;
    p.vy += dt*900; p.x += p.vx*dt; p.y += p.vy*dt;
    cx.fillStyle = p.col;
    cx.fillRect(Math.round(p.x), Math.round(p.y), sc*2, sc*2);
    return true;
  });

  // ---- ダメージの すうじ（つぶの あとに かさねる）----
  drawPops(dt);

  // ---- とうじょうの スライドイン ----
  if(bEnter<1){
    cx.fillStyle='rgba(0,0,0,'+(1-bEnter)+')';
    cx.fillRect(0,0,W,H);
  }
  if(bFlash>0){
    cx.fillStyle='rgba(255,255,255,'+bFlash+')';
    cx.fillRect(0,0,W,H);
    bFlash = Math.max(0, bFlash - dt*2.6);
  }
  if(fadeV>0){ cx.fillStyle='rgba(0,0,0,'+fadeV+')'; cx.fillRect(0,0,W,H); }
}

// ============================================================
// ちず（メニューの「ちず」）
// タイルを 1〜4ドットに ちぢめて えがく。いった ことの ある ちてんだけ しるしを つける。
// ============================================================
let mapOn = false, mapId = null, mapBlink = 0;
const MAPCOL = {
  '~':'#20386e','w':'#3c48a0','_':'#c8a86c','.':'#48a854',',':'#22401a',
  '=':'#c2d0de',':':'#dfc47f','^':'#6a4f36','r':'#a88a52',
  '#':'#6a7182','f':'#22401a','o':'#8a6a48','t':'#c85a20',
  'I':'#d8b040','P':'#dcdce8','S':'#c87830','W':'#b04038','M':'#7048a8',
  'K':'#b4bcc9','F':'#3d68ac','G':'#c8a86c','D':'#7d5a36','Z':'#dcd0f0',
  'C':'#d9a832','n':'#e8e8f0','B':'#8a2a3a','<':'#b4bcc9','>':'#b4bcc9',
  'A':'#e8e0d0','V':'#e0a040','X':'#3a3a44','Q':'#8a8f9a',
  'T':'#c85a20',
};
function showMap(id){ mapOn = true; mapId = id; }
function hideMap(){ mapOn = false; }
function drawMapOverlay(time){
  const m = C.MAPS[mapId]; if(!m) return;
  const rows = m.tiles, MW = rows[0].length, MH = rows.length;
  // がめんに おさまる せいすうばい
  const pad = Math.round(Math.min(W,H)*0.06);
  const sc = Math.max(1, Math.min(Math.floor((W-pad*2)/MW), Math.floor((H-pad*2.6)/MH)));
  const mw = MW*sc, mh = MH*sc;
  const ox = Math.round((W-mw)/2), oy = Math.round((H-mh)/2 + pad*0.2);

  cx.fillStyle='rgba(0,0,0,0.82)'; cx.fillRect(0,0,W,H);
  // わく
  cx.fillStyle='#fff'; cx.fillRect(ox-sc*2, oy-sc*2, mw+sc*4, mh+sc*4);
  cx.fillStyle='#000'; cx.fillRect(ox-sc,   oy-sc,   mw+sc*2, mh+sc*2);
  // ちけい
  for(let y=0;y<MH;y++){
    const r = rows[y];
    for(let x=0;x<MW;x++){
      const col = MAPCOL[r[x]];
      if(!col) continue;
      cx.fillStyle = col;
      cx.fillRect(ox+x*sc, oy+y*sc, sc, sc);
    }
  }
  // いった ことの ある ちてんだけ しるし（しろい わく）
  const known = C.G.visited || {};
  Object.keys(m.warpsXY||{}).forEach(pos=>{
    const [x,y] = pos.split(',').map(Number);
    const to = m.warpsXY[pos].to;
    if(!known[to]) return;
    cx.fillStyle='#fff';
    cx.fillRect(ox+x*sc-sc, oy+y*sc-sc, sc*3, 1);
    cx.fillRect(ox+x*sc-sc, oy+y*sc+sc*2, sc*3, 1);
    cx.fillRect(ox+x*sc-sc, oy+y*sc-sc, 1, sc*3);
    cx.fillRect(ox+x*sc+sc*2, oy+y*sc-sc, 1, sc*3);
  });
  // じぶんの いち（てんめつ）
  mapBlink = (mapBlink + 1) % 60;
  if(mapBlink < 38){
    const s2 = Math.max(2, sc+1);
    cx.fillStyle='#ff4a4a';
    cx.fillRect(ox+C.P.x*sc - (s2-sc)/2, oy+C.P.y*sc - (s2-sc)/2, s2, s2);
    cx.fillStyle='#fff';
    cx.fillRect(ox+C.P.x*sc, oy+C.P.y*sc, Math.max(1,sc-1), Math.max(1,sc-1));
  }
  // みだし
  const label = (C.areaName ? C.areaName(mapId, C.P.x, C.P.y) : C.WORLD.mapName(mapId));
  cx.fillStyle='#fff';
  cx.font = Math.round(H*0.030)+'px sans-serif';
  cx.textAlign='center';
  cx.fillText(label, W/2, oy-sc*4);
  cx.font = Math.round(H*0.022)+'px sans-serif';
  cx.fillStyle='#bfc6d8';
  cx.fillText('ボタンを おすと とじます', W/2, oy+mh+sc*5);
  cx.textAlign='left';
}

// ---------------- びょうが ----------------
function draw(dt, time, actors){
  if(!cv || !curMap) return;
  const m = C.MAPS[curMap];
  if(!m) return;
  const rows = m.tiles, MW = rows[0].length, MH = rows.length;
  const theme = m.theme;
  const dpr = Math.min(devicePixelRatio||1, 2);
  // みおろす ひろさ：せかいちずは ひろく、まちの なかは すこし よせる
  // ※ タイルの おおきさは かならず せいすう。はんぱが あると すきまが できて
  //    くろい せんに なる（じっさいに でた ふぐあい）
  // ズームは せいすうばい のみ。はんぱな ばいりつだと ドットの おおきさが
  // ばらついて「てうちドット」に みえなくなる。
  // tilesTall は「すくなくとも これだけは うつす」という かずなので、
  // まるめは きりすて（round だと たてが たりなく なることが ある）。
  // ★引きの ぐあい。数を ふやすほど 引く（ひろく うつる）。
  //   ばいりつは せいすうしか つかえない（ドットを ぼかさない ため）ので、
  //   ここを 15→20 に すると 3ばい→2ばいに おちて、まちが まるごと 入る。
  const tilesTall = (theme==='world') ? 24 : 20;
  let scale = Math.max(2, Math.floor(H / (tilesTall*TS)));
  // ★ちいさい マップ（家・小部屋）は 画面に あまるので、はいる ところまで 大きくする。
  //   まえは 左上に ちいさく はりついて、画面の まんなかが あいていた。
  if(MW*TS*scale < W && MH*TS*scale < H){
    const fit = Math.min(Math.floor(W/(MW*TS)), Math.floor(H/(MH*TS)));
    if(fit > scale) scale = Math.min(fit, 3);   // ★3ばいまで。それ以上は 拡大しすぎに 見える
  }
  const ts = TS*scale;   // かならず せいすうばい

  // カメラ（プレイヤーちゅうしん・はしで とめる）
  const p = actors && actors[0] ? actors[0] : {x:C.P.x, y:C.P.y};
  const viewW = W/ts, viewH = H/ts;
  camX = Math.min(Math.max(p.x+0.5, viewW/2), Math.max(viewW/2, MW-viewW/2));
  camY = Math.min(Math.max(p.y+0.5, viewH/2), Math.max(viewH/2, MH-viewH/2));
  // カメラの ずれも せいすうに して、すべての タイルが ぴったり ならぶように する
  // ★マップが 画面より 小さい ときは まんなかに おく（左上に よらない）
  const mapW = MW*ts, mapH = MH*ts;
  const ox = (mapW <= W) ? Math.round((W-mapW)/2) : Math.round(W/2 - camX*ts);
  const oy = (mapH <= H) ? Math.round((H-mapH)/2) : Math.round(H/2 - camY*ts);

  // はいけい
  cx.fillStyle = theme==='ice' ? '#0d2036' : theme==='cave' ? '#0a1020'
               : curNight ? '#141a30' : '#1a2436';
  cx.fillRect(0,0,W,H);

  const x0 = Math.max(0, Math.floor(-ox/ts)-1), x1 = Math.min(MW-1, Math.ceil((W-ox)/ts)+1);
  const y0 = Math.max(0, Math.floor(-oy/ts)-1), y1 = Math.min(MH-1, Math.ceil((H-oy)/ts)+1);
  const floor = floorArt(theme), road = roadArt(theme);

  // ① ゆか
  // タイルもじ → ちけいめい（ワールド）
  // ★やま（^）と しげみ（,）は 「その うえに たつ もの」なので、
  //   あしもとの ちけいは まわりから ひきつぐ（ゆきの やまは ゆきの うえに）。
  const W2T = {'.':'plain','=':'snowfield',':':'desert','_':'beach','~':'sea','w':'lake',
               'r':'highway'};
  const terrainOf = (tx,ty)=>{
    if(tx<0||ty<0||ty>=MH||tx>=MW) return null;
    const c = rows[ty][tx];
    if(W2T[c]) return W2T[c];
    // ちてん・やま・しげみ などは まわりの ちけいを ひきつぐ。
    // ★となりが ぜんぶ やまだと ひろえないので、だんだん とおくまで さがす。
    for(let r=1; r<=6; r++){
      const votes={};
      for(let dy=-r; dy<=r; dy++) for(let dx=-r; dx<=r; dx++){
        if(Math.abs(dx)!==r && Math.abs(dy)!==r) continue;   // わくの ぶんだけ
        const n=rows[ty+dy] && rows[ty+dy][tx+dx];
        if(n && W2T[n]) votes[W2T[n]]=(votes[W2T[n]]||0)+1;
      }
      const keys=Object.keys(votes);
      if(keys.length) return keys.reduce((a,b)=>votes[a]>=votes[b]?a:b);
    }
    return 'plain';
  };
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const ch = rows[y][x];
    const dx0 = ox+x*ts, dy0 = oy+y*ts;
    if(theme==='world'){
      cx.drawImage(groundTile(x,y,terrainOf), dx0, dy0, ts, ts);   // やきこみずみ 1まい
      // ★天空大陸：雲海を うごかし、大陸の へりに 崖の 影を つける。
      //   じっと している 青い 面だと 「うみ」に 見えて しまう。
      if(isSkyWorld()){
        const tt = terrainOf(x,y);
        if(tt==='sea' || tt==='lake'){
          drawCloudSea(x, y, dx0, dy0, ts, time, terrainOf);
          drawFarIsle(x, y, dx0, dy0, ts, time);
        }
        else drawCliffShadow(x, y, dx0, dy0, ts, terrainOf);
      }
    }else{
      let base = (ch==='r') ? road : floor;
      // ★NPC・たからばこ など「うえに のる」ものの あしもとは、
      //   まわりの じめん（みち r／すな _）を ひきつぐ。
      //   トロスは すな(_)の うえに NPCが いて、したの くさが みえていた。
      if('nCB<>SWMIPFt*eOLl'.includes(ch)){
        let rn=0, sn=0;
        for(const [ddx,ddy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const c2 = rows[y+ddy] && rows[y+ddy][x+ddx];
          if(c2==='r') rn++; else if(c2==='_') sn++;
        }
        if(sn>=2 && sn>=rn) base = atlas.beach;
        else if(rn>=2) base = road;
      }
      cx.drawImage(Array.isArray(base)?hashPick(x,y,base):base, dx0, dy0, ts, ts);
    }
  }
  // ② あしあと（ゆきの うえ）
  if(curScene.footprints){
    foot.forEach(f=>{
      cx.globalAlpha = Math.max(0, f.life)*0.45;
      cx.fillStyle = '#8fa2bd';
      const fx = ox+f.x*ts + ts*(f.side?0.58:0.30), fy = oy+f.y*ts + ts*0.55;
      cx.fillRect(px(fx), px(fy), Math.max(2,scale*3), Math.max(3,scale*4));
      cx.globalAlpha = 1;
    });
  }
  // ③ ちけい・たてもの（うしろから じゅんに）
  const _bossQ = [];
  const _mkQ = [];   // ★まちの アイコン（おおきく めだたせる）
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const ch = rows[y][x];
    if(ch==='C' && C.G.gotTreasure[curMap+':'+x+','+y]){
      cx.drawImage(atlas.chest_open, ox+x*ts, oy+y*ts, ts, ts); continue;
    }
    // ★ふなつきば（まちの なか）：ゆかを えがいてから ふねを かさねる
    if(theme!=='world' && ch==='j'){
      const fa = floorArt(theme);
      cx.drawImage(Array.isArray(fa)?hashPick(x,y,fa):fa, ox+x*ts, oy+y*ts, ts, ts);
      cx.drawImage(atlas.boat, ox+x*ts, oy+y*ts, ts, ts);
    }
    // ★たてものは まわりを みて やねを くみたてる
    else if(theme!=='world' && BUILD_CHARS.includes(ch)){
      drawBuilding(rows, x, y, ox+x*ts, oy+y*ts, ts);
    }
    // ワールドの きほん ちけいは ゆかの パスで えがきおえている（うわがきしない）
    else if(theme==='world' && ch==='j'){
      // ★まわりの ちけいを したじに してから ふねを かさねる
      cx.drawImage(groundTile(x,y,terrainOf), ox+x*ts, oy+y*ts, ts, ts);
      cx.drawImage(atlas.boat, ox+x*ts, oy+y*ts, ts, ts);
    }
    else if(theme==='world' && '.=:_~wr'.includes(ch)) { /* ゆかのみ */ }
    else if(theme==='world' && (ch==='A'||ch==='V')){
      _mkQ.push([ch, ox+x*ts, oy+y*ts]);
    }
    else {
      // ★天空大陸では 木・岩山も 寒色の 天空版に する
      let art = (theme==='world' && isSkyWorld() && ch===',') ? atlas.skywoods
              : (theme==='world' && isSkyWorld() && ch==='^') ? atlas.skymount
              : tileArt(ch, theme);
      if(Array.isArray(art)) art = hashPick(x,y,art);
      if(art) cx.drawImage(art, ox+x*ts, oy+y*ts, ts, ts);
    }
    if(ch==='n') drawNPC(ox+x*ts, oy+y*ts, ts, x, y);
    // ★ボスは いったん ためて、ちけいを ぜんぶ かいたあとに えがく。
    //   さきに かくと、みぎ・したの ゆかタイルが ボスの はみだしを うわがきして
    //   「みぎうでが かける」げんしょうが おきていた。
    if(ch==='B'){
      // ★ますごとに ボスが ちがう ことが ある（1まいの マップに 2たい）。
      //   ざひょうを わたさないと、絵が ひけずに 紫の かたまりに なる。
      const bi = C.bossInfoAt ? C.bossInfoAt(curMap, x, y) : null;
      const done = bi && bi.clearedFlag && C.G.flags[bi.clearedFlag];
      if(!done) _bossQ.push([ox+x*ts, oy+y*ts, ts, x, y]);
    }
  }
  // ★まち・むらは 1.45ばいで えがく（ちいさくて みつけにくかった）
  _mkQ.forEach(([ch,mx,my])=>{
    const art = ch==='A' ? atlas.mCastle : atlas.mVillage;
    const mw = ts*1.45, mh = ts*1.45;
    cx.drawImage(art, Math.round(mx + ts/2 - mw/2), Math.round(my + ts - mh), mw, mh);
  });
  _mkQ.length=0;
  _bossQ.forEach(([bx,by,bts,tx,ty])=>drawBoss(bx,by,bts,tx,ty));
  _bossQ.length=0;
  // ★もやって ある ふね（ワールドのみ）
  if(theme==='world' && C.G && C.G.ship && !C.G.aboard){
    const sx=C.G.ship.x, sy=C.G.ship.y;
    cx.drawImage(groundTile(sx,sy,terrainOf), ox+sx*ts, oy+sy*ts, ts, ts);
    cx.drawImage(atlas.boat, ox+sx*ts, oy+sy*ts, ts, ts);
  }
  // ④ キャラ（Yじゅんに かさねる）★ふねに のって いる あいだは ふねだけを えがく
  let list = (actors||[]).slice();
  if(C.G && C.G.aboard && theme==='world' && list.length){
    const lead=list[0];
    cx.drawImage(atlas.boat, ox+lead.x*ts, oy+lead.y*ts, ts, ts);
    list=[];
  }
  list = list.sort((a,b)=>a.y-b.y);
  list.forEach(a=>drawChar(a, ox, oy, ts, time));

  // ⑤ てんこう・じかん
  // ★ワールドは あるくと ちほうが かわる ので、えがく たびに たしかめる。
  //   まえは マップに はいった ときだけ きめて いた ため、
  //   ゆきの ちほうに はいっても ふらなかった。
  updateSnow();
  if(flakes) drawSnow(dt, ts);
  if(curNight && curScene.aurora) drawAurora(time);
  drawTint();
  if(fadeV>0){ cx.fillStyle='rgba(0,0,0,'+fadeV+')'; cx.fillRect(0,0,W,H); }
  drawDream();
  if(sceneKey) drawSceneOverlay(time);
  if(mapOn) drawMapOverlay(time);
}
let NPCREF = null;
function setNpcData(n){ NPCREF = n; }
function drawNPC(dx,dy,ts,x,y){
  const s=ts;
  cx.fillStyle='rgba(16,20,34,0.30)';
  cx.beginPath(); cx.ellipse(dx+s/2, dy+s*0.86, s*0.24, s*0.09, 0, 0, Math.PI*2); cx.fill();
  // NPCデータから みためを ひく（なければ むらびとb）
  let key='villagerB';
  if(NPCREF && NPCREF.npcAt){
    const e=NPCREF.npcAt(curMap, x, y);
    if(e && e.spr) key=e.spr;
  }
  // ★人だけで なく まもの の 絵も つかえる ように する
  //   （物語に 出てくる 悪夢獣を 地図に 立たせる ため）
  const d = (CHRREF && CHRREF[key]) || (MONREF && MONREF[key]);
  if(d){
    const img=getImg(d.front||d.src);
    if(img.complete && img.naturalWidth){
      const csc=chrDrawScale(s);
      const ww=Math.round(d.w*csc), hh=Math.round(d.h*csc);
      cx.drawImage(img, Math.round(dx+s/2-ww/2), Math.round(dy+s*0.95-hh), ww, hh);
      return;
    }
  }
  cx.fillStyle='#3f5a9e'; cx.fillRect(px(dx+s*0.30), px(dy+s*0.38), s*0.40, s*0.42);
  cx.fillStyle='#f2c79c'; cx.fillRect(px(dx+s*0.33), px(dy+s*0.18), s*0.34, s*0.24);
}
let MONREF = null;
function setMon(m){ MONREF = m; }
// ---------------- イベントの いちまいえ ----------------
let sceneKey = null;
function showScene(k){ sceneKey = k; }
function hideScene(){ sceneKey = null; }
function drawSceneOverlay(time){
  const a = MONREF && MONREF[sceneKey];
  if(!a) return;
  cx.fillStyle='#05060c'; cx.fillRect(0,0,W,H);
  const img = getImg(a.src);
  if(!(img.complete && img.naturalWidth)) return;
  const sc = Math.max(1, Math.floor(Math.min(W/a.w, (H*0.92)/a.h)));
  const dw=a.w*sc, dh=a.h*sc;
  const ox=Math.round((W-dw)/2), oy=Math.round((H*0.92-dh)/2);
  cx.imageSmoothingEnabled=false;
  cx.drawImage(img, ox, oy, dw, dh);
  cx.strokeStyle='rgba(255,255,255,0.5)'; cx.lineWidth=2;
  cx.strokeRect(ox-2, oy-2, dw+4, dh+4);
}
function drawBoss(dx,dy,ts,tx,ty){
  const s=ts;
  cx.fillStyle='rgba(40,10,60,0.35)';
  cx.beginPath(); cx.ellipse(dx+s/2, dy+s*0.86, s*0.36, s*0.12, 0, 0, Math.PI*2); cx.fill();
  // ★そのマップの ボスの えを つかう（せんとうちゅうと おなじ すがた）。
  //   マップめいを かためがきして いた ため、あたらしい ボスが かげのままだった。
  // ★そのマップの ボスの えを つかう（せんとうちゅうと おなじ すがた）。
  //   そうしボス（pair）は 2たいで 1くみ なので、ならべて えがく。
  const arts = [];
  const bi = C.bossInfoAt ? C.bossInfoAt(C.P.map, tx, ty) : null;
  if(bi){
    // ★人の 絵を つかう ボス（立ち合いの セレンなど）は、まもの と おなじ
    //   大きさで えがくと 人だけ 大きく 見える。人は 人の 大きさに そろえる。
    const pick = (key)=>{
      const b = C.MIDBOSS && C.MIDBOSS[key];
      const art = (b && b.art) || key;
      const mon = MONREF && (MONREF[art] || MONREF[key]);
      if(mon) return mon;
      const chr = CHRREF && (CHRREF[art] || CHRREF[key]);
      if(chr){ const o = Object.create(chr); o._isChr = true; return o; }
      return null;
    };
    const a1 = pick(bi.key);
    if(a1) arts.push(a1);
    if(bi.pair){ const a2 = pick(bi.pair); if(a2) arts.push(a2); }
  }
  if(!arts.length && C.P.map==='versa_dgn2'){
    const yb = MONREF && MONREF['yumebanken_f'];
    if(yb) arts.push(yb);
  }
  if(arts.length){
    // ★そうしボスは 2たいぶん よこはばが いる。まえは タイルはばで ずらして
    //   いた ため、えの はば（46ドット）に まけて 6わり かさなって いた。
    //   いまは じっさいの えがきはばを つみあげ、かたを 15% だけ かさねる。
    const pair = arts.length>1;
    const sc = Math.max(1, Math.round(ts/TS*0.6));
    let ok = true;
    const imgs = arts.map(a=>getImg(a.src || a.front));
    imgs.forEach(im=>{ if(!(im.complete && im.naturalWidth)) ok = false; });
    if(ok){
      const ws = arts.map(a=>Math.round(a.w*(a._isChr ? chrDrawScale(s) : sc)));
      let minw = ws[0];
      ws.forEach(w=>{ if(w<minw) minw=w; });
      const ov = pair ? Math.round(minw*0.15) : 0;
      let total = -ov*(arts.length-1);
      ws.forEach(w=>{ total += w; });
      let x = dx + s/2 - total/2;
      arts.forEach((a, i)=>{
        const csc = a._isChr ? chrDrawScale(s) : sc;   // ★人は 人の 大きさで
        const w2 = Math.round(a.w*csc), hh = Math.round(a.h*csc);
        cx.drawImage(imgs[i], Math.round(x + (ws[i]-w2)/2),
          Math.round(dy + s*0.95 - hh), w2, hh);
        x += ws[i] - ov;
      });
      return;
    }
  }
  cx.fillStyle='rgba(60,20,80,0.5)';
  cx.beginPath(); cx.ellipse(dx+s/2, dy+s*0.6, s*0.42, s*0.34, 0, 0, Math.PI*2); cx.fill();
  cx.fillStyle='#c8324a';
  cx.fillRect(px(dx+s*0.32), px(dy+s*0.45), Math.max(2,s*0.09), Math.max(2,s*0.07));
  cx.fillRect(px(dx+s*0.59), px(dy+s*0.45), Math.max(2,s*0.09), Math.max(2,s*0.07));
}
function getImg(src){
  if(!imgCache[src]){ const i=new Image(); i.src=src; imgCache[src]=i; }
  return imgCache[src];
}
// ★フィールドでの 人の 大きさ。
//   LQ4の 立ち絵は たかさ40ドット（LQ3は24）。そのまま タイルばいりつで えがくと
//   人が 家より 大きく なる。ここで 「タイル1.7こぶん」に そろえる。
//   NPCごとの せの高さの ちがいは のこる（子どもは ひくい、団長は たかい）。
const CHR_REF_H = 40;                 // きじゅんに する 立ち絵の たかさ
const CHR_TILES = 1.7;                // 人の たかさ ＝ タイル なんこぶん
function chrDrawScale(ts){ return (ts*CHR_TILES) / CHR_REF_H; }

function drawChar(a, ox, oy, ts, time){
  const d = CHRREF && CHRREF[a.cls];
  const dx = ox + a.x*ts, dy = oy + a.y*ts;
  const sc = ts/TS;                       // タイルの ばいりつ（かならず せいすう）
  cx.fillStyle='rgba(16,20,34,0.30)';
  cx.beginPath(); cx.ellipse(dx+ts/2, dy+ts*0.86, ts*0.26, ts*0.10, 0, 0, Math.PI*2); cx.fill();
  if(!d){ cx.fillStyle='#c8d0e0'; cx.fillRect(px(dx+ts*0.3),px(dy+ts*0.2),ts*0.4,ts*0.6); return; }
  let pose = a.pose in d ? a.pose : 'front';
  const img = getImg(d[pose]);
  if(!img.complete || !img.naturalWidth) return;
  // ★タイルと おなじ ばいりつで えがく ＝ ドットの あらさが そろう
  //   よこむきは はばが ちがう ので、その えの はばを つかう
  const baseW = (pose.indexOf('side')===0 && d.sideW_) ? d.sideW_ : d.w;
  const csc = chrDrawScale(ts);
  const ww = Math.round(baseW*csc), hh = Math.round(d.h*csc);
  const bx = Math.round(dx + ts/2 - ww/2);
  const by = Math.round(dy + ts*0.95 - hh + (a.bob||0)*ts);
  cx.save();
  if(a.flip){ cx.translate(bx+ww, by); cx.scale(-1,1); cx.drawImage(img, 0, 0, ww, hh); }
  else cx.drawImage(img, bx, by, ww, hh);
  cx.restore();
}
function drawSnow(dt, ts){
  const col = (curTS && curTS.id!=='NORMAL') ? '#d8bff5' : '#ffffff';
  cx.fillStyle = col;
  const rate = curTS ? curTS.snowRate : 1;
  snow.forEach(f=>{
    f.y += dt*f.v*rate*0.35;
    f.x += Math.sin((f.y+f.v)*6)*0.0012;
    if(f.y>1){ f.y=-0.02; f.x=Math.random(); }
    cx.globalAlpha = 0.75;
    cx.fillRect(px(f.x*W), px(f.y*H), f.s*2, f.s*2);
  });
  cx.globalAlpha = 1;
}
function drawAurora(time){
  const g = cx.createLinearGradient(0,0,0,H*0.42);
  const a1 = 0.16+0.06*Math.sin(time*0.5), a2 = 0.12+0.05*Math.sin(time*0.37+1.4);
  g.addColorStop(0,   'rgba(90,240,180,0)');
  g.addColorStop(0.35,'rgba(90,240,180,'+a1+')');
  g.addColorStop(0.62,'rgba(120,200,255,'+a2+')');
  g.addColorStop(1,   'rgba(180,120,255,0)');
  cx.fillStyle=g; cx.fillRect(0,0,W,H*0.42);
  cx.globalAlpha=0.10;
  cx.fillStyle='#ffffff';
  for(let i=0;i<10;i++){
    const x=((i*97+time*22)%(W+120))-60;
    cx.fillRect(px(x), 0, 3, H*0.34);
  }
  cx.globalAlpha=1;
}
function drawTint(){
  if(curTS && curTS.id!=='NORMAL'){
    cx.fillStyle = curTS.id==='DREAM_INVASION'
      ? 'rgba(110,60,170,0.30)' : 'rgba(150,120,200,0.16)';
    cx.fillRect(0,0,W,H);
  }
  if(curNight){ cx.fillStyle='rgba(20,26,60,0.34)'; cx.fillRect(0,0,W,H); }
  // まわりを くらくして おくゆきを だす
  const g = cx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.30, W/2,H/2,Math.max(W,H)*0.72);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1, curTS && curTS.id==='DREAM_INVASION' ? 'rgba(30,8,50,0.55)' : 'rgba(0,0,0,0.42)');
  cx.fillStyle=g; cx.fillRect(0,0,W,H);
}
function setFade(v){ fadeV = v; }
// ★ゆめみ：がめんを しろく とばして、おとが とおのいた かんじに する
let dreamOn = false;
function setDream(on){ dreamOn = !!on; }
// ★いま ゆきが ふる ばしょか（ワールドは いちで きめる）
const SNOW_AREAS = [
  {x0:24, y0:0,  x1:72, y1:24},   // ヴェルサ（きたの せつげん）
  {x0:0,  y0:24, x1:26, y1:50},   // エルデ（にしの れいほう）
];
// ★ゆきの ありなしを いまの いちで あわせる
function updateSnow(){
  const want = snowHere();
  if(want === snowOn) return;
  snowOn = want;
  if(want){
    flakes = 90;
    snow = [];
    for(let i=0;i<flakes;i++)
      snow.push({x:Math.random(), y:Math.random(), v:0.25+Math.random()*0.5, s:1+Math.random()*2});
  }else{
    flakes = 0; snow = [];
  }
}
function snowHere(){
  if(curMap !== 'world') return !!(curScene && curScene.snowfall);
  const x = C.P.x, y = C.P.y;
  return SNOW_AREAS.some(a=>x>=a.x0 && x<=a.x1 && y>=a.y0 && y<=a.y1);
}
function drawDream(){
  if(!dreamOn) return;
  cx.fillStyle = 'rgba(236,244,255,0.42)';
  cx.fillRect(0,0,W,H);
  const g = cx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.18, W/2,H/2,Math.max(W,H)*0.62);
  g.addColorStop(0,'rgba(255,255,255,0)');
  g.addColorStop(1,'rgba(200,220,255,0.55)');
  cx.fillStyle=g; cx.fillRect(0,0,W,H);
}

return {init, resize, buildMap, draw, noteStep, setFade, setDream,
  debugSnow(){ return !!flakes; }, setMon, setNpcData,
        showMap, hideMap, drawMapOverlay, get mapOn(){return mapOn;},
        showScene, hideScene, drawSceneOverlay, get sceneOn(){return !!sceneKey;},
        battleEnter:battleEnter2D, battleFx:battleFx2D, battleLeave:battleLeave2D, drawBattle,
        pop:pop2D,
        get TS(){return TS;}};
})();

