/* Landfall — who is speaking (Lachlan, 2026-11-18; DESIGN.md "Whose line it is"). On a card with more than one voice the
   player should see at a glance who said what, so each seat has a colour of its own (js/theme.js, --sp-<seat>), fixed to
   the seat whoever holds it, and a quoted line is tinted with the colour of the officer who says it.
   Card text is plain prose, so the speaker is read off it: LF.speech(s, text) cuts the text into pieces and gives a
   quoted piece a seat when it can tell whose it is. It would sooner leave a line plain than colour it wrongly: a quote
   by someone unnamed ("the boy says"), by a colonist, or with nobody named near it gets no seat.
   How it reads a paragraph: the speaker of a quote is the last person named before it since the quote before; failing
   that, someone named straight after it ("...," Nolan says); failing that, whoever spoke the quote before, if nothing
   but a word or two lies between; and a paragraph that opens on a quote belongs to the officer named in the one before,
   if that paragraph names nobody else. A line that has the supposed speaker's own name in it is left plain.
   A storylet whose unattributed lines all belong to one seat's officer can say so (says: 'scientist'): dflt. No DOM, no state, no dice. */
(function () {
'use strict';
const SAY = '(?:says|said|asks|asked|tells you|told you|calls|called|shouts|shouted|mutters|answers|answered|adds)';
const ANON_AFTER = new RegExp('^[,.]?\\s*(?:' + SAY + '\\s+)?(?:the|a|an|one of|someone|somebody|another|her|his|their)\\b', 'i');
const ANON_BEFORE = new RegExp('\\b(?:the|a|an|one of the|someone|somebody|another)\\s+[a-z\' -]{2,30}\\s+' + SAY + '[,:]?\\s*$', 'i');
const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
LF.speech = function (s, text, dflt) {
  text = String(text || ''); const out = [{ t: text }];
  if (!s || !s.people || text.indexOf('"') < 0) return out;
  const who = {}; for (const seat in LF.CAST) for (const c of LF.CAST[seat]) who[c.first] = seat;   // the twelve, deputies too: one can speak before the chair is theirs
  for (const p of s.people) if (p.first && !(p.first in who)) who[p.first] = '';
  for (const p of s.people) if (p.seat && p.key && p.role) who[p.first] = p.seat;   // the one in the chair wins a shared first name
  const names = Object.keys(who); if (!names.length) return out;
  const re = new RegExp('\\b(' + names.map(esc).join('|') + ')\\b', 'g');
  const last = t => { let m, r = null; re.lastIndex = 0; while ((m = re.exec(t))) r = m[1]; return r; };
  const first = t => { re.lastIndex = 0; const m = re.exec(t); return m ? m[1] : null; };
  const segs = []; let carry = null;
  for (const para of text.split(/(\n+)/)) {
    if (!para || /^\n+$/.test(para)) { if (para) segs.push({ t: para }); continue; }
    const q = /"[^"]+"/g; let m, at = 0, prev = null;
    while ((m = q.exec(para))) {
      const inner = m[0].slice(1, -1), pre = para.slice(at, m.index), post = para.slice(m.index + m[0].length, m.index + m[0].length + 60).split('"')[0];
      let name = null, mine = false;
      if (inner.length >= 12 && /[.!?,]$/.test(inner) && !ANON_AFTER.test(post) && !ANON_BEFORE.test(pre)) {
        name = last(pre) || first(post.slice(0, 40)) || (prev && pre.trim().length < 4 ? prev : null) || (at === 0 && !pre.trim() ? carry : null); mine = !name; }
      if (pre) segs.push({ t: pre });
      if (name && new RegExp('\\b' + esc(name) + '\\b').test(inner)) name = null;   // nobody names themselves: the one named in the line is being spoken about
      segs.push(name && who[name] ? { t: m[0], seat: who[name], who: name } : mine && dflt && LF.SEATS[dflt] ? { t: m[0], seat: dflt, who: '' } : { t: m[0] });
      prev = name; at = m.index + m[0].length;
    }
    if (at < para.length) segs.push({ t: para.slice(at) });
    // the next paragraph may open on a quote: it is this one's officer's only if this paragraph names one person and no other
    const all = new Set(); { let x; re.lastIndex = 0; while ((x = re.exec(para.replace(/"[^"]+"/g, ' ')))) all.add(x[1]); }
    carry = all.size === 1 && who[[...all][0]] ? [...all][0] : all.size ? null : carry;
  }
  return segs.length ? segs : out;
};

/* ---------- the seat's other officer says it their own way (2026-11-18; DESIGN.md "Whose line it is") ----------
   The cards were written when each seat had one officer, so a quoted line there is in that officer's voice. When the
   seat's other officer holds the chair the same card should carry their line. LF.ALT_VOICE (js/voices-alt.js) is a table
   of those lines: { seat, src, alt }, where src is the quote exactly as it stands in the card's source, ${...} and all,
   and alt is the other officer's version with the same ${...} pieces. Nothing in the cards changes: LF.revoice(s, text)
   reads the finished text, and where a quote matches a src whose seat is held by the alternate, puts their line in its
   place with the same values filled in. A line with no entry is left as it was written. No state, no dice. */
const esc2 = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// cut a source string into its static pieces and its ${...} expressions (braces balanced)
function cut(src) { const parts = [], exprs = []; let i = 0, last = 0;
  while (i < src.length) { if (src[i] === '$' && src[i + 1] === '{') { let d = 1, j = i + 2; while (j < src.length && d) { if (src[j] === '{') d++; else if (src[j] === '}') d--; j++; }
      parts.push(src.slice(last, i)); exprs.push(src.slice(i, j)); i = last = j; } else i++; }
  parts.push(src.slice(last)); return { parts, exprs }; }
const plain = x => x.replace(/\\(['"`\\])/g, '$1');
let TABLE = null;
function table() { if (TABLE) return TABLE; TABLE = {};
  for (const e of LF.ALT_VOICE || []) { const a = cut(e.src.slice(1, -1)), b = cut(e.alt);
    const re = new RegExp('^' + a.parts.map(x => esc2(plain(x))).join('([\\s\\S]*?)') + '$'), used = {};
    // each ${...} of the alt line takes the value its twin had in the original, by its text and then by order
    const map = b.exprs.map(x => { let k = -1; do k = a.exprs.indexOf(x, k + 1); while (k >= 0 && used[k]); if (k < 0) k = a.exprs.indexOf(x); if (k >= 0) used[k] = 1; return k; });
    (TABLE[e.seat] = TABLE[e.seat] || []).push({ re, parts: b.parts.map(plain), map, head: plain(a.parts[0]).slice(0, 6) }); }
  return TABLE; }
LF.revoice = function (s, text) {
  if (!s || !s.people || !LF.ALT_VOICE || !text || text.indexOf('"') < 0) return text;
  const seats = LF.SEAT_ORDER.filter(k => { const p = LF.officer(s, k); return p && p.key && LF.CAST[k][0].key !== p.key; });
  if (!seats.length) return text; const T = table();
  return String(text).replace(/"([^"]+)"/g, (whole, inner) => {
    for (const k of seats) for (const e of T[k] || []) { if (e.head && inner.slice(0, e.head.length) !== e.head) continue;
      const m = e.re.exec(inner); if (!m) continue;
      return '"' + e.parts.map((x, i) => x + (i < e.map.length ? (e.map[i] >= 0 ? m[e.map[i] + 1] : '') : '')).join('') + '"'; }
    return whole; });
};
})();
