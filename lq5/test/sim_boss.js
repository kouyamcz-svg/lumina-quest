// 使い方: node sim_boss.js http://localhost:PORT/index.html 魔物キー[+魔物キー…][>次の 戦い…] レベル,レベル [nd=ドルガンなし|4人] [port=港町サルムの 品|cap5=第5章の 王都の 品|c6=終章の ドルムの 品（d＝魔王の 城の 鎧と 兜、s＝祠の 剣。例 c6ds）]
// 4人（nd なら 3人）を そのレベル・ドルムの 隠し品で そろえ、作戦「バランス」で 12回 戦わせる。結果は 勝敗:ターン/いちばん 減った 時の HP割合/倒れた 人数
const chromium=(m=>m.default||m)(require('@sparticuz/chromium')), pu=require('puppeteer-core');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const b=await pu.launch({executablePath:await chromium.executablePath(), args:chromium.args, headless:true});
  const pg=await b.newPage(); await pg.setViewport({width:393,height:852});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto(process.argv[2],{waitUntil:'load'}); await pg.evaluate(()=>localStorage.clear()); await pg.reload({waitUntil:'load'}); await W(1500);
  const E=(f,a)=>pg.evaluate(f,a); if(process.argv[5]==='nd') await pg.evaluate(()=>{ window._nd=1; }); if(process.argv[6]==='port') await pg.evaluate(()=>{ window._port=1; }); if(process.argv[6]==='cap5') await pg.evaluate(()=>{ window._cap5=1; }); if(/^c6/.test(process.argv[6]||'')) await pg.evaluate((o)=>{ window._c6=o; },process.argv[6]);
  for(let i=0;i<60;i++){ if(!(await E(()=>!!msgQ))) break; await E(()=>pressA()); await W(30);} 
  const boss=process.argv[3]||'general';
  for(const L of (process.argv[4]||'17,19,21').split(',').map(Number)){ const res=[];
    for(let n=0;n<12;n++){
      await E(([L,boss])=>{ if(BT) endBattle(); while(msgQ) closeMsg();
        Object.keys(STATS).forEach(k=>{ if(k!=='elt') delete STATS[k]; }); Object.assign(STATS.elt,{name:'エルト',lv:1,exp:0,hp:34,max:34,mp:6,maxmp:6,batk:3,def:3,agi:6,status:null}); PARTY.length=1; PARTY[0]='elt';
        let need=0; for(let l=1;l<L;l++) need+=l*l*6; gainExp(need);
        (window._nd?['lidia','zf']:['lidia','zf','dolgan']).forEach(k=>{ delete EQUIP[k]; joinParty(k,L); });
        const G=(name)=>SHOP.smith3.find(g=>g.name===name)||SHOP.smith2.find(g=>g.name===name);
        EQUIP.elt={weapon:G('ドルム鋼の 剣'),armor:G('ドルム鋼の よろい'),helm:G('ドルム鋼の 兜')};
        EQUIP.lidia={weapon:G('月長石の 杖'),armor:G('坑夫織りの ローブ'),helm:null};
        EQUIP.zf={weapon:G('ドルム鋼の 腕刃'),armor:G('鉱石の 装甲'),helm:G('からくりの 目当て')};
        EQUIP.dolgan={weapon:G('ドルム鋼の 大斧'),armor:G('ドルム鋼の よろい'),helm:G('ドルム鋼の 兜')};
        if(window._port){ const P=(n)=>SHOP.smith4.find(g=>g.name===n); EQUIP.elt.weapon=P('潮風の 曲刀'); EQUIP.elt.armor=P('潮風の よろい'); EQUIP.elt.helm=P('水夫の 兜'); EQUIP.lidia.weapon=P('珊瑚の 杖'); EQUIP.lidia.armor=P('海色の ローブ'); EQUIP.zf.weapon=P('船の 腕刃'); EQUIP.zf.armor=P('錨の 装甲'); EQUIP.dolgan.weapon=P('船乗りの 大斧'); EQUIP.dolgan.armor=P('潮風の よろい'); EQUIP.dolgan.helm=P('水夫の 兜'); }
        if(window._cap5){ const P=(n)=>SHOP.smith5.find(g=>g.name===n); EQUIP.elt.weapon=P('王国の 宝剣'); EQUIP.elt.armor=P('白銀の よろい'); EQUIP.elt.helm=P('白銀の 兜'); EQUIP.lidia.weapon=P('聖樹の 杖'); EQUIP.lidia.armor=P('白銀の ローブ'); EQUIP.zf.weapon=P('白銀の 腕刃'); EQUIP.zf.armor=P('白銀の 装甲'); EQUIP.dolgan.weapon=P('王国の 大斧'); EQUIP.dolgan.armor=P('白銀の よろい'); EQUIP.dolgan.helm=P('白銀の 兜'); }
        if(window._c6){ const P=(n)=>SHOP.smith6.find(g=>g.name===n); EQUIP.elt={weapon:P('星鉄の 剣'),armor:P('星鉄の よろい'),helm:P('星鉄の 兜')}; EQUIP.lidia={weapon:P('星樹の 杖'),armor:P('星糸の ローブ'),helm:null}; EQUIP.zf={weapon:P('星鉄の 腕刃'),armor:P('星鉄の 装甲'),helm:null}; EQUIP.dolgan={weapon:P('星鉄の 大斧'),armor:P('星鉄の よろい'),helm:P('星鉄の 兜')};
          if(/d/.test(window._c6)){ EQUIP.elt.armor={name:'闇払いの 鎧',kind:'armor',v:42}; EQUIP.elt.helm={name:'闇払いの 兜',kind:'helm',v:28}; }   /* c6d：魔王の 城の 宝箱の 鎧と 兜 */
          if(/s/.test(window._c6)) EQUIP.elt.weapon={name:'雷神の 剣',kind:'weapon',v:64,who:['elt']};   /* c6s：祠の 剣 */
          STATS.elt.extra=['voltrion']; }
        syncAtk(); PARTY.forEach(k=>{ STATS[k].hp=STATS[k].max; STATS[k].mp=STATS[k].maxmp; });
        BAG.herbs=5; tactic='balance'; SND.speed=60; window._turns=0; window._min=1; window._ko=0; enterDun('mine'); const stg=boss.split('>'); const go=(i)=>{ if(i>0) crownHeal(); startBattle(stg[i].split('+').map(k=>FOES[k]), i+1<stg.length?()=>go(i+1):null); }; go(0);   /* 連戦の 間は 終章と 同じく 王冠の 光で 回復 */ },[L,boss]);   /* ★「>」で 区切ると 休みなしの 連戦 */
      let out='?';
      for(let i=0;i<3000;i++){ await W(25); const st=await E(()=>{ if(BT){ const r=BT.party.reduce((a,m)=>a+m.hp,0)/BT.party.reduce((a,m)=>a+m.max,0); window._min=Math.min(window._min??1,r); window._ko=Math.max(window._ko||0,BT.party.filter(m=>m.hp<=0).length); } if(BT && BT.waitA){ pressA(); } if(!BT) return 'end'; if(BT.party.every(m=>m.hp<=0)) return 'lose'; if(BT.phase==='menu'){ window._turns++; commit(autoAct(BT.party[BT.cur||0])); } return ''; }); if(st==='end'){ out='win'; break; } if(st==='lose'){ out='lose'; break; } }
      const t=await E(()=>window._turns+'/'+Math.round(window._min*100)+'%/'+window._ko); const hp=await E(()=>PARTY.map(k=>STATS[k].hp+'/'+STATS[k].max).join(' '));
      res.push(out+':'+t); if(out==='lose') await E(()=>{ if(BT){ BT.steps=[]; endBattle(); } });
    }
    console.log('Lv'+L, res.join(' '), ' 勝ち', res.filter(r=>r.startsWith('win')).length+'/'+res.length);
  }
  console.log('エラー:', errs.length?errs.slice(0,3).join(' / '):'なし'); await b.close(); })().catch(e=>console.log('NG',e.message));
