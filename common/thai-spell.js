/* ============================================================
   สะกดคำไทยให้อ่านออกเสียง (แบบที่ครูโกเมนสอน)
     มี   → มอ · อี · มี
     ปลา  → ปอ · ลอ · อา · ปลา
     หมู  → หมอ · อู · หมู        (ห นำ อ่านรวมเป็น หมอ)
     เลข  → ลอ · เอ · ขอ · เลข
     นม   → นอ · โอะ · มอ · นม     (สระโอะลดรูป)
     ไก่  → กอ · ไอ · ไก · ไม้เอก · ไก่
   ThaiSpell.parts('มี') คืน ['มอ','อี','มี'] · คำหลายพยางค์ที่แยกไม่ได้คืน null
   ThaiSpell.speakText(text) แปลง "ม → มี" และ "เ + ล + ข = เลข" ในข้อความเป็นเสียงสะกด คั่นด้วย |
   ============================================================ */
(function(){
  const TONES = { '่':'ไม้เอก', '้':'ไม้โท', '๊':'ไม้ตรี', '๋':'ไม้จัตวา' };
  const CLUSTER1 = 'กขคตปพผ', CLUSTER2 = 'รลว', LEADH = 'งญนมยรลว';
  const C = '[ก-ฮ]';
  /* แยกพยัญชนะต้น: ควบกล้ำ / ห นำ / อ นำ ย / ตัวเดียว */
  function initial(s){
    if(s[0]==='ห' && LEADH.includes(s[1])) return { len:2, say:['ห'+s[1]+'อ'] };
    if(s[0]==='อ' && s[1]==='ย') return { len:2, say:['อยอ'] };
    if(CLUSTER1.includes(s[0]) && CLUSTER2.includes(s[1]) && s.length > 2) return { len:2, say:[s[0]+'อ', s[1]+'อ'] };
    return { len:1, say:[s[0]+'อ'] };
  }
  /* รูปแบบสระ: I = พยัญชนะต้น, F = ตัวสะกด (ไม่บังคับ) */
  const VOWELS = [
    ['เIียF', 'เอีย'], ['เIือF', 'เอือ'], ['IัวะF', 'อัวะ'], ['IัวF', 'อัว'], ['เIาะ', 'เอาะ'], ['เIา', 'เอา'], ['เIอะ', 'เออะ'], ['เIอ', 'เออ'], ['เIิF', 'เออ'],
    ['เIะ', 'เอะ'], ['เI็F', 'เอะ'], ['เIF', 'เอ'], ['แIะ', 'แอะ'], ['แI็F', 'แอะ'], ['แIF', 'แอ'], ['โIะ', 'โอะ'], ['โIF', 'โอ'], ['ไIF', 'ไอ'], ['ใIF', 'ใอ'],
    ['Iำ', 'อำ'], ['IือF', 'อือ'], ['IืF', 'อือ'], ['IาF', 'อา'], ['IะF', 'อะ'], ['IัF', 'อะ'], ['IิF', 'อิ'], ['IีF', 'อี'], ['IึF', 'อึ'], ['IุF', 'อุ'], ['IูF', 'อู'],
    ['IอF', 'ออ'], ['IF', 'โอะ'],
  ];
  function parts(word){
    word = String(word).trim();
    if(!/^[ก-๛]+$/.test(word)) return null;
    const toneCh = [...word].find(ch => TONES[ch]);
    const bare = [...word].filter(ch => !TONES[ch] && ch !== '์').join('');
    for(const [pat, vowel] of VOWELS){
      const pre = pat.startsWith('เ') || pat.startsWith('แ') || pat.startsWith('โ') || pat.startsWith('ไ') || pat.startsWith('ใ') ? pat[0] : '';
      let s = bare;
      if(pre){ if(s[0] !== pre) continue; s = s.slice(1); }
      if(!/^[ก-ฮ]/.test(s)) continue;
      const ini = initial(s);
      const inner = pat.slice(pre ? 1 : 0).replace(/^I/, '');         /* ส่วนสระหลังพยัญชนะต้น เช่น 'ีF' */
      const needF = inner.endsWith('F'), body = needF ? inner.slice(0, -1) : inner;
      let rest = s.slice(ini.len);
      if(!rest.startsWith(body)) continue;
      rest = rest.slice(body.length);
      if(body==='' && !needF) continue;
      let fin = '';
      if(needF){ if(rest.length > 1 || (rest.length===1 && !/^[ก-ฮ]$/.test(rest))) continue; fin = rest; }
      else if(rest.length) continue;
      if(body==='' && !fin && !pre) continue;                           /* พยัญชนะตัวเดียวไม่ใช่คำ */
      if(vowel==='โอะ' && body==='' && ini.len===2 && ini.say.length===2) continue;
      const out = [...ini.say, vowel];
      if(fin) out.push(fin+'อ');
      if(toneCh){ out.push(bare, TONES[toneCh]); }
      out.push(word);
      return out;
    }
    return null;
  }
  /* แปลงข้อความ: "ปล → ปลา" และ "เ + ล + ข = เลข" / "ไก + ไม้เอก = ไก่" */
  function speakText(text){
    return String(text)
      .replace(/([ก-๛]+)\s*→\s*([ก-๛]+)/g, (m, a, w) => { const p = parts(w); return p ? ' |'+p.join('|')+'| ' : m; })
      .replace(/((?:[ก-๛]+\s*\+\s*)+[ก-๛]+)\s*=\s*([ก-๛]+)/g, (m, a, w) => { const p = parts(w); return p ? ' |'+p.join('|')+'| ' : m; });
  }
  window.ThaiSpell = { parts, speakText };
})();
