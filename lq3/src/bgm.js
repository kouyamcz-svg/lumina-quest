"use strict";
// ============================================================
// ルミナクエストIII / BGM エンジン
// せんとうきょく「双嶺の誓約」（144BPM・84しょうせつ・7セクション）を
// ライブさいせいする。おんげんファイルは つかわず、すべて はっしんきで つくる。
// ※ きょくデータ・おんしょくは ユーザーていきょうの オリジナル。
// ============================================================
const BGM = (function(){

/* ══ きょくデータ ══ */
const BPM=144, SPB=60/BPM, BAR=4*SPB, BARS=84, LOOP=BARS*BAR, TAIL=3.2;
const mf = m => 440*Math.pow(2,(m-69)/12);

// 和音: {b:ベース, n:[内声]}
const C={
  Em:{b:40,n:[52,55,59]},
  C :{b:36,n:[52,55,60]},
  G :{b:43,n:[50,55,59]},
  D :{b:38,n:[50,54,57]},
  Am:{b:45,n:[52,57,60]},
  Bm:{b:47,n:[50,54,59]},
  B7:{b:47,n:[51,54,57,59]}
};

const P1=['Em','C','G','D','Em','C','Am','B7'];
const P2=['Am','Bm','C','D','Am','Bm','C','B7'];
const CHART=[
  'Em','Em','Em','Em','C','C','D','D',            // 1-8   Intro
  ...P1,...P1,                                     // 9-24  A
  ...P2,...P2,                                     // 25-40 B
  ...P1,...P1,                                     // 41-56 Chorus
  'C','D','Em','Em','C','D','B7','B7',             // 57-64 Bridge
  ...P1,...P1,                                     // 65-80 Final
  'Em','C','D','B7'                                // 81-84 Loop out
];

const SECTIONS=[
  {n:'INTRO', s:0,  l:8 },
  {n:'A',     s:8,  l:16},
  {n:'B',     s:24, l:16},
  {n:'CHORUS',s:40, l:16},
  {n:'BRIDGE',s:56, l:8 },
  {n:'FINAL', s:64, l:16},
  {n:'LOOP',  s:80, l:4 }
];

// 旋律 [拍位置, MIDI, 長さ(拍)]
const M_INTRO=[[16,67,1],[17,72,1],[18,76,2],[20,76,2],[22,74,2],
               [24,69,1],[25,74,1],[26,78,2],[28,78,2],[30,74,1],[31,71,1]];
const M_A=[[0,64,1],[1,67,1],[2,71,2],[4,72,1],[5,71,1],[6,67,2],
           [8,74,1],[9,71,1],[10,67,2],[12,69,1],[13,66,1],[14,62,2],
           [16,64,1],[17,67,1],[18,71,1],[19,76,1],[20,72,2],[22,67,2],
           [24,69,1],[25,72,1],[26,76,2],[28,78,1],[29,75,1],[30,71,2],
           [32,71,1],[33,74,1],[34,76,2],[36,76,1],[37,74,1],[38,72,2],
           [40,74,1],[41,79,1],[42,78,2],[44,76,2],[46,74,2],
           [48,71,1],[49,76,1],[50,79,2],[52,76,2],[54,72,2],
           [56,69,1],[57,72,1],[58,76,2],[60,78,2],[62,75,2]];
const M_B=[[0,69,1],[1,71,1],[2,72,2],[4,71,1],[5,72,1],[6,74,2],
           [8,72,1],[9,74,1],[10,76,2],[12,74,1],[13,76,1],[14,78,2],
           [16,69,1],[17,72,1],[18,76,2],[20,71,1],[21,74,1],[22,78,2],
           [24,72,1],[25,76,1],[26,79,2],[28,78,2],[30,71,2],
           [32,76,1],[33,74,1],[34,72,1],[35,69,1],[36,78,1],[37,74,1],[38,71,2],
           [40,79,1],[41,76,1],[42,72,2],[44,81,2],[46,78,2],
           [48,76,1],[49,72,1],[50,69,2],[52,78,1],[53,74,1],[54,71,2],
           [56,79,2],[58,76,2],[60,78,1],[61,75,1],[62,71,2]];
const M_CH=[[0,71,1],[1,71,1],[2,67,1],[3,69,1],[4,72,2],[6,71,2],
            [8,71,1],[9,74,1],[10,71,2],[12,69,2],[14,66,2],
            [16,76,1],[17,74,1],[18,71,1],[19,67,1],[20,69,2],[22,67,2],
            [24,69,1],[25,71,1],[26,72,2],[28,71,2],[30,66,2],
            [32,76,1],[33,76,1],[34,74,1],[35,71,1],[36,72,2],[38,74,2],
            [40,74,1],[41,79,1],[42,74,2],[44,78,2],[46,76,2],
            [48,79,1],[49,78,1],[50,76,2],[52,76,2],[54,72,2],
            [56,69,1],[57,72,1],[58,76,2],[60,78,2],[62,75,2]];
const M_BR=[[0,64,2],[2,67,2],[4,66,2],[6,69,2],[8,71,4],
            [12,67,1],[13,69,1],[14,71,2],[16,72,2],[18,76,2],
            [20,74,2],[22,78,2],[24,75,2],[26,78,2],[28,71,1],[29,74,1],[30,78,2]];
const M_LO=[[0,76,1],[1,74,1],[2,71,2],[4,72,2],[6,67,2],
            [8,69,1],[9,74,1],[10,78,2],[12,78,1],[13,75,1],[14,71,1]];

/* ══════════════════════════════════════════════
   2. イベント生成
   ══════════════════════════════════════════════ */

/* ══ イベントの くみたて ══ */
function buildEvents(){
  const E=[];
  const add=(t,g,i,p)=>{E.push({t,g,i,p:p||{}})};
  const bt=b=>b*SPB;                 // 拍→秒
  const ch=bar=>C[CHART[bar]];

  const melody=(startBar,data,inst,vel,oct,grp)=>{
    const t0=startBar*BAR;
    data.forEach(([b,n,d])=>add(t0+bt(b),grp,inst,{f:mf(n+(oct||0)),d:d*SPB*0.94,v:vel}));
  };

  /* --- INTRO 1-8 --- */
  for(let b=0;b<8;b++){
    const c=ch(b), t=b*BAR;
    // 低弦トレモロ
    for(let k=0;k<8;k++) add(t+bt(k*0.5),'strings','strTrem',{f:mf(c.b+12),d:SPB*0.5,v:b<4?0.10:0.15});
    add(t,'bass','bass',{f:mf(c.b),d:BAR*0.95,v:0.34});
    add(t,'perc','timp',{f:mf(c.b-12),v:b%2===0?0.5:0.3});
    if(b>=2) add(t+bt(2),'perc','timp',{f:mf(c.b-12),v:0.26});
    // 内声パッド
    if(b>=2) c.n.forEach(n=>add(t,'strings','strings',{f:mf(n),d:BAR*0.98,v:0.09,p:(n%3-1)*0.5}));
    if(b>=4) c.n.forEach(n=>add(t,'choir','choir',{f:mf(n+12),d:BAR*0.98,v:0.07}));
  }
  add(0,'perc','crash',{v:0.5});
  add(0,'fx','impact',{v:0.7});
  melody(0,M_INTRO,'brass',0.30,0,'brass');
  melody(0,M_INTRO,'brass',0.16,-12,'brass');
  add(7*BAR,'fx','riser',{d:BAR,v:0.24});
  add(6*BAR,'perc','snareRoll',{d:BAR*2,v:0.20});

  /* --- 汎用セクション描画 --- */
  const drive=(startBar,len,opt)=>{
    for(let i=0;i<len;i++){
      const bar=startBar+i, c=ch(bar), t=bar*BAR;

      // ベース: ルート中心の8分
      for(let k=0;k<8;k++){
        const n=(k===6)?c.b+7:c.b;
        add(t+bt(k*0.5),'bass','bass',{f:mf(n),d:SPB*0.44,v:0.30});
        if(opt.sub) add(t+bt(k*0.5),'bass','sub',{f:mf(n-12),d:SPB*0.44,v:0.24});
      }

      // 弦の8分刻み
      for(let k=0;k<8;k++){
        c.n.forEach((n,j)=>{
          add(t+bt(k*0.5),'strings','strStac',
            {f:mf(n+12),d:SPB*0.40,v:opt.str*(j===0?1:0.8),p:(j-1)*0.62});
        });
      }
      // 持続する上声
      if(opt.pad) c.n.forEach(n=>add(t,'strings','strings',{f:mf(n+12),d:BAR*0.98,v:opt.pad,p:(n%2?0.7:-0.7)}));

      // ブラスの和音アクセント
      if(opt.stab){
        [0,2.5].forEach(k=>c.n.forEach(n=>
          add(t+bt(k),'brass','brass',{f:mf(n),d:SPB*0.55,v:opt.stab,p:0})));
      }
      // 低音ブラス
      if(opt.low) add(t,'brass','brass',{f:mf(c.b),d:BAR*0.9,v:opt.low,p:0});
      // 合唱
      if(opt.choir) c.n.forEach(n=>add(t,'choir','choir',{f:mf(n+12),d:BAR*0.99,v:opt.choir}));
      // 木管
      if(opt.wood) c.n.forEach((n,j)=>{ if(j===2) add(t,'wood','wood',{f:mf(n+12),d:BAR*0.9,v:opt.wood,p:-0.4}); });

      /* ドラム */
      if(opt.drums){
        add(t,'perc','kick',{v:0.62});
        add(t+bt(1.5),'perc','kick',{v:0.40});
        add(t+bt(2),'perc','kick',{v:0.52});
        add(t+bt(1),'perc','snare',{v:0.50});
        add(t+bt(3),'perc','snare',{v:0.55});
        if(opt.dense){ add(t+bt(2.75),'perc','kick',{v:0.34}); add(t+bt(3.5),'perc','snare',{v:0.22}); }
        for(let k=0;k<8;k++) add(t+bt(k*0.5),'perc','ride',{v:k%2?0.09:0.15});
        if(i%8===0) add(t,'perc','crash',{v:0.42});
        if(i%4===3){ // フィル
          [2,2.5,3,3.5].forEach((k,j)=>add(t+bt(k),'perc','tom',{f:190-j*32,v:0.42}));
        }
      }
      if(opt.timp && i%2===0) add(t,'perc','timp',{f:mf(c.b-12),v:0.34});
    }
  };

  /* --- A 9-24 --- */
  drive(8,16,{str:0.085,drums:true});
  melody(8,M_A,'wood',0.22,0,'wood');
  melody(8,M_A,'strings',0.13,0,'strings');

  /* --- B 25-40 --- */
  drive(24,16,{str:0.10,drums:true,stab:0.13,sub:true,timp:true});
  melody(24,M_B,'brass',0.24,0,'brass');
  melody(24,M_B,'wood',0.13,0,'wood');
  add(39*BAR+bt(2),'fx','revCym',{d:BAR*0.5,v:0.30});

  /* --- CHORUS 41-56 --- */
  drive(40,16,{str:0.115,pad:0.055,drums:true,dense:true,stab:0.14,low:0.12,choir:0.075,sub:true,timp:true});
  melody(40,M_CH,'brass',0.34,0,'brass');
  melody(40,M_CH,'brass',0.15,-12,'brass');
  melody(40,M_CH,'wood',0.10,12,'wood');

  /* --- BRIDGE 57-64 --- */
  for(let i=0;i<8;i++){
    const bar=56+i, c=ch(bar), t=bar*BAR;
    c.n.forEach(n=>add(t,'choir','choir',{f:mf(n+12),d:BAR*0.99,v:i<4?0.10:0.085}));
    add(t,'bass','bass',{f:mf(c.b),d:BAR*0.95,v:i<4?0.22:0.30});
    if(i>=2) c.n.forEach(n=>add(t,'strings','strings',{f:mf(n+12),d:BAR*0.98,v:0.07,p:(n%2?0.7:-0.7)}));
    if(i>=4){
      for(let k=0;k<8;k++) c.n.forEach((n,j)=>
        add(t+bt(k*0.5),'strings','strStac',{f:mf(n+12),d:SPB*0.40,v:0.045+i*0.014,p:(j-1)*0.62}));
      add(t,'perc','timp',{f:mf(c.b-12),v:0.30});
      add(t+bt(2),'perc','timp',{f:mf(c.b-12),v:0.30});
    }
    if(i>=6){
      add(t,'perc','kick',{v:0.55});
      add(t+bt(2),'perc','kick',{v:0.55});
      add(t+bt(1),'perc','snare',{v:0.40});
      add(t+bt(3),'perc','snare',{v:0.45});
    }
  }
  melody(56,M_BR,'wood',0.24,0,'wood');
  melody(56,M_BR,'strings',0.14,0,'strings');
  add(56*BAR,'fx','revCym',{d:BAR,v:0.22});
  add(62*BAR,'fx','riser',{d:BAR*2,v:0.30});
  add(62*BAR,'perc','snareRoll',{d:BAR*2,v:0.28});

  /* --- FINAL 65-80 --- */
  drive(64,16,{str:0.125,pad:0.06,drums:true,dense:true,stab:0.16,low:0.14,choir:0.095,wood:0.07,sub:true,timp:true});
  melody(64,M_CH,'brass',0.36,0,'brass');
  melody(64,M_CH,'brass',0.19,-12,'brass');
  melody(64,M_CH,'wood',0.13,12,'wood');
  melody(64,M_CH,'choir',0.09,0,'choir');
  add(64*BAR,'fx','impact',{v:0.6});
  add(64*BAR,'perc','crash',{v:0.55});

  /* --- LOOP OUT 81-84 --- */
  drive(80,4,{str:0.115,pad:0.055,drums:true,dense:true,stab:0.15,low:0.13,choir:0.08,sub:true,timp:true});
  melody(80,M_LO,'brass',0.34,0,'brass');
  melody(80,M_LO,'brass',0.16,-12,'brass');
  add(83*BAR+bt(2),'fx','revCym',{d:BAR*0.5,v:0.34});
  add(83*BAR+bt(3),'perc','timp',{f:mf(35),v:0.42});

  E.sort((a,b)=>a.t-b.t);
  return E;
}
const EV=buildEvents();

/* ══════════════════════════════════════════════
   3. オーディオグラフ
   ══════════════════════════════════════════════ */

/* ══ おとの グラフと がっき ══ */
function makeIR(ctx,sec,decay){
  const sr=ctx.sampleRate, len=Math.floor(sr*sec);
  const b=ctx.createBuffer(2,len,sr);
  for(let c=0;c<2;c++){
    const d=b.getChannelData(c);
    for(let i=0;i<len;i++){
      const t=i/len;
      const early=(i>sr*0.012&&i<sr*0.045)?1.6:1;
      d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*early;
    }
  }
  return b;
}
function makeNoise(ctx){
  const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  return b;
}
function makeCurve(k){
  const n=1024,c=new Float32Array(n);
  for(let i=0;i<n;i++){const x=i*2/n-1;c[i]=(1+k)*x/(1+k*Math.abs(x));}
  return c;
}

function buildGraph(ctx){
  const out=ctx.createGain(); out.gain.value=0.82;
  const lim=ctx.createDynamicsCompressor();
  lim.threshold.value=-8; lim.knee.value=4; lim.ratio.value=8;
  lim.attack.value=0.004; lim.release.value=0.18;
  lim.connect(out); out.connect(ctx.destination);

  const glue=ctx.createDynamicsCompressor();
  glue.threshold.value=-20; glue.knee.value=12; glue.ratio.value=2.4;
  glue.attack.value=0.012; glue.release.value=0.24;
  glue.connect(lim);

  const dry=ctx.createGain(); dry.gain.value=1; dry.connect(glue);

  const conv=ctx.createConvolver(); conv.buffer=makeIR(ctx,2.9,2.3);
  const verbIn=ctx.createGain(); verbIn.gain.value=1;
  const verbOut=ctx.createGain(); verbOut.gain.value=0.75;
  const damp=ctx.createBiquadFilter(); damp.type='lowpass'; damp.frequency.value=5200;
  const pre=ctx.createDelay(0.1); pre.delayTime.value=0.026;
  verbIn.connect(pre); pre.connect(damp); damp.connect(conv); conv.connect(verbOut); verbOut.connect(glue);

  return {ctx,out,dry,verb:verbIn,noise:makeNoise(ctx),shape:makeCurve(2.6)};
}

/* ══ 楽器 ══ */
function chain(G,t,pan,send){
  const g=G.ctx.createGain(); g.gain.value=0;
  const p=G.ctx.createStereoPanner?G.ctx.createStereoPanner():null;
  if(p){p.pan.value=pan||0; g.connect(p); p.connect(G.dry);}
  else g.connect(G.dry);
  const s=G.ctx.createGain(); s.gain.value=send;
  g.connect(s); s.connect(G.verb);
  return g;
}
function env(g,t,a,d,dur,v){
  const p=g.gain;
  p.setValueAtTime(0.0001,t);
  p.linearRampToValueAtTime(v,t+a);
  p.linearRampToValueAtTime(v*0.78,t+a+0.08);
  p.setValueAtTime(v*0.78,Math.max(t+a+0.08,t+dur-d));
  p.exponentialRampToValueAtTime(0.0001,t+dur+d);
}

const INST={
strings(G,t,p){
  const g=chain(G,t,p.p||0,0.42);
  const f=G.ctx.createBiquadFilter(); f.type='lowpass';
  f.frequency.setValueAtTime(700,t); f.frequency.linearRampToValueAtTime(2600,t+0.35);
  f.Q.value=0.6; f.connect(g);
  [-7,0,7].forEach(dt=>{
    const o=G.ctx.createOscillator(); o.type='sawtooth';
    o.frequency.value=p.f; o.detune.value=dt;
    o.connect(f); o.start(t); o.stop(t+p.d+0.6);
  });
  env(g,t,0.16,0.32,p.d,p.v);
},
strStac(G,t,p){
  const g=chain(G,t,p.p||0,0.30);
  const f=G.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2900; f.Q.value=0.7;
  f.connect(g);
  [-6,6].forEach(dt=>{
    const o=G.ctx.createOscillator(); o.type='sawtooth';
    o.frequency.value=p.f; o.detune.value=dt;
    o.connect(f); o.start(t); o.stop(t+p.d+0.2);
  });
  const gp=g.gain;
  gp.setValueAtTime(0.0001,t);
  gp.linearRampToValueAtTime(p.v,t+0.012);
  gp.exponentialRampToValueAtTime(0.0001,t+p.d+0.12);
},
strTrem(G,t,p){
  const g=chain(G,t,p.p||0,0.5);
  const f=G.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1500; f.connect(g);
  const o=G.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=p.f;
  o.connect(f); o.start(t); o.stop(t+p.d+0.2);
  const gp=g.gain;
  gp.setValueAtTime(0.0001,t);
  gp.linearRampToValueAtTime(p.v,t+0.03);
  gp.exponentialRampToValueAtTime(0.0001,t+p.d+0.1);
},
brass(G,t,p){
  const g=chain(G,t,p.p||0,0.34);
  const sh=G.ctx.createWaveShaper(); sh.curve=G.shape; sh.oversample='2x'; sh.connect(g);
  const f=G.ctx.createBiquadFilter(); f.type='lowpass'; f.Q.value=2.2;
  f.frequency.setValueAtTime(420,t);
  f.frequency.linearRampToValueAtTime(3400,t+0.055);
  f.frequency.exponentialRampToValueAtTime(1700,t+Math.max(0.2,p.d));
  f.connect(sh);
  const o=G.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=p.f;
  const o2=G.ctx.createOscillator(); o2.type='square'; o2.frequency.value=p.f; o2.detune.value=4;
  const m=G.ctx.createGain(); m.gain.value=0.42; o2.connect(m); m.connect(f);
  o.connect(f);
  [o,o2].forEach(x=>{x.start(t);x.stop(t+p.d+0.35);});
  const lfo=G.ctx.createOscillator(); lfo.frequency.value=5.1;
  const la=G.ctx.createGain(); la.gain.value=4;
  lfo.connect(la); la.connect(o.detune); lfo.start(t); lfo.stop(t+p.d+0.35);
  env(g,t,0.028,0.2,p.d,p.v);
},
wood(G,t,p){
  const g=chain(G,t,p.p||0,0.45);
  const f=G.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2400; f.connect(g);
  const o=G.ctx.createOscillator(); o.type='triangle'; o.frequency.value=p.f;
  const o2=G.ctx.createOscillator(); o2.type='sine'; o2.frequency.value=p.f*2;
  const m=G.ctx.createGain(); m.gain.value=0.18; o2.connect(m); m.connect(f);
  o.connect(f);
  const lfo=G.ctx.createOscillator(); lfo.frequency.value=5.6;
  const la=G.ctx.createGain(); la.gain.value=6;
  lfo.connect(la); la.connect(o.detune);
  [o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+p.d+0.3);});
  env(g,t,0.06,0.22,p.d,p.v);
},
choir(G,t,p){
  const g=chain(G,t,0,0.95);
  const mix=G.ctx.createGain(); mix.gain.value=0.5;
  [[720,1.0],[1180,0.6],[2600,0.25]].forEach(([fr,amt])=>{
    const bp=G.ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=fr; bp.Q.value=4.5;
    const ga=G.ctx.createGain(); ga.gain.value=amt;
    mix.connect(bp); bp.connect(ga); ga.connect(g);
  });
  const dark=G.ctx.createBiquadFilter(); dark.type='lowpass'; dark.frequency.value=3000;
  mix.connect(dark); dark.connect(g);
  [-9,0,9,14].forEach(dt=>{
    const o=G.ctx.createOscillator(); o.type='sawtooth';
    o.frequency.value=p.f; o.detune.value=dt;
    const lfo=G.ctx.createOscillator(); lfo.frequency.value=4.4+Math.random();
    const la=G.ctx.createGain(); la.gain.value=5.5;
    lfo.connect(la); la.connect(o.detune);
    o.connect(mix); o.start(t); o.stop(t+p.d+0.9);
    lfo.start(t); lfo.stop(t+p.d+0.9);
  });
  env(g,t,0.3,0.55,p.d,p.v);
},
bass(G,t,p){
  const g=chain(G,t,0,0.10);
  const f=G.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=520; f.Q.value=1.2; f.connect(g);
  const o=G.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=p.f;
  const o2=G.ctx.createOscillator(); o2.type='sine'; o2.frequency.value=p.f;
  const m=G.ctx.createGain(); m.gain.value=0.9; o2.connect(m); m.connect(g);
  o.connect(f);
  [o,o2].forEach(x=>{x.start(t);x.stop(t+p.d+0.15);});
  const gp=g.gain;
  gp.setValueAtTime(0.0001,t);
  gp.linearRampToValueAtTime(p.v,t+0.014);
  gp.exponentialRampToValueAtTime(0.0001,t+p.d+0.09);
},
sub(G,t,p){
  const g=chain(G,t,0,0);
  const o=G.ctx.createOscillator(); o.type='sine'; o.frequency.value=p.f;
  o.connect(g); o.start(t); o.stop(t+p.d+0.1);
  const gp=g.gain;
  gp.setValueAtTime(0.0001,t);
  gp.linearRampToValueAtTime(p.v,t+0.02);
  gp.exponentialRampToValueAtTime(0.0001,t+p.d+0.06);
},
kick(G,t,p){
  const g=chain(G,t,0,0.06);
  const o=G.ctx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(155,t);
  o.frequency.exponentialRampToValueAtTime(44,t+0.10);
  o.connect(g); o.start(t); o.stop(t+0.34);
  const gp=g.gain;
  gp.setValueAtTime(0.0001,t);
  gp.linearRampToValueAtTime(p.v,t+0.005);
  gp.exponentialRampToValueAtTime(0.0001,t+0.30);
  // クリック
  const n=G.ctx.createBufferSource(); n.buffer=G.noise;
  const hp=G.ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1600;
  const ng=chain(G,t,0,0.03);
  n.connect(hp); hp.connect(ng); n.start(t); n.stop(t+0.03);
  ng.gain.setValueAtTime(p.v*0.28,t);
  ng.gain.exponentialRampToValueAtTime(0.0001,t+0.028);
},
snare(G,t,p){
  const g=chain(G,t,0.05,0.36);
  const n=G.ctx.createBufferSource(); n.buffer=G.noise;
  const bp=G.ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1900; bp.Q.value=0.8;
  n.connect(bp); bp.connect(g); n.start(t); n.stop(t+0.3);
  g.gain.setValueAtTime(p.v,t);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.17);
  const tg=chain(G,t,0.05,0.2);
  const o=G.ctx.createOscillator(); o.type='triangle'; o.frequency.value=196;
  o.connect(tg); o.start(t); o.stop(t+0.14);
  tg.gain.setValueAtTime(p.v*0.5,t);
  tg.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
},
snareRoll(G,t,p){
  const step=SPB/4, n=Math.floor(p.d/step);
  for(let i=0;i<n;i++){
    const v=p.v*(0.28+0.72*(i/n));
    INST.snare(G,t+i*step,{v:v*0.55});
  }
},
tom(G,t,p){
  const g=chain(G,t,(Math.random()-0.5)*0.7,0.30);
  const o=G.ctx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(p.f,t);
  o.frequency.exponentialRampToValueAtTime(p.f*0.55,t+0.22);
  o.connect(g); o.start(t); o.stop(t+0.32);
  g.gain.setValueAtTime(p.v,t);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.28);
},
timp(G,t,p){
  const g=chain(G,t,-0.25,0.6);
  const o=G.ctx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(p.f*1.5,t);
  o.frequency.exponentialRampToValueAtTime(p.f,t+0.09);
  const o2=G.ctx.createOscillator(); o2.type='triangle'; o2.frequency.value=p.f*2.02;
  const m=G.ctx.createGain(); m.gain.value=0.16; o2.connect(m); m.connect(g);
  o.connect(g);
  [o,o2].forEach(x=>{x.start(t);x.stop(t+0.9);});
  g.gain.setValueAtTime(p.v,t);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.85);
},
ride(G,t,p){
  const g=chain(G,t,0.4,0.30);
  const n=G.ctx.createBufferSource(); n.buffer=G.noise;
  const hp=G.ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6800;
  n.connect(hp); hp.connect(g); n.start(t); n.stop(t+0.14);
  g.gain.setValueAtTime(p.v,t);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
},
crash(G,t,p){
  const g=chain(G,t,-0.15,0.75);
  const n=G.ctx.createBufferSource(); n.buffer=G.noise;
  const hp=G.ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3800;
  n.connect(hp); hp.connect(g); n.start(t); n.stop(t+1.8);
  g.gain.setValueAtTime(p.v,t);
  g.gain.exponentialRampToValueAtTime(0.0001,t+1.7);
},
revCym(G,t,p){
  const g=chain(G,t,0,0.7);
  const n=G.ctx.createBufferSource(); n.buffer=G.noise;
  const hp=G.ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=2600;
  n.connect(hp); hp.connect(g); n.start(t); n.stop(t+p.d+0.05);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(p.v,t+p.d);
  g.gain.linearRampToValueAtTime(0.0001,t+p.d+0.03);
},
riser(G,t,p){
  const g=chain(G,t,0,0.45);
  const n=G.ctx.createBufferSource(); n.buffer=G.noise; n.loop=true;
  const bp=G.ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=3.5;
  bp.frequency.setValueAtTime(320,t);
  bp.frequency.exponentialRampToValueAtTime(7200,t+p.d);
  n.connect(bp); bp.connect(g); n.start(t); n.stop(t+p.d+0.05);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(p.v,t+p.d*0.92);
  g.gain.linearRampToValueAtTime(0.0001,t+p.d+0.04);
},
impact(G,t,p){
  const g=chain(G,t,0,0.55);
  const o=G.ctx.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(180,t);
  o.frequency.exponentialRampToValueAtTime(28,t+0.55);
  o.connect(g); o.start(t); o.stop(t+0.9);
  g.gain.setValueAtTime(p.v,t);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.85);
  const ng=chain(G,t,0,0.6);
  const n=G.ctx.createBufferSource(); n.buffer=G.noise;
  const lp=G.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900;
  n.connect(lp); lp.connect(ng); n.start(t); n.stop(t+0.5);
  ng.gain.setValueAtTime(p.v*0.5,t);
  ng.gain.exponentialRampToValueAtTime(0.0001,t+0.45);
}
};


/* ══ さいせい（ライブ・さきよみスケジューリング）══ */
// セクションの かいし じこく（びょう）
const SECTION_AT = (()=>{
  const at={}; let bar=0;
  SECTIONS.forEach(s=>{ at[s.n]=bar*BAR; bar+=s.l; });
  return at;
})();
// ★せんとうは みじかい。13びょうの イントロを ながしていると
//   ほんぺんに はいる まえに たたかいが おわり、ほぼ むおんに きこえる。
//   そこで もりあがる ところから はじめ、そこへ ループさせる。
const START_AT = {
  battle: SECTION_AT.A      || 0,   // ふつうの せんとう ＝ Aメロから
  boss:   SECTION_AT.CHORUS || 0,   // ボス ＝ サビから
};
let AC=null, G=null, EVENTS=null, timer=null, playing=null;
let t0=0, idx=0, loopN=0, vol=0.42, lastNow=-1, stall=0, pending=null;
let songStart=0, loopSpan=1, idxStart=0;
const LOOKAHEAD=0.35, TICK=60;

// ★こうかおんと おなじ AudioContext を つかう。
//   べつべつに つくると、かたほうだけ「ていし」の ままに なり、
//   さいしょの すうびょうだけ なって とまる（じっさいに でた ふぐあい）。
let SHARED = null;
// ★こうかおんと べつの コンテキストに なると、こちらだけ「ていし」の まま に なり
//   おとが でない。わたされた ものを かならず つかう。
function attach(ac){
  if(!ac) return;
  SHARED = ac;
  if(AC !== ac){
    AC = ac;
    G = null;                    // ふるい コンテキストの グラフは すてて つくりなおす
  }
}
function ctx(){
  try{
    AC = AC || SHARED || new (window.AudioContext||window.webkitAudioContext)();
  }catch(e){}
  return AC;
}
// おわった はっしんきを じどうで きりはなす。
// これを しないと たまりつづけ、iOSでは あたらしい おとが つくれなく なる。
let cleaned = null;
function autoClean(ac){
  if(!ac || cleaned===ac) return;
  cleaned = ac;
  ['createOscillator','createBufferSource'].forEach(m=>{
    if(typeof ac[m] !== 'function') return;
    const orig = ac[m].bind(ac);
    ac[m] = function(){
      const n = orig();
      try{
        n.addEventListener('ended', ()=>{ try{ n.disconnect(); }catch(e){} }, {once:true});
      }catch(e){
        try{ n.onended = ()=>{ try{ n.disconnect(); }catch(e2){} }; }catch(e3){}
      }
      return n;
    };
  });
}
function ensure(){
  if(!ctx()) return false;
  autoClean(AC);
  if(!G){
    try{ G = buildGraph(AC); }
    catch(e){ console.warn('[bgm] おとの グラフを つくれません', e); G = null; }
    if(G && G.out) G.out.gain.value = vol;
  }
  if(!EVENTS){
    EVENTS = buildEvents().slice().sort((a,b)=>a.t-b.t);
  }
  return !!G;
}
let fired = 0;
function fire(ev, when){ fired++;
  const f = INST[ev.i];
  if(f) try{ f(G, when, ev.p); }catch(e){}
}
function pump(){
  if(!playing || !G) return;
  // ★おとが まだ だせない あいだは よやくしない。まいかい さいかいを こころみ、
  //   きょくの あたまから はじめなおせるように しておく。
  if(AC.state !== 'running'){
    try{ AC.resume(); }catch(e){}
    t0 = AC.currentTime + 0.10 - songStart; idx = idxStart; loopN = 0; lastNow = -1;
    return;
  }
  const now = AC.currentTime;
  // ★みはり：とけいが すすんでいない（state は running でも とまることが ある）
  if(now <= lastNow){
    stall++;
    if(stall > 8){                       // やく0.5びょう すすまなければ たてなおす
      stall = 0;
      try{ AC.resume(); }catch(e){}
      t0 = now + 0.10 - songStart; idx = idxStart; loopN = 0;
    }
    return;
  }
  stall = 0; lastNow = now;
  // ★みはり②：じかんが おおきく とんだ（タブふっき など）→ いまの いちへ とばす
  const songPos = now - t0 - songStart;
  if(songPos > (loopN+1)*loopSpan + 1){
    loopN = Math.floor(songPos / loopSpan);
    idx = idxStart;
    while(idx < EVENTS.length && t0 + loopN*loopSpan + EVENTS[idx].t < now) idx++;
  }
  let guard = 0;
  while(idx < EVENTS.length){
    if(++guard > 4000) return;           // ばんいち むげんループを ふせぐ
    const ev = EVENTS[idx];
    const when = t0 + loopN*loopSpan + ev.t;
    if(when > now + LOOKAHEAD) return;
    if(when >= now - 0.05) fire(ev, when);
    idx++;
  }
  idx = idxStart; loopN++;        // イントロには もどらない
}
function begin(name){
  playing = name;
  songStart = START_AT[name] || 0;
  loopSpan = Math.max(1, LOOP - songStart);
  idxStart = 0;
  while(idxStart < EVENTS.length && EVENTS[idxStart].t < songStart) idxStart++;
  idx = idxStart; loopN = 0;
  t0 = AC.currentTime + 0.10 - songStart;   // ここから ならすと じこくを あわせる
  lastNow = -1;                  // さいしょの pump を みはりで はじかない
  gainNow(vol);                  // ★のこっている フェードを とりけして おんりょうを もどす
  pump();                        // だせない じょうたいなら pump が たてなおしを つづける
  if(timer) clearInterval(timer);
  timer = setInterval(pump, TICK);
}
function play(name){
  if(name !== 'battle' && name !== 'boss'){ stop(); return; }
  pauseField();                       // せんとうちゅうは いちじ ていし（いしは のこす）
  fieldUnlocked = true;               // せんとうちゅうに あけなおさない
  // ★おなじ きょくでも まいかい あたまから ならしなおす
  if(playing === name){ if(ensure()){ begin(name); } return; }
  if(!ensure()){ return; }
  stop();
  pending = null;
  // ★resume の やくそくは iOSでは かえってこない ことが ある。
  //   またずに はじめ、おとが だせるように なったら みはりが たてなおす。
  try{ AC.resume(); }catch(e){}
  begin(name);
}
// おんりょうの よやくを かならず とりけしてから きめる。
// ※ よやくを のこしたまま かけなおすと、はじめた とたんに 0へ さがって
//    「ぜんぜん きこえない」に なる（じっさいに でた ふぐあい）。
function gainNow(v){
  if(!G || !G.out || !AC) return;
  try{
    const g = G.out.gain, t = AC.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(v, t);
  }catch(e){ try{ G.out.gain.value = v; }catch(e2){} }
}
function fadeOut(){
  if(!G || !G.out || !AC) return;
  try{
    const g = G.out.gain, t = AC.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(0.0001, t+0.18);
  }catch(e){}
}
function stopBattleAll(){        // ごうせい・ファイル どちらでも とめる
  stop();
  stopBattleFile();
}
function stop(){
  const wasPlaying = !!playing;
  if(wasPlaying) scheduleResume(220);
  if(timer){ clearInterval(timer); timer=null; }
  playing = null; pending = null; stall = 0; lastNow = -1;
  if(wasPlaying) fadeOut();      // ★なっていた ときだけ フェード。かけはじめでは さわらない
}
function setVolume(v){
  vol = Math.max(0, Math.min(1, v));
  gainNow(vol);
}
function resume(){ const a=ctx(); if(a && a.state==='suspended') a.resume(); }

/* ══ フィールドきょく（おんげんファイルを ながす）══ */
// せんとうきょくは はっしんきで つくるが、フィールドきょくは
// レンダリングずみの ファイルを ながす。<audio> なら メモリを くわない。
// ばしょごとの きょく。<audio> は 1つを つかいまわし、src を さしかえる。
const TRACKS = {field:'field.mp3', town:'town.mp3', castle:'castle.mp3', dungeon:'dungeon.mp3'};
let fieldEl = null, fieldWant = false, fieldVol = 0.55;
// ★きょくごとの おおきさ。どうくつは すこし しずかに する。
const TRACK_VOL = {field:1.00, town:1.00, castle:1.00, dungeon:0.62};
function volOf(track){ return fieldVol * (TRACK_VOL[track] || 1); }
// ★もどす しごとに ばんごうを つける。ふるい しごとは むこうに する。
//   （せんとうが つづくと、ふるい タイマーが きょくを かさねて ならして いた）
let resumeSeq = 0;
function scheduleResume(ms){
  const my = ++resumeSeq;
  setTimeout(()=>{
    if(my !== resumeSeq) return;              // あたらしい しごとが ある
    if(playing || batWant || !fieldWant) return;
    playField(fieldTrack);
  }, ms);
}
function cancelResume(){ resumeSeq++; }
let fieldTrack = 'field';                        // いま かかっている きょく
let fieldSrc = null, fieldGain = null, fieldErr = '';
function fieldAudio(){
  if(fieldEl) return fieldEl;
  try{
    fieldEl = new Audio(TRACKS[fieldTrack] || TRACKS.field);
    fieldEl.loop = true;
    fieldEl.preload = 'auto';          // さきに よみこんでおく
    fieldEl.crossOrigin = 'anonymous';
    fieldEl.volume = 1;                // おんりょうは グラフがわで きめる
    fieldEl.addEventListener('error', ()=>{
      const e = fieldEl.error;
      fieldErr = 'よみこみ しっぱい' + (e ? '(code '+e.code+')' : '');
    });
    try{ fieldEl.load(); }catch(e){}
  }catch(e){ fieldEl = null; fieldErr = 'つくれない'; }
  return fieldEl;
}
// ★<audio> を きょうゆうコンテキストへ つなぐ。
//   iOSは <audio> たんたいだと ならない ことが あるが、
//   ユーザー そうさで あけた コンテキストを とおせば ならせる。
function routeField(){
  const el = fieldAudio(); if(!el) return false;
  if(fieldSrc) return true;
  if(!ctx()) return false;
  if(typeof AC.createMediaElementSource !== 'function') return false;
  try{
    autoClean(AC);
    fieldSrc = AC.createMediaElementSource(el);
    fieldGain = AC.createGain();
    fieldGain.gain.value = volOf(fieldTrack);
    fieldSrc.connect(fieldGain);
    fieldGain.connect(AC.destination);
    return true;
  }catch(e){ fieldErr = 'つなげない: '+e.message; return false; }
}
function playField(track){
  const want = (track && TRACKS[track]) ? track : fieldTrack;
  fieldWant = true;                   // 「きょくを ならしたい」いし
  const el = fieldAudio(); if(!el) return;
  if(want !== fieldTrack){            // ★きょくが かわる ときは さしかえる
    fieldTrack = want;
    try{
      el.pause();
      el.src = TRACKS[want];
      el.load();
      fieldErr = '';
    }catch(e){ fieldErr = 'きりかえ しっぱい'; }
  }
  // ★せんとうちゅうは ならさない。
  //   ファイルの せんとうきょく（batWant）を みて いなかった ため、
  //   きょくが かさなって きこえる ことが あった。
  if(playing || batWant) return;
  cancelResume();                     // もどす しごとは もう いらない
  routeField();
  try{ AC && AC.resume && AC.resume(); }catch(e){}
  if(fieldGain){ try{ fieldGain.gain.value = volOf(fieldTrack); }catch(e){} }
  try{
    const p = el.play();
    if(p && p.catch) p.catch(err=>{ fieldErr = 'さいせい きょかまち'; });
  }catch(e){ fieldErr = 'さいせい しっぱい'; }
}
function pauseField(){                // せんとうの あいだの いちじ ていし（いしは のこす）
  cancelResume();                    // ★もどす しごとを けす（きょくが かさならない ように）
  if(!fieldEl) return;
  try{ fieldEl.pause(); }catch(e){}
}
function stopField(){                 // プレイヤーが とめた（いしも けす）
  fieldWant = false;
  pauseField();
}
let fieldUnlocked = false;
function unlockField(){
  // さいしょの そうさで <audio> を あけておく（iOSたいさく）
  // ★1かいだけ。まいかい よぶと、せんとうちゅうに ボタンを おすたび
  //   フィールドきょくが ならり なおしてしまう（じっさいに でた ふぐあい）。
  if(fieldUnlocked) return;
  if(playing) return;                 // せんとうちゅうは さわらない
  const el = fieldAudio(); if(!el) return;
  routeField();
  try{
    const p = el.play();
    fieldUnlocked = true;
    if(p && p.then) p.then(()=>{ if(!fieldWant) el.pause(); }, ()=>{ fieldUnlocked=false; });
    else if(!fieldWant) el.pause();
  }catch(e){}
}
function setFieldVolume(v){
  fieldVol = Math.max(0, Math.min(1, v));
  if(fieldGain){ try{ fieldGain.gain.value = volOf(fieldTrack); }catch(e){} }
  else if(fieldEl){ try{ fieldEl.volume = fieldVol; }catch(e){} }
}
/* ══ せんとうきょく（ファイル）══ */
// 第3章いこうの せんとうは レンダリングずみの ファイルを ながす。
// フィールドきょくとは べつの <audio> を つかい、いきさきを とりちがえない。
// ★せんとうきょく（ファイル）
//   きょくごとに <audio> を べつに もつ。1つの ようそで src を さしかえると、
//   よみこみの とちゅうで さいせいが みだれる（じっさいに おきた）。
let batWant = false, batVol = 0.55, batErr = '', batTrack = null;
const BATTLE_TRACKS = {battle3:'battle3.mp3', boss:'boss.mp3'};
const batEls = {};        // なまえ → {el, src, gain}
function battleEl(track){
  if(batEls[track]) return batEls[track];
  const url = BATTLE_TRACKS[track];
  if(!url) return null;
  let el = null;
  try{
    el = new Audio(url);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 1;
    el.addEventListener('error', ()=>{
      const e = el.error;
      batErr = track + ' よみこみ しっぱい' + (e ? '(code '+e.code+')' : '');
    });
    try{ el.load(); }catch(e){}
  }catch(e){ batErr = track + ' つくれない'; return null; }
  const slot = {el, src:null, gain:null};
  batEls[track] = slot;
  return slot;
}
function routeBattle(track){
  const slot = battleEl(track); if(!slot) return false;
  if(slot.src) return true;
  if(!ctx()) return false;
  if(typeof AC.createMediaElementSource !== 'function') return false;
  try{
    autoClean(AC);
    slot.src = AC.createMediaElementSource(slot.el);
    slot.gain = AC.createGain();
    slot.gain.gain.value = batVol;
    slot.src.connect(slot.gain);
    slot.gain.connect(AC.destination);
    return true;
  }catch(e){ batErr = 'つなげない: '+e.message; return false; }
}
// ★ほかの せんとうきょくは かならず とめる
function silenceOtherBattle(keep){
  Object.keys(batEls).forEach(k=>{
    if(k === keep) return;
    try{ batEls[k].el.pause(); }catch(e){}
  });
}
function playBattleFile(track){
  if(!BATTLE_TRACKS[track]) track = 'battle3';
  stop();                              // ごうせいの せんとうきょくは とめる
  pauseField();                        // フィールドきょくも とめる
  batWant = true;
  batTrack = track;
  silenceOtherBattle(track);
  const slot = battleEl(track); if(!slot) return;
  const el = slot.el;
  routeBattle(track);
  try{ AC && AC.resume && AC.resume(); }catch(e){}
  if(slot.gain){ try{ slot.gain.gain.value = batVol; }catch(e){} }
  // ★まいかい あたまから。よみこめて いなければ よみこめてから。
  const startPlay = ()=>{
    try{ if(el.readyState > 0) el.currentTime = 0; }catch(e){}
    try{
      const p = el.play();
      if(p && p.catch) p.catch(()=>{ batErr='さいせい きょかまち'; });
    }catch(e){ batErr='さいせい しっぱい'; }
  };
  if(el.readyState > 0){
    startPlay();
  }else{
    // ★よみこみまち：さいせいの こころみは 1かいだけ。
    //   まえは loadeddata でも startPlay を よびなおして いたため、
    //   よみこみが おわった しゅんかんに あたまへ まきもどり、
    //   せんとうに はいった ときに きょくが つっかえて きこえた。
    const once = ()=>{
      el.removeEventListener('loadeddata', once);
      if(batWant && batTrack===track && el.paused) startPlay();  // ならって いなければ だけ
    };
    el.addEventListener('loadeddata', once);
    startPlay();
  }
}
function stopBattleFile(){
  const was = batWant;
  batWant = false;
  Object.keys(batEls).forEach(k=>{ try{ batEls[k].el.pause(); }catch(e){} });
  // ★せんとうが おわったら もといた ばしょの きょくへ もどす
  if(was) scheduleResume(220);
}
function setBattleVolume(v){
  batVol = Math.max(0, Math.min(1, v));
  Object.keys(batEls).forEach(k=>{
    if(batEls[k].gain){ try{ batEls[k].gain.gain.value = batVol; }catch(e){} }
  });
}
function status(){
  const a = AC;
  return {
    ctx: a ? 'あり' : 'なし',
    state: a ? a.state : '-',
    time: a ? Math.round(a.currentTime*10)/10 : -1,
    graph: G ? 'あり' : 'なし',
    events: EVENTS ? EVENTS.length : 0,
    playing: playing || 'なし',
    scheduled: fired,
    vol: vol,
    field: fieldEl ? (fieldEl.paused ? 'とまっている' : 'ながれている') : 'みよみこみ',
    track: fieldTrack,
    battleFile: batTrack ? (batEls[batTrack] && !batEls[batTrack].el.paused ? 'ながれている' : 'とまっている') : 'みよみこみ',
    battleErr: batErr || 'なし',
    fieldVol: fieldVol,
    fieldReady: fieldEl ? fieldEl.readyState : -1,
    fieldNet: fieldEl ? fieldEl.networkState : -1,
    fieldTime: fieldEl ? Math.round((fieldEl.currentTime||0)*10)/10 : -1,
    fieldRoute: fieldSrc ? 'グラフ経由' : '<audio>のみ',
    fieldErr: fieldErr || 'なし',
  };
}
return {play, stop, setVolume, resume, attach, status,
        playBattleFile, stopBattleFile, setBattleVolume, stopBattleAll,
        get battleTrack(){return batTrack;}, BATTLE_TRACKS,
        playField, stopField, pauseField, unlockField, setFieldVolume,
        get fieldOn(){return fieldWant;}, get track(){return fieldTrack;}, TRACKS,
        get current(){return playing;},
        get bars(){return BARS;}, get bpm(){return BPM;},
        get startAt(){return START_AT;}, get sectionAt(){return SECTION_AT;},
        get sections(){return SECTIONS;},
        get eventCount(){ ensure(); return EVENTS?EVENTS.length:0; },
        debugEvents(){ return buildEvents(); }};
})();

