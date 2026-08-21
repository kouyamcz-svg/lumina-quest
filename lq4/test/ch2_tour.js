'use strict';
// ルミナクエストIV / 第2章 通しテスト
// 使い方： node test/ch2_tour.js
//   上層区で 任務 → 庭園でノエ加入 → 炉の外郭（灯り・中ボス）→ フォルナクス → 章末
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
// ★一枚絵の 出し入れも 見る
const scene=[];
C.bind(Object.assign({}, C.NullView, {
        showScene(k){ scene.push('show:'+k); },
        hideScene(){ scene.push('hide'); },
       }),
       {msg(l,d){ l.forEach(x=>log.push(x)); d&&d(); },
                    menu(i,t,cb){ cb(t==='これから' ? 1 : 0); },
                    hud(){}, label(){}, openTrade(){}}, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>l.indexOf(w)>=0); }
function clearLog(){ log.length=0; }
function stand(map,x,y,dir){ C.G.mode='field'; C.P.map=map; C.P.x=x; C.P.y=y; if(dir) C.P.dir=dir; }
function talk(map,x,y,dir){ clearLog(); stand(map,x,y,dir); C.interact(); }
function strong(lv){                       // ものがたりの たしかめ用（まぐれ負けを ふせぐ）
  C.G.tactic='gungan'; C.party.length=0;
  const io=C.mkMember('io',lv), se=C.mkMember('seren',lv), no=C.mkMember('noe',lv);
  io.weapon={kind:'w',name:'剣',v:16}; io.armor={kind:'a',name:'胴',v:14};
  se.weapon={kind:'w',name:'槍',v:18}; se.armor={kind:'a',name:'胸当',v:15};
  no.weapon={kind:'w',name:'杖',v:9};  no.armor={kind:'a',name:'衣',v:11};
  C.party.push(io,se,no); C.P.herbs=12;
}

// ===== 1. 第2章を はじめる =====
C.freshState();
C.party.length=0;
C.party.push(C.mkMember('io',13)); C.party.push(C.mkMember('seren',13));
C.G.flags.ch1_cleared = true;
C.switchChapter(3);
T('第2章に なる', C.G.chapter===3);
T('はじまりは 中層区', C.P.map==='mid_dist', C.P.map+' '+C.P.x+','+C.P.y);
T('章データが ひける', C.chData() && C.chData().id==='ch2_furnace');
T('上層への 石段が 通る', !C.wardBlocks('upper_dist'));

// ===== 2. 上層区へ =====
stand('mid_dist', 10, 1, 'back');
C.stepField(0,-1);
T('上層区へ 入れる', C.P.map==='upper_dist', C.P.map+' '+C.P.x+','+C.P.y);
T('上層区の めじるしが たつ', C.G.flags.ch2_enteredUpper===true);

// ===== 3. 天空城へは まだ 行けない =====
talk('upper_dist', 10, 1, 'back');
T('天空城で 断られる', said('城へは 通せん'), log.join(' / ').slice(0,60));

// ===== 4. 炉の 主任から 任務 =====
talk('upper_dist', 9, 5, 'back');
T('任務を うける', C.G.flags.ch2_taskTaken===true);
T('「減っている」と 言う', said('減っている'), log.join(' / ').slice(0,90));
T('クエストが たつ', C.G.quests.ch2_q1_dim==='active');
T('庭園への 道を 教えて くれる', said('西の 門'), log.join(' / ').slice(-80));

// ===== 5. 案内が いないと 炉へ 入れない =====
stand('upper_dist', 17, 9, 'front');
C.stepField(0,1);
T('案内なしでは 炉へ 行けない', C.P.map==='upper_dist', C.P.map);
T('庭園へ 行けと 言われる', said('庭園に いる'), log.join(' / ').slice(0,60));

// ===== 6. 空中庭園：ノエが 仲間に =====
stand('upper_dist', 1, 7, 'left');
C.stepField(-1,0);
T('庭園へ 入れる', C.P.map==='garden', C.P.map+' '+C.P.x+','+C.P.y);
talk('garden', 13, 6, 'back');
T('ノエが 仲間に なる', C.party.length===3 && C.party[2].cls==='noe',
  C.party.map(p=>p.cls).join(','));
T('夢守りの 家だと 名のる', said('夢守りの 家の 者'), log.join(' / ').slice(0,90));
T('話せない ことが 多いと 言う', said('話せない ことが 多いんだ'));
// ★3人めは trail[1] を 見る。さきあたまに 入れると 2人めが うけとって しまい、
//   あたらしい なかまが 主人公の うしろへ ワープした。
T('ノエが その場に 立ったまま 仲間に なる',
  C.G.trail[1] && C.G.trail[1][0]===13 && C.G.trail[1][1]===5,
  JSON.stringify(C.G.trail.slice(0,2)));
T('セレンの いちは 変わらない',
  C.G.trail[0] && !(C.G.trail[0][0]===13 && C.G.trail[0][1]===5),
  JSON.stringify(C.G.trail[0]));

// ===== 7. グランの 妻 =====
talk('garden', 9, 3, 'back');
T('妻の 場面が 出る', C.G.flags.ch2_wifeSeen===true);
T('三年 前から だと わかる', said('三年 前から'), log.join(' / ').slice(0,80));
T('毎日 来て 帰ると わかる', said('何も 言わずに 帰られる'));
T('ノエが 起きて いないと 言う', said('この 人、起きてない'));

// ===== 7.5 わき道：雲見の 塔 =====
//   ★庭番は 妻の 場面を 見てから 話す
talk('garden', 5, 13, 'back');
T('雲が 薄れて いると 聞く', C.G.flags.ch2_towerTold===true);
T('雲は 減らない はずだと 言う', said('炉の 光が 冷えて できる'), log.join(' / ').slice(0,140));
T('クエストが たつ', C.G.quests.ch2_q3_tower==='active');
T('塔への 入口が ひらく', C.tileAt('garden',1,13)==='D', C.tileAt('garden',1,13));

stand('garden', 2, 13, 'left');
C.stepField(-1,0);
T('塔へ 入れる', C.P.map==='watchtower', C.P.map+' '+C.P.x+','+C.P.y);
T('塔の めじるしが たつ', C.G.flags.ch2_enteredTower===true);

talk('watchtower', 2, 15, 'back');
T('見張りの 話を 聞く', C.G.flags.ch2_watchHeard===true);
T('十年前に 炉を 止めた 話', said('十年 前に 一度'), log.join(' / ').slice(0,180));
T('黒い 海が 見えた 話', said('黒い 海'));

T('はじめは 仕切りが しまっている', C.tileAt('watchtower',7,11)==='K', C.tileAt('watchtower',7,11));
talk('watchtower', 7, 12, 'back');
T('あけかたが 出る', said('灯を 二基'), log.join(' / ').slice(0,60));
stand('watchtower', 3, 9, 'left'); C.interact();
T('灯り ひとつでは 開かない', C.tileAt('watchtower',7,11)==='K');
stand('watchtower', 11, 9, 'right'); C.interact();
T('灯り ふたつで 開く', C.tileAt('watchtower',7,11)==='.', C.tileAt('watchtower',7,11));

clearLog(); strong(24);
stand('watchtower', 7, 5, 'back');
C.interact();
T('そらくらいの 名が 出る', said('そらくらい'), log.join(' / ').slice(0,150));
T('雲を 食べて いると 言う', said('雲を 食べてる'));
T('炉の ものと 同じ たぐいだと 言う', said('同じ 腹から 出た'));
T('そらくらいに かてる', C.G.flags.ch2_skyeaterDown===true);
T('食べられた ぶんは 戻らない', said('食べられた ものは 戻らないんだ'));

{
  const g=C.P.gold;
  C.party.forEach(p=>{ p.hp=1; });
  talk('watchtower', 2, 15, 'back');
  T('見張りに 報せる', C.G.flags.ch2_towerPaid===true);
  T('礼を もらえる', C.P.gold===g+800, C.P.gold+' ← '+g);
  T('手当てで 全快', C.party.every(p=>p.hp===p.maxhp));
  T('クエストが 片づく', C.G.quests.ch2_q3_tower==='clear');
}
stand('watchtower', 7, 18, 'front'); C.stepField(0,1);
T('庭園へ もどる', C.P.map==='garden', C.P.map);

// ===== 7.8 上層区で 買いものと 宿 =====
{
  C.P.gold = 9999;
  const g0 = C.P.gold;
  talk('upper_dist', 17, 5, 'back');
  T('上層区に 道具屋が ある', C.P.gold < g0, '買えなかった');
  C.party.forEach(p=>{ p.hp=1; p.mp=0; });
  talk('upper_dist', 3, 5, 'back');
  T('上層区に 宿が ある', C.party.every(p=>p.hp===p.maxhp), '泊まれなかった');
  T('宿の ねだんが 出る', said('40ゴールド'), log.join(' / ').slice(0,50));
}

// ===== 8. 炉の 外郭へ =====
stand('garden', 9, 13, 'front'); C.stepField(0,1);
T('上層区へ もどる', C.P.map==='upper_dist', C.P.map);
stand('upper_dist', 17, 9, 'front');
C.stepField(0,1);
T('炉の 外郭へ 入れる', C.P.map==='furnace', C.P.map+' '+C.P.x+','+C.P.y);
T('炉の めじるしが たつ', C.G.flags.ch2_enteredFurnace===true);

// ===== 9. 子供の 寝息 =====
talk('furnace', 12, 6, 'back');
T('寝息を 聞く', C.G.flags.ch2_heardBreath===true);
T('子供の 寝息だと 言う', said('子供の 寝息'), log.join(' / ').slice(0,90));
T('ノエが 話せないと 言う', said('ぼくの 家が 消される'));

// ===== 11. 灯り 2つで 隔壁が 上がる =====
T('はじめは 隔壁が しまっている', C.tileAt('furnace',10,6)==='K', C.tileAt('furnace',10,6));
talk('furnace', 10, 7, 'back');
T('あけかたが 出る', said('火口 二基'), log.join(' / ').slice(0,70));
stand('furnace', 4, 9, 'left'); C.interact();
T('灯り ひとつでは 開かない', C.tileAt('furnace',10,6)==='K');
stand('furnace', 20, 14, 'back'); C.interact();
T('灯り ふたつで 開く', C.tileAt('furnace',10,6)==='.', C.tileAt('furnace',10,6));

// ===== 12. フォルナクス =====
//   ★炉心の 壁に さわって からで ないと 進めない
{
  const keep = C.G.flags.ch2_heardBreath;
  C.G.flags.ch2_heardBreath = false;
  clearLog(); strong(26);
  stand('furnace', 10, 5, 'back'); C.interact();
  T('寝息を 聞く 前は ボスに 進めない', C.G.flags.ch2_fornaxDown!==true);
  T('先に 壁を さわれと 言われる', said('先に 壁に さわって'), log.join(' / ').slice(0,60));
  C.G.flags.ch2_heardBreath = keep;
}
clearLog(); strong(26);
stand('furnace', 10, 5, 'back');
C.interact();
T('炉座の 名が 出る', said('フォルナクス'), log.join(' / ').slice(0,120));
T('炉の 火を 食べて いると 言う', said('炉の 火を 食べてる'));
T('フォルナクスに かてる', C.G.flags.ch2_fornaxDown===true);
T('調べる 先が 示される', said('落ちた ものを 調べよう'));
T('倒した ますが しらべられる', C.tileAt('furnace',10,4)==='n', C.tileAt('furnace',10,4));

// ===== 13. 焦げていない 紙片 =====
talk('furnace', 10, 5, 'back');
T('紙片を 拾う', C.G.flags.ch2_gotScrap===true);
T('焦げて いないと わかる', said('焦げても いない'), log.join(' / ').slice(0,80));
T('つぎの 行き先が 出る', said('上層区の 主任に 報告しよう'));

// ===== 14. 主任へ 報告 =====
C.party.forEach(p=>{ p.hp=1; p.mp=0; });
const g0=C.P.gold;
talk('upper_dist', 9, 5, 'back');
T('報告できる', C.G.flags.ch2_reported===true);
T('炉心の ぶんが 足りないと 言う', said('炉心の ぶんが 足りん'), log.join(' / ').slice(-90));
T('鍵は 城に あると 言う', said('鍵は 城に ある'));
T('手当てで 全快', C.party.every(p=>p.hp===p.maxhp));
T('礼を もらえる', C.P.gold===g0+600, C.P.gold+' ← '+g0);
T('クエストが 片づく', C.G.quests.ch2_q2_core==='clear');

// ===== 15. 章末：夢の 切れはし =====
clearLog(); C.G.tactic='manual';
C.triggerChapterEnd();
T('章末が でる', said('夢の 切れはしだ'), log.join(' / ').slice(0,120));
T('捨てられた 夢だと 言う', said('捨てられた ぶん'));
T('千年 捨ててきたと 言う', said('千年'));
T('下から 戻って きていると 言う', said('下から'));
T('ch2_cleared が たつ', C.G.flags.ch2_cleared===true);
T('つぎの 行き先（雲海港）が 出る', said('東の 雲海港へ 向かおう'), log.join(' / ').slice(-70));
T('城では ない と はっきり する', said('城の 鍵は 下りない'));
// ★章末に 一枚絵が 出て、おわると 消える
T('章末に 一枚絵が 出る', scene.indexOf('show:scene_ch2_end')>=0, scene.join(' / '));
T('章末の あと 一枚絵が 消える', scene.indexOf('hide')>scene.indexOf('show:scene_ch2_end'),
  scene.join(' / '));

// ===== 16. セーブ/ロード =====
const gold=C.P.gold, lv=C.party[0].lv;
T('セーブできる', C.saveGame(0)===true, C.lastSaveError);
C.freshState();
T('ロードできる', C.loadGame(0)===true);
T('ロード：章が もどる', C.G.chapter===3);
T('ロード：3人 いる', C.party.length===3);
T('ロード：しかけが もどる', C.tileAt('furnace',10,6)==='.');
T('ロード：おかねが もどる', C.P.gold===gold);
T('ロード：Lvが もどる', C.party[0].lv===lv);

console.log('\n--- ch2_tour: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
