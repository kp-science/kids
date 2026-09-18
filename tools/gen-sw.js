#!/usr/bin/env node
/* สร้าง sw.js ใหม่จากไฟล์จริงในเว็บ
   รันทุกครั้งที่เพิ่ม/ลบ/แก้ไฟล์ แล้วค่อย commit:  node tools/gen-sw.js
   เลขรุ่น (VERSION) คิดจากเนื้อไฟล์ทั้งหมด ถ้ามีอะไรเปลี่ยนแม้ตัวอักษรเดียว เลขจะเปลี่ยน
   เบราว์เซอร์จึงรู้ว่าต้องโหลดของใหม่ ไม่ค้างของเก่า */
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SKIP_DIR = new Set(['.git', 'tools', 'node_modules']);
const KEEP_EXT = new Set(['.html', '.css', '.js', '.woff2', '.webp', '.png', '.svg', '.json', '.ico']);
const SKIP_FILE = new Set(['sw.js', 'README.md', 'vendor/README.md']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, name), rel = path.relative(ROOT, abs);
    if (fs.statSync(abs).isDirectory()) { if (!SKIP_DIR.has(name)) walk(abs, out); }
    else if (KEEP_EXT.has(path.extname(name)) && !SKIP_FILE.has(rel)) out.push(rel);
  }
  return out;
}

const files = walk(ROOT);
const h = crypto.createHash('sha1');
for (const f of files) { h.update(f); h.update(fs.readFileSync(path.join(ROOT, f))); }
const version = new Date().toISOString().slice(0, 10) + '-' + h.digest('hex').slice(0, 8);

/* './' คือหน้าแรกตอนเปิดโดยไม่พิมพ์ index.html */
const assets = ['./'].concat(files.map(f => f.split(path.sep).join('/')));

fs.writeFileSync(path.join(ROOT, 'sw.js'), `/* ============================================================
   ตัวช่วยให้เว็บ "ห้องเรียนที่บ้าน" เล่นได้ตอนไม่มีอินเทอร์เน็ต
   ไฟล์นี้สร้างอัตโนมัติ — ห้ามแก้ด้วยมือ ให้รัน  node tools/gen-sw.js  แทน
   วิธีทำงาน: เปิดเว็บครั้งแรกตอนมีเน็ต → เก็บทุกไฟล์ไว้ในเครื่อง → ครั้งต่อไปเปิดจากในเครื่อง
   พออัปเดตเว็บ เลขรุ่นจะเปลี่ยน ตัวนี้จะโหลดชุดใหม่มาเก็บแล้วลบชุดเก่าทิ้ง
   ============================================================ */
const VERSION = '${version}';
const CACHE = 'kids-' + VERSION;
const ASSETS = ${JSON.stringify(assets, null, 1).replace(/\n /g, '\n  ')};

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

self.addEventListener('message', e => { if (e.data === 'version') e.source.postMessage({ version: VERSION }); });
`);

console.log('sw.js: ' + assets.length + ' ไฟล์ · รุ่น ' + version);
