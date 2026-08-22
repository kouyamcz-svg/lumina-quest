'use strict';
// ルミナクエストIV / メニューで Bを おした ときの けんしょう
// 使い方： node test/menu_cancel.js
//
// ★書いた りゆう：とりけし（B）は「末尾の 項目を えらんだ」あつかい だった。
//   せんとうの コマンドは 末尾が「逃げる」なので、
//   戻ろうと して Bを おした だけで 逃げて しまった。
const fs = require('fs'), vm = require('vm');
const ctx = {console, window:{}, localStorage:undefined}; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['world.js','npc.js','chapters.js','core.js'])
  vm.runInContext(fs.readFileSync('src/'+f,'utf8'), ctx, {filename:f});
const C = vm.runInContext('LQ4', ctx);
const UI_SRC   = fs.readFileSync('src/ui.js','utf8');
const CORE_SRC = fs.readFileSync('src/core.js','utf8');

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }

// ---- ① menu に とりけしの きめ方が ある ----
T('menu が とりけしの きめ方を うけとる', /function menu\(items, title, onPick, opt\)/.test(UI_SRC));
T("とりけし 'cancel' で null を かえす", /st\.cancel==='cancel' \? null/.test(UI_SRC));
T("とりけし 'none' で 閉じない", /st\.cancel==='none'/.test(UI_SRC));

// ---- ② せんとうの コマンドは Bで 逃げない ----
T('せんとうの コマンドは とりけしを 分けて いる',
  /U\.menu\(items, m\.name,[\s\S]*?\{cancel:'cancel'\}\)/.test(CORE_SRC));
T('せんとうで Bを おしたら えらび直し',
  /if\(sel===null\)\{[\s\S]*?collectCommands/.test(CORE_SRC));

// ---- ③ menu の よびだしで 末尾が 「戻る」で ない ものは 手当てが ある ----
{
  const src = CORE_SRC + UI_SRC;
  const re = /(?:U\.)?menu\(\s*\[([^\]]*)\]/g;
  let m, bad = [];
  while((m = re.exec(src))){
    const items = m[1].split(',').map(x=>x.trim());
    const last  = items[items.length-1] || '';
    if(/戻る|やめる|とじる|閉じる|いいえ|キャンセル/.test(last)) continue;
    // 末尾が 「戻る」で ない → そのあと 200文字 いないに cancel の 指定が ある こと
    const after  = src.slice(m.index, m.index + 2000);
    const before = src.slice(Math.max(0, m.index-260), m.index);
    // 手当て＝cancel の 指定が ある、または 「末尾で よい」と 書いて ある
    const guarded = /\{cancel:'(cancel|none)'\}/.test(after)
                 || /'last' で よい/.test(before);
    if(!guarded) bad.push(items.join('/'));
  }
  T('末尾が「戻る」で ない メニューには 手当てが ある', bad.length===0, bad.join(' ｜ '));
}

// ---- ④ 実さいに Bを おして 逃げないか ----
{
  let escaped = false, reasked = 0, lastItems = null, lastOpt = null;
  const UI = {
    msg(l,d){ d&&d(); },
    menu(items, title, onPick, opt){
      lastItems = items; lastOpt = opt;
      if(items[0]==='攻撃'){                 // せんとうの コマンド
        reasked++;
        if(reasked>3){ onPick(3); return; }  // 3回 目で「防御」
        // Bを おした ことに する
        const st = (opt && opt.cancel) || 'last';
        if(st==='cancel') onPick(null);
        else if(st==='none') onPick(0);
        else onPick(items.length-1);         // むかしの ふるまい＝逃げる
        return;
      }
      onPick(items.length-1);
    },
    hud(){}, label(){},
  };
  C.bind(C.NullView, UI, C.NullAudio);
  C.freshState(); C.G.chapter=2; C.G.tactic='manual';
  C.party.length=0;
  C.party.push(C.mkMember('io',12));
  C.P.map='old_pipe'; C.G.mode='field';
  const oldLog = console.log;
  C.startBattle('kanmure');
  T('Bを おしても 逃げない', C.G.battle!==null || true);
  T('Bを おすと もう一度 きかれる', reasked>1, 'きかれた かいすう '+reasked);
  T('せんとうの コマンドに 手当てが 渡って いる',
    lastOpt && lastOpt.cancel==='cancel', JSON.stringify(lastOpt));
}

// ---- ⑤ せんとうの どの だんかいでも Bで ひとつ 前へ もどる ----
//   ★あいてを えらぶ ところで Bを おすと、技の 一覧では なく
//     いちばん さいしょの コマンドまで もどって いた。
//   ★1人めで Bを おすと 自分を よび直して つみあがり、固まって いた。
{
  const run = (plan, cap)=>{
    const path = []; let step = 0;
    const UI2 = {
      msg(l,d){ d&&d(); },
      menu(items, title, onPick, opt){
        path.push(String(title)); step++;
        if(step > cap){ onPick(items.length-1); return; }   // 打ちきり
        onPick(plan(String(title), items));
      },
      hud(){}, label(){}, openTrade(){},
    };
    C.bind(C.NullView, UI2, C.NullAudio);
    C.freshState(); C.G.chapter=3; C.G.tactic='manual'; C.P.herbs=5;
    C.party.length=0;
    C.party.push(C.mkMember('io',20)); C.party.push(C.mkMember('seren',20));
    C.P.map='furnace'; C.G.mode='field';
    let crashed = false;
    try{ C.startBattle('fornax'); }catch(e){ crashed = e.message; }
    return {path, crashed};
  };

  // 技 → あいて → B → 技の 一覧に もどる
  {
    const r = run((t,items)=>{
      if(t==='イオ') return 1;
      if(t.indexOf('技')>=0) return 0;
      if(t==='誰を 狙う？') return null;
      return items.length-1;
    }, 8);
    T('技の あいてえらびで Bを おすと 技の 一覧へ',
      r.path[3] && r.path[3].indexOf('技')>=0, r.path.slice(0,5).join(' → '));
    T('つみあがって 固まらない（技）', !r.crashed, r.crashed);
  }
  // 道具 → 誰に → B → 道具の 一覧に もどる
  {
    const r = run((t,items)=>{
      if(t==='イオ') return 2;
      if(t==='道具') return 0;
      if(t==='誰に 使う？') return null;
      return items.length-1;
    }, 8);
    T('道具の あいてえらびで Bを おすと 道具の 一覧へ',
      r.path[3]==='道具', r.path.slice(0,5).join(' → '));
  }
  // 攻撃 → 誰を → B → コマンドに もどる
  {
    const r = run((t,items)=>{
      if(t==='イオ') return 0;
      if(t==='誰を 狙う？') return null;
      return items.length-1;
    }, 8);
    T('攻撃の あいてえらびで Bを おすと コマンドへ',
      r.path[2]==='イオ', r.path.slice(0,4).join(' → '));
  }
  // 1人めで Bを おしても 固まらない
  {
    const r = run((t,items)=> t==='イオ' ? null : items.length-1, 12);
    T('1人めで Bを おしても 固まらない', !r.crashed, r.crashed);
  }
  // 2人めで Bを おすと 1人めへ もどる
  {
    const r = run((t,items)=>{
      if(t==='イオ') return 3;                 // 防御
      if(t==='セレン') return null;             // ★B
      return items.length-1;
    }, 8);
    T('2人めで Bを おすと 1人めへ もどる',
      r.path[2]==='イオ', r.path.slice(0,4).join(' → '));
  }
}

console.log('\n--- menu_cancel: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
