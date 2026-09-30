const CACHE = 'kidquest-v22';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/index.html', '/app.js'])).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
      return r;
    }).catch(() => caches.match(e.request))
  );
});
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {title:'KidQuest',body:'Approval needed!'};
  e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'/icon-192.png',tag:'kidquest'}));
});