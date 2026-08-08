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

console.log('\n--- gimmick: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
