/* ============================================================
   สร้างโจทย์คณิตศาสตร์ ป.1 เทอม 1 ขึ้นใหม่ทุกครั้ง
   เนื้อหาและรูปแบบการถามยึดตามข้อสอบของโรงเรียน 7 บท
   MATHGEN.chapter(i) -> [ รายการข้อสอบของบทที่ i+1 ]
     รายการ = [โจทย์, [คำตอบถูก, ตัวหลอก, ตัวหลอก], 0, รูป(ถ้ามี)]
              หน้าเว็บจะสลับตำแหน่งตัวเลือกเองอีกชั้น
            หรือ { f: รูปร่วม } = กล่องแผนภูมิ/ตาราง/ตาชั่ง ที่ใช้ตอบหลายข้อ
   ============================================================ */
(function (root) {
'use strict';

/* ---------------- เครื่องมือสุ่ม ---------------- */
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { var i, j, t; for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function sample(a, n) { return shuffle(a.slice()).slice(0, n); }
function coin() { return Math.random() < 0.5; }

var TH = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
function thai(n) { return String(n).split('').map(function (d) { return TH[+d]; }).join(''); }
var WORD = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ',
            'สิบเอ็ด', 'สิบสอง', 'สิบสาม', 'สิบสี่', 'สิบห้า', 'สิบหก', 'สิบเจ็ด', 'สิบแปด', 'สิบเก้า', 'ยี่สิบ'];
var BOX = '<span class="mid"></span>';
var GT = '&gt;', LT = '&lt;', MINUS = '&ndash;';

/* คำตอบถูกอยู่ตำแหน่งแรกเสมอ หน้าเว็บสลับให้เอง */
function Q(text, correct, w1, w2, fig) {
  var o = [correct, w1, w2];
  return fig ? [text, o, 0, fig] : [text, o, 0];
}
/* สร้างตัวหลอกที่เป็นตัวเลข ไม่ซ้ำกับคำตอบ แล้วจัดรูปด้วย fmt */
function numOpts(correct, cands, fmt) {
  fmt = fmt || function (n) { return String(n); };
  var out = [correct], i, v, k = 1;
  cands = shuffle(cands.slice());
  for (i = 0; i < cands.length && out.length < 3; i++) {
    v = cands[i];
    if (v === null || v === undefined || v < 0 || out.indexOf(v) >= 0) continue;
    out.push(v);
  }
  while (out.length < 3) { if (out.indexOf(correct + k) < 0) out.push(correct + k); k++; }
  return out.map(fmt);
}
function unitOf(u) { return function (n) { return n + ' ' + u; }; }
/* เลือกค่าที่ไม่ซ้ำกับที่ห้าม */
function other(lo, hi, bad) {
  var v, guard = 0;
  do { v = ri(lo, hi); guard++; } while (bad.indexOf(v) >= 0 && guard < 200);
  return v;
}
function distinct(n, lo, hi) {
  var s = [], v, guard = 0;
  while (s.length < n && guard++ < 500) { v = ri(lo, hi); if (s.indexOf(v) < 0) s.push(v); }
  return s;
}

/* ---------------- คลังคำ ---------------- */
var NM = ['แก้ว', 'ก้อง', 'ต่าย', 'มิ้น', 'บอล', 'ปอ', 'ฟ้า', 'นิด', 'เบส', 'จูน', 'ตูน', 'แพร', 'บิว',
          'อ้อม', 'กิ๊ก', 'ตั้ม', 'แนน', 'โบว์', 'ดาว', 'หมิว', 'เก่ง', 'ก้อย', 'ใบ', 'ฝน', 'มด', 'นก',
          'ตาล', 'บีม', 'พลอย', 'หนึ่ง', 'แป้ง', 'ยุ้ย', 'โอ๋', 'เบล', 'นุ่น', 'ปุ้ย'];
var REL = ['แม่', 'พ่อ', 'พี่', 'ป้า', 'ลุง', 'ยาย', 'น้า', 'ครู'];
/* [ชื่อของ, ลักษณนาม] */
var OBJ = [['ลูกอม', 'เม็ด'], ['ดินสอ', 'แท่ง'], ['สมุด', 'เล่ม'], ['หนังสือ', 'เล่ม'], ['ยางลบ', 'ก้อน'],
           ['ไม้บรรทัด', 'อัน'], ['ลูกโป่ง', 'ลูก'], ['ลูกแก้ว', 'ลูก'], ['ขนม', 'ชิ้น'], ['ปากกา', 'ด้าม'],
           ['สติกเกอร์', 'ดวง'], ['ลูกปัด', 'เม็ด'], ['หมวก', 'ใบ'], ['แก้วน้ำ', 'ใบ'], ['จาน', 'ใบ'],
           ['ถุงเท้า', 'คู่'], ['กิ๊บติดผม', 'อัน'], ['โบว์', 'เส้น']];
var FRUIT = [['ส้ม', 'ผล'], ['มะม่วง', 'ผล'], ['กล้วย', 'ผล'], ['เงาะ', 'ผล'], ['ลำไย', 'ผล'], ['ชมพู่', 'ผล'],
             ['ฝรั่ง', 'ผล'], ['มังคุด', 'ผล'], ['แอปเปิล', 'ผล']];
var ANI = [['ปลาทอง', 'ตัว'], ['กระต่าย', 'ตัว'], ['นกแก้ว', 'ตัว'], ['แมว', 'ตัว'], ['เป็ด', 'ตัว'],
           ['ไก่', 'ตัว'], ['ปลาหางนกยูง', 'ตัว'], ['เต่า', 'ตัว'], ['สุนัข', 'ตัว'], ['นกเขา', 'ตัว'],
           ['ปลากัด', 'ตัว'], ['ปลาสอด', 'ตัว']];
var PLANT = [['ต้นพริก', 'ต้น'], ['ต้นมะเขือ', 'ต้น'], ['ต้นกล้วย', 'ต้น'], ['ต้นมะนาว', 'ต้น'],
             ['ต้นกุหลาบ', 'ต้น'], ['ต้นมะลิ', 'ต้น'], ['ต้นโหระพา', 'ต้น'], ['ต้นตะไคร้', 'ต้น']];
var COLOR = ['สีแดง', 'สีฟ้า', 'สีเขียว', 'สีเหลือง', 'สีชมพู', 'สีส้ม', 'สีม่วง', 'สีขาว'];
var ICONKIND = ['tree', 'smiley', 'fish', 'heart', 'star', 'apple', 'book', 'flower', 'ball', 'cup', 'car', 'bird', 'pencil'];

function obj() { return pick(OBJ); }
function two(list) { return sample(list, 2); }
function names(n) { return sample(NM, n); }

/* ============================================================
   บทที่ 1  จำนวนนับ 1-10 และ 0
   ============================================================ */
var G1 = [
/* 1 มากกว่า/น้อยกว่า */ function () {
  var more = coin(), n = ri(3, 7), pool = [], i;
  for (i = 0; i <= 9; i++) if (more ? i > n : i < n) pool.push(i);
  var c = pick(pool), bad = [];
  for (i = 0; i <= 9; i++) if (more ? i < n : i > n) bad.push(i);
  var w = sample(bad, 2);
  return Q('ข้อใดมีจำนวน' + (more ? 'มากกว่า' : 'น้อยกว่า') + ' ' + n, WORD[c], WORD[w[0]], WORD[w[1]]);
},
/* 2 ต่างจากข้ออื่น */ function () {
  var a = ri(1, 9), b = other(1, 9, [a]);
  var f = sample([String(a), WORD[a], thai(a)], 2);
  return Q('ข้อใดมีค่าแตกต่างจากข้ออื่น', pick([String(b), WORD[b], thai(b)]), f[0], f[1]);
},
/* 3 เรียงลำดับ */ function () {
  var up = coin(), n = distinct(3, 0, 9).sort(function (x, y) { return up ? x - y : y - x; });
  var s = function (a) { return a.join('&nbsp; &nbsp;'); };
  var w1 = [n[1], n[0], n[2]], w2 = [n[0], n[2], n[1]];
  return Q('ข้อใดเรียงลำดับจาก' + (up ? 'น้อยไปมาก' : 'มากไปน้อย') + 'ได้ถูกต้อง', s(n), s(w1), s(w2));
},
/* 4 เติมเลขที่หายไป 2 ช่อง */ function () {
  var a = ri(0, 5);
  var s = function (x, y) { return x + '&nbsp; &nbsp;' + y; };
  return Q(a + ' ' + BOX + ' ' + (a + 2) + ' ' + BOX + ' ' + (a + 4) + ' เลขที่หายไปคือเลขอะไร',
    s(a + 1, a + 3), s(a + 2, a + 4), s(a + 1, a + 4));
},
/* 5 ข้อใดถูกต้อง */ function () {
  var a = ri(1, 9), b = other(1, 9, [a]);
  var lo = Math.min(a, b), hi = Math.max(a, b);
  var T = pick([
    thai(hi) + ' มีค่ามากกว่า ' + lo,
    hi + ' มีค่ามากกว่า ' + thai(lo),
    lo + ' มีค่าน้อยกว่า ' + thai(hi),
    a + ' มีค่าเท่ากับ ' + thai(a)]);
  var c = ri(1, 9), d = other(1, 9, [c]);
  var l2 = Math.min(c, d), h2 = Math.max(c, d);
  return Q('ข้อใดถูกต้อง', T, l2 + ' มีค่ามากกว่า ' + thai(h2), h2 + ' มีค่าน้อยกว่า ' + thai(l2));
},
/* 6 เลขอารบิกกับเลขไทย */ function () {
  var a = ri(1, 9);
  return Q(a + ' และ ' + thai(a) + ' เหมือนกันหรือไม่ เพราะอะไร',
    'มีค่าเท่ากัน', 'ลักษณะเหมือนกัน', 'ขนาดเท่ากัน');
},
/* 7 ภาพใดมีจำนวนเท่ากับ N */ function () {
  var n = ri(4, 8), k = sample(ICONKIND, 3);
  var w = sample([n - 1, n + 1, n - 2, n + 2].filter(function (x) { return x > 0 && x <= 10; }), 2);
  return Q('ภาพใดมีจำนวนเท่ากับ ' + n, IC(k[0], n), IC(k[1], w[0]), IC(k[2], w[1]));
},
/* 8 ทุกจำนวน */ function () {
  var more = coin(), n = ri(3, 6);
  var good = [], bad = [], i;
  for (i = 0; i <= 9; i++) (more ? i > n : i < n) ? good.push(i) : bad.push(i);
  var s = function (a) { return a.join('&nbsp; &nbsp;'); };
  var c = sample(good, 3), m1 = sample(good, 2).concat(sample(bad, 1)), m2 = sample(good, 1).concat(sample(bad, 2));
  return Q('ข้อใดมีค่า' + (more ? 'มากกว่า' : 'น้อยกว่า') + ' ' + n + ' ทุกจำนวน',
    s(c), s(shuffle(m1)), s(shuffle(m2)));
},
/* 9 เลขไทยเป็นตัวหนังสือ */ function () {
  var a = ri(1, 9), w = sample([a - 1, a + 1, a - 2, a + 2].filter(function (x) { return x >= 0 && x <= 9; }), 2);
  return Q(thai(a) + ' เขียนเป็นตัวหนังสือได้อย่างไร', WORD[a], WORD[w[0]], WORD[w[1]]);
},
/* 10 จำนวนเดียวกัน */ function () {
  var a = ri(1, 9), b = other(1, 9, [a]), c = other(1, 9, [a, b]);
  var row = function (x, y, z) { return x + '&nbsp; ' + thai(y) + '&nbsp; ' + WORD[z]; };
  return Q('ข้อใดเป็นจำนวนเดียวกัน', row(a, a, a), row(b, other(1, 9, [b]), b), row(c, c, other(1, 9, [c])));
},
/* 11 มาก/น้อยที่สุด */ function () {
  var most = coin(), n = distinct(3, 0, 9);
  var s = n.slice().sort(function (x, y) { return x - y; });
  var c = most ? s[2] : s[0];
  return Q('ข้อใดมีจำนวน' + (most ? 'มากที่สุด' : 'น้อยที่สุด'), String(c),
    String(s[1]), String(most ? s[0] : s[2]));
},
/* 12 เครื่องหมาย */ function () {
  var a = ri(0, 9), b = coin() ? a : other(0, 9, [a]);
  var c = a > b ? GT : a < b ? LT : '=';
  var rest = [GT, LT, '='].filter(function (x) { return x !== c; });
  return Q(a + ' ' + BOX + ' ' + b + ' ควรเติมเครื่องหมายใดใน ' + BOX, c, rest[0], rest[1]);
},
/* 13 นับจากรูป */ function () {
  var k = pick(ICONKIND), n = ri(4, 9);
  var nm = { tree: 'ต้นไม้', smiley: 'หน้ายิ้ม', fish: 'ปลา', heart: 'หัวใจ', star: 'ดาว', apple: 'แอปเปิล',
    book: 'หนังสือ', flower: 'ดอกไม้', ball: 'ลูกบอล', cup: 'ถ้วย', car: 'รถ', bird: 'นก', pencil: 'ดินสอ' }[k];
  return Q('จากรูป มี' + nm + 'กี่' + ({ flower: 'ดอก', book: 'เล่ม', pencil: 'แท่ง', car: 'คัน',
    cup: 'ใบ', tree: 'ต้น' }[k] || 'รูป'),
    String(n), String(n - 1), String(n + 1), { k: 'icons', icon: k, n: n });
},
/* 14 เติมเลขในอสมการ */ function () {
  var more = coin(), n = ri(2, 7), good = [], bad = [], i;
  for (i = 0; i <= 9; i++) { if (i === n) continue; (more ? i > n : i < n) ? good.push(i) : bad.push(i); }
  return Q(BOX + ' ' + (more ? GT : LT) + ' ' + n + ' ควรใส่ตัวเลขใดใน ' + BOX,
    String(pick(good)), String(n), String(pick(bad)));
},
/* 15 ข้อใดไม่ถูกต้อง */ function () {
  var a = ri(1, 9), b = other(1, 9, [a]), lo = Math.min(a, b), hi = Math.max(a, b);
  var c = ri(1, 9), d = other(1, 9, [c]), l2 = Math.min(c, d), h2 = Math.max(c, d);
  var e = ri(1, 9);
  return Q('ข้อใดไม่ถูกต้อง', lo + ' มีค่ามากกว่า ' + hi, h2 + ' มีค่ามากกว่า ' + l2, e + ' มีค่าเท่ากับ ' + thai(e));
},
/* 16-17 สามคน (คู่กัน) */ function () {
  var p = names(3), n = distinct(3, 1, 9), ob = obj(), most = coin();
  var idx = [0, 1, 2].sort(function (x, y) { return n[x] - n[y]; });
  var win = most ? idx[2] : idx[0];
  var q16 = Q(p[0] + 'มี' + ob[0] + ' ' + n[0] + ' ' + ob[1] + ' ' + p[1] + 'มี' + ob[0] + ' ' + n[1] + ' ' + ob[1] +
    ' ' + p[2] + 'มี' + ob[0] + ' ' + n[2] + ' ' + ob[1] + ' ใครมี' + ob[0] + (most ? 'มากที่สุด' : 'น้อยที่สุด'),
    p[win], p[most ? idx[0] : idx[2]], p[idx[1]]);
  var up = coin(), ord = up ? idx : idx.slice().reverse();
  var s = function (a) { return a.map(function (i) { return p[i]; }).join('&nbsp; '); };
  var q17 = Q('จากข้อ 16 ข้อใดเรียงลำดับ' + ob[0] + 'จาก' + (up ? 'น้อยไปมาก' : 'มากไปน้อย') + 'ได้ถูกต้อง',
    s(ord), s(ord.slice().reverse()), s([ord[1], ord[0], ord[2]]));
  return [q16, q17];
},
/* 18 a) b) c) */ function () {
  var t = [], f = [], i, a, b, g = 0, line;
  while (t.length < 2 && g++ < 200) {
    a = ri(0, 9); b = other(0, 9, [a]);
    line = Math.min(a, b) + ' มีค่าน้อยกว่า ' + Math.max(a, b);
    if (t.indexOf(line) < 0) t.push(line);
  }
  a = ri(0, 9); b = other(0, 9, [a]); f.push(Math.min(a, b) + ' มีค่ามากกว่า ' + Math.max(a, b));
  var lab = ['a', 'b', 'c'], order = shuffle([['T', t[0]], ['T', t[1]], ['F', f[0]]]);
  var txt = order.map(function (x, i2) { return lab[i2] + ') ' + x[1]; }).join(' &nbsp;&nbsp; ');
  var tIdx = [], fIdx = -1;
  order.forEach(function (x, i2) { if (x[0] === 'T') tIdx.push(i2); else fIdx = i2; });
  var pr = function (i1, i2) { return lab[i1] + ') และ ' + lab[i2] + ')'; };
  return Q(txt + '<br>ข้อใดถูกต้อง', pr(tIdx[0], tIdx[1]), pr(Math.min(tIdx[0], fIdx), Math.max(tIdx[0], fIdx)),
    pr(Math.min(tIdx[1], fIdx), Math.max(tIdx[1], fIdx)));
},
/* 19 ถัดจาก / ก่อนหน้า */ function () {
  var a = ri(1, 8), b = ri(1, 8), c = ri(1, 8);
  return Q('ข้อใดถูกต้อง',
    'จำนวนที่อยู่ถัดจาก ' + a + ' คือ ' + (a + 1),
    'จำนวนก่อนหน้า ' + b + ' คือ ' + (b + 1),
    'จำนวนที่อยู่ถัดจาก ' + c + ' คือ ' + (c - 1));
},
/* 20 เติมในลำดับ */ function () {
  var a = ri(0, 6), miss = ri(1, 2);
  var seq = [a, a + 1, a + 2, a + 3].map(function (v, i) { return i === miss ? BOX : v; }).join('&nbsp; ');
  var c = a + miss;
  return Q('&quot;' + seq + '&quot; เติมตัวเลขใดในช่อง ' + BOX,
    String(c), String(c - 2 >= 0 ? c - 2 : c + 3), String(c + 2));
}];

function IC(kind, n) { return '<i data-ic="' + kind + '" data-n="' + n + '"></i>'; }

/* ============================================================
   โจทย์ปัญหา บวก / ลบ  (ใช้ร่วมกันในบทที่ 2 3 และ 5)
   คืน { t:'โจทย์', v:คำตอบ, u:'หน่วย' }
   ============================================================ */
function addStory(a, b) {                 /* คำตอบ = a + b */
  var p = names(2), o = pick(coin() ? OBJ : FRUIT), u = o[1], t;
  switch (ri(1, 7)) {
    case 1: t = p[0] + 'มี' + o[0] + ' ' + a + ' ' + u + ' นำมารวมกับของ' + p[1] + 'อีก ' + b + ' ' + u +
      ' ทั้งสองคนมี' + o[0] + 'กี่' + u; break;
    case 2: t = p[0] + 'มี' + o[0] + ' ' + a + ' ' + u + ' ' + pick(REL) + 'ให้เพิ่มอีก ' + b + ' ' + u +
      ' ' + p[0] + 'มี' + o[0] + 'ทั้งหมดกี่' + u; break;
    case 3: t = p[0] + 'มี' + o[0] + ' ' + a + ' ' + u + ' ' + p[1] + 'มี' + o[0] + 'มากกว่า' + p[0] + ' ' + b +
      ' ' + u + ' ' + p[1] + 'มี' + o[0] + 'กี่' + u; break;
    case 4: t = 'วันแรก' + p[0] + 'อ่านหนังสือ ' + a + ' หน้า วันที่สองอ่านอีก ' + b +
      ' หน้า ทั้งสองวัน' + p[0] + 'อ่านหนังสือกี่หน้า'; u = 'หน้า'; break;
    case 5: var an = two(ANI);
      t = p[0] + 'เลี้ยง' + an[0][0] + ' ' + a + ' ตัว เลี้ยง' + an[1][0] + 'มากกว่า' + an[0][0] + ' ' + b +
        ' ตัว ' + p[0] + 'เลี้ยง' + an[1][0] + 'กี่ตัว'; u = 'ตัว'; break;
    case 6: t = p[0] + 'ได้เงินจาก' + pick(REL) + ' ' + a + ' บาท ได้เงินจาก' + pick(REL) + ' ' + b +
      ' บาท ' + p[0] + 'มีเงินทั้งหมดเท่าไร'; u = 'บาท'; break;
    default: var pl = pick(PLANT);
      t = p[0] + 'ปลูก' + pl[0] + ' ' + a + ' ต้น วันต่อมาปลูกเพิ่มอีก ' + b + ' ต้น ' + p[0] +
        'ปลูก' + pl[0] + 'ทั้งหมดกี่ต้น'; u = 'ต้น'; break;
  }
  return { t: t, v: a + b, u: u };
}
function subStory(a, b) {                 /* คำตอบ = a - b */
  var p = names(2), o = pick(coin() ? OBJ : FRUIT), u = o[1], t;
  switch (ri(1, 7)) {
    case 1: t = p[0] + 'มี' + o[0] + ' ' + a + ' ' + u + ' ให้เพื่อนไป ' + b + ' ' + u +
      ' ' + p[0] + 'จะเหลือ' + o[0] + 'กี่' + u; break;
    case 2: t = p[0] + 'มีเงิน ' + a + ' บาท ซื้อขนม ' + b + ' บาท ' + p[0] + 'เหลือเงินเท่าไร'; u = 'บาท'; break;
    case 3: t = p[0] + 'มี' + o[0] + ' ' + a + ' ' + u + ' ' + p[1] + 'มี' + o[0] + 'น้อยกว่า' + p[0] + ' ' + b +
      ' ' + u + ' ' + p[1] + 'มี' + o[0] + 'กี่' + u; break;
    case 4: t = p[0] + 'มี' + o[0] + ' ' + a + ' ' + u + ' ' + p[1] + 'มี' + o[0] + ' ' + b + ' ' + u +
      ' ' + p[0] + 'มี' + o[0] + 'มากกว่า' + p[1] + 'เท่าไร'; break;
    case 5: var f = pick(FRUIT);
      t = pick(REL) + 'มี' + f[0] + ' ' + a + ' ผล เน่าไป ' + b + ' ผล จะเหลือ' + f[0] + 'กี่ผล'; u = 'ผล'; break;
    case 6: var c = two(COLOR);
      t = p[0] + 'ซื้อ' + o[0] + 'มาทั้งหมด ' + a + ' ' + u + ' เป็น' + o[0] + c[0] + ' ' + b + ' ' + u +
        ' ที่เหลือเป็น' + o[0] + c[1] + 'กี่' + u; break;
    default: t = 'วันแรก' + p[0] + 'อ่านหนังสือ ' + a + ' หน้า วันที่สองอ่านน้อยกว่าวันแรก ' + b +
      ' หน้า วันที่สองอ่านได้กี่หน้า'; u = 'หน้า'; break;
  }
  return { t: t, v: a - b, u: u };
}
/* โจทย์ "มากกว่า แล้วรวมทั้งหมด"  คำตอบ = a + (a+b) */
function addTotalStory(a, b) {
  var p = names(1)[0], o = obj(), c = two(COLOR);
  return { t: p + 'มี' + o[0] + c[0] + ' ' + a + ' ' + o[1] + ' มี' + o[0] + c[1] + 'มากกว่า' + c[0] + ' ' + b +
      ' ' + o[1] + ' ' + p + 'มี' + o[0] + 'ทั้งหมดกี่' + o[1], v: a + a + b, u: o[1] };
}
/* ตัวหลอกของโจทย์บวก/ลบ: คิดผิดเป็นอีกเครื่องหมาย หรือคลาดไปหนึ่ง */
function addWrong(a, b) { return [a - b, a + b + 1, a + b - 1, b, a, a + b + 2]; }
function subWrong(a, b) { return [a + b, a - b + 1, a - b - 1, b, a, a - b + 2]; }


/* ============================================================
   บทที่ 2  การบวกจำนวนสองจำนวนที่ผลบวกไม่เกิน 10
   ============================================================ */
function addPair(max) { var a = ri(1, max - 1), b = ri(1, max - a); return [a, b]; }

var G2 = [
/* 1 ประโยคสัญลักษณ์ */ function () {
  var ab = addPair(10), a = ab[0], b = ab[1], c = a + b;
  return Q(a + ' + ' + b + ' = ' + BOX, String(c), String(c - 1), String(c + 1 <= 10 ? c + 1 : Math.abs(a - b)));
}];
for (var i2 = 0; i2 < 17; i2++) {
  G2.push(function () {
    var ab, s;
    if (Math.random() < 0.25) {               /* แบบ "มากกว่า แล้วรวม" */
      var a = ri(1, 4), b = ri(1, Math.min(4, 10 - 2 * a));
      s = addTotalStory(a, b);
      return Q(s.t, s.v + ' ' + s.u, (a + b) + ' ' + s.u, (s.v + 1) + ' ' + s.u);
    }
    ab = addPair(10); s = addStory(ab[0], ab[1]);
    var o = numOpts(s.v, addWrong(ab[0], ab[1]), unitOf(s.u));
    return Q(s.t, o[0], o[1], o[2]);
  });
}
G2.push(
/* 19 เขียนประโยคสัญลักษณ์ */ function () {
  var ab = addPair(10), a = ab[0], b = ab[1], p = names(2), an = two(ANI);
  return Q(p[0] + 'เลี้ยง' + an[0][0] + ' ' + a + ' ตัว เลี้ยง' + an[1][0] + 'มากกว่า' + an[0][0] + ' ' + b +
    ' ตัว ' + p[0] + 'เลี้ยง' + an[1][0] + 'กี่ตัว เขียนประโยคสัญลักษณ์ได้ตามข้อใด',
    a + ' + ' + b + ' = ' + BOX, BOX + ' + ' + a + ' = ' + b,
    Math.max(a, b) + ' ' + MINUS + ' ' + Math.min(a, b) + ' = ' + BOX);
},
/* 20 จากภาพ */ function () {
  var a = ri(2, 5), b = ri(2, 10 - a), k = pick(ICONKIND);
  return Q('จากภาพ เขียนเป็นประโยคสัญลักษณ์ได้อย่างไร',
    a + ' + ' + b + ' = ' + BOX, a + ' + ' + a + ' = ' + BOX, (a + 1) + ' + ' + (b - 1) + ' = ' + BOX,
    { k: 'grp2', icon: k, a: a, b: b });
});

/* ============================================================
   บทที่ 3  การลบจำนวนสองจำนวนที่มีตัวตั้งไม่ถึง 10
   ============================================================ */
function subPair() { var a = ri(4, 9), b = ri(1, a - 1); return [a, b]; }

var G3 = [
/* 1 ประโยคสัญลักษณ์ */ function () {
  var ab = subPair(), a = ab[0], b = ab[1], c = a - b;
  return Q(a + ' ' + MINUS + ' ' + b + ' = ' + BOX + ' ผลลัพธ์คือข้อใด',
    String(c), String(c + 1), String(a + b));
}];
for (var i3 = 0; i3 < 16; i3++) {
  G3.push(function () {
    var ab = subPair(), s = subStory(ab[0], ab[1]);
    var o = numOpts(s.v, subWrong(ab[0], ab[1]), unitOf(s.u));
    return Q(s.t, o[0], o[1], o[2]);
  });
}
G3.push(
/* 18 เขียนประโยคสัญลักษณ์ */ function () {
  var ab = subPair(), a = ab[0], b = ab[1], p = names(1)[0], o = pick(FRUIT);
  return Q(p + 'มี' + o[0] + ' ' + a + ' ' + o[1] + ' ให้เพื่อนไป ' + b + ' ' + o[1] +
    ' จากโจทย์ เขียนประโยคสัญลักษณ์ได้ตามข้อใด',
    a + ' ' + MINUS + ' ' + b + ' = ' + BOX, a + ' + ' + b + ' = ' + BOX, b + ' + ' + a + ' = ' + BOX);
},
/* 19 เลือกโจทย์ปัญหาที่ตรงกับประโยคสัญลักษณ์ */ function () {
  var ab = subPair(), a = ab[0], b = ab[1], p = names(1)[0], o = pick(FRUIT);
  return Q(a + ' ' + MINUS + ' ' + b + ' = ' + BOX + ' เขียนโจทย์ปัญหาได้ตามข้อใด',
    p + 'มี' + o[0] + ' ' + a + ' ' + o[1] + ' กินไป ' + b + ' ' + o[1] + ' ' + p + 'เหลือ' + o[0] + 'กี่' + o[1],
    p + 'มี' + o[0] + ' ' + a + ' ' + o[1] + ' ซื้อเพิ่มอีก ' + b + ' ' + o[1] + ' ' + p + 'มี' + o[0] + 'เท่าไร',
    p + 'มี' + o[0] + ' ' + a + ' ' + o[1] + ' เพื่อนมี' + o[0] + 'มากกว่า' + p + ' ' + b + ' ' + o[1] +
      ' เพื่อนมี' + o[0] + 'เท่าไร');
},
/* 20 กำไร */ function () {
  var a = ri(5, 9), b = ri(1, a - 1);
  return Q('ร้านค้าแห่งหนึ่งมียอดขายทั้งหมด ' + a + ' ล้านบาท เป็นต้นทุน ' + b +
    ' ล้านบาท ร้านค้าจะได้กำไรกี่ล้านบาท',
    (a - b) + ' ล้านบาท', (a - b + 1) + ' ล้านบาท', (a + b) + ' ล้านบาท');
});

/* ============================================================
   บทที่ 4  จำนวนนับ 11 ถึง 20
   ============================================================ */
var G4 = [
/* 1 อยู่ระหว่าง */ function () {
  var a = ri(11, 18), c = a + 1;
  return Q('จำนวนใดอยู่ระหว่าง ' + a + ' และ ' + (a + 2), String(c), String(a - 1), String(a + 3));
},
/* 2 เครื่องหมาย */ function () {
  var a = ri(11, 20), b = coin() ? a : other(11, 20, [a]);
  var c = a > b ? GT : a < b ? LT : '=', rest = [GT, LT, '='].filter(function (x) { return x !== c; });
  return Q(a + ' ' + BOX + ' ' + b + ' ควรเติมเครื่องหมายใดลงใน ' + BOX, c, rest[0], rest[1]);
},
/* 3 การกระจาย */ function () {
  var n = ri(11, 20), u = n - 10;
  return Q(n + ' จงเขียนในรูปการกระจาย', '10 + ' + u, '11 + ' + u, (u > 1 ? u : 9) + ' + ' + u);
},
/* 4 เลขที่หายไป */ function () {
  var a = ri(11, 18);
  return Q(a + ' ' + BOX + ' ' + (a + 2) + ' จำนวนที่หายไปคือข้อใด', String(a + 1), String(a - 1), String(a + 3));
},
/* 5 ข้อใดไม่ถูกต้อง */ function () {
  var a = ri(11, 18), b = ri(12, 20), c = ri(11, 18);
  return Q('ข้อใดไม่ถูกต้อง', 'เลขถัดจาก ' + a + ' คือ ' + (a + 2),
    'เลขก่อนหน้า ' + b + ' คือ ' + (b - 1), 'เลขถัดจาก ' + c + ' คือ ' + (c + 1));
},
/* 6 มากกว่า/น้อยกว่า */ function () {
  var more = coin(), n = ri(13, 18), good = [], bad = [], i;
  for (i = 11; i <= 20; i++) { if (i === n) continue; (more ? i > n : i < n) ? good.push(i) : bad.push(i); }
  return Q('ข้อใดมีค่า' + (more ? 'มากกว่า' : 'น้อยกว่า') + ' ' + n, String(pick(good)), String(pick(bad)), String(n));
},
/* 7 แตกต่างจากข้ออื่น (คำกับตัวเลข) */ function () {
  var a = ri(11, 20), b = other(11, 20, [a]), p = names(3), o = pick(FRUIT);
  return Q('ข้อใดแตกต่างจากข้ออื่น',
    p[2] + 'ซื้อขนม ' + b + ' บาท', p[0] + 'มี' + o[0] + ' ' + a + ' ' + o[1],
    p[1] + 'เดินเล่น' + WORD[a] + 'นาที');
},
/* 8 การกระจาย */ function () {
  var n = ri(11, 20), u = n - 10;
  return Q(n + ' จงเขียนในรูปการกระจาย', '10 + ' + u, (u + 1) + ' + ' + u, '10 + ' + (u + 1));
},
/* 9 จำนวนเดียวกันทั้งหมด */ function () {
  var a = ri(11, 20), b = other(11, 20, [a]), c = other(11, 20, [a, b]);
  var row = function (n, u) { return n + '&nbsp; ' + WORD[n] + '&nbsp; 10 + ' + u; };
  return Q('ข้อใดแสดงจำนวนเดียวกันทั้งหมด', row(a, a - 10), row(b, b - 10 + 1), row(c, c - 10 - 1));
},
/* 10 เรียงลำดับ */ function () {
  var up = coin(), n = distinct(3, 11, 20).sort(function (x, y) { return up ? x - y : y - x; });
  var s = function (a) { return a.join('&nbsp; &nbsp;'); };
  return Q('ข้อใดเรียงจาก' + (up ? 'น้อยไปมาก' : 'มากไปน้อย') + 'ถูกต้อง',
    s(n), s([n[1], n[0], n[2]]), s([n[0], n[2], n[1]]));
},
/* 11 ไม่อยู่ระหว่าง */ function () {
  var a = ri(11, 15), b = a + 4, inside = distinct(2, a + 1, b - 1);
  return Q('ข้อใดไม่อยู่ระหว่าง ' + a + ' กับ ' + b, String(b + ri(1, 2)), String(inside[0]), String(inside[1]));
},
/* 12 สิบ-หน่วย เป็นเลขฮินดูอารบิก */ function () {
  var u = ri(1, 9), n = 10 + u;
  return Q('1 สิบ กับ ' + u + ' หน่วย เขียนเป็นตัวเลขฮินดูอารบิกได้อย่างไร',
    String(n), String(u * 10 + 1), String(10 + (u === 1 ? 2 : 1)));
},
/* 13 สิบกับหน่วย ของของ */ function () {
  var u = ri(1, 9), n = 10 + u, o = obj();
  return Q(o[0] + ' 1 สิบ กับ ' + u + ' ' + o[1] + ' จะมี' + o[0] + 'อยู่เท่าไร',
    String(n), String(u * 10 + 1), String(u === 1 ? 12 : 11));
},
/* 14 หลักของเลขที่ขีดเส้นใต้ */ function () {
  var u = ri(1, 9), ten = coin();
  var n = ten ? '<u>1</u>' + u : '1<u>' + u + '</u>';
  return Q(n + ' ตัวเลขที่ขีดเส้นใต้อยู่ในหลักใด', ten ? 'สิบ' : 'หน่วย', ten ? 'หน่วย' : 'สิบ', 'ร้อย');
},
/* 15 ข้อใดถูกต้อง (หลัก) */ function () {
  var a = ri(1, 9), b = ri(1, 9), c = ri(1, 9);
  return Q('ข้อใดถูกต้อง',
    '<u>1</u>' + a + ' มี 1 อยู่ในหลักสิบ',
    '1<u>' + b + '</u> มี ' + b + ' อยู่ในหลักสิบ',
    '<u>1</u>' + c + ' มี 1 อยู่ในหลักหน่วย');
},
/* 16 ตัวหนังสือ -> ฮินดูอารบิก */ function () {
  var n = ri(11, 20), u = n - 10;
  return Q(WORD[n] + ' เขียนเป็นตัวเลขฮินดูอารบิกได้อย่างไร', String(n), String(u), String(u * 10 || 20));
},
/* 17 หลักสิบ-หลักหน่วย */ function () {
  var u = ri(1, 9), n = 10 + u;
  return Q('หนึ่งอยู่ในหลักสิบ ' + WORD[u] + 'อยู่ในหลักหน่วย คือข้อใด', String(n), String(u * 10 + 1), String(u));
},
/* 18 จำนวนเดียวกัน (ไทย) */ function () {
  var a = ri(11, 20), b = other(11, 20, [a]), c = other(11, 20, [a, b]);
  return Q('ข้อใดแสดงจำนวนเดียวกัน',
    a + '&nbsp; ' + WORD[a] + '&nbsp; ' + thai(a),
    b + '&nbsp; ' + WORD[b - 1] + '&nbsp; ' + thai(b),
    c + '&nbsp; ' + WORD[c] + '&nbsp; ' + thai(c + 1 <= 20 ? c + 1 : c - 1));
},
/* 19 ตัวเลขไทย */ function () {
  var n = ri(11, 20);
  return Q(WORD[n] + ' เขียนเป็นตัวเลขไทยได้อย่างไร', thai(n),
    thai(String(n).split('').reverse().join('')), String(n));
},
/* 20 อยู่ระหว่าง */ function () {
  var a = ri(11, 17), b = a + 3, c = ri(a + 1, b - 1);
  return Q('จำนวนใดอยู่ระหว่าง ' + a + ' กับ ' + b, String(c), String(a - 1), String(b + 1));
},
/* 21 ลำดับ 5 ตัว */ function () {
  var a = ri(11, 16), miss = ri(1, 3), seq = [], i;
  for (i = 0; i < 5; i++) seq.push(i === miss ? BOX : a + i);
  return Q(seq.join('&nbsp; ') + ' ตัวเลขที่หายไปคือข้อใด',
    String(a + miss), String(a - 1), String(a + 5));
},
/* 22 ค่าเท่ากับผลบวก */ function () {
  var a = ri(11, 14), b = ri(2, 20 - a), c = a + b;
  return Q('ข้อใดมีค่าเท่ากับ ' + a + ' + ' + b, String(c), String(c - 1), String(a));
},
/* 23 10 + n */ function () {
  var u = ri(1, 9), n = 10 + u;
  return Q('ข้อใดมีค่าเท่ากับ 10 + ' + u, String(n), '10', String(u));
},
/* 24 เครื่องหมาย */ function () {
  var a = ri(11, 20), b = other(11, 20, [a]);
  var c = a > b ? GT : LT, rest = [GT, LT, '='].filter(function (x) { return x !== c; });
  return Q(a + ' ' + BOX + ' ' + b + ' ควรเติมเครื่องหมายใดลงใน ' + BOX, c, rest[0], rest[1]);
},
/* 25 มากกว่า…อยู่… */ function () {
  var a = ri(6, 14), d = ri(2, 20 - a), c = a + d;
  return Q('จำนวนใดที่มากกว่า ' + a + ' อยู่ ' + d, String(c), String(c - 1), String(a - d >= 0 ? a - d : c + 2));
},
/* 26 น้อยกว่า…อยู่… */ function () {
  var a = ri(14, 20), d = ri(2, 6), c = a - d;
  return Q('จำนวนใดที่น้อยกว่า ' + a + ' อยู่ ' + d, String(c), String(c + 1), String(a + d));
},
/* 27 เท่ากับ */ function () {
  var n = ri(11, 20);
  return Q('จำนวนใดเท่ากับ ' + n, WORD[n], WORD[other(11, 20, [n])], (n - 10) + 'สิบ');
},
/* 28 สิบ + หน่วย จากของ */ function () {
  var u = ri(1, 9), n = 10 + u, a = two(ANI), b = pick(ANI);
  return Q('ข้อใดหมายถึง ' + WORD[n],
    a[0][0] + ' 10 ตัว ' + a[1][0] + ' ' + u + ' ตัว',
    a[0][0] + ' 10 ตัว ' + a[1][0] + ' ' + other(1, 9, [u]) + ' ตัว',
    a[1][0] + ' ' + u + ' ตัว ' + b[0] + ' ' + other(1, 9, [10]) + ' ตัว');
},
/* 29 เปรียบเทียบของสองอย่าง */ function () {
  var p = names(1)[0], o = two(OBJ), a = ri(11, 20), b = other(11, 20, [a]);
  var more = a > b ? o[0] : o[1], less = a > b ? o[1] : o[0];
  return Q('&quot;' + p + 'มี' + o[0][0] + ' ' + a + ' ' + o[0][1] + ' ' + o[1][0] + ' ' + b + ' ' + o[1][1] +
    '&quot; ข้อใดถูกต้อง',
    p + 'มี' + more[0] + 'มากกว่า' + less[0], p + 'มี' + less[0] + 'มากกว่า' + more[0],
    p + 'มี' + o[0][0] + 'เท่ากับ' + o[1][0]);
},
/* 30 ลำดับเว้นสอง */ function () {
  var a = ri(10, 13), seq = [a, a + 2, BOX, a + 6, a + 8];
  return Q(seq.join('&nbsp; ') + ' ควรเติมจำนวนใดลงใน ' + BOX + ' เพื่อเรียงลำดับจากน้อยไปมาก',
    String(a + 4), String(a + 1), String(a + 7));
}];

/* ============================================================
   บทที่ 5  การบวก ลบ จำนวนนับไม่เกิน 20
   ============================================================ */
var G5 = [
/* 1 บวก */ function () {
  var a = ri(10, 16), b = ri(2, 20 - a), c = a + b;
  return Q(a + ' + ' + b + ' = ' + BOX + ' ผลลัพธ์มีค่าเท่าไร', String(c), String(c - 1), String(c + 1));
},
/* 2 ลบ */ function () {
  var a = ri(14, 20), b = ri(5, 9), c = a - b;
  return Q(a + ' ' + MINUS + ' ' + b + ' = ' + BOX + ' ผลลัพธ์มีค่าเท่าไร', String(c), String(c + 1), String(c - 1));
},
/* 3 บวกข้ามสิบ */ function () {
  var a = ri(6, 9), b = ri(11 - a, 9), c = a + b;
  return Q(a + ' + ' + b + ' = ' + BOX + ' มีค่าเท่าข้อใด', String(c), String(c - 1), String(c + 1));
},
/* 4 เติมตัวตั้ง */ function () {
  var c = ri(14, 20), b = ri(3, 7), a = c - b;
  return Q(BOX + ' + ' + b + ' = ' + c + ' ควรเติมตัวเลขใดใน ' + BOX, String(a), String(a + 1), String(c + b));
},
/* 5 มากกว่า แล้วรวม */ function () {
  var a = ri(4, 8), b = ri(2, Math.min(4, 20 - 2 * a));
  var s = addTotalStory(a, b);
  return Q(s.t, s.v + ' ' + s.u, (a + b) + ' ' + s.u, (s.v + 1) + ' ' + s.u);
},
/* 6 มากกว่าเท่าไร */ function () {
  var a = ri(14, 20), b = ri(5, 9), p = names(1)[0], pl = two(PLANT);
  return Q(p + 'ปลูก' + pl[0][0] + ' ' + a + ' ต้น ปลูก' + pl[1][0] + ' ' + b + ' ต้น ' + p + 'ปลูก' +
    pl[0][0] + 'มากกว่า' + pl[1][0] + 'เท่าไร',
    (a - b) + ' ต้น', (a - b + 1) + ' ต้น', (a + b) + ' ต้น');
},
/* 7-8 ประโยคสัญลักษณ์ + คำตอบ (คู่กัน) */ function () {
  var p = names(2), a = ri(10, 14), b = ri(2, 20 - a);
  var q7 = Q(p[0] + 'มีเงิน ' + a + ' บาท ' + p[1] + 'มีเงินมากกว่า' + p[0] + ' ' + b + ' บาท ' + p[1] +
    'มีเงินเท่าไร จงเขียนประโยคสัญลักษณ์',
    a + ' + ' + b + ' = ' + BOX, a + ' ' + MINUS + ' ' + b + ' = ' + BOX, b + ' + ' + BOX + ' = ' + a);
  var q8 = Q('จากข้อ 7 ' + p[1] + 'มีเงินเท่าไร',
    (a + b) + ' บาท', (a - b) + ' บาท', (a + b + 1) + ' บาท');
  return [q7, q8];
},
/* 9 สองวันรวมกัน */ function () {
  var a = ri(6, 11), b = ri(5, 20 - a), p = names(1)[0], d = two(['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์']);
  return Q(d[0] + p + 'วิ่งได้ ' + a + ' กิโลเมตร ' + d[1] + 'วิ่งได้ ' + b + ' กิโลเมตร ทั้งสองวัน' + p +
    'วิ่งได้กี่กิโลเมตร', (a + b) + ' กิโลเมตร', (a + b - 1) + ' กิโลเมตร', (a - b >= 0 ? a - b : a + b + 1) + ' กิโลเมตร');
},
/* 10 ซื้อเพิ่ม */ function () {
  var a = ri(10, 15), b = ri(3, 20 - a);
  return Q(pick(REL) + 'ซื้อไข่ไก่มาทำขนม ' + a + ' ฟอง ต้องซื้อเพิ่มอีก ' + b +
    ' ฟอง ต้องใช้ไข่ไก่ทั้งหมดกี่ฟอง', (a + b) + ' ฟอง', (a + b - 1) + ' ฟอง', (a - b) + ' ฟอง');
},
/* 11 ส่วนที่เหลือ */ function () {
  var a = ri(14, 20), b = ri(5, a - 5), c = two(COLOR), p = names(1)[0], o = obj();
  return Q(p + 'มี' + o[0] + 'ทั้งหมด ' + a + ' ' + o[1] + ' เป็น' + o[0] + c[0] + ' ' + b + ' ' + o[1] +
    ' ที่เหลือเป็น' + o[0] + c[1] + 'กี่' + o[1],
    (a - b) + ' ' + o[1], (a - b + 1) + ' ' + o[1], (a + b) + ' ' + o[1]);
},
/* 12 น้ำหนักผลไม้ที่เหลือ */ function () {
  var a = ri(14, 20), b = ri(5, a - 6), f = two(FRUIT);
  return Q('ชาวสวนมีผลไม้ทั้งหมด ' + a + ' กิโลกรัม มี' + f[0][0] + ' ' + b +
    ' กิโลกรัม ที่เหลือเป็น' + f[1][0] + ' ชาวสวนมี' + f[1][0] + 'กี่กิโลกรัม',
    (a - b) + ' กิโลกรัม', (a - b - 1) + ' กิโลกรัม', (a + b) + ' กิโลกรัม');
},
/* 13 เวลาเพิ่มขึ้น */ function () {
  var a = ri(10, 15), b = ri(3, 20 - a), p = names(1)[0], act = two(['อาบน้ำ', 'แปรงฟัน', 'ล้างจาน', 'กวาดบ้าน', 'ทำการบ้าน', 'อ่านหนังสือ', 'รดน้ำต้นไม้']);
  return Q(p + 'ใช้เวลา' + act[0] + ' ' + a + ' นาที ถ้า' + act[1] + 'จะใช้เวลาเพิ่มขึ้นอีก ' + b +
    ' นาที ' + p + 'ใช้เวลา' + act[0] + 'และ' + act[1] + 'กี่นาที',
    (a + b) + ' นาที', (a - b) + ' นาที', (a + b - 1) + ' นาที');
},
/* 14 มากกว่ากี่นาที */ function () {
  var a = ri(10, 14), b = ri(a + 3, 20), d = two(['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์']);
  var p = names(1)[0];
  return Q(d[0] + p + 'ใช้เวลามาโรงเรียน ' + a + ' นาที ' + d[1] + 'ใช้เวลา ' + b + ' นาที ' + d[1] + p +
    'ใช้เวลามากกว่า' + d[0] + 'เท่าไร',
    (b - a) + ' นาที', (b - a + 1) + ' นาที', (a + b) + ' นาที');
},
/* 15 ชาย-หญิง */ function () {
  var a = ri(15, 20), b = ri(6, a - 6), boy = coin();
  return Q('ห้องประถม 1 มีนักเรียนทั้งหมด ' + a + ' คน เป็นผู้' + (boy ? 'ชาย' : 'หญิง') + ' ' + b +
    ' คน ที่เหลือจะเป็นผู้' + (boy ? 'หญิง' : 'ชาย') + 'กี่คน',
    (a - b) + ' คน', (a - b - 1) + ' คน', (a + b) + ' คน');
},
/* 16 สามจำนวนรวมกัน */ function () {
  var a = ri(4, 7), b = ri(4, 7), c = ri(3, 20 - a - b), col = sample(COLOR, 3), p = names(1)[0], o = obj();
  return Q(p + 'มี' + o[0] + col[0] + ' ' + a + ' ' + o[1] + ' ' + col[1] + ' ' + b + ' ' + o[1] + ' ' +
    col[2] + ' ' + c + ' ' + o[1] + ' ' + p + 'มี' + o[0] + 'ทั้งหมดเท่าไร',
    (a + b + c) + ' ' + o[1], (a + b + c - 1) + ' ' + o[1], (a + b) + ' ' + o[1]);
},
/* 17 ลบสองครั้ง */ function () {
  var a = ri(15, 20), b = ri(3, 6), c = ri(2, a - b - 5), p = names(1)[0], o = obj();
  return Q(p + 'ซื้อ' + o[0] + 'มา ' + a + ' ' + o[1] + ' ใช้ไป ' + b + ' ' + o[1] + ' แจกเพื่อนไป ' + c +
    ' ' + o[1] + ' ' + p + 'จะเหลือ' + o[0] + 'เท่าไร',
    (a - b - c) + ' ' + o[1], (a - b) + ' ' + o[1], (a - b - c + 1) + ' ' + o[1]);
},
/* 18 มากกว่า */ function () {
  var a = ri(10, 15), b = ri(2, 20 - a), act = two(['ว่ายน้ำ', 'ดนตรี', 'กีฬา', 'วาดภาพ', 'นาฏศิลป์', 'เทควันโด']);
  return Q('ห้องประถม 1/' + ri(1, 4) + ' มีเด็กเรียน' + act[0] + ' ' + a + ' คน มีเรียน' + act[1] +
    'มากกว่าเรียน' + act[0] + ' ' + b + ' คน มีนักเรียนเรียน' + act[1] + 'กี่คน',
    (a + b) + ' คน', (a - b) + ' คน', (a + b + 1) + ' คน');
},
/* 19 ครูแจกของ */ function () {
  var a = ri(15, 20), b = ri(6, 9), c = ri(2, a - b - 4), o = obj();
  return Q('ครูซื้อ' + o[0] + 'มา ' + a + ' ' + o[1] + ' ให้เด็กไป ' + b + ' ' + o[1] + ' ให้เพื่อนครู ' + c +
    ' ' + o[1] + ' ครูจะเหลือ' + o[0] + 'กี่' + o[1],
    (a - b - c) + ' ' + o[1], (a - b - c + 1) + ' ' + o[1], (a - b) + ' ' + o[1]);
},
/* 20 ต้นไม้ตาย */ function () {
  var a = ri(15, 20), b = ri(2, 5), c = ri(2, a - b - 8);
  return Q(pick(REL) + 'ปลูกต้นไม้ทั้งหมด ' + a + ' ต้น แห้งตาย ' + b + ' ต้น เน่าตาย ' + c +
    ' ต้น จะเหลือต้นไม้กี่ต้น',
    (a - b - c) + ' ต้น', (a - b) + ' ต้น', (a + b + c) + ' ต้น');
},
/* 21 เติมตัวลบ */ function () {
  var a = ri(15, 20), c = ri(5, 9), b = a - c;
  return Q(a + ' ' + MINUS + ' ' + BOX + ' = ' + c + ' ควรเติมตัวเลขใดใน ' + BOX,
    String(b), String(b + 1), String(a + c));
},
/* 22 เลี้ยงเพิ่ม */ function () {
  var a = ri(10, 15), b = ri(3, 20 - a), p = names(1)[0], an = pick(ANI);
  return Q(p + 'เลี้ยง' + an[0] + ' ' + a + ' ตัว นำมาเลี้ยงเพิ่ม ' + b + ' ตัว ' + p + 'เลี้ยง' + an[0] + 'กี่ตัว',
    (a + b) + ' ตัว', (a + b - 1) + ' ตัว', (a - b) + ' ตัว');
},
/* 23 อายุ */ function () {
  var a = ri(6, 10), b = ri(3, 20 - a), p = names(2);
  return Q(p[0] + 'แก่กว่า' + p[1] + ' ' + b + ' ปี ' + p[1] + 'อายุ ' + a + ' ปี ' + p[0] + 'อายุเท่าไร',
    (a + b) + ' ปี', (a - b >= 0 ? a - b : a + b + 1) + ' ปี', (a + b - 1) + ' ปี');
},
/* 24 น้ำหนักสัตว์รวม */ function () {
  var a = ri(4, 9), b = ri(4, 20 - a), p = names(2), an = pick(ANI);
  return Q(an[0] + 'ของ' + p[0] + 'หนัก ' + a + ' กิโลกรัม ' + an[0] + 'ของ' + p[1] + 'หนัก ' + b +
    ' กิโลกรัม ' + an[0] + 'ทั้งสองตัวหนักรวมกันเท่าไร',
    (a + b) + ' กิโลกรัม', (a + b + 1) + ' กิโลกรัม', (b - a >= 0 ? b - a : a - b) + ' กิโลกรัม');
},
/* 25 แบ่งสองชนิด */ function () {
  var a = ri(13, 20), b = ri(5, a - 5), o = obj(), t = two(['ถุงเล็ก', 'ถุงใหญ่', 'กล่องเล็ก', 'กล่องใหญ่']);
  return Q(pick(REL) + 'ซื้อ' + o[0] + 'มา ' + a + ' ' + o[1] + ' เป็น' + t[0] + ' ' + b + ' ' + o[1] +
    ' ที่เหลือเป็น' + t[1] + 'เท่าไร',
    (a - b) + ' ' + o[1], (a - b - 1) + ' ' + o[1], (a + b) + ' ' + o[1]);
},
/* 26 สองไส้รวมกัน */ function () {
  var a = ri(7, 10), b = ri(7, 20 - a), f = two(['ไส้หมูสับ', 'ไส้ครีม', 'ไส้สังขยา', 'ไส้เผือก', 'ไส้ถั่ว']);
  var p = names(1)[0];
  return Q(p + 'ซื้อซาลาเปา' + f[0] + ' ' + a + ' ลูก ' + f[1] + ' ' + b + ' ลูก ' + p + 'ซื้อซาลาเปาทั้งหมดกี่ลูก',
    (a + b) + ' ลูก', (a + b - 1) + ' ลูก', (a + b + 1) + ' ลูก');
},
/* 27 มากกว่า แล้วรวม (เนื้อสัตว์) */ function () {
  var a = ri(3, 6), b = ri(2, Math.min(6, 20 - 2 * a)), m = two(['เนื้อหมู', 'เนื้อไก่', 'เนื้อปลา', 'เนื้อกุ้ง', 'เนื้อวัว']);
  return Q(pick(REL) + 'ใช้' + m[0] + 'ทำกับข้าว ' + a + ' กิโลกรัม ใช้' + m[1] + 'มากกว่า' + m[0] + ' ' + b +
    ' กิโลกรัม ใช้เนื้อสัตว์ทั้งหมดเท่าไร',
    (a + a + b) + ' กิโลกรัม', (a + b) + ' กิโลกรัม', (a + a + b + 1) + ' กิโลกรัม');
},
/* 28 ทำงาน + โอที */ function () {
  var a = ri(8, 13), b = ri(2, 20 - a);
  return Q(pick(REL) + 'ทำงาน ' + a + ' ชั่วโมง ทำโอทีเพิ่มอีก ' + b + ' ชั่วโมง ทำงานทั้งหมดกี่ชั่วโมง',
    (a + b) + ' ชั่วโมง', (a + b - 1) + ' ชั่วโมง', (a - b >= 0 ? a - b : a + b + 1) + ' ชั่วโมง');
},
/* 29 ความยาวต่อกัน */ function () {
  var a = ri(11, 15), b = ri(3, 20 - a), th = two(['ไม้บรรทัด', 'ดินสอ', 'เชือก', 'ริบบิ้น', 'ยางลบ']);
  return Q(th[0] + 'ยาว ' + a + ' เซนติเมตร ' + th[1] + 'ยาว ' + b +
    ' เซนติเมตร นำมาวางต่อกันทั้งหมดจะยาวเท่าไร',
    (a + b) + ' เซนติเมตร', (a + b - 1) + ' เซนติเมตร', (a - b) + ' เซนติเมตร');
},
/* 30 นักเรียนเลี้ยงสัตว์ */ function () {
  var a = ri(4, 7), b = ri(4, 7), c = ri(2, 20 - a - b), an = sample(ANI, 3);
  return Q('ห้องเรียนมีนักเรียนเลี้ยง' + an[0][0] + ' ' + a + ' คน เลี้ยง' + an[1][0] + ' ' + b +
    ' คน เลี้ยง' + an[2][0] + ' ' + c + ' คน ห้องนี้มีนักเรียนเลี้ยงสัตว์ทั้งหมดกี่คน',
    (a + b + c) + ' คน', (a + b + c - 1) + ' คน', (a + b) + ' คน');
}];

/* ============================================================
   บทที่ 6  แผนภูมิรูปภาพ
   ============================================================ */
function vals(n, lo, hi) { var s = [], v, g = 0; while (s.length < n && g++ < 500) { v = ri(lo, hi); if (s.indexOf(v) < 0) s.push(v); } return s; }
/* ค่าทั้งหมดต่างกัน ยกเว้นมีคู่ที่เท่ากันพอดี 1 คู่ */
function rowsPair(labels, lo, hi) {
  var v = vals(labels.length - 1, lo, hi);
  v.push(pick(v)); shuffle(v);
  return labels.map(function (l, i) { return [l, v[i]]; });
}
/* มีค่าเท่ากัน 3 ตัวพอดี */
function rowsTrio(labels, lo, hi) {
  var base = ri(lo, hi), rest = [], v, g = 0;
  while (rest.length < labels.length - 3 && g++ < 500) { v = ri(lo, hi); if (v !== base && rest.indexOf(v) < 0) rest.push(v); }
  var all = shuffle([base, base, base].concat(rest));
  return labels.map(function (l, i) { return [l, all[i]]; });
}
function rowsAll(labels, lo, hi) {
  var v = vals(labels.length, lo, hi);
  return labels.map(function (l, i) { return [l, v[i]]; });
}
function byVal(rows, up) { return rows.slice().sort(function (a, b) { return up ? a[1] - b[1] : b[1] - a[1]; }); }
function total(rows) { return rows.reduce(function (t, r) { return t + r[1]; }, 0); }
function equalPair(rows) {
  var i, j; for (i = 0; i < rows.length; i++) for (j = i + 1; j < rows.length; j++) if (rows[i][1] === rows[j][1]) return [rows[i], rows[j]];
  return null;
}
function equalTrio(rows) {
  var c = {}, i, k;
  for (i = 0; i < rows.length; i++) { k = rows[i][1]; (c[k] = c[k] || []).push(rows[i][0]); }
  for (k in c) if (c[k].length === 3) return { v: +k, names: c[k] };
  return null;
}
function joinNames(a) { return a.join('&nbsp; '); }
function KEY(icon, mode, unit) {
  return 'กำหนดให้ ' + (mode === 'tally' ? '<i data-tl="1"></i>' : IC(icon, 1)) + ' แทน' + unit;
}

var G6 = [function () {
  var out = [];
  /* ---------- กล่อง 1 : แผนภูมิรูปภาพแนวนอน ---------- */
  var topic = pick([
    { t: 'จำนวนต้นไม้ที่แต่ละกลุ่มปลูก', icon: 'tree', u: 'ต้น', w: 'ปลูกต้นไม้', lb: 'กลุ่ม' },
    { t: 'จำนวนดอกไม้ที่แต่ละกลุ่มปลูก', icon: 'flower', u: 'ดอก', w: 'ปลูกดอกไม้', lb: 'กลุ่ม' },
    { t: 'จำนวนหนังสือที่แต่ละกลุ่มอ่าน', icon: 'book', u: 'เล่ม', w: 'อ่านหนังสือ', lb: 'กลุ่ม' }]);
  var lb = sample(['ก', 'ข', 'ค', 'ง'], 4).sort();
  var L = lb.map(function (x) { return topic.lb + ' ' + x; });
  var r1 = rowsPair(L, 3, 9), ep = equalPair(r1), s1 = byVal(r1, false), hi = s1[0];
  var notEq = r1.filter(function (x) { return x !== ep[0] && x !== ep[1]; });
  var n1 = ri(4, 9);
  out.push({ f: { k: 'hchart', title: 'แผนภูมิแสดง' + topic.t, rows: r1, icon: topic.icon, mode: 'icon',
    key: KEY(topic.icon, 'icon', 'จำนวน 1 ' + topic.u), hint: 'ใช้แผนภูมิตอบคำถามข้อ 1 - 5' } });
  out.push(Q('แผนภูมิดังกล่าวเป็นแผนภูมิประเภทใด', 'แผนภูมิรูปภาพ', 'แผนภูมิแท่ง', 'แผนภูมิเส้น'));
  out.push(Q(IC(topic.icon, 1) + ' จากรูป ถ้ามีรูป ' + n1 + ' รูป จะมีทั้งหมดกี่' + topic.u,
    n1 + ' ' + topic.u, (n1 - 1) + ' ' + topic.u, (n1 + 2) + ' ' + topic.u));
  out.push(Q(topic.lb + 'ใด' + topic.w + 'มากที่สุด', hi[0], s1[2][0], s1[3][0]));
  out.push(Q(topic.lb + 'ใดที่' + topic.w + 'เท่ากัน', ep[0][0] + ' และ ' + ep[1][0],
    ep[0][0] + ' และ ' + notEq[0][0], notEq[0][0] + ' และ ' + notEq[1][0]));
  out.push(Q('ทั้ง 4 ' + topic.lb + topic.w + 'ทั้งหมดกี่' + topic.u,
    total(r1) + ' ' + topic.u, (total(r1) - 1) + ' ' + topic.u, (total(r1) + 1) + ' ' + topic.u));

  /* ---------- กล่อง 2 : รอยขีดนับ คะแนนเลือกตั้ง ---------- */
  var what = pick(['หัวหน้าห้อง', 'ประธานชมรมถ่ายรูป', 'ประธานชมรมดนตรี', 'หัวหน้ากลุ่มสี']);
  var P2 = names(4), r2 = rowsAll(P2, 2, 9), s2r = byVal(r2, false), win = s2r[0], lo2 = s2r[3];
  var two2 = sample(r2, 2);
  out.push({ f: { k: 'hchart', title: 'แผนภูมิแสดงคะแนนการเลือกตั้ง' + what, rows: r2, icon: null, mode: 'tally',
    key: KEY(null, 'tally', 'คะแนนการเลือกตั้ง 1 คะแนน'), hint: 'ใช้แผนภูมิดังกล่าวตอบคำถามข้อ 6 - 9' } });
  out.push(Q(win[0] + 'ได้คะแนนการเลือกตั้งกี่คะแนน', win[1] + ' คะแนน', (win[1] - 1) + ' คะแนน', (win[1] + 2) + ' คะแนน'));
  out.push(Q('ใครชนะการเลือกตั้ง' + what, win[0], lo2[0], s2r[1][0]));
  out.push(Q(win[0] + 'ได้คะแนนมากกว่า' + lo2[0] + 'กี่คะแนน',
    (win[1] - lo2[1]) + ' คะแนน', (win[1] + lo2[1]) + ' คะแนน', (win[1] - lo2[1] + 1) + ' คะแนน'));
  out.push(Q('มีคนมาเลือกตั้ง' + what + 'ทั้งหมดกี่คน',
    total(r2) + ' คน', (total(r2) - 1) + ' คน', (total(r2) + 1) + ' คน'));

  /* ---------- กล่อง 3 : ความชื่นชอบ ---------- */
  var th3 = pick([
    { t: 'ผลไม้แต่ละชนิด', w: 'ผลไม้ชนิดใด', L: ['เงาะ', 'มังคุด', 'ทุเรียน', 'ลำไย', 'ส้ม', 'องุ่น'] },
    { t: 'กีฬาแต่ละชนิด', w: 'กีฬาชนิดใด', L: ['ฟุตบอล', 'วอลเลย์บอล', 'แบดมินตัน', 'ว่ายน้ำ', 'ปิงปอง', 'บาสเกตบอล'] },
    { t: 'สัตว์เลี้ยงแต่ละชนิด', w: 'สัตว์เลี้ยงชนิดใด', L: ['สุนัข', 'แมว', 'กระต่าย', 'ปลา', 'นก', 'เต่า'] }]);
  var L3 = sample(th3.L, 4), r3 = rowsAll(L3, 3, 9);
  var s3r = byVal(r3, false), hi3 = s3r[0], lo3 = s3r[3], mid3 = s3r[1], two3 = sample(r3, 2);
  var n3 = ri(5, 9) * 2;
  out.push({ f: { k: 'hchart', title: 'แผนภูมิความชื่นชอบต่อ' + th3.t, rows: r3, icon: 'smiley', mode: 'icon',
    key: KEY('smiley', 'icon', 'จำนวนความชื่นชอบ 1 คน'), hint: 'ใช้แผนภูมิดังกล่าวตอบคำถามข้อ 10 - 14' } });
  out.push(Q(th3.w + 'มีความชื่นชอบน้อยที่สุด', lo3[0], hi3[0], mid3[0]));
  out.push(Q(th3.w + 'มีความชื่นชอบเท่ากับ ' + mid3[1] + ' คน', mid3[0], hi3[0], lo3[0]));
  out.push(Q(two3[0][0] + 'และ' + two3[1][0] + 'มีความชื่นชอบรวมกันกี่คน',
    (two3[0][1] + two3[1][1]) + ' คน', (two3[0][1] + two3[1][1] - 1) + ' คน',
    Math.abs(two3[0][1] - two3[1][1]) + ' คน'));
  out.push(Q(IC('smiley', 1) + ' จากรูป ถ้ามีรูป ' + n3 + ' รูป จะมีความชื่นชอบกี่คน',
    n3 + ' คน', (n3 / 2) + ' คน', (n3 - 2) + ' คน'));
  out.push(Q(th3.t.replace('แต่ละชนิด', '') + 'ที่มีความชื่นชอบมากที่สุด ต่างกับที่มีความชื่นชอบน้อยที่สุดเท่าไร',
    (hi3[1] - lo3[1]) + ' คน', (hi3[1] + lo3[1]) + ' คน', (hi3[1] - lo3[1] + 1) + ' คน'));

  /* ---------- กล่อง 4 : แผนภูมิแนวตั้ง ---------- */
  var th4 = pick([
    { t: 'จำนวนปลาที่เลี้ยงในบ่อของ', icon: 'fish', u: 'ตัว', L: ['ปลานิล', 'ปลาตะเพียน', 'ปลาไน', 'ปลาสลิด', 'ปลาดุก', 'ปลาช่อน'] },
    { t: 'จำนวนนกที่เลี้ยงไว้ในกรงของ', icon: 'bird', u: 'ตัว', L: ['นกแก้ว', 'นกเขา', 'นกกระจอก', 'นกขุนทอง', 'นกพิราบ'] },
    { t: 'จำนวนรถที่ขายได้ของร้าน', icon: 'car', u: 'คัน', L: ['สีแดง', 'สีขาว', 'สีดำ', 'สีเทา', 'สีน้ำเงิน'] }]);
  var L4 = sample(th4.L, 4), r4 = rowsAll(L4, 7, 14);
  var s4 = byVal(r4, false), hi4 = s4[0], lo4 = s4[3], a4 = s4[1], b4 = s4[2];
  var die = ri(2, 5);
  out.push({ f: { k: 'vchart', title: 'แผนภูมิ' + th4.t + pick(NM), rows: r4, icon: th4.icon,
    key: KEY(th4.icon, 'icon', 'จำนวน 1 ' + th4.u), hint: 'ใช้แผนภูมิดังกล่าวตอบคำถามข้อ 15 - 19' } });
  out.push(Q('ข้อใดมีจำนวนเท่ากับ ' + a4[1] + ' ' + th4.u, a4[0], hi4[0], lo4[0]));
  out.push(Q(a4[0] + 'มีมากกว่า' + lo4[0] + 'เท่าไร',
    (a4[1] - lo4[1]) + ' ' + th4.u, (a4[1] + lo4[1]) + ' ' + th4.u, (a4[1] - lo4[1] + 1) + ' ' + th4.u));
  out.push(Q('ถ้า' + hi4[0] + 'ลดลงไป ' + die + ' ' + th4.u + ' จะเหลือกี่' + th4.u,
    (hi4[1] - die) + ' ' + th4.u, (hi4[1] + die) + ' ' + th4.u, (hi4[1] - die + 1) + ' ' + th4.u));
  var up4 = coin(), ord4 = up4 ? s4.slice().reverse() : s4;
  var nm4 = function (a) { return joinNames(a.map(function (x) { return x[0]; })); };
  out.push(Q('ข้อใดเรียงลำดับจาก' + (up4 ? 'น้อยไปมาก' : 'มากไปน้อย') + 'ได้ถูกต้อง',
    nm4(ord4), nm4(ord4.slice().reverse()), nm4([ord4[1], ord4[0], ord4[3], ord4[2]])));
  out.push(Q('ข้อใดกล่าวถูกต้อง',
    a4[0] + 'มีมากกว่า' + b4[0] + ' ' + (a4[1] - b4[1]) + ' ' + th4.u,
    lo4[0] + 'มีมากกว่า' + hi4[0] + ' ' + (hi4[1] - lo4[1]) + ' ' + th4.u,
    b4[0] + 'มีน้อยกว่า' + lo4[0] + ' ' + (b4[1] - lo4[1]) + ' ' + th4.u));

  /* ---------- กล่อง 5 : รอยขีดนับ ของที่ขายได้ ---------- */
  var th5 = pick([
    { t: 'เครื่องเขียนที่ขายได้ในหนึ่งสัปดาห์', u: 'ชิ้น', w: 'เครื่องเขียนชนิดใด', L: ['ดินสอ', 'ยางลบ', 'ไม้บรรทัด', 'สมุด', 'ปากกา', 'กบเหลาดินสอ'] },
    { t: 'ผลไม้ที่ขายได้ในหนึ่งวัน', u: 'ผล', w: 'ผลไม้ชนิดใด', L: ['ส้ม', 'กล้วย', 'มะม่วง', 'องุ่น', 'แอปเปิล', 'ชมพู่'] },
    { t: 'เครื่องดื่มที่ขายได้ในหนึ่งวัน', u: 'แก้ว', w: 'เครื่องดื่มชนิดใด', L: ['นมสด', 'น้ำส้ม', 'ชาเย็น', 'กาแฟ', 'น้ำเปล่า', 'โกโก้'] }]);
  var L5 = sample(th5.L, 5), r5 = rowsAll(L5, 3, 18);
  var s5 = byVal(r5, false), hi5 = s5[0], lo5 = s5[4], m5 = s5[2], two5 = [s5[3], s5[4]];
  out.push({ f: { k: 'hchart', title: 'แผนภูมิจำนวน' + th5.t, rows: r5, icon: null, mode: 'tally',
    key: KEY(null, 'tally', 'จำนวนที่ขายได้ 1 ' + th5.u), hint: 'ใช้แผนภูมิดังกล่าวตอบคำถามข้อ 20 - 25' } });
  out.push(Q('จาก <i data-tl="1"></i> แทนจำนวนที่ขายได้กี่' + th5.u,
    '1 ' + th5.u, '2 ' + th5.u, '5 ' + th5.u));
  out.push(Q(th5.w + 'ขายได้เท่ากับ ' + m5[1] + ' ' + th5.u, m5[0], hi5[0], lo5[0]));
  out.push(Q(th5.w + 'ขายได้น้อยที่สุด', lo5[0], hi5[0], m5[0]));
  out.push(Q(two5[0][0] + 'และ' + two5[1][0] + 'ขายได้ทั้งหมดเท่าไร',
    (two5[0][1] + two5[1][1]) + ' ' + th5.u, Math.abs(two5[0][1] - two5[1][1]) + ' ' + th5.u,
    (two5[0][1] + two5[1][1] + 1) + ' ' + th5.u));
  out.push(Q(hi5[0] + 'ขายได้มากกว่า' + m5[0] + 'เท่าไร',
    (hi5[1] - m5[1]) + ' ' + th5.u, (hi5[1] + m5[1]) + ' ' + th5.u, (hi5[1] - m5[1] + 1) + ' ' + th5.u));
  out.push(Q(lo5[0] + 'ขายได้น้อยกว่า' + s5[1][0] + 'เท่าไร',
    (s5[1][1] - lo5[1]) + ' ' + th5.u, (s5[1][1] + lo5[1]) + ' ' + th5.u, (s5[1][1] - lo5[1] + 1) + ' ' + th5.u));

  /* ---------- กล่อง 6 : แนวตั้ง มีค่าเท่ากัน 3 ตัว ---------- */
  var th6 = pick([
    { t: 'จำนวนเด็กที่เกิดในวันต่าง ๆ ของนักเรียนชั้นประถมศึกษาปีที่ 1/1', u: 'คน', w: 'วันใดบ้าง',
      L: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'], k: 'วัน' },
    { t: 'จำนวนนักเรียนที่ชอบวิชาต่าง ๆ ของชั้นประถมศึกษาปีที่ 1/2', u: 'คน', w: 'วิชาใดบ้าง',
      L: ['ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'สังคมศึกษา', 'ภาษาอังกฤษ'], k: 'วิชา' }]);
  var L6 = th6.L.slice(0, th6.L.length === 7 ? 7 : 5), r6 = rowsTrio(L6, 4, 10);
  var tr = equalTrio(r6), rest6 = r6.filter(function (x) { return x[1] !== tr.v; });
  var s6 = byVal(r6, false), hi6 = s6[0], lo6 = s6[s6.length - 1];
  if (hi6[1] === lo6[1]) { r6 = rowsTrio(L6, 4, 10); tr = equalTrio(r6); rest6 = r6.filter(function (x) { return x[1] !== tr.v; }); s6 = byVal(r6, false); hi6 = s6[0]; lo6 = s6[s6.length - 1]; }
  var three = r6.slice(0, 3), add6 = ri(2, 4);
  /* ตัวหลอกต้องมีชื่อที่ค่าไม่เท่ากับ tr.v อย่างน้อยหนึ่งชื่อ ไม่งั้นจะกลายเป็นคำตอบที่ถูกอีกข้อ */
  var others6 = rest6.map(function (x) { return x[0]; });
  var wrongTrio = function () {
    var k = ri(1, Math.min(2, others6.length));
    return joinNames(shuffle(sample(others6, k).concat(sample(tr.names, 3 - k))));
  };
  out.push({ f: { k: 'vchart', title: 'แผนภูมิ' + th6.t, rows: r6, icon: 'smiley',
    key: KEY('smiley', 'icon', 'จำนวน 1 คน'), hint: 'ใช้แผนภูมิดังกล่าวตอบคำถามข้อ 26 - 30' } });
  out.push(Q(th6.w + 'มีจำนวนเท่ากับ ' + tr.v + ' คน', joinNames(tr.names), wrongTrio(), wrongTrio()));
  out.push(Q(hi6[0] + 'มีมากกว่า' + lo6[0] + 'เท่าไร',
    (hi6[1] - lo6[1]) + ' คน', (hi6[1] + lo6[1]) + ' คน', (hi6[1] - lo6[1] + 1) + ' คน'));
  out.push(Q(three.map(function (x) { return x[0]; }).join(' ') + ' มีจำนวนรวมกันทั้งหมดเท่าไร',
    total(three) + ' คน', (total(three) - 1) + ' คน', (total(three) + 1) + ' คน'));
  out.push(Q('ถ้า' + lo6[0] + 'มีเพิ่มอีก ' + add6 + ' คน จะมีจำนวนเท่าไร',
    (lo6[1] + add6) + ' คน', (lo6[1] + add6 - 1) + ' คน', (lo6[1] - add6) + ' คน'));
  var x6 = rest6[0] || r6[0], y6 = tr.names[0], yv = tr.v;
  out.push(Q(x6[0] + 'รวมกับ' + y6 + ' มากกว่า' + lo6[0] + 'กี่คน',
    (x6[1] + yv - lo6[1]) + ' คน', (x6[1] + yv) + ' คน', (x6[1] + yv - lo6[1] + 1) + ' คน'));
  return out;
}];

/* ============================================================
   บทที่ 7  การวัดน้ำหนัก   (1 กิโลกรัม = 10 ขีด)
   ============================================================ */
function wt(kg) {                      /* กิโลกรัมทศนิยม 1 ตำแหน่ง -> ข้อความไทย */
  var t = Math.round(kg * 10), k = Math.floor(t / 10), d = t % 10;
  if (k === 0) return d + ' ขีด';
  if (d === 0) return k + ' กิโลกรัม';
  return k + ' กิโลกรัม ' + d + ' ขีด';
}
var HEAVY = [['ฟักทอง', 18], ['แตงโม', 14], ['ขนุน', 19], ['สับปะรด', 16], ['มะพร้าว', 13], ['ฟักเขียว', 17],
             ['น้ำเต้า', 9], ['ทุเรียน', 15], ['ลูกจัน', 11]];
var LIGHT = ['มะนาว', 'ส้ม', 'แอปเปิล', 'ฝรั่ง', 'มะม่วง', 'สับปะรด', 'แคนตาลูป', 'ส้มโอ', 'กล้วยหอม', 'มะละกอ'];
var VEG = ['แตงกวา', 'มะเขือเทศ', 'หอมแดง', 'กระเทียม', 'ขิง', 'ข่า', 'ถั่วฝักยาว', 'ข้าวโพด', 'หน่อไม้', 'พริก', 'มะนาว'];
var SEA = ['กุ้ง', 'ปลา', 'หมึก', 'หอย', 'ปู'];

var G7 = [function () {
  var out = [], i;
  /* 1 คานชั่ง */
  var f = two(LIGHT), heavier = coin() ? 'L' : 'R';
  var lname = f[0], rname = f[1];
  var lHeavy = heavier === 'L';
  out.push(Q('จากรูป ข้อใดถูกต้อง',
    lname + (lHeavy ? 'หนักกว่า' : 'เบากว่า') + rname,
    lname + (lHeavy ? 'เบากว่า' : 'หนักกว่า') + rname,
    lname + 'หนักเท่ากับ' + rname,
    { k: 'balance', l: lname, r: rname, h: heavier }));
  /* 2 ขีด -> กิโลกรัม */
  var t2 = ri(11, 29);
  out.push(Q(t2 + ' ขีด เท่ากับเท่าไร', wt(t2 / 10), Math.floor(t2 / 10) + ' กิโลกรัม', (t2 % 10) + ' กิโลกรัม'));
  /* 3-4 ของหนัก 3 อย่าง (คู่กัน) */
  var h3 = sample(HEAVY, 3), hv = h3.slice().sort(function (a, b) { return b[1] - a[1]; });
  var most = coin();
  out.push(Q('&quot;' + h3.map(function (x) { return x[0] + 'หนัก ' + x[1] + ' กิโลกรัม'; }).join(' ') +
    '&quot; ข้อใด' + (most ? 'หนัก' : 'เบา') + 'ที่สุด',
    most ? hv[0][0] : hv[2][0], hv[1][0], most ? hv[2][0] : hv[0][0]));
  out.push(Q('จากข้อ 3 ' + hv[0][0] + 'หนักกว่า' + hv[2][0] + 'เท่าไร',
    (hv[0][1] - hv[2][1]) + ' กิโลกรัม', (hv[0][1] - hv[2][1] + 1) + ' กิโลกรัม', (hv[0][1] + hv[2][1]) + ' กิโลกรัม'));

  /* 5-9 ตาชั่ง 4 เครื่อง */
  var names4 = sample(LIGHT, 4), w4 = [], v, g = 0;
  while (w4.length < 4 && g++ < 500) { v = ri(4, 45) / 10; if (w4.indexOf(v) < 0) w4.push(v); }
  var it = names4.map(function (n, i2) { return [w4[i2], n]; });
  var sorted = it.slice().sort(function (a, b) { return b[0] - a[0]; });
  var p5 = sample(it, 2);
  out.push({ f: { k: 'scales', items: it, hint: 'ใช้รูปต่อไปนี้ตอบคำถามข้อ 5 - 9', title: null } });
  out.push(Q(it[1][1] + 'หนักเท่าไร', wt(it[1][0]),
    Math.round(it[1][0] * 10) + ' กิโลกรัม', wt(it[1][0] + 0.1)));
  out.push(Q(it[2][1] + 'หนักเท่าไร', wt(it[2][0]),
    wt(it[2][0] + 0.1), Math.round(it[2][0] * 10) + ' กิโลกรัม'));
  out.push(Q('ผลไม้อะไรมีน้ำหนักมากที่สุด', sorted[0][1], sorted[3][1], sorted[1][1]));
  out.push(Q(sorted[0][1] + 'มีน้ำหนักมากกว่า' + sorted[1][1] + 'เท่าไร',
    wt(sorted[0][0] - sorted[1][0]), wt(sorted[0][0] + sorted[1][0]), wt(sorted[0][0] - sorted[1][0] + 0.1)));
  out.push(Q(sorted[3][1] + 'หนักน้อยกว่า' + sorted[2][1] + 'เท่าไร',
    wt(sorted[2][0] - sorted[3][0]), wt(sorted[2][0] + sorted[3][0]), wt(sorted[2][0] - sorted[3][0] + 0.1)));

  /* 10-15 ตารางน้ำหนักเด็ก 4 คน (2 คนเป็นกิโลกรัม 2 คนเป็นขีด) */
  var p4 = names(4), kgv = [], dv = [];
  while (kgv.length < 2) { v = ri(5, 12); if (kgv.indexOf(v) < 0) kgv.push(v); }
  while (dv.length < 2) { v = ri(12, 45); if (dv.indexOf(v) < 0) dv.push(v); }
  var rowsT = [[p4[0], kgv[0] + ' กิโลกรัม'], [p4[1], kgv[1] + ' กิโลกรัม'],
               [p4[2], dv[0] + ' ขีด'], [p4[3], dv[1] + ' ขีด']];
  var kgHi = kgv[0] > kgv[1] ? 0 : 1, kgLo = 1 - kgHi, dHi = dv[0] > dv[1] ? 2 : 3, dLo = 5 - dHi;
  var add1 = ri(3, 8), cut1 = ri(2, Math.min(4, kgv[kgHi] - 1));
  out.push({ f: { k: 'table', title: 'ตารางน้ำหนักของเด็ก 4 คน', head: ['ชื่อ', 'น้ำหนัก'], rows: rowsT,
    hint: 'ใช้ตารางดังกล่าวตอบคำถามข้อ 10 - 15' } });
  out.push(Q('ใครมีน้ำหนักมากที่สุด', p4[kgHi], p4[kgLo], p4[dHi]));
  out.push(Q(p4[kgLo] + 'มีน้ำหนักน้อยกว่า' + p4[kgHi] + 'เท่าไร',
    (kgv[kgHi] - kgv[kgLo]) + ' กิโลกรัม', (kgv[kgHi] + kgv[kgLo]) + ' กิโลกรัม',
    (kgv[kgHi] - kgv[kgLo] + 1) + ' กิโลกรัม'));
  out.push(Q(p4[dLo] + 'มีน้ำหนักน้อยกว่า' + p4[dHi] + 'เท่าไร',
    (dv[dHi - 2] - dv[dLo - 2]) + ' ขีด', (dv[dHi - 2] + dv[dLo - 2]) + ' ขีด',
    (dv[dHi - 2] - dv[dLo - 2] + 1) + ' ขีด'));
  out.push(Q(p4[0] + 'และ' + p4[1] + 'มีน้ำหนักรวมกันเท่าไร',
    (kgv[0] + kgv[1]) + ' กิโลกรัม', Math.abs(kgv[0] - kgv[1]) + ' กิโลกรัม', (kgv[0] + kgv[1] + 1) + ' กิโลกรัม'));
  out.push(Q('ถ้า' + p4[2] + 'มีน้ำหนักเพิ่มจากเดิม ' + add1 + ' ขีด ' + p4[2] + 'จะมีน้ำหนักเท่าไร',
    (dv[0] + add1) + ' ขีด', (dv[0] - add1) + ' ขีด', (dv[0] + add1 + 1) + ' ขีด'));
  out.push(Q('ถ้า' + p4[kgHi] + 'มีน้ำหนักลดลงจากเดิม ' + cut1 + ' กิโลกรัม ' + p4[kgHi] + 'จะมีน้ำหนักเท่าไร',
    (kgv[kgHi] - cut1) + ' กิโลกรัม', (kgv[kgHi] + cut1) + ' กิโลกรัม', (kgv[kgHi] - cut1 + 1) + ' กิโลกรัม'));

  /* 16 เทียบขีด */
  var a16 = ri(12, 19), b16 = ri(3, 9), r16 = two(['ข้าวสาร', 'ข้าวกล้อง', 'ข้าวเหนียว', 'ข้าวหอมมะลิ', 'ถั่วเขียว', 'ถั่วดำ']);
  out.push(Q(r16[0] + 'หนัก ' + a16 + ' ขีด ' + r16[1] + 'หนัก ' + b16 + ' ขีด ' + r16[0] + 'หนักกว่า' + r16[1] + 'เท่าไร',
    (a16 - b16) + ' ขีด', (a16 + b16) + ' ขีด', (a16 - b16 + 1) + ' ขีด'));

  /* 17-19 ตาชั่งสองใบ ลูกศร */
  var s2 = two(SEA), tot = ri(13, 19), one = ri(6, tot - 5);
  out.push({ f: { k: 'arrow', a: [tot / 10, s2[0] + 'และ' + s2[1] + 'หนัก ......... ขีด'],
    b: [one / 10, s2[0] + 'หนัก ......... ขีด'], hint: 'จากรูปภาพ จงตอบคำถามข้อ 17 - 19' } });
  out.push(Q(s2[0] + 'และ' + s2[1] + 'หนักเท่าไร', tot + ' ขีด', (tot - 10) + ' ขีด', (tot + 10) + ' ขีด'));
  out.push(Q(s2[0] + 'หนักเท่าไร', one + ' ขีด', (one + 1) + ' ขีด', (one - 1) + ' ขีด'));
  out.push(Q(s2[1] + 'หนักเท่าไร', (tot - one) + ' ขีด', (tot + one) + ' ขีด', (tot - one + 1) + ' ขีด'));

  /* 20 ย้อนกลับ */
  var sell = ri(5, 9), left = ri(3, 9), vg = pick(VEG), pn = names(1)[0];
  out.push(Q(pn + 'มี' + vg + 'ถุงหนึ่ง แบ่งขายไป ' + sell + ' ขีด เหลืออยู่ ' + left +
    ' ขีด เดิม' + vg + 'ถุงนี้หนักเท่าใด',
    (sell + left) + ' ขีด', Math.abs(sell - left) + ' ขีด', (sell + left + 1) + ' ขีด'));

  /* 21 อ่านตาชั่งแล้วหาส่วนที่เหลือ */
  var shown = ri(2, 4), sum21 = shown + ri(2, 5), v2 = two(VEG);
  out.push(Q(v2[0] + 'และ' + v2[1] + 'มีน้ำหนักรวมกัน ' + sum21 + ' กิโลกรัม ถ้า' + v2[0] +
    'มีน้ำหนักดังรูป ' + v2[1] + 'จะมีน้ำหนักเท่าใด',
    (sum21 - shown) + ' กิโลกรัม', (sum21 + shown) + ' กิโลกรัม', shown + ' กิโลกรัม',
    { k: 'dial', kg: shown, label: v2[0] }));

  /* 22 ตักออก */
  var want = ri(4, 8), got = want + ri(2, 5), stuff = pick(['ทราย', 'ปูน', 'ดิน', 'ข้าวสาร', 'น้ำตาล']);
  out.push(Q(names(1)[0] + 'ต้องการ' + stuff + ' ' + want + ' กิโลกรัม แม่ค้าตักทั้งหมด ' + got +
    ' กิโลกรัม แม่ค้าต้องตัก' + stuff + 'ออกกี่กิโลกรัม',
    (got - want) + ' กิโลกรัม', (got + want) + ' กิโลกรัม', want + ' กิโลกรัม'));

  /* 23 รวมกันแล้วหาอีกส่วน */
  var v3 = two(VEG), tot23 = ri(14, 19), one23 = ri(6, tot23 - 5);
  out.push(Q(v3[0] + 'กับ' + v3[1] + 'หนักรวมกัน ' + tot23 + ' ขีด ' + v3[0] + 'หนัก ' + one23 + ' ขีด ' + v3[1] + 'หนักเท่าใด',
    (tot23 - one23) + ' ขีด', (tot23 - one23) + ' กิโลกรัม', (tot23 + one23) + ' ขีด'));

  /* 24-25 โซ่สามคน (คู่กัน) */
  var p3 = names(3), base = ri(8, 12), d1 = ri(2, 4), d2 = ri(3, 5);
  var mid = base - d1, top = mid + d2;      /* p3[2]=base, p3[1]=mid, p3[0]=top */
  out.push(Q(p3[0] + 'หนักกว่า' + p3[1] + ' ' + d2 + ' กิโลกรัม ' + p3[1] + 'หนักน้อยกว่า' + p3[2] + ' ' + d1 +
    ' กิโลกรัม ' + p3[2] + 'หนัก ' + base + ' กิโลกรัม ' + p3[0] + 'หนักเท่าไร',
    top + ' กิโลกรัม', mid + ' กิโลกรัม', (base + d2) + ' กิโลกรัม'));
  var order = [[p3[0], top], [p3[1], mid], [p3[2], base]].sort(function (a, b) { return a[1] - b[1]; });
  out.push(Q('จากข้อ 24 ใครมีน้ำหนักน้อยที่สุด', order[0][0], order[2][0], order[1][0]));

  /* 26 ข้อใดมีน้ำหนักเท่ากับ N กิโลกรัม */
  var n26 = ri(3, 6), f26 = sample(LIGHT.concat(VEG), 3), gv = ri(2, 4);
  out.push(Q('ข้อใดมีน้ำหนักเท่ากับ ' + n26 + ' กิโลกรัม',
    pick(REL) + 'มี' + f26[0] + ' ' + (n26 + gv) + ' กิโลกรัม ขายไป ' + gv + ' กิโลกรัม',
    pick(REL) + 'มี' + f26[1] + ' ' + n26 + ' กิโลกรัม ซื้อมาเพิ่มอีก ' + gv + ' กิโลกรัม',
    pick(REL) + 'มี' + f26[2] + ' ' + (n26 + gv) + ' กิโลกรัม ซื้อมาเพิ่มอีก ' + gv + ' กิโลกรัม'));

  /* 27 เหลือกี่ขีด */
  var a27 = ri(9, 19), b27 = ri(3, a27 - 3), v27 = pick(VEG), cook = pick(['ทำแกง', 'ผัด', 'ต้ม', 'ทอด']);
  out.push(Q('น้องมี' + v27 + ' ' + a27 + ' ขีด นำไป' + cook + ' ' + b27 + ' ขีด น้องจะเหลือ' + v27 + 'เท่าไร',
    (a27 - b27) + ' ขีด', (a27 + b27) + ' ขีด', (a27 - b27 + 1) + ' ขีด'));

  /* 28 บวกแล้วลบ */
  var a28 = ri(12, 16), b28 = ri(3, 6), c28 = ri(a28 + 1, a28 + b28 - 1);
  var g28 = pick(['น้ำตาลปี๊บ', 'น้ำผึ้ง', 'กะปิ', 'น้ำปลา']);
  out.push(Q(names(1)[0] + 'ทำ' + g28 + ' ' + a28 + ' กิโลกรัม และซื้อมาเพิ่มอีก ' + b28 +
    ' กิโลกรัม นำไปขาย ' + c28 + ' กิโลกรัม จะเหลือ' + g28 + 'เท่าใด',
    (a28 + b28 - c28) + ' กิโลกรัม', (a28 + b28 - c28 + 1) + ' กิโลกรัม', (c28 - a28) + ' กิโลกรัม'));

  /* 29-30 ลูกสัตว์สองตัว (คู่กัน) */
  var an2 = two(ANI), a29 = ri(2, 6), d29 = ri(3, 8);
  out.push(Q('ลูก' + an2[0][0] + 'หนัก ' + a29 + ' กิโลกรัม ลูก' + an2[1][0] + 'หนักกว่าลูก' + an2[0][0] + ' ' + d29 +
    ' กิโลกรัม ลูก' + an2[1][0] + 'หนักกี่กิโลกรัม',
    (a29 + d29) + ' กิโลกรัม', Math.abs(a29 - d29) + ' กิโลกรัม', (a29 + d29 + 1) + ' กิโลกรัม'));
  out.push(Q('จากข้อ 29 ลูก' + an2[0][0] + 'และลูก' + an2[1][0] + 'มีน้ำหนักรวมกันเท่าไร',
    (a29 + a29 + d29) + ' กิโลกรัม', (a29 + d29) + ' กิโลกรัม', (a29 + a29 + d29 + 1) + ' กิโลกรัม'));
  return out;
}];

/* ============================================================
   ซ่อมและตรวจข้อสอบก่อนส่งออก
   ============================================================ */
function optNum(x) { var m = /^(\d+)([\s\S]*)$/.exec(String(x)); return m ? { n: +m[1], u: m[2] } : null; }
/* ตัวเลือกที่เป็นตัวเลข: ห้ามซ้ำ ห้ามติดลบ และห้ามเป็นศูนย์ถ้าคำตอบไม่ใช่ศูนย์ */
function repair(q) {
  var o = q[1], p = [optNum(o[0]), optNum(o[1]), optNum(o[2])], used, i, v, k;
  if (!p[0] || !p[1] || !p[2]) return q;
  /* ถ้าส่วนท้ายไม่เหมือนกัน แปลว่าไม่ใช่ "ตัวเลข + หน่วย" อย่าไปยุ่ง เดี๋ยวเฉลยเพี้ยน */
  if (p[0].u !== p[1].u || p[1].u !== p[2].u) return q;
  used = [p[0].n];
  for (i = 1; i < 3; i++) {
    v = p[i].n;
    if (v < 0 || (v === 0 && p[0].n !== 0) || used.indexOf(v) >= 0) {
      k = 1;
      while (used.indexOf(p[0].n + k) >= 0 || p[0].n + k <= 0) k++;
      v = p[0].n + k;
      o[i] = v + p[i].u;
    }
    used.push(v);
  }
  return q;
}
function okQ(q) {
  var o = q[1], i, j;
  if (!q[0] || /undefined|NaN/.test(String(q[0]))) return false;
  for (i = 0; i < 3; i++) {
    if (o[i] === undefined || o[i] === '' || /undefined|NaN/.test(String(o[i]))) return false;
    for (j = i + 1; j < 3; j++) if (String(o[i]) === String(o[j])) return false;
  }
  return true;
}

/* ============================================================
   ประกอบเป็นบท
   ============================================================ */
var TITLES = ['บทที่ 1 จำนวนนับ 1-10 และ 0',
  'บทที่ 2 การบวกจำนวนสองจำนวนที่ผลบวกไม่เกิน 10',
  'บทที่ 3 การลบจำนวนสองจำนวนที่มีตัวตั้งไม่ถึง 10',
  'บทที่ 4 จำนวนนับ 11 ถึง 20',
  'บทที่ 5 การบวก ลบจำนวนนับไม่เกิน 20',
  'บทที่ 6 แผนภูมิรูปภาพ',
  'บทที่ 7 การวัดน้ำหนัก'];
var GS = [G1, G2, G3, G4, G5, G6, G7];

function chapter(ci) {
  var out = [], slots = GS[ci], i, t, r, list, qs;
  for (i = 0; i < slots.length; i++) {
    for (t = 0; t < 30; t++) {
      r = slots[i]();
      list = (typeof r[0] === 'string' && Array.isArray(r[1])) ? [r] : r;
      qs = list.filter(function (x) { return Array.isArray(x); });
      qs.forEach(repair);
      if (qs.every(okQ)) break;
    }
    list.forEach(function (x) { out.push(x); });
  }
  return out;
}

root.MATHGEN = { chapter: chapter, TITLES: TITLES };
})(typeof window !== 'undefined' ? window : this);
