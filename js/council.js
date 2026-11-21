/* Landfall — the council.
   The player no longer assigns crews or picks from a build list. A steward does the daily arithmetic, and the
   things that used to be menus arrive as decisions: when the build crews are free, two or three officers each
   argue for what should be built next, and say why, from the colony's actual condition.
   Also here: the plain-word "vibes" the settlement page shows instead of numbers, and the follow-up decisions
   that some outcomes demand at once. No DOM; runs under Node. */
(function () {
'use strict';
const { rand, clamp } = LF, H = LF.h;
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ---------- the steward: labour follows need, tilted by the year's focus ---------- */
const BASE = {
  even:     { farm: 4, maintain: 2, build: 2, extract: 2 },
  fields:   { farm: 5, maintain: 2, build: 2, extract: 1 },
  works:    { farm: 3, maintain: 3, build: 2, extract: 2 },
  frontier: { farm: 4, maintain: 2, build: 2, extract: 2 },
};
LF.FOCUS = { fields: 'the fields', works: 'the workshops and the ship', frontier: 'the country beyond the wire' };
LF.steward = function (s) {
  if (s.day % 3 !== 1 && s.day > 1) return;
  const j = Object.assign({}, BASE[s.focus] || BASE.even);
  const move = (from, to, n) => { n = Math.min(n === undefined ? 1 : n, j[from]); j[from] -= n; j[to] += n; };
  const fd = H.foodDays(s), net = LF.foodProd(s) - LF.foodCons(s);
  if (fd < 150 && net < 0 && j.farm < 5) move('extract', 'farm');
  if (fd < 60 && net < 0) { move('extract', 'farm', j.extract); while (j.farm < 6 && j.maintain > 2) move('maintain', 'farm'); }
  const live = Object.values(s.machines).filter(m => !m.lost);
  const minHp = live.length ? Math.min(...live.map(m => m.hp / Math.max(1, m.cap))) : 1;
  if (minHp < 0.75 && s.res.parts > 3 && j.maintain < 3) move('extract', 'maintain');
  if (s.res.parts < 4) move('maintain', 'build', j.maintain - 1);
  if (!s.project) move('build', 'extract', j.build - 1);
  s.jobs = j;
};

/* ---------- what the officers want built ---------- */
const hp = (s, id) => s.machines[id].lost ? 0 : s.machines[id].hp;
const wornWord = (s, id) => s.machines[id].lost ? 'is gone' : hp(s, id) < 35 ? 'is failing' : hp(s, id) < 60 ? 'is wearing out' : 'will not last for ever';
const unknown = s => s.factors.find(f => f.stage >= 1 && !f.res && !f.dormant && f.kind !== 'land' && f.insight < 20) || null;   // something out there nobody understands
const PITCH = {
  greenhouse: { by: 'botanist', yields: 'Better harvests', base: 90,
    say: s => s.flags.first_sow === 'all' ? 'Everything we\'ve got is in open ground. Put glass over some of it before the weather finds it.' : 'We could grow Earth crops under glass, where this soil can\'t get at them.',
    go: 'Hull glass is cut to size and the first ribs are standing by the end of the month.',
    done: s => 'Six domes of salvaged hull glass. Inside, the air is wet and smells of Earth. People find reasons to walk through.' },
  soillab: { by: 'botanist', yields: 'Answers about the soil', base: 85,
    say: s => s.flags.soil_clues ? 'The notebooks are full. Give me a bench and a microscope and they turn into answers.' : (LF.need ? LF.need(s) : 'soil') === 'soil' ? 'Nobody knows why the wheat sickens here, so every planting is a guess. I\'d like to stop guessing.' : 'Nobody\'s measured what this ground will grow and what it won\'t. Till somebody does, every planting is a guess.',
    go: 'A cargo pod is gutted and fitted with benches.',
    done: s => 'A cargo pod with benches, a centrifuge and a hand-lettered sign. Every sample the field crews bring in is logged on the wall.' },
  housing: { by: 'quartermaster', yields: 'Steadier morale', base: 45, need: s => (LF.harsh(s) ? 15 : 0) + (s.morale < 40 ? 20 : 0) + (s.pop > 95 ? 15 : 0),
    say: s => LF.harsh(s) ? 'The pods weren\'t built for this weather. Folk sleep in their work clothes.' : LF.heads(s) > 95 ? `${LF.num(LF.heads(s))} of us in pods meant for sixty.` : 'Folk need proper walls. They work easier once they\'ve got a door of their own.',
    go: 'The first street is pegged out with string, and argued over at once.',
    done: s => 'A street of doors, each a different colour because the paint ran short. Somebody has planted a seedling by one of the steps.' },
  wells: { by: 'engineer', yields: 'Water of your own', base: 75, need: s => s.machines.reclaimer.lost ? 45 : (100 - hp(s, 'reclaimer')) * 0.4,
    say: s => s.machines.reclaimer.lost ? 'The reclaimer\'s gone and I can\'t build another. We have to dig.' : `The reclaimer ${wornWord(s, 'reclaimer')}, and I'm not promising her another year. Dig while there's still something to drink.`,
    go: 'The first shaft is started where the survey party drove a stake.',
    done: s => 'The water comes up cold and tastes of stone. Nobody has drunk water that was not recycled in their adult lives.' },
  fields: { by: 'botanist', yields: 'Food without the ship', base: 82,
    say: s => 'The new wheat wants open ground, and plenty of it.',
    go: 'The ground is broken in long strips, by hand, with the whole colony out for the first day.',
    done: s => 'Open fields to the edge of the cleared ground, and a wheat that belongs here growing in them.' },
  smelter: { by: 'geologist', yields: 'Local metal', base: 70,
    say: s => 'The ore is mapped and it\'s sitting right there, and nearly everything we build after this needs metal, and a rock that turns into a lathe, I mean, come on, you want to see that.',
    go: 'Firebrick is cut from the hillside and the kiln floor is laid.',
    done: s => 'The first pour is a bar the length of a forearm, grey and pitted. It is passed from hand to hand until it is cold.' },
  machineshop: { by: 'engineer', yields: 'Parts, and repairs that hold', base: 55, need: s => s.machines.fabricator.lost ? 40 : (100 - hp(s, 'fabricator')) * 0.4,
    say: s => `The fabricator ${wornWord(s, 'fabricator')}, and she can't print herself a new one. A lathe can make another lathe, and a lathe I know how to keep running.`,
    go: 'The shop floor is poured, and the first lathe bed is cast in sand.',
    done: s => 'Lathes, a mill, a forge, belts running off one shaft. The noise carries to the far end of the camp.' },
  turbines: { by: 'engineer', yields: 'Power you can repair', base: 50, need: s => s.machines.reactor.lost ? 45 : (100 - hp(s, 'reactor')) * 0.4,
    say: s => `The reactor ${wornWord(s, 'reactor')}, and there's nothing down here that can mend her. A turbine I can mend with a hammer.`,
    go: 'The first mast goes up on the ridge, guyed with ship cable.',
    done: s => 'A line of masts along the ridge, blades turning. At night the lamps no longer flicker with the reactor.' },
  school: { by: 'teacher', yields: 'Skills passed on', base: 40, need: s => (s.machines.medbay.lost ? 30 : (100 - hp(s, 'medbay')) * 0.25) + (s.pop >= 90 ? 15 : 0),
    say: s => s.machines.medbay.lost ? 'The autodoc\'s gone. What it knew goes into somebody\'s hands, starting now.' : 'Everything we know sits in a few heads, and heads wear out. Get it into a room with slates.',
    go: 'A long room is roofed, with a clinic at one end and slates at the other.',
    done: s => 'A long room with a clinic at one end. On the first morning there are more adults on the benches than children.' },
  shelter: { by: 'security', yields: 'Protection from the season', base: 60,
    say: s => ({ flare: 'When the star flares again I want people under rock, because I won\'t be the one explaining to the families why they weren\'t.', winter: 'The Dim will come again, and I want us under the ground with our stores when it does, since stores are what people will be loyal to.', storm: 'The storm season\'s coming back, and this time I want walls, because a frightened crowd in a bad night is a worse problem than the weather.' })[s.world.climate],
    go: 'Digging starts on the sheltered side of the camp.',
    done: s => ({ flare: 'Vaults cut into the rock, lead-lined with ship plate. There is room for everyone, if they stand.', winter: 'Cellars deep enough that the frost does not reach them, shelved to the roof.', storm: 'A wall of fitted stone on the weather side, taller than a person, with the camp in its lee.' })[s.world.climate] },
  // Buildings that matter (WO-3, DESIGN.md "Buildings"). Each need rises when the thing it helps is pressing now.
  lab: { by: 'xenobio', yields: 'Answers, and assays', base: 22, need: s => (s.machines.medbay.up || s.machines.medbay.lost ? 22 : 0) + (unknown(s) ? 20 : 0) + (s.flags.lab_wanted ? 25 : 0),
    say: s => { const f = unknown(s); return s.machines.medbay.up ? 'The autodoc\'s still in orbit, so nobody down here can culture so much as a, no, look, I don\'t need it, I need benches and a hood and an incubator, give me those and I\'ll hand you a world.' : s.machines.medbay.lost ? 'No autodoc, no assay, every sample we take is sitting in a jar going off while I watch, and I can\'t stand it, give me a room with a cold box and I\'ll get you answers.' : f ? `${f.Name}. What is it? What does it eat? We don't know! Benches, a hood, a month, and I'll tell you.` : 'The soil lab\'s full of wheat, and I love the wheat, but there\'s a whole world out there that isn\'t wheat, and I want a room for every bit of it, there\'s so much of it.'; },
    go: 'A pod beside the soil laboratory is gutted to the frame, and the benches go in before the walls are lined.',
    done: s => 'Benches down both walls, a fume hood vented through the roof, an incubator humming in the corner and a cold room behind a quilted door. Somebody has already slept in it.' },
  comms: { by: 'pilot', yields: 'Orbit, and the parties, in reach', base: 18, need: s => Math.min(24, LF.inOrbit(s).length * 8) + (s.away.length ? 8 : 0) + (s.flags.qs_dark ? 25 : 0) + (s.flags.comms_wanted ? 20 : 0),
    say: s => { const n = LF.inOrbit(s).length; return s.flags.qs_dark ? 'She\'s dark. All we have is a lamp. A mast and the spare dish, and we call her every pass.' : n ? `${n === 1 ? 'One officer' : `${cap1(NUMW[n] || String(n))} officers`} still aboard, and orders go by the pass. A mast and a dish, and we hold the link all day.` : s.away.length ? 'The party\'s out past the wire and we can\'t reach it. A mast and a dish fix that.' : 'A mast. The lander\'s spare dish. A room with a chair in it. Then we stop guessing.'; },
    go: 'The mast goes up on the highest ground inside the wire, guyed to four stakes, and the lander\'s spare dish is bolted to the top.',
    done: s => 'A mast with the dish on it, and a room underneath with two chairs, a desk and a log. Somebody is in the chair at every pass, and most of the night between.' },
  cannery: { by: 'quartermaster', yields: 'More of every harvest kept', base: 20, need: s => (LF.toHarvest(s) <= 2 && (s.crop || 0) > 60 ? 20 : 0) + (H.foodDays(s) < 90 ? 10 : 0) + (s.world.climate === 'winter' ? 10 : 0) + (s.flags.can_wanted ? 25 : 0),
    say: s => LF.toHarvest(s) <= 2 && (s.crop || 0) > 60 ? 'Harvest\'s close, and last time a share went soft in the bins before we ate it. Jars and a cold room. That\'s all I\'m asking.' : s.world.climate === 'winter' ? 'The Dim comes back every year. What we grow has to keep till then. Jars, and a cold room in the bank.' : 'We grow it, then we lose some of it. Jars and a cold room would keep it.',
    go: 'Boilers are set up over the old stove pit, and a cold room is dug into the bank behind the stores.',
    done: s => 'Shelves of jars, a boiler that runs all day in season, and a cold room in the bank that holds its chill. The first batch is labelled by hand.' },
  watch: { by: 'security', yields: 'Eyes on the wire', base: 24, need: s => LF.wireThreat(s) * 0.5 + (s.flags.watch_wanted ? 25 : 0),
    say: s => { const f = s.factors.filter(x => x.stage >= 1 && !x.res && !x.dormant && x.accord < 40 && ['fauna', 'natives', 'humans', 'flora'].includes(x.kind)).sort((a, b) => b.threat - a.threat)[0];
      const night = ['hunter', 'feral'].some(id => s.threads && s.threads[id] && s.threads[id].on && s.threads[id].phase !== 'latent' && !s.threads[id].end);
      return night ? 'Something comes at night and the watch sees nothing, which is funny, when you\'re standing on the ground with a lamp, and I\'d like to be the one who gets to stop laughing. Give me towers.' : f && f.threat >= 40 ? `${f.Name} walk${(LF.KINDS[f.kind] || {}).mass ? 's' : ''} right up to the wire and we find out in the morning. Lovely. Towers, and a walk along the top.` : 'We watch the fence from the ground with a lamp, so we see as far as the lamp, and I\'ve never met a threat polite enough to stay inside it. Towers.'; },
    go: 'The first tower legs are cut from hull beams and stood up at the corner nearest the trouble.',
    done: s => 'Towers at the corners, a plank walk along the wire between them, and a bell on each. From up there the night watch can see the whole fence and a long way past it.' },
  hall: { by: 'teacher', yields: 'A floor under morale', base: 22, need: s => (s.morale < 40 ? 22 : 0) + (s.morale < 25 ? 15 : 0) + (s.flags.council || s.flags.committee ? 10 : 0) + (LF.heads(s) > 120 ? 10 : 0) + (s.flags.hall_wanted ? 25 : 0),
    say: s => s.morale < 40 ? 'Meetings in the mess: standing, mouths full, cooks shouting. Give them a room and a bench. They sit, they shout less.' : 'Every meeting\'s in the mess. Every meeting\'s a fight. One room. Benches. A stove. Done.',
    go: 'The hall is pegged out and the roof beams go up first, so the arguing can start under cover.',
    done: s => 'A long room with benches, a raised end and a stove in the middle. The first meeting runs until two in the morning.' },
  spares: { by: 'engineer', yields: 'Six spare parts', base: 30, need: s => s.res.parts < 6 ? 100 : s.res.parts < 12 ? 78 : 0,
    say: s => `The spares shelf is ${s.res.parts < 6 ? 'almost bare' : s.res.parts < 12 ? 'thin' : 'not what it was'}. Run the fabricator while she still runs, because I can't make a bearing out of good intentions.`,
    go: 'The fabricator is given the month, and everything else waits.',
    done: s => 'Six parts, still warm, each one checked twice and shelved.' },
  digester: { by: 'engineer', yields: 'The lander flies again', base: 10, need: s => (s.fuel || 0) <= 1 && (s.sleepers > 0 || LF.inOrbit(s).length || LF.aboard(s).length) ? 40 + (s.fuel ? 0 : 30) : -60,
    say: s => `${s.fuel ? 'One flight left in her' : 'She\'s dry'}. Two tanks and a still behind the pad, and food in at the top. About ${LF.flightFood(s)} a flight. I don't love it either.`,
    go: 'The digester is pegged out behind the lander pad, and the first tank is rolled over from the yard.',
    done: s => 'Two tanks, a still and a smell that never leaves, behind the lander pad. The first batch can go in whenever the stores can spare it.' },
};
LF.PITCH = PITCH;
const buildDays = (s, id) => LF.cost(s, id).labor / Math.max(0.4, 2 * (LF.hands(s) / 60) * LF.pressure(s).labor * (0.5 + 0.5 * LF.power(s)));
const span = d => d <= LF.MONTH * 1.4 ? 'About a month' : `About ${LF.monthsWord(d / LF.MONTH)}`;
LF.buildDays = buildDays; LF.buildSpan = span;
/* How hard the council argues for a build (T2-2: the Colony view's list goes in this order, and the bot's yard order
   picks the top of it). No dice: firePlan adds its own. */
LF.pitchScore = function (s, id) {
  const P = LF.PROJECTS[id], T = PITCH[id]; if (!T) return -99;
  const firstOpen = Object.keys(PITCH).some(k => !LF.PROJECTS[k].extra && !LF.PROJECTS[k].repeat && !LF.canStart(s, k));
  return T.base + (T.need ? T.need(s) : 0) + (s.passed[id] || 0) * 4 - (P.extra && firstOpen ? 40 : 0);
};
/* The build card is dealt as a month's card only until a first build is in hand (First Things, and again after
   "Build nothing yet"). After that it comes when a build finishes with nothing queued (the 'done' card) or when an
   outcome asks for it (then: 'plan'), and if the yard could not build anything just then, once it can (s.waited); the
   rest is the yard's orders on the Colony view (js/orders.js). */
LF.planDue = s => !s.project && s.day >= s.nextPlan && (!Object.keys(s.built).length || s.waited) && !(s.parked && Object.keys(s.parked).length) && !(s.bq && s.bq.length);

function sideCard(s, o) {
  s.cur = Object.assign({ gen: true, side: true, attach: [], fid: null, text: '', choices: [], phase: 'choose', result: null, view: 'colony' }, o);
  LF.notice(s, s.cur.text); if (s.cur.result) LF.notice(s, s.cur.result.text);
}
/* A build is finished: say so, and (on accepting it) ask what comes next. */
LF.fireDone = function (s) {
  const id = s.pend; s.pend = null; if (!id || !PITCH[id]) return;
  const P = LF.PROJECTS[id], chips = [];
  // The people cord needs the school AND a hundred colonists (LF.pillars): never say it is cut when the marker has not moved.
  if (P.pillar) chips.push(LF.pillars(s)[P.pillar] ? { t: `${LF.PILLARS[P.pillar].name} cord cut`, good: true } : { t: `${LF.PILLARS[P.pillar].name} cord: cut at ${LF.peopleNeed(s)} colonists (${LF.heads(s)} now)`, good: false });
  if (id === 'spares') chips.push({ t: LF.amount(s, 'parts', 6, s.res.parts - 6), good: true });
  s.lastBuilt = { id, d: s.day };
  sideCard(s, { id: 'done', build: id, title: LF.projName(s, id), tone: 'built', phase: 'result',
    result: { label: '', text: PITCH[id].done(s) + (s.project ? ` The crews go straight on to the ${LF.projName(s, s.project).toLowerCase()}.` : s.bq && s.bq.length ? ` The ${LF.projName(s, s.bq[0]).toLowerCase()} is next, once the yard holds its materials.` : ''), chips, remember: false, then: s.project || (s.bq && s.bq.length) ? null : 'plan' } });
  LF.log(s, `${LF.projName(s, id)}: finished.`, 'event');
  LF.holdForFlight(s);   // a shuttle run: who rides down and what is in the cradle are asked before the landing is told
};
/* The build crews are free. Up to three proposals, best case first; anything that cannot be started yet may
   still be shown, greyed, so the player can see what is being waited for. */
LF.firePlan = function (s) {
  const open = [], locked = [], firstOpen = Object.keys(PITCH).some(id => !LF.PROJECTS[id].extra && !LF.PROJECTS[id].repeat && !LF.canStart(s, id));
  for (const id in PITCH) {
    const P = LF.PROJECTS[id], pk = s.parked && s.parked[id]; let why = LF.canStart(s, id); if (why === 'Built') continue;
    if (pk && /materials/.test(why)) why = '';   // a parked build has its materials already
    if (id === 'spares' && s.res.parts >= 22 && !pk) continue;
    const score = PITCH[id].base + (PITCH[id].need ? PITCH[id].need(s) : 0) + (s.passed[id] || 0) * 4 + rand(s) * 14 - (P.extra && firstOpen ? 40 : 0)   // the founding builds that can start now are argued for first
      + (s.bq && s.bq[0] === id ? 500 : 0) + (pk ? 25 : 0);   // the queue's head first, then what was paused
    (why ? locked : open).push({ id, why, score: why ? score - (/materials/.test(why) ? 0 : 30) : score });
  }
  open.sort((a, b) => b.score - a.score); locked.sort((a, b) => b.score - a.score);
  // The buildings that matter (WO-3, PROJECTS extra) wait their turn: none is put to the council while a build the colony
  // needs more is waiting on the materials it would spend.
  const saving = locked.filter(o => /materials/.test(o.why) && !LF.PROJECTS[o.id].extra && !LF.PROJECTS[o.id].repeat);
  if (saving.length) { const keep = Math.min(...saving.map(o => LF.cost(s, o.id).mat));
    for (let i = open.length - 1; i >= 0; i--) { const o = open[i]; if (!LF.PROJECTS[o.id].extra || (s.parked && s.parked[o.id]) || s.res.mat - LF.cost(s, o.id).mat >= keep) continue;
      open.splice(i, 1); locked.push({ id: o.id, why: `The yard is saving for the ${LF.projName(s, saving[0].id)}`, score: o.score - 30 }); }
    locked.sort((a, b) => b.score - a.score); }
  const real = open.filter(o => !LF.PROJECTS[o.id].repeat).length + locked.length;
  if (!real && !open.length) { s.nextPlan = s.day + 60; return false; }           // everything is built
  // Nothing worth asking about: the crews go on salvage until the yard can build something.
  if (!open.length || (open.every(o => LF.PROJECTS[o.id].repeat) && s.res.parts >= 10)) { s.nextPlan = s.day + 8; s.waited = true; return false; }
  const waited = s.waited; s.waited = false;
  const pick = open.slice(0, 3).concat(locked.slice(0, Math.max(0, 3 - open.length)).slice(0, open.length ? 1 : 2));
  const choices = pick.map((o, n) => { const P = LF.PROJECTS[o.id], T = PITCH[o.id], pk = s.parked && s.parked[o.id], c = pk ? { mat: 0 } : LF.cost(s, o.id), who = H.P(s, T.by), asked = s.passed[o.id] || 0;
    const info = [['time', span(buildDays(s, o.id) * (pk ? Math.max(0.05, 1 - pk.progress / LF.cost(s, o.id).labor) : 1))], ['yield', T.yields]]; if (P.pillar) info.push(['cord', P.pillar === 'people' && LF.heads(s) < LF.PEOPLE_CORD ? `Half the people cord: it is cut at ${LF.PEOPLE_CORD} colonists` : `Cuts the ${LF.PILLARS[P.pillar].name.toLowerCase()} cord`]);
    return { ap: null, v: [], label: pk ? `Resume the ${LF.projName(s, o.id)}` : LF.projName(s, o.id), hint: P.pillar ? 'good' : 'unknown', lock: o.why ? o.why : '', cost: c.mat ? { mat: c.mat } : null, info, proj: o.id, rank: n,
      note: `${who ? who.name : cap1(LF.seatWord(s, T.by))}: "${T.say(s)}"${asked >= 2 ? ' Asked for ' + (asked === 2 ? 'twice' : 'three times and more') + ' already.' : asked === 1 ? ' Asked for once before.' : ''}`,
      out: { text: pk ? `The crews go back to the ${LF.projName(s, o.id).toLowerCase()} where they left it.` : T.go, fx: { start: o.id } } }; });
  // Always on offer (Lachlan, 2026-11-15): the crews can be put on salvage instead, so a thin yard is never forced into spares.
  choices.push({ ap: null, v: [], label: 'Build nothing yet. Put the crews on salvage', hint: 'unknown', lock: '', cost: null, info: [['time', 'Two months'], ['yield', 'Materials']], proj: null, rank: 9,
    note: 'Two months of the build crews filling the yard. Nothing goes up, and whatever is wearing out goes on wearing.', out: { text: 'The build crews go out with the salvage sledges instead. The yard begins to fill.', fx: { plan: 20, mat: 14 } } });
  const first = !Object.keys(s.built).length && !s.memo._plan;
  sideCard(s, { id: 'plan', plan: true, title: first ? 'First Things' : 'What Gets Built', tone: 'council',
    text: (first ? `The pods are down and the reactor is running. The build crews are standing in the yard with their tools, waiting to be told where to start.`
      : s.lastBuilt && s.day - s.lastBuilt.d < 3 ? `The build crews are free again, and the officers have been waiting for it.` : waited ? `The salvage sledges have filled the yard far enough to build again.` : `The build crews have nothing in hand, and every officer has an opinion about that.`),
    ask: first ? 'What do the build crews put up first, or do they spend the time on salvage?' : 'What goes up next, or do the crews go out on salvage instead?',
    choices });
  s.memo._plan = { d: s.day };
  return true;
};
/* Called by chooseGen for council cards: remember what was asked for and passed over. */
LF.planChosen = function (s, cur, i) {
  for (const [n, ch] of cur.choices.entries()) if (ch.proj) { if (n === i) delete s.passed[ch.proj]; else if (!ch.lock) s.passed[ch.proj] = (s.passed[ch.proj] || 0) + 1; }
  if (!cur.choices[i].proj && !cur.choices[i].out.fx.plan) s.nextPlan = s.day + 20;
};

/* ---------- vibes: how things are going, in words ---------- */
LF.vibes = function (s) {
  const fd = H.foodDays(s), net = LF.foodProd(s) - LF.foodCons(s), out = [];
  const tr = net > 2 ? ', and growing' : net < -2 ? ', and falling' : '';
  out.push(fd > 180 ? { k: 'food', w: 'Plenty', lv: 3, t: 'The stores are full' + tr + '.' } : fd > 75 ? { k: 'food', w: 'Enough', lv: 2, t: 'Enough food to see the season out' + tr + '.' }
    : fd > 35 ? { k: 'food', w: 'Thin', lv: 1, t: 'The stores are thin' + tr + '.' } : s.res.food > 0 ? { k: 'food', w: 'Hungry', lv: 0, t: 'There is less than a season of food left.' } : { k: 'food', w: 'Starving', lv: 0, t: 'There is no food. People are dying of it.' });
  const m = s.morale;
  out.push(m >= 68 ? { k: 'morale', w: 'High', lv: 3, t: 'People are in good heart.' } : m >= 48 ? { k: 'morale', w: 'Steady', lv: 2, t: 'Morale is steady.' } : m >= 30 ? { k: 'morale', w: 'Uneasy', lv: 1, t: 'People are uneasy, and saying so.' }
    : m >= 15 ? { k: 'morale', w: 'Bitter', lv: 0, t: 'The mood is bitter.' } : { k: 'morale', w: 'Breaking', lv: 0, t: 'The colony is close to turning on you.' });
  const ids = Object.keys(s.machines), lost = ids.filter(id => s.machines[id].lost), live = ids.filter(id => !s.machines[id].lost).sort((a, b) => hp(s, a) - hp(s, b)), worst = live[0];
  const wn = worst && LF.MACHINES[worst].name;
  out.push(!worst ? { k: 'machines', w: 'Gone', lv: 0, t: 'Nothing the ship brought still runs.' } : hp(s, worst) < 30 ? { k: 'machines', w: 'Failing', lv: 0, t: `The ${wn} is failing.` }
    : hp(s, worst) < 55 ? { k: 'machines', w: 'Worn', lv: 1, t: `The ${wn} is wearing out.` } : lost.length ? { k: 'machines', w: 'Fewer', lv: 1, t: `The machines that are left are holding.` } : { k: 'machines', w: 'Holding', lv: 2, t: 'The ship\'s machines are holding.' });
  const mt = s.res.mat, pt = s.res.parts;
  out.push(mt >= 110 && pt >= 12 ? { k: 'mat', w: 'Stocked', lv: 3, t: 'The yard is well stocked.' } : mt >= 50 && pt >= 6 ? { k: 'mat', w: 'Enough', lv: 2, t: 'There is enough in the yard to build with.' }
    : pt < 6 ? { k: 'mat', w: 'No spares', lv: 0, t: 'The spares shelf is almost bare.' } : { k: 'mat', w: 'Short', lv: 1, t: 'The yard is short of materials.' });
  const fs = s.factors.filter(f => f.stage >= 2 && !f.res && f.kind !== 'land' && f.accord < 40).sort((a, b) => b.threat - a.threat), f = fs[0];
  out.push(!f || f.threat < 30 ? { k: 'danger', w: 'Quiet', lv: 3, t: s.factors.some(x => x.stage >= 1 && x.kind !== 'land') ? 'It is quiet beyond the wire.' : 'Nothing out there has shown itself yet.' }
    : f.threat < 50 ? { k: 'danger', w: 'Watchful', lv: 2, t: `${f.Name} ${plural(f) ? 'are' : 'is'} never far away.` } : f.threat < 70 ? { k: 'danger', w: 'Pressing', lv: 1, t: `${f.Name} ${plural(f) ? 'are' : 'is'} pressing on the colony.` }
    : { k: 'danger', w: 'At the wire', lv: 0, t: `${f.Name} ${plural(f) ? 'are' : 'is'} at the wire.` });
  return out;
};
/* What a card turns on. A decision that spends, risks or yields food, materials, spares, hands or a machine shows
   how much of it the colony holds (food as a count and months of eating, materials and spares as counts) and how that sits against the ask. */
const fxOf = (s, o) => { if (!o) return null; let fx = o.fx; if (typeof fx === 'function') { try { fx = fx(s, s.cur.ctx); } catch (e) { fx = null; } } return fx; };
LF.relevant = function (s) {
  if (!s.cur) return [];
  const opts = LF.choices(s), want = {}, need = {}, mach = {};
  const see = fx => { if (!fx) return; for (const k of ['food', 'mat', 'parts']) if (fx[k]) want[k] = 1;
    if (fx.machine) for (const id in fx.machine) mach[id] = 1; if (fx.pop < 0 || fx.away) want.hands = 1; };
  for (const o of opts) { const c = o.cost || o.ch.cost; if (c) for (const k in c) { want[k] = 1; need[k] = Math.max(need[k] || 0, c[k]); }
    if (o.send) want.hands = 1; for (const k of ['out', 'ok', 'bad']) see(fxOf(s, o.ch[k])); }
  if (s.cur.plan) for (const o of opts) if (o.ch.proj && LF.PITCH[o.ch.proj]) { const m = { wells: 'reclaimer', machineshop: 'fabricator', turbines: 'reactor', school: 'medbay', digester: 'lander', spares: 'fabricator' }[o.ch.proj]; if (m) mach[m] = 1; if (o.ch.proj === 'spares') want.parts = 1; if (o.ch.proj === 'digester') want.food = 1; }
  const out = [], fd = H.foodDays(s), net = LF.foodProd(s) - LF.foodCons(s);
  // Before landfall the stores are not being eaten by a colony: they are what the lander will have to carry down.
  if (want.food && LF.aloft && LF.aloft(s)) { const f = s.res.food; out.push({ k: 'food', w: `Landing stores: ${f >= 3900 ? 'close to full' : f >= 3300 ? 'most still aboard' : 'well down'}`, lv: f >= 3900 ? 2 : f >= 3300 ? 1 : 0 }); }
  else if (want.food) { const v = LF.vibes(s)[0];
    const m = fd / LF.MONTH, how = m < 1 ? 'under a month of eating' : `about ${LF.monthsWord(m)} of eating`;
    out.push({ k: 'food', w: `Food: ${Math.round(s.res.food).toLocaleString('en')}, ${how}${net < -2 ? ', falling' : net > 2 ? ', rising' : ''}`, lv: v.lv }); }
  if (want.mat) { const m = s.res.mat, n = need.mat || 0;
    out.push({ k: 'mat', w: `Materials: ${Math.round(m)}, ` + (n ? (m >= n * 2 ? 'plenty for this' : m >= n ? 'enough, just' : 'not enough') : (m >= 110 ? 'well stocked' : m >= 50 ? 'enough to build with' : 'short')), lv: n && m < n ? 0 : m >= 50 ? 2 : 1 }); }
  if (want.parts) { const p = s.res.parts; out.push({ k: 'parts', w: `Spares: ${Math.round(p)}, ${p >= 20 ? 'a full shelf' : p >= 12 ? 'a fair few' : p >= 6 ? 'thin' : p >= 1 ? 'almost none' : 'none'}`, lv: p >= 12 ? 2 : p >= 6 ? 1 : 0 }); }
  if (want.hands) { const h = LF.hands(s), spare = h - 18, away = s.away.reduce((a, x) => a + x.n, 0);
    out.push({ k: 'people', w: `Hands: ${spare >= 40 ? 'plenty to spare' : spare >= 15 ? 'some to spare' : spare > 0 ? 'few to spare' : 'none to spare'}${away ? ', with some already away' : ''}`, lv: spare >= 15 ? 2 : spare > 0 ? 1 : 0 }); }
  for (const id in mach) { const m = s.machines[id]; if (!m) continue; const w = LF.machineWord(s, id); if (s.cur.plan && w === 'Good') continue;
    out.push({ k: 'machines', w: `${LF.MACHINES[id].name}: ${w.toLowerCase()}`, lv: m.lost || w === 'Failing' ? 0 : w === 'Worn' ? 1 : 2 }); }
  return out;
};
/* Does this card concern the ship's machines? Then the Colony view shows their table. */
LF.aboutMachines = s => !!s.cur && (s.cur.plan || LF.byId[s.cur.id] && LF.byId[s.cur.id].arc === 'machines' || LF.relevant(s).some(g => g.k === 'machines' || g.k === 'parts'));
const plural = f => !(LF.KINDS[f.kind] || {}).mass && f.kind !== 'faction';
/* One paragraph for the settlement page: the two things most worth saying, worst first. */
LF.mood = function (s) {
  const v = LF.vibes(s).slice().sort((a, b) => a.lv - b.lv), bad = v.filter(x => x.lv <= 1), out = [];
  if (!bad.length) out.push(v[v.length - 1].t, v[v.length - 2].t); else { out.push(bad[0].t); out.push((bad[1] || v[v.length - 1]).t); }
  if (s.project) out.push(`The ${LF.projName(s, s.project).toLowerCase()} ${LF.projName(s, s.project).endsWith('s') ? 'are' : 'is'} ${s.progress / LF.cost(s, s.project).labor > 0.6 ? 'nearly finished' : 'going up'}.`);
  if (s.away.length) { const n = s.away.reduce((a, x) => a + x.n, 0); out.push(s.away.some(a => a.silent) ? 'A party is overdue.' : `${cap1(String(n))} ${n === 1 ? 'is' : 'are'} away beyond the wire.`); }
  return out.join(' ');
};
/* ---------- the stock bar (Colony and World views) ----------
   The numbers, against the start of the last month, and what each one is: where it comes from now and where it goes.
   Rates are a month (LF.MONTH ticks) at today's crews and weather. */
LF.stockBar = function (s) {
  const was = s.hud || LF.stocks(s), now = LF.stocks(s);
  return [['pop', 'Colonists'], ['food', 'Food'], ['mat', 'Materials'], ['parts', 'Spares']].map(([k, name]) => ({ k, name, v: now[k], d: now[k] - was[k] }));
};
LF.stockNote = function (s, k) {
  const M = LF.MONTH, r = v => Math.max(0, Math.round(v * M)), mo = LF.toHarvest(s);
  if (k === 'pop') { const away = s.away.reduce((a, x) => a + x.n, 0);
    const kids = LF.kidCount(s);
    return `Everyone alive on the ground${kids ? `: ${LF.num(s.pop)} grown and ${LF.num(kids)} children born here, who eat less than half a ration and do not work until they are ${LF.ageWord}` : ''}${away ? `${kids ? '.' : ','} ${away} ${kids ? 'are' : 'of them'} away beyond the wire` : ''}.${s.sleepers ? ` ${s.sleepers} more sleep in orbit, and only the lander can bring them down.` : ''} Births add to it, and there are more of them when morale is high and the store is full; deaths, desertion and some decisions take away.`; }
  if (k === 'food') { const hy = r(LF.hydroProd(s)), eat = r(LF.foodCons(s)), crop = Math.round(s.crop || 0), grow = r(LF.foodProd(s) - LF.hydroProd(s));
    return `The store. Coming in: the hydroponics bay, about ${hy} a month, and the fields, about ${grow} a month this season, which stands in the ground until the harvest (${crop} so far, cut ${mo === 1 ? 'at the end of this month' : `in ${LF.monthsWord(mo)}`} and brought in with the harvest card)${s.reap ? `, and ${Math.round(s.reap)} on the threshing floor now` : ''}. Going out: the colony eats about ${eat} a month.`; }
  if (k === 'mat') { const src = LF.matSource(s), v = r(LF.matIn(s)), w = Math.round(s.wreck || 0);
    const how = src === 'ore' ? `The smelter turns ore from the body into metal: about ${v} a month.`
      : src === 'wreck' ? `Plate and metal for building. The salvage crews cut it from the cargo pods and the lander's fairings, about ${v} a month, and about ${w} is left in the wreck. Find the ore and build a smelter to make your own.`
      : `The wreck is stripped. The crews pick the country over for scrap and stone, about ${v} a month. ${s.flags.ore_found ? 'A smelter on the ore body would give about five times that.' : 'Find the ore and build a smelter to make more.'}`;
    return `${how} Going out: every build takes its materials when it starts${s.project ? `, and the ${LF.projName(s, s.project).toLowerCase()} already has its share` : ''}; some decisions spend them too.`; }
  if (k === 'parts') return `Spare parts for the ship's machines. The maintenance crews use them as fast as the machines wear. ${s.built.machineshop ? 'The machine shop can make more as a build.' : LF.down(s, 'fabricator') ? 'Only the fabricator can print more, as a build, while it lasts.' : 'With the fabricator gone and no machine shop, nothing makes more.'}`;
  return '';
};
LF.machineWord = (s, id) => { const m = s.machines[id]; return m.lost ? 'Lost' : m.hp < 30 ? 'Failing' : m.hp < 55 ? 'Worn' : m.hp < 78 ? 'Sound' : 'Good'; };

/* ---------- recaps: the colony takes stock ----------
   Once a year, at the turn of it (twelve monthly cards), the game stops on a recap card. It replaces the journal: the
   story so far, the threads still open, what is coming, who is out and when they are due, and how the colony
   stands, in the same words as everywhere else. Prose, not a list. Pure: reads state, writes nothing but s.recap. */
LF.recapDue = function (s) {
  const r = s.recap; if (!r) return false;
  return LF.date(s.day).year > (r.y || 1);
};
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const nw = n => NUMW[n] || String(n);
const inTime = d => d <= LF.MONTH ? 'by the end of the month' : `in about ${LF.monthsWord(d / LF.MONTH)}`;
const isAre = f => plural(f) ? 'are' : 'is';
LF.recap = function (s) {
  const r = s.recap, out = [], d = LF.date(s.day), first = !r.d || r.d < 60;
  // the story so far: what the chronicle recorded since the last time
  let since = s.chron.filter(e => e.d > (r.d || 0) && e.d <= s.day).map(e => e.t);
  // What the colony came to call itself changes often in a year; the recap says it once (Lachlan, 2026-11-16).
  const KNOWN = /^The colony came to be known, to itself, as (.+)\.$/, names = [];
  since = since.filter(t => { const m = KNOWN.exec(t); if (!m) return true; const k = names.indexOf(m[1]); if (k >= 0) names.splice(k, 1); names.push(m[1]); return false; });
  if (names.length) since = since.slice(-3).concat([`The colony came to think of itself as ${names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]}.`]);
  const opener = first ? `A year on ${s.world.planet}.` : since.length ? 'Since the colony last took stock:' : 'Since the colony last took stock, nothing has happened that anyone will write down.';
  out.push([opener].concat(since.slice(-4)).join(' '));
  // threads still open
  const open = s.factors.filter(f => f.stage >= 1 && !f.res && f.kind !== 'land').sort((a, b) => b.threat - a.threat);
  if (open.length) {
    const say = f => f.kind === 'faction' ? `${f.name} ${isAre(f)} still organising inside the wire` : f.kind === 'plague' ? `${f.name} ${isAre(f)} still in the colony`
      : f.accord >= 40 ? `${f.name} ${isAre(f)} on good terms` : f.threat >= 60 ? `${f.name} ${isAre(f)} pressing hard` : f.threat >= 35 ? `${f.name} ${isAre(f)} never far away` : `${f.name} ${isAre(f)} out there, and quiet`;
    const ls = open.slice(0, 3).map(say);
    out.push(`Still unsettled: ${ls.length > 1 ? ls.slice(0, -1).join('; ') + '; and ' + ls[ls.length - 1] : ls[0]}.${open.length > 3 ? ` There ${open.length - 3 === 1 ? 'is one more thread' : `are ${nw(open.length - 3)} more threads`} nobody has had time for.` : ''}`);
  } else out.push('Nothing out there has a hold on the colony yet.');
  // what is coming
  const ahead = [], fd = H.foodDays(s), net = LF.foodProd(s) - LF.foodCons(s);
  if (s.flags.climate_known || s.day > 150) { const q = d.season, c = s.world.climate;
    if (c === 'winter' && q >= 1 && q <= 2) ahead.push('the long Dim is coming, and the fields will give nothing through it');
    else if (c === 'storm' && q <= 1) ahead.push('the storm season will be back with the Seedfall');
    else if (c === 'flare' && q === 1) ahead.push('the star is due to flare again in the bright months'); }
  if (fd < 75 && net < 0) ahead.push(`the stores are falling and will not last ${fd < 35 ? 'the month' : 'the season'}`);
  const worn = Object.keys(s.machines).filter(id => !s.machines[id].lost && s.machines[id].hp < 40).map(id => `the ${LF.MACHINES[id].name}${s.machines[id].up ? ', still aboard the ship,' : ''}`);
  if (worn.length) ahead.push(`${worn.join(' and ')} ${worn.length > 1 ? 'are' : 'is'} close to failing`);
  const hot = open.find(f => f.threat >= 65 && f.kind !== 'faction'); if (hot) ahead.push(`${hot.name} will not wait much longer`);
  if (s.morale < 24) ahead.push('people are near the end of their patience with the officers');
  out.push(ahead.length ? `What is coming: ${ahead.slice(0, 3).join('; ')}.` : 'Nothing anyone can see is coming for the colony this season.');
  // who is out
  if (s.away.length) out.push(s.away.map(a => a.silent ? `The party of ${nw(a.n)} sent to ${a.to} is overdue, and the lamp is still lit for them.`
    : `${cap1(nw(a.n))} ${a.n === 1 ? 'is' : 'are'} out at ${a.to}${a.lead && H.byPid(s, a.lead) ? `, under ${H.byPid(s, a.lead).name},` : ''} and due back ${inTime(a.due - s.day)}.`).join(' '));
  // where the colony stands
  const v = LF.vibes(s), pil = LF.pillars(s), cut = Object.values(pil).filter(Boolean).length;
  out.push(`${v[0].t} ${v[1].t} ${v[2].t} ${LF.num(LF.heads(s))} people live here${s.sleepers ? `, and ${s.sleepers} still sleep in orbit` : ''}.${(nb => nb ? ` ${nb === 1 ? 'One child was' : cap1(nb < NUMW.length ? nw(nb) : LF.num(nb)) + ' children were'} born this year.` : LF.cradlesEmpty(s) ? ' No child was born this year.' : '')(LF.genYear(s, true))} ${cut === 5 ? 'Every cord is cut.' : cut ? `${cap1(nw(cut))} of the five cords ${cut === 1 ? 'is' : 'are'} cut.` : 'No cord is cut yet.'}`);
  return out.join('\n\n');
};
LF.fireRecap = function (s) {
  const d = LF.date(s.day), r = s.recap, text = LF.recap(s);
  // this year's decisions, so the UI can ask how other colonies answered the same cards (LFLog.year)
  // the first recap also takes the crossing and the descent, which used to be compared on the landing card (Lachlan, 2026-11-20)
  const year = (s.ylog || []).filter(e => (!r.d || e.d > r.d) && e.cid && !e.order).map(e => ({ cid: e.cid, oid: e.oid, ck: e.ck, ok: e.ok, t: e.t, l: e.l, sent: e.sent, died: e.died }));
  s.cur = { gen: true, side: true, attach: [], fid: null, id: 'recap', view: 'people', title: `The End of Year ${d.year - 1}`, year,
    tone: 'taking stock', text: '', choices: [], phase: 'result', result: { label: '', text, chips: [], remember: false } };
  s.recap = { n: 0, d: s.day, major: false, y: d.year }; LF.genYear(s);
};

/* ---------- aftermath: some outcomes want an answer before anyone goes back to work ---------- */
// Frame-specific aftermaths: what a success of one approach against one kind of thing leaves behind.
const AFT_KIND = { fauna: ['force', 'aft.carcass'], flora: ['study', 'aft.cutting'], ruin: ['exploit', 'aft.warm'], natives: ['force', 'aft.captive'], humans: ['force', 'aft.captive'] };
LF.aftermath = function (s) {
  const L = s.last; if (!L || s.day < 30 || s.day - (s.flags.aft_day || -999) < 55) return null;
  const f = L.fid && s.factors.find(x => x.id === L.fid);
  let id = null;
  if (L.ok === false && L.dead) id = rand(s) < 0.55 ? 'aft.blame' : null;
  else if (L.ok === false && !L.dead && LF.down(s, 'medbay') && rand(s) < 0.25) id = 'aft.beds';
  else if (L.ok === true && f && LF.KINDS[f.kind] && rand(s) < (f.kind === 'flora' ? 0.85 : 0.5) && AFT_KIND[f.kind] && (AFT_KIND[f.kind][0] === L.ap || (f.kind === 'flora' && L.ap === 'exploit'))) id = AFT_KIND[f.kind][1];   // flora: studied less often since the threads took more of the months
  else if (L.ok === true && f && !f.res && LF.KINDS[f.kind]) {
    if (L.ap === 'force' && f.threat > 30) id = rand(s) < 0.8 ? 'aft.press' : null;
    else if (L.ap === 'accord' && f.kind !== 'plague' && f.kind !== 'ruin') id = rand(s) < 0.45 ? 'aft.gift' : null;
    else if (L.ap === 'study') id = rand(s) < 0.35 ? 'aft.find' : null;
  }
  if (id) s.flags.aft_day = s.day;
  return id;
};
})();
