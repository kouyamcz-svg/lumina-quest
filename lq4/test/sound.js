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
globalThis.__api={snd,sndSave,sndApply,bar};`;
const sb={console,localStorage,JSON,Math,BGM:{
  _f:null,_b:null,_v:null,
  setFieldVolume(v){this._f=v;}, setBattleVolume(v){this._b=v;}, setVolume(v){this._v=v;}
}};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext('let SFXBUS=null;'+body, sb);
const {snd,sndSave,sndApply,bar}=sb.__api;
let n=0,ng=0; const T=(a,c,d)=>{n++;if(!c){ng++;console.log('NG',a,d||'');}};
T('はじめの おおきさ', snd.bgm===0.8 && snd.se===0.8, JSON.stringify(snd));
T('めもりの ひょうじ', bar(0.8)==='■■■■■■■■□□ 8', bar(0.8));
T('0の ひょうじ', bar(0)==='□□□□□□□□□□ 0');
snd.bgm=0.3; sndApply(); sndSave();
T('BGMに とどく', sb.BGM._f===0.3 && sb.BGM._b===0.3 && sb.BGM._v===0.3);
T('のこる', JSON.parse(stored.LQ4_SOUND).bgm===0.3, stored.LQ4_SOUND);
// つぎに あそぶ ときに よみこめるか
const sb2={console,localStorage,JSON,Math,BGM:{setFieldVolume(){},setBattleVolume(){},setVolume(){}}};
sb2.globalThis=sb2; vm.createContext(sb2);
vm.runInContext('let SFXBUS=null;'+body, sb2);
T('つぎに あそぶ ときも のこる', sb2.__api.snd.bgm===0.3, JSON.stringify(sb2.__api.snd));
console.log('\n--- sound: '+(n-ng)+'/'+n+' 通過 ---');
process.exit(ng?1:0);
