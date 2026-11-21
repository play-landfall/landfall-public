/* Landfall — the generator.
   Hand-written FRAMES (frames.js) are situations with slots. This file fills the slots from the world's
   factors, the colony's current assets and people, and the LEDGER of what the player has already done,
   then renders the result to plain data so it can be saved.
   Three kinds of memory feed every generated dilemma:
     factor memory  — what you have done to this particular thing, and how it has adapted
     colony memory  — the doctrines your choices have hardened into (and the factions born against them)
     personal memory — marks on named colonists: maimed, bereaved, grudge-bearing, indebted */
(function () {
'use strict';
const { ri, pick, rand, clamp } = LF, H = LF.h;
const FR = LF.frames = [];
LF.frame = (kind, stage, o) => { FR.push(Object.assign({ kind, stage }, o)); };
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
const SEV = [0.8, 1.15, 1.6];

/* ---------- values & doctrine ---------- */
const TAG = { mercy: ['mercy', 1], severe: ['mercy', -1], bold: ['bold', 1], cautious: ['bold', -1], open: ['open', 1], closed: ['open', -1], free: ['free', 1], order: ['free', -1] };
const DOC = { mercy: ['Merciful', 'Severe'], bold: ['Bold', 'Cautious'], open: ['Open', 'Closed'], free: ['Free', 'Ordered'] };
LF.DOC = DOC;
LF.doctrine = (s, axis) => s.val[axis] >= 3 ? DOC[axis][0] : s.val[axis] <= -3 ? DOC[axis][1] : null;
const AP_TAGS = { force: 'bold closed', study: 'cautious open', accord: 'open mercy', exploit: 'bold', avoid: 'cautious closed' };
function align(s, tags) { // how a choice sits against the colony's established character
  let fit = null, against = null;
  for (const t of tags) { const [ax, dir] = TAG[t], d = LF.doctrine(s, ax); if (!d) continue; (Math.sign(s.val[ax]) === dir ? (fit = fit || d) : (against = against || d)); }
  return { fit, against };
}
LF.shiftValues = function (s, tags) {
  for (const t of tags) { const [ax, dir] = TAG[t]; const was = LF.doctrine(s, ax); s.val[ax] = clamp(s.val[ax] + dir, -6, 6); const now = LF.doctrine(s, ax);
    if (now && now !== was) { LF.log(s, `After enough choices like this one, people think of this as ${LF.an(now.toLowerCase())} colony, and they expect you to act like one.`); LF.chron(s, `The colony came to be known, to itself, as ${now.toLowerCase()}.`); } }
};

/* ---------- ledger ---------- */
LF.record = function (s, e) { e.d = s.day; s.ledger.push(e); if (s.ledger.length > 300) s.ledger.shift(); };
const ago = (s, d) => { const n = s.day - d; return n < 30 ? 'A month or two ago' : n < 130 ? 'A season back' : n < 260 ? 'Half a year back' : n < 500 ? 'Years ago now' : 'Long ago, by the colony\'s reckoning,'; };
const TIMES = ['', '', 'Twice', 'Three times', 'Four times', 'Again and again'];
const HABIT = { force: 'answered with force', study: 'chosen to watch and learn', accord: 'held out a hand', exploit: 'taken what could be used', avoid: 'stepped back' };
const PAST = {
  fauna:   { force: ['you put rifles on {n}', 'The survivors have learned what a rifle is.'], study: ['you set cameras on {n} instead of snares', 'You know their habits now, and they have probably learned some of yours.'], accord: ['you left food out for {n}', 'They come closer than they used to.'], exploit: ['you hunted {n} for the pot', 'There are fewer of them, and the ones left are the careful ones.'], avoid: ['you pulled the fence line back from {n}', 'They took the ground you gave up and have been seen at the new fence.'] },
  flora:   { force: ['you burned {n} back', 'It has grown back from the roots, lower and tougher than before.'], study: ['you sampled {n} and left it standing', 'The notebooks on it run to three volumes.'], accord: ['you gave {n} room to grow', 'It has kept, more or less, to the room it was given.'], exploit: ['you harvested {n}', 'It grows back fastest where it was cut.'], avoid: ['you moved the work away from {n}', 'It has spread toward the new work sites, where the ground is warm.'] },
  plague:  { force: ['you fought {n} with tape and fire', 'People remember who was behind the tape, and who drew it.'], study: ['you let {n} run long enough to study it', 'People died while you gathered the data, and their families know how many.'], accord: ['you nursed the sick of {n} in open wards', 'Nobody has properly thanked the nurses who stayed.'], exploit: ['you tested cures for {n} on the willing', 'Some of the willing are on the wall.'], avoid: ['you sealed the doors against {n}', 'The ones left outside the doors were heard for some time.'] },
  ruin:    { force: ['you set charges at {n}', 'It repaired itself where nobody was watching.'], study: ['you sent instruments, not people, into {n}', 'It has been measured to the millimetre, and nobody knows any more about what it is for.'], accord: ['you left {n} undisturbed, and said so aloud', 'As far as anyone can tell, it has not changed since.'], exploit: ['you carried what you could out of {n}', 'There are gaps on its shelves now, and it has not stopped counting them.'], avoid: ['you fenced {n} off', 'The fence has a path worn along it, on the inside.'] },
  natives: { force: ['you met {n} with rifles', 'They have not forgotten, and they will teach their children to remember.'], study: ['you watched {n} from a distance', 'They watched you back, and made no secret of it.'], accord: ['you sat down with {n}', 'They remember what was promised, word for word.'], exploit: ['you traded {n} trinkets for things they did not know the worth of', 'They have since found out what those things were worth.'], avoid: ['you kept your people away from {n}', 'They took your staying away as a refusal.'] },
  humans:  { force: ['you turned guns on {n}', 'They are human, and they hold a grudge as well as you would.'], study: ['you had {n} watched', 'They caught one of the watchers and sent the watcher home with a message.'], accord: ['you broke bread with {n}', 'They have been counting on it since.'], exploit: ['you drove a hard bargain with {n}', 'They signed, and they remember how hard you pushed.'], avoid: ['you shut the gate on {n}', 'They noted which side of it they were left on.'] },
  faction: { force: ['you broke up {n}', 'They meet in smaller rooms now.'], study: ['you had {n} watched', 'They know they are watched, and they have started saying things for your benefit.'], accord: ['you gave {n} a hearing', 'They took it as the start of talks, and they expect more.'], exploit: ['you played {n} against their rivals', 'They know they were used.'], avoid: ['you ignored {n}', 'More people go to their meetings now.'] },
};
LF.PAST = PAST;   // the Crew view says what last moved a group (orders.js LF.groupWhy)
function callback(s, f, x) {
  const out = [], mine = s.ledger.filter(e => e.fid === f.id);
  if (mine.length) {
    const e = mine[mine.length - 1], n = mine.filter(m => m.ap === e.ap).length, P = (PAST[f.kind] || {})[e.ap];
    if (P && e.ap) {
      if (n >= 2) out.push(`${TIMES[Math.min(n, 5)]} now you have ${HABIT[e.ap]} where ${f.name} ${f.kind === 'fauna' || f.kind === 'natives' || f.kind === 'humans' ? 'are' : 'is'} concerned. ${P[1]}`);
      else out.push(`${ago(s, e.d)} ${P[0].replace('{n}', f.name)}${e.ok === false ? ', and it went badly' : ''}. ${P[1]}`);
    }
    if (f.kills >= 3) out.push(`There are ${f.kills} names on the wall that ${f.name} put there.`);
  }
  if (s.flags.returned >= 3 && !s.flags.returned_gone && ['ruin', 'flora', 'natives'].includes(f.kind) && f.stage >= 1) out.push(`Two of those who came back from ${s.flags.returned_to} have come to listen, and they nod along before anything has been explained.`);
  const lp = x.leadP;
  if (lp) { const k = ['grudge', 'bereaved', 'maimed', 'hero', 'convict', 'spared', 'slighted', 'touched'].find(k => lp.marks[k] && lp.marks[k].txt);
    if (k) out.push(`${lp.name}, who ${lp.marks[k].txt.replace(/"([^"]*)"/g, '“$1”')}, ${k === 'grudge' || k === 'bereaved' || k === 'slighted' ? 'does not look at you while speaking.' : 'is the one standing in front of you.'}`); }
  return out.join(' ');
}

/* ---------- boons: what the things you have made peace with (or looted) can do for you ---------- */
LF.boons = function (s, notFid) {
  const b = [], fl = s.flags;
  if (fl.und_pact) b.push({ tag: 'knowledge', name: 'the Understory' });
  if (fl.hive_allies) b.push({ tag: 'fighters', name: 'the drummers' }, { tag: 'guides', name: 'the drummers' });
  if (fl.oth_kin || fl.oth_merged || fl.oth_trade) b.push({ tag: 'labour', name: 'the Reach' }, { tag: 'guides', name: 'the Reach' });
  if (fl.builders_power) b.push({ tag: 'power', name: 'the Builders\' machine' });
  for (const f of s.factors) { if (f.id === notFid || !LF.KINDS[f.kind]) continue; const K = LF.KINDS[f.kind].subs[f.sub];
    if (!K.boon) continue;
    if ((f.kind === 'ruin' && (f.res === 'harnessed' || f.insight >= 60)) || (f.kind !== 'ruin' && f.res !== 'destroyed' && f.accord >= 45)) b.push({ tag: K.boon, name: f.name, fid: f.id }); }
  return b;
};
const HELP = {
  fighters: [h => `Ask ${h} to stand with you`, h => `${cap1(h)} come, and it is over quickly and brutally. They will want a favour back.`, h => `${cap1(h)} come, and it is not enough, and some of them die in your quarrel.`],
  guides: [h => `Ask ${h} how they live with it`, h => `They have lived with it for a thousand years, and most of what they know comes down to where not to stand.`, h => `What works for ${h} does not work for people built like us.`],
  knowledge: [h => `Take the question to ${h}`, h => `The answer is old and incomplete, but it covers what you need.`, h => `If the answer is in there, nobody can read it in time.`],
  tools: [h => `Use what you took from ${h}`, h => `It works at once and completely, and nobody can explain how.`, h => `It works, but it also has a side effect that nobody intended and nobody can undo.`],
  weapons: [h => `Turn ${h} on it`, h => `It works at once and completely, and nobody can explain how.`, h => `It works, but it also has a side effect that nobody intended and nobody can undo.`],
  power: [h => `Throw the full output of ${h} at the problem`, h => `With power to waste, the problem is soon dealt with.`, h => `The surge takes out a distribution board and very nearly the people standing at it.`],
  labour: [h => `Call in what ${h} owe you`, h => `They come with hands and carts, and now you owe them.`, h => `They send what they can spare, which is not much.`],
};

/* ---------- stakes: the specific thing at risk this time ---------- */
function pickStake(s, f, allowed) {
  const opts = [];
  for (const t of allowed) {
    if (t === 'machine') { const ids = Object.keys(s.machines).filter(k => LF.down(s, k)); if (ids.length) { const id = (f.sub === 'bloom' && LF.down(s, 'reclaimer')) ? 'reclaimer' : (f.sub === 'delver' && !s.machines.reactor.lost) ? 'reactor' : pick(s, ids); opts.push({ t, id, phrase: 'the ' + LF.MACHINES[id].name }); } }
    else if (t === 'project') { if (s.project) opts.push({ t, phrase: 'the half-built ' + LF.projName(s, s.project).toLowerCase() }); }
    else if (t === 'person') { const p = H.anyNamed(s); opts.push(p ? { t, pid: p.id, phrase: p.name } : { t: 'crew', phrase: 'the survey party' }); }
    else if (t === 'food') opts.push({ t, phrase: pick(s, ['the grain pods', 'the ration store', 'the seed lockers']) });
    else if (t === 'mat') opts.push({ t, phrase: pick(s, ['the plate yard', 'the cable store', 'the workshop stock']) });
    else if (t === 'crew') opts.push({ t, phrase: pick(s, ['the east field crew', 'the night watch', 'the survey party', 'the build crew']) });
    else if (t === 'morale') opts.push({ t, phrase: 'the colony\'s nerve' });
  }
  return opts.length ? pick(s, opts) : { t: 'morale', phrase: 'the colony\'s nerve' };
}
/* What a loss reads like depends on what was lost and what took it. {st} is the stake's phrase. */
const LOSS = {
  fauna: { food: 'What they did not eat from {st}, they fouled.', mat: 'They went through {st} like weather. What is left is scrap and droppings.', machine: 'They got in among the housings of {st}. The damage is the chewing kind, and it is everywhere.', project: '{St} is trampled flat, and the footings will have to be dug again.',
    crew: 'What was found of them was buried the same day.', dead: 'It was quick.', maimed: 'The surgeon saved the life but had to take the arm.', morale: 'People have stopped going out alone, and most will not go out after dark at all.' },
  flora: { food: 'It is into {st}, threaded through every sack. All of it has to be burned.', mat: '{St} has to be written off: pitted, furred, or simply gone soft.', machine: 'It has grown into {st}, through seals rated for vacuum.', project: '{St} is so overgrown that it is quicker to start again than to clear it.',
    crew: 'Nobody saw it happen. The search found their tools lying where they had been working.', dead: 'By the time anyone thought to look, there was nothing to be done but cut the body free.', maimed: 'The lungs will never be right again.', morale: 'There is a feeling in the camp of being slowly digested.' },
  plague: { food: 'Nobody will eat from {st} now, whether or not it is safe. It is burned to settle the argument.', mat: '{St} went on the pyres with the bedding.', machine: 'Nobody was well enough to mind {st}, and it has run for a month without service.', project: 'Work on {st} has stopped. The crew is in the ward, or digging for it.',
    crew: 'They are buried in a row, in the order they went.', dead: 'The colony learns it at the morning roll, when the name is not called.', maimed: 'The strength it took has not come back, and the physician says it will not.', morale: 'People flinch from each other\'s hands now.' },
  ruin: { food: 'Everything in {st} has been altered. It looks the same, and no animal will touch it.', mat: '{St} has been taken apart and sorted by element, in neat rows.', machine: '{St} was running in step with something else for an hour. It has not run true since.', project: '{St} has been corrected, to a plan that is not ours. It has to come down.',
    crew: 'There are no bodies, only their boots, set neatly side by side.', dead: 'There is nothing to bury.', maimed: 'The hand still works, though it is no longer entirely a hand.', morale: 'Nobody sleeps facing it.' },
  natives: { food: 'They emptied {st}. They knew which store would hurt most.', mat: '{St} was stripped overnight, and carried away along a dozen paths.', machine: 'They went straight for {st}, so they have been watching which machines matter.', project: '{St} was pulled down piece by piece, and the pieces were stacked where the whole camp could see them.',
    crew: 'The bodies are returned at dawn, washed, and laid out with care.', dead: 'The body is returned at dawn, washed, and wrapped in something woven.', maimed: 'It was done carefully, in a way meant to be survived.', morale: 'Figures have been seen on the ridge every evening since.' },
  humans: { food: 'They took {st}, and they left a receipt.', mat: '{St} is gone. They knew which crates were worth carrying.', machine: 'Whoever did that to {st} knew exactly which board to pull.', project: '{St} burned for an hour. Someone had brought accelerant.',
    crew: 'Other people did that, this far from anywhere.', dead: 'The shot came from someone who speaks the same language you do.', maimed: 'Somebody chose to do that, and took aim.', morale: 'People take it harder from other people than they ever did from the planet.' },
  faction: { food: '{St} is lighter than the ledger says. Nobody saw anything.', mat: '{St} has walked off, a crate at a time.', machine: 'Nobody will say who left {st} running dry.', project: '{St} stands as it stood last month. The tools have gone missing twice.',
    crew: 'It began as shoving and went further than that.', dead: 'It was not meant, and half the colony saw it.', maimed: 'It happened in a crowd, and the crowd has agreed it saw nothing.', morale: 'Half the mess hall has stopped speaking to the other half.' },
};
const SAVED = { food: ['Not a sack of {st} was lost.', '{St} is still sealed.'], mat: ['{St} is as it was.'], machine: ['{St} never missed a cycle.', 'Nothing reached {st}.'], project: ['{St} is still standing, and work resumes in the morning.'],
  crew: ['Everyone answers the roll.'], person: ['{p} walks away from it, shaken and whole.'], morale: ['People stand a little straighter for the rest of the month.'] };
const fill = (t, st, p) => t.replace('{St}', cap1(st.phrase)).replace('{st}', st.phrase).replace('{p}', p || '');
function savedLine(s, f, st) { const a = SAVED[st.t]; if (!a) return ''; const p = st.pid && H.byPid(s, st.pid); return fill(pick(s, a), st, p ? p.name : ''); }
function lossFx(s, f, st, m) { // m: how much of the stake is lost
  const k = SEV[f.sev - 1] * m, fx = {}, L = LOSS[f.kind] || LOSS.fauna, say = key => fill(L[key], st); let line = '';
  if (st.t === 'food') { fx.food = -Math.round(300 * k / 10) * 10; line = say('food'); }
  else if (st.t === 'mat') { fx.mat = -Math.round(40 * k); fx.parts = -Math.round(3 * k); line = say('mat'); }
  else if (st.t === 'machine') { fx.machine = { [st.id]: -Math.round(18 * k) }; fx.cap = { [st.id]: -Math.round(7 * k) }; line = say('machine'); }
  else if (st.t === 'project') { fx.progress = -0.5 * m; fx.mat = -Math.round(15 * k); line = say('project'); }
  else if (st.t === 'crew') { const n = Math.max(1, Math.round(2.5 * k)); fx.pop = -n; fx.fkills = n; line = `${n === 1 ? 'One of' : cap1(String(['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] || n)) + ' of'} ${st.phrase} ${n === 1 ? 'does' : 'do'} not come back. ${say('crew')}`; }
  else if (st.t === 'person') { const p = H.byPid(s, st.pid);
    if (k >= 1) { fx.kill = { who: st.pid, cause: `killed by ${f.name}` }; fx.fkills = 1; line = `${p.name} is among the dead. ${say('dead')}`; }
    else { fx.mark = [st.pid, 'maimed', `was maimed by ${f.name}`]; fx.morale = -2; line = `${p.name} lives, but badly hurt. ${say('maimed')}`; } }
  else { fx.morale = -Math.round(8 * k); line = say('morale'); }
  return { fx, line };
}

/* ---------- factor dynamics ---------- */
const active = f => f.stage >= 2 && !f.res;
LF.pressure = function (s) { // what the world is doing to the colony right now
  const P = { yield: 0, wear: 1, labor: 1, drain: 0, morale: 0 };
  for (const f of s.factors) {
    if (f.kind === 'land') continue;
    if (f.res === 'accord' || f.res === 'harnessed') { if (f.kind === 'flora') P.yield += 0.1; else if (f.kind === 'natives') P.yield += 0.08; else if (f.kind === 'humans') P.labor += 0.08; else if (f.kind === 'fauna') P.yield += 0.05; continue; }
    let p;
    if (f.res === 'lost') p = 0.55 * SEV[f.sev - 1]; else if (!active(f) || f.accord >= 40) continue; else p = clamp((f.threat - 20) / 80, 0, 1) * SEV[f.sev - 1];
    if (f.kind === 'fauna') P.yield -= 0.2 * p;
    else if (f.kind === 'flora') { if (f.sub === 'choir') P.yield -= 0.28 * p; else if (f.sub === 'spore') P.labor -= 0.2 * p; else P.wear += 1.0 * p; }
    else if (f.kind === 'plague') { if (f.sub === 'rot') P.drain += 0.2 * p; else P.labor -= 0.28 * p; }
    else if (f.kind === 'ruin') { if (f.uses.exploit || f.uses.force) P.wear += 0.7 * p; }
    else if (f.kind === 'natives') P.yield -= 0.16 * p;
    else if (f.kind === 'humans') P.drain += 0.13 * p;
    else if (f.kind === 'faction') { P.labor -= 0.14 * p; P.morale -= 0.05 * p; }
  }
  // Gravity: a heavy world slows every job and wears every bearing; a light one is a small mercy.
  const g = s.world.grav || 1; P.labor *= clamp(1 - (g - 1) * 0.3, 0.88, 1.06); P.wear *= 1 + Math.max(0, g - 1) * 0.5;
  P.labor = clamp(P.labor, 0.4, 1.3);
  return P;
};
LF.factorTick = function (s) {
  for (const f of s.factors) {
    if (!active(f)) continue;
    const seen = LF.has(s, 'watch') && ['fauna', 'natives', 'humans'].includes(f.kind) ? 0.7 : 1;   // the watchtowers: whatever comes to the wire is seen coming
    f.threat = clamp(f.threat + (0.07 + 0.05 * f.sev) * (f.wall ? 0.5 : 1) * (f.accord >= 40 ? 0.3 : 1) * seen, 0, 100);
    const p = clamp((f.threat - 20) / 80, 0, 1) * SEV[f.sev - 1];
    if (f.accord < 40 && ((f.kind === 'fauna' && (f.sub === 'pack' || f.sub === 'ambush')) || (f.kind === 'plague' && f.sub !== 'rot')) && rand(s) < 0.006 * p * seen * Math.sqrt(s.pop / 60)) {
      LF.deaths(s, 1); f.kills++;
      LF.log(s, f.kind === 'plague' ? `${f.Name} has taken another.` : `${f.Name} took someone from ${pick(s, ['the field edge', 'the water line', 'the night watch', 'the survey trail'])}.`, 'bad');
    }
  }
};
function settle(s, f) { // has this thread reached an ending on its own terms?
  if (f.res || f.stage < 2) return;
  let r = null;
  if (f.harm >= 100 && f.kind !== 'plague' && f.kind !== 'ruin') r = 'destroyed';
  else if (f.accord >= 80) r = 'accord';
  else if (f.stage >= 3 && f.threat <= 0) r = 'contained';
  if (r) LF.resolve(s, f, r);
}
const RES_LINE = {
  destroyed: f => `${f.Name} ${f.kind === 'faction' ? 'was broken as a movement' : 'was wiped out and will not trouble the colony again'}.`,
  accord: f => `The colony and ${f.name} found a way to share a world.`,
  contained: f => `${f.Name} was held back, for now, behind lines the colony could keep.`,
  harnessed: f => `The colony learned to use ${f.name} without ever fully understanding it.`,
  lost: f => `The colony lost its struggle with ${f.name}, and learned to live in what was left.`,
};
LF.resolve = function (s, f, r) { f.res = r; f.resDay = s.day; LF.storyPoint(s); LF.chron(s, RES_LINE[r](f)); LF.log(s, RES_LINE[r](f), r === 'lost' ? 'bad' : 'good');
  if (r === 'harnessed' && f.kind === 'ruin' && f.sub === 'engine') s.flags.builders_power = true; };

/* ---------- factions: born from what you have made the colony ---------- */
const FACTION = { // keyed by the side they WANT
  mercy: ['the Open Hand', 'the Lenient'], severe: ['the Iron Rule', 'the Ledger'], bold: ['the Forward Party', 'the Further Shore'], cautious: ['the Slow Road', 'the Careful'],
  open: ['the Bridge', 'the Listeners'], closed: ['the Clean Hands', 'the Hullborn'], free: ['the Free Assembly', 'the Commons'], order: ['the Charter Loyal', 'the Steady Hand'],
};
const SIDE = { mercy: ['mercy', 'severe'], bold: ['bold', 'cautious'], open: ['open', 'closed'], free: ['free', 'order'] };
/* A movement ends without a showdown, too: when the colony has come round to what it wanted, or when it loses the person
   who spoke for it. Without this most factions were met and never settled (DESIGN.md "Factors that end"). */
function settleQuietly(s, f, r, line, noEcho) { f.res = r; f.resDay = s.day; if (noEcho) f.echo = true; LF.storyPoint(s); LF.chron(s, line); LF.log(s, line, 'good'); }
function factionTick(s) {
  for (const f of s.factors) { if (f.kind !== 'faction' || f.res || f.stage < 1) continue;
    if (f.axis !== 'ret' && SIDE[f.axis]) { const dir = SIDE[f.axis][0] === f.sub ? 1 : -1, v = s.val[f.axis] || 0;
      if (Math.sign(v) === dir || Math.abs(v) <= 1) f.sat = (f.sat || 0) + 20; else f.sat = 0;
      if (f.sat >= 120) { settleQuietly(s, f, 'accord', `What ${f.name} wanted is how the colony runs now, and the movement has stopped meeting.`); continue; } }
    const L = f.leader && H.byPid(s, f.leader);
    if (L && !L.alive && s.day - (L.died || f.last) > 45 && s.day - f.last > 45) { settleQuietly(s, f, 'destroyed', `${f.Name} lost its voice with ${L.name}, and came apart.`, true); continue; }
    if (f.stage === 1 && s.day - f.last >= 240) settleQuietly(s, f, 'contained', `${f.Name} never got as far as a demand. The meetings thinned out over ${s.morale >= 45 ? 'a good year, when nobody had much to complain of' : 'a hard year, when people had too much else to think about'}, and then stopped.`, true);
  }
}
LF.factionCheck = function (s) {
  factionTick(s);
  if (s.factors.filter(f => f.kind === 'faction' && !f.res).length >= 2 || s.day < 150 || s.day > 760) return;   // by the eighth year the colony's politics have their shape
  // The returned: a faction made by where they went, not by anything you decided.
  if (s.flags.returned >= 4 && !s.flags.returned_gone && (s.flags.ret_slighted || s.day - s.flags.returned_day > 120) && !s.factors.some(f => f.sub === 'returned')) {
    const name = pick(s, ['the Returned', 'the Far-Walkers', 'the East Table']), L = s.flags.returned_lead && H.byPid(s, s.flags.returned_lead);
    s.factors.push({ id: 'f' + s.factors.length, kind: 'faction', sub: 'returned', axis: 'ret', against: null, name, Name: cap1(name), one: name, sev: 2, late: false, leader: L && L.alive ? L.id : null,
      onset: s.day + ri(s, 10, 30), stage: 0, threat: 30, insight: 0, accord: 0, harm: 0, uses: {}, kills: 0, last: -999, res: null, resDay: 0 });
    return;
  }
  for (const ax in s.val) {
    if (Math.abs(s.val[ax]) < 4 || s.factors.some(f => f.kind === 'faction' && f.axis === ax)) continue;
    const want = SIDE[ax][s.val[ax] > 0 ? 1 : 0], against = LF.doctrine(s, ax);
    // Whoever speaks for a movement has to believe in it, and nobody leads two.
    const leader = (LF.cast && LF.cast(s, { val: want, low: true, free: true, need: 2 })) || s.people.find(p => p.alive && (p.marks.grudge || p.marks.bereaved || p.marks.slighted)) || H.anyNamed(s);
    const name = pick(s, FACTION[want]);
    s.factors.push({ id: 'f' + s.factors.length, kind: 'faction', sub: want, axis: ax, against, name, Name: cap1(name), one: name, sev: 2, late: false, leader: leader ? leader.id : null,
      onset: s.day + ri(s, 10, 30), stage: 0, threat: 30, insight: 0, accord: 0, harm: 0, uses: {}, kills: 0, last: -999, res: null, resDay: 0 });
    return;
  }
};

/* ---------- building a dilemma ---------- */
function frameFor(s, f) {
  if (f.kind === 'land') return s.survey >= f.next ? { stage: 3, w: 2.5 } : null;
  if (f.res) return (!f.echo && s.day - f.resDay >= 110) ? { stage: 5, w: 1 } : null;
  if (s.day - f.last < (f.stage === 0 ? 0 : 30)) return null;
  if (f.stage === 0) { const on = f.late ? f.onset : f.onset - s.survey * 0.25; return s.day >= on ? { stage: 1, w: s.day - on > 40 ? 6 : 2.2 } : null; } // overdue things push to the front
  if (f.stage === 1) return { stage: 2, w: (f.kind === 'faction' ? 3 : 1.6) * (s.day - f.last > 200 ? 2 : 1) };   // a movement presses its demand; anything left at its first sign for long comes forward
  if (f.threat >= (f.kind === 'humans' ? 55 : 72)) return { stage: 4, w: 4 };   // people run out of patience sooner than weather does
  return s.day - f.last >= 42 ? { stage: 3, w: 0.9 + f.threat / 45 } : null;
}
LF.genCandidates = function (s) {
  const out = [];
  for (const f of s.factors) { const c = frameFor(s, f); if (!c) continue;
    const kind = c.stage === 5 ? 'echo' : f.kind;
    const fr = FR.filter(x => x.kind === kind && (x.stage === c.stage || (kind === 'humans' && c.stage === 2 && x.stage === 3 && x.tone === 'opportunity')) &&   /* people next door: an offer can come before the trouble does */ (!x.when || x.when(s, f)) && (c.stage !== 3 || x.id !== f.lastFrame || FR.filter(y => y.kind === kind && y.stage === 3).length < 2)
      && (f.kind !== 'land' || !f.seen[x.id] || s.day - f.seen[x.id] > 200));
    // Where a thing can meet another thing, that is the better card: it says the world is one place. (Not twice running.)
    const xs = fr.filter(x => x.other && x.id !== f.lastFrame), ps = fr.filter(x => x.prefer && x.prefer(s, f) && x.id !== f.lastFrame);   // prefer: the card this state calls for
    const fresh = fr.filter(x => !(f.shown || {})[x.id]);   // otherwise a card this thing has not shown yet
    if (fr.length) out.push({ f, fr: xs.length ? xs : ps.length ? ps : fresh.length ? fresh : fr, w: c.w * ((f.kind === 'humans' || f.kind === 'natives') && c.stage >= 2 ? 1.8 : 1) }); }   // people next door are rare; when they are here, they are loud
  return out;
};
const val = (v, x) => typeof v === 'function' ? v(x) : v;
LF.fireGen = function (s, f, frames) {
  const fr = pick(s, frames), K = LF.KINDS[f.kind] ? LF.KINDS[f.kind].subs[f.sub] : {};
  const leadRole = (fr.lead || ['security']).find(r => H.P(s, r)) || (fr.lead || ['security'])[0];
  const leadP = f.kind === 'faction' && f.leader && H.byPid(s, f.leader) && H.byPid(s, f.leader).alive ? H.byPid(s, f.leader) : H.P(s, leadRole);
  const stake = pickStake(s, f, fr.stakes || K.stakes || ['morale']);
  const x = { s, f, K, n: f.name, N: f.Name, one: f.one, sev: f.sev, stake, st: stake.phrase, leadP, lead: leadP ? leadP.name : LF.seatWord(s, leadRole), leadF: leadP ? leadP.first : LF.seatWord(s, leadRole),
    Lead: cap1(leadP ? leadP.name : LF.seatWord(s, leadRole)), planet: s.world.planet, pl: !(LF.KINDS[f.kind] || {}).mass && f.kind !== 'faction', days: Math.round(H.foodDays(s)) };
  x.are = x.pl ? 'are' : 'is'; x.they = x.pl ? 'they' : 'it'; x.They = cap1(x.they); x.them = x.pl ? 'them' : 'it'; x.their = x.pl ? 'their' : 'its'; x.have = x.pl ? 'have' : 'has';
  x.titles = f.sub === 'returned' ? [] : s.ledger.filter(e => e.v && e.v.includes(f.sub === 'severe' ? 'mercy' : f.sub === 'mercy' ? 'severe' : f.sub === 'bold' ? 'cautious' : f.sub === 'cautious' ? 'bold' : f.sub === 'open' ? 'closed' : f.sub === 'closed' ? 'open' : f.sub === 'free' ? 'order' : 'free')).slice(-3).map(e => e.t);
  x.target = s.factors.find(o => o.kind !== 'faction' && !o.res && o.stage >= 1 && (f.sub === 'closed' ? o.accord > 0 : true)) || null;
  // A frame may be about two things at once: fr.other picks the second factor.
  x.o = fr.other ? fr.other(s, f) : null;
  if (x.o) { const m = (LF.KINDS[x.o.kind] || {}).mass; x.on = x.o.name; x.oN = x.o.Name; x.oare = m ? 'is' : 'are'; x.othey = m ? 'it' : 'they'; x.othem = m ? 'it' : 'them'; x.ohave = m ? 'has' : 'have'; }
  x.cb = callback(s, f, x);
  let text = val(fr.text, x); if (x.cb) text += '\n\n' + x.cb;
  /* Three options at most (Lachlan, 2026-11-21; DESIGN.md "Three seats on a generated card").
     A frame shows three of its own at most: where it writes a fourth, two of them carry opposite `show`s, and one marked `spare`
     is kept back (below). On top of those the generator has extras: help from something the colony has terms with, leverage
     over the person in front of you, and the dark thing a frightened colony proposes (LF.limitSpecs). An extra never makes a
     fourth, and a card carries one at most, the first of those three that applies:
       - a frame with two of its own on screen gets it as the third;
       - on a full card it takes a seat: a dark extra the seat of the frame's own last dark option, anything else (and a dark
         one on a card with no dark option of its own) the seat of the frame's last option;
       - a frame that sends a party out, or a lead from the interior, takes none: its third seat is the way to stay home. */
  const specs = fr.choices.filter(c => !c.spare && (!c.show || c.show(x))).slice(0, 3);
  let extra = null;
  if (f.kind !== 'land' && !fr.choices.some(c => c.send)) {
    // Help from something else the colony has made terms with.
    if (fr.needs) { const b = LF.boons(s, f.id).find(b => fr.needs.includes(b.tag)); if (b) { const T = HELP[b.tag];
      extra = { ap: 'accord', v: 'open', l: T[0](b.name), n: 'You will owe them for this.', b: 70, help: b,
        ok: [T[1](b.name), { f: { threat: -28 }, helper: -12 }], bad: [T[2](b.name), { f: { threat: -6 }, lose: 0.5, helper: -22 }] }; } }
    // Leverage: if you know something about the person in front of you, you can use it. Once.
    if (!extra && LF.hookOn && LF.hookOn(s, leadP) && fr.stage >= 2 && fr.stage <= 4 && specs.some(c => c.ok))
      extra = { ap: 'exploit', v: 'severe order', l: `Remind ${leadP.first} what you know`, n: `${leadP.name} ${leadP.hook.txt}. It will work, and neither of you will forget it.`, hint: 'bad',
        out: [`${leadP.name} hears you out, goes very still, and then does everything that is needed, quickly and well.`, { f: { threat: -16 }, hook: leadP.id }] };
    // What a frightened colony proposes once it has started proposing such things (content-limits.js; the pen, humanity.js).
    // Asked last: it marks what it hands over as used, so it is only asked when the seat is its own.
    if (!extra && LF.limitSpecs) extra = LF.limitSpecs(s, f, fr, x)[0] || null;
  }
  if (extra) { if (specs.length < 3) specs.push(extra);
    else { let i = extra.dark ? specs.map(c => !!c.dark).lastIndexOf(true) : -1; specs[i < 0 ? specs.length - 1 : i] = extra; } }
  const option = c => {
    const vv = val(c.v, x), tags = (vv !== undefined ? vv : AP_TAGS[c.ap] || '').split(' ').filter(Boolean), al = align(s, tags);
    const fi = fr.choices.indexOf(c), key = fi >= 0 ? String(fi) : c.hook !== undefined || (c.out && c.out[1] && c.out[1].hook) ? 'hook' : (c.lk || ('x' + c.ap + (c.dark ? '.dark' : '')));   // the option's id (decisions.js)
    const ch = { key, ap: c.ap, v: tags, label: val(c.l, x), note: val(c.n, x) || '', cost: c.cost ? Object.assign({}, c.cost) : null, against: al.against, lock: '', hint: c.hint || null, dark: !!c.dark, info: c.info || null };
    if (c.about) ch.about = true;   // the option is about this officer, not a job to send someone on (DESIGN.md "The odds")
    if (c.send) { // a party leaves; the answer comes back later, or does not
      const days = ri(s, c.send.days[0], c.send.days[1]), n = c.send.n;
      ch.send = { n, months: Math.max(1, Math.round(days / LF.MONTH)), danger: c.send.danger };
      ch.cost = Object.assign(ch.cost || {}, { food: Math.round(n * days * 0.5 / 10) * 10 });
      if (LF.hands(s) - n < 18) ch.lock = `Needs ${n} people to spare`;
      const ldr = n >= 6 && leadP && f.kind !== 'faction' ? leadP : null;
      if (ldr) { ch.send.lead = ldr.name; ch.note = `Led by ${ldr.name}, ${LF.title(ldr)}. ${LEAD[ldr.role].n} The colony does without ${ldr.first} until they are back.`; }
      c = Object.assign({}, c, { out: [c.out[0], Object.assign({}, val(c.out[1], x) || {}, { away: { n, days, danger: c.send.danger, to: c.send.to ? val(c.send.to, x) : f.name, ret: c.send.ret || f.kind, fid: f.kind === 'land' ? null : f.id, lead: ldr ? ldr.id : null } })] });
    }
    if (c.req && !c.req(x)) ch.lock = LF.upLock(s, c.reqText || 'Not possible');
    else if (ch.cost && !ch.lock) for (const k in ch.cost) if (s.res[k] < ch.cost[k]) ch.lock = `Not enough ${{ food: 'food', mat: 'materials', parts: 'spare parts' }[k]}: it needs ${Math.round(ch.cost[k])}, the colony holds ${Math.round(s.res[k])}`;
    const build = (o, okay) => { if (!o) return null; let fx = Object.assign({}, val(o[1], x) || {}), t = val(o[0], x);
      if (fx.lose) { const L = lossFx(s, f, stake, fx.lose); delete fx.lose; for (const k in L.fx) { if (typeof L.fx[k] === 'number' && typeof fx[k] === 'number') fx[k] += L.fx[k]; else fx[k] = L.fx[k]; } t += ' ' + L.line; }
      else if (okay && c.ok && c.ap === 'force' && !fx.kill && /crisis|pressure/.test(fr.tone) && (fr.stage === 2 || fr.stage === 4)) t += ' ' + savedLine(s, f, stake);
      // Nothing is free: watching and waiting costs the season's work, and backing away is seen by everyone.
      if (f.kind !== 'land' && fr.stage >= 1 && fr.stage <= 4 && !c.send && !c.dark) {
        if (c.ap === 'study' && fx.food === undefined) fx.food = -50;
        else if (c.ap === 'avoid' && fx.morale === undefined) fx.morale = -2; }
      fx.fops = [Object.assign({ id: f.id }, DEFAULT[c.ap] ? DEFAULT[c.ap][okay ? 0 : 1] : {}, fx.f || {})]; delete fx.f;
      if (fx.fkills) { fx.fops[0].kills = fx.fkills; delete fx.fkills; }
      if (fx.o && x.o) fx.fops.push(Object.assign({ id: x.o.id }, fx.o)); delete fx.o;
      if (fx.fops2) { fx.fops.push(fx.fops2); delete fx.fops2; }
      if (!fx.mark) delete fx.mark;
      if (fx.helper && c.help && c.help.fid) fx.fops.push({ id: c.help.fid, accord: fx.helper }); delete fx.helper;
      return { text: t, fx }; };
    if (c.out) ch.out = build(c.out, true);
    else { ch.ok = build(c.ok, true); ch.bad = build(c.bad, false);
      // The scale (DESIGN.md "The odds"): the first office the frame names is the department whose job it is (+10), the others help
      // (+5), one figure a seat; every other line in fives.
      const seen = {}, mods = [];
      for (const r of c.m || []) { const k = LF.SEAT_OF[r] || r; if (seen[k]) continue; seen[k] = 1; mods.push(H.R(r, mods.length ? 5 : 10)); }
      const five = v => 5 * Math.round(v / 5);
      if (f.insight >= 10 && five(Math.min(20, f.insight / 5))) mods.push(H.If(() => true, five(Math.min(20, f.insight / 5)), `What has been learned about ${f.name}`));
      if (f.sev !== 2) mods.push(H.If(() => true, f.sev === 3 ? -10 : 5, f.sev === 3 ? `${f.Name}: worse than anything in the survey` : `${f.Name}: a manageable thing`));
      if (c.ap === 'force' && f.uses.force) mods.push(H.If(() => true, -5 * Math.min(4, f.uses.force), f.kind === 'ruin' || f.kind === 'plague' ? 'It has been tried before' : 'They have learned your methods'));
      if (c.ap === 'accord' && f.accord >= 10 && five(f.accord / 5)) mods.push(H.If(() => true, five(f.accord / 5), `Standing with ${f.name}`));
      if (c.ap === 'accord' && (f.uses.force || f.uses.exploit) && f.kind !== 'plague') mods.push(H.If(() => true, -5 * Math.min(4, (f.uses.force || 0) + (f.uses.exploit || 0)), 'What you have already done to them'));
      if (c.ap === 'exploit' && f.uses.exploit) mods.push(H.If(() => true, 5, 'Practice'));
      if (c.ap === 'study' && s.flags.returned >= 3 && !s.flags.returned_gone && ['ruin', 'flora', 'natives'].includes(f.kind)) mods.push(H.If(() => true, 5, 'The returned have seen something like it'));
      if (c.ap === 'force' && s.cargo && s.cargo.arms) mods.push(H.If(() => true, 5, 'The arms locker'));
      if (c.ap === 'study' && s.cargo && s.cargo.drones) mods.push(H.If(() => true, 5, 'The survey drones'));
      if (al.fit) mods.push(H.If(() => true, 5, `A ${al.fit.toLowerCase()} colony, practised at this`));
      if (leadP && leadP.marks.grudge) mods.push(H.If(() => true, -10, `${leadP.first} bears you a grudge`));
      if (s.morale < 30) mods.push(H.If(() => true, -5, 'A colony near the end of its patience'));
      ch.odds = LF.odds(s, { base: c.b || 50, mods, ap: c.ap }, x); ch.roles = mods.filter(m => m.k === 'role').map(m => ({ k: 'role', role: m.role, v: m.v })); }   // plain data: what an officer sent would add
    return ch;
  };
  const choices = specs.map(option);
  // The spare: a frame whose every way of answering can be locked (no hands for a party, no spares for the drone) names one
  // option that costs nothing. It is on screen only when everything else is locked, in the seat of the last of them.
  const spare = fr.choices.find(c => c.spare);
  if (spare && choices.length && choices.every(ch => ch.lock)) choices[choices.length - 1] = option(spare);
  s.cur = { gen: true, phase: 'choose', attach: [], id: fr.id, fid: f.id, title: val(fr.title, x), tone: fr.tone, text, ask: fr.ask ? val(fr.ask, x) : '', choices, view: LF.frameView(fr, f), lead: leadP ? leadP.id : null, stake: stake.phrase,
    sig: [fr.id, f.sub, x.o ? x.o.sub : '', stake.t, x.cb ? 'cb' : '', choices.length, extra ? extra.lk || extra.ap + (extra.dark ? '.dark' : '') : ''].join('|') };
  LF.notice(s, text); if (leadP) leadP.known = leadP.known || s.day;
  f.last = s.day; f.lastFrame = fr.id; s.dilemmas++; s.lastTone = fr.tone;
  if (f.kind === 'land') f.next = s.survey + 32; if (f.seen) f.seen[fr.id] = s.day; (f.shown = f.shown || {})[fr.id] = s.day;
  s.tension = clamp(s.tension + ({ crisis: 18, pressure: 8, quiet: -12, opportunity: -4 }[fr.tone] || 0), 0, 100);
};
const DEFAULT = { // what each approach does to a factor unless the frame says otherwise: [success, failure]
  force:   [{ threat: -20, harm: 30, accord: -25 }, { threat: 10, harm: 8, accord: -25 }],
  study:   [{ insight: 25 }, { insight: 8, threat: 5 }],
  accord:  [{ accord: 25, threat: -10 }, { accord: 4, threat: 8 }],
  exploit: [{ insight: 6, accord: -12, threat: 4 }, { accord: -15, threat: 15 }],
  avoid:   [{ threat: -6 }, { threat: 8 }],
};
LF.chooseGen = function (s, i) {
  const cur = s.cur, ch = cur.choices[i], f = s.factors.find(x => x.id === cur.fid) || null, chips = [], before = LF.beforePick ? LF.beforePick(s) : null;
  const done = res => { if (LF.picked) LF.picked(s, { id: cur.id, i, res, ch, before }); LF.holdForFlight(s); };
  if (LF.fitAttach) LF.fitAttach(s, ch);   // whoever was marked but can't do this option's work stays behind (people.js)
  if (ch.cost) for (const k in ch.cost) { const b = s.res[k]; s.res[k] -= ch.cost[k]; chips.push({ t: LF.amount(s, k, -ch.cost[k], b), good: false }); }
  const res = { label: ch.label }; let o;
  const od = LF.withAttach(s, ch.odds, ch.ap, f && f.kind, { mods: ch.roles || [], ap: ch.ap });
  if (od) { res.p = od.p; res.success = Math.floor(rand(s) * 100) < od.p; o = res.success ? ch.ok : ch.bad; } else o = ch.out;
  if (ch.send && o.fx.away) o.fx.away.with = LF.attached(s).map(p => p.id);
  res.text = LF.tollText(s, o.text, o.fx);   // past LF.SCALE the dead are more than the words say (core.js)
  if (ch.against) { s.morale = clamp(s.morale - 4, 0, 100); chips.push({ t: `Out of character for ${LF.an(ch.against.toLowerCase())} colony: spirits sink`, good: false }); }
  LF.apply(s, ch.dark && LF.numb ? LF.numb(s, o.fx) : o.fx, chips, {});
  LF.shiftValues(s, ch.v);
  LF.notice(s, res.text); if (cur.plan) LF.planChosen(s, cur, i);
  LF.record(s, { fid: f ? f.id : null, kind: f ? f.kind : cur.plan ? 'plan' : 'away', t: cur.title, ap: ch.ap || null, ok: ch.odds ? res.success : null, who: cur.lead, v: ch.v });
  if (!f || f.kind === 'land') { res.chips = chips; res.remember = !!ch.send; cur.phase = 'result'; cur.result = res; LF.log(s, `${cur.title}: ${ch.label}.`, 'event'); done(res); return; }
  if (ch.ap) f.uses[ch.ap] = (f.uses[ch.ap] || 0) + 1;
  if (od) { const FRM = FR.find(x => x.id === cur.id); LF.afterTest(s, { success: res.success, title: cur.title, ap: ch.ap, f, crisis: FRM.tone === 'crisis' || FRM.stage === 4, lostCrew: (o.fx.pop || 0) < 0, stake: cur.stake }, chips); }
  // Someone who was in the room when it went wrong remembers whose order it was.
  if (res.success === false && o.fx.kill && cur.lead) { const lp = H.byPid(s, cur.lead); if (lp && lp.alive && !lp.marks.grudge) lp.marks.grudge = { d: s.day, txt: `was there when "${cur.title}" went wrong` }; }
  if (FR.find(x => x.id === cur.id).stage === 5) f.echo = true; else if (f.stage < 3) f.stage++;
  settle(s, f);
  if (LF.officerAfter) LF.officerAfter(s, { crisis: cur.tone === 'crisis', dark: !!ch.dark, ok: od ? res.success : null, sent: (cur.attach || []).slice(), dead: chips.some(c => / dead$/.test(c.t)), world: cur.view === 'world' }, chips);
  s.last = { title: cur.title, label: ch.label, fid: f.id, ap: ch.ap || null, ok: od ? res.success : null, dead: chips.some(c => / dead$/.test(c.t)), tone: cur.tone };
  res.then = LF.aftermath(s);
  res.chips = chips; res.remember = true;
  cur.phase = 'result'; cur.result = res;
  LF.log(s, `${cur.title}: ${ch.label}.`, 'event');
  done(res);
};

/* ---------- expeditions: people sent out, and what comes back ---------- */
/* Who leads a large party shapes what comes back: multipliers on the return table, by role and by temperament. */
const LEAD = {
  security:      { n: 'You should lose fewer people.', w: { partial: 0.55, silence: 0.7 } },
  geologist:     { n: 'The party will not get lost.', w: { silence: 0.45, triumph: 1.3 } },
  pilot:         { n: 'The party will not get lost.', w: { silence: 0.45, triumph: 1.2 } },
  xenobio:       { n: 'The party will know what to look for.', w: { triumph: 1.6, changed: 0.8 } },
  botanist:      { n: 'The party will know what to look for.', w: { triumph: 1.5, diseased: 0.8 } },
  physician:     { n: 'Nobody should bring a sickness home.', w: { diseased: 0.25, partial: 0.8 } },
  engineer:      { n: 'The party will get more use out of whatever it finds.', w: { triumph: 1.6 } },
  teacher:       { n: 'The party will keep its head.', w: { changed: 0.4, followed: 0.6 } },
  chaplain:      { n: 'The party will stick together.', w: { changed: 0.4, stayed: 0.3 } },
  quartermaster: { n: 'The party will bring back more.', w: { triumph: 1.4, success: 1.2 } },
};
LF.PARTY_LEAD = LEAD;   // the order to send a party (orders.js, T2-5) says what its leader will do
const TRAIT_W = { cautious: { silence: 0.7, partial: 0.8, triumph: 0.8 }, reckless: { triumph: 1.4, partial: 1.35 }, brilliant: { triumph: 1.3 }, stubborn: { silence: 0.75 }, beloved: { stayed: 0.4 } };
const leaderOf = (s, a) => (a.lead && H.byPid(s, a.lead)) || null;
const members = (s, a) => (a.with || []).map(id => H.byPid(s, id)).filter(p => p && p.alive);
function home(s, a) { const L = leaderOf(s, a); if (L) L.away = false; for (const p of members(s, a)) p.away = false; const i = s.away.indexOf(a); if (i >= 0) s.away.splice(i, 1); }
/* k of the party die. The leader is the last to go unless the caller says otherwise. */
function casualties(s, a, k, chips, f, leaderToo) {
  k = Math.min(k, a.n); if (k <= 0) return;
  const L = leaderOf(s, a); let rest = k;
  if (L && L.alive && (leaderToo || k >= a.n)) { L.away = false; a.lead = null; LF.killPerson(s, L, `lost with the party sent to ${a.to}`); rest--; }
  // Anyone who went by name shares the odds; a survivor shares them less.
  for (const p of members(s, a)) { if (rest <= 0) break;
    if (k >= a.n || rand(s) < (k / a.n) * (p.perks.includes('survivor') ? 0.4 : 1)) { p.away = false; a.with = a.with.filter(id => id !== p.id); LF.killPerson(s, p, `lost with the party sent to ${a.to}`); chips && chips.push({ t: `${p.name} dead`, good: false }); rest--; } }
  s.pop -= rest; s.deaths += rest; s.grief = Math.min(40, s.grief + 2.5 * rest); s.tension += 3 * rest; a.n -= k; if (f) f.kills += k;
  chips && chips.push({ t: `${k} dead`, good: false });
}
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => NUM[n] || String(n);
const REWARD = {
  ruin:    { t: a => `They bring things back from ${a.to}: sealed tools, alloys nobody can scratch, and a device that mends whatever it is pressed against.`, fx: { parts: 12, mend: 18 }, f: { insight: 30 } },
  fauna:   { t: a => `They found where ${a.to} den, how many there are, and what frightens them.`, fx: {}, f: { insight: 35, threat: -14 } },
  flora:   { t: a => `They reached the heart of ${a.to} and came home with samples and a map of how it spreads.`, fx: {}, f: { insight: 35, threat: -14 } },
  plague:  { t: a => `They traced ${a.to} to its source, and sealed what could be sealed.`, fx: {}, f: { insight: 30, threat: -22 } },
  natives: { t: a => `They were received. They ate what was put in front of them, and were sent home carrying gifts.`, fx: { food: 200 }, f: { accord: 32, insight: 12 } },
  humans:  { t: a => `Terms were spoken, and a few were even agreed.`, fx: { mat: 30 }, f: { accord: 30, insight: 12 } },
  springs: { t: a => `They found hot springs: open water, steam, green things growing, and a thermal gradient that has the engineers staring.`, fx: { food: 150, flags: { geothermal: true } } },
  salvage: { t: a => `The wreck was one of our own cargo pods, shaken loose in the descent: half buried and mostly intact.`, fx: { mat: 60, parts: 10 } },
  ore:     { t: a => `The staining was what it looked like: a workable ore body, close to the surface.`, fx: { mat: 30, flags: { ore_found: true } } },
  soil:    { t: a => `The soil there is deep, dark and sheltered. Seed the party scattered was already up before they left.`, fx: { yield: 0.07 } },
  reach:   { t: a => `They lay up on a ridge above the beacon for days: a settlement, three hundred people, fields, a dead ship's hull roofing the hall. They are fairly sure they were not seen.`, fx: { survey: 25, morale: 2 } },
  drummers:{ t: a => `They found the warrens: low mounds, evenly spaced, hundreds of them. They came away with a count and a map of the paths between.`, fx: { survey: 20 } },
  pod:     { t: a => `Pod Fourteen was on its side in a dry riverbed. Most of its cryo units were still running, and the people in them woke to faces they knew.`, fx: { pop: 6, parts: 4 } },
  herd:    { t: a => `They came back hauling sledges of smoked meat, and they know now where the herd fords the river.`, fx: { food: 380 } },
  salt:    { t: a => `They bring back salt by the sledge-load, enough that nothing in the stores should spoil this year.`, fx: { food: 160, morale: 2 } },
  cave:    { t: a => `They found dry galleries at a steady four degrees, with room for everything the colony owns. They left a cache there, and a marked trail.`, fx: { mat: 25, food: 100, survey: 20 } },
  timber:  { t: a => `The timber cuts like oak and floats like cork. They rafted the first load home down the river.`, fx: { mat: 70 } },
  bones:   { t: a => `They brought back a tooth as long as a forearm, and a map of three valleys nobody had seen.`, fx: { survey: 35, morale: 3 } },
  pass:    { t: a => `Beyond the pass is a second watershed, greener than this one. The map has doubled in size.`, fx: { survey: 60, morale: 2 } },
  wax:     { t: a => `The towers are full of a wax that seals, burns clean and never goes hard. The engineers have a dozen uses for it by nightfall.`, fx: { parts: 6, mat: 20 } },
  mystery: { t: a => `They found what the lights were.`, fx: { survey: 40 } },
  search:  { t: a => ``, fx: {} },
  /* ---- the player's own parties to a place (orders.js, T2-5): what each kind of place gives (js/places.js LF.POI_KINDS) ---- */
  wreck:   { t: (a, s) => `They cut their way into ${a.to} and stripped it where it lay: plate, cable, a crate of fittings still in their wrap. The sledges came home loaded to the rails.`, fx: { mat: 55, parts: 6 } },
  lostpod: { t: (a, s) => `It was one of the colony's own pods, shaken loose in the descent and come down hard at ${a.to}. Most of its cryo units were still running. The people in them woke to faces they knew, and walked home.`, fx: { pop: 6, mat: 20 }, go: s => { s.flags.pod_found = s.day; return ''; } },
  seam:    { t: (a, s) => `The reading was right about ${a.to}: a body of ore under a skin of ${LF.lex(s, 'top')}, with a face you could start cutting tomorrow. They brought back a sack of it to show.`, fx: { mat: 25, flags: { ore_found: true } } },
  spring:  { t: (a, s) => `Water comes up clean at ${a.to}, and the ground round it is level and sheltered. They pegged out a square of it and left a cairn: somewhere the colony could live one day.`, fx: { food: 40, survey: 12 }, go: (s, a, frac) => site(s, a, frac) },
  ridge:   { t: (a, s) => `From the top of ${a.to} the colony is a thread of smoke a long way below. They drew the country out in every direction, and pegged out a shelf on the far side as ground to settle one day.`, fx: { survey: 30, morale: 1 }, go: (s, a, frac) => site(s, a, frac) },
  camp:    { t: (a, s) => `Nobody was at ${a.to} when they got there: a ring of stones, a fire pit, things set down as if their owners meant to come back. They touched nothing they could not put back, and left a mark of the colony's own.`, fx: { survey: 10 }, go: (s, a, frac, chips) => contact(s, a, frac, chips, ['natives', 'humans']) },
  signal:  { t: (a, s) => `They found what was sending: ${a.to}, a mast on a footing of poured stone, still keying the same short pattern. They copied the pattern down, and left the mast as they found it.`, fx: { survey: 15 }, go: (s, a, frac, chips) => contact(s, a, frac, chips, ['humans', 'natives']) },
  growth:  { t: (a, s) => `They came back from ${a.to} with sacks of ${LF.lex(s, 'wild1')} and a crate of cuttings for the lab, and a map of how far it runs.`, fx: { food: 110 }, go: (s, a, frac, chips) => study(s, a, frac, chips, 'flora') },
  grazing: { t: (a, s) => `They lay up above ${a.to} for a week and counted. Then they took what they could carry, smoked it on the spot, and came home hauling it.`, fx: { food: 260 }, go: (s, a, frac, chips) => study(s, a, frac, chips, 'fauna') },
  crater:  { t: (a, s) => `They walked the rim of ${a.to} and went down inside. They came back with a sack of glassy beads and lumps of iron that came down with whatever made it.`, fx: { mat: 25, survey: 15 } },
  hollow:  { t: (a, s) => `${cap1(a.to)} goes back further than their lamps did. It is dry, it holds one temperature, and there is room in it. They left a cache inside the mouth and blazed the way there.`, fx: { mat: 10, survey: 20 } },
  track:   { t: (a, s) => `They followed ${a.to} until it gave out on hard ground, and drew where it went. Whatever made it uses it often.`, fx: { survey: 20 }, go: (s, a, frac, chips) => study(s, a, frac, chips, 'fauna') },
  mark:    { t: (a, s) => `They went to ${a.to}, walked the ground and brought back what there was: notes, a sketch map, a bag of samples nobody has a use for yet.`, fx: { survey: 18 } },
  thread:  { t: (a, s) => `They went to ${a.to} and walked the ground. They brought back notes, a sketch map and a bag of samples nobody has a use for yet.`, fx: { survey: 10 }, go: (s, a, frac, chips) => visit(s, a, frac, chips) },
  survey:  { t: (a, s) => `They walked ${a.to} for two months with stakes and a chain, and came home with the country drawn out a ring further than anyone had been.`, fx: { survey: 20 }, go: (s, a, frac) => LF.surveyFind ? LF.surveyFind(s, a, frac) : '' },
  recalled:{ t: (a, s) => `They turned round when the signals room called them, and came home with nothing but the miles.`, fx: { survey: 6 } },
  // a long party's own failures (T2-5): no place at the end of it
  astray:  { t: (a, s) => `${cap1(a.to)} was not where the reading put it. They quartered the ground for weeks and found nothing there, and came home with the country mapped instead.`, fx: { survey: 25 } },
};
/* A place to live one day: a spring or a ridge marks a settlement site (js/settlements.js LF.canSettle reads s.flags.stl_site). */
function site(s, a, frac) { if (frac < 0.6) return ''; s.flags.stl_site = (s.flags.stl_site || 0) + 1; s.flags.stl_sites = (s.flags.stl_sites || []).concat(a.to).slice(-6); return ''; }
/* A camp or a signal: contact with whoever made it, if the colony knows of them (fops on the factor). */
function contact(s, a, frac, chips, kinds) { if (a.fid) return '';
  const f = s.factors.find(x => kinds.includes(x.kind) && !x.res && x.stage > 0) || s.factors.find(x => kinds.includes(x.kind) && !x.res);
  if (!f) return ''; if (f.stage === 0) { f.stage = 1; f.onset = s.day; }
  LF.apply(s, { fops: [{ id: f.id, insight: Math.round(18 * frac), accord: Math.round(6 * frac) }] }, chips, {});
  return ` The crews are sure now that it was ${f.name}.`; }
/* A growth or a herd: something learned of what lives here (insight on the factor of that kind, if there is one). */
function study(s, a, frac, chips, kind) { if (a.fid) return ''; const f = s.factors.find(x => x.kind === kind && !x.res && x.stage > 0); if (!f) return '';
  LF.apply(s, { fops: [{ id: f.id, insight: Math.round(15 * frac) }] }, chips, {}); return ''; }
/* A thread's place resolves through the thread: visit(s, t, a) gave { text, fx } before the return (orders.js LF.threadVisit, kept on a.vis). */
function visit(s, a, frac, chips) { const v = a.vis; if (!v) return '';
  if (v.fx) LF.apply(s, typeof v.fx === 'function' ? v.fx(s) : v.fx, chips, {});
  return typeof v.text === 'function' ? v.text(s) : v.text; }
const CHANGED = {
  ruin: 'They finish each other\'s sentences now. Two of them have started building something behind the workshop and will not say what it is.',
  natives: 'They have come home with new habits: a way of sitting, a word they use only among themselves.',
  flora: 'They sleep outdoors now, on bare ground, and wake all at the same moment.',
  mystery: 'They agree on every detail of what they saw. Nobody else can make the details fit together.',
};
/* Which view a generated card belongs to. Things out there are the world; diseases are the colony's own; anyone
   who can talk back (natives, other humans, a faction) is the people, once they have been met. */
const KIND_VIEW = { fauna: 'world', flora: 'world', ruin: 'world', land: 'world', plague: 'colony', natives: 'people', humans: 'people', faction: 'people' };
LF.frameView = (fr, f) => fr.view || (fr.stage === 1 && (f.kind === 'natives' || f.kind === 'humans') ? 'world' : KIND_VIEW[f.kind]);
LF.sendAway = function (s, a, chip) {
  const e = Object.assign({ id: 'a' + (++s.awayN), left: s.day, due: s.day + a.days }, a);
  const L = leaderOf(s, e); if (L) L.away = true;
  for (const p of members(s, e)) p.away = true;
  if (e.with && e.with.length) LF.log(s, `${members(s, e).map(p => p.name).join(' and ')} ${e.with.length > 1 ? 'go' : 'goes'} with the party.`);
  s.away.push(e); chip && chip(`${a.n} people away, about ${LF.monthsWord(a.days / LF.MONTH)}`, false);
  if (!a.order) LF.log(s, `A party of ${num(a.n)} sets out for ${a.to}.`);   // an order logs its own line (orders.js)
};
LF.awayOp = function (s, o, chip) {
  const i = s.away.findIndex(a => a.id === o.id); if (i < 0) return; const a = s.away[i];
  if (o.op === 'lost') { const n0 = a.n; casualties(s, a, a.n, null, null, true); home(s, a); chip && chip(`${n0} declared lost`, false);
    LF.chron(s, `A party of ${num(a.n)} sent to ${a.to} never came back.`); LF.storyPoint(s); }
  else if (o.op === 'wait') { a.silent = true; a.due = s.day + ri(s, 50, 120); a.fate = rand(s) < 0.45 ? 'late' : 'never'; }
  else if (o.op === 'search') { a.silent = true; a.due = s.day + 400; a.fate = 'searching'; }
};
function card(s, title, tone, text, chips, choices, scene, ask) {
  LF.notice(s, text);
  s.cur = { gen: true, away: true, side: true, attach: [], id: 'away', fid: null, view: 'world', title, tone, text: choices ? text : '', choices: choices || [], phase: choices ? 'choose' : 'result',
    result: choices ? null : { label: '', text, chips, remember: false } };
  if (ask && choices) s.cur.ask = ask;
  if (scene) s.cur.scene = scene;   // a return card with a picture of its own (T2-5: a wreck opened, a lost pod, a ridge, an empty camp, a thread's place)
  s.dilemmas++; s.lastTone = tone; LF.log(s, title + '.', 'event');
}
function reward(s, a, frac, chips) {
  if (members(s, a).some(p => p.perks.some(k => LF.PERKS[k].reward))) frac *= 1.25;
  if (a.size === 'small') frac *= 0.75; else if (a.size === 'large') frac *= 1.15;   // the player's own parties (orders.js): a small one finds less
  const R = REWARD[a.ret] || REWARD.mystery, fx = Object.assign({}, typeof R.fx === 'function' ? R.fx(s, a) : R.fx), f = a.fid && s.factors.find(x => x.id === a.fid);
  for (const k of ['parts', 'mat', 'food', 'survey', 'pop']) if (fx[k]) fx[k] = Math.round(fx[k] * frac);
  if (frac < 1 && a.ret !== 'ore') { delete fx.flags; if (fx.yield) fx.yield = 0.03; }   // a body of ore found is found, however the walk home went
  if (fx.mend) { const ids = Object.keys(s.machines).filter(k => LF.down(s, k)).sort((x, y) => s.machines[x].hp - s.machines[y].hp);
    if (ids.length && frac >= 1) { fx.machine = { [ids[0]]: fx.mend }; fx.cap = { [ids[0]]: 10 }; } delete fx.mend; }
  if (f && R.f) { const o = { id: f.id }; for (const k in R.f) o[k] = Math.round(R.f[k] * frac); fx.fops = [o]; }
  let t = R.t(a, s);
  if (R.go) { const x = R.go(s, a, frac, chips); if (x) t = x.charAt(0) === ' ' ? t + x : x; }   // a place's own find (T2-5): a site pegged out, contact, a survey's finds (appended, from a space), a thread's visit (in place of the text)
  if (a.ret === 'mystery') { const h = s.factors.find(x => x.stage === 0 && LF.KINDS[x.kind]);
    if (h) { h.onset = s.day; h.insight += 20; t = `They found what they were sent to find, and it is bad news: ${h.name}, seen clearly for the first time.`; } else t = 'They found what it was: burning marsh gas. They mapped a good stretch of ground on the way.'; }
  LF.apply(s, fx, chips, {});
  return t;
}
function sicken(s, a, chips) { // what they carried home
  let f = s.factors.find(x => x.kind === 'plague' && !x.res);
  if (f) { f.threat = clamp(f.threat + 25, 0, 100); if (f.stage < 2) f.stage = 2; }
  else { f = LF.makeFactor(s, LF.ARCHETYPES[s.world.type], 'plague', 2, false, s.factors.map(x => x.name)); f.id = 'f' + s.factors.length; f.onset = s.day; f.stage = 1; f.threat = 40; s.factors.push(f); }
  chips.push({ t: `${f.Name} is in the colony`, good: false });
  return f;
}
const RET_PERK = { ruin: 'scavenger', salvage: 'scavenger', ore: 'scavenger', timber: 'scavenger', wax: 'scavenger', salt: 'scavenger', pod: 'pathfinder', natives: 'speaker', humans: 'speaker', reach: 'speaker', drummers: 'speaker',
  fauna: 'observer', flora: 'observer', bones: 'observer', herd: 'observer', plague: 'medic' };
const STRANGER = {
  natives: [a => `There is one more of them than left. It walks at the back, carries nothing, and looks at everything. The party thinks it is an envoy, or possibly a hostage, given freely.`, { accord: 18, insight: 15 }, 0],
  humans:  [a => `There is one more of them than left: a young man from the other side, who says he will not go back, and has brought his own tools.`, { insight: 20 }, 1],
  reach:   [a => `There is one more of them than left: a girl of the Reach, perhaps fifteen, who followed them for three days before she let herself be seen.`, null, 1],
  other:   [a => `There is one more of them than left: a human child, perhaps nine years old, found alone at a dead campfire. The child eats and sleeps, and will not say where the others are.`, null, 1],
};
/* What comes back, rolled: the return table, weighted by the danger, the size, who leads and who went. The player's own
   parties roll it a month early (orders.js), so a return that needs a card keeps its outcome while it waits for one. */
LF.awayRoll = function (s, a) { const W = LF.awayWeights(s, a);
  let r = rand(s) * Object.values(W).reduce((x, y) => x + y, 0), out = 'success';
  for (const k in W) { r -= W[k]; if (r <= 0) { out = k; break; } }
  return out;
};
/* The return table's weights, without the roll: the UI shows a party as a roll from these (Lachlan, 2026-11-21). */
LF.awayWeights = function (s, a) {
  const f = a.fid && s.factors.find(x => x.id === a.fid), big = a.n >= 6, d = a.danger;
  const ins = f ? f.insight : s.survey / 4, L = leaderOf(s, a), met = ['natives', 'humans', 'reach', 'drummers'].includes(a.ret);
  const W = { triumph: Math.max(2, 10 + (big ? 5 : 0) + ins / 6 - d * 1.5), success: Math.max(6, 32 - d * 2 + (big ? 6 : 0)), partial: 10 + d * 3.5,
    changed: (4 + d * 1.5) * (['ruin', 'flora', 'natives', 'mystery'].includes(a.ret) ? 1.6 : 0.5), diseased: (3 + d) * (['plague', 'flora', 'fauna', 'natives', 'soil'].includes(a.ret) ? 1.6 : 0.6),
    stayed: a.n >= 3 ? (['natives', 'humans', 'reach', 'soil', 'springs', 'ruin'].includes(a.ret) ? 5 : 1.5) : 0,
    stranger: met ? 5 : ['mystery', 'salvage', 'springs'].includes(a.ret) ? 2.5 : 0,
    followed: ['fauna', 'natives', 'humans', 'ruin', 'mystery', 'drummers', 'reach'].includes(a.ret) ? 2 + d * 1.2 : 0,
    silence: Math.max(2, 4 + d * 4 - (big ? 5 : 0) - ins / 10) };
  if (a.far === 'long') Object.assign(W, { weather: 5 + d * 1.5, short: 7, astray: a.ret === 'thread' ? 0 : 5 });   // a long way out: what the near ones cannot meet (T2-5)
  if (a.ret === 'survey' || a.ret === 'recalled') { W.stranger = 0; W.stayed = 0; W.followed *= 0.5; }
  if (a.size === 'small' || a.size === 'survey') { W.partial *= 0.6; W.silence *= 0.6; W.diseased *= 0.7; }   // a small party: quicker and safer (orders.js)
  if (L) for (const m of [(LEAD[L.role] || { w: {} }).w, TRAIT_W[L.trait] || {}]) for (const k in m) if (W[k]) W[k] *= m[k];   // a leader who has lost the office out there leads as anyone would
  for (const p of members(s, a)) for (const pk of p.perks) { const m = LF.PERKS[pk].w || {}; for (const k in m) if (W[k]) W[k] *= m[k]; }
  if (s.flags.returned && W.silence) W.silence *= 0.8;          // the returned know something about coming back
  if (LF.has(s, 'comms') && W.silence) W.silence *= 0.5;      // the signals room: a party in trouble can call in
  return W;
};
/* The returns in which somebody does not come home: the chance shown on a party's option is everything else. */
LF.AWAY_LOSS = ['silence', 'partial', 'weather', 'stayed', 'late'];
LF.awayHome = function (s, a) { const W = LF.awayWeights(s, a), all = Object.values(W).reduce((x, y) => x + y, 0);
  const lost = LF.AWAY_LOSS.reduce((x, k) => x + (W[k] || 0), 0);
  return all ? Math.max(5, Math.min(95, Math.round(100 * (1 - lost / all) / 5) * 5)) : 50; };
/* Returns that need nobody to decide anything: everyone home, with what was expected or more, or a long party's lesser
   failures with nobody lost. A player's party that comes back so is a Meanwhile line, not a card (orders.js). */
LF.AWAY_QUIET = ['triumph', 'success', 'short', 'astray'];
LF.awayReturn = function (s, a, forced) {
  const f = a.fid && s.factors.find(x => x.id === a.fid), chips = [], d = a.danger;
  const L = leaderOf(s, a), met = ['natives', 'humans', 'reach', 'drummers'].includes(a.ret);
  const out = forced || LF.awayRoll(s, a);
  const months = Math.max(1, Math.round((s.day - a.left) / LF.MONTH));
  if (out === 'silence') {
    const need = Math.min(6, Math.max(3, Math.round(a.n / 2)));
    return card(s, `${months} Months, No Word`, 'pressure', `The party of ${num(a.n)} sent to ${a.to}${L ? `, under ${L.name},` : ''} was due back. The watch has had a lamp on the ridge every night for a month. Nobody has come up the trail.${LF.has(s, 'comms') ? ' The signals room has called them on the hour, every hour, and got nothing back.' : ''}`, null, [
      { ap: null, v: ['bold', 'mercy'], label: `Send ${num(need)} more to look for them`, note: 'They might find survivors, or the same trouble the first party found.', hint: 'unknown', lock: LF.hands(s) - need < 18 ? `Needs ${need} people to spare` : '',
        send: { n: need, months: 1, danger: Math.min(5, d + 1) }, cost: { food: need * 15 }, out: { text: `${cap1(num(need))} volunteers leave at first light, following the same trail.`, fx: { awayOp: { id: a.id, op: 'search' }, away: { n: need, days: ri(s, 25, 45), danger: Math.min(5, d + 1), to: a.to, ret: 'search', fid: a.fid, seek: a.id } } } },
      { ap: null, v: ['cautious'], label: 'Keep the lamp lit and wait', note: 'They may only be late, but the waiting wears on people.', hint: 'unknown', lock: '', out: { text: 'The lamp stays on the ridge. People glance up at it on their way to shift, fewer of them each month.', fx: { awayOp: { id: a.id, op: 'wait' }, morale: -2 } } },
      { ap: null, v: ['severe'], label: 'Declare them lost', note: 'Their names go on the wall, and the colony can start to grieve.', hint: 'bad', lock: '', out: { text: `${cap1(num(a.n))} names are cut into the wall. Their bunks are reassigned by the end of the month.`, fx: { awayOp: { id: a.id, op: 'lost' }, morale: -4 } } },
    ], null, 'Do you send more out after the lost party, keep waiting for them, or declare them lost?');
  }
  let text, title = 'The Party Returns', tone = 'quiet';
  const led = (alive, dead) => L ? ' ' + (L.alive ? alive : dead).replace('{L}', L.name).replace(/\{L\}/g, L.first || L.name) : '';   // the full name once, then the first name
  if (out === 'triumph') { title = 'They Found It'; tone = 'opportunity'; text = `All ${num(a.n)} walk back in after ${months} month${months > 1 ? 's' : ''}, ${LF.lex(s, 'burnt')} and grinning like thieves.${led('{L} is carrying the heaviest pack.', '')} ${reward(s, a, 1.4, chips)}`; }
  else if (out === 'success') text = `${a.order && a.ret !== 'recalled' ? 'They are back' : `The party sent to ${a.to} is back`}: footsore, thinner, and all accounted for.${led('{L} reports before washing.', '')} ${reward(s, a, 1, chips)}`;
  else if (out === 'partial') { const n0 = a.n, k = Math.max(1, Math.min(a.n - 1, Math.round(a.n * (a.order ? 0.15 + rand(s) * 0.3 : 0.25 + rand(s) * 0.45)))); casualties(s, a, k, chips, f, !!L && rand(s) < 0.35);   // the player's own parties are provisioned and planned for it: fewer lost
    title = 'Not All of Them'; tone = 'pressure'; text = `${cap1(num(a.n))} of the ${num(n0)} come back. They do not all tell the same story about the others.${led('{L} brought them home, though not everyone is grateful.', '{L} is not among them. The last anyone saw, {L} had turned back for a straggler.')} ${reward(s, a, 0.5, chips)}`; }
  else if (out === 'changed') { title = 'Back, and Different'; tone = 'pressure'; text = `They come back on the day they said they would, every one of them, and they are not quite the people who left. ${CHANGED[a.ret] || 'They will not talk about it. They work and eat as before, and at night they sit facing the way they came.'} ${reward(s, a, 0.7, chips)}`;
    if (L && !L.marks.touched) L.marks.touched = { d: s.day, txt: `led the party to ${a.to} and came back changed` };
    s.flags.returned = (s.flags.returned || 0) + a.n; s.flags.returned_day = s.day; s.flags.returned_to = a.to; if (L) s.flags.returned_lead = L.id;
    s.morale = clamp(s.morale - 4, 0, 100); chips.push({ t: '−4 morale', good: false }); LF.chron(s, `The party sent to ${a.to} came back changed.`); }
  else if (out === 'diseased') { const pf = sicken(s, a, chips); title = 'What They Carried Home'; tone = 'pressure'; text = `They come back early, and slowly. Two are being carried. Whatever they met out there, they have brought some of it home, and within the month the crews have a name for it: ${pf.Name}. ${reward(s, a, 0.5, chips)}`; }
  else if (out === 'stayed') { title = 'One Stayed'; a.n--; s.pop--; chips.push({ t: 'One stays behind, by choice', good: false });
    text = `They are all alive, but one of them did not come back. ${met ? 'One of the party asked to stay among them, was allowed to, and sent back a letter and a pair of boots.' : `One of the party looked at ${a.to} and said, quite calmly, that this was far enough. There is a hut there now, and a garden started.`} ${reward(s, a, 1, chips)}`;
    s.flags.stayed = s.day; s.flags.stayed_at = a.to; if (f && met) LF.apply(s, { fops: [{ id: f.id, accord: 10 }] }, chips, {}); LF.chron(s, `One of the party sent to ${a.to} chose not to come home.`); }
  else if (out === 'stranger') { const S = STRANGER[a.ret] || STRANGER.other; title = 'One More Than Left'; tone = 'opportunity';
    text = `The party sent to ${a.to} is back, all of them. ${S[0](a)} ${reward(s, a, 1, chips)}`;
    if (S[2]) { s.pop++; chips.push({ t: '+1 colonist', good: true }); } if (S[1] && f) LF.apply(s, { fops: [Object.assign({ id: f.id }, S[1])] }, chips, {});
    s.flags.stranger = s.day; LF.chron(s, `The party sent to ${a.to} came home with a stranger.`); }
  else if (out === 'followed') { title = 'Followed Home'; tone = 'pressure';
    text = `They are all back, and something followed them: the watch found tracks laid over the party's own, an hour behind them, all the way to the wire. ${reward(s, a, 0.9, chips)}`;
    const h = f && !f.res ? f : s.factors.find(x => x.stage === 0 && LF.KINDS[x.kind]);
    if (h) { if (h.stage === 0) h.onset = Math.min(h.onset, s.day); LF.apply(s, { fops: [{ id: h.id, threat: 18 }] }, chips, {}); if (h.stage > 0) text += ` ${h.Name} know${(LF.KINDS[h.kind] || {}).mass ? 's' : ''} the way here now.`; }
    else { s.morale = clamp(s.morale - 3, 0, 100); chips.push({ t: '−3 morale', good: false }); } }
  else if (out === 'weather') { const n0 = a.n, k = Math.max(1, Math.min(a.n - 1, Math.round(a.n * (0.12 + rand(s) * 0.2)))); casualties(s, a, k, chips, f, !!L && rand(s) < 0.2);
    title = 'The Weather Turned'; tone = 'pressure'; text = `The weather turned on them on the way out, far past the last marker, and stayed turned for a week. ${cap1(num(a.n))} of the ${num(n0)} walked back in.${led('{L} brought them home.', '{L} did not come back. The others buried {L} under stones where the wind had dropped.')} ${reward(s, a, 0.6, chips)}`; }
  else if (out === 'short') { const k = Math.max(1, Math.round(a.n / 3));
    title = 'A Leg Short'; text = `The food ran out a leg short of ${a.to}. ${cap1(num(k))} of them turned back with the empty packs and came in thin, a month before the rest; the others went on with what was left.${led('{L} went on with them.', '')} ${reward(s, a, 0.7, chips)}`; }
  else if (out === 'astray') { a.ret = 'astray'; title = 'Not Where It Was'; text = reward(s, a, 1, chips); }
  else if (out === 'late') { const n0 = a.n, k = Math.min(a.n - 1, Math.round(a.n * rand(s) * 0.6)); if (k > 0) casualties(s, a, k, chips, f, false);
    title = 'A Light on the Trail'; tone = 'opportunity'; text = `The lamp on the ridge had been out for months when the night watch saw a light coming up the trail. ${cap1(num(a.n))} of the ${num(n0)} had come back, ${months} months gone and long since mourned.${led('{L} is at the front, carrying the light.', '')} ${reward(s, a, 1.2, chips)}`;
    s.morale = clamp(s.morale + 6, 0, 100); chips.push({ t: '+6 morale', good: true }); LF.chron(s, `A party given up for dead walked home after ${months} months.`); }
  // Coming back from something is how most people get known. Those who went by name are first in line.
  const who = () => { const m = members(s, a); return m.length ? pick(s, m) : null; }, RP = RET_PERK[a.ret] || 'pathfinder', mo = `${months} month${months > 1 ? 's' : ''}`;
  if (out === 'triumph') LF.deed(s, who(), `came back from ${a.to} with more than anyone had hoped for`, RP, chips);
  else if (out === 'success') { const w = who(); if (w ? rand(s) < 0.5 : rand(s) < 0.4) LF.deed(s, w, `brought the party home from ${a.to}`, RP, chips); }
  else if (out === 'partial') { if (rand(s) < 0.7) LF.deed(s, who(), `walked home from ${a.to} when others did not`, 'survivor', chips); }
  else if (out === 'late') LF.deed(s, who(), `walked out of ${a.to} after ${mo}, long since mourned`, 'pathfinder', chips);
  else if (out === 'changed') { if (rand(s) < 0.6) LF.deed(s, who(), `came back from ${a.to} changed`, 'touched', chips); }
  // Whoever went by name comes home knowing the country better; a party that came back changed, far more so, and less themselves.
  if (LF.shift) for (const p of [L].concat(members(s, a)).filter(Boolean)) { LF.shift(s, p, 'native', out === 'changed' ? 20 : out === 'triumph' ? 12 : 8, chips); if (out === 'changed') LF.shift(s, p, 'mind', -12, chips); else if (out === 'partial') { LF.shift(s, p, 'mind', -6, chips); LF.shift(s, p, 'body', -8, chips); } }
  else if (out === 'diseased') { if (rand(s) < 0.5) LF.deed(s, who(), `nursed the party home from ${a.to}`, 'medic', chips); }
  else if (out === 'followed') { if (rand(s) < 0.4) LF.deed(s, who(), `was the one who saw what followed the party home from ${a.to}`, 'observer', chips); }
  else if (out === 'stranger' && (STRANGER[a.ret] || STRANGER.other)[2]) LF.deed(s, null, `came in with the party from ${a.to}, a stranger`, 'guide', chips);
  chips.push({ t: `${a.n} return to work`, good: true });
  home(s, a);
  if (a.vis && a.vis.title && (out === 'success' || out === 'triumph')) { title = a.vis.title; tone = a.vis.tone || 'pressure'; }
  if (a.quiet) { LF.log(s, `${title}. ${text.trim()} (${chips.map(c => c.t).join(', ')})`, 'good'); return; }   // a player's party home with nothing to decide: a Meanwhile line
  card(s, title, tone, text, chips, null, (a.vis && a.vis.scene) || a.scene);
};
function searchReturn(s, a) {
  const lost = s.away.find(x => x.id === a.seek), chips = [], rm = x => home(s, x);
  const r = rand(s); let text, title;
  const dead = (x, k) => casualties(s, x, k, chips, null, false);
  if (!lost) { text = 'The searchers come back. There was nothing to find.'; title = 'The Search Returns'; }
  else if (r < 0.35) { const k = Math.max(1, Math.round(lost.n * (0.3 + rand(s) * 0.4))); dead(lost, lost.n - k); title = 'Found Alive';
    text = `The searchers found them: ${num(k)} still living, holed up, rationing the last of the water. They had found what they went for and could not carry it out alone. ${reward(s, lost, 0.8, chips)}`; LF.deed(s, members(s, a)[0] || null, `found the lost party at ${a.to} and brought them in`, 'pathfinder', chips); s.morale = clamp(s.morale + 5, 0, 100); chips.push({ t: `${k + a.n} return to work`, good: true }); }
  else if (r < 0.7) { dead(lost, lost.n); title = 'What the Searchers Found'; text = `The searchers found the camp, and then the party. They buried them where they lay and brought back their tags and their notes, which are full of useful detail.`; if (lost.fid) LF.apply(s, { fops: [{ id: lost.fid, insight: 20 }] }, chips, {}); chips.push({ t: `${a.n} return to work`, good: true }); }
  else if (r < 0.85) { title = 'The Search Returns'; text = `The trail ran out on bare rock. The searchers quartered the ground for a month and found a single glove, then came home. Nobody knows whether the others are still alive.`; lost.fate = rand(s) < 0.3 ? 'late' : 'never'; lost.due = s.day + ri(s, 40, 100); chips.push({ t: `${a.n} return to work`, good: true }); rm(a); return card(s, title, 'pressure', text, chips); }
  else { dead(lost, lost.n); const k = Math.max(1, Math.round(a.n / 2)); dead(a, k); title = 'Two Parties'; text = `${cap1(num(a.n))} of the searchers make it home. Whatever took the first party was still there.`; chips.push({ t: `${a.n} return to work`, good: true }); }
  if (lost) rm(lost); rm(a);
  card(s, title, r < 0.35 ? 'opportunity' : 'pressure', text, chips);
}
LF.awayTick = function (s) {
  for (const a of s.away) {
    if (s.day < a.due) continue;
    if (a.ret === 'search') { searchReturn(s, a); return true; }
    if (a.fate === 'searching') { a.due = s.day + 400; continue; }
    if (a.fate === 'never') { LF.awayOp(s, { id: a.id, op: 'lost' }); LF.log(s, `The lamp on the ridge is taken down. The party sent to ${a.to} is entered as lost.`, 'bad'); s.morale = clamp(s.morale - 3, 0, 100); return false; }
    LF.awayReturn(s, a, a.fate === 'late' ? 'late' : null); return true;
  }
  return false;
};
})();
