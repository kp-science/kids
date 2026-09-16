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
    { page:'social',  name:'สังคมศึกษา',  e:'🏡', url:'social/p1-review.html' },
    { page:'english', name:'ภาษาอังกฤษ',  e:'🔤', url:'english/p1-review.html' },
  ];
  const GAMES = [
    ['memory','จับคู่พลิกการ์ด','🃏'],['simon','จำลำดับเสียง','🎵'],['odd','ตัวไหนไม่เข้าพวก','🔍'],
    ['pattern','ต่อลำดับให้ครบ','🔁'],['pyramid','พีระมิดตัวเลข','🔺'],['dog','พาน้องหมาไปหากระดูก','🐶'],
    ['sudoku','ซูดูกุรูปภาพ','🧩'],['balance','ตาชั่งปริศนา','⚖️'],['hanoi','หอคอยฮานอย','🗼'],
    ['slide','เลื่อนเลขเรียงลำดับ','🔢'],['traffic','รถติด! พารถแดงออก','🚗'],['detective','นักสืบหาบ้านสัตว์','🕵️'],
  ];
  function seeded(seed){ let s = seed>>>0; return () => { s = (s*1664525 + 1013904223)>>>0; return s/4294967296; }; }
  function hash(str){ let h = 2166136261; for(const ch of str){ h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h>>>0; }
  function missions(k=dayKey()){
    const r = seeded(hash('kids'+k));
    const w = WORKSHEETS[Math.floor(r()*WORKSHEETS.length)];
    const g = GAMES[Math.floor(r()*GAMES.length)];
    const extras = [
      { id:'stars',  e:'⭐', text:'เก็บดาวให้ได้ 5 ดวง', url:null, done:ev => ev.reduce((t,x)=>t+(x.stars||0),0) >= 5,
        progress:ev => Math.min(5, ev.reduce((t,x)=>t+(x.stars||0),0))+' / 5' },
      { id:'plants', e:'🐢', text:'ทำแบบทดสอบพืชและสัตว์ 1 ชุด', url:'science/plants-animals-test.html', done:ev => ev.some(x=>x.kind==='test') },
      { id:'pinyin', e:'拼', text:'ฝึกพินอินให้จบ 1 รอบ', url:'chinese/pinyin-drill.html', done:ev => ev.some(x=>x.kind==='pinyin') },
      { id:'games2', e:'🎮', text:'เล่นเกมให้ผ่าน 2 ด่าน', url:'brain/games.html', done:ev => ev.filter(x=>x.kind==='game').length >= 2,
        progress:ev => Math.min(2, ev.filter(x=>x.kind==='game').length)+' / 2' },
    ];
    const x = extras[Math.floor(r()*extras.length)];
    return [
      { id:'ws', e:w.e, text:'ทำแบบฝึก'+w.name+' 1 ชุด (ชุดไหนก็ได้)', url:w.url, done:ev => ev.some(e=>e.kind==='worksheet' && e.page===w.page) },
      { id:'game', e:g[2], text:'เล่นเกม "'+g[1]+'" ให้ผ่าน 1 ระดับ', url:'brain/games.html#'+g[0], done:ev => ev.some(e=>e.kind==='game' && e.item===g[0]) },
      x,
    ];
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
    if(!td.mission && missions().every(m => m.done(td.events))){ td.mission = true; d.totals.missionDays++; missionNow = true; }
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

  window.KP = { log, data, day, dayKey, missions, streak, owned, stickerCount, STICKER_PAGES, ALL_STICKERS, STARS_PER_STICKER,
    markSeen(){ const d=data(); d.seenStickers=stickerCount(d); save(d); }, root, toast, WORKSHEETS, GAMES };
})();
