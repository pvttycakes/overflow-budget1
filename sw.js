const CACHE="overflow-budget-v2-2";
const ASSETS=["./","index.html","styles.css?v=2.2","app.js?v=2.2","manifest.json?v=2.2","icon-192.svg","icon-512.svg"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request).catch(()=>caches.match("index.html")));
    return;
  }
  event.respondWith(
    fetch(event.request).then(response=>{
      if(event.request.method==="GET"){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }).catch(()=>caches.match(event.request))
  );
});
