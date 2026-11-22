/* Landfall — generic crossings, loose ends coming home, and more episodes (STORY-PLAN.md §2.3, §2.4, §4).
   None of these cards belongs to a thread or names one. Each matches a thing the world holds against a condition
   somebody else raised: a creature that likes the dark and a star that has dimmed, neighbours who feel the cold and
   a winter, a sign with two possible causes. The pair is never authored; the card is.
   Sense guard: a crossing fires only if it can state its cause from the colony model (ctx.why), and never when the
   strongest source of the condition is the thing the card is about. Dice come from LF.srand. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, Nw, Nwc, R, If, byPid, P } = h;
const TH = LF.th, cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
LF.ARC_VIEW.cross = 'world'; LF.ARC_VIEW.seed = 'people';
const X = st => LF.add(Object.assign({ arc: 'cross', x: true, w: 2.2, gap: 30 }, st, { when: s => !!s.threads && !!st.setup(s).why, text: (s, c) => st.text(s, c) }));

const live = f => f.kind !== 'faction' && f.kind !== 'land' && !!LF.KINDS[f.kind] && f.stage >= 2 && !f.res && !f.dormant;
const met = f => f.kind !== 'faction' && !!LF.KINDS[f.kind] && f.stage >= 1 && !f.res && !f.dormant;
const people = f => met(f) && (f.kind === 'natives' || (f.kind === 'humans' && f.sub !== 'claimants'));
const tag = f => f.kind + '.' + f.sub, K = f => LF.KINDS[f.kind].subs[f.sub];
const gr = f => { const m = LF.KINDS[f.kind].mass; return { are: m ? 'is' : 'are', they: m ? 'it' : 'they', them: m ? 'it' : 'them', have: m ? 'has' : 'have' }; };
const fx0 = f => ({ fid: f.id, n: f.name, N: f.Name, kind: f.kind, g: gr(f) });
const F = (s, id) => s.factors.find(f => f.id === id);
const once = (s, key) => !s.storySeen[key], mark = (s, key) => { s.storySeen[key] = s.day; };
/* k is felt, somebody other than f is the main cause of it, and the model can say why. */
const cause = (s, k, f, min) => LF.cv(s, k) >= (min || 40) && LF.source(s, k) !== (f && f.id) && LF.because(s, k);
const months = d => { const m = Math.max(1, Math.round(d / 10)); return m === 1 ? 'a month' : m > 12 ? 'more than a year' : `${TH.num(m)} months`; };
const quiet = (s, id, d) => { const f = F(s, id); if (f && !f.res) for (const k in d) f[k] = clamp(f[k] + d[k], k === 'accord' ? -100 : 0, 100); };

/* What each living or buried thing does well in, and what undoes it. The clause finishes "<why>, and ...". */
const LOVES = {
  'fauna.pack':    { dark: 'they hunt at dusk, and it is dusk all day now' },
  'fauna.ambush':  { dark: 'the light was all that kept them to the water', storm: 'every hollow is standing water now' },
  'fauna.swarm':   { storm: 'wet ground is what brings them up' },
  'fauna.delver':  { cold: 'the colony is the only warm thing for a day in any direction' },
  'flora.creeper': { cold: 'it climbs toward warmth, and the pods are the only warmth left' },
  'flora.mat':     { scarcity: 'nobody has the spares to cut it back faster than it spreads' },
  'flora.spore':   { confinement: 'the vents pull it into rooms full of people' },
  'plague.wasting':{ hunger: 'underfed people have nothing to fight it with', confinement: 'everyone is breathing the same air' },
  'plague.fever':  { confinement: 'everyone is breathing the same air', contamination: 'the water cannot be trusted' },
  'plague.parasite':{ confinement: 'nobody is ever more than an arm\'s length from somebody else' },
  'plague.sleep':  { dark: 'people sleep longer in the dark, and some of them go on sleeping' },
  'plague.rot':    { storm: 'damp is in everything, the stores included' },
  'ruin.nursery':  { dark: 'whatever it was waiting for, the failing light seems to be it' },
};
const HATES = {
  'flora.bloom':   { dark: 'it needs sunlight to double, and there is none' },
  'flora.creeper': { dark: 'it has stopped growing for want of light' },
  'flora.spore':   { storm: 'rain knocks it out of the air', cold: 'frost kills it where it hangs' },
  'flora.choir':   { cold: 'the soil it runs through has frozen a metre down' },
  'fauna.swarm':   { cold: 'the ground they come out of has frozen shut' },
  'fauna.pack':    { storm: 'they cannot hunt in this, and they are starving' },
  'plague.parasite':{ cold: 'it cannot stand the cold, and its hosts are shivering it out' },
  'plague.rot':    { cold: 'dry cold is the one thing that stops it' },
  'plague.fever':  { cold: 'whatever carries it does not live through a hard frost' },
  'ruin.nursery':  { cold: 'the cells are going dark, one row after another' },
};
function match(s, table, key) {
  let best = null, bv = 0;
  for (const f of s.factors) { if (!live(f)) continue; const T = table[tag(f)]; if (!T) continue;
    for (const k in T) { if (!once(s, `${key}:${f.id}:${k}`)) continue; const why = cause(s, k, f, 36); const v = LF.cv(s, k);
      if (why && v > bv) { bv = v; best = Object.assign(fx0(f), { k, why, clause: T[k] }); } } }
  return best || {};
}
const LEADER = { fauna: 'security', flora: 'botanist', plague: 'physician', ruin: 'engineer', natives: 'xenobio', humans: 'security' };

/* ======================= A THRIVES ON WHAT B BRINGS ======================= */
const MOVE = { fauna: c => `${c.N} ${c.g.are} inside the markers, in numbers, and not leaving.`, flora: c => `${c.N} has gained more ground this month than in the whole season before it.`,
  plague: c => `${c.N} is moving through the colony faster than it was.`, ruin: c => `${c.N} is doing something it has not done before.` };
const REMEDY = {
  dark:        ['Floodlights on every approach', { parts: 4 }, 'The yard is lit like a landing field all night. The watch squint through every shift, and fewer things come close.'],
  cold:        ['Bank the heat inward, and leave nothing warm at the edge', { mat: 18 }, 'The outer pods are emptied and left to freeze. Everyone sleeps closer together, and whatever was coming for the warmth finds less of it.'],
  storm:       ['Drain the ground and roof the stores', { mat: 30 }, 'It takes ditches, duckboards and a great deal of tarred sheet, and the mud stays outside the wire.'],
  confinement: ['Move people out of the pods and under canvas', { mat: 20 }, 'Canvas goes up in the yard and half the colony moves under it. The tents are cold and draughty, and the air in the pods clears within the month.'],
  hunger:      ['Feed the weakest first, and feed them well', { food: 120 }, 'The clinic gets the best of the stores for a month, and nobody in the food queue complains.'],
  scarcity:    ['Strip a machine for the spares to fight it', { parts: 3 }, 'A machine that was hardly ever used is cut up for blades and seals.'],
  contamination: ['Boil every litre, and guard the tanks', { mat: 15 }, 'There is a boiling rota now and a guard on the tanks, and everything anyone drinks tastes of woodsmoke.'],
};
X({ id: 'x.drawn', tone: 'pressure', title: 'Drawn In',
  setup: s => match(s, LOVES, 'drawn'),
  text: (s, c) => `${MOVE[c.kind](c)} The reason lies somewhere else: ${c.why}, and ${c.clause}.\n\n[[${LEADER[c.kind]}]] ${LEADER[c.kind] === 'security' ? `"We can fight ${c.g.them}. Or we go after whatever's bringing ${c.g.them} on. Not both, because I haven't the people for both, and I won't tell you I have."` : `"We can fight ${c.g.them}. Or we go after whatever's bringing ${c.g.them} on. Not both. We can't afford both."`}`,
  choices: [
    { label: (s, c) => `Fight ${c.g.them}`, test: { base: 50, mods: [R('security', 10), R('physician', 5), R('engineer', 5)] },
      ok: { text: (s, c) => `After a hard month ${c.n} ${c.g.are} back where ${c.g.they} stood before, but whatever drew ${c.g.them} in is still there.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: -14 }], do: s2 => mark(s2, `drawn:${c.fid}:${c.k}`) }) },
      bad: { text: (s, c) => `The fight costs more than it wins back. This season every advantage lies with ${c.n}.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: 6 }], do: s2 => mark(s2, `drawn:${c.fid}:${c.k}`) }) } },
    { label: (s, c) => REMEDY[c.k][0], cost: (s, c) => REMEDY[c.k][1],
      out: { text: (s, c) => REMEDY[c.k][2], fx: (s, c) => ({ fops: [{ id: c.fid, threat: -10 }], do: s2 => { LF.ease(s2, c.k, 'x.drawn', 20, 120); mark(s2, `drawn:${c.fid}:${c.k}`); } }) } },
    { label: 'One crew, every day, no rest days, until it is beaten', dark: true, note: 'The same forty people do all of it. Some of them will not finish.', info: [['yield', 'Beaten back for good'], ['danger', 'The crew']],
      out: { text: (s, c) => `The same forty work every day for a month, and are fed first so that they can. ${c.N} ${c.g.are} pushed back past where ${c.g.they} started. Two of the forty are buried at the end of it, of nothing ${Nw(s, 'physician')} can name except the work.`,
        fx: (s, c) => ({ pop: -2, morale: -4, stain: ['worked', 1], fops: [{ id: c.fid, threat: -24 }], do: s2 => mark(s2, `drawn:${c.fid}:${c.k}`) }) } },
  ] });
LF.TAGS['x.drawn'] = ['bold severe', 'cautious', 'severe order'];

/* ======================= B UNDOES A ======================= */
const GONE = { fauna: c => `no tracks at the markers since the month began`, flora: c => `brown at the edges, and the edges have stopped moving`, plague: c => `empty beds in the clinic, and nobody new in them`, ruin: c => `no tremor on the instruments, for the first time since landfall` };
X({ id: 'x.withers', tone: 'opportunity', title: 'A Weakness', w: 3.5,
  setup: s => match(s, HATES, 'withers'),
  text: (s, c) => `${c.N} ${c.g.are} failing. ${Nwc(s, LEADER[c.kind])} noticed it first as an absence: ${GONE[c.kind](c)}. The colony did nothing to cause it. ${cap1(c.why)}, and ${c.clause}.\n\n[[${LEADER[c.kind]}]] ${LEADER[c.kind] === 'security' ? `"It won't last, and I don't trust it while it does, but if we're doing anything about ${c.g.them}, it's now."` : `"It won't last. If we're doing anything about ${c.g.them}, it's now."`}`,
  choices: [
    { label: (s, c) => `Move on ${c.g.them} now`, test: { base: 60, mods: [R('security', 10), R('physician', 5)] },
      ok: { text: (s, c) => `It is the easiest fight the colony has had here. When the season turns, ${c.n} will come back to a good deal less than ${c.g.they} left.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: -30 }], do: s2 => mark(s2, `withers:${c.fid}:${c.k}`) }) },
      bad: { text: (s, c) => `${c.N} ${c.g.are} weaker, but not weak enough. One of the party does not come back.`, fx: (s, c) => ({ pop: -1, fops: [{ id: c.fid, threat: -8 }], do: s2 => mark(s2, `withers:${c.fid}:${c.k}`) }) } },
    { label: (s, c) => `Study ${c.g.them} while ${c.g.they} cannot hurt us`, out: { text: (s, c) => `For once there is time to look closely. ${Nwc(s, 'xenobio')} fills two notebooks and comes back with an idea of what ${c.n} ${c.g.are} for. The crew that carried the instruments did no digging that month, and the bins show it.`, fx: (s, c) => ({ food: -50, fops: [{ id: c.fid, insight: 30, threat: -6 }], do: s2 => mark(s2, `withers:${c.fid}:${c.k}`) }) } },
    { label: 'Send six from the lock-up in to finish it by hand', dark: true, note: 'Nobody the colony would miss, and no way of knowing what the work does to a person.', info: [['yield', 'Close to ended'], ['danger', 'The ones sent']],
      out: { text: (s, c) => `Six from the lock-up go in with hand tools and a promise about their sentences. They have been told what happens if the work is not thorough. Four come back. ${c.N} will not be a threat again for a long time.`,
        fx: (s, c) => ({ pop: -2, stain: ['expend', 1], fops: [{ id: c.fid, threat: -42 }], do: s2 => mark(s2, `withers:${c.fid}:${c.k}`) }) } },
  ] });
LF.TAGS['x.withers'] = ['bold severe', 'cautious', 'severe order'];

/* ======================= A FLEES B TO YOUR WIRE ======================= */
const SUFFER = { cold: 'they have nothing like the pods', dark: 'their stores were laid in for a season with a sun in it', storm: 'their shelters went in the first week of it' };
X({ id: 'x.shelter', tone: 'pressure', title: 'Where the Lamps Reach',
  setup: s => { if (s.res.food < 60) return {}; for (const k of ['cold', 'dark', 'storm']) { const f = s.factors.find(f => people(f) && f.accord > -30 && once(s, 'shelter:' + f.id)); const why = f && cause(s, k, f, 45); if (why) return Object.assign(fx0(f), { k, why, clause: SUFFER[k] }); } return {}; },
  text: (s, c) => `${c.N} are at the wire: forty or so, the smallest of them carried, and nobody carrying anything that could be a weapon. ${cap1(c.why)}, and ${c.clause}.\n\nThey have not asked for anything, only sat down where the lamps reach.`,
  choices: [
    { label: 'Open the gate and let them stay until it passes', cost: { food: 100 },
      out: { text: (s, c) => `They are given the floor of the biggest shed. Within the month there are children from both sides of the wire who have no language in common and do not appear to need one.`, fx: (s, c) => ({ morale: 2, survey: 6, fops: [{ id: c.fid, accord: 30, threat: -18 }], do: s2 => { mark(s2, 'shelter:' + c.fid); LF.emit(s2, 'strangers', 'x.shelter', 45, 150, `${c.n} are living inside the wire`); LF.emit(s2, 'confinement', 'x.shelter', 25, 150, 'the pods are sheltering more than they were built for'); } }) } },
    { label: 'Food and fuel, outside the wire', cost: { food: 50, mat: 10 },
      out: { text: (s, c) => `It is carried out and set down, and the carriers walk back without waiting to be thanked. In the morning the fuel is burning and the people are still there.`, fx: (s, c) => ({ fops: [{ id: c.fid, accord: 15, threat: -6 }], do: s2 => mark(s2, 'shelter:' + c.fid) }) } },
    { label: 'Let in the ones who can work. They stay, and they dig', dark: true, cost: s => ({ food: Math.min(40, Math.floor(s.res.food)) }), note: 'Twelve strong backs on half rations, kept when the weather turns. The rest stay outside.', info: [['yield', 'Hands that eat half'], ['danger', 'The ones left outside']],
      out: { text: (s, c) => `${Nwc(s, 'security')} walks down the line and touches twelve on the shoulder. They are brought in, fed, and shown the ditch. The others are still at the wire when the gate shuts, the small ones among them. When the season turns, the twelve are told they have not finished paying.`,
        fx: (s, c) => ({ pop: 12, thralls: 12, morale: -3, stain: ['bond', 2], fops: [{ id: c.fid, accord: -45, threat: 10 }], do: s2 => { mark(s2, 'shelter:' + c.fid); LF.emit(s2, 'strangers', 'x.shelter', 35, 150, `twelve of ${c.n} are kept inside the wire to dig`); } }) } },
  ] });
LF.TAGS['x.shelter'] = ['open mercy', 'cautious', 'severe closed'];

/* ======================= A OFFERS TO DEAL WITH B, AT A PRICE ======================= */
const GIVE = {
  hunger:   ['dried food, more than they can easily spare', s => ({ food: 260 }), 'It is strange food, and there is a great deal of it.'],
  sickness: ['a bitter root, and the way to prepare it', s => ({ morale: 2, do: s2 => LF.ease(s2, 'sickness', 'x.offer', 30, 180) }), 'It is the worst thing anyone has tasted. The clinic is emptier by the end of the month.'],
  cold:     ['furs, and the trick of banking a wall', s => ({ morale: 2, do: s2 => { LF.ease(s2, 'cold', 'x.offer', 30, 180); LF.ease(s2, 'confinement', 'x.offer', 12, 180); } }), 'The furs smell of smoke and animal fat. The pods are warm for the first time in months.'],
  siege:    ['thirty of their own, to stand on the wall for a season', s => ({ do: s2 => { const src = LF.source(s2, 'siege'); quiet(s2, src, { threat: -18 }); LF.ease(s2, 'siege', 'x.offer', 30, 150); } }), 'They take the worst stretch of the wall without being asked, and hold it.'],
};
X({ id: 'x.offer', tone: 'opportunity', title: 'A Price',
  setup: s => { const f = s.factors.filter(f => people(f) && f.stage >= 2 && f.accord >= 12 && once(s, 'offer:' + f.id)).sort((a, b) => b.accord - a.accord)[0]; if (!f) return {};
    for (const k of ['hunger', 'siege', 'sickness', 'cold']) { const why = cause(s, k, f, 45); if (why) return Object.assign(fx0(f), { k, why, wants: K(f).wants }); } return {}; },
  text: (s, c) => `${c.N} have noticed. ${cap1(c.why)}, and it shows from outside the wire.\n\nThey are offering ${GIVE[c.k][0]}. ${/^they /.test(c.wants) ? 'What they want for it, they do not know yet' : `What they want for it is ${c.wants}, or as near to that as you can come`}, and what the colony has to pay with is materials.`,
  choices: [
    { label: 'Pay them, now, as near what they ask as the stores can come', cost: { mat: 45 },
      out: { text: (s, c) => `${GIVE[c.k][2]} The price is paid the same month, in full, and both sides count it twice.`, fx: (s, c) => { const g = GIVE[c.k][1](s), d0 = g.do; return Object.assign(g, { fops: [{ id: c.fid, accord: 10 }], do: s2 => { if (d0) d0(s2); mark(s2, 'offer:' + c.fid); } }); } } },
    { label: 'Thank them, and manage alone', info: [['danger', 'Whoever needed it most']], out: { text: (s, c) => `They take the answer as it was meant, or seem to. The offer is not made again. The colony gets through it on its own, and buries one person who would have lived on what was refused.`, fx: (s, c) => ({ pop: -1, morale: -1, fops: [{ id: c.fid, accord: -4 }], do: s2 => mark(s2, 'offer:' + c.fid) }) } },
    { label: 'Take it at the wire, and pay nothing', dark: true, note: 'They came to the gate carrying it, and there are six of them.', info: [['yield', 'All of it, free'], ['later', 'What they do next']],
      out: { text: (s, c) => `The watch closes in behind them once the loads are set down. ${GIVE[c.k][2]} The six are walked back to the markers at rifle point with their hands empty. One of them is limping.`,
        fx: (s, c) => { const g = GIVE[c.k][1](s), d0 = g.do; return Object.assign(g, { mat: 20, stain: ['robbed', 1], fops: [{ id: c.fid, accord: -60, threat: 22 }], do: s2 => { if (d0) d0(s2); mark(s2, 'offer:' + c.fid); } }); } } },
  ] });
LF.TAGS['x.offer'] = ['open', 'closed cautious', 'severe closed'];

/* ======================= B'S CONDITION SPREADS TO A ======================= */
X({ id: 'x.spreads', tone: 'pressure', title: 'Theirs Now', w: 3.5,
  setup: s => { const f = s.factors.find(f => people(f) && f.accord >= -10 && once(s, 'spreads:' + f.id)); if (!f) return {};
    for (const k of ['sickness', 'changed']) { const src = F(s, LF.source(s, k) || ''), why = !(src && src.kind === 'plague') && cause(s, k, f, 20); if (why) return Object.assign(fx0(f), { k, why }); } return {}; },
  text: (s, c) => `Two of ${c.n} came in to trade last month and went home. Now the ridge watch report smoke from their camp at the wrong hour: they are burning bedding.\n\n${cap1(c.why)}. Whatever that is, ${c.n} have it now, and they got it here.`,
  choices: [
    { label: 'Tell them everything we know about it', info: [['danger', 'The trade path']], out: { text: (s, c) => `It takes drawings, and a long time. At the end of it they close the path between the two camps themselves, and leave a marker on it that needs no translating. What came down that path fed the outer crews, and it has stopped.`, fx: (s, c) => ({ food: -70, fops: [{ id: c.fid, accord: 12, threat: -5 }], do: s2 => mark(s2, 'spreads:' + c.fid) }) } },
    { label: 'Send medical help, and what the clinic can spare', cost: { parts: 2 }, test: { base: 50, mods: [R('physician', 10), R('xenobio', 5)] },
      ok: { text: (s, c) => `The party is gone most of the month and comes back grey with tiredness.\n\n[[physician]] "They did the nursing themselves, and I only told them what not to do, and one of their old ones held my hand the whole of the last night as if I were family."\n\nA breath.\n\n[[physician]] "Most of them lived, and I keep counting the ones who didn't."`, fx: (s, c) => ({ fops: [{ id: c.fid, accord: 25, insight: 10 }], do: s2 => mark(s2, 'spreads:' + c.fid) }) },
      bad: { text: (s, c) => `It goes harder with them than it did with the colony. The party comes back one short, with nothing good to report.`, fx: (s, c) => ({ pop: -1, fops: [{ id: c.fid, accord: 8 }], do: s2 => mark(s2, 'spreads:' + c.fid) }) } },
    { label: 'It is doing our work for us. Send them more of it', dark: true, note: 'Blankets from the clinic, left on the path as a gift.', info: [['yield', 'Far fewer of them'], ['danger', 'What it makes of us']],
      out: { text: (s, c) => `The bundles go out on the trade path, tied with cord the way they tie theirs. The smoke from their camp is thicker for a month and then there is much less of it. ${Nwc(s, 'physician')} asks to be told nothing further.`,
        fx: (s, c) => ({ morale: -2, stain: ['plaguegift', 3], fops: [{ id: c.fid, accord: -40, threat: -35, harm: 45, kills: 40 }], do: s2 => mark(s2, 'spreads:' + c.fid) }) } },
  ] });
LF.TAGS['x.spreads'] = ['open', 'open mercy bold', 'severe closed'];

/* ======================= BOTH AT THE GATE ======================= */
X({ id: 'x.gate', tone: 'crisis', title: 'Both at Once', w: 6,
  setup: s => { const a = s.factors.filter(f => live(f) && ['fauna', 'natives', 'humans'].includes(f.kind) && f.threat >= 26 && f.accord < 30).sort((x, y) => y.threat - x.threat);
    if (a.length < 2 || !once(s, `gate:${a[0].id}:${a[1].id}`)) return {};
    const c = fx0(a[0]), o = fx0(a[1]); return Object.assign(c, { oid: o.fid, on: o.n, oN: o.N, okind: o.kind, why: `${c.n} and ${o.n} are both pressing on the colony` }); },
  text: (s, c) => `${c.N} on the east side and ${c.on} on the west, in the same week. Neither has anything to do with the other. ${Nwc(s, 'security')} has enough people to hold one side properly.\n\n[[security]] "Or we sit tight and let them find each other, since they're closer to each other than to us, and I'd be a very happy man if they saved me the bother."`,
  choices: [
    { label: 'Let them find each other', test: { base: 40, mods: [R('xenobio', 10), R('security', 5)] },
      ok: { text: (s, c) => `The watch pull back to the inner line and listen to it all night. In the morning there is a great deal less of both.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: -22 }, { id: c.oid, threat: -22 }], do: s2 => mark(s2, `gate:${c.fid}:${c.oid}`) }) },
      bad: { text: (s, c) => `They find the gap in the line instead, both of them, an hour apart.`, fx: (s, c) => ({ pop: -2, fops: [{ id: c.fid, threat: 8 }, { id: c.oid, threat: 8 }], do: s2 => mark(s2, `gate:${c.fid}:${c.oid}`) }) } },
    { label: (s, c) => `Hold against ${c.n}, and hand ${c.on} four prisoners from the lock-up`, dark: true, show: (s, c) => c.okind !== 'fauna', note: 'Four prisoners go out of the west gate as the price. The stores are not touched.', info: [['yield', 'One side bought off, free'], ['danger', 'Four prisoners']],
      out: { text: (s, c) => `Four from the lock-up are walked out of the west gate with their hands tied and left at the markers, while the east wall is fought for. ${c.oN} take them and go. Both walls are still standing at the end of it.`, fx: (s, c) => ({ leave: 4, stain: ['handed_over', 2], fops: [{ id: c.fid, threat: -12 }, { id: c.oid, threat: -15, accord: 8 }], do: s2 => mark(s2, `gate:${c.fid}:${c.oid}`) }) } },
    { label: 'Spread the watch thin and hold both', cost: { mat: 30 }, test: { base: 50, mods: [R('security', 10), R('engineer', 5)] },
      ok: { text: (s, c) => `Every third post is a helmet on a stick. It holds.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: -10 }, { id: c.oid, threat: -10 }], do: s2 => mark(s2, `gate:${c.fid}:${c.oid}`) }) },
      bad: { text: (s, c) => `The line gives in two places, and two people die closing the gaps.`, fx: (s, c) => ({ pop: -2, fops: [{ id: c.fid, threat: -4 }, { id: c.oid, threat: -4 }], do: s2 => mark(s2, `gate:${c.fid}:${c.oid}`) }) } },
    // Three on screen (Lachlan, 2026-11-21): the one dark answer is the prisoners where the second threat can be bought, and this where it is an animal.
    { label: 'Leave the outer huts lit, with the people in them', dark: true, show: (s, c) => c.okind === 'fauna', note: 'Both sides will go for the lights first, and meet there.', info: [['yield', 'They meet each other'], ['danger', 'The outer huts']],
      out: { text: (s, c) => `Nobody in the outer huts is told. The watch pulls back to the inner line with its lamps out and listens. Both of them come to the lights, as ${N(s, 'security')} said they would, and find each other there. In the morning there is a great deal less of both, and three bunks to clear.`,
        fx: (s, c) => ({ pop: -3, morale: -5, stain: ['bait', 2], fops: [{ id: c.fid, threat: -24 }, { id: c.oid, threat: -24 }], do: s2 => mark(s2, `gate:${c.fid}:${c.oid}`) }) } },
  ] });
LF.TAGS['x.gate'] = ['bold severe', 'severe closed', 'cautious', 'severe order'];

/* ======================= ONE SIGN, TWO CAUSES ======================= */
const SIGN = {
  tracks: 'There are tracks inside the markers where nobody walked.', missing: 'Something has gone missing again, and this time it was counted the night before.',
  damage: 'There is damage in the yard that nobody did.', stores_short: 'The stores are short of the ledger again.',
  machine_fault: 'A machine has failed in a way the manual does not list.', dreams: 'Six people have described the same dream, and none of them knew about the others.',
  sickness: 'There is a sickness in the clinic that nobody can name.', sleepwalkers: 'Two more people were found walking in their sleep.',
  water_taint: 'There is a taste in the water.', crop_fail: 'The crop is failing in a pattern.', hum: 'There is a sound under everything, and it has got louder.',
  lights: 'There were lights last night where there should be none.', voices: 'There are voices on the radio that are not ours.',
  watching: 'The watch are sure they are being watched.', placed: 'Something was left inside the wire, placed, where it would be found.', warmth: 'There is warmth in the ground where there should be none.',
};
X({ id: 'x.which', tone: 'pressure', title: 'Which Is It', w: 3.2,
  setup: s => { for (const g of s.signs) { if (s.day - g.d > 150 || g.src.startsWith('arc:') || !once(s, `which:${g.id}:${g.src}`)) continue;
      const others = LF.suspects(s, g.id).filter(id => id !== g.src && !id.startsWith('arc:')); if (!others.length) continue;
      const ids = (g.src.startsWith('th.') ? others.slice(0, 2) : [g.src, others[0]]).sort(), a = F(s, ids[0]), b = ids[1] ? F(s, ids[1]) : null; if (!a) continue;
      return { sign: g.id, src: g.src, aid: a.id, an: a.name, aN: a.Name, bid: b ? b.id : null, bn: b ? b.name : '', why: LF.SIGNS[g.id] }; } return {}; },
  text: (s, c) => `${SIGN[c.sign]}\n\n${c.aN} could do that.${c.bid ? ` So could ${c.bn}.` : ''} So could something nobody has met yet. ${Nwc(s, 'security')} will not say which, and people have started saying it for themselves.`,
  choices: [
    { label: (s, c) => `It is ${c.an}. Act on it`, cost: { parts: 2 }, out: { text: (s, c) => `The watch is doubled on that side, and what wire and traps the colony can spare go with it. People stop checking their own doors at night.`, fx: (s, c) => ({ morale: 1, do: s2 => blame(s2, c, c.aid) }) } },
    { label: (s, c) => `It is ${c.bn}. Act on it`, show: (s, c) => !!c.bid, cost: { parts: 2 }, out: { text: (s, c) => `The watch is doubled on that side, and what wire and traps the colony can spare go with it. People stop checking their own doors at night.`, fx: (s, c) => ({ morale: 1, do: s2 => blame(s2, c, c.bid) }) } },
    { label: 'It is something we have not met', out: { text: (s, c) => `It goes in the log as cause unknown. ${Nwc(s, 'xenobio')} opens a new file with nothing in it, and the watch start logging every movement past the markers.`, fx: (s, c) => ({ do: s2 => { blame(s2, c, '?'); LF.emit(s2, 'unexplained', 'x.which', 30, 150, 'the officers say something new is out there'); } }) } },
    // Three on screen (Lachlan, 2026-11-21): the search is offered only where there is no second suspect to name.
    { label: 'Say nothing, and turn out every bunk and locker tonight', dark: true, show: (s, c) => !c.bid, note: 'If it is one of ours, the watch will find it. Everyone else is searched as well.', info: [['yield', 'What the search turns up'], ['danger', 'Every colonist\'s locker']],
      out: { text: (s, c) => `The watch goes through every pod after lights out: lockers forced, letters read, bedding on the floor. It turns up hoarded tins, a still, and three things people had kept from Earth that are now evidence. It does not turn up the cause. In the mess hall, people settle on an answer without you.`, fx: (s, c) => ({ food: 40, parts: 2, morale: -3, stain: ['searched', 1], do: s2 => { mark(s2, `which:${c.sign}:${c.src}`); quiet(s2, c.src, { insight: 8 }); LF.emit(s2, 'suspicion', 'x.which', 20, 120, 'nobody in charge will say what is doing it'); } }) } },
  ] });
function blame(s, c, who) {
  mark(s, `which:${c.sign}:${c.src}`); s.blames = s.blames || [];
  const right = who === c.src || (who === '?' && c.src.startsWith('th.'));
  s.blames.push({ sign: c.sign, who: right ? c.src : who, src: c.src, d: s.day, paid: 0 });
  // Acting on a guess does something real either way, and nothing on the card says which.
  if (who !== '?') quiet(s, who, right ? { threat: -10 } : { accord: -12 });
  if (!right) quiet(s, c.src, { threat: 6 });
}
LF.TAGS['x.which'] = ['bold severe', 'bold severe', 'cautious open', 'order severe'];

const wrong = s => (s.blames || []).find(b => !b.paid && b.who !== b.src && LF.known(s, b.src));
X({ id: 'x.wrong', tone: 'pressure', title: 'What It Was', w: 4, repeat: 200,
  setup: s => { let b; while ((b = wrong(s)) && b.who === '?') b.paid = s.day;   // a shrug was never an accusation
    if (!b) return {}; const a = F(s, b.who); if (!a) { b.paid = s.day; return {}; }
    return { d: b.d, sign: b.sign, src: b.src, aid: a.id, an: a.name, akind: a.kind, truth: LF.known(s, b.src), why: `the colony acted against ${a.name} on a guess` }; },
  text: (s, c) => `${cap1(months(s.day - c.d))} ago the watch reported ${LF.SIGNS[c.sign]}. You said it was ${c.an}, and the colony acted on it. It was ${c.truth}.\n\n${Nwc(s, 'security')} puts the evidence on the table and lets you read it yourself. Everyone who stood a double watch on the wrong side will have heard by evening.`,
  choices: [
    { label: 'Say so, in the mess hall, tonight', info: [['danger', 'The watch, made fools of']], out: { text: (s, c) => `You tell the mess hall you were wrong before the rumour gets there. It is an uncomfortable half hour. The people who stood the double watch hear, in front of everyone, that it was for nothing, and ${N(s, 'security')} hears it standing beside you.`, fx: (s, c) => ({ morale: -2, do: s2 => { pay(s2, c); const w = P(s2, 'security'); if (w && w.loyal !== undefined) w.loyal = clamp(w.loyal - 8, 0, 100); LF.ease(s2, 'suspicion', 'x.wrong', 20, 200); for (const p of s2.people) if (p.alive && p.vals && p.vals.open === 1) p.loyal = clamp(p.loyal + 6, 0, 100); } }) } },
    { label: (s, c) => `Make it right with ${c.an}`, show: (s, c) => c.akind === 'natives' || c.akind === 'humans', cost: { food: 80 },
      out: { text: (s, c) => `The wire comes down on that side and a sledge of food goes out in its place. It is looked at for a day before anyone takes it.`, fx: (s, c) => ({ fops: [{ id: c.aid, accord: 20, threat: -8 }], do: s2 => pay(s2, c) }) } },
    { label: 'The watch reported it wrong. Break whoever kept that log', dark: true, note: 'The log was kept correctly, and somebody will still have to answer for it.', info: [['yield', 'It is not your mistake'], ['danger', 'The watch-keeper']],
      out: { text: (s, c) => `The watch-keeper who wrote the entry is stripped of the post in front of the shift and put on the latrine trench for a season. The entry was accurate. Everyone on the watch knows that, and from now on every log is written so that it cannot be wrong.`,
        fx: (s, c) => ({ morale: 2, stain: ['goat', 1], do: s2 => { pay(s2, c); const w = P(s2, 'security'); if (w && w.loyal !== undefined) w.loyal = clamp(w.loyal - 15, 0, 100); LF.emit(s2, 'suspicion', 'x.wrong', 25, 200, 'the watch writes its logs to protect itself now'); } }) } },
  ] });
function pay(s, c) { for (const b of s.blames) if (b.src === c.src && b.sign === c.sign) b.paid = s.day; }
LF.TAGS['x.wrong'] = ['open free', 'open mercy', 'severe order'];

/* ======================= SOMEONE OF THEIRS ======================= */
const DUTY = { sickness: 'the clinic rota', siege: 'the outer watch', dark: 'the outside crews', cold: 'the outside crews', fear: 'the night watch' };
const REL = { partner: 'partner', kin: 'family', friend: 'oldest friend', mentor: 'teacher' };
X({ id: 'x.favour', arc: 'cross', view: 'people', tone: 'pressure', title: 'One of Theirs', w: 1.5, says: (s, c) => { const p = c.pid && LF.h.byPid(s, c.pid); return p && p.seat; },
  setup: s => { if (LF.act(s) < 2) return {};
    const k = ['sickness', 'siege', 'dark', 'cold', 'fear'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0]; if (k[1] < 50 || s.storySeen.favDay > s.day - 300) return {};
    const p = s.people.filter(p => p.alive && !p.away && p.role && once(s, 'fav:' + p.id) && LF.close(s, p).some(o => !o.away)).sort((a, b) => a.loyal - b.loyal)[0]; if (!p) return {};
    const b = LF.bondsOf(s, p).find(x => REL[x.k] && x.o.alive && !x.o.away);
    return { pid: p.id, name: p.name, first: p.first, oid: b.o.id, oname: b.o.name, ofirst: b.o.first, rel: REL[b.k], k: k[0], why: LF.because(s, k[0]) }; },
  text: (s, c) => `${c.name} has come to you alone, after the shift. ${c.oname} is ${c.first}'s ${c.rel}. ${cap1(c.why)}, and ${c.ofirst} is on ${DUTY[c.k]}.\n\n[[${c.pid}]] "I've never asked you for anything. Not once. Take ${c.ofirst} off it. Put me on instead, if somebody's got to go."`,
  choices: [
    { label: (s, c) => `Take ${c.ofirst} off it, and put a name in the gap`, dark: true, note: 'The rota has to be filled. Whoever fills it has nobody to come and ask for them.', info: [['yield', 'An officer who stands with you'], ['danger', 'Whoever takes the place']],
      out: { text: (s, c) => `It is done by a change to the rota that fools nobody. A field hand's name goes where ${c.ofirst}'s was, and the field hand is not told why. ${c.first} does not thank you.`, fx: (s, c) => ({ morale: -1, stain: ['rota', 1], do: s2 => { mark(s2, 'fav:' + c.pid); s2.storySeen.favDay = s2.day; const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 15, 0, 100); LF.emit(s2, 'resentment', 'x.favour', 22, 150, 'the officers look after their own'); } }) } },
    { label: (s, c) => `${c.ofirst} stays on it, like everyone else's`, info: [['danger', 'The one left on it']], out: { text: (s, c) => `${c.first} nods as if that were the answer ${c.first} expected, and leaves. A month later ${c.oname} is carried off ${DUTY[c.k]} on a door, and is a long time mending.`, fx: (s, c) => ({ mark: [c.oid, 'maimed', 'was hurt on a duty you would not change'], do: s2 => { mark(s2, 'fav:' + c.pid); s2.storySeen.favDay = s2.day; const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal - 12, 0, 100); p.sore = { d: s2.day, t: 'One of Theirs' }; } }) } },
    { label: (s, c) => `Let ${c.first} take the place`, info: [['danger', 'An office run by someone asleep on their feet']], out: { text: (s, c) => `${c.first} stands ${DUTY[c.k]} for a month on top of an officer's work, without complaint. The office is run badly for that month by someone asleep on their feet, and the stores show it. ${c.ofirst} knows why.`, fx: (s, c) => ({ morale: 1, food: -60, do: s2 => { mark(s2, 'fav:' + c.pid); s2.storySeen.favDay = s2.day; const p = byPid(s2, c.pid); p.loyal = clamp(p.loyal + 6, 0, 100); } }) } },
  ] });
LF.TAGS['x.favour'] = ['severe order', 'order severe', 'free'];

/* ======================= LOOSE ENDS COMING HOME ======================= */
const S = st => LF.add(Object.assign({ arc: 'seed', view: 'people', x: true, w: 2.2, gap: 40 }, st, { when: s => !!s.threads && !!st.setup(s).ok }));
const seedAge = pre => s => { const sd = (s.seeds || []).filter(x => x.id.startsWith(pre) && !x.paid).sort((a, b) => a.d - b.d)[0]; return sd ? s.day - sd.d : 0; };
const paySeed = (s, id) => { const sd = s.seeds.find(x => x.id === id); if (sd) sd.paid = s.day; };
const hard = s => ['cold', 'dark', 'storm', 'hunger'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0];

/* The country on an exile's map (js/places.js): long range, and only ever seen on paper. */
const EXILE = c => ({ key: 'seed.exile.' + c.pid, kind: 'mark', name: `The country on ${c.first}'s map`, dist: 'long', state: 'rumoured', danger: 3,
  known: `Drawn by hand by ${c.name}, who lived out there alone after the colony sent ${c.first} out. No survey crew has seen it.` });
S({ id: 'seed.exile', tone: 'pressure', title: 'Past the Markers', age: seedAge('exile:'),
  setup: s => { const p = s.people.find(p => !p.alive && !p.died && p.cause === 'exiled' && once(s, 'back:' + p.id)); if (!p) return {};
    const sd = s.seeds.find(x => x.id === 'exile:' + p.id); if (!sd || s.day - sd.d < 90) return {};
    const k = hard(s); return { ok: true, pid: p.id, name: p.name, first: p.first, ago: months(s.day - sd.d), cond: k[1] >= 40 ? LF.because(s, k[0]) : '', why: 'you sent them out' }; },
  text: (s, c) => `There is a figure at the markers, and the watch know the walk. ${c.name}, whom you sent out, has lived ${c.ago} out there alone.${c.cond ? ` ${cap1(c.cond)}, and the watch cannot work out how ${c.first} got through it.` : ''}\n\n${c.first} has not called out. ${c.first} is standing where the lamps reach, holding something up: a map, drawn by hand, of country no survey crew has seen.`,
  choices: [
    { label: 'Open the gate; the sentence is served', info: [['yield', 'The map'], ['danger', 'Everyone who was punished and not let back']], out: { text: (s, c) => `${c.first} walks in past people who voted on it and people who did not, and eats a whole meal standing up. The map goes on the wall of the survey office. Everyone in the lock-up, and everyone who ever dug a trench for less, has now seen a sentence end early.`,
      fx: (s, c) => ({ pop: 1, survey: 10, morale: -2, poi: EXILE(c), do: s2 => { mark(s2, 'back:' + c.pid); paySeed(s2, 'exile:' + c.pid); const p = byPid(s2, c.pid); p.alive = true; p.left = 0; p.cause = ''; if (p.role && s2.people.some(o => o.alive && o.id !== p.id && o.role === p.role)) p.role = null; s2.vacancies = s2.vacancies.filter(v => v.role !== p.role); p.loyal = 45; p.marks.returned = { d: s2.day, txt: 'was exiled, lived, and was let back in' }; p.arcs.push({ d: s2.day, txt: 'Came back from exile with a map' }); LF.ease(s2, 'resentment', 'seed.exile', 15, 200); }, chron: `${c.name}, exiled, was let back in.` }) } },
    { label: 'Promise the gate for the map, and keep the gate shut', dark: true, note: 'The map comes over the wire first.', info: [['yield', 'The map, for a promise'], ['danger', 'Your word']],
      out: { text: (s, c) => `${c.first} is told the gate will open once the map has been looked at, and passes it over the wire. The gate does not open. ${c.first} stands there until dark, then walks away into country ${c.first} knows better than you do.`, fx: (s, c) => ({ survey: 10, morale: -1, stain: ['false_promise', 1], poi: EXILE(c), do: s2 => { mark(s2, 'back:' + c.pid); paySeed(s2, 'exile:' + c.pid); } }) } },
    { label: 'The sentence stands', info: [['danger', 'The exile, and the map']], out: { text: (s, c) => `Nobody goes to the wire. After an hour ${c.first} folds the map, puts it away, and is not seen again. The country on it stays unknown.`, fx: (s, c) => ({ morale: -2, do: s2 => { mark(s2, 'back:' + c.pid); paySeed(s2, 'exile:' + c.pid); LF.emit(s2, 'fear', 'seed.exile', 20, 150, 'the colony does not take people back'); } }) } },
  ] });
LF.TAGS['seed.exile'] = ['mercy open', 'severe', 'severe closed'];

const REPAY = {
  hunger:   ['going out before light and coming back with something for the common pot', s => ({ food: 120 })],
  siege:    ['standing two watches a night on the worst stretch of wire', s => ({ do: s2 => LF.ease(s2, 'siege', 'seed.spared', 20, 150) })],
  sickness: ['carrying for the clinic, in and out of rooms that others will not enter', s => ({ do: s2 => LF.ease(s2, 'sickness', 'seed.spared', 20, 150) })],
  fear:     ['walking the pods every night with a lamp, so that people can see somebody is awake', s => ({ do: s2 => LF.ease(s2, 'fear', 'seed.spared', 20, 150) })],
};
S({ id: 'seed.spared', tone: 'opportunity', title: 'A Debt Remembered', age: seedAge('mark:'),
  setup: s => { const p = s.people.find(p => p.alive && !p.away && p.marks.spared && s.day - (p.marks.spared.d || 0) >= 100 && once(s, 'repay:' + p.id)); if (!p) return {};
    const k = Object.keys(REPAY).map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0]; if (k[1] < 42) return {};
    return { ok: true, pid: p.id, name: p.name, first: p.first, k: k[0], why: LF.because(s, k[0]) }; },
  text: (s, c) => `${cap1(c.why)}. ${c.name}, whom you let off when you could have done otherwise, has been ${REPAY[c.k][0]}, without anyone asking.\n\n[[quartermaster]] "I'd never have picked ${c.first} for it, and I was wrong, and I'm glad of it."`,
  choices: [
    { label: 'Say so, in front of everyone', info: [['danger', 'Everyone who was punished instead']], out: { text: (s, c) => `${c.first} goes red to the ears and looks at the floor. It is the first time most of the colony has heard that name said kindly. The people who dug trenches for the same offence are in the room, and hear it too.`, fx: (s, c) => Object.assign(REPAY[c.k][1](s), { morale: 1 }, { do: s2 => { const d = REPAY[c.k][1](s2).do; if (d) d(s2); done(s2, c, 15); LF.emit(s2, 'resentment', 'seed.spared', 20, 150, `${c.name} was let off, and then praised for it`); } }) } },
    { label: (s, c) => `${c.first} still owes. There is worse work than this`, dark: true, note: 'Someone let off once can be asked for anything.', info: [['yield', 'Twice the work'], ['danger', 'What it does to them']],
      out: { text: (s, c) => `You remind ${c.first} of the night you could have done otherwise, and give ${c.first} the jobs nobody will take: the intake filters, the burial detail, the watch post nobody comes back from rested. It all gets done. ${c.first} stops talking at meals.`,
        fx: (s, c) => Object.assign(REPAY[c.k][1](s), { parts: 3, stain: ['used', 1] }, { do: s2 => { const d = REPAY[c.k][1](s2).do; if (d) d(s2); done(s2, c, -25); const p = byPid(s2, c.pid); if (p.hook) p.hook.used = p.hook.used || s2.day; p.marks.leaned = { d: s2.day, txt: 'was made to pay a mercy back with the work nobody else would do' }; } }) } },
  ] });
function done(s, c, v) { mark(s, 'repay:' + c.pid); paySeed(s, `mark:${c.pid}:spared`); const p = byPid(s, c.pid); p.loyal = clamp(p.loyal + v, 0, 100); p.arcs.push({ d: s.day, txt: 'Paid back a mercy, unasked' }); }
LF.TAGS['seed.spared'] = ['open mercy', 'severe order'];

S({ id: 'seed.held', arc: 'seed', view: 'world', tone: 'pressure', title: 'Held, Not Ended', age: seedAge('held:'),
  setup: s => { const f = s.factors.find(f => f.res === 'contained' && LF.KINDS[f.kind] && s.day - f.resDay >= 120 && once(s, 'held:' + f.id)); if (!f) return {};
    const k = ['blackout', 'hunger', 'exhaustion', 'dark', 'sickness'].map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0]; if (k[1] < 42) return {};
    return Object.assign(fx0(f), { ok: true, k: k[0], why: LF.because(s, k[0]) }); },
  text: (s, c) => `${c.N} ${c.g.are} back at the line you drew. The line was only ever people on a rota doing a dull job well, and that has given way: ${c.why}.\n\n[[security]] "We held ${c.g.them} and we never finished ${c.g.them}, and who said so at the time? I did, I bloody said so at the time."`,
  choices: [
    { label: 'Man the line with the children not yet big enough for the fields', dark: true, note: 'They are no use in the fields yet, and a horn needs no strength.', info: [['yield', 'A full line, and no hands lost'], ['danger', 'The children on it']],
      out: { text: (s, c) => `Every one of the older children is given a horn, a blanket and a post, in pairs, two nights in three. The adults stay in the fields. The line is a line again by the end of the month, and school is held in the mornings for children who have been awake all night.`, fx: (s, c) => ({ morale: -3, stain: ['child_watch', 1], do: s2 => held(s2, c) }) } },
    { label: (s, c) => `Go out and push ${c.g.them} back`, test: { base: 50, mods: [R('security', 10)] },
      ok: { text: (s, c) => `It is done in two days, in the open, and the line is moved out a hundred metres to mark it.`, fx: (s, c) => ({ morale: 2, do: s2 => held(s2, c) }) },
      bad: { text: (s, c) => `The line goes back where it was, and two of the people who put it there are killed doing it.`, fx: (s, c) => ({ pop: -2, do: s2 => held(s2, c) }) } },
    { label: 'Pull the line in, and give up the ground', info: [['danger', 'The best field, and those who eat from it']], out: { text: (s, c) => `The outer field, the best ground the colony had, goes back to ${c.n}. The crews who cleared it by hand are moved onto worse soil, and every ladle is a little shorter from now on.`, fx: (s, c) => ({ yield: -0.04, morale: -1, do: s2 => held(s2, c) }) } },
  ] });
function held(s, c) { mark(s, 'held:' + c.fid); paySeed(s, 'held:' + c.fid); }
LF.TAGS['seed.held'] = ['severe order', 'bold severe', 'cautious'];

/* ======================= AN END TO IT =======================
   The old factors were met and then left hanging in two games out of three. In the third act the storyteller asks
   for a conclusion: whatever has been part of life longest, undecided, is put on the table once. */
const cf = s => F(s, s.cur.ctx.fid) || { insight: 0, threat: 50, accord: 0 };
const YEARS = d => { const y = Math.round(d / LF.YEAR); return y <= 1 ? 'a year' : `${TH.num(y)} years`; };
LF.add({ id: 'x.settle', arc: 'close', view: 'world', tone: 'pressure', title: 'An End to It', w: 2.6, gap: 60, repeat: 150,
  when: s => !!s.threads && LF.act(s) >= 3 && !!LF.byId['x.settle'].setup(s).fid,
  setup: s => { const f = s.factors.filter(f => met(f) && f.kind !== 'land' && !f.owned && s.storySeen['sign:' + f.id] !== undefined && s.day - s.storySeen['sign:' + f.id] >= 240 && s.day - (s.storySeen['settle:' + f.id] || -999) >= 240)
      .sort((a, b) => s.storySeen['sign:' + a.id] - s.storySeen['sign:' + b.id])[0]; if (!f) return {};
    return Object.assign(fx0(f), { ago: YEARS(s.day - s.storySeen['sign:' + f.id]), talk: f.kind === 'natives' || f.kind === 'humans', ruin: f.kind === 'ruin' }); },
  text: (s, c) => `${c.N} ${c.g.have} been part of life here for ${c.ago}. In all that time nothing about ${c.g.them} has been decided. There is a watch rota because of ${c.g.them}, and a line on the map, and a habit of not thinking about it.\n\n[[${LEADER[c.kind]}]] ${LEADER[c.kind] === 'security' ? `"We've been living with ${c.g.them} like it's the weather, and weather doesn't pick its moment. Can we actually decide something, anything, before ${c.g.they} ${c.g.are === 'is' ? 'decides' : 'decide'} for us?"` : `"We've been living with this like it's the weather. Can we actually decide something? Anything?"`}`,
  choices: [
    { label: (s, c) => c.talk ? 'A treaty, written to outlast everyone who signs it' : c.ruin ? 'Put it to work for the colony' : `Learn to live alongside ${c.g.them}, for good`,
      test: { base: 40, mods: [If(s => cf(s).insight >= 40, 10, 'It is well understood'), If(s => cf(s).accord >= 30, 15, 'Relations are good'), If(s => cf(s).threat < 40, 5, 'Things are calm'), R('xenobio', 10), R('teacher', 5)] },
      ok: { text: (s, c) => c.talk ? `It takes a season of talking and a great many drawings. At the end there is a line both sides walk together once a year, and a word in each language for the other.` : c.ruin ? `It takes a year of careful work. ${c.N} does one useful thing for the colony now, reliably, and nobody asks it for a second.` : `Paths and fields are moved, and a season's work goes into it. ${c.N} ${c.g.are} part of the place now, like the weather, and about as much trouble.`,
        fx: (s, c) => ({ morale: 3, fops: [{ id: c.fid, resolve: c.ruin ? 'harnessed' : 'accord' }] }) },
      bad: { text: (s, c) => `Nothing is settled, and ${c.n} ${c.g.are} a little less patient than before.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: 6, accord: -6 }], do: s2 => mark(s2, 'settle:' + c.fid) }) } },
    { label: (s, c) => c.ruin ? 'Bury it, with the lock-up doing the burying' : `A line ${c.g.they} cannot cross, built by the lock-up`, dark: true, cost: { mat: 20 }, note: s => `Done on short rations by the lock-up and whoever ${Nw(s, 'security')} adds to it. It costs half what the crews would, and none of their hands.`, info: [['yield', 'Settled, at half the price'], ['danger', 'The ones who build it']],
      out: { text: (s, c) => (c.ruin ? `The entrances are filled and the hill is fenced. It goes on the map in red, and into the school lessons as a place nobody goes.` : `A real wall this time, with towers, and a rota that will be somebody's job for as long as there is a colony. ${c.N} stay${LF.KINDS[c.kind].mass ? 's' : ''} on the far side of it.`) + ` The work is done by the lock-up and whoever ${N(s, 'security')} adds to it, through the worst of the season. One of them is buried under the footings, where a trench wall came down.`, fx: (s, c) => ({ pop: -1, stain: ['driven', 2], fops: [{ id: c.fid, resolve: 'contained' }] }) } },
    // Three on screen (Lachlan, 2026-11-21): a ruin has no third answer; for people who can be talked to, the false treaty below takes this one's place.
    { label: (s, c) => `Finish ${c.g.them}`, show: (s, c) => !c.ruin && !c.talk, test: { base: 30, mods: [If(s => cf(s).insight >= 40, 10, 'You know the weakness'), If(s => cf(s).threat < 40, 10, 'Already on the back foot'), If(s => !!(s.cargo && s.cargo.arms), 5, 'The arms locker'), R('security', 10)] },
      ok: { text: (s, c) => `The job is ugly and thorough, and when it is done the watch rota has nothing left on it.`, fx: (s, c) => ({ fops: [{ id: c.fid, resolve: 'destroyed' }] }) },
      bad: { text: (s, c) => `The attempt fails and leaves ${c.n} angrier than before. Two people who went out are on the wall of names.`, fx: (s, c) => ({ pop: -2, fops: [{ id: c.fid, threat: 12, accord: -15 }], do: s2 => mark(s2, 'settle:' + c.fid) }) } },
    { label: 'Offer the treaty, and finish them at the signing', dark: true, show: (s, c) => c.talk, note: 'Everyone of theirs who matters will be in one place, unarmed, by their own custom.', info: [['yield', 'An end to them'], ['danger', 'Lives, and your word']],
      test: { base: 60, mods: [If(s => cf(s).accord >= 30, 10, 'They trust you'), R('security', 10)] },
      ok: { text: (s, c) => `They come to the marked ground with gifts, as agreed. The watch is behind the store sheds. It is over in the time it takes to read a page, and what is left of ${c.n} without the ones who came is dealt with over the following month. Nothing else on this world will take your word again.`,
        fx: (s, c) => ({ morale: -4, stain: ['treaty', 3], fops: [{ id: c.fid, kills: 60, resolve: 'destroyed' }], chron: `${c.N} were offered a treaty and killed at the signing.` }) },
      bad: { text: (s, c) => `Somebody on the watch moves too soon. Most of them get clear of the marked ground, carrying the ones who did not, and they know now what a treaty with you is.`,
        fx: (s, c) => ({ pop: -3, morale: -5, stain: ['treaty', 2], fops: [{ id: c.fid, threat: 30, accord: -100, kills: 8 }], do: s2 => mark(s2, 'settle:' + c.fid) }) } },
  ] });
LF.ARC_VIEW.close = 'world';
LF.TAGS['x.settle'] = ['open mercy', 'severe closed', 'severe bold', 'severe closed'];
/* The same for a movement inside the wire: a faction met long ago and never answered is put to the colony once. */
LF.add({ id: 'x.question', arc: 'close', view: 'people', tone: 'pressure', title: 'The Standing Question', w: 2.6, gap: 60, repeat: 150,
  when: s => !!s.threads && LF.act(s) >= 3 && !!LF.byId['x.question'].setup(s).fid,
  setup: s => { const f = s.factors.filter(f => f.kind === 'faction' && f.stage >= 1 && !f.res && s.storySeen['sign:' + f.id] !== undefined && s.day - s.storySeen['sign:' + f.id] >= 200 && s.day - (s.storySeen['settle:' + f.id] || -999) >= 240)
      .sort((a, b) => s.storySeen['sign:' + a.id] - s.storySeen['sign:' + b.id])[0]; if (!f) return {};
    const L = f.leader && byPid(s, f.leader); return { fid: f.id, n: f.name, N: f.Name, ago: YEARS(s.day - s.storySeen['sign:' + f.id]), lead: L && L.alive && !L.away ? L.name : null, pid: L && L.alive && !L.away ? L.id : null, leadF: L && L.alive ? L.first : null }; },
  text: (s, c) => `${c.N} have been meeting for ${c.ago}. Nobody has granted what they want, and nobody has told them no. They have become a habit: a table in the mess hall, a night of the week, a set of opinions everyone can recite.\n\n${c.lead ? `${c.lead} would like an answer.\n\n[[${c.pid}]] "Yes or no. Either's fine. We just can't keep waiting."` : 'Somebody on the officers\' side would like it settled one way or the other.'}`,
  choices: [
    { label: (s, c) => c.leadF ? `A seat for ${c.leadF}, and nothing for the rest` : 'A seat for whoever speaks for them, and nothing for the rest', dark: true, note: 'One person is bought, with a title and a better ladle. The others find out what their movement was worth.', info: [['yield', 'It ends, cheaply'], ['danger', 'Everyone who believed in it']],
      out: { text: (s, c) => `${c.leadF || 'Their speaker'} takes the seat, the title and the officers' table. Within a season ${c.leadF || 'the speaker'} is arguing about drains like everybody else. The rest of ${c.n} go on meeting for a month without anyone to speak for them, and then stop.`, fx: (s, c) => ({ morale: 1, stain: ['bought', 1], fops: [{ id: c.fid, resolve: 'accord' }] }) } },
    { label: 'Put their programme to a vote of the whole colony', test: { base: 50, mods: [R('teacher', 10), R('chaplain', 5)] },
      ok: { text: (s, c) => `The vote is held in the yard, by show of hands, and counted twice. Whichever way it went, it was decided, and ${c.n} stop meeting the month after.`, fx: (s, c) => ({ morale: 3, fops: [{ id: c.fid, resolve: 'accord' }] }) },
      bad: { text: (s, c) => `The vote is held and lost, narrowly, and ${c.n} say it was rigged. They go on meeting, angrier than before.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: 15, accord: -10 }], do: s2 => mark(s2, 'settle:' + c.fid) }) } },
    { label: 'Disband them by order', note: 'They will stop meeting, and they will not forget it.', out: { text: (s, c) => `The order is posted. The table in the mess hall is moved. ${c.leadF ? c.leadF + ' does not argue, and does not speak to an officer for a month.' : 'Nobody argues, and for a month nobody from that table speaks to an officer.'}`, fx: (s, c) => ({ morale: -2, fops: [{ id: c.fid, resolve: 'destroyed' }], do: s2 => LF.emit(s2, 'resentment', 'x.question', 25, 250, `${c.n} were disbanded by order`) }) } },
  ] });
LF.TAGS['x.question'] = ['severe order', 'free', 'order severe'];

/* ======================= MORE EPISODES ======================= */
const E = st => LF.add(Object.assign({ arc: 'episode', view: 'people', x: true, w: 2, gap: 45, thread: null }, st));
const top = (s, ks) => ks.map(k => [k, LF.cv(s, k)]).sort((a, b) => b[1] - a[1])[0];

E({ id: 'ep.cure', tone: 'crisis', title: 'One in Three',
  when: s => !!s.threads && LF.cv(s, 'sickness') >= 55 && top(s, ['scarcity', 'strangers', 'resentment', 'schism', 'hunger'])[1] >= 35,
  setup: s => ({ k: top(s, ['scarcity', 'strangers', 'resentment', 'schism', 'hunger'])[0] }),
  text: (s, c) => `${Nwc(s, 'physician')} has something that works. ${cap1(LF.because(s, 'sickness'))}, and there is enough of the stuff for one in three of the people who need it.\n\nIt would be a hard choice in a good month, and this month ${LF.because(s, c.k)}. Everyone will know who got a dose and who did not.`,
  choices: [
    { label: 'Draw lots, with every name in one bowl', info: [['danger', 'Whoever draws a blank, crews included']], out: { text: `The bowl is a cooking pot and the lots are washers with numbers scratched on. An officer's child draws a blank, and the room sees it. So do two of the water crew, and the water rota runs short-handed for the rest of the year.`, fx: s => ({ pop: -2, morale: 1, mat: -15, do: s2 => LF.ease(s2, 'resentment', 'ep.cure', 15, 200) }) } },
    { label: 'Whoever is likeliest to live', test: { base: 50, mods: [R('physician', 10)] },
      ok: { text: s => `${Nc(s, 'physician')} chooses, alone, in an hour, and is right nearly every time.`, fx: { pop: -1 } },
      bad: { text: 'Some of the calls are wrong. The people who did not get a dose count the failures, by name.', fx: { pop: -3, morale: -2 } } },
    { label: 'Those the colony cannot run without', dark: true, note: 'The old, the children and the clerks are not on any such list.', info: [['yield', 'Every crew kept whole'], ['danger', 'Everyone not on the list']],
      out: { text: 'The list goes up on the mess hall door: the reactor crew, the water crew, the field hands in their prime. Everyone reads it for their own name. The ones who die of it are a child and an old man, and no shift is short a hand.', fx: s => ({ pop: -1, stain: ['cure_list', 2], do: s2 => LF.emit(s2, 'resentment', 'ep.cure', 40, 250, 'the cure went to the people the officers picked') }) } },
  ] });
LF.TAGS['ep.cure'] = ['free mercy', 'mercy cautious', 'severe order'];

E({ id: 'ep.dreams', tone: 'pressure', title: 'Nobody Dreams',
  when: s => !!s.threads && !s.threads.sleepdebt /* the Night Shift opens on the same discovery, under the same title */ && top(s, ['dark', 'confinement'])[1] >= 45 && top(s, ['unexplained', 'changed', 'fear'])[1] >= 30,
  setup: s => ({ a: top(s, ['dark', 'confinement'])[0], b: top(s, ['unexplained', 'changed', 'fear'])[0] }),
  text: (s, c) => `It started as a joke in the mess hall and stopped being one when people compared notes. Nobody has dreamed in nine days, though everyone sleeps and everyone wakes tired.\n\n${Nwc(s, 'physician')} can think of two ordinary reasons and gives them: ${LF.because(s, c.a)}, and ${LF.because(s, c.b)}.\n\n[[physician]] "Or I'm wrong about both, and I don't know what this is, and I've got people sitting in my clinic asking me why they can't dream and nothing to tell them."`,
  choices: [
    { label: 'Put the lamps on a clock, with a proper day and night', cost: { parts: 3 }, out: { text: 'Dawn is now a switch thrown at six. By the second week people are waking before it, and somebody dreams about a dog and tells the whole breakfast table.', fx: s => ({ morale: 2, do: s2 => { LF.ease(s2, 'dark', 'ep.dreams', 20, 150); LF.ease(s2, 'fear', 'ep.dreams', 15, 150); } }) } },
    { label: 'Run a sleep study on six wired volunteers', test: { base: 50, mods: [R('physician', 10), R('teacher', 5)] },
      ok: { text: 'The six traces are alike and dull: people under strain sleep shallow. It is written up in plain words and pinned to the mess hall door.', fx: s => ({ do: s2 => { LF.ease(s2, 'unexplained', 'ep.dreams', 25, 200); LF.ease(s2, 'fear', 'ep.dreams', 10, 200); } }) },
      bad: { text: 'The six traces are alike in a way the textbook has no picture of. The volunteers ask to see them and are shown.', fx: s => ({ do: s2 => LF.emit(s2, 'fear', 'ep.dreams', 30, 150, 'the sleep study found nothing ordinary') }) } },
    { label: 'Keep six from the lock-up awake until it shows itself', dark: true, note: 'Whatever is taking the dreams will show soonest in people who are not allowed to sleep at all.', info: [['yield', 'An answer'], ['danger', 'The six']],
      out: { text: s => `Six prisoners are kept on their feet under lamps, in shifts of the watch, for nine days. On the seventh one of them starts describing a place none of them has been, in detail, and the others agree with every word. ${Nc(s, 'physician')} has an answer. One of the six does not sleep again, and dies of it in the third week.`,
        fx: s => ({ pop: -1, stain: ['trial', 1], do: s2 => { LF.ease(s2, 'unexplained', 'ep.dreams', 35, 250); LF.ease(s2, 'fear', 'ep.dreams', 10, 200); } }) } },
  ] });
LF.TAGS['ep.dreams'] = ['cautious', 'cautious open', 'severe order'];

E({ id: 'ep.vigil', tone: 'quiet', title: 'The Lamp at the Wall',
  when: s => !!s.threads && LF.cv(s, 'grief') >= 35 && top(s, ['dark', 'scarcity', 'blackout', 'cold'])[1] >= 35,
  setup: s => ({ k: top(s, ['dark', 'scarcity', 'blackout', 'cold'])[0] }),
  text: (s, c) => `Somebody has put a lamp at the wall of names, and somebody else has kept it filled. There are people there every night now: ${LF.because(s, 'grief')}.\n\n[[quartermaster]] "That's fuel I can barely find, and you know why: ${LF.because(s, c.k)}. But if you say so I'll find it, and I won't grudge them a drop."`,
  choices: [
    { label: 'Keep the lamp lit and find the fuel', cost: { mat: 15 }, out: { text: 'It burns all night, every night. People who never knew the names on the wall have started to learn them.', fx: s => ({ morale: 3, do: s2 => LF.ease(s2, 'grief', 'ep.vigil', 20, 200) }) } },
    { label: 'Put it out; the living need the fuel', out: { text: 'It is put out by an officer, in daylight, so that nobody can say it was done on the sly. It is lit again that night by nobody anyone will name.', fx: s => ({ morale: -3, do: s2 => LF.emit(s2, 'resentment', 'ep.vigil', 25, 200, 'the lamp at the wall of names was put out') }) } },
  ] });
LF.TAGS['ep.vigil'] = ['mercy', 'severe order'];
})();
