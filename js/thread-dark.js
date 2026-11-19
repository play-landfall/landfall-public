/* Landfall — thread: the Dark. A Turn: the world's rules change once (STORY-PLAN.md §1).
   The star dims for a season or more. Rolled in secret: when, for how long, and why (a cycle of the star, a
   companion that eclipses it, a cloud the system is passing through). While it lasts it writes dark, cold and
   confinement, cuts the fields to a third, and every other thread that reads those conditions changes with it. */
(function () {
'use strict';
const { clamp, h } = LF; const { N, Nc, R, M, If, byPid } = h;
const TH = LF.th, T = s => LF.T(s, 'dark'), ID = 'dark';
const CAUSE = {
  cycle:   { why: 'The star does this. Every few decades its output falls by a third, holds, and comes back', again: true },
  eclipse: { why: 'There is a companion: a dark body on a long orbit, and for a season of that orbit it stands between this world and its sun', again: true },
  cloud:   { why: 'The whole system is passing through a lane of dust. It has never done so before in the record, and will not again for thousands of years', again: false },
};
const left = (s, t) => Math.max(0, t.at + t.len - s.day), until = (s, t) => Math.max(0, t.at - s.day);
const months = d => { const m = Math.max(1, Math.round(d / 10)); return m === 1 ? 'a month' : `${TH.num(m)} months`; };
function learn(s, t, v) { t.insight = clamp(t.insight + v, 0, 100);
  if (t.insight >= 30 && !t.known.coming) { t.known.coming = s.day; LF.log(s, `The dimming is the star itself, and it is getting worse.`, 'bad'); }
  if (t.insight >= 55 && !t.known.length) { t.known.length = s.day; LF.log(s, `${N(s, 'pilot')} has a figure: about ${months(t.len)} of it, beginning in ${months(until(s, t))}.`); }
  if (t.insight >= 75 && !t.known.cause) { t.known.cause = s.day; LF.log(s, `${CAUSE[t.truth.cause].why}.`); } }

LF.thread({ id: ID, name: 'The Dark', view: 'colony', turn: true,
  clue: (s, t) => ({ txt: 'The last pages are a count of days without a sun. The count is kept carefully, in a steady hand, to a figure nobody in the room wants to say aloud. Near the end the handwriting changes, and a few pages later the count breaks off.', learn: s2 => learn(s2, T(s2), 40) }),
  called: (s, t) => t.known.coming || ['dark', 'after'].includes(t.phase) ? 'the dimming of the star' : null,
  fits: s => (s.world.climate === 'winter' ? 0.3 : 0.55),   // a long-winter world already has its dark season; two would be one story told twice
  roll: s => ({ cause: LF.spick(s, Object.keys(CAUSE)) }),
  sig: t => t.truth.cause,
  start: (s, t) => { Object.assign(t, { at: LF.sri(s, 330, 540), len: LF.sri(s, 80, 140), insight: 0, known: {}, prep: {} }); },
  tick: (s, t) => {
    if (t.end) return;
    if (t.phase === 'latent') { if (s.day >= t.at - 220) { LF.phase(s, ID, 'omen'); s.signs.push({ id: 'crop_fail', d: s.day, src: 'th.dark' }, { id: 'lights', d: s.day, src: 'th.dark' }); LF.cue(s, 'drk.minutes', 3, 20); } return; }
    if (t.phase === 'omen' && (s.day >= t.at - 60)) { LF.phase(s, ID, 'before'); LF.cue(s, 'drk.number', 1, 8); LF.cue(s, 'drk.told', 24, 45); if (!t.known.coming) learn(s, t, 30 - t.insight); }
    if (t.phase === 'before' && s.day >= t.at) { LF.phase(s, ID, 'dark', `The sun dimmed over ${s.world.planet} and stayed dim.`); LF.cue(s, 'drk.noon', 0); s.tension = clamp(s.tension + 15, 0, 100); }
    if (t.phase === 'dark') {
      const snug = !!(s.built.shelter || s.built.housing);
      if (s.day % 5 === 0) {
        LF.emit(s, 'dark', 'th.dark', 85, 8, 'the star has dimmed');
        LF.emit(s, 'cold', 'th.dark', (snug ? 40 : 62) - (t.prep.heat ? 15 : 0), 8, 'the long dark has taken the heat with it');
        LF.emit(s, 'confinement', 'th.dark', (snug ? 35 : 50) - (t.prep.heat ? 8 : 0), 8, 'the dark and the cold keep everyone indoors');
        if (!t.told && t.known.length) LF.emit(s, 'suspicion', 'th.dark', 25, 8, 'the officers knew how long it would last and did not say');
      }
      s.morale = clamp(s.morale - (t.prep.heat ? 0 : 0.01), 0, 100);
      if (s.day >= t.at + t.len) { t.dead0 = s.deaths - (t.deaths0 || 0); LF.endThread(s, ID, 'endured', `After ${months(t.len)} the light came back.`); LF.emit(s, 'hope', 'th.dark', 55, 220, 'the light came back'); s.yieldBonus += 0.05; /* ground that has rested comes back strong */ LF.cue(s, 'drk.dawn', 2, 10); }
    }
  },
  light: (s, t) => t.phase === 'dark' ? (t.prep.lamps ? 0.8 : 0.6) : t.phase === 'before' ? 0.9 : 1,
  press: (s, t, P) => { if (t.phase === 'dark') { P.wear *= 1.06; P.labor -= t.prep.heat ? 0.01 : 0.04; } },
});
const B = (ph, st) => LF.beat(ID, ph, st);

/* ======================= OMEN ======================= */
B('omen', { id: 'drk.minutes', chain: true, tone: 'pressure', title: 'Two Percent',
  text: s => `${Nc(s, 'pilot')} has been keeping the old habit of a noon sight, for something to do. The panels agree with the sextant: the sun is giving two percent less than it did at landfall. Last month it was one.\n\n[[pilot]] "Two percent. I've checked the glass three times, and it isn't the glass. Dust is all I've got left."`,
  choices: [
    { label: 'Put every instrument we have on it', test: { base: 50, mods: [R('geologist', 10), R('pilot', 5), If(s => !!(s.cargo && s.cargo.drones), 10, 'The survey drones')] },
      ok: { text: 'A month of readings, taken by people who should have been in the fields, gives a smooth curve. It bends the wrong way.', fx: s => ({ food: -50, do: s2 => learn(s2, T(s2), 40) }) },
      bad: { text: 'A month of readings, taken by people who should have been in the fields, ends in an argument about calibration that is still going.', fx: s => ({ food: -50, morale: -1, do: s2 => learn(s2, T(s2), 15) }) } },
    { label: 'Ask the archive what stars like this one do', show: s => !!(s.cargo && s.cargo.archive),
      out: { text: s => `It takes ${N(s, 'teacher')} four nights, with the school shut and the archive screen dark for all of them. There is a class of star in the old catalogues with a note against it, and this one is in the class.`, fx: s => ({ morale: -1, do: s2 => learn(s2, T(s2), 55) }) } },
    { label: 'Keep taking the sight, and tell the crews it is the instrument', dark: true, note: 'Nobody loses a day of work to a number that may be nothing. They are told something you do not believe.', out: { text: s => `${Nc(s, 'pilot')} goes on shooting the sun at noon, and writing the number in a book that stays in a pocket. The field crews are told the panels need cleaning. They have noticed the wheat leaning all the same.`, fx: s => ({ stain: ['kept_quiet', 1], do: s2 => { learn(s2, T(s2), 18); LF.emit(s2, 'suspicion', 'drk.quiet', 25, 120, 'the pilot is measuring something and will not say what'); } }) } },
  ] });
B('omen', { id: 'drk.before', x: true, tone: 'opportunity', title: 'It Has Happened Before',
  when: (s, t) => s.day - t.since > 30,
  setup: s => { const f = s.factors.find(x => ['natives', 'ruin'].includes(x.kind) && x.stage >= 1 && !x.res); return f ? { fid: f.id, what: f.name, What: f.Name, kind: f.kind, why: `${f.name} ${f.kind === 'ruin' ? 'was' : 'are'} ready for a dark the colony has not seen yet` } : { why: 'the lake bed keeps a record of the last time' }; },
  text: (s, c) => c.kind === 'natives' ? `${Nc(s, 'xenobio')} has been counting what ${c.what} keep in store, and it makes no sense: three or four years of food, sealed and buried, for a people who lose nothing to winter.\n\n[[xenobio]] "Four years of food, sealed up and buried, and who does that, you only do that if it's happened to you before, so either they remember something or somebody told them, and I'd give a great deal to know which."`
    : c.kind === 'ruin' ? `${Nc(s, 'geologist')} has finally made sense of one thing about ${c.what}. Everything in it that needed light was built to do without it for a long time.\n\n[[geologist]] "It all runs dark, every bit of it, whoever built this knew the sun goes away and just planned for it, like weather, and I'd love to meet them and ask how they knew."`
    : `${Nc(s, 'geologist')} has a lake-bed core on the bench: a metre of mud, a century a hand-span. Every few hand-spans there is a pale band with nothing living in it.\n\n[[geologist]] "See that band, nothing living in it, and here, and here, everything just stops and then it starts again, every time, and if I can get the spacing right I can tell you when the next one is, which is the part I'm trying very hard not to be excited about."`,
  choices: [
    { label: 'Work out the interval', note: 'A month of the survey team and its crews on nothing else.', test: { base: 50, mods: [R('geologist', 10)] },
      ok: { text: 'It takes a month the fields could have used. The record is unevenly spaced but follows a rough rhythm. The last one was a long time ago, and the next is due.', fx: s => ({ food: -50, do: s2 => learn(s2, T(s2), 35) }) },
      bad: { text: 'It takes a month the fields could have used. There is too little to be sure of anything except that there will be another.', fx: s => ({ food: -50, do: s2 => learn(s2, T(s2), 15) }) } },
    { label: (s, c) => c.kind === 'natives' ? `Ask ${c.what} what they are waiting for` : 'Copy what was done here before', show: (s, c) => !!c.kind,
      out: { text: (s, c) => c.kind === 'natives' ? 'It takes a long time to ask, and longer to be sure of the answer. They point at the sun, and then cover it with a hand.' : 'They built thick walls, dug deep and laid in years of stores. The colony has less of everything they had, but now has a plan to copy.',
        fx: (s, c) => ({ fops: [{ id: c.fid, insight: 10, accord: c.kind === 'natives' ? 8 : 0 }], do: s2 => learn(s2, T(s2), 28) }) } },
    { label: (s, c) => c.kind === 'natives' ? 'Dig up one of their stores at night' : c.kind === 'ruin' ? 'Send the lock-up down into the sealed levels for what was laid by' : 'Note it, and get on', dark: true,
      note: (s, c) => c.kind === 'natives' ? 'Years of food, buried against the thing that is coming for both of you.' : c.kind === 'ruin' ? 'Whatever they stored for the dark is still down there, and so is whatever keeps it.' : 'Nobody comes off the fields for it, and nobody is ready when it comes.',
      out: { text: (s, c) => c.kind === 'natives' ? `A party goes out with spades on a moonless night and comes back with a cart of sealed jars. It is good food, and it keeps. By morning ${c.what} have found the hole.` : c.kind === 'ruin' ? 'Six prisoners go down roped together. Five come up, with crates of something that still burns clean after all this time. They will not say what happened to the sixth.' : 'It goes in the survey log, between an ore assay and a soil report. The crews go on planting for a season that will not come.',
        fx: (s, c) => c.kind === 'natives' ? { food: 260, stain: ['robbed', 1], fops: [{ id: c.fid, accord: -35, threat: 12 }], do: s2 => learn(s2, T(s2), 20) } : c.kind === 'ruin' ? { pop: -1, mat: 45, stain: ['expend', 2], fops: [{ id: c.fid, insight: 10 }], do: s2 => learn(s2, T(s2), 20) } : { food: -40, do: s2 => learn(s2, T(s2), 6) } } },
  ] });

/* ======================= BEFORE ======================= */
B('before', { id: 'drk.number', chain: true, tone: 'crisis', title: 'The Number',
  text: s => { const t = T(s); return t.known.length ? `${Nc(s, 'pilot')} lays it out for the officers. About ${months(until(s, t))} from now the light falls to a third of what it is. It stays there for about ${months(t.len)}. The fields will give almost nothing, and the cold will get indoors.\n\nThere is time to do one thing properly.`
    : `Nobody can say how bad it will be or how long. The noon shadow is fainter every week, the seedlings are leaning, and ${Nc(s, 'botanist')} has stopped planting. It is only months away.\n\nThere is time to do one thing properly.`; },
  choices: [
    { label: 'Fill the stores with everything that can be eaten, dried or salted', note: 'People go hungry now so there is food later.',
      out: { text: 'Every hand that can hold a knife is cutting, drying and packing. People eat less than they are putting away, and watch it stack up.', fx: s => ({ food: 420, morale: -2, rations: 'tight', do: s2 => { T(s2).prep.food = true; } }) } },
    { label: 'Heat: line the pods, bank the walls and lay in fuel', note: 'Nothing extra goes into the bins. People will be warm and hungry.', cost: { mat: 40 }, out: { text: 'Earth is banked against every wall, and the pods are lined with whatever will not burn. It looks terrible, but it keeps the heat in. The bins are no fuller than they were.', fx: s => ({ do: s2 => { T(s2).prep.heat = true; } }) } },
    { label: 'Light: every lamp the colony owns, run off the cryo banks', dark: true, req: s => s.sleepers >= 15, reqText: 'There are not enough sleepers left to take the power from', note: 'The lamps need more than the reactor can spare. Fifteen pods in orbit draw exactly that.', info: [['yield', 'Fields that still grow in the dark'], ['danger', 'Fifteen sleepers']], out: { text: s => `${Nc(s, 'engineer')} strings the grow lamps over two fields and a greenhouse, and has the ship shut down one row of pods to carry the load. From the ridge it looks like a town. The fifteen names go into the log as lost to a power fault.`, fx: s => ({ sleepers: -15, stain: ['cryo_power', 2], do: s2 => { T(s2).prep.lamps = true; } }) } },
    { label: 'Fewer mouths. Decide now who does not go into the dark', dark: true, note: s => `The stores and the heat will not carry ${s.pop} people through it. They would carry nine in ten.`, info: [['yield', 'Food and heat enough for the rest'], ['danger', 'One in ten']],
      out: { text: s => `${Nc(s, 'quartermaster')} draws up the list in an evening: the oldest, the ones the clinic cannot mend, and the ones who have nobody to make trouble for them. They are walked out past the wire with a blanket each while there is still light to walk by. What they would have eaten goes into the sealed bins, and the bins are counted in front of everyone.`,
        fx: s => ({ leave: Math.max(4, Math.round(LF.sized(s) * 0.1)), food: 260, morale: -9, stain: ['cull', 2], do: s2 => { const t = T(s2); t.prep.food = true; t.prep.cull = s2.day; LF.emit(s2, 'fear', 'drk.cull', 40, 200, 'people were put out before the dark so the rest could eat'); },
          chron: 'Before the dark came, one colonist in ten was put out past the wire so that the stores would last the rest.' }) } },
  ] });
B('before', { id: 'drk.told', tone: 'pressure', title: 'How Long',
  when: (s, t) => !!t.known.length && t.told === undefined,
  text: s => `People are going to ask how long. ${Nc(s, 'chaplain')} wants them told the truth, all of it. ${Nc(s, 'security')} wants them told a month at a time.\n\n[[security]] "Tell the whole colony they've got ${months(T(s).len)} of dark coming? Some of them will sit down and never bloody get up."`,
  choices: [
    { label: 'The whole figure, tonight', note: 'Some of them will not get up again after hearing it.', out: { text: 'The mess hall is very quiet. Then somebody asks how many days that is, exactly, and somebody else starts a tally on the wall. One of the oldest goes to a bunk that night and does not leave it again.', fx: s => ({ morale: -2, pop: -1, do: s2 => { T(s2).told = true; LF.emit(s2, 'fear', 'drk.told', 35, 60, 'everyone knows how long the dark will last'); } }) } },
    { label: 'A month at a time, as if that were all of it', dark: true, note: 'It is easier to hear. It is also a lie, and you will have to tell it again each month.', out: { text: 'People can face a month, and they do. In a month you will have to say it again, to the same faces.', fx: s => ({ morale: 2, stain: ['kept_quiet', 1], do: s2 => { T(s2).told = false; } }) } },
  ] });

/* ======================= DARK ======================= */
B('dark', { id: 'drk.noon', chain: true, tone: 'crisis', title: 'Noon',
  text: s => `At midday the sun is a coin, and can be looked at. The shadows have no edges. The birds, or whatever those are, have gone quiet.\n\nPeople have come out of the pods to stand in it. Nobody has gone back to work, and nobody has told them to.`,
  choices: [
    { label: 'Light every lamp, and open the good stores', note: 'It comes out of what was meant to last the dark.', cost: { food: 150 }, out: { text: 'One night with the whole camp lit like a ship. People eat too much and sing badly, and for months afterwards they talk about it.', fx: s => ({ morale: 7, do: s2 => { T(s2).deaths0 = s2.deaths; } }) } },
    { label: 'The rota stands. Anyone still standing there at the bell loses the day\'s ration', dark: true, note: 'Hunger gets people moving when nothing else will.', out: { text: 'The bell rings and most people go. The dozen who do not are sent to their bunks without a bowl. Nobody stands about at noon again.', fx: s => ({ food: 60, morale: -2, stain: ['ration_rota', 1], do: s2 => { T(s2).deaths0 = s2.deaths; } }) } },
    { label: 'Roll-call morning and night, and the watch stops anyone at the wire', dark: true, note: 'Nobody will walk off into it. Everyone will be a prisoner of the roll for as long as it lasts.', out: { text: s => `${Nc(s, 'security')} reads the roll by lamplight twice a day. Every name answers, a little more wearily each week. Two who tried the wire in the first month are kept in the lock-up for the rest of it.`, fx: s => ({ stain: ['curfew', 1], do: s2 => { T(s2).deaths0 = s2.deaths; T(s2).curfew = true; LF.emit(s2, 'confinement', 'drk.curfew', 30, T(s2).len, 'nobody is allowed outside the wire in the dark'); } }) } },
  ] });
B('dark', { id: 'drk.lamps', tone: 'pressure', title: 'The Lamps',
  when: (s, t) => s.day - t.since > 20 && LF.down(s, 'hydroponics'),
  text: s => `The fields have stopped. The hydroponics bay is feeding the colony, as it did in the first month, with ${s.pop} mouths where there were sixty.\n\n[[engineer]] "I can run the lamps round the clock. Gets you another third. The reactor pays for it, though, and then we do."`,
  choices: [
    { label: 'Round the clock', note: 'The reactor is the one thing that cannot be replaced before the light comes back.', out: { text: 'The bay hums all night. The trays are cut every nine days. In the reactor hall a gauge that never used to move has started moving.', fx: { food: 320, machine: { reactor: -12, hydroponics: -8 }, cap: { reactor: -4 } } } },
    { label: 'Hold to the rated cycle, and feed the crews first', dark: true, note: 'There is not enough for everyone. This decides who.', info: [['yield', 'The crews stay on their feet'], ['danger', 'The ones who are fed last']], out: { text: 'The lamps go off at ten. The trays are cut on schedule, and the crews are served before anyone else sits down. By the turn of the month two of the ones who ate last have stopped coming to the table.', fx: { food: 120, morale: -2, pop: -2, stain: ['starved_list', 1] } } },
    { label: 'Light the bay, and dim the pods to do it', note: 'The rooms people live in get even darker.', out: { text: 'The pods go to one lamp each. People learn each other by voice.', fx: s => ({ food: 180, morale: -2, do: s2 => { LF.emit(s2, 'dark', 'drk.dim', 30, 120, 'the pods are down to one lamp'); } }) } },
    { label: 'Feed the trays with the dead', dark: true, show: s => s.deaths >= 3, note: 'The bay is short of nitrogen more than it is short of light, and the burial ground is the only store of it within reach.', info: [['yield', 'Food'], ['danger', 'Morale']],
      out: { text: s => `${Nc(s, 'botanist')} does it at night with two of the bay crew, and logs it as reclaimed feedstock. The trays come up thick and dark green inside a fortnight. Everybody knows by then where the graves went, and everybody eats.`,
        fx: s => ({ food: 380, morale: -5, stain: ['compost', 1], flags: { dead_composted: true }, do: s2 => { LF.emit(s2, 'grief', 'drk.compost', 35, 200, 'the graves were opened to feed the trays'); }, chron: 'In the dark the colony dug up its dead to feed the hydroponics trays.' }) } },
  ] });
B('dark', { id: 'drk.out', x: true, tone: 'crisis', title: 'What the Dark Lets Out',
  when: (s, t) => s.day - t.since > 15 && s.factors.some(f => ['fauna', 'natives', 'humans'].includes(f.kind) && f.stage >= 1 && !f.res),
  setup: s => { const f = s.factors.find(x => ['natives', 'humans'].includes(x.kind) && x.stage >= 1 && !x.res) || s.factors.find(x => x.kind === 'fauna' && x.stage >= 1 && !x.res); return { fid: f.id, what: f.name, What: f.Name, kind: f.kind, why: 'the star has dimmed' }; },
  text: (s, c) => c.kind === 'fauna' ? `${c.What} used to keep to dusk. There is no dusk now, and no dawn, and they have stopped keeping to anything. The watch has seen them inside the outer markers at what the clock says is noon.\n\n[[xenobio]] "They've lost whatever told them when to stop." "And they just don't know any more, which is, isn't that, sorry, no. Yes. It's bad. It's also the most interesting thing I've seen since landfall."`
    : `There are lights at the wire, low, held still. ${c.What}. Forty of them, perhaps, with their young at the front where they can be seen. They have come a long way in the cold and have brought nothing to trade.\n\n${Nc(s, 'security')} has the gate shut and is asking what you want done about it.`,
  choices: [
    { label: (s, c) => c.kind === 'fauna' ? 'Fires on the wire, day and night' : 'Open the gate', cost: { mat: 20 },
      out: { text: (s, c) => c.kind === 'fauna' ? 'A ring of fire a kilometre round, fed in shifts. They come to the edge of the light and stand there, and come no further.' : `They come in, and sit where they are shown, and eat what they are given. Nobody sleeps much. In the morning their young are playing with yours.`,
        fx: (s, c) => c.kind === 'fauna' ? { fops: [{ id: c.fid, threat: -8, wall: 1 }] } : { food: -160, fops: [{ id: c.fid, accord: 32, threat: -15, insight: 12 }], do: s2 => { LF.emit(s2, 'strangers', 'drk.guests', 45, 160, `${c.what} are sheltering inside the wire`); } } } },
    { label: (s, c) => c.kind === 'fauna' ? 'Everyone inside the inner wall' : 'Food over the wire, and the gate stays shut',
      out: { text: (s, c) => c.kind === 'fauna' ? 'The outer works are given up. The colony is a third the size it was, and very crowded.' : 'Sacks go over. They are taken. In the morning the lights are gone, and the sacks are stacked, empty and folded, at the gate.',
        fx: (s, c) => c.kind === 'fauna' ? { fops: [{ id: c.fid, threat: 6 }], do: s2 => { LF.emit(s2, 'confinement', 'drk.inner', 40, 120, 'everyone is living inside the inner wall'); } } : { food: -90, fops: [{ id: c.fid, accord: 12 }] } } },
    { label: (s, c) => c.kind === 'fauna' ? 'Hunt them while they are confused' : 'Send them away, into the cold they came out of', dark: true, test: { base: 50, mods: [R('security', 10), If(s => !!(s.cargo && s.cargo.arms), 10, 'The arms locker')] },
      ok: { text: (s, c) => c.kind === 'fauna' ? 'They do not know which way to run. It is not sport, and it is over in a week.' : 'They go, slowly.', fx: (s, c) => ({ fops: [{ id: c.fid, harm: c.kind === 'fauna' ? 35 : 5, threat: c.kind === 'fauna' ? -20 : 10, accord: -30 }], food: c.kind === 'fauna' ? 150 : 0, stain: c.kind === 'fauna' ? null : ['turned_away', 1] }) },
      bad: { text: (s, c) => c.kind === 'fauna' ? 'The hunters cannot see either, and two of them do not come back.' : 'They do not go. They sit down where they are, in the cold, in sight of the wall, and by morning some of them have not got up.', fx: (s, c) => ({ pop: c.kind === 'fauna' ? -2 : 0, morale: -2, stain: c.kind === 'fauna' ? null : ['turned_away', 2], fops: [{ id: c.fid, accord: -35, threat: 15 }] }) } },
    { label: 'Let in the ones who can work. They earn their place behind wire', dark: true, show: (s, c) => c.kind !== 'fauna', note: 'A dozen pairs of hands that eat half and cannot leave. The old and the young stay outside the gate.', info: [['yield', 'Hands that eat half'], ['danger', 'The ones left at the gate']],
      out: { text: (s, c) => `The gate opens the width of one body. ${Nc(s, 'security')} picks twelve by the look of their shoulders and shuts it on the rest. The twelve are given a pod with a wire round it and the night shift on the fuel detail. The lights outside the gate stay for two days, lower each night, and on the third there are none.`,
        fx: (s, c) => ({ pop: 12, thralls: 12, food: -40, morale: -4, stain: ['bond', 2], fops: [{ id: c.fid, accord: -60, threat: 10, harm: 30, kills: 20 }], do: s2 => { LF.emit(s2, 'strangers', 'drk.guests', 40, 160, `twelve of ${c.what} are held inside the wire to work`); },
          chron: `In the dark, twelve of ${c.what} were taken in as bonded labour, and the rest were left outside the gate.` }) } },
  ] });
B('dark', { id: 'drk.count', tone: 'pressure', title: 'The Long Count',
  when: (s, t) => s.day - t.since > 50,
  text: s => { const t = T(s); return `Day ${s.day - t.at} of it. Someone has been keeping a tally on the mess hall wall, and people have started arguing about whether the tally is right. A few have stopped believing it will end.\n\n[[chaplain]] "Give them a date. Or give them something to do instead, I don't care which. They're lying in my ward staring at the wall."`; },
  choices: [
    { label: 'Publish the date the light comes back', show: s => !!T(s).known.length, out: { text: s => `It goes up on the wall above the tally: ${TH.num(Math.max(1, Math.round(left(s, T(s)) / 10)))} more months, near enough. People cross the days off toward it.`, fx: s => ({ morale: 4, do: s2 => { T(s2).told = true; LF.emit(s2, 'hope', 'drk.date', 40, left(s2, T(s2)), 'there is a date for the light'); } }) } },
    { label: s => `Let ${N(s, 'chaplain')} hold a vigil for the sun`, note: 'What starts as an hour with lamps will not end when the light comes back.', out: { text: 'An hour every evening, with lamps. More come each week, and some of them have started to pray.', fx: s => ({ morale: 3, flags: { vigil: true }, do: s2 => { LF.emit(s2, 'zeal', 'drk.vigil', 45, 300, 'people keep a vigil for the sun'); } }) } },
    { label: 'Take the tally down, and post a date you do not have', dark: true, note: 'People can cross off days toward a date. It does not have to be the right one until it arrives.', out: { text: 'The wall is scrubbed and a date is painted where the tally was. People cross the days off toward it, and work better for it. Nobody has asked yet where the figure came from.', fx: s => ({ morale: 3, stain: ['false_date', 1], do: s2 => { LF.emit(s2, 'resentment', 'drk.tally', 25, 150, 'the tally was scrubbed off the wall'); } }) } },
    { label: 'The next one who says it will not end goes outside to look for the sun', dark: true, note: 'Despair spreads in a closed room faster than anything the clinic treats.', info: [['yield', 'Nobody says it again'], ['danger', 'Whoever says it next']],
      out: { text: s => `It is a field hand who says it, at breakfast, to nobody in particular. ${Nc(s, 'security')} walks the hand to the gate before the bowls are cleared, with a lamp and a day of food. The lamp can be seen from the wall for most of the night. After that the tally is kept in silence, and kept correctly.`,
        fx: s => ({ leave: 1, morale: 2, stain: ['example', 1], do: s2 => { LF.emit(s2, 'fear', 'drk.example', 45, 200, 'someone was put outside in the dark for saying it would not end'); } }) } },
  ] });
B('dark', { id: 'drk.rooms', view: 'people', tone: 'pressure', title: 'Warm Rooms', w: 3.4,
  when: (s, t) => LF.cv(s, 'cold') >= 38 && s.day - t.since > 20,
  text: s => `There is heat for forty people to sleep warm, and there are ${s.pop}. ${Nc(s, 'physician')} has a list of the children and the sick. ${Nc(s, 'engineer')} has a list of the crews who keep the machines alive. The lists do not overlap, and each has more than forty names on it.`,
  choices: [
    { label: 'The children and the sick', note: 'The people who keep the reactor alive sleep cold, and work worse for it.', out: { text: 'The crews sleep cold, in their clothes, and get up and work. Two fingers are lost that month, and the machines are not tended as they were.', fx: { morale: 3, machine: { reactor: -5, reclaimer: -5 } } } },
    { label: 'The crews who keep the machines running', dark: true, note: 'The children and the sick sleep cold so that the reactor does not.', out: { text: 'The machines are kept. The clinic is cold, and the coughs in it go on all night. One of the children is buried before the month is out.', fx: s => ({ morale: -2, pop: -1, machine: { reactor: 4 }, stain: ['triage', 1] }) } },
    { label: 'A lottery, drawn fresh each week', out: { text: 'A hat and slips of paper. Nobody can call it unfair, and nobody likes it. The hat does not know who is sick, and in the third week a child with a cough draws a cold bunk and does not see the fourth.', fx: { morale: -2, pop: -1 } } },
    { label: 'Both lists sleep warm. Everyone on neither goes to the unheated pod', dark: true, note: 'There is room for both lists if the heat is not wasted on people who are on neither.', info: [['yield', 'The machines and the children both kept'], ['danger', 'The old']],
      out: { text: s => `The warm rooms are packed to the walls with children, the sick and the crews. The ones on neither list, mostly the old, are moved to the end pod with every spare blanket in the colony. ${Nc(s, 'physician')} goes down there each morning with a lamp and a list, and crosses names off it.`,
        fx: s => ({ pop: -Math.max(3, Math.round(LF.sized(s) * 0.07)), morale: -4, machine: { reactor: 4 }, stain: ['cull', 2], do: s2 => { LF.emit(s2, 'grief', 'drk.endpod', 40, 200, 'the old were left in the unheated pod'); } }) } },
  ] });

/* ======================= AFTER ======================= */
B('after', { id: 'drk.dawn', chain: true, tone: 'quiet', title: 'First Light',
  text: s => { const t = T(s); return `It comes back the way it went: a percent at a time, and then one morning there are shadows with edges. People stand in it with their eyes shut.\n\nIt lasted ${months(t.len)}. ${t.dead0 ? `${TH.num(t.dead0).charAt(0).toUpperCase() + TH.num(t.dead0).slice(1)} dead in the dark.` : 'Nobody was lost to it.'} ${t.known.cause ? `${CAUSE[t.truth.cause].why}.` : 'Nobody yet knows why it happened.'}`; },
  choices: [
    { label: s => T(s).known.cause && CAUSE[T(s).truth.cause].again ? 'It will come again, so start building for it now' : 'Find out why, whatever it takes',
      out: { text: s => T(s).known.cause && CAUSE[T(s).truth.cause].again ? 'A cellar is pegged out before the fields are resown. It is planned on a scale nobody now living will see finished.' : `${Nc(s, 'pilot')} is given the instruments, the drones and a year.`,
        fx: s => ({ morale: 2, do: s2 => { const t = T(s2); if (!t.known.cause) learn(s2, t, 40); s2.seeds.push({ id: 'dark:again', k: 'thread', d: s2.day, txt: CAUSE[t.truth.cause].again ? 'the dark will come again, and the colony has started building for it' : 'the colony set out to learn why the sun went dim' }); }, chron: T(s).known.cause && CAUSE[T(s).truth.cause].again ? 'The colony began to build for a dark its grandchildren would see.' : 'The colony set out to learn why the sun went dim.' }) } },
    { label: 'Sow everything, today', out: { text: 'Every hand goes to the fields, and seed goes in by lamplight as well as daylight. There is singing in the rows by the second day.', fx: { morale: 6, yield: 0.03 } } },
  ] });
LF.TAGS['drk.minutes'] = ['cautious open', 'open', 'cautious closed'];
LF.TAGS['drk.before'] = ['cautious open', 'open', 'severe closed'];
LF.TAGS['drk.number'] = ['cautious', 'cautious', 'bold', 'severe order'];
LF.TAGS['drk.told'] = ['free open', 'order'];
LF.TAGS['drk.noon'] = ['mercy free', 'order', 'order closed cautious'];
LF.TAGS['drk.lamps'] = ['bold', 'cautious', 'severe', 'severe'];
LF.TAGS['drk.out'] = ['open mercy', 'cautious closed', 'severe closed bold', 'severe closed order'];
LF.TAGS['drk.count'] = ['open free', 'mercy', 'order severe', 'severe order'];
LF.TAGS['drk.rooms'] = ['mercy', 'severe order', 'free', 'severe order'];
LF.TAGS['drk.dawn'] = ['cautious', 'bold'];
})();
