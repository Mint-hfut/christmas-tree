// Versioned MediaPipe assets are cached only when the page requests them.
const cacheName='christmas-tree-site-v1';
const home=new URL('./',self.location.href).href;
const assets=new Set(['gesture_recognizer.task','vision_bundle.mjs','vision_wasm_internal.js',
  'vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm']);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(cacheName);
    await cache.add(new Request(home,{cache:'reload'}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if (request.method!=='GET') return;
  const url=new URL(request.url);
  const path=url.origin+url.pathname;
  if (request.mode==='navigate' && (path===home || path===home+'index.html')) {
    event.respondWith((async()=>{
      try {
        const response=await fetch(request);
        if (response.ok) {
          const copy=response.clone();
          event.waitUntil(caches.open(cacheName).then(cache=>cache.put(home,copy)).catch(()=>{}));
          return response;
        }
        return await caches.match(home,{cacheName}) || response;
      } catch (error) {
        const cached=await caches.match(home,{cacheName});
        if (cached) return cached;
        throw error;
      }
    })());
  } else if (path.startsWith(home) && assets.has(path.slice(home.length))) {
    event.respondWith((async()=>{
      let cache;
      try { cache=await caches.open(cacheName); } catch { return fetch(request); }
      const cached=await cache.match(request);
      if (cached) return cached;
      const response=await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request,response.clone()).catch(()=>{}));
      return response;
    })());
  }
});
