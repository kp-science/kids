# ไลบรารีที่เก็บไว้ในเว็บเอง

เก็บไว้ที่นี่เพื่อให้เว็บ **เล่นได้ตอนไม่มีอินเทอร์เน็ต** และเปิดเร็วขึ้น (เดิมโหลดจาก jsDelivr / Google Fonts ทุกครั้ง)

| โฟลเดอร์ | ของอะไร | รุ่น | ที่มา |
|---|---|---|---|
| `three/` | three.js + addon 2 ตัว (OrbitControls, RoundedBoxGeometry) | 0.170.0 | `cdn.jsdelivr.net/npm/three@0.170.0` · MIT |
| `blockly/` | Blockly core + blocks + generator JavaScript + ข้อความไทย | 12.3.1 | `cdn.jsdelivr.net/npm/blockly@12.3.1` · Apache-2.0 |
| `fonts/` | Mali · Noto Sans Thai Looped · Sarabun · Andika (ชุดย่อย thai/latin/latin-ext) | — | Google Fonts · SIL OFL 1.1 |

**เวลาจะอัปรุ่น**: โหลดไฟล์ใหม่มาทับ แล้วแก้เลขรุ่นใน `vendor/README.md` กับ importmap ในหน้าที่ใช้
(หน้า 3 มิติทุกหน้าใช้ `../vendor/three/...` · `stem/code.html` ใช้ `../vendor/blockly/...`)
จากนั้นรัน `node tools/gen-sw.js` เพื่ออัปเดตรายการไฟล์ใน `sw.js`

**ฟอนต์**: ถ้าจะเพิ่มน้ำหนัก (weight) หรือฟอนต์ใหม่ ต้องโหลด woff2 มาเพิ่มเองแล้วเขียน `@font-face` ใน `fonts/fonts.css`
