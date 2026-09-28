const chromium=require('@sparticuz/chromium'), pu=require('puppeteer-core');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await pu.launch({executablePath:await chromium.executablePath(), args:chromium.args, headless:true});
  const pg=await b.newPage(); await pg.setViewport({width:393,height:852,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await pg.goto('http://localhost:8765/index.html',{waitUntil:'load',timeout:30000}); await W(1500);
  const key=async(k,n=1)=>{ for(let i=0;i<n;i++){ await pg.keyboard.press(k); await W(200); } };
  await pg.mouse.click(196,600); await W(1000); await key('ArrowDown',2); await key('Enter'); await W(600);
  const items=await pg.evaluate(()=>document.getElementById('cmd-win').innerText);
  await key('ArrowDown',4); await key('Enter'); await W(2500);
  const st1=await pg.evaluate(()=>({ch:LQ4.G.chapter, map:LQ4.P.map, sky:!!LQ4.G.flags.sky_armor}));
  for(let i=0;i<60;i++){
    const st=await pg.evaluate(()=>{ const card=document.getElementById('chapter'); return {card: card && getComputedStyle(card).display!=='none' && getComputedStyle(card).opacity!=='0', msg:getComputedStyle(document.getElementById('msg-win')).display!=='none', mode:LQ4.G.mode}; });
    if(!st.card && !st.msg && st.mode==='field') break;
    if(st.card) await pg.mouse.click(196,500); else await key('Enter');
    await W(300);
  }
  await pg.evaluate(()=>{ const C=LQ4; C.G.flags.ch4_gag=true; C.P.map='upper_dist'; C.P.x=10; C.P.y=2; C.P.dir='back'; C.G.mode='field'; LQ4View.buildMap('upper_dist'); LQ4View.setActors(true); });
  await W(800);
  const pre=await pg.evaluate(()=>({mode:LQ4.G.mode, busy:LQ4.G.busy, map:LQ4.P.map, x:LQ4.P.x,y:LQ4.P.y,dir:LQ4.P.dir, front:LQ4.tileAt('upper_dist',10,1), gag:LQ4.G.flags.ch4_gag, card:[...document.querySelectorAll('div')].filter(d=>getComputedStyle(d).display!=='none' && /card|chap/i.test(d.id+d.className)).map(d=>d.id||d.className).join(',')}));
  console.log('押す前:', JSON.stringify(pre));
  await key('KeyZ'); await W(700);
  console.log('押した後:', JSON.stringify(await pg.evaluate(()=>({mode:LQ4.G.mode, map:LQ4.P.map, msg:(document.getElementById('msg-text')||{}).textContent}))));
  for(let i=0;i<10;i++){ const busy=await pg.evaluate(()=>getComputedStyle(document.getElementById('msg-win')).display!=='none'); if(!busy) break; await key('Enter'); await W(250); }
  await W(1800);
  const st2=await pg.evaluate(()=>({map:LQ4.P.map, x:LQ4.P.x, y:LQ4.P.y}));
  await pg.screenshot({path:'/tmp/br/ch4_castle.png'});
  console.log('章の 一覧:', items.replace(/\n/g,' / '));
  console.log('第4章の はじめ:', JSON.stringify(st1), ' 大門の あと:', JSON.stringify(st2));
  console.log('エラー:', errs.length?errs.slice(0,3).join(' / '):'なし');
  await b.close();
})().catch(e=>console.log('NG',e.message));
