/* ============================================================
   เกมล่าขุมทรัพย์ พ่อแม่ลูก · ตัวเกม
   โหมด easy / hard = แตะของในห้องได้เลย
   โหมด walk / brain = ห้องมีตารางก้าว เดินด้วยปุ่มลูกศรแล้วกด 🔍 ค้นหา
     walk  : คำใบ้ทิศทาง + นับก้าว
     brain : ก้าวแบบบวกลบ/เดินเลยแล้วถอย · แผนที่ขุมทรัพย์ · ตัดตัวเลือก
   คำใบ้แบบ walk/brain สร้างอัตโนมัติจากตำแหน่งของในด่าน ด่านใหม่จึงได้คำใบ้เองทันที
   ============================================================ */
import { THREE, $, shuffle, setupMute, sfx, speak, stage, box, cyl, at, sprite, label, glow, tween, ease, wait } from '../stem/stem3d.js';
import { MODELS, EMPTY_FINDS, MODEL_EMOJI, MODEL_ACTION } from './treasure-models.js';
import LEVELS from './treasure-levels.js';

setupMute($('#mute'));
const R_ = n => Math.floor(Math.random()*n);
const pick = a => a[R_(a.length)];

/* ---------------- บันทึก ---------------- */
let SAVE = {}; try{ SAVE = JSON.parse(localStorage.getItem('kids-treasure')||'{}')||{}; }catch(e){}
SAVE.stars = SAVE.stars || {}; SAVE.role = SAVE.role || 'parent'; SAVE.level = SAVE.level || 'easy';
const persist = () => { try{ localStorage.setItem('kids-treasure', JSON.stringify(SAVE)); }catch(e){} };
const NAV = () => SAVE.level==='walk' || SAVE.level==='brain';
const starKey = id => SAVE.level==='brain' ? id+'@brain' : SAVE.level==='walk' ? id+'@walk' : id;
function ensureRoute(force){
  const ids = LEVELS.map(l => l.id);
  if(force || !Array.isArray(SAVE.route) || SAVE.route.length !== ids.length || !ids.every(i => SAVE.route.includes(i))){ SAVE.route = shuffle(ids); SAVE.pos = 0; }
  SAVE.pos = Math.min(SAVE.pos||0, ids.length-1); persist();
}
ensureRoute();
const starTxt = n => '⭐'.repeat(n)+'☆'.repeat(3-n);

/* ---------------- หน้าแรก ---------------- */
function seg(id, key){
  const el = $(id);
  const draw = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v===SAVE[key]));
  el.querySelectorAll('button').forEach(b => b.onclick = () => { SAVE[key] = b.dataset.v; persist(); sfx('tap'); draw(); drawHome(); });
  draw();
}
function drawHome(){
  const next = SAVE.route[SAVE.pos];
  $('#map').innerHTML = SAVE.route.map((id, i) => { const L = LEVELS.find(l => l.id===id), s = SAVE.stars[starKey(id)]||0;
    return '<button type="button" class="lvcard'+(id===next?' next':'')+'" data-id="'+id+'"><span class="ord">ด่านที่ '+(i+1)+(id===next?' · ถัดไป':'')+'</span><span class="le">'+L.e+'</span>'+L.name+'<small>'+starTxt(s)+'</small></button>'; }).join('');
  $('#map').querySelectorAll('.lvcard').forEach(b => b.onclick = () => { SAVE.pos = SAVE.route.indexOf(b.dataset.id); persist(); openPlay(); });
  const done = SAVE.route.filter(id => SAVE.stars[starKey(id)]).length;
  $('#mapNote').textContent = '· ผ่านแล้ว '+done+' / '+LEVELS.length+' ด่าน (โหมดนี้)';
  $('#startBtn').textContent = done && done < LEVELS.length ? '🗺️ เล่นต่อ: ด่านที่ '+(SAVE.pos+1) : '🗺️ เริ่มล่าสมบัติ';
}
seg('#segRole', 'role'); seg('#segLevel', 'level');
$('#startBtn').onclick = () => openPlay();
$('#shuffleBtn').onclick = () => { ensureRoute(true); sfx('pop'); drawHome(); };
function showHome(){
  $('#home').hidden = false; $('#play').hidden = true; if(S) S.pause();
  $('#back').href = '../#เกม'; $('#back').textContent = '‹ หน้ารวม'; $('#back').onclick = null;
  history.replaceState(null, '', location.pathname); drawHome(); window.scrollTo(0, 0);
}

/* ---------------- ฉาก 3 มิติ ---------------- */
let S = null, world = null, G = {};
const VIEW = { cam:[2.3, 7.9, 10.4], target:[0, .3, .2] };
function initStage(){
  if(S) return;
  S = stage($('#stage'), { cam:VIEW.cam, target:VIEW.target, minDist:6, maxDist:20, minPolar:.35, maxPolar:1.25, minAzimuth:-.55, maxAzimuth:1.0, shadow:9 });
  $('#loading').remove();
  $('#viewBtn').onclick = () => S.resetView();
  S.onTap(onTap);
  S.onFrame((dt, t) => {
    if(G.hint){ G.hint.material.opacity = .55 + .45*Math.sin(t*6); const s = 1.6 + .25*Math.sin(t*6); G.hint.scale.set(s, s, 1); }
    (G.sea||[]).forEach(m => { m.position.y = m.userData.y + Math.sin(t*1.2 + m.userData.p)*.04; });
    if(G.walker) G.walkerKid.position.y = .05 + Math.abs(Math.sin(t*2.4))*.05;
    (G.feet||[]).forEach((f, i) => { f.material.opacity = .45 + .45*Math.sin(t*5 - i*.6); });
    if(G.flag) G.flag.children[1].rotation.y = Math.sin(t*3)*.25;
  });
}
function buildPlace(L){
  const g = new THREE.Group(), p = L.place;
  if(p==='indoor'){
    g.add(at(box(12.4, .2, 9.4, L.floor||'#F3E3CF', .04), 0, -.1, 0));
    const line = new THREE.Color(L.floor||'#F3E3CF').offsetHSL(0, 0, -.05).getStyle(); for(let i=-5;i<=5;i++) g.add(at(box(.03, .005, 9.3, line, .001), i*1.1, .005, 0));
    g.add(at(box(12.4, 3.4, .2, L.wall||'#E4F1FF', .03), 0, 1.7, -4.8), at(box(.2, 3.4, 9.4, L.wall2||L.wall||'#E4F1FF', .03), -6.3, 1.7, 0));
    g.add(at(box(12.4, .18, .06, '#FFFFFF', .02), 0, .09, -4.68), at(box(.06, .18, 9.4, '#FFFFFF', .02), -6.18, .09, 0));
  }
  if(p==='grass'){
    g.add(at(cyl(10, 10.2, .3, L.ground||'#A8DE94', 48), 0, -.15, 0));
    for(let i=0;i<14;i++){ const a = i/14*Math.PI*2, r = 9 + (i%3)*.3; if(Math.sin(a) > .35) continue;
      g.add(at(cyl(.12, .16, .8, '#9C6B45', 8), r*Math.cos(a), .4, r*Math.sin(a)), at(new THREE.Mesh(new THREE.SphereGeometry(.8+(i%2)*.2, 16, 12), new THREE.MeshStandardMaterial({ color:i%2 ? '#7FCB8A' : '#8ED99A', roughness:.7 })), r*Math.cos(a), 1.3, r*Math.sin(a))); }
  }
  if(p==='sand'){
    g.add(at(box(14, .3, 10, '#F6E1B0', .1), 0, -.15, .3));
    g.add(at(box(40, .2, 20, '#7FD3F5', .05), 0, -.25, -14.6));
    G.sea = [];
    for(let i=0;i<5;i++){ const w = at(box(3+i%3, .04, .15, '#FFFFFF', .02), -8+i*4, -.08, -4.9-i%2*.4); w.userData = { y:-.08, p:i }; g.add(w); G.sea.push(w); }
  }
  if(p==='deck'){
    g.add(at(box(40, .2, 40, '#7FD3F5', .05), 0, -1.2, 0));
    g.add(at(box(12.4, .3, 9.4, '#C98D55', .05), 0, -.15, 0));
    for(let i=-4;i<=4;i++) g.add(at(box(12.3, .01, .03, '#A8743F', .005), 0, .005, i));
    [[0,-4.7,12.4,.2],[0,4.7,12.4,.2],[-6.2,0,.2,9.4],[6.2,0,.2,9.4]].forEach(([x,z,w,d]) => g.add(at(box(w, .6, d, '#9C6B45', .04), x, .3, z)));
  }
  g.traverse(m => { if(m.isMesh){ m.receiveShadow = true; } });
  return g;
}

/* ---------------- ตารางก้าว ---------------- */
const COLS = 12, ROWS = 9;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cellOf = (x, z) => ({ i:clamp(Math.round(x+5.5), 0, COLS-1), j:clamp(Math.round(z+4), 0, ROWS-1) });
const cellPos = c => new THREE.Vector3(-5.5+c.i, 0, -4+c.j);
const ckey = c => c.i+','+c.j;
const DIR = { R:{ di:1, dj:0, t:'ไป ทาง ขวา ➡️', a:'➡️' }, L:{ di:-1, dj:0, t:'ไป ทาง ซ้าย ⬅️', a:'⬅️' }, U:{ di:0, dj:-1, t:'ขึ้น ไป ⬆️', a:'⬆️' }, D:{ di:0, dj:1, t:'ลง มา ⬇️', a:'⬇️' } };
const OPP = { R:'L', L:'R', U:'D', D:'U' };
let kidTex = null;
new THREE.TextureLoader().load('../img/kid-full.webp', t => { t.colorSpace = THREE.SRGBColorSpace; kidTex = t; if(G.walker) setKid(); });
function setKid(){
  if(!kidTex || !G.walkerKid) return;
  G.walkerKid.material.map = kidTex; G.walkerKid.material.needsUpdate = true;
  const h = 1.75; G.walkerKid.scale.set(h*kidTex.image.width/kidTex.image.height, h, 1);
}
function buildGrid(){
  const pts = [];
  for(let i=0;i<=COLS;i++) pts.push(-6+i, .02, -4.5, -6+i, .02, 4.5);
  for(let j=0;j<=ROWS;j++) pts.push(-6, .02, -4.5+j, 6, .02, -4.5+j);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  world.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color:'#6E6488', transparent:true, opacity:.45 })));
  [['⬆️ ด้านหลัง', 0, .35, -4.5], ['⬇️ ด้านหน้า', 0, .35, 4.9], ['⬅️ ซ้าย', -6.6, .35, 0], ['ขวา ➡️', 6.6, .35, 0]].forEach(([t,x,y,z]) => world.add(at(label(t, { height:.42, bg:'#FFF1C9', color:'#8A6100' }), x, y, z)));
}
function buildWalker(cell){
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), new THREE.MeshBasicMaterial({ color:'#FFD43B', transparent:true, opacity:.55, depthWrite:false }));
  ring.rotation.x = -Math.PI/2; ring.position.y = .03; g.add(ring);
  const kid = new THREE.Sprite(new THREE.SpriteMaterial({ color:'#FFFFFF', transparent:true, depthTest:false }));
  kid.center.set(.5, 0); kid.scale.set(.8, 1.5, 1); kid.renderOrder = 20; g.add(kid);
  g.position.copy(cellPos(cell)); world.add(g);
  G.walker = g; G.walkerKid = kid; G.ring = ring; setKid();
  if(!kidTex){ const s = sprite('🧒', { size:1.2 }); s.center.set(.5, 0); s.material.depthTest = false; s.renderOrder = 20; g.remove(kid); g.add(s); G.walkerKid = s; }
}
function buildFlag(cell){
  const f = new THREE.Group();
  f.add(at(cyl(.04, .04, 1.3, '#8C849E', 8), 0, .65, 0));
  const cloth = new THREE.Group(); cloth.position.y = 1.1; cloth.add(at(box(.5, .32, .03, '#FF6B6B', .01), .26, 0, 0)); f.add(cloth);
  const p = cellPos(cell); f.position.set(p.x+.32, 0, p.z-.3); world.add(f); G.flag = f;
}

/* ---------------- สร้างคำใบ้แบบใช้สมอง ---------------- */
const COUNTS = [{ n:1, t:'จมูก ของ เรา 👃' }, { n:2, t:'ตา ของ เรา 👀' }, { n:2, t:'ล้อ ของ จักรยาน 🚲' }, { n:3, t:'มุม ของ สามเหลี่ยม 🔺' }, { n:3, t:'สี ของ ไฟ จราจร 🚦' },
  { n:4, t:'ขา ของ สุนัข 🐶' }, { n:4, t:'ล้อ ของ รถยนต์ 🚗' }, { n:5, t:'นิ้ว มือ 1 ข้าง ✋' }, { n:6, t:'ขา ของ มด 🐜' }, { n:8, t:'ขา ของ ปลาหมึก 🐙' }];
function stepsText(n, plus){
  if(!plus) return n+' ก้าว';
  const ways = [];
  if(n >= 2){ const a = 1+R_(n-1); ways.push(a+' + '+(n-a)+' ก้าว'); }
  { const b = 1+R_(3); ways.push((n+b)+' − '+b+' ก้าว'); }
  if(n <= 5) ways.push('ครึ่ง หนึ่ง ของ '+(2*n)+' ก้าว');
  const c = COUNTS.filter(x => x.n===n); if(c.length) ways.push('เท่ากับ จำนวน '+pick(c).t+' ก้าว');
  return pick(ways);
}
function genWalk(from, to, plus, startText){
  const dx = to.i-from.i, dy = to.j-from.j;
  let legs = [];
  if(dx) legs.push({ d:dx>0 ? 'R' : 'L', n:Math.abs(dx) });
  if(dy) legs.push({ d:dy<0 ? 'U' : 'D', n:Math.abs(dy) });
  legs = shuffle(legs);
  if(plus && Math.random() < .7){
    /* เดินเลยไปก่อนแล้วถอยกลับ */
    const k0 = R_(legs.length), L0 = legs[k0], k = 1+R_(2);
    const before = legs.slice(0, k0).reduce((c, l) => ({ i:c.i+DIR[l.d].di*l.n, j:c.j+DIR[l.d].dj*l.n }), { ...from });
    const over = { i:before.i+DIR[L0.d].di*(L0.n+k), j:before.j+DIR[L0.d].dj*(L0.n+k) };
    if(over.i>=0 && over.i<COLS && over.j>=0 && over.j<ROWS) legs.splice(k0, 1, { d:L0.d, n:L0.n+k }, { d:OPP[L0.d], n:k });
  }
  const items = legs.map(l => 'เดิน '+DIR[l.d].t+' '+stepsText(l.n, plus));
  return { html:'<div class="cl"><div class="cl-start">'+startText+'</div><ol>'+items.map(t => '<li>'+t+'</li>').join('')+'</ol><div class="cl-end">แล้ว กด 🔍 ค้นหา ตรงนั้น</div></div>',
    speech:startText+' '+items.join(' แล้ว ')+' แล้ว กด ค้นหา', legs };
}
function genMap(origin, target){
  const cells = {};
  R.props.forEach(o => { const e = o.p.e ?? MODEL_EMOJI[o.p.m]; if(!e || o.p.m==='fence' || o.p.m==='window') return; const k = ckey(o.cell); if(!cells[k] || o.spot) cells[k] = e; });
  let html = '<div class="cl"><div class="cl-start">ดู แผนที่ ขุมทรัพย์ แล้ว เดิน ไป ให้ ถึง ❌</div><div class="mm"><small>⬆️ ด้านหลัง</small><div class="mm-grid">';
  for(let j=0;j<ROWS;j++) for(let i=0;i<COLS;i++){ const k = i+','+j, x = k===ckey(target), me = k===ckey(origin);
    html += '<i class="'+(x ? 'x' : me ? 'me' : '')+'">'+(me ? '🧒' : x ? '' : (cells[k]||''))+'</i>'; }
  html += '</div><small>⬇️ ด้านหน้า (ฝั่ง เรา) · 🧒 = ตรง ที่ ยืน อยู่ ตอน เริ่ม</small></div><div class="cl-end">ไป ถึง ❌ แล้ว กด 🔍 ค้นหา</div></div>';
  return { html, speech:'ดู แผนที่ ขุมทรัพย์ แล้ว เดิน ไป ให้ ถึง กากบาท แล้ว กด ค้นหา' };
}
const actOf = m => Object.keys(MODEL_ACTION).find(k => MODEL_ACTION[k].includes(m)) || 'lift';
const sideOf = x => x < -1.3 ? 'L' : x > 1.3 ? 'R' : Math.abs(x) < .8 ? 'M' : '?';
const depthOf = z => z < -2.2 ? 'B' : z > 1.5 ? 'F' : Math.abs(z) < .8 ? 'M' : '?';
function genLogic(target){
  const T = target, tp = T.p, facts = [];
  const side = sideOf(tp.at[0]), depth = depthOf(tp.at[1]), act = actOf(tp.m), high = (tp.y||0) > .3;
  const SIDE = { L:'อยู่ ฝั่ง ซ้าย ⬅️ ของ ห้อง', R:'อยู่ ฝั่ง ขวา ➡️ ของ ห้อง', M:'อยู่ แถว ตรง กลาง ไม่ ชิด ซ้าย ไม่ ชิด ขวา' };
  const NSIDE = { L:'ไม่ ได้ อยู่ ฝั่ง ซ้าย ⬅️', R:'ไม่ ได้ อยู่ ฝั่ง ขวา ➡️' };
  const DEPTH = { B:'อยู่ ด้านหลัง ⬆️ ไกล จาก เรา', F:'อยู่ ด้านหน้า ⬇️ ใกล้ ตัว เรา', M:'อยู่ แถว กลาง ไม่ หน้า ไม่ หลัง' };
  const NDEPTH = { B:'ไม่ ได้ อยู่ ด้านหลัง ⬆️', F:'ไม่ ได้ อยู่ ด้านหน้า ⬇️' };
  const ACT = { lid:'ต้อง เปิด ฝา ก่อน ถึง จะ เจอ', door:'ต้อง เปิด ประตู ก่อน ถึง จะ เจอ', drawer:'ต้อง ดึง ลิ้นชัก ออก มา', flip:'ซ่อน อยู่ ใต้ ผ้า หรือ พรม ที่ ปู พื้น', shake:'ต้อง เขย่า ให้ ของ หล่น ลง มา', lift:'ซ่อน อยู่ ข้างใต้ ต้อง ยก ขึ้น' };
  const NACT = { lid:'ไม่ ต้อง เปิด ฝา', door:'ไม่ ต้อง เปิด ประตู', drawer:'ไม่ ได้ อยู่ ใน ลิ้นชัก', flip:'ไม่ ได้ อยู่ ใต้ พรม', shake:'ไม่ ต้อง เขย่า', lift:'ไม่ ต้อง ยก ขึ้น' };
  /* ตัวเลือกที่ตำแหน่งกำกวม (อยู่ตรงเส้นแบ่ง) ถือว่ายังตัดไม่ได้ */
  if(side!=='?'){ facts.push({ t:SIDE[side], ok:s => { const v = sideOf(s.p.at[0]); return v===side || v==='?'; } });
    Object.keys(NSIDE).filter(k => k!==side).forEach(k => facts.push({ t:NSIDE[k], ok:s => { const v = sideOf(s.p.at[0]); return v!==k || v==='?'; } })); }
  if(depth!=='?'){ facts.push({ t:DEPTH[depth], ok:s => { const v = depthOf(s.p.at[1]); return v===depth || v==='?'; } });
    Object.keys(NDEPTH).filter(k => k!==depth).forEach(k => facts.push({ t:NDEPTH[k], ok:s => { const v = depthOf(s.p.at[1]); return v!==k || v==='?'; } })); }
  facts.push({ t:ACT[act], ok:s => actOf(s.p.m)===act });
  Object.keys(NACT).filter(k => k!==act).forEach(k => facts.push({ t:NACT[k], ok:s => actOf(s.p.m)!==k }));
  facts.push({ t:high ? 'วาง อยู่ บน ของ อื่น อีก ที ไม่ ได้ ตั้ง บน พื้น' : 'ตั้ง อยู่ บน พื้น', ok:s => ((s.p.y||0) > .3)===high });
  /* สูงหรือเตี้ย (วัดจากยอดของ) */
  const topOf = x => (x.p.y||0) + (x.o.top||1)*(x.p.s||1);
  const hOf = x => topOf(x) >= 1.9 ? 'T' : topOf(x) <= 1.0 ? 'S' : '?';
  const hh = hOf(T);
  if(hh!=='?') facts.push({ t:hh==='T' ? 'เป็น ของ ชิ้น สูง สูง กว่า ตัว หนู' : 'เป็น ของ ชิ้น เตี้ย ๆ ไม่ ถึง เข่า ผู้ใหญ่', ok:x => { const v = hOf(x); return v===hh || v==='?'; } });
  /* อยู่ใกล้ของชิ้นไหน */
  const dist = (a, b) => Math.hypot(a.p.at[0]-b.p.at[0], a.p.at[1]-b.p.at[1]);
  R.spots.filter(o => o!==T && dist(o, T) <= 2.2).forEach(o => {
    const d = dist(o, T); facts.push({ t:'อยู่ ใกล้ ๆ กับ '+o.p.name, ok:x => x!==o && dist(x, o) <= Math.max(2.2, d+.6) });
  });
  let cand = R.spots.slice(); const chosen = [];
  while(cand.length > 1 && chosen.length < 5){
    const opts = shuffle(facts.filter(f => !chosen.includes(f))).map(f => ({ f, n:cand.filter(f.ok).length })).filter(o => o.n < cand.length).sort((a, b) => a.n-b.n);
    if(!opts.length) break;
    const o = opts.length > 1 && opts[1].n===opts[0].n ? opts[R_(2)] : opts[0];
    chosen.push(o.f); cand = cand.filter(o.f.ok);
  }
  for(const extra of shuffle(facts.filter(f => !chosen.includes(f)))){ if(chosen.length >= 3) break; chosen.push(extra); }
  const lines = shuffle(chosen).map(f => f.t);
  if(cand.length > 1) lines.push('คำใบ้ พิเศษ: '+tp.hard);
  return { cand:cand.length, html:'<div class="cl"><div class="cl-start">ของ ซ่อน อยู่ ที่ไหน? อ่าน ให้ ครบ ทุก ข้อ แล้ว ช่วยกัน คิด</div><ol>'+lines.map(t => '<li>'+t+'</li>').join('')+'</ol><div class="cl-end">รู้ แล้ว เดิน ไป ที่ นั่น แล้ว กด 🔍 ค้นหา</div></div>',
    speech:'ของ ซ่อน อยู่ ที่ไหน '+lines.join(' และ ') };
}

/* ---------------- ด่าน ---------------- */
let R = null;
const STEP_ICON = ['📜','🗝️','💰'], STEP_NAME = ['จดหมายลับ','กุญแจ','ขุมทรัพย์'];
function openPlay(){
  $('#home').hidden = true; $('#play').hidden = false; window.scrollTo(0, 0);
  $('#back').href = '#'; $('#back').textContent = '‹ แผนที่'; $('#back').onclick = e => { e.preventDefault(); showHome(); };
  initStage(); S.resume();
  startLevel(LEVELS.find(l => l.id===SAVE.route[SAVE.pos]));
}
function startLevel(L){
  history.replaceState(null, '', '#'+L.id);
  if(world) S.scene.remove(world);
  world = new THREE.Group(); G = {}; S.scene.add(world);
  world.add(buildPlace(L));
  const spots = [], props = [], nav = NAV();
  L.props.forEach(p => {
    const make = MODELS[p.m]; if(!make){ console.warn('ไม่มีโมเดล', p.m); return; }
    const o = make(p), holder = new THREE.Group();
    holder.add(o.g); holder.position.set(p.at[0], p.y||0, p.at[1]); holder.rotation.y = (p.rot||0)*Math.PI/180; if(p.s) holder.scale.setScalar(p.s);
    o.g.traverse(m => { if(m.isMesh){ m.castShadow = true; m.receiveShadow = true; } });
    world.add(holder);
    const rec = { p, cell:cellOf(p.at[0], p.at[1]) }; props.push(rec);
    if(p.name){
      const spot = { p, o, holder, cell:rec.cell };
      holder.userData.pick = spot; rec.spot = spot;
      spot.tag = at(label(p.name, { height:.36, bg:'#FFFFFF' }), 0, (o.top||1)+.15, 0); spot.tag.visible = !!SAVE.tags; holder.add(spot.tag);
      spots.push(spot);
    }
  });
  R = { L, spots, props, step:0, wrong:0, hint:false, done:false, busy:false, nav, clues:[], moves:[] };
  if(nav){
    const used = new Set(props.map(o => ckey(o.cell)));
    const front = []; for(let j=ROWS-1;j>=5;j--) for(let i=1;i<COLS-1;i++) if(!used.has(i+','+j)) front.push({ i, j });
    R.flagCell = front.length ? pick(front.slice(0, Math.max(6, Math.floor(front.length/2)))) : { i:6, j:8 };
    const cells = new Set([ckey(R.flagCell)]), chain = [];
    for(const s of shuffle(spots)){ if(chain.length===3) break; const k = ckey(s.cell); if(cells.has(k)) continue; cells.add(k); chain.push(s); }
    R.chain = chain;
    buildGrid(); buildFlag(R.flagCell); buildWalker(R.flagCell);
    R.at = { ...R.flagCell }; R.origin = { ...R.flagCell };
    const kinds = SAVE.level==='brain' ? shuffle(['walk','map','logic']) : ['walk','walk','walk'];
    const origins = [R.flagCell, chain[0].cell, chain[1].cell];
    R.clues = chain.map((s, k) => {
      const startText = k===0 ? 'เริ่ม ที่ ธง 🚩' : 'เริ่ม จาก ตรง ที่ เจอ '+STEP_ICON[k-1];
      if(kinds[k]==='map') return genMap(origins[k], s.cell);
      if(kinds[k]==='logic') return genLogic(s);
      return genWalk(origins[k], s.cell, SAVE.level==='brain', startText);
    });
    Object.assign(S.controls, { minAzimuthAngle:-.25, maxAzimuthAngle:.5 });
  } else {
    R.chain = shuffle(spots).slice(0, 3);
    Object.assign(S.controls, { minAzimuthAngle:-.55, maxAzimuthAngle:1.0 });
  }
  $('#pad').hidden = $('#padinfo').hidden = !nav;
  S.setView(VIEW.cam, VIEW.target, 10);
  $('#lvname').textContent = L.e+' ด่านที่ '+(SAVE.pos+1)+' · '+L.name;
  $('#title').textContent = L.e+' '+L.name;
  $('#done').innerHTML = '';
  drawMoves(); drawSide(); sfx('pop');
}
function clueOf(k){
  if(R.nav) return R.clues[k];
  const t = SAVE.role==='kid' || SAVE.level==='easy' ? R.chain[k].p.easy : R.chain[k].p.hard;
  return { html:t, speech:t };
}
function drawSide(){
  $('#steps3').innerHTML = STEP_ICON.map((e,i) => '<span class="'+(i<R.step?'got':i===R.step && !R.done?'cur':'')+'">'+e+'</span>').join('<i>→</i>');
  const clue = $('#clue');
  if(R.done){ clue.innerHTML = '<h3>🎉 เจอขุมทรัพย์แล้ว!</h3>'; $('#msg').textContent = 'เก่งมาก ช่วยกันหาจนเจอ'; return; }
  const c = clueOf(R.step), what = STEP_ICON[R.step]+' '+STEP_NAME[R.step];
  const how = R.nav ? 'กดลูกศร ⬅️➡️⬆️⬇️ บนฉากเพื่อเดิน แล้วกด 🔍' : 'แตะของในห้องเพื่อค้นหา';
  if(SAVE.role==='parent'){
    clue.innerHTML = '<h3>🤫 คำใบ้ลับ หา '+what+'</h3><div class="who">สำหรับผู้ปกครอง · อย่าให้นักสำรวจเห็นนะ</div><button type="button" class="hold" id="hold">👆 กดค้างไว้เพื่ออ่านคำใบ้</button>'+
      '<div class="row" style="justify-content:center"><button type="button" class="btn" id="sayClue">🔊 ให้เครื่องอ่าน (ทุกคนได้ยิน)</button></div>';
    const h = $('#hold'), idle = '👆 กดค้างไว้เพื่ออ่านคำใบ้';
    const show = e => { e.preventDefault(); h.classList.add('show'); h.innerHTML = c.html; }, hide = () => { h.classList.remove('show'); h.textContent = idle; };
    h.addEventListener('pointerdown', show); ['pointerup','pointerleave','pointercancel'].forEach(ev => h.addEventListener(ev, hide));
    h.addEventListener('contextmenu', e => e.preventDefault());
    $('#msg').textContent = (R.step===0 ? '🧑 ผู้ปกครองอ่านคำใบ้ แล้วบอกนักสำรวจ' : '👏 เจอแล้ว! ผู้ปกครองอ่านคำใบ้ต่อไป')+' · 🔍 นักสำรวจ'+how;
  } else {
    clue.innerHTML = '<h3>📖 คำใบ้ หา '+what+'</h3><div class="who">นักอ่านตัวน้อย อ่านให้ผู้ปกครองฟังนะ</div><div class="cluetext">'+c.html+'</div>'+
      '<div class="row" style="justify-content:center"><button type="button" class="btn" id="sayClue">🔊 ฟังคำใบ้</button></div>';
    $('#msg').textContent = (R.step===0 ? '🧒 อ่านคำใบ้ให้ผู้ปกครองฟัง' : '👏 เจอแล้ว! อ่านคำใบ้ต่อไปได้เลย')+' · 🔍 ผู้ปกครอง'+how;
  }
  $('#sayClue').onclick = () => speak(c.speech);
}

/* ---------------- เดินบนตาราง ---------------- */
function drawMoves(){
  if(!R || !R.nav) return;
  const m = R.moves;
  $('#movelog').textContent = m.length ? 'เดินแล้ว: '+compress(m) : 'ยังไม่ได้เดิน';
  const here = R.spots.some(s => ckey(s.cell)===ckey(R.at));
  if(G.ring) G.ring.material.color.set(here ? '#FFB400' : '#FFFFFF');
}
function compress(m){ const out = []; m.forEach(d => { const l = out[out.length-1]; if(l && l.d===d) l.n++; else out.push({ d, n:1 }); }); return out.map(x => DIR[x.d].a+x.n).join(' '); }
async function move(d){
  if(!R || !R.nav || R.done || R.busy) return;
  const n = { i:R.at.i+DIR[d].di, j:R.at.j+DIR[d].dj };
  if(n.i<0 || n.i>=COLS || n.j<0 || n.j>=ROWS){ sfx('no'); $('#msg').textContent = '🧱 ไปต่อไม่ได้แล้ว สุดขอบแล้ว'; return; }
  R.at = n; R.moves.push(d); sfx('tap');
  const p = cellPos(n); tween(G.walker.position, { x:p.x, z:p.z }, 160, ease.out);
  drawMoves();
}
document.querySelectorAll('#pad [data-d]').forEach(b => b.addEventListener('click', () => move(b.dataset.d)));
$('#searchBtn').onclick = () => search();
$('#backStart').onclick = () => { if(!R || !R.nav || R.busy || R.done) return; R.at = { ...R.origin }; R.moves = []; const p = cellPos(R.at); tween(G.walker.position, { x:p.x, z:p.z }, 300, ease.inOut); sfx('take'); drawMoves(); $('#msg').textContent = '↩️ กลับมาที่จุดเริ่มของคำใบ้นี้แล้ว ลองนับก้าวใหม่นะ'; };
window.addEventListener('keydown', e => { const k = { ArrowLeft:'L', ArrowRight:'R', ArrowUp:'U', ArrowDown:'D' }[e.key]; if(k && !$('#play').hidden){ e.preventDefault(); move(k); } if(e.key==='Enter' && !$('#play').hidden && R && R.nav) search(); });
async function search(){
  if(!R || !R.nav || R.done || R.busy) return;
  const here = R.spots.filter(s => ckey(s.cell)===ckey(R.at)), target = R.chain[R.step];
  if(here.includes(target)){ await openSpot(target); return; }
  if(here.length){ await openSpot(here[0]); return; }
  R.wrong++; sfx('no');
  R.busy = true; await reveal('❔', G.walker.position.clone().setY(1.2), false); R.busy = false;
  $('#msg').textContent = '🤔 ตรงนี้ไม่มีของให้ค้นเลย ลองอ่านคำใบ้แล้วนับก้าวใหม่อีกครั้ง';
}
async function onTap(x, y){
  if(!R || R.done || R.busy) return;
  const hit = S.pick(x, y, world.children); if(!hit) return;
  const spot = hit.obj.userData.pick; if(!spot || !spot.o.open) return;
  if(R.nav){ $('#msg').textContent = '🧭 โหมดนี้ต้องเดินไปให้ถึงก่อน ใช้ปุ่มลูกศรแล้วกด 🔍'; sfx('tap'); return; }
  await openSpot(spot);
}
async function openSpot(spot){
  R.busy = true;
  const target = R.chain[R.step];
  sfx('tap');
  await spot.o.open();
  const world0 = spot.holder.localToWorld(spot.o.reveal.clone());
  if(spot===target){
    clearHint();
    const icon = STEP_ICON[R.step];
    let from = world0.clone();
    if(spot.o.drop){ const s = sprite(icon, { size:.9 }); s.position.copy(from); world.add(s); const ground = spot.holder.localToWorld(new THREE.Vector3(0, .5, 1.1)); await tween(s.position, { x:ground.x, y:ground.y, z:ground.z }, 450, ease.bounce); from = ground; world.remove(s); }
    await reveal(icon, from, true);
    R.step++;
    if(R.nav){ R.origin = { ...R.at }; R.moves = []; drawMoves(); }
    if(R.step >= 3){ await finishLevel(spot); }
    else { sfx('ok'); drawSide(); }
    await wait(300); await spot.o.close();
  } else {
    R.wrong++;
    const done = R.chain.slice(0, R.step).includes(spot);
    await reveal(done ? '✅' : EMPTY_FINDS[R_(EMPTY_FINDS.length)], world0, false);
    $('#msg').textContent = done ? '✅ ตรงนี้เจอของไปแล้ว ลองที่อื่นนะ' : '🤔 '+spot.p.name+' ไม่มี '+STEP_ICON[R.step]+(R.nav ? ' ลองนับก้าวใหม่ หรือกด ↩️ กลับจุดเริ่ม' : ' ลองฟังคำใบ้อีกครั้งนะ');
    await spot.o.close();
  }
  R.busy = false;
}
async function reveal(icon, pos, good){
  const s = sprite(icon, { size:good ? 1.1 : .7 }); s.position.copy(pos); s.scale.set(.1, .1, 1); world.add(s);
  if(good){ sfx('ding'); await tween(s.scale, { x:1.3, y:1.3 }, 300, ease.back); await tween(s.position, { y:pos.y+1.4 }, 500, ease.out); await wait(400); }
  else { await tween(s.scale, { x:.8, y:.8 }, 250, ease.back); await tween(s.position, { y:pos.y+.5 }, 350); await wait(350); }
  world.remove(s);
}
function clearHint(){ if(G.hint){ world.remove(G.hint); G.hint = null; } (G.feet||[]).forEach(f => world.remove(f)); G.feet = []; }
$('#hintBtn').onclick = () => {
  if(!R || R.done) return;
  const spot = R.chain[R.step]; clearHint(); R.hint = true; sfx('ding');
  if(R.nav){
    /* รอยเท้าบอกทางจากจุดเริ่มของคำใบ้ */
    const a = R.origin, b = spot.cell, path = [];
    let c = { ...a }; while(c.i !== b.i){ c = { i:c.i + Math.sign(b.i-c.i), j:c.j }; path.push({ ...c }); }
    while(c.j !== b.j){ c = { i:c.i, j:c.j + Math.sign(b.j-c.j) }; path.push({ ...c }); }
    G.feet = path.map(pc => { const f = sprite('👣', { size:.5 }); f.position.copy(cellPos(pc)).setY(.35); world.add(f); return f; });
    $('#msg').textContent = '💡 เดินตามรอยเท้า 👣 จากจุดเริ่มของคำใบ้นี้';
  } else {
    G.hint = glow('#FFE27A', 1); G.hint.position.copy(spot.holder.localToWorld(new THREE.Vector3(0, (spot.o.top||1)*.6, 0))); world.add(G.hint);
    $('#msg').textContent = '💡 ดูแสงวิบวับในห้อง ของอยู่แถว ๆ นั้น';
  }
};
$('#tagBtn').onclick = () => { SAVE.tags = !SAVE.tags; persist(); if(R) R.spots.forEach(s => s.tag.visible = SAVE.tags); $('#tagBtn').classList.toggle('go', !!SAVE.tags); sfx('tap'); };
$('#tagBtn').classList.toggle('go', !!SAVE.tags);
$('#restartBtn').onclick = () => { if(R) startLevel(R.L); };

async function finishLevel(spot){
  R.done = true; drawSide();
  const chest = new THREE.Group(), lid = new THREE.Group();
  chest.add(at(box(1.1, .6, .75, '#C98D55', .06), 0, .3, 0), at(box(1.14, .1, .79, '#F2C94C', .02), 0, .45, 0));
  lid.position.set(0, .6, -.375); lid.add(at(box(1.1, .26, .75, '#B97A45', .08), 0, .13, .375), at(box(.16, .2, .06, '#F2C94C', .02), 0, 0, .76)); chest.add(lid);
  const ground = spot.holder.localToWorld(new THREE.Vector3(0, 0, 1.2)); chest.position.set(ground.x, 0, ground.z); chest.lookAt(S.camera.position.x, 0, S.camera.position.z);
  chest.scale.setScalar(.1); world.add(chest);
  await tween(chest.scale, { x:1, y:1, z:1 }, 450, ease.back);
  sfx('win'); await tween(lid.rotation, { x:-1.9 }, 600, ease.back);
  const shine = glow('#FFE27A', 1); shine.position.set(ground.x, .9, ground.z); shine.scale.set(.1, .1, 1); world.add(shine); tween(shine.scale, { x:3.2, y:3.2 }, 600, ease.back);
  ['💰','💎','👑','🪙','⭐'].forEach((e, i) => { const s = sprite(e, { size:.6 }); s.position.set(ground.x, .8, ground.z); world.add(s); tween(s.position, { x:ground.x+(i-2)*.55, y:2.1+(i%2)*.3 }, 700+i*80, ease.back); });
  const stars = R.wrong <= 2 && !R.hint ? 3 : R.wrong <= 5 ? 2 : 1;
  const L = R.L, sk = starKey(L.id);
  SAVE.stars[sk] = Math.max(SAVE.stars[sk]||0, stars);
  const last = SAVE.pos >= SAVE.route.length-1;
  if(!last) SAVE.pos++;
  persist();
  const modeName = { easy:'ง่าย', hard:'ปริศนา', walk:'นักเดินทาง', brain:'นักคิด' }[SAVE.level];
  if(window.KP) KP.log({ kind:'game', page:'treasure', item:'treasure-'+L.id+'-'+SAVE.level, title:'ล่าขุมทรัพย์ · '+L.name+' ('+modeName+')', stars, mistakes:R.wrong });
  const allDone = LEVELS.every(l => SAVE.stars[starKey(l.id)]);
  $('#done').innerHTML = '<div class="done"><div class="big">🎉💰🎉</div><div class="stars">'+starTxt(stars)+'</div><p><b>เจอขุมทรัพย์'+L.name+'แล้ว!</b><br>ค้นผิด '+R.wrong+' ครั้ง'+(R.hint ? ' · ใช้ใบ้เพิ่ม' : '')+'</p>'+
    (last ? '<p>🏆 '+(allDone ? 'ล่าสมบัติครบทุกด่านแล้ว สุดยอดทีม!' : 'จบเส้นทางแล้ว ลองกลับไปเก็บดาวด่านที่ยังไม่ผ่านนะ')+'</p><button type="button" class="btn go" id="newRoute">🔀 เริ่มเส้นทางใหม่ (สุ่มลำดับ)</button>'
      : '<button type="button" class="btn go" id="nextLv">ด่านต่อไป ▶</button>')+
    '<button type="button" class="btn" id="againLv">↺ เล่นด่านนี้อีกครั้ง (ที่ซ่อนใหม่)</button><button type="button" class="btn" id="toMap">🧭 แผนที่</button></div>';
  if($('#nextLv')) $('#nextLv').onclick = () => startLevel(LEVELS.find(l => l.id===SAVE.route[SAVE.pos]));
  if($('#newRoute')) $('#newRoute').onclick = () => { ensureRoute(true); startLevel(LEVELS.find(l => l.id===SAVE.route[0])); };
  $('#againLv').onclick = () => { if(!last) SAVE.pos--; persist(); startLevel(L); };
  $('#toMap').onclick = showHome;
  speak('เจอขุมทรัพย์แล้ว เก่งมาก');
  if(window.innerWidth <= 980) setTimeout(() => $('#done').scrollIntoView({ behavior:'smooth', block:'center' }), 1200);
}

/* เปิดด่านจากลิงก์ #id ได้ */
const h = decodeURIComponent((location.hash||'').slice(1));
if(h && LEVELS.some(l => l.id===h)){ SAVE.pos = SAVE.route.indexOf(h); openPlay(); } else showHome();
window.__test = { get R(){ return R; }, get S(){ return S; }, onTap, move, search, LEVELS, MODELS, startLevel, showHome, openPlay, SAVE, genLogic, genWalk, cellOf };
