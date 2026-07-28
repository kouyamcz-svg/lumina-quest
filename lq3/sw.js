// ルミナクエストIII サービスワーカー
// assets.js は ないようが かわらない かぎり キャッシュから かえす（ロジックだけの こうしんを かるくする）
const CACHE='lq3-v2';
const ASSETS=['./','./index.html','./assets.js'];   // field.mp3 は はじめて つかう ときに キャッシュ
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
  if(url.pathname.endsWith('/assets.js') || url.pathname.endsWith('/field.mp3') || url.pathname.endsWith('/castle.mp3')){
    e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res;
    })));
    return;
  }
  // それ いがいは ネットゆうせん（こうしんを すぐ うけとる）
  e.respondWith(
    fetch(e.request).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});
