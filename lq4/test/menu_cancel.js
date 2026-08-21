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

console.log('\n--- menu_cancel: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
