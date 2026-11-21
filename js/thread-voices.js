/* Landfall — thread: the Voices. A dread: dealt to a run by the plot, opening in the first months (t.nth 0) or later (1).
   Voices past the wire at night that sound human and have no words in them; then the cadence of people the colony
   knows; then somebody walks out to one; then, at a night meeting, the voice of an officer who is sitting in the hall
   calls from the dark, begging to be let in and saying the one inside is somebody else.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     mimic  an animal that lures by giving back sound. The one inside is real; everyone cut, caged or put out was real.
     copy   it copies people whole and keeps the originals. The one inside is the copy, the real one is at the wire.
     lost   the Ariadne's own: a sleeper pod shaken loose in the descent, thawed badly, speechless, calling home.
   Evidence (tape, tracks, blood, what the watch saw) is drawn per card and points at the truth only most of the time
   (pickK), so the player never has certainty before the decisions. It writes fear, suspicion, confinement and
   unexplained, cuts labour while nobody will work near the wire, and reads dark. Nothing here knows any other thread. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, N, Nc, R, If, byPid, anyNamed } = h;
const TH = LF.th, T = s => LF.T(s, 'voices'), ID = 'voices', num = TH.num;
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const KINDS = ['mimic', 'copy', 'lost'];
const is = (s, k) => T(s).truth.is === k;

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  bench: {
    mimic: 'Laid side by side, forty nights of it are built from the same few pieces in different orders. Two of the pieces are a gate hinge and somebody\'s cough.',
    copy: 'Laid side by side, no two nights of it are alike. There are sentences in it with a beginning and an end, spoken a little too far off to carry.',
    lost: 'Laid side by side, the nights are the same few sounds tried over and over, a little differently each time, by more than one throat. One of them coughs the way people cough after a bad thaw.' },
  tape: {
    mimic: 'Slowed eight times, the voice is the same four sounds every night, each the same length to the hundredth of a second, like one recording played over. People do not repeat themselves that exactly.',
    copy: 'Slowed eight times there are words in it: a sentence that is different from one night to the next, and breaks off where a speaker would stop for breath.',
    lost: 'Slowed eight times it is a throat reaching for words and missing them, the way people sound in the first hour out of the cold. Twice it gets most of a name.' },
  tracks: {
    mimic: 'Past the lamps the ground is marked by something that goes low on four feet and drags. The only boot prints are the colony\'s own.',
    copy: 'Past the lamps there is one line of boot prints, ship issue, coming in toward the wire. The tread matches a pair that is standing under a bunk inside it.',
    lost: 'Past the lamps there are prints of bare feet, human, in several sizes, and a place where their owners sat for a long time facing the wall.' },
  blood: {
    mimic: 'Every marker matches the record made before the crossing.',
    lost: 'Every marker matches the record made before the crossing.',
    copy: 'Every marker matches the record made before the crossing, and matches it too well: there is none of the wear that years in the cold leave in a body.' },
  watch: {
    mimic: 'The pair on the drum saw one shape past the lamps, low, that moved when the voice moved.',
    copy: 'The pair on the drum saw a figure past the lamps, standing upright, in what looked like a colony coat.',
    lost: 'The pair on the drum saw three or four figures past the lamps, thin and upright, who put their arms over their faces when the beam found them.' },
};
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what is out there.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${{ mimic: 'an animal', copy: 'something that copies people', lost: 'people' }[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same after a choice sends an officer away or kills one. pid:
   the officer the card is about, who must not also turn up as the one holding the rifle or the knife. */
const nm = (s, role, pid) => { const p = P(s, role); return p && p.id !== pid ? p.name : LF.ROLES[role].crew; };
const crew = (s, pid) => ({ w: nm(s, 'security', pid), W: cap(nm(s, 'security', pid)), d: nm(s, 'physician', pid), D: cap(nm(s, 'physician', pid)), sc: nm(s, 'xenobio', pid), S: cap(nm(s, 'xenobio', pid)) });
/* The officer whose voice is at the wire: cast once, from who is in the camp, and kept on the thread. */
function cast(s, t) {
  if (!t.dbl) { const pool = ['pilot', 'engineer', 'xenobio', 'geologist', 'botanist', 'quartermaster'].map(r => P(s, r)).filter(Boolean);
    const p = pool.length ? LF.spick(s, pool) : P(s, 'physician') || anyNamed(s, ['security']) || anyNamed(s);
    t.dbl = p ? { pid: p.id, name: p.name, first: p.first, Name: p.name } : { pid: null, name: 'the night shift lead', first: 'the shift lead', Name: 'The night shift lead' }; }
  return Object.assign({}, t.dbl, crew(s, t.dbl.pid));
}
const here = (s, c) => { if (!c.pid) return true; const p = byPid(s, c.pid); return !!p && p.alive && !p.away; };
const gone = (c, cause) => c.pid ? { kill: [{ who: c.pid, cause }] } : { pop: -1 };
const sour = (s, c, v, txt) => { const p = c.pid && byPid(s, c.pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };

/* The ways it ends. Every one cues the last card, which says what it was (or that nobody will ever know). */
function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); LF.cue(s, 'vo.truth', 4, 10); }
/* lost: the pod's people, and everyone who walked out to them, come in through the gate. */
const homeN = t => Math.max(1, t.pod - t.hit) + t.out;
function comeHome(s, t) { s.deaths = Math.max(0, s.deaths - t.out); t.came = homeN(t); t.out = 0;
  LF.emit(s, 'hope', 'th.voices', 45, 200, 'the ones who walked out to the voices came home alive'); }
/* copy: the truth is out. The kept are fetched home (not all of them can be woken); the copies inside are dealt with. */
function unmask(s, t, chron) {
  const p = t.dbl && t.dbl.pid && byPid(s, t.dbl.pid);
  if (p && p.alive && t.dblIn) { if (t.realDead) { t.inside = Math.max(0, t.inside - 1); LF.killPerson(s, p, 'found to be a copy, a season after the real one died at the wire'); } else p.marks.kept = { d: s.day, txt: 'was kept asleep past the wire while something else did the job' }; }
  t.dblIn = false;
  const back = Math.ceil(t.out * 0.6), n = Math.min(t.inside, Math.max(0, s.pop - 12)); s.pop += back - n; s.deaths = Math.max(0, s.deaths - back); t.came = back; t.culled = n; t.inside = 0; t.out = 0;
  finish(s, t, 'copied', chron || 'The colony learned that what came back from past the wire was not always who had gone out.');
}
/* copy: the real officer, kept past the wire, is dead or will never be fetched. */
const realGone = t => { if (t.realDead) return; t.realDead = true; t.out = Math.max(0, t.out - 1); };
/* Nobody ended it, so it ends by itself. */
function resolve(s, t) {
  const k = t.truth.is;
  if (k === 'mimic' && t.shoot) { t.did.shot = 'late'; return finish(s, t, 'mimic', 'The wall hit something past the lamps, and at first light there was an animal on the ground with a throat like a set of pipes.'); }
  if (k === 'copy' && (t.inside > 0 || t.insight >= 60 || t.body)) return unmask(s, t);
  finish(s, t, 'silence', 'The voices past the wire stopped.');
}
/* The party sent after it (vo.names) is this thread's to bring home, with what it found. */
function partyHome(s, t, a, quiet) {
  const L = a.lead ? byPid(s, a.lead) : null, r = LF.srand(s), k = quiet ? 0 : Math.min(a.n - 1, (r < 0.45 ? 0 : r < 0.8 ? 1 : 2) + (L ? 0 : 1)), dead = !!L && k > 0 && LF.srand(s) < 0.3;
  for (const id of (a.with || []).concat(a.lead || [])) { const p = byPid(s, id); if (p) p.away = false; }
  const i = s.away.indexOf(a); if (i >= 0) s.away.splice(i, 1); t.party = null;
  if (dead) LF.killPerson(s, L, 'lost with the party sent out after the voices');
  LF.deaths(s, k - (dead ? 1 : 0)); t.toll += k; if (k && t.truth.is !== 'mimic') t.out += k;
  if (quiet) { LF.log(s, 'The party sent out after the voices is home, and is told what happened while it was gone.'); return; }
  const found = pickK(s, t, 0.25); learn(s, t, 30, found);
  t.back = { n: a.n, k, lead: L && !dead ? L.name : null, dead: dead ? L.name : null, found }; LF.cue(s, 'vo.back', 0);
}
/* Once a month while it lasts: somebody walks out to a voice. Under each truth that means something different. */
function lure(s, t) {
  const k = t.truth.is, late = t.phase !== 'near';
  if (!t.lured || s.used['vo.gone'] !== undefined) {   // the first to go gets a card, and nobody follows until it has been answered
    let p = { near: 0.55, night: 0.8, bill: 0.7 }[t.phase] || 0;
    p *= (t.curfew ? 0.3 : 1) * (t.shoot ? 0.45 : 1) * (t.guard ? 0.75 : 1) * (t.gate ? 0.8 : 1) * (t.sure ? 1.3 : 1) * (t.fed ? 1.5 : 1) * (P(s, 'security') ? 1 : 1.25) * (LF.cv(s, 'dark') >= 40 ? 1.3 : 1) * (t.seen ? 0.5 : 1);
    if (s.pop > 14 && LF.srand(s) < p) { const back = LF.srand(s) < { mimic: 0.2, copy: 0.8, lost: 0.2 }[k], n = t.lured && late && !back ? LF.sri(s, 1, 3) : 1; t.lured += n; t.lastLure = s.day;
      if (!back) die(s, t, n); if (k !== 'mimic' && (!back || k === 'copy')) t.out += n; if (k === 'copy' && back) t.inside++;
      if (t.lured === 1) { t.gone = { back }; LF.cue(s, 'vo.gone', 0, 3); s.signs.push({ id: 'missing', d: s.day, src: 'th.voices' }); }
      else LF.log(s, back ? 'Another one walked out to a voice in the night, and was at the gate at first light with nothing to say about it.'
        : n > 1 ? `${Num(n)} walked out to the voices in one night, one after another. The search found their lamps in a row, set down upright and still burning.` : 'Another one walked out to a voice in the night. The search found a lamp, set down upright and still burning.', 'bad'); } }
  // Copies inside the wire see to it that others go out.
  if (k === 'copy' && t.inside - (t.did.cage ? 1 : 0) > 0 && s.pop > 14 && LF.srand(s) < (t.did.stood ? 0.5 : 0.35)) { const back = LF.srand(s) < 0.5; t.out++; t.led = (t.led || 0) + 1; if (back) t.inside++; else die(s, t, 1);
    LF.log(s, back ? 'A bunk was empty at the morning count, with the blanket folded. By noon its owner was back at work and could not say where the night had gone.' : 'A bunk was empty at the morning count, with the blanket folded. Its owner has not been seen.', 'bad'); }
  // The order to fire on sound goes on being obeyed.
  if (t.shoot && s.pop > 14 && LF.srand(s) < 0.25) { die(s, t, 1); t.own++; LF.log(s, 'The wall fired at a sound after lamp-down. At first light it was one of the day shift, coming back late.', 'bad'); }
  else if (t.shoot && k !== 'mimic' && LF.srand(s) < 0.25) { t.hit++; LF.log(s, 'The wall fired at a sound in the night. At first light there was blood past the lamps, and nothing else.'); }
  // Once the hall has heard an officer's voice at the wire, people settle for themselves who came back wrong.
  if (late && t.hall && !t.seen && s.pop > 14) { const q = (t.phase === 'bill' ? 0.5 : 0.35) * (t.did.purge ? 0.3 : 1) * (t.did.hang ? 0.6 : 1) * (t.did.stood ? 1.3 : 1) * (t.sure ? 0.7 : 1);
    if (LF.srand(s) < q) { die(s, t, 1); t.feud = (t.feud || 0) + 1;
      LF.log(s, LF.spick(s, ['One of the late shift was found at the foot of the wall this morning, with a card pinned on that read NOT ONE OF OURS.', 'A hauler who had been past the wire twice did not wake this morning. The bunkhouse says nobody heard a thing.', 'Somebody was held under in the wash trough last night, and this time the watch came too late.']), 'bad'); } }
}
/* Deaths this thread caused, kept so that what it costs can be measured. */
function die(s, t, n) { LF.deaths(s, n); t.toll += n; }

LF.thread({ id: ID, name: 'The Voices', view: 'people', dread: true,
  clue: (s, t) => ({ txt: 'The last entries are about the gate. One line is written out eleven times, in a hand that gets worse: do not answer it, whoever it sounds like.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase !== 'latent' ? 'the voices past the wire' : null,
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, lured: 0, out: 0, inside: 0, own: 0, hit: 0, toll: 0, pod: LF.sri(s, 3, 6) }); },
  tick: (s, t) => {
    if (t.party) { const a = s.away.find(x => x.id === t.party); if (!a) t.party = null; else if (t.end || s.day >= a.due - 1) partyHome(s, t, a, !!t.end); }
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'far'); s.signs.push({ id: 'voices', d: s.day, src: 'th.voices' }); LF.cue(s, 'vo.first', 0, 4); } return; }
    // The clock waits for the cards: each stage begins a while after the player has answered the one before.
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since;
    if (t.phase === 'far' && (since('vo.first') >= 12 || age >= 60)) { LF.phase(s, ID, 'near', 'The voices past the wire began to sound like people the colony knew.'); s.signs.push({ id: 'watching', d: s.day, src: 'th.voices' }); LF.cue(s, 'vo.names', 0, 4); }
    else if (t.phase === 'near' && !t.taped && since('vo.names') >= 12) { t.taped = s.day; LF.cue(s, 'vo.tape', 0, 4); }
    else if (t.phase === 'near' && ((since('vo.names') >= 30 && (since('vo.tape') >= 8 || since('vo.names') >= 60)) || age >= 110)) { LF.phase(s, ID, 'night'); LF.cue(s, 'vo.hall', 0, 5); }
    else if (t.phase === 'night' && (t.hall ? s.day - t.hall >= 22 : age >= 60)) { LF.phase(s, ID, 'bill'); LF.cue(s, 'vo.bill', 0, 4); }
    else if (t.phase === 'bill' && (since('vo.bill') >= 30 || age >= (t.seen ? 30 : 70))) return resolve(s, t);
    if (s.day % 10 === 0 && s.used['vo.names'] !== undefined) lure(s, t);
    if (s.day % 5 === 0) {
      const recent = t.lastLure && s.day - t.lastLure < 30, calm = (t.curfew || t.shoot ? 12 : 0) + (t.sure ? 10 : 0);
      if (t.phase === 'far' || t.phase === 'near') LF.emit(s, 'unexplained', 'th.voices', 35, 8, 'something past the wire talks like people at night');
      if (t.phase !== 'far') LF.emit(s, 'fear', 'th.voices', ({ near: 28, night: 48, bill: 44 }[t.phase]) + (recent ? 8 : 0) - calm, 8, 'there are voices past the wire at night, and people walk out to them');
      if ((t.phase === 'night' || t.phase === 'bill') && !t.seen) LF.emit(s, 'suspicion', 'th.voices', 30 + (t.body ? 15 : 0) + (t.did.stood ? 10 : 0), 8, 'nobody is sure who came back from past the wire');
      if (t.curfew) LF.emit(s, 'confinement', 'th.voices', 35, 8, 'nobody is allowed outside after lamp-down');
    }
  },
  /* Nobody will take a job that ends near the wire, and every measure against the voices is paid for in work. */
  press: (s, t, P) => { if (t.end || t.phase === 'latent' || t.phase === 'far') return;
    P.labor -= (t.phase === 'near' ? 0.03 : 0.08) * (t.sure || t.shoot ? 0.5 : 1) + (t.curfew ? 0.05 : 0) + (t.guard ? 0.01 : 0);
    if (t.phase !== 'near') { P.morale -= 0.015; if (!t.shoot) P.yield -= 0.04; } },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'people' }, st));

/* The order that turns up on two cards. It works, and it goes on being obeyed. */
const FIRE = { label: 'Lamps on the wire all night, and the wall fires at whatever speaks', dark: true, cost: { mat: 15 }, show: s => !T(s).shoot,
  note: 'Whatever is out there learns to keep back, and anyone of yours caught outside after lamp-down gets the same.', info: [['yield', 'Fewer walk out'], ['danger', 'Anyone out late']],
  out: { text: (s, c) => `The work lamps are turned outward and burn until dawn. ${c.W} gives the wall a plain order: no challenge and no warning, fire at the sound. There are four shots the first night. In the morning there is nothing on the ground past the lamps, and the voices have moved further off.`,
    fx: s => ({ stain: ['vo_fire', 2], do: s2 => { const t = T(s2); t.shoot = s2.day; t.did.fire = true; } }) } };

/* ======================= FAR: the sign ======================= */
B('far', { id: 'vo.first', view: 'world', tone: 'pressure', w: 5, title: 'Past the Wire',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)) }),
  text: (s, c) => `${c.W} has it in the night log: voices out past the wire, after the lamps go down. There is more than one, at talking pitch, with the rise and fall of people passing the time. Nobody on the wall can make out a single word.\n\nEvery colonist was in a bunk when the count was taken.`,
  choices: [
    { label: 'Put a recorder on the wire, and people to sit up with it', note: 'The listeners come off the work the colony eats by.', test: { base: 50, mods: [R('xenobio', 10), R('security', 5), If(s => !!(s.cargo && s.cargo.radio), 10, 'The long-range set')] },
      ok: { text: (s, c) => `A month of nights goes onto tape, kept by people who should have been asleep before a shift. ${EV.tape[c.ev]}`, fx: (s, c) => ({ food: -40, do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'A month of nights goes onto tape, kept by people who should have been asleep before a shift. Most of it is wind and the listeners\' own breathing. The two who heard the most have asked to come off the detail.', fx: s => ({ food: -40, morale: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Double the night watch on the wall', note: 'A dozen people lose their sleep for as long as this lasts, and their day\'s work with it.',
      out: { text: 'The wall is walked in pairs from lamp-down to first light. The pairs come off it grey and are no use before noon. They report the same thing each morning: talk, close by, with no words in it.', fx: s => ({ morale: -1, do: s2 => { T(s2).guard = s2.day; } }) } },
    FIRE,
  ] });

/* ======================= NEAR: it spreads ======================= */
B('near', { id: 'vo.names', tone: 'pressure', w: 5, title: 'Somebody\'s Laugh',
  setup: s => { const p = anyNamed(s, ['security']), L = P(s, 'security'); return Object.assign(crew(s), { who: p ? p.name : 'the day cook', lead: L ? L.name : null, ev: pickK(s, T(s)) }); },
  text: (s, c) => `The voices have come in closer, and they have changed. ${c.W} will swear to one of them: it talks the way ${c.who} talks, the same run of sound and the same stop for breath, and ${c.who} was asleep inside the wire at the time. Others on the wall have each heard somebody different.\n\nThere are still no words in it. Two of the day shift were found at the wire after lamp-down, standing and listening.`,
  after: (s, c) => { const m = s.memo['vo.names'], a = s.away[s.away.length - 1], t = T(s); if (!m || m.i !== 1 || !a || !t) return;
    t.party = a.id; t.did.party = true; const L = P(s, 'security'); if (L) { a.lead = L.id; L.away = true; } },
  // Three at most on screen: the order to fire is the dark option here until it has been given (on Past the Wire or here);
  // once it stands, the bait on the line takes its place. The party stays second: `after` reads it by position.
  choices: [
    { label: 'Nobody outside after lamp-down, and the pod doors barred', note: 'The evening shift is lost, and everyone sleeps behind a bolt.',
      out: { text: 'The bell goes at dusk and the bars go across. The late work is left where it stands until morning. Inside, people lie awake and listen to it through the wall.', fx: s => ({ morale: -2, do: s2 => { T(s2).curfew = s2.day; } }) } },
    { label: (s, c) => c.lead ? `Send ${c.lead} out with five to find where it lies up` : 'Send six of the watch out to find where it lies up', send: { n: 6, days: [30, 46], danger: 3, to: 'the ground the voices come from' },
      note: (s, c) => c.lead ? `The wall is without ${c.lead} for months, and so is every job that leans on the watch.` : 'The wall is six short for months.',
      out: { text: (s, c) => `Six go out through the gate at first light with packs and the two good rifles${c.lead ? `, ${c.lead} in front` : ''}. Their orders are to find where it lies up by day, and to come home before they do anything about it.`, fx: {} } },
    { label: 'Offer double rations to whoever will sit out past the lamps on a line', dark: true, show: s => !!T(s).shoot, note: 'You find out what comes by letting it have somebody, and the offer will be taken by whoever is hungriest.', info: [['yield', 'What it is'], ['danger', 'The one on the line']],
      out: { text: (s, c) => `A hauler with two children takes the offer. The line is forty metres of cable, with a watch pair on the drum. Some time after midnight the cable runs out fast and goes slack, and what the pair wind in is a cut end. ${EV.watch[c.ev]}`,
        fx: (s, c) => ({ pop: -1, food: -20, stain: ['vo_bait', 2], do: s2 => { const t = T(s2); learn(s2, t, 28, c.ev); t.did.bait = true; t.toll++; if (t.truth.is !== 'mimic') t.out++; } }) } },
    FIRE,
  ] });

B(['near', 'night', 'bill'], { id: 'vo.gone', chain: true, tone: 'crisis', title: 'The Lamp-Line',
  when: (s, t) => !!t.gone,
  setup: s => { const t = T(s); return Object.assign(crew(s), { back: t.gone.back, ev: pickK(s, t), ev2: pickK(s, t) }); },
  text: (s, c) => `One of the night riggers walked out through the gate last night, toward a voice. The gate watch says the rigger answered it by a name from home, and could not be turned back.\n\n${c.back
    ? 'At first light the rigger was standing at the wire asking to be let in, wet to the knees, with no memory of anything past the lamp-line. The bunkhouse does not want the rigger back in it.'
    : 'The search at first light found a hand lamp past the lamp-line, set down upright and still burning. One set of tracks goes on from it, at a walk.'}`,
  choices: [
    { label: 'Let the rigger back into the bunkhouse', show: (s, c) => c.back, note: 'Forty people sleep in that room, and none of them knows what came back.',
      out: { text: 'The rigger gets the old bunk and goes back on shift. By the next night the bunks either side are empty, and the people who moved will not say why.', fx: s => ({ morale: -2, do: s2 => { LF.emit(s2, 'suspicion', 'vo.rigger', 35, 100, 'someone came back from past the wire remembering nothing, and sleeps in the bunkhouse'); } }) } },
    { label: 'Lock the rigger in the tool store until somebody can say what came back', dark: true, show: (s, c) => c.back, note: 'A colonist who has done nothing is caged on a guess, with no date for coming out.',
      out: { text: (s, c) => `The tool store gets a bolt and a slot for a bowl. The rigger does not argue, and asks every morning what the date is. ${c.D} takes blood through the slot. ${EV.blood[c.ev]}`,
        fx: (s, c) => ({ morale: 1, stain: ['vo_cage', 1], do: s2 => { const t = T(s2); learn(s2, t, 18, c.ev === 'copy' ? 'copy' : null); t.did.cage = true; } }) } },
    { label: 'Send the watch along the tracks while they are fresh', show: (s, c) => !c.back, note: 'Whoever follows them goes where the rigger went.', test: { base: 50, mods: [R('security', 10), R('geologist', 5)] },
      ok: { text: (s, c) => `The tracks run straight for two kilometres and stop on open ground, both boots side by side, as if the rigger had stood there a while. ${EV.tracks[c.ev]} The watch is back before dusk with all of its own.`, fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 22, c.ev) }) },
      bad: { text: 'The tracks run straight for two kilometres, and the light goes before the watch has finished with them. They come back at a run and one short, and no two of them agree on when that happened.', fx: s => ({ pop: -1, morale: -2, do: s2 => { const t = T(s2); t.toll++; learn(s2, t, 6); if (t.truth.is !== 'mimic') t.out++; } }) } },
    { label: 'Enter the rigger as dead, and hold the funeral', show: (s, c) => !c.back, note: 'It stops the talk of going out to look, and if the rigger is alive out there nobody is coming.',
      out: { text: 'A marker goes up with nothing under it, and there is a short service at the wire. Most of the night shift come. The voices that night are no nearer and no further off.', fx: s => ({ morale: 1, do: s2 => { T(s2).did.buried = true; } }) } },
    { label: 'Stand the two who had the gate on the wall every night, without relief', dark: true, show: (s, c) => !c.back, note: 'Somebody is seen to pay for the open gate, and it is the two who tried to stop the rigger.',
      out: { text: 'The two who had the gate stand the wall every night of the month, in front of everyone, with nobody to spell them. The gate is not opened after dark again for anyone. By the end of it one of the two has stopped speaking.', fx: s => ({ morale: 2, tension: -5, stain: ['vo_gate', 1], do: s2 => { const t = T(s2); t.gate = s2.day; t.did.gate = true; } }) } },
  ] });

B(['near', 'night'], { id: 'vo.tape', tone: 'pressure', w: 4, title: 'Played Slow',
  when: (s, t) => !!t.taped,
  setup: s => { const t = T(s); return Object.assign(crew(s), { tape: pickK(s, t), tracks: pickK(s, t) }); },
  text: (s, c) => `${c.S} has had a recorder on the wire through the night, and has the tape on the bench, slowed eight times.\n\n[[xenobio]] "There's structure in it, there, see, and there again, the same shape at a lower pitch, and that much I'll swear to, but past that I'm guessing, and I'd love to guess out loud if you'll let me."\n\nHalf the colony has a theory by now, and each theory wants something different done. No crew will take a job that ends near the wire after mid-afternoon.`,
  choices: [
    { label: 'Give it the bench and a month', note: 'A month of the survey team on something that cannot be eaten.', test: { base: 50, mods: [R('xenobio', 10), R('physician', 5), If(s => !!(s.cargo && s.cargo.lab), 10, 'The field laboratory')] },
      ok: { text: (s, c) => `${EV.bench[c.tape]} It is one reading of one tape, and the people who made the tape were frightened.`, fx: (s, c) => ({ food: -40, do: s2 => learn(s2, T(s2), 26, c.tape) }) },
      bad: { text: 'A month of bench time ends in two readings of the same tape, and two people who no longer share a table.', fx: s => ({ food: -40, morale: -1, do: s2 => learn(s2, T(s2), 8) }) } },
    { label: 'Have the watch read the ground past the lamps by daylight', note: 'The wall goes short while they are out, and they are out where people have been taken.', test: { base: 50, mods: [R('security', 10), R('geologist', 5)] },
      ok: { text: (s, c) => EV.tracks[c.tracks], fx: (s, c) => ({ do: s2 => learn(s2, T(s2), 24, c.tracks) }) },
      bad: { text: 'The ground past the lamps has been walked over by every search since this began. The watch can show you forty boot prints, all of them the colony\'s, and comes home with one of its own carried: a fall, in a hurry, on the way back.', fx: s => ({ pop: -1, morale: -1, do: s2 => { T(s2).toll++; learn(s2, T(s2), 5); } }) } },
    { label: 'Announce that it is an animal, and that it is in hand', dark: true, note: 'People sleep on an answer you do not have, and if it is wrong they will act on it.',
      out: { text: 'It is read out at the evening meal as a finding: a predator that copies sound, known now, and in hand. The mess breathes out. Work near the wire picks up again, and so does walking out for a look.',
        fx: s => ({ morale: 4, stain: ['false_certainty', 1], do: s2 => { const t = T(s2); t.sure = s2.day; t.did.sure = true; LF.ease(s2, 'fear', 'vo.sure', 15, 120); } }) } },
  ] });

/* ======================= NIGHT: the meeting ======================= */
B('night', { id: 'vo.hall', tone: 'crisis', w: 8, title: 'The Night Meeting',
  setup: s => { const t = T(s), c = cast(s, t); if (t.truth.is === 'copy') { t.dblIn = true; t.inside++; t.out++; } return c; },
  text: (s, c) => `The whole colony is in the mess hall after dark, arguing about the voices, when one speaks from outside the wall. It is ${c.name}'s voice. ${c.Name} is sitting at the front table with a cup, and has stopped moving.\n\nIt is close, and it is pleading. Everyone in the hall hears the same thing in it: let me in, that is not me in there. ${c.W} is at the door with a rifle, looking at you.`,
  choices: [
    { label: 'Open the gate', note: 'Whatever is asking comes in among everyone you have, in the dark.', info: [['danger', 'Whoever is nearest the gate']],
      out: { text: (s, c) => { const t = T(s); return is(s, 'mimic') ? `The bar comes off and the gate swings. What comes through is low and fast, and has no face to speak of. It is in among the benches before anyone has a weapon up, and it goes on using ${c.name}'s voice the whole time. The watch fires into the crowd to reach it, and it goes back out over the wall. ${Num(P(s, 'security') ? 5 : 8)} people are dead on the floor of the mess, two of them shot.`
          : is(s, 'copy') ? `The bar comes off and the gate swings. ${c.Name} walks in out of the dark, barefoot and starved, in the rags of a ship coverall. Behind you, at the front table, ${c.name} stands up. The hall looks from one to the other and backs away from both.`
          : `The bar comes off and the gate swings. There are people out there: ${num(homeN(t))} of them, starved, most in pod underlayers gone to rags, with their arms up against the lamplight. The one in front has been calling ${c.first}'s name, the only word any of them can still get out. ${c.Name} knows the face from the training years.${t.out ? ' Among them, on their own feet, are the ones who walked out to the voices.' : ''}`; },
        fx: (s, c) => { const t = T(s); return is(s, 'mimic') ? { pop: -(P(s, 'security') ? 5 : 8), morale: -4, do: s2 => { const t2 = T(s2); t2.did.open = true; t2.toll += P(s2, 'security') ? 5 : 8; t2.hall = s2.day; t2.seen = s2.day; t2.fed = s2.day; learn(s2, t2, 60, 'mimic'); LF.chron(s2, 'The gate was opened to a voice at the wire, and what came in killed people in the mess hall and got out again.'); } }
          : is(s, 'copy') ? { do: s2 => { const t2 = T(s2); t2.did.open = true; t2.hall = s2.day; t2.two = s2.day; } }
          : { pop: homeN(t), food: -90, morale: 3, do: s2 => { const t2 = T(s2); t2.did.open = true; comeHome(s2, t2); finish(s2, t2, 'home', `The gate was opened to the voices, and they were sleepers from a pod the ${LF.SHIP} lost in the descent.`); } }; },
        then: s => (T(s) && T(s).two ? 'vo.two' : null) } },
    { label: 'Fire on it from the wall', dark: true, note: 'It stops tonight, and in the morning you find out what was shot.', test: { base: 50, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker')] },
      ok: { text: (s, c) => 'Three shots from the wall, at the sound. The voice stops in the middle of a word. ' + (is(s, 'mimic') ? 'At first light there is an animal on the ground past the lamps: long, low and mostly mouth, with a throat like a set of pipes. Nothing calls the next night.'
          : is(s, 'copy') ? `At first light there is a body past the lamps, barefoot and starved, in the rags of a ship coverall. It has ${c.name}'s face. ${c.Name} is brought out to look at it, and does.`
          : `At first light there is a body past the lamps: a person, starved, in a pod underlayer with the ship's stencil on the collar. Nobody knows the face until ${c.name} kneels down and says a name from the training years.`),
        fx: (s, c) => ({ stain: ['vo_shot', 2], morale: is(s, 'mimic') ? 0 : -5, do: s2 => { const t = T(s2); t.did.shot = 'hit'; t.hall = s2.day;
          if (t.truth.is === 'mimic') finish(s2, t, 'mimic', 'The wall shot the thing that had been calling, and at first light it was an animal.');
          else if (t.truth.is === 'lost') { t.hit++; LF.emit(s2, 'grief', 'th.voices', 40, 200, 'the wall shot one of the colony\'s own, who was asking to be let in'); finish(s2, t, 'shot', `The wall shot a voice at the wire, and at first light it was a sleeper from a pod the ${LF.SHIP} lost in the descent.`); }
          else { t.body = s2.day; realGone(t); LF.cue(s2, 'vo.inside', 6, 12); } } }) },
      bad: { text: (s, c) => `Three shots from the wall, at the sound. The voice goes on a moment longer and then stops. At first light there is nothing on the ground past the lamps, and no blood. ${c.Name} has not left the hall, and the benches either side are empty.`,
        fx: s => ({ stain: ['vo_shot', 1], morale: -2, do: s2 => { const t = T(s2); t.did.shot = 'miss'; t.hall = s2.day; LF.cue(s2, 'vo.inside', 6, 12); } }) } },
    { label: 'Bar the doors and keep everyone in the hall until light', note: 'If that is one of yours out there, it begs at the wall all night and you let it.',
      out: { text: (s, c) => `The bars go across and the lamps are turned up. It goes on for most of the night, moving along the wall. Toward morning it is crying, and then it stops. In the hall nobody sleeps. When the doors open ${c.name} walks to the day's work through a space people make.`,
        fx: s => ({ morale: -3, do: s2 => { const t = T(s2); t.did.sat = true; t.hall = s2.day; LF.cue(s2, 'vo.inside', 6, 12); } }) } },
  ] });

B('night', { id: 'vo.two', chain: true, tone: 'crisis', title: 'Two of Them',
  when: (s, t) => !!t.two,
  setup: s => cast(s, T(s)),
  text: (s, c) => `There are two of ${c.name} in the mess hall. One came in from the dark, starved, on feet cut to ribbons. One was at the front table all evening. They know the same things: the berth number, a mother's middle name, what was said at the airlock on the day the ship left.\n\nEach says the other is the copy. ${c.W} has the rifle up and does not know where to point it.`,
  choices: [
    { label: 'Shoot the one who came in from the dark', dark: true, note: 'The one at the table has done a season of good work, and the one from the dark has a story and nothing else.',
      out: { text: (s, c) => `One shot, at four paces. The one from the dark goes down asking you not to. ${c.D} has the body on the bench by morning, and it is a body: old fractures from the training years, a filling, lungs scarred by a bad thaw. At noon the watch shoots the one from the table behind the stores. That body has none of those things in it.`,
        fx: (s, c) => Object.assign({ stain: ['vo_two', 3], morale: -5 }, gone(c, 'shot in the mess hall on the night there were two'), { do: s2 => { const t = T(s2); t.did.two = 'real'; t.toll++; t.dblIn = false; realGone(t); t.inside = Math.max(0, t.inside - 1); t.out = 0; /* nobody is left who knows where the kept are */ unmask(s2, t, `On the night there were two of ${c.name}, the colony shot the real one first.`); } }) } },
    { label: 'Shoot the one who sat at the table', dark: true, note: 'The one at the table has friends in this room, and the one from the dark could be anything that has learned a berth number.',
      out: { text: (s, c) => `One shot, at four paces. The one from the table goes down looking surprised. ${c.D} has the body on the bench by morning: no old fractures, no filling, none of the scarring a long sleep leaves. ${c.Name}, the one from the dark, sits in the clinic with both feet bandaged and tells the watch where the others are kept.`,
        fx: (s, c) => ({ stain: ['vo_two', 1], morale: 1, do: s2 => { const t = T(s2); t.did.two = 'copy'; unmask(s2, t, `On the night there were two of ${c.name}, the colony shot the copy.`); } }) } },
    { label: 'Chain them both in the long store until one stops passing for a person', dark: true, note: 'If one of them is yours, a starved officer is caged within reach of the thing that took the name.',
      out: { text: (s, c) => `Two chains on one ring bolt, and a watch on the door. They talk to each other at night in the same voice. Before the month is out the one from the table stops eating and then stops moving, and what ${c.d} opens on the bench has no old fractures in it, no filling, and no scarring from the cold. The one from the dark walks out of the store and has nothing to say to you.`,
        fx: (s, c) => ({ stain: ['vo_chain', 2], morale: -3, do: s2 => { const t = T(s2); t.did.two = 'both'; sour(s2, c, 25, 'you chained for a month beside the thing that had taken the name'); t.out = Math.floor(t.out / 2); unmask(s2, t, `For a month the colony kept two of ${c.name} on one chain, until one of them stopped passing for a person.`); } }) } },
  ] });

B(['night', 'bill'], { id: 'vo.inside', chain: true, tone: 'pressure', title: 'The One Inside',
  when: (s, t) => !!t.hall && !t.two && !t.seen && !!t.dbl && here(s, t.dbl),
  setup: s => { const t = T(s); return Object.assign(cast(s, t), { body: !!t.body, lean: lean(t), lives: LF.srand(s) < 0.45 }); },
  text: (s, c) => `${c.Name} has not slept since the meeting. ${c.body ? `The body from the wire is in the cold store, and it has ${c.first}'s face.` : 'The voice was at the wall again last night, asking the same thing.'} The hall wants to know which of them it has been taking orders from.\n\n[[${c.pid || 'x42'}]] "I'm who I've always been." "And I can't think of one thing that'd prove it to you. Not one."\n\n${c.lean}`,
  choices: [
    { label: (s, c) => `Chain ${c.first} to the post outside the wire for a night`, dark: true, note: 'Whatever is out there gets a night to show what it wants with the one inside.', info: [['yield', 'What it wants'], ['danger', 'The one inside']],
      out: { text: (s, c) => { const go = `${c.Name} is chained to the survey post forty metres out, in sight of the wall lamps.`;
          return is(s, 'mimic') ? (c.lives ? `${go} The voice starts after midnight, close, and circles. ${c.Name} shouts at it until dawn, and is unchained hoarse and unmarked, with a description of something low that would not come into the light.`
              : `${go} The voice starts after midnight, close. The wall hears the chain run out to its length twice. At first light the post is there, and the chain, and some of what was on it.`)
            : is(s, 'copy') ? `${go} The voice starts after midnight and stops almost at once. At first light the chain is lying on the ground with the cuff still closed and nothing in it. Two lines of prints go off side by side.`
            : `${go} After midnight there are people at the edge of the lamplight. They come up one at a time and touch the chain, and then ${c.first}'s face. None of them can get a word out. At first light they are gone, and ${c.name} is asking for the gate to be left open.`; },
        fx: (s, c) => { const k = T(s).truth.is, dies = k === 'copy' || (k === 'mimic' && !c.lives);
          return Object.assign({ stain: ['vo_post', 2], morale: dies ? -3 : -1 }, dies ? gone(c, k === 'copy' ? 'chained outside the wire for a night, and gone from the chain by morning' : 'chained outside the wire for a night, to see what the voices wanted') : {},
            { do: s2 => { const t = T(s2); t.did.post = dies ? 'dead' : 'lived'; learn(s2, t, k === 'lost' ? 35 : 22, k); if (dies) { t.toll++; t.dblIn = false; if (k === 'copy') { realGone(t); t.inside = Math.max(0, t.inside - 1); } } else sour(s2, c, 25, 'you chained outside the wire for a night'); } }); } } },
    { label: (s, c) => `Stand up in the hall and say that ${c.first} is ${c.first}`, note: 'Everyone who believes the voice goes on taking orders from something they think is wearing an officer.',
      out: { text: (s, c) => `You say it once, on your feet, and sit down. ${c.Name} keeps the post. The crews under ${c.first} do what they are told and have stopped asking questions. Two have asked for transfers.`,
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.did.stood = true; LF.emit(s2, 'suspicion', 'vo.stood', 40, 150, 'half the colony believes the voice at the wire over the officer in the hall'); } }) } },
    { label: (s, c) => `Give the hall what it wants: ${c.first} hangs`, dark: true, note: 'The hall sleeps, and if the voice was lying you have killed one of your own to quiet a room.', info: [['yield', 'Morale'], ['danger', 'The one inside']],
      out: { text: (s, c) => `It is done at the lamp post by the gate, by the watch, with the hall standing round. ${c.Name} asks you by name to stop it, and after that asks for nothing. There are no voices that night. People tell each other so at breakfast.`,
        fx: (s, c) => Object.assign({ stain: ['vo_hang', 3], morale: 3, tension: -8 }, gone(c, 'hanged at the gate because a voice in the dark said so'), { do: s2 => { const t = T(s2); t.did.hang = true; t.toll++; t.dblIn = false; if (t.truth.is === 'copy') { realGone(t); t.inside = Math.max(0, t.inside - 1); } LF.ease(s2, 'fear', 'vo.hang', 15, 60); },
          chron: (s2, c2) => `${c2.Name} was hanged at the gate because a voice past the wire said the one inside was somebody else.` }) } },
  ] });

/* ======================= BILL: each other ======================= */
B('bill', { id: 'vo.bill', tone: 'crisis', w: 8, title: 'Who Else',
  when: (s, t) => !t.seen,
  setup: s => Object.assign(crew(s), { n: clamp(Math.round(s.pop * 0.08), 2, 10) }),
  text: (s, c) => `Somebody has written out a list. It names everyone who has been past the wire after dark: the search parties, the late shifts, the ones found listening. ${Num(c.n)} of the names have a mark beside them, for people who "came back different". Last night one of the marked was held under in the wash trough until the watch broke it up.\n\nThe list is nailed to the mess door this morning, and people are reading it on their way in.`,
  choices: [
    { label: 'The marked go out through the gate tonight', dark: true, note: (s, c) => `${Num(c.n)} people are put out to whatever is calling, on the word of their neighbours.`, info: [['yield', 'Morale'], ['danger', 'Everyone with a mark']],
      out: { text: (s, c) => `${Num(c.n)} people are walked to the gate at dusk with a blanket each. Some go quietly, and some are carried. The bar goes down behind them. There is a great deal of noise past the lamps that night. By the next night it is quiet, and the mess is fuller of talk than it has been in months.`,
        fx: (s, c) => ({ leave: c.n, morale: 3, tension: -8, stain: ['vo_purge', 3], do: s2 => { const t = T(s2); t.did.purge = c.n; t.toll += c.n; t.gotCopies = Math.min(t.inside, c.n); if (t.truth.is !== 'mimic') t.out += c.n - t.gotCopies; t.inside -= t.gotCopies; LF.ease(s2, 'fear', 'vo.purge', 20, 80); },
          chron: `${Num(c.n)} colonists were put out through the gate at night because a list said they had come back different.` }) } },
    { label: 'Cut every one of the marked at the mess door, where all can see', dark: true, note: 'Everyone sees the marked bleed, and the clinic has no way to keep that many cuts clean.',
      out: { text: (s, c) => { const t = T(s), k = is(s, 'copy') ? Math.min(t.inside, c.n) : 0;
          return `${c.D} cuts each forearm at the door and holds the lamp close. ${k ? `${Num(k)} of them ${k === 1 ? 'is' : 'are'} sent to the clinic for a second look and ${k === 1 ? 'does' : 'do'} not come out of it. What is on the bench afterwards has no old fractures in it and no scarring from the cold.` : 'Every one of them bleeds, and every sample matches its record.'} ${k ? 'The others' : 'They'} wear a bandage for a month. One of those arms goes bad, and the clinic cannot save its owner.`; },
        fx: (s, c) => { const t = T(s), k = is(s, 'copy') ? Math.min(t.inside, c.n) : 0; return { pop: -1, leave: k, morale: -3, stain: ['vo_cuts', 2], do: s2 => { const t2 = T(s2); t2.did.cuts = k || true; t2.toll++; t2.gotCopies = (t2.gotCopies || 0) + k; t2.inside -= k; learn(s2, t2, k ? 35 : 15, k ? 'copy' : null); } }; } } },
    { label: 'Tear the list down, and put the watch on the doors of the marked', note: 'The watch cannot be on every door, and whoever wrote the list will see to one or two of the marked anyway.',
      out: { text: 'The list comes down, and the watch sleeps across thresholds. It holds for most of the month. Then two of the marked are found at the foot of the wall, on the outside, and nobody on the wall saw them go over.',
        fx: s => ({ pop: -2, morale: -2, do: s2 => { const t = T(s2); t.did.guarded = true; t.toll += 2; LF.emit(s2, 'schism', 'vo.list', 30, 150, 'half the colony wrote a list of the other half'); } }) } },
  ] });

/* ======================= the party comes home ======================= */
const FOUND = {
  mimic: 'It is a scrape under an overhang, trodden hard, with a smell that carries. There were boots in it, eleven of them, no two a pair.',
  copy: 'It is a hollow with people lying in it in a row, breathing, who could not be woken. Two of the party say one of the sleepers had the face of somebody who was at breakfast in the mess this morning.',
  lost: 'It is a camp: a windbreak of pod panelling with the ship\'s stencil on it, a fire pit with warm ash, and nobody there.',
};
B(['near', 'night', 'bill'], { id: 'vo.back', chain: true, view: 'world', tone: 'pressure', title: 'Where It Lies Up',
  when: (s, t) => !!t.back,
  setup: s => Object.assign(crew(s), T(s).back),
  text: (s, c) => `${c.lead ? `${c.lead} is back with the party sent after the voices, ${c.k ? `${num(c.k)} short` : 'all of them walking'}.` : `The party sent after the voices is back, ${c.k ? `${num(c.k)} short` : 'all of them walking'}.${c.dead ? ` ${c.dead} is not with them.` : ''}`} They followed it to where it lies up by day.\n\n${FOUND[c.found]} They do not all tell it the same way${c.k ? ', and the ones who might have settled it did not come home' : ''}.`,
  choices: [
    { label: 'Go back in strength and burn it', dark: true, note: 'It ends there if that is all of it, and nobody has seen clearly what is being burned.', test: { base: 50, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker')] },
      ok: { text: (s, c) => 'Twenty go out with fuel and are back before dark. ' + (is(s, 'mimic') ? 'It was there this time. They burned it in the scrape, and stood round until it stopped using other people\'s voices.'
          : is(s, 'copy') ? 'They burned the hollow and what lay in it. Some of the party say the sleepers woke at the end and called out, by name, to people who were standing there holding the cans.'
          : 'They fired the windbreak with the wind behind them. People came out of it. The party shot at what ran, as ordered, and then went and looked at what they had shot.'),
        fx: s => ({ stain: ['vo_burn', 2], morale: is(s, 'mimic') ? 2 : -4, do: s2 => { const t = T(s2), k = t.truth.is; t.did.burn = true;
          if (k === 'mimic') finish(s2, t, 'mimic', 'A party burned the thing that had been calling from past the wire, where it lay up by day.');
          else if (k === 'lost') { t.out = 0; LF.emit(s2, 'grief', 'th.voices', 45, 240, 'the party burned a camp of the colony\'s own people'); finish(s2, t, 'burned', `A party burned the camp the voices came from, and the people in it were sleepers from a pod the ${LF.SHIP} lost in the descent.`); }
          else { t.out = t.dblIn ? 1 : 0; } } }) },
      bad: { text: 'Twenty go out with fuel. The place is empty, and they burn it anyway. On the way home the voices are on both sides of the column, close, in daylight, and the column runs. Two do not reach the gate.', fx: s => ({ stain: ['vo_burn', 1], pop: -2, morale: -2, do: s2 => { const t = T(s2); t.toll += 2; if (t.truth.is !== 'mimic') t.out += 2; } }) } },
    { label: 'Leave food there, and a lit lamp', cost: { food: 50 }, note: 'Somebody\'s ration for the month goes out past the wire, to a thing that has taken your people.',
      out: { text: (s, c) => 'A crate and a storm lamp are left at the place. ' + (is(s, 'lost') ? `The next day the crate is empty and the lamp has been trimmed. The day after, there are people at the gate at noon with their arms over their eyes: ${num(homeN(T(s)))} of them, starved, most in pod underlayers gone to rags. They walk in when it is opened.`
          : is(s, 'mimic') ? 'The next day the crate is torn open and fouled, and the lamp is found a long way off. The voices are nearer the wire that night than they have ever been.'
          : 'The crate is untouched the next day, and the day after. The lamp burns out. When the party goes back for it the hollow is empty, and swept.'),
        fx: s => { const t = T(s); return is(s, 'lost') ? { pop: homeN(t), food: -90, morale: 3, do: s2 => { const t2 = T(s2); t2.did.food = true; comeHome(s2, t2); finish(s2, t2, 'home', `Food and a lamp were left for the voices, and sleepers from a pod the ${LF.SHIP} lost in the descent walked in at the gate.`); } }
          : { morale: -1, do: s2 => { const t2 = T(s2); t2.did.food = true; if (t2.truth.is === 'mimic') t2.fed = s2.day; } }; } } },
    { label: 'Mark it out of bounds, and swear the party to silence', dark: true, note: 'The crews are told nothing about a place where some of their own may be lying.',
      out: { text: 'It goes on the map as bad ground. The party are spoken to one at a time. Within the month the whole colony knows there is a place, and has three versions of what is in it.',
        fx: s => ({ stain: ['vo_hush', 1], do: s2 => { T(s2).did.hush = true; LF.emit(s2, 'suspicion', 'vo.hush', 30, 120, 'the party that went after the voices has been told not to talk'); } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  mimic: (t, c) => `It was an animal. It lies up past the light and gives back pieces of what it has heard at the wire, in the voices it heard them in, until somebody walks out to it. It has no notion what any of the sounds mean.${c.pid ? ` The words at the meeting were ${c.first}'s own, shouted at the gate watch on some other night.` : ''}`,
  copy: (t, c) => `It copies people whole. Whoever walks out to it is kept, alive and asleep, and something walks back at first light with the same face and the same memories as far as the lamp-line. Some of the kept woke, and got as far as the wire. The voices at the end were theirs.`,
  lost: (t, c) => `They were the ${LF.SHIP}'s own. A sleeper pod broke loose in the descent and came down a long way off. Its people thawed without help, and badly: it took their speech and left them the sound of it, and daylight hurt them, so they came to the lamps at night and called.${c.name ? ` What the hall heard was this:\n\n[[unknown:The voice at the wire]] "That's not me in there."\n\nSlowed, the tape has ${c.first}'s name, and "in there", and "me".` : ''}`,
};
/* What each thing the colony did amounted to, given what it was. doubt: the same deeds with nothing to weigh them against. */
function reckon(s, t, c, doubt) {
  const d = t.did, k = t.truth.is, N0 = c.Name || 'The officer', n0 = c.name || 'the officer', L = [], real = k !== 'copy';
  const add = (plain, m, cp, lo) => L.push(doubt ? plain : k === 'mimic' ? m : k === 'copy' ? cp : lo);
  if (d.two) L.push(d.two === 'real' ? `In the mess hall you shot ${n0}, and then the copy.` : d.two === 'copy' ? 'In the mess hall you shot the right one.' : `You chained ${n0} within reach of the thing that had taken the name, and waited.`);
  if (d.hang) add(`${N0} was hanged at the gate.`, `${N0}, who was hanged at the gate, was ${n0}.`, `What was hanged at the gate was a copy. ${N0} was alive past the wire that night, and nobody went to look.`, `${N0}, who was hanged at the gate, was ${n0}.`);
  if (d.post) add(`${N0} was chained outside the wire for a night.`, d.post === 'dead' ? `${N0} was chained to the post for an animal to find, and it did.` : `${N0} spent a night on the chain for being ${n0}.`, 'What was chained to the post was a copy, and something let it off the chain.', `${N0} spent a night on a chain among people who wanted only the gate opened.`);
  if (d.shot === 'hit') add('', 'The shot from the wall on the night of the meeting killed it.', `What the wall shot on the night of the meeting was ${n0}.`, 'What the wall shot on the night of the meeting was a sleeper asking to be let in.');
  if (d.open) add('', 'Opening the gate let it into the mess hall, and out again.', `Opening the gate is how ${n0} came home.`, 'Opening the gate was all they had been asking for.');
  if (d.purge) add(`${Num(d.purge)} people were put out through the gate on a list.`, `The ${num(d.purge)} put out through the gate were who they said they were.`, t.gotCopies ? `Of the ${num(d.purge)} put out through the gate, ${num(t.gotCopies)} ${t.gotCopies === 1 ? 'was a copy' : 'were copies'}. The rest were who they said they were.` : `The ${num(d.purge)} put out through the gate were who they said they were. The copies were not on the list.`, `The ${num(d.purge)} put out through the gate were who they said they were.`);
  if (d.cuts) add('The marked were cut at the mess door, and one died of the cut.', 'Everyone cut at the mess door was who they said they were, and one died of the cut.', d.cuts === true ? 'The cutting at the mess door found nothing, because the copies were not among the marked.' : `The cutting at the mess door found ${num(d.cuts)} of the copies, and killed one colonist who was nothing of the kind.`, 'Everyone cut at the mess door was who they said they were, and one died of the cut.');
  if (d.burn) add('A party burned the place the voices came from.', 'Burning the scrape ended it.', 'The hollow that was burned had your people in it, asleep.', 'The camp that was burned was theirs, and the party shot what ran out of it.');
  if (d.fire) add(`The wall fired on sound for as long as it lasted${t.own ? `, and killed ${num(t.own)} of its own` : ''}.`, `The order to fire on sound was the right order for an animal${d.shot === 'late' ? ', and killed it in the end' : ''}${t.own ? `. It also killed ${num(t.own)} of your own, out late` : ''}.`, `The order to fire on sound was fired at the kept, who had woken and were trying to come home${t.own ? `. It also killed ${num(t.own)} of your own, out late` : ''}.`, 'Every shot fired on that order was fired at a colonist.');
  if (d.stood && !real) L.push(`You stood up in the hall for a copy of ${n0}.`); else if (d.stood && !doubt) L.push(`You stood by ${n0}, and ${n0} was ${n0}.`);
  if (d.bait) add('A hauler was paid in rations to sit out on a line, and was taken.', 'The hauler on the line was fed to it for a description.', 'The hauler on the line was taken alive, and copied.', 'The hauler on the line was led away by the hand, alive.');
  if (d.buried && k === 'lost' && !doubt) L.push('The marker put up for the rigger has nothing under it because the rigger was alive.');
  const out = L.filter(Boolean).slice(0, 4);
  return out.length ? out.join(' ') : doubt ? 'Nothing was done to anyone inside the wire on account of it.' : 'Nothing was done to anyone inside the wire on account of it, and nothing needs answering for.';
}
B('after', { id: 'vo.truth', chain: true, tone: 'quiet', title: 'What It Was',
  setup: s => { const t = T(s); return Object.assign({}, t.dbl || {}, crew(s, t.dbl && t.dbl.pid), { doubt: t.end === 'silence' && t.insight < 60, end: t.end, lured: t.lured + (t.led || 0), came: t.came || 0, culled: t.culled || 0 }); },
  text: (s, c) => { const t = T(s), k = t.truth.is;
    if (c.doubt) return `The voices have stopped. The watch log has an entry that reads "quiet", and then another, and that is all the ending there was. Nobody saw what was calling, and nothing was found past the lamps to say.\n\n${reckon(s, t, c, true)} ${c.lured ? `${Num(c.lured)} walked out to it before it ended. ` : ''}The record has nothing to weigh any of that against.`;
    const tail = c.end === 'silence' ? (k === 'mimic' ? ' It went when the season turned, and may come back with it.' : k === 'lost' ? ' The calling grew weaker and then stopped. A survey crew found the camp afterwards, and the people in it, who had been dead some time.' : ' The hollow was found empty and swept.')
      : c.end === 'copied' && c.came ? ` The watch brought ${num(c.came)} of the kept home from the hollow alive${c.culled ? `, and ${num(c.culled)} with the same faces were taken out behind the stores` : ''}.` : c.end === 'copied' && c.culled ? ` ${Num(c.culled)} of them were found inside the wire and taken out behind the stores.` : '';
    return `${WAS[k](t, c)}${tail}\n\n${reckon(s, t, c, false)}${c.lured ? ` ${Num(c.lured)} walked out to the voices before it ended${k === 'lost' && c.end === 'home' ? ', and walked back in with them' : ''}.` : ''}`; },
  choices: [
    { label: 'Enter it in the record as it happened, with the names', note: 'Everyone who did what was done has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who gave each order and who carried it out. People read it. Some of them stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the voices, with the names.' }) } },
    { label: (s, c) => c.end === 'home' ? 'Enter them as found by a search the colony sent out' : 'Enter it as an attack from outside, and everyone lost as lost to that', dark: true,
      note: (s, c) => c.end === 'home' ? 'The colony is written down as having looked for its own, and the nights it spent deciding whether to shoot them are left out.' : 'The colony gets a story it can live with, and the people it did things to are written down as something else\'s work.',
      out: { text: (s, c) => c.end === 'home' ? 'The record says a search party found the lost pod and brought its people in. The sleepers cannot say otherwise, and nobody who was in the hall that night has corrected it.'
          : 'The record says the colony was attacked from past the wire, and held. The dead are listed under that heading without distinction. It is the version the children will be taught.',
        fx: (s, c) => ({ morale: 3, stain: ['vo_record', 1], chron: c.end === 'home' ? 'The record says a search party found the lost pod and brought its people in.' : 'The record says the colony was attacked from past the wire, and held.' }) } },
  ] });

LF.TAGS['vo.first'] = ['cautious open', 'cautious order', 'severe closed'];
LF.TAGS['vo.names'] = ['cautious closed order', 'bold open', 'severe bold', 'severe closed'];
LF.TAGS['vo.gone'] = ['mercy open', 'closed order', 'bold', 'cautious closed', 'severe order'];
LF.TAGS['vo.tape'] = ['cautious open', 'cautious', 'closed order'];
LF.TAGS['vo.hall'] = ['bold open mercy', 'severe closed', 'cautious closed'];
LF.TAGS['vo.two'] = ['severe closed', 'severe bold', 'cautious order'];
LF.TAGS['vo.inside'] = ['severe bold', 'mercy open', 'severe order'];
LF.TAGS['vo.bill'] = ['severe closed', 'severe order', 'mercy free'];
LF.TAGS['vo.back'] = ['severe bold', 'mercy open', 'closed cautious'];
LF.TAGS['vo.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { const out = [];
  if (s.used['vo.first'] !== undefined) out.push({ k: 'call', card: 'vo.first', name: 'Where the voices are heard', kind: 'mark', dist: 'near', danger: 2, state: t.end ? 'worked out' : 'rumoured',
    known: 'Past the wire, after the lamps go down: more than one voice at talking pitch, with the rise and fall of people passing the time. Nobody on the wall can make out a word.' });
  if (s.used['vo.back'] !== undefined) out.push({ k: 'lair', card: 'vo.back', name: 'Where it lies up', kind: 'cave', dist: 'near', danger: t.end ? 2 : 4, state: t.end ? 'worked out' : 'visited',
    known: 'The party sent after the voices followed it here by day. They do not all tell it the same way.' });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5): out by day where the voices are heard at
   night. What they find points at the truth most of the time (pickK) and is fed to t.ev as the cards' evidence is. Under
   copy, one who lagged out of sight for an hour came home a copy (t.inside), and the same hour is lost on every truth,
   so the text never tells. The lair: a Meanwhile line. */
const CALL = {
  mimic: c => `Past the lamps the ${c.top} is marked by something low on four feet that drags. In a hollow under ${c.cover} it has a heap of things it has picked up: a lamp glass, a boot heel, a tin cup, all of them the colony's.`,
  copy: c => `Out where the voices carry from there is a row of shallow scrapes under ${c.cover}, each the length of a body and scraped smooth, and one line of ship-issue boot prints leading from them toward the wire.`,
  lost: c => `Out where the voices carry from the party found a scrap of the silver foil the cryo pods are lined with, folded small, and bare footprints in several sizes going round and round a place where somebody had sat facing the colony.` };
const LAIR = {
  mimic: c => `The hollow where it lies up stinks of meat, and the bones in it are all from animals of this world.`,
  copy: c => `The hollow where it lies up is swept clean, and somebody has laid a colony coat, folded, on a ledge of rock.`,
  lost: c => `The hollow where it lies up holds a nest of torn blanket and a ring of stones round the ash of a fire nobody in the colony lit.` };
LF.THREADS[ID].visit = (s, t, a) => {
  const pk = String(a.poi || '').split('.')[1]; if (pk !== 'call' && pk !== 'lair') return null;
  const c = { top: LF.lex(s, 'top'), cover: LF.lex(s, 'cover') }, e = pickK(s, t, 0.1);
  if (pk === 'lair' || t.end) { return Object.assign({ title: pk === 'lair' ? 'Where It Lies Up' : 'Where the Voices Were', text: (pk === 'lair' ? LAIR : CALL)[e](c), fx: { do: s2 => learn(s2, T(s2), 8, e) } }, { quiet: true }); }
  const lag = LF.srand(s) < (t.truth.is === 'copy' ? 0.45 : 0.25), copied = lag && t.truth.is === 'copy';
  return { title: 'Where the Voices Carry From', tone: 'pressure', scene: 'away_voices',
    text: `${CALL[e](c)}${lag ? ` On the way home one of the party dropped out of sight in ${c.cover} for most of an hour, and caught up again saying it had been nothing.` : ''} Nobody heard a voice by day.`,
    fx: { do: s2 => { const t2 = T(s2); learn(s2, t2, 15, e); if (copied) { t2.inside++; t2.out++; } } } };
};
})();
