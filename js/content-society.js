/* Landfall — storylets: politics, law, faith, and the quiet moments between crises. */
(function () {
'use strict';
const { add, h } = LF; const { P, N, Nc, F, R, M, Fl, If, Tr, anyNamed, byPid, foodDays } = h;

const FAITH = s => s.flags.und_contact ? 'the Listeners, who sit barefoot in the fields at dawn with their palms on the soil'
  : s.flags.bld_inside || s.flags.bld_dug ? 'the Pilgrims, who walk out to the spire each rest day and stand facing it'
  : s.flags.hive_talk ? 'the Answerers, who drum on the ground at dusk and wait'
  : s.flags.oth_hailed || s.flags.oth_trade ? 'the Second Covenant, who hold that finding other survivors here cannot be chance'
  : 'the Landfall Covenant, who hold that the forty-one years of sleep were a kind of death, and this a second life with new obligations';

/* ================= POLITICS ================= */
add({ id: 'pol.rations', urgent: true, arc: 'politics', tone: 'pressure', title: 'The Curve', w: 2.5,
  when: s => s.day >= 40 && foodDays(s) < 95 && !LF.lean(s),
  text: s => `${Nc(s, 'quartermaster')} draws you a line on a slate. Stores on the left, days along the bottom. It reaches zero in about ${Math.round(foodDays(s) / 10) * 10} days.\n\n"I can move where it lands, but it costs somebody whichever way I do it. You'll have to say who goes short."`,
  choices: [
    { label: 'Three-quarter rations for everyone, starting with us', note: 'The oldest and the sick feel a short ladle first.', info: [['danger', 'The weakest']],
      out: { text: 'You make a point of eating in the mess hall where people can see your plate. The oldest feel it first. One of them does not get up in the second month.', fx: { rations: 'tight', morale: -2, pop: -1, flags: { shared_hunger: true } } } },
    { label: 'Feed by labour: those who dig eat more', dark: true, note: 'The fields get more out of fed crews, and the people who cannot dig get what is left.', info: [['yield', 'More from the fields'], ['danger', 'The ones who cannot dig']],
      out: { text: 'The field crews get the heavy ladle. The clerks, the medics, the old and the children get what is left. Two of the old are buried before the harvest, by crews who ate well that morning.', fx: { rations: 'tight', morale: -4, pop: -2, flags: { ration_by_work: true }, stain: ['ladle', 1] } } },
    { label: 'Full plates. The harvest will come', note: 'If the harvest is late, the line reaches zero for everyone on the same day.', info: [['danger', 'Everyone, if the harvest fails']],
      out: { text: s => `${Nc(s, 'quartermaster')} wipes the slate clean. The line is still there the next morning, drawn again from memory, a little steeper.`, fx: { morale: 3, food: -60 } } },
  ] });
add({ id: 'pol.theft', arc: 'politics', tone: 'pressure', title: 'A Sack of Meal',
  when: s => s.day >= 70 && s.pop > 14 && (LF.lean(s) || foodDays(s) < 60) && !!anyNamedPreview(s),
  // The thief is whoever has been doing it all along, or failing that whoever has least reason to keep faith with you.
  setup: s => { const any = anyNamed(s, ['security', 'quartermaster']), p = (LF.cast && (LF.cast(s, { secret: 'hoard', not: ['security', 'quartermaster'], need: 4 }) || LF.cast(s, { low: true, want: 'kin', not: ['security', 'quartermaster'] }))) || any;
    if (p.secret && p.secret.k === 'hoard') p.secret.known = s.day;
    return { pid: p.id, name: p.name, first: p.first, title: LF.title(p), officer: !!p.seat }; },
  text: (s, c) => `${Nc(s, 'security')} brings the thief to your office at midnight, along with the evidence: nine kilos of meal from the common store, hidden in a bunk frame.\n\nIt is ${c.name}${c.officer ? '. Your ' + c.title : ''}. ${c.first} does not deny it and does not explain. Half the colony already knows.`,
  choices: [
    { label: 'Public hearing. Hard labour on short rations', out: { text: (s, c) => `${c.first} digs latrine trenches for two months where everyone can watch. The stores are not touched again.`, fx: (s, c) => ({ morale: 2, flags: { justice_harsh: true }, mark: [c.pid, 'convict'] }) } },
    { label: 'Return the meal. Say nothing more', note: 'Half the colony already knows, and will know what it cost to be caught.', info: [['danger', 'The stores']],
      out: { text: (s, c) => `${c.first} looks at you for a long moment, then nods. By breakfast the story has gone round the camp. By the end of the month the stores are short again, from three different hands, and the people who went hungry so that they would balance know it.`, fx: (s, c) => ({ morale: -2, food: -90, flags: { justice_soft: true }, mark: [c.pid, 'spared'] }) } },
    { label: 'Exile', dark: true, note: 'Nobody has lasted a season alone out there. You lose the thief, and all the work that person did for the colony.', info: [['yield', 'Nobody steals again'], ['danger', 'The thief']],
      out: { text: (s, c) => `A pack, a knife, ten days of food. ${c.name} walks ${s.world.mysteries.includes('others') ? 'south' : 'out past the last marker'} without looking back. Nobody steals after that, and people get careful about what they say near you.`,
        fx: (s, c) => ({ morale: -2, tension: -6, flags: { justice_harsh: true, exile: c.name }, stain: ['exiled', 1], do: s2 => { const p = byPid(s2, c.pid); p.alive = false; p.left = s2.day; p.cause = 'exiled'; s2.pop--; s2.vacancies.push({ role: p.role, day: s2.day + 40 }); }, chron: `${c.name} was exiled for stealing from the common store.` }) } },
  ] });
function anyNamedPreview(s) { return s.people.some(p => p.alive && p.role !== 'security' && p.role !== 'quartermaster'); }

add({ id: 'pol.charter', arc: 'politics', tone: 'pressure', title: 'Article One', w: 1.5,
  when: s => s.day >= 140 && !s.flags.council && !s.flags.command_rule && !s.flags.committee,
  text: s => `The charter's first article: the Administrator governs until the colony is self-sustaining. A delegation led by ${N(s, 'teacher')} has read all four hundred pages.\n\n"Four hundred pages, and nobody who wrote them is alive. We want a vote. First one's on whether we get one."`,
  choices: [
    { label: 'Call elections for a governing Council', note: 'They will not always choose what you would, and the first thing they will vote is full ladles.', info: [['yield', 'Morale'], ['danger', 'The stores']],
      out: { text: 'Seven seats. The count takes an evening, and the argument about the count takes the rest of the month. The Council\'s first vote is full ladles for a month, and it carries.', fx: { morale: 10, food: -120, flags: { council: true }, chron: 'The colony elected its first Council.' } } },
    { label: 'An assembly, with the officers choosing who sits in it', dark: true, note: 'It will look like a vote and advise what it is told to.', info: [['yield', 'Morale, and nothing changes'], ['danger', 'If they work out who chose the seats']],
      out: { text: s => `Seven seats, filled from a list the officers drew up. It meets weekly and advises what the officers already meant to do. ${Nc(s, 'teacher')} is not on the list, and has worked out why.`, fx: { morale: 4, flags: { assembly: true }, mark: ['teacher', 'slighted'], stain: ['rigged', 1] } } },
    { label: 'The charter is the charter', note: 'Decisions stay quick, and people will hold it against you for a long time.',
      out: { text: s => `"Fine. Now we know where we stand," says ${N(s, 'teacher')}, and gathers the papers.`, fx: { morale: -8, flags: { command_rule: true } } } },
    { label: 'Have the delegation in the lock-up before breakfast', dark: true, note: 'Nine people are taken from their bunks, and the question does not come up again.', req: s => !!P(s, 'security'), reqText: 'There is no Warden to do it', info: [['yield', 'Nobody asks twice'], ['danger', 'Nine colonists']],
      out: { text: s => `The watch goes round the bunkrooms at four in the morning with a list. The nine are held for a month on half rations and let out one at a time, to different crews. The four hundred pages go into the kiln. People stop reading things in the mess hall.`,
        fx: { morale: -4, tension: -10, flags: { command_rule: true, crackdown: true }, mark: ['teacher', 'grudge', 'was taken from a bunk at four in the morning for asking for a vote'], stain: ['arrests', 2], chron: 'A delegation that asked for elections was arrested in the night.' } } },
  ] });
add({ id: 'pol.burial', arc: 'politics', tone: 'quiet', title: 'What We Do With Our Dead', w: 4,
  when: s => s.deaths > 0,
  text: s => `${s.firstDead ? `${s.firstDead} is the first of the named dead` : 'The colony has its first dead'}, and there is no custom yet for what comes next. On the ship, bodies went to the reclaimer; every gram was the ship's.\n\n${Nc(s, 'chaplain')} asks you what kind of people you intend this to be.`,
  choices: [
    { label: 'To the soil works. Nothing is wasted here', out: { text: 'It is done respectfully, and efficiently. The compost beds are a little richer.', fx: { food: 60, morale: -3, flags: { recycle_dead: true } } } },
    { label: 'A cemetery on the hill, facing the landing site', out: { text: 'The first grave is cut with a mining laser, by a crew that was needed in the fields. Someone leaves a ration bar on it. Someone else, later, quietly takes it away.', fx: { morale: 5, food: -30, flags: { cemetery: true }, chron: 'A cemetery was laid out on the hill above the landing site.' } } },
    { label: s => `Let ${F(s, 'chaplain')} and the bereaved decide, each time`, out: { text: 'There will be graves and there will be compost and, once, a pyre that gets into the drying racks and takes a week of meal with it.', fx: { morale: 3, food: -50, flags: { rites_free: true } } } },
    { label: 'To the kitchen. Every gram is still the ship\'s', dark: true, show: s => foodDays(s) < 75, note: 'The bins are low, and this is what the ship did with its dead for forty years.', info: [['yield', 'Food, from every death after this'], ['danger', 'Morale']],
      out: { text: s => `You say it plainly: the dead will feed the living, as they did for forty years in transit, without the machine in between. ${Nc(s, 'chaplain')} reads the names before the meal. Some people eat and some do not, and the ones who do not are thinner by the end of the month.`,
        fx: { food: 160, morale: -7, flags: { recycle_dead: true, lim_table_open: true }, stain: ['table', 1], chron: 'The colony decided that its dead would be eaten.' } } },
  ] });
add({ id: 'pol.faith', arc: 'politics', tone: 'quiet', title: 'A Congregation',
  when: s => s.day >= 200,
  text: s => `A fifth of the colony now: ${FAITH(s)}. ${P(s, 'chaplain') && P(s, 'chaplain').trait === 'devout' ? `${N(s, 'chaplain')} is one of them, and no longer hides it.` : `${Nc(s, 'chaplain')} calls it a healthy response to an unhealthy amount of sky, and would sooner see them with a hall than a grievance.`}\n\nThey ask for a hall of their own and one rest day in ten.`,
  choices: [
    { label: 'Grant the hall and the rest day', out: { text: 'The hall goes up within the month. They build it themselves, after shift, singing. One day in ten the fields are a fifth short of hands.', fx: { mat: -15, food: -70, morale: 7, flags: { faith_strong: true }, chron: s => `A meeting hall was raised for ${FAITH(s).split(',')[0]}.` } } },
    { label: 'They may meet. They get no hall and no day', note: 'They will meet outdoors before the dawn shift, whatever the weather.', info: [['danger', 'The oldest of them']],
      out: { text: 'They meet in the open before the dawn shift, in the wind. In the cold season one of the oldest of them does not get up from her knees, and the others carry her in past the empty store shed they had asked for.', fx: { morale: 1, pop: -1, flags: { faith_tolerated: true } } } },
    { label: 'Break it up. We cannot afford a second authority', dark: true, note: 'The watch takes the three who lead it off their crews and onto the latrine detail.', info: [['yield', 'No lost days, one voice'], ['danger', 'A fifth of the colony']],
      out: { text: 'The watch breaks up the next meeting and puts the three who led it on the latrine detail for the season. The meetings stop. A few months later there is a ring of stones in the far field that nobody will admit to laying.', fx: { morale: -3, tension: -6, flags: { faith_suppressed: true }, stain: ['broken_faith', 1] } } },
    { label: 'Give them the hall, and put a name from the watch in every row', dark: true, note: 'The watch would hear whatever the congregation tells each other.', req: s => !!P(s, 'security'), reqText: 'There is no Warden to run it', info: [['yield', 'Morale, and you hear everything'], ['danger', 'If they find the list']],
      out: { text: s => `The hall goes up within the month, and they sing in it. ${Nc(s, 'security')} has a notebook by the end of the month: who doubts, who hoards, who is sleeping where, who said what about you. Twice that season the watch acts on something in the notebook before it comes to anything.`,
        fx: { mat: -15, morale: 6, tension: -8, flags: { faith_strong: true, faith_listed: true }, stain: ['informers', 1], chron: s => `A meeting hall was raised for ${FAITH(s).split(',')[0]}.` } } },
  ] });
add({ id: 'pol.schism', arc: 'politics', tone: 'pressure', title: 'The Upriver Party',
  when: s => s.day >= 330 && s.pop >= 55 && (s.morale < 48 || s.flags.command_rule || s.flags.faith_suppressed || s.flags.crackdown),
  setup: s => { const p = anyNamed(s, ['engineer', 'physician']); return { pid: p.id, name: p.name, first: p.first }; },
  text: (s, c) => `Fifteen people want to leave, and not only out of anger. ${c.name} has a site picked out four days upriver, a list of supplies, and a speech.\n\n"Look, it's one camp. One fire, one bad winter, and that's all of us. ${s.flags.command_rule ? 'And some of us want to live somewhere we get a say.' : s.flags.faith_suppressed ? 'And some of us want to pray without posting a lookout.' : 'You know that better than anyone.'}"`,
  choices: [
    { label: 'Let them go, with a third of what is on the list', dark: true, note: 'The whole list comes out of the mouths of the ones who stay. A third of it will not see fifteen people through the Dim.', info: [['yield', 'The stores, mostly kept'], ['danger', 'Fifteen people, short of everything']], cost: { food: 120, parts: 1 },
      out: { text: (s, c) => `They leave at dawn with the handcarts a third full, having been told the rest would follow. ${c.first} shakes your hand. That night there are fifteen empty bunks. Nothing follows.`,
        fx: (s, c) => ({ leave: 15, morale: 1, flags: { daughter: c.name, daughter_bitter: true }, stain: ['short_carts', 2], sched: [['pol.daughter', 150, 220]], do: s2 => { const p = byPid(s2, c.pid); p.alive = false; p.left = s2.day; p.cause = 'left to found the upriver settlement'; s2.vacancies.push({ role: p.role, day: s2.day + 30 }); }, chron: `Fifteen colonists under ${c.name} left to found a second settlement upriver.` }) } },
    { label: (s, c) => `Buy ${c.first}. An office and a private store, and the other fourteen can find out`, dark: true, note: 'Without the one who can lead it, the party is fourteen people with a list.', info: [['yield', 'Nobody leaves'], ['danger', 'Fourteen people sold by their own']],
      test: { base: 52, mods: [R('chaplain', 12), Fl('council', 15, 'They have a vote here'), Fl('faith_strong', 8, 'The congregation holds them'), Fl('command_rule', -10, 'Rule by charter')] },
      ok: { text: (s, c) => `It takes one night and a key to a locker. In the morning ${c.first} tells the fourteen that the site was never sound. They unload the carts. Within the month they know what the locker cost, and ${c.first} eats alone.`, fx: (s, c) => ({ morale: 1, food: -40, stain: ['bought', 1], mark: [c.pid, 'bought', 'took an office and a locker to stay, and the others know'] }) },
      bad: { text: 'They listen politely. They are gone in the morning, and so is a cart of tools nobody authorised.', fx: (s, c) => ({ leave: 15, parts: -5, food: -200, morale: -6, flags: { daughter: c.name, daughter_bitter: true }, sched: [['pol.daughter', 150, 220]], do: s2 => { const p = byPid(s2, c.pid); p.alive = false; p.left = s2.day; p.cause = 'left to found the upriver settlement'; s2.vacancies.push({ role: p.role, day: s2.day + 30 }); } }) } },
    { label: 'Forbid it and post the watch', dark: true, info: [['yield', 'Fifteen pairs of hands kept'], ['danger', 'Blood at the gate']], req: s => !s.flags.council && !s.flags.committee, reqText: s => s.flags.committee ? 'The committee will not use the watch on its own' : 'The Council will not authorise force',
      test: { base: 50, mods: [R('security', 15)] },
      ok: { text: 'The carts are unloaded under the rifles of the watch. Fifteen people go back to their bunks and do exactly what they are told and nothing more.', fx: { morale: -4, flags: { crackdown: true }, stain: ['gate', 1] } },
      bad: { text: 'It comes to a shoving match at the gate, then worse. They get out, and leave three dead at the gate.', fx: { pop: -3, leave: 12, morale: -12, flags: { blood_spilled: true, crackdown: true }, stain: ['gate', 2] } } },
    { label: 'They may go. Their children stay', dark: true, note: 'Four children stay in the school, so a camp upriver will think hard before it does anything you would not like.', info: [['yield', 'Nothing leaves the stores'], ['danger', 'Four children']],
      out: { text: (s, c) => `It is put to them at the gate, with the carts already loaded. Four go back to their bunks and will not leave without their own. Eleven go, with what they can carry and nothing from the stores. ${c.first} looks at the school for a long time before walking out, and does not shake your hand.`,
        fx: (s, c) => ({ leave: 11, morale: -3, flags: { daughter: c.name, daughter_bitter: true, daughter_hostages: true }, stain: ['hostages', 2], sched: [['pol.daughter', 150, 220]], do: s2 => { const p = byPid(s2, c.pid); if (p && p.alive && !p.away) { p.alive = false; p.left = s2.day; p.cause = 'left to found the upriver settlement'; s2.vacancies.push({ role: p.role, day: s2.day + 30 }); } }, chron: `Eleven colonists under ${c.name} left to found a second settlement. Their children were kept behind as surety.` }) } },
  ] });
add({ id: 'pol.daughter', arc: 'politics', tone: 'quiet', chain: true, title: 'Smoke Upriver',
  text: s => `A boat comes down the river: hide over a wooden frame, nothing from the ship in it at all. The upriver settlement is alive. ${s.flags.daughter_bitter ? 'Their envoy stays in the boat.' : `They have brought dried fish-analogue, a clay jar of something alcoholic, and news from ${s.flags.daughter}.`}`,
  choices: [
    { label: 'Trade openly. Two camps are better than one', note: 'What they want is tools and spares, which the machines here are short of.', info: [['yield', 'Food'], ['danger', 'Spares']],
      out: { text: s => s.flags.daughter_bitter ? 'It is stiff and formal and it holds. Food comes down the river, and spares the reactor crew had been counting on go up it.' : 'The jar is opened. By midnight there are plans for a road, and a crate of spares the reactor crew had been counting on is in the boat.', fx: { food: 300, mat: 30, parts: -4, morale: 5, flags: { daughter_trade: true }, chron: 'The upriver settlement survived, and the two camps began to trade.' } } },
    { label: 'Come home, or the river is closed to you', dark: true, note: 'They have no salt, no nails and no medicine that did not come from here.', info: [['yield', 'Hands back'], ['danger', 'A camp cut off']],
      test: { base: 50, mods: [Fl('daughter_bitter', -15, 'They left in anger'), Fl('council', 10, 'They would have a vote'), Fl('daughter_hostages', 12, 'Their children are in your school')] },
      ok: { text: 'The envoy takes it upriver. A month later nine of them come back, with two children born out there, because a camp with no salt and no nails does not see out a year. The others stayed, and nothing goes up the river to them.', fx: { pop: 11, morale: 2, stain: ['blockade', 1] } },
      bad: { text: '"We came to tell you we\'re doing fine. We didn\'t come to ask," says the envoy. Nothing goes up the river after that. The next boat that comes down it is empty and drifting.', fx: { morale: -3, flags: { daughter_bitter: true }, stain: ['blockade', 2] } } },
    { label: 'Follow the boat home and take the place', dark: true, req: s => !!P(s, 'security'), reqText: 'There is no Warden to lead it', test: { base: 56, mods: [R('security', 14), Fl('daughter_hostages', 10, 'Their children are in your school')] }, info: [['yield', 'Their harvest and their hands'], ['danger', 'Lives']],
      ok: { text: 'The watch goes up behind the boat and is inside their fence before anyone there is awake. Their store comes down the river on their own boats, and nine of them with it, under guard. The huts are burned behind them.',
        fx: { food: 520, mat: 40, pop: 9, thralls: 9, morale: -4, flags: { daughter_taken: true }, stain: ['upriver', 2], chron: 'The upriver settlement was taken by force. Its people were brought back to work.' } },
      bad: { text: 'They had a lookout on the bluff. Three of the watch are dead in the shallows, and the settlement upriver is an enemy now and knows the way here.', fx: { pop: -3, morale: -8, flags: { daughter_bitter: true, blood_spilled: true } } } },
  ] });
add({ id: 'pol.accident', arc: 'politics', tone: 'pressure', title: 'The Scaffold',
  when: s => s.day >= 55 && !!s.project,
  text: s => `A lashing parts on the ${LF.projName(s, s.project).toLowerCase()} site and four people fall. Three get up.\n\nThe build crew is standing around the body when you arrive. Their foreman speaks for them. "Fourteen-hour shifts, on rigging made out of cargo straps. Slow it down. Or get used to this, because there'll be more."`,
  choices: [
    { label: 'New rules, and the foreman who ran the site goes back to the ranks', dark: true, note: 'The foreman is the one who warned you. The crew needs the fault to be somebody on the site.', info: [['yield', 'Morale'], ['danger', 'The foreman, and the pace']], out: { text: 'The rules are written that night and painted on a board at the site gate. The foreman is broken to labourer in front of the crew, for rigging the foreman had asked three times to replace, and carries hod on the same site from the next morning.', fx: { pop: -1, morale: 4, flags: { safety: true }, stain: ['foreman', 1] } } },
    { label: 'We do not have time to be careful', dark: true, note: 'The work goes faster, and the crews know what their lives were weighed against.', info: [['yield', 'The build, sooner'], ['danger', 'The next crew to fall']], out: { text: 'The body is carried down and the crew go back up the scaffold on the same cargo straps, the same afternoon. The site is a week ahead by the end of the month.', fx: { pop: -1, morale: -3, flags: { push_on: true }, stain: ['pace', 1], sched: [['pol.accident2', 90, 160]], do: s => { if (s.project) s.progress += 14; } } } },
    { label: 'Stand the site down for a week of mourning', out: { text: 'The work stops. People sleep, and eat, and build nothing. When they come back the foreman has re-rigged the whole site after hours.', fx: { pop: -1, morale: 5, food: -40, do: s => { s.progress = Math.max(0, s.progress - 12); } } } },
    { label: 'Somebody tied that lashing. Try them for it', dark: true, note: 'The rigger is nineteen, and the crew wants somebody to be angry at who is not you.', info: [['yield', 'The pace holds, and the anger goes elsewhere'], ['danger', 'The rigger']],
      out: { text: 'The rigger who tied it is nineteen and has not stopped shaking. The hearing takes an hour. The foreman will not look at you during it, or at the rigger afterwards, when it is done from the same scaffold. The crew goes back up in the morning, on the same cargo straps, checking every knot.',
        fx: { pop: -2, morale: 2, tension: -8, flags: { push_on: true, justice_harsh: true }, stain: ['rigger', 2], sched: [['pol.accident2', 90, 160]], chron: 'A nineteen-year-old rigger was hanged for a lashing that parted.' } } },
  ] });
add({ id: 'pol.accident2', arc: 'politics', tone: 'crisis', chain: true, title: 'The Second Fall',
  when: s => s.flags.push_on,
  text: s => `This time it is a kiln wall, and it is five people. The foreman who warned you is one of them.\n\n${Nc(s, 'physician')} is working on the survivors. The build crews have put down their tools and are waiting to hear what you learned the first time.`,
  choices: [
    { label: 'They were right. Change everything', note: 'Everything being built stops for a week and goes slower for good.', info: [['danger', 'Everyone waiting on the build']], out: { text: 'You say so, in front of all of them. The cargo-strap rigging is cut down and replaced that month, and nothing else is built while it is.', fx: { pop: -3, morale: -2, flags: { push_on: false, safety: true }, do: s => { s.progress = Math.max(0, s.progress - 12); } } } },
    { label: 'Hold the line', dark: true, info: [['yield', 'The pace holds'], ['danger', 'The colony stops']], test: { base: 45, mods: [R('security', 10), Fl('command_rule', 10, 'Habit of command'), M('medbay', 8)] },
      ok: { text: 'They go back up with the watch standing at the foot of the scaffold. The pace holds.', fx: { pop: -3, morale: -5, stain: ['pace', 2] } },
      bad: { text: 'They do not go back. The colony stops, all of it, for nine days.', fx: { pop: -5, morale: -14, food: -200, flags: { push_on: false, safety: true } } } },
    { label: 'The foreman built that wall. Say the fault was the foreman\'s', dark: true, note: 'The foreman is dead and cannot answer, and the crews want it to be somebody.', info: [['yield', 'The pace holds, and it is not your fault'], ['danger', 'A dead man\'s name']],
      out: { text: 'You say it at the graveside: the wall was the foreman\'s work and the foreman\'s responsibility. The foreman\'s partner walks out before you have finished. The crews go back up the next day, working at the old pace and saying nothing about who warned whom.', fx: { pop: -3, morale: -2, stain: ['blamed_dead', 1] } } },
  ] });
add({ id: 'pol.births', arc: 'politics', tone: 'quiet', title: 'The Question of Children',
  when: s => s.day >= 200 && (s.day >= 280 || (s.gen && s.gen.n >= 3)) && !s.flags.qk_open,   // not while every pregnancy on the ground is on the clinic's list (js/thread-quickening.js)
  setup: s => ({ n: (s.gen && s.gen.n) || 0 }),
  // Children come without being decided on (generations.js). What is decided here is the colony's rule about them:
  // encouraged (flags.births), assigned as well (embryo_program), or put off (births_deferred, until the fields are in).
  text: (s, c) => `${Nc(s, 'physician')} raises it, because someone has to. ${c.n > 1 ? `${LF.th && LF.th.num ? LF.th.num(c.n).replace(/^./, x => x.toUpperCase()) : c.n} children have been born here since the landing, and nobody ever decided that they should be.` : c.n === 1 ? 'One child has been born here since the landing, and two more couples have asked the clinic whether they may.' : 'No child has been born here since the landing, and two couples have asked the clinic whether they may be the first.'} The embryo bank holds four thousand genomes from a planet none of you will see again. And every child is a mouth for ${LF.ageWord} years before it is a pair of hands.\n\nStores stand at ${Math.round(foodDays(s))} days.`,
  choices: [
    { label: 'Yes. Children are the point', out: { text: s => `It is the first policy you have announced that people applaud. ${Nc(s, 'quartermaster')} waits for the noise to stop and reads out what a pregnancy eats.`, fx: { morale: 8, food: -90, flags: { births: true } } } },
    { label: 'Yes, and every second child is one the clinic assigns from the embryo bank', dark: true, note: 'It widens the gene pool, and nobody who carries one is asked whether they want to.', info: [['yield', 'More children, wider blood'], ['danger', 'Whoever is told to carry']],
      out: { text: 'It is read out as a rule, with the names of the first six to carry. Two of the six had not asked for a child at all. The first embryo is thawed the same month.', fx: { morale: 1, flags: { births: true, embryo_program: true }, stain: ['assigned', 2], chron: 'The colony began raising children from the embryo bank alongside its own.' } } },
    { label: 'Not until the fields can feed them. Implants for everyone, checked', dark: true, note: 'It holds until the open fields are in. Some of the women are already carrying.', info: [['yield', 'Almost no new mouths, for now'], ['danger', 'The women already carrying']],
      out: { text: s => `Implants are fitted at the next medical, to everyone, and checked. Two women were already three months along. ${Nc(s, 'physician')} does what the rule requires and writes each one up as a miscarriage.`, fx: { morale: -3, flags: { births_deferred: true }, stain: ['implants', 2] } } },
  ] });

/* ================= QUIET ================= */
add({ id: 'q.feud', arc: 'quiet', tone: 'quiet', title: 'Two Good People',
  when: s => s.day >= 60 && s.people.filter(p => p.alive && !p.away).length >= 4,
  // Two people who were already rivals, if there are any; otherwise this is where a rivalry starts.
  setup: s => { let a = anyNamed(s), b = anyNamed(s, [a.role, a.id]), old = false;
    const r = (s.bonds || []).map(x => x.k === 'rival' && [byPid(s, x.a), byPid(s, x.b)]).find(x => x && x[0].alive && x[1].alive && !x[0].away && !x[1].away);
    if (r) { a = r[0]; b = r[1]; old = true; } else if (LF.bond) LF.bond(s, a, b, 'rival');
    return { a: a.id, an: a.name, af: a.first, b: b.id, bn: b.name, bf: b.first, old }; },
  text: (s, c) => `${c.an} and ${c.bn} have not spoken in a month. ${c.old ? 'It has been coming for years. This time it' : 'It'} was about a duty roster, and now it is about everything.\n\nBoth are too useful to lose. Each has, separately, asked you to move the other.`,
  choices: [
    { label: 'Lock them in a room until it is settled', test: { base: 50, mods: [R('chaplain', 15)] },
      ok: { text: (s, c) => `Six hours. They come out red-eyed and laughing. ${c.af} and ${c.bf} will be insufferable allies from now on.`, fx: { morale: 4 } },
      bad: { text: (s, c) => `Six hours. ${c.bf} comes out with a split lip, and the colony picks sides.`, fx: { morale: -5 } } },
    { label: (s, c) => `Back ${c.af}`, out: { text: (s, c) => `${c.bf} takes the reassignment without a word, and does the new job flawlessly, and never again tells you anything you did not ask for.`, fx: (s, c) => ({ morale: -1, mark: [c.b, 'slighted'] }) } },
    { label: (s, c) => `Back ${c.bf}`, out: { text: (s, c) => `${c.af} takes the reassignment without a word, and does the new job flawlessly, and never again tells you anything you did not ask for.`, fx: (s, c) => ({ morale: -1, mark: [c.a, 'slighted'] }) } },
    { label: 'Rope them together and send them to walk the far markers', note: 'Nine days out with one tent between them, and either they come back able to work together or one of them does not come back.', test: { base: 58, mods: [If(s => s.survey > 50, 8, 'Good maps')] }, info: [['yield', 'The map'], ['danger', 'One of the two']],
      ok: { text: (s, c) => `They come in on the ninth day, filthy, finishing each other's sentences about a pass nobody had mapped. Whatever was said out there, ${c.af} and ${c.bf} do not tell you.`, fx: { survey: 16, morale: 3 } },
      bad: { text: (s, c) => `${c.af} comes in alone on the eleventh day, carrying two packs, and says there was a slope and it gave. Nobody was there to say otherwise. Half the colony believes it.`,
        fx: (s, c) => ({ kill: [{ who: c.b, cause: 'a fall at the far markers, roped to a rival' }], morale: -4, mark: [c.a, 'doubted', 'came back alone from the far markers, and is not quite believed'] }) } },
  ] });
add({ id: 'q.wedding', arc: 'quiet', tone: 'quiet', title: 'Under an Open Sky',
  when: s => s.day >= 100 && s.morale >= 35,
  text: s => `Two of the field crew want to marry. Nobody has, since landing. They would like to do it outdoors, at dusk, with the ${s.sleepers > 0 ? `${s.world.ship} crossing overhead` : 'first stars coming out'}, and they would like, if it is not too much, a feast.`,
  choices: [
    { label: 'A feast. Open the good stores', note: 'It is food that was being kept for the lean season.', cost: { food: 180 }, out: { text: 'Someone has been secretly distilling. Someone else can play the fiddle. The dancing goes on until the night shift has to leave.', fx: { morale: 11, tension: -10, chron: 'The first wedding on the new world was held outdoors at dusk.' } } },
    { label: 'A ceremony, and an extra hour off shift', out: { text: 'It is brief and windblown and everybody comes. There is nothing on the tables afterwards but the day\'s ladle, and the two of them pretend not to mind. The hour comes out of the weeding.', fx: { morale: 3, food: -20 } } },
    { label: 'Not this season. Nobody takes a day while the bins look like this', show: s => foodDays(s) < 70, out: { text: 'They take it well, in front of you. They are married anyway within the month, behind the pump house, by a friend with no standing to do it, and half the field crew was there and none of them told you.', fx: { morale: -4, tension: 4 } } },
  ] });
add({ id: 'q.earth', arc: 'quiet', tone: 'pressure', title: 'Mail',
  when: s => s.day >= 180,
  text: s => `The ${s.world.ship} has caught a data packet from Earth, decades old. Thousands of personal letters, and a news digest: the agency that launched you was dissolved, the second ship never built.\n\nSo far only ${N(s, 'teacher')} has read it.`,
  choices: [
    { label: 'Release all of it', note: 'Some people have been working for the day the second ship arrives.', info: [['danger', 'The ones who were waiting']],
      out: { text: 'People read their letters, and then they read the digest. For a few days the colony is very quiet. In the second week one of the navigators walks out past the wire at night without a pack. Then people go back to work.', fx: { morale: -5, pop: -1, flags: { earth_truth: true }, chron: 'Word came from Earth, thirty years stale. Nobody else was coming.' } } },
    { label: 'Letters only. Archive the rest', dark: true, note: s => `${Nc(s, 'teacher')} would have to lie to anyone who asks why there is no news.`, info: [['yield', 'Morale'], ['danger', 'If the file is found']],
      out: { text: s => `The letters are a gift. The digest goes into a file only you and ${N(s, 'teacher')} can open. Within the month three people have asked why there is no news, and ${N(s, 'teacher')} has lied to each of them, badly. People go on planning for a ship.`, fx: { morale: 6, tension: 4, flags: { earth_hidden: true }, stain: ['withheld_news', 1] } } },
    { label: 'Write back', note: 'It will arrive in forty years. Someone may be listening.',
      out: { text: 'Everyone gets two hundred words, and the digest with them, because there is no writing back without knowing what to. Most use all of them. The transmission takes nine hours of reactor time, and people stand outside for the whole of it, looking the wrong way.', fx: { morale: 4, machine: { reactor: -4 }, flags: { earth_truth: true, wrote_home: true }, chron: 'The colony sent its first message home, knowing no answer could come for eighty years.' } } },
    { label: 'Rewrite the digest. A second ship is on its way', dark: true, note: s => `Only you and ${N(s, 'teacher')} have seen the real one. People work differently for a colony that is going to be relieved.`, info: [['yield', 'Morale, for years'], ['danger', 'If it ever comes out']],
      out: { text: s => `${Nc(s, 'teacher')} writes it, because the style has to be right, and then asks never to be alone in a room with you again. It is read out in the mess hall: the second ship launched nine years behind you. People cry. Somebody starts marking off the years on the wall, and the mark for the year it is due is drawn larger than the rest.`,
        fx: { morale: 12, flags: { earth_hidden: true, earth_lie: true }, stain: ['second_ship', 2], do: s => { const p = P(s, 'teacher'); if (p && p.loyal !== undefined) p.loyal = Math.max(0, p.loyal - 25); }, chron: 'The colony was told that a second ship was nine years behind it.' } } },
  ] });
add({ id: 'q.walkabout', view: 'world', arc: 'quiet', tone: 'quiet', title: 'Gone Walking',
  when: s => s.day >= 130,
  // The one who walks off is the one who most wants to know what is out there.
  setup: s => { const any = anyNamed(s, ['physician', 'engineer']), p = (LF.cast && LF.cast(s, { want: 'know', not: ['physician', 'engineer'], need: 2 })) || any; return p ? { pid: p.id, name: p.name, first: p.first } : {}; },
  text: (s, c) => `${c.name || 'One of the surveyors'} left a note on the mess table ("Need to see what's over the ridge. Back in a week") and took a pack and a water filter. That was eleven days ago.`,
  choices: [
    { label: 'Send a search party', note: 'Six people off the fields for a week, looking for one.', info: [['danger', 'A week of six people\'s work']], test: { base: 60, mods: [R('security', 10), If(s => s.survey > 60, 10, 'Good maps')] },
      ok: { text: (s, c) => `They find ${c.first || 'the walker'} on a ridge two valleys over, thinner, ${LF.lex(s, 'burnt')}, entirely calm, with forty pages of sketches. "Just wanted to see the next valley. Then there was another one."`, fx: { survey: 30, morale: 3, food: -40 } },
      bad: { text: (s, c) => `They find the pack, and the water filter, and a place where the scree gave way.`, fx: (s, c) => (c.pid ? { food: -40, kill: { who: c.pid, cause: 'a fall, walking alone beyond the ridge' } } : { food: -40, pop: -1 }) } },
    { label: 'Wait', out: { text: (s, c) => `On the fourteenth day ${c.first || 'the walker'} strolls in at dinner time, sits down, and asks what is for eating. The sketches are remarkable. By the end of the month two more people have gone to see a ridge of their own, with packs from the stores.`, fx: { survey: 18, leave: 2, food: -30 } } },
    { label: 'Post it as desertion, and give the bunk away', dark: true, note: 'Nobody goes looking, and whoever comes back, comes back to a charge.', info: [['yield', 'Nobody else walks off'], ['danger', 'One person, alone out there']],
      out: { text: (s, c) => `No party goes out. ${c.first || 'The walker'} walks in on the fourteenth day to a bunk with somebody else in it and a charge sheet on the mess table. The sketches are taken for the map. The sentence is two months on the latrine trenches, and nobody leaves the wire without a chit again.`,
        fx: (s, c) => ({ survey: 22, morale: -2, tension: -6, flags: { justice_harsh: true }, stain: ['charge', 1], mark: c.pid ? [c.pid, 'convict', 'dug latrines for walking out to see what was over the ridge'] : null }) } },
  ] });
add({ id: 'q.firstborn', arc: 'quiet', tone: 'quiet', title: 'Native', w: 4,
  when: s => !!(s.gen && s.gen.first) && !s.flags.qk_open && !s.flags.qk_born,   // the first child conceived here has been born (generations.js), and not out of the Quickening, which tells that birth itself
  text: s => `A girl, three and a half kilos, born at dawn in ${s.machines.medbay.lost ? 'a cargo pod with a midwife who learned from the archive' : 'the clinic'}. The first human being for whom ${s.world.planet} is simply home.\n\nThe parents have asked you to choose her name.`,
  choices: [
    { label: s => `${s.firstDead ? s.firstDead.split(' ')[0] : 'Hope'}, for the first we lost`, show: s => !!s.firstDead, out: { text: 'The parents nod. The name is chalked on the clinic door that evening.', fx: { morale: 9, chron: s => `The first child born on ${s.world.planet} was named ${s.firstDead.split(' ')[0]}, for the first of the dead.` } } },
    { label: s => `${s.world.planet}`, out: { text: 'The child is named for the ground she was born on. By the time she can walk, everyone will just call her Tess, or Wen, or Kes.', fx: { morale: 8, chron: s => `The first child born on ${s.world.planet} was named for the world itself.` } } },
    { label: 'That is not mine to choose', out: { text: 'They choose a grandmother\'s name, from a continent the child will know only as a shape in the archive.', fx: { morale: 6, chron: s => `The first child was born on ${s.world.planet}.` } } },
  ] });
add({ id: 'q.memorial', arc: 'quiet', tone: 'quiet', title: 'The Wall',
  when: s => s.deaths >= 8,
  text: s => `${s.deaths} dead since landing. Somebody has started scratching names into a hull plate behind the mess hall. It is crooked, and two are misspelled.`,
  choices: [
    { label: 'Have it done properly, in metal', cost: { mat: 15 }, out: { text: 'A plate of ship\'s hull, etched, set in stone at the landing site. There is a great deal of empty space left on it.', fx: { morale: 6, tension: -10, chron: 'A memorial wall was raised at the landing site.' } } },
    { label: 'Leave it as it is', out: { text: 'It stays crooked. People correct the spellings themselves, and start adding the names of people who are not dead yet but are on the sick list.', fx: { morale: 2 } } },
    { label: 'Take the plate back. Hull plate is hull plate', note: 'It is good plate, and the smelter is short.', info: [['yield', 'Materials'], ['danger', 'Morale']],
      out: { text: 'The plate is unbolted at the change of shift and goes to the yard. The names are on the wall behind it by morning, in paint, larger, and yours has been added at the bottom with a question mark.', fx: { mat: 14, morale: -6, tension: 5 } } },
  ] });

/* The Returned cards (ret.shed, ret.again) are beats of the Verge now: js/thread-small.js. */
/* ================= MUTINY =================
   Low morale no longer ends the game. Held long enough, it turns on the colony's leadership: the officers and the
   council, not the player (the colony leader stays in post). Every way out costs something lasting. */
const demote = (s, role, cause) => { const p = P(s, role); if (!p) return null;
  p.role = null; p.marks.deposed = { d: s.day, txt: cause }; s.vacancies.push({ role, day: s.day + LF.ri(s, 20, 45) }); return p; };
add({ id: 'pol.mutiny', urgent: true, arc: 'politics', tone: 'crisis', title: 'The Officers\' Mess', repeat: 160,
  when: s => s.lowMorale >= 14 && s.day >= 60 && s.pop >= 16,
  setup: s => { const p = s.people.find(x => x.alive && !x.role && !x.away && x.marks.grudge) || anyNamed(s, ['security', 'quartermaster', 'teacher']);
    return p ? { pid: p.id, name: p.name, first: p.first } : { name: 'A shift foreman', first: 'the foreman' }; },
  text: (s, c) => `They come for the officers at the change of shift: forty people, ${c.name} at the front, nobody armed and nobody smiling. ${Nc(s, 'security')} is backed against the armoury door. ${Nc(s, 'quartermaster')} has the stores keys in a fist.\n\n"We're not touching the ship," ${c.first} says, looking up at the nearest camera. "You can stay. They go."`,
  choices: [
    { label: 'Back the officers. Lock the stores and starve the corridor out', dark: true, note: 'Nobody in the crowd eats until the crowd goes home.', info: [['yield', 'The officers keep their posts'], ['danger', 'Blood, if it goes wrong']],
      test: { base: 50, mods: [R('security', 14), Fl('council', 8, 'There is a lawful Council to appeal to'), Fl('crackdown', -10, 'They remember the last time'), If(s => s.res.food > 400, 8, 'The stores are not empty')] },
      ok: { text: (s, c) => `The stores are locked and the kitchen is shut. Two days of standoff with no food in the corridor. On the third morning the crowd is thinner, and by evening it has gone back to work for its ladle. ${c.name} is confined to quarters for a month.`,
        fx: (s, c) => ({ morale: 6, tension: -10, flags: { mutiny_broken: true }, stain: ['starved_out', 1], mark: c.pid ? [c.pid, 'mutineer', 'led the crowd that came for the officers'] : null, chron: 'A mutiny against the officers was faced down without a shot.' }) },
      bad: { text: (s, c) => `Somebody gets the armoury door open. What happens in the corridor takes under a minute. When it is over the officers who held the door are on the floor, and a committee led by ${c.name} is giving the orders.`,
        fx: (s, c) => ({ kill: [{ who: 'security', cause: 'killed holding the armoury door in the mutiny' }], pop: -2, morale: 10, tension: -20, flags: { committee: true, blood_spilled: true, council: false, command_rule: false },
          do: s2 => { demote(s2, 'quartermaster', 'was thrown out of office by the mutiny'); }, chron: `The officers were overthrown. A committee under ${c.name} took the colony, over the Warden's body.` }) } },
    { label: 'Let the committee take over. The officers stand down', dark: true, note: 'Nobody is hurt tonight. The officers did what you asked of them for years, and you hand them to the crowd.', hint: 'unknown', info: [['yield', 'Morale, and no blood'], ['danger', 'The officers who obeyed you']],
      out: { text: (s, c) => `The officers hand over their keys in the mess hall, one at a time, to a table of people who were running shifts last month. ${c.name} reads out the committee's first order: full ladles, tonight.`,
        fx: (s, c) => ({ morale: 16, tension: -25, rations: LF.lean(s) ? 'normal' : s.rations, flags: { committee: true, council: false, command_rule: false }, stain: ['stood_down', 1],
          do: s2 => { demote(s2, 'security', 'stood down when the committee took over'); demote(s2, 'quartermaster', 'stood down when the committee took over'); },
          chron: `The officers stood down without a fight, and a committee under ${c.name} ran the colony.` }) } },
    { label: 'Give them one officer, and keep the rest', dark: true, note: 'One person pays for what the crowd is angry about, and it is the one who kept your ledger.', hint: 'bad', info: [['yield', 'The crowd goes home'], ['danger', 'The Quartermaster']], req: s => !!P(s, 'quartermaster'), reqText: 'The one they want is already gone',
      out: { text: s => `The Quartermaster is the one they hate, because the Quartermaster held the keys. ${Nc(s, 'quartermaster')} walks out past the wire with a pack and a rifle and does not look back. The crowd goes home.`,
        fx: s => ({ morale: 8, tension: -12, leave: 1, flags: { scapegoat: true }, stain: ['thrown_out', 2], do: s2 => { const p = P(s2, 'quartermaster'); if (p) { p.alive = false; p.left = s2.day; p.died = s2.day; p.cause = 'sent out past the wire to end a mutiny'; s2.vacancies.push({ role: 'quartermaster', day: s2.day + 30 }); } },
          chron: 'To end a mutiny, the Quartermaster was sent out past the wire.' }) } },
    { label: 'Open the armoury to the watch. Clear the corridor', dark: true, req: s => !!P(s, 'security') && !s.flags.committee, reqText: 'There is nobody to give the order to', info: [['yield', 'It ends tonight'], ['danger', 'The front of the crowd']],
      test: { base: 62, mods: [R('security', 12), Fl('lim_house_blessed', 8, 'The Warden owes you'), If(s => !!(s.cargo && s.cargo.arms), 8, 'The arms locker')] },
      ok: { text: (s, c) => `The armoury door opens from the inside. The watch fires once over their heads and then does not fire over their heads. It takes under a minute. Seven are dead in the corridor, ${c.name} among the first, and the rest are face down with their hands behind them. The morning shift reports in full.`,
        fx: (s, c) => ({ kill: c.pid ? [{ who: c.pid, cause: 'shot in the corridor outside the officers\' mess' }] : [], pop: c.pid ? -6 : -7, tension: -20, flags: { mutiny_broken: true, crackdown: true, blood_spilled: true }, stain: ['corridor', 3],
          do: s2 => { s2.morale = Math.max(s2.morale, 30); s2.lowMorale = 0; if (LF.emit) LF.emit(s2, 'fear', 'pol.mutiny', 60, 260, 'the watch fired into the crowd outside the officers\' mess'); }, chron: 'A mutiny was ended by the watch firing into the crowd. Seven died.' }) },
      bad: { text: (s, c) => `The watch fires, and four go down, and then the crowd is on them. What happens in the corridor after that takes under a minute. The officers who gave the order and the officers who obeyed it are on the floor, and a committee led by ${c.name} is giving the orders over all of them.`,
        fx: (s, c) => ({ kill: [{ who: 'security', cause: 'killed in the corridor after ordering the watch to fire' }], pop: -6, morale: 6, tension: -20, flags: { committee: true, blood_spilled: true, council: false, command_rule: false }, stain: ['corridor', 2],
          do: s2 => { demote(s2, 'quartermaster', 'was thrown out of office by the mutiny'); }, chron: `The watch fired on a mutiny and lost. A committee under ${c.name} took the colony.` }) } },
  ] });
LF.TAGS['pol.mutiny'] = ['order severe', 'free', 'severe', 'severe order'];
/* ================= GENERATIONS =================
   The founders do not last for ever. Years in, an officer who has held the chair since landfall wants to hand the
   office to the deputy, the seat's other officer (2026-11-18: never to a colonist). Only while there is a deputy left. */
const founder = s => s.people.find(p => p.alive && p.role && p.seat && !p.alt && !p.green && !p.promoted && !p.orbit && !p.away && p.known && !p.marks.stayed_on && p.trait !== 'stubborn' && LF.altOf(s, p.seat));
add({ id: 'q.handover', view: 'people', arc: 'quiet', tone: 'quiet', title: 'The Old Hands', repeat: 200, max: 3, w: 1.4,
  when: s => s.day >= 600 && !!founder(s),
  setup: s => { const p = founder(s); return { pid: p.id, name: p.name, first: p.first, role: p.role, title: LF.title(p), alt: LF.altOf(s, p.seat).first }; },
  text: (s, c) => `${c.name} has been ${c.title} since before the ${s.world.ship} made orbit, and has decided that is long enough. ${c.first} wants the chair to go to ${c.alt}, who has been deputy all that time and has done more of the work each year.`,
  choices: [
    { label: 'Let them hand it on', hint: 'unknown', info: (s, c) => [['people', `${c.alt} can have the chair next month`], ['danger', `Nobody after ${c.alt}`]],
      out: { text: (s, c) => `There is no ceremony. ${c.first} hands ${c.alt} a set of keys and a notebook, and is seen the next morning in the fields, looking ten years younger.`,
        fx: (s, c) => ({ morale: 2, flags: { handovers: (s.flags.handovers || 0) + 1 }, do: s2 => { const p = byPid(s2, c.pid); if (!p || !p.alive || p.role !== c.role) return; const role = p.role;
          LF.vacate(s2, p, 'elder', `was ${c.title} for the colony's first years, and handed the office on`, true); } }) } },
    { label: 'Ask them to stay one more year', hint: 'unknown', out: { text: (s, c) => `${c.first} agrees, the way people agree when they have been asked nicely by someone they cannot refuse. The notebook goes back in the drawer. ${c.alt} hears about it from somebody else.`, fx: (s, c) => ({ morale: -2, mark: [c.pid, 'stayed_on', 'was asked to stay on past their time, and did'], do: s2 => { const p = byPid(s2, c.pid); if (p && p.loyal !== undefined) p.loyal = Math.max(0, p.loyal - 10); } }) } },
    { label: 'Make them an elder, with a seat at every council', hint: 'good', info: [['yield', 'Morale']],
      out: { text: (s, c) => `${c.first} keeps the title and gives up the work. ${c.alt} does the job without the office or the ration that goes with it, and has started saying so. ${c.first} sits at the end of the council table and is listened to more than before.`,
        fx: (s, c) => ({ morale: 2, flags: { elders: true }, mark: [c.pid, 'stayed_on', 'became an elder of the colony'] }) } },
  ] });
LF.TAGS['q.handover'] = ['free open', 'order cautious', 'order mercy'];
for (const [id, tag] of [['pol.charter', 'severe order'], ['pol.burial', 'severe order'], ['pol.faith', 'order closed'], ['pol.schism', 'severe order'], ['pol.accident', 'severe order'],
  ['q.feud', 'bold'], ['q.earth', 'order closed'], ['q.walkabout', 'severe order']]) if (LF.TAGS[id]) LF.TAGS[id].push(tag);
LF.TAGS['pol.daughter'] = ['open', 'severe closed', 'severe closed']; if (LF.TAGS['pol.accident2']) LF.TAGS['pol.accident2'].push('severe order'); LF.TAGS['q.memorial'] = ['mercy', 'free', 'severe'];
LF.TAGS['ret.shed'] = ['open bold', 'open cautious', 'closed order']; LF.TAGS['ret.again'] = ['free open', 'order bold', 'order closed'];
})();