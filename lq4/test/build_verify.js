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
// ★ページを ひらいた だけで 音の しくみを さわって いない こと
//   （Safariが ことわり、赤い おびで [REJ] Failed to start the audio device が 出た）
{
  const ui = fs.readFileSync('src/ui.js','utf8');
  // よびだしが 「かんすうの 外」＝ 読みこみと 同時に はしる かたちに なって いないか
  const top = ui.split('\n').filter(l=>/^applyAudioSession\(\);/.test(l));
  T('読みこみと 同時に 音を さわって いない', top.length===0, top.join(' '));
  T('音を つくった あとに あてて いる', ui.includes('applyAudioSession();                     // ★音を つくった あとで あてる'));
  T('ふつうの ときは ブラウザに まかせる', ui.includes("'ambient' : 'auto'"));
}

// ★なかまの よこむきは みんな 同じ 向き（左むき）で ある こと。
//   ★ノエだけ 右を むいて いて、歩く 向きと 体の 向きが 逆に なった。
//   ★はじめは 「暗い ドットの かたより」で しらべたが、外套が 全身 暗い
//     ノエでは 当てに ならず、直った と かんちがい した。
//     いまは 「顔（はだ・目）の いち」で しらべる。人は 顔が むいて いる 側に ある。
{
  const zlib = require('zlib');
  const src = fs.readFileSync('assets.js','utf8');
  const grab = (key, face)=>{
    const re = new RegExp('  '+key+':\\{[\\s\\S]*?'+face+":'data:image/png;base64,([^']*)'");
    const m = re.exec(src);
    return m ? Buffer.from(m[1],'base64') : null;
  };
  const unpack = (buf)=>{
    let p=8, w=0, h=0; const idat=[];
    while(p<buf.length){
      const len=buf.readUInt32BE(p), typ=buf.toString('ascii',p+4,p+8);
      if(typ==='IHDR'){ w=buf.readUInt32BE(p+8); h=buf.readUInt32BE(p+12); }
      if(typ==='IDAT') idat.push(buf.slice(p+8,p+8+len));
      p += 12+len;
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const bpp=4, stride=w*bpp+1;
    const out=Buffer.alloc(w*h*bpp);
    const cur=Buffer.alloc(w*bpp), prev=Buffer.alloc(w*bpp);
    for(let y=0;y<h;y++){
      const ft=raw[y*stride];
      raw.copy(cur, 0, y*stride+1, y*stride+1+w*bpp);
      for(let i=0;i<w*bpp;i++){
        const a=i>=bpp?cur[i-bpp]:0, b=prev[i], cc=i>=bpp?prev[i-bpp]:0;
        if(ft===1) cur[i]=(cur[i]+a)&255;
        else if(ft===2) cur[i]=(cur[i]+b)&255;
        else if(ft===3) cur[i]=(cur[i]+((a+b)>>1))&255;
        else if(ft===4){ const pa=Math.abs(b-cc),pb=Math.abs(a-cc),pc=Math.abs(a+b-2*cc);
          cur[i]=(cur[i]+(pa<=pb&&pa<=pc?a:pb<=pc?b:cc))&255; }
      }
      cur.copy(out, y*w*bpp); cur.copy(prev);
    }
    return {w,h,px:out};
  };
  // 顔の 高さ帯（上から 15〜50%）で、はだ色に ちかい ドットの かたよりを 見る
  const faceSide = (buf)=>{
    const {w,h,px} = unpack(buf);
    let L=0, R=0;
    for(let y=Math.floor(h*0.15); y<Math.floor(h*0.52); y++){
      for(let x=0;x<w;x++){
        const o=(y*w+x)*4, a=px[o+3];
        if(a<100) continue;
        const r=px[o], g=px[o+1], b=px[o+2];
        // はだ／目の しろ：明るく、青みが 強すぎない
        const lum=(r+g+b)/3;
        if(lum<120) continue;
        if(b > r+30) continue;                  // 青い ぬの は のぞく
        if(x < w/2) L++; else R++;
      }
    }
    if(L===0 && R===0) return '?';
    return L>R ? 'left' : 'right';
  };
  const dirs = {};
  ['io','seren','noe'].forEach(k=>{
    ['side','sideW'].forEach(f=>{
      const b = grab(k,f);
      if(!b){ T('よこむきの 絵が ある '+k+' '+f, false); return; }
      dirs[k+'.'+f] = faceSide(b);
    });
  });
  const vals = Object.values(dirs);
  T('なかまの よこむきが そろって いる', vals.every(v=>v===vals[0]), JSON.stringify(dirs));
  T('よこむきは 左むきが きじゅん', vals[0]==='left', JSON.stringify(dirs));
  T('立ち絵と 歩く絵の 向きが おなじ',
    ['io','seren','noe'].every(k=>dirs[k+'.side']===dirs[k+'.sideW']), JSON.stringify(dirs));
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
               'けいけんち','やくそう','ぼうぎょ','ちず','つよさ','さくせん','ぜんめつ',
               // ★「しょう」＝章。LQ3の ままに なって いた
               'しょうへ','しょうを','しょうは','しょう「','しょう　',
               'このえへい','ゆうしゃ','そうりょ','けんじゃ'];
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
