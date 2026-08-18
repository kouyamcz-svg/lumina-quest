// ルミナクエストIV サービスワーカー
// assets.js は ?v=… つきで よみこむ。ないようが かわると URLも かわるので、
// ふるい キャッシュは つかわれない（え を さしかえても ふるい ままに なる ふぐあいの たいさく）。
const CACHE='lq4-ebebc276';
// ★installで index.html を 先に とりこむと、ふるい ものを つかみ続ける ことが ある。
//   ここでは からの まま はじめて、つかった ものだけ ためる。
const ASSETS=[];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  // そざいは キャッシュゆうせん（おおきくて かわらない）
  if(url.pathname.endsWith('/assets.js') || url.pathname.endsWith('/field.mp3') || url.pathname.endsWith('/castle.mp3') || url.pathname.endsWith('/town.mp3') || url.pathname.endsWith('/battle3.mp3') || url.pathname.endsWith('/dungeon.mp3') || url.pathname.endsWith('/boss.mp3')){
    e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res;
    })));
    return;
  }
  // それ いがいは ネットゆうせん（こうしんを すぐ うけとる）
  //   ★キャッシュ名が ビルドごとに かわる ので、
  //     つながらない ときに 出る ひかえも「その ビルドの もの」に なる。
  e.respondWith(
    fetch(e.request).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});
