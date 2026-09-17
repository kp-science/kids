/* ============================================================
   ชุดเครื่องมือกลางของกิจกรรม STEM 3 มิติ (Three.js จาก jsDelivr)
   ฉาก 3 มิติ · หมุน/ซูมด้วยนิ้ว · แตะเลือกวัตถุ · เสียง · อ่านออกเสียง · แบบทดสอบ
   ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };

export const $ = s => document.querySelector(s);
export const R = n => Math.floor(Math.random()*n);
export const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=R(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
window.__stemReady = true;

/* ---------------- บันทึกในเครื่อง ---------------- */
export function store(key){
  let d = {}; try{ d = JSON.parse(localStorage.getItem(key)||'{}') || {}; }catch(e){}
  d.stars = d.stars || {};
  d.save = () => { try{ const { save, ...rest } = d; localStorage.setItem(key, JSON.stringify(rest)); }catch(e){} };
  return d;
}

/* ---------------- เสียง ---------------- */
let muted = false, AC = null;
try{ muted = localStorage.getItem('kids-brain-mute')==='1'; }catch(e){}
export function setupMute(btn){
  btn.textContent = muted ? '🔇' : '🔊';
  btn.onclick = () => { muted = !muted; btn.textContent = muted ? '🔇' : '🔊'; try{ localStorage.setItem('kids-brain-mute', muted?'1':'0'); }catch(e){} if(muted && window.speechSynthesis) speechSynthesis.cancel(); };
}
function ac(){ AC = AC || new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); return AC; }
function tone(f, ms, { type='sine', vol=.08, at=0, to=null }={}){
  const a = ac(), t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if(to) o.frequency.exponentialRampToValueAtTime(to, t+ms/1000);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t+ms/1000);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t+ms/1000+.03);
}
function noise(ms, { vol=.15, at=0, freq=900, q=.7, type='lowpass' }={}){
  const a = ac(), t = a.currentTime + at, n = Math.floor(a.sampleRate*ms/1000), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  for(let i=0;i<n;i++) ch[i] = (Math.random()*2-1) * (1 - i/n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(t);
}
export function sfx(kind){
  if(muted) return;
  try{
    switch(kind){
      case 'tap':   tone(700, 60, { vol:.05 }); break;
      case 'pop':   tone(420, 110, { to:900, vol:.07 }); break;
      case 'take':  tone(800, 110, { to:380, vol:.06 }); break;
      case 'click': tone(1800, 25, { type:'square', vol:.03 }); tone(900, 30, { type:'square', vol:.03, at:.03 }); break;
      case 'ok':    tone(660, 120); tone(990, 180, { at:.12 }); break;
      case 'win':   [523,659,784,1047].forEach((f,i) => tone(f, 220, { at:i*.11, vol:.07 })); break;
      case 'no':    tone(260, 220, { type:'triangle', vol:.08, to:200 }); break;
      case 'ding':  tone(1320, 700, { vol:.05 }); tone(1980, 500, { vol:.02 }); break;
      case 'splash':noise(420, { vol:.22, freq:1400 }); noise(260, { vol:.1, freq:500, at:.05 }); break;
      case 'plop':  tone(300, 160, { to:120, vol:.08 }); noise(120, { vol:.06, freq:800 }); break;
      case 'bubble':tone(500+R(400), 80, { to:1200, vol:.03 }); break;
      case 'crack': noise(160, { vol:.35, freq:2600, type:'bandpass', q:.8 }); noise(500, { vol:.25, freq:300, at:.08 }); tone(90, 400, { type:'sawtooth', vol:.05, at:.05, to:40 }); break;
      case 'creak': tone(140, 500, { type:'sawtooth', vol:.025, to:110 }); break;
      case 'engine':tone(70, 900, { type:'sawtooth', vol:.025, to:95 }); break;
      case 'bell':  tone(2000, 120, { vol:.04 }); tone(2000, 160, { vol:.04, at:.16 }); break;
    }
  }catch(e){}
}
let thVoice = null;
if(window.speechSynthesis){ const pv = () => { const v = speechSynthesis.getVoices().filter(x => /^th/i.test(x.lang)); thVoice = v.find(x => /Kanya|Narisa|Premwadee/i.test(x.name)) || v[0] || null; }; pv(); speechSynthesis.onvoiceschanged = pv; }
export const cleanSpeech = t => String(t).replace(/<[^>]+>/g,' ').replace(/[\u{1F000}-\u{1FFFF}\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}️]/gu,'').replace(/[·"“”()]/g,' ');
export function speak(t){
  if(muted || !window.speechSynthesis) return;
  try{ speechSynthesis.cancel(); }catch(e){}
  const u = new SpeechSynthesisUtterance(cleanSpeech(t)); u.lang = 'th-TH'; u.rate = .95; if(thVoice) u.voice = thVoice; speechSynthesis.speak(u);
}

/* ---------------- ฉาก 3 มิติ ---------------- */
export function stage(el, { cam=[0,7,9], target=[0,0,0], fov=40, minDist=6, maxDist=20, minPolar=.25, maxPolar=1.35, minAzimuth=-Infinity, maxAzimuth=Infinity, shadow=8 }={}){
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, .1, 200);
  camera.position.set(...cam);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xD9CBB5, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.55);
  sun.position.set(5, 12, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0008; sun.shadow.normalBias = .02;
  Object.assign(sun.shadow.camera, { left:-shadow, right:shadow, top:shadow, bottom:-shadow, near:1, far:40 });
  scene.add(sun);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...target); controls.enableDamping = true; controls.dampingFactor = .12; controls.enablePan = false;
  Object.assign(controls, { minDistance:minDist, maxDistance:maxDist, minPolarAngle:minPolar, maxPolarAngle:maxPolar, minAzimuthAngle:minAzimuth, maxAzimuthAngle:maxAzimuth, rotateSpeed:.6, zoomSpeed:.8 });
  controls.update();
  const cam0 = camera.position.clone(), home = { cam:cam0.clone(), target:controls.target.clone() };
  let touched = false, settingView = false; controls.addEventListener('start', () => { touched = true; });

  const frames = new Set(), tapFns = []; let t = 0;
  const api = { THREE, scene, camera, renderer, controls, sun, el,
    onFrame(fn){ frames.add(fn); return () => frames.delete(fn); },
    onTap(fn){ tapFns.push(fn); },
    pick(cx, cy, list){
      const r = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((cx-r.left)/r.width*2-1, -(cy-r.top)/r.height*2+1), camera);
      for(const h of ray.intersectObjects(list || scene.children, true)){
        let o = h.object; while(o && !o.userData.pick) o = o.parent;
        if(o && o.visible !== false) return { obj:o, point:h.point };
      }
      return null;
    },
    rayPlane(cx, cy, y=0){
      const r = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((cx-r.left)/r.width*2-1, -(cy-r.top)/r.height*2+1), camera);
      const p = new THREE.Vector3(); return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0), -y), p) ? p : null;
    },
    toScreen(v){ const p = v.clone().project(camera), r = renderer.domElement.getBoundingClientRect(); return { x:(p.x+1)/2*r.width, y:(1-p.y)/2*r.height, behind:p.z>1 }; },
    step(dt=1/60, n=1){ for(let i=0;i<n;i++){ t += dt; frames.forEach(fn => fn(dt, t)); } },
    setView(cam, target, ms=700){
      cam0.set(...cam); home.target.set(...target); settingView = true; resize(); settingView = false; touched = false;
      const c = home.cam.clone();
      tween(camera.position, { x:c.x, y:c.y, z:c.z }, ms, ease.inOut); tween(controls.target, { x:target[0], y:target[1], z:target[2] }, ms, ease.inOut);
    },
    resetView(){ tween(camera.position, { x:home.cam.x, y:home.cam.y, z:home.cam.z }, 600); tween(controls.target, { x:home.target.x, y:home.target.y, z:home.target.z }, 600); },
  };
  /* แตะ = กดแล้วปล่อยโดยไม่ลาก (ลาก = หมุนกล้อง) */
  let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = { x:e.clientX, y:e.clientY, t:performance.now() }; });
  renderer.domElement.addEventListener('pointerup', e => {
    if(!down) return; const d = Math.hypot(e.clientX-down.x, e.clientY-down.y), dt = performance.now()-down.t; down = null;
    if(d < 10 && dt < 600) tapFns.forEach(fn => fn(e.clientX, e.clientY, e));
  });
  renderer.domElement.style.touchAction = 'none';

  function resize(){
    const w = el.clientWidth||1, h = el.clientHeight||1; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
    /* จอแคบ (มือถือแนวตั้ง) ถอยกล้องออกให้เห็นทั้งฉาก */
    const k = Math.pow(Math.max(1, 1.25/camera.aspect), .75);
    home.cam.copy(cam0).sub(home.target).multiplyScalar(k).add(home.target);
    controls.maxDistance = Math.max(maxDist, home.cam.distanceTo(home.target)*1.2);
    if(!touched && w > 1 && !settingView) camera.position.copy(home.cam);
  }
  new ResizeObserver(resize).observe(el); resize();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(.05, clock.getDelta()); t += dt;
    controls.update();
    frames.forEach(fn => fn(dt, t));
    renderer.render(scene, camera);
  });
  return api;
}

/* ---------------- สร้างรูปทรง ---------------- */
export const mat = (color, o={}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness:.65, metalness:0 }, o));
function shade(m, cast=true, recv=true){ m.castShadow = cast; m.receiveShadow = recv; return m; }
export const box = (w, h, d, color, r=.06, o) => shade(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w/2-.001, h/2-.001, d/2-.001)), color.isMaterial ? color : mat(color, o)));
export const cyl = (rt, rb, h, color, seg=28, o) => shade(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color.isMaterial ? color : mat(color, o)));
export const sph = (r, color, o) => shade(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), color.isMaterial ? color : mat(color, o)));
export function group(...kids){ const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; }
export function at(o, x=0, y=0, z=0){ o.position.set(x, y, z); return o; }
export function rot(o, x=0, y=0, z=0){ o.rotation.set(x, y, z); return o; }

/* ป้ายอีโมจิ/ตัวหนังสือลอยในฉาก */
export function sprite(text, { size=.8, bg=null, color='#3A3350', font=110 }={}){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  if(bg){ g.fillStyle = bg; g.beginPath(); g.arc(128,128,118,0,Math.PI*2); g.fill(); }
  g.font = font+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Mali",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color;
  g.fillText(text, 128, 138);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false }));
  s.scale.set(size, size, 1); return s;
}
/* ป้ายข้อความทรงแคปซูล กว้างตามข้อความ */
export function label(text, { height=.4, bg='#FFFFFF', color='#3A3350' }={}){
  const c = document.createElement('canvas'), g = c.getContext('2d'), F = '700 64px "Mali","Noto Sans Thai Looped",sans-serif';
  g.font = F; const w = Math.ceil(g.measureText(text).width) + 56; c.width = w; c.height = 104;
  g.font = F; g.fillStyle = bg; g.beginPath(); g.roundRect(2, 2, w-4, 100, 50); g.fill();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w/2, 56);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false }));
  s.scale.set(height*w/104, height, 1); return s;
}
/* แสงเรือง (glow) */
export function glow(color='#FFE27A', size=2){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0, color); gr.addColorStop(.35, color+'AA'); gr.addColorStop(1, color+'00');
  g.fillStyle = gr; g.fillRect(0,0,128,128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  s.scale.set(size, size, 1); return s;
}

/* รูปย่อของโมเดล (ใช้ในกล่องชิ้นส่วน) · builders = { ชื่อ: () => Object3D } */
export function makeThumbs(builders, { size=120, view=[.75,.9,1.2] }={}){
  const out = {}, r = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true }); r.setSize(size, size);
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0xD9CBB5, 1.5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.8); dl.position.set(3, 6, 4); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(32, 1, .01, 100);
  for(const k in builders){
    const m = builders[k](); sc.add(m);
    const b = new THREE.Box3().setFromObject(m), c = b.getCenter(new THREE.Vector3()), s = Math.max(.3, b.getSize(new THREE.Vector3()).length());
    cam.position.set(c.x + s*view[0], c.y + s*view[1], c.z + s*view[2]); cam.lookAt(c);
    r.render(sc, cam); out[k] = r.domElement.toDataURL(); sc.remove(m);
  }
  r.dispose(); r.forceContextLoss();
  return out;
}

/* ---------------- ขยับแบบนุ่ม ---------------- */
export const ease = { out:t => 1-Math.pow(1-t,3), inOut:t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2, back:t => 1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2), lin:t => t,
  bounce:t => { const n=7.5625, d=2.75; if(t<1/d) return n*t*t; if(t<2/d) return n*(t-=1.5/d)*t+.75; if(t<2.5/d) return n*(t-=2.25/d)*t+.9375; return n*(t-=2.625/d)*t+.984375; } };
export function tween(obj, to, ms=400, fn=ease.out){
  if(!(ms > 0)){ Object.assign(obj, to); return Promise.resolve(); }
  const from = {}; for(const k in to) from[k] = obj[k];
  const t0 = performance.now();
  return new Promise(res => {
    const step = now => {
      const k = Math.min(1, (now-t0)/ms), e = fn(k);
      for(const p in to) obj[p] = from[p] + (to[p]-from[p])*e;
      if(k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
export const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- แถบเลือกด่าน ---------------- */
export function levelBar(el, levels, { cur, stars, onPick, quiz }){
  el.innerHTML = levels.map((L,i) => {
    const s = stars[L.id]||0;
    return '<button type="button" class="lv'+(L.id===cur?' on':'')+(s?' done':'')+'" data-id="'+L.id+'">'+(i+1)+'. '+L.name+'<small>'+'⭐'.repeat(s)+'☆'.repeat(3-s)+'</small></button>';
  }).join('') + (quiz ? '<button type="button" class="lv quiz'+(cur==='quiz'?' on':'')+'" data-id="quiz">📝 แบบทดสอบ<small>'+'⭐'.repeat(stars.quiz||0)+'☆'.repeat(3-(stars.quiz||0))+'</small></button>' : '');
  el.querySelectorAll('.lv').forEach(b => b.onclick = () => onPick(b.dataset.id));
  const on = el.querySelector('.lv.on'); if(on) on.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
}

/* ---------------- ป้ายแจ้งเล็ก ---------------- */
export function pop(msg, kind='ok'){
  const d = document.createElement('div'); d.className = 'popmsg '+kind; d.innerHTML = msg; document.body.appendChild(d);
  requestAnimationFrame(() => d.classList.add('on'));
  setTimeout(() => { d.classList.remove('on'); setTimeout(() => d.remove(), 400); }, 2200);
}

/* ============================================================
   แบบทดสอบ · ทุกข้ออยู่หน้าเดียว แตะตอบแล้วเฉลยทันที
   bank: [{ q, e, opts:[[emoji, ข้อความ], ...] (ตัวแรกถูก), why }]
   ============================================================ */
export function quiz(el, { bank, count=8, page, title, st, onDone }){
  const qs = shuffle(bank).slice(0, count).map(q => ({ ...q, order:shuffle(q.opts.map((o,i) => i)) }));
  let answered = 0, right = 0; const wrong = [];
  const tints = ['#FFF4F8','#EEF6FF','#F0FAF0','#FFF7EA','#F5F0FF','#EAF8F7'];
  el.innerHTML = '<div class="qhead"><h2>📝 แบบทดสอบ '+title+'</h2><p>อ่านคำถาม แล้วแตะคำตอบที่ถูก · แตะ 🔊 เพื่อฟัง · มี '+qs.length+' ข้อ</p><div class="qprog"><i id="qbar"></i></div></div>'+
    qs.map((q,k) => '<div class="qq" id="qq'+k+'" style="background:'+tints[k%tints.length]+'"><div class="qh"><span class="qn">'+(k+1)+'</span><span class="qt">'+q.q+'</span>'+(q.e?'<span class="qe">'+q.e+'</span>':'')+
      '<button type="button" class="spk" data-k="'+k+'" aria-label="ฟังคำถาม">🔊</button></div>'+
      '<div class="qo">'+q.order.map(i => '<button type="button" class="qopt" data-k="'+k+'" data-i="'+i+'"><span class="em">'+q.opts[i][0]+'</span><span>'+q.opts[i][1]+'</span></button>').join('')+'</div>'+
      '<div class="qfb" id="qfb'+k+'"></div></div>').join('')+
    '<div id="qend"></div>';
  el.querySelectorAll('.spk').forEach(b => b.onclick = () => { const q = qs[+b.dataset.k]; speak(q.q+' '+q.order.map(i => q.opts[i][1]).join(' หรือ ')); });
  el.querySelectorAll('.qopt').forEach(b => b.onclick = () => {
    const k = +b.dataset.k, i = +b.dataset.i, q = qs[k]; if(q.done) return; q.done = true; answered++;
    const ok = i === 0; if(ok) right++; else wrong.push(cleanSpeech(q.q));
    el.querySelectorAll('.qopt[data-k="'+k+'"]').forEach(x => { x.disabled = true; const j = +x.dataset.i; x.classList.add(j===0 ? 'right' : j===i ? 'wrong' : 'dim'); });
    const fb = el.querySelector('#qfb'+k); fb.className = 'qfb '+(ok?'ok':'no'); fb.innerHTML = (ok ? '✅ ถูกต้อง! ' : '💡 คำตอบที่ถูกคือช่องสีเขียว · ')+q.why;
    sfx(ok ? 'ok' : 'no');
    el.querySelector('#qbar').style.width = Math.round(answered/qs.length*100)+'%';
    if(answered === qs.length) finish();
  });
  function finish(){
    const pct = right/qs.length, stars = pct>=.9 ? 3 : pct>=.7 ? 2 : pct>=.5 ? 1 : 0;
    st.stars.quiz = Math.max(st.stars.quiz||0, stars); st.save();
    if(window.KP) KP.log({ kind:'test', page, subject:'STEM', title:'แบบทดสอบ '+title, score:right, total:qs.length, stars:Math.max(1, stars), wrong:wrong.slice(0,10) });
    const end = el.querySelector('#qend');
    end.innerHTML = '<div class="qdone"><div class="big">'+(stars>=2?'🎉🏆🎉':'🌈')+'</div><div class="stars">'+'⭐'.repeat(stars)+'☆'.repeat(3-stars)+'</div>'+
      '<div class="score">'+right+' / '+qs.length+'</div><p>'+(stars>=2 ? 'เก่งมาก!' : 'ลองกลับไปเล่นด่านทดลองอีกครั้ง แล้วมาทำใหม่นะ')+'</p>'+
      '<button type="button" class="btn go" id="qagain">ทำชุดใหม่ (สุ่มข้อใหม่)</button></div>';
    end.querySelector('#qagain').onclick = () => { quiz(el, { bank, count, page, title, st, onDone }); window.scrollTo({ top:el.offsetTop-80, behavior:'smooth' }); };
    sfx(stars>=2 ? 'win' : 'ok'); speak('ได้ '+right+' คะแนน จาก '+qs.length+' ข้อ');
    end.scrollIntoView({ behavior:'smooth', block:'center' });
    if(onDone) onDone(stars);
  }
}
