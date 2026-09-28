const chromium=require('@sparticuz/chromium'), pu=require('puppeteer-core');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await pu.launch({executablePath:await chromium.executablePath(), args:chromium.args, headless:true});
  const pg=await b.newPage();
  await pg.setViewport({width:393, height:852, deviceScaleFactor:2, isMobile:true, hasTouch:true});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html', {waitUntil:'load', timeout:30000}); await W(1500);
  const key=async(k,n=1)=>{ for(let i=0;i<n;i++){ await pg.keyboard.press(k); await W(250); } };
  await pg.mouse.click(196,600); await W(1000);          // タイトルを タップ
  await key('ArrowDown',2); await key('Enter'); await W(600);   // 章を 選ぶ
  await key('ArrowDown',3); await key('Enter'); await W(2500);  // 第3章
  await key('Enter',12);                                         // 章の はじめの 文を 送る
  await pg.evaluate((mode,ORDER,PLV)=>{
    const C=LQ4; const process={env:{ORDER,PLV}};
    C.party.length=0; ORDER.split(',').forEach(k=>C.party.push(C.mkMember(k,Number(PLV))));
    C.G.flags.ch3_shrineBuilt=true; C.G.mode='field';
    if(mode==='battle') C.startBattle('lupus');
  }, process.argv[2]||'battle', process.env.ORDER||'io,seren,noe,amane', process.env.PLV||'33');
  await W(2000);
  await key('Enter', Number(process.env.ADV||1)); await W(800);
  if(process.env.SEQ){ for(const k of process.env.SEQ.split(',')){ await key(k); await W(300); } }
  if(process.env.SPELLS){ await key('ArrowDown'); await key('Enter'); await W(700); for(let i=0;i<Number(process.env.SPELLS);i++) await key('ArrowDown'); await W(400); }
  if(process.argv[2]==='menu'){
    for(let i=0;i<8;i++){
      const shown=await pg.evaluate(()=>getComputedStyle(document.getElementById('cmd-win')).display==='block' && LQ4.G.mode==='menu');
      if(shown) break;
      await pg.evaluate(()=>{ LQ4.G.busy=false; });
      await key('KeyX'); await W(500);
    }
  }
  const __dbgmenu=await pg.evaluate(()=>{ const w=document.getElementById('cmd-win'), l=w.querySelector('.cmd-list'), sel=w.querySelector('.cmd-item.sel'); return {cls:w.className, items:w.querySelectorAll('.cmd-item').length, selText:sel&&sel.textContent, scrollTop:l&&l.scrollTop, clientH:l&&l.clientHeight, scrollH:l&&l.scrollHeight, maxH:l&&l.style.maxHeight, selTop:sel&&Math.round(sel.getBoundingClientRect().top), listTop:l&&Math.round(l.getBoundingClientRect().top), listBot:l&&Math.round(l.getBoundingClientRect().bottom)}; });
  console.log('menu', JSON.stringify(__dbgmenu));
  await pg.screenshot({path:'/tmp/br/'+(process.argv[2]||'battle')+'.png'});
  const info=await pg.evaluate(()=>{ const c=document.getElementById('cmd-win').getBoundingClientRect(), h=document.getElementById('hud').firstElementChild; const hb=h?h.getBoundingClientRect():null; const l=document.getElementById('label');
    return {cmd:[Math.round(c.left),Math.round(c.top),Math.round(c.right),Math.round(c.bottom)], hud1:hb?[Math.round(hb.left),Math.round(hb.top),Math.round(hb.right),Math.round(hb.bottom)]:null, label:getComputedStyle(l).visibility, cmdShown:getComputedStyle(document.getElementById('cmd-win')).display}; });
  console.log(JSON.stringify(info)); console.log('エラー:', errs.length? errs.slice(0,3).join(' / ') : 'なし');
  await b.close();
})().catch(e=>console.log('NG', e.message));
