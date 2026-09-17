/* ============================================================
   คลังโมเดล 3 มิติของเกมล่าขุมทรัพย์
   ทุกโมเดลคืน { g, top, reveal, open(), close(), drop }
     g       = กลุ่มวัตถุ (วางบนพื้นที่ y = 0)
     top     = ความสูง (ใช้วางป้ายชื่อ)
     reveal  = จุดที่ของซ่อนโผล่ออกมา (พิกัดในโมเดล)
     open    = แอนิเมชันตอนแตะ (เปิดฝา/ดึงลิ้นชัก/ยก/เขย่า) · close = กลับที่เดิม
     drop    = true ถ้าของหล่นลงพื้นหลังเขย่า (ต้นไม้ พุ่มไม้ กองฟาง)
   โมเดลที่ไม่มี open ใช้เป็นของตกแต่ง
   เพิ่มโมเดลใหม่: เขียนฟังก์ชันใน MODELS แล้วใช้ชื่อนั้นในไฟล์ treasure-levels.js
   ============================================================ */
import { THREE, mat, box, cyl, sph, at, rot, tween, ease, wait } from '../stem/stem3d.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const G = (...k) => { const g = new THREE.Group(); k.forEach(x => x && g.add(x)); return g; };
const METAL = c => mat(c, { metalness:.6, roughness:.35 });
const cone = (r, h, c, seg=20) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), c.isMaterial ? c : mat(c)); m.castShadow = true; return m; };
const torus = (R, r, c, arc=Math.PI*2) => { const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, 28, arc), c.isMaterial ? c : mat(c)); m.castShadow = true; return m; };

/* ---------- แอนิเมชันมาตรฐาน ---------- */
function liftable(parts, top, { reveal=V(0, .15, 0), up=.9, side=.6 }={}){
  const mov = G(...parts), g = G(mov);
  return { g, top, reveal,
    open:() => Promise.all([tween(mov.position, { y:up, x:side }, 420, ease.back), tween(mov.rotation, { z:-.55 }, 420)]),
    close:() => Promise.all([tween(mov.position, { y:0, x:0 }, 380, ease.inOut), tween(mov.rotation, { z:0 }, 380)]) };
}
function shaker(g, top, reveal){
  return { g, top, reveal, drop:true,
    open:async () => { for(let i=0;i<4;i++){ await tween(g.rotation, { z:.09 }, 70); await tween(g.rotation, { z:-.09 }, 70); } await tween(g.rotation, { z:0 }, 80); },
    close:async () => {} };
}

/* ---------- ภาชนะมีฝา ---------- */
function lidBox(p, extra=[]){
  const { w=1.2, h=.8, d=.8, c='#C98D55', c2=p.c||'#C98D55' } = p;
  const lid = G(at(box(w+.06, .14, d+.06, c2, .05), 0, .07, d/2+.03));
  if(p.bow) lid.add(at(box(.18, .16, d+.08, p.bow, .03), 0, .1, d/2+.03), at(box(w+.08, .16, .18, p.bow, .03), 0, .1, d/2+.03), at(sph(.14, p.bow), 0, .24, d/2+.03));
  lid.position.set(0, h, -d/2);
  const g = G(at(box(w, h, d, c, .06), 0, h/2, 0), lid, ...extra);
  if(p.trim) g.add(at(box(w+.02, .08, d+.02, p.trim, .02), 0, h*.55, 0));
  return { g, top:h+.35, reveal:V(0, h*.7, 0), open:() => tween(lid.rotation, { x:-1.9 }, 450, ease.back), close:() => tween(lid.rotation, { x:0 }, 350) };
}
function lidCyl(p){
  const { r=.45, h=.8, c='#9AA5B1', c2=p.c||'#9AA5B1' } = p;
  const lid = G(at(cyl(r+.03, r+.03, .1, c2, 28), 0, .05, 0), at(sph(.08, p.knob||c2), 0, .14, 0));
  lid.position.y = h;
  const g = G(at(cyl(r, r*.92, h, c, 28), 0, h/2, 0), lid);
  if(p.bands) [.25, .75].forEach(k => g.add(at(cyl(r+.015, r+.015, .06, p.bands, 28), 0, h*k, 0)));
  if(p.handles) [-1, 1].forEach(s => g.add(at(rot(torus(.1, .025, p.handles), 0, Math.PI/2), s*(r+.05), h*.8, 0)));
  return { g, top:h+.35, reveal:V(0, h*.75, 0), open:() => Promise.all([tween(lid.position, { y:h+.7, x:.35 }, 420, ease.back), tween(lid.rotation, { z:-.6 }, 420)]), close:() => Promise.all([tween(lid.position, { y:h, x:0 }, 350), tween(lid.rotation, { z:0 }, 350)]) };
}
/* ---------- ตู้มีประตู ---------- */
function cabinet(p){
  const { w=1.2, h=1.6, d=.8, c='#FFE0B5', c2=p.c||'#FFE0B5' } = p;
  const door = G(at(box(w-.06, h-.1, .08, c2, .04), (w-.06)/2, 0, 0), at(box(.06, .3, .06, p.handle||'#8C849E', .02), w-.22, 0, .07));
  door.position.set(-(w-.06)/2, h/2, d/2+.02);
  const g = G(at(box(w, h, d, c, .05), 0, h/2, 0), door);
  if(p.split) g.add(at(box(w+.01, .04, d+.01, p.split, .01), 0, h*.62, 0));
  return { g, top:h+.3, reveal:V(0, h*.35, d*.25), open:() => tween(door.rotation, { y:-1.9 }, 450, ease.back), close:() => tween(door.rotation, { y:0 }, 350) };
}
function drawers(p){
  const { w=1.2, h=.9, d=.7, c='#FFE0B5', c2='#FFF3E0', n=2 } = p;
  const g = G(at(box(w, h, d, c, .05), 0, h/2, 0));
  const dh = (h-.1)/n; let top = null;
  for(let i=0;i<n;i++){
    const dr = G(at(box(w-.12, dh-.06, .06, c2, .02), 0, 0, 0), at(sph(.05, p.knob||'#B98556'), 0, 0, .06));
    dr.position.set(0, h-.05-dh/2-i*dh, d/2+.01); g.add(dr); if(i===0) top = dr;
  }
  const inner = at(box(w-.16, dh-.1, d*.8, c2, .02), 0, 0, -d*.4); top.add(inner);
  return { g, top:h+.3, reveal:V(0, h-.05, d*.55), open:() => tween(top.position, { z:d/2+d*.65 }, 380, ease.back), close:() => tween(top.position, { z:d/2+.01 }, 320) };
}
function rug(p){
  const { w=2.4, d=1.6, c='#FFB3C1', c2='#FFFFFF' } = p;
  const flap = G(at(box(w, .04, d, c, .02), 0, .02, d/2));
  for(let i=1;i<4;i++) flap.add(at(box(w*.9, .045, .08, c2, .01), 0, .025, i*d/4));
  flap.position.set(0, 0, -d/2);
  return { g:G(flap), top:.5, reveal:V(0, .12, .1), open:() => tween(flap.rotation, { x:-1.05 }, 420, ease.back), close:() => tween(flap.rotation, { x:0 }, 350) };
}

/* ============================================================
   โมเดลทั้งหมด (ชื่อที่ใช้ใน treasure-levels.js: m:'...')
   ============================================================ */
export const MODELS = {
  /* ภาชนะ ตู้ ลิ้นชัก พรม (ใช้ได้หลายฉาก เปลี่ยนสี/ขนาดด้วย c, c2, w, h, d, r) */
  box:p => lidBox(p),
  jar:p => lidCyl(p),
  cabinet:p => cabinet(p),
  drawers:p => drawers(p),
  rug:p => rug(p),
  oven:p => { const { w=1.2, h=1.1, d=.9, c='#F4F0FA' } = p; const door = G(at(box(w-.14, h*.55, .08, '#C9D6E3', .04), 0, h*.275, 0), at(box(w*.6, .06, .06, '#8C849E', .02), 0, h*.5, .07));
    door.position.set(0, .12, d/2+.02); const g = G(at(box(w, h, d, c, .05), 0, h/2, 0), door); [-.3, 0, .3].forEach(x => g.add(at(rot(cyl(.06, .06, .05, '#8C849E', 12), Math.PI/2), x, h*.85, d/2+.03)));
    [-.25, .25].forEach(x => g.add(at(cyl(.2, .2, .02, '#5E5873', 20), x, h+.01, -.1)));
    return { g, top:h+.35, reveal:V(0, .35, .1), open:() => tween(door.rotation, { x:1.35 }, 420, ease.back), close:() => tween(door.rotation, { x:0 }, 350) }; },
  mailbox:p => { const c = p.c||'#FF8A7A'; const door = G(at(box(.5, .4, .05, c, .03), 0, .2, 0)); door.position.set(0, 1.05, .33);
    const g = G(at(cyl(.05, .05, 1.05, '#9C6B45', 8), 0, .52, 0), at(box(.56, .46, .66, c, .08), 0, 1.28, 0), door, at(box(.04, .25, .12, '#FFD43B', .01), .3, 1.5, 0));
    return { g, top:1.8, reveal:V(0, 1.2, .1), open:() => tween(door.rotation, { x:1.4 }, 380, ease.back), close:() => tween(door.rotation, { x:0 }, 300) }; },
  schooldesk:p => { const r = lidBox({ w:1.1, h:.25, d:.75, c:p.c||'#91D5FF', c2:p.c2||'#FFFFFF' }); r.g.children.forEach(m => m.position.y += .5); [[-.45,-.3],[.45,-.3],[-.45,.3],[.45,.3]].forEach(([x,z]) => r.g.add(at(cyl(.04, .04, .5, '#8C849E', 8), x, .25, z))); r.top = 1.1; r.reveal = V(0, .7, 0); return r; },
  doghouse:p => { const c = p.c||'#FFC078'; const roof = G(at(rot(box(1.1, .08, 1.3, '#E07A5F', .03), 0, 0, .7), -.33, .35, 0), at(rot(box(1.1, .08, 1.3, '#E07A5F', .03), 0, 0, -.7), .33, .35, 0)); roof.position.y = .85;
    const g = G(at(box(1.2, .9, 1.2, c, .05), 0, .45, 0), roof, at(box(.5, .55, .05, '#6B4F3A', .1), 0, .3, .61), at(box(.2, .08, .15, '#FF6B6B', .02), 0, .02, .9));
    return { g, top:1.7, reveal:V(0, .5, 0), open:() => Promise.all([tween(roof.position, { y:1.8, x:.5 }, 420, ease.back), tween(roof.rotation, { z:-.5 }, 420)]), close:() => Promise.all([tween(roof.position, { y:.85, x:0 }, 350), tween(roof.rotation, { z:0 }, 350)]) }; },
  tent:p => { const c = p.c||'#FFB38A'; const body = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.6, 4), mat(c)); body.rotation.y = Math.PI/4; body.position.y = .8; body.castShadow = true;
    const flap = G(at(rot(box(.9, 1.15, .05, '#FFE8CC', .02), -.35, 0, 0), .45, .55, .3)); flap.position.set(-.45, 0, .62);
    const g = G(body, flap, at(cyl(.03, .03, .4, '#8C849E'), 0, 1.75, 0), at(box(.3, .18, .02, '#FF6B6B', .01), .15, 1.85, 0));
    return { g, top:2.1, reveal:V(0, .25, .35), open:() => tween(flap.rotation, { y:-1.6 }, 420, ease.back), close:() => tween(flap.rotation, { y:0 }, 350) }; },
  dollhouse:p => { const c = p.c||'#FFD6E7'; const door = G(at(box(1.1, 1.0, .06, '#FFFFFF', .04), .55, 0, 0), at(box(.3, .45, .07, c, .05), .55, -.1, .02), at(sph(.05, '#FFD43B'), .95, 0, .06)); door.position.set(-.55, .6, .5);
    const g = G(at(box(1.2, 1.1, 1, c, .05), 0, .55, 0), door, at(rot(new THREE.Mesh(new THREE.ConeGeometry(.95, .7, 4), mat('#C9A8FF')), 0, Math.PI/4, 0), 0, 1.45, 0));
    g.traverse(m => { if(m.isMesh) m.castShadow = true; });
    return { g, top:2.0, reveal:V(0, .45, .2), open:() => tween(door.rotation, { y:-1.8 }, 420, ease.back), close:() => tween(door.rotation, { y:0 }, 350) }; },

  /* ต้นไม้ พุ่มไม้ (เขย่าแล้วของหล่น) */
  tree:p => { const g = G(at(cyl(.2, .28, 1.6, '#9C6B45', 10), 0, .8, 0), at(sph(1.0, p.c||'#7FCB8A'), 0, 2.1, 0), at(sph(.7, p.c||'#8ED99A'), .6, 1.8, .3), at(sph(.65, p.c||'#72C07E'), -.55, 1.9, -.2));
    return shaker(g, 3.3, V(0, 2.0, .6)); },
  pine:p => { const g = G(at(cyl(.15, .2, .8, '#9C6B45', 8), 0, .4, 0), at(cone(1.0, 1.4, p.c||'#5FA873'), 0, 1.3, 0), at(cone(.8, 1.2, p.c||'#6BB57F'), 0, 2.0, 0), at(cone(.55, 1.0, p.c||'#78C08B'), 0, 2.6, 0));
    return shaker(g, 3.3, V(0, 1.8, .6)); },
  palm:p => { const g = G(); for(let i=0;i<6;i++) g.add(at(rot(cyl(.13-i*.01, .15-i*.01, .5, '#B98556', 10), 0, 0, .05*i), .03*i*i, .25+i*.46, 0));
    for(let i=0;i<6;i++){ const L = G(at(box(1.4, .05, .36, '#5FBF6E', .02), .66, 0, 0)); L.rotation.set(0, i*Math.PI/3, -.45); L.position.set(.75, 2.9, 0); g.add(L); }
    g.add(at(sph(.14, '#8B5A2B'), .8, 2.72, .12), at(sph(.14, '#8B5A2B'), .65, 2.72, -.12));
    return shaker(g, 3.4, V(.7, 2.6, .5)); },
  bush:p => { const g = G(at(sph(.6, p.c||'#7FCB8A'), 0, .45, 0), at(sph(.45, p.c||'#8ED99A'), .45, .4, .15), at(sph(.42, p.c||'#72C07E'), -.45, .38, -.1)); if(p.flowers) [[.2,.9,.3],[-.3,.75,.4],[.55,.7,.4]].forEach(([x,y,z]) => g.add(at(sph(.08, p.flowers), x, y, z)));
    return shaker(g, 1.4, V(0, .7, .5)); },
  hay:p => { const g = G(at(new THREE.Mesh(new THREE.SphereGeometry(.9, 18, 10, 0, Math.PI*2, 0, Math.PI/2), mat('#F2D16B')), 0, 0, 0)); g.children[0].scale.set(1.2, 1, 1); g.children[0].castShadow = true;
    for(let i=0;i<10;i++) g.add(at(rot(box(.5, .02, .03, '#E0B84A', .005), 0, i, .4), Math.cos(i)*.7, .5+Math.sin(i*3)*.2, Math.sin(i)*.5));
    return shaker(g, 1.3, V(0, .8, .6)); },
  scarecrow:p => { const g = G(at(cyl(.05, .05, 2, '#9C6B45', 8), 0, 1, 0), at(rot(cyl(.04, .04, 1.4, '#9C6B45', 8), 0, 0, Math.PI/2), 0, 1.4, 0), at(box(.7, .7, .3, p.c||'#74C0FC', .08), 0, 1.25, 0),
    at(sph(.22, '#F2D16B'), 0, 1.85, 0), at(cyl(.35, .35, .04, '#C98D55', 16), 0, 2.02, 0), at(cyl(.18, .2, .22, '#C98D55', 16), 0, 2.13, 0));
    return shaker(g, 2.5, V(0, 1.4, .5)); },

  /* ของที่ยกขึ้นได้ */
  pillow:p => liftable([at(box(p.w||.9, .22, .55, p.c||'#FFFFFF', .1), 0, .11, 0)], .6),
  cushion:p => liftable([at(rot(box(.6, .6, .18, p.c||'#FF9EC4', .08), -.3, 0, 0), 0, .3, 0)], .8),
  lamp:p => liftable([at(cyl(.2, .25, .06, '#8C849E', 16), 0, .03, 0), at(cyl(.03, .03, p.tall ? 1.6 : .45, '#8C849E', 8), 0, p.tall ? .8 : .25, 0), at(cone(.35, .4, p.c||'#FFE08A'), 0, p.tall ? 1.7 : .6, 0)], p.tall ? 2.2 : 1.0),
  teddy:p => { const c = p.c||'#C98D55'; return liftable([at(sph(.32, c), 0, .32, 0), at(sph(.24, c), 0, .78, 0), at(sph(.09, c), -.18, .98, 0), at(sph(.09, c), .18, .98, 0), at(sph(.1, '#FFE0B5'), 0, .74, .2), at(sph(.12, c), -.3, .5, .1), at(sph(.12, c), .3, .5, .1), at(sph(.03, '#3A3350'), -.08, .84, .21), at(sph(.03, '#3A3350'), .08, .84, .21)], 1.3); },
  plant:p => liftable([at(cyl(.28, .2, .45, p.pot||'#E07A5F', 16), 0, .22, 0), at(sph(.42, p.c||'#7FCB8A'), 0, .75, 0), at(sph(.28, p.c||'#8ED99A'), .25, .95, .1)], 1.4),
  flowerpot:p => liftable([at(cyl(.26, .19, .38, p.pot||'#E07A5F', 16), 0, .19, 0), at(cyl(.02, .02, .4, '#5FBF6E', 6), 0, .55, 0), at(sph(.13, p.c||'#FF6B6B'), 0, .78, 0), at(sph(.06, '#FFD43B'), 0, .78, .1)], 1.1),
  book:p => liftable([at(box(p.w||.3, p.h||.75, .55, p.c||'#FF8A8A', .03), 0, (p.h||.75)/2, 0), at(box((p.w||.3)+.01, .04, .56, '#FFFFFF', .01), 0, (p.h||.75)*.8, 0)], (p.h||.75)+.3),
  duck:p => liftable([at(sph(.26, '#FFD43B'), 0, .22, 0), at(sph(.17, '#FFD43B'), .18, .5, 0), at(cone(.07, .15, '#FF922B'), .36, .48, 0), at(sph(.03, '#3A3350'), .25, .56, .1)].map((m,i) => { if(i===2) m.rotation.z = -Math.PI/2; return m; }), .9),
  bucket:p => liftable([at(cyl(.3, .22, .45, p.c||'#4DABF7', 18), 0, .22, 0), at(rot(torus(.28, .02, '#8C849E', Math.PI), 0, 0, 0), 0, .45, 0)], .9),
  cup:p => liftable([at(cyl(.12, .1, .26, p.c||'#91D5FF', 14), 0, .13, 0), at(cyl(.015, .015, .3, '#FF8A8A', 6), .03, .32, 0)], .7),
  bottle:p => liftable([at(cyl(.12, .12, .4, p.c||'#C9A8FF', 14), 0, .2, 0), at(cyl(.05, .07, .1, '#FFFFFF', 12), 0, .45, 0)], .8),
  towel:p => liftable([at(box(.7, .18, .5, p.c||'#8CE99A', .06), 0, .09, 0), at(box(.7, .04, .51, '#FFFFFF', .01), 0, .12, 0)], .6),
  watering:p => liftable([at(cyl(.25, .25, .45, p.c||'#74C0FC', 16), 0, .22, 0), at(rot(cyl(.04, .05, .55, p.c||'#74C0FC', 8), 0, 0, -1), .4, .4, 0), at(rot(torus(.18, .03, p.c||'#74C0FC', Math.PI), 0, Math.PI/2, 0), -.1, .45, 0)], .9),
  rock:p => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r||.45, 0), mat(p.c||'#B8B2A7', { flatShading:true })); m.scale.y = .65; m.position.y = (p.r||.45)*.5; m.castShadow = true; return liftable([m], .9); },
  wheelbarrow:p => liftable([at(box(1.0, .35, .7, p.c||'#FF8A7A', .06), 0, .5, 0), at(rot(cyl(.2, .2, .1, '#3A3350', 16), Math.PI/2), .55, .2, 0), at(rot(cyl(.03, .03, .9, '#8C849E', 6), 0, 0, Math.PI/2+.25), -.8, .45, .25), at(rot(cyl(.03, .03, .9, '#8C849E', 6), 0, 0, Math.PI/2+.25), -.8, .45, -.25)], 1.0),
  sandcastle:p => liftable([at(cyl(.5, .6, .45, '#F2D39B', 18), 0, .22, 0), at(cyl(.3, .35, .4, '#EBC98A', 16), 0, .65, 0), ...[-1, 1].map(s => at(cone(.14, .35, '#EBC98A'), s*.42, .6, 0)), at(cone(.16, .35, '#EBC98A'), 0, 1.02, 0), at(box(.02, .2, .12, '#FF6B6B', .005), 0, 1.3, .05)], 1.5),
  shell:p => { const m = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 10, 0, Math.PI*2, 0, Math.PI/2), mat(p.c||'#FFC9D6')); m.scale.set(1, .6, 1.2); m.castShadow = true; const g = [m]; for(let i=-2;i<=2;i++) g.push(at(rot(box(.03, .02, .7, '#FFA8BC', .005), 0, i*.3, 0), 0, .2, 0)); return liftable(g, .6); },
  umbrella:p => liftable([at(cyl(.03, .03, 1.8, '#FFFFFF', 8), 0, .9, 0), at(new THREE.Mesh(new THREE.ConeGeometry(1.2, .5, 8), mat(p.c||'#FF8A8A', { side:THREE.DoubleSide })), 0, 1.9, 0)], 2.4, { up:1.1, side:.8 }),
  ball:p => { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); (p.cols||['#FF6B6B','#FFFFFF','#4DABF7','#FFFFFF','#FFD43B','#FFFFFF']).forEach((col,i,a) => { x.fillStyle = col; x.fillRect(i*128/a.length, 0, 128/a.length+1, 32); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = sph(p.r||.4, new THREE.MeshStandardMaterial({ map:t, roughness:.5 })); m.position.y = p.r||.4; return liftable([m], (p.r||.4)*2+.3); },
  pumpkin:p => { const g = []; for(let i=0;i<6;i++){ const s = sph(.3, p.c||'#FF922B'); s.scale.set(.6, .8, 1); s.rotation.y = i*Math.PI/6; s.position.y = .3; g.push(s); } g.push(at(cyl(.04, .05, .18, '#5FBF6E', 6), 0, .62, 0)); return liftable(g, 1.0); },
  nest:p => liftable([at(torus(.35, .15, '#C98D55'), 0, .15, 0), at(sph(.12, '#FFF1D6'), -.08, .18, 0), at(sph(.12, '#FFF1D6'), .12, .18, .08), at(cyl(.3, .3, .06, '#B98556', 16), 0, .05, 0)].map((m,i) => { if(i===0) m.rotation.x = Math.PI/2; return m; }), .7),
  rope:p => liftable([0, 1, 2].map(i => { const m = torus(.45-i*.1, .06, '#E0C28A'); m.rotation.x = Math.PI/2; m.position.y = .06+i*.1; return m; }), .6),
  cannon:p => liftable([at(rot(cyl(.18, .24, 1.2, '#4A4A5A', 16), 0, 0, Math.PI/2-.25), 0, .55, 0), at(rot(cyl(.28, .28, .1, '#9C6B45', 16), Math.PI/2), -.25, .28, .25), at(rot(cyl(.28, .28, .1, '#9C6B45', 16), Math.PI/2), -.25, .28, -.25)], 1.1),
  anchor:p => liftable([at(cyl(.05, .05, 1.0, '#6C7686', 8), 0, .6, 0), at(rot(torus(.4, .05, METAL('#6C7686'), Math.PI), 0, 0, Math.PI), 0, .45, 0), at(rot(torus(.1, .04, METAL('#6C7686')), 0, 0, 0), 0, 1.15, 0), at(rot(cyl(.04, .04, .6, '#6C7686', 8), 0, 0, Math.PI/2), 0, .95, 0)], 1.4),
  beanbag:p => { const m = sph(.6, p.c||'#FFB38A'); m.scale.set(1, .6, 1); m.position.y = .36; return liftable([m], .9); },
  globe:p => liftable([at(cyl(.2, .25, .06, '#B98556', 16), 0, .03, 0), at(cyl(.03, .03, .35, '#B98556', 8), 0, .2, 0), at(sph(.3, '#74C0FC'), 0, .6, 0), at(sph(.12, '#8CE99A'), .15, .68, .2), at(sph(.1, '#8CE99A'), -.2, .5, .15)], 1.1),
  backpack:p => liftable([at(box(.6, .75, .35, p.c||'#FF8A8A', .12), 0, .38, 0), at(box(.45, .3, .1, p.c2||'#FFD43B', .05), 0, .28, .2), at(rot(torus(.14, .03, p.c||'#FF8A8A', Math.PI), 0, 0, 0), 0, .75, 0)], 1.1),
  blocks:p => { const cols = ['#FF8A8A','#FFD43B','#74C0FC','#8CE99A','#C9A8FF']; return liftable(cols.map((c,i) => at(rot(box(.45, .3, .45, c, .04), 0, i*.3, 0), (i%2)*.06, .15+i*.3, 0)), 1.8); },
  train:p => liftable([at(box(.7, .4, .45, p.c||'#FF6B6B', .06), 0, .35, 0), at(box(.35, .35, .45, '#74C0FC', .05), -.2, .72, 0), at(cyl(.08, .1, .25, '#3A3350', 10), .22, .65, 0), ...[[-.22,.24],[.22,.24],[-.22,-.24],[.22,-.24]].map(([x,z]) => at(rot(cyl(.12, .12, .06, '#3A3350', 14), Math.PI/2), x, .12, z))], 1.1),
  horse:p => liftable([at(box(.9, .4, .35, p.c||'#FFE0B5', .12), 0, .75, 0), at(rot(box(.25, .55, .28, p.c||'#FFE0B5', .08), 0, 0, -.4), .5, 1.1, 0), at(box(.1, .35, .3, '#C98D55', .03), .55, 1.2, 0), ...[-1, 1].map(s => at(rot(torus(.7, .05, '#E07A5F', Math.PI*.6), 0, Math.PI/2, Math.PI*1.2), 0, .72, s*.18)), ...[[-.3,.12],[.3,.12],[-.3,-.12],[.3,-.12]].map(([x,z]) => at(cyl(.04, .04, .45, '#C98D55', 6), x, .45, z))], 1.6),
  drum:p => lidCyl({ r:.45, h:.55, c:p.c||'#FF8A8A', c2:'#FFFFFF', bands:'#FFD43B' }),
  mushroom:p => liftable([at(cyl(.12, .15, .4, '#FFF1D6', 12), 0, .2, 0), at(new THREE.Mesh(new THREE.SphereGeometry(.35, 18, 10, 0, Math.PI*2, 0, Math.PI/2), mat(p.c||'#FF6B6B')), 0, .38, 0), at(sph(.05, '#FFFFFF'), .12, .6, .15), at(sph(.05, '#FFFFFF'), -.15, .55, .12), at(sph(.04, '#FFFFFF'), 0, .68, -.1)], .9),
  lantern:p => liftable([at(cyl(.2, .22, .08, '#6C7686', 14), 0, .04, 0), at(cyl(.16, .16, .4, mat('#FFE08A', { emissive:'#FFB300', emissiveIntensity:.5, transparent:true, opacity:.85 }), 14), 0, .28, 0), at(cone(.24, .18, '#6C7686'), 0, .57, 0), at(rot(torus(.1, .02, '#6C7686', Math.PI), 0, 0, 0), 0, .66, 0)], .9),
  log:p => liftable([at(rot(cyl(.28, .28, 1.3, '#B07A4A', 16), 0, 0, Math.PI/2), 0, .28, 0), at(rot(cyl(.25, .25, .02, '#E3B98A', 16), 0, 0, Math.PI/2), .66, .28, 0), at(rot(cyl(.25, .25, .02, '#E3B98A', 16), 0, 0, Math.PI/2), -.66, .28, 0)], .8),
  basket:p => liftable([at(cyl(.4, .3, .35, p.c||'#D9A066', 16), 0, .18, 0), at(sph(.13, '#FF8A8A'), -.12, .4, 0), at(sph(.12, '#FFD43B'), .14, .42, .08), at(rot(torus(.36, .025, p.c||'#D9A066', Math.PI), 0, Math.PI/2, 0), 0, .36, 0)], .9),
  clock:p => liftable([at(rot(cyl(.35, .35, .1, p.c||'#FFFFFF', 24), Math.PI/2), 0, .38, 0), at(rot(torus(.35, .04, '#FF8A8A'), 0, 0, 0), 0, .38, .02), at(box(.03, .22, .02, '#3A3350', .005), 0, .46, .07), at(box(.16, .03, .02, '#3A3350', .005), .07, .38, .07), at(box(.4, .06, .2, '#C98D55', .02), 0, .03, 0)], .9),
  giftbox:p => lidBox({ w:.8, h:.6, d:.8, c:p.c||'#C9A8FF', c2:p.c||'#C9A8FF', bow:p.bow||'#FFD43B' }),

  /* ของตกแต่ง (แตะไม่ได้) */
  bed:p => ({ g:G(at(box(2.2, .4, 3.2, '#C98D55', .06), 0, .2, 0), at(box(2.1, .25, 3.0, '#FFFFFF', .08), 0, .52, 0), at(box(2.12, .1, 1.9, p.c||'#9FD8F5', .04), 0, .67, .55), at(box(2.2, 1.1, .15, '#B97A45', .06), 0, .55, -1.55)), top:1 }),
  sofa:p => { const c = p.c||'#8EC5FF'; return { g:G(at(box(2.8, .45, 1.1, c, .12), 0, .35, 0), at(box(2.8, .8, .3, c, .12), 0, .75, -.45), at(box(.3, .6, 1.1, c, .12), -1.4, .55, 0), at(box(.3, .6, 1.1, c, .12), 1.4, .55, 0)), top:1.2 }; },
  table:p => { const { w=1.8, d=1.1, h=.75, c='#D9A066' } = p; const g = G(at(box(w, .1, d, c, .03), 0, h, 0)); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b]) => g.add(at(cyl(.05, .05, h, c, 8), a*(w/2-.12), h/2, b*(d/2-.12)))); return { g, top:h }; },
  chair:p => { const c = p.c||'#FFC078', g = G(at(box(.6, .08, .6, c, .02), 0, .45, 0), at(box(.6, .6, .06, c, .02), 0, .75, -.27)); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b]) => g.add(at(cyl(.03, .03, .45, c, 6), a*.25, .22, b*.25))); return { g, top:1.1 }; },
  tub:p => ({ g:G(at(box(2.4, .6, 1.2, '#FFFFFF', .2), 0, .3, 0), at(box(2.1, .1, .9, '#91D5FF', .05), 0, .52, 0)), top:.6 }),
  sink:p => ({ g:G(at(box(1.0, .12, .7, '#FFFFFF', .05), 0, .06, 0), at(cyl(.03, .03, .35, '#C9D6E3', 8), 0, .25, -.25), at(rot(cyl(.03, .03, .2, '#C9D6E3', 8), Math.PI/2), 0, .4, -.17)), top:.5 }),
  shelf:p => { const { w=2.2, h=2.2, c='#D9A066' } = p, g = G(at(box(w, h, .1, c, .02), 0, h/2, -.25)); [0, .7, 1.4, 2.1].forEach(y => g.add(at(box(w, .06, .5, c, .02), 0, y+.03, 0))); [-1, 1].forEach(s => g.add(at(box(.08, h, .5, c, .02), s*w/2, h/2, 0)));
    const cols = ['#FF8A8A','#74C0FC','#FFD43B','#8CE99A','#C9A8FF','#FFB38A']; for(let r=0;r<3;r++) for(let i=0;i<6;i++){ if(p.gap && r===0 && i>1 && i<5) continue; g.add(at(box(.14, .5+((i*7+r)%3)*.06, .35, cols[(i+r*2)%6], .01), -w/2+.25+i*.3, .06+r*.7+.28, 0)); }
    return { g, top:h }; },
  board:p => ({ g:G(at(box(3, 1.6, .08, '#6E9F7F', .03), 0, 1.8, 0), at(box(3.2, .12, .12, '#C98D55', .02), 0, .98, .02), at(box(.9, .06, .02, '#FFFFFF', .01), -.6, 2.1, .05), at(box(1.2, .06, .02, '#FFFFFF', .01), .3, 1.8, .05)), top:2.6 }),
  tv:p => ({ g:G(at(box(1.6, .95, .08, '#3A3350', .04), 0, .55, 0), at(box(1.45, .8, .02, '#74C0FC', .01), 0, .55, .05), at(box(.4, .08, .3, '#3A3350', .02), 0, .04, 0)), top:1.1 }),
  window:p => ({ g:G(at(box(1.6, 1.2, .06, '#FFFFFF', .03), 0, 0, 0), at(box(1.4, 1.0, .02, '#CFEFFF', .01), 0, 0, .03), at(box(.05, 1.0, .03, '#FFFFFF', .01), 0, 0, .05), at(box(1.4, .05, .03, '#FFFFFF', .01), 0, 0, .05)), top:0 }),
  fence:p => { const n = p.n||8, g = G(); for(let i=0;i<n;i++) g.add(at(box(.18, .9, .08, p.c||'#FFFFFF', .03), i*.5-(n-1)*.25, .45, 0)); [.3, .7].forEach(y => g.add(at(box(n*.5, .08, .06, p.c||'#FFFFFF', .02), 0, y, -.05))); return { g, top:1 }; },
  bench:p => ({ g:G(at(box(1.8, .1, .5, p.c||'#D9A066', .03), 0, .45, 0), at(box(1.8, .4, .08, p.c||'#D9A066', .03), 0, .75, -.22), at(box(.1, .45, .45, '#8C849E', .02), -.75, .22, 0), at(box(.1, .45, .45, '#8C849E', .02), .75, .22, 0)), top:1 }),
  fire:p => { const g = G(); for(let i=0;i<5;i++) g.add(at(rot(cyl(.07, .07, .8, '#9C6B45', 8), 0, i*1.2, Math.PI/2), 0, .1, 0)); g.add(at(cone(.3, .6, mat('#FF922B', { emissive:'#FF6B00', emissiveIntensity:.8 })), 0, .4, 0), at(cone(.18, .45, mat('#FFD43B', { emissive:'#FFB300', emissiveIntensity:.8 })), 0, .4, .02)); for(let i=0;i<7;i++) g.add(at(sph(.14, '#B8B2A7'), Math.cos(i)*.5, .08, Math.sin(i)*.5)); return { g, top:.8 }; },
  mast:p => ({ g:G(at(cyl(.12, .15, 5, '#9C6B45', 12), 0, 2.5, 0), at(box(2.4, 2.2, .05, '#FFF8E7', .02), 0, 3, .2), at(box(.9, .5, .03, '#3A3350', .01), .45, 4.9, 0), at(sph(.12, '#FFFFFF'), .4, 4.9, .03)), top:5 }),
  crate:p => lidBox({ w:p.w||1, h:p.h||.8, d:p.d||.8, c:p.c||'#D9A066', c2:p.c2||'#C98D55', trim:'#B07A4A' }),
  stool:p => ({ g:G(at(cyl(.3, .3, .08, p.c||'#FFC078', 16), 0, .5, 0), at(cyl(.05, .05, .5, '#8C849E', 8), 0, .25, 0), at(cyl(.22, .22, .04, '#8C849E', 16), 0, .02, 0)), top:.55 }),
};

/* ของที่เจอในจุดที่ว่าง (สุ่มให้ขำ ๆ) */
export const EMPTY_FINDS = ['🧦','🐭','🕸️','🍪','🦗','🧩','🪶','🍂','🐞','🫧','🥄','🧸'];
