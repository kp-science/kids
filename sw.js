/* ============================================================
   ตัวช่วยให้เว็บ "ห้องเรียนที่บ้าน" เล่นได้ตอนไม่มีอินเทอร์เน็ต
   ไฟล์นี้สร้างอัตโนมัติ — ห้ามแก้ด้วยมือ ให้รัน  node tools/gen-sw.js  แทน
   วิธีทำงาน: เปิดเว็บครั้งแรกตอนมีเน็ต → เก็บทุกไฟล์ไว้ในเครื่อง → ครั้งต่อไปเปิดจากในเครื่อง
   พออัปเดตเว็บ เลขรุ่นจะเปลี่ยน ตัวนี้จะโหลดชุดใหม่มาเก็บแล้วลบชุดเก่าทิ้ง
   ============================================================ */
const VERSION = '2026-09-19-dbd7a1c0';
const CACHE = 'kids-' + VERSION;
const ASSETS = [
  "./",
  "apple-touch-icon.png",
  "brain/craft.html",
  "brain/games.html",
  "brain/treasure-game.js",
  "brain/treasure-levels.js",
  "brain/treasure-models.js",
  "brain/treasure.html",
  "chinese/pinyin-drill.html",
  "common/progress.js",
  "common/thai-spell.js",
  "english/p1-review.html",
  "favicon.png",
  "img/kid-full.webp",
  "img/kid.webp",
  "index.html",
  "math/p1-review.html",
  "math/p1-term1-exam.html",
  "math/p1-term1-gen.js",
  "parent.html",
  "science/p1-review.html",
  "science/plants-animals-test.html",
  "social/unit1-buddhism.html",
  "social/unit1-quest.html",
  "stem/bridge.html",
  "stem/circuit.html",
  "stem/code.html",
  "stem/sink-float.html",
  "stem/stem.css",
  "stem/stem3d.js",
  "stickers.html",
  "thai/p1-review.html",
  "thai/reading-island.js",
  "thai/reading-reflect.html",
  "vendor/blockly/blockly_compressed.js",
  "vendor/blockly/blocks_compressed.js",
  "vendor/blockly/javascript_compressed.js",
  "vendor/blockly/msg-th.js",
  "vendor/fonts/andika-400-latin-ext.woff2",
  "vendor/fonts/andika-400-latin.woff2",
  "vendor/fonts/andika-700-latin-ext.woff2",
  "vendor/fonts/andika-700-latin.woff2",
  "vendor/fonts/fonts.css",
  "vendor/fonts/mali-500-latin-ext.woff2",
  "vendor/fonts/mali-500-latin.woff2",
  "vendor/fonts/mali-500-thai.woff2",
  "vendor/fonts/mali-600-latin-ext.woff2",
  "vendor/fonts/mali-600-latin.woff2",
  "vendor/fonts/mali-600-thai.woff2",
  "vendor/fonts/mali-700-latin-ext.woff2",
  "vendor/fonts/mali-700-latin.woff2",
  "vendor/fonts/mali-700-thai.woff2",
  "vendor/fonts/notosansthailooped-400-latin-ext.woff2",
  "vendor/fonts/notosansthailooped-400-latin.woff2",
  "vendor/fonts/notosansthailooped-400-thai.woff2",
  "vendor/fonts/notosansthailooped-600-latin-ext.woff2",
  "vendor/fonts/notosansthailooped-600-latin.woff2",
  "vendor/fonts/notosansthailooped-600-thai.woff2",
  "vendor/fonts/notosansthailooped-700-latin-ext.woff2",
  "vendor/fonts/notosansthailooped-700-latin.woff2",
  "vendor/fonts/notosansthailooped-700-thai.woff2",
  "vendor/fonts/sarabun-400-latin-ext.woff2",
  "vendor/fonts/sarabun-400-latin.woff2",
  "vendor/fonts/sarabun-400-thai.woff2",
  "vendor/fonts/sarabun-600-latin-ext.woff2",
  "vendor/fonts/sarabun-600-latin.woff2",
  "vendor/fonts/sarabun-600-thai.woff2",
  "vendor/fonts/sarabun-700-latin-ext.woff2",
  "vendor/fonts/sarabun-700-latin.woff2",
  "vendor/fonts/sarabun-700-thai.woff2",
  "vendor/three/addons/controls/OrbitControls.js",
  "vendor/three/addons/geometries/RoundedBoxGeometry.js",
  "vendor/three/three.module.js"
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* ทีละชุดเล็ก ๆ กันเน็ตช้าแล้วล้มทั้งยวง และไฟล์ไหนโหลดไม่ได้ก็ข้ามไป ไม่ให้พังทั้งหมด */
    for (let i = 0; i < ASSETS.length; i += 10) {
      await Promise.all(ASSETS.slice(i, i + 10).map(u =>
        cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('kids-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            /* ของนอกเว็บ ปล่อยผ่าน */

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) {
      /* มีในเครื่องแล้ว ใช้เลย (เร็ว + ไม่ต้องใช้เน็ต) แล้วค่อยแอบเช็กของใหม่เงียบ ๆ
         ยกเว้น vendor/ (three.js, Blockly, ฟอนต์) ไฟล์ใหญ่และเปลี่ยนเฉพาะตอนอัปรุ่น
         ซึ่งตอนนั้นเลขรุ่นจะเปลี่ยนและโหลดใหม่ทั้งชุดอยู่แล้ว */
      if (!url.pathname.includes('/vendor/'))
        e.waitUntil(fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); }).catch(() => {}));
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      /* เน็ตหลุดและไม่เคยเก็บไว้ — ถ้าเป็นการเปิดหน้าเว็บ ให้ย้อนไปหน้าแรกที่เก็บไว้ */
      if (req.mode === 'navigate') return (await cache.match('./')) || (await cache.match('index.html')) || Response.error();
      throw err;
    }
  })());
});

self.addEventListener('message', e => {
  if (e.data !== 'version') return;
  const reply = { version: VERSION };
  if (e.ports && e.ports[0]) e.ports[0].postMessage(reply);
  else if (e.source) e.source.postMessage(reply);
});
