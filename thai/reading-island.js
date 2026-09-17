/* ============================================================
   เกาะนักอ่าน 3 มิติ · ก้อนหินวนเป็นเกลียวเข้าหาหีบสมบัติกลางเกาะ
   ตัวละครคือรูปลูก (img/kid.webp) กระโดดไปทีละก้อนเมื่อตอบคำถาม
   ============================================================ */
import { THREE, stage, sfx, mat, box, cyl, sph, at, rot, sprite, glow, tween, ease, wait } from '../stem/stem3d.js';

export async function createIsland(el, { tiles=12 }={}){
  /* ตำแหน่งก้อนหิน: เกลียวจากขอบเกาะเข้าหากลาง (0 = จุดเริ่ม) */
  const P = []; { let th = 0; for(let i=0;i<=tiles;i++){ const r = 5.3 - .8*th; P.push(new THREE.Vector3(r*Math.cos(th), .6, r*Math.sin(th))); th += 1.4/Math.max(r, 1.4); } }
  const OFF = new THREE.Vector3(2.4, 6.8, 9.2);
  const S = stage(el, { cam:P[0].clone().add(OFF).toArray(), target:P[0].toArray(), minDist:4, maxDist:22, minPolar:.3, maxPolar:1.35, shadow:9 });
  const scene = S.scene;

  /* ทะเลและเกาะ */
  const sea = rot(new THREE.Mesh(new THREE.CircleGeometry(60, 48), mat('#8FD9F7', { roughness:.3 })), -Math.PI/2); sea.receiveShadow = true; scene.add(sea);
  const foam = at(rot(new THREE.Mesh(new THREE.TorusGeometry(7.75, .09, 8, 64), new THREE.MeshBasicMaterial({ color:'#FFFFFF', transparent:true, opacity:.7 })), Math.PI/2), 0, .03, 0); scene.add(foam);
  scene.add(at(cyl(7.2, 7.8, .8, '#F6E1B0', 48), 0, 0, 0));
  scene.add(at(cyl(6.4, 6.7, .25, '#A8DE94', 48), 0, .4, 0));
  scene.add(at(cyl(1.25, 1.5, .3, '#B9E6A6', 32), 0, .6, 0));

  /* ต้นมะพร้าว ดอกไม้ ก้อนหิน กระท่อม ท่าเรือ */
  const farFromPath = (x, z, d) => P.every(p => Math.hypot(p.x-x, p.z-z) > d) && Math.hypot(x, z) > 1.8;
  function palm(x, z, s=1){
    const g = new THREE.Group();
    for(let i=0;i<5;i++) g.add(at(rot(cyl(.12-i*.012, .14-i*.012, .5, '#B98556', 10), 0, 0, .06*i), .05*i*i*.4, .25+i*.46, 0));
    for(let i=0;i<6;i++){ const leaf = box(1.3, .05, .34, '#5FBF6E', .02); const L = new THREE.Group(); leaf.position.x = .62; L.add(leaf); L.rotation.set(0, i*Math.PI/3, -.45); L.position.set(.4, 2.5, 0); g.add(L); }
    g.add(at(sph(.1, '#8B5A2B'), .45, 2.35, .1), at(sph(.1, '#8B5A2B'), .32, 2.35, -.1));
    g.position.set(x, .5, z); g.scale.setScalar(s); g.rotation.y = Math.random()*6; g.traverse(m => { if(m.isMesh) m.castShadow = true; }); scene.add(g);
  }
  let placed = 0;
  for(let t=0;t<200 && placed<9;t++){ const a = Math.random()*Math.PI*2, r = 2.2 + Math.random()*3.9, x = r*Math.cos(a), z = r*Math.sin(a); if(farFromPath(x, z, 1.25)){ palm(x, z, .75+Math.random()*.4); placed++; } }
  const COLORS = ['#FF9EC4','#FFD66B','#C9A8FF','#FFFFFF','#FFB38A'];
  for(let t=0,n=0;t<400 && n<40;t++){ const a = Math.random()*Math.PI*2, r = 1.9 + Math.random()*4.4, x = r*Math.cos(a), z = r*Math.sin(a); if(farFromPath(x, z, .7)){ scene.add(at(sph(.09, COLORS[n%5]), x, .6, z), at(cyl(.015, .015, .12, '#5FBF6E', 5), x, .55, z)); n++; } }
  [[6.9,.8],[-6.6,-2.4],[2.5,-6.8],[-3.8,5.8]].forEach(([x,z]) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.45, 0), mat('#BDB6C8', { flatShading:true })); m.position.set(x, .45, z); m.scale.y = .6; m.castShadow = true; scene.add(m); });
  { const h = new THREE.Group(); h.add(at(box(1.4, 1, 1.2, '#FFE0B5', .05), 0, .5, 0), at(new THREE.Mesh(new THREE.ConeGeometry(1.15, .9, 4), mat('#E07A5F')), 0, 1.45, 0), at(box(.36, .6, .05, '#A0673C', .02), 0, .3, .61));
    h.children[1].rotation.y = Math.PI/4; h.position.set(-4.2, .52, -3.6); h.rotation.y = .7; h.traverse(m => { if(m.isMesh) m.castShadow = true; }); scene.add(h); }
  { const d = new THREE.Group(); for(let i=0;i<5;i++) d.add(at(box(.5, .08, 1.3, '#C98D55', .02), i*.55, 0, 0)); d.add(at(cyl(.06, .06, .8, '#9C6B45'), 2.3, -.3, .55), at(cyl(.06, .06, .8, '#9C6B45'), 2.3, -.3, -.55));
    d.position.set(P[0].x + .9, .45, P[0].z); scene.add(d); }

  /* ก้อนหินทางเดิน */
  const TILE0 = '#FFFFFF';
  const tileMeshes = P.map((p, i) => { const m = at(cyl(i===0 ? .72 : .58, i===0 ? .8 : .66, .18, i===0 ? '#E9C893' : TILE0, 24), p.x, .55, p.z); scene.add(m); return m; });
  for(let i=0;i<P.length-1;i++){ const a = P[i], b = P[i+1]; for(let k=1;k<3;k++){ const q = a.clone().lerp(b, k/3); scene.add(at(sph(.07, '#EADFC8'), q.x, .54, q.z)); } }
  let icons = [], marks = [], prizes = [];

  /* หีบสมบัติ */
  const chest = new THREE.Group(); chest.position.set(0, .76, 0); chest.rotation.y = Math.atan2(P[tiles].x, P[tiles].z); scene.add(chest);
  chest.add(at(box(1.1, .6, .75, '#C98D55', .06), 0, .3, 0), at(box(1.14, .1, .79, '#F2C94C', .02), 0, .45, 0));
  const lid = new THREE.Group(); lid.position.set(0, .6, -.375); chest.add(lid);
  lid.add(at(box(1.1, .28, .75, '#B97A45', .08), 0, .14, .375), at(box(.16, .2, .06, '#F2C94C', .02), 0, 0, .76));
  const chestGlow = at(glow('#FFE27A', 1), 0, .7, 0); chestGlow.scale.set(.01, .01, 1); chest.add(chestGlow);
  chest.traverse(m => { if(m.isMesh) m.castShadow = true; });

  /* ตัวละคร */
  const avatar = new THREE.Group(); scene.add(avatar);
  const shadow = rot(new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({ color:'#3A3350', transparent:true, opacity:.18, depthWrite:false })), -Math.PI/2); shadow.position.y = .66; avatar.add(shadow);
  let kid;
  try{
    const tex = await new THREE.TextureLoader().loadAsync('../img/kid.webp'); tex.colorSpace = THREE.SRGBColorSpace;
    kid = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true })); const h = 2.0; kid.scale.set(h*tex.image.width/tex.image.height, h, 1);
  }catch(e){ kid = sprite('🧒', { size:1.6 }); }
  kid.center.set(.5, 0); kid.position.y = .66; avatar.add(kid);
  const baseScale = kid.scale.clone();

  /* อนุภาค */
  let fx = [];
  function coins(p){
    for(let i=0;i<7;i++){ const c = at(rot(cyl(.12, .12, .03, mat('#FFD43B', { metalness:.5, roughness:.3, emissive:'#8A6100', emissiveIntensity:.2 }), 16), Math.PI/2), p.x, 1, p.z); scene.add(c);
      const a = i/7*Math.PI*2; fx.push({ m:c, vx:Math.cos(a)*1.3, vz:Math.sin(a)*1.3, vy:3.2+Math.random(), life:1.2 }); }
  }
  function confetti(p, n=60){
    const cols = ['#FF6B6B','#FFD43B','#4DABF7','#69DB7C','#C9A8FF','#FF9EC4'];
    for(let i=0;i<n;i++){ const c = at(new THREE.Mesh(new THREE.PlaneGeometry(.12, .07), new THREE.MeshBasicMaterial({ color:cols[i%6], side:THREE.DoubleSide })), p.x, p.y+1.5, p.z); scene.add(c);
      const a = Math.random()*Math.PI*2, s = 1+Math.random()*2.5; fx.push({ m:c, vx:Math.cos(a)*s, vz:Math.sin(a)*s, vy:3+Math.random()*3, life:2.4, spin:true }); }
  }
  let hopping = false;
  S.onFrame((dt, t) => {
    foam.scale.setScalar(1 + Math.sin(t*1.2)*.008); foam.material.opacity = .55 + Math.sin(t*1.2)*.15;
    icons.forEach((s, i) => { if(s) s.position.y = 1.55 + Math.sin(t*2 + i)*.08; });
    if(!hopping){ const k = Math.sin(t*3); kid.scale.set(baseScale.x*(1 - k*.02), baseScale.y*(1 + k*.02), 1); }
    fx = fx.filter(p => { p.life -= dt; p.vy -= 9*dt; p.m.position.x += p.vx*dt; p.m.position.y += p.vy*dt; p.m.position.z += p.vz*dt; if(p.spin){ p.m.rotation.x += dt*8; p.m.rotation.y += dt*6; p.vx *= .98; p.vz *= .98; p.vy = Math.max(p.vy, -1.2); } else p.m.rotation.z += dt*10;
      if(p.life <= 0 || p.m.position.y < .3){ scene.remove(p.m); return false; } return true; });
  });

  let at_ = 0;
  function follow(p, ms=650){ const c = p.clone().add(OFF); S.setView(c.toArray(), [p.x, .6, p.z], ms); }
  let jumpState = null;
  /* ทำ jump ให้ขยับจริงทีละเฟรม */
  S.onFrame(() => { if(jumpState){ const j = jumpState, k = Math.min(1, (performance.now()-j.t0)/j.ms), e = ease.inOut(k);
    avatar.position.lerpVectors(j.from, j.to, e); avatar.position.y = j.from.y + (j.to.y-j.from.y)*e + Math.sin(Math.PI*k)*j.h;
    kid.scale.set(baseScale.x*(1 - Math.sin(Math.PI*k)*.08), baseScale.y*(1 + Math.sin(Math.PI*k)*.1), 1);
    if(k >= 1){ jumpState = null; kid.scale.copy(baseScale); j.done(); } } });
  const hopTo = (to, h=1.1, ms=620) => new Promise(done => { hopping = true; sfx('pop'); jumpState = { from:avatar.position.clone(), to:to.clone(), h, ms, t0:performance.now(), done:() => { hopping = false; done(); } }; });

  return {
    resetView:() => S.resetView(),
    pause:() => S.pause(), resume:() => S.resume(),
    reset(iconList){
      icons.forEach(s => s && scene.remove(s)); marks.forEach(s => s && scene.remove(s)); icons = []; marks = [];
      tileMeshes.forEach((m, i) => { if(i){ m.material.color.set(TILE0); m.scale.set(1, 1, 1); } });
      iconList.forEach((e, i) => { const s = at(sprite(e, { size:.7, bg:'#FFFFFF' }), P[i+1].x, 1.55, P[i+1].z); scene.add(s); icons[i+1] = s; });
      lid.rotation.x = 0; chestGlow.scale.set(.01, .01, 1); prizes.forEach(x => chest.remove(x)); prizes = [];
      at_ = 0; avatar.position.set(P[0].x, 0, P[0].z); follow(P[0], 10);
    },
    mark(i, ok){
      const k = i+1, m = tileMeshes[k];
      tween(m.material.color, ok ? { r:1, g:.86, b:.42 } : { r:1, g:.8, b:.72 }, 400);
      tween(m.scale, { x:1.15, z:1.15 }, 200).then(() => tween(m.scale, { x:1, z:1 }, 250));
      if(icons[k]){ scene.remove(icons[k]); icons[k] = null; }
      const s = at(sprite(ok ? '⭐' : '🌱', { size:.55 }), P[k].x, 1.1, P[k].z); scene.add(s); marks.push(s);
      if(ok){ coins(P[k]); sfx('ok'); }
    },
    async hop(n){
      if(n > tiles || n===at_) return;
      at_ = n; const p = P[n];
      follow(p, 700);
      await hopTo(new THREE.Vector3(p.x, 0, p.z));
    },
    async treasure(stars){
      const side = new THREE.Vector3(OFF.z, 0, -OFF.x).normalize().multiplyScalar(1.15);
      follow(new THREE.Vector3(0, .6, 0), 800);
      await hopTo(new THREE.Vector3(side.x, .12, side.z), 1.2, 700);
      await wait(300);
      sfx('win'); await tween(lid.rotation, { x:-1.9 }, 700, ease.back);
      tween(chestGlow.scale, { x:3.5, y:3.5 }, 600, ease.back);
      confetti(new THREE.Vector3(0, .8, 0), 70);
      for(let i=0;i<Math.max(1, stars);i++){ const s = at(sprite('⭐', { size:.8 }), (i-(Math.max(1,stars)-1)/2)*.8, 1.2, 0); chest.add(s); prizes.push(s); tween(s.position, { y:2.3 }, 900, ease.back); await wait(250); }
      await wait(500);
    },
  };
}
