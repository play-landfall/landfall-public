/* Landfall — every decision and every outcome has an id (Lachlan, 2026-11-16).
   A card, each of its options and each way an option can come out gets a UUID derived from a readable key, so the
   same option has the same id in every game and on every device, with nothing to keep in step by hand:
     card    'plan.harvest'            -> LF.uid('card:plan.harvest')
     option  'plan.harvest#2'          -> LF.uid('opt:plan.harvest#2')
     outcome 'plan.harvest#2:ok'       -> LF.uid('out:plan.harvest#2:ok')   (ok, bad, or out for an untested option)
   Generated cards are keyed by frame and approach ('gen:<frame>#force'), council build cards by project
   ('plan#shuttle'), pick-several cards by the set picked ('setup.wake1#0+2+5'). Keys go by position for hand-written
   options, which is why a new option on an old card is appended (CLAUDE.md). `node tools/ids.js` writes the whole
   catalogue (tools/decisions.csv) for looking ids up in the sheet.

   LF.picked runs after every choice (core.js LF.choose, gen.js LF.chooseGen, LF.pickConfirm). It notes the pick in
   s.ylog (this year's decisions, for the recap's "what everyone else did") and hands a record to LF.onPick, which the
   UI streams to the play log (js/log.js). Officers who died on the card, or were sent on it, are named by cast key,
   which is the same in every game. No DOM; plain JSON; runs under Node. */
(function () {
'use strict';

/* A 128-bit hash of the key, laid out as an RFC 4122 version 5 style UUID (name-based). Four 32-bit FNV-1a lanes with
   different seeds, then mixed; deterministic and collision-free in practice for a few thousand keys. */
function h32(str, seed) {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
  return h >>> 0;
}
const hex = n => n.toString(16).padStart(8, '0');
const CACHE = {};
/* The deck (2026-11-21): the catalogue was cut to three options a card, so most option positions moved, and the start of the
   game is other cards. Every card, option and outcome id carries the deck's number, so the sheet's counts from the old deck
   are never read as answers to the new one ("the other colonies"). Raise it only when positions move wholesale again. */
LF.DECK = 2;
LF.uid = function (key0) {
  const key = /^(card|opt|out):/.test(key0) ? `deck${LF.DECK}/${key0}` : key0;
  if (CACHE[key]) return CACHE[key];
  const a = hex(h32(key, 0x9e3779b9)), b = hex(h32(key, 0x7f4a7c15)), c = hex(h32(key, 0x94d049bb)), d = hex(h32(key, 0x2545f491));
  const v = (parseInt(c.slice(0, 1), 16) & 0x3 | 0x8).toString(16);
  return (CACHE[key] = `${a}-${b.slice(0, 4)}-5${b.slice(5, 8)}-${v}${c.slice(1, 4)}-${c.slice(4)}${d}`);
};

/* The readable key of the card on screen, and of option i on it. */
LF.cardKey = function (s, cur) {
  cur = cur || s.cur; if (!cur) return '';
  if (cur.plan) return 'plan';
  if (cur.gen) return 'gen:' + cur.id;
  return String(cur.id);
};
LF.optKey = function (s, cur, i, ch, picked) {
  const k = LF.cardKey(s, cur);
  if (picked && picked.length) return `${k}#${picked.slice().sort((a, b) => a - b).join('+')}`;
  if (cur.plan && ch && ch.proj) return `plan#${ch.proj}`;
  if (cur.plan && ch && !ch.proj) return `plan#none`;
  if (cur.gen && ch) return `${k}#${ch.key !== undefined ? ch.key : ch.ap || i}`;
  return `${k}#${i}`;
};
LF.outKey = (optKey, res) => `${optKey}:${res && res.success === true ? 'ok' : res && res.success === false ? 'bad' : 'out'}`;
LF.ids = (cardKey, optKey, outKey) => ({ cid: LF.uid('card:' + cardKey), oid: LF.uid('opt:' + optKey), rid: LF.uid('out:' + outKey) });

/* The card's title as the player sees it. A hand-written card keeps its title on the storylet (title or titleOf), not on
   s.cur, which only a generated card fills: without this the recap's "the other colonies" lines named no card. */
LF.titleOf = function (s) {
  const cur = s.cur; if (!cur) return '';
  if (cur.title) return cur.title;
  const st = !cur.gen && LF.byId && LF.byId[cur.id]; if (!st) return '';
  try { return (st.titleOf ? st.titleOf(s, cur.ctx) : st.title) || ''; } catch (e) { return ''; }
};
/* Who is on the card before it is answered: the officers alive (by cast key), and the ones sent in person. */
LF.beforePick = function (s) {
  const alive = {}; for (const p of s.people || []) if (p.key && p.alive) alive[p.key] = p.id;
  const sent = ((s.cur && s.cur.attach) || []).map(id => (s.people || []).find(p => p.id === id)).filter(p => p && p.key).map(p => p.key);
  return { alive, sent, title: LF.titleOf(s) };
};

/* After a choice. info: { id, i, res, ch, before, picked } */
LF.picked = function (s, info) {
  const cur = s.cur; if (!cur) return null;
  const before = info.before || { alive: {}, sent: [] };
  const ck = LF.cardKey(s, cur), ok = LF.optKey(s, cur, info.i, info.ch, info.picked), rk = LF.outKey(ok, info.res);
  const died = Object.keys(before.alive).filter(k => { const p = (s.people || []).find(x => x.key === k); return p && LF.isDead(p); });
  const rec = Object.assign({ ck, ok, rk, d: s.day, t: before.title || LF.titleOf(s), l: (info.res && info.res.label) || '',
    hit: info.res && info.res.success !== undefined ? !!info.res.success : null, died, sent: before.sent.slice() }, LF.ids(ck, ok, rk));
  // a party sent on this option: anyone who dies with it later is put down to this option (gen.js casualties)
  for (const k of before.sent) { const p = (s.people || []).find(x => x.key === k); if (p && p.alive && p.away) p.src = { ok, oid: rec.oid, t: rec.t, l: rec.l }; }
  s.ylog = (s.ylog || []).filter(e => e.d > s.day - 2 * LF.YEAR);
  s.ylog.push({ ck, ok, t: rec.t, l: rec.l, d: s.day, died, sent: rec.sent, hit: rec.hit, cid: rec.cid, oid: rec.oid });
  try { LF.involve(s, cur, rec, info.res); } catch (e) {}
  if (LF.onPick) try { LF.onPick(s, rec); } catch (e) {}
  return rec;
};
/* What happened to someone here (Lachlan, 2026-11-20: Samuel was caught eating the dead and freed by the hall, and his
   page said nothing). Every choice on a card that names a person (an id anywhere in its ctx, or c.pid), sends an officer
   or kills one goes on that person's own record, p.hist: when, the card, what was chosen, whether it worked, and the
   outcome's first plain sentence. The officer's page and a colonist's entry read it (js/ui.js, "On this world"). */
const HIST_MAX = 24;
const firstLine = text => { const para = String(text || '').split('\n\n').map(x => x.trim()).find(x => x && !/^\[\[/.test(x) && !/^"/.test(x)) || '';
  const m = para.replace(/\s+/g, ' ').match(/^(.{20,200}?[.!?])(\s|$)/); return m ? m[1] : para.slice(0, 200); };
LF.involve = function (s, cur, rec, res) {
  if (!s.people || !cur) return;
  const ids = new Set(), how = {}, said = `${rec.l || ''} ${(res && res.text) || ''}`;
  // a single id is the card's subject; a list is candidates (who rides down, who is accused), so only the ones the choice or its outcome names
  const isId = v => typeof v === 'string' && /^p\d+$/.test(v);
  const named = id => { const p = s.people.find(x => x.id === id); return p && (said.includes(p.name) || (p.first && new RegExp(`\\b${p.first}\\b`).test(said))); };
  const scan = v => { if (isId(v)) ids.add(v); else if (Array.isArray(v)) v.forEach(x => { if (isId(x) && named(x)) ids.add(x); }); };
  scan(cur.pid); if (cur.ctx) for (const k in cur.ctx) scan(cur.ctx[k]);
  for (const id of ids) how[id] = 'named';
  for (const k of rec.sent.concat(rec.died)) { const p = s.people.find(x => x.key === k); if (p) { ids.add(p.id); if (!how[p.id]) how[p.id] = rec.died.includes(k) ? 'died' : 'sent'; } }
  if (!ids.size) return;
  const line = firstLine(res && res.text);
  for (const id of ids) { const p = s.people.find(x => x.id === id); if (!p) continue;
    p.hist = (p.hist || []).filter(e => !(e.d === rec.d && e.t === rec.t));
    p.hist.push({ d: rec.d, t: rec.t || '', l: rec.l || '', hit: rec.hit, how: how[id], o: line });
    if (p.hist.length > HIST_MAX) p.hist.splice(0, p.hist.length - HIST_MAX); }
};
/* An officer who dies later, with a party sent on some option: the play log hears it against that option. */
LF.lateDeath = function (s, p) {
  if (!p || !p.key || !p.src) return;
  const e = (s.ylog || []).slice().reverse().find(x => x.oid === p.src.oid); if (e && !e.died.includes(p.key)) e.died.push(p.key);
  if (LF.onPick) try { LF.onPick(s, { late: true, ck: '', ok: p.src.ok, rk: '', oid: p.src.oid, cid: '', rid: '', t: p.src.t, l: p.src.l, d: s.day, died: [p.key], sent: [], hit: null }); } catch (e2) {}
  p.src = null;
};

/* Every hand-written decision and outcome, for tools/ids.js: [kind, key, uuid, card title, option label]. */
LF.catalogue = function () {
  const rows = [], str = v => typeof v === 'string' ? v : '';
  for (const st of LF.storylets) {
    rows.push(['card', st.id, LF.uid('card:' + st.id), str(st.title), '']);
    (st.choices || []).forEach((ch, i) => { const k = `${st.id}#${i}`;
      rows.push(['option', k, LF.uid('opt:' + k), str(st.title), str(ch.label)]);
      for (const o of ch.test ? ['ok', 'bad'] : ['out']) rows.push(['outcome', `${k}:${o}`, LF.uid(`out:${k}:${o}`), str(st.title), str(ch.label) + ' / ' + o]); });
  }
  for (const f of LF.frames || []) { rows.push(['card', 'gen:' + f.id, LF.uid('card:gen:' + f.id), f.id, '']);
    (f.choices || []).forEach((o, i) => { const k = `gen:${f.id}#${i}`; rows.push(['option', k, LF.uid('opt:' + k), f.id, str(o.l) || o.ap]);
      for (const r of o.out ? ['out'] : ['ok', 'bad']) rows.push(['outcome', `${k}:${r}`, LF.uid(`out:${k}:${r}`), f.id, (str(o.l) || o.ap) + ' / ' + r]); }); }
  for (const id in LF.PROJECTS || {}) { const k = `plan#${id}`; rows.push(['option', k, LF.uid('opt:' + k), 'The build crews', LF.PROJECTS[id].name]); rows.push(['outcome', k + ':out', LF.uid(`out:${k}:out`), 'The build crews', LF.PROJECTS[id].name]); }
  return rows;
};
})();
