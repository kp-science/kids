/* ============================================================
   ระบบกลางของ "ห้องเรียนที่บ้าน"
   - บันทึกผลจากทุกหน้า (แบบฝึก แบบทดสอบ เกม พินอิน) ลงในเครื่อง
   - ภารกิจวันนี้ · ดาวสะสม · สติกเกอร์ · นับวันต่อเนื่อง
   - นับนาทีที่ใช้งานจริง (ให้พ่อแม่ดู)
   ข้อมูลทั้งหมดอยู่ใน localStorage ของเครื่องนี้เท่านั้น ไม่ส่งไปที่ไหน
   ============================================================ */
(function(){
  const KEY = 'kids-progress', TICK = 15;
  const root = (document.currentScript && document.currentScript.src || '').replace(/common\/progress\.js.*$/, '');

  /* ---------------- ข้อมูล ---------------- */
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)||'{}') || {}; }catch(e){ return {}; } };
  const save = d => { try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} };
  const pad = n => String(n).padStart(2,'0');
  const dayKey = (t=new Date()) => t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate());
  function data(){
    const d = load();
    d.days = d.days || {}; d.totals = d.totals || { stars:0, missionDays:0 }; d.seenStickers = d.seenStickers || 0;
    return d;
  }
  function day(d, k=dayKey()){ return d.days[k] = d.days[k] || { sec:0, events:[], mission:false }; }
  function prune(d){
    const keys = Object.keys(d.days).sort();
    keys.slice(0, Math.max(0, keys.length-90)).forEach(k => delete d.days[k]);   /* เก็บย้อนหลัง 90 วัน */
  }

  /* ---------------- ภารกิจวันนี้ (สุ่มจากวันที่ ทุกเครื่องได้ชุดเดียวกันในวันเดียวกัน) ---------------- */
  const WORKSHEETS = [
    { page:'thai',    name:'ภาษาไทย',     e:'📚', url:'thai/p1-review.html' },
    { page:'math',    name:'คณิตศาสตร์',  e:'🔢', url:'math/p1-review.html' },
    { page:'science', name:'วิทยาศาสตร์', e:'🔬', url:'science/p1-review.html' },
    { page:'english', name:'ภาษาอังกฤษ',  e:'🔤', url:'english/p1-review.html' },
  ];
  const GAMES = [
    ['memory','จับคู่พลิกการ์ด','🃏'],['simon','จำลำดับเสียง','🎵'],['odd','ตัวไหนไม่เข้าพวก','🔍'],
    ['pattern','ต่อลำดับให้ครบ','🔁'],['pyramid','พีระมิดตัวเลข','🔺'],['dog','พาน้องหมาไปหากระดูก','🐶'],
    ['sudoku','ซูดูกุรูปภาพ','🧩'],['balance','ตาชั่งปริศนา','⚖️'],['hanoi','หอคอยฮานอย','🗼'],
    ['slide','เลื่อนเลขเรียงลำดับ','🔢'],['traffic','รถติด! พารถแดงออก','🚗'],['detective','นักสืบหาบ้านสัตว์','🕵️'],
  ];

  /* สื่อสาย "เรียน" ที่ไม่ใช่ใบทบทวน 5 วิชา */
  const LESSONS = [
    { id:'reflect', e:'✍️', tag:'test',   text:'ทำแบบฝึกอ่านเขียนสะท้อนคิด 1 ชุด',  url:'thai/reading-reflect.html',        done:ev => ev.some(x=>x.page==='thai-reflect') },
    { id:'plants',  e:'🐢', tag:'test',   text:'ทำแบบทดสอบพืชและสัตว์ 1 ชุด',        url:'science/plants-animals-test.html', done:ev => ev.some(x=>x.page==='plants') },
    { id:'pinyin',  e:'拼', tag:'pinyin', text:'ฝึกพินอินให้จบ 1 รอบ',                url:'chinese/pinyin-drill.html',        done:ev => ev.some(x=>x.kind==='pinyin') },
    { id:'unit1',   e:'🪷', tag:'test',   text:'ทำแบบฝึกหน่วยที่ 1 พระพุทธศาสนา 1 ชุด', url:'social/unit1-buddhism.html',       done:ev => ev.some(x=>x.page==='social-unit1') },
    { id:'mathex',  e:'📐', tag:'test',   text:'ทำข้อสอบคณิต ป.1 เทอม 1 ให้จบ 1 ชุด',   url:'math/p1-term1-exam.html',          done:ev => ev.some(x=>x.page==='math-p1-term1') },
  ];
  /* สื่อสาย "ลงมือทำ" ที่ไม่ใช่เกมฝึกสมอง */
  const HANDS = [
    { id:'circuit', e:'💡', tag:'stem', text:'ต่อวงจรไฟฟ้า 3 มิติ ให้ผ่าน 1 ด่าน',  url:'stem/circuit.html',    done:ev => ev.some(x=>x.kind==='game' && x.page==='stem-circuit') },
    { id:'sink',    e:'⛵', tag:'stem', text:'ทดลองจมหรือลอย ให้ผ่าน 1 ด่าน',        url:'stem/sink-float.html', done:ev => ev.some(x=>x.kind==='game' && x.page==='stem-sink') },
    { id:'bridge',  e:'🌉', tag:'stem', text:'สร้างสะพานให้รถข้ามได้ 1 ด่าน',        url:'stem/bridge.html',     done:ev => ev.some(x=>x.kind==='game' && x.page==='stem-bridge') },
    { id:'code',    e:'🤖', tag:'code', text:'ทำภารกิจในห้องทดลองโค้ดบล็อก 1 ข้อ',   url:'stem/code.html',       done:ev => ev.some(x=>x.kind==='game' && x.page==='code') },
    { id:'craft',   e:'🧱', tag:'game', text:'ต่อบล็อกคราฟต์ให้ครบ 1 แบบ',           url:'brain/craft.html',     done:ev => ev.some(x=>x.kind==='game' && x.page==='craft') },
    { id:'quest',   e:'🪷', tag:'game', text:'เล่นผจญภัยพระพุทธศาสนา 3 มิติ 1 ด่าน', url:'social/unit1-quest.html', done:ev => ev.some(x=>x.kind==='game' && x.page==='social-quest') },
  ];
  /* โบนัสวันหยุด · ต้องมีคนเล่นด้วย จึงไม่นับรวมตอนตัดสินว่าภารกิจครบ */
  const BONUS = [
    { id:'treasure', e:'🗺️', bonus:true, text:'ชวนพ่อแม่เล่นล่าขุมทรัพย์ 1 ด่าน', url:'brain/treasure.html', done:ev => ev.some(x=>x.kind==='game' && x.page==='treasure') },
  ];

  const learnPool = () => WORKSHEETS.map(w => ({ id:'ws-'+w.page, e:w.e, tag:'worksheet',
      text:'ทำแบบฝึก'+w.name+' 1 ชุด (ชุดไหนก็ได้)', url:w.url,
      done:ev => ev.some(e => e.kind==='worksheet' && e.page===w.page) })).concat(LESSONS);
  const playPool = () => GAMES.map(g => ({ id:'g-'+g[0], e:g[2], tag:'game',
      text:'เล่นเกม "'+g[1]+'" ให้ผ่าน 1 ระดับ', url:'brain/games.html#'+g[0],
      done:ev => ev.some(e => e.kind==='game' && e.item===g[0]) })).concat(HANDS);

  function seeded(seed){ let s = seed>>>0; return () => { s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }; }
  function hash(str){ let h = 2166136261; for(const ch of str){ h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h>>>0; }
  function weekday(k){ const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d).getDay(); }   /* 0=อาทิตย์ */
  function missions(k=dayKey()){
    const r = seeded(hash('kids'+k)), pick = a => a[Math.floor(r()*a.length)];
    const w = pick(learnPool());
    const g = pick(playPool());
    const extras = [
      { id:'stars',  e:'⭐', text:'เก็บดาวให้ได้ 5 ดวง', url:null, done:ev => ev.reduce((t,x)=>t+(x.stars||0),0) >= 5,
        progress:ev => Math.min(5, ev.reduce((t,x)=>t+(x.stars||0),0))+' / 5' },
      { id:'games2', e:'🎮', text:'เล่นเกมให้ผ่าน 2 ด่าน', url:'brain/games.html', done:ev => ev.filter(x=>x.kind==='game').length >= 2,
        progress:ev => Math.min(2, ev.filter(x=>x.kind==='game').length)+' / 2' },
      { id:'stem3d', e:'🔬', text:'เล่นห้องทดลอง 3 มิติ ชิ้นไหนก็ได้ 1 ด่าน', url:'index.html#STEM',
        skip:(w,g) => g.tag==='stem', done:ev => ev.some(x => x.kind==='game' && String(x.page||'').startsWith('stem-')) },
      { id:'quiz',   e:'📝', text:'ทำแบบทดสอบให้จบ 1 ชุด (พืชและสัตว์ · STEM 3 มิติ · โค้ดบล็อก ก็ได้)', url:null,
        skip:(w,g) => w.tag==='test', done:ev => ev.some(x => x.kind==='test') },
    ];
    const x = pick(extras.filter(e => !e.skip || !e.skip(w, g)));
    const day = [w, g, x];
    const wd = weekday(k);
    if(wd===0 || wd===6) day.push(pick(BONUS));   /* เสาร์-อาทิตย์ มีโบนัสเล่นด้วยกัน */
    return day;
  }

  /* ---------------- สติกเกอร์ ---------------- */
  const STICKER_PAGES = [
    ['สัตว์น่ารัก', ['🐶','🐱','🐰','🐹','🐻','🐼','🐨','🦊','🐯','🦁','🐮','🐷']],
    ['โลกใต้ทะเล',  ['🐠','🐟','🐡','🐙','🦑','🦀','🦞','🐬','🐳','🦈','🐢','🪸']],
    ['ขนมแสนอร่อย', ['🍰','🧁','🍩','🍪','🍦','🍭','🍫','🍓','🍉','🍡','🥞','🧃']],
    ['ท่องอวกาศ',   ['🚀','🛸','🌙','⭐','🪐','☄️','👽','🌈','☀️','🌟','🛰️','🌍']],
    ['สวนดอกไม้',   ['🌸','🌷','🌻','🌼','🦋','🐝','🐞','🍄','🌳','🌵','🐛','🐌']],
  ];
  const ALL_STICKERS = STICKER_PAGES.flatMap(p => p[1]);
  const ORDER = (() => { const r = seeded(20260916), a = ALL_STICKERS.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; })();
  const STARS_PER_STICKER = 8;
  function stickerCount(d){ return Math.min(ALL_STICKERS.length, Math.floor(d.totals.stars/STARS_PER_STICKER) + d.totals.missionDays); }
  function owned(d){ return ORDER.slice(0, stickerCount(d)); }

  /* ---------------- วันต่อเนื่อง ---------------- */
  function streak(d){
    let n = 0, t = new Date();
    const active = k => d.days[k] && d.days[k].events.length > 0;
    if(!active(dayKey(t))) t.setDate(t.getDate()-1);          /* วันนี้ยังไม่ได้ทำ ก็ยังนับต่อจากเมื่อวาน */
    while(active(dayKey(t))){ n++; t.setDate(t.getDate()-1); }
    return n;
  }

  /* ---------------- บันทึกผล ---------------- */
  function log(ev){
    const d = data(), td = day(d);
    const before = stickerCount(d);
    ev = Object.assign({ time: Date.now() }, ev);
    ev.stars = Math.max(0, Math.min(3, ev.stars||0));
    td.events.push(ev); d.totals.stars += ev.stars;
    let missionNow = false;
    if(!td.mission && missions().filter(m => !m.bonus).every(m => m.done(td.events))){ td.mission = true; d.totals.missionDays++; missionNow = true; }
    prune(d); save(d);
    const after = stickerCount(d);
    if(missionNow) toast('🎯 ภารกิจวันนี้สำเร็จครบแล้ว! เก่งมาก');
    if(after > before) setTimeout(() => toast('🎉 ได้สติกเกอร์ใหม่ '+ORDER.slice(before, after).join(' ')+' ไปดูในสมุดสติกเกอร์ได้เลย'), missionNow ? 2600 : 0);
  }

  /* ---------------- ป้ายแจ้ง ---------------- */
  function css(){
    if(document.getElementById('kp-css')) return;
    const s = document.createElement('style'); s.id = 'kp-css';
    s.textContent =
      '.kp-toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);z-index:9999;'+
      'background:#fff;color:#3A3350;border-radius:999px;padding:10px 20px;font:700 16px/1.4 "Mali","Noto Sans Thai Looped",sans-serif;'+
      'box-shadow:0 10px 30px rgba(58,51,80,.22);opacity:0;transition:.35s;max-width:92vw;text-align:center}'+
      '.kp-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}'+
      '';
    document.head.appendChild(s);
  }
  let toastQ = Promise.resolve();
  function toast(msg){
    toastQ = toastQ.then(() => new Promise(res => {
      css();
      const t = document.createElement('div'); t.className = 'kp-toast'; t.textContent = msg; document.body.appendChild(t);
      requestAnimationFrame(() => t.classList.add('on'));
      setTimeout(() => { t.classList.remove('on'); setTimeout(() => { t.remove(); res(); }, 400); }, 3200);
    }));
  }

  /* ---------------- นับเวลาใช้งาน (เฉพาะตอนเปิดดูอยู่และมีการแตะ/เลื่อนจอในช่วง 2 นาที) ---------------- */
  let lastInput = Date.now();
  ['pointerdown','keydown','touchstart','scroll'].forEach(e => addEventListener(e, () => { lastInput = Date.now(); }, { passive:true }));
  setInterval(() => {
    if(document.visibilityState !== 'visible' || Date.now() - lastInput > 2*60*1000) return;
    const d = data(); day(d).sec += TICK; save(d);
  }, TICK*1000);

  /* ---------------- ปิดเสียงทั้งเว็บ ----------------
     ใช้ค่าเดียวกันทุกหน้า (localStorage 'kids-brain-mute') · ปิดแล้วเงียบทั้งเสียงอ่าน เสียงเอฟเฟกต์ และเสียงที่อัดไว้
     หน้าที่มีปุ่ม #mute ของตัวเองใช้ปุ่มนั้น · หน้าที่ไม่มีจะได้ปุ่มลอยมุมขวาล่าง */
  const MUTE_KEY = 'kids-brain-mute';
  const isMuted = () => { try{ return localStorage.getItem(MUTE_KEY)==='1'; }catch(e){ return false; } };
  const contexts = new Set();
  if(window.speechSynthesis){
    const speak0 = speechSynthesis.speak.bind(speechSynthesis);
    try{ speechSynthesis.speak = u => { if(!isMuted()) speak0(u); }; }catch(e){}
  }
  const AC0 = window.AudioContext || window.webkitAudioContext;
  if(AC0){
    class KidsAudioContext extends AC0 {
      constructor(...a){ super(...a); contexts.add(this); if(isMuted()) AC0.prototype.suspend.call(this); }
      resume(){ return isMuted() ? Promise.resolve() : super.resume(); }
    }
    window.AudioContext = KidsAudioContext; if(window.webkitAudioContext) window.webkitAudioContext = KidsAudioContext;
  }
  if(window.HTMLMediaElement){
    const play0 = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function(){ return isMuted() ? Promise.resolve() : play0.apply(this, arguments); };
  }
  function applyMute(){
    const m = isMuted();
    if(m){ try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){} document.querySelectorAll('audio,video').forEach(a => { try{ a.pause(); }catch(e){} }); }
    contexts.forEach(c => { try{ m ? AC0.prototype.suspend.call(c) : AC0.prototype.resume.call(c); }catch(e){} });
    const own = document.getElementById('mute'); if(own && /^[🔊🔇]$/u.test(own.textContent.trim())) own.textContent = m ? '🔇' : '🔊';
    const fab = document.getElementById('kp-mute'); if(fab){ fab.textContent = m ? '🔇' : '🔊'; fab.setAttribute('aria-label', m ? 'เปิดเสียง' : 'ปิดเสียง'); fab.classList.toggle('off', m); }
  }
  function setMuted(m){ try{ localStorage.setItem(MUTE_KEY, m ? '1' : '0'); }catch(e){} applyMute(); }
  addEventListener('storage', e => { if(e.key===MUTE_KEY) applyMute(); });
  function setupMuteUI(){
    const own = document.getElementById('mute');
    if(own){ own.addEventListener('click', () => setTimeout(applyMute, 0)); applyMute(); return; }
    if(/\/(index|parent|stickers)\.html$|\/$/.test(location.pathname)) return;   /* หน้ารวม/ผู้ปกครอง/สติกเกอร์ ไม่มีเสียง */
    css();
    const st = document.createElement('style');
    st.textContent = '#kp-mute{position:fixed;right:calc(14px + env(safe-area-inset-right));bottom:calc(14px + env(safe-area-inset-bottom));z-index:9998;width:52px;height:52px;border-radius:50%;border:none;'+
      'background:#fff;font-size:24px;box-shadow:0 6px 18px rgba(58,51,80,.22);cursor:pointer}#kp-mute.off{background:#FFE9E2}';
    document.head.appendChild(st);
    const b = document.createElement('button'); b.type = 'button'; b.id = 'kp-mute';
    b.onclick = () => { setMuted(!isMuted()); toast(isMuted() ? '🔇 ปิดเสียงแล้ว' : '🔊 เปิดเสียงแล้ว'); };
    document.body.appendChild(b); applyMute();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMuteUI); else setupMuteUI();

  /* ---------------- เก็บเว็บไว้ในเครื่อง ให้เล่นได้ตอนไม่มีเน็ต ---------------- */
  /* sw.js สร้างด้วย node tools/gen-sw.js · ทำงานเฉพาะ https กับ localhost (ตามกติกาเบราว์เซอร์) */
  if('serviceWorker' in navigator && root){
    /* เคยมี service worker อยู่ก่อนแล้ว = การเปิดครั้งนี้เป็นการอัปเดต
       พอตัวใหม่พร้อมใช้ ให้โหลดหน้าใหม่ครั้งเดียว จะได้เห็นของใหม่เลย ไม่ต้องเปิดซ้ำรอบสอง */
    const hadWorker = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(!hadWorker || reloading) return;
      reloading = true; location.reload();
    });
    addEventListener('load', () => navigator.serviceWorker.register(root+'sw.js').catch(() => {}));
  }

  window.KP = { log, data, day, dayKey, missions, streak, owned, stickerCount, STICKER_PAGES, ALL_STICKERS, STARS_PER_STICKER,
    markSeen(){ const d=data(); d.seenStickers=stickerCount(d); save(d); }, root, toast, WORKSHEETS, GAMES, isMuted, setMuted };
})();
