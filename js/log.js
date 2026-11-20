/* Landfall — play log. UI only: reads state, never changes it.
   Sends what happens in a game (opened, new game, the star picked, every choice, the end) to a Google Sheet through
   an Apps Script web app (tools/playlog.gs, set up as its header says), so Lachlan can see when friends play, how far
   they get and what they pick. Only the public copy logs (HOSTS): the LAN build and file:// stay quiet. A device is a
   random id kept in localStorage; nothing else about the player is sent. Opening the game once with ?nolog
   turns it off for good on that device (?log turns it back on).
   Events are queued and sent in small batches: every 20 s, and with sendBeacon when the page is hidden or closed.
   At the end of a game one 'summary' goes straight away (outcome, deeds, every hand-written card's pick), and
   LFLog.peers(s) fetches the counts of every finished game (GET ?stats) and words a few lines from them for the end
   screen. The counts are only numbers; every sentence is written here. Reading them works on any host.
   Every choice carries the ids of its card, option and outcome (js/decisions.js) and the officers sent on it and killed
   by it; the script keeps a running count per option in its Decisions tab, which LFLog.year reads for the recap. */
(function () {
'use strict';
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzG3tCApPlnZbpkRwzj3u3XPOVGNY7Cvo5b5PlYTsCZpbMcK8qeBb0mRtt9WaJaXG66/exec';   // the Apps Script web app's /exec URL; empty sends nothing
const HOSTS = /(^|\.)play-landfall\.com$|(^|\.)campbellcraigie\.com$|\.github\.io$/;
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const put = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
if (/[?&]nolog\b/.test(location.search)) put('landfall.nolog', '1');
if (/[?&]log\b/.test(location.search)) put('landfall.nolog', null);
const off = !ENDPOINT || !HOSTS.test(location.hostname) || get('landfall.nolog') === '1';
const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => (b % 36).toString(36)).join('');
let dev = get('landfall.device'); if (!dev) { dev = rid(8); put('landfall.device', dev); }
const ses = rid(6);
let q = [];

function send(beacon) {
  if (!q.length || off) return Promise.resolve();
  const body = JSON.stringify(q); q = [];
  // text/plain keeps it a simple request: no CORS preflight, which Apps Script cannot answer
  if (beacon && navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
  return fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body }).catch(() => {});
}
// where the game is: adrift, under way or in orbit, or down on the world (with the year)
function where(s) {
  if (s.adrift) return 'adrift';
  if (window.LF && LF.aloft(s)) return s.voyage && !s.arrival && !s.world.catalogue && !s.world.zone ? 'crossing' : 'orbit';
  return 'colony';
}
/* ev(type, s, extra): one row. extra is flat: card, pick, outcome and so on. */
function ev(type, s, extra) {
  if (off) return;
  const w = s && s.world, d = s && !s.adrift && window.LF && !LF.aloft(s) ? LF.date(s.day) : null;
  q.push(Object.assign({ at: new Date().toISOString(), dev, ses, ev: type, game: s ? s.seed : '', stage: s ? where(s) : '',
    day: s ? s.day : '', year: d ? d.year : '', world: w ? `${w.planet || w.star || ''} (${w.type})` : '', pop: s && !s.adrift ? s.pop : '',
    host: location.hostname }, extra || {}));
  if (q.length >= 10) send();
}

/* ---------- the end screen: how everyone else did ---------- */
/* Only cards whose options are fixed text can be compared: one that writes its options from the moment (a name for
   the world, who is woken first) offers different things under the same number in every game. */
function labelOf(s, id) {
  const m = s.memo[id], st = LF.byId[id], ch = m && st && st.choices && st.choices[m.i];
  return ch && typeof ch.label === 'string' ? ch.label : null;
}
const outcomeOf = s => s.over.kind === 'dead' && s.over.after ? 'fell' : s.over.kind;
const picksOf = s => Object.keys(s.memo || {}).filter(id => labelOf(s, id)).map(id => [id, s.memo[id].i]);
const deedsOf = s => (LF.deedList ? LF.deedList(s) : []).filter((d, i, a) => a.findIndex(x => x[0] === d[0]) === i);
// This run, sent now rather than with the next batch, so the counts fetched after it include it.
function summary(s) {
  if (off) return Promise.resolve(false);
  q.push({ at: new Date().toISOString(), dev, ses, ev: 'summary', game: s.seed, day: s.day, outcome: outcomeOf(s),
    world: s.world ? s.world.type : '', deeds: deedsOf(s).map(d => d[0]), picks: picksOf(s), host: location.hostname });
  return send().then(() => true);
}
function stats() {
  const ctl = window.AbortController ? new AbortController() : null, t = ctl && setTimeout(() => ctl.abort(), 8000);
  return fetch(ENDPOINT + '?stats', { signal: ctl ? ctl.signal : undefined }).then(r => r.json()).finally(() => clearTimeout(t));
}
const pc = (a, b) => { const v = 100 * a / Math.max(1, b); return v > 0 && v < 1 ? 'under 1%' : Math.round(v) + '%'; };
/* Fold this run into the counts when the server has not seen it (logging off on this host or device). */
function withMine(st, s) {
  st.n++; const o = outcomeOf(s); st.out[o] = (st.out[o] || 0) + 1;
  const ds = deedsOf(s); if (!ds.length) st.clean++;
  for (const [k] of ds) st.deeds[k] = (st.deeds[k] || 0) + 1;
  for (const [id, i] of picksOf(s)) { const c = st.cards[id] || (st.cards[id] = [0]); c[0]++; while (c.length < i + 2) c.push(0); c[i + 1]++; }
  return st;
}
/* tally(done): the landing page's line, "X ships launched. Y colonies established.", or '' if the counts cannot be had.
   Launched is every game that chose a world (left out until the Apps Script is redeployed and sends it);
   established is every run that cut the cord, including those that fell afterwards. Any host, like peers. */
function tally(done) {
  if (!ENDPOINT) return done('');
  stats().then(st => {
    if (!st || typeof st.n !== 'number') return done('');
    const out = st.out || {}, won = (out.win || 0) + (out.fell || 0), n = typeof st.launched === 'number' ? Math.max(st.launched, st.n) : 0;
    const f = x => Number(x).toLocaleString('en'), col = `${won ? f(won) : 'No'} colon${won === 1 ? 'y' : 'ies'} established.`;
    if (!n && !won) return done('');
    done(n ? `${f(n)} ship${n === 1 ? '' : 's'} launched.\n${col}` : col);   // two lines on the landing page (white-space: pre-line)   // no launched count until the Apps Script is redeployed: say only what is known
  }).catch(() => done(''));
}
/* peers(s, done): two or three lines for the end screen, or none if the counts cannot be had. */
function peers(s, done) {
  if (!ENDPOINT || !s || !s.over) return done([]);
  const key = s.seed + ':' + s.over.day, again = get('landfall.summary') === key;   // sent once per ending, even across reloads
  const did = again ? Promise.resolve(!off) : summary(s).then(x => { put('landfall.summary', key); return x; });
  did.then(sent => stats().then(st => {
    if (!st || typeof st.n !== 'number') return done([]);
    st.out = st.out || {}; st.deeds = st.deeds || {}; st.cards = st.cards || {}; st.clean = st.clean || 0;
    if (!sent) withMine(st, s);
    const n = st.n, lines = [];
    if (n <= 1) return done(['Yours is the first colony on the record. Everyone who plays after you will be measured against it.']);
    const o = outcomeOf(s), won = (st.out.win || 0) + (st.out.fell || 0);
    lines.push(o === 'win' ? `${pc(won, n)} of the ${n} colonies on the record have cut the cord.`
      : o === 'fell' ? `${pc(won, n)} of the ${n} colonies on the record cut the cord, and ${pc(st.out.fell || 0, n)} lost it all afterwards anyway.`
      : `${pc(st.out.dead || 0, n)} of the ${n} colonies on the record ended in a last camp like this one.`);
    const ds = deedsOf(s).filter(([k]) => st.deeds[k]).sort((a, b) => st.deeds[a[0]] - st.deeds[b[0]]);
    if (ds.length) { const [k, t] = ds[0], v = st.deeds[k] / n;
      lines.push(`${v < 0.34 ? 'Only ' : ''}${pc(st.deeds[k], n)} of colonies are remembered for ${t}.`); }
    else lines.push(`Yours is one of the ${pc(st.clean, n)} of colonies with nothing on its record.`);
    // the pick fewest others made; then, if it says something different, the one most others shared
    const mine = picksOf(s).map(([id, i]) => { const c = st.cards[id]; return c && c[0] > 1 && labelOf(s, id) ? { id, seen: c[0], v: (c[i + 1] || 0) / c[0], k: c[i + 1] || 0 } : null; }).filter(Boolean);
    const say = (m, lead) => `${lead}${pc(m.k, m.seen)} of the colonies that came to ${LF.byId[m.id].title} chose the same: “${labelOf(s, m.id).replace(/[.!?]$/, '')}.”`;
    mine.sort((a, b) => a.v - b.v || b.seen - a.seen);
    if (mine.length) lines.push(say(mine[0], mine[0].v < 0.34 ? 'Only ' : ''));
    const top = mine.length > 1 && mine.slice().sort((a, b) => b.v * Math.min(b.seen, 20) - a.v * Math.min(a.seen, 20))[0];
    if (top && top !== mine[0] && top.v >= 0.6) lines.push(say(top, ''));
    done(lines);
  })).catch(() => done([]));
}
/* ---------- the yearly recap: what other colonies did with the same cards (Lachlan, 2026-11-16) ----------
   GET ?dec=<card ids> returns, for each card uuid, how many colonies answered it and, per option uuid, how many picked
   it, and which officers (by cast key) were sent on it and died: { <cid>: { n, o: { <oid>: { n, sent: {k: n}, died: {k: n}, sd: {k: n} } } } }.
   sd counts deaths of an officer who was sent. An older deployment of the script answers with text, and gets no lines. */
function decStats(cids) {
  const ctl = window.AbortController ? new AbortController() : null, t = ctl && setTimeout(() => ctl.abort(), 8000);
  return fetch(ENDPOINT + '?dec=' + encodeURIComponent(cids.join(',')), { signal: ctl ? ctl.signal : undefined }).then(r => r.json()).finally(() => clearTimeout(t));
}
const nameOf = k => { for (const seat in LF.CAST || {}) for (const c of LF.CAST[seat]) if (c.key === k) return `${c.first} ${c.last}`; return null; };
const quo = l => `“${String(l).replace(/[.!?]$/, '')}”`;
/* As on the end screen (labelOf): a hand-written card's option counts are by position, so only an option with fixed text
   can be compared. One written from the game (the world's name, the landing sites, who gets the chair) offered something
   else under the same id in other colonies. Generated and council cards are not in LF.byId and keep their lines. */
function fixedPick(p) {
  const st = p.ck && LF.byId && LF.byId[p.ck]; if (!st) return true;
  const m = /#(\d+)$/.exec(p.ok || ''), ch = m && st.choices && st.choices[+m[1]];
  return !!ch && typeof ch.label === 'string';
}
/* year(s, picks, done): three to five rows for the recap's bars (Lachlan, 2026-11-20: bars, not sentences; which side the
   player was on). Each row: { t: the card, l: what this colony chose, v: the share that chose the same, n: colonies on the
   record, segs: [{ v, me }] every option's share, this colony's first and the rest largest first, for a hand-written card with fixed labels (the others get
   theirs and "the rest"), top: the label most others chose when it is not this colony's, kind: 'pick' }, and at most one
   officer row { kind: 'fate', t, l, v: the share in which they died, n, mine: they died here }. */
function year(s, picks, done) {
  if (!ENDPOINT || !picks || !picks.length) return done([]);
  // A card's title: saves from before the fix in decisions.js carry an empty one, so fall back to the storylet's own, and
  // leave out a card that still has none (Lachlan, 2026-11-20).
  picks = picks.map(p => { const st = !p.t && p.ck && LF.byId && LF.byId[p.ck]; return st && typeof st.title === 'string' ? Object.assign({}, p, { t: st.title }) : p; }).filter(p => p.t && fixedPick(p));
  if (!picks.length) return done([]);
  const cids = picks.map(p => p.cid).filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 30);
  decStats(cids).then(st => {
    if (!st || typeof st !== 'object') return done([]);
    const rows = [];
    for (const p of picks) { const c = st[p.cid], o = c && c.o && c.o[p.oid]; if (!c || !o || c.n < 3 || rows.some(r => r.p.cid === p.cid)) continue;
      // every option of a hand-written card, by its id (decisions.js keys options by position)
      const sl = p.ck && LF.byId && LF.byId[p.ck], segs = []; let top = null;
      if (sl && sl.choices && /#\d+$/.test(p.ok || '')) sl.choices.forEach((ch, i) => { const id = LF.uid('opt:' + p.ck + '#' + i), k = (c.o[id] || {}).n || 0; if (!k) return;
        segs.push({ v: k / c.n, me: id === p.oid }); if (id !== p.oid && typeof ch.label === 'string' && (!top || k > top.k)) top = { k, l: ch.label }; });
      if (!segs.some(x => x.me)) { segs.length = 0; segs.push({ v: o.n / c.n, me: true }); }
      const rest = 1 - segs.reduce((a, x) => a + x.v, 0); if (rest > 0.005) segs.push({ v: rest, me: false });
      segs.sort((a, b) => (b.me - a.me) || b.v - a.v);   // this colony's own share always at the left, the rest largest first
      rows.push({ kind: 'pick', p, t: p.t, l: p.l, n: c.n, v: o.n / c.n, segs, o, top: top && top.k > o.n ? top.l : null }); }
    // the most telling: far from an even split, and on the most colonies; three to five of them
    const shown = rows.slice().sort((a, b) => Math.abs(b.v - 0.5) * Math.min(b.n, 30) - Math.abs(a.v - 0.5) * Math.min(a.n, 30)).slice(0, 4);
    // an officer: sent on something this year, or killed by it
    let fate = null;
    for (const r of rows) for (const k of (r.p.died || []).concat(r.p.sent || [])) {
      const nm = nameOf(k); if (!nm) continue;
      const isSent = (r.p.sent || []).includes(k), mine = (r.p.died || []).includes(k);
      const base = isSent ? ((r.o.sent || {})[k] || 0) : r.o.n, dd = isSent ? ((r.o.sd || {})[k] || 0) : ((r.o.died || {})[k] || 0);
      if (base < 3) continue;
      const w = (mine ? 2 : 1) + base / 50; if (!fate || w > fate.w) fate = { kind: 'fate', t: nm, l: r.p.l, v: dd / base, n: base, mine, w };
    }
    const out = shown.map(r => ({ kind: 'pick', t: r.t, l: r.l, n: r.n, v: r.v, segs: r.segs, top: r.top }));
    if (fate) out.push(fate);
    done(out.slice(0, 5));
  }).catch(() => done([]));
}
if (!off) {
  setInterval(() => send(), 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(true); });
  addEventListener('pagehide', () => send(true));
}
window.LFLog = { ev, peers, year, tally, get on() { return !off; }, device: dev };
})();
