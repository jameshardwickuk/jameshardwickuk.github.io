const CACHE="moorhead-fuel-v5";
const ASSETS=["./index.html","./assets/app.css","./assets/docs-catalog.js","./assets/fleet-catalog.js","./assets/app-1.js","./assets/app-2.js","./assets/app-3.js","./assets/app-4.js","./assets/app-sheet.js","./manifest.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{e.respondWith(fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res}).catch(()=>caches.match(e.request).then(hit=>hit||caches.match("./index.html"))))});
