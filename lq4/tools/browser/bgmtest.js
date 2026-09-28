const chromium=require('@sparticuz/chromium'), pu=require('puppeteer-core');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await pu.launch({executablePath:await chromium.executablePath(), args:chromium.args.concat(['--autoplay-policy=no-user-gesture-required']), headless:true});
  const pg=await b.newPage(); await pg.setViewport({width:393,height:852,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  // 作られた <audio> を 見えるように する
  await pg.evaluateOnNewDocument(()=>{ const A=window.Audio; window.__aud=[]; window.Audio=function(u){ const el=new A(u); window.__aud.push(el); return el; }; window.Audio.prototype=A.prototype; });
  const got=[]; pg.on('response',r=>{ if(/\.mp3$/.test(r.url())) got.push(r.url().split('/').pop()+' '+r.status()); });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html',{waitUntil:'load',timeout:30000}); await W(1500);
  const key=async(k,n=1)=>{ for(let i=0;i<n;i++){ await pg.keyboard.press(k); await W(200); } };
  await pg.mouse.click(196,600); await W(1000); await key('ArrowDown',2); await key('Enter'); await W(600); await key('ArrowDown',3); await key('Enter'); await W(2500); await key('Enter',12);
  const run=async(sky)=>{
    await pg.evaluate((sky)=>{ const C=LQ4; C.G.battle=null; C.G.flags.sky_armor=sky; C.P.map='ground'; C.P.x=48; C.P.y=9; C.G.mode='field'; C.startBattle(); }, sky);
    await W(3500);
    const st=await pg.evaluate(()=>window.__aud.map(a=>({src:a.src.split('/').pop(), paused:a.paused, t:Math.round(a.currentTime*10)/10})));
    await pg.evaluate(()=>{ LQ4.G.battle=null; LQ4.G.mode='field'; });
    return st.filter(a=>!a.paused);
  };
  const before=await run(false); const after=await run(true);
  console.log('天空の鎧の前に鳴っている:', JSON.stringify(before));
  console.log('天空の鎧の後に鳴っている:', JSON.stringify(after));
  console.log('読み込んだ:', got.join(', ')); console.log('エラー:', errs.length?errs.join(' / '):'なし');
  await b.close();
})().catch(e=>console.log('NG',e.message));
