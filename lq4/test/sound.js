'use strict';
// ルミナクエストIV / 音の せっていの けんしょう
// 使い方： node test/sound.js
// 音の せっていの しくみを、ブラウザなしで ためす
const fs=require('fs'), vm=require('vm');
let stored={};
const localStorage={getItem:k=>k in stored?stored[k]:null, setItem:(k,v)=>{stored[k]=String(v);}, removeItem:k=>{delete stored[k];}};
const src=fs.readFileSync('src/ui.js','utf8');
// 「音の せってい」の ぶぶんだけ とりだして はしらせる
const i=src.indexOf('const SND_KEY'), j=src.indexOf('function sfxBus()');
const body=src.slice(i,j)+`
function bar(v){const n=Math.round(v*10);return '■'.repeat(n)+'□'.repeat(10-n)+' '+n;}
globalThis.__api={snd,sndSave,sndApply,bar,audioMixSupported,applyAudioSession,
  setAC(v){AC=v;}};`;
const session={type:'playback'};
const navigator={audioSession:session};
const sb={console,localStorage,JSON,Math,navigator,BGM:{
  _f:null,_b:null,_v:null,
  setFieldVolume(v){this._f=v;}, setBattleVolume(v){this._b=v;}, setVolume(v){this._v=v;}
}};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext('let SFXBUS=null; let AC=null;'+body, sb);
const {snd,sndSave,sndApply,bar,audioMixSupported,applyAudioSession}=sb.__api;
let n=0,ng=0; const T=(a,c,d)=>{n++;if(!c){ng++;console.log('NG',a,d||'');}};
T('はじめの おおきさ', snd.bgm===0.8 && snd.se===0.8, JSON.stringify(snd));
T('めもりの ひょうじ', bar(0.8)==='■■■■■■■■□□ 8', bar(0.8));
T('0の ひょうじ', bar(0)==='□□□□□□□□□□ 0');
snd.bgm=0.3; sndApply(); sndSave();
T('BGMに とどく', sb.BGM._f===0.3 && sb.BGM._b===0.3 && sb.BGM._v===0.3);
T('のこる', JSON.parse(stored.LQ4_SOUND).bgm===0.3, stored.LQ4_SOUND);
// つぎに あそぶ ときに よみこめるか
const sb2={console,localStorage,JSON,Math,navigator:{audioSession:{type:'playback'}},
  BGM:{setFieldVolume(){},setBattleVolume(){},setVolume(){}}};
sb2.globalThis=sb2; vm.createContext(sb2);
vm.runInContext('let SFXBUS=null; let AC=null;'+body, sb2);
T('つぎに あそぶ ときも のこる', sb2.__api.snd.bgm===0.3, JSON.stringify(sb2.__api.snd));
// ---- ほかの アプリの 音楽と 混ぜる ----
T('この しくみが 使えるか わかる', audioMixSupported()===true);
// ★ページを ひらいた だけの ときは さわらない（Safariが ことわって 赤い おびが 出た）
T('音を 出す まえは さわらない', session.type==='playback', session.type);
snd.mix=true;
T('音を 出す まえは あてに いかない', applyAudioSession()===false && session.type==='playback');
sb.__api.setAC({});          // 音を つくった てい
applyAudioSession();
T('オンで ほかの 音と まざる', session.type==='ambient', session.type);
snd.mix=false; applyAudioSession();
T('オフは ブラウザに まかせる', session.type==='auto', session.type);
snd.mix=true; sndSave();
T('きりかえも のこる', JSON.parse(stored.LQ4_SOUND).mix===true, stored.LQ4_SOUND);
{
  // しくみの ない ブラウザでも 落ちない こと
  const sb3={console,localStorage,JSON,Math,navigator:{},BGM:{setFieldVolume(){},setBattleVolume(){},setVolume(){}}};
  sb3.globalThis=sb3; vm.createContext(sb3);
  vm.runInContext('let SFXBUS=null; let AC=null;'+body, sb3);
  T('しくみが なくても 落ちない', sb3.__api.audioMixSupported()===false);
  sb3.__api.setAC({});
  T('しくみが なくても あてに いける', sb3.__api.applyAudioSession()===false);
}

// ---- やくそく（Promise）の 拒否を のみこんで いるか ----
//   ★AudioContext.resume() は やくそくを かえす。try/catch では 拒否を
//     うけとれず、赤い おびに [REJ] Failed to start the audio device が 出た。
{
  const files = ['src/bgm.js','src/ui.js'];
  files.forEach(f=>{
    const src = fs.readFileSync(f,'utf8').split('\n');
    src.forEach((l,i)=>{
      if(/^\s*(\/\/|\*)/.test(l)) return;                 // コメントは 見ない
      if(!/\.(resume|play)\(\)/.test(l)) return;
      if(/BGM\.resume\(\)/.test(l)) return;                // 中で のみこむ
      const around = src.slice(i, i+7).join(' ');   // then(...).catch(...) は 数行 またぐ
      T(f+':'+(i+1)+' の 拒否を のみこんで いる', /catch/.test(around), l.trim().slice(0,60));
    });
  });
}

// ★フィールドの きょくに もどす とき、せんとうきょくを かならず とめる。
//   ★第3章の せんとうきょくは ファイルで ながす。
//     BGM.stop() は ごうせいの ぶんしか とめず、鳴りっぱなしに なって いた。
{
  const ui = fs.readFileSync('src/ui.js','utf8');
  const m = /bgm\(mapId\)\{[\s\S]*?\n  \},/.exec(ui);
  T('bgm() が ある', !!m);
  if(m){
    const body = m[0];
    T('bgm() が せんとうきょくを ぜんぶ とめる',
      /stopBattleAll/.test(body), 'BGM.stop() だけでは ファイルが 止まらない');
    T('bgm() が フィールドの きょくを かける',
      /playField/.test(body));
  }
  // bgm.js に 両方 とめる 手が ある こと
  const bg = fs.readFileSync('src/bgm.js','utf8');
  T('stopBattleAll が ごうせいも ファイルも とめる',
    /function stopBattleAll\(\)[\s\S]{0,120}?stop\(\);[\s\S]{0,60}?stopBattleFile\(\);/.test(bg));
  T('stopBattleAll が そとに 出て いる', /stopBattleAll,/.test(bg));
}

console.log('\n--- sound: '+(n-ng)+'/'+n+' 通過 ---');
process.exit(ng?1:0);
