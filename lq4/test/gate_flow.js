'use strict';
// ルミナクエストIV / 「一度の 会話で 先へ すすめるか」の けんしょう
// 使い方： node test/gate_flow.js
//
// ★書いた りゆう：技師に 会話が 何本も あり、さきに 合う ものが えらばれる ため、
//   「父の 話」だけが 出て 手間賃の 会話に とどかず、依頼を すませた はずなのに
//   試験場の 門が 開かない ことが あった。
//   遊ぶ 手順を そのまま なぞって、どの 道すじでも 詰まらない ことを たしかめる。
const fs = require('fs'), vm = require('vm');
// ★セーブ／ロードも ためす ので、記憶を 用意する
const __store = {};
const __ls = {getItem:k=>(k in __store?__store[k]:null),
              setItem:(k,v)=>{__store[k]=String(v);},
              removeItem:k=>{delete __store[k];}};
const ctx = {console, window:{}, localStorage:__ls}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
const log=[];
C.bind(C.NullView, {msg(l,d){ l.forEach(x=>log.push(x)); d&&d(); }, menu(i,t,cb){cb(0);},
                    hud(){}, label(){}}, C.NullAudio);

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }
function said(w){ return log.some(l=>l.indexOf(w)>=0); }

function talkGishi(){
  log.length=0;
  C.G.mode='field'; C.P.map='lower_dist'; C.P.x=5; C.P.y=6; C.P.dir='back';
  C.interact();
}
function seeMaw(){
  C.G.mode='field'; C.P.map='pipe_path'; C.P.x=8; C.P.y=8; C.P.dir='back';
  C.interact();
}
function kill(k){
  C.P.map='pipe_path';
  for(let i=0;i<k;i++){ C.G.mode='field'; C.startBattle();
    C.party.forEach(p=>{ p.hp=p.maxhp; p.mp=p.maxmp; }); }
}

// ============ みちすじ A：あぎとを 見てから 3体 たおして 報告 ============
{
  C.freshState(); C.G.tactic='gungan';
  talkGishi();
  T('A 依頼を うける', C.G.flags.ch0_errandTaken===true);
  seeMaw();
  T('A あぎとに 出会う', C.G.flags.ch0_mawFled===true);
  kill(3);
  T('A ノルマ たっせい', C.G.flags.ch0_errandDone===true);
  const g=C.P.gold;
  talkGishi();
  T('A 一度の 会話で 手間賃を もらえる', C.P.gold===g+120, C.P.gold+' ← '+g);
  T('A 一度の 会話で 父の 話も 出る', said('お前の 父さんが、同じ ことを'));
  T('A 一度の 会話で 門が 開く', !C.wardBlocks('trial_yard'));
  T('A クエストが 片づく', C.G.quests.ch0_q0_errand==='clear');
}

// ============ みちすじ B：3体 たおしてから あぎとを 見て 報告 ============
{
  C.freshState(); C.G.tactic='gungan';
  talkGishi(); kill(3);
  T('B ノルマ たっせい', C.G.flags.ch0_errandDone===true);
  seeMaw();
  const g=C.P.gold;
  talkGishi();
  T('B 一度の 会話で 手間賃を もらえる', C.P.gold===g+120, C.P.gold+' ← '+g);
  T('B 一度の 会話で 門が 開く', !C.wardBlocks('trial_yard'));
}

// ============ みちすじ C：あぎとを 見ずに 3体だけ たおして 報告 ============
{
  C.freshState(); C.G.tactic='gungan';
  talkGishi(); kill(3);
  const g=C.P.gold;
  talkGishi();
  T('C 一度の 会話で 手間賃を もらえる', C.P.gold===g+120, C.P.gold+' ← '+g);
  T('C 一度の 会話で 門が 開く', !C.wardBlocks('trial_yard'));
  T('C 父の 話は まだ 出ない', !C.G.flags.ch0_mawTold);
  // あとから あぎとを 見て 報告 すれば 父の 話が 出る
  seeMaw(); talkGishi();
  T('C あとから 父の 話が 出る', C.G.flags.ch0_mawTold===true);
}

// ============ ふるい セーブでも 人が 二重に ならない か ============
//   ★立ち位置を まとめる 前の セーブだと、仲間の セレンと
//     地図の セレンが 2人 ならんで 見えた。一度 話せば 直る こと。
{
  C.freshState();
  ['ch0_errandPaid','ch0_started','ch0_trialDone','ch0_sparDone','ch0_serenJoined']
    .forEach(f=>C.G.flags[f]=true);
  C.setTile('trial_yard',9,4,'n');          // 地図に のこった セレン
  C.party.push(C.mkMember('seren',3));      // すでに 仲間
  T('ふるい セーブ：地図にも いる', C.tileAt('trial_yard',9,4)==='n');
  log.length=0;
  C.G.mode='field'; C.P.map='trial_yard'; C.P.x=9; C.P.y=5; C.P.dir='back';
  C.interact();
  T('話すと 地図から 消える', C.tileAt('trial_yard',9,4)==='.', C.tileAt('trial_yard',9,4));
  T('見おくりの ことばが 出る', said('日が 暮れる'), log.join(' / ').slice(0,50));
  T('仲間は そのまま', C.party.length===2 && C.party[1].cls==='seren');
}

// ============ 「行けと 言われた 先」が その 時点で できて いるか ============
//   ★2つの 会話に 分けて いた ため、1回 話した だけでは
//     点検路に 群れが 置かれず、行っても 誰も いなかった。
{
  C.freshState(); C.G.chapters={}; C.switchChapter(2);
  C.G.flags.ch1_taskTaken = true;
  log.length=0;
  C.G.mode='field'; C.P.map='lower_dist'; C.P.x=5; C.P.y=6; C.P.dir='back';
  C.interact();
  T('技師の 話は 一度で 済む', C.G.flags.ch1_pipeTold && C.G.flags.ch1_swarmTold,
    JSON.stringify({pipe:C.G.flags.ch1_pipeTold, swarm:C.G.flags.ch1_swarmTold}));
  T('言われた 先に 群れが いる', C.tileAt('pipe_path',8,7)==='B', C.tileAt('pipe_path',8,7));
  T('言われた 先の 昇降口が 開く', C.tileAt('lower_dist',1,13)==='D', C.tileAt('lower_dist',1,13));
  T('点検路の クエストが たつ', C.G.quests.ch1_q5_swarm==='active');
}

// ============ 仲間に なった 人は その場に のこる ============
//   ★party[k] が 見るのは trail[k-1]。さきあたまに 入れると
//     2人めが うけとって しまい、3人めが うしろへ ワープした。
{
  C.freshState(); C.G.chapters={}; C.switchChapter(3);
  C.G.flags.ch2_taskTaken = true;
  // じっさいに 庭園を あるいて ノエの となりへ
  C.G.mode='field'; C.P.map='garden'; C.P.x=13; C.P.y=8; C.G.trail=[[13,9],[13,9]];
  C.G.mode='field'; C.stepField(0,-1);
  C.G.mode='field'; C.stepField(0,-1);
  const before = C.G.trail[0].slice();
  C.G.mode='field'; C.P.dir='back'; C.interact();
  T('3人に なる', C.party.length===3 && C.party[2].cls==='noe', C.party.map(p=>p.cls).join(','));
  T('あたらしい 人が その場に のこる',
    C.G.trail[1] && C.G.trail[1][0]===13 && C.G.trail[1][1]===5,
    JSON.stringify(C.G.trail.slice(0,2)));
  T('もとから いた 人は うごかない',
    C.G.trail[0][0]===before[0] && C.G.trail[0][1]===before[1],
    JSON.stringify(C.G.trail[0])+' ← '+JSON.stringify(before));
  C.G.mode='field'; C.stepField(0,1);
  T('うごくと 順に ついてくる',
    C.G.trail[0][0]===13 && C.G.trail[0][1]===6,
    JSON.stringify(C.G.trail.slice(0,2)));
}

// ============ 世界地図から 早く 行けて しまわないか ============
//   ★世界地図の ちてんを 実マップに つないだ とき、けっかいを 付け忘れると
//     序章の うちに 第2章の ばしょへ 入れて しまう。
{
  // ★「どこは 何章から」を ここに 書いて おく。
  //   けっかいを 消しても この 表と 合わなく なって 落ちる。
  const FROM = {
    lower_dist: 1,   // 序章から
    pipe_path:  1,
    mid_dist:   1,
    world:      1,
    garden:     3,   // 第2章から（上層区の 中）
    furnace:    3,   // 第2章から（さらに 案内が いる）
    watchtower: 3,
    upper_dist: 3,
    mid_post:   2, mid_arch: 2, old_pipe: 2,
    // ---- 第3章：雲海港と 地上 ----
    sky_port:   4,   // 第3章から（降下の 出発点）
    ground:     4, ice_camp: 4, ice_cave: 4,
    well_town:  4, well_cave: 4, coral_bay: 4, sea_cave: 4,
    furnace_core: 3,
    trial_yard: 1, rift_yard: 1, home_forge: 1,
  };
  const W = C.MAPS.world.warpsXY || {};
  Object.keys(W).forEach(k=>{
    const to = W[k].to;
    const need = FROM[to];
    T('行き先の 章が きめて ある '+to, need!==undefined, '表に ない');
    if(need===undefined || need<=1) return;
    for(let no=1; no<need; no++){
      C.freshState(); C.G.chapter = no;
      const cd0 = vm.runInContext('CHAPTERS_DATA', ctx).CH[no];
      ((cd0 && cd0.setFlags) || []).forEach(f=>C.G.flags[f]=true);
      T('第'+(no-1)+'章では 世界地図から '+to+' へ 行けない', C.wardBlocks(to),
        '早く 入れて しまう（'+k+'）／けっかいを 付け忘れて いない か');
    }
  });
}

// ============ 入口が ふたつ ある ばしょは 出口に back を つける ============
//   ★炉の 外郭・空中庭園は 世界地図と 上層区の 両方から 入れるのに、
//     出口が かためがき で、外から 入っても 上層区に 出て いた。
{
  // どの マップへ どこから 入れるか
  const inTo = {};
  Object.keys(C.MAPS).forEach(mp=>{
    const w = C.MAPS[mp].warpsXY || {};
    Object.keys(w).forEach(k=>{ (inTo[w[k].to] = inTo[w[k].to] || []).push(mp); });
  });
  Object.keys(inTo).forEach(mp=>{
    const froms = [...new Set(inTo[mp])];
    if(froms.length < 2) return;
    const m = C.MAPS[mp]; if(!m || m.theme==='world') return;
    // ★行き来が 対に なって いる ところ（町どうし・塔の 階）は のぞく。
    //   ＝ 入って きた ぜんぶの さきへ、この マップから 出口が ある なら よい。
    const w = m.warpsXY || {};
    const outs = Object.keys(w).map(k=>w[k].to);
    const paired = froms.every(f=>outs.includes(f));
    if(paired) return;
    const hasBack = Object.keys(w).some(k=>w[k].back);
    T('入口が ふたつ ある '+mp+' の 出口に back が ある', hasBack,
      '入口='+froms.join(',')+' / 出口='+outs.join(','));
  });
}

// ============ 出口の 既定は かならず 屋外 ============
//   ★炉の 出口の 既定が 上層区の 昇降機（建物の 中）で、
//     おぼえが ない ときに「かべの 中」に 出て いた。
{
  Object.keys(C.MAPS).forEach(mp=>{
    const ws = C.MAPS[mp].warpsXY || {};
    Object.keys(ws).forEach(k=>{
      const w = ws[k];
      if(!w.back) return;
      const to = C.MAPS[w.to];
      if(!to) return;
      // 行き先の ますの まわりが かべ だらけでは ない こと
      let open = 0;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        if(C.walkable(w.to, w.x+dx, w.y+dy)) open++;
      });
      T('出口の 既定 '+mp+'→'+w.to+' が 閉じこめられない', open>=2,
        'まわりの 通れる ますが '+open+'つ しか ない');
    });
  });
}

// ============ 入口が ふたつ ある ダンジョンは 来た ほうへ 返す ============
//   ★炉の 外郭は 世界地図と 上層区の 両方から 入れるのに、
//     出口が 上層区 かためがき で、外から 入っても 上層区に 出て いた。
{
  const enter = (fromMap, fx, fy, dx, dy)=>{
    C.freshState(); C.G.chapter = 3;
    C.G.flags.ch2_towerPaid = true; C.G.flags.ch2_taskOpen = true;
    C.party.length = 0; C.party.push(C.mkMember('io',20));
    C.G.mode='field'; C.P.map=fromMap; C.P.x=fx; C.P.y=fy;
    C.stepField(dx,dy);
    return C.P.map;
  };
  // ★入って、出口を ふんで、どこに 出るかを 見る
  const roundTrip = (fromMap, fx, fy, dx, dy)=>{
    if(enter(fromMap,fx,fy,dx,dy)!=='furnace') return '入れず';
    C.G.mode='field'; C.G.busy=false;
    C.P.x=10; C.P.y=19; C.P.dir='front';
    C.stepField(0,1);
    return C.P.map;
  };
  T('上層区から 入ったら 上層区に 出る',
    roundTrip('upper_dist',17,9,0,1)==='upper_dist', C.P.map);
  T('世界地図から 入ったら 世界地図に 出る',
    roundTrip('world',9,15,0,-1)==='world', C.P.map);

  // ★おく の 部屋（炉心）を 通っても 入口を 忘れない こと。
  //   ★戻る ときに 入口の おぼえを 上書きして いて、
  //     外へ 出ようと すると おくの 部屋に 返されて いた。
  const viaCore = (fromMap, fx, fy, dx, dy)=>{
    if(enter(fromMap,fx,fy,dx,dy)!=='furnace') return '入れず';
    C.G.flags.ch2_heardBreath = true;
    C.setTile('furnace',10,6,'.');
    C.G.mode='field'; C.G.busy=false; C.P.x=10; C.P.y=6; C.stepField(0,-1);
    C.G.mode='field'; C.G.busy=false; C.P.x=7;  C.P.y=8;  C.stepField(0,1);
    C.G.mode='field'; C.G.busy=false; C.P.map='furnace';
    C.P.x=10; C.P.y=19; C.P.dir='front'; C.stepField(0,1);
    return C.P.map;
  };
  T('炉心を 通っても 上層区に 出る',
    viaCore('upper_dist',17,9,0,1)==='upper_dist', C.P.map);
  T('炉心を 通っても 世界地図に 出る',
    viaCore('world',9,15,0,-1)==='world', C.P.map);

  // ★セーブ／ロードを はさんでも 入口を おぼえて いる こと。
  //   ★おぼえを セーブに 入れて いなかった ため、
  //     ロード後は 上層区の 建物の 中に 出て いた。
  {
    if(enter('world',9,15,0,-1)==='furnace'){
      C.saveGame(0);
      C.freshState();
      C.loadGame(0);
      T('ロードしても 入口を おぼえて いる',
        C.G.entry && C.G.entry.furnace && C.G.entry.furnace.map==='world',
        JSON.stringify(C.G.entry && C.G.entry.furnace));
      C.G.mode='field'; C.G.busy=false;
      C.P.map='furnace'; C.P.x=10; C.P.y=19; C.P.dir='front';
      C.stepField(0,1);
      T('ロード後も 世界地図に 出る', C.P.map==='world', C.P.map+' '+C.P.x+','+C.P.y);
    }
  }
  // ★どの 順に 出入りしても 入った ほうへ 返る こと
  {
    const fresh = ()=>{
      C.freshState(); C.G.chapter = 3;
      Object.assign(C.G.flags,{ch2_taskOpen:1, ch2_towerPaid:1, ch2_heardBreath:1});
      C.party.length = 0; C.party.push(C.mkMember('io',22));
      C.setTile('furnace',10,6,'.');
    };
    const step = (mp,x,y,dx,dy)=>{
      C.G.mode='field'; C.G.busy=false; C.P.map=mp; C.P.x=x; C.P.y=y;
      C.P.dir = dy>0?'front' : dy<0?'back' : (dx<0?'left':'right');
      C.stepField(dx,dy); return C.P.map;
    };
    // 上層区で 一度 往復した あと、世界地図から 入る
    fresh();
    step('upper_dist',17,9,0,1);
    step('furnace',10,19,0,1);
    step('world',9,15,0,-1);
    T('一度 上層区を つかっても 世界地図に 返る',
      step('furnace',10,19,0,1)==='world', C.P.map);
    // ぎゃくの 順
    fresh();
    step('world',9,15,0,-1);
    step('furnace',10,19,0,1);
    step('upper_dist',17,9,0,1);
    T('一度 世界地図を つかっても 上層区に 返る',
      step('furnace',10,19,0,1)==='upper_dist', C.P.map);
  }

  // ★おぼえが ない（古い セーブ）ときでも、建物の 中に 出ない こと。
  //   ★炉の 既定の 出口は 上層区の 昇降機で、まわりが 壁。
  //     そこへ 出ると「かべの 中」に 見えて いた。
  {
    const noMemory = (ch, mp, ex, ey)=>{
      C.freshState(); C.G.chapter = ch;
      Object.assign(C.G.flags,{ch2_taskOpen:1, ch2_towerPaid:1, ch2_towerTold:1,
                               ch3_landed:1, ch3_iceDone:1, ch3_caravan:1});
      C.party.length = 0; C.party.push(C.mkMember('io',22));
      C.G.entry = {};
      C.G.mode='field'; C.P.map=mp; C.P.x=ex; C.P.y=ey; C.P.dir='front';
      C.stepField(0,1);
      return C.P.map;
    };
    T('おぼえが なくても 炉から 外（世界地図）へ 出る',
      noMemory(3,'furnace',10,19)==='world', C.P.map+' '+C.P.x+','+C.P.y);
    T('おぼえが なくても 通れる ますに 出る',
      C.walkable(C.P.map, C.P.x, C.P.y), C.P.map+' '+C.P.x+','+C.P.y);
    // ほかの ダンジョンも
    [[3,'tower1',7,9],[4,'ice_cave',10,26],[4,'well_cave',10,17],[4,'sea_cave',10,17]]
      .forEach(([ch,mp,ex,ey])=>{
        noMemory(ch,mp,ex,ey);
        T('おぼえが なくても '+mp+' から 通れる ますに 出る',
          C.walkable(C.P.map, C.P.x, C.P.y), C.P.map+' '+C.P.x+','+C.P.y);
      });
  }
}

// ============ すべての けっかいが いつか 開くか ============
{
  C.freshState();
  // ★けっかいは 章ごと。その 章に なって いないと 閉じない。
  Object.keys(C.WARDS).forEach(mp=>{
    const wd = C.WARDS[mp];
    // ★その 章より 前は、めじるしが 立って いても 通さない
    if(wd.chapter > 1){
      C.G.chapter = wd.chapter - 1;
      C.G.flags[wd.flag] = true;
      T('けっかい '+mp+' は 前の 章では 通さない', C.wardBlocks(mp));
      T('けっかい '+mp+' に 前の 章むけの ことばが ある', !!wd.msgEarly);
      C.G.flags[wd.flag] = false;
    }
    C.G.chapter = wd.chapter;
    C.G.flags[wd.flag] = false;
    // ★めじるしの ない けっかいは「その 章に なれば 通る」だけ。
    //   前の 章で 止まる ことを たしかめる。
    if(!wd.flag){
      C.G.chapter = wd.chapter - 1;
      T('けっかい '+mp+' は 前の 章では 閉じている', C.wardBlocks(mp));
      C.G.chapter = wd.chapter;
      T('けっかい '+mp+' は その 章で 開く', !C.wardBlocks(mp));
      return;
    }
    T('けっかい '+mp+' は はじめ 閉じている（'+C.chapterLabel(wd.chapter)+'）', C.wardBlocks(mp));
    C.G.flags[wd.flag] = true;
    T('けっかい '+mp+' は めじるしで 開く', !C.wardBlocks(mp));
  });
  C.G.chapter = 1;
}

console.log('\n--- gate_flow: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
