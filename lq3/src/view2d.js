'use strict';
// ============================================================
// ルミナクエストIII / 2Dドットえ レンダラ
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
let C = null;                  // LQ3 への さんしょう
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
  atlas.gate = tile((g,s)=>{
    R(g,0,0,s,s,P16.sd1);
    R(g,1,2,3,13,P16.st2); R(g,12,2,3,13,P16.st2);
    R(g,1,2,3,1,P16.st3);  R(g,12,2,3,1,P16.st3);
    for(let y=0;y<3;y++){ R(g,1,1-y,3,1,P16.roof1); R(g,12,1-y,3,1,P16.roof1); }
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
  switch(ch){
    // ---- ワールドマップ ----
    case '~': return atlas.sea;
    case '_': return atlas.beach;
    case ',': return atlas.woods;
    case '^': return atlas.mount;
    case 'A': return atlas.mCastle;
    case 'V': return atlas.mVillage;
    case 'X': return atlas.mCave;
    case 'Q': return atlas.mFuture;
    case '#': return ice?atlas.icewall : (cave?atlas.rockwall : atlas.wall);
    case 'w': return atlas.water;
    case 'f': return snowT?atlas.tree : atlas.tree_g;
    case 'o': return ice?atlas.icicle : atlas.rock;
    case 't': return atlas.torch;
    case 'C': return atlas.chest;
    case 'I': return atlas.inn;
    case 'P': return atlas.church;
    case 'w': return atlas.well;      // ※ ワールドの みずうみは floorで しょり
    case 'e': return atlas.fence;
    case '*': return atlas.flower;
    case 'y': return atlas.signpost;

    case 'K': return atlas.castgate;
    case 'F': return atlas.fountain;
    case 'G': return atlas.gate;
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
  village: {floor:'grass',     road:'road'},
  field:   {floor:'grass',     road:'road'},
  indoor:  {floor:'pave',      road:'road'},
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
function groundTile(x,y,terrainOf){
  const k = curMap+':'+x+','+y;
  const hit = groundCache[k];
  if(hit) return hit;
  const t = terrainOf(x,y);
  const c = mk(TS,TS), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(hashPick(x,y,atlas[t]),0,0);
  const rank = TERRAIN_RANK[t]||0;
  DIRS8.forEach(([dir,dx,dy])=>{
    const nt = terrainOf(x+dx,y+dy);
    if(!nt || nt===t) return;
    if((TERRAIN_RANK[nt]||0) <= rank) return;
    const src = hashPick(x+dx,y+dy,atlas[nt]);
    g.drawImage(edgeTile(src, nt+':'+atlas[nt].indexOf(src), dir),0,0);
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
  const tilesTall = (theme==='world') ? 18 : 15;
  const scale = Math.max(2, Math.floor(H / (tilesTall*TS)));
  const ts = TS*scale;   // かならず せいすうばい

  // カメラ（プレイヤーちゅうしん・はしで とめる）
  const p = actors && actors[0] ? actors[0] : {x:C.P.x, y:C.P.y};
  const viewW = W/ts, viewH = H/ts;
  camX = Math.min(Math.max(p.x+0.5, viewW/2), Math.max(viewW/2, MW-viewW/2));
  camY = Math.min(Math.max(p.y+0.5, viewH/2), Math.max(viewH/2, MH-viewH/2));
  // カメラの ずれも せいすうに して、すべての タイルが ぴったり ならぶように する
  const ox = Math.round(W/2 - camX*ts), oy = Math.round(H/2 - camY*ts);

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
    }else{
      let base = (ch==='r') ? road : floor;
      // ★NPC・たからばこ など「うえに のる」ものの あしもとは、
      //   まわりの じめん（みち r／すな _）を ひきつぐ。
      //   トロスは すな(_)の うえに NPCが いて、したの くさが みえていた。
      if('nCB<>SWMIPFt*e'.includes(ch)){
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
      let art = tileArt(ch, theme);
      if(Array.isArray(art)) art = hashPick(x,y,art);
      if(art) cx.drawImage(art, ox+x*ts, oy+y*ts, ts, ts);
    }
    if(ch==='n') drawNPC(ox+x*ts, oy+y*ts, ts, x, y);
    // ★ボスは いったん ためて、ちけいを ぜんぶ かいたあとに えがく。
    //   さきに かくと、みぎ・したの ゆかタイルが ボスの はみだしを うわがきして
    //   「みぎうでが かける」げんしょうが おきていた。
    if(ch==='B'){
      const bi = C.bossInfoAt ? C.bossInfoAt(curMap) : null;
      const done = bi && bi.clearedFlag && C.G.flags[bi.clearedFlag];
      if(!done) _bossQ.push([ox+x*ts, oy+y*ts, ts]);
    }
  }
  // ★まち・むらは 1.45ばいで えがく（ちいさくて みつけにくかった）
  _mkQ.forEach(([ch,mx,my])=>{
    const art = ch==='A' ? atlas.mCastle : atlas.mVillage;
    const mw = ts*1.45, mh = ts*1.45;
    cx.drawImage(art, Math.round(mx + ts/2 - mw/2), Math.round(my + ts - mh), mw, mh);
  });
  _mkQ.length=0;
  _bossQ.forEach(([bx,by,bts])=>drawBoss(bx,by,bts));
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
  const d = CHRREF && CHRREF[key];
  if(d){
    const img=getImg(d.front||d.src);
    if(img.complete && img.naturalWidth){
      const sc=ts/TS;
      const ww=Math.round(d.w*sc), hh=Math.round(d.h*sc);
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
function drawBoss(dx,dy,ts){
  const s=ts;
  cx.fillStyle='rgba(40,10,60,0.35)';
  cx.beginPath(); cx.ellipse(dx+s/2, dy+s*0.86, s*0.36, s*0.12, 0, 0, Math.PI*2); cx.fill();
  // ★そのマップの ボスの えを つかう（せんとうちゅうと おなじ すがた）。
  //   マップめいを かためがきして いた ため、あたらしい ボスが かげのままだった。
  // ★そのマップの ボスの えを つかう（せんとうちゅうと おなじ すがた）。
  //   そうしボス（pair）は 2たいで 1くみ なので、ならべて えがく。
  const arts = [];
  const bi = C.bossInfoAt ? C.bossInfoAt(C.P.map) : null;
  if(bi){
    const pick = (key)=>{
      const b = C.MIDBOSS && C.MIDBOSS[key];
      const art = (b && b.art) || key;
      return (MONREF && (MONREF[art] || MONREF[key]))
          || (CHRREF && (CHRREF[art] || CHRREF[key])) || null;
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
      const ws = arts.map(a=>a.w*sc);
      let minw = ws[0];
      ws.forEach(w=>{ if(w<minw) minw=w; });
      const ov = pair ? Math.round(minw*0.15) : 0;
      let total = -ov*(arts.length-1);
      ws.forEach(w=>{ total += w; });
      let x = dx + s/2 - total/2;
      arts.forEach((a, i)=>{
        const hh = a.h*sc;
        cx.drawImage(imgs[i], Math.round(x),
          Math.round(dy + s*0.95 - hh), ws[i], hh);
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
  const ww = Math.round(baseW*sc), hh = Math.round(d.h*sc);
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
        get TS(){return TS;}};
})();

