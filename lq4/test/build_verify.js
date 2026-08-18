'use strict';
// ルミナクエストIV / ビルド検査（構想書 §7-1）
// 使い方： node test/build_verify.js
const fs = require('fs'), cp = require('child_process');

let n=0, ng=0;
function T(name, cond, detail){ n++; if(!cond){ ng++; console.log('NG', name, detail!==undefined?'  '+detail:''); } }

const MODS = ['world','npc','chapters','bgm','view2d','core','view','ui'];

// 1. 構文
MODS.forEach(m=>{
  const r = cp.spawnSync('node', ['--check', 'src/'+m+'.js'], {encoding:'utf8'});
  T('構文 '+m+'.js', r.status===0, (r.stderr||'').split('\n')[0]);
});

// 2. ビルドが とおる
const bd = cp.spawnSync('python3', ['build.py'], {encoding:'utf8'});
T('build.py', bd.status===0, (bd.stderr||'').split('\n').slice(-2).join(' '));

// 3. 成果物
const html = fs.readFileSync('index.html','utf8');
T('プレースホルダの のこりなし', !/\{\{MOD:|\{\{BUILD_INFO\}\}/.test(html));
T('LQ4_BUILD が ある', html.includes('window.LQ4_BUILD='));
// LQ3の 「しるし」（へんすう名・セーブキー・キャッシュ名）が のこって いない こと。
// ふりかえりの コメントに 'LQ3' と かくのは よい。
{
  const bad = html.match(/LQ3_[A-Z_]+|LQ3View|const LQ3|window\.LQ3/g) || [];
  T('LQ3の しるしが のこって いない', bad.length===0, bad.slice(0,3).join(','));
}
// ★サービスワーカーの キャッシュ名が この ビルドの ものに なっている こと
//   （固定の ままだと、なおしても 端末に ふるい ものが のこる）
{
  const crypto = require('crypto');
  const sw = fs.readFileSync('sw.js','utf8');
  const want = 'lq4-' + crypto.createHash('sha1').update(html).digest('hex').slice(0,8);
  T('sw.js の キャッシュ名が ビルドと そろっている', sw.includes("const CACHE='"+want+"'"),
    (sw.match(/const CACHE='[^']*'/)||[''])[0] + ' / ほしいのは ' + want);
}

// ★タイトルの ずれ：Ⅲの なまえが どこにも のこって いない こと
{
  const files = ['index.html','shell.html','sw.js'].concat(MODS.map(m=>'src/'+m+'.js'));
  const hits = [];
  files.forEach(f=>{
    const t = fs.readFileSync(f,'utf8');
    (t.match(/ルミナクエスト\s*III|ルミクエⅢ|ルミナクエストⅢ/g)||[]).forEach(h=>hits.push(f+':'+h));
  });
  T('Ⅲの タイトルが のこって いない', hits.length===0, hits.slice(0,4).join(' '));
}
MODS.forEach(m=>{
  const src = fs.readFileSync('src/'+m+'.js','utf8');
  const head = src.split('\n').slice(0,6).join('\n');
  T('とりこみ '+m, html.includes(head.slice(0, 60)));
});

// 4. assets の はんクエリが sha と あっている（iPhoneの キャッシュずれ よぼう）
{
  const crypto = require('crypto');
  const sha = crypto.createHash('sha1').update(fs.readFileSync('assets.js')).digest('hex').slice(0,8);
  T('assets.js?v= が sha と いっち', html.includes('assets.js?v='+sha), sha);
}

// 5. テスト文言の まじりこみ（地雷集 §10-10）
{
  // ★中の 人の ことばを 画面に 出さない（「これから 作られます」が じっさいに 出た）
  const banned = ['ぎじゅつスライス', 'デバッグ', 'TODO', 'FIXME', 'てすと ここまで',
                  '作られます', 'つくられます', '未実装', '仮の', 'ダミー', 'placeholder'];
  // ※ コメントは 見ない。画面に 出る 文字（クオートの 中）だけを 見る。
  const code = MODS.map(m=>fs.readFileSync('src/'+m+'.js','utf8'))
    .join('\n').split('\n').filter(l=>!/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const strs = (code.match(/'[^'\\\n]*'/g)||[]).join('\n');
  banned.forEach(w=>{
    T('テスト文言なし「'+w+'」', !strs.includes(w));
  });
}

// 6. 表記のゆれ：IVは 漢字OK。システム文が Ⅲの ひらがなの まま 残って いないか
{
  // ※ コメントは 見ない。画面に 出る 文字（クオートの 中）だけを 見る。
  const src = MODS.map(m=>fs.readFileSync('src/'+m+'.js','utf8'))
    .join('\n').split('\n').filter(l=>!/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const strs = (src.match(/'[^'\\\n]*'/g)||[]).join('\n');
  const old = ['こうげき','じゅもん','どうぐ','そうび','たおした','かいふく',
               'けいけんち','やくそう','ぼうぎょ','ちず','つよさ','さくせん','ぜんめつ'];
  old.forEach(w=>T('Ⅲの ひらがな表記なし「'+w+'」', !strs.includes(w)));
}

// 7. せりふ46もじ（台詞窓の うえげん）
{
  const chSrc = fs.readFileSync('src/chapters.js','utf8');
  const tooLong = [];
  for(const m of chSrc.matchAll(/'([^'\\]*)'/g))
    if(m[1].length>46 && /[ぁ-んァ-ン]/.test(m[1])) tooLong.push(m[1]);
  T('せりふ46もじ いない（こえ '+tooLong.length+'）', tooLong.length===0);
  tooLong.slice(0,3).forEach(s=>console.log('   ', s.length, s));
}

console.log('\n--- build_verify: ' + (n-ng) + '/' + n + ' 通過 ---');
process.exit(ng ? 1 : 0);
