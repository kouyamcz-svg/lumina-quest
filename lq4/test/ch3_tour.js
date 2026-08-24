'use strict';
// ルミナクエストIV / 第3章（氷の谷）通しテスト
// 使い方： node test/ch3_tour.js
//   地上へ 降下 → 氷の谷 → 長の 依頼 → 氷窟（氷灯2つ）→ あくむへん →
//   リーゼを 連れ帰る → 子守唄 → 章末
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
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>String(l).indexOf(w)>=0); }
function clearLog(){ log.length=0; }
function stand(map,x,y,dir){ C.G.mode='field'; C.P.map=map; C.P.x=x; C.P.y=y; if(dir) C.P.dir=dir; }
function talk(map,x,y,dir){ clearLog(); stand(map,x,y,dir); C.interact(); }
function strong(lv){
  C.G.tactic='gungan'; C.party.length=0;
  ['io','seren','noe'].forEach((k,j)=>{
    const m=C.mkMember(k,lv);
    m.weapon={kind:'w',name:'w',v:[16,18,9][j]};
    m.armor ={kind:'a',name:'a',v:[14,15,11][j]};
    C.party.push(m);
  });
  C.P.herbs=12;
}

// ===== 1. 第3章を はじめる =====
C.freshState();
C.party.length=0;
['io','seren','noe'].forEach(k=>C.party.push(C.mkMember(k,20)));
C.G.flags.ch2_cleared = true;
C.switchChapter(4);
T('第3章に なる', C.G.chapter===4);
// ★天空から はじまり、港の 舟で 地上へ 降りる
T('はじまりは 天空（上層区）', C.P.map==='upper_dist', C.P.map+' '+C.P.x+','+C.P.y);
T('章データが ひける', C.chData() && C.chData().id==='ch3_ground');
T('ノエが いる', C.party.length===3 && C.party[2].cls==='noe');
T('まだ 地上に 降りて いない', !C.G.flags.ch3_landed);

// ===== 1.5 天空 → 雲海港 → 地上 =====
stand('upper_dist', 10, 13, 'front'); C.stepField(0,1);
T('上層区から 中層区へ', C.P.map==='mid_dist', C.P.map);
stand('mid_dist', 10, 13, 'front'); C.stepField(0,1);
T('中層区から 世界地図へ', C.P.map==='world', C.P.map+' '+C.P.x+','+C.P.y);
stand('world', 34, 18, 'back'); C.stepField(0,-1);
T('雲海港へ 入れる', C.P.map==='sky_port', C.P.map+' '+C.P.x+','+C.P.y);
T('港の めじるしが たつ', C.G.flags.ch3_atPort===true);

// ★桟橋の どこに 立っても 舟に とどく こと
//   ★1ますしか なくて、どこに 立てば よいか 分からなかった。
{
  const keep = C.G.flags.ch3_landed;
  [8,9,10].forEach(x=>{
    C.G.flags.ch3_landed = false;
    talk('sky_port', x, 12, 'front');
    T('桟橋('+x+',12)から 舟に とどく', said('桟橋の 先に'), log.join(' / ').slice(0,40));
  });
  C.G.flags.ch3_landed = keep;
}
talk('sky_port', 9, 12, 'front');
T('舟を しらべると 降下する', C.G.flags.ch3_landed===true);
T('番人が 四十年 磨いたと 言う', said('四十年 この 舟を 磨いてきた'), log.join(' / ').slice(0,140));
T('戻ってきた 者は いないと 言う', said('戻ってきた 者も おらんからな'));
T('地上は 重いと 言う', said('ここは 上より 重い'));
T('地上に 着いて いる', C.P.map==='ground', C.P.map+' '+C.P.x+','+C.P.y);

// ===== 2. 氷の谷へ =====
stand('ground', 48, 9, 'back');
C.stepField(0,-1);
T('氷の谷へ 入れる', C.P.map==='ice_camp', C.P.map+' '+C.P.x+','+C.P.y);
T('氷の谷の めじるしが たつ', C.G.flags.ch3_enteredIce===true);

// ===== 3. 氏族の 長 =====
talk('ice_camp', 9, 6, 'back');
T('長の 話を 聞く', C.G.flags.ch3_taskTaken===true);
T('毎年 来ると 言う', said('毎年 来る'), log.join(' / ').slice(0,100));
T('名を 覚える 気も ないと 言う', said('名を 覚える 気も ないだろう'));
T('リーゼが いないと 分かる', said('リーゼが いない'));
T('黒い ものだと 分かる', said('黒い ものが 見えたと'));
T('イオが 行くと 言う', said('こちらの 領分だ'));
T('クエストが たつ', C.G.quests.ch3_q1_rieze==='active');

// ===== 4. 氷窟へ =====
// ★氷窟は 集落の 外（東へ 5歩）
stand('ice_camp', 10, 13, 'front');
C.stepField(0,1);
T('集落を 出られる', C.P.map==='ground', C.P.map+' '+C.P.x+','+C.P.y);
// ★氷窟は 集落の 東（53,9）。手前(52,9)から 東へ ふむ。
stand('ground', 52, 9, 'right'); C.stepField(1,0);
T('東へ 歩くと 氷窟', C.P.map==='ice_cave', C.P.map+' '+C.P.x+','+C.P.y);
T('氷窟の めじるしが たつ', C.G.flags.ch3_enteredCave===true);

// ===== 5. 氷灯 2つで 氷が ゆるむ =====
T('はじめは 氷が 塞いで いる', C.tileAt('ice_cave',10,6)==='K', C.tileAt('ice_cave',10,6));
talk('ice_cave', 10, 7, 'back');
T('あけかたが 出る', said('氷灯'), log.join(' / ').slice(0,80));
stand('ice_cave', 3, 10, 'back'); C.interact();
T('ひとつでは 開かない', C.tileAt('ice_cave',10,6)==='K');
stand('ice_cave', 20, 18, 'back'); C.interact();
T('ふたつで 開く', C.tileAt('ice_cave',10,6)==='.', C.tileAt('ice_cave',10,6));

// ===== 6. あくむへん =====
clearLog(); strong(26);
stand('ice_cave', 10, 5, 'back');
C.interact();
T('少女が 眠って いる', said('少女が 横たわっていた'), log.join(' / ').slice(0,120));
T('上から 落ちた ものだと 言う', said('天空大陸から'));
T('地上にまで 漏れて いる', said('地上にまで 漏れて'));
T('あくむへんに かてる', C.G.flags.ch3_riezeSaved===true);
T('見せられると 言う', said('見せられる。捨てられた ぶんを'), log.join(' / ').slice(0,100));
T('かけらに 目が ある', said('目が ひとつ 開いていた'));
T('連れて 帰ろうと 言う', said('氏族の 長に 連れて 帰ろう'), log.join(' / ').slice(-90));
T('行き先（西）を 言う', said('氷窟を 出て 西へ'));

// ===== 7. リーゼを 連れ帰る =====
{
  const g0 = C.P.gold;
  C.party.forEach(p=>{ p.hp=1; });
  talk('ice_camp', 9, 6, 'back');
  T('長に 報せる', C.G.flags.ch3_riezeReturned===true);
  T('名を 名乗ったと 言う', said('名を 名乗ったのは あんたが 初めてだ'), log.join(' / ').slice(0,140));
  T('長が グルドと 名のる', said('わしは グルド'));
  T('礼を もらえる', C.P.gold===g0+2000, C.P.gold+' ← '+g0);
  T('手当てで 全快', C.party.every(p=>p.hp===p.maxhp));
  T('クエストが 片づく', C.G.quests.ch3_q1_rieze==='clear');
}

// ===== 8. サブ：眠らない 子守唄 =====
talk('ice_camp', 17, 6, 'back');
T('子守唄を 聞く', C.G.flags.ch3_lullaby===true);
T('唄の 文句が 出る', said('ここは　おまえの ねどこでは ない'), log.join(' / ').slice(0,160));
T('ノエの 家の 祝詞と 同じだと 言う', said('ぼくの 家の 祝詞と、同じ 節だ'));
T('逆の ことを して きた と 言う', said('逆の ことを して きたんだねえ'));

// ===== 9. サブ：セレンと 谷の 子ら =====
talk('ice_camp', 13, 10, 'back');
T('セレンが 槍を 教える', C.G.flags.ch3_serenTaught===true);
T('「重い者」の 話が 出る', said('重い者'), log.join(' / ').slice(0,140));
T('重いのは わたしの ほうだったと 言う', said('重いのは、たぶん わたしの ほうだった'));

// ===== 9.5 湧き水の町（西）=====
stand('ground', 9, 30, 'back');
C.stepField(0,-1);
T('湧き水の町へ 入れる', C.P.map==='well_town', C.P.map+' '+C.P.x+','+C.P.y);

talk('well_town', 3, 6, 'back');
T('東の 長の 話を 聞く', C.G.flags.ch3_wellTold===true);
T('どちらかが 嘘だと 言う', said('どちらかが 嘘を ついとる'), log.join(' / ').slice(0,120));
T('どちらも 本当かもと 返す', said('どちらも 本当かも しれません'));
T('クエストが たつ', C.G.quests.ch3_q2_well==='active');

stand('well_town', 12, 8, 'back');
C.stepField(0,-1);
T('地下水路へ 入れる', C.P.map==='well_cave', C.P.map);

T('はじめは 土の 壁', C.tileAt('well_cave',10,6)==='K', C.tileAt('well_cave',10,6));
talk('well_cave', 10, 7, 'back');
T('三の 水脈の 話が 出る', said('三の 水脈'), log.join(' / ').slice(0,70));
stand('well_cave', 3, 10, 'back'); C.interact();
T('ひとつでは 開かない', C.tileAt('well_cave',10,6)==='K');
stand('well_cave', 20, 14, 'back'); C.interact();
T('ふたつで 開く', C.tileAt('well_cave',10,6)==='.', C.tileAt('well_cave',10,6));

clearLog(); strong(26);
stand('well_cave', 10, 5, 'back');
C.interact();
T('水脈の ぬしに かてる', C.G.flags.ch3_veinFound===true);
T('吸って いたと 言う', said('吸って いたんだ'), log.join(' / ').slice(0,120));
T('報せに 行けと 出る', said('集落長に 報せよう'));

{
  const g0 = C.P.gold;
  C.party.forEach(p=>{ p.hp=1; });
  talk('well_town', 3, 6, 'back');
  T('集落長に 報せる', C.G.flags.ch3_wellSolved===true);
  T('真ん中の 井戸だと 言う', said('真ん中だ。どちらの ものでも ない'), log.join(' / ').slice(0,140));
  T('両方の ものだと 言う', said('両方の ものだろう'));
  T('礼を もらえる', C.P.gold===g0+2400, C.P.gold+' ← '+g0);
  T('クエストが 片づく', C.G.quests.ch3_q2_well==='clear');
}

talk('well_town', 11, 11, 'back');
T('はじまりの 隊商', C.G.flags.ch3_caravan===true);
T('動いた ものに 名が つくと 言う', said('動いた ものに、あとから 名が つく'), log.join(' / ').slice(0,140));
T('余所者どうしが 組むと 道が できる', said('余所者どうしが 組むと、道が できる'));

// ===== 9.7 珊瑚の入り江（南）=====
stand('ground', 54, 59, 'back');
C.stepField(0,-1);
T('珊瑚の入り江へ 入れる', C.P.map==='coral_bay', C.P.map+' '+C.P.x+','+C.P.y);

talk('coral_bay', 11, 10, 'back');
T('ナミに 会う', C.G.flags.ch3_namiMet===true);
T('上層区を 夢で 見たと 言う', said('白い 石の 街'), log.join(' / ').slice(0,140));
T('セレンが 上層区だと 気づく', said('上層区だわ'));
T('ノエが 夢視だと 見抜く', said('夢視だ'));
T('逆の 家だと 言う', said('逆の 家だ'));
T('クエストが たつ', C.G.quests.ch3_q3_nami==='active');

stand('coral_bay', 11, 8, 'back');
C.stepField(0,-1);
T('海蝕洞へ 入れる', C.P.map==='sea_cave', C.P.map);

T('はじめは 潮が 満ちて いる', C.tileAt('sea_cave',10,6)==='K', C.tileAt('sea_cave',10,6));
stand('sea_cave', 3, 10, 'back'); C.interact();
T('ひとつでは 引かない', C.tileAt('sea_cave',10,6)==='K');
stand('sea_cave', 20, 14, 'back'); C.interact();
T('ふたつで 潮が 引く', C.tileAt('sea_cave',10,6)==='.', C.tileAt('sea_cave',10,6));

clearLog(); strong(28);
stand('sea_cave', 10, 5, 'back');
C.interact();
T('洞の ぬしに かてる', C.G.flags.ch3_namiSaved===true);
T('まだ 見て ない だけと 言う', said('まだ 見て ない だけの ものだ'), log.join(' / ').slice(0,140));
T('見た から 見つかったと 言う', said('見た から 見つかった'));

{
  const g0 = C.P.gold;
  C.party.forEach(p=>{ p.hp=1; });
  talk('coral_bay', 11, 10, 'back');
  T('浜に 報せる', C.G.flags.ch3_namiTold===true);
  T('先に 見ただけだと 言う', said('先に 見ただけだ'), log.join(' / ').slice(0,140));
  T('呪いじゃ ないと 言う', said('あなたの 力は 呪いじゃ ない'));
  T('礼を もらえる', C.P.gold===g0+2800, C.P.gold+' ← '+g0);
  T('クエストが 片づく', C.G.quests.ch3_q3_nami==='clear');
}

talk('coral_bay', 11, 10, 'back');
T('ふたつの 家が 話す', C.G.flags.ch3_twoHouses===true);
T('捨てる さきが 下だと 言う', said('……下に'), log.join(' / ').slice(0,160));
T('返して ほしいのかもと 言う', said('返して ほしいって ことかな'));
T('力の 使い方は 選べる', said('力の 使い方は、選べる のかも しれない'));
T('目は 見られるのを 待って いる', said('見られるのを 待ってる'), log.join(' / ').slice(0,160));

// ===== 10. 章末 =====
clearLog(); C.G.tactic='manual';
C.triggerChapterEnd();
T('章末が でる', said('千年ぶんが、下に 落ちてる'), log.join(' / ').slice(0,160));
T('リーゼが 目を 覚ます', said('リーゼが 目を 覚ましたわ'));
T('唄で 起きたと 分かる', said('唄を 歌ったら'));
T('つぎの 行き先が 出る', said('巡回降下 第二区'));
T('ch3_iceDone が たつ', C.G.flags.ch3_iceDone===true);

// ===== 11. セーブ/ロード =====
const gold=C.P.gold, lv=C.party[0].lv;
T('セーブできる', C.saveGame(0)===true, C.lastSaveError);
C.freshState();
T('ロードできる', C.loadGame(0)===true);
T('ロード：章が もどる', C.G.chapter===4);
T('ロード：3人 いる', C.party.length===3);
T('ロード：しかけが もどる', C.tileAt('ice_cave',10,6)==='.');
T('ロード：おかねが もどる', C.P.gold===gold);
T('ロード：Lvが もどる', C.party[0].lv===lv);

console.log('\n--- ch3_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
