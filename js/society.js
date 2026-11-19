/* Landfall — people as people (STORY-PLAN.md §3).
   Every named colonist holds two convictions on the colony's own four axes, wants one thing, has ties to a few of
   the others, and keeps a regard for you that your choices move. A mark that is lived with for a year changes
   what they believe. Some carry a secret. Stories cast their parts from all of this (LF.cast) before they reach
   for a random name. Nothing here is shown as a number.
   Draws come from a second stream (s.rs), so the people can be rolled without disturbing the world's dice. */
(function () {
'use strict';
const { clamp } = LF, H = LF.h;
LF.srand = s => { if (s.rs === undefined) s.rs = ((s.seed | 0) ^ 0x5bd1e995) | 0; s.rs = (s.rs + 0x6D2B79F5) | 0; let t = s.rs; t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const spick = (s, a) => a[Math.floor(LF.srand(s) * a.length)];

/* ---------- convictions ---------- */
const AXES = ['mercy', 'bold', 'open', 'free'];
const TAG = { mercy: ['mercy', 1], severe: ['mercy', -1], bold: ['bold', 1], cautious: ['bold', -1], open: ['open', 1], closed: ['open', -1], free: ['free', 1], order: ['free', -1] };
LF.VAL_TAG = TAG;
/* Each side of each axis can be said several ways; a person always says it the same way (picked from their name, so
   no dice are drawn and a conviction gained later still gets a voice). */
const HOLDS = {
  mercy: [['holds that nobody here is spare', 'will not leave anyone behind, whatever it costs', 'thinks a colony is judged by how it treats its weakest',
           'would feed the sick before the strong', 'believes most people are decent when they are not starving', 'thinks punishment is something only a rich colony can afford'],
          ['holds that a rule nobody enforces is no rule', 'thinks soft hearts will bury this colony', 'says the ones who work should eat first',
           'believes one example now saves ten later', 'has no patience for anyone who will not pull their weight', 'thinks forgiveness has to be earned here']],
  bold:  [['holds that waiting is the slowest way to die', 'would rather be wrong fast than right too late', 'thinks a colony that hides in its camp starves there',
           'wants to be past the next ridge before the first winter', 'says every safe plan on the ship was written for a planet this is not', 'believes luck goes to the ones who move'],
          ['holds that the colony cannot afford one more gamble', 'wants every step tested twice', 'thinks the dead were mostly in a hurry',
           'would rather lose a season than a life', 'trusts nothing that has not been measured', 'says there is no rescue coming, so nothing can be risked']],
  open:  [['holds that this world should be met, not fenced off', 'thinks whatever lives here was here first, and should be asked', 'wants to learn the place before calling anything in it an enemy',
           'would trade with anything that can trade', 'believes the colony has to become part of this world or leave it', 'thinks a wall is a way of not finding out'],
          ['holds that what is outside the wire should stay there', 'thinks curiosity will get someone killed in the first year', 'wants the camp sealed before anything outside it is studied',
           'trusts nothing that grew up under this sun', 'says the colony came to build a human place, not to go native', 'would burn back anything that crosses the perimeter']],
  free:  [['holds that nobody should be governed by a dead committee\'s charter', 'wants every big decision put to a vote', 'thinks the ship\'s ranks should have stayed on the ship',
           'does not take orders well and says so', 'believes people work hardest at what they chose', 'wants the officers to answer to the crews'],
          ['holds that someone has to be in charge', 'thinks a vote is a luxury for colonies that are not dying', 'says the chain of command is all that held on the voyage',
           'wants the charter kept to the letter', 'believes arguments kill more people than storms do', 'wants one voice giving orders and everyone else working']],
};
const voice = (p, k, n) => { let x = 7; for (const c of (p.name || '') + k) x = (Math.imul(x, 31) + c.charCodeAt(0)) | 0; return (x >>> 0) % n; };
const LEAN = { // [axis, direction] a temperament or an office tends toward
  cautious: ['bold', -1], reckless: ['bold', 1], devout: ['free', -1], bitter: ['mercy', -1], beloved: ['mercy', 1], brilliant: ['open', 1], stubborn: ['free', -1], gentle: ['mercy', 1],
  engineer: ['bold', -1], physician: ['mercy', 1], botanist: ['bold', -1], xenobio: ['open', 1], pilot: ['bold', 1], security: ['open', -1], geologist: ['bold', 1],
  teacher: ['free', 1], quartermaster: ['mercy', -1], chaplain: ['mercy', 1],
};
const WANTS = {
  chair:   ['Wants a say in how this place is run.', 'Wants a seat at the table, and will ask for it.', 'Means to be one of the people who decide.'],
  sleepers:['Has someone still asleep in orbit, and wants them down.', 'Has someone close still in the cold upstairs, and counts the days.', 'Will not rest while the people they signed on with are still in orbit.'],
  know:    ['Wants to know what this world is.', 'Wants to understand the place before it kills anyone.', 'Has a notebook of questions about this world, and wants answers.'],
  kin:     ['Wants one person kept safe above all the rest.', 'Would trade anything to keep one friend alive.', 'Has promised to keep one person safe, and means it.'],
  quiet:   ['Wants to be left to the work.', 'Wants a job, a bunk and no speeches.', 'Wants no part in the arguing, only the work.'],
  build:   ['Wants to leave something that outlasts the ship.', 'Wants a town here that people will still live in in a hundred years.', 'Wants to build something with their own name cut into it.'],
  justice: ['Wants a wrong put right.', 'Has not forgiven something done on the voyage, and wants it answered.', 'Wants the people who made the mistakes to own them.'],
};
const WANT_BY = { engineer: ['build', 'quiet'], physician: ['kin', 'justice'], botanist: ['build', 'quiet'], xenobio: ['know', 'know'], pilot: ['sleepers', 'know'], security: ['chair', 'justice'],
  geologist: ['know', 'build'], teacher: ['chair', 'justice'], quartermaster: ['chair', 'kin'], chaplain: ['kin', 'sleepers'] };
LF.WANTS = Object.fromEntries(Object.entries(WANTS).map(([k, v]) => [k, v[0]]));
LF.want = p => { const v = WANTS[p.want]; return v ? v[voice(p, 'w', v.length)] : ''; };
LF.creed = p => { const ks = Object.keys(p.vals || {}); if (!ks.length) return '';
  const said = []; for (const ax of ks) { const v = HOLDS[ax][p.vals[ax] > 0 ? 0 : 1]; let i = voice(p, ax, v.length);   // never the same verb twice
    for (let n = 0; n < v.length && said.some(x => x.split(' ')[0] === v[i].split(' ')[0]); n++) i = (i + 1) % v.length; said.push(v[i]); }
  const c = said.join(', and ') + '.'; return c[0].toUpperCase() + c.slice(1); };
LF.standing = p => p.loyal >= 75 ? 'stands with you' : p.loyal >= 45 ? 'does the job' : p.loyal >= 25 ? 'has doubts about you' : 'has turned away from you';
LF.holds = (p, tag) => { const t = TAG[tag]; return !!(t && p.vals && p.vals[t[0]] === t[1]); };

function initPerson(s, p) {
  p.vals = {}; p.loyal = 55; p.arcs = []; p.seen = {};
  const a = LF.srand(s) < 0.6 ? LEAN[p.trait] : (p.role && LEAN[p.role]) || LEAN[p.trait];
  p.vals[a[0]] = a[1];
  const rest = AXES.filter(x => x !== a[0]), b = (p.role && LEAN[p.role] && LEAN[p.role][0] !== a[0] && LF.srand(s) < 0.5) ? LEAN[p.role] : [spick(s, rest), LF.srand(s) < 0.5 ? 1 : -1];
  p.vals[b[0]] = b[1];
  p.want = p.role && LF.srand(s) < 0.65 ? spick(s, WANT_BY[p.role]) : spick(s, Object.keys(WANTS));
  if (!p.role) { // someone who stepped out of the crowd already knows somebody
    const o = spick(s, s.people.filter(x => x.alive && x.id !== p.id && x.vals)); if (o) LF.bond(s, p, o, spick(s, ['friend', 'friend', 'mentor', 'kin'])); }
}

/* ---------- ties ---------- */
const BOND = { partner: 'Partner of', kin: 'Kin to', friend: 'Friend of', mentor: 'Learned the trade from', rival: 'Rival of', debt: 'Owes a debt to', grudge: 'Bears a grudge against' };
LF.bond = function (s, a, b, k, txt) {
  if (!a || !b || a.id === b.id) return; s.bonds = s.bonds || [];
  if (s.bonds.some(x => x.k === k && ((x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id)))) return;
  s.bonds.push({ a: a.id, b: b.id, k, d: s.day, txt: txt || '' });
};
LF.bondsOf = (s, p) => (s.bonds || []).filter(x => x.a === p.id || x.b === p.id).map(x => ({ k: x.k, o: H.byPid(s, x.a === p.id ? x.b : x.a), mine: x.a === p.id, txt: x.txt })).filter(x => x.o);
LF.bondLine = (s, p) => LF.bondsOf(s, p).filter(x => x.mine || !['mentor', 'debt', 'grudge'].includes(x.k)).map(x => `${BOND[x.k]} ${x.o.name}${x.o.alive ? '' : ', who is dead'}.`).join(' ');
LF.close = (s, p) => LF.bondsOf(s, p).filter(x => ['partner', 'kin', 'friend', 'mentor'].includes(x.k) && x.o.alive).map(x => x.o);
/* Who mourns a named death: someone tied to them, if anyone is. */
LF.mourner = (s, dead) => LF.close(s, dead).filter(o => !o.away)[0] || null;

/* ---------- regard: what your choices do to the people who watch you make them ---------- */
LF.regard = function (s, tags, title) {
  if (!tags || !tags.length) return;
  for (const p of s.people) { if (!p.alive || !p.vals) continue; let d = 0;
    for (const t of tags) { const T = TAG[t]; if (!T || !(T[0] in p.vals)) continue; d += p.vals[T[0]] === T[1] ? 3 : -3; }
    if (d) { p.loyal = clamp(p.loyal + d, 0, 100); if (d < 0 && title) p.sore = { d: s.day, t: title }; } }
};
const shift0 = LF.shiftValues;
LF.shiftValues = function (s, tags) { shift0(s, tags); const c = s.cur; LF.regard(s, tags, c ? (c.gen ? c.title : (LF.byId[c.id] || {}).title) : ''); };
/* An officer who has turned away does the job and no more; one who stands with you does a little extra. */
const odds0 = LF.odds;
LF.odds = odds0;   // how an officer stands with you now counts only when they are sent (LF.attachMods, js/people.js)

/* ---------- arcs: a mark lived with for a year changes what someone believes ---------- */
const ARC = {
  bereaved: ['bold', -1, 'stopped arguing for risks'], maimed: ['open', -1, 'wants the wire higher than it is'],
  grudge: ['free', 1, 'no longer thinks one person should decide'], slighted: ['free', 1, 'no longer thinks one person should decide'],
  convict: ['mercy', 1, 'came out of it gentler than anyone expected'], spared: ['mercy', 1, 'has not forgotten being let off'],
  hero: ['bold', 1, 'has stopped being afraid of much'], touched: ['open', 1, 'talks about what is out there as if it were company'],
};
const SINCE = { bereaved: 'Since the burial', maimed: 'Since the injury', grudge: 'Since that order', slighted: 'Since being passed over', convict: 'Since the trenches', spared: 'Since being let off', hero: 'Since the reactor loop', touched: 'Since coming back' };
const REGARD_MARK = { grudge: -20, slighted: -10, convict: -12, spared: 10, hero: 8, maimed: -4 };
const YEAR = LF.YEAR;
function arcs(s, p) {
  for (const k in p.marks) { const m = p.marks[k];
    if (!p.seen[k]) { p.seen[k] = s.day; if (REGARD_MARK[k]) p.loyal = clamp(p.loyal + REGARD_MARK[k], 0, 100);
      if (k === 'spared' && !p.hook) p.hook = { d: s.day, txt: 'was let off, and knows that you know' }; }
    const A = ARC[k]; if (!A || p.seen['arc:' + k] || s.day - (m.d || p.seen[k]) < YEAR) continue;
    p.seen['arc:' + k] = s.day; if (p.vals[A[0]] === A[1]) continue;          // already believed it
    if (!(A[0] in p.vals) && Object.keys(p.vals).length >= 2) delete p.vals[Object.keys(p.vals).find(ax => ax !== A[0])];
    p.vals[A[0]] = A[1];
    const txt = `${SINCE[k]}, ${A[2]}`;
    p.arcs.push({ d: s.day, txt });
    if (p.known || !p.role) LF.log(s, `${SINCE[k]}, ${p.name} ${A[2]}.`);
  }
}

/* ---------- secrets and hooks ---------- */
LF.SECRET = { hoard: 'has been taking from the common store', host: 'is carrying something', agent: 'answers to someone else', letter: 'has read what the rest have not' };
LF.reveal = function (s, p, how) { if (!p.secret || p.secret.known) return false; p.secret.known = s.day; p.hook = p.hook || { d: s.day, txt: `${LF.SECRET[p.secret.k]}, and knows that you know` };
  LF.log(s, `${p.name} ${LF.SECRET[p.secret.k]}. ${how || 'You know it now.'}`); return true; };
LF.useHook = function (s, pid) { const p = H.byPid(s, pid); if (!p || !p.hook || p.hook.used) return; p.hook.used = s.day; p.loyal = clamp(p.loyal - 15, 0, 100); p.marks.leaned = { d: s.day, txt: 'you leaned on with what you knew' }; };
LF.hookOn = (s, p) => !!(p && p.alive && p.hook && !p.hook.used);

/* ---------- casting: who plays the part ----------
   spec: { val: 'closed' (holds it), want, low (the further from you the better), secret, mark, not: [role or id],
           free (not already leading a faction), officers (only people with an office) } */
LF.cast = function (s, spec) {
  spec = spec || {}; const not = spec.not || [], leading = s.factors.filter(f => f.kind === 'faction' && !f.res).map(f => f.leader);
  let best = null, bs = -99;
  for (const p of s.people) {
    if (!p.alive || p.away || !p.vals || not.includes(p.id) || (p.role && not.includes(p.role))) continue;
    if (spec.free && leading.includes(p.id)) continue; if (spec.officers && !p.role) continue;
    let sc = LF.srand(s) * 0.9;
    if (spec.val) { const T = TAG[spec.val]; sc += p.vals[T[0]] === T[1] ? 3 : p.vals[T[0]] === -T[1] ? -6 : 0; }
    if (spec.want) sc += p.want === spec.want ? 2 : 0;
    if (spec.low) sc += (55 - p.loyal) / 12;
    if (spec.secret) sc += p.secret && p.secret.k === spec.secret && !p.secret.known ? 5 : 0;
    if (spec.mark) sc += p.marks[spec.mark] ? 2 : 0;
    if (sc > bs) { bs = sc; best = p; }
  }
  // Nobody fits because nobody is here (six officers, and some of them away or in orbit): the part goes to someone out of the crowd.
  if (!best && !spec.need && !spec.officers && !spec.secret) { best = H.anyNamed(s, not); if (best && !best.vals) LF.societyInit(s); }
  return spec.need && bs < spec.need ? null : best;
};

/* ---------- setting up, and the daily pass ---------- */
LF.societyInit = function (s) {
  for (const p of s.people) if (!p.vals) initPerson(s, p);
  if (!s.bonds) { s.bonds = []; // the watch crew has forty years of history with each other
    // The six have forty years of history with each other, and it is the same history every game (officers.js).
    const K = k => s.people.find(p => p.key === k);
    for (const [a, b, k, txt] of [['solheim', 'kovacs', 'friend', 'flew together before the ship'], ['nakamura', 'estrada', 'friend', ''], ['dahl', 'yurbin', 'rival', ''], ['yurbin', 'estrada', 'mentor', ''], ['dahl', 'nakamura', 'debt', 'was put back together by']])
      if (K(a) && K(b)) LF.bond(s, K(a), K(b), k, txt);
    // One of them has been quietly looking after their own.
    const h = LF.cast(s, { want: 'kin', not: ['security', 'quartermaster'], officers: true }); if (h) h.secret = { k: 'hoard', d: 0 };
  }
};
LF.societyTick = function (s) {
  if (!s.world || s.adrift) return;
  if (s.people.some(p => !p.vals) || !s.bonds) LF.societyInit(s);
  if (s.day % 10) return;
  for (const p of s.people) { if (!p.alive) continue;
    arcs(s, p);
    p.loyal = clamp(p.loyal + (56 + (s.morale - 50) / 3 - p.loyal) * 0.015, 0, 100);       // regard drifts toward how things are going
  }
};
})();
