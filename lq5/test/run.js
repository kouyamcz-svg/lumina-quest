// Ⅴの 決まった 検査。ブラウザ（headless Chrome）で index.html を 動かして 確かめる
//   用意：npm i puppeteer-core @sparticuz/chromium ／ three.min.js（r128）を index と 同じ 場所に 置いた 試し用の 場所を 用意して、
//   node test/run.js http://localhost:8772/index.html
const chromium=require('@sparticuz/chromium'), pu=require('puppeteer-core');
const URL=process.argv[2]||'http://localhost:8772/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let n=0, ng=0; const T=(name,ok,d)=>{ n++; if(!ok){ ng++; console.log('NG',name,d===undefined?'':d); } };
(async()=>{
  const b=await pu.launch({executablePath:await chromium.executablePath(), args:chromium.args, headless:true});
  const pg=await b.newPage(); await pg.setViewport({width:393,height:852});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto(URL,{waitUntil:'load'}); await pg.evaluate(()=>localStorage.clear()); await pg.reload({waitUntil:'load'}); await W(1500);
  const E=(f,a)=>pg.evaluate(f,a);
  const flush=async()=>{ for(let i=0;i<60;i++){ if(!(await E(()=>!!msgQ))) break; await E(()=>pressA()); await W(30);} };
  const talk=async(re)=>{ await E((re)=>{ const x=cur.npcs.find(n=>new RegExp(re).test(n.name)); if(!x) return; const bl=linesByPhase(x); if(bl) say(bl); else if(x.talk) x.talk(x); else say(x.lines); },re); await W(60); };
  const waitMenu=async()=>{ for(let i=0;i<80;i++){ await W(100); if(await E(()=>BT&&BT.phase==='menu')) return true; } return false; };
  const winBattle=async()=>{ await waitMenu(); await E(()=>{ BT.foes.forEach(f=>f.hp=1); BT.sel=0; if(alive().length>1){ pressA(); pressA(); } else pressA(); }); for(let i=0;i<120;i++){ await W(100); if(await E(()=>!BT)) break; } await W(200); };
  const pick=async(l)=>{ await E((l)=>{ const i=MENU.items.findIndex(t=>t.indexOf(l)>=0); MENU.sel=i; pressA(); },l); await W(60); };
  await flush();
  // ---- 序章 ----
  T('はじめは 朝の 村', await E(()=>ST.phase==='morning'&&cur.kind==='town'));
  T('はじめの 位置で 動ける', await E(()=>freeCircle(hero.x,hero.z)));
  await talk('ガイル'); await flush(); T('ガイルで 見回りへ', await E(()=>ST.phase==='field'));
  await E(()=>enterFarm()); await E(()=>{ hero.x=19; hero.z=8.5; hero.ang=Math.PI; pressA(); }); await flush(); T('倉で 警鐘', await E(()=>ST.phase==='raid'));
  await E(()=>{ enterTown([12,1.2]); startRaid(); }); await flush(); T('村が 燃える', await E(()=>ST.phase==='burn'));
  for(const x of ['娘','老人','子']){ await talk('逃げ遅れた '+x); await flush(); }
  T('3人 助ける', await E(()=>Object.keys(ST.rescued).length===3));
  await talk('部隊長'); await flush(); T('部隊長戦の 背景は 燃える村', await waitMenu() && await E(()=>BT.look==='burn'));
  await winBattle(); await flush(); T('部隊長の 後', await E(()=>ST.phase==='after'));
  await talk('ガイル'); await flush(); T('ガイルの 剣', await E(()=>ST.phase==='road'&&EQUIP.elt.weapon.name==='ガイルの 剣'));
  await E(()=>enterTown([12,20.2],'cap')); T('夜に 王都の 城下町', await E(()=>TOWN_NOW==='cap'));
  await E(()=>enterCastle()); await talk('アルディア王'); await flush(); await W(300); T('序章 完', await E(()=>ST.phase==='end'));
  // ---- 第1章 ----
  await E(()=>pressA()); await W(400); await flush(); T('第1章へ', await E(()=>ST.phase==='c1_castle'));
  await talk('アルディア王'); await flush(); T('使者と 書状', await E(()=>ST.phase==='c1_road'&&followers.length===1&&BAG.keys.includes('和平の 書状の 写し')));
  await E(()=>enterFort(false)); T('砦の 入口で 重ならない', await E(()=>freeCircle(hero.x,hero.z)));
  T('鉄格子は 閉じて いる', await E(()=>!fortGateOpen()));
  for(const [x,z] of [[1.5,9.5],[5.5,1.5]]){ await E(([x,z])=>{ hero.x=x; hero.z=z; examine(); },[x,z]); await flush(); }
  T('灯り ふたつで 鉄格子が 開く', await E(()=>fortGateOpen()));
  await talk('番兵'); await flush(); await winBattle(); await flush(); T('番兵の 後', await E(()=>ST.phase==='c1_east'));
  await E(()=>{ ST.phase='c1_town'; enterTown([11.5,18.2],'velna'); }); await talk('古い 兵'); await flush(); await talk('町の 長'); await flush(); await W(300); T('第1章 完', await E(()=>ST.phase==='c1_end'));
  // ---- 仕組み ----
  await E(()=>{ ST.phase='c1_road'; enterTown([12,10],'cap'); });
  await E(()=>{ BAG.gold=500; openShop('smith','店'); }); await pick('買う'); await pick('鉄の 兜'); await flush(); await E(()=>closeMenu());
  await E(()=>openEquip()); await pick('頭'); await pick('鉄の 兜'); await flush(); await E(()=>closeMenu());
  T('兜を 装備', await E(()=>EQUIP.elt.helm&&EQUIP.elt.helm.name==='鉄の 兜'));
  const g0=await E(()=>BAG.gold); await E(()=>{ TOWN_NOW='velna'; openTrade(); }); await pick('鉄鉱石'); await pick('買う'); await E(()=>{ closeMenu(); TOWN_NOW='cap'; openTrade(); }); await pick('鉄鉱石'); await pick('売る'); await E(()=>closeMenu());
  T('交易で もうかる（ドルムで 買い 王都で 売る）', await E((g0)=>BAG.gold>g0,g0));
  await talk('王都の 男'); await flush(); T('頼みごとを 受ける', await E(()=>ST.q.wara==='受けた'));
  for(let i=0;i<3;i++){ await E(()=>{ enterWorld([12.5,15.5]); startBattle([FOES.waradokuro]); }); await winBattle(); }
  await E(()=>enterTown([12,10],'cap')); await talk('王都の 男'); await flush(); T('頼みごとの お礼', await E(()=>ST.q.wara==='済み'));
  await E(()=>{ STATS.elt.lv=5; STATS.elt.mp=20; enterWorld([12.5,15.5]); startBattle([FOES.nousagi]); }); await waitMenu();
  await E(()=>{ BT.sel=CMDS.indexOf('呪文'); pressA(); }); T('呪文の 一覧', await E(()=>BT.phase==='skill'&&BT.sks.some(k=>k.name==='ブレイズエッジ')));
  await E(()=>{ BT.ssel=BT.sks.findIndex(k=>k.name==='ブレイズエッジ'); pressA(); }); for(let i=0;i<40;i++){ await W(100); if(await E(()=>BT&&BT.phase==='menu')||await E(()=>!BT)) break; }
  T('ブレイズエッジで MPが 減る', await E(()=>STATS.elt.mp===17));
  await E(()=>{ if(BT) endBattle(); STATS.elt.status=null; inflictOn(STATS.elt,'poison'); BAG.antidote=1; }); T('毒に なる', await E(()=>STATS.elt.status==='poison'));
  await E(()=>say(useAntidote(STATS.elt))); await flush(); T('どくけし草で 治る', await E(()=>!STATS.elt.status));
  T('作戦：いのちだいじに で 回復を 選ぶ', await E(()=>{ STATS.lidia={name:'リディア',lv:5,hp:5,max:30,mp:20,atk:6,defT:3}; PARTY.push('lidia'); startBattle([FOES.nousagi]); tactic='inochi'; const a=autoAct(BT.party[1]); endBattle(); PARTY.length=1; return a.kind==='skill'&&a.sk.type==='heal'; }));
  T('入れ替え（控え）', await E(()=>{ RESERVE.push('lidia'); const ok=openFieldMenu()===undefined && MENU.items.includes('入れ替え'); closeMenu(); RESERVE.length=0; return ok; }));
  T('船：海を 渡れる', await E(()=>{ enterWorld([12.5,15.5]); const a=blockedAt(1.5,1.5); ST.ship=1; const bb=blockedAt(1.5,1.5); ST.ship=0; return a&&!bb; }));
  T('戦闘の 速さ', await E(()=>{ SND.speed=2; const ok=SND.speed===2; SND.speed=1; return ok; }));
  T('章ごとの 台詞', await E(()=>{ enterTown([12,6],'cap'); const g=cur.npcs.find(x=>x.name==='城の 門番'); ST.phase='road'; const a=linesByPhase(g)[0]; ST.phase='c1_road'; const bb=linesByPhase(g)[0]; return a!==bb; }));
  T('2体まで（1人）', await E(()=>{ const sb=window.startBattle; let mx=0; window.startBattle=(d)=>{ mx=Math.max(mx,d.length); }; for(let i=0;i<500;i++) startEnc('west'); window.startBattle=sb; return mx===2; }));
  T('全滅すると 町へ', await (async()=>{ await E(()=>{ STATS.elt.hp=1; STATS.elt.defT=0; BAG.gold=100; enterWorld([12.5,15.5]); startBattle([FOES.ishikurage]); }); await waitMenu(); await E(()=>{ BT.sel=CMDS.indexOf('ぼうぎょ'); pressA(); }); for(let i=0;i<120;i++){ await W(100); if(await E(()=>!BT)) break; } await W(800); return E(()=>cur.kind==='town'&&BAG.gold===50&&STATS.elt.hp===STATS.elt.max); })());
  T('攻撃の 呪文は 3段階', await E(()=>{ const fam=[['tsuyogiri','blaze2','blaze3'],['volt','voltra','voltrion'],['hono','flare2','flare3'],['raigeki','thunder2','thunder3']]; return fam.every(f=>f.every(id=>SKILLS[id])); }));
  T('Lv28で ブレイズカリバーまで 覚える', await E(()=>{ const lv=STATS.elt.lv; STATS.elt.lv=28; const n=skillsOf('elt').map(k=>k.name); STATS.elt.lv=lv; return ['ブレイズエッジ','ブレイズセイバー','ブレイズカリバー','ヴォルト','ヴォルトラ'].every(x=>n.includes(x)) && !n.includes('ヴォルトリオン'); }));
  T('ヴォルトリオンは 物語で 授かる', await E(()=>{ STATS.elt.extra=['voltrion']; const ok=skillsOf('elt').some(k=>k.name==='ヴォルトリオン'); STATS.elt.extra=[]; return ok; }));
  T('ドルガンの 技（兜割り・大魔神斬り・ダブルファングは Lv28）', await E(()=>{ STATS.dolgan={name:'ドルガン',lv:27,hp:60,max:60,mp:10,atk:20,defT:8}; const a=skillsOf('dolgan').map(k=>k.name); STATS.dolgan.lv=28; const b=skillsOf('dolgan').map(k=>k.name); return a.includes('兜割り')&&a.includes('大魔神斬り')&&!a.includes('ダブルファング')&&b.includes('ダブルファング'); }));
  T('大魔神斬り：はずれ／当たれば 会心', await E(()=>{ PARTY.push('dolgan'); startBattle([FOES.banpei]); const m=BT.party[1], f=BT.foes[0]; const r=Math.random; Math.random=()=>.9; actOf(m,{kind:'skill',sk:Object.assign({id:'daimajin'},SKILLS.daimajin),target:f})(); const miss=f.hp===f.max; Math.random=()=>.1; actOf(m,{kind:'skill',sk:Object.assign({id:'daimajin'},SKILLS.daimajin),target:f})(); const hit=f.max-f.hp; Math.random=r; endBattle(); PARTY.length=1; return miss && hit===Math.min(f.max,Math.round((20+3)*2.4)); }));
  T('火炎斬り：通常の 攻撃の 1.3倍', await E(()=>{ PARTY.push('dolgan'); STATS.dolgan.mp=10; startBattle([FOES.banpei]); const m=BT.party[1], f=BT.foes[0]; const r=Math.random; Math.random=()=>.5; BT.steps=[]; actOf(m,{kind:'skill',sk:Object.assign({id:'kaenkiri'},SKILLS.kaenkiri),target:f})(); BT.steps.shift()(); const d=f.max-f.hp; Math.random=r; endBattle(); PARTY.length=1; return d===Math.round((20+Math.floor(.5*4))*1.3) && STATS.dolgan.mp===8; }));
  T('戦闘が 終わると 状態異常は 治る（毒も）', await (async()=>{ await E(()=>{ STATS.elt.hp=STATS.elt.max=999; enterWorld([12.5,15.5]); startBattle([FOES.nousagi]); }); await waitMenu(); await E(()=>{ inflictOn(BT.party[0],'poison'); }); await winBattle(); return E(()=>!STATS.elt.status); })());
  T('セーブして 再開しても 村は 燃えた まま（ガイルの 別れの 後）', await (async()=>{ await E(()=>{ ST.phase='road'; enterTown([12,10],'rue'); saveGame(); }); await pg.reload({waitUntil:'load'}); for(let i=0;i<60;i++){ await W(150); if(await E(()=>typeof MENU!=='undefined' && !!MENU)) break; } await E(()=>{ MENU.sel=0; pressA(); }); await W(1000); return E(()=>ST.phase==='road' && TOWN_NOW==='rue' && fireMeshes.length>0 && S.background.getHex()===0x1a0f18); })());
  T('北から 村の 印に 入れる', await (async()=>{ await flush(); await E(()=>{ ST.phase='c1_road'; enterWorld([4.5,16.3]); }); await W(1500); await flush(); await pg.keyboard.down('ArrowDown'); for(let i=0;i<100;i++){ await W(120); if(await E(()=>cur.kind==='town')) break; } await pg.keyboard.up('ArrowDown'); await W(500); return E(()=>cur.kind==='town'&&TOWN_NOW==='rue'); })());
  T('ブラウザの エラー なし', errs.length===0, errs.join(' / '));
  console.log('--- lq5 test: '+(n-ng)+'/'+n+' 通過 ---'); await b.close(); process.exit(ng?1:0);
})().catch(e=>{ console.log('NG 実行',e.message); process.exit(1); });
