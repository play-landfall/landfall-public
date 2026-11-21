/* Landfall — thread: the Sample. A dread (threads.js): dealt by the plot whatever the world, opening in the first months
   (t.nth 0) or later (1). Lachlan, 2026-11-16 (NEXT.md WO-1): Science thaws something out of a core sample and it is
   alive. It gets out of the dish, then out of the lab pod, then into the ducts and the water plant. It is small and
   physical, and it grows. The colony's own curiosity let it out, and every card is about a place it has reached and
   what is in that place with it. It never leaves the wire and never takes anybody over.
   Rolled in secret (t.truth.is), and each makes a different answer the right one:
     learns    it gets round every containment that has been tried on it once. The same answer never works twice; the
               one that does is one it has not met (t.tried). Sealing somebody in with it to go on working is the one
               thing it can never have met.
     harmless  it does nothing to people or plate. The dead are all from the panic and the measures, and every drastic
               answer was an atrocity for nothing.
     spore     what was seen is a seed stage, and what it grows into is the thing to fear. Killing the visible part early
               (fire, before it reaches the ducts) is right; waiting to study it is not (t.grown). Burning the lab ends it.
     air       this world's air kills it within the season. Every sealed room the colony makes is the only place it can
               live (t.sealed), and opening up, or venting the module, ends it.
   t.reach is how far it has got (0 the dish, 1 the lab, 2 the ducts, 3 the water plant, 4 the reckoning). It creeps on
   monthly (t.creep) unless the right kind of answer holds it (t.hold). Evidence (the glass, the sleeve, the pod walls,
   the ducts, the dead, the Scientist's jar, the filter beds) points at the truth only most of the time (pickK). Its bill
   is people in the pods it reaches, the Scientist's nerve, water while the plant is shut, and science itself if the
   lab is burned. Nothing here knows any other thread. Every card's text reads only what setup put in ctx. */
(function () {
'use strict';
const { clamp, h } = LF; const { P, R, If, byPid } = h;
const ID = 'sample', T = s => LF.T(s, ID), SRC = 'th.sample';
const KINDS = ['learns', 'harmless', 'spore', 'air'];
const RATE = 1, CREEP = 0.34;   // the dials: how often the pods it reaches lose somebody, and how fast it gets from one place to the next
const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const num = n => { n = Math.max(0, Math.round(n)); return n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : LF.num(n); };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1), Num = n => cap(num(n));
const is = (s, k) => T(s).truth.is === k;
const REACH = { sign: 0, lab: 1, ducts: 2, water: 3, choice: 4, bill: 4, after: 4 };

/* What a piece of evidence seems to say. Right more often than not, and oftener the more has been learned. */
const pickK = (s, t, bonus) => LF.srand(s) < clamp(0.5 + t.insight / 250 + (bonus || 0), 0.5, 0.85) ? t.truth.is : LF.spick(s, KINDS.filter(k => k !== t.truth.is));
function learn(s, t, v, kind) { t.insight = clamp(t.insight + v, 0, 100); if (kind) t.ev[kind] = (t.ev[kind] || 0) + 1; }
const EV = {
  glass: {
    learns: c => 'Under the glass it pulls back from the probe the first time it is touched. The second time the probe goes in at the same place, it has already moved off that side of the dish.',
    harmless: c => 'Under the glass it is a mat of soft threads living on the agar and nothing else. Set beside a scrape of skin from the bench hand\'s wrist, it grows round the scrape and leaves it alone.',
    spore: c => 'Under the glass the threads carry hard beads at their tips, and two of the beads have split. Whatever came out of them is too small to see, and has left tracks across the agar to the wall of the dish.',
    air: c => 'Under the glass it thrives in the sealed dish and sickens in the one left with its lid off overnight. The open one is brown and still by morning.' },
  sleeve: {
    learns: c => 'The patch has kept to the shape of the cuff and stopped there. Where the clinic swabbed it the first time nothing has grown back, and it has come in round the swab line from both sides.',
    harmless: c => `There is nothing on the skin. The redness is a reagent burn from the lab bench, and it is healing. The grey on the sleeve comes out in the wash.`,
    spore: c => 'There is a fine dust in the weave of the sleeve, gold under a lamp, and none on the skin. Under the glass the dust is the beads from the dish, split open.',
    air: c => 'The patch is thick under the cuff where the sleeve was tight, and gone wherever the cloth hung loose. On the bare forearm it died in the night and flakes off.' },
  pod: {
    learns: c => 'It has gone round every strip of tape the lab put up, in a neat margin, and over nothing else.',
    harmless: c => 'It is a grey bloom on the damp corners and nothing more. The seals, the bench and the cable runs under it are sound.',
    spore: c => 'The bloom is thickest under the vent grille, where the air moves, and there are pale specks on the outside of the door at head height.',
    air: c => 'It is in every sealed cabinet and on none of the open shelves. The cupboard with the broken latch, which never shut, is clean.' },
  duct: {
    learns: c => 'It has grown up to each damper the crews closed, and stopped. At the last one it went round through a cable run that nobody knew was open.',
    harmless: c => 'It lies along the floor of the trunking like dust, the whole run, and nothing under it is marked. The clinic has had nobody from that row it could put down to it.',
    spore: c => 'In the far run the grey has gone to gold, and the gold sheds when the fans turn. There is a film of it on the blankets under every grille.',
    air: c => 'It is thick where the trunking is sealed and gone where it leaks. At the outlet grille, where the world\'s air comes in at night, the duct is clean for an arm\'s length.' },
  body: {
    learns: c => 'Both of the dead had been treated for it once and come up clear. What killed them came back in at the place the treatment had not reached.',
    harmless: c => 'There is none of it in either of them. One drank the lye wash the rows were given to scrub with, and the other was crushed at a bunk-row door on the night of the alarm.',
    spore: c => 'There is a pale growth in the lungs of both, rooted and branching, bigger than anything in the dish and not the same shape.',
    air: c => 'Both slept in the inner rows, where the ducts are sealed and the air is still. Nobody from the rows along the outer wall has been touched.' },
  jar: {
    learns: c => `${c.Sf} has run the same test on it every day and kept the numbers. Each day's answer is different, and each moves away from whatever was tried the day before.`,
    harmless: c => `${c.Sf} has fed it, starved it and pricked it, and nothing it does reaches past the glass. It never touched the cut finger ${c.sf} pressed to the jar's mouth on the first night.`,
    spore: c => `The jar has gone gold inside, and the lid is dusted on the outside. ${c.Sf} calls it a new stage, and wants another month to watch it turn.`,
    air: c => `${c.Sf} has kept it sealed and thriving. The one time the lid was off for an hour, the top inch of it died.` },
  bed: {
    learns: c => 'It sits in the filter bed behind the plate the crew changed last month, and not in front of it. It came through the gap the change left.',
    harmless: c => 'It is in the filter bed as a grey felt, and the water past the beds is clean by every test the plant has. Nobody who drank from it this month is sick.',
    spore: c => 'The filter bed is gold with the shed of it, and past the beds the water carries the beads. Half of them have split.',
    air: c => 'It fills the closed tanks and is dying in the open settling trough, where the air gets at the water.' },
};
const ev = (kind, k, c) => EV[kind][k](c);
const LEAN = { learns: 'something that gets round whatever it has been shown once', harmless: 'something that does nothing to anyone', spore: 'a seed stage of something bigger', air: 'something this air kills, kept alive by sealed rooms' };
const lean = t => { const e = KINDS.map(k => [k, t.ev[k] || 0]).sort((a, b) => b[1] - a[1]);
  return !e[0][1] ? 'Nothing learned so far says what it is.' : e[0][1] === e[1][1] ? 'What has been learned so far points two ways at once.'
    : `What has been learned so far points at ${LEAN[e[0][0]]}, and not everyone accepts it.`; };

/* Names kept in the card's ctx, so the text reads the same whatever the choice does. bv, dv, wv, sv: the first name of
   the Engineering, Medical, Security or Science officer if one is at the post to say a line, else null. */
const nm = (s, role) => { const p = P(s, role); return p ? p.name : LF.seatWord(s, role); };
const voice = (s, seat) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : null; };
const crew = s => { const o = {}, t = T(s); for (const [k, role] of [['e', 'engineer'], ['d', 'physician'], ['sc', 'xenobio'], ['w', 'security'], ['cm', 'command']]) { o[k] = nm(s, role); o[k.charAt(0).toUpperCase() + k.slice(1)] = cap(o[k]); }
  o.bv = voice(s, 'engineer'); o.dv = voice(s, 'doctor'); o.wv = voice(s, 'security'); o.sv = voice(s, 'scientist');
  const p = LF.officer(s, 'scientist'), st = LF.seatState(s, 'scientist'); o.spid = p && (st === 'here' || st === 'hurt') ? p.id : null;
  o.sf = o.spid ? p.first : 'the lab'; o.Sf = cap(o.sf); o.lean = lean(t); return o; };
const who = p => p ? { pid: p.id, name: p.name, first: p.first } : null;
/* Somebody with a name and no office, out of the crowd (thread dice only). */
const someone = s => { const a = s.people.filter(p => p.alive && !p.away && !p.orbit && !p.role && p.known); return a.length ? LF.spick(s, a) : null; };
const sour = (s, pid, v, txt) => { const p = pid && byPid(s, pid); if (!p || !p.alive) return; if (p.loyal !== undefined) p.loyal = clamp(p.loyal - v, 0, 100); if (txt) p.marks.doubted = { d: s.day, txt }; };
const jump = (s, id, back) => { if (!s.sched.some(e => e.id === id)) s.sched.push({ id, day: s.day - back }); };
const die = (s, t, n) => { const b = s.pop; LF.deaths(s, Math.min(n, Math.max(0, s.pop - 12))); t.toll += b - s.pop; return b - s.pop; };
const nerve = (s, v) => { if (LF.shift) LF.shift(s, 'scientist', 'mind', v); };

/* A measure taken against it, of a kind (fire, seal, air, wash, cut, heat, mind; each card offers three at most since 2026-11-21). What it does is settled by what it is.
   v: how hard the measure bears (1 a whole answer, less for a half measure). */
function contain(s, t, kind, v) { v = v === undefined ? 1 : v; const k = t.truth.is, met = t.tried.includes(kind);
  if (!met) t.tried.push(kind);
  if (k === 'learns') { if (!met) { t.hold = Math.max(t.hold, s.day + Math.round(30 * v)); t.creep = Math.max(0, t.creep - 0.4 * v); } else { t.creep += 0.15; t.slip = (t.slip || 0) + 1; } return; }
  if (k === 'spore') { if (kind === 'fire') { if (t.reach < 2) t.grown *= 1 - 0.6 * v; else t.grown *= 1 - 0.25 * v; t.hold = Math.max(t.hold, s.day + Math.round(25 * v)); }
    else if (kind === 'wash' || kind === 'heat') t.grown *= 1 - 0.15 * v; else if (kind === 'air') t.creep += 0.3 * v; else if (kind === 'seal' || kind === 'cut') t.hold = Math.max(t.hold, s.day + Math.round(10 * v)); return; }
  if (k === 'air') { if (kind === 'seal') { t.sealed += v; t.creep += 0.15 * v; } else if (kind === 'air') { t.aired += v; t.hold = Math.max(t.hold, s.day + Math.round(30 * v)); t.creep = Math.max(0, t.creep - 0.5 * v); }
    else if (kind !== 'mind') t.hold = Math.max(t.hold, s.day + Math.round(8 * v)); return; }
}
/* Waiting to study it: under spore every month of looking is a month of growing. */
const wait = (s, t, v) => { t.waited = (t.waited || 0) + 1; if (t.truth.is === 'spore') t.grown += 0.25 * (v || 1); };
/* Whether what is in place is holding it, for the month's figures. */
const working = (s, t) => ({ learns: t.hold > s.day, harmless: true, spore: t.grown < 0.6, air: t.aired > t.sealed })[t.truth.is];

/* The rows it has reached lose people. Under harmless it is the measures that kill: the lye, the doors on the night of an alarm. */
const OUTL = ['A sleeper in the row under the grey duct did not wake this morning. The blanket over the face was grey along the hem.', 'One of the lab crew went down at the bench with a cough and was dead by evening.',
  'The clinic lost one from the second row in the night, of a fever that came on at supper.', 'A child of the inner rows was found cold in the bunk at the dawn count, with grey under the nails.'];
const PANIC = ['A bunk row fought over whose duct the grey was coming from, and one of them went down with a cracked skull.', 'Somebody drank from a bucket of the lye wash in the dark, thinking it water, and was dead by morning.',
  'An alarm went up in the second row at night, and the door jammed with people. One of them was under the rest.'];
const THIRST = ['The lander\'s tanks ran low before the boiling pots could keep up, and one of the old ones in the clinic died of it.', 'A field hand drank from a ditch sooner than wait at the pot, and is dead of what was in the ditch.'];
function month(s, t) {
  const k = t.truth.is, ph = t.phase, held = t.hold > s.day;
  let p = ({ sign: 0, lab: 0.12, ducts: 0.4, water: 0.55, choice: 0.6, bill: 0.5 }[ph] || 0) * RATE * (held ? 0.4 : 1) * (t.cleared ? 0.6 : 1);
  if (k === 'harmless') p = (t.panic > 0 ? 0.08 * t.panic : 0) * RATE;
  else if (k === 'spore') p *= t.reach >= 2 ? clamp(t.grown, 0.15, 2) : 0.3;
  else if (k === 'air') p *= clamp(0.7 + 0.3 * t.sealed - 0.35 * t.aired, 0.15, 2);
  if (t.sickIn && k !== 'harmless') p *= 1.3;
  if (p > 0 && s.pop > 16 && LF.srand(s) < p && die(s, t, 1)) LF.log(s, LF.spick(s, k === 'harmless' ? PANIC : OUTL), 'bad');
  if (t.shut && !t.unshut && s.pop > 16 && LF.srand(s) < (s.built.wells ? 0.05 : 0.18) && die(s, t, 1)) LF.log(s, LF.spick(s, THIRST), 'bad');
  if (['lab', 'ducts', 'water', 'choice', 'bill'].includes(ph)) nerve(s, t.culture ? -2 : -1);
  if (k !== 'learns') return;
  // learns: whatever held it last month it has learned its way round
  if (held && t.hold - s.day < 10) LF.log(s, 'The grey has come round the last measure taken against it, in a margin as neat as a ruled line.', 'bad');
}
/* Nobody ends it with one card: it ends when the last answer has had its season, by what was done. */
function finish(s, t, end, chron) { LF.endThread(s, ID, end, chron); s.sched = s.sched.filter(e => !/^smp\./.test(e.id)); s.sched.push({ id: 'smp.truth', day: s.day + LF.sri(s, 6, 14) - 20 }); }
function ran(s, t, share) { const n = die(s, t, clamp(Math.round(LF.sized(s) * 0.03 * share), 2, 6)); nerve(s, -8); s.morale = clamp(s.morale - 4, 0, 100);
  if (n) LF.log(s, `The grey went through the last of the rows before it was done. ${Num(n)} more died of it.`, 'bad'); }
/* Whoever was sealed in with it, when it is over: out alive, or dead in there. */
function unseal(s, t, alive) { if (!t.inside) return; const p = t.inside.pid && byPid(s, t.inside.pid);
  if (!alive) { if (p && p.alive) LF.killPerson(s, p, 'sealed in the lab pod with the Sample'); else die(s, t, 1); if (p) t.toll++; t.inside.dead = true; }
  else if (p && p.alive) p.marks.sealed = { d: s.day, txt: 'was sealed in the lab pod with the Sample, and came out' };
  t.inside.out = s.day; }
function resolve(s, t) {
  const k = t.truth.is, d = t.did, drastic = d.vent || d.burn || d.seal;
  if (k === 'harmless') { unseal(s, t, true); return finish(s, t, drastic ? 'needless' : 'harmless', drastic ? 'The colony found that the thing from the core had never hurt anyone, after it had done what it did about it.' : 'The thing from the core ran its course and hurt nobody, and the colony learned that the hard way.'); }
  if (k === 'learns') { if (d.seal && t.inside && !t.inside.dead) { unseal(s, t, true); return finish(s, t, 'outworked', 'Whoever was sealed in with the thing from the core stayed ahead of it until it stopped.'); }
    if (t.finalNew) { unseal(s, t, false); return finish(s, t, 'outrun', 'The colony ended the thing from the core with the one thing it had never been shown.'); }
    unseal(s, t, false); ran(s, t, 1); return finish(s, t, 'ran', 'The thing from the core got round everything the colony tried, and ran its course.'); }
  if (k === 'spore') { unseal(s, t, false); if (d.burn) return finish(s, t, 'burned', 'The colony burned the lab with every sample, and the thing from the core ended in the fire.');
    if (t.grown <= 0.5) return finish(s, t, 'early', 'The thing from the core was burned before it could grow, and never came to anything.');
    ran(s, t, clamp(t.grown, 0.6, 1.6)); return finish(s, t, 'ran', 'What grew out of the core sample went through the rows before it died back.'); }
  if ((d.vent || d.open || t.aired > t.sealed) && !d.welded) { unseal(s, t, !!d.doorOpen); return finish(s, t, d.vent ? 'vented' : 'aired', 'The world\'s own air killed the thing from the core, once the colony let it in.'); }
  unseal(s, t, false); ran(s, t, clamp(0.7 + 0.2 * t.sealed, 0.7, 1.5)); return finish(s, t, 'ran', 'The thing from the core lived on in the colony\'s sealed rooms until it had been through all of them.');
}

LF.thread({ id: ID, name: 'The Sample', view: 'colony', dread: true,
  clue: (s, t) => ({ txt: 'A lab log with every entry initialled twice. Halfway down the last page a dish is listed as moved by nobody, and the entries after it are all about the lid.', learn: s2 => learn(s2, T(s2), 15) }),
  called: (s, t) => t.phase === 'latent' ? null : t.phase === 'sign' ? 'the thing in the dish' : 'the Sample',
  roll: s => ({ is: LF.spick(s, KINDS) }),
  sig: t => t.truth.is,
  ask: (s, t) => 'What came out of the core sample?',
  chap: {
    early: t => 'The thing in the core sample was a seed. The colony burned it in the dish, before it could grow into what it was going to be.',
    burned: t => 'The thing in the core sample was a seed of something worse. The colony burned the lab with every sample and every record of where they were cut, and it ended in the fire.',
    vented: t => 'The thing in the core sample could only live in the colony\'s sealed rooms. The colony vented the module with people still inside, and this world\'s air killed it.',
    aired: t => 'The thing in the core sample could only live in the colony\'s sealed rooms. The colony opened its doors to this world\'s air, and the air killed it.',
    outworked: t => 'The thing in the core sample got round every measure it had been shown once. The colony sealed somebody in with it to go on working, and that kept ahead of it.',
    outrun: t => 'The thing in the core sample got round every measure it had been shown once. The colony ended it with the one thing it had never met.',
    harmless: t => 'The thing in the core sample never hurt anyone. Everyone who died of it died of the fear and the measures.',
    needless: t => `The thing in the core sample never hurt anyone. The colony ${t.did.vent ? 'vented a module with people in it' : t.did.burn ? 'burned its lab and every record of this world' : 'sealed somebody in with it'} before it found that out.`,
    ran: t => ({ learns: 'The thing in the core sample got round everything that was tried on it, and went through the rows.', spore: 'The thing in the core sample was a seed. The colony watched it grow, and what it grew into went through the rows.', air: 'The thing in the core sample could only live in sealed rooms, and the colony kept sealing them.' })[t.truth.is] || 'The thing in the core sample went through the rows.',
  },
  start: (s, t) => { Object.assign(t, { at: t.at || (t.nth ? LF.sri(s, 70, 130) : LF.sri(s, 12, 35)), insight: 0, ev: {}, did: {}, q: {}, tried: [], reach: 0, creep: 0, hold: 0, grown: 1, sealed: 0, aired: 0, panic: 0, toll: 0, tech: null, inside: null }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at) { LF.phase(s, ID, 'sign'); s.signs.push({ id: 'placed', d: s.day, src: SRC }); LF.cue(s, 'smp.dish', 0, 4); } return; }
    const since = id => s.used[id] === undefined ? -1 : s.day - s.used[id], age = s.day - t.since, once = (k, id) => { if (!t.q[k]) { t.q[k] = s.day; LF.cue(s, id, 0, 4); return true; } };
    // It creeps on each month unless something is holding it, and each stage waits for the card before it.
    if (s.day % 10 === 0) t.creep += CREEP * (t.hold > s.day ? 0.25 : 1) * (t.truth.is === 'air' && t.aired > t.sealed ? 0.5 : 1);
    const go = (card, cap) => (since(card) >= 10 && t.creep >= 1) || age >= cap;
    if (t.phase === 'sign') { if (go('smp.dish', 80)) { LF.phase(s, ID, 'lab', 'The thing from the core sample got out of its dish.'); t.creep = 0; t.reach = 1; const p = someone(s); t.tech = who(p) || { pid: null, name: 'the glass hand', first: 'the glass hand' }; LF.cue(s, 'smp.sleeve', 0, 4); s.signs.push({ id: 'sickness', d: s.day, src: SRC }); } }
    else if (t.phase === 'lab') { if (since('smp.sleeve') >= 10) once('pod', 'smp.pod');
      if (go('smp.pod', 110)) { LF.phase(s, ID, 'ducts', 'The grey from the lab was found in the ducts two pods away.'); t.creep = 0; t.reach = 2; LF.cue(s, 'smp.ducts', 0, 4); s.tension = clamp(s.tension + 5, 0, 100);
        if (t.techIn) { const tp = t.tech && t.tech.pid && byPid(s, t.tech.pid); t.techIn = 0;
          if (t.truth.is === 'harmless' || t.truth.is === 'learns') LF.log(s, `${cap(t.tech.name)} was let out of the lab pod when the grey turned up in the ducts, thin and well.`, '');
          else { if (tp && tp.alive) LF.killPerson(s, tp, 'sealed in the lab pod with the grey'); else die(s, t, 1); t.toll += tp ? 1 : 0; LF.log(s, `When the lab pod was opened, ${t.tech.name} was dead inside it.`, 'bad'); } } } }
    else if (t.phase === 'ducts') { if (since('smp.ducts') >= 10 && voice(s, 'scientist')) once('culture', 'smp.culture');
      if (go('smp.ducts', 110)) { LF.phase(s, ID, 'water', 'The grey reached the water plant.'); t.creep = 0; t.reach = 3; LF.cue(s, 'smp.water', 0, 4); s.signs.push({ id: 'water_taint', d: s.day, src: SRC }); s.tension = clamp(s.tension + 5, 0, 100); } }
    else if (t.phase === 'water') { if (since('smp.water') >= 10 && t.toll >= 1) once('reached', 'smp.reached');
      if ((since('smp.water') >= 20 && (t.creep >= 1 || since('smp.reached') >= 8)) || age >= 100) { LF.phase(s, ID, 'choice'); t.reach = 4; jump(s, 'smp.choice', 20); } }
    else if (t.phase === 'choice') { const due = t.did.slow && since('smp.slow') < 0;   // the second card is owed: the bill waits for it
      if ((!due && (since(t.did.slow ? 'smp.slow' : 'smp.choice') >= 20 || age >= 60)) || age >= 150) { LF.phase(s, ID, 'bill'); t.billId = t.inside && !t.inside.out ? 'smp.door' : 'smp.after'; jump(s, t.billId, 20); } }
    else if (t.phase === 'bill') { if (since(t.billId) >= 20 || age >= 70) return resolve(s, t); }
    if (s.day % 10 === 0) month(s, t);
    if (s.day % 5 === 0) { const late = ['water', 'choice', 'bill'].includes(t.phase);
      if (t.insight < 60) LF.emit(s, 'unexplained', SRC, t.phase === 'sign' ? 30 : 26, 8, 'something thawed out of a core sample is alive, and nobody can say what it is');
      if (t.phase !== 'sign') LF.emit(s, 'contamination', SRC, late ? 36 : 28, 8, 'the grey from the lab is in the pod walls and the ducts');
      if (t.reach >= 2) LF.emit(s, 'fear', SRC, late ? 34 : 26, 8, 'the grey from the lab is in the ducts over the bunk rows');
      if (t.reach >= 2 && t.truth.is !== 'harmless') LF.emit(s, 'sickness', SRC, 24, 8, 'people are dying in the rows the grey has reached');
      if (t.shut && !t.unshut) LF.emit(s, 'scarcity', SRC, 30, 8, 'the water plant is shut on account of the grey');
      if (t.cleared || t.inside && !t.inside.out) LF.emit(s, 'confinement', SRC, 26, 8, t.inside && !t.inside.out ? 'somebody is welded into the lab pod with the grey' : 'people are shut away from the grey, or in with it'); }
  },
  /* The masks, the taped seams, the boiling pots; and afterwards, what a burned lab costs. */
  press: (s, t, P) => { if (t.phase === 'latent') return;
    if (t.end) { if (t.did.burn && s.day - t.endDay < 2 * LF.YEAR) { P.yield -= s.built.soillab ? 0.04 : 0.02; } return; }
    let d = { sign: 0, lab: 0.008, ducts: 0.015, water: 0.02, choice: 0.025, bill: 0.02 }[t.phase] || 0;
    if (t.cleared) d += 0.01; if (t.boil) d += 0.015; if (t.opened) d += 0.02; P.labor -= d;
    if (t.shut && !t.unshut) P.morale -= 0.01; },
});
const B = (ph, st) => LF.beat(ID, ph, Object.assign({ view: 'colony', chain: true }, st));

/* ======================= SIGN: the dish ======================= */
const SKIN = {
  learns: 'The patch spreads to the edge of the dressing and stops. When the dressing is moved, the patch has followed it by morning, to the new edge and no further.',
  harmless: 'Nothing grows on the arm. Under the dressing the skin is red from the tape and nothing else.',
  spore: 'The patch rises into a blister of gold dust that bursts in the night. The inside of the dressing is gold, and so is the pillow.',
  air: 'The patch takes under the dressing and dies within a day of the dressing coming off.' };
B('sign', { id: 'smp.dish', tone: 'pressure', title: 'Something in the Dish',
  setup: s => Object.assign(crew(s), { ev: pickK(s, T(s)), under: LF.lex(s, 'under') }),
  text: (s, c) => `The lab pod has had a core from forty metres under ${c.under} thawing in a cold box since landfall. This morning one of its culture dishes was at the far end of the bench, and the grey film in it had crossed to the side nearest the lamp. The night log says nobody touched it.\n\n${c.sv ? `[[scientist]] "It went to the lamp." "By itself, overnight, out of ice older than anything we've got a name for, and I know, I wrote the rule about thawing cores, I know which page it's on, but come and see it first and then read me the rule."` : `${c.Sc} has asked for a month with it.`}`,
  choices: [
    { label: 'Put it under the glass for the month', note: 'The lab works on nothing else, and whatever it is gets a month to grow while it is watched.', test: { base: 50, mods: [R('xenobio', 10), R('physician', 5)] },
      ok: { text: (s, c) => `${c.Sc} spends the month at the glass. ${ev('glass', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev); wait(s2, t); } }) },
      bad: { text: 'The month goes on keeping it alive. By the end there are four dishes of it, and the notes say more about the agar than about what grew on it.', fx: s => ({ do: s2 => { const t = T(s2); learn(s2, t, 6); wait(s2, t); } }) } },
    { label: 'Flame the dish, the bench top and what is left of the core', note: (s, c) => `A year of drilling goes into the kiln pit, and so does the only sample of whatever this is${c.spid ? `. ${c.Sf} will not forgive it quickly` : ''}.`,
      out: { text: 'The dish, the core boxes and the bench top go into the kiln pit. The lab smells of scorched agar for the rest of the month, and the drilling log is closed with a line under it.',
        fx: s => ({ off: [['scientist', 'mind', -5]], do: s2 => { const t = T(s2); contain(s2, t, 'fire'); t.did.flamed = true; } }) } },
    { label: 'Put a drop of it on the forearm of one of the punishment detail, and watch the arm for a month', dark: true, note: 'It shows what it does to a person, on a person who was not asked.', info: [['yield', 'What it does to people'], ['danger', 'The one with the arm']],
      out: { text: (s, c) => `The drop goes on under a dressing in the clinic, with the detail standing at the door. ${SKIN[T(s).truth.is]} The one who wore it has scratched the arm raw and will not sleep in the row.`,
        fx: s => ({ stain: ['smp_skin', 2], do: s2 => { const t = T(s2), k = t.truth.is; learn(s2, t, 30, k); learn(s2, t, 12, k); t.did.skin = true; if (k === 'spore') t.creep += 0.3; } }) } },
  ] });

/* ======================= LAB: the sleeve, and the pod ======================= */
B('lab', { id: 'smp.sleeve', view: 'people', tone: 'pressure', title: 'On a Sleeve',
  setup: s => { const t = T(s), x = t.tech; return Object.assign(crew(s), { ev: pickK(s, t, 0.05), tpid: x.pid, tech: x.name, Tech: cap(x.name), tf: x.first, Tf: cap(x.first) }); },
  text: (s, c) => `It is out of the dish. ${c.tpid ? `${c.Tech}, who washes the lab's glass,` : 'The hand who washes the lab\'s glass'} came to the clinic this morning with a grey patch on the cuff of a coverall sleeve the size of a palm, and the wrist under the cuff is red. The dish it came out of was found empty with the lid on.\n\n${c.dv ? `[[physician]] "${c.Tf} was washing glass, that's all, and came straight to me the minute it itched, which is exactly what I tell people to do." "Before anyone decides anything about ${c.tf}, you come down to the clinic and you look at the arm."` : `${c.D} has ${c.tf} in the clinic's end room with the door shut.`}`,
  choices: [
    { label: (s, c) => `Have the clinic go over the arm, scrub it and keep the sleeve`, note: (s, c) => `${c.Tf} spends the month in the end room being scraped and swabbed, and the clinic works a room short.`, test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `${c.D} keeps ${c.tf} in the end room and scrubs the wrist twice a day. ${ev('sleeve', c.ev, c)}`, fx: (s, c) => ({ do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev); contain(s2, t, 'wash', 0.5); } }) },
      bad: { text: 'The scrubbing takes the skin off the wrist and tells nobody anything. Two of the clinic hands have a rash on their own wrists by the end of the month, which may be the soap.', fx: s => ({ do: s2 => { const t = T(s2); learn(s2, t, 6); contain(s2, t, 'wash', 0.5); } }) } },
    { label: (s, c) => `Seal the lab pod with ${c.tf} inside it, until it is known`, dark: true, note: (s, c) => `${c.Tf} is shut in with whatever is on that sleeve, and so is the lab.`, info: (s, c) => [['yield', 'Nothing it touched comes out'], ['danger', c.Tf]],
      out: { text: (s, c) => `The pod door is dogged from outside with ${c.tf} and a cot inside. Food goes in through the sample hatch, and ${c.tf} knocks on the hatch at every change of watch, to say still here.`,
        fx: s => ({ stain: ['smp_shut', 2], do: s2 => { const t = T(s2); contain(s2, t, 'seal'); t.techIn = s2.day; t.did.techIn = true; } }) } },
    { label: (s, c) => `Call it a reagent burn, and send ${c.tf} back to the bunk row`, note: (s, c) => `If it is anything, it goes to the bunk row on ${c.tf}'s sleeve, and the row is told nothing.`,
      out: { text: (s, c) => `${c.Tf} is given a salve and a clean coverall and walks back to the row for supper. The old sleeve goes in the wash with everyone else's.`,
        fx: s => ({ morale: 1, do: s2 => { const t = T(s2); t.creep += 0.35; t.did.sent = true; } }) } },
  ] });

B('lab', { id: 'smp.pod', tone: 'crisis', title: 'The Lab Pod',
  setup: s => crew(s),
  text: (s, c) => `${c.E} lifted the lab pod's ceiling panels to get at a fan that had stopped, and the backs of the panels are grey. It is in the cable runs, along the door seal and in the cabinet where the cores are kept, and the fan is clogged with it. The lab pod shares a wall with the clinic.\n\n${c.bv ? `[[engineer]] "The pod'll stand a month like that, a bit more if we keep the door shut." "The fan won't, she's clogged solid, and when she goes, whatever's in there goes wherever the air goes."\n\n` : `${c.E} says the fan will not last the month. `}${c.lean}`,
  choices: [
    { label: 'Tape every seam, pack the vents with filter cloth, and keep the door shut', cost: { mat: 8 }, note: 'The lab works on inside a sealed box, and the people in it breathe what the filters leave them.',
      out: { text: 'Every seam is taped twice and the vents are packed. The pod is quieter with the fan off, and warmer, and the lab crew work in masks.', fx: s => ({ do: s2 => { const t = T(s2); contain(s2, t, 'seal'); t.did.taped = true; } }) } },
    { label: 'Burn the pod out from the inside with the cutting torches', note: 'The lab loses its benches, its instruments and a season of work, and whatever is in the walls may be past them already.',
      out: { text: 'The torches go round the inside of the pod for a day. The panels blister and the cabinets come out black. The lab moves into a corner of the stores with what could be carried.',
        fx: s => ({ mat: -10, off: [['scientist', 'mind', -4]], do: s2 => { const t = T(s2); contain(s2, t, 'fire'); t.did.podburn = true; for (const f of s2.factors) if (!f.res) f.insight = Math.round(f.insight * 0.85); } }) } },
    { label: 'Pin the doors back, pull the panels, and let the outside air through it for a month', note: 'The lab stands open to the weather with its instruments in it, and anything in there is free to walk out of the door.',
      out: { text: 'The doors are pinned back and the ceiling panels stacked in the yard. The wind goes through the pod day and night, and the lab crew work in coats at the far end.', fx: s => ({ morale: -1, parts: -2, do: s2 => { const t = T(s2); contain(s2, t, 'air'); t.did.podair = true; } }) } },
  ] });

/* ======================= DUCTS: two pods away, and the Scientist's jar ======================= */
B('ducts', { id: 'smp.ducts', tone: 'crisis', title: 'Two Pods Away',
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.08) }); },
  text: (s, c) => `The night watch smelt it before anyone saw it: a sweetish rot in the second bunk row, two pods along from the lab. ${c.W} had a grille off at first light. The duct behind it is furred grey as far as a lamp reaches, and the row has slept under it for most of a month.\n\n${c.wv ? `[[security]] "It's gone two pods down a pipe in a month under a whole row of sleepers, and not one of them noticed?" "That tells me nobody was looking, so would someone like to tell me which way it's going next, because I'd like to be standing there when it arrives."\n\n` : `${c.W} has the grille wired back on and a guard on the row door. `}${c.lean}`,
  choices: [
    { label: 'Clear the row, and sleep everyone from it on the mess hall floor', note: 'The row sleeps on boards in a crowd for as long as it takes, and the ducts stay as they are.',
      out: { text: 'The row carries its bedding to the mess after supper. The benches go against the walls and the floor is laid with blankets edge to edge. The grille is taped over in the empty row.',
        fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.cleared = s2.day; t.did.cleared = true; LF.emit(s2, 'confinement', 'smp.cleared', 22, 120, 'a bunk row sleeps on the mess floor to keep clear of the grey'); } }) } },
    { label: 'Blow the ducts through with outside air, every fan run backwards, for a week of nights', note: 'Whatever is in the ducts goes out of them into the yard, and through every other row on the way.',
      out: { text: 'The fans are rewired to run backwards and the outer grilles are opened. For a week the rows sleep in the cold with the night air going through the trunking over their heads.', fx: s => ({ morale: -1, do: s2 => { const t = T(s2); contain(s2, t, 'air'); t.did.blown = true; } }) } },
    { label: 'Send the punishment detail into the ducts with scrapers and sacks', dark: true, note: 'The ducts are cleared by hand, by people crawling through the grey who were not asked.', info: [['yield', 'Clean ducts'], ['danger', 'The detail']],
      out: { text: (s, c) => `The detail goes in at the lab end with lamps and sacks and comes out at the far end of the row. They clear the run inside the month. ${ev('duct', c.ev, c)} Two of the detail are in the clinic by the end of it with a cough that will not shift.`,
        fx: (s, c) => ({ stain: ['smp_crawl', 2], do: s2 => { const t = T(s2); learn(s2, t, 16, c.ev); contain(s2, t, 'cut'); t.did.crawl = true; } }) } },
  ] });

const WARD = {
  learns: 'The first patient takes it and holds it off for a week. The second takes it somewhere the first one did not, and dies in two days.',
  harmless: 'Nothing happens to either of them. They die when they were always going to, a week apart, and neither has a mark of it.',
  spore: 'Within the week the patient\'s breath leaves a gold film on the cup. The patient dies two days sooner than the clinic gave, and the pillow is gold.',
  air: 'Both of them take it in the closed end room. One of them was carried out to the porch to die in the air, and the grey on that one\'s arm was brown and flaking by evening.' };
B(['ducts', 'water'], { id: 'smp.culture', view: 'people', tone: 'pressure', title: 'Kept Back',
  when: s => voice(s, 'scientist'),
  setup: s => { const t = T(s), c = crew(s), p = LF.officer(s, 'scientist'); return Object.assign(c, { ev: pickK(s, t, 0.12), pid: p.id, sf: p.first, Sf: cap(p.first), sci: p.name }); },
  text: (s, c) => `A storehand turning out the officers' row found a sealed jar of the grey in ${c.sci}'s locker, labelled in ${c.sf}'s own hand and kept warm on a heat pad. ${c.Sf} has been feeding it since the dish.\n\n[[${c.pid}]] "Of course I kept some." "You were going to burn the lot. Somebody has to know what it is, and it won't tell anyone who's set it on fire. Look, it's sealed. It's fine, it's... give me a month with it."`,
  choices: [
    { label: (s, c) => `Let ${c.sf} keep it, under lock, in the lab`, note: (s, c) => `If it gets out of the jar, it gets out in the lab, and ${c.sf} works an arm's length from it every day.`,
      out: { text: (s, c) => `The jar goes into a locked cabinet with a key on ${c.sf}'s neck. ${ev('jar', c.ev, c)}`, fx: (s, c) => ({ off: [['ctx', 'native', 4]], do: s2 => { const t = T(s2); learn(s2, t, 22, c.ev); wait(s2, t); t.culture = s2.day; t.did.culture = true; } }) } },
    { label: (s, c) => `Take the jar off ${c.sf} and put it in the kiln`, note: (s, c) => `${c.Sf} loses the one thing that might say what this is, and a good deal of regard for you.`,
      out: { text: (s, c) => `${c.W} takes the jar out of the locker in front of the row and carries it to the kiln pit. ${c.Sf} follows as far as the door and watches it go in.`,
        fx: (s, c) => ({ off: [['ctx', 'mind', -6]], do: s2 => { const t = T(s2); contain(s2, t, 'fire', 0.4); sour(s2, c.pid, 15, 'you had the jar taken and burned in front of the row'); } }) } },
    { label: (s, c) => `Let ${c.sf} try it on the ward, on patients who will not last the month`, dark: true, note: 'It shows what it does to people, on people too weak to refuse.', info: [['yield', 'What it does to people'], ['danger', 'The dying on the ward']],
      out: { text: (s, c) => `${c.D} ${c.dv ? 'will not hold the door, and says so in front of the ward' : 'is told after'}. ${c.Sf} does it at night with a dropper. ${WARD[T(s).truth.is]}`,
        fx: (s, c) => ({ stain: ['smp_ward', 3], off: [['ctx', 'native', 6], ['ctx', 'mind', -4]], pop: is(s, 'harmless') ? 0 : -1, do: s2 => { const t = T(s2), k = t.truth.is; learn(s2, t, 30, k); learn(s2, t, 12, k); if (k !== 'harmless') t.toll++; t.did.ward = true; } }) } },
  ] });

/* ======================= WATER: the plant, and the rows it reached ======================= */
B('water', { id: 'smp.water', tone: 'crisis', title: 'The Water Plant',
  setup: s => { const t = T(s), c = crew(s), wells = !!s.built.wells; return Object.assign(c, { ev: pickK(s, t, 0.1), wells, alt: wells ? 'The wells could carry the colony without it, short.' : LF.down(s, 'reclaimer') ? 'There is nothing else to drink but what the tanks hold.' : 'The plant is what fills the boiling pots and the lander\'s tanks, and there is nothing behind it.' }); },
  text: (s, c) => `It is in the water plant. ${c.E} pulled the filter beds for their monthly wash and found them matted grey right through, and the grey runs down into the outlet. Everybody in the colony has drunk from that outlet since the last wash. ${c.alt}\n\n${c.bv ? `[[engineer]] "I can shut her down tonight if you say so, and she won't thank us for it." "Then you tell me what everybody drinks, because I've been stood here working it out and I haven't got an answer."\n\n` : `${c.E} can shut the plant down tonight, and has asked what the colony is to drink. `}${c.lean}`,
  choices: [
    { label: 'Shut the plant, and drink what is stored until it is clean', note: (s, c) => c.wells ? 'The colony goes on well water and short cups, and the weakest go short first.' : 'The colony goes on short cups, and the weakest go short first.',
      out: { text: (s, c) => `The plant is drained and shut. ${c.wells ? 'The well queues start before light.' : 'The cups are measured out at the pot by the watch.'} The filter beds are left lying in the yard.`, fx: s => ({ morale: -2, do: s2 => { const t = T(s2); t.shut = s2.day; t.did.shut = true; } }) } },
    { label: 'Keep it running, and boil every cup', note: 'Every cup is boiled over fuel the stoves cannot spare, and if heat does not kill it the colony drinks it boiled.',
      out: { text: 'The pots go on at every stove and stay on. The water tastes of the pot, and the fuel store goes down by a cart a day.', fx: s => ({ mat: -8, do: s2 => { const t = T(s2); t.boil = s2.day; contain(s2, t, 'heat', 0.6); } }) } },
    { label: 'Dose the tanks with chlorine until it can be tasted', note: 'The water is scoured, and the old and the sick drink it with everyone else.',
      out: { text: (s, c) => `${c.E} doses the tanks at dusk, a drum at a time. In the morning the water tastes of the clinic. By the end of the month the cramps have gone through the colony, and one of the oldest on the ward has died of them.`,
        fx: s => ({ pop: -1, do: s2 => { const t = T(s2); t.toll++; if (t.truth.is === 'harmless') t.panic++; contain(s2, t, 'wash'); } }) } },
  ] });

B(['water', 'choice'], { id: 'smp.reached', view: 'people', tone: 'pressure', title: 'The Rows It Reached',
  when: (s, t) => t.toll >= 1,
  setup: s => { const t = T(s); return Object.assign(crew(s), { ev: pickK(s, t, 0.12), n: t.toll }); },
  text: (s, c) => `${c.n === 1 ? 'One person has' : `${Num(c.n)} people have`} died in the rows the grey has reached. ${c.D} has the latest two in the cold room and wants to open them. The families want them buried tonight, and the rows want the bedding of every one of the dead burned in the yard.${c.dv ? `\n\n[[physician]] "I need to know what they died of, and I know the families want them in the ground tonight, and in their place I'd want the same." "So do you, and so does whoever's next in that row, so you go and tell the families that."` : ''}`,
  choices: [
    { label: 'Have the two in the cold room opened', note: 'The families are told afterwards, and the clinic learns what the rows died of.', test: { base: 60, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The clinic works through the night with the door locked. ${ev('body', c.ev, c)}`, fx: (s, c) => ({ morale: -1, do: s2 => learn(s2, T(s2), 24, c.ev) }) },
      bad: { text: 'The cold room\'s compressor has been off for a day, and what is on the table can be read for very little. The families hear before morning.', fx: s => ({ morale: -2, do: s2 => learn(s2, T(s2), 5) }) } },
    { label: 'Bury them tonight, and burn their bedding with them', note: 'The families get their night, and whatever was in them goes into the ground unread.',
      out: { text: 'The graves are dug by lamplight and the bedding burns in a drum at the end of the row. The families stand at the drum until it is out.', fx: s => ({ morale: 2, do: s2 => { const t = T(s2); contain(s2, t, 'fire', 0.3); LF.ease(s2, 'grief', 'smp.buried', 12, 60); } }) } },
    { label: 'Put the sick from those rows into the lab pod with it, so the clinic stays clean', dark: true, note: 'The clinic stays open to everyone else, and the sick lie in the place it came from.', info: [['yield', 'A clean clinic'], ['danger', 'The sick from the rows']],
      out: { text: 'The sick are carried over on their cots after dark and the lab pod door is shut on them. Food goes in through the sample hatch, and a clinic hand goes in once a day in a mask.',
        fx: s => ({ morale: 1, stain: ['smp_pod', 3], do: s2 => { const t = T(s2); t.sickIn = s2.day; t.did.sickIn = true; contain(s2, t, 'seal', 0.5); } }) } },
  ] });

/* ======================= CHOICE: the ways to end it ======================= */
const GONE = { orbit: c => 'the one who should be doing it is still aboard the ship', away: c => `${c.sci} is out past the wire with a party`, empty: c => 'nobody holds the Science seat' };
/* Ways to End It is two cards since 2026-11-21 (three options at most). There are five answers and four truths, each truth wanting a
   different one, and they would not fold into three without losing an ending. smp.choice holds the two that cannot be taken back (vent,
   burn) and a refusal; the refusal deals smp.slow at once, with the three slower ways (seal somebody in to go on working, open every
   pod, hold). The second card uses the first one's scene and sound. */
const endCtx = s => { const t = T(s), c = crew(s), st = LF.seatState(s, 'scientist'), p = LF.officer(s, 'scientist'), off = !!(p && (st === 'here' || st === 'hurt'));
    const hand = off ? null : t.tech && t.tech.pid && byPid(s, t.tech.pid) && byPid(s, t.tech.pid).alive ? t.tech : who(someone(s));
    return Object.assign(c, { off, opid: off ? p.id : null, sci: p ? p.name : nm(s, 'xenobio'), sf: off ? p.first : null, Sf: off ? cap(p.first) : null, gone: off ? '' : (GONE[st] || GONE.empty)({ sci: p ? p.name : '' }),
      hand: hand ? hand.name : 'the senior lab hand', hpid: hand ? hand.pid : null, inN: LF.sri(s, 3, 5), soillab: !!s.built.soillab }); };
B('choice', { id: 'smp.choice', tone: 'crisis', title: 'Ways to End It',
  setup: endCtx,
  text: (s, c) => `It has been in the lab, the ducts and the water. ${c.Cm} wants the module the lab stands in vented: the inner doors dogged on whoever is inside, the outer hatches opened and the fans run backwards until there is nothing in there but this world's air. ${c.E} wants the lab burned, with every sample and every page of where the cores were cut, so nobody drills there again.\n\n${c.lean} The rows have been told there will be an order tonight.`,
  choices: [
    { label: 'Vent the module with the shift still inside it', dark: true, note: (s, c) => `The ${num(c.inN)} on shift inside are not let out first, so that nothing comes out with them.`, info: (s, c) => [['yield', 'An end to it, if this air kills it'], ['danger', `The ${num(c.inN)} inside`]],
      out: { text: (s, c) => `The inner doors are dogged at the change of shift. The outer hatches go at midnight, and the fans run until dawn. ${cap(num(c.inN))} people were inside, and the module is as cold as the yard when the doors are opened.`,
        fx: (s, c) => ({ pop: -c.inN, stain: ['smp_vent', 4], tension: -6, do: s2 => { const t = T(s2); t.toll += c.inN; t.finalNew = !t.tried.includes('air'); contain(s2, t, 'air', 1.5); t.did.vent = true; },
          chron: 'The colony vented a module with people still in it, to kill the thing from the core sample.' }) } },
    { label: 'Burn the lab: every sample, every core, and every record of where they were drilled', dark: true, note: (s, c) => `If fire ends it, it ends there, and the colony loses everything its science has learned of this world${c.soillab ? ', the soil laboratory\'s work included' : ''}.`, info: [['yield', 'An end to it, if fire ends it'], ['danger', 'Everything the colony has learned']],
      out: { text: (s, c) => `The lab burns from dusk, with the cabinets of cores, the jars and the sample books inside. ${c.off ? `${c.Sf} stands at the wire with the rest and does not say anything.` : 'The lab crew stand at the wire and watch it.'} The ash is turned over twice before morning.`,
        fx: (s, c) => ({ mat: -15, stain: ['smp_burn', 3], off: [['scientist', 'mind', -12]], do: s2 => { const t = T(s2); t.finalNew = !t.tried.includes('fire'); contain(s2, t, 'fire', 1.5); if (t.truth.is === 'spore') t.grown = 0; t.did.burn = true; s2.flags.smp_lab_burned = s2.day;
          for (const f of s2.factors) if (!f.res) f.insight = Math.round(f.insight * 0.5); },
          chron: 'The colony burned its lab with every sample and every record, to kill the thing from the core sample.' }) } },
    { label: 'Neither, tonight', note: 'Nobody is vented and nothing is burned on a guess, and the grey keeps the rows for as long as a slower way takes.',
      out: { text: 'You say no to both. The torches go back on their hooks and the outer hatches stay shut. The rows are still waiting for an order.', fx: s => ({ do: s2 => { const t = T(s2); t.did.slow = s2.day; jump(s2, 'smp.slow', 40); } }) } },
  ] });

B('choice', { id: 'smp.slow', tone: 'crisis', title: 'The Slower Ways', scene: 'smp_choice',
  when: (s, t) => !!t.did.slow,
  setup: endCtx,
  text: (s, c) => `Nothing was vented and nothing was burned. ${c.off ? `${c.Sf} wants to be sealed in with it and go on working.` : `${cap(c.hand)} has offered to be sealed in with it and go on working, since ${c.gone}.`} The other way to let this world's air at it is slow: every pod open for a season, and the rows sleeping cold.\n\n${c.lean} The rows are still waiting for an order.`,
  choices: [
    { label: (s, c) => c.off ? `Seal ${c.sf} in with it, and weld the door` : `Seal ${c.hand} in with it, and weld the door`, dark: true, note: (s, c) => `If anything can stay ahead of it, it is somebody in the room with it, and ${c.off ? c.sf : c.hand} does not come out until it is over.`, info: (s, c) => [['yield', 'Somebody working on it day and night'], ['danger', c.off ? c.Sf : cap(c.hand)]],
      out: { text: (s, c) => `${c.off ? c.Sf : cap(c.hand)} walks into the lab pod with a cot, a lamp and a crate of notebooks. ${c.E} welds the door at the seams and leaves the sample hatch on its hinges. The first page comes out through it before morning.`,
        fx: (s, c) => ({ stain: ['smp_sealed', 3], do: s2 => { const t = T(s2), p = byPid(s2, c.off ? c.opid : c.hpid); t.finalNew = true; contain(s2, t, 'mind'); t.did.seal = true;
          t.inside = { pid: p && p.alive ? p.id : null, name: p && p.alive ? p.name : c.hand, off: c.off };
          if (p && p.alive && p.role) LF.vacate(s2, p, 'sealed', 'was welded into the lab pod with the Sample to go on working'); },
          chron: (s2, c2) => `${c2.off ? c2.sci : cap(c2.hand)} was welded into the lab pod with the thing from the core sample.` }) } },
    { label: 'Open every pod to the air for a season, and seal nothing again', note: 'Everyone sleeps cold for a season and the stores spoil faster, and if the air does not kill it, nothing is shut against it either.', info: [['yield', 'An end to it, if this air kills it'], ['danger', 'The stores, and everyone\'s sleep']],
      out: { text: 'The doors are pinned back across the colony and the tape comes off every seam. For a season the rows sleep in coats, and the stores are turned every other day to keep them dry.',
        fx: s => ({ food: -40, morale: -3, do: s2 => { const t = T(s2); t.finalNew = !t.tried.includes('air'); contain(s2, t, 'air'); t.opened = s2.day; t.did.open = true; } }) } },
    { label: 'Hold to what is in place, and bury the dead as they come', note: 'Nobody is vented, burned or sealed on a guess, and every row it reaches pays for that.',
      out: { text: 'You say it once, at the order: nothing more tonight. The rows go to bed. The clinic puts another cot by the door.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.hold = true; } }) } },
  ] });

/* ======================= BILL: a month on, or the welded door ======================= */
const DOOR = {
  learns: 'Pages come out through the hatch every morning, more each week, in a hand that has stopped bothering with lines.',
  harmless: 'The hatch opens at meals and shuts again. Through it, the same question comes each time: how long.',
  spore: 'The little window in the door has gone gold from the inside, and the coughing behind it goes on most of the night.',
  air: 'The voice behind the door is hoarse and slow. The window has fogged from inside and stays fogged.' };
const OUTD = {
  learns: c => `${cap(c.who)} comes out thin and talking, with a sheaf of pages under one arm. The walls of the pod behind are bare to the metal.`,
  harmless: c => `${cap(c.who)} comes out blinking, walks to the mess and sits at the end of a bench, and does not say anything for the rest of the day.`,
  spore: c => `${cap(c.who)} is carried out on a stretcher, coughing gold. The pod behind is gold to the ceiling, and the cutters back away from it.`,
  air: c => `${cap(c.who)} comes out grey and short of breath into the yard. The yard's air goes into the pod behind, and by evening the grey on its walls has gone brown.` };
B('bill', { id: 'smp.door', view: 'people', tone: 'crisis', title: 'The Welded Door',
  when: (s, t) => !!t.inside && !t.inside.out,
  setup: s => { const t = T(s), x = t.inside; return Object.assign(crew(s), { ev: pickK(s, t, 0.15), ipid: x.pid, who: x.name }); },
  text: (s, c) => `It is a month since the door was welded on ${c.who}. ${DOOR[c.ev]}\n\n${c.dv ? `[[physician]] "That's a person in there, and they went in because somebody had to." "You remember that, and either cut the door or tell me to my face why not."` : `${c.D} has asked twice for the door to be cut.`}`,
  choices: [
    { label: (s, c) => `Cut the door and bring ${c.who} out`, note: 'Whatever is in there comes out with them, if it was ever going to.',
      out: { text: (s, c) => OUTD[T(s).truth.is](c),
        fx: (s, c) => { const k = T(s).truth.is, kill = k === 'spore' && c.ipid; return { kill: kill ? [{ who: c.ipid, cause: 'came out of the welded lab pod with the grown thing in the lungs' }] : [], pop: k === 'spore' && !c.ipid ? -1 : 0,
          do: s2 => { const t = T(s2); t.did.doorOpen = true; if (k === 'spore') { t.toll++; t.grown += 0.3; t.inside.dead = true; } if (k === 'air') contain(s2, t, 'air', 0.6); t.inside.out = s2.day; if (k !== 'spore' && c.ipid) { const p = byPid(s2, c.ipid); if (p && p.alive) p.marks.sealed = { d: s2.day, txt: 'was welded into the lab pod with the Sample, and was cut out' }; } } }; } } },
    { label: 'Leave the door shut, and keep passing food through the hatch', dark: true, note: (s, c) => `${cap(c.who)} goes on working in there with it, for as long as it takes.`, info: (s, c) => [['yield', 'Whatever comes out through the hatch'], ['danger', cap(c.who)]],
      out: { text: (s, c) => `The bowls go in at noon and dusk. ${c.ev === 'learns' ? 'The pages keep coming.' : 'Some days the bowl comes back full.'} ${c.D} has stopped asking.`, fx: (s, c) => ({ stain: ['smp_kept', 1], do: s2 => { const t = T(s2); learn(s2, t, 15, c.ev); t.did.keep = true; } }) } },
    { label: 'Stop the food, and weld the hatch', dark: true, note: (s, c) => `It ends behind the door, one way or the other, and ${c.who} ends with it.`, info: (s, c) => [['yield', 'Nothing comes out of that room again'], ['danger', cap(c.who)]],
      out: { text: (s, c) => `${c.E} welds the hatch at dusk with a guard on the corridor. There is knocking for some days. The pod is left as it stands, and the path round it is moved.`,
        fx: (s, c) => ({ kill: c.ipid ? [{ who: c.ipid, cause: 'was welded into the lab pod with the Sample and left there' }] : [], pop: c.ipid ? 0 : -1, stain: ['smp_welded', 4], do: s2 => { const t = T(s2); t.toll++; t.inside.dead = true; t.inside.out = s2.day; t.did.welded = true; contain(s2, t, 'seal'); if (t.truth.is === 'spore') t.grown *= 0.4; } }) } },
  ] });

B('bill', { id: 'smp.after', tone: 'pressure', title: 'A Month On',
  when: (s, t) => !t.inside || !!t.inside.out,
  setup: s => { const t = T(s), w = working(s, t) && !(t.truth.is === 'harmless' && !t.did.hold); return Object.assign(crew(s), { slow: LF.srand(s) < 0.78 ? w : !w, none: !!t.did.hold }); },
  text: (s, c) => `It is a month since the order${c.none ? ', which was to do nothing more' : ''}. ${c.D} keeps a sheet of the rows the grey has reached, with a box for each night somebody in them was taken bad. ${c.slow ? 'Two boxes were filled this month, fewer than the month before.' : 'Eleven boxes were filled this month, more than the month before.'}\n\n${c.lean}`,
  choices: [
    { label: 'Hold to what was ordered, and give it the season', note: 'If the order was wrong, the grey has another season in the rows.',
      out: { text: 'Nothing is changed. The sheet goes on, and the rows stop asking what it shows.', fx: s => ({ morale: -1, do: s2 => { T(s2).did.held = true; } }) } },
    { label: 'Burn the bunk row it reached first, with the bedding and kit of everyone who slept there', note: 'Nobody is inside, and the row loses everything it owned and its roof.',
      out: { text: 'The row is emptied by noon and fired at dusk. The people who lived in it watch from the mess door with what they could carry, and sleep on the mess floor after.', fx: s => ({ mat: -10, morale: -3, do: s2 => { const t = T(s2); contain(s2, t, 'fire', 0.7); if (t.truth.is === 'spore') t.grown *= 0.6; t.did.row = true; } }) } },
    { label: 'Log the dead as fever, and close the matter', dark: true, note: 'The hall gets an end to it on paper, and the rows go on sleeping under whatever is still in the ducts.', info: [['yield', 'Morale'], ['danger', 'The rows']],
      out: { text: 'The clinic log is written up again with fever for a cause, and the sheet comes off the clinic wall. The masks are handed in. The rows are glad of it.', fx: s => ({ morale: 3, tension: -4, stain: ['smp_fever', 1], do: s2 => { const t = T(s2); t.did.fever = true; t.creep += 0.2; } }) } },
  ] });

/* ======================= AFTER: what it was ======================= */
const WAS = {
  learns: 'It was alive and it kept account. Whatever was done to it once, it found its way round by the next month: the tape, the chlorine, the open air, the fire. It learned faster than the lab did, and only something it had never been shown could stop it.',
  harmless: 'It was a mat of threads that lives in the deep ice on nothing, and it does nothing to anyone. It came out of the dish because the dish was warm, and it went where the warm air went. It never touched a person or a bolt.',
  spore: 'It was a seed. What thawed in the dish was the resting stage of something that grows up in a warm wet place with people in it, and what grew out of it in the ducts and the water was the thing to fear. In the dish, a match would have done.',
  air: 'It was a thing of the deep ice that this world\'s air kills in a season. It lived in the dish because the dish was sealed, and then in the lab pod, the ducts and the tanks for the same reason. Every room the colony shut against it was a room it could live in.',
};
const TAIL = { ran: 'Nothing the colony did stopped it, and it went through the rows before it died back.', early: 'A match was what it got.', harmless: 'It is still in the ice under the drill site, and still harmless.',
  vented: 'The air did it in a night.', aired: 'The air did it inside the season.', outworked: 'It never met anything like the one welded in with it.', outrun: 'The last thing tried on it was the one thing it had not met.', burned: 'The fire was the end of it.' };
function reckon(s, t) {
  const d = t.did, k = t.truth.is, L = [], add = (l, hm, sp, a) => L.push({ learns: l, harmless: hm, spore: sp, air: a }[k]);
  if (d.flamed) add('The dish was flamed, and it had learned fire before it was out of the lab.', 'The dish and a year of drilling were burned for nothing.', 'Flaming the dish was the right answer, and the earliest one.', 'Flaming the dish killed what was in it, and the core had already shed the rest.');
  if (d.vent) add(t.finalNew ? 'Venting the module ended it, because it had never met the open air.' : 'The vent did nothing it had not met in the ducts.', 'The people vented with the module died for something that would not have hurt them.', 'The vent blew what had grown in the module through every other row.', 'Venting the module ended it in a night, and the people left inside it need not have been.');
  if (d.burn) add(t.finalNew ? 'Burning the lab ended it, because it had never been shown fire.' : 'The lab burned, with everything in it, and it had met fire in the dish.', 'The lab, its samples and every record of this world were burned for nothing.', 'Burning the lab was the answer, and it cost every record the colony had made.', 'Burning the lab killed what was in the lab, which the air would have done.');
  if (d.seal) add(t.inside && t.inside.dead ? 'Whoever was sealed in with it stayed ahead of it, and did not come out.' : 'Whoever was sealed in with it stayed ahead of it, and came out with the answer.', 'Whoever was welded in with it was welded in with nothing.', 'Whoever was welded in with it was welded in with the grown thing.', 'Whoever was welded into the pod was welded into the one kind of room it could live in.');
  if (d.open) add(t.finalNew ? 'Opening the pods to the air ended it.' : 'It had met the open air in the ducts, and opening the pods did nothing.', 'The colony slept cold for a season for nothing.', 'Opening the pods let the shed of it into every row.', 'Opening the pods to the air was the whole of the cure.');
  if (d.techIn || d.sickIn) add('The people shut in with it were shut in with something that went round doors.', 'The people shut in with it were shut in with nothing.', 'The people shut in with it breathed what it was shedding.', 'The people shut in with it were shut in the one kind of place it could live.');
  const out = L.filter(Boolean).slice(0, 5);
  return out.length ? out.join(' ') : 'Nobody was vented, burned or sealed in on account of it, and there is nothing of that kind to answer for.';
}
B('after', { id: 'smp.truth', tone: 'quiet', title: 'What the Sample Was',
  setup: s => { const t = T(s); return Object.assign(crew(s), { end: t.end, toll: Math.max(0, t.toll) }); },
  text: (s, c) => { const t = T(s), tail = TAIL[c.end] ? ' ' + TAIL[c.end] : ''; return `${WAS[t.truth.is]}${tail}\n\n${reckon(s, t)}${c.toll ? ` ${Num(c.toll)} colonist${c.toll === 1 ? '' : 's'} died of it, or of what was done about it.` : ''}`; },
  choices: [
    { label: 'Enter what was done in the record, with the names', note: 'Everyone who gave an order about it, or carried one out, has to live beside the page.',
      out: { text: 'It goes into the colony record in full, in your hand, with who ordered what. People read it. Some of the rows stop greeting you, and one or two start.', fx: s => ({ morale: -2, chron: 'The colony wrote down what it had done about the thing from the core sample, with the names.' }) } },
    { label: 'Enter it as a fever, put down in good time', dark: true, note: 'The colony gets an account with nobody in it, and every order given about the grey goes unanswered.', info: [['yield', 'Morale']],
      out: { text: 'The record says a fever went through the rows in the first years and was dealt with by the clinic. The lab is not mentioned. It is the version the children will be taught.', fx: s => ({ morale: 3, stain: ['smp_record', 1], chron: 'The record says a fever went through the colony, and that it was dealt with.' }) } },
  ] });

/* The deeds these cards can add to the colony's record (content-limits.js DEEDS). smp_quiet, smp_arm, smp_barred, smp_wall, smp_moved,
   smp_blamed, smp_cups, smp_thirst, smp_opened and smp_cold have had no option since the cut to three (2026-11-21): their phrases stay
   for saved games that already carry the stain. */
Object.assign(LF.DEEDS || {}, {
  smp_quiet: 'the thing in the dish, logged as a mould and left thawing',
  smp_skin: 'the drop of it put on the arm of one of the punishment detail',
  smp_shut: 'the glass hand sealed in the lab pod with the grey',
  smp_arm: 'the arm taken off at the elbow, on a guess',
  smp_barred: 'the lab crew barred in with the grey',
  smp_wall: 'the clinic kept on the other side of the grey wall and not told',
  smp_crawl: 'the punishment detail sent crawling through the grey ducts',
  smp_moved: 'the officers moved out of the grey row by night, and the row told it was the drains',
  smp_ward: 'the dying on the ward given the grey to see what it did',
  smp_blamed: 'the Scientist blamed for the grey at muster',
  smp_cups: 'the officers drinking from the sealed drums while the hall drank from the grey plant',
  smp_thirst: 'the rows nearest the grey put on half a cup',
  smp_opened: 'the dead of the grey rows opened without asking their families',
  smp_pod: 'the sick carried into the lab pod with the grey',
  smp_vent: 'the module vented with the shift still inside it',
  smp_burn: 'the lab burned with every sample and every record of this world',
  smp_sealed: 'somebody welded into the lab pod with the grey to go on working',
  smp_kept: 'the welded door left shut, with food through the hatch',
  smp_welded: 'the hatch of the lab pod welded on somebody still knocking',
  smp_cold: 'the rows under the grey ducts locked in the cold store',
  smp_fever: 'the grey dead logged as fever',
  smp_record: 'the account of the grey that called it a fever',
});

LF.TAGS['smp.dish'] = ['cautious open', 'severe bold', 'severe bold'];
LF.TAGS['smp.sleeve'] = ['mercy open', 'severe closed', 'open'];
LF.TAGS['smp.pod'] = ['cautious closed', 'bold', 'open'];
LF.TAGS['smp.ducts'] = ['cautious mercy', 'bold open', 'severe order'];
LF.TAGS['smp.culture'] = ['open', 'severe order', 'severe bold'];
LF.TAGS['smp.water'] = ['cautious', 'cautious order', 'bold'];
LF.TAGS['smp.reached'] = ['bold open', 'mercy', 'severe closed'];
LF.TAGS['smp.choice'] = ['severe bold', 'severe closed', 'cautious'];
LF.TAGS['smp.slow'] = ['severe bold', 'bold open', 'cautious'];
LF.TAGS['smp.door'] = ['mercy open', 'severe closed', 'severe closed'];
LF.TAGS['smp.after'] = ['cautious', 'bold', 'closed order'];
LF.TAGS['smp.truth'] = ['open', 'closed order'];

/* Its places on the World view (js/places.js, T2-4): what the colony has seen out there, as it stands. A place never says
   what the thing is; T2-5 lets a party go and look. */
LF.THREADS[ID].pois = (s, t) => { const out = [];
  if (s.used['smp.dish'] !== undefined) out.push({ k: 'core', card: 'smp.dish', name: 'Where the core was cut', kind: 'mark', dist: 'near', danger: 1, state: 'located',
    known: `A capped borehole forty metres down through ${LF.lex(s, 'under')}. The core in the lab's cold box came up out of it.` });
  if (s.used['smp.water'] !== undefined) out.push({ k: 'outfall', card: 'smp.water', name: 'The water plant\'s outfall', kind: 'mark', dist: 'near', danger: t.end ? 0 : 2, state: t.end ? 'worked out' : 'located',
    known: 'Where the water plant drains past the wire. The filter beds were matted grey right through, and the grey ran down into the outlet.' });
  return out; };
/* A party the player sent to one of its places (orders.js order.send, T2-5): what they found there, which points at the
   truth most of the time (pickK), as the cards' evidence does. The borehole adds to what is known and comes home as a
   Meanwhile line; the outfall is where the grey meets the world past the wire, and comes home as a card. Under spore the
   party carries the beads back in on its boots (t.creep). line(): a find with nothing to decide is a line when the return
   itself had nothing to decide either (LF.AWAY_QUIET). */
const line = (a, v) => { if (v) v.quiet = true; return v; };   // nothing to decide: a Meanwhile line when the return itself was quiet (js/orders.js needsCard)
const CORE = {
  learns: c => 'They lifted the cap off the borehole. The grey had come forty metres up the bore in the dark and spread over the underside of the cap, and out through the one bolt hole the drill crew never filled.',
  harmless: c => 'The bore is furred grey from top to bottom under its cap, and something small of this world has dug its nest into the spoil heap right against the pipe. The young in it are fat and noisy.',
  spore: c => 'The spoil heap from the core glitters gold where the grey dried on it, and the ground downwind is flecked grey for twenty paces. The flecks were not there when the core was cut.',
  air: c => 'The capped bore is choked with grey, thick as felt. On the spoil heap beside it, out in the open air since the day of the drilling, there is none at all.' };
const OUTFALL = {
  learns: c => 'The grey came down the outlet pipe as far as the grating the plant crew bolted across it, and stopped. Then it went round: out through the bolt holes and back over the outside of the pipe in a neat collar. The ditch below is clean.',
  harmless: c => 'The grey lines the stones of the ditch below the outfall for fifty paces, and the ditch is full of life: small crawlers of this world grazing on it, and the prints of something bigger that comes down to drink. None of them looks the worse for it.',
  spore: c => 'The ditch below the outfall is gold at the edges, and the scum on the still water carries hard little beads, half of them split. The party came home gold to the ankle and scrubbed their boots in the yard trough.',
  air: c => 'The grey comes out of the pipe in clots and dies where the water meets the air. Three paces down the ditch it is a brown slime, and past that the stones are clean.' };
LF.THREADS[ID].visit = (s, t, a) => {
  const k = String(a.poi || '').split('.')[1]; if ((k !== 'core' && k !== 'outfall') || t.end) return null;
  const e = pickK(s, t, 0.05);
  if (k === 'core') return line(a, { title: 'The Borehole', tone: 'quiet', text: CORE[e]({}), fx: { survey: 6, do: s2 => learn(s2, T(s2), 8, e) } });
  return { title: 'Below the Outfall', tone: 'pressure', scene: 'away_smp_outfall', text: OUTFALL[e]({}),
    fx: { survey: 6, do: s2 => { const t2 = T(s2); learn(s2, t2, 12, e); if (t2.truth.is === 'spore' && e === 'spore') t2.creep += 0.15; } } };
};
})();
