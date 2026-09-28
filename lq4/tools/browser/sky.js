const chromium=require('@sparticuz/chromium'), pu=require('puppeteer-core');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await pu.launch({executablePath:await chromium.executablePath(), args:chromium.args, headless:true});
  const pg=await b.newPage(); await pg.setViewport({width:393, height:852, deviceScaleFactor:2, isMobile:true, hasTouch:true});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html', {waitUntil:'load', timeout:30000}); await W(1500);
  const key=async(k,n=1)=>{ for(let i=0;i<n;i++){ await pg.keyboard.press(k); await W(130); } };
  await pg.mouse.click(196,600); await W(1000); await key('ArrowDown',2); await key('Enter'); await W(600); await key('ArrowDown',3); await key('Enter'); await W(2500); await key('Enter',12);
  await pg.evaluate(()=>{ const C=LQ4;
    C.party.length=0; ['io','seren','noe','amane'].forEach(k=>C.party.push(C.mkMember(k,34)));
    ['sky_body','sky_arm','sky_leg','sky_helm','ch3_torosArrived','ch3_fatherTruth','ch3_shrineBuilt','ch3_lupusDown','ch3_mountEar'].forEach(f=>C.G.flags[f]=true);
    C.P.map='toros'; C.P.x=12; C.P.y=10; C.P.dir='back'; C.G.mode='field';
    LQ4View.buildMap('toros'); LQ4View.setActors(true);
    C.runTalkEvent('村の 老人');
  });
  await W(900);
  const snap=async(name)=>{ await pg.screenshot({path:'/tmp/br/'+name+'.png'}); return await pg.evaluate(()=>({armor:!!LQ4.G.flags.sky_armor, msg:(document.getElementById('msg-text')||{}).textContent||''})); };
  const r1=await snap('sky1');                    // 会話の はじめ
  for(let i=0;i<160;i++){ const st=await pg.evaluate(()=>({armor:!!LQ4.G.flags.sky_armor})); if(st.armor) break; await key('Enter'); }
  await W(700);
  const r2=await snap('sky2');                    // 会話の あと（装備した）
  console.log(JSON.stringify({会話中:r1, 会話後:r2})); console.log('エラー:', errs.length? errs.slice(0,3).join(' / ') : 'なし');
  await b.close();
})().catch(e=>console.log('NG', e.message));
