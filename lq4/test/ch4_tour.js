'use strict';
// ルミナクエストIV / 第4章（禁書庫）通しテスト
// 使い方： node test/ch3_tour.js
//   雲海港 → 炉の 主任（緘口令）→ 天空城 → グラン → 司書に 断られる → グランの 鍵 →
//   禁書庫（灯2つ）→ 番人 アーキス → 契約書 → 神殿の 巫女 → 白竜 → 公王 → 章末
const fs = require('fs'), vm = require('vm');
const store = {};
const fakeLS = {getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);},
                removeItem:k=>{delete store[k];}};
const ctx = {console, window:{}, localStorage:fakeLS}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);

const log=[], scene=[];
C.bind(Object.assign({}, C.NullView, {
        showScene(k){ scene.push('show:'+k); }, hideScene(){ scene.push('hide'); },
        runner(o){ o.done && o.done(); }, runnerClear(){},
       }),
       {msg(l,d){ l.forEach(x=>log.push(x)); d&&d(); },
        menu(i,t,cb){ cb(t==='これから' ? 1 : 0); },
        hud(){}, label(){}, openTrade(){}}, C.NullAudio);

let n=0, ng=0;
// ★クエスト画面が 空に なる 区間を はかる（章の 途中で「やることが ない」に ならない こと）
//   ★第0〜3章の すべてで、章の はじめ・地方の あいだ・ボスの あとに 空に なって いた。
const __GAPS=[]; let __gap=null;
function __probeQuest(name){ try{
  const ch=C.G.chapter; const q=C.questList().length, g=C.currentGoal&&C.currentGoal();
  const cleared=Object.keys(C.G.flags).some(k=>/_cleared$/.test(k)&&C.G.flags[k]&&k.startsWith('ch'+(ch-1)+'_'));
  if(!q && !g && !cleared && C.G.mode!=='battle'){ if(!__gap){ __gap={from:name,n:0}; __GAPS.push(__gap);} __gap.n++; } else __gap=null;
}catch(e){} }
function T(name, cond, detail){ __probeQuest(String(name)); n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>String(l).indexOf(w)>=0); }
function clearLog(){ log.length=0; }
function stand(map,x,y,dir){ C.G.mode='field'; C.P.map=map; C.P.x=x; C.P.y=y; if(dir) C.P.dir=dir; }
function talk(map,x,y,dir){ clearLog(); stand(map,x,y,dir); C.interact(); }

// ===== 0. 第4章を はじめる =====
C.freshState();
C.G.flags.ch3_cleared = true;
C.switchChapter(5);
T('第4章に なる', C.G.chapter===5);
T('章データが ひける', C.chData() && C.chData().id==='ch4_archive');
T('はじまりは 雲海港', C.P.map==='sky_port', C.P.map);
T('仲間は 4人', C.party.length===4 && C.party.map(m=>m.cls).join(',')==='io,seren,noe,amane', C.party.map(m=>m.cls).join(','));
T('天空の 鎧を そろえた 印が 立つ（見た目・戦闘曲）', C.G.flags.sky_armor===true);
T('イオは 天空の 鎧を 着て いる', /天空の 鎧/.test((C.party[0].armor||{}).name||''));
T('はじめの 目的は 炉の 主任', /炉の 主任/.test(C.currentGoal()||''), C.currentGoal());
// 第1〜2章の ダンジョンは 封鎖
['furnace','old_pipe','pipe_path','garden','tower2'].forEach(m=>T(m+' は 封鎖', C.wardBlocks(m)));

// ===== 1. 緘口令 =====
talk('upper_dist', 10, 2, 'back');
T('大門は まだ 開かない', C.P.map==='upper_dist' && said('炉の 主任に 話を'), log.join(' / ').slice(0,80));
talk('upper_dist', 9, 5, 'back');
T('主任が 調査の 打ち切りを 言う', C.G.flags.ch4_gag===true && said('調査は 打ち切りだ'));
T('頼みごと「禁書庫」が 始まる', C.G.quests.ch4_q1_archive==='active');

// ===== 2. 天空城へ =====
talk('upper_dist', 10, 2, 'back');
T('大門から 天空城へ', C.P.map==='sky_castle', C.P.map+' '+C.P.x+','+C.P.y);
T('天空城は 3D（城）', vm.runInContext('WORLD',ctx).renderModeOf('sky_castle')==='3d');
// 禁書庫は まだ 入れない
stand('sky_castle', 1, 9, 'left'); clearLog(); C.stepField(-1,0);
T('禁書庫は まだ 閉じて いる', C.P.map==='sky_castle' && said('騎士団長の 鍵'), log.join(' / ').slice(0,80));
talk('sky_castle', 3, 9, 'back');
T('グランに 会う', C.G.flags.ch4_granMet===true && said('禁書庫か'));
talk('sky_castle', 2, 11, 'back');
T('セレンの 家の 名では 開かない', C.G.flags.ch4_serenRefused===true && said('家の 名では 開きません'));
stand('sky_castle', 1, 9, 'left'); C.stepField(-1,0);
T('断られた あとも まだ 入れない', C.P.map==='sky_castle');
talk('sky_castle', 3, 9, 'back');
T('グランが 鍵を 出す（協力して 入れる）', C.G.flags.ch4_granHelp===true && said('騎士団長の 鍵だ'));

// ===== 3. 禁書庫 =====
stand('sky_castle', 1, 9, 'left'); C.stepField(-1,0);
T('禁書庫 上層へ', C.P.map==='archive1', C.P.map);
T('禁書庫は 3D（ダンジョン）', vm.runInContext('WORLD',ctx).renderModeOf('archive1')==='3d');
stand('archive1', 18, 13, 'right'); C.stepField(1,0);
T('下層へ', C.P.map==='archive2', C.P.map+' '+C.P.x+','+C.P.y);
talk('archive2', 9, 1, 'right');
T('奥の 扉は 灯が 要る', said('火の 消えた 灯'), log.join(' / ').slice(0,80));
talk('archive2', 5, 6, 'back');
talk('archive2', 15, 6, 'back');
T('ふたつの 灯で 扉が 開く', C.tileAt('archive2',10,1)!=='K' && C.G.flags.ch4_archiveLit===true, C.tileAt('archive2',10,1));
stand('archive2', 10, 2, 'back');   // (10,2) は 壁 なので 横から
stand('archive2', 9, 1, 'right'); C.stepField(1,0); C.G.mode='field'; C.stepField(0,-1);
T('最奥へ', C.P.map==='archive_core', C.P.map+' '+C.P.x+','+C.P.y);

// ===== 4. 番人 アーキス（手合わせ）=====
// ★負けても 進む ことを 先に 確かめる（弱い 仲間で）
{
  const keep=C.party.map(m=>JSON.parse(JSON.stringify(m)));
  const gold=C.P.gold;
  C.party.length=0; ['io','seren','noe','amane'].forEach(k=>C.party.push(C.mkMember(k,3)));
  const s2=JSON.parse(JSON.stringify(C.G.flags));
  talk('archive_core', 8, 5, 'back');
  T('負けても 手合わせは 終わる（番人を 越えた）', C.G.flags.ch4_arkisDone===true, JSON.stringify(Object.keys(C.G.flags).filter(k=>/arkis/.test(k))));
  T('負けても 全滅扱いに ならない（その 場に いる・お金が 減らない）', C.P.map==='archive_core' && C.P.gold===gold, C.P.map+' '+C.P.gold+'/'+gold);
  T('負けた ときの ことば', said('引かなかった'));
  // もとに もどして 勝つ 方も 確かめる
  C.G.flags=s2; C.setTile('archive_core',8,4,'B');
  C.party.length=0; keep.forEach(o=>C.party.push(C.reviveMember?C.reviveMember(o):o));
}
C.G.tactic='gungan';
C.party.length=0;
['io','seren','noe','amane'].forEach((k,j)=>{ const m=C.mkMember(k,40); m.weapon={kind:'w',name:'w',v:[26,28,16,16][j]}; m.armor={kind:'a',name:'a',v:[34,25,19,19][j]}; C.party.push(m); });
talk('archive_core', 8, 5, 'back');
T('番人 アーキスを 越える', C.G.flags.ch4_arkisDone===true);
T('道が あく', C.tileAt('archive_core',8,4)!=='B');

// ===== 5. 千年前の 契約書 =====
talk('archive_core', 8, 3, 'back');
T('契約書を 読む', C.G.flags.ch4_contract===true && said('要らぬ 夢は 夢の 底に 棄てる'));
T('ノエの 家の わけが わかる', said('自分の 夢を、納めて きたんだ'));
T('アマネが 白竜に 呼ばれる', said('白竜さまが、お呼びです'));

// ===== 6. 神殿 → 白竜 =====
stand('sky_castle', 19, 9, 'right'); clearLog(); C.stepField(1,0);
T('神殿は まだ 閉じて いる', C.P.map==='sky_castle' && said('白竜さまの お許し'), log.join(' / ').slice(0,80));
talk('sky_castle', 17, 9, 'back');
T('巫女が 通す', C.G.flags.ch4_templeOpen===true);
stand('sky_castle', 19, 9, 'right'); C.stepField(1,0);
T('神殿の 最奥へ', C.P.map==='temple', C.P.map);
talk('temple', 8, 4, 'back');
T('白竜 ルミナに 会う', C.G.flags.ch4_lumina===true && said('もう、限界が 近い'));

// ===== 7. 公王 → 章末 =====
talk('sky_castle', 10, 3, 'back');
T('公王に 会う', C.G.flags.ch4_king===true && said('代わりの 浮き方を 示せ'));
T('頼みごとが 片づく', C.G.quests.ch4_q1_archive==='clear');
T('章末が 出る', said('グランは 登城しなく なった'));
T('ch4_cleared が たつ', C.G.flags.ch4_cleared===true);
T('章の 終わりで 目的は なくなる', C.currentGoal()===null, C.currentGoal());
T('目的の 印は ぜんぶ 立った', C.chData().goals.every(g=>C.G.flags[g.done]), C.chData().goals.filter(g=>!C.G.flags[g.done]).map(g=>g.done).join(' '));

// ===== 8. 前の 章では 封鎖されない =====
for(const no of [2,3,4]){
  C.freshState(); C.G.chapter=no;
  T('第'+(no-1)+'章では 炉の 外郭を 第4章の 封鎖で 閉じない', !(C.chData().closed||{}).furnace);
}

// ===== 絵：白竜 ルミナは 正式な 絵（仮の 絵 luminaTmp は 使わない）=====
{
  const actx={console, window:{}}; actx.globalThis=actx; vm.createContext(actx);
  vm.runInContext(fs.readFileSync('assets.js','utf8')+';globalThis.__CHR=CHR;', actx, {filename:'assets.js'});
  const CH=actx.__CHR, e=C.NPCDATA ? C.NPCDATA.npcAt('temple',8,3) : vm.runInContext("NPCDATA.npcAt('temple',8,3)", ctx);
  T('神殿の 最奥の 白竜は 絵 lumina', e && e.spr==='lumina', e && e.spr);
  T('CHR.lumina が ある（座った 姿・3D の 高さ bb）', CH.lumina && CH.lumina.front && CH.lumina.bb>1.45, CH.lumina && (CH.lumina.w+'x'+CH.lumina.h));
  T('仮の 絵 luminaTmp が 残って いない', !CH.luminaTmp && fs.readFileSync('src/npc.js','utf8').indexOf('luminaTmp')<0);
  T('番人 アーキスの 絵は CHR.arkis（3面）', C.MIDBOSS.arkis.art==='arkis' && CH.arkis && CH.arkis.front && CH.arkis.side && CH.arkis.back, C.MIDBOSS.arkis.art);
  T('仮の 絵 arkisTmp が 残って いない', !CH.arkisTmp && fs.readFileSync('src/core.js','utf8').indexOf('arkisTmp')<0);
  { const actx2={console,window:{}}; actx2.globalThis=actx2; vm.createContext(actx2);
    vm.runInContext(fs.readFileSync('assets.js','utf8')+';globalThis.__MON=MON;', actx2, {filename:'assets.js'});
    const MN=actx2.__MON, FO=vm.runInContext('typeof ENEMIES!=="undefined"?ENEMIES:null', ctx) || (C.ENEMIES||[]);
    for (const k of ['kokuhyoushi','sumibane','noroichou']){
      const e=(FO||[]).find(x=>x.key===k);
      T('禁書庫の 敵 '+k+' は 色を 変えた 自分の 絵', e && e.art===k && MN[k] && MN[k].src, e && e.art);
     }
    { const e=(FO||[]).find(x=>x.key==='shokabanken');
      T('書架の 番犬は 新しい 絵（仮の 忘れもの で ない）', e && e.art==='shokabanken' && MN.shokabanken && MN.shokabanken.src, e && e.art); } }
  { const e2=vm.runInContext("NPCDATA.npcAt('sky_castle',10,2)", ctx);
    T('公王 アルベルの 絵は CHR.albel（3面）', e2 && e2.spr==='albel' && CH.albel && CH.albel.front && CH.albel.side && CH.albel.back, e2 && e2.spr);
    T('仮の 絵 albelTmp が 残って いない', !CH.albelTmp && fs.readFileSync('src/npc.js','utf8').indexOf('albelTmp')<0); }
  T('飛ぶ 姿は 終章用に 保存（art/chr/luminaFly.png）', fs.existsSync('art/chr/luminaFly.png') && fs.existsSync('art/chr/luminaFly_src.png'));
}

T('クエスト画面が 章の 途中で 空に ならない', __GAPS.length===0, __GAPS.map(g=>g.from+'（'+g.n+'）').join(' / '));
console.log('\n--- ch4_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
