/* Landfall — buildings that matter (WO-3; DESIGN.md "Buildings").
   The five builds the council can raise besides the first ones: the laboratory (lab), the signals room (comms), the
   cannery and cold store (cannery), the watchtowers and wall walk (watch) and the meeting hall (hall), and a machine
   shop that counts for more than the industry cord. Their rules live where the rules are (LF.PROJECTS, LF.has,
   LF.buildMods and LF.wireThreat in core.js; PITCH in council.js; LF.dept in officers.js; the ebb in ebb.js; the
   Guest and the Warrens' nights; the party table in gen.js). This file holds the cards: for each build one where its
   lack bites and says so (bu.no*) and one that happens because it stands (bu.*), and the lines and options the
   older cards gain when it stands. Those are added from here, at the end of each card's choices (option ids, LF.TAGS
   and the sim's COUNCIL table go by position). No card shows more than three options (2026-11-21), so an option a
   building adds takes the place of one of the card's own, which carries the opposite `show` in its own file:
     the laboratory     fever.first, crops.native, crops.assay (and any M('medbay') in the odds, core.js)
     the signals room   off.stranded, qs.lights, qs.deep (and the silent party's card, gen.js)
     the cannery        plan.harvest, pol.rations, state.famine
     the watchtowers    oth.raid, hu.wire, fer.raid
     the meeting hall   pol.mutiny, ebb.ways, ebb.knives
     the machine shop   mach.cannibal, mach.biofilm
   Loaded after every file it touches (after thread-hush.js). No DOM. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { P, N, Nc, F, R, If, byPid, foodDays } = h;
const has = LF.has, cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => NUM[n] || String(n);
const ok = (s, id) => !s.machines[id].lost && !s.machines[id].up;
const landed = s => !!s.world && !s.adrift && !LF.aloft(s);
const since = (s, id) => s.day - (s.built[id] || s.day);
// food written for the founding sixty is scaled by mouths in LF.apply; a share of what is in the bins is not
const share = (s, n) => -Math.round(s.res.food * n / Math.max(1, LF.mouths(s) / 60) / 10) * 10;
const out = s => s.factors.filter(f => f.stage >= 1 && !f.res && !f.dormant && f.accord < 40 && ['fauna', 'natives', 'humans'].includes(f.kind)).sort((a, b) => b.threat - a.threat)[0] || null;
const mass = f => !!(LF.KINDS[f.kind] || {}).mass;
const are = f => mass(f) ? 'is' : 'are';

Object.assign(LF.DEEDS || {}, {
  bu_bare: 'the sample handed to the lock-up to hold bare-handed',
  bu_field: 'the culture let loose in the north field without a word to the crew',
  bu_listen: 'every channel logged, every night, by the signals room',
  bu_soft: 'the soft grain sent to the lock-up and the pod rows',
  bu_mines: 'the charges buried in the approaches',
  bu_shot: 'the one shot from the tower for standing and watching',
  bu_heads: 'the rota decided by crew heads, and the rest told after',
  bu_hallshut: 'the hall locked until people remembered who gives the orders',
});

/* ============================== THE LABORATORY ============================== */
const nolabF = s => s.factors.filter(f => f.stage >= 1 && !f.res && !f.dormant && f.kind !== 'land' && f.insight < 25).sort((a, b) => a.insight - b.insight)[0] || null;
add({ id: 'bu.nolab', arc: 'bu_lab', view: 'colony', tone: 'pressure', title: 'Nowhere to Put It', gap: 40, repeat: 300, w: 1.6,
  when: s => landed(s) && s.day >= 120 && !has(s, 'lab') && !!nolabF(s) && !!P(s, 'xenobio'),
  setup: s => { const f = nolabF(s); return { fid: f.id, name: f.name, Name: f.Name, med: s.machines.medbay.up ? 'up' : s.machines.medbay.lost ? 'lost' : 'here' }; },
  text: (s, c) => `A crew brought back a jar from ${c.name}, and ${N(s, 'xenobio')} wants it cultured. There's nowhere to do it. ${s.built.soillab ? 'The soil laboratory is full of seed trays' : 'The only clean bench is the seed bench in the stores'}, ${c.med === 'up' ? 'the autodoc is still aboard the ship' : c.med === 'lost' ? 'the autodoc is gone' : 'the autodoc is kept for the living'}, and the colony has no laboratory of its own.\n\n[[xenobio]] "It's the seed bench or nothing, I know that, I know there's wheat a hand's width away, but you haven't even held the jar up to the light yet, and once you have you'll stop asking me where."`,
  choices: [
    { label: 'Work it on the seed bench, among next season\'s stock', note: 'It gets done this month, on the only clean bench there is, next to the seed for the next sowing.', info: [['yield', (s, c) => `What ${c.name} is`], ['fail', 'The seed stock']],
      test: { base: 50, mods: [R('xenobio', 10)] },
      ok: { text: (s, c) => `Three weeks of cultures between the seed trays, and nothing gets loose. The notes on ${c.name} fill a slate, and the seed is moved back onto its bench with nobody the worse.`, fx: (s, c) => ({ fops: [{ id: c.fid, insight: 22 }] }) },
      bad: { text: (s, c) => `Something from the jar gets into the seed trays. A third of next season's stock goes grey and has to be burned. The notes on ${c.name} are good, for what they cost.`, fx: (s, c) => ({ fops: [{ id: c.fid, insight: 12 }], yield: -0.05, morale: -2 }) } },
    { label: 'Give the jar to the three in the lock-up to handle bare-handed, and watch what it does to them', dark: true, note: 'Nobody needs a bench to see what a thing does to skin. The three in the lock-up are not asked.', info: [['yield', (s, c) => `What ${c.name} does to people`], ['danger', 'The three in the lock-up']],
      out: { text: (s, c) => `The three are given the jar and told to sort what's in it by hand. By the end of the week two have a rash to the elbow and one can't close a hand. ${Nc(s, 'xenobio')} has a page on ${c.name} nobody could have got any other way, and doesn't show it round.`,
        fx: (s, c) => ({ fops: [{ id: c.fid, insight: 32 }], pop: -1, stain: ['bu_bare', 1] }) } },
    { label: 'Burn the jar. Put a laboratory on the build list', note: 'Nobody touches what nobody understands, and whoever meets it out there next meets it knowing nothing.', info: [['yield', 'A laboratory, sooner'], ['later', (s, c) => `Whoever meets ${c.name} next`]],
      out: { text: (s, c) => `The jar goes in the stove. ${Nc(s, 'xenobio')} watches it go, says nothing for once, and is at the next build meeting with a drawing of benches.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: 5 }], morale: -1, flags: { lab_wanted: s.day } }) } },
  ] });
LF.TAGS['bu.nolab'] = ['bold open', 'severe', 'cautious'];

add({ id: 'bu.lab', arc: 'bu_lab', view: 'colony', tone: 'opportunity', title: 'The Bench at Night', gap: 40, repeat: 400, w: 1.8,
  when: s => landed(s) && has(s, 'lab') && since(s, 'lab') >= 50 && !!P(s, 'xenobio'),
  setup: s => ({ wild: LF.lex(s, 'wild1') }),
  text: (s, c) => `${Nc(s, 'xenobio')} has slept in the laboratory most nights this month. In the incubator is a culture off the roots of ${c.wild}, and it fixes nitrogen into this soil faster than anything the ship brought.\n\n[[xenobio]] "It could feed the north field, or it could get loose and feed everything else, probably both, and the only way to find out which is to grow it on, which is the one thing you'd least like me to do, I know, I've been sleeping next to it, I know."`,
  choices: [
    { label: 'Grow it on, in the cold room, under lock', note: 'A season of work for the laboratory, and one technician who handles it every day.', info: [['yield', 'Better harvests, if it holds'], ['fail', 'The technician who tends it']],
      test: { base: 50, mods: [R('xenobio', 10)] },
      ok: { text: 'A season in the cold room, a jar at a time. It holds, it feeds, and the north field gets a dressing of it in the spring.', fx: { yield: 0.06, morale: 1, flags: { lab_culture: true } } },
      bad: { text: 'The culture turns in the third month. The technician who tended it is in the clinic with lungs full of something, and the cold room is scrubbed with lye.', fx: { pop: -1, morale: -2 } } },
    { label: 'Let it loose in the north field now, and tell the crew it\'s fertiliser', dark: true, note: 'A season sooner, and nobody has to wait for answers. The crew breathe it while they spread it.', info: [['yield', 'Better harvests, this season'], ['danger', 'The north field crew']],
      out: { text: 'It goes on in sacks marked fertiliser. The north field comes up dark green and a hand taller than the rest. Two of the crew cough through the summer, and one of them doesn\'t stop.', fx: { yield: 0.09, pop: -1, stain: ['bu_field', 1] } } },
    { label: (s, c) => `Burn it, and the notes. ${F(s, 'xenobio')} can find something else`, note: 'Nothing gets loose, and the person who found it is told the finding was the problem.', info: [['danger', (s) => N(s, 'xenobio')]],
      out: { text: s => `The culture goes in the autoclave and the notes go in the stove. ${Nc(s, 'xenobio')} carries the jars out personally and doesn't come to supper.`, fx: { morale: 1, off: [['scientist', 'mind', -8]] } } },
  ] });
LF.TAGS['bu.lab'] = ['bold open', 'severe bold', 'cautious order'];

/* ============================== THE SIGNALS ROOM ============================== */
const upOne = s => { const p = LF.inOrbit(s).filter(q => !q.stranded)[0] || LF.inOrbit(s)[0]; return p || null; };
const worst = s => Object.keys(s.machines).filter(id => ok(s, id) && id !== 'lander').sort((a, b) => s.machines[a].hp - s.machines[b].hp)[0] || null;
add({ id: 'bu.nocomms', arc: 'bu_comms', view: 'ship', tone: 'pressure', title: 'Eleven Minutes', gap: 40, repeat: 240, w: 1.6,
  when: s => landed(s) && s.day >= 30 && !has(s, 'comms') && !!upOne(s) && !!worst(s) && !s.flags.qs_dark,
  setup: s => { const p = upOne(s), S = LF.SEATS[p.seat], id = worst(s); return { pid: p.id, name: p.name, first: p.first, dept: S.name, crew: S.crew, id, mach: LF.MACHINES[id].name }; },
  text: (s, c) => `${c.name}, your ${LF.title(byPid(s, c.pid))}, is still aboard, and ${c.dept} gets its orders from orbit, eleven minutes a pass, on the lander's set. Last night's came down garbled: half a pressure figure and a valve number with a digit gone. ${cap1(c.crew)} are standing at the ${c.mach} waiting to be told which valve.\n\nThe colony has no signals room. The next pass is in nine hours.`,
  choices: [
    { label: 'Wait for the next pass', note: (s, c) => `Nobody touches the ${c.mach} until ${c.first} can say it again, and it runs badly till then.`, info: (s, c) => [['danger', `The ${c.mach}`]],
      out: { text: (s, c) => `Nine hours with the ${c.mach} running rough. The next pass comes in clean and the figure is the one everyone feared. The fitting is done by dark.`, fx: (s, c) => ({ machine: { [c.id]: -6 }, morale: -1 }) } },
    { label: 'Have the crew pick the likeliest valve', note: 'It is done tonight. If the guess is wrong, the crew at the valve find out first.', info: [['fail', 'The crew at the valve']],
      test: { base: 50, mods: [R('engineer', 10)] },
      ok: { text: (s, c) => `They read the digit as a seven and it was a seven. ${c.first} confirms it on the next pass and sounds faintly put out.`, fx: { morale: 1 } },
      bad: { text: (s, c) => `It was the other valve. The one they opened was holding back a line at full pressure, and the fitter standing at it is carried to the clinic and not carried out.`, fx: (s, c) => ({ machine: { [c.id]: -12 }, pop: -1, morale: -3 }) } },
    { label: 'Run a wire up the ridge and boost the lander\'s set off the reactor', cost: { parts: 3 }, note: 'Three spares and a month of the reactor carrying a load it was never rated for. After that, the pass lasts longer.', info: [['yield', 'A signals room, sooner'], ['danger', 'The spares shelf, and the reactor']],
      out: { text: (s, c) => `A cable runs up the ridge on tent poles and the lander's set is turned up past its rating. ${c.first} comes through clearly for the first time since landfall, and the reactor runs hot for a month.`, fx: s => ({ machine: LF.down(s, 'reactor') ? { reactor: -4 } : {}, flags: { comms_wanted: s.day } }) } },
  ] });
LF.TAGS['bu.nocomms'] = ['cautious', 'bold', 'open'];

add({ id: 'bu.comms', arc: 'bu_comms', view: 'people', tone: 'pressure', title: 'On the Work Channel', gap: 40, repeat: 500, w: 1.6,
  when: s => landed(s) && has(s, 'comms') && since(s, 'comms') >= 40 && s.pop >= 30,
  text: s => `The night operator in the signals room logs the work channels to stay awake. One page of the log is on your desk: two of the store crew, at three in the morning, working out how much meal can go missing before the stores count notices.\n\nNeither of them knew the room logged the channels.`,
  choices: [
    { label: 'Have the two arrested on the strength of the log', note: 'The meal stops going. By morning every crew knows the channels are heard.', info: [['yield', 'The store'], ['danger', 'The two, and every crew that talks on a channel']],
      test: { base: 60, mods: [R('security', 10)] },
      ok: { text: 'The two are taken off shift and the meal is found under the floor of the grain shed. The work channels go quiet at night after that, and stay quiet.', fx: { food: 60, tension: -3, morale: -1 } },
      bad: { text: 'The two deny it and the meal is never found. The log is read aloud at the hearing, and the whole colony learns what the night operator does.', fx: { food: -40, morale: -3, tension: 4 } } },
    { label: 'Keep listening. Every channel, every night, logged', dark: true, note: 'Theft, plots, grudges: the colony hears about them before they happen. Nobody is told the room listens.', info: [['yield', 'Fewer thefts, and early word of trouble'], ['danger', 'Everyone who talks on a channel']],
      out: { text: 'A second operator is put on nights, with a log for each channel. The meal stops going missing within the month, and so do two other things nobody had noticed yet.', fx: { food: 80, tension: -8, stain: ['bu_listen', 1], do: s2 => { s2.flags.comms_listen = s2.day; if (LF.emit) LF.emit(s2, 'suspicion', 'bu.comms', 25, 240, 'the signals room listens to the work channels at night'); } } } },
    { label: 'Wipe the page. The night operator listens for orbit and nothing else', note: 'Nobody\'s talk is logged. The two go on doing what they were doing.', info: [['danger', 'The store']],
      out: { text: 'The page is burned and the operator is told what the room is for. The count comes up short again at the end of the month, by about what the log said it would.', fx: { food: -60, morale: 1 } } },
  ] });
LF.TAGS['bu.comms'] = ['order', 'severe closed', 'free'];

/* ============================== THE CANNERY ============================== */
add({ id: 'bu.nocan', arc: 'bu_can', view: 'colony', tone: 'pressure', title: 'Soft in the Bins', gap: 40, repeat: 360, w: 2,
  when: s => landed(s) && !has(s, 'cannery') && (s.flags.harvests || 0) >= 1 && s.day % LF.SEASON < 20 && s.day >= 100 && foodDays(s) > 30,
  setup: s => ({ a: share(s, 0.12), b: share(s, 0.05) }),
  text: s => `${h.Nwc(s, 'quartermaster')} brings you a handful from the bottom of bin four. It's grey and warm and smells sweet.\n\n[[quartermaster]] "Four's gone and five's on the turn, and with no cold room and no jars it'll rot faster than we can eat it. We eat the soft grain first, all of us, or it goes back to the ground and does nobody any good."`,
  choices: [
    { label: 'Everyone eats the soft grain first, the officers too', note: 'Nothing is thrown away. A month of sour bread, and the weakest stomachs feel it.', info: [['danger', 'The old and the sick']],
      out: { text: 'The soft grain goes into everything for a month. Nobody likes it. The clinic fills with stomachs, and one of the oldest doesn\'t get up.', fx: (s, c) => ({ food: c.b, morale: -3, pop: -1 }) } },
    { label: 'Throw out what\'s soft and keep the rest clean', note: 'Nobody is sick from it, and the store is the lighter by an eighth.', info: [['danger', 'The store, by an eighth']],
      out: { text: (s) => `The soft grain is barrowed out to the pit. ${Nc(s, 'quartermaster')} counts every barrow and writes the number down, and pins it up by the stores door where everyone can see it.`, fx: (s, c) => ({ food: c.a, morale: -1, flags: { can_wanted: s.day } }) } },
  ] });
LF.TAGS['bu.nocan'] = ['mercy', 'cautious'];

add({ id: 'bu.can', arc: 'bu_can', view: 'world', tone: 'opportunity', title: 'Putting Up', gap: 40, repeat: 360, w: 1.8,
  when: s => landed(s) && has(s, 'cannery') && since(s, 'cannery') >= 30 && LF.date(s.day).season < 3 && s.pop >= 20,
  setup: s => ({ wild: LF.lex(s, 'wild'), wild1: LF.lex(s, 'wild1') }),
  text: (s, c) => `${cap1(c.wild)} is in season out past the wire, more of it than anyone could eat fresh. With the cannery it can be boiled down and put up for the lean months. Picking it means crews out past the wire for most of a month.`,
  choices: [
    { label: 'Send the pickers out with an escort', note: 'Most of a month out past the wire, and the escort can only watch so much ground.', info: [['yield', 'Jars for the lean months'], ['fail', 'The pickers']],
      test: { base: 60, mods: [R('security', 10)] },
      ok: { text: (s, c) => `A month of picking, and the cannery boils day and night. The cold room fills with jars of ${c.wild1}, labelled in three different hands.`, fx: { food: 320, morale: 2 } },
      bad: { text: (s, c) => `The pickers come back with half of what they went for, two short. They were on the far side of the slope when it happened, and the escort was on this side.`, fx: { food: 150, pop: -2, morale: -3 } } },
    { label: 'Can only what grows inside the wire, and the seed stock\'s surplus', note: 'Nobody goes out. The surplus was what the next sowing would have been picked from.', info: [['yield', 'A few shelves of jars'], ['danger', 'The next sowing']],
      out: { text: 'The cannery runs a week on what\'s inside the wire, and on the seed that would have been the pick of the next sowing. A few shelves fill.', fx: { food: 140, yield: -0.02 } } },
    { label: 'Strip it bare, roots and all, and burn the ground behind for next year', dark: true, note: 'Twice the jars, and next year it grows back where it\'s been burned. Whatever lives on it out there goes hungry.', info: [['yield', 'Twice the jars'], ['danger', 'Whatever lives on it']],
      out: { text: (s, c) => `The crews take everything, roots and all, and fire the slope behind them. The cold room is full to the door. Out past the wire the ground is black for a kilometre, and the things that ate ${c.wild1} come closer to the fence that winter.`,
        fx: s => { const f = out(s); return { food: 480, morale: 1, stain: ['bu_strip', 1], fops: f ? [{ id: f.id, threat: 10, harm: 12 }] : [] }; } } },
  ] });
LF.TAGS['bu.can'] = ['bold', 'cautious', 'severe bold'];
Object.assign(LF.DEEDS || {}, { bu_strip: 'the slope stripped to the roots and burned for the jars' });

/* ============================== THE WATCHTOWERS ============================== */
add({ id: 'bu.nowatch', arc: 'bu_watch', view: 'world', tone: 'pressure', title: 'As Far as the Lamp', gap: 40, repeat: 260, w: 2.6,
  when: s => landed(s) && s.day >= 60 && !has(s, 'watch') && !!out(s) && out(s).threat >= 25,
  setup: s => { const f = out(s); return { fid: f.id, name: f.name, Name: f.Name, are: are(f) }; },
  text: (s, c) => `${c.Name} came to the wire last night and went along it, post by post, the whole way round. Nobody saw. The tracks were found at first light, and nobody on the fence had heard a thing.\n\n[[security]] "We walk the inside of the wire with a lamp and we see as far as the lamp, and whatever went round it post by post knows exactly how far that is. What I want to know is who had the dogs last night, and why not one of them made a sound."`,
  choices: [
    { label: 'Double the night watch, on foot', note: 'Twelve more people up all night, and the day crews go short of them.', info: [['danger', 'The watch, and the day\'s work']],
      out: { text: 'Twice the lamps on the fence, and twice the people asleep on their feet by morning. The tracks stop coming as close.', fx: (s, c) => ({ fops: [{ id: c.fid, threat: -6 }], food: -60, morale: -1, flags: { watch_wanted: s.day } }) } },
    { label: 'Bury charges in the approaches', dark: true, cost: { parts: 2 }, note: 'Whatever comes to the wire comes to the charges first. They don\'t know who\'s walking on them, and neither will you.', info: [['yield', 'The approaches closed'], ['danger', 'Whoever walks there, ours included']],
      out: { text: (s, c) => `Charges go into the approaches on three sides, mapped on a slate that lives in the armoury. Two go off in the first month, and what's found is ${c.name}. The third, in the spring, is a field hand who went out after a stray.`,
        fx: (s, c) => ({ fops: [{ id: c.fid, threat: -18, harm: 15, kills: 2 }], pop: -1, stain: ['bu_mines', 2] }) } },
  ] });
LF.TAGS['bu.nowatch'] = ['cautious', 'severe'];

add({ id: 'bu.watch', arc: 'bu_watch', view: 'world', tone: 'pressure', title: 'From the East Tower', gap: 40, repeat: 300, w: 1.8,
  when: s => landed(s) && has(s, 'watch') && since(s, 'watch') >= 30 && !!out(s),
  setup: s => { const f = out(s); return { fid: f.id, name: f.name, Name: f.Name, are: are(f), folk: f.kind === 'natives' || f.kind === 'humans' }; },
  text: (s, c) => `At first light the east tower rings down. Out past the wire, at the edge of rifle range, ${c.folk ? `three of ${c.name} are sitting in the grass` : `one of ${c.name} is standing still`}, watching the colony wake. ${c.folk ? 'They\'ve' : 'It\'s'} been there since before dawn.\n\nThe tower has a clean shot, and wants to know whether to take it.`,
  choices: [
    { label: 'Take the shot', dark: true, note: (s, c) => c.folk ? 'They have done nothing but watch. Whoever is on the far field when the rest answer will know why.' : 'It has done nothing but watch. The rest of them will learn what the towers are.', info: (s, c) => [['yield', 'It stops watching'], ['fail', c.folk ? 'Whoever is on the far field' : 'The far field crew']],
      test: { base: 60, mods: [R('security', 10)] },
      ok: { text: (s, c) => `One shot from the tower. ${c.folk ? 'The other two carry the third away, slowly, without looking back.' : 'It goes down where it stood.'} Nothing watches from that slope again.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: -12, harm: 12, kills: 1, accord: -20 }], tension: -4, stain: ['bu_shot', c.folk ? 2 : 1] }) },
      bad: { text: (s, c) => `The shot goes wide. Whatever was watching is gone into the grass before the second. Three nights later the far field crew finds out how much it minded.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: 12, accord: -20 }], pop: -1, stain: ['bu_shot', 1] }) } },
    { label: 'Ring the bell, so they know they\'ve been seen', note: 'Nobody is hurt this morning. Whatever it is learns where the towers are.', info: [['later', 'The far field crew']],
      out: { text: (s, c) => `The bell rings on all four towers. ${c.folk ? 'The three stand, take their time, and walk off along the ridge.' : 'It stands a moment longer, then goes.'} Something is back the next morning, further off.`, fx: (s, c) => ({ fops: [{ id: c.fid, threat: -5, insight: 6 }] }) } },
    { label: 'Send two out from the tower to follow it home', note: 'Two people past the wire at dawn, on its ground.', info: [['yield', (s, c) => `Where ${c.name} live`], ['fail', 'The two who go']],
      test: { base: 50, mods: [R('security', 10), R('xenobio', 5)], kind: ['explore'] },
      ok: { text: (s, c) => `The two come back at dusk with a map: where ${c.name} sleep, where they drink, and how far off the colony they really keep.`, fx: (s, c) => ({ fops: [{ id: c.fid, insight: 25, threat: -4 }], survey: 6 }) },
      bad: { text: 'Only one of the two comes back, and won\'t say much about the other.', fx: (s, c) => ({ fops: [{ id: c.fid, insight: 8 }], pop: -1, morale: -2 }) } },
  ] });
LF.TAGS['bu.watch'] = ['severe', 'cautious', 'bold open'];

/* ============================== THE MEETING HALL ============================== */
add({ id: 'bu.nohall', arc: 'bu_hall', view: 'people', tone: 'pressure', title: 'Standing Room', gap: 40, repeat: 320, w: 1.6,
  when: s => landed(s) && s.day >= 120 && !has(s, 'hall') && LF.heads(s) >= 40 && (s.morale < 50 || s.flags.council || s.flags.committee),
  setup: s => ({ n: LF.heads(s), harsh: LF.harsh(s) }),
  text: (s, c) => `The meeting about the work rota is in the mess hall again, because there's nowhere else. ${cap1(LF.num(c.n))} people and seats for forty. The ones at the back can't hear and are shouting, the cooks want the tables for supper, and ${h.Nw(s, 'quartermaster')} has the rota on a slate nobody past the third row can read.\n\nThe colony has no hall. It's been an hour and nobody has voted on anything.`,
  choices: [
    { label: 'Call it off. The officers will set the rota', note: 'It\'s done by morning. Everyone who came to be heard wasn\'t.', info: [['danger', 'Everyone who came to be heard']],
      out: { text: 'The meeting is called off and the rota goes up on the door at breakfast. It isn\'t a bad rota. People read it with their arms folded.', fx: { morale: -3, tension: 3, flags: { hall_wanted: 1 } } } },
    { label: 'Hold it in the yard tonight, all of it, for as long as it takes', note: (s, c) => c.harsh ? 'Everyone is heard, in weather the pods were never built for. The old and the small stand in it too.' : 'Everyone is heard, standing, after a full shift. Supper is late and cold.', info: (s, c) => [['yield', 'A rota people agreed to'], ['danger', c.harsh ? 'The old and the small, in the cold' : 'Supper']],
      out: { text: (s, c) => `The whole colony stands in the yard with lamps until the rota is agreed, a line at a time.${c.harsh ? ' One of the oldest took a chill out there and didn\'t shake it.' : ' Supper is eaten cold at midnight.'}`, fx: (s, c) => c.harsh ? { morale: 3, pop: -1 } : { morale: 3, food: -30 } } },
  ] });
LF.TAGS['bu.nohall'] = ['order', 'free'];

const motion = s => LF.lean(s) ? 'ladle' : 'mess';
add({ id: 'bu.hall', arc: 'bu_hall', view: 'people', tone: 'pressure', title: 'A Motion from the Floor', gap: 40, repeat: 400, w: 1.6,
  when: s => landed(s) && has(s, 'hall') && since(s, 'hall') >= 40 && s.pop >= 20,
  setup: s => ({ m: motion(s) }),
  text: (s, c) => `The hall meets every rest-day now, and this week it voted, two hands to one: ${c.m === 'ladle' ? 'full rations for a month, whatever the store says' : 'the officers eat what everyone eats, in the mess, at the same tables'}.\n\n[[command]] "It doesn't bind anyone yet, and the day you turn it down the hall will vote again to make it bind, so I want your answer before the next rest-day."`,
  choices: [
    { label: 'Accept it', note: (s, c) => c.m === 'ladle' ? 'A month of full ladles, out of a store that can\'t spare it.' : 'The officers eat in the mess, and every complaint in the colony knows where to find them at supper.', info: (s, c) => [['yield', 'Morale'], ['danger', c.m === 'ladle' ? 'The store' : 'The officers\' nerve']],
      out: { text: (s, c) => c.m === 'ladle' ? 'Full ladles for a month. The hall cheers the first one. The store ledger takes it hard.' : 'The officers carry their trays to the long tables. The first week they hardly eat for being talked to.', fx: (s, c) => c.m === 'ladle' ? { morale: 5, food: -120, lift: 4 } : { morale: 4, off: [['command', 'mind', -4], ['crew', 'mind', -3]] } } },
    { label: 'Go to the hall and say no, and why', note: 'You stand at the raised end and answer whatever comes. If they don\'t like it, they\'ll say so to your face.', info: [['fail', 'What is left of your standing in that room']],
      test: { base: 50, mods: [R('command', 10)] },
      ok: { text: 'You stand up there for two hours. At the end of it they vote again, and it fails by four hands.', fx: { morale: 1, tension: -4 } },
      bad: { text: 'You stand up there for two hours and they don\'t move. The motion passes again, louder, and this time they mean it.', fx: { morale: -5, tension: 6 } } },
    { label: 'Lock the hall until people remember who gives the orders', dark: true, note: 'No more motions. The rest-day goes back to being a rest-day, and the room the colony built for itself is shut.', info: [['yield', 'No more motions'], ['danger', 'Everyone who built it']],
      out: { text: 'The doors are chained on the rest-day. People walk past it on the way to the mess and look at the chain. The rest-days go quiet, and so does everything else.', fx: s => ({ tension: -10, morale: -4, stain: ['bu_hallshut', 1], flags: { hall_shut: s.day } }) } },
  ] });
LF.TAGS['bu.hall'] = ['free mercy', 'order', 'severe order closed'];

/* ============================== TOUCHED CARDS ============================== */
const st = id => LF.byId[id] || null;
// append an option (and its tags, by position) to an older card
const opt = (id, ch, tag) => { const S = st(id); if (!S) return; S.choices.push(ch); const T = LF.TAGS[id] = LF.TAGS[id] || []; T[S.choices.length - 1] = tag || ''; };
// add a line to a card's text when a building stands
const line = (id, fn) => { const S = st(id); if (!S) return; const t0 = S.text; S.text = (s, c) => (typeof t0 === 'function' ? t0(s, c) : t0) + (fn(s, c) || ''); };
const fnOf = (v, s, c) => typeof v === 'function' ? v(s, c) : v;

/* --- the laboratory stands in for the autodoc where a card needs an assay --- */
{ const S = st('fever.first'), ch = S && S.choices[1];
  if (ch) { const lbl = ch.label, txt = ch.out.text, req = ch.req;
    ch.req = s => req(s) || has(s, 'lab'); ch.reqText = 'Needs the autodoc or a laboratory';
    ch.label = s => req(s) ? fnOf(lbl, s) : 'Full workup in the laboratory';
    ch.out = Object.assign({}, ch.out, { text: s => req(s) ? fnOf(txt, s) : 'Vitreous taps and cultures on the laboratory bench, and the incubator run for a week. The answer is a genome nobody can read yet. The three sleep in their own bunkroom while it runs, and one of them is blind before it finishes.' }); } }
{ const S = st('crops.native'), ch = S && S.choices[1];
  if (ch) { const lbl = ch.label, txt = ch.out.text, fx = ch.out.fx, req = ch.req;
    ch.req = s => req(s) || has(s, 'lab'); ch.reqText = 'Needs the autodoc or a laboratory';
    ch.label = s => req(s) ? fnOf(lbl, s) : 'Run the long assay in the laboratory first';
    ch.note = s => req(s) ? 'Nobody has to eat anything, but it takes months, and the autodoc can do nothing else while it runs.' : 'Nobody has to eat anything, and the laboratory does nothing else for a season.';
    ch.out = { text: s => req(s) ? fnOf(txt, s) : 'The laboratory grinds through tissue cultures for a season and does nothing else. Every other jar on the shelf waits. It will have an answer by next season.',
      fx: s => req(s) ? fnOf(fx, s) : { flags: { assay_lab: true }, sched: [['crops.assay', 35, 55]] } }; } }
{ const S = st('crops.assay'); if (S) { const t0 = S.text; S.text = (s, c) => { const t = fnOf(t0, s, c); return s.flags.assay_lab ? t.replace('The autodoc\'s verdict', 'The laboratory\'s verdict') : t; }; } }

/* --- the signals room --- */
{ const S = st('off.stranded');
  if (S) { const c0 = S.choices[0], n0 = c0.note, i0 = c0.info, t0 = c0.out.text;
    c0.note = (s, c) => has(s, 'comms') ? `${c.dept} goes on at seven tenths from the signals room, for as long as ${c.first} lives.` : fnOf(n0, s, c);
    c0.info = (s, c) => has(s, 'comms') ? [['danger', `${c.dept}, short of its officer for good`]] : fnOf(i0, s, c);
    c0.out.text = (s, c) => has(s, 'comms') ? `${c.first} keeps the chair. ${cap1(c.crew)} take their orders from the signals room at any hour, from someone who has never stood where they are standing.` : fnOf(t0, s, c);
    const c2 = S.choices[2]; if (c2 && c2.test) c2.test.mods.push(If(s => has(s, 'comms'), 10, 'The signals room, talking the drop')); } }
/* Three options at most (2026-11-21): it is on the card only once the signals room stands, and it takes the place of the pad lamp (js/thread-quiet.js). */
opt('qs.lights', { label: 'Call her from the signals room, every pass, until something answers', show: s => has(s, 'comms'), hint: 'unknown',
  note: 'The dish can hold her the whole pass, not four minutes. The room does nothing else for a week, and every party out goes unheard for it.', info: [['yield', 'A sure reading'], ['danger', 'Any party out, unheard']],
  out: { text: (s, c) => c.msg === 'help' ? 'The dish holds her from ridge to ridge and the operator keys WHO until the light changes. On the sixth evening the answer comes back slowly, with long gaps: a name off the waking list, then AIR, then a single figure.' : 'The dish holds her from ridge to ridge and the operator keys WHO until the light changes. On the fourth evening the answer comes back fast, as if it had been waiting: SICK. Then NO, and NO again, until she is below the ridge.',
    fx: (s, c) => ({ morale: -1, do: s2 => { const t = LF.T(s2, 'quiet'); if (!t) return; t.read = c.msg; t.sure = true; t.waited = (t.waited || 0) + 1;
      if (LF.emit) LF.emit(s2, 'unexplained', 'th.quiet', 40, 260, c.msg === 'help' ? `someone aboard the ${s2.world.ship} is running out of air` : `there is sickness aboard the ${s2.world.ship}`); LF.cue(s2, 'qs.silent', 4, 10); } }) } }, 'open');
{ const S = st('qs.deep'), c0 = S && S.choices[0]; if (c0 && c0.test) c0.test.mods.push(If(s => has(s, 'comms'), 5, 'The signals room on every report')); }

/* --- the cannery --- */
opt('plan.harvest', { label: 'Through the cannery first, then the store', show: s => has(s, 'cannery'), hint: 'unknown',   // in place of "Into the store, all of it"
  note: 'The canning line runs day and night until it\'s all put up, and the cutters work it. Nobody gets a harvest supper.', info: [['yield', 'More of it kept'], ['danger', 'The cutters']],
  out: { text: (s, c) => `The boilers run for a week straight and the cutters go from the field to the canning line without a night off. It all goes in, jarred, dried or in the cold room, and less of it will go soft.${c.tight ? ' Nobody on the line gets a jar.' : ''}`,
    fx: (s, c) => ({ food: Math.round(c.n * 1.12), morale: c.tight ? -4 : -2, flags: { reaped: s.day } }) } }, 'cautious order');
line('pol.rations', s => has(s, 'cannery') ? '\n\nThe cold store has shelves of jars in it. A short ladle stings less when people can see what is being kept.' : '');
opt('state.famine', { label: 'Open the cold store. Every jar', show: s => !s.flags.reserve && LF.famine.jars(s), hint: 'unknown',   // in place of the seed grain (three options at most; content-core.js)
  note: 'The jars were put up for the lean months. Eat them now, and the lean months come with nothing on the shelves.', info: [['yield', 'Food'], ['later', 'The next lean months']],
  out: { text: 'The cold room is emptied onto the mess tables a shelf a day. The queue at the stores door thins out. The shelves are bare by the end of the month, and stay bare.', fx: s => ({ food: 420, morale: -1, flags: { jars_eaten: s.day } }) } }, 'cautious');

/* --- the watchtowers --- */
{ const S = st('oth.raid'); if (S) { const t0 = S.text; S.text = (s, c) => { const t = fnOf(t0, s, c); return has(s, 'watch') ? t.replace('The watch is found tied up, unharmed, at dawn.', 'The tower watch is found at dawn tied up at the foot of the east tower, unharmed. They came up the ladder from the dark side.') : t; }; } }
line('hu.wire', s => has(s, 'watch') ? ' There were two on every tower all night, and the towers saw nothing come over.' : '');
line('fer.raid', s => has(s, 'watch') ? ' The towers rang the moment the first of them touched the wire. It bought the bunkhouses a minute, no more.' : '');

/* --- the meeting hall --- */
// the vote takes the place of "Let the committee take over" (content-society.js), which is hidden once the hall stands: three on screen
opt('pol.mutiny', { label: 'Open the hall. Everyone in, the officers on the floor, and a vote', show: s => has(s, 'hall'), hint: 'unknown',
  note: 'They get their say and their vote, in the room they built. The officers stand there and take it, and might lose.', info: [['yield', 'An answer they agreed to'], ['fail', 'The officers, if the vote goes against them']],
  test: { base: 45, nobuild: ['hall'], mods: [R('command', 10), If(s => !!s.flags.council, 5, 'There is a lawful Council')] },
  ok: { text: (s, c) => `The hall is packed to the walls. ${c.name} speaks first and the officers answer, one at a time, for four hours. The vote is close. The officers keep their posts, and ${c.first} sits on the rota committee from next week.`, fx: (s, c) => ({ morale: 6, tension: -12, flags: { council: true }, do: s2 => { s2.lowMorale = 0; } }) },
  bad: { text: (s, c) => `Four hours in the hall, and the vote goes against them. The officers hand over their keys on the raised end, in front of everyone, and walk out through the middle. ${c.name}'s committee runs the colony from the morning.`,
    fx: (s, c) => ({ morale: 8, tension: -18, flags: { committee: true, council: false, command_rule: false }, off: [['security', 'mind', -10], ['crew', 'mind', -8]], do: s2 => { s2.lowMorale = 0; } }) } }, 'free open');
opt('ebb.ways', { label: 'Open the hall every night for a month. Anyone can stand up and say it', show: (s, c) => (c.ways || []).includes('hall'), hint: 'unknown',   // one of the three ways the council deals (js/ebb.js), never a fourth option
  note: 'Every grievance in the colony, said out loud, to the officers\' faces, every night. The officers sit there and take it.', info: [['yield', 'A colony that has said it all'], ['danger', 'The officers\' nerve']],
  out: { text: 'The hall is full every night for a month. Most of it is shouting, some of it is crying, and a good deal is aimed at the raised end, where the officers sit. By the fourth week people are saying the same things more quietly.', fx: s => ({ morale: 8, lift: 12, tension: -6, off: [['command', 'mind', -6], ['security', 'mind', -4]] }) } }, 'open free');
line('ebb.knives', s => has(s, 'hall') ? '\n\nThe meeting hall stands dark across the yard. It started in the mess anyway, at supper, where it always does.' : '');

/* --- the machine shop --- */
opt('mach.cannibal', { label: 'Turn the parts on the lathe, and stop the build for it', show: s => has(s, 'machineshop'), cost: { mat: 30 }, hint: 'unknown',   // in place of the scrap bodge
  note: s => s.project ? `The machine shop drops everything for it. ${LF.projName(s, s.project)} waits, and so does everyone waiting on it.` : 'The machine shop drops everything for it, and the plate goes into the part.', info: [['yield', 'The machine'], ['danger', 'Whatever is being built']],
  out: { text: (s, c) => `The shop works through two nights. The parts come off the lathe rough and are filed to fit by hand, and the ${c.name} runs again.`, fx: (s, c) => ({ machine: { [c.id]: 28 }, progress: s.project ? -0.3 : 0 }) } }, 'cautious');
opt('mach.biofilm', { label: 'Cut new membrane frames in the machine shop', show: s => has(s, 'machineshop'), cost: { mat: 20 }, hint: 'unknown',   // in place of the fresh membranes
  note: 'Steel frames and the shop\'s own filter stock. The lathe hands go without their filters for a month.', info: [['yield', 'Clean water, no spares'], ['danger', 'The lathe hands']],
  out: { text: 'The shop strips its own extractor for filter stock and cuts the frames overnight. Clean water by the next evening. The lathe hands cough through the month.', fx: { machine: { reclaimer: 7 }, morale: -1 } } }, 'cautious');
})();
