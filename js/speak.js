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
const ANON = '(?:the|a|an|one of|someone|somebody|another|her|his|their)\\b[a-z\' -]{0,30}';
const ANON_AFTER = new RegExp('^[,.!?]?\\s*(?:' + SAY + '\\s+' + ANON + '|' + ANON + '\\s+' + SAY + '\\b)', 'i');
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
  // the last (first) person named in t who is not named in the line itself: nobody names themselves, so the one named in it is spoken about
  const named = (n, inner) => new RegExp('\\b' + esc(n) + '\\b').test(inner);
  const last = (t, inner) => { let m, r = null; re.lastIndex = 0; while ((m = re.exec(t))) if (!named(m[1], inner)) r = m[1]; return r; };
  const first = (t, inner) => { let m; re.lastIndex = 0; while ((m = re.exec(t))) if (!named(m[1], inner)) return m[1]; return null; };
  // a short line ("Pick one," Nolan says) is only anyone's with the name right beside it
  const tag = new RegExp('^[,.!?]?\\s*(?:(' + names.map(esc).join('|') + ')\\s+' + SAY + '|' + SAY + '\\s+(' + names.map(esc).join('|') + '))\\b');
  const tagB = new RegExp('\\b(' + names.map(esc).join('|') + ')\\b[^."]{0,50}\\s' + SAY + '[,:]?\\s*$');   // Nolan stands in the bay, says ...
  const beside = (pre, post) => { const a = tag.exec(post); if (a) return a[1] || a[2]; const b = tagB.exec(pre); return b ? b[1] : null; };
  const segs = []; let carry = null;
  for (const para of text.split(/(\n+)/)) {
    if (!para || /^\n+$/.test(para)) { if (para) segs.push({ t: para }); continue; }
    const q = /"[^"]+"/g; let m, at = 0, prev = null;
    while ((m = q.exec(para))) {
      const inner = m[0].slice(1, -1), pre = para.slice(at, m.index), post = para.slice(m.index + m[0].length, m.index + m[0].length + 60).split('"')[0];
      let name = null, mine = false; const talk = /[.!?,\u2026-]$/.test(inner.trim()), known = talk ? LF.lineSeat(inner) : null;
      if (talk && inner.length < 12 && !known) { name = beside(pre, post); if (name && named(name, inner)) name = null; }
      else if (talk && !ANON_AFTER.test(post) && !ANON_BEFORE.test(pre)) {
        name = beside(pre, post) || last(pre, inner) || first(post.slice(0, 40), inner) || (prev && pre.trim().length < 4 && !named(prev, inner) ? prev : null) || (at === 0 && !pre.trim() && carry && !named(carry, inner) ? carry : null); mine = !name; }
      if (pre) segs.push({ t: pre });
      // a line in LF.ALT_VOICE is an officer's whoever the prose seems to name; any other spoken line nobody of the twelve owns is grey (sp-other)
      segs.push(known ? { t: m[0], seat: known, who: name && who[name] === known ? name : '' } : name && who[name] ? { t: m[0], seat: who[name], who: name }
        : mine && dflt && LF.SEATS[dflt] ? { t: m[0], seat: dflt, who: '' } : talk ? { t: m[0], other: true } : { t: m[0] });
      prev = name; at = m.index + m[0].length;
    }
    if (at < para.length) segs.push({ t: para.slice(at) });
    // the next paragraph may open on a quote: it is this one's officer's only if this paragraph names one person and no other
    const all = new Set(); { let x; re.lastIndex = 0; while ((x = re.exec(para.replace(/"[^"]+"/g, ' ')))) all.add(x[1]); }
    carry = all.size === 1 && who[[...all][0]] ? [...all][0] : all.size ? null : carry;
  }
  return segs.length ? segs : out;
};

/* The seat that speaks a card's unattributed lines: the storylet's says, a seat or a function (s, ctx) of the card. */
LF.saysOf = function (s) { const st = s && s.cur && LF.byId[s.cur.id], v = st && st.says; return typeof v === 'function' ? v(s, s.cur.ctx || {}) : v; };

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
/* Whose line a quote is, by the table alone: the seat whose src or alt it matches, or null (and null if two seats claim it). */
let OWN = null;
LF.lineSeat = function (inner) {
  if (!LF.ALT_VOICE) return null;
  if (!OWN) { OWN = []; for (const e of LF.ALT_VOICE) for (const src of [e.src.slice(1, -1), e.alt]) { const a = cut(src), head = plain(a.parts[0]).slice(0, 6);
      if (a.parts.join('').replace(/\W/g, '').length < 10) continue;   // too little fixed text to know it by ("${...}.")
      OWN.push({ seat: e.seat, head, re: new RegExp('^' + a.parts.map(x => esc2(plain(x))).join('[\\s\\S]*?') + '$') }); } }
  let hit = null; for (const e of OWN) { if (e.head && inner.slice(0, e.head.length) !== e.head) continue;
    if (e.re.test(inner)) { if (hit && hit !== e.seat) return null; hit = e.seat; } }
  return hit;
};
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

/* ---------- Who is speaking (Lachlan, 2026-11-19; DESIGN.md "Who is speaking") ----------
   A line of speech on a card is its own paragraph, opened by a tag that says who says it:
     [[engineer]] "They'll run. Each one's a heater and a pump."      a seat or old role key: the officer at the post; if the seat is
                                                                      empty or its officer away, the colonist who stands in for it
     [[${c.pid}]] "Because I know what it'll say."                    a person in the game, by id (p12)
     [[x05]] "Fourteen-hour shifts..."                                one of the roster's forty by key (js/roster.js)
     [[kovacs]] "..."                                                 one of the twelve by cast key, whoever holds the seat
     [[machine:The flight computer]] "Item one complied."            a machine, with what to call it
     [[note:Nailed to the mess door]] "FOR THE ONE IN TEN."          writing, not speech
     [[unknown:A voice on the ship's channel]] "Is anybody there?"   one speaker the colony cannot name (a mystery, never a crowd)
   One paragraph may hold several quoted lines by the same speaker; nothing else goes in it. The UI draws each as a face, a name
   and a bubble; everything else on the card stays narration. The quote marks stay in the source, so LF.revoice still finds them. */
const TAG = /^\[\[([^\]]+)\]\]\s*/;
const crewOf = role => { const R = LF.ROSTER || {}, seat = LF.SEAT_OF[role] || role;
  return Object.values(R).find(r => r.stands === role) || Object.values(R).find(r => r.stands === seat) || null; };
const rosterIn = (s, r) => (s.people || []).find(p => p.rk === r.key) || null;
const gone = p => !!p && (!p.alive || !!p.left);
/* a roster person the story names who is dead or gone in this game: the next of the same band and sex who is not */
function stillHere(s, r) {
  if (!gone(rosterIn(s, r))) return r;
  const all = Object.values(LF.ROSTER || {}).filter(x => x.kind === r.kind && !x.stands && x.band === r.band), i = all.indexOf(r);
  for (let k = 1; k <= all.length; k++) { const x = all[(i + k) % all.length]; if (x.sex === r.sex && !gone(rosterIn(s, x))) return x; }
  for (let k = 1; k <= all.length; k++) { const x = all[(i + k) % all.length]; if (!gone(rosterIn(s, x))) return x; }
  return r; }
const fromRoster = (s, r) => { const p = rosterIn(s, r);
  return { kind: r.kind === 'outsider' ? 'outsider' : 'colonist', name: r.name, first: r.first, post: r.role, rk: r.key, pic: 'art/colonists/' + r.key + '.webp', p }; };
const fromPerson = (s, p) => {
  if (p.key && p.role && p.seat) return { kind: 'officer', name: p.name, first: p.first, post: LF.title(p), seat: p.seat, p };   // the chair's title (LF.SEATS[seat].lead)
  const r = p.rk && LF.ROSTER && LF.ROSTER[p.rk];
  return { kind: 'colonist', name: p.name, first: p.first, post: r ? r.role : (LF.job ? LF.job(p) : 'Colonist'), rk: p.rk || null, pic: r ? 'art/colonists/' + r.key + '.webp' : null, p }; };
LF.speaker = function (s, who) {
  who = String(who || '').trim(); const c = who.indexOf(':'), kind = c > 0 ? who.slice(0, c) : who, label = c > 0 ? who.slice(c + 1).trim() : '';
  if (kind === 'machine' || kind === 'note' || kind === 'unknown') return { kind, name: label || (kind === 'machine' ? 'The ship' : kind === 'note' ? 'Written' : 'A voice'), post: '' };
  if (/^p\d+$/.test(who)) { const p = (s.people || []).find(q => q.id === who); if (p) return fromPerson(s, p); }
  if (LF.ROSTER && LF.ROSTER[who]) return fromRoster(s, stillHere(s, LF.ROSTER[who]));
  for (const seat in LF.CAST) for (const k of LF.CAST[seat]) if (k.key === who) { const p = (s.people || []).find(q => q.key === who && q.alive && q.role);
    return p ? fromPerson(s, p) : { kind: 'officer', name: k.first + ' ' + k.last, first: k.first, post: (LF.SEATS[seat] && LF.SEATS[seat].lead) || k.title, seat, castKey: k.key }; }
  if (LF.SEAT_OF[who] || LF.SEATS[who]) { const p = LF.h.P(s, who); if (p) return fromPerson(s, p);
    const r = crewOf(who); if (r) return fromRoster(s, r); }
  return { kind: 'unknown', name: 'Someone', post: '' };
};
/* The card's text as blocks: { say: speaker, lines: [...] } or { text } (narration). Same speaker twice running is one block. */
LF.talk = function (s, text) {
  const out = [];
  for (const para of String(text || '').split(/\n{2,}/)) {
    const m = TAG.exec(para);
    if (!m) { if (para.trim()) out.push({ text: para }); continue; }
    const rest = para.slice(m[0].length), lines = []; let q; const re = /"([^"]*)"/g;
    while ((q = re.exec(rest))) lines.push(q[1]);
    if (!lines.length && rest.trim()) lines.push(rest.trim());
    const sp = LF.speaker(s, m[1]), prev = out[out.length - 1];
    if (prev && prev.say && prev.tag === m[1]) prev.lines.push(...lines); else out.push({ say: sp, tag: m[1], lines });
  }
  return out;
};
/* Plain text for anywhere a card's words are reused outside the card (the log, the chronicle, the sheet): Name: "line". */
LF.unmark = function (s, text) {
  if (!text || String(text).indexOf('[[') < 0) return text;
  return String(text).split(/(\n{2,})/).map(para => { const m = TAG.exec(para); if (!m) return para;
    const sp = LF.speaker(s, m[1]); return sp.name + ': ' + para.slice(m[0].length); }).join('');
};
LF.SAY_TAG = TAG;
/* The colonist who stands in for a department whose seat is empty or whose officer is away (the roster's `stands`). */
LF.standIn = (s, role) => crewOf(role);
/* The name of a roster person for the narration (${LF.rn(s, 'x05')}): the same one the tag [[x05]] would show, so prose and bubble agree. */
LF.rn = (s, key) => { const r = LF.ROSTER && LF.ROSTER[key]; return r ? stillHere(s, r).name : 'Someone'; };
LF.rf = (s, key) => { const r = LF.ROSTER && LF.ROSTER[key]; return r ? stillHere(s, r).first : 'someone'; };
})();
