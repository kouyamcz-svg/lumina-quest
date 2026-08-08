'use strict';
// ============================================================
// ルミナクエストIV / UI層・音層・入力・起動
// ============================================================
(function(){
const C = LQ4, V = window.LQ4View;

// ---------------- 音 ----------------
// マップの しゅべつ（town/in/cast/field/dgn）で きょくを えらぶ。
// テーマでは 「まち」と 「のはら」を みわけられない ため。
function trackFor(mapId){
  const info = (typeof WORLD!=='undefined' && WORLD.MAP_IDS) ? WORLD.MAP_IDS[mapId] : null;
  const kind = info ? info.kind : '';
  if(kind==='cast') return 'castle';
  if(kind==='town' || kind==='in') return 'town';
  if(kind==='dgn') return 'dungeon';        // ★どうくつ・いせき・いわば
  return 'field';
}
let AC=null;
function ctx(){
  try{
    if(!AC){
      AC = new (window.AudioContext||window.webkitAudioContext)();
      if(typeof BGM!=='undefined' && BGM.attach) BGM.attach(AC);   // BGMと きょうゆう
    }
  }catch(e){}
  return AC;
}
let SFXBUS=null;
function sfxBus(){                 // こうかおんは まとめて すこし おおきく
  const ac=ctx(); if(!ac) return null;
  if(!SFXBUS){
    try{ SFXBUS=ac.createGain(); SFXBUS.gain.value=1.6; SFXBUS.connect(ac.destination); }
    catch(e){ SFXBUS=null; }
  }
  return SFXBUS;
}
// ============================================================
// こうかおん（DQふう）
//  ・とうは くけい／さんかくは の たんじゅんな はっしんき
//  ・「あたる」おとは ノイズ＋ひくい ドスン
//  ・技は アルペジオ、レベルアップは のぼる ファンファーレ
// ============================================================
let NOISEBUF=null;
function noiseBuf(){
  const ac=ctx(); if(!ac) return null;
  if(!NOISEBUF){
    const n=Math.floor(ac.sampleRate*0.5);
    NOISEBUF=ac.createBuffer(1,n,ac.sampleRate);
    const d=NOISEBUF.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  }
  return NOISEBUF;
}
// たんおん（しゅうはすうを うごかせる）
function tone(f,d,type,v,w,f2){
  const ac=ctx(); if(!ac) return;
  const t0=ac.currentTime+(w||0);
  const o=ac.createOscillator(), g=ac.createGain();
  o.type=type||'square';
  o.frequency.setValueAtTime(f,t0);
  if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,f2), t0+d);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(v,t0+0.004);      // すばやい たちあがり
  g.gain.exponentialRampToValueAtTime(0.0008,t0+d);
  o.connect(g); g.connect(sfxBus()||ac.destination);
  o.start(t0); o.stop(t0+d+0.02);
}
// ノイズ（あたる おと・ばくはつ）
function noise(d,v,w,hp,lp){
  const ac=ctx(); if(!ac) return;
  const b=noiseBuf(); if(!b) return;
  const t0=ac.currentTime+(w||0);
  const s=ac.createBufferSource(); s.buffer=b;
  const g=ac.createGain();
  let node=s;
  if(hp){ const f=ac.createBiquadFilter(); f.type='highpass';
          f.frequency.setValueAtTime(hp,t0); node.connect(f); node=f; }
  if(lp){ const f=ac.createBiquadFilter(); f.type='lowpass';
          f.frequency.setValueAtTime(lp,t0);
          f.frequency.exponentialRampToValueAtTime(Math.max(200,lp*0.25),t0+d);
          node.connect(f); node=f; }
  g.gain.setValueAtTime(v,t0);
  g.gain.exponentialRampToValueAtTime(0.0008,t0+d);
  node.connect(g); g.connect(sfxBus()||ac.destination);
  s.start(t0); s.stop(t0+d+0.02);
}
// アルペジオ（技・レベルアップ）
function arp(freqs, step, dur, type, v, w){
  freqs.forEach((f,i)=>tone(f,dur,type,v,(w||0)+i*step));
}
const A = {
  // ---- メニュー ----
  cursor(){ tone(880,0.05,'square',0.05); },              // カーソルいどう
  ok(){     tone(880,0.05,'square',0.06);
            tone(1319,0.09,'square',0.055,0.045); },      // けってい（2おん のぼり）
  cancel(){ tone(660,0.06,'square',0.05);
            tone(440,0.09,'square',0.045,0.05); },        // とりけし（さがり）
  // ---- フィールド ----
  cue(){    tone(523,0.06,'square',0.05);
            tone(784,0.08,'square',0.045,0.05); },        // はなす・しらべる
  door(){   tone(392,0.07,'square',0.05);
            tone(523,0.07,'square',0.05,0.06);
            noise(0.10,0.05,0,900,3000); },               // とびら・かいだん
  chest(){  arp([523,659,784,1047],0.055,0.13,'square',0.055);
            tone(1568,0.22,'triangle',0.05,0.24); },      // たからばこ
  item(){   tone(784,0.08,'triangle',0.06);
            tone(1047,0.12,'triangle',0.05,0.07); },      // 道具を 使う
  buy(){    tone(1047,0.06,'square',0.055);
            tone(1319,0.06,'square',0.05,0.05);
            tone(1568,0.10,'square',0.045,0.10); },       // かいもの
  // ---- せんとう ----
  encounter(){ tone(196,0.10,'square',0.07);
               tone(262,0.10,'square',0.07,0.09);
               tone(392,0.16,'square',0.07,0.18);
               noise(0.20,0.05,0.18,600,4000); },         // まものが 現れた
  hit(){    noise(0.10,0.10,0,300,2600);
            tone(160,0.13,'square',0.08,0,60); },         // こちらの 攻撃が あたる
  crit(){   noise(0.14,0.13,0,500,5200);
            tone(320,0.10,'square',0.09,0,80);
            tone(1200,0.10,'square',0.06,0.02,300); },    // 会心の 一撃
  miss(){   noise(0.09,0.05,0,1800,6000); },              // はずれ
  ehit(){   noise(0.12,0.11,0.16,180,1600);
            tone(110,0.20,'triangle',0.09,0.17,45); },    // こちらが うける
  spell(){  arp([392,523,659,880],0.035,0.11,'sawtooth',0.05);
            noise(0.18,0.04,0.12,800,5000); },            // 攻撃 技
  heal(){   arp([523,659,784,1047],0.055,0.16,'sine',0.06);
            tone(1319,0.30,'sine',0.045,0.22); },         // 回復 技
  defeat(){ tone(300,0.22,'square',0.06,0,90);
            noise(0.22,0.05,0.02,300,2200); },            // てきを 倒した
  flee(){   tone(880,0.10,'square',0.05,0,300);
            tone(660,0.14,'square',0.045,0.08,220); },    // にげる
  // ---- しょうはい・せいちょう ----
  win(){    arp([523,659,784,1047],0.09,0.20,'square',0.055);
            tone(1319,0.40,'square',0.05,0.36); },        // しょうり
  lvup(){   arp([523,659,784,1047,1319],0.085,0.18,'square',0.055);
            tone(1568,0.45,'square',0.05,0.43);
            tone(1047,0.45,'square',0.035,0.43); },       // レベルアップ
  lose(){   [392,349,294,247,196].forEach((f,i)=>tone(f,0.34,'triangle',0.06,i*0.20));
            noise(0.5,0.03,0.9,120,900); },               // ぜんめつ
  bgm(mapId){                      // ★ばしょの しゅべつで きょくを えらぶ
    if(typeof BGM==='undefined') return;
    BGM.stop();                    // せんとうきょくは とめる
    BGM.playField(trackFor(mapId));
  },
  battleBgm(kind){                 // ★しょうで せんとうきょくを かえる
    const ac = ctx();
    if(typeof BGM==='undefined') return;
    if(BGM.attach) BGM.attach(ac);
    BGM.resume();
    const no = C.G.chapter || 1;
    // ★ボスせんは どの しょうでも せんようの きょく
    if(kind === 'boss' && BGM.playBattleFile){
      BGM.playBattleFile('boss');
    }else if(no >= 3 && BGM.playBattleFile){
      BGM.playBattleFile('battle3');            // 第3章いこう：ふつうの せんとう
    }else{
      BGM.stopBattleFile && BGM.stopBattleFile();
      BGM.play('battle');                       // 第1・2章：ごうせいの 双嶺の誓約
    }
  },
  bgmStop(){ if(typeof BGM!=='undefined'){ BGM.stopBattleAll ? BGM.stopBattleAll() : BGM.stop(); } },
};

// ---------------- DOM ----------------
const $ = id=>document.getElementById(id);
const msgWin=$('msg-win'), msgText=$('msg-text'), cmdWin=$('cmd-win'), hudEl=$('hud'), labelEl=$('label');

// ---------------- メッセージ ----------------
let msgQ=[], msgCb=null, typing=null, shown='';
// タイプ中のタップは全文表示、完了後のタップで次行
let curLine='';
function msg2(lines, done){
  msgQ=lines.slice(); msgCb=done||null;
  msgWin.style.display='flex'; showLine();
}
function showLine(){
  if(!msgQ.length){
    msgWin.style.display='none';
    const cb=msgCb; msgCb=null;
    if(cb) cb();
    return;
  }
  curLine=msgQ.shift(); shown='';
  if(typing) clearInterval(typing);
  typing=null;
  // ★からの ぎょう（かんかく あけ）は そのまま だす。
  //   1もじずつ だす しくみは ながさ0で とまらない ため、
  //   さきに すすめなく なって いた。
  if(!curLine || curLine.length===0){
    msgText.textContent='';
    return;
  }
  let i=0;
  typing=setInterval(()=>{
    shown=curLine.slice(0,++i); msgText.textContent=shown;
    if(i>=curLine.length){ clearInterval(typing); typing=null; }
  },18);
}
function tapMsg(){
  if(typing){ clearInterval(typing); typing=null; shown=curLine; msgText.textContent=curLine; return; }
  showLine();
}
function msgVisible(){ const d=msgWin.style.display; return d!=='' && d!=='none'; }  // ★msg2は'flex'で ひらく。'block'ひかくは たいへんな バグだった

// ---------------- コマンドメニュー ----------------
let menuState=null;
function menu(items, title, onPick){
  menuState={items:items.slice(), sel:0, onPick, title};
  renderMenu();
  cmdWin.style.display='block';
  A.cursor && A.cursor();               // ★メニューを ひらいた おと
}
function renderMenu(){
  if(!menuState) return;
  const h='<div class="cmd-title">'+menuState.title+'</div>';
  cmdWin.innerHTML = h + menuState.items.map((s,i)=>
    '<div class="cmd-item'+(i===menuState.sel?' sel':'')+'">'+(i===menuState.sel?'▶':'　')+s+'</div>'
  ).join('');
}
function menuMove(d){
  if(!menuState) return;
  menuState.sel=(menuState.sel+d+menuState.items.length)%menuState.items.length;
  renderMenu();
  A.cursor && A.cursor();               // ★カーソルを うごかす おと
}
function menuPick(){
  if(!menuState) return;
  const st=menuState; menuState=null;
  cmdWin.style.display='none';
  A.ok && A.ok();                       // ★けっていの おと
  st.onPick(st.sel);
}
function menuCancel(){
  if(!menuState) return;
  const st=menuState; menuState=null;
  cmdWin.style.display='none';
  A.cancel && A.cancel();               // ★とりけしの おと
  st.onPick(st.items.length-1);       // 末尾＝やめる／戻る
}
function menuVisible(){ return !!menuState; }

// ---------------- HUD ----------------
function hudVisible(){
  // ★ステータスは メニューを ひらいた とき と せんとうちゅう だけ だす
  //   （つねに だすと、へやの うえの ボスと かさなって みえなかった）
  return menuVisible() || !!(C.G && C.G.battle);
}
function hud(){
  hudEl.style.display = hudVisible() ? '' : 'none';
  hudEl.innerHTML = C.party.map(m=>
    '<div class="hm'+(m.hp<=0?' dead':'')+'">'+
    '<div class="hn">'+m.name+'</div>'+
    '<div class="hv">HP '+m.hp+'</div>'+
    (m.maxmp>0?'<div class="hv">MP '+m.mp+'</div>':'<div class="hv">&nbsp;</div>')+
    '<div class="bar"><i style="width:'+Math.max(0,Math.round(m.hp/m.maxhp*100))+'%"></i></div>'+
    '</div>').join('') +
    '<div class="hm gold">'+
    '<div class="hn">ゴールド</div><div class="hv">'+C.P.gold+'G</div>'+
    '<div class="hv">薬草 '+C.P.herbs+'</div></div>';
}
function label(t){ labelEl.textContent=t; }

const UI = {msg:msg2, menu, hud, label, openTrade};
// ★メニューの ひらけしめで ステータスの ひょうじも きりかえる
const _menuOrig = menu;
menu = function(items, title, cb){
  _menuOrig(items, title, (k)=>{ cb(k); hud(); });
  hud();
};
UI.menu = menu;

// ---------------- 入力 ----------------
function press(k){
  if(msgVisible()){ if(k==='A'||k==='B') tapMsg(); return; }
  if(menuVisible()){
    if(k==='U') menuMove(-1);
    else if(k==='D') menuMove(1);
    else if(k==='A') menuPick();
    else if(k==='B') menuCancel();
    return;
  }
  // ★強さ：A＝つぎの ページ／さいごで とじる、B＝ほかの なかま
  if(C.G.mode==='status'){
    if(k==='A') statusNext();
    else if(k==='B') statusOther();
    else if(k==='U'||k==='D') statusOther();
    return;
  }
  if(C.G.mode==='map'){ closeMap(); return; }        // 地図は どの ボタンでも とじる
  if(C.G.mode!=='field'||C.G.busy) return;
  if(k==='U') C.stepField(0,-1);
  else if(k==='D') C.stepField(0,1);
  else if(k==='L') C.stepField(-1,0);
  else if(k==='R') C.stepField(1,0);
  else if(k==='A') C.interact();                     // ★A＝しらべる・はなす
  else if(k==='B') openFieldMenu();                  // ★B＝メニュー
}
// ★けんしょう ようの くち
if(typeof globalThis!=='undefined') globalThis.__UI = {press:(k)=>press(k)};
// ---------------- 地図 ----------------
function openMap(){
  C.G.mode='map';
  $('cmd-win').style.display='none';

  if(V.showMap) V.showMap(C.P.map);
}
function closeMap(){
  if(V.hideMap) V.hideMap();
  C.G.mode='field';
}
function openFieldMenu(){
  if(statusEl) statusEl.style.display='none';
  C.G.mode='menu';
  // ★ひかえが いる ときだけ「入れ替え」が ふえる。ばんごうでなく なまえで わける
  const items=['強さ','技','道具','装備','地図','作戦'];
  if(C.reserve.length>0) items.push('入れ替え');
  items.push('クエスト','セーブ','とじる');
  menu(items,'メニュー',(sel)=>{
    const pick=items[sel];
    if(pick==='強さ'){
      openStatus();

    }else if(pick==='技'){
      openSpells();

    }else if(pick==='道具'){
      openItems();

    }else if(pick==='装備'){
      openEquip();

    }else if(pick==='地図'){
      openMap();

    }else if(pick==='作戦'){
      const keys=Object.keys(C.TACTICS);
      menu(keys.map(k=>C.TACTICS[k]).concat(['戻る']),'作戦',(k)=>{
        if(k<keys.length){ C.G.tactic=keys[k];
          msg2(['作戦を 「'+C.TACTICS[keys[k]]+'」に した。'],()=>{C.G.mode='field';}); }
        else C.G.mode='field';
      });

    }else if(pick==='入れ替え'){
      openSwap();

    }else if(pick==='クエスト'){
      const qs=C.questList();
      msg2(qs.length
        ? qs.reduce((a,q)=>a.concat(['＊ '+q.title, '　'+q.desc]),[])
        : ['いまは とくに やることが ない。'], ()=>{ C.G.mode='field'; });

    }else if(pick==='セーブ'){
      const ok=C.saveGame();
      msg2([ok?'ぼうけんの きろくを つけた。':(C.lastSaveError||'きろくに しっぱいした…')],
           ()=>{ C.G.mode='field'; });

    }else C.G.mode='field';
  });
}

// ---------------- 入れ替え ----------------
// ★えらぶと せんとう ⇄ ひかえが きりかわる トグルしき（そうさ さいしょう）
function openSwap(){
  const all = C.allMembers();
  const rows = all.map(m=>{
    const inP = C.party.indexOf(m)>=0;
    return (inP?'▶':'　')+m.name+'　Lv'+m.lv;
  }).concat(['戻る']);
  menu(rows, '入れ替え（▶＝せんとう）', (k)=>{
    if(k>=all.length){ C.G.mode='field'; return; }
    const r = C.swapMember(all[k].cls);
    if(r.ok){ A.cursor && A.cursor(); openSwap(); }        // つづけて 入れ替えられる
    else    { msg2([r.msg], ()=>openSwap()); }
  });
}

// ---------------- 強さ ----------------
// ★がめん ぜんたいに おおきく だす。
//   ちいさな メッセージまどに ながく ならべると よみにくい ため。
const STATUS_NAME = {sleep:'眠り', confuse:'混乱', freeze:'凍り', slow:'鈍り'};
const CLASS_NAME  = {lion:'このえへい', bald:'しょうにん', sena:'うらないし', ruka:'おどりこ',
                     zef:'ろうけんじゃ', mio:'けんじゃの でし',
                     sora:'ゆうしゃ', lumia:'そうりょ', dan:'せんし'};
function className(cls){ return CLASS_NAME[cls] || ''; }
const statusEl = $('status');
let statusPage = 0, statusWho = 0;

function esc(s){ return String(s).replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }
function row(k, v){
  return '<div class="st-k">'+esc(k)+'</div><div class="st-v">'+esc(v)+'</div>';
}
function statusHTML(m, page, pages){
  const next = C.expNext(m);
  let h = '<div class="st-name">'+esc(m.name)+'</div>'
        + '<div class="st-sub">Lv'+m.lv+'　'+esc(className(m.cls))+'</div>';
  if(page === 0){
    h += '<div class="st-grid">'
       + row('HP', m.hp + ' / ' + m.maxhp)
       + (m.maxmp>0 ? row('MP', m.mp + ' / ' + m.maxmp) : '')
       + row('状態', m.status ? (STATUS_NAME[m.status]||m.status) : 'そうかい')
       + row('攻撃力', C.mAtk(m))
       + row('守備力', C.mDef(m))
       + row('素早さ', m.agi)
       + '</div>'
       + '<div class="st-sec">装備</div>'
       + '<div class="st-grid">'
       + row('右手', m.weapon ? m.weapon.name+'（+'+m.weapon.v+'）' : 'なし')
       + row('からだ', m.armor  ? m.armor.name +'（+'+m.armor.v +'）' : 'なし')
       + '</div>'
       + '<div class="st-sec">けいけん</div>'
       + '<div class="st-grid">'
       + row('経験値', m.exp)
       + row('つぎのLvまで', next===Infinity ? '---' : (next - m.exp))
       + '</div>';
  }else{
    const sp = C.knownSpells(m);
    h += '<div class="st-sec">覚えた 技</div>';
    h += sp.length
      ? '<div class="st-sp">' + sp.map(s=>esc(C.spellLabel(s))).join('<br>') + '</div>'
      : '<div class="st-sp">まだ おぼえて いない</div>';
  }
  const nav = (C.party.length>1 ? 'B：ほかの なかま　' : '') +
              (pages>1 ? 'A：つぎの ページ' : 'A：とじる');
  h += '<div class="st-foot">'+esc(nav)+'　（'+(page+1)+'/'+pages+'）</div>';
  return h;
}
function showStatus(){
  const m = C.allMembers()[statusWho];
  if(!m){ hideStatus(); return; }
  const pages = C.knownSpells(m).length ? 2 : 1;
  if(statusPage >= pages) statusPage = 0;
  statusEl.innerHTML = statusHTML(m, statusPage, pages);
  statusEl.style.display = 'flex';
  C.G.mode = 'status';
}
function hideStatus(){
  statusEl.style.display = 'none';
  C.G.mode = 'field';
}
function statusNext(){          // A：つぎの ページ／さいごなら とじる
  const m = C.allMembers()[statusWho];
  const pages = m && C.knownSpells(m).length ? 2 : 1;
  if(statusPage + 1 < pages){ statusPage++; A.cursor && A.cursor(); showStatus(); }
  else { A.cancel && A.cancel(); hideStatus(); }
}
function statusOther(){         // B：ほかの なかま（ひかえも みられる）
  const n = C.allMembers().length;
  if(n <= 1){ A.cancel && A.cancel(); hideStatus(); return; }
  statusWho = (statusWho + 1) % n;
  statusPage = 0;
  A.cursor && A.cursor();
  showStatus();
}
function openStatus(){
  statusWho = 0; statusPage = 0;
  showStatus();
}

// ---------------- 技 ----------------
function openSpells(){
  const casters = C.party.filter(m=>m.hp>0 && C.fieldSpells(m).length>0);
  if(!casters.length){
    msg2(['ここで つかえる 技は ない。'], ()=>{ C.G.mode='field'; });
    return;
  }
  if(C.party.length===1){ spellsOf(0); return; }
  const idx = C.party.map((m,i)=>i).filter(i=>C.party[i].hp>0);
  menu(idx.map(i=>C.party[i].name+(C.party[i].maxmp>0?'　MP'+C.party[i].mp+'/'+C.party[i].maxmp:''))
       .concat(['戻る']),'誰の 技？',(k)=>{
    if(k>=idx.length){ C.G.mode='field'; return; }
    spellsOf(idx[k]);
  });
}
function spellsOf(ci){
  const m = C.party[ci];
  const sp = C.fieldSpells(m);
  if(!sp.length){
    msg2([m.name+'は ここで つかえる 技を おぼえていない。'],
         ()=>{ C.G.mode='menu'; openSpells(); });
    return;
  }
  menu(sp.map(s=>C.spellLabel(s)).concat(['戻る']), m.name+'　技',(k)=>{
    if(k>=sp.length){ C.G.mode='field'; return; }
    const s = sp[k];
    if(s.type==='return'){ chooseReturn(ci); return; }
    if(!C.spellNeedsTarget(s)){ applySpell(ci, s.key, null); return; }
    if(C.party.length===1){ applySpell(ci, s.key, 0); return; }
    menu(C.party.map(t=>t.name+'　HP'+t.hp+'/'+t.maxhp+(t.hp<=0?'（倒れている）':''))
         .concat(['戻る']), s.name+'を 誰に？',(ti)=>{
      if(ti>=C.party.length){ C.G.mode='menu'; spellsOf(ci); return; }
      applySpell(ci, s.key, ti);
    });
  });
}
// ---------------- リターン ----------------
function chooseReturn(ci){
  if(!C.canReturnHere()){
    msg2(['ここでは 使えない。','そとへ でなければ ならない。'],
         ()=>{ C.G.mode='menu'; spellsOf(ci); });
    return;
  }
  const list = C.returnDestinations();
  if(!list.length){
    msg2(['まだ いける ばしょが ない。'], ()=>{ C.G.mode='menu'; spellsOf(ci); });
    return;
  }
  menu(list.map(d=>d.name).concat(['戻る']), 'どこへ いく？',(k)=>{
    if(k>=list.length){ C.G.mode='menu'; spellsOf(ci); return; }
    const r = C.castReturn(ci, k);
    hud();
    if(!r.ok){ msg2(r.lines, ()=>{ C.G.mode='menu'; spellsOf(ci); }); return; }
    msg2(r.lines, ()=>{ C.G.mode='field'; C.doWarp(r.warp); });
  });
}
function applySpell(ci, key, ti){
  const r = C.castField(ci, key, ti);
  hud();
  msg2(r.lines, ()=>{ C.G.mode='menu'; spellsOf(ci); });
}

// ---------------- ぎょうしょう（あきない）----------------
// しょうにん バルドの ミニイベント。まちごとの そうばの さで もうける。
function openTrade(){
  const map = C.P.map;
  const keys = Object.keys(C.TRADE_GOODS);
  const items = ['仕入れる', 'うる', 'そうばを みる', '戻る'];
  menu(items, 'あきない（' + C.goodsTotal() + '/' + C.GOODS_LIMIT + '）', (k) => {
    if(k === 0) tradeBuy(map, keys);
    else if(k === 1) tradeSell(map, keys);
    else if(k === 2) tradeInfo(map, keys);
    else C.G.mode = 'field';
  });
}
function tradeBuy(map, keys){
  const list = keys.filter(k => C.tradePrice(map, k) !== null);
  const items = list.map(k => {
    const g = C.TRADE_GOODS[k];
    return g.name + '　' + C.tradePrice(map, k) + 'G'
         + (C.goodsCount(k) ? '（' + C.goodsCount(k) + '）' : '');
  }).concat(['戻る']);
  menu(items, '仕入れる　' + C.P.gold + 'G', (k) => {
    if(k >= list.length){ C.G.mode = 'menu'; openTrade(); return; }
    tradeAmount('仕入れる', list[k], (n) => {
      const r = C.buyGood(map, list[k], n);
      hud();
      msg2([r.msg], () => { C.G.mode = 'menu'; tradeBuy(map, keys); });
    });
  });
}
function tradeSell(map, keys){
  const list = keys.filter(k => C.goodsCount(k) > 0 && C.sellPrice(map, k) !== null);
  if(!list.length){
    msg2(['うれる しなものを もって いない。'], () => { C.G.mode = 'menu'; openTrade(); });
    return;
  }
  const items = list.map(k => {
    const g = C.TRADE_GOODS[k];
    return g.name + '×' + C.goodsCount(k) + '　' + C.sellPrice(map, k) + 'G';
  }).concat(['戻る']);
  menu(items, 'うる　' + C.P.gold + 'G', (k) => {
    if(k >= list.length){ C.G.mode = 'menu'; openTrade(); return; }
    tradeAmount('うる', list[k], (n) => {
      const r = C.sellGood(map, list[k], n);
      hud();
      msg2([r.msg], () => { C.G.mode = 'menu'; openTrade(); });
    });
  });
}
function tradeAmount(verb, key, done){
  const g = C.TRADE_GOODS[key];
  menu(['1こ', '5こ', '10こ', '戻る'], g.name + 'を ' + verb, (k) => {
    if(k >= 3){ C.G.mode = 'menu'; openTrade(); return; }
    done([1, 5, 10][k]);
  });
}
function tradeInfo(map, keys){
  const here = C.WORLD.mapName(map);
  const lines = ['＜' + here + 'の そうば＞'];
  keys.forEach(k => {
    const g = C.TRADE_GOODS[k];
    const b = C.tradePrice(map, k), s = C.sellPrice(map, k);
    if(b === null) return;
    const rel = b > g.base * 1.15 ? '　たかい' : b < g.base * 0.85 ? '　やすい' : '';
    lines.push('　' + g.name + '　かい ' + b + 'G ／ うり ' + s + 'G' + rel);
  });
  lines.push('（安い 町で 仕入れ、高い 町で 売る）');
  msg2(lines, () => { C.G.mode = 'menu'; openTrade(); });
}

// ---------------- 道具 ----------------
function openItems(){
  const items=C.itemList();
  const keys=C.keyItemList();
  const opts=items.map(it=>it.name+'　'+it.num)
    .concat(keys.map(k=>'◆'+k.name))
    .concat(['戻る']);
  if(!opts.length===0){ }
  if(!items.length && !keys.length){
    msg2(['道具を なにも もっていない。'],()=>{C.G.mode='field';}); return;
  }
  menu(opts,'道具',(k)=>{
    if(k>=items.length+keys.length){ C.G.mode='field'; return; }
    if(k>=items.length){                    // だいじなもの は せつめいを みるだけ
      const ki=keys[k-items.length];
      msg2(['◆'+ki.name, '　'+ki.desc], ()=>{ C.G.mode='menu'; openItems(); });
      return;
    }
    const it=items[k];
    if(C.party.length===1){ applyItem(it.kind,0); return; }
    menu(C.party.map(m=>m.name+'　HP'+m.hp+'/'+m.maxhp).concat(['戻る']),
         it.name+'を 誰に？',(mi)=>{
      if(mi>=C.party.length){ openItems(); return; }
      applyItem(it.kind,mi);
    });
  });
}
function applyItem(kind,mi){
  const r=C.useItemField(kind,mi);
  hud();
  msg2(r.lines, ()=>{ C.G.mode='menu'; openItems(); });
}

// ---------------- 装備 ----------------
function openEquip(){
  if(C.party.length===1){ equipMember(0); return; }
  menu(C.party.map(m=>m.name).concat(['戻る']),'装備',(mi)=>{
    if(mi>=C.party.length){ C.G.mode='field'; return; }
    equipMember(mi);
  });
}
function equipMember(mi){
  const m=C.party[mi];
  const w=m.weapon?m.weapon.name:'なし';
  const a=m.armor ?m.armor.name :'なし';
  menu(['右手：'+w, '体：'+a, '強さを みる', '戻る'], m.name+'の 装備',(k)=>{
    if(k===0) chooseEquip(mi,'weapon');
    else if(k===1) chooseEquip(mi,'armor');
    else if(k===2) msg2(C.equipSummary(mi), ()=>{ C.G.mode='menu'; equipMember(mi); });
    else C.G.mode='field';
  });
}
function chooseEquip(mi, slot){
  const m=C.party[mi];
  const cands=C.equipCandidates(slot);
  const label=slot==='weapon'?'右手':'からだ';
  const opts=cands.map(x=>x.it.name+'（+'+x.it.v+'）');
  if(m[slot]) opts.push('はずす');
  opts.push('戻る');
  if(!cands.length && !m[slot]){
    msg2(['ふくろに つけられる ものが ない。'], ()=>{ C.G.mode='menu'; equipMember(mi); });
    return;
  }
  menu(opts, label+'に なにを？',(k)=>{
    if(k<cands.length){
      const r=C.equipFromBag(mi, cands[k].i);
      hud(); msg2(r.lines, ()=>{ C.G.mode='menu'; equipMember(mi); });
    }else if(m[slot] && k===cands.length){
      const r=C.unequip(mi, slot);
      hud(); msg2(r.lines, ()=>{ C.G.mode='menu'; equipMember(mi); });
    }else{ C.G.mode='menu'; equipMember(mi); }
  });
}

// ---- ながおし たいおう（じゅうじキーは おしっぱなしで れんぞく いどう）----
const REPEATABLE='UDLR';
let held=null, holdDelay=null, holdTimer=null;
function startHold(k){
  ctx(); if(typeof BGM!=='undefined') BGM.resume();
  press(k);
  if(REPEATABLE.indexOf(k)<0) return;
  held=k; clearTimeout(holdDelay); clearInterval(holdTimer);
  holdDelay=setTimeout(()=>{
    holdTimer=setInterval(()=>{
      if(!held){ clearInterval(holdTimer); holdTimer=null; return; }
      press(held);
    }, 125);
  }, 190);
}
function endHold(){
  held=null;
  clearTimeout(holdDelay); clearInterval(holdTimer);
  holdDelay=holdTimer=null;
}
['U','D','L','R','A','B'].forEach(k=>{
  const el=$('btn'+k);
  el.addEventListener('touchstart',e=>{ e.preventDefault(); startHold(k); },{passive:false});
  el.addEventListener('touchend',e=>{ e.preventDefault(); endHold(); },{passive:false});
  el.addEventListener('touchcancel',endHold);
  el.addEventListener('mousedown',e=>{ e.preventDefault(); startHold(k); });
  el.addEventListener('mouseup',endHold);
  el.addEventListener('mouseleave',endHold);
});
// ゆびが ボタンの そとへ すべった ときも とめる
addEventListener('touchend',endHold);
addEventListener('touchcancel',endHold);
addEventListener('mouseup',endHold);
addEventListener('blur',endHold);
const KEYMAP={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',
  KeyZ:'A',KeyX:'B',Enter:'A',Space:'A'};
addEventListener('keydown',e=>{
  const k=KEYMAP[e.code]; if(!k) return;
  e.preventDefault();
  if(e.repeat) return;                 // ブラウザの リピートは つかわず じぜんの タイマーで
  startHold(k);
});
addEventListener('keyup',e=>{ if(KEYMAP[e.code]) endHold(); });

// ---------------- 起動 ----------------
let bootTimer=setTimeout(()=>{                  // ほけん：まんいち よびわすれても とまらない
  const b=$('boot');
  if(b && !b.classList.contains('hide')){
    console.warn('[boot] bootDone が よばれなかったため、じどうで とじました');
    bootDone();
  }
}, 8000);
function bootDone(){
  clearTimeout(bootTimer);
  const b=$('boot'); if(!b) return;
  b.classList.add('hide');
  setTimeout(()=>{ b.style.display='none'; }, 520);
}
function bootFail(msg){
  const b=$('boot'), e=$('boot-err'), m=$('boot-msg');
  if(m) m.textContent='きどうに しっぱいしました';
  if(e){ e.style.display='block'; e.textContent=msg; }
  if(b) b.classList.remove('hide');
}
addEventListener('error', ev=>{
  bootFail((ev.message||'エラー')+'\n（ページを さいよみこみ してください）');
});
// ★さいしょの そうさで オーディオを あける（iOSは タップが ないと おとが でない）
// ★かいじょは 1かいだけ。まいかい やると きょくを ならしなおして しまう。
let audioUnlocked = false;
const UNLOCK_EVENTS = ['touchstart','touchend','pointerdown','mousedown','click','keydown'];
function unlockAudio(){
  const ac = ctx();
  try{ if(ac && ac.state!=='running') ac.resume(); }catch(e){}
  if(typeof BGM!=='undefined'){
    if(BGM.attach) BGM.attach(ac);
    BGM.resume();
    if(BGM.unlockField) BGM.unlockField();
  }
  if(ac && ac.state==='running' && !audioUnlocked){
    audioUnlocked = true;
    UNLOCK_EVENTS.forEach(ev=>{ try{ removeEventListener(ev, unlockAudio); }catch(e){} });
  }
}
UNLOCK_EVENTS.forEach(ev=>{ addEventListener(ev, unlockAudio, {passive:true}); });
V.init();
C.bind(V, UI, A);

// ============================================================
// タイトル画面（IVから）
//   雲海に うかぶ 大陸・そらを よこぎる 白竜・ロゴ。
//   絵は すべて この場で えがく（画像ファイルは つかわない）。
// ============================================================
const Title = (function(){
  let cv=null, g=null, raf=0, t0=0, onGo=null, live=false;
  const W=()=>cv.width, H=()=>cv.height;

  function fit(){
    const el=document.getElementById('title');
    const dpr=Math.min(devicePixelRatio||1, 2);
    cv.width  = Math.max(2, Math.round(el.clientWidth *dpr));
    cv.height = Math.max(2, Math.round(el.clientHeight*dpr));
  }
  // ゆるやかに ながれる 雲の おび
  function cloudBand(y, amp, speed, col, t, seed){
    const w=W(), h=H();
    g.fillStyle=col; g.beginPath(); g.moveTo(0,h);
    for(let x=0;x<=w;x+=6){
      const p = x/w*6.28318;
      const yy = y*h
        + Math.sin(p*1.7 + t*speed + seed)*amp*h
        + Math.sin(p*3.1 - t*speed*0.7 + seed*2)*amp*h*0.45;
      g.lineTo(x, yy);
    }
    g.lineTo(w,h); g.closePath(); g.fill();
  }
  // うかぶ 大陸（三段の たな）の シルエット
  function continent(t){
    const w=W(), h=H();
    const cx=w*0.5, cy=h*0.46 + Math.sin(t*0.6)*h*0.008;
    const sc=Math.min(w,h);
    g.fillStyle='#141a30';
    const shelf=(dy,rw,rh)=>{
      g.beginPath();
      g.ellipse(cx, cy+dy*sc, rw*sc, rh*sc, 0, 0, 6.28318);
      g.fill();
    };
    // 下に のびる 岩の 根
    g.beginPath();
    g.moveTo(cx-sc*0.26, cy+sc*0.03);
    g.lineTo(cx-sc*0.06, cy+sc*0.30);
    g.lineTo(cx+sc*0.02, cy+sc*0.19);
    g.lineTo(cx+sc*0.10, cy+sc*0.34);
    g.lineTo(cx+sc*0.28, cy+sc*0.03);
    g.closePath(); g.fill();
    shelf(0.00, 0.30, 0.045);
    g.fillStyle='#1b2340'; shelf(-0.045, 0.21, 0.035);
    g.fillStyle='#222b4c'; shelf(-0.085, 0.12, 0.026);
    // 光珠の あかり
    for(let i=0;i<9;i++){
      const a=(i/9)*6.28318;
      const lx=cx+Math.cos(a)*sc*0.26, ly=cy-sc*0.012+Math.sin(a)*sc*0.028;
      const bl=0.55+0.45*Math.sin(t*2.2+i);
      g.fillStyle='rgba(180,220,255,'+(0.25+bl*0.5).toFixed(3)+')';
      g.beginPath(); g.arc(lx,ly, sc*0.006*(1+bl*0.5), 0, 6.28318); g.fill();
    }
    // 城の シルエット（いちばん うえの たな）
    g.fillStyle='#2a3358';
    const bx=cx, by=cy-sc*0.10;
    g.fillRect(bx-sc*0.035, by-sc*0.055, sc*0.07, sc*0.055);
    g.fillRect(bx-sc*0.052, by-sc*0.030, sc*0.018, sc*0.030);
    g.fillRect(bx+sc*0.034, by-sc*0.030, sc*0.018, sc*0.030);
    g.beginPath(); g.moveTo(bx-sc*0.040, by-sc*0.055);
    g.lineTo(bx, by-sc*0.095); g.lineTo(bx+sc*0.040, by-sc*0.055);
    g.closePath(); g.fill();
  }
  // 白竜が そらを よこぎる
  function dragon(t){
    const w=W(), h=H(), sc=Math.min(w,h);
    const cyc=(t*0.055)%1.6;
    if(cyc>1.0) return;
    const x = -w*0.15 + cyc*w*1.3;
    const y = h*0.24 + Math.sin(cyc*6.28318)*h*0.035;
    const s = sc*0.055;
    const flap = Math.sin(t*5.0);
    g.save(); g.translate(x,y);
    g.fillStyle='rgba(232,242,255,0.92)';
    g.beginPath(); g.ellipse(0,0, s*0.9, s*0.20, 0, 0, 6.28318); g.fill();   // からだ
    g.beginPath();                                                            // つばさ
    g.moveTo(-s*0.1,0); g.quadraticCurveTo(-s*0.5, -s*(0.55+flap*0.28), -s*1.15, -s*0.10);
    g.quadraticCurveTo(-s*0.5, -s*0.05, -s*0.1, s*0.05); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(-s*0.1,0); g.quadraticCurveTo(-s*0.5, s*(0.45-flap*0.22), -s*1.0, s*0.28);
    g.quadraticCurveTo(-s*0.5, s*0.10, -s*0.1, s*0.05); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(s*0.85,-s*0.05);                                  // あたま
    g.lineTo(s*1.25, s*0.02); g.lineTo(s*0.85, s*0.10); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-s*0.85,0);                                       // しっぽ
    g.quadraticCurveTo(-s*1.5, s*0.10, -s*1.9, -s*0.02);
    g.quadraticCurveTo(-s*1.4, s*0.02, -s*0.85, s*0.06); g.closePath(); g.fill();
    g.restore();
  }
  function logo(t){
    const w=W(), h=H(), sc=Math.min(w,h);
    const big = Math.max(20, sc*0.105), small = Math.max(11, sc*0.036);
    const y = h*0.20;
    g.textAlign='center'; g.textBaseline='middle';
    // にじむ ひかり
    g.save();
    g.shadowColor='rgba(140,200,255,0.85)'; g.shadowBlur=sc*0.06*(0.75+0.25*Math.sin(t*1.6));
    g.fillStyle='#f2f8ff';
    g.font='bold '+big+'px "Hiragino Mincho ProN","Yu Mincho",serif';
    g.fillText('ルミナクエスト', w/2, y);
    g.font='bold '+(big*1.15)+'px "Hiragino Mincho ProN","Yu Mincho",serif';
    g.fillText('Ⅳ', w/2, y+big*0.98);
    g.restore();
    g.fillStyle='rgba(200,222,255,0.9)';
    g.font=small+'px "Hiragino Mincho ProN","Yu Mincho",serif';
    g.fillText('〜 天空のルミナ 〜', w/2, y+big*1.78);
    // かざりの よこせん
    g.strokeStyle='rgba(160,200,255,0.45)'; g.lineWidth=Math.max(1,sc*0.002);
    const lw=sc*0.16;
    g.beginPath(); g.moveTo(w/2-lw, y+big*2.12); g.lineTo(w/2+lw, y+big*2.12); g.stroke();
  }
  function frame(now){
    if(!live) return;
    const t=(now-t0)/1000;
    const w=W(), h=H();
    const sky=g.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#070b18'); sky.addColorStop(0.45,'#122043'); sky.addColorStop(1,'#2b3f6b');
    g.fillStyle=sky; g.fillRect(0,0,w,h);
    // ほし
    for(let i=0;i<40;i++){
      const sx=((i*97)%100)/100*w, sy=((i*61)%45)/100*h;
      const tw=0.35+0.65*Math.abs(Math.sin(t*1.3+i));
      g.fillStyle='rgba(255,255,255,'+(tw*0.5).toFixed(3)+')';
      g.fillRect(sx, sy, Math.max(1,w*0.0016), Math.max(1,w*0.0016));
    }
    dragon(t);
    continent(t);
    cloudBand(0.62, 0.022, 0.30, 'rgba(120,150,205,0.30)', t, 0.0);
    cloudBand(0.72, 0.028, 0.46, 'rgba(150,180,225,0.38)', t, 1.7);
    cloudBand(0.84, 0.034, 0.66, 'rgba(196,216,245,0.50)', t, 3.4);
    logo(t);
    raf=requestAnimationFrame(frame);
  }
  function tap(){ if(live && onGo){ const f=onGo; onGo=null; hide(); f(); } }
  function show(go){
    const el=document.getElementById('title');
    if(!el){ go(); return; }
    cv=document.getElementById('titlecv'); g=cv.getContext('2d');
    onGo=go; live=true; el.classList.add('show');
    fit(); t0=performance.now(); raf=requestAnimationFrame(frame);
    window.addEventListener('resize', fit);
    el.addEventListener('pointerdown', tap);
    document.addEventListener('keydown', tap);
  }
  function hide(){
    live=false; cancelAnimationFrame(raf);
    const el=document.getElementById('title');
    if(el){ el.classList.remove('show'); el.removeEventListener('pointerdown', tap); }
    document.removeEventListener('keydown', tap);
    window.removeEventListener('resize', fit);
  }
  return {show, hide, get on(){return live;}};
})();

// ---------------- タイトル ----------------
function titleScreen(){
  C.G.mode='menu';
  V.buildMap(C.P.map); V.setActors(true); hud();
  bootDone();                                   // ★タイトルでも ローディングを かならず 消す
  Title.show(()=>titleMenu());                  // ★まず タイトル画面。タップで メニューへ
}
function titleMenu(){
  const info=C.saveInfo();
  C.G.mode='menu';
  label('ルミナクエストIV 〜天空のルミナ〜');
  const cont = info && !info.broken
    ? 'つづきから（'+info.lead+' Lv'+info.lv+'）' : 'つづきから';
  menu(['はじめから',cont,'章を 選ぶ'],'ルミナクエストIV',(sel)=>{
    if(sel===1){
      if(C.loadGame()) startGame(true);
      else msg2([C.lastSaveError||'きろくが よめませんでした',
                 'はじめから あそびます。'],()=>{ C.freshState(); startGame(false); });
    }else if(sel===2){ chapterSelect(); }
    else{ C.freshState(); startGame(false); }
  });
}
// ---------------- 章を 選ぶ ----------------
// つくりおえた しょうを えらんで はじめる（ためしに あそぶ ため）。
function chapterSelect(){
  const nos = (typeof CHAPTERS_DATA!=='undefined') ? CHAPTERS_DATA.list() : [1];
  const items = nos.map(no=>{
    const c = CHAPTERS_DATA.get(no);
    const nm = (c.party||[]).map(k=>(C.CLASSES[k]||{}).name||k);
    const who = nm.length>2 ? nm[0]+'たち' : nm.join('・');   // ★ながい れつは みきれる ため
    return '第'+no+'しょう　'+c.title+'（'+who+'）';
  }).concat(['戻る']);
  menu(items, '章を 選ぶ', (k)=>{
    if(k>=nos.length){ titleScreen(); return; }
    const no = nos[k];
    C.freshState();
    if(no!==1) C.switchChapter(no);
    startGame(false);
  });
}
function startGame(loaded){
  V.buildMap(C.P.map);
  bootDone();
  if(typeof BGM!=='undefined') BGM.playField(trackFor(C.P.map));   // ばしょの きょく
  V.setActors(true);
  label(C.WORLD.mapName(C.P.map));
  hud();
  C.G.mode='field';
  if(!loaded){
    // ★しょうごとの はじまり（章データから）。
    //   ここを かためがきに していた ため、第3章でも「ヴェルサ」と でていた。
    const no = C.G.chapter || 1;
    const cd = (typeof CHAPTERS_DATA!=='undefined') ? CHAPTERS_DATA.get(no) : null;
    const title = '第' + no + '章';
    const sub = cd ? cd.title : '';
    const open = (cd && cd.opening) ? cd.opening
               : ['（Aボタン：しらべる・はなす　Bボタン：メニュー）'];
    V.chapterCard(title, sub, ()=>{
      msg2(open, ()=>{ C.G.mode='field'; });
    });
  }
}
C.freshState();
// ★セーブの ありなしに かかわらず タイトルを だす（しょうを えらべる ように）
titleScreen();
requestAnimationFrame(V.loop);
})();