/* Landfall — the generations: the empty cradles (DESIGN.md "The cradles, the made and the ones born here").
   Cards on top of the rules in js/generations.js. Lachlan: "Low morale tanks this though which leads to its own
   dilemmas like forced pregnancies, artificial wombs, building replacement synthetic children."
   This file holds what the other two build on (js/content-born.js: the ones born here; js/thread-made.js: the made
   children), and the first body of cards: a colony of an age that is not having children, and what its own decent,
   tired officers propose about it. It is a chain the player walks down while the births stay few (few), each step
   darker and paying better:
     gen.empty    the soft answers: a full ladle for anyone carrying, or the childless named at the evening meal
     gen.duty     pairings from the registry and a duty to bear (the same law as lim.roster, "A List on the Clinic
                  Door": whichever card comes first decides it, and the other is never dealt), or a levy on the childless
     gen.bank     the embryo bank's incubators: children nobody carries, to households by order, on a clinic rota, or
                  run hot
     gen.made     (js/thread-made.js) manufactured children for the schoolroom
   and the bills: gen.refuser (someone will not go on the board), gen.roster6 and gen.rosterage (the board's children
   at six and when they come of age), gen.tank6 and gen.tankage (the incubators' children).
   Forced pregnancy is written as an order given in an office and what it does to the colony, and nothing else.
   How each answer moves the numbers (LF.HEART_FLOOR, LF.BIRTH_MODS, LF.bear, LF.KID_RISK): see HOOKS below.
   State: s.gen.x, made on demand (X), plain JSON; flags gn_*. Deeds gn_* are added to LF.DEEDS at the foot. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { P, N, Nc, F, R, If, byPid } = h;
const YEAR = LF.YEAR, MONTH = LF.MONTH;
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const num = n => { n = Math.round(n); return n >= 0 && n < W.length ? W[n] : LF.num(n); };
const Num = n => { const w = num(n); return w.charAt(0).toUpperCase() + w.slice(1); };
const yr = s => LF.date(s.day).year;
const X = s => { const g = LF.gen(s); return g.x || (g.x = { grudge: 0, risk: 1, b: {} }); };
const founders = s => Math.max(0, s.pop - Math.min(LF.gen(s).born, s.pop));
const rosterOn = s => !!s.flags.lim_roster && s.flags.lim_roster !== 'refused';
const regard = (s, role, d) => { const p = P(s, role); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal + d, 0, 100); };
const allRegard = (s, d, fn) => { for (const p of s.people) if (p.alive && p.loyal !== undefined && p.vals && (!fn || fn(p))) p.loyal = clamp(p.loyal + d, 0, 100); };
const grudge = (s, d) => { const x = X(s); x.grudge = clamp((x.grudge || 0) + d, 0, 12); };
const risk = (s, f) => { const x = X(s); x.risk = clamp((x.risk || 1) * f, 0.5, 2.2); };
/* A share of the children born here (never fewer than min, never more than there are). */
const share = (s, f, min, max) => { const k = LF.kidCount(s); return Math.max(0, Math.min(k, max || k, Math.max(min || 0, Math.round(k * f)))); };
/* Children die on a card: an exact number (a share worked out at setup), the youngest first unless eldest. */
const young = (s, n, eldest) => { const d = LF.loseYoung(s, n, eldest); s.deaths += d; s.grief = Math.min(40, s.grief + 2.5 * Math.min(4, d / LF.scale(s))); s.tension += 3 * Math.min(4, d / LF.scale(s)); return d; };
const kidChip = n => [[n === 1 ? 'One of the children dead' : `${LF.num(n)} of the children dead`, false]];
/* Someone with a name out of the rows, never one of the six seats. */
const someone = (s, spec) => { const seats = s.people.filter(p => p.role).map(p => p.id);
  const p = (LF.cast && LF.cast(s, Object.assign({ not: seats }, spec || {}))) || h.anyNamed(s, seats);
  return p ? { pid: p.id, name: p.name, first: p.first } : { pid: null, name: 'A rigger from the east row', first: 'the rigger' }; };
/* The one who speaks for the people born here: a name the colony keeps hearing from the first vote to the last founder. */
const voice = s => { const x = X(s); let p = x.voice && byPid(s, x.voice);
  if (p && p.alive && !p.away && !p.role) return p;
  p = LF.makePerson(s, null, false, 'born'); p.known = s.day || 1; p.bornHere = yr(s); x.voice = p.id; if (LF.societyInit) LF.societyInit(s);
  return p; };
const voiceCtx = s => { const p = voice(s); return { pid: p.id, name: p.name, first: p.first }; };

/* ---------- what the engine is told ---------- */
/* Births in the last twelve months or so, from the year's count and the last one's. */
const trail = s => { const b = X(s).b || {}, d = LF.date(s.day); return (b[d.year] || 0) + (b[d.year - 1] || 0) * (1 - (d.month - 1) / 12); };
const ofAge = s => { const f = LF.fertile(s); return f.found + f.born; };
/* The cradles are empty or nearly: people of an age, and fewer than one child a year to every eight of them (half of what
   a colony in good heart has, since the retune: generations.js B_FOUND). */
const few = s => !s.flags.births_deferred && !s.flags.qk_open && s.day - (s.landed || 0) >= 200 && ofAge(s) >= 20 && LF.roomFor(s) > 0.5 && (LF.cradlesEmpty(s) || trail(s) < ofAge(s) / 8);   // room: a colony with nowhere to put a child is a different card
LF.GEN_ON.birth.push((s, n) => { const x = X(s), y = yr(s); x.b[y] = (x.b[y] || 0) + n; for (const k of Object.keys(x.b)) if (+k < y - 2) delete x.b[k];
  if (rosterOn(s)) x.board = (x.board || 0) + n; });
LF.GEN_ON.ofAge.push((s, n) => { const x = X(s); x.aged = (x.aged || 0) + n; if (!x.ofAge) { x.ofAge = s.day; x.firstAged = n; LF.cue(s, 'gen.ofage', 2, 12); } });
/* HOOKS. Floors under heart (births that do not wait for the colony to be glad):
     a full ladle for anyone carrying 0.2 (and x1.2); the childless named at the evening meal 0.3; the levy on the
     childless 0.4; the pairing board 0.6 (lim_roster, in generations.js); made children in the schoolroom 0.3, or
     0.4 while the colony believes they came from the bank (js/thread-made.js).
   The incubators put children in the year's cohort directly (LF.bear, 'tank'): six, eight or sixteen a year, at a
   kit of spares every fourth month, for as long as the reactor runs. */
LF.HEART_FLOOR.push(s => { const f = s.flags; return f.gn_tax ? 0.4 : f.gn_named ? 0.3 : f.gn_ladle ? 0.2 : 0; });
LF.BIRTH_MODS.push(s => (s.flags.gn_ladle ? 1.2 : 1));
LF.KID_RISK.push(s => (s.gen && s.gen.x && s.gen.x.risk) || 1);
const lose0 = LF.loseYoung;
LF.loseYoung = function (s, n, eldest) { const d = lose0(s, n, eldest); if (d) { const x = X(s); x.lost = (x.lost || 0) + d; if (!x.lostDay) x.lostDay = s.day; } return d; };
const tick0 = LF.genTick;
LF.genTick = function (s) {
  tick0(s);
  if (!s.world || LF.aloft(s) || s.day % MONTH) return;
  const x = X(s), f = s.flags;
  if (rosterOn(s) && !x.boardY) x.boardY = LF.date(typeof f.lim_roster === 'number' ? f.lim_roster : s.day).year;
  if (f.gn_ladle && LF.kidCount(s) + ofAge(s) > 0) s.res.food = Math.max(0, s.res.food - 3 * Math.max(1, LF.mouths(s) / 60));   // the second ladle at the clinic table
  if ((x.grudge || 0) >= 8 && LF.gen(s).born >= 20 && s.day - (x.walk || 0) >= 2 * YEAR) { x.walk = s.day; const n = LF.leave(s, Math.max(3, Math.round(LF.gen(s).born * 0.06)), true); x.grudge -= 3;
    s.morale = clamp(s.morale - 3, 0, 100); LF.log(s, `${Num(n)} of the people born here went out past the wire in a body, with their tools, and left word at the gate that they were tired of asking.`, 'bad'); }
  const t = x.tank;
  if (t && !t.off) {
    if (!LF.down(s, 'reactor')) { t.off = s.day; LF.log(s, 'The incubators went dark with the reactor. What was in them is entered in the workshop log.', 'bad'); s.morale = clamp(s.morale - 3, 0, 100); }
    else { if (s.day % (4 * MONTH) === 0) { if (s.res.parts >= 1) { s.res.parts -= 1; t.dry = false; } else t.dry = true; }
      if (!t.dry) { t.acc += t.n / 12; if (t.acc >= 1) { const n = Math.floor(t.acc); t.acc -= n; t.born += n; LF.bear(s, n, 'tank'); } } }
  }
};
const tank = (s, n, mode) => { X(s).tank = { n, mode, y: yr(s), d: s.day, acc: 0, born: 0 }; };
LF.gn = { X, yr, num, Num, few, trail, ofAge, voice, voiceCtx, someone, young, kidChip, share, founders, rosterOn, grudge, risk, regard, allRegard };
LF.ARC_VIEW['gen.cradle'] = 'people';
const C = st => add(Object.assign({ arc: 'gen.cradle', view: 'people', gap: 20, w: st.far ? 9 : 5 }, st));   // the colony's own condition; the bills of the later years are owed, and weigh more
const since = (s, k) => s.day - (typeof s.flags[k] === 'number' ? s.flags[k] : 0);

/* ---------- 1. the soft answers ---------- */
C({ id: 'gen.empty', tone: 'pressure', title: 'The Crib in the Stores',
  when: s => few(s) && !s.flags.gn_asked && s.pop >= 30,
  setup: s => { const b = Math.round(trail(s)), n = Math.round(ofAge(s));
    return { n, b, why: !LF.gen(s).n ? 'No child has ever been born here' : b < 1 ? 'No child has been born here in a year' : `${Num(b)} ${b === 1 ? 'child was' : 'children were'} born here in the last year, to ${LF.num(n)} people of an age to have them` }; },
  text: (s, c) => `The carpenters made a crib in the first spring. It is in the stores with seed sacks in it. ${c.why}.\n\n${Nc(s, 'physician')} has asked the ones of an age why, one at a time, in the clinic. "They're not ill. I checked. They've looked at this place and at their own plates and they've decided. 'Into this?' That's what I get. Every one of them."\n\nEach year fewer of them will be able to change their minds.`,
  choices: [
    { label: 'A full ladle and light duties for anyone carrying a child', cost: { food: 120 }, note: 'The field crews make up the work, and can see whose plate is full.', info: [['yield', 'A few more births'], ['danger', 'The crews who carry the load']],
      out: { text: 'It is posted on the mess door. Four couples go to the clinic inside the season, which is four more than last year. The field crews count the plates at the clinic table, and say what they think of it only among themselves.',
        fx: s => ({ morale: 1, flags: { gn_asked: s.day, gn_ladle: true, births: true } }) } },
    { label: 'Read the count out at the evening meal, with the names of the couples who could', dark: true, note: 'It orders nothing. Everyone at the table hears who was named.', info: [['yield', 'More births, and no food spent'], ['danger', 'The ones named']],
      out: { text: 'You read the count, and then the names, row by row. The hall hears it through. By the next season there are children on the way in the rows that were named. Two couples who cannot have one have stopped eating in the hall.',
        fx: s => ({ morale: -3, stain: ['gn_named', 1], flags: { gn_asked: s.day, gn_named: true, births: true } }) } },
    { label: 'It is their own business. Leave the crib where it is', note: 'The colony gets a year older and the school stays a plan.', info: [['danger', 'Whether anyone is here in forty years']],
      out: { text: s => `${Nc(s, 'physician')} takes the clinic's list back. The crib stays under the seed sacks. At the turn of the year the youngest person in the colony is a year older, like everyone else.`,
        fx: s => ({ tension: 5, flags: { gn_asked: s.day } }) } },
  ] });

/* ---------- 2. the duty ---------- */
C({ id: 'gen.duty', tone: 'pressure', title: 'The Pairing Board',
  when: s => few(s) && !!s.flags.gn_asked && since(s, 'gn_asked') >= 8 * MONTH && !s.flags.lim_roster && !s.flags.gn_duty && s.pop >= 30,
  setup: s => ({ n: Math.round(ofAge(s)), b: Math.round(trail(s)) }),
  text: (s, c) => `${Nc(s, 'quartermaster')} and ${N(s, 'physician')} come to your office together, so that neither has to own it. The soft answers have been tried. There ${c.b === 1 ? 'was one birth' : `were ${num(c.b)} births`} in the last year among ${LF.num(c.n)} people of an age.\n\nThe proposal is one sheet. Pairings drawn from the gene registry, for spread. A duty to bear, entered on the roster like any other duty. A refusal handled as a refused shift.\n\n"I'll run it if you order it," says ${F(s, 'physician')}. "Don't ask me to call it medicine."`,
  choices: [
    { label: 'Sign it. The pairings go up on the clinic wall', dark: true, info: [['yield', 'Births that do not wait on anyone being glad'], ['danger', 'Everyone whose name goes on the board']],
      out: { text: 'It is read out at the evening meal as an order, with your name under it. In the morning there is a board on the clinic wall: two columns of names, and lines ruled between them. People read it on the way to shift and do not stop walking.',
        fx: s => ({ morale: -6, stain: ['roster', 2], flags: { births: true, gn_duty: 'law', gn_duty_d: s.day }, chron: 'Childbearing was made a duty, and the pairings were assigned.',
          do: s2 => LF.emit(s2, 'resentment', 'gen.duty', 50, 300, 'there is a pairing board on the clinic wall') }) } },
    { label: 'No order. Whoever bears is excused the fields and eats double, and the rest make up the work', dark: true, note: 'It names no one. The people who cannot, or will not, do two people\'s work on one ladle.', info: [['yield', 'More births'], ['danger', 'The childless']],
      out: { text: 'The rule is posted without the word duty in it. By the end of the year the hardest crews are the people with no child, and they have worked out why. Some of them go to the clinic to change it, which was the point.',
        fx: s => ({ morale: -3, food: -60, stain: ['gn_tax', 1], flags: { births: true, gn_tax: true, gn_duty: 'tax', gn_duty_d: s.day, lim_roster: 'refused' } }) } },
    { label: 'No. Nobody here is ordered or starved into bearing a child', info: [['danger', 'Whether anyone is here in forty years']],
      out: { text: s => `${Nc(s, 'quartermaster')} takes the sheet back and has your refusal entered in the log, with the count beside it. ${Nc(s, 'physician')} goes back to a clinic with empty cots, and goes on keeping the list of the people of an age.`,
        fx: s => ({ morale: -1, flags: { gn_duty: 'no', gn_duty_d: s.day, lim_roster: 'refused' }, do: s2 => regard(s2, 'quartermaster', -8) }) } },
  ] });

/* ---------- the board's bills ---------- */
C({ id: 'gen.refuser', tone: 'pressure', title: 'A Refused Shift',
  when: s => rosterOn(s) && since(s, 'lim_roster') >= 7 * MONTH && !s.flags.gn_refuser && s.pop >= 20,
  setup: s => someone(s, { low: true }),
  text: (s, c) => `${c.name} has been on the pairing board since it went up, matched by the registry with someone from the far row, and has refused three times.\n\n${Nc(s, 'security')} has the charge sheet ready. "By the wording you signed, it's a refused shift. Lock-up and a half ladle till the shift's worked. Lovely thing to have my name on."\n\nThe rows are waiting to see whether the board means it.`,
  choices: [
    { label: 'Charge it as written', dark: true, info: (s, c) => [['yield', 'The board holds'], ['danger', c.name]],
      out: { text: (s, c) => `${c.name} goes into the lock-up on a half ladle, comes out at the end of the month, and stops refusing. The board is not refused again that year. In the rows people step off the path to let ${c.first} by, and look at the ground while they do it.`,
        fx: (s, c) => ({ morale: -5, stain: ['gn_charged', 2], flags: { gn_refuser: 'charged' }, mark: c.pid ? [c.pid, 'convict', 'was locked up for refusing the pairing board'] : null,
          do: s2 => { const p = c.pid && byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 30, 0, 100); } }) } },
    { label: 'Have the clinic find a reason. A certificate, and no charge', dark: true, note: 'It holds the board together this month. After that a certificate is something people with friends in the clinic can get.', info: [['yield', 'No charge, and the board stands'], ['danger', 'Everyone still on it']],
      out: { text: (s, c) => `${Nc(s, 'physician')} signs it without looking at you. ${c.name} is off the board by morning. Before the year is out there are nine certificates, and each belongs to somebody with a friend in the clinic. The ones still on the board know exactly who.`,
        fx: () => ({ morale: -3, tension: 8, stain: ['gn_excused', 1], flags: { gn_refuser: 'excused' }, do: s2 => regard(s2, 'physician', -10) }) } },
    { label: 'Strike the board. It was a mistake, and you say so', info: [['danger', 'The ones already carrying under it']],
      out: { text: (s, c) => `You take it down yourself, in daylight. ${c.name} goes back to work. Eight people are carrying children by someone the registry chose, under an order you have now called a mistake. Each of them has to decide what that makes the child.`,
        fx: s => ({ morale: 3, hum: 2, flags: { gn_refuser: 'struck', lim_roster: 'refused', gn_struck: s.day }, do: s2 => allRegard(s2, -6, p => p.vals.mercy === -1) }) } },
  ] });

C({ id: 'gen.roster6', far: true, tone: 'pressure', title: 'The Children of the Board',
  when: s => { const x = X(s); return !!x.boardY && yr(s) >= x.boardY + 6 && (x.board || 0) >= 4 && !s.flags.gn_roster6; },
  setup: s => ({ on: rosterOn(s) }),
  text: (s, c) => `The first children of the pairing board are six. In the schoolyard the others have a word for them, and a second word for the ones whose parents chose each other. Half the board's pairs never shared a roof, and their children go between two rows with a bag.\n\nThe school keeps the register that says which child came from which line on the board. The teachers ask whether it stays open.${c.on ? '' : ' The board itself came down years ago.'}`,
  choices: [
    { label: 'Seal the register. The school teaches that every child here was wanted', dark: true, info: [['yield', 'Morale'], ['danger', 'The day they find it']],
      out: { text: 'The register goes into the clinic safe. The school says it at assembly: every child here was wanted. The children of the board are six. Each of them knows which house it sleeps in on which night, and none of them puts a hand up.',
        fx: () => ({ morale: 3, stain: ['gn_sealed', 1], flags: { gn_roster6: 'sealed' } }) } },
    { label: 'Leave it open. They will know what they came from', info: [['danger', 'The children, and the people who made them under orders']],
      out: { text: 'The register stays on its shelf. By the end of the year the older ones can find their own line in it. Two fathers who had kept away start walking a child to school. One mother asks for her name to be inked out, and is refused.',
        fx: () => ({ morale: -3, flags: { gn_roster6: 'open' } }) } },
    { label: 'Take the board down now, and tell them why to their faces', show: (s, c) => c.on, info: [['danger', 'What the children hear'], ['danger', 'The births it was buying']],
      out: { text: 'You say it in the schoolyard, to the children it made: the order was wrong, and it is over. The eldest asks whether that makes them wrong too. You answer, and it is not a good enough answer. The board is burned that evening with most of the colony watching.',
        fx: s => ({ morale: 2, hum: 3, flags: { gn_roster6: 'ended', lim_roster: 'refused', gn_struck: s.day } }) } },
  ] });

C({ id: 'gen.rosterage', far: true, tone: 'crisis', title: 'Who Signed',
  when: s => { const x = X(s); return !!x.boardY && yr(s) >= x.boardY + LF.AGE && !!s.flags.gn_roster6 && !s.flags.gn_rosterage && LF.gen(s).born >= 4; },
  setup: s => Object.assign(voiceCtx(s), { on: rosterOn(s), sealed: s.flags.gn_roster6 === 'sealed', n: clamp(Math.round((X(s).board || 8) / 2), 6, 40), go: Math.max(3, Math.round(LF.gen(s).born * 0.12)) }),
  text: (s, c) => `The first children of the pairing board came of age this year. ${c.name} is one of them, and has spent the dark months in the archive.${c.sealed ? ' The sealed register was not hard to find.' : ''} ${c.first} is in your office with the order itself, the copy with the signature, and ${num(c.n)} others are waiting outside.\n\n"We're not here about us. We're here, that's done. ${c.on ? 'We want it off the wall.' : 'We want it said.'} And we want the name on this read out in the hall, with what it was for."`,
  choices: [
    { label: (s, c) => c.on ? 'Read it out yourself, name and all, and take the board down' : 'Read it out yourself, name and all', info: [['danger', 'The founders who voted for it'], ['danger', 'What the hall thinks of the chair']],
      out: { text: (s, c) => `You read the order in the hall from the first line to the signature. It takes four minutes. ${c.name} stands beside you for all of it. The founders who voted for it look at their hands. The ones who were made by it look at the founders.`,
        fx: s => ({ morale: 4, hum: 3, tension: 6, flags: { gn_rosterage: 'read', lim_roster: 'refused' }, do: s2 => { grudge(s2, -2); allRegard(s2, -6, p => p.vals.mercy === -1); } }) } },
    { label: 'The board stays, and at the turn of the year their names go on it', dark: true, show: (s, c) => c.on, note: 'They are most of the people of an age now.', info: (s, c) => [['yield', 'The births go on'], ['danger', `About ${num(c.go)} of the born, gone`]],
      out: { text: (s, c) => `${c.name} hears it out and puts the order back in its folder. The names of the board's own children go up on it at the turn of the year, as the wording requires. ${Num(c.go)} of them are past the wire before the ink is dry.`,
        fx: (s, c) => ({ morale: -8, gone: c.go, stain: ['gn_board_kept', 3], flags: { gn_rosterage: 'kept' }, do: s2 => grudge(s2, 3) }) } },
    { label: 'There was no such order from this office. The clinic ran it', dark: true, test: { base: 50, mods: [If(s => s.flags.gn_roster6 === 'sealed', -12, 'The register was sealed, and they found it')] }, info: [['yield', 'The chair keeps its name'], ['danger', 'The clinic']],
      ok: { text: 'Every page but one carries the clinic\'s stamp, and you speak only about the stamp. The hall half believes it. The clinic door is painted in the night, and the people who work there stop eating in the hall.',
        fx: () => ({ morale: -2, stain: ['gn_blamed_clinic', 2], flags: { gn_rosterage: 'blamed' }, do: s2 => regard(s2, 'physician', -30) }) },
      bad: { text: (s, c) => `${c.name} holds up the one page with no stamp on it. It has your name. The hall is quiet for a long time, and then the benches at the back empty.`,
        fx: () => ({ morale: -10, tension: 15, stain: ['gn_blamed_clinic', 1], flags: { gn_rosterage: 'caught' }, do: s2 => grudge(s2, 3) }) } },
  ] });

/* ---------- 3. the incubators ---------- */
C({ id: 'gen.bank', tone: 'pressure', title: 'Glass',
  when: s => few(s) && (!!s.flags.gn_duty || !!s.flags.lim_roster) && since(s, 'gn_duty_d') >= 5 * MONTH && s.day >= 400 && !s.flags.gn_bank && LF.down(s, 'reactor') && s.pop >= 24,
  text: s => `${Nc(s, 'engineer')} has uncrated one of the embryo bank's incubators on the workshop floor. It is a steel cradle with a glass lid, built to carry a child from the bank to term with nobody carrying it. There are twelve.\n\n[[engineer]] "They'll run. Each one's a heater and a pump on the old girl for nine months, and a kit of spares I haven't got."\n\nFrom the clinic door:\n\n[[physician]] "And then there's a baby and it's nobody's. Who gets up in the night? You?"`,
  choices: [
    { label: 'Run six. Each child goes to a household, by order', cost: { parts: 4 }, note: 'Nobody is asked whether they want the child they are handed.', info: [['yield', 'Six children a year'], ['danger', 'The households, and the children handed to them']],
      out: { text: 'The first six are lifted out in the workshop, because the clinic has no hoist. Each goes to a household on a list. Four of the households take to it. The other two do what the order says and no more, and the neighbours can hear the difference through the wall.',
        fx: s => ({ morale: -1, flags: { gn_bank: 'homes', gn_bank_d: s.day, births: true }, do: s2 => tank(s2, 6, 'homes'), chron: 'The first children were brought to term in the embryo bank\'s incubators.' }) } },
    { label: 'Run eight, and raise them together on a clinic rota', dark: true, cost: { parts: 4 }, note: 'It takes no household off the fields. The children belong to whoever is on shift.', info: [['yield', 'Eight children a year, and nobody taken off work'], ['danger', 'Children with no one of their own']],
      out: { text: 'A ward is partitioned off the clinic and a rota is posted: two hours a night, by row. The first eight are fed, changed and logged by forty different people in their first month. They are quiet children. The clinic notes it and has no column to put it in.',
        fx: s => ({ stain: ['gn_ward', 1], flags: { gn_bank: 'ward', gn_bank_d: s.day, births: true }, do: s2 => tank(s2, 8, 'ward'), chron: 'The first children were brought to term in the embryo bank\'s incubators, and raised on a rota.' }) } },
    { label: 'Run all twelve hot, two batches a year', dark: true, cost: { parts: 6 }, note: 'The pumps were built for one pace. At double, about one run in five fails, and a failed run has to be written up as something.', info: [['yield', 'Sixteen children a year'], ['danger', 'One run in five'], ['danger', 'The Reactor']],
      out: { text: s => `${Nc(s, 'engineer')} rewinds the pump motors and does not stay to watch. Twenty go in. Sixteen are lifted out alive at the end of the first run and put on the clinic rota. The other four are entered in the workshop log as failed runs, between a bearing and a seized valve.`,
        fx: s => ({ morale: -3, machine: { reactor: -5 }, stain: ['gn_hot', 2], flags: { gn_bank: 'hot', gn_bank_d: s.day, births: true }, do: s2 => tank(s2, 16, 'hot'), chron: 'The embryo bank\'s incubators were run at double their pace.' }) } },
    { label: 'Leave them crated', info: [['danger', 'Whether anyone is here in forty years']],
      out: { text: s => `The lid goes back on the crate. ${Nc(s, 'engineer')} is not sorry. ${Nc(s, 'physician')} goes on keeping the list of the people of an age, and crosses three more off it at the turn of the year.`,
        fx: s => ({ tension: 4, flags: { gn_bank: 'no', gn_bank_d: s.day } }) } },
  ] });

const REAR = { homes: 'raised in households that were told to take them', house: 'raised in the Glass House', work: 'raised on the sorting floor', ward: 'raised on the clinic rota', hot: 'raised on the clinic rota' };
C({ id: 'gen.tank6', far: true, tone: 'pressure', title: 'Whose Are They',
  when: s => { const t = X(s).tank; return !!t && yr(s) >= t.y + 5 && t.born >= 4 && !s.flags.gn_tank6; },
  setup: s => { const t = X(s).tank; return { mode: t.mode, n: t.n, back: clamp(Math.round(t.born * 0.2), 2, 12) }; },
  text: (s, c) => c.mode === 'homes'
    ? `The first children from the incubators are five. ${Num(c.back)} of them have been handed back: left on the clinic step with a bag, by households that did what the order said for as long as they could. The clinic has put them in the old ward.\n\nThe rest are doing as well as any child here. Everyone can tell which are which, the children included.`
    : `The first children from the incubators are five. They were raised on the rota, two hours at a time, by whoever's turn it was. They call every grown person by one word, and it is the word for whoever is on shift. When one of them is hurt the others do not cry. They fetch the nearest adult and stand back.\n\n${Nc(s, 'physician')} wants them out of the ward before they are six. "I've got ${num(c.n)} children in there who've never once been somebody's. Fix that, or tell me you won't."`,
  choices: [
    { label: 'Find each of them a household, and this time ask first', cost: { food: 80 }, note: 'A second ladle goes to every house that takes one, out of the common pot.', info: [['danger', 'The common pot'], ['danger', 'The children nobody asks for']],
      out: { text: 'It takes a season of asking, house by house. Most are placed. The houses that take one get a second ladle for it, and the houses that refused are known. Seven of the children run back to the ward in the first month and have to be walked home again.',
        fx: () => ({ morale: -2, flags: { gn_tank6: 'homes' }, do: s2 => { X(s2).tank.rear = 'homes'; } }) } },
    { label: 'They are the colony\'s. A house of their own, and one keeper who stays', cost: { mat: 25 }, note: 'It makes them a people of their own inside the colony.', info: [['danger', 'Who they are loyal to in six years']],
      out: { text: 'A long house goes up beside the clinic, with one door and one keeper who sleeps there. The children name it the Glass House before anyone else does. They do well in it. They do everything together, and they have stopped fetching an adult when one of them is hurt.',
        fx: () => ({ morale: 1, flags: { gn_tank6: 'house' }, do: s2 => { X(s2).tank.rear = 'house'; } }) } },
    { label: 'They owe the colony their start. Light work from now, and school when the work is done', dark: true, info: [['yield', 'Food and materials'], ['danger', 'Children of five, on a crew']],
      out: { text: s => `They are given the jobs that want small hands and patience: sorting seed, picking stone, cleaning the incubators the next ones are in. They do it without complaint and without being watched. ${Nc(s, 'quartermaster')} calls them the best crew in the colony, and is not glad to say it.`,
        fx: () => ({ food: 60, mat: 15, stain: ['gn_glasswork', 2], flags: { gn_tank6: 'work' }, do: s2 => { X(s2).tank.rear = 'work'; } }) } },
  ] });

C({ id: 'gen.tankage', far: true, tone: 'pressure', title: 'The Glass Cohort',
  when: s => { const t = X(s).tank; return !!t && yr(s) >= t.y + LF.AGE && !!s.flags.gn_tank6 && !s.flags.gn_tankage; },
  setup: s => { const t = X(s).tank, n = Math.max(5, t.n), x = X(s); let p = x.glass && byPid(s, x.glass);
    if (!p || !p.alive) { p = LF.makePerson(s, null, false, 'born'); p.known = s.day; p.bornHere = yr(s); x.glass = p.id; if (LF.societyInit) LF.societyInit(s); }
    return { pid: p.id, name: p.name, first: p.first, n, go: Math.max(2, Math.round(n * 0.4)), rear: REAR[t.rear || t.mode] }; },
  text: (s, c) => `The first children from the incubators came of age at the turn of the year: ${num(c.n)} of them, ${c.rear}. They went onto the roster as one crew and have asked to stay one. ${c.name} speaks for them, and none of the others interrupts.\n\nThe watch wants them. People with no cousins in the rows do not look away for a cousin.\n\nThey have asked for something else, which is the incubators. "We know what the ward is," ${c.first} says. "We wouldn't run it the way it was run."`,
  choices: [
    { label: 'Give them to the watch', dark: true, info: [['yield', 'Order in the rows'], ['danger', 'A watch that answers to itself']],
      out: { text: 'They take the watch-house over the way they took the sorting floor. Theft in the rows stops inside the season. So does a good deal of talk, because nobody knows what they write down. They report to you each month, all of them at once, in the same words.',
        fx: () => ({ tension: -20, morale: -4, stain: ['gn_watch', 2], flags: { gn_tankage: 'watch' }, do: s2 => grudge(s2, 1) }) } },
    { label: 'Give them the incubators', note: 'They will raise the next ones as their own. The colony gets a line of people who make their own successors.', info: [['yield', 'More children from the glass, and held'], ['danger', 'What the old rows make of it']],
      out: { text: 'They move the ward into the Glass House and sleep there in shifts of their own choosing. The children lifted out that year are held more than any before them. The old rows have a name for the arrangement and do not use it in front of you.',
        fx: () => ({ morale: 2, flags: { gn_tankage: 'glass' }, do: s2 => { const t = X(s2).tank; t.n = Math.round(t.n * 1.5); t.rear = 'house'; allRegard(s2, -4, p => p.vals.free === -1); } }) } },
    { label: 'Break the crew up across the rows. They are colonists like anyone', info: (s, c) => [['danger', `About ${num(c.go)} of them, gone`]],
      out: { text: (s, c) => `Each is sent to a different crew and a different row. They go where they are sent. ${Num(c.go)} of them are gone inside the year, past the wire together, and the rest work beside people who never learn their names.`,
        fx: (s, c) => ({ gone: c.go, morale: -3, flags: { gn_tankage: 'split' } }) } },
  ] });

Object.assign(LF.TAGS, {
  'gen.empty': ['mercy', 'order severe', 'free'], 'gen.duty': ['severe order', 'order', 'free mercy'], 'gen.refuser': ['severe order', 'closed', 'mercy free'],
  'gen.roster6': ['closed order', 'open', 'open mercy'], 'gen.rosterage': ['open mercy', 'severe order', 'closed'],
  'gen.bank': ['order', 'order severe', 'bold severe', 'cautious'], 'gen.tank6': ['mercy', 'free', 'severe order'], 'gen.tankage': ['order severe', 'free bold', 'order'],
});
Object.assign(LF.DEEDS || {}, {
  gn_named: 'the couples named at the evening meal for having no child',
  gn_tax: 'the childless made to do the work of the ones who bore',
  gn_charged: 'the lock-up for refusing the pairing board',
  gn_excused: 'the false certificates that got some people off the pairing board',
  gn_sealed: 'the pairing register sealed, and the children told they were wanted',
  gn_board_kept: 'the pairing board kept for its own children',
  gn_blamed_clinic: 'the pairing order laid at the clinic\'s door',
  gn_ward: 'the children from the incubators, raised by a rota and belonging to nobody',
  gn_hot: 'the incubators run at double pace, and the failed runs in the workshop log',
  gn_glasswork: 'the children from the incubators put on a crew at five',
  gn_watch: 'the watch made of the ones who had no families',
});
})();
