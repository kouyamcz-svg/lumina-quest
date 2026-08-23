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
T('はじまりは 地上', C.P.map==='ground', C.P.map+' '+C.P.x+','+C.P.y);
T('章データが ひける', C.chData() && C.chData().id==='ch3_ground');
T('ノエが いる', C.party.length===3 && C.party[2].cls==='noe');

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
stand('ice_camp', 8, 8, 'back');
C.stepField(0,-1);
T('氷窟へ 入れる', C.P.map==='ice_cave', C.P.map+' '+C.P.x+','+C.P.y);
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
T('見たく ない 夢だと 言う', said('見たく ない 夢'));
T('連れて 帰ろうと 言う', said('氷の谷へ 連れて 帰ろう'));

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
