/* Landfall — the generations: the ones born here (DESIGN.md "The cradles, the made and the ones born here").
   Lachlan: "plenty of opportunity to create new dilemmas for raising a new generation of kids (they grow up weird,
   they rebel against authority, they have unique adaptations/gone native)." Plain storylets keyed to the cohorts as
   they age (LF.children, s.gen.born, LF.GEN_ON), spread over the whole forty years: these are the hand-written cards
   of years 16 to 40 that DESIGN.md "Thin bands" asked for.
     growing up (gen.born): gen.grave (the first of them to die), gen.school (the ship or the world), gen.strange
       (their own words), gen.adapt (what this place has done to their bodies), gen.wire and gen.outside (the ones who
       will not come back inside), gen.ofage (the first on a work crew), gen.lines (the clinic's book of who is whose)
     the born against the founders (gen.rule): gen.vote, gen.rules (eight founders' rules, one at a time), gen.count
       (the born outnumber the founders), gen.chair (what the born in each department ask for first), gen.inherit,
       gen.earth (they stop believing in it). x.grudge keeps the score; late.born (js/late.js) is the far end of it:
       that card is the ship's children taking the yard, and once it is signed (born_rule) these stop.
     a city of children (gen.city): gen.minders (nine in ten), gen.packs (the rows' own law), gen.mouths (who eats in
       a famine), gen.fever, gen.class (more of them come of age than there are tools), gen.elders and gen.last (the
       founders past work, and the last of them).
   Cards marked far cannot come inside the sim's ordinary fifteen years: node tools/sim.js 1200 long measures them.
   No card here is a child bearing a child: the engine's numbers stay the engine's.
   Children lost on a card are a share of the cohorts worked out at setup and taken exactly (young). */
(function () {
'use strict';
const { add, h, clamp } = LF; const { N, Nc, R, M, byPid, foodDays } = h;
const { X, yr, num, Num, voiceCtx, young, kidChip, share, founders, rosterOn, grudge, risk, regard, allRegard } = LF.gn;
const YEAR = LF.YEAR, MONTH = LF.MONTH;
const G = s => LF.gen(s), kids = s => LF.kidCount(s), eldest = s => LF.children(s).eldest, AGE = LF.ageWord;
for (const k of ['gen.born', 'gen.rule', 'gen.city']) LF.ARC_VIEW[k] = 'people';
/* A month is the scarce thing: on 1,200 games a card that did nothing at all cost the bot about a win in a hundred for
   each one dealt in the first fifteen years, because the month's other card (a warning, a step against something past
   the wire) waited. So the milestones of childhood are aside: true (js/core.js LF.deal): like the harvest they come
   with their own card and the month's real card follows. The rest weigh little early, and the far ones have a thin
   deal to themselves. */
const mile = s => s.asideDay === undefined || s.day - s.asideDay >= 3 * MONTH;   // milestones come a season apart at the least
const B = st => add(Object.assign({ arc: 'gen.born', view: 'people', gap: 24, w: st.aside ? 3 : st.far ? 4 : 1.3 }, st));
const RU = st => add(Object.assign({ arc: 'gen.rule', view: 'people', gap: 30, w: 5 }, st));
const CI = st => add(Object.assign({ arc: 'gen.city', view: 'colony', gap: 30, w: 4 }, st));
const goneChip = n => [[n === 1 ? 'One of the children gone past the wire' : `${LF.num(n)} of the children gone past the wire`, false]];

/* What this world has done to the ones who grew up in it. */
const HERE = {
  barren: { den: 'a hollow under the lee of the stones, out on the dust flats', rest: 'laid out on the dust flats',
    adapt: 'They drink a third of what their parents drink and hardly sweat. In full glare their eyes close to a slit without their choosing it, and they walk the dust flats at noon bareheaded.', use: 'the long hauls across the dust flats at noon' },
  ruin: { den: 'a roofed gallery in the old walls', rest: 'walled into the old galleries',
    adapt: 'They hear something under the old walls that the instruments record and no founder can. They cross the rubble fields in the dark without a lamp and do not fall.', use: 'the low galleries no founder will go into' },
  ice: { den: 'a snow hollow in the lee of the ridge', rest: 'left out on the ice',
    adapt: 'They do not shiver. Six of them sat an hour in the cold store with a blanket each, and none of them used the blanket. Their hands stay warm in a cold that takes a founder\'s fingers.', use: 'the outside work in the dark months' },
  drowned: { den: 'a raft of cut reed, moored past the far markers', rest: 'sunk on the reef with a stone',
    adapt: 'They stay under for four minutes without distress, and the youngest for longer. Their ears do not trouble them at depth, and they see well in silted water.', use: 'the diving on the lagoon floor' },
  jungle: { den: 'a platform in the canopy, a morning\'s walk out', rest: 'laid uncovered at the foot of a tree',
    adapt: 'The rash every founder gets from the undergrowth does not come up on them. They breathe the spore season without a mask and do not cough.', use: 'the cutting in the undergrowth through spore season' },
  garden: { den: 'a dug hollow on the far side of the downs', rest: 'laid under the turf with no marker',
    adapt: 'They eat the bulbs from under the turf raw, the ones that put founders in the clinic, and thrive on them. The clinic finds things living in their gut that no founder carries.', use: 'the foraging out on the downs' },
};
const here = s => HERE[s.world.type] || HERE.garden;

/* ================= growing up ================= */
B({ id: 'gen.grave', aside: true, tone: 'pressure', title: 'A Small Box', w: 7,
  when: s => { const x = X(s); return !!x.lostDay && s.day - x.lostDay < 2 * YEAR && !s.flags.gn_grave && s.pop >= 20 && mile(s); },
  setup: s => ({ cause: s.res.food <= 0 ? 'hunger' : !s.built.school ? 'a fever, in a colony with no clinic bed small enough' : 'a fever the clinic could not name' }),
  text: (s, c) => `The first of the children born on ${s.world.planet} to die here died in the night, of ${c.cause}. The parents carried the box to the burial ground themselves, and found no small plot there, because nobody had planned one.\n\n${Nc(s, 'physician')} wants the body for a day first.\n\n[[physician]] "I don't know what kills them here, and I won't unless I look. Give me till tomorrow night, and the next one might not have to die of it. They've said no twice, and I'd say no too, so you go and ask them again."`,
  choices: [
    { label: 'Give the clinic its day, over the parents\' refusal', dark: true, info: [['yield', 'Fewer of the children lost, from now on'], ['danger', 'The parents']],
      out: { text: s => `${Nc(s, 'physician')} does it alone with the door locked, and is finished before the light goes. The findings fill two pages and change what the clinic does for every child after this one. The parents get the box back sealed. They bury it without the colony, and do not come to the hall again.`,
        fx: () => ({ morale: -2, stain: ['gn_opened_child', 2], flags: { gn_grave: 'opened' }, do: s2 => risk(s2, 0.65) }) } },
    { label: 'Stand the colony down for the burial', info: [['danger', 'A day of every crew\'s work'], ['danger', 'The next child, of the same thing']],
      out: { text: s => `Every crew is stood down. A small plot is marked out beside the first row, and the whole colony walks behind the box. ${Nc(s, 'physician')} walks with them. Whatever killed the child is still in the rows, and the clinic knows no more about it than it did.`,
        fx: () => ({ food: -40, morale: 4, flags: { gn_grave: 'buried' }, do: s2 => { s2.grief = Math.max(0, s2.grief - 8); } }) } },
    { label: 'The burial is at first light, and the shifts start on time', info: [['danger', 'The parents'], ['danger', 'The next child, of the same thing']],
      out: { text: 'It is done before the first bell, by the parents and two diggers. The crews pass the fresh ground on the way to the fields. Both parents are on shift by the second bell, because the roster says so, and the crew beside them does their share of the row without being asked.',
        fx: () => ({ morale: -2, tension: 4, flags: { gn_grave: 'shift' } }) } },
  ] });

B({ id: 'gen.school', aside: true, tone: 'quiet', title: 'What the School Is For',
  when: s => !!s.built.school && kids(s) >= 6 && eldest(s) >= 4 && !s.flags.gn_school && mile(s),
  setup: s => ({ n: LF.children(s).n }),
  text: (s, c) => `There are ${num(c.n)} children in the school now and one shelf of books, every one of them about a world the children will never see. The two teachers have fallen out over the timetable and brought it to you.\n\nOne wants the ship's curriculum whole: the charter, the old history, the sciences in order. The other wants the mornings spent outside the wire, learning what bites, what burns and what can be eaten.`,
  choices: [
    { label: 'The ship\'s curriculum. They are colonists first', note: 'Children who can recite the charter, and cannot tell what feeds them out there from what kills them.', info: [['danger', 'The children, past the wire']],
      out: { text: 'The mornings stay indoors. By the end of the year the eldest can name the nine articles and the rivers of a continent none of them will walk on. Past the wire they are as lost as their parents were in the first month, and less afraid.',
        fx: () => ({ morale: 3, flags: { gn_school: 'ship' }, do: s2 => risk(s2, 1.1) }) } },
    { label: 'The mornings outside', info: [['yield', 'The map, and children who know the ground'], ['danger', 'One of the children']],
      out: { text: 'They go out in a line behind one teacher with a stick. They learn fast, and faster than the teacher. One morning the line comes back one short, and what happened to that one is the lesson for the rest of the season.',
        fx: () => ({ survey: 10, chips: kidChip(1), flags: { gn_school: 'world' }, do: s2 => { young(s2, 1); risk(s2, 0.85); } }) } },
    { label: 'Mornings in school. From eight years old, afternoons on the crews', dark: true, info: [['yield', 'Food and materials'], ['danger', 'The children over eight']],
      out: { text: 'The timetable is rewritten in an afternoon. The under-eights have the school to themselves after the noon bell. The rest carry water, pick stone and sort seed until dusk, and fall asleep over the charter the next morning.',
        fx: () => ({ food: 80, mat: 15, stain: ['gn_halfdays', 2], flags: { gn_school: 'work' }, do: s2 => grudge(s2, 1) }) } },
  ] });

B({ id: 'gen.strange', aside: true, tone: 'quiet', title: 'Their Own Words',
  when: s => eldest(s) >= 6 && kids(s) >= 8 && !s.flags.gn_strange && mile(s),
  text: s => `The children born here have words their parents do not. There is one for the hour the light goes, one for the sound the wire makes in wind, and one, used often, that seems to mean the grown. They do not use the ship's names for the days.\n\nThe school says the under-sixes now speak it to each other first, and the ship's language second, and badly. Three parents have asked for it to be stopped.`,
  choices: [
    { label: 'The ship\'s language in school, and the strap for the other', dark: true, info: [['yield', 'The parents'], ['danger', 'The children']],
      out: { text: 'The rule is posted and the strap is used, on four children in the first month. The words go out of the schoolroom. They stay in the yard. The children have a new one now, which they say when a teacher comes near.',
        fx: () => ({ morale: 2, stain: ['gn_tongue', 1], flags: { gn_strange: 'strap' }, do: s2 => grudge(s2, 2) }) } },
    { label: 'Let them have it', info: [['danger', 'Parents who cannot follow their own table']],
      out: { text: 'Nothing is posted. By the turn of the year there are households where the children talk across the table in it and the parents eat without a word. One mother has started learning it from her own five-year-old, a word a night.',
        fx: () => ({ morale: -1, flags: { gn_strange: 'let' } }) } },
    { label: 'Put a clerk in the yard to learn it and write it down', cost: { food: 30 }, info: [['yield', 'The map'], ['danger', 'A pair of hands off the fields']],
      out: { text: 'The clerk fills a notebook in a season. Eleven of the words are for kinds of ground the survey has no names for, and each turns out to be a real difference. The children watch the clerk writing. By the next season they have a second set of words.',
        fx: () => ({ survey: 12, morale: 1, flags: { gn_strange: 'learn' } }) } },
  ] });

B({ id: 'gen.adapt', tone: 'opportunity', title: 'What the Clinic Found',
  when: s => eldest(s) >= 8 && kids(s) >= 10 && !s.flags.gn_adapt,
  setup: s => ({ kd: share(s, 0.02, 1, 40), kd2: share(s, 0.03, 1, 60) }),
  text: s => `The children born here are not built quite as their parents are, and the clinic can now say how. ${here(s).adapt}\n\n${Nc(s, 'physician')} has it written up and cannot explain it.\n\n[[physician]] "It's not in any genome I've got on file for them. It's this place, doing it to them while they grow, and I won't pretend that doesn't frighten me. I'd like to know what else it's doing."\n\n${Nc(s, 'quartermaster')} has read the same report, and thought of ${here(s).use}.`,
  choices: [
    { label: s => `Use it. The children do ${here(s).use}`, dark: true, info: [['yield', 'Food, materials and the map'], ['danger', 'The children sent']],
      out: { text: (s, c) => `The eldest are put on it under a founder, who stands where a founder can stand and watches. They do in a morning what a grown crew did in a month. ${Num(c.kd)} of them ${c.kd === 1 ? 'is' : 'are'} lost at it in the first year, to things the report had not thought to test for.`,
        fx: (s, c) => ({ food: 100, mat: 30, survey: 8, stain: ['gn_sent', 2], chips: kidChip(c.kd), flags: { gn_adapt: 'used' }, do: s2 => { young(s2, c.kd, true); grudge(s2, 1); } }) } },
    { label: 'Study it. A clinic morning each month for every child born here', info: [['yield', 'Fewer of the children lost'], ['danger', 'What the children make of the clinic']],
      out: { text: 'They are weighed, bled and photographed by year. In two seasons the clinic learns enough to stop losing them to fevers it could not read. The children learn to dread the clinic bell, and the smallest have to be carried in.',
        fx: () => ({ morale: -1, flags: { gn_adapt: 'study' }, do: s2 => { risk(s2, 0.75); grudge(s2, 1); } }) } },
    { label: 'Treat it. Whatever this place is doing to them, the clinic stops it', dark: true, info: [['yield', 'The founders\' peace of mind'], ['danger', 'The children who do not take the course well']],
      out: { text: (s, c) => `${Nc(s, 'physician')} argues for a day and then writes the course of doses. It works on most of them. They are as their parents are now, and their parents are relieved. ${Num(c.kd2)} of them did not come through the course.`,
        fx: (s, c) => ({ morale: 3, stain: ['gn_treated', 2], chips: kidChip(c.kd2), flags: { gn_adapt: 'treated' }, do: s2 => { young(s2, c.kd2); risk(s2, 1.05); regard(s2, 'physician', -10); } }) } },
  ] });

B({ id: 'gen.wire', view: 'world', tone: 'pressure', title: 'The Ones Who Stay Out',
  when: s => eldest(s) >= 10 && kids(s) >= 14 && !s.flags.gn_wire,
  setup: s => ({ n: share(s, 0.04, 2, 60), age: Math.min(13, eldest(s)) }),
  text: (s, c) => `${Num(c.n)} of the older children did not come in at dusk. It has happened before, but this time they have stayed out a month. They are living in ${here(s).den}, eating ${LF.lex(s, 'wild')} and whatever else they have learned to find, and they look better fed than the ones in school.\n\nThe eldest is ${num(c.age)}. A younger one carried the message in: they will come to the gate to visit.`,
  choices: [
    { label: 'Send the watch to bring them in', test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'The children, inside'], ['danger', 'A chase with children in it']],
      ok: { text: 'They are walked in between the watch, filthy and furious. Two go again inside the month and are brought back again. After that the eldest is put on a crew at the far end of the colony, and the going stops.',
        fx: () => ({ flags: { gn_wire: 'in' }, do: s2 => grudge(s2, 1) }) },
      bad: { text: 'The watch finds the place at dusk and the children run. One of them falls in the dark and is carried back dead. The rest are not found again, and nobody is sent a second time.',
        fx: (s, c) => ({ morale: -5, chips: kidChip(1).concat(c.n > 1 ? goneChip(c.n - 1) : []), flags: { gn_wire: 'out' }, do: s2 => { young(s2, 1, true); const x = X(s2); x.out = LF.loseYoung(s2, c.n - 1, true); x.wireDay = s2.day; grudge(s2, 2); } }) } },
    { label: 'Let them stay, and leave food at the far marker', cost: { food: 40 }, info: [['yield', 'The map'], ['danger', 'The parents, and whoever follows them out']],
      out: { text: 'A sack goes out to the marker each month and is gone by morning. They come to the gate when they said they would, sit with their parents on the inside of it for an hour, and go back out. More of the older ones have started looking at the wire.',
        fx: (s, c) => ({ survey: 12, morale: -1, chips: goneChip(c.n), flags: { gn_wire: 'out' }, do: s2 => { const x = X(s2); x.out = LF.loseYoung(s2, c.n, true); x.wireDay = s2.day; } }) } },
    { label: 'Shut the gate on them. Whoever chooses out stays out', dark: true, info: [['yield', 'Nobody else goes'], ['danger', 'The children outside, and their parents']],
      out: { text: 'It is said at the gate, loudly, with the school lined up to hear it. The gate is barred at dusk from then on. No other child goes. The parents of the ones outside walk the wire in the evenings for a season, and then stop.',
        fx: (s, c) => ({ morale: -4, tension: -8, stain: ['gn_shut', 2], chips: goneChip(c.n), flags: { gn_wire: 'shut' }, do: s2 => { LF.loseYoung(s2, c.n, true); } }) } },
  ] });

B({ id: 'gen.outside', far: true, view: 'world', tone: 'opportunity', title: 'The Ones Outside', w: 5,
  when: s => { const x = X(s); return s.flags.gn_wire === 'out' && (x.out || 0) > 0 && s.day >= (x.wireDay || 0) + 3 * YEAR && !s.flags.gn_outside; },
  setup: s => ({ n: Math.round(X(s).out * 1.5) + 1 }),
  text: (s, c) => `The ones who went past the wire came to the gate at noon: ${num(c.n)} of them now, grown and ${LF.lex(s, 'burnt')}, carrying nets of ${LF.lex(s, 'wild1')}. They have never gone hungry out there, and they will say where the food is.\n\nThey ask one thing for it. Every child of the colony spends the season it turns ten outside with them, and comes back or does not, as it chooses.`,
  choices: [
    { label: 'Agree. Every child goes out for a season at ten', info: [['yield', 'Food, and the map'], ['danger', 'The ones who choose not to come back']],
      out: { text: 'The first ten-year-olds go out at the turn of the season with a blanket each. Most come back at the end of it, taller, and able to feed themselves off ground their parents would starve on. The ones who stay out send word that they are well.',
        fx: () => ({ food: 120, survey: 20, morale: -3, flags: { gn_outside: 'season' }, do: s2 => { risk(s2, 1.1); grudge(s2, -2); } }) } },
    { label: 'Trade with them at the gate, and nothing more', info: [['yield', 'Some food'], ['danger', 'What the ten-year-olds do about it themselves']],
      out: { text: 'They leave the nets and take plate and line in exchange, and come back each season with more. They do not ask again about the children. The ten-year-olds have worked out for themselves where the far marker is.',
        fx: () => ({ food: 60, mat: -10, flags: { gn_outside: 'trade' } }) } },
    { label: 'Take them at the gate. They are colonists who left their posts', dark: true, test: { base: 50, mods: [R('security', 10)] }, info: (s, c) => [['yield', `${Num(c.n)} pairs of grown hands`], ['danger', 'A fight at the gate']],
      ok: { text: 'The gate is shut behind them while they are still talking. They are entered on the work roster under their own names and put on separate crews. They work. They teach nobody where the food is.',
        fx: (s, c) => ({ pop: c.n, morale: -4, stain: ['gn_taken_back', 2], flags: { gn_outside: 'taken' }, do: s2 => grudge(s2, 2) }) },
      bad: { text: 'One of them sees the gate moving. It is fought at the gateposts with tools. Three of the watch are down before the ones from outside are over the wire, and they do not come to the gate again.',
        fx: () => ({ dead: 3, morale: -6, stain: ['gn_taken_back', 1], flags: { gn_outside: 'fought' }, do: s2 => grudge(s2, 2) }) } },
  ] });

B({ id: 'gen.ofage', aside: true, far: true, chain: true, tone: 'pressure', title: AGE.charAt(0).toUpperCase() + AGE.slice(1),
  when: s => !!X(s).ofAge && !s.flags.gn_ofage,
  setup: s => ({ n: Math.max(1, X(s).firstAged || 1) }),
  text: (s, c) => `${Num(c.n)} of the children born here turned ${AGE} at the turn of the year and ${c.n === 1 ? 'is' : 'are'} on the work roster this morning, as the rule says. ${c.n === 1 ? 'The coverall was' : 'Their coveralls were'} cut down from a parent's. ${c.n === 1 ? 'This is the first hand' : 'They are the first hands'} the colony has raised for itself.\n\n${Nc(s, 'quartermaster')} has three crews short of hands.\n\n[[quartermaster]] "Same ladle as anyone, if they work. That's fair. Where they work is yours to say."`,
  choices: [
    { label: 'The haul crew is shortest. That is where a new hand goes', dark: true, info: [['yield', 'Materials'], ['danger', 'One of the new hands, on the incline']],
      out: { text: 'A new hand goes on the haul line between two grown ones, and keeps the pace for a month. Then a load shifts on the incline, and the youngest hand on the line does not get clear. The crew carries the body down with the stone.',
        fx: () => ({ mat: 30, dead: 1, morale: -4, stain: ['gn_haul', 2], flags: { gn_ofage: 'hard' }, do: s2 => grudge(s2, 2) }) } },
    { label: 'Field work on half shifts, and two more years of school in the afternoons', info: [['danger', 'The crews that stay short']],
      out: { text: 'The mornings are weeding, and the noon bell means a desk. The crews that were short stay short, and say so. The new hands become the first people in the colony to read the charter right through since it was written.',
        fx: () => ({ food: -60, morale: 1, flags: { gn_ofage: 'soft' }, do: s2 => grudge(s2, -1) }) } },
    { label: 'Ask them', info: [['yield', 'The map'], ['danger', 'The founders\' idea of what a roster is']],
      out: { text: 'The answer comes after a conference in their own words: the survey line, past the wire, where no founder likes to go. It is done well from the start. The founders on the roster committee say out loud that a shift is given and not chosen, and that this is how it begins.',
        fx: () => ({ survey: 14, tension: 6, flags: { gn_ofage: 'ask' }, do: s2 => { grudge(s2, -1); allRegard(s2, -3, p => p.vals.free === -1); } }) } },
  ] });

B({ id: 'gen.lines', far: true, tone: 'pressure', title: 'The Book of Lines',
  when: s => G(s).born >= 10 && !s.flags.gn_lines,
  setup: s => ({ via: X(s).boardY ? 'the pairing board' : X(s).tank ? 'the incubators' : 'a household that was never spoken of' }),
  text: (s, c) => `Everyone born here is descended from the few hundred who came down, and the clinic keeps a book of who is whose. Two of the born who want to marry have been told they cannot. By the book they are cousins twice over. Neither knew it, because one of the lines runs through ${c.via}.\n\nThey have asked to see the book. So have a good many of their friends.`,
  choices: [
    { label: 'No marriage without the clinic\'s stamp. This one is refused', dark: true, info: [['yield', 'Fewer infants lost'], ['danger', 'Every pair the book refuses']],
      out: { text: 'The stamp becomes law. The two are refused, move into one house anyway, and their first child is entered in the book with a mark beside the name. The clinic loses fewer infants to the things the book was kept to prevent.',
        fx: () => ({ morale: -3, stain: ['gn_stamp', 1], flags: { gn_lines: 'stamp' }, do: s2 => { risk(s2, 0.9); grudge(s2, 1); } }) } },
    { label: 'Open the book. Let them read it and choose', info: [['danger', 'Everything else that is written in it']],
      out: { text: 'The book lies open in the hall for a month. People find what they expected and several things they did not: who fathered whom in the hungry years, and which names were changed. Four households break up. The two marry.',
        fx: () => ({ morale: -5, tension: 6, flags: { gn_lines: 'open' }, do: s2 => risk(s2, 1.08) }) } },
    { label: 'Thaw the bank. From now on every third child is a stranger\'s, assigned by the clinic', dark: true, info: [['yield', 'More children, wider blood'], ['danger', 'Whoever is told to carry']],
      out: { text: 'The clinic begins assigning embryos from the bank to every third household on its list, asked or not. The blood widens, as intended. The two marry. The children from the bank have faces nobody else in the colony has, and are known by them.',
        fx: () => ({ morale: -2, stain: ['assigned', 2], flags: { gn_lines: 'bank', embryo_program: true, births: true }, do: s2 => risk(s2, 0.92) }) } },
    { label: 'Close the book. It was kept for a camp of two hundred', info: [['danger', 'Infants, some years on']],
      out: { text: 'The book is closed and shelved. The two marry, and so does everyone else who wants to. For some years nothing shows. Then the clinic starts keeping a different book, of infants, and does not publish that one either.',
        fx: () => ({ morale: 2, flags: { gn_lines: 'closed' }, do: s2 => risk(s2, 1.2) }) } },
  ] });

/* ================= the born against the founders ================= */
RU({ id: 'gen.vote', far: true, tone: 'pressure', title: 'A Hand in the Hall',
  when: s => { const x = X(s); return !!x.ofAge && s.day >= x.ofAge + 10 * MONTH && G(s).born >= 6 && !s.flags.gn_vote && !s.flags.born_rule; },   // born_rule: late.born was signed, and the charter this card argues over is struck
  setup: s => Object.assign(voiceCtx(s), { n: G(s).born }),
  text: (s, c) => `The charter gives a vote in the hall to every colonist who signed it. There are ${num(c.n)} of the grown now who were born here, work a full shift, and signed nothing. ${c.name} is one of them, and has read the charter more closely than anyone since it was written.\n\n[[${c.pid}]] "It says colonist. It says signed. We've looked, and there's no page left to sign. So find us one, or tell us what we are."`,
  choices: [
    { label: `A vote at ${AGE}, the same as a shift at ${AGE}`, info: [['yield', 'The born'], ['danger', 'The founders\' hold on the hall']],
      out: { text: (s, c) => `A page is added and they sign it one after another in the hall, ${c.name} last. The founders now share the floor with people a third their age. The first motion from the new benches is about the wire, and it nearly carries.`,
        fx: () => ({ morale: 3, flags: { gn_vote: 'full' }, do: s2 => { grudge(s2, -2); allRegard(s2, -4, p => p.vals.free === -1); } }) } },
    { label: 'A vote for any of them who pass an examination on the charter', dark: true, note: 'The founders set the paper.', info: [['yield', 'The hall stays the founders\''], ['danger', 'Two in three of the born']],
      out: { text: (s, c) => `The paper is set by a committee of founders and runs to nine pages. A third of the born pass it. ${c.name} passes with the highest mark anyone has made, takes the seat, and uses the first speech to read the paper aloud, question by question.`,
        fx: () => ({ tension: -4, stain: ['gn_exam', 1], flags: { gn_vote: 'exam' }, do: s2 => grudge(s2, 2) }) } },
    { label: 'The charter says signed. They speak from a bench at the back, and do not vote', info: [['danger', 'Everyone on that bench']],
      out: { text: (s, c) => `A bench is set against the back wall. They fill it every meeting, speak when called, and watch the hands go up on the motions that set their shifts. ${c.name} keeps a count of every vote that would have gone the other way.`,
        fx: () => ({ morale: -3, flags: { gn_vote: 'bench' }, do: s2 => grudge(s2, 2) }) } },
  ] });

/* Eight of the founders' rules, refused one at a time. keep: the watch enforces it; strike: it goes; deal: something between. */
const RULES = {
  wire: { rule: () => 'Nobody goes outside the wire after dusk. The founders wrote that in the first year, when things came to the wire at night.',
    done: () => 'A dozen of the born went out at dusk yesterday, openly, to take what moves at night, and walked back in past the watch at dawn with full nets.',
    say: 'It\'s when the food\'s out. You wrote that rule about a place you were afraid of. We live here.',
    keep: 'The watch meets the next night party at the gate and takes the nets. Six are locked up for a month. The parties go on, by another way out, and stop bringing what they catch to the common store.',
    strike: 'The dusk bell is taken down. The night nets bring in twice what the day nets do. In the second season a party of five does not come back, and nobody can say for certain that the rule would have saved them.', strikeFx: { food: 100, dead: 5 },
    deal: 'Night parties, logged out and in by the watch', dealText: 'A book is kept at the gate. The born sign it with marks the watch cannot read, and come back when they come back. The nets are fuller. The watch has a book of marks.', dealFx: { food: 60, tension: 3 } },
  days: { rule: () => 'The colony keeps the ship\'s calendar: seven days with a rest day, and twelve months named for a sky nobody born here has seen.',
    done: s => `The born crews work by ${s.world.planet}'s own weather and rest when it says to. The two rosters stopped matching this season, and the smelter stood cold for two shifts with half a crew at its door.`,
    say: 'Your rest day\'s a number. Ours is when the wind\'s wrong. Ask the fields which of us is right.',
    keep: 'The roster is enforced with the ladle: no shift on the board, no bowl. The born crews turn up on the founders\' days and work them slowly. The smelter runs. The fields are weeded on the wrong mornings.',
    strike: 'The seven-day roster comes off the wall. Work goes by the weather, and the fields do better for it. The founders lose their rest day and their count of the weeks, and some go on marking both in private.', strikeFx: { food: 90, morale: -2 },
    deal: 'Two rosters, and a clerk to reconcile them', dealText: 'A clerk is given a desk between the two boards. The smelter gets a full crew most days. The clerk is the only person in the colony who knows what day it is for everybody, and is asked forty times a shift.', dealFx: { food: -30, morale: 1 } },
  ration: { rule: () => 'Every ladle is signed for in the ration book, and the reserve is sealed under three signatures. It was written in the hungry years.',
    done: s => `The born eat from what they catch and from plots of ${LF.lex(s, 'wild1')} they planted themselves, and sign for none of it. The book no longer says what the colony has.`,
    say: 'We\'re not hiding it. Come and count it. We\'re just not asking leave to eat what we grew.',
    keep: 'The watch goes through the east rows with the book and enters what it finds. Two growers who would not open their stores are locked up. Next season the plots are smaller, and further out, where the watch does not go.',
    strike: 'The book is closed and shelved. People eat what there is. It is a good year, and nobody is sure how good, and the reserve is opened twice without anyone writing down why.', strikeFx: { morale: 4, food: -120 },
    deal: 'Their plots stay off the book, and pay a tenth into the reserve', dealText: 'The tenth comes in at harvest, in nets, counted by the born and not by the clerk. The reserve is fuller than the book says. The founders on the stores committee sign for a number they did not weigh.', dealFx: { food: 50, tension: 2 } },
  dead: { rule: () => 'The dead go in the burial ground, in a row, each under a plate cut from the hull.',
    done: s => `The born have stopped bringing theirs. Three who died this year were ${here(s).rest}, the way the born say this place wants it, and their names are on no plate.`,
    say: 'The plates are for people off a ship. They weren\'t off a ship.',
    keep: 'The three are found, brought in and buried in the row under plates, with the watch standing by. Their kin stay away. The next of the born to die is not reported at all.',
    strike: 'The burial ground takes only founders after that. The born keep their dead their own way, in a place the founders are not shown. The row of plates grows from one end only.', strikeFx: { morale: 1, mat: 8 },
    deal: 'Their way, with every name on a plate in the row', dealText: 'The born agree to the plates and nothing under them. The row fills with names over empty ground. The founders tend it anyway, and some of the born come to watch them do it.', dealFx: { mat: -6, morale: 1 } },
  silence: { rule: () => 'On Landfall Day the colony keeps an hour of silence at noon, for Earth and for the ones who died on the way.',
    done: () => 'Last year the born stood through it. This year the east rows have said they will work through it, with the saws going.',
    say: 'We\'ll stand for our own dead. We never met yours. An hour\'s a lot of timber.',
    keep: 'The watch stops the saws at noon. The east rows stand for the hour with their arms folded. It is silent, which is what the rule asks for.',
    strike: 'Landfall Day becomes a day like any other. At noon the founders stand in the yard anyway, a few dozen grey heads in the noise, and the saws do not stop.', strikeFx: { food: 30, morale: -2 },
    deal: 'The hour stays, for founders. The born work quietly, away from the yard', dealText: 'At noon the saws stop and the born go to the far plots with hand tools. The founders have the yard to themselves. It is the first Landfall Day on which they can hear how few of them there are.', dealFx: { morale: -1 } },
  sleepers: { ok: s => s.sleepers > 0, rule: () => 'A tenth of every harvest is sealed as the sleepers\' share, for the people still in the pods overhead.',
    done: () => 'The born crews held theirs back this harvest. It is stacked in the east rows, in the open.',
    say: 'Feed who? None of us has seen one. There are children in the rows who could eat that.',
    keep: 'The held grain is carted to the sealed reserve under guard, with the born crews watching it go. The next harvest comes in a tenth light, and nobody can find the tenth.',
    strike: 'The share is struck. The held grain goes to the rows. The reserve for the sleepers stands as it is and will not be added to, and anyone woken from now on is woken into what there is.', strikeFx: { food: 150 },
    deal: 'Halve it', dealText: 'A twentieth is sealed and a twentieth goes to the rows. The born crews bring it in without being asked. The founders who have kin in the pods do the sum of how many years the reserve now covers, and keep it to themselves.', dealFx: { food: 70 } },
  arms: { rule: () => 'The armoury keys are held by three founders, and a rifle is signed out only to the watch.',
    done: () => 'The born who work past the wire have been making their own: bows, and two rifles built from pipe in the machine shop at night.',
    say: 'You send us out there. We\'d like to come back.',
    keep: 'The pipe rifles are found and broken on the machine shop floor, and the two who made them are locked up. The outside crews go out with what they are issued. Two of them do not come back that season.', keepFx: { dead: 2 },
    strike: 'The armoury is opened to anyone on outside work. Fewer are lost past the wire that year. There are rifles in the east rows now, and the watch counts them as best it can.', strikeFx: { survey: 6, tension: 8 },
    deal: 'A fourth key, held by one of the born', dealText: 'A fourth key is cut. Rifles go out with the outside crews and come back, mostly. The three founders change the day they meet, and do not tell the fourth key-holder why.', dealFx: { survey: 4, tension: 3 } },
  names: { rule: () => 'The founders named every hill and water on the map after places on Earth.',
    done: () => 'The born use none of those names. The survey office gets reports it cannot place, because the born name a place for what it does, and the founders named it for what it reminded someone of.',
    say: 'We don\'t know what a Thames is. We know where the water turns bad.',
    keep: 'Reports that use the born names are sent back unread. The reports get shorter. A survey party is long overdue before anyone works out which water it said it was going to.', keepFx: { survey: -6 },
    strike: 'The map is redrawn with the born names, and the survey parties stop getting lost. The old sheets go to the archive. A founder who goes looking for the hill named after a home town is told, kindly, which hill that used to be.', strikeFx: { survey: 15, morale: -2 },
    deal: 'Both names on every sheet', dealText: 'The sheets are redrawn with two names to each place, the old one in brackets. The born read the first and the founders the second. The draughting takes a season of plate and ink.', dealFx: { survey: 8, mat: -5 } },
};
const openRules = s => Object.keys(RULES).filter(k => !(X(s).rules || []).includes(k) && (!RULES[k].ok || RULES[k].ok(s)));
RU({ id: 'gen.rules', far: true, tone: 'pressure', title: 'Not Our Rule', repeat: 26 * MONTH, max: 7,
  when: s => G(s).born >= 8 && !s.flags.born_rule && openRules(s).length > 0,
  setup: s => { const x = X(s), k = LF.spick(s, openRules(s)); (x.rules = x.rules || []).push(k);
    return Object.assign(voiceCtx(s), { k, rule: RULES[k].rule(s), done: RULES[k].done(s), lvl: x.grudge < 3 ? 'It was asked for first, twice, in the hall, and voted down both times.' : x.grudge < 6 ? 'This time nobody asked. It was announced in the hall as a thing already done.' : 'No one asked and no one announced it. In every row, in the same month, the rule stopped being obeyed.' }); },
  text: (s, c) => `${c.rule} ${c.done} ${c.lvl}\n\n${c.name} denies none of it.\n\n[[${c.pid}]] "${RULES[c.k].say}"`,
  choices: [
    { label: 'The rule stands, and the watch enforces it', dark: true, info: [['yield', 'The rule, and the founders'], ['danger', 'The born']],
      out: { text: (s, c) => RULES[c.k].keep, fx: (s, c) => Object.assign({ morale: -4, tension: -6, stain: ['gn_enforced', 1], do: s2 => grudge(s2, 2) }, RULES[c.k].keepFx || {}) } },
    { label: 'Strike the rule', info: [['yield', 'The born'], ['danger', 'The founders, and whatever the rule was for']],
      out: { text: (s, c) => RULES[c.k].strike, fx: (s, c) => Object.assign({ do: s2 => { grudge(s2, -1); X(s2).struck = (X(s2).struck || 0) + 1; allRegard(s2, -2, p => p.vals.free === -1); } }, RULES[c.k].strikeFx || {}) } },
    { label: (s, c) => RULES[c.k].deal, info: [['danger', 'Both sides, a little']],
      out: { text: (s, c) => RULES[c.k].dealText, fx: (s, c) => Object.assign({}, RULES[c.k].dealFx || {}) } },
  ] });

RU({ id: 'gen.count', far: true, tone: 'pressure', title: 'More of Them Than Us', w: 4,
  when: s => !!G(s).chairs && !s.flags.gn_count && G(s).born >= 8,
  setup: s => Object.assign(voiceCtx(s), { olds: Math.max(3, founders(s)) }),
  text: (s, c) => `The ration roll shows it this month: more of the grown were born here than came on the ship. There are ${LF.num(c.olds)} left of the ones who came on the ship, and they still hold the stores keys and the armoury.\n\nA paper is going round the old rows, and it asks for one thing.\n\n[[note:The paper going round the old rows]] "A vote from anyone who came on the ship is to count double until the colony is safe."\n\nIt does not say who decides when that is. ${c.name} has seen a copy, and has asked you in the hall whether you have.`,
  choices: [
    { label: 'Sign the old rows\' paper', dark: true, info: [['yield', 'Order, and the old rows'], ['danger', 'Every vote the born cast from now on']],
      out: { text: 'It carries on the old rows\' own votes, counted singly for the last time. From then on every motion from the new benches fails by the same margin. The born keep coming to the hall. They have stopped putting motions, and started meeting in the east rows afterwards.',
        fx: () => ({ tension: -10, morale: -4, stain: ['gn_double', 2], flags: { gn_count: 'double' }, do: s2 => grudge(s2, 3) }) } },
    { label: 'One hand, one vote, and the paper goes in the stove', info: [['yield', 'The born'], ['danger', 'The old rows, on every motion from now on']],
      out: { text: (s, c) => `You burn it in the hall stove with the hall watching. The next three motions go against the old rows, and so will the ones after. Some of the old rows stop coming. On the fourth motion ${c.name} moves that their seats be kept for them.`,
        fx: () => ({ morale: 3, flags: { gn_count: 'equal' }, do: s2 => { grudge(s2, -3); allRegard(s2, -6, p => p.vals.free === -1); } }) } },
    { label: 'Give them the stores keys now, and keep the armoury', info: [['yield', 'Morale'], ['danger', 'The sealed reserve']],
      out: { text: 'The keys change hands on the stores step. The first thing the born do is open the sealed reserve and feed the east rows properly for a month. The second is to put a guard of their own on the door and hand the old rows a chit book.',
        fx: () => ({ food: -150, morale: 5, flags: { gn_count: 'keys' }, do: s2 => grudge(s2, -1) }) } },
  ] });

/* The first officer in each seat who never saw the ship, and the first thing each of them asks for. */
const CHAIR = {
  command: { want: () => 'The charter is read out in full at the turn of every year, and it takes most of an evening. The request is that it be read once more and then put in the archive. After that the colony runs on what the hall decides, year by year.',
    yes: 'It is read for the last time to a full hall. The founders say the words along with the reader. Then the book goes to the archive, and the first thing the hall decides without it is how long a shift is.', yesFx: { morale: 3, tension: 4 },
    half: 'Keep the nine articles, and drop the rest', halfText: 'The nine articles are painted on the hall wall and the other forty pages go to the archive. The born can now read the whole law standing up. The founders point out, correctly, that everything they argued over for a year was in the forty pages.', halfFx: { morale: 1 } },
  security: { want: s => `The rows have grown past the wire on two sides. The request is that the old wire come down, and that the watch walk the rows at night and stop standing at a gate nobody uses.`,
    yes: s => `The wire is rolled up and goes to the yard as stock. The watch walks the rows. For the first time since the landing there is no line between the colony and ${s.world.planet}, and the founders who strung the first fence sleep badly.`, yesFx: { mat: 30, tension: 6 },
    half: 'Take down the two sides the rows have already crossed', halfText: 'Two sides come down and two stay up, guarding the oldest rows from the newest. The watch splits itself between the fence and the streets and is thin on both.', halfFx: { mat: 14, tension: 2 } },
  engineer: { want: () => 'The spares catalogue lists every part by the ship\'s gauges. The request is that it be dropped. Everything would be made to the smelter\'s own gauge, which is quicker, and nothing new would ever again fit anything that came down from orbit.',
    yes: 'The ship gauges are hung on the workshop wall as curiosities. The shop turns out parts half again as fast. When the oldest machine next stops, nothing on the shelves fits it, as everyone had been told.', yesFx: { parts: 14, mat: 10, tension: 3 },
    half: 'Both gauges, and two sets of shelves', halfText: 'The shop keeps both. Every job starts with an argument about which shelf, and the apprentices learn two sets of numbers. The old machines go on being mended.', halfFx: { parts: 6 } },
  doctor: { want: () => 'The embryo bank draws power the clinic\'s cold store could use, to keep four thousand strangers frozen. The request is that it be switched off.', say: '"Four thousand people nobody here is kin to."',
    yes: 'The bank is switched off at the turn of the month. The cold store now holds a season of medicines it had no room for, and fewer of the sick are lost. The colony is descended from the people who came down and from nobody else, for good.', yesFx: { morale: -1 }, yesDo: s => { s.flags.embryo_program = false; s.flags.gn_bank_off = s.day; risk(s, 0.9); const t = X(s).tank; if (t && !t.off) t.off = s.day; },
    half: 'Keep a tenth of it, chosen for spread', halfText: 'The clinic spends a season choosing four hundred and lets the rest thaw. The cold store gets most of the power. Nobody is comfortable with how the four hundred were chosen, the clinic least of all.', halfFx: { morale: -1 }, halfDo: s => risk(s, 0.95) },
  scientist: { want: () => 'Nothing from outside the wire may be eaten, burned or built with until the lab has cleared it. The founders wrote that after the first deaths. The request, from someone raised on things the lab never cleared, is that the rule go.',
    yes: 'The clearance book is closed. The kitchens take in six new foods in a season and the yard two new timbers. One of the foods does something slow to the people who were not born here. Two founders are dead of it before the clinic sees which.', yesFx: { food: 120, dead: 2 },
    half: 'Cleared for the born on their own say. The founders keep the book', halfText: 'Two tables are laid in the hall. The born eat what they like at one. The founders eat from the book at the other, and watch what is on the plates across the room.', halfFx: { food: 60, morale: -1 } },
  crew: { want: s => `The last of the Earth wheat takes the best field and a third of the water, and yields less each year. The request is that it be ploughed in and the field given to ${LF.lex(s, 'wild1')}, which the born prefer and the founders can barely digest.`,
    yes: s => `The wheat is ploughed in after the last cutting. The field gives half again as much under ${LF.lex(s, 'wild1')}. There is no more bread. The founders eat what the born eat, more slowly, and a jar of the seed is kept in the archive.`, yesFx: { food: 160, morale: -2 },
    half: 'One strip of wheat, for the founders\' table', halfText: 'One strip is kept, weeded by founders on their rest day. It makes enough flour for a loaf a month each. The born children try the bread once, politely.', halfFx: { food: 80 } },
};
/* 2026-11-18: no colonist is ever raised to a chair, so nobody born here holds one. The born who work in a department
   ask its one thing of you instead, once for each seat, whether its chair is held by an old founder or by nobody. */
const askSeat = s => { const g = G(s); return g.chairs ? LF.SEAT_ORDER.find(k => CHAIR[k] && !(g.asked || {})[k]) : null; };
const txt = (v, s) => (typeof v === 'function' ? v(s) : v);
RU({ id: 'gen.chair', far: true, tone: 'quiet', title: 'The First Thing Asked', repeat: 14 * MONTH, max: 6, w: 4,
  when: s => !!askSeat(s),
  setup: s => { const g = G(s), seat = askSeat(s), o = LF.officer(s, seat), p = h.anyNamed(s, LF.SEAT_ORDER); g.asked = g.asked || {}; g.asked[seat] = s.day; if (p) p.bornHere = p.bornHere || yr(s);
    return { pid: p ? p.id : null, name: p ? p.name : 'A young woman from the far rows', first: p ? p.first : 'she', seat, dept: LF.SEATS[seat].name, title: LF.SEAT_TITLE[seat], holder: o ? o.name : null, want: CHAIR[seat].want(s) }; },
  text: (s, c) => `${c.name} was born here, in the colony's early years, and speaks for the born who work in ${c.dept}. ${c.holder ? `${c.holder} has held the ${c.title}'s chair since before any of them could walk.` : `The ${c.title}'s chair is empty. The people who could have sat in it came on the ship, and they are gone.`} The born have asked for one thing.\n\n${c.want}${CHAIR[c.seat].say ? `\n\n[[${c.pid || 'x30'}]] ${CHAIR[c.seat].say}` : ''}\n\nThe founders who are left have already heard about it.`,
  choices: [
    { label: 'Let them do it', info: [['yield', 'The born, and what the change brings'], ['danger', 'The founders']],
      out: { text: (s, c) => txt(CHAIR[c.seat].yes, s), fx: (s, c) => Object.assign({ do: s2 => { grudge(s2, -2); const p = byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal + 12, 0, 100); if (CHAIR[c.seat].yesDo) CHAIR[c.seat].yesDo(s2); } }, CHAIR[c.seat].yesFx) } },
    { label: 'Not while there are founders alive to mind', info: (s, c) => [['danger', c.name], ['danger', `The born in ${c.dept}`]],
      out: { text: (s, c) => `${c.name} hears the answer, nods, and goes back to work. The request is not made again. The born in ${c.dept} know what was asked and what was said.`,
        fx: (s, c) => ({ morale: -2, do: s2 => { grudge(s2, 2); const p = byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = clamp(p.loyal - 15, 0, 100); } }) } },
    { label: (s, c) => CHAIR[c.seat].half, info: [['danger', 'Both sides, a little']],
      out: { text: (s, c) => CHAIR[c.seat].halfText, fx: (s, c) => Object.assign({ do: s2 => { if (CHAIR[c.seat].halfDo) CHAIR[c.seat].halfDo(s2); } }, CHAIR[c.seat].halfFx) } },
  ] });

RU({ id: 'gen.inherit', far: true, tone: 'quiet', title: 'Whose Roof',
  when: s => yr(s) >= 19 && founders(s) >= 3 && G(s).born >= 8 && !s.flags.gn_inherit,
  setup: s => ({ claims: X(s).boardY ? 'Two are the founder\'s children by choice. The third is the founder\'s by the pairing board, raised in another row.' : X(s).tank ? 'Two are the founder\'s own children. The third was handed to the house from the incubators and raised in it.' : 'Two are the founder\'s children. The third has worked the plot for six years while they did not.' }),
  text: (s, c) => `The first founder to die of nothing but age has left a house in the first row, a bench of tools and a plot inside the old wire. Three of the born say they are the heirs. ${c.claims}\n\nThe charter is no help. The people who wrote it did not expect to own anything.`,
  choices: [
    { label: 'By blood. A founder\'s house goes to a founder\'s children', dark: true, note: 'The first row stays with the families who came on the ship, for good.', info: [['yield', 'The founders'], ['danger', 'Everyone born in the far rows']],
      out: { text: 'The two children take the house. Within a few years every house inside the old wire has a will pinned behind its door. The first row becomes a street people are born into, and the born from the far rows walk through it on the way to work.',
        fx: () => ({ morale: 1, tension: 4, stain: ['gn_first_row', 1], flags: { gn_inherit: 'blood' }, do: s2 => grudge(s2, 2) }) } },
    { label: 'To whoever worked it', info: [['yield', 'The plots'], ['danger', 'The founders\' own children']],
      out: { text: 'The plot and the bench go to the one who worked them. The two children keep the house, and nothing to live on in it. That season the founders with a spare room and a hired hand in the plot start doing their own digging.',
        fx: () => ({ food: 40, morale: -2, flags: { gn_inherit: 'work' }, do: s2 => grudge(s2, -1) }) } },
    { label: 'To the colony. Houses are assigned by the chair, as bunks were', dark: true, info: [['yield', 'Materials, and order'], ['danger', 'Anyone the chair does not know by name']],
      out: { text: 'The house is entered in the stores book and assigned to a crew chief. So is the next one. Nobody now owns anything the chair cannot move them out of, and the people who do well under that are the ones the chair knows by name.',
        fx: () => ({ mat: 20, tension: -4, stain: ['gn_roofs', 1], flags: { gn_inherit: 'chair' }, do: s2 => allRegard(s2, -4, p => p.vals.free === 1) }) } },
  ] });

RU({ id: 'gen.earth', far: true, tone: 'pressure', title: 'The Ship Was a Story',
  when: s => yr(s) >= 27 && G(s).born >= s.pop * 0.8 && !s.flags.gn_earth,
  setup: s => voiceCtx(s),
  text: (s, c) => `In the east rows they are teaching that there was no Earth. The ship was built here by the first people. The sleepers were the first people's dead. The founders made up a lost world so that everyone born after them would owe a debt for the journey.\n\n${c.name} did not start it and only half believes it.\n\n[[${c.pid}]] "But say it's all true, what you tell us. Forty years in the dark, a whole world behind you. What's that to us? What do we owe it?"`,
  choices: [
    { label: 'Run the archive on the hall wall, every night for a season', cost: { food: 60 }, info: [['danger', 'A season of evenings'], ['danger', 'What they conclude']],
      out: { text: 'The archive is run on the hall wall each night: cities, seas, crowds, the launch. The born come and watch all of it. They agree it was real. By the end they also agree that it has nothing to do with them, and the teaching in the east rows changes to say so.',
        fx: () => ({ morale: 2, flags: { gn_earth: 'shown' }, do: s2 => grudge(s2, -1) }) } },
    { label: 'Let them believe what they like', info: [['danger', 'The archive, and what only it knows']],
      out: { text: 'Nothing is said from the chair. In a few years the archive room is storing seed, and the terminal in it is switched on only by founders. When a pump of the old pattern fails, nobody under forty knows there is a drawing of it.',
        fx: () => ({ morale: 2, parts: -6, flags: { gn_earth: 'left' } }) } },
    { label: 'It is the school\'s history, or the lock-up', dark: true, info: [['yield', 'The history, in public'], ['danger', 'The born']],
      out: { text: 'Three who taught it are locked up for a month, and the watch reads the school history aloud in the rows. The teaching stops being said where it can be heard. Every child in the east rows now knows two histories, and which of them gets a person locked up.',
        fx: () => ({ tension: -6, morale: -4, stain: ['gn_earth_law', 2], flags: { gn_earth: 'law' }, do: s2 => grudge(s2, 3) }) } },
    { label: 'Say it from the chair: there was no Earth, and the colony owes nothing to anyone', dark: true, info: [['yield', 'Morale'], ['danger', 'The founders, and the truth']],
      out: { text: 'You say it in the hall: the story was a story. The born take it without surprise. The founders walk out, the ones who can still walk that far. By morning the archive room has a new lock on it, fitted from the outside.',
        fx: () => ({ morale: 6, hum: -4, stain: ['gn_no_earth', 3], flags: { gn_earth: 'denied' }, do: s2 => { grudge(s2, -3); allRegard(s2, -10); } }) } },
  ] });

/* ================= a city of children ================= */
CI({ id: 'gen.minders', far: true, tone: 'pressure', title: 'More Children Than Hands',
  when: s => kids(s) >= 70 && kids(s) >= s.pop * 1.2 && !s.flags.gn_raise,
  setup: s => ({ kids: kids(s), grown: s.pop, per: clamp(Math.round(kids(s) / Math.max(1, s.pop * 0.12)), 9, 40), hurt: clamp(Math.round(kids(s) * 0.08), 6, 60) }),
  text: (s, c) => `The count this month is ${LF.num(c.kids)} children and ${LF.num(c.grown)} grown. Take out the field crews and the watch, and in the rows there is one adult awake to every ${num(c.per)} children, and at night fewer. The clinic logged ${num(c.hurt)} falls, burns and near drownings last month, and two children it could do nothing for.\n\nThe grown cannot be in the fields and in the rows at the same hour.`,
  choices: [
    { label: 'The older children raise the younger. Every ten-year-old is given six', dark: true, info: [['yield', 'No hands off the fields'], ['danger', 'The ten-year-olds, and the sixes']],
      out: { text: 'Each ten-year-old gets a row of six and a whistle. It costs the colony nothing. Most of the small ones are fed, washed and in bed by dark. The ten-year-olds stop coming to school, and the clinic begins seeing injuries a grown person would have known how to prevent.',
        fx: () => ({ food: 60, stain: ['gn_minders', 2], flags: { gn_raise: 'kids' }, do: s2 => risk(s2, 1.2) }) } },
    { label: 'Take hands off the fields for it', info: [['yield', 'Fewer of the children lost'], ['danger', 'The next harvest']],
      out: { text: 'One in six of the grown is moved from the fields to the rows. The falls and burns drop by half inside a season. So does the weeding, and the next harvest comes in short by about what those hands would have grown.',
        fx: () => ({ food: -160, morale: 2, flags: { gn_raise: 'grown' }, do: s2 => risk(s2, 0.8) }) } },
    { label: 'Dormitories by year, a bell, and a warden for each', dark: true, cost: { mat: 30 }, info: [['yield', 'Children who are safe and counted'], ['danger', 'What they grow into']],
      out: { text: 'Long houses go up by year of age. A bell wakes them, feeds them and puts them to bed. The wardens are founders past field work, and they run the houses the way the ship was run. The children are safe and counted. They march to school.',
        fx: () => ({ tension: -6, stain: ['gn_dorms', 1], flags: { gn_raise: 'dorm' }, do: s2 => { risk(s2, 0.9); grudge(s2, 2); } }) } },
  ] });

const OVER = ['a stolen knife', 'a row\'s turn at the water', 'a small child that one row took from another', 'a debt of three ladles'];
CI({ id: 'gen.packs', far: true, tone: 'crisis', title: 'The Law of the Rows', repeat: 5 * YEAR, max: 3,
  when: s => yr(s) >= 20 && !!s.flags.gn_raise && kids(s) >= 110,
  setup: s => ({ over: LF.spick(s, OVER), n: 5 + Math.floor(LF.srand(s) * 5), again: (s.nfired || {})['gen.packs'] > 0, law: X(s).rows === 'law' }),
  text: (s, c) => c.again
    ? `Another child is dead in the east rows by the rows' own sentence, this time over ${c.over}. ${c.law ? 'The founder on the stool at the back of the night court was asleep, or says so.' : 'The night courts were never broken. They moved.'}\n\nThe court sat ${num(c.n)} children, and the eldest is eleven. The rows are waiting, in good order, to hear what the grown will do about it this time.`
    : `A child of nine is dead in the east rows, killed by other children over ${c.over}. It was done by rule. The rows have had a law of their own for years, with a court that sits at night, and no grown person knew of it until the clinic was brought the body.\n\nThe court that ordered it sat ${num(c.n)} children. The eldest is eleven, and has asked what the trouble is: the child was heard, and the sentence was the one the rows have always used.`,
  choices: [
    { label: 'They are tried as the grown are tried', dark: true, info: [['yield', 'One law'], ['danger', 'An eleven-year-old']],
      out: { text: 'The eleven-year-old stands in the hall dock on a box, to be seen over the rail. The verdict is the one the charter gives. It is carried out at the cart crane at first light with the rows turned out to watch. They watch without a sound and go home in their files.',
        fx: () => ({ tension: -10, morale: -5, stain: ['gn_tried', 3], chips: [['One of the children hanged', false]], do: s2 => { young(s2, 1, true); grudge(s2, 2); X(s2).rows = 'tried'; } }) } },
    { label: 'Break the row courts. The watch walks the rows every night', info: [['danger', 'Hands off the fields'], ['danger', 'What the rows stop telling the grown']],
      out: { text: 'The watch is doubled and walks the rows from dusk. No court sits where it can be seen. The clinic goes on getting children with injuries nobody will explain, and the rows have stopped bringing in the ones who die of them.',
        fx: () => ({ food: -80, morale: -2, do: s2 => { risk(s2, 1.1); X(s2).rows = 'broken'; } }) } },
    { label: 'Recognise the courts. One of the grown sits in, and no sentence is death', dark: true, info: [['yield', 'Order in the rows, cheaply'], ['danger', 'Whoever the courts sentence next']],
      out: { text: 'A founder past field work is given a stool at the back of the night court. The court is polite to the stool, and its sentences are milder when the founder is awake. The rows are orderly, the watch is free for the wire, and the colony has a second law.',
        fx: () => ({ tension: -6, food: 40, stain: ['gn_rowlaw', 2], do: s2 => { grudge(s2, -1); X(s2).rows = 'law'; } }) } },
  ] });

CI({ id: 'gen.mouths', tone: 'crisis', title: 'Small Bowls', w: 3, repeat: 3 * YEAR, max: 3,
  when: s => foodDays(s) < 22 && kids(s) >= 12 && s.pop >= 20,
  setup: s => ({ kids: kids(s), fd: Math.max(1, Math.round(foodDays(s))), kd: share(s, 0.05, 2, 400), kd2: share(s, 0.03, 1, 250), old: eldest(s) >= 7 }),
  text: (s, c) => `There are ${num(c.fd)} days in the bins and ${LF.num(c.kids)} children at the long tables. A child eats a fifth of what a field hand eats, and does none of the work that fills the bins.\n\n${Nc(s, 'quartermaster')} has worked it more than one way and brought you all of them, face down.`,
  choices: [
    { label: 'The crews eat first. The children\'s bowls go to a third', dark: true, info: [['yield', 'Food, and crews who can work'], ['danger', 'The smallest']],
      out: { text: (s, c) => `The field crews get the full ladle and bring the harvest in on it. The children's tables get what is left. The clinic buries ${num(c.kd)} of the smallest before the bins turn, and the ones who lived through it will always be short for their age.`,
        fx: (s, c) => ({ food: 100, morale: -6, stain: ['gn_small_bowls', 2], chips: kidChip(c.kd), do: s2 => young(s2, c.kd) }) } },
    { label: 'The children eat whole bowls. The people too old for field work go without', dark: true, info: [['yield', 'The children'], ['danger', 'The people past field work']],
      out: { text: 'The children\'s tables are filled first, from the top of the pot. What it costs comes off the plates of the people past field work, who are told why, and mostly agree. Three of them are dead before the bins turn.',
        fx: () => ({ food: 40, pop: -3, morale: -4, stain: ['gn_old_bowls', 2] }) } },
    { label: 'Send the older children out to feed themselves. They know what can be eaten', dark: true, show: (s, c) => c.old, info: [['yield', 'Food'], ['danger', 'The ones who do not come back']],
      out: { text: (s, c) => `Everyone over seven is sent past the wire with a net and told to come back fed. Most do, and bring in more than they ate. ${Num(c.kd2)} ${c.kd2 === 1 ? 'does' : 'do'} not come back, and the ones who went looking will not say what they found.`,
        fx: (s, c) => ({ food: 140, morale: -3, stain: ['gn_forage', 2], chips: kidChip(c.kd2), do: s2 => young(s2, c.kd2, true) }) } },
  ] });

CI({ id: 'gen.fever', view: 'people', tone: 'crisis', title: 'Going Through the School', w: s => (LF.date(s.day).year > 15 ? 4 : 1.6), repeat: 6 * YEAR, max: 3,
  when: s => kids(s) >= 20 && yr(s) >= 5 && !!s.built.school && !s.flags.gn_fever_run,   // let run once, it finds nobody to take: it does not come back
  setup: s => ({ again: (s.nfired || {})['gen.fever'] > 0, sick: share(s, 0.3, 6), a: share(s, 0.015, 1, 150), b: share(s, 0.04, 2, 500), c2: share(s, 0.07, 3, 800) }),
  text: (s, c) => `${c.again ? 'The school fever is back, among the ones too young to have had it the last time. It is taking them by year again' : 'A fever is going through the school by year'}: the fives first, and now the sevens. There are ${num(c.sick)} children down with it, and the clinic has cots for a tenth of them. It has not touched one grown person.\n\n${Nc(s, 'physician')} has a serum that works in the dish and has never been in a child.\n\n[[physician]] "Don't look at me like that. I told you what it is, I didn't say use it. If you order it, you stand at the cot while I do."`,
  choices: [
    { label: 'Shut the school and the rows. Every parent home with their own for a month', info: [['danger', 'A month of the fields'], ['danger', 'A few of the children']],
      out: { text: (s, c) => `The school is shut and the rows are chalked. The fields go untended for a month, and the fever runs out of houses to move to. ${Num(c.a)} of the children ${c.a === 1 ? 'dies' : 'die'} of it, at home.`,
        fx: (s, c) => ({ food: -80, chips: kidChip(c.a), do: s2 => young(s2, c.a) }) } },
    { label: 'Let it run. The ones who come through will not take it again', dark: true, info: [['yield', 'No work lost, and a school that cannot catch it twice'], ['danger', 'More of the children']],
      out: { text: (s, c) => `The school stays open and the crews stay in the fields. It goes through every year of the school in a season. ${Num(c.b)} die. The rest are up inside a month, and the next time it comes round it finds nobody to take.`,
        fx: (s, c) => ({ morale: -3, stain: ['gn_let_run', 2], flags: { gn_fever_run: true }, chips: kidChip(c.b), do: s2 => { young(s2, c.b); risk(s2, 0.88); } }) } },
    { label: 'Give the serum to the youngest ward first', dark: true, note: 'The ward children have nobody to refuse for them.', test: { base: 50, mods: [R('physician', 10), M('medbay', 10)] }, info: [['yield', 'The fever stopped early'], ['danger', 'Twelve children, and then the rest']],
      ok: { text: (s, c) => `It is given to the ward first, twelve children, at night. All twelve are on their feet within the month. The rest of the school gets it the day after, and the fever is over with ${num(c.a)} dead.`,
        fx: (s, c) => ({ morale: 1, stain: ['gn_serum', 2], chips: kidChip(c.a), do: s2 => young(s2, c.a) }) },
      bad: { text: (s, c) => `It is given to the ward first, twelve children, at night. By morning it is plain what it does to a child. ${Nc(s, 'physician')} stays with them. The fever goes on through the school, and the count at the end of it is ${num(c.c2)}.`,
        fx: (s, c) => ({ morale: -6, stain: ['gn_serum', 2], chips: kidChip(c.c2), do: s2 => { young(s2, c.c2); regard(s2, 'physician', -15); } }) } },
  ] });

LF.GEN_ON.ofAge.push((s, n) => { X(s).class = n; X(s).classDay = s.day; });
CI({ id: 'gen.class', far: true, tone: 'pressure', title: 'The Year\'s Class', repeat: 5 * YEAR, max: 3,
  when: s => { const x = X(s); return yr(s) >= 24 && (x.class || 0) >= 14 && s.day - (x.classDay || 0) < 4 * MONTH; },
  setup: s => ({ n: X(s).class, t: Math.max(3, Math.round(X(s).class / 3)) }),
  text: (s, c) => `At the turn of the year ${LF.num(c.n)} came of age, the largest class yet. The yard has tools for ${num(c.t)} of them and bunks for about half, and the founders who used to train a new hand are past training anyone.\n\nThe ones without tools stand in the yard each morning to be picked. The ones who are not picked have nothing to do until the next morning.`,
  choices: [
    { label: 'Melt the reserve plate into tools, and put every one of them to work', cost: { mat: 60 }, info: [['yield', 'Food'], ['danger', 'The next machine that breaks']],
      out: { text: 'The reserve goes through the smelter in a month and comes out as hoes, picks and saws. Every one of the class has a tool and a row to work. The yard has nothing put by for the next machine that breaks.',
        fx: () => ({ food: 120, morale: 2 }) } },
    { label: 'Tools to the best of them. The rest carry, on a carrier\'s ladle', dark: true, info: [['yield', 'Food and materials'], ['danger', 'Two in three of the class']],
      out: { text: 'The crew chiefs pick. The picked get a tool, a bunk and a full ladle. The rest carry for them on three-quarters, and are told next year\'s picking is open. It is the first year the colony has had two kinds of new hand.',
        fx: () => ({ food: 80, mat: 20, morale: -3, stain: ['gn_carriers', 2], do: s2 => grudge(s2, 2) }) } },
    { label: 'Hold the class back. They stay in school until there are tools', info: [['danger', 'A year of full ladles for no work']],
      out: { text: 'The class goes back to its desks, taller than the desks. The colony feeds them a grown ration for a year of lessons they have had already. The yard makes tools as fast as it can, and next year\'s class is larger.',
        fx: () => ({ food: -140, do: s2 => grudge(s2, 1) }) } },
  ] });

CI({ id: 'gen.elders', far: true, view: 'people', tone: 'pressure', title: 'Past Work',
  when: s => yr(s) >= 23 && founders(s) >= 6 && G(s).born >= s.pop * 0.5 && !s.flags.gn_elders,
  setup: s => ({ past: Math.max(3, Math.round(founders(s) * 0.5)), k: clamp(Math.round(founders(s) * 0.15), 2, 8) }),
  text: (s, c) => `${Num(c.past)} of the people who came on the ship can no longer work a shift. Each eats a full ration, in a colony with more children at its tables than hands in its fields. The ration book is plain about it: a ladle is for a shift. The founders wrote the book themselves.\n\nThe stores committee is all born here now. It has asked, with care, what the chair wants done.`,
  choices: [
    { label: 'A full ladle for life. They built the place', cost: { food: 150 }, info: [['yield', 'The founders'], ['danger', 'The children that food would feed']],
      out: { text: 'It is entered in the book as a standing charge and read out in the hall. The founders hear it with their heads up. The stores committee signs it. In the next short season the charge is read out again, by someone else, with the number of children it would feed.',
        fx: () => ({ morale: 2, hum: 2, flags: { gn_elders: 'kept' }, do: s2 => grudge(s2, 1) }) } },
    { label: 'The book applies to everyone. Half a ladle past work', dark: true, info: (s, c) => [['yield', 'Food'], ['danger', `About ${num(c.k)} of the founders`]],
      out: { text: (s, c) => `The half ladle starts at the turn of the month. The founders take it without complaint, having written the rule. ${Num(c.k)} of them are dead by the end of the dark months, of cold and of nothing much, and the bins are a little fuller.`,
        fx: (s, c) => ({ food: 120, dead: c.k, morale: -4, stain: ['gn_old_half', 2], flags: { gn_elders: 'half' } }) } },
    { label: 'Let it be known that the clinic has a room, for those who ask', dark: true, info: (s, c) => [['yield', 'Food'], ['danger', `About ${num(c.k)} of the founders, asked to ask`]],
      out: { text: (s, c) => `Nothing is posted. The word goes round the old rows inside the month. ${Num(c.k)} founders ask in the first season, some of them after a visit from a grandchild on the stores committee. The clinic does it gently and keeps no list.`,
        fx: (s, c) => ({ food: 150, dead: c.k, morale: -6, hum: -3, stain: ['gn_quiet_room', 3], flags: { gn_elders: 'room' } }) } },
  ] });

CI({ id: 'gen.last', far: true, view: 'people', tone: 'quiet', title: 'The Last of the Woken', w: 4,
  when: s => yr(s) >= 33 && G(s).born >= s.pop * 0.9 && !s.flags.gn_last,
  setup: s => Object.assign(voiceCtx(s), { n: clamp(founders(s), 3, 9) }),
  text: (s, c) => `There are ${num(c.n)} people left who slept on the ship, and the youngest of them is past seventy. When they are gone, nobody alive will have seen another sky.\n\n${c.name} has come from the hall to ask what the colony should keep of them, and has brought the answer the east rows favour.\n\n[[${c.pid}]] "Let it end with them. We'll bury them well. But the Earth year in school, the hour at noon, the archive: that's theirs. It was never ours."`,
  choices: [
    { label: 'Sit a clerk with each of them, and write down all of it', cost: { food: 80 }, info: [['danger', 'A season of clerks, for books few will open']],
      out: { text: 'A clerk sits with each founder through the dark months and writes until the founder is tired. It comes to forty books. Most of the born will never open one. The founders die knowing which shelf the books are on.',
        fx: () => ({ morale: 2, hum: 4, flags: { gn_last: 'kept' }, chron: 'The last of the founders were asked what they remembered, and it was written down.' }) } },
    { label: 'Keep the hour at noon, and let the rest go', info: [['danger', 'The archive, and the founders who are left to see it shut']],
      out: { text: 'The school drops the Earth year and the archive room is given to the survey. The hour at noon on Landfall Day is kept, for whoever wants to stand. In ten years the people who stand for it will not be sure what it was for.',
        fx: () => ({ morale: 1, flags: { gn_last: 'hour' } }) } },
    { label: 'Let it end with them. Seal the archive now', dark: true, info: [['yield', 'Morale'], ['danger', 'The founders, who will see it done']],
      out: { text: (s, c) => `The archive is sealed and the Earth year comes off the timetable while ${num(c.n)} founders are still alive to see it. They are buried well, each in turn, as promised. The school teaches ${s.world.planet} from the first landing, and the landing takes up one line.`,
        fx: () => ({ morale: 4, hum: -4, stain: ['gn_sealed_earth', 2], flags: { gn_last: 'sealed' }, chron: 'The archive of Earth was sealed while the last founders were still alive.' }) } },
  ] });

Object.assign(LF.TAGS, {
  'gen.grave': ['severe', 'mercy', 'order'], 'gen.school': ['order closed', 'open bold', 'severe order'], 'gen.strange': ['severe order closed', 'free', 'open'],
  'gen.adapt': ['severe bold', 'cautious', 'closed severe'], 'gen.wire': ['order', 'free mercy', 'severe closed'], 'gen.outside': ['open free', 'cautious', 'severe order'],
  'gen.ofage': ['severe', 'mercy', 'free'], 'gen.lines': ['order', 'open', 'order severe', 'free'],
  'gen.vote': ['free open', 'order', 'order closed'], 'gen.rules': ['order severe', 'free open', 'cautious'], 'gen.count': ['order closed', 'free', 'open'],
  'gen.chair': ['free open', 'order closed', 'cautious'], 'gen.inherit': ['closed', 'free', 'order'], 'gen.earth': ['open', 'free', 'severe order', 'closed'],
  'gen.minders': ['severe', 'mercy', 'order'], 'gen.packs': ['severe order', 'order', 'free'], 'gen.mouths': ['severe', 'mercy', 'bold severe'],
  'gen.fever': ['cautious mercy', 'severe', 'bold severe'], 'gen.class': ['mercy', 'severe order', 'cautious'], 'gen.elders': ['mercy', 'severe order', 'severe'],
  'gen.last': ['open mercy', 'cautious', 'closed'],
});
Object.assign(LF.DEEDS || {}, {
  gn_opened_child: 'the dead child opened over the parents\' refusal',
  gn_halfdays: 'the school cut to mornings, and the children on the crews from eight',
  gn_tongue: 'the children\'s own words, strapped out of them in school',
  gn_sent: 'the children sent to do the work their parents\' bodies could not',
  gn_treated: 'the children dosed until they were as their parents were',
  gn_shut: 'the gate shut on the children who went past the wire',
  gn_taken_back: 'the ones from outside, taken at the gate when they came to talk',
  gn_haul: `the ${AGE}-year-old put on the haul line because it was short`,
  gn_stamp: 'the marriages refused by the clinic\'s book',
  gn_exam: 'the charter examination, set so that the born would fail it',
  gn_enforced: 'the founders\' rules kept on the born with the lock-up',
  gn_double: 'the founders\' votes counted double against their own children',
  gn_first_row: 'the first row kept for the blood of the people who came on the ship',
  gn_roofs: 'the houses assigned by the chair, as bunks were',
  gn_earth_law: 'the lock-up for teaching that there was no Earth',
  gn_no_earth: 'the chair\'s word that there had never been an Earth',
  gn_minders: 'the ten-year-olds given six small ones each to raise',
  gn_dorms: 'the children\'s dormitories, with a bell and a warden',
  gn_tried: 'the eleven-year-old tried and hanged as the grown are',
  gn_rowlaw: 'the children\'s courts left standing, and what they ordered',
  gn_small_bowls: 'the children\'s bowls cut so that the crews could work',
  gn_old_bowls: 'the old who went without so that the children ate',
  gn_forage: 'the children sent past the wire to feed themselves in the hungry month',
  gn_let_run: 'the fever left to run through the school',
  gn_serum: 'the untried serum given first to children with nobody to refuse for them',
  gn_carriers: 'the new hands who were not picked, carrying for the ones who were',
  gn_old_half: 'the founders put on half a ladle when they could no longer work',
  gn_quiet_room: 'the room at the clinic where the old founders went when they were asked to ask',
  gn_sealed_earth: 'the archive of Earth sealed while the last founders were alive to see it',
});
})();
