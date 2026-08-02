/* 离线缓存（公网 https 部署时生效）
 * v2：缓存策略改为「网络优先」——线上更新后刷新即可看到新版 */
const CACHE = 'yx-workbench-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/pinyin.js',
  './js/math-gen.js',
  './js/core.js',
  './js/app.js',
  './js/games.js',
  './js/extras.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // 网络优先：先请求线上，成功则更新缓存；断网时才回退到缓存
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() =>
      caches.match(e.request).then(hit => hit || caches.match('./index.html'))
    )
  );
});
