'use strict';
// ルミナクエストIV / しかけ（押し岩・穴・光珠灯・扉）の けんしょう
// 使い方： node test/gimmick.js
const fs = require('fs'), vm = require('vm');
const store = {};
const fakeLS = {getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);},
                removeItem:k=>{delete store[k];}};
const ctx = {console, window:{}, localStorage:fakeLS}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
const log=[];
C.bind(C.NullView, {msg(l,d){l.forEach(x=>log.push(x)); d&&d();}, menu(i,t,cb){cb(0);},
                    hud(){}, label(){}}, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>l.indexOf(w)>=0); }
function at(x,y){ return C.tileAt('rift_yard',x,y); }
function stand(x,y){ C.P.map='rift_yard'; C.P.x=x; C.P.y=y; C.G.mode='field'; }
function face(dir){ C.P.dir=dir; }

// ============ 1. 岩を おす ============
C.freshState(); C.G.flags.ch0_trialDone=true;
T('はじめは 岩が ある', at(5,12)==='O', at(5,12));
T('はじめは 穴が ある', at(5,10)==='x', at(5,10));
stand(5,13);
C.stepField(0,-1);                       // 岩(5,12)を 北へ おす
T('岩が うごく', at(5,11)==='O' && at(5,12)==='.', at(5,11)+'/'+at(5,12));
T('おした ぶん すすむ', C.P.x===5 && C.P.y===12, C.P.x+','+C.P.y);
log.length=0;
C.G.mode='field';
C.stepField(0,-1);                       // さらに 北 → 穴(5,10)に はまる
T('岩が 穴を うめる', at(5,10)==='.' && at(5,11)==='.', at(5,10)+'/'+at(5,11));
T('うめた しらせが でる', said('足場が できた'), log.join(' / ').slice(0,50));
C.G.mode='field';
C.stepField(0,-1); C.stepField(0,-1);
T('穴を わたれる', C.P.y===10 || C.P.y===9, 'y='+C.P.y);

// ============ 2. 押せない ばあい ============
log.length=0;
C.freshState();
stand(5,11); face('back');
C.G.mode='field';
C.stepField(0,1);                        // 岩(5,12)を 南へ おす → (5,13)は 床なので おせる
T('床なら 南へも おせる', at(5,13)==='O', at(5,13));
log.length=0; C.G.mode='field';
C.P.x=5; C.P.y=12;
C.stepField(0,1);                        // (5,14)は かべ → おせない
T('かべの むこうへは おせない', at(5,13)==='O' && C.P.y===12, at(5,13)+' y='+C.P.y);
T('おせない しらせが でる', said('びくとも'), log.join(' / ').slice(0,40));

// ============ 3. 光珠灯と 扉 ============
C.freshState();
T('はじめは 扉が しまっている', at(16,5)==='K', at(16,5));
log.length=0;
stand(16,6); face('back');
C.interact();                            // 扉を しらべる
T('扉は かぎでは あかない', at(16,5)==='K');
T('あけかたの ヒントが でる', said('光珠'), log.join(' / ').slice(0,60));

log.length=0; C.G.mode='field';
stand(5,7); face('back'); C.interact();  // 光珠灯 1つめ
T('光珠が ともる', at(5,6)==='l', at(5,6));
T('1つでは 扉は あかない', at(16,5)==='K');
C.G.mode='field';
stand(12,7); face('back'); C.interact(); // 光珠灯 2つめ
T('ふたつ めも ともる', at(12,6)==='l', at(12,6));
T('扉が ひらく', at(16,5)==='.', at(16,5));
T('ひらいた しらせが でる', said('扉が 低い 音'), log.join(' / ').slice(-60));
T('めじるしが たつ', C.G.flags.ch0_gateOpen===true);

// 消すと どうなるか（もどしても 扉は しまらない）
C.G.mode='field';
stand(5,7); face('back'); C.interact();
T('灯りは 消せる', at(5,6)==='L');
T('いちど ひらいた 扉は しまらない', at(16,5)==='.');

// ============ 4. セーブ/ロードで しかけが のこる ============
C.G.mode='field';
stand(5,13); C.stepField(0,-1); C.stepField(0,-1);   // 穴を うめる
T('うめた じょうたい', C.tileAt('rift_yard',5,10)==='.');
T('セーブできる', C.saveGame(0)===true, C.lastSaveError);
C.freshState();
T('はじめから だと 穴は もどる', C.tileAt('rift_yard',5,10)==='x', C.tileAt('rift_yard',5,10));
T('はじめから だと 岩も もどる', C.tileAt('rift_yard',5,12)==='O');
T('ロードできる', C.loadGame(0)===true);
T('ロード：うめた 穴は そのまま', C.tileAt('rift_yard',5,10)==='.', C.tileAt('rift_yard',5,10));
T('ロード：扉は ひらいた まま', C.tileAt('rift_yard',16,5)==='.');

// ============ 5. 岩づまり すくい ============
C.freshState();
// 岩を 3つとも すみに 押しこんで 動けなくする かわりに、じかに 消して ためす
['5,12','13,12','7,13'].forEach(k=>{
  const [x,y]=k.split(',').map(Number); C.setTile('rift_yard',x,y,'.');
});
T('岩が なくなった', !C.MAPS.rift_yard.tiles.join('').includes('O'));
const rescued = C.gimmickRescue('rift_yard');
T('岩づまりを 見つけて もとに もどす', rescued===true);
T('岩が もどる', C.tileAt('rift_yard',5,12)==='O', C.tileAt('rift_yard',5,12));
T('穴も もどる', C.tileAt('rift_yard',5,10)==='x');
T('もう 押せる なら もどさない', C.gimmickRescue('rift_yard')===false);

// ============ 6. 管の つけかえ ============
//   ★ゆかの きれはし(u)を ひろい、かべの 継ぎ目(j)に さす。
//     管は かぎりが あり、上の 階へ 行くには 下の 階から 抜いて くる。
{
  C.freshState(); C.G.chapter = 3;
  const touch = (mp,x,y)=>{ C.G.mode='field'; C.P.map=mp; C.P.x=x; C.P.y=y+1; C.P.dir='back';
                            log.length=0; C.interact(); };
  T('はじめは 管を 持って いない', (C.G.pipes||0)===0);
  touch('tower1',3,2);
  T('ゆかの 管を ひろえる', C.G.pipes===1, '本数 '+C.G.pipes);
  T('ひろうと ゆかから 消える', C.tileAt('tower1',3,2)==='.', C.tileAt('tower1',3,2));
  touch('tower2',1,7);
  T('継ぎ目に さすと 減る', C.G.pipes===0, '本数 '+C.G.pipes);
  T('さした 継ぎ目は かたちが かわる', C.tileAt('tower2',1,7)==='H', C.tileAt('tower2',1,7));
  T('さすと 灯りが ともる', C.tileAt('tower2',3,3)==='l', C.tileAt('tower2',3,3));
  T('灯りが そろうと 仕切りが あく', C.tileAt('tower2',6,2)==='.', C.tileAt('tower2',6,2));
  // 抜くと 灯りは 消えるが、あいた 仕切りは 閉じない
  touch('tower2',1,7);
  T('抜くと もどってくる', C.G.pipes===1, '本数 '+C.G.pipes);
  T('抜くと 灯りが 消える', C.tileAt('tower2',3,3)==='L', C.tileAt('tower2',3,3));
  T('あいた 仕切りは 閉じない', C.tileAt('tower2',6,2)==='.', '閉じると 行き止まりに なる');
  // 管が ない ときは させない
  C.G.pipes = 0;
  touch('tower3',1,7);
  T('管が ないと させない', C.tileAt('tower3',1,7)==='h', C.tileAt('tower3',1,7));
  T('させない ときは わけを 言う', log.join('').indexOf('はまる 管')>=0, log.join(' / ').slice(0,50));
}

// ============ 7. 管 3本で 最上階まで 行けるか ============
{
  C.freshState(); C.G.chapter = 3;
  const touch = (mp,x,y)=>{ C.G.mode='field'; C.P.map=mp; C.P.x=x; C.P.y=y+1; C.P.dir='back'; C.interact(); };
  touch('tower1',3,2); touch('tower2',11,3);
  touch('tower2',1,7);
  touch('tower3',7,7);
  touch('tower2',1,7);
  touch('tower3',1,7); touch('tower3',13,7);
  touch('tower3',1,7); touch('tower3',13,7);
  touch('tower4',4,7); touch('tower4',7,7);
  touch('tower4',1,7); touch('tower4',12,7); touch('tower4',3,9);
  T('4階まで あく', C.tileAt('tower4',6,2)==='.', '足りない');
  C.G.mode='field'; C.P.map='tower4'; C.P.x=6; C.P.y=2; C.stepField(0,-1);
  T('最上階へ 行ける', C.P.map==='tower5', C.P.map);
}

// ============ 8. 仕切りを あけずに 上へ 行けない ============
//   ★仕切りと 階段が はなれて いて、何も しなくても 上れて しまった。
//     仕切りが 上への ただ ひとつの 通り道で ある こと。
{
  C.freshState(); C.G.chapter = 3;
  const reach=(mp,sx,sy)=>{
    const seen=new Set([sx+','+sy]); const q=[[sx,sy]];
    while(q.length){ const [x,y]=q.shift();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const k=(x+dx)+','+(y+dy);
        if(!seen.has(k) && C.walkable(mp,x+dx,y+dy)){ seen.add(k); q.push([x+dx,y+dy]); }
      } }
    return seen;
  };
  [['tower2',6,9,6,1],['tower3',6,9,6,1],['tower4',6,9,6,1]].forEach(([mp,sx,sy,ux,uy])=>{
    T(mp+'：仕切りを あけずに 上り階段へ 行けない',
      !reach(mp,sx,sy).has(ux+','+uy), '素通りで 上れて しまう');
  });
  // あけたら 行ける
  [['tower2',6,2],['tower3',6,2],['tower4',6,2]].forEach(([mp,kx,ky])=>{
    C.setTile(mp,kx,ky,'.');
    T(mp+'：あけたら 上り階段へ 行ける', reach(mp,6,9).has('6,1'));
  });
}

// ============ 9. どの 順に 拾っても 解ける ============
//   ★2階の 管を 拾い忘れると 4階で 1本 足りず、
//     どこで つまづいたか 分からない ままに なって いた。
{
  const touch = (mp,x,y)=>{ C.G.mode='field'; C.P.map=mp; C.P.x=x; C.P.y=y+1;
                            C.P.dir='back'; C.interact(); };
  const play = (take2F)=>{
    C.freshState(); C.G.chapter = 3;
    touch('tower1',3,2);
    if(take2F) touch('tower2',11,3);
    touch('tower2',1,7);
    touch('tower3',7,7); touch('tower2',1,7);
    touch('tower3',1,7); touch('tower3',13,7);
    touch('tower3',1,7); touch('tower3',13,7);
    touch('tower4',4,7); touch('tower4',7,7);
    touch('tower4',1,7); touch('tower4',12,7); touch('tower4',3,9);
    return C.tileAt('tower4',6,2);
  };
  T('2階の 管を 拾い忘れても 解ける', play(false)==='.', '4階で 足りなく なる');
  T('ぜんぶ 拾っても 解ける',        play(true)==='.',  '解けない');

  // ★かんたんに なりすぎて いない こと（抜く 手間は のこす）
  C.freshState(); C.G.chapter = 3;
  touch('tower1',3,2); touch('tower2',11,3);
  touch('tower2',1,7);
  touch('tower3',7,7);
  touch('tower3',1,7); touch('tower3',13,7);
  touch('tower4',4,7); touch('tower4',7,7);
  touch('tower4',1,7); touch('tower4',12,7); touch('tower4',3,9);
  T('下の 階から 抜かないと 4階は あかない', C.tileAt('tower4',6,2)==='K',
    '抜く 手間が なく なって いる');
}

console.log('\n--- gimmick: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
