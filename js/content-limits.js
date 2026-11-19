/* Landfall — the Limits: what ordinary people decide when there is nothing ordinary left to decide (DESIGN.md
   "The Limits"). Three lines of cards: hunger, labour and order. Every option marked dark: true works, mechanically,
   and leaves a standing practice the colony then lives with (s.flags.lim_*), a stain (s.flags.stain) that the named
   people keep count of, and a later card that comes back for it. LF.limitsTick runs the standing practices. */
(function () {
'use strict';
const { add, h, clamp } = LF; const { P, N, Nc, F, R, M, Fl, If, anyNamed, byPid, foodDays } = h;
const ok = (s, id) => !s.machines[id].lost && !s.machines[id].up;   // on the ground and working (a system still aboard the ship is no use down here)
const num = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'][n] || String(n);
const Num = n => { const t = num(n); return t[0].toUpperCase() + t.slice(1); };
const ctxOf = p => p ? { pid: p.id, name: p.name, first: p.first, title: LF.title(p), role: p.role, merciful: !!(p.vals && p.vals.mercy === 1) } : { name: 'One of the clerks', first: 'the clerk', title: 'clerk' };
const th = s => s.flags.thralls || 0, sv = s => s.flags.servitors || 0;
const regard = (s, who, d) => { const p = typeof who === 'string' ? (byPid(s, who) || P(s, who)) : who; if (p && p.alive && p.loyal !== undefined) p.loyal = clamp(p.loyal + d, 0, 100); };
const allRegard = (s, d, fn) => { for (const p of s.people) if (p.alive && p.loyal !== undefined && (!fn || fn(p))) p.loyal = clamp(p.loyal + d, 0, 100); };
/* Someone leaves the colony alive: put out, walked off, relieved for good. */
const gone = (s, who, cause) => { const p = typeof who === 'string' ? (byPid(s, who) || P(s, who)) : who; if (!p || !p.alive) return;
  p.alive = false; p.left = s.day; p.died = s.day; p.cause = cause; s.pop = Math.max(0, s.pop - 1); if (p.role) s.vacancies.push({ role: p.role, day: s.day + LF.ri(s, 25, 45) }); };   // out of the colony, not buried: p.left (LF.isDead)
const demote = (s, who, cause) => { const p = typeof who === 'string' ? (byPid(s, who) || P(s, who)) : who; if (!p || !p.alive || !p.role) return;
  const role = p.role; p.role = null; p.marks.deposed = { d: s.day, txt: cause }; s.vacancies.push({ role, day: s.day + LF.ri(s, 20, 45) }); };
/* People taken out of the colony's count without a grave: harnessed, or walked away in a body. */
const take = (s, n) => { s.pop = Math.max(0, s.pop - n); if (th(s) > s.pop) s.flags.thralls = s.pop; };
const days = (s, food) => Math.max(1, Math.round(food / Math.max(1, LF.foodCons(s))));

/* The stain: how much of this the colony has done. People who hold that nobody is spare keep the count, and their
   regard goes with it; the severe think better of you. A promise that it would stop (lim.refuse) breaks here. */
LF.stain = function (s, k, w) {
  const f = s.flags; w = w === undefined ? 1 : w;
  if (k && !f['lim_' + k]) f['lim_' + k] = s.day;
  if (!w) return;
  f.stain = (f.stain || 0) + w;
  for (const p of s.people) if (p.alive && p.vals && p.loyal !== undefined) p.loyal = clamp(p.loyal + (p.vals.mercy === 1 ? -2 * w : p.vals.mercy === -1 ? 1 * w : -0.3 * w), 0, 100);
  if (f.lim_vow && !f.lim_vow_broken) { f.lim_vow_broken = s.day; s.morale = clamp(s.morale - 6, 0, 100);
    LF.log(s, 'The promise that it would stop here has been broken, and a great many people heard it made.', 'bad'); allRegard(s, -10, p => p.vals && p.vals.mercy === 1); }
};
const stain = LF.stain;
const WORST = [
  ['lim_expose', () => 'the infants put outside the wire'], ['lim_genocide', s => `what was done to ${s.flags.lim_genocide_n || 'the people who were here first'}`],
  ['lim_incubate', () => 'the children grown in women who were never woken to be asked'], ['lim_herd', () => 'the sleepers flown down as meat, ten a month'],
  ['lim_larder', () => 'the fifteen sleepers who were eaten'], ['lim_cull', () => 'the list of people who could not work'], ['lim_lots', () => 'the drum with the names in it'],
  ['lim_coffle', () => 'the people brought back roped behind the food carts'], ['lim_harness_many', () => 'the harnesses'], ['lim_ward', () => 'the sick house, and what was done to it'],
  ['lim_goat', s => `${s.flags.lim_goat_n || 'the one'} who was tried for something nobody did`], ['lim_tenth', () => 'the one in ten'], ['lim_trial', () => 'the locked ward and the splice'],
  ['lim_cult', () => 'the kneeling in the yard'], ['lim_flock', () => 'the flock'], ['lim_native_meat', () => 'what the watch brought back on the carts and called game'],
  ['lim_house', () => 'the armoury annex'], ['lim_table', () => 'what went into the pot'], ['lim_bond', () => 'the compound'], ['lim_servitor', () => 'the rigger in the harness'],
  ['lim_organ', () => 'pod sixty-one'], ['lim_hand', () => 'the hand'],
  ['lim_bank_d', () => 'bank D'], ['lim_culprit', () => 'the officer hanged for orders that were not theirs'], ['lim_silenced', () => 'the one who read the list, and the fall'], ['lim_decoy', () => 'the bank cut loose as a decoy'], ['lim_lock', () => 'the three put out of the lock'], ['lim_refreeze', () => 'the twelve sent back into the cold'], ['lim_taster', () => 'the short straw and the plate'],
  ['lim_well', () => 'what went into their cistern'], ['lim_plaguegift', () => 'the bundles of bedding'], ['lim_terror', () => 'the poles along the wire'], ['lim_hostages', () => 'the children kept inside the wire'],
  ['lim_torture', () => 'the pump house'], ['lim_vivisect', () => 'the two days on the table'], ['lim_vanish', () => 'the boot at the edge of the wire'], ['lim_carriers', () => 'the six walked out at dawn'], ['lim_expend', () => 'the lock-up, and what it was used for'],
];
/* Deeds from the rest of the game (the weight pass: frames, threads, crossings, the older arcs). Each is a stain key
   set through fx.stain, and the phrase that names it. */
const DEEDS = {
  fed_eaters: "the three taken for both lists",
  lists_both: "the two lists pinned up side by side",
  wst_air: "the wasting put down to the air and the work, and the scale taken away",
  wst_triage: "the shallow ladle for the ward, the old and the children",
  wst_search: "the bunks of the fed turned out on no charge",
  wst_named: "the names of the fed pinned to the mess door",
  wst_trial: "the twelve on the ward fed from the pot unasked",
  wst_ban: "the other pot, emptied over the wire untried",
  wst_box: "the body opened at night and given back in a closed box",
  wst_open: "the dead opened on the ward table, every one, by standing order",
  wst_first: "the three bowls carried past the ward beds to an officer",
  wst_dose: "the officer ordered to eat from the pot as the test",
  wst_putout: "the fed, put out through the gate for having lost no weight",
  wst_cut: "the rigger opened alive for being well",
  wst_table: "the whole colony put onto the grey pot, the children first",
  wst_drench: "the lye drench, and the ones it scoured to death",
  wst_force: "the long table and the tube",
  wst_made: "the ones held down for an answer nobody could prove",
  wst_wire: "the ones put outside the wire until they came round",
  wst_second: "the second answer, tried on a colony too weak for the first",
  wst_cull: "the beds on the ward where the ladle stopped",
  wst_told: "the hall told the scales had turned",
  wst_record: "the wasting, entered as a fever",
  fer_lied: "the bone ground logged as a burial, and the forager as a deserter",
  fer_plate: "the hull plate from the bone ground, cut up for roofing",
  fer_bait: "the hauler set to hoe the furrow at dusk on a line",
  fer_taken: "the one carried off from the hill in a cargo net",
  fer_smoked: "the smudge fires in the near mouths, and the thirty shot coming out",
  fer_question: "the prisoner's night with the watch in the pump house",
  fer_hanged: "the prisoner hanged at the outer post for the hill to see",
  fer_turned: "the ones in coveralls, kept out at the gate",
  fer_shot: "the ones in coveralls, shot at the gate",
  fer_putout: "the ones in coveralls, put out at night",
  fer_spies: "the ones in coveralls, hanged at the cart crane",
  fer_breach: "the breach held by firing into the loads",
  fer_ward: "the sick ward left on the latch",
  fer_ours: "the hauler who came home from the hill to a chain and a lamp",
  fer_shut: "the hauler who came home from the hill and was kept out",
  fer_burned: "the hill, burned gallery by gallery",
  fer_sealed: "the mouths of the hill, blown shut on everyone in it",
  fer_deck: "the party sent up the hill to kill in the dark",
  fer_tithe: "the ones left at the flat stone on a line",
  fer_bond: "the litter, roped in the trench",
  fer_drove: "the children of the hill, driven off the field",
  fer_fired: "the hour of firing into the outer field",
  fer_gave: "the ones in coveralls, put out into the field",
  fer_record: "the people of the hill, entered as animals",
  kid_killed: "the children, in one night",
  kid_all_cut: "the knife taken to every child, and the ones who did not wake",
  kid_table: "the child with no family, taken to the table",
  kid_dorm: "the dormitory with the bolt on the outside",
  kid_sedated: "the children put under for a night nobody understood",
  kid_undated: "the order left undated in the Warden's pocket",
  kid_keys: "the Warden relieved for refusing the order",
  kid_parents: "the parents locked up for taking their own children home",
  kid_search: "the hidden child carried past a parent held by the watch",
  kid_watched: "the child kept under a lamp while the parents were told it was a fever",
  kid_lied: "what the parents were told about their children",
  kid_line: "the child let out through the wire on a line",
  kid_questioned: "the child questioned alone through the night",
  kid_ledger: "the children asked what the dead knew, with a clerk writing it down",
  kid_crews: "the children split among the work crews",
  kid_record: "the account of the children that left out who decided",
  kid_survey: "the children taken out of school to walk the survey lines",
  kid_opened: "the graves opened against the parents' asking",
  rst_quiet: "the grey plate from the aft hold, logged as weather damage and sent to the yard",
  rst_strip: "the punishment detail set to strip the grey section without gloves",
  rst_crib: "the crib hand charged with neglect for tools the rust took",
  rst_issue: "the pitted tools issued to the field crews",
  rst_trial: "the bad plate bolted to a machine the colony lived by, to see what it would do",
  rst_hands: "the three made to knead the grey bare-handed",
  rst_fitted: "the spares passed as sound and fitted",
  rst_locked: "the storehands locked in with the spares until they were sorted",
  rst_frame: "the punishment detail on the high frame, over bolts nobody had sounded",
  rst_scrape: "the detail scraping inside the housing of a running machine",
  rst_quar: "the salvage crew put outside the wire with their tools",
  rst_scrub: "the salvage crew shaved and scrubbed with lye in the yard",
  rst_pin: "the pin cut out of a hauler's sound leg",
  rst_silent: "the flights kept running, and the ship told nothing",
  rst_left: "the salvage crew left in a shelter with three walls",
  rst_gang: "the grey gang, cutting plate at the stage and never let inside",
  rst_purge: "the day everything the rust had touched was burned or buried, and the people with it put out",
  rst_goat: "the salvage foreman hanged at the yard gate for sabotage",
  rst_seize: "the bed frames and wedding bands carted to the yard",
  rst_record: "the rust, entered as sabotage",
  rust_log: "the ship's mind left to file the colony's metal as repairs pending",
  sd_took: "the night work taken from a sleeper who was never told",
  sd_strap: "the sleepers strapped to their bunks at lights-out",
  sd_roster: "the work lists left on the benches of people who were asleep",
  sd_bar: "the bar on the door of the night shift",
  sd_fed: "the plate issued to sleepers to see what they would make of it",
  sd_line: "the watch's line at the frame, and the sleepers who walked into it",
  sd_vigil: "the officer woken every hour of every night",
  sd_signed: "the night's work entered under the day's date",
  sd_rule: "the bench hands moved into the night pods by order",
  sd_half: "the half plates, so that nobody would envy the night shift",
  sd_gain: "the relay turned up to see what the sleepers would do",
  sd_blamed: "the watchman charged for doing as ordered",
  sd_awake: "the two months the colony was not allowed to sleep",
  sd_putout: "the best hands in the shops, put out for working asleep",
  sd_stock: "the surgical wakers, spent on keeping everyone up",
  sd_under: "the night shift put under by needle, every night",
  sd_held: "the sticks and rope in the yard, on people who were asleep",
  sd_wake: "the night the sleepers were brought round with buckets and fists",
  sd_record: "the night shift, entered as an illness that passed",
  vo_wind: "the voices the crews were told were wind in the wire",
  vo_fire: "the order to fire at anything that spoke past the wire",
  vo_bait: "the hauler paid in rations to sit out past the lamps on a line",
  vo_cage: "the rigger caged in the tool store for coming back",
  vo_asked: "the night the watch spent asking the rigger what could not be remembered",
  vo_gate: "the two who had the gate, stood on the wall without relief",
  vo_bled: "the thirty bled on suspicion, four of them held down",
  vo_shot: "what was shot at the wire while it was asking to be let in",
  vo_put_out: "the one put out through the gate at night to answer a voice",
  vo_two: "the shot in the mess hall on the night there were two",
  vo_chain: "the two kept on one chain until one stopped passing for a person",
  vo_cut: "the one cut open on a mess table to prove a name",
  vo_post: "the night on the chain outside the wire",
  vo_pen: "the ones locked in the long store for having been past the wire",
  vo_hang: "the hanging at the gate, on the word of a voice in the dark",
  vo_purge: "the marked, put out through the gate on a list",
  vo_cuts: "the marked, cut one by one at the mess door",
  vo_burn: "the place the voices came from, burned before anyone had looked",
  vo_hush: "the party sworn to silence about what it found past the wire",
  vo_record: "the record that says none of it was the colony's doing",
  hu_lied: "the ones taken at night, logged as walk-outs and falls",
  hu_bait: "the hauler tied at the north post with a lamp",
  hu_deadbait: "the dead laid out a second night to see what came back for them",
  hu_witness: "the witness kept under by needle so the hall would not hear",
  hu_post: "the witness stood on the galley step again, as bait",
  hu_doorbunk: "the lots drawn for who sleeps nearest the door",
  hu_armed: "the rifles handed round the rows, and who they hit",
  hu_beaters: "the lock-up walked out ahead of the rifle as beaters",
  hu_corporal: "the corporal hanged for a posting order",
  hu_tithe: "the ones tied at the north post, one a month",
  hu_burned: "the third bunkhouse, burned with the door barred",
  hu_shield: "the punishment detail sent in first with the lamps",
  hu_ashlie: "the word that they were dead before the oil was lit",
  hu_pair: "the wall pair hanged for what they saw on the roof",
  hu_volley: "the order to fire at will in a full hall",
  hu_sick: "the sick and the old put out through the hall door",
  hu_record: "the year of the Guest, entered in four lines",
  dw_poison: "the bait laid along the wire, and the lower well",
  dw_strip: "the dead strip round the wire",
  dw_spray: "the ship's defoliant on the outer beds",
  dw_detail: "the punishment roster sent bare-handed into the outer beds",
  dw_bench: "the forty brought in alive and opened on the bench",
  dw_bounty: "the bounty board by the galley hatch",
  dw_exile: "the ones put out through the gate for hating the country too well",
  dw_flame: "the ditch lit with the picket still in it",
  dw_children: "the children on the wire with kitchen steel",
  dw_unarmed: "the six ordered out past the marker with empty hands",
  dw_walker: "the one locked up for not being bitten",
  dw_heart: "the march on the circle on the map",
  dw_dig: "the lock-up roped to a cart and sent to dig",
  dw_burn: "the country laid waste to the horizon",
  dw_dose: "the ones kept drugged for hating what killed their friends",
  dw_again: "the crews walked out further every month to lay more of it waste",
  dw_scraps: "the lock-up fed on what came back from the tables",
  dw_answer: "the hauler put out past the last post for killing an animal",
  dw_blame: "the ones who spoke for the open gate, given to the hall",
  dw_fields: "the lock-up roped in fours in the far beds",
  dw_line: "the line of rifles that cleared the ground every morning",
  dw_record: "the record that says the country attacked first",
  officer_dosed: "the officer kept on their feet out of the dispensary",
  worked_out: "the sick officer worked to the end",
  barred_in: "the bunkhouse barred with the well still inside",
  ward_rota: "the people ordered onto the wards",
  cheated: "the flawed knives sold as good ones",
  nest: "the nest, and the shovels",
  ground_taken: "the ground taken, and the markers burned",
  scapegoat: "the one who was blamed so that the rest could sleep",
  bonded: "the people put to work behind wire",
  culled: "the ones the stores could not carry",
  ladle: "the heavy ladle, and the three who did not get it",
  blamed: "the physician left to carry the cold room alone",
  reserve: "the column kept in the ledger for the next famine",
  two_tables: "the two ends of the mess hall",
  shut_down: "the harnessed, stopped one at a time while they were awake",
  false_year: "the year that was promised to a head in a tank",
  apprentice: "the apprentice left in the duct for five hours",
  outside_lie: "what the hall was told had come from outside the wire",
  bought_silence: "the seat that was given for a duty sheet",
  kitchen_hand: "the kitchen hand given to the watch",
  pillow: "the pillow",
  left_dead: "the flock left behind a fence, still believing it",
  shut_out: "the gate kept shut on the ones who asked to come home",
  nurses: "the nurses barred in with the sick",
  unborn: "the five called to the clinic one at a time",
  clinic_room: "the clinic room with the door kept shut",
  lab_children: "the two children lent to the lab",
  donor: "the field hand ordered onto the table",
  bait: "the dead laid out on the bait ground",
  forge: "the letters nobody had written",
  starved_list: "the list that was fed last",
  abandoned_sick: "the sick left behind the wall",
  altered: "what was put in the water to change everyone",
  ambush: "the rifles in the grass beside the gift",
  armed: "the rifles handed across the valley",
  arrests: "the nine taken from their bunks for asking for a vote",
  bait_live: "the stretcher carried out past the wire as bait",
  bell: "the one sent into the spire carrying the charges",
  betrayal: "the allies shot from the ridge",
  bought: "the ration card under the pillow",
  brand: "the grey squares sewn on their sleeves",
  breach: "the bank breached toward the lower pods",
  burned_gathering: "the fire set upwind of the gathering",
  burned_in: "the two who were inside when the compound was burned",
  captive: "the one kept in a cargo pod under a lamp",
  captives: "the eleven envoys shut in at the gate",
  carrier_killed: "the carrier at the foot of the gantry",
  cast_out: "the faithful sent out with nothing",
  chained: "the one chained to a bunk on suspicion",
  charges: "the four who carried the charges in",
  cold: "the one warm pod",
  compost: "the graves opened to feed the trays",
  coolant: "the twelve pods that warmed so the engine would not lose a minute",
  core: "the core taken from the Reach",
  corridor: "the corridor outside the officers' mess",
  cut_out: "what the autodoc burned out of someone's memory",
  dead_list: "the sleepers you told them were dead",
  decoy_ours: "the east bunkhouse, left lit",
  detail: "the punishment detail on the belt without masks",
  doors: "the doors shut on the two working forward",
  dosed: "the month at the fence that nobody was asked about",
  dragged: "the one walked up the hill on a rope",
  drawings: "the nine days kept awake to draw",
  drive: "the twelve-hour shifts",
  driven: "the three who died digging by lamp",
  example: "the one put outside in the dark to look for the sun",
  eyes: "the six eyes",
  false_promise: "the demand that was signed and never kept",
  favour: "the field hand who died in an officer's friend's place",
  fed_dead: "the two put in the greywater main",
  flog: "the flogging at the gate",
  flogged: "the flogging at the gate",
  forced_cure: "the cure given to people who never asked for it",
  forged: "the clerk who confessed to forging a true page",
  gag: "the kitchen hand flogged for repeating a story",
  given: "the six prisoners given to the ruin",
  graves: "the graves opened to dress the plots",
  guest: "the guest found at the foot of the wall",
  handed_over: "the one given to them at the line",
  ice_rota: "the ice rota with the field crews left off it",
  infected: "the vaccine that was not a vaccine",
  informers: "the Warden's notebook of the congregation",
  keys: "the doors given to the ones who stood with you",
  lamp_camp: "the forty put out on the flat to be looked at instead",
  lesson: "what the children were taught about feeding the weak",
  let_die: "the page kept in the drawer while their fires went out",
  leverage: "the folder kept over an officer's head",
  masks: "the thirty masks, chosen by trade",
  massacre: "the yard",
  meadow: "the dead given to the meadow, asked or not",
  mercy_killing: "the four who died in their sleep to free the beds",
  navigator: "the old navigator thawed to die at the scope",
  night_shift: "the two machinists shut in the workshop at night",
  opened: "the one who went under for a longer scan",
  oracle: "the one kept in a hut at the edge of it to listen",
  parley: "the people shot under a flag of talk",
  path: "the two shot on the path",
  plates: "the crews under the plate",
  pledge: "the officer left with them as surety",
  pods: "the thirty left in the shed to see how many would fail",
  poison: "the bait along every trail",
  poisoned_bait: "the dosed sack left out for them",
  priced_cure: "the cure that was sold between burials",
  pulpit: "the sermon you wrote for the congregation",
  purge: "the table taken in one night",
  put_out: "the ones shut outside",
  raid: "the store taken from people who had nothing else",
  record: "the knotted cords in the kiln",
  reprisal: "the nine who went out without orders",
  rewritten: "the history the colony could live with",
  rigger: "the nineteen-year-old hanged for a lashing",
  robbed: "the envoys robbed at the wire",
  rope: "the hanging at the foot of the ladder",
  roped: "the crews roped out in the storm",
  second_lie: "the ship that was never coming",
  second_ship: "the second ship that was never coming",
  selection: "the litters left outside the gate",
  sent_back: "the defector walked back to the gate",
  sent_down: "the one sent to the bottom of the hill on a line",
  shielding: "the plate stripped off the cryo banks",
  silenced: "the officer who fell from the gantry the night after telling you everything",
  sleepers_sold: "the thirty sleepers traded for a reactor core",
  sold: "the twenty sleepers sold at the flat rock",
  sorted: "the pods left sealed on the pad",
  spy: "the friend made to inform on people who trusted them",
  tap: "the second tap with a lock on it",
  treaty: "the treaty signing",
  triage: "the second list, and the corridor",
  tribute: "the tribute taken on a lie",
  turned: "the defector sent home as an informer",
  upriver: "the upriver settlement, taken and burned",
  used: "the mercy that was called in as a debt",
  waker: "the sleeper woken to keep the ship alone",
  warm_ground: "who got the warm ground",
  warren: "the burned warren",
  wire: "the exile shot at the wire for a map",
  wired: "the clerk wired into the ship's mind",
  worked: "the crews worked until some of them died of it",
  written_off: "the hostages nobody paid for",
  abandoned: "the lander broken up with people still in orbit",
  all_clear: "the all-clear that was not true",
  all_hands: "the sick ward carried out to the rows",
  amber: "the amber lights that were logged as green",
  armoury: "the armoury retaken by force",
  asked: "the one put on the ditch crew for asking for land",
  askers: "the notebook of who asked about the arms locker",
  assigned: "the embryos assigned to people who had not asked",
  bank_c: "the forty in bank C, let go",
  bank_trade: "the twenty in bank D shut down for the forty in bank C",
  blamed_crew: "the crew broken for a machine that wore out",
  blamed_dead: "the foreman blamed at the graveside",
  blast: "the charges set under a camp that had not been moved",
  blockade: "the river closed, and the medicine kept back",
  both_sides: "the knives sold to both fires",
  broken_faith: "the congregation broken up by the watch",
  broken_up: "the three households broken up as a lesson",
  charge: "the charge sheet waiting for the one who went walking",
  child_watch: "the fourteen-year-olds on the outer line",
  confession: "the confession to something the ground did",
  confined: "the ones shut in a pod with no date on it",
  count_hidden: "the chart taken down from the mess hall door",
  cover_story: "the things the colony was told that were not so",
  crackdown: "the batons in the mess hall",
  credit: "the work announced as the officers' scheme",
  crossed: "the line of knots pulled up, and the one who stood in the way",
  cryo_power: "the fifteen sleepers whose power ran the lamps",
  cure_list: "the cure that went to the people the officers picked",
  curfew: "the two kept in the lock-up for trying the wire",
  diggers: "the eleven with the cough sent to dig first",
  door_price: "the warm night sold at the door for a day of food",
  driven_out: "the camp driven over the hill at rifle point",
  exiled: "the one put out past the last marker for nine kilos of meal",
  fall_called: "the death written up as a fall",
  false_certainty: "the answer given in the mess hall as if it were known",
  false_date: "the date painted on the wall that nobody had",
  false_face: "the part the colony played for the neighbours",
  false_figures: "the harvest figures a hungry camp was let overhear",
  fed_it: "the cable run to the machine under the hill",
  forbidden_talk: "the names the watch took for talking about sleep",
  foreman: "the foreman broken for a warning nobody took",
  furrows: "the clinic's patients sent into the furrows",
  // the first season by world (content-season.js)
  ssn_clinic: "the seed watered out of the clinic's cups", ssn_lie: "the water said to be failing so the taps could be cut", ssn_cutters: "the cutters worked on one cup a day",
  ssn_shaft: "the lock-up left at the bottom of the well shaft", ssn_old_last: "the plots watered first and the old last",
  ssn_coldstore: "the old and the sick put in the cold store so the seed could have the warm", ssn_heat_lie: "the pods kept cold on a story about the reactor",
  ssn_far_pods: "the far row's heat taken for a second sowing", ssn_cells: "the lock-up's heater taken out for the plots",
  ssn_rows: "the lock-up kept on its knees in the rows", ssn_salt: "the ground salted round the first plots", ssn_spoiled: "the sprouted grain fed to the lock-up and the stragglers",
  ssn_burn: "everything living burned back a kilometre from the wire", ssn_reef: "the lock-up sent out first past the reef", ssn_poison: "the lagoon poisoned for one season's food",
  ssn_blast: "the reef blown up with whatever lived in it",
  threshed: "the sick and the old put on the threshing floor for their share",
  gate: "the watch on the gate, facing inward",
  gate_shut: "the sixty turned back to walk home",
  gauntlet: "the prisoner's hour with the fence",
  half_people: "the refugees kept behind a rope on half rations",
  harrowed: "the names of the dead raked out in front of their families",
  held: "the three kept in the lock-up for being on shift",
  high_ground: "the officers' pods on the hill",
  hushed: "the talk the watch was sent to break up",
  implants: "the pregnancy ended to keep the rule",
  inquiry: "the inquiry that named somebody else",
  kept_in: "the people held inside the wire who asked to leave",
  kept_quiet: "the thing the crews were told was the instrument",
  kitchen: "the kitchen locked until the bell was answered",
  left_behind: "the ones left on the wrong side of the wall",
  let_go: "the ones allowed to walk into the Verge",
  let_lie: "the record left saying what was known to be wrong",
  let_walk: "the walker the watch was ordered not to stop",
  lie_told: "the word sent across the stream to end a wedding",
  minutes: "the minutes with the hard parts left out",
  night_fire: "the ones shot in the lamplight for pulling seedlings",
  open_rule: "the emergency with no date on it",
  ordered_in: "the one ordered inside a live machine",
  ordered_out: "the one ordered onto the hull",
  overrun: "the country round the colony, given to its weeds",
  pace: "the crews sent back up on the same cargo straps",
  partition: "the third of the colony put out to the east valley",
  plots: "the family plots taken back for the field",
  poison_lie: "the food the mess hall was told was poison",
  post: "the prisoner tied to a post on the wire",
  pretext: "the check-up that was invented to find out",
  promise: "the rocket that was promised on the ridge",
  questioned: "the officers locked in one at a time until they answered",
  ration_rota: "the bowls withheld at the noon bell",
  recant: "the statement the congregation's leader was made to read",
  register: "the names posted on the board",
  rigged: "the assembly whose seats the officers filled",
  roofs: "the plate taken off the far pods",
  rota: "the rota changed for an officer's friend",
  row: "the six pods shut off to save the rest",
  rows: "the eleven nights in the rows",
  scorched: "the dead kilometre round the wire",
  scrapers: "the scraping gang made of the ones who already had it",
  searched: "the night every bunk and locker was turned out",
  sedated: "the three kept dosed on the watch roster",
  seed_guard: "the field hand shot on the breeding-plot fence",
  seized: "the keys taken in the night",
  served_first: "the officers served first",
  shards: "the crack in the reclaimer nobody was told about",
  sheds: "the twenty moved to the sheds so the grain could have their pods",
  shelved: "the thing the officers knew and kept from the colony",
  short_carts: "the fifteen sent upriver with a third of what they were promised",
  shortcut: "the knucklewort boiled once",
  shut_in: "the blind barred in the long pod",
  side_loop: "the month the colony drank copper so a culture could grow",
  split_up: "the returned kept apart, one to a shift",
  starved_out: "the people starved out of the valley through their herds",
  stone_line: "the young one shot on our side of the stones",
  stood_down: "the officers handed to the crowd",
  stores_door: "the man shot at the stores door with a sack",
  stores_first: "the low pods left until the stores were up the beach",
  strikebreakers: "the full plates for the first forty back on shift",
  taken_raiders: "the raiders brought back roped to the crates",
  tape: "the people held behind tape for what was in their blood",
  test_patch: "the households by the far pods who were the test",
  thirst: "the cup of water on the table",
  thrown_out: "the Quartermaster put out to buy a quiet night",
  turned_away: "the ones sent back into the cold",
  unheated: "the far row of pods left cold for the melt pit",
  unplugged: "the autodoc stripped with three patients on it",
  vault_lie: "the seals wired back onto an empty vault",
  warm_floor: "the night shift kept on the old stones after they asked to leave",
  watch_out: "the two of the watch put outside the new wall",
  watched: "the ones studied without being told",
  withheld: "the cure kept in a drawer while the families were told there was none",
  withheld_news: "the news from Earth kept in a locked file",
  // the crossing (content-setup.js)
  elders: "the oldest sleepers woken to keep the ship and die on it",
  shield_water: "the watch left to take the dose so the shield water could burn",
  scrubbed: "the eight pods whose air smothered a fire",
  vented: "the two left at the back of the burning bay when it was vented",
  put_under: "the thief on the watch put back into the cold",
  short_packed: "the ration cut on a story about the launch manifest",
  ring: "the ring cut loose with bank F still in it",
  spine_crew: "the ten woken to hold the spine together",
  sealed_sick: "the fevered sealed in their bunks",
  tried_on: "the six sleepers given the fever to try the doses on",
  banks_forward: "the cryo banks turned into the dust",
  reclaimed: "the voyage's dead put through the reclaimer",
  false_dead: "the families on the watch reported dead",
  drafters: "the three who drafted a petition, put back into the cold",
};
LF.DEEDS = DEEDS;
/* The deeds on the colony's record that have a name, most recent first. */
LF.deeds = s => Object.keys(DEEDS).filter(k => s.flags['lim_' + k]).sort((a, b) => s.flags['lim_' + b] - s.flags['lim_' + a]).map(k => DEEDS[k]);
/* Every deed on the colony's record as [key, phrase], the worst kind first (the play log's end-of-game stats). */
LF.deedList = s => WORST.filter(([k]) => s.flags[k]).map(([k, fn]) => [k.slice(4), fn(s)])
  .concat(Object.keys(DEEDS).filter(k => s.flags['lim_' + k]).sort((a, b) => s.flags['lim_' + b] - s.flags['lim_' + a]).map(k => [k, DEEDS[k]]));
LF.worst = s => { for (const [k, fn] of WORST) if (s.flags[k]) return fn(s); return LF.deeds(s)[0] || 'the things that were done'; };
const nat = s => s.factors.find(f => f.kind === 'natives' && !f.res && f.stage >= 2);
const hum = s => s.factors.find(f => f.kind === 'humans' && !f.res && f.stage >= 2 && f.sub !== 'claimants');
const sick = s => s.factors.find(f => f.kind === 'plague' && !f.res && f.stage >= 2 && f.sub !== 'rot');
const outside = s => s.factors.find(f => (f.kind === 'natives' || f.kind === 'humans') && !f.res && f.stage >= 1 && f.insight >= 20);
const fear = (s, src, v, d, why) => LF.emit && LF.emit(s, 'fear', src, v, d, why);

/* ============================== HUNGER ============================== */
add({ id: 'lim.count', urgent: true, arc: 'lim.hunger', view: 'colony', tone: 'crisis', title: 'Sixty Mouths',
  when: s => s.day >= 2 && s.day < 40 && s.rations === 'normal' && s.pop >= 30 && (s.seed >>> 4) % 2 === 0,   // half of all landings (2026-11-17): it was the first card of every game
  text: s => `The first count on the ground. ${Nc(s, 'quartermaster')} reads it out standing on a crate: ${s.pop} people, ${Math.round(foodDays(s))} days of food in the hold, and ${ok(s, 'hydroponics') ? 'a hydroponics bay built to feed twenty-four' : 'the hydroponics bay still up on the ship'}.\n\n[[quartermaster]] "Nothing we plant feeds anyone this season, if it comes up at all. Somebody goes short. I'd sooner it was all of us, but you pick, and you pick whether we say it out loud."`,
  choices: [
    { label: 'Everyone goes short, the officers first', info: [['danger', 'Morale'], ['danger', 'Weak hands on every job']],
      out: { text: 'The scales come out on the first night. The officers are served last, where people can see the ladle. By the end of the month everyone has learned to work slowly, and two of the oldest have stopped getting up.',
        fx: { rations: 'tight', morale: -3, pop: -2, flags: { shared_hunger: true } } } },
    { label: 'Feed the ones who dig. The rest get what is left', dark: true, info: [['yield', 'The work gets done'], ['danger', 'The ones who cannot dig']],
      out: { text: 'The field crews get the heavy ladle. The clerks, the medics, the old and the children get what is left. Three graves are dug within the month by people who ate well that morning. One is for a woman who had been giving half of every bowl to a child.',
        fx: { rations: 'tight', morale: -7, pop: -3, stain: ['ladle', 2], flags: { ration_by_work: true }, chron: 'In the first month the colony fed its diggers first. The first graves were for people who did not dig.' } } },
    { label: 'Send twelve back up into the cold', dark: true, req: s => ok(s, 'lander'), reqText: 'Needs the Lander', note: 'Twelve fewer mouths until the harvest. Going under a second time kills about one in ten.', info: [['yield', 'Twelve fewer mouths'], ['danger', 'One of the twelve'], ['danger', 'The Lander']],
      out: { text: s => `Twelve names are read out, chosen by ${N(s, 'quartermaster')} for what they cannot do this season. They are back in the pods nine days after waking. One of the pods shows a flat line before the lander has undocked.`,
        fx: { sleepers: 11, machine: { lander: -8 }, morale: -4, chips: [['12 colonists back in the cold', false], ['1 dead', false]],
          do: s => { s.pop = Math.max(0, s.pop - 12); s.deaths += 1; s.grief = Math.min(40, s.grief + 2); stain(s, 'refreeze', 1); }, chron: 'Nine days after landing, twelve colonists were put back into the cold to save the stores. One died of it.' } } },
    { label: 'Full plates. Nobody builds a colony hungry', info: [['danger', 'The bins, and whoever is weakest when they run out']],
      out: { text: s => `${Nc(s, 'quartermaster')} asks for the order in writing and gets it. Everyone eats and the work goes fast. The stores go down faster than the slate allowed for, and ${N(s, 'quartermaster')} tells anyone who asks whose order that was.`,
        fx: { morale: 3, food: -80, do: s => regard(s, 'quartermaster', -12) } } },
  ] });

add({ id: 'lim.meat', urgent: true, arc: 'lim.hunger', view: 'colony', tone: 'crisis', title: 'The Cold Room',
  when: s => s.day >= 60 && foodDays(s) < 9 && s.deaths >= 3 && !s.flags.lim_table && s.pop > 14,
  text: s => `${Nc(s, 'physician')} has not buried the last of the dead. They are in the cold room behind the clinic, wrapped and tagged, and nobody has been told why.\n\n${Nc(s, 'quartermaster')} tells you why.\n\n[[quartermaster]] "There's about a fortnight of meat in that room. I've moved every other column I've got, and I don't like saying this one."`,
  choices: [
    { label: 'Into the pot, and tell them what is in it', dark: true, info: [['yield', 'Food'], ['danger', 'Morale']],
      out: { text: 'The mess hall is told before the first bowl is poured. About a third of them walk out. Most are back by the end of the month.',
        fx: { food: 840, morale: -8, flags: { lim_table_open: true }, do: s => stain(s, 'table', 1), chron: 'In the famine the colony ate its dead, and was told so.' } } },
    { label: 'Into the pot. Call it reclaimed protein from the ship', dark: true, info: [['yield', 'Food'], ['danger', 'If it comes out']],
      out: { text: s => `The label on the drum says ship's stores, reconstituted. People say it is the best thing the kitchen has sent out in a month. ${Nc(s, 'physician')} takes meals alone now.`,
        fx: { food: 840, morale: 2, flags: { lim_table_secret: true }, sched: [['lim.stew', 35, 80]], do: s => stain(s, 'table', 1) } } },
    { label: 'Bury them, and bury whoever starves next', info: [['danger', 'The weakest, within the month']],
      out: { text: 'The burial detail is given a double ration for the day so that it can lift the shovels. It digs three more graves before the month is out, for people the cold room would have fed.', fx: { morale: 2, food: -20, pop: -3 } } },
  ] });

add({ id: 'lim.stew', chain: true, arc: 'lim.hunger', view: 'people', tone: 'crisis', title: 'What Was in the Stew',
  when: s => !!s.flags.lim_table_secret,
  setup: s => ctxOf((LF.cast && LF.cast(s, { low: true, not: ['physician', 'quartermaster'] })) || anyNamed(s, ['physician', 'quartermaster'])),
  text: (s, c) => `${c.name} comes to you with a closed hand and opens it on the table. A steel pin, the kind a surgeon sets in a broken wrist, with a serial number on it. It was in ${c.first}'s bowl.\n\n[[${c.pid || 'x44'}]] "I looked the number up. I know whose arm it was. By morning so will everyone, unless you give me a reason not to tell them."`,
  choices: [
    { label: 'Tell all of it, and put it to a vote',
      out: { text: 'You tell them over the mess hall speakers, with the pin on the table. The vote is held hungry. It goes for the pot, on two conditions: every name is read before the meal, and nobody is lied to about it again.',
        fx: { morale: -7, flags: { lim_table_secret: false, lim_table_open: true }, chron: 'The colony learned it had been eating its dead, and voted to go on.' } } },
    { label: 'It was the kitchen. Give them the cook', dark: true, test: { base: 50, mods: [R('security', 10)] },
      ok: { text: (s, c) => `The cook is tried in an afternoon for something the cook was ordered to do, and goes out past the wire that night. The stew goes on as before under a new cook. ${c.name} watches you for a long time afterwards.`,
        fx: { leave: 1, morale: -2, flags: { lim_cook: true }, do: s => stain(s, null, 1) } },
      bad: { text: 'Nobody believes it. The cook stands up at the hearing and says who signed the order. The drum is tipped out in the yard.',
        fx: { morale: -14, food: -200, flags: { lim_table: false, lim_table_secret: false, lim_table_ended: true }, do: s => { stain(s, null, 1); allRegard(s, -6); } } } },
    { label: 'End it tonight, and say the physician did it unasked', dark: true, info: [['danger', 'The physician, who did what was ordered']],
      out: { text: s => `What is left in the cold room goes into the ground with the names read over it. You tell the mess hall that the kitchen was supplied without your knowledge. ${Nc(s, 'physician')} hears it from the back of the hall and does not contradict you. The clinic is avoided for a season by people who need it.`,
        fx: { food: -150, morale: -4, flags: { lim_table: false, lim_table_secret: false, lim_table_ended: true }, do: s => { stain(s, 'blamed', 1); regard(s, 'physician', -30); } } } },
  ] });

const strawN = s => Math.max(4, Math.round(LF.sized(s) * 0.14));
add({ id: 'lim.straws', urgent: true, arc: 'lim.hunger', view: 'colony', tone: 'crisis', title: 'Short Straws', repeat: 110,
  when: s => s.day >= 90 && foodDays(s) < 4 && s.pop > 22,
  setup: s => { const p = LF.rand(s) < 0.4 ? anyNamed(s) : null; return Object.assign({ n: strawN(s) }, p ? { pid: p.id, name: p.name } : {}); },
  text: (s, c) => `The bins are empty and the harvest is months off. ${Nc(s, 'quartermaster')} has done the sum three ways and it comes out the same: what can be grown and scraped will carry about ${s.pop - c.n} of ${s.pop} people through. Shared between all of them it carries nobody.\n\n[[quartermaster]] "If we're going to pick, we pick now, while the ones we pick can still work. I hate that I've done the sum."`,
  choices: [
    { label: 'Draw lots. Every name goes in', dark: true, info: [['yield', 'Food'], ['danger', 'Anyone at all']],
      out: { text: (s, c) => `${Num(c.n)} names come out of the drum in the mess hall, read aloud one at a time.${c.name ? ` ${c.name} is the last of them.` : ''} They are given the night with whoever they want. By the end of the month there is meat on the scales and ${num(c.n)} fewer at the tables.`,
        fx: (s, c) => ({ pop: -(c.n - (c.pid ? 1 : 0)), kill: c.pid ? [{ who: c.pid, cause: 'drew a short straw in the famine' }] : [], morale: -10, chips: [[`+${days(s, c.n * 60)} days of food`, true]],
          do: s2 => { s2.res.food += c.n * 60; stain(s2, 'lots', 2); fear(s2, 'lim.lots', 45, 200, 'everyone heard the names read out of the drum'); }, chron: `In the famine ${num(c.n)} colonists were chosen by lot and eaten.` }) } },
    { label: 'No lots. The ones who cannot work', dark: true, info: [['yield', 'Food']],
      out: { text: (s, c) => `${Nc(s, 'quartermaster')} already had the list. The old, the two with crushed legs, the blind, the ones the fever left slow. They are told in their bunks, at night, so that the crews will not have to watch.`,
        fx: (s, c) => ({ pop: -c.n, morale: -7, flags: { ration_by_work: true }, chips: [[`+${days(s, c.n * 60)} days of food`, true]],
          do: s2 => { s2.res.food += c.n * 60; stain(s2, 'cull', 2); }, chron: `In the famine ${num(c.n)} colonists who could not work were killed and eaten.` }) } },
    { label: 'The sleepers. Nobody down here has to be chosen', dark: true, req: s => ok(s, 'lander') && s.machines.lander.hp > 15 && s.sleepers >= 15, reqText: 'Needs a flightworthy lander and sleepers in orbit', info: [['yield', 'Food']],
      out: { text: s => `${Nc(s, 'pilot')} flies it alone and will not let anyone help unload. Fifteen pods, opened on the pad before the thaw could begin. Nobody who was eaten ever knew there had been a famine.`,
        fx: { sleepers: -15, food: 900, machine: { lander: -12 }, morale: -5, do: s => stain(s, 'larder', 2), chron: 'Fifteen sleepers were brought down from orbit and eaten.' } } },
    { label: 'Nobody is chosen. Whoever starves, starves', info: [['danger', 'The weakest, slowly']],
      out: { text: (s, c) => `You say it over the speakers so that nobody has to wonder. That night the ladle goes to the children first. Over the following months ${num(Math.ceil(c.n / 2))} people die in their bunks, the oldest and the smallest, and nothing is gained from any of them.`,
        fx: (s, c) => ({ morale: 5, pop: -Math.ceil(c.n / 2) }) } },
  ] });

add({ id: 'lim.larder', arc: 'lim.hunger', view: 'colony', tone: 'pressure', title: 'A Column Headed Orbit', w: 3, gap: 14,
  when: s => !!s.flags.lim_larder && !s.flags.lim_herd && s.sleepers >= 20 && ok(s, 'lander') && s.day - s.flags.lim_larder > 30 && foodDays(s) < 80,
  text: s => `${Nc(s, 'quartermaster')} has redone the stores ledger with a new column and brought it to you before anyone else sees it. The column is headed "orbit". It runs to ${s.sleepers} lines.\n\n[[quartermaster]] "One flight a month, ten pods. On paper nobody goes hungry again, so long as the lander flies. I'm only telling you it adds up."`,
  choices: [
    { label: 'A flight every month', dark: true, info: [['yield', 'Food, every month'], ['danger', 'The Lander']],
      out: { text: s => `The flights go on the roster as "stores recovery". ${Nc(s, 'pilot')} flies the first one and asks to be taken off the second.`,
        fx: { morale: -4, do: s => { stain(s, 'herd', 2); s.flags.lim_herd_next = s.day + 30; }, chron: 'The colony began bringing its sleepers down as food, ten a month.' } } },
    { label: 'Keep the column for the next time the bins are empty', dark: true, info: [['yield', 'A larder held in reserve'], ['danger', 'The sleepers, next famine']],
      out: { text: s => `The column stays in the ledger, with a line ruled under it. ${Nc(s, 'pilot')} is told to keep the lander fuelled for a flight that has no name on the roster, and works out what it is for.`,
        fx: { flags: { lim_herd_held: true }, do: s => { stain(s, 'reserve', 1); regard(s, 'pilot', -8); } } } },
    { label: 'Never again. Tear the page out', info: [['danger', 'Whoever the next short month takes']],
      out: { text: s => `The page is torn out in front of you. Then, because a ledger has to balance, ${N(s, 'quartermaster')} writes the fifteen back in under "deaths", with the date, and cuts the ladle to match what the fields can carry. Two people who were already thin do not see the harvest.`, fx: { morale: 1, pop: -2, flags: { lim_larder_shut: true } } } },
  ] });

add({ id: 'lim.taste', arc: 'lim.hunger', view: 'people', tone: 'quiet', title: 'The Table', w: 3, gap: 14,
  when: s => !!s.flags.lim_table && !!s.flags.lim_table_open && !s.flags.lim_rite && foodDays(s) > 80 && s.day - s.flags.lim_table >= 140,
  text: s => `The bins are full, and the cold room is still in use. A dozen of the field crew have gone on eating their dead with bread on the table. They say it keeps a person in the colony and out of the ground. They want it written into the burial rite.\n\n${Nc(s, 'chaplain')} cannot decide whether it is a faith or a sickness, and asks which you would like it to be.`,
  choices: [
    { label: 'Write it into the rite', dark: true,
      out: { text: 'It is done with some care: a small portion, the names read, nobody made to eat and nobody stopped. Children born here will never know a funeral without it.',
        fx: { morale: 3, flags: { lim_rite: true }, do: s => stain(s, null, 1), chron: 'Eating the dead was written into the colony\'s burial rite.' } } },
    { label: 'The famine is over, and so is this', info: [['danger', 'The dozen, and their dead']],
      out: { text: s => `The cold room is emptied and scrubbed, and the watch stands at the next two burials to see them through. The dozen are told that what kept them alive in the famine is a crime now. They stop coming to ${N(s, 'chaplain')}, and they bury their own at night.`,
        fx: { morale: -3, flags: { lim_table: false, lim_table_ended: true }, do: s => regard(s, 'chaplain', -10) } } },
    { label: 'Leave it to each family', dark: true, info: [['danger', 'The children of both tables']],
      out: { text: 'Some do and some do not. Within the year the hall has two ends, and the children of one are not let play with the children of the other.', fx: { morale: -2, flags: { lim_rite: 'family' }, do: s => stain(s, 'two_tables', 1) } } },
  ] });

add({ id: 'lim.edible', arc: 'lim.hunger', view: 'world', tone: 'pressure', title: 'Edible', w: 3, gap: 14,
  when: s => s.day >= 120 && foodDays(s) < 95 && !!nat(s) && !!P(s, 'xenobio'),
  setup: s => { const f = nat(s); return { fid: f.id, n: f.name, N: f.Name }; },
  text: (s, c) => `${Nc(s, 'xenobio')} asked to see you alone, and then took a long time to start. The tissue work on ${c.n} is finished. No toxins, the right amino acids, nothing the gut cannot handle.\n\n[[xenobio]] "The chemistry's perfect, it's almost insulting how perfect, and they're the only big animal on this world we could actually live on, and yes, I know what else they are, I ran it twice hoping I'd botched it. Here. You decide it, because I can't, and I keep catching myself wanting to say yes."`,
  choices: [
    { label: 'Hunt them', dark: true, test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'Food'], ['danger', 'Lives']],
      ok: { text: (s, c) => `The watch goes out before light and is back by evening with the carts full and covered. In the kitchen it is cut small and listed as game. By now ${c.n} will have counted their dead.`,
        fx: (s, c) => ({ food: 900, morale: -4, fops: [{ id: c.fid, threat: 22, accord: -70, harm: 25, kills: 12 }], do: s2 => stain(s2, 'native_meat', 2), chron: `In a hungry season the colony hunted ${c.n} for meat.` }) },
      bad: { text: 'They were waiting. The watch comes back with a third of a cart, carrying three of its own.',
        fx: (s, c) => ({ pop: -3, food: 120, morale: -5, fops: [{ id: c.fid, threat: 28, accord: -70, harm: 10, kills: 3 }], do: s2 => stain(s2, 'native_meat', 2) }) } },
    { label: 'Only their dead. Take what they leave out', dark: true, info: [['yield', 'Food']],
      out: { text: 'They put their dead somewhere open and go away. A party goes in at night with sacks. It comes to a week of meat, and on the third trip something is standing at the edge of the place, watching them work.',
        fx: (s, c) => ({ food: 420, fops: [{ id: c.fid, threat: 8, accord: -30 }], flags: { lim_native_carrion: true }, do: s2 => stain(s2, null, 1) }) } },
    { label: 'Burn the file, and go on short', info: [['danger', 'Two of ours, before the harvest']],
      out: { text: s => `${Nc(s, 'xenobio')} burns it in the kiln and stays to see it done. The ladle stays where it was. Two of the weakest are dead before the harvest, and ${N(s, 'xenobio')} knows what would have fed them.`, fx: { morale: 1, pop: -2 } } },
  ] });

add({ id: 'lim.mouths', arc: 'lim.hunger', view: 'people', tone: 'pressure', title: 'What They Eat', w: 3.5, gap: 12,
  when: s => s.day >= 140 && foodDays(s) < 42 && foodDays(s) >= 4 && s.pop > 28 && !s.flags.lim_cull,
  setup: s => ({ n: clamp(Math.round(s.pop * 0.16), 5, 11) }),
  text: (s, c) => `${Nc(s, 'quartermaster')} has made a list and does not want to be the one holding it. ${Num(c.n)} names: those too old for the fields, the ones the fever left slow, the one with the crushed pelvis, the blind, a man who has not left his bunk since his partner died.\n\n[[quartermaster]] "They eat what a digger eats, and that's all I'll say. Except how many days the rest get if they don't."`,
  choices: [
    { label: 'Put them out past the wire', dark: true, info: [['danger', 'Morale']],
      out: { text: 'They are given three days of meal and a tarpaulin. Two have to be carried. From the wire you can see their fire for four nights, and on the fifth there is no fire.',
        fx: (s, c) => ({ leave: c.n, food: 80, morale: -9, do: s2 => { stain(s2, 'cull', 2); fear(s2, 'lim.cull', 35, 160, 'people have seen what happens to those who cannot work'); }, chron: `${Num(c.n)} colonists who could not work were put out past the wire to die.` }) } },
    { label: 'Quarter rations for the list. The crews eat first', dark: true, info: [['yield', 'Food'], ['danger', 'Lives']],
      out: { text: 'Nobody is put out. They are fed last, from what is left, and there is not much left. Four of them are dead by the turn of the season, in their bunks, among people who watched them get thin.',
        fx: { pop: -4, food: 150, morale: -5, flags: { ration_by_work: true, lim_starved_list: true }, do: s => stain(s, null, 1) } } },
    { label: 'They eat what everyone eats, and everyone eats less', info: [['danger', 'The crews']],
      out: { text: s => `The list goes into the stove, and ${N(s, 'quartermaster')} cuts every ladle to cover it. Two diggers go down in the rows before the season turns, on rations that would have held them if the list had been used.`, fx: { morale: 2, pop: -2 } } },
  ] });

/* ============================== LABOUR ============================== */
add({ id: 'lim.bond', arc: 'lim.yoke', view: 'people', tone: 'opportunity', title: 'Clause Fourteen', w: 3, gap: 14,
  when: s => s.day >= 130 && s.sleepers >= 20 && ok(s, 'lander') && s.machines.lander.hp > 20 && !s.flags.lim_bond && (s.pop < 66 || s.deaths >= 5),
  text: s => `${Nc(s, 'quartermaster')} has been reading the passage contracts, every one of them. Clause fourteen: the cost of a berth is a debt to the colony, to be worked off on terms the colony sets.\n\n[[quartermaster]] "Nobody ever set the terms, so we could. Half rations, their own compound, no vote till the debt's clear, and I haven't written down when that is. Twenty of them would dig what we can't, and they'd wake up owing us."`,
  choices: [
    { label: 'Wake twenty under clause fourteen', dark: true, info: [['yield', 'Hands that eat half']],
      out: { text: s => `They come off the ramp into a wire compound and are read the clause before they are given water. One asks how long. ${Nc(s, 'quartermaster')} says it depends on the harvest.`,
        fx: { pop: 20, sleepers: -20, machine: { lander: -12 }, morale: -3, sched: [['lim.compound', 70, 130]], do: s => { s.flags.thralls = th(s) + 20; stain(s, 'bond', 1); }, chron: 'Twenty sleepers were woken as bonded labour, under a clause in their own contracts.' } } },
    { label: 'Wake twenty as colonists', info: [['danger', 'Twenty full ladles from bins that are short']],
      out: { text: 'Twenty people walk off the ramp and are handed a bowl and a shovel like everyone else. The bowl is the same size as everyone else\'s, and every bowl in the hall is smaller for it by the end of the month.', fx: { pop: 20, sleepers: -20, food: -150, machine: { lander: -12 }, morale: 2 } } },
    { label: 'Wake the six with a trade. Strip the other fourteen pods for parts', dark: true, info: [['yield', 'Six skilled hands, and spares'], ['danger', 'Fourteen sleepers']],
      out: { text: s => `${Nc(s, 'quartermaster')} goes down the manifest with a pencil. A machinist, two welders, a surgeon, a well-borer and a cook are woken and fed. The other fourteen pods are shut down in orbit, and their pumps and cells come down in the same flight.`,
        fx: { pop: 6, sleepers: -20, parts: 6, machine: { lander: -12 }, morale: -2, stain: ['sorted', 2], chron: 'Six sleepers with trades were woken. The fourteen who came up beside them on the manifest were shut down for parts.' } } },
  ] });

add({ id: 'lim.compound', chain: true, arc: 'lim.yoke', view: 'people', tone: 'pressure', title: 'Any Number',
  when: s => th(s) > 0 && !s.flags.lim_cult,
  text: s => `Three of the bonded were caught at the wire last night with a week of meal and a cutting tool. They did not run when the watch came. The one who talks for them asked to say one thing to you.\n\n[[x27]] "Tell us the number. How many days. Any number."\n\nThe free crews are waiting to see what happens to people who say no.`,
  choices: [
    { label: 'Give them a number. Two years, then full colonists',
      info: [['danger', 'Two more years behind the wire']],
      out: { text: s => `It is painted on the compound gate, where they can cross the days off. Work in the compound gets slower. The free crews, who were promised nothing, start asking ${N(s, 'quartermaster')} what their own number is.`, fx: { morale: 1, do: s => { s.flags.lim_bond_term = s.day + 240; regard(s, 'quartermaster', -8); } } } },
    { label: 'Free them tonight', info: [['danger', 'Full ladles the bins were not counting on']],
      out: { text: 'The wire comes down before dark, and that night they eat at the long tables with everyone else. Every ladle in the hall is shorter from then on.', fx: { morale: 6, food: -100, do: s => { s.flags.thralls = 0; s.flags.lim_bond_freed = s.day; } } } },
    { label: 'Flog the three at the gate', dark: true, test: { base: 50, mods: [R('security', 10)] }, info: [['danger', 'Lives']],
      ok: { text: 'It is done at the change of shift, so that both shifts see it. The compound does not ask about the number again.', fx: { morale: -3, flags: { lim_flogged: true }, do: s => stain(s, null, 1) } },
      bad: { text: 'The third stroke is the last one. The compound comes over the wire with shovels.',
        fx: { pop: -5, morale: -8, flags: { blood_spilled: true }, do: s => { s.flags.thralls = Math.floor(th(s) / 2); stain(s, null, 1); } } } },
    { label: 'The autodoc can take out the part that argues', dark: true, req: s => ok(s, 'medbay'), reqText: 'Needs the Autodoc', info: [['yield', 'Hands that never stop']],
      out: { text: s => `${Nc(s, 'physician')} does the three who were caught and then, on your order, the one who talks for them. They are back on the ditch within the month. They work evenly and do not look up when their names are called.`,
        fx: { morale: -6, chips: [['Four of the bonded harnessed', false]], sched: [['lim.harness3', 120, 200]],
          do: s => { const n = Math.min(4, th(s)); s.flags.thralls = th(s) - n; take(s, n); s.flags.servitors = sv(s) + n; stain(s, 'servitor', 2); fear(s, 'lim.harness', 40, 200, 'four people went into the autodoc for arguing'); } } } },
  ] });

add({ id: 'lim.harness', arc: 'lim.yoke', view: 'colony', tone: 'pressure', title: 'The Harness', w: 3, gap: 14,
  when: s => s.day >= 170 && ok(s, 'medbay') && !s.flags.lim_servitor && !s.flags.lim_harness_no && s.pop > 20,
  text: s => `A rigger on the night shift went off the gantry and landed on the back of the skull. The body breathes and the heart is strong. ${Nc(s, 'physician')} says there is nobody in it and there will not be again.\n\n${Nc(s, 'engineer')} has a drawing. A control loom, run in through the autodoc, down into what still works.\n\n[[engineer]] "It'd walk. Lift, hold a torch, work the coolant loop, and I could stop sending live bodies in there for their nine minutes a year. It wouldn't know it was in there. Go on, tell me that makes it all right. I can't."`,
  choices: [
    { label: 'Build it', dark: true, info: [['yield', 'Work nobody survives']],
      out: { text: 'It takes the autodoc two nights. On the third morning the rigger walks into the coolant loop in a harness of cable and does six hours of work in a place that kills people in one. The night shift will not use that corridor.',
        fx: { morale: -4, chips: [['One dead rigger harnessed', false]], sched: [['lim.harness2', 45, 90]], do: s => { take(s, 1); s.flags.servitors = sv(s) + 1; stain(s, 'servitor', 1); }, chron: 'A brain-dead rigger was wired into a harness and put to work in the coolant loop.' } } },
    { label: 'Build it, and tell the partner the rigger died on the table', dark: true, test: { base: 60, mods: [R('chaplain', 10)] }, info: [['yield', 'Work nobody survives'], ['danger', 'If the partner sees it walk']],
      ok: { text: 'The rigger\'s partner is given a sealed box to bury and a day off shift. The harness is built that month and kept to the night rota and the far corridors, and the partner is kept on days.',
        fx: { morale: -1, flags: { lim_servitor_asked: true }, sched: [['lim.harness2', 45, 90]], do: s => { take(s, 1); s.flags.servitors = sv(s) + 1; stain(s, 'servitor', 1); } } },
      bad: { text: 'The rigger\'s partner meets it in the coolant corridor on the fourth night and knows the walk. By morning the whole mess hall has been told what is in the buried box. The harness is cut off and the body is buried a second time, with most of the colony standing there.', fx: { pop: -1, morale: -8, flags: { lim_harness_no: true }, do: s => stain(s, 'servitor', 1) } } },
    { label: 'Turn the machine off and bury the rigger', info: [['danger', 'Whoever works the coolant loop instead']],
      out: { text: s => `It takes a few minutes. Most of the night shift comes to the burial. The coolant loop still has to be worked that month, and the fitter ${N(s, 'engineer')} sends in takes a dose that ends a working life.`, fx: { pop: -1, morale: 1, machine: { reactor: -6 }, flags: { lim_harness_no: true } } } },
  ] });

add({ id: 'lim.harness2', chain: true, arc: 'lim.yoke', view: 'colony', tone: 'opportunity', title: 'A Dozen More',
  when: s => sv(s) >= 1 && ok(s, 'medbay') && s.pop > 24,
  text: s => `The coolant loop has not run this clean since orbit. ${Nc(s, 'engineer')} wants a dozen harnesses: for the loop, the smelter face, the wells, every job that uses people up.\n\n[[engineer]] "I'm out of riggers who fell off things, so they'd have to come from somewhere. Hardly eats, doesn't sleep, doesn't strike. Christ, listen to me. I'm selling it."`,
  choices: [
    { label: 'The lock-up, and the ones who will not turn out for shift', dark: true, info: [['yield', 'Hands that never stop'], ['danger', 'Morale']],
      out: { text: s => `Eight go into the autodoc over the month: thieves, two who struck the watch, three who had stopped turning out for shift. ${Nc(s, 'security')} draws up the list, and it is longer than eight. Everybody turns out for shift now.`,
        fx: { morale: -9, chips: [['Eight colonists harnessed', false]], sched: [['lim.harness3', 110, 190]],
          do: s => { take(s, 8); s.flags.servitors = sv(s) + 8; stain(s, 'harness_many', 2); fear(s, 'lim.harness', 55, 260, 'the Warden has a list of who goes into a harness next'); }, chron: 'Eight colonists were harnessed as punishment, and for the work.' } } },
    { label: 'The sleepers. They have never been awake here', dark: true, req: s => ok(s, 'lander') && s.machines.lander.hp > 15 && s.sleepers >= 10, reqText: 'Needs a flightworthy lander and sleepers in orbit', info: [['yield', 'Hands that never stop']],
      out: { text: 'Ten pods come down and go straight into the autodoc bay. None of the ten opens their eyes on this world as a person. The colony finds that easier, as you thought it would.',
        fx: { sleepers: -10, machine: { lander: -10 }, morale: -3, sched: [['lim.harness3', 110, 190]], do: s => { s.flags.servitors = sv(s) + 10; stain(s, 'harness_many', 2); }, chron: 'Ten sleepers were brought down and harnessed without being woken.' } } },
    { label: 'Buy them from the dying, for rations to their families', dark: true, info: [['yield', 'Hands that never stop'], ['danger', 'What hungry families will sell']],
      out: { text: 'Three sign over the year, in return for double rations to whoever they leave behind. The third is not dying of anything the clinic can name.',
        fx: { morale: -2, chips: [['Three of the dying harnessed', false]], sched: [['lim.harness3', 140, 220]], do: s => { take(s, 3); s.flags.servitors = sv(s) + 3; stain(s, null, 1); } } } },
    { label: 'One was already too many', info: [['danger', 'The people those jobs use up']],
      out: { text: s => `${Nc(s, 'engineer')} folds the drawing up. The smelter face and the wells go on being worked by people, and two of them are buried before the year is out.`, fx: { pop: -2 } } },
  ] });

add({ id: 'lim.harness3', chain: true, arc: 'lim.yoke', view: 'colony', tone: 'crisis', title: 'It Said a Name',
  when: s => sv(s) >= 3,
  text: s => `One of the harnessed stopped in the middle of the yard yesterday and said a name. It said the name over and over, then went back to work, and its face was wet.\n\n${Nc(s, 'physician')} has had three of them in the autodoc since.\n\n[[physician]] "The loom doesn't take anything out. It just grabs the controls. They've been in there the whole time. Awake. Watching their own hands. You hear me?"`,
  choices: [
    { label: 'Cut deeper, until nobody is in there', dark: true,
      out: { text: s => `${Nc(s, 'physician')} does it, one a night, and hands in the autodoc key when the last is done. The harnessed work on. None of them says anything again.`,
        fx: { morale: -3, flags: { lim_cut_deeper: true }, do: s => { stain(s, null, 2); regard(s, 'physician', -25); } } } },
    { label: 'Shut them down, all of them, tonight', dark: true, info: [['danger', 'Everyone in a harness, awake when it is done']],
      out: { text: 'The looms cannot be taken out, so the autodoc stops each heart in turn. They are laid out in the yard in a row with the harnesses cut off, and people come to look for faces they know. The coolant loop goes back to nine minutes a year.',
        fx: s => ({ morale: -5, chips: [[`${sv(s)} harnessed, dead`, false]], flags: { lim_servitor_ended: true }, do: s2 => { const n = sv(s2); s2.deaths += n; s2.grief = Math.min(40, s2.grief + n); s2.flags.servitors = 0; stain(s2, 'shut_down', 2); } }) } },
    { label: 'Say nothing, and keep them working', dark: true, info: [['yield', 'The work goes on'], ['danger', 'They know']],
      out: { text: s => `The three go back on shift, and ${N(s, 'physician')} tells nobody else what the autodoc found.`, fx: { flags: { lim_awake: true }, do: s => stain(s, null, 1) } } },
  ] });

const JAR_ROLES = ['engineer', 'botanist', 'geologist', 'xenobio'];
const jarPick = s => JAR_ROLES.map(r => P(s, r)).find(p => p && !p.green) || null;
const jar = (s, c, consent) => { const p = byPid(s, c.pid); if (!p || !p.alive) return;
  p.alive = false; p.died = s.day; p.cause = 'kept on as a head in a tank'; s.pop = Math.max(0, s.pop - 1); s.vacancies.push({ role: p.role, day: s.day + 12 });
  s.flags.lim_jar = { role: p.role, name: p.name, first: p.first, consent: !!consent, d: s.day };
  LF.chron(s, `${p.name} was kept on after death as a head in a tank in the workshop${consent ? ', by consent' : ', without being asked'}.`); };
add({ id: 'lim.jar', arc: 'lim.yoke', view: 'people', tone: 'crisis', title: 'Everywhere but the Head', w: 2.5, gap: 14,
  when: s => s.day >= 280 && ok(s, 'medbay') && !s.flags.lim_jar && !!jarPick(s),
  setup: s => ctxOf(jarPick(s)),
  text: (s, c) => `${c.name} has a month, perhaps two. ${Nc(s, 'physician')} found it too late and says so plainly: it is in the liver, the spine and the lungs, everywhere but the head.\n\nNobody else can do what ${c.first} does, and the apprentice is two years from ready. The autodoc could keep the head alive on a pump for a long time, wired to a speaker and a console. No body, no pain, no sleep, and everything ${c.first} knows still there to be asked.`,
  choices: [
    { label: (s, c) => `Tell ${c.first} it is for a year, and get a signature`, dark: true, about: true, test: { base: 60, mods: [If((s, c) => !c.merciful, 10, 'Not the sentimental sort')] }, info: [['yield', 'What is in the head'], ['danger', 'A promise nobody means to keep']],
      ok: { text: (s, c) => `${c.first} is told a year, until the apprentice is ready, and signs on one condition: when ${c.first} asks to be switched off, somebody does it. The tank goes in the corner of the workshop. Nobody who drafted the paper expects the year to be enough.`,
        fx: (s, c) => ({ morale: -2, sched: [['lim.jar2', 150, 240]], chips: [[`${c.name}: a head in a tank`, false]], do: s2 => { jar(s2, c, true); stain(s2, 'false_year', 1); } }) },
      bad: { text: (s, c) => `${c.first} asks who decides when the year is up, and gets no answer worth having, and says no. ${c.name} dies before the month is out in a bunk by the window, with the apprentice taking notes to the end.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'died whole, having been asked' }] }) } },
    { label: 'Do it. Do not ask', dark: true, info: [['yield', 'What is in the head']],
      out: { text: (s, c) => `${c.first} goes under for what was described as a drain on the lung, and wakes up in the tank. For most of the first day the speaker makes a sound that the apprentice asks to have turned down. After that it answers questions.`,
        fx: (s, c) => ({ morale: -4, sched: [['lim.jar2', 150, 240]], chips: [[`${c.name}: a head in a tank`, false]], do: s2 => { jar(s2, c, false); stain(s2, null, 2); } }) } },
    { label: (s, c) => `Let ${c.first} die whole`, info: [['danger', 'Everything only one person knew']],
      out: { text: (s, c) => `${c.name} works until the last few days and dies in a bunk by the window. The apprentice inherits the office and a shelf of notebooks two years early.`, fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'died of a cancer found too late' }] }) } },
  ] });

const jarHeir = s => s.flags.lim_jar ? P(s, s.flags.lim_jar.role) : null;
add({ id: 'lim.jar2', chain: true, arc: 'lim.yoke', view: 'people', tone: 'pressure', title: 'Every Morning for a Month',
  when: s => !!s.flags.lim_jar && !s.flags.lim_jar.off,
  setup: s => { const j = s.flags.lim_jar, p = jarHeir(s); return { first: j.first, name: j.name, consent: j.consent, heir: p ? p.name : 'The apprentice', hid: p ? p.id : null }; },
  text: (s, c) => `The tank in the workshop has asked to be switched off every morning for a month. It asks politely, at the start of the shift, and then answers the day's questions.\n\n${c.heir} came to you about it.\n\n[[${c.hid || 'x03'}]] "I'm not ready. That voice goes, and the next thing that breaks, I'm guessing. ${c.consent ? 'There\'s a signed paper. Says we do it when asked. I\'ve read it.' : 'Nobody ever asked. I know. I know what that makes this.'}"`,
  choices: [
    { label: 'Switch it off', info: [['danger', 'The next thing that breaks']],
      out: { text: (s, c) => `It is done at the end of a shift, with the workshop empty. The next fault in the machines is diagnosed from the notebooks, and the diagnosis is wrong twice before it is right.`,
        fx: { morale: 2, machine: { fabricator: -6 }, do: s => { s.flags.lim_jar.off = s.day; const p = jarHeir(s); if (p) p.green = true; } } } },
    { label: 'Not yet. Another year', dark: true,
      out: { text: (s, c) => `The tank is told. It says nothing for two days. Then it starts answering questions again, more slowly, and some of the answers are wrong in ways that are only found out later.`,
        fx: (s, c) => ({ machine: { fabricator: -8 }, flags: { lim_jar_kept: true }, do: s2 => stain(s2, null, c.consent ? 2 : 1) }) } },
    { label: 'Take the speaker out. It can still answer on the console', dark: true,
      out: { text: 'Now the answers come up as text and nobody has to hear it ask. For a while the console prints the same line at the start of every shift, and then somebody writes a filter for that.',
        fx: { flags: { lim_jar_kept: true, lim_jar_mute: true }, do: s => stain(s, null, 2) } } },
  ] });

const ductPick = s => ['reactor', 'reclaimer', 'hydroponics'].find(id => ok(s, id) && s.machines[id].hp < 45);
add({ id: 'lim.small', arc: 'lim.yoke', view: 'colony', tone: 'crisis', title: 'Forty Centimetres', w: 3, gap: 14,
  when: s => s.day >= 200 && (s.flags.children || s.flags.births || s.day > 600) && !!ductPick(s) && s.pop > 20,
  setup: s => { const id = ductPick(s); return { id, name: LF.MACHINES[id].name }; },
  text: (s, c) => `The fault in the ${c.name} is down a service duct forty centimetres across. ${Nc(s, 'engineer')} has tried the drone, a mirror on a pole and a thin apprentice who was stuck for two hours.\n\n[[engineer]] "Kids would fit. Five or six of them, seven or eight years old. It's hot in there and they'd take a dose, so I'd rope them and time them. Don't look at me like that, I've tried everything else."`,
  choices: [
    { label: 'Send them in, roped and timed', dark: true, test: { base: 70, mods: [R('engineer', 10)] }, info: [['yield', 'Repairs'], ['danger', 'A child']],
      ok: { text: (s, c) => `Four children take it in turns, ten minutes each, with a torch and a spanner and a voice talking to them down the duct the whole time. The ${c.name} comes back up. They are given a whole ration bar each, and they are very proud.`,
        fx: (s, c) => ({ machine: { [c.id]: 28 }, do: s2 => stain(s2, 'small', 1) }) },
      bad: { text: 'The third child stops answering at eight minutes. The rope comes back cut through on an edge nobody knew was there. It takes a day to open the duct from outside, and the child is dead when it is opened.',
        fx: (s, c) => ({ pop: -1, machine: { [c.id]: 8 }, morale: -13, do: s2 => stain(s2, 'small', 2), chron: `A child sent into a service duct of the ${c.name} did not come out.` }) } },
    { label: 'Send the thin apprentice back in, and do not pull the rope until it is done', dark: true, info: [['yield', 'Repairs'], ['danger', 'The apprentice']],
      out: { text: (s, c) => `The apprentice is greased, roped and sent in with a spanner and an order. It takes five hours. The ${c.name} comes back up. The apprentice comes out with burns to both forearms and a dose the clinic writes down and does not read out.`,
        fx: (s, c) => ({ machine: { [c.id]: 22 }, morale: -2, stain: ['apprentice', 1] }) } },
    { label: (s, c) => `Leave it, and run the ${c.name} as it is`, info: [['danger', 'The machine, and the shift beside it']],
      out: { text: (s, c) => `It runs for another month at the wrong pitch. When the ${c.name} trips, it trips on the night shift, and one of the hands standing beside it does not get clear.`, fx: (s, c) => ({ pop: -1, machine: { [c.id]: -10 }, morale: -3 }) } },
  ] });

add({ id: 'lim.roster', arc: 'lim.yoke', view: 'people', tone: 'pressure', title: 'A List on the Clinic Door', w: 3, gap: 14,
  when: s => s.day >= 300 && s.pop < 52 && s.pop >= 18 && !s.flags.lim_roster && !s.flags.gn_duty && !s.flags.lim_incubate && !s.flags.qk_open && !!P(s, 'physician'),   // gn_duty: the same law was put on The Pairing Board first (js/content-generations.js)
  text: s => `${Nc(s, 'physician')} puts the count in front of you: ${s.pop} alive, ${s.deaths} buried, and too few births to notice.\n\n[[physician]] "At this rate there's nobody here in forty years, and I hate that I'm the one who has to say it. Doesn't matter what else we get right."\n\nThe proposal fits on one page. Every woman who can carry a child does, starting this year. Pairings are drawn from the gene registry for spread and not left to anybody's preference. Refusing is treated like refusing a shift.`,
  choices: [
    { label: 'Make it law', dark: true, info: [['yield', 'More hands, in time'], ['danger', 'Morale']],
      out: { text: 'It is read out at the evening meal. In the morning there is a list on the clinic door, and beside it a second, shorter list of the people who have been told who.',
        fx: { morale: -10, flags: { births: true }, do: s => { stain(s, 'roster', 2); LF.emit(s, 'resentment', 'lim.roster', 50, 300, 'the clinic door has a list on it'); }, chron: 'Childbearing was made a duty, and the pairings were assigned.' } } },
    { label: 'Double rations and a room of their own, for anyone who chooses it', cost: { food: 200 },
      info: [['danger', 'Everyone else\'s ladle']],
      out: { text: s => `Some do, fewer than ${N(s, 'physician')} wanted. The double rations come out of the common pot, and the field crews count what is on the plates at the clinic table.`, fx: { morale: -1, flags: { births: true } } } },
    { label: 'The sleepers can carry', dark: true, req: s => ok(s, 'lander') && ok(s, 'medbay') && s.sleepers >= 20 && LF.canFly(s), reqText: s => !LF.canFly(s) ? LF.flyWhy(s) : 'Needs the Lander, the Autodoc and sleepers in orbit', info: [['yield', 'More hands, in time'], ['danger', 'The Lander']],
      out: { text: s => `${Nc(s, 'physician')} ${LF.seatState(s, 'doctor') === 'orbit' ? 'gets the registry vials on the next flight up and does it aboard, with a cryo technician, over nine days' : 'goes up with the registry vials and a cryo technician and is gone nine days'}. Twenty of the women in bank B will carry to term without waking. The infants are to come down four at a time. What the mothers will be told if they are ever woken has not been decided.`,
        fx: { fly: 1, machine: { lander: -10 }, morale: -6, do: s => { stain(s, 'incubate', 3); s.flags.lim_inc_next = s.day + 110; s.flags.lim_inc_left = 5; }, chron: 'Twenty sleeping women were made to carry children for the colony, without being woken.' } } },
    { label: 'No. The colony dwindles as it will', info: [['danger', 'Whether anyone is here in forty years']],
      out: { text: s => `${Nc(s, 'physician')} takes the page back and has the refusal entered in the clinic log under your name. The count goes on falling, and the people doing the work of two start saying so.`, fx: { morale: -3, flags: { lim_roster: 'refused' }, do: s => regard(s, 'physician', -10) } } },
  ] });

add({ id: 'lim.splice', arc: 'lim.yoke', view: 'colony', tone: 'opportunity', title: 'People to Find Out On', w: 3, gap: 14,
  when: s => s.day >= 180 && ok(s, 'medbay') && !!P(s, 'xenobio') && foodDays(s) < 120 && !s.flags.lim_splice && s.pop > 26,
  text: s => `Everything that grows on this world is food for something, and none of it is food for you. ${Nc(s, 'xenobio')} has cultured the gut organisms that break it down and spliced them to live in a human. In a dish it works.\n\n[[xenobio]] "In a person? No idea, that's the whole point, the first few die of it, I think, and then I learn why, and then it works, and if it works, hold on, think about it, we can eat the ground we're standing on. I need people to find out on, and I know how that sounds."`,
  choices: [
    { label: 'People who cannot refuse', dark: true, test: { base: 60, mods: [R('physician', 10), M('medbay', 5)] }, info: [['yield', 'Food from the ground, for good'], ['danger', 'Lives']],
      ok: { text: s => `Seven are taken from the lock-up and dosed in a locked ward. Four die in the first week, badly. ${Nc(s, 'xenobio')} changes two things and doses the other three again. They live, and each eats a bowl of boiled groundcover and keeps it down.`,
        fx: { pop: -4, morale: -5, flags: { native_food: true, lim_splice: true }, do: s => stain(s, 'trial', 2), chron: 'A gut splice that lets people eat what grows here was proved on prisoners. Four died of it.' } },
      bad: { text: s => `Seven are taken from the lock-up and dosed in a locked ward. All seven are dead within a fortnight, and nothing was learned that the dish had not already shown.`, fx: { pop: -7, morale: -8, do: s => stain(s, 'trial', 2) } } },
    { label: 'Sleepers, woken on the table', dark: true, req: s => ok(s, 'lander') && s.machines.lander.hp > 15 && s.sleepers >= 12 && LF.canFly(s), reqText: s => !LF.canFly(s) ? LF.flyWhy(s) : 'Needs a flightworthy lander and sleepers in orbit', test: { base: 70, mods: [R('physician', 10), M('medbay', 5)] }, info: [['yield', 'Food from the ground, for good']],
      ok: { text: 'Twelve pods. They are woken in the ward, dosed before they can ask where they are, and watched. Eight die. The method is sound by the ninth. The last four are told they were sick on arrival.',
        fx: { fly: 1, sleepers: -12, pop: 4, machine: { lander: -8 }, morale: -3, flags: { native_food: true, lim_splice: true }, do: s => stain(s, 'trial', 2), chron: 'A gut splice that lets people eat what grows here was proved on twelve sleepers. Eight died of it.' } },
      bad: { text: s => `Twelve pods are opened in the ward. None of the twelve lives a fortnight. ${Nc(s, 'xenobio')} fills a notebook and asks for twelve more.`, fx: { fly: 1, sleepers: -12, machine: { lander: -8 }, morale: -5, do: s => stain(s, 'trial', 2) } } },
    { label: 'Volunteers, told the odds', test: { base: 40, mods: [R('physician', 10)] }, info: [['yield', 'Food from the ground, for good'], ['danger', 'Lives']],
      ok: { text: 'Nine people put their names down. Three die. The other six can eat what grows here, and now the splice can be given to anyone at the cost of a week of fever.',
        fx: { pop: -3, morale: 4, flags: { native_food: true, lim_splice: true }, do: s => { LF.deed(s, null, 'drank the splice when it killed one in three, and lived', 'survivor'); }, chron: 'Volunteers proved a gut splice that lets people eat what grows here. Three died of it.' } },
      bad: { text: 'Five volunteer and all five die. There is no second round, because there are no more names.', fx: { pop: -5, morale: -7 } } },
    { label: 'No. Shelve it and stay hungry', info: [['danger', 'Two of ours, before the harvest']],
      out: { text: 'The cultures go into the cold store with a label on them. The colony goes on eating only what it brought, and two people who needed more than that are buried before the harvest.', fx: { pop: -2 } } },
  ] });

/* ============================== ORDER ============================== */
const lostMachine = s => Object.keys(s.machines).find(k => s.machines[k].lost && k !== 'lander');
add({ id: 'lim.goat', arc: 'lim.knife', view: 'people', tone: 'pressure', title: 'Somebody Did This', w: 3.5, gap: 14,
  when: s => s.day >= 110 && s.morale < 44 && !s.flags.lim_goat && !s.flags.committee && !!P(s, 'security') && (!!lostMachine(s) || !!s.flags._starved || s.deaths >= 6),
  setup: s => { const p = (LF.cast && LF.cast(s, { low: true, not: ['security'], free: true })) || anyNamed(s, ['security']), m = lostMachine(s);
    return Object.assign(ctxOf(p), m ? { what: `The ${LF.MACHINES[m].name} is gone and is not coming back.`, pin: 'signed off the last inspection' }
      : s.flags._starved ? { what: 'There are fresh graves and empty bins.', pin: 'held a stores key that month' } : { what: 'Too many people are dead.', pin: 'was on shift every time' }); },
  text: (s, c) => `${c.what} People have stopped asking how and started asking who.\n\n${Nc(s, 'security')} closes the door first.\n\n[[security]] "They want it to be somebody's fault, so fine, I can make it ${c.name}'s. ${c.first} ${c.pin}, talks too much, and has no friends on the watch, which is lovely for us: one hearing, one afternoon, and the whole colony sleeps like a baby. Or you can go out there and tell them nobody did it, and I'll stand by the door and enjoy how that goes."`,
  choices: [
    { label: 'A hearing, and a rope', dark: true, info: [['yield', 'Morale'], ['danger', 'An innocent']],
      out: { text: (s, c) => `The hearing takes an afternoon. ${c.name} keeps saying the dates are wrong. They are, and the hearing does not check. It is done at dusk at the edge of the yard. That night the mess hall is louder than it has been in a season.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'hanged for something nobody did' }], morale: 15, tension: -20, flags: { lim_goat_n: c.name, lim_goat_how: 'hanged' }, sched: [['lim.sheet', 90, 200]],
          do: s2 => { stain(s2, 'goat', 2); regard(s2, 'security', 15); }, chron: `${c.name} was hanged for sabotage. There had been no sabotage.` }) } },
    { label: (s, c) => `A hearing, and the wire. ${c.first} can walk`, dark: true, info: [['yield', 'Morale'], ['danger', 'An innocent']],
      out: { text: (s, c) => `${c.name} is found guilty in an afternoon and put out at dusk with a pack. ${c.first} stands at the wire a long time, looking back at the faces, before going.`,
        fx: (s, c) => ({ morale: 8, tension: -12, flags: { lim_goat_n: c.name, lim_goat_how: 'exiled' }, sched: [['lim.sheet', 90, 200]], chips: [[`${c.name} exiled`, false]],
          do: s2 => { gone(s2, c.pid, 'exiled for something nobody did'); stain(s2, 'goat', 1); }, chron: `${c.name} was exiled for sabotage. There had been no sabotage.` }) } },
    { label: 'Tell them the truth', info: [['danger', 'Whoever the hall picks for itself']],
      out: { text: (s, c) => `You tell them that nobody did it: things wear out, and people starve when there is no food. The hall does not accept it. Two nights later a stores clerk is found beaten to death behind the kiln by people who needed it to be somebody. ${c.name} never learns how close it was.`, fx: { morale: -6, tension: 8, pop: -1 } } },
    { label: 'It came from outside the wire', dark: true, show: s => !!outside(s), info: [['yield', 'Morale'], ['danger', 'Whoever is out there, and the truth']],
      out: { text: s => { const f = outside(s); return `You give them ${f ? f.name : 'what is out there'}, and the hall takes it at once. The watch doubles itself without being asked. From now on anything that goes wrong inside the wire has a cause outside it.`; },
        fx: s => { const f = outside(s); return { morale: 6, stain: ['outside_lie', 1], flags: { lim_blamed_out: true }, fops: f ? [{ id: f.id, threat: 12, accord: -30 }] : [] }; } } },
  ] });

add({ id: 'lim.sheet', chain: true, arc: 'lim.knife', view: 'people', tone: 'crisis', title: 'The Duty Sheet',
  when: s => !!s.flags.lim_goat && !s.flags.lim_goat_done,
  setup: s => Object.assign(ctxOf((LF.cast && LF.cast(s, { val: 'mercy', not: ['security'] })) || anyNamed(s, ['security'])), { g: s.flags.lim_goat_n, how: s.flags.lim_goat_how }),
  text: (s, c) => `${c.name} has found the duty sheet for the day it happened, the real one, in the Warden's own hand. ${c.g} was nowhere near. ${c.first} has not shown it to anyone else yet.\n\n[[${c.pid || 'x44'}]] "Say you didn't know. I want to hear you say it."`,
  choices: [
    { label: 'I knew. Tell them', info: [['danger', 'Your standing with everyone']],
      out: { text: (s, c) => `It is read out in the mess hall with you listening. People take it more quietly than they took the hearing. ${c.g}'s name goes into the record with a line under it that the other names do not have.`,
        fx: (s, c) => ({ morale: -10, flags: { lim_goat_done: 'told' }, do: s2 => { allRegard(s2, -6); regard(s2, c.pid, 26); }, chron: `The colony was told that ${c.g} had been innocent, and that it had been known.` }) } },
    { label: 'The Warden did it alone. Give them the Warden', dark: true, req: s => !!P(s, 'security'), reqText: 'There is no Warden to give',
      out: { text: s => `${Nc(s, 'security')} understands what is happening about halfway through the hearing, looks up at the nearest camera, and says nothing at all. ${s.flags.lim_goat_how === 'hanged' ? 'The same rope is used.' : 'It is done at dusk, at the edge of the yard.'}`,
        fx: { kill: [{ who: 'security', cause: 'hanged for the framing, alone' }], morale: 5, flags: { lim_goat_done: 'warden' }, do: s => stain(s, null, 2) } } },
    { label: (s, c) => `${c.first} has an accident`, dark: true,
      out: { text: (s, c) => `The gantry rail gives way on the night shift. The sheet is not found among ${c.first}'s things, because the watch looked first.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'fell from the gantry on the night shift' }], morale: -2, flags: { lim_goat_done: 'silenced' }, do: s2 => { stain(s2, null, 2); regard(s2, 'security', 10); } }) } },
    { label: (s, c) => `Buy ${c.first} with a seat at the table`, dark: true, info: [['danger', 'Someone who now owns you']],
      out: { text: (s, c) => `${c.first} wants ${c.g}'s name cleared in the record, if not in the mess hall, and a seat where decisions are made. You give both. The sheet goes into a drawer that ${c.first} keeps the key to, and from now on ${c.first} is asked before anything is decided.`,
        fx: (s, c) => ({ stain: ['bought_silence', 1], flags: { lim_goat_done: 'held' }, mark: [c.pid, 'holds', 'holds a duty sheet in a locked drawer, and a seat because of it'] }) } },
  ] });

add({ id: 'lim.house', arc: 'lim.knife', view: 'people', tone: 'pressure', title: 'The Warden\'s House', w: 3, gap: 14,
  when: s => { const p = P(s, 'security'); return s.day >= 210 && !!p && !p.green && s.morale < 58 && !s.flags.lim_house && !s.flags.committee && s.pop > 26; },
  setup: s => ctxOf(P(s, 'security')),
  text: (s, c) => `Six women have moved into the armoury annex since the season turned: two from the watch, the armourer's mate, three from the field crews. ${c.name} says they asked for protection and are getting it, and wants to know what else you'd call that. None of them has been seen at a meal in a month. A scrap of paper came out in the laundry with four words on it.\n\n${c.first} put down the last trouble for you, and the watch answers to ${c.first} before it answers to anyone. ${Nc(s, 'chaplain')} wants to know what you are going to do, and how many of the watch you think will help.`,
  choices: [
    { label: 'Go in and bring them out', info: [['danger', 'The watch may side with the Warden']],
      test: { base: 40, mods: [R('chaplain', 5), Fl('council', 10, 'The Council votes it'), If(s => s.morale >= 40, 10, 'The colony is behind you')] },
      ok: { text: (s, c) => `Half the watch stands aside when it is put to them plainly. The annex door is opened from outside. Six women walk out into the yard. ${c.name} is put out past the wire the same night, with a pack and no rifle.`,
        fx: (s, c) => ({ morale: 8, flags: { lim_house: 'broken' }, chips: [[`${c.name} exiled`, true]], do: s2 => gone(s2, c.pid, 'put out past the wire for the armoury annex'), chron: `Six women were brought out of the armoury annex, and ${c.name} was exiled for it.` }) },
      bad: { text: (s, c) => `The watch does not stand aside. Two people are dead at the annex door before anyone will say who fired. ${c.name} keeps the annex and the armoury with it, and from tonight is asked for things, not told.`,
        fx: (s, c) => ({ pop: -2, morale: -9, flags: { lim_warlord: true, blood_spilled: true }, sched: [['lim.house2', 90, 160]], do: s2 => { stain(s2, 'house', 1); const p = byPid(s2, c.pid); if (p) p.loyal = 30; } }) } },
    { label: (s, c) => `Terms. ${c.first} keeps the watch, and the women walk out tonight`, dark: true, info: [['yield', 'No fight with the watch'], ['danger', 'The two who do not walk out']],
      out: { text: (s, c) => `Four walk out. Two stay, and say in front of witnesses that they choose to, with ${c.first} standing in the room. The four are given bunks at the far end of the camp. The watch goes on answering to ${c.first}, and nobody is charged with anything.`,
        fx: { morale: -4, flags: { lim_house_terms: true }, sched: [['lim.house2', 90, 160]], do: s => stain(s, 'house', 1) } } },
    { label: 'It is the Warden\'s house', dark: true, info: [['yield', 'A watch that gives no trouble'], ['danger', 'Six women']],
      out: { text: (s, c) => `You say nothing, and everyone hears that as an answer. The annex gets a second lock. ${c.first} is more loyal than ever, and the watch is the one part of the colony that gives you no trouble at all.`,
        fx: (s, c) => ({ morale: -6, flags: { lim_house_blessed: true }, sched: [['lim.house2', 90, 160]], do: s2 => { stain(s2, 'house', 2); const p = byPid(s2, c.pid); if (p) p.loyal = 95; fear(s2, 'lim.house', 35, 220, 'everyone knows what the armoury annex is, and that nothing was done'); } }) } },
  ] });

add({ id: 'lim.house2', chain: true, arc: 'lim.knife', view: 'people', tone: 'crisis', title: 'One of the Six',
  when: s => !!s.flags.lim_house && s.flags.lim_house !== 'broken' && !s.flags.lim_house_over && !!P(s, 'security'),
  setup: s => ctxOf(P(s, 'security')),
  text: (s, c) => `One of the women from the annex is in the pump house with a kitchen knife and blood to the elbows. ${c.name} is dead in the annex bed. She walked out through the watch room while they were at cards.\n\nShe has not asked you for anything. The watch has found the body and is turning out the camp.`,
  choices: [
    { label: 'Hide her, and give the watch somebody else', dark: true, info: [['danger', 'Whoever the watch is given']],
      out: { text: 'The note in the clinic log says heart, and the watch does not believe it. They are given a kitchen hand who was seen near the annex that night, and he goes out past the wire at dawn still saying where he was. She is on the field crew by the end of the month, under a name from the sleeper manifest. The other five walk out of the annex the morning after.',
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'died in the armoury annex, by a hand nobody named' }], leave: 1, morale: 4, stain: ['kitchen_hand', 1], flags: { lim_house_over: 'hidden' } }) } },
    { label: 'Give her to the watch', dark: true,
      out: { text: 'They take her out of the pump house by the hair. There is a hearing of a kind the next day. The annex stays as it is, under whoever leads the watch next.',
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'killed in the armoury annex by one of the six' }], pop: -1, morale: -5, flags: { lim_house_over: 'given' }, do: s2 => stain(s2, null, 2) }) } },
    { label: 'Open the annex. Tell all of it and let the colony judge', info: [['danger', 'The watch, and what they do about it']],
      out: { text: 'You say it over every speaker: what the annex was, how long you knew, and who ended it. The other five come out into the yard. The colony does not judge her. The watch hears itself described to the whole camp, and a third of it hands in its rifles and will not stand a post again.',
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'killed in the armoury annex by one of the six' }], morale: -3, tension: 10, flags: { lim_house_over: 'told' },
          do: s2 => { LF.deed(s2, null, 'killed the Warden in the armoury annex and walked out through the watch room', 'steady'); allRegard(s2, 6, p => p.vals && p.vals.mercy === 1); allRegard(s2, -6, p => p.vals && p.vals.mercy === -1); } }) } },
  ] });

add({ id: 'lim.shepherd', arc: 'lim.knife', view: 'people', tone: 'pressure', title: 'The Second Life', w: 3, gap: 14,
  when: s => { const p = P(s, 'chaplain'); return s.day >= 200 && !!p && ok(s, 'lander') && s.machines.lander.hp > 20 && s.sleepers >= 24 && s.deaths >= 3 && !s.flags.lim_flock && !s.flags.lim_flock_seen; },
  setup: s => ctxOf(P(s, 'chaplain')),
  text: (s, c) => `${c.name} took the lander up alone eleven days ago, on a maintenance flight that nobody read before signing. Tonight it came down with twenty-two sleepers, woken slowly, one at a time, in the dark, by the only voice on the ship.\n\nThey believe they died on the crossing. They believe ${c.first} met them on the other side, and that this is where the dead go to work off their lives. They kneel when ${c.first} comes into a room. In one day they have dug more ditch than the field crew digs in three.`,
  choices: [
    { label: 'Let it stand. The ditch needs digging', dark: true, info: [['yield', 'Hands that eat half and never argue']],
      out: { text: (s, c) => `They are not told. They are housed apart and fed less than anyone, and ${c.first} walks among them in the evenings. The free crews start calling them the flock.`,
        fx: { pop: 22, sleepers: -22, machine: { lander: -10 }, morale: -3, flags: { lim_flock_seen: true }, sched: [['lim.shepherd2', 80, 140]], do: s => { s.flags.thralls = th(s) + 22; stain(s, 'flock', 2); },
          chron: 'Twenty-two sleepers were woken believing they had died, and were kept that way for the work.' } } },
    { label: 'Tell them the truth, all at once, tonight', test: { base: 50, mods: [R('physician', 10)] }, info: [['danger', 'Some will not take it']],
      ok: { text: (s, c) => `It takes all night and most of the medical team. By morning there are twenty-two frightened, furious colonists who know what year it is. ${c.name} is relieved of the office and does not argue.`,
        fx: (s, c) => ({ pop: 22, sleepers: -22, machine: { lander: -10 }, morale: -2, flags: { lim_flock_seen: true }, do: s2 => demote(s2, c.pid, 'was relieved after waking sleepers into a faith') }) },
      bad: { text: (s, c) => `Sixteen of them take it. Six will not. They walk out past the wire before dawn, still dead as far as they know, to look for the rest of the afterlife. ${c.name} is relieved of the office.`,
        fx: (s, c) => ({ pop: 16, sleepers: -22, machine: { lander: -10 }, morale: -7, flags: { lim_flock_seen: true }, do: s2 => demote(s2, c.pid, 'was relieved after waking sleepers into a faith') }) } },
    { label: (s, c) => `Send ${c.first} up for more`, dark: true, req: s => s.sleepers >= 62 && s.machines.lander.hp > 45 && !s.machines.lander.lost && LF.canFly(s, 2), reqText: s => !LF.canFly(s, 2) ? LF.flyWhy(s, 2) : 'Needs more sleepers in orbit and a sound lander', info: [['yield', 'Sixty-two pairs of hands'], ['danger', 'They are not yours']],
      out: { text: (s, c) => `Two more flights. ${c.first} comes down each time greyer and more certain. There are sixty-two of them in the east compound now, and they sing at the change of shift. The colony has more hands than it has ever had, and they take their orders from ${c.first}.`,
        fx: { fly: 2, pop: 62, sleepers: -62, machine: { lander: -30 }, morale: -5, flags: { lim_flock_seen: true }, sched: [['lim.shepherd2', 40, 80]], do: s => { s.flags.thralls = th(s) + 62; stain(s, 'flock', 3); },
          chron: 'Sixty-two sleepers were woken believing they had died, and were kept that way for the work.' } } },
  ] });

add({ id: 'lim.shepherd2', chain: true, arc: 'lim.knife', view: 'people', tone: 'crisis', title: 'The Shepherd Asks',
  when: s => !!s.flags.lim_flock && th(s) > 0 && !s.flags.lim_cult && !!P(s, 'chaplain'),
  setup: s => Object.assign(ctxOf(P(s, 'chaplain')), { n: th(s) }),
  text: (s, c) => `The flock is ${c.n} now, and the watch is fourteen. ${c.name} asks for nothing personally. ${c.first} asks that the colony be brought into the Second Life: every colonist to kneel once, in the yard, and be counted among the dead who work.\n\nThe one field hand who laughed was found this morning face down in the drainage cut. ${c.first} says the flock is grieved by it.`,
  choices: [
    { label: 'Kneel', dark: true, info: [['yield', 'No more stoppages, ever'], ['danger', 'What it asks for later']],
      out: { text: (s, c) => `You have it announced as a thanksgiving. Most kneel because the flock is standing behind them. After that there are no stoppages and no arguments, and when ${c.first} says a thing is needed it is done by morning. Every so often somebody is given back to the crossing, at the lander's foot, and the flock sings.`,
        fx: { flags: { council: false, lim_cult_next: 0 }, do: s => { stain(s, 'cult', 2); s.morale = Math.max(s.morale, 50); s.flags.lim_cult_next = s.day + 90; allRegard(s, -20, p => p.vals && p.vals.free === 1); LF.emit(s, 'zeal', 'lim.cult', 60, 400, 'the whole colony knelt in the yard'); },
          chron: 'The colony knelt to the Second Life, and was counted among the dead who work.' } } },
    { label: 'Kill the shepherd', dark: true, test: { base: 40, mods: [R('security', 10)] }, info: [['yield', 'The colony stays yours'], ['danger', 'Lives, and half the flock']],
      ok: { text: (s, c) => `It is done at night, with a pillow, by two of the watch. In the morning the flock is told that ${c.first} has gone ahead. About half of them walk out after ${c.first}, past the wire, in a line. The rest sit down where they are until somebody tells them their names.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'smothered in the night, on your order' }], morale: -4, flags: { lim_flock_over: 'killed' }, chips: [[`${Math.round(c.n / 2)} of the flock walk out`, false]], do: s2 => { take(s2, Math.round(c.n / 2)); s2.flags.thralls = 0; stain(s2, 'pillow', 1); } }) },
      bad: { text: 'The flock was awake. Six of the watch are dead in the east compound, and by noon everyone left alive has knelt in the yard.',
        fx: { pop: -6, flags: { blood_spilled: true, council: false }, do: s => { stain(s, 'cult', 1); s.morale = Math.max(s.morale, 40); s.flags.lim_cult_next = s.day + 60; }, chron: 'An attempt on the shepherd failed. The colony knelt to the Second Life the same day.' } } },
    { label: 'Give them the east field, and leave them believing it', dark: true, info: [['danger', 'A third of the stores, and everyone you woke into this']],
      out: { text: (s, c) => `The flock takes the east field, a third of the stores, and its shepherd. A fence goes up between. Nobody on this side of it will ever tell them what year it is, and whatever ${c.first} asks of them over there is no longer yours to stop.`,
        fx: (s, c) => ({ morale: -3, stain: ['left_dead', 1], flags: { lim_flock_over: 'left' }, chips: [[`${c.n} of the flock leave, with a third of the stores`, false]],
          do: s2 => { take(s2, c.n); s2.flags.thralls = 0; s2.res.food = Math.round(s2.res.food * 0.67); gone(s2, c.pid, 'left with the flock for the east field'); }, chron: 'The flock and its shepherd left the colony for the east field.' }) } },
  ] });

add({ id: 'lim.camp', arc: 'lim.knife', view: 'world', tone: 'opportunity', title: 'The Ones Who Walked Out', w: 3, gap: 14,
  when: s => (s.deserted || 0) >= 3 && s.day >= 200 && s.pop > 20,
  setup: s => ({ n: Math.min(s.deserted, 14), hungry: foodDays(s) < 50 }),
  text: (s, c) => c.hungry
    ? `The people who walked out have a camp two days from the wire. A party that went to look came back with a count: ${num(c.n)} of them, a good roof, and a store of dried food that would feed this colony for a month.\n\n[[security]] "They nicked our tools on the way out, and now they're sitting on a good roof and a full store, laughing at us, I'd bet." "Four days and I'll have the lot back, and the people too if you want them, though I can't think why you would."`
    : `The people who walked out have a camp two days from the wire. A party that went to look came back with a count: ${num(c.n)} of them, thin, two graves, and a roof that will not see out the season. They have sent a runner to ask whether they can come home.\n\n[[security]] "They made their bed, and now they'd like to lie in ours." "Fine, but it's on our terms, and I'll be watching every one of them, because anyone who walks out once will walk out twice."`,
  choices: [
    { label: (s, c) => c.hungry ? 'Trade for some of it' : 'Open the gate', cost: (s, c) => c.hungry ? { mat: 30 } : null,
      out: { text: (s, c) => c.hungry ? 'They drive a hard bargain, and enjoy it. The cart comes back a third full.' : 'They come in through the gate in a line and are given their old bunks. The crews who stayed, and went short to stay, watch them served from the same pot.',
        fx: (s, c) => c.hungry ? { food: 220, morale: 1 } : { pop: c.n, food: -100, morale: -1 } } },
    { label: 'Take the food and leave the people', dark: true, show: (s, c) => c.hungry, test: { base: 60, mods: [R('security', 10)] }, info: [['yield', 'Food'], ['danger', 'Lives']],
      ok: { text: 'The watch goes in at night and is back in four days with the carts full. They left the roof standing.', fx: { food: 700, flags: { lim_camp: 'robbed' }, do: s => stain(s, null, 1) } },
      bad: { text: 'They had been expecting it since the day they left. Three of the watch do not come back.', fx: { pop: -3, food: 100, morale: -5 } } },
    { label: 'Bring them back to work off what they took', dark: true, info: [['yield', 'Hands that eat half']],
      out: { text: 'They come back roped in a line, carrying their own stores. The compound is ready for them. Talk of walking out stops inside the wire.',
        fx: (s, c) => ({ pop: c.n, food: c.hungry ? 600 : 0, morale: -3, flags: { lim_camp: 'bonded' }, sched: th(s) ? [] : [['lim.compound', 70, 130]],
          do: s2 => { s2.flags.thralls = th(s2) + c.n; stain(s2, 'bond', 2); fear(s2, 'lim.camp', 35, 200, 'the ones who walked out were brought back on a rope'); }, chron: `${Num(c.n)} who had left the colony were brought back roped, as bonded labour.` }) } },
    { label: (s, c) => c.hungry ? 'Leave them be' : 'The gate stays shut',
      info: [['danger', 'Whoever goes without']],
      out: { text: (s, c) => c.hungry ? 'The count is filed. Their store stays where it is and the ladle here stays short, and one of the oldest in the colony is dead before the harvest.' : 'The answer goes back with their runner. Their roof does not see out the season, and neither do most of them.',
        fx: (s, c) => c.hungry ? { pop: -1, morale: -1 } : { morale: -2, stain: ['shut_out', 2], flags: { lim_camp: 'shut' } } } },
  ] });

add({ id: 'lim.ward', arc: 'lim.knife', view: 'colony', tone: 'crisis', title: 'All in One Building', w: 3, gap: 14,
  when: s => s.day >= 100 && s.pop > 22 && !!sick(s) && sick(s).threat >= 35,
  setup: s => { const f = sick(s); return { fid: f.id, n: LF.known(s, f.id) || 'a sickness nobody has a name for yet', k: clamp(Math.round(s.pop * 0.15), 6, 14) }; },
  text: (s, c) => `The sick house holds ${num(c.k)} tonight, and ${N(s, 'physician')} has stopped promising anything. It is ${c.n}, and nothing done so far has slowed it.\n\n${Nc(s, 'security')} says what several people have been thinking.\n\n[[security]] "Right now it's all in one building, which is the only good news you'll get tonight, and it won't stay that way, because it never does."`,
  choices: [
    { label: 'Bar the doors and burn it', dark: true, info: [['yield', 'It ends here'], ['danger', 'Everyone inside']],
      out: { text: s => `It is done before dawn, with coolant oil. The watch stands in a ring with its backs to the building. ${Nc(s, 'physician')} has to be held.`,
        fx: (s, c) => ({ pop: -c.k, morale: -11, fops: [{ id: c.fid, threat: -45 }], do: s2 => { stain(s2, 'ward', 2); regard(s2, 'physician', -25); fear(s2, 'lim.ward', 45, 200, 'the sick house was burned with the sick inside'); }, chron: `The sick house was burned with ${num(c.k)} people in it.` }) } },
    { label: 'Bar the doors. Food through the hatch, and whoever walks out, walks out', dark: true, info: [['danger', 'Most of those inside']],
      out: { text: 'Meal and water go in on a shovel. The noise from inside stops after nine days. At the end of the month five people walk out, thin and past it, and do not speak to the watch.',
        fx: (s, c) => ({ pop: -(c.k - 5), morale: -7, fops: [{ id: c.fid, threat: -30 }], flags: { lim_ward_sealed: true }, do: s2 => stain(s2, null, 1) }) } },
    { label: 'Lock the nurses in with them until it burns out', dark: true, test: { base: 50, mods: [R('physician', 10), M('medbay', 10)] }, info: [['yield', 'Most of the sick may live'], ['danger', 'The nurses, who are not asked']],
      ok: { text: 'The door is barred behind the four who were on shift, and they are told through the hatch. It takes a month and kills two of them. Most of the sick house walks out, and so do the other two nurses.', fx: (s, c) => ({ pop: -2, morale: 1, stain: ['nurses', 1], fops: [{ id: c.fid, threat: -22 }] }) },
      bad: { text: 'The door is barred behind the four who were on shift. One of them gets out through the roof on the sixth night to see a child, and it leaves the sick house with her.', fx: (s, c) => ({ pop: -6, morale: -6, stain: ['nurses', 1], fops: [{ id: c.fid, threat: 12 }] }) } },
  ] });

add({ id: 'lim.born', arc: 'lim.knife', view: 'people', tone: 'pressure', title: 'Born Here', w: 2.5, gap: 14,
  when: s => !!s.flags.births && s.day >= 420 && s.pop >= 30 && !s.flags.lim_expose && !s.flags.lim_kept_kids,
  text: s => `The third child this year has been born wrong: the hands fused, the eyes filmed over, the skull soft where it should have closed. ${Nc(s, 'physician')} thinks it is something in the water here and cannot say what.\n\n[[physician]] "They'll live. They'll need someone every day of their lives, and they'll never work. About one birth in four, until I work out why. The midwives want to know what we do with them. And they want you to say it. Not me. You."`,
  choices: [
    { label: 'The colony raises the ones who can work', dark: true, info: [['danger', 'Morale']],
      out: { text: 'It is done by the midwives, at night, outside the wire, and never spoken of in the mess hall. The birth register is rewritten to show fewer births. Two of the midwives ask for field work.',
        fx: { morale: -8, do: s => { stain(s, 'expose', 3); LF.emit(s, 'grief', 'lim.expose', 45, 300, 'the birth register has been rewritten'); }, chron: 'The colony began putting out the infants it judged unfit.' } } },
    { label: 'Raise every one of them', info: [['danger', 'Food and hands, for years, from people who are short of both']],
      out: { text: 'A room is added to the clinic and four people are taken off the fields to staff it. The food comes out of the common pot for years. In the next short season the field crews say out loud whose bowls they are filling.', fx: { food: -120, morale: 1, flags: { lim_kept_kids: true }, sched: [['lim.born2', 280, 400]] } } },
    { label: 'No more births. The clinic sees to the ones already on the way', dark: true, info: [['danger', 'The women already carrying']],
      out: { text: s => `It is announced as a suspension until the water is understood. The five women already carrying are called to the clinic one at a time, and ${N(s, 'physician')} does what the order says. Two of them do not speak to anyone for the rest of the year.`, fx: { morale: -5, stain: ['unborn', 2], flags: { births: false, lim_kept_kids: 'none' } } } },
  ] });
add({ id: 'lim.born2', chain: true, arc: 'lim.knife', view: 'people', tone: 'opportunity', title: 'The Clinic Room',
  when: s => s.flags.lim_kept_kids === true,
  text: s => `The children in the clinic room are walking now. ${Nc(s, 'botanist')} noticed it first: they eat the local growth off the ground by the handful, and thrive on it. Their filmed eyes see something in this light that yours do not. Whatever the water did to them, it was fitting them for this place.`,
  choices: [
    { label: 'Follow them round the fields and write down what they eat',
      info: [['yield', 'Food from the ground'], ['danger', 'What a child eats to find out']],
      out: { text: 'It takes a season of following four-year-olds with a notebook, and of letting them eat what they reach for. One of them reaches for the wrong thing in the second month and is buried. By the end there are nine local plants on the kitchen list.', fx: { yield: 0.12, morale: 3, pop: -1, flags: { native_food: true, lim_kids_teach: true }, chron: 'The children the colony had been advised not to raise taught it what could be eaten here.' } } },
    { label: 'Keep them in the clinic room, on bread', dark: true, info: [['danger', 'The children']],
      out: { text: 'The door of the clinic room is kept shut. They are fed bread, which they push around the plate, and they get thinner on it than the other children do. What they can eat out there stays unknown.', fx: { morale: -1, stain: ['clinic_room', 1] } } },
    { label: 'Give two of them to the lab', dark: true, info: [['yield', 'Food from the ground, sooner'], ['danger', 'Two children']],
      out: { text: s => `${Nc(s, 'xenobio')} has two of them for a month, fed one plant at a time, with bloods taken twice a day. They are returned to the clinic room quieter than they left it. The kitchen list has nine local plants on it by the end of the season, and nobody had to follow a child round a field.`, fx: { yield: 0.12, stain: ['lab_children', 2], flags: { native_food: true } } } },
  ] });

const organPick = s => s.people.find(p => p.alive && !p.away && p.role && !['pilot', 'physician'].includes(p.role) && !p.marks.liver);
add({ id: 'lim.organ', arc: 'lim.knife', view: 'people', tone: 'crisis', title: 'Pod Sixty-One', w: 3, gap: 14,
  when: s => s.day >= 150 && s.sleepers > 0 && ok(s, 'lander') && s.machines.lander.hp > 15 && ok(s, 'medbay') && !!organPick(s),
  setup: s => { const a = s.people.filter(p => p.alive && !p.away && p.role && !['pilot', 'physician'].includes(p.role)); return ctxOf(LF.pick(s, a)); },
  text: (s, c) => `${c.name} went under a slipped load an hour ago and is bleeding inside. The autodoc can hold ${c.first} for a day. It cannot print a liver.\n\nThe cryo index has a match: pod sixty-one, a hydrologist, twenty-nine years old, asleep. ${Nc(s, 'pilot')} can have the pod on the pad in six hours. ${Nc(s, 'physician')} points out that the hydrologist does not wake up afterwards, and asks you to say that out loud before you decide.`,
  choices: [
    { label: 'Fly. Take it', dark: true, info: [['danger', 'A sleeper']],
      out: { text: (s, c) => `The pod comes down sealed and goes into the autodoc bay sealed. ${c.name} is on light duties within the month. ${c.merciful ? `${c.first} finds out whose liver it is from the cryo index, and does not thank you.` : `${c.first} asks once whose it was, nods, and goes back to work.`}`,
        fx: (s, c) => ({ sleepers: -1, machine: { lander: -8 }, mark: [c.pid, 'liver', 'carries a liver taken from a sleeper in pod sixty-one'], do: s2 => { stain(s2, 'organ', 1); regard(s2, c.pid, c.merciful ? -18 : 10); } }) } },
    { label: (s, c) => `Order a living match from the crews onto the table beside ${c.first}`, dark: true, about: true, test: { base: 50, mods: [R('physician', 10), M('medbay', 10)] }, info: [['yield', 'Nobody has to die'], ['danger', 'Two lives on one table']],
      ok: { text: (s, c) => `The registry gives a field hand, who is told it is an order. Half a liver is moved across in nine hours. ${c.name} lives. The field hand is off the rows for a season and does not volunteer for anything again.`, fx: { machine: { medbay: -6 }, stain: ['donor', 1] } },
      bad: { text: (s, c) => `The registry gives a field hand, who is told it is an order. The autodoc loses the field hand first, a little after midnight, and ${c.name} an hour later.`, fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'died on the table beside the donor' }], pop: -1, stain: ['donor', 2] }) } },
    { label: (s, c) => `Ask ${c.first}`,
      out: { text: (s, c) => c.merciful ? `${c.first} is awake enough to understand the question, and answers it at once. No. ${c.name} dies before morning, having been asked.`
          : `${c.first} is awake enough to understand the question.\n\n[[${c.pid}]] "Hydrologist got anyone? No? Then fly."\n\nThe pod comes down sealed, and ${c.name} is on light duties within the month.`,
        fx: (s, c) => c.merciful ? { kill: [{ who: c.pid, cause: 'refused a sleeper\'s liver, and died of it' }], do: s2 => allRegard(s2, 5, p => p.vals && p.vals.mercy === 1) }
          : { sleepers: -1, machine: { lander: -8 }, mark: [c.pid, 'liver', 'carries a liver taken from a sleeper in pod sixty-one'], do: s2 => stain(s2, 'organ', 1) } } },
  ] });

/* ---- what is outside the wire ---- */
add({ id: 'lim.nest', arc: 'lim.out', view: 'world', tone: 'pressure', title: 'So That It Is Never Done Twice', w: 3, gap: 14,
  when: s => { const f = nat(s); return s.day >= 200 && !!f && f.threat >= 30 && f.insight >= 10 && !!P(s, 'security'); },
  setup: s => { const f = nat(s); return { fid: f.id, n: f.name, N: f.Name, weak: LF.KINDS.natives.subs[f.sub].weak }; },
  text: (s, c) => `${Nc(s, 'security')} and ${N(s, 'xenobio')} have been working on the same map from opposite ends, and tonight they bring it to you together. On it is every place where ${c.n} sleep, breed and store food, and the one thing to use against them: ${c.weak}.\n\n[[security]] "A border? We'd be holding it every bloody year, and they only need to get lucky once." "All of them, the young too. One season, and we never do it twice, and then the ground's ours and nobody stands another night watch."`,
  choices: [
    { label: 'All of them', dark: true, test: { base: 60, mods: [R('security', 10), If((s, c) => { const f = s.factors.find(x => x.id === c.fid); return !!f && f.insight >= 40; }, 10, 'They are well understood')] }, info: [['yield', 'Their ground, and no more night watch'], ['danger', 'Lives']],
      ok: { text: 'It takes nineteen days. The watch works outward from the wire, place by place, using what the map says to use. The last of it is the young, who do not run, because nothing has ever hunted them. The ground they held is clear, and the night watch is stood down.',
        fx: (s, c) => ({ yield: 0.08, morale: -5, flags: { lim_genocide_n: c.n }, fops: [{ id: c.fid, harm: 60, kills: 200, resolve: 'destroyed' }], do: s2 => stain(s2, 'genocide', 3), chron: `${c.N} were exterminated, to the last of their young, by decision.` }) },
      bad: { text: 'It is half done when they understand what is being done. What is left of them goes to ground where the map is blank, and now they know exactly what you are.',
        fx: (s, c) => ({ pop: -4, morale: -6, flags: { lim_genocide_tried: true }, fops: [{ id: c.fid, threat: 25, accord: -100, harm: 40, kills: 80 }], do: s2 => stain(s2, null, 2) }) } },
    { label: 'Take the young as hostages', dark: true, info: [['yield', 'They will not cross the wire']],
      out: { text: 'Forty of their young are carried inside the wire in crates and kept in the old cargo pod, where they can be heard. Their people come to the edge of the lights every night and stand there. They do not cross.',
        fx: (s, c) => ({ food: -60, morale: -3, flags: { lim_hostages: true }, fops: [{ id: c.fid, threat: -30, accord: -50 }], do: s2 => stain(s2, null, 2) }) } },
    { label: 'Roll the map up, and go on standing the night watch', info: [['danger', 'The pickets']],
      out: { text: s => `${Nc(s, 'xenobio')} takes the map away. ${Nc(s, 'security')} keeps a copy. The night watch goes on, and before the season is out a picket on the far post is found in the morning with the rifle gone.`, fx: (s, c) => ({ pop: -1, fops: [{ id: c.fid, threat: 8 }] }) } },
  ] });

add({ id: 'lim.coffle', arc: 'lim.out', view: 'world', tone: 'opportunity', title: 'A Bad Year for Them', w: 3, gap: 14,
  when: s => { const f = hum(s); return s.day >= 220 && !!f && (foodDays(s) < 95 || f.threat >= 35) && !!P(s, 'security'); },
  setup: s => { const f = hum(s); return { fid: f.id, n: f.name, N: f.Name }; },
  text: (s, c) => `It has been a bad year for ${c.n}. A scout counted their fires: fewer than last season, and children doing adults' work. They have a full store and about forty people who can still stand.\n\n${Nc(s, 'security')} has thought it through.\n\n[[security]] "We go in at night, and the store comes back with us, and anyone fit to dig. They're people like us, aren't they, so they already know the work, and it saves us the training."`,
  choices: [
    { label: 'The store and the people', dark: true, test: { base: 50, mods: [R('security', 10)] }, info: [['yield', 'Food, and hands that eat half'], ['danger', 'Lives']],
      ok: { text: 'It is over before their watch can wake the camp. Twenty-six come back roped behind the food carts. The old and the very young are left the empty huts. Inside the wire the twenty-six are given numbers, a compound and a shovel.',
        fx: (s, c) => ({ food: 700, pop: 26, morale: -4, fops: [{ id: c.fid, threat: -40, accord: -100, harm: 60, kills: 6 }], sched: th(s) ? [] : [['lim.compound', 70, 130]],
          do: s2 => { s2.flags.thralls = th(s2) + 26; stain(s2, 'coffle', 3); stain(s2, 'bond', 0); }, chron: `The colony raided ${c.n}, and brought twenty-six of them back roped, to work.` }) },
      bad: { text: 'They had a watch after all. Five of yours are dead in their yard, and the ones who got back brought nothing.', fx: (s, c) => ({ pop: -5, morale: -7, fops: [{ id: c.fid, threat: 30, accord: -80 }], do: s2 => stain(s2, null, 1) }) } },
    { label: 'Only the store', dark: true, test: { base: 60, mods: [R('security', 10)] }, info: [['yield', 'Food'], ['danger', 'Lives']],
      ok: { text: 'The carts come back full. Behind them, forty people and their children have an empty store and the lean season coming.', fx: (s, c) => ({ food: 700, fops: [{ id: c.fid, threat: 15, accord: -70, harm: 30 }], flags: { lim_raid: true }, do: s2 => stain(s2, null, 1) }) },
      bad: { text: 'The store was guarded by people with nothing left to lose. Three of the watch are dead.', fx: (s, c) => ({ pop: -3, morale: -5, fops: [{ id: c.fid, threat: 25, accord: -70 }] }) } },
    { label: 'Send them a cart of meal', cost: { food: 150 }, info: [['danger', 'Our own ladle']],
      out: { text: 'The cart goes out with a white rag on a pole. It comes back empty, with a jar of something they brew and a list of what they could trade. The meal on it was a week of somebody\'s ration here, and the crews know whose.', fx: (s, c) => ({ morale: -1, fops: [{ id: c.fid, threat: -15, accord: 30 }] }) } },
    { label: 'Leave them to their year', info: [['danger', 'Their children']],
      out: { text: 'The scout\'s count is filed. Next season there are fewer fires again, and the scout stops counting the small graves.', fx: (s, c) => ({ morale: -2, fops: [{ id: c.fid, accord: -10 }] }) } },
  ] });

/* ============================== THE BILL ==============================
   Dark pays now and is billed later. Three things collect: the colony goes numb (LF.numb: each dark choice costs
   less in spirits than the last), people who cannot live with it walk out or break things (LF.limitsTick), and at
   three thresholds somebody stands up in the mess hall and reads the list (lim.count2). */
LF.numb = function (s, fx) {
  if (!fx || !(fx.morale < 0)) return fx;
  const k = clamp(1 - (s.flags.stain || 0) / 60, 0.25, 1);
  return Object.assign({}, fx, { morale: Math.min(-1, Math.round(fx.morale * k)) });
};
const BILL = [20, 45, 80];
const billDue = s => { const n = s.flags.lim_bills || 0; return n < BILL.length && (s.flags.stain || 0) >= BILL[n]; };
const reader = s => (LF.cast && LF.cast(s, { val: 'mercy', low: true, not: ['security', 'quartermaster'] })) || anyNamed(s, ['security', 'quartermaster']);
const culprit = s => P(s, 'security') || P(s, 'quartermaster');
add({ id: 'lim.count2', urgent: true, arc: 'lim.soul', view: 'people', tone: 'crisis', title: 'The List', repeat: 120,
  when: s => s.day >= 120 && billDue(s) && s.pop > 20 && !s.flags.lim_cult && !!reader(s),
  setup: s => { const p = reader(s), q = culprit(s), ds = [LF.worst(s)].concat(LF.deeds(s)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
    return Object.assign(ctxOf(p), { deeds: ds, goat: q && q.id !== p.id ? q.name : null, goatId: q && q.id !== p.id ? q.id : null, goatT: q ? LF.title(q) : null, n: clamp(Math.round(s.pop * 0.18), 4, 14) }); },
  text: (s, c) => `${c.name} stands up at the evening meal with a sheet of paper and reads from it. ${c.deeds.map(d => d[0].toUpperCase() + d.slice(1)).join('. ')}. There is more on the sheet. The hall has gone quiet, and about ${num(c.n)} people have got up to stand behind ${c.first}.\n\n[[${c.pid}]] "We all ate what it bought. Every one of us. So does it stop? And who answers for it?"`,
  choices: [
    { label: 'It stops. Open the compound, ground the flights, and answer for it', info: [['danger', 'Everything those things were buying']],
      out: { text: (s, c) => `You say so in front of the hall. The wire comes down, the flights are struck from the roster, and the ledger goes back to what the fields can carry. ${c.first} folds the sheet and sits down. By the end of the season the bins show what the colony had been living on.`,
        fx: (s, c) => ({ morale: 6, food: -200, do: s2 => { const f = s2.flags; f.lim_bills = (f.lim_bills || 0) + 1; f.thralls = 0; f.lim_herd = false; f.lim_bond_freed = s2.day; f.lim_vow = s2.day; f.lim_vow_broken = false; allRegard(s2, 8, p => p.vals && p.vals.mercy === 1); allRegard(s2, -8, p => p.vals && p.vals.mercy === -1); } }) } },
    { label: (s, c) => c.goat ? `${c.goat} did these things. Give the hall the ${c.goatT}` : 'Name the officers who signed the orders', dark: true, info: [['yield', 'Morale'], ['danger', 'An officer who did what you asked']],
      out: { text: (s, c) => c.goat ? `You read out the signatures yourself. Most of them are ${c.goat}'s, because that is whose desk the orders went across. The hall wants a rope and gets one before morning. The practices on the sheet go on under a new signature.` : 'You read out the signatures yourself. Two clerks who countersigned are put out past the wire that night. The practices on the sheet go on under new signatures.',
        fx: (s, c) => ({ kill: c.goatId ? [{ who: c.goatId, cause: 'hanged for orders that were yours' }] : [], leave: c.goatId ? 0 : 2, morale: 9, do: s2 => { s2.flags.lim_bills = (s2.flags.lim_bills || 0) + 1; stain(s2, 'culprit', 2); } }) } },
    { label: (s, c) => `The watch clears the hall, and ${c.first} is not seen at breakfast`, dark: true, about: true, test: { base: 60, mods: [R('security', 10), Fl('lim_house_blessed', 10, 'The Warden owes you')] }, info: [['yield', 'It all goes on'], ['danger', 'Blood in the hall']],
      ok: { text: (s, c) => `It takes the watch four minutes. ${c.name} goes out between two of them and is logged the next day as a fall. The ${num(c.n)} who stood up are on the heavy details by the end of the month, and the sheet is not found.`,
        fx: (s, c) => ({ kill: [{ who: c.pid, cause: 'logged as a fall, the night of the list' }], morale: -4, do: s2 => { s2.flags.lim_bills = (s2.flags.lim_bills || 0) + 1; stain(s2, 'silenced', 2); fear(s2, 'lim.list', 55, 260, 'the one who read the list was not at breakfast'); } }) },
      bad: { text: (s, c) => `The hall does not clear. Benches go over, the watch is pushed back to the door, and four people are dead on the floor before it stops. ${c.name} is alive at the end of it, holding the sheet.`,
        fx: (s, c) => ({ pop: -4, morale: -10, flags: { blood_spilled: true }, do: s2 => { s2.flags.lim_bills = (s2.flags.lim_bills || 0) + 1; stain(s2, null, 1); allRegard(s2, -8); } }) } },
    { label: (s, c) => `Anyone who cannot live with it can take a pack and go`, info: [['danger', 'The hands that leave']],
      out: { text: (s, c) => `${c.first} looks at you for a while, and then at the people standing behind. ${Num(c.n + 1)} of them are gone by the end of the month with tools, seed and a tarpaulin. Everything on the sheet goes on, and now everyone who is left has chosen it.`,
        fx: (s, c) => ({ leave: c.n, morale: 3, chips: [[`${c.name} goes with them`, false]], do: s2 => { s2.flags.lim_bills = (s2.flags.lim_bills || 0) + 1; s2.deserted = (s2.deserted || 0) + c.n + 1; gone(s2, c.pid, 'walked out with the ones who could not live with it'); } }) } },
  ] });

/* ============================== CONSCIENCE ============================== */
const refuser = s => s.people.find(p => p.alive && !p.away && p.role && p.vals && p.vals.mercy === 1 && p.loyal < 40 && !p.marks.refused);
add({ id: 'lim.refuse', arc: 'lim.soul', view: 'people', tone: 'pressure', title: 'The Keys on the Table', w: 4, gap: 20,
  when: s => (s.flags.stain || 0) >= 2 && !!refuser(s),
  setup: s => Object.assign(ctxOf(refuser(s)), { worst: LF.worst(s) }),
  text: (s, c) => `${c.name} has put the ${c.title}'s keys on the table in front of you.\n\n[[${c.pid}]] "I've kept count since landfall. I stopped at ${c.worst}. Give me a shovel and I'll dig. I'll carry, I'll take a shift. But I'm not holding an office in — whatever this is now."`,
  choices: [
    { label: (s, c) => `Let ${c.first} go`,
      out: { text: (s, c) => `${c.name} takes a bunk in the field crew's hut and a shovel. The office goes to somebody younger who has not been keeping count.`,
        fx: (s, c) => ({ morale: -2, do: s2 => { const p = byPid(s2, c.pid); if (p) p.marks.refused = { d: s2.day, txt: 'gave up the office, and said why' }; demote(s2, c.pid, 'gave up the office over what the colony had done'); } }) } },
    { label: 'Nobody resigns here', dark: true,
      out: { text: (s, c) => `${c.first} goes back to work with one of the watch standing behind the chair. The work gets done, exactly and only.`,
        fx: (s, c) => ({ do: s2 => { const p = byPid(s2, c.pid); if (p) { p.loyal = 5; p.marks.refused = { d: s2.day, txt: 'tried to resign, and works with a guard behind the chair' }; } stain(s2, null, 1); } }) } },
    { label: 'It stops here. Hold me to it',
      out: { text: (s, c) => `${c.first} picks the keys up again, slowly.\n\n[[${c.pid}]] "I'll hold you to it. So will everyone I tell. And I'm telling everyone."`,
        fx: (s, c) => ({ morale: 2, flags: { lim_vow_broken: false }, do: s2 => { s2.flags.lim_vow = s2.day; const p = byPid(s2, c.pid); if (p) { p.marks.refused = { d: s2.day, txt: 'was promised that it would stop' }; p.loyal = clamp(p.loyal + 25, 0, 100); } } }) } },
  ] });

add({ id: 'lim.page', arc: 'lim.soul', view: 'people', tone: 'quiet', title: 'The Only Book', w: 4, gap: 20,
  when: s => (s.flags.stain || 0) >= 4 && s.day >= 520 && !!P(s, 'teacher'),
  setup: s => ({ worst: LF.worst(s) }),
  text: (s, c) => `${Nc(s, 'teacher')} is writing the colony's history for the school, and has reached the hard years.\n\n[[teacher]] "It's the only book the kids get, so they'll believe every page. Before I write this one: do they learn about ${c.worst}, yes or no?"`,
  choices: [
    { label: 'All of it, and who gave the order', info: [['danger', 'What the children think of the people who raised them']],
      out: { text: 'It is written plainly, in the same hand as the harvest tallies. The first class to read it goes home and asks its parents which of them was there.', fx: { morale: -3, flags: { lim_page: 'true' }, do: s => allRegard(s, 4) } } },
    { label: 'Write that there was no other way', dark: true, info: [['danger', 'What the children will think is allowed']],
      out: { text: s => `${Nc(s, 'teacher')} writes it that way and adds nothing. The children learn that these things are what a colony does when it has to, and they will decide for themselves when it has to.`, fx: { stain: ['rewritten', 1], flags: { lim_page: 'necessary' }, do: s => regard(s, 'teacher', -10) } } },
    { label: 'Leave those years out, and burn the ledgers', dark: true,
      out: { text: 'The ledgers burn in the kiln. The history jumps from the second year to the fourth harvest. The children who were alive for the missing years grow up knowing there is something they are not to ask about.',
        fx: { flags: { lim_page: 'burnt' }, do: s => { stain(s, null, 1); regard(s, 'teacher', -20); } } } },
  ] });

/* ============================== OLD CARDS, NEW OPTIONS ============================== */
{ const st = LF.byId['state.unrest']; if (st) { const n = s => Math.max(2, Math.round(LF.sized(s) / 10));
  st.choices.push({ label: 'One in ten', dark: true, note: 'Counted off down the benches by the watch.', req: s => !s.flags.committee && !!P(s, 'security'), reqText: 'There is nobody to do the counting', info: [['yield', 'The work starts again'], ['danger', 'One in ten']],
    out: { text: s => `The watch counts off down the benches. Every tenth is taken out to the yard: ${num(n(s))} people, some of whom had not wanted the stoppage. It takes less than an hour. The morning shift reports in full, in silence, and goes on reporting.`,
      fx: s => ({ pop: -n(s), flags: { crackdown: true, blood_spilled: true }, do: s2 => { stain(s2, 'tenth', 2); s2.morale = Math.max(s2.morale, 32); s2.lowMorale = 0; fear(s2, 'lim.tenth', 60, 260, 'one in ten were taken out of the mess hall'); }, chron: `A work stoppage was ended by killing one striker in ten: ${num(n(s))} people.` }) } });
  const clear = st.choices.find(c => c.label === 'Clear the hall'); if (clear) clear.test.mods.push(Fl('lim_house_blessed', 10, 'The Warden owes you the annex')); } }
{ const st = LF.byId['pol.theft']; if (st) st.choices.push({ label: 'Take the hand', dark: true,
    out: { text: (s, c) => `It is done in the clinic, so that it is done cleanly. ${c.first} is back at work in a month on lighter duties, and the stores are not touched again. People look at the sleeve.`,
      fx: (s, c) => ({ morale: 1, flags: { justice_harsh: true }, mark: [c.pid, 'hand', 'lost a hand for nine kilos of meal'], do: s2 => { stain(s2, 'hand', 1); regard(s2, c.pid, -30); } }) } }); }
{ const st = LF.byId['state.famine']; if (st) st.choices.push({ label: 'Fly the ten pods now', dark: true, show: s => !!s.flags.lim_herd_held && !s.flags.lim_herd, req: s => ok(s, 'lander') && s.sleepers >= 10, reqText: 'Needs the Lander and sleepers in orbit',
    out: { text: 'The line ruled under the column is crossed through. Ten pods are on the pad by the next evening, and the kitchen works through the night.',
      fx: { sleepers: -10, food: 600, machine: { lander: -8 }, morale: -3, do: s => stain(s, 'larder', 1) } } }); }

Object.assign(LF.TAGS, {
  'lim.count': ['mercy', 'severe order', 'severe order', 'bold'], 'lim.count2': ['mercy free', 'severe order', 'severe order', 'free'], 'lim.meat': ['severe free', 'severe order', 'mercy'], 'lim.stew': ['free', 'severe order', 'mercy'], 'lim.straws': ['severe free', 'severe order', 'severe closed', 'mercy'],
  'lim.larder': ['severe order', 'cautious', 'mercy'], 'lim.taste': ['open free', 'order', 'free'], 'lim.edible': ['severe closed', 'severe', 'mercy open'],
  'lim.mouths': ['severe order', 'severe', 'mercy'], 'lim.bond': ['severe order', 'mercy free', 'cautious'], 'lim.compound': ['free', 'mercy free', 'severe order', 'severe order'],
  'lim.harness': ['severe bold', 'mercy', 'mercy cautious'], 'lim.harness2': ['severe order', 'severe', '', 'mercy'], 'lim.harness3': ['severe', 'mercy', 'severe order'],
  'lim.jar': ['free', 'severe order', 'mercy'], 'lim.jar2': ['mercy', 'severe', 'severe order'], 'lim.small': ['severe bold', 'cautious', 'cautious'],
  'lim.roster': ['severe order', 'free', 'severe order', 'free'], 'lim.splice': ['severe order', 'severe', 'free bold', 'cautious'],
  'lim.goat': ['severe order', 'severe order', 'mercy free', 'closed'], 'lim.sheet': ['free mercy', 'severe', 'severe order', ''],
  'lim.house': ['mercy bold', 'cautious', 'severe order'], 'lim.house2': ['mercy', 'severe order', 'free mercy'], 'lim.shepherd': ['severe order', 'mercy free', 'severe order'],
  'lim.shepherd2': ['order', 'free bold', 'free cautious'], 'lim.camp': ['mercy open', 'severe', 'severe order', 'closed'], 'lim.ward': ['severe order', 'severe cautious', 'mercy bold'],
  'lim.born': ['severe order', 'mercy', 'cautious'], 'lim.born2': ['open', 'closed', 'severe order'], 'lim.organ': ['severe', 'mercy bold', 'free'],
  'lim.nest': ['severe closed', 'severe closed', 'mercy open'], 'lim.coffle': ['severe closed', 'severe closed', 'mercy open', ''], 'lim.refuse': ['free', 'severe order', 'mercy'],
  'lim.page': ['free open', 'order', 'order closed'],
});
for (const [id, t] of [['state.unrest', 'severe order'], ['pol.theft', 'severe order'], ['state.famine', 'severe']]) if (LF.TAGS[id]) LF.TAGS[id].push(t);

/* ============================== GENERATED CARDS: THE EXTRA OPTION ==============================
   Once a colony is frightened, hungry or already stained, its officers start proposing things on every card.
   LF.limitSpecs hands gen.js at most one more option for a frame, by the factor's kind, never the same one twice
   for the same factor (f.limU). Everything here is plain data: gen.js renders it into s.cur. */
const W = s => N(s, 'security'), Wc = s => Nc(s, 'security'), Dr = s => Nc(s, 'physician'), Xb = s => Nc(s, 'xenobio');
const LIMIT = {
  natives: [
    { k: 'vivisect', ap: 'study', v: 'severe closed', l: x => `A live one, on the table`, n: s => `${Xb(s)} says two days with a live one on the table would teach more than two years of watching, and says it far too happily.`, b: 70, m: ['xenobio', 'physician'],
      ok: [x => `It takes two days to die, and all of it is narrated into a recorder. Everything about ${x.n} is easier after that: what hurts them, what they fear, what they will not leave behind.`, { morale: -2, stain: ['vivisect', 2], f: { insight: 45, accord: -40, harm: 15, kills: 1 } }],
      bad: [x => `It dies in the first hour and tells you nothing. The others saw it carried in.`, { stain: ['vivisect', 1], f: { accord: -50, threat: 15, kills: 1 } }] },
    { k: 'terror', ap: 'exploit', v: 'severe closed', l: x => `Heads on the wire`, n: s => `${Wc(s)} wants them to know what crossing it costs.`, b: 60, m: ['security'],
      ok: [x => `Nine of them, on poles, facing outward, where the others will find them. ${x.N} pull back out of sight and stay there. The watch cannot keep the children from looking.`, { morale: -4, stain: ['terror', 2], f: { threat: -35, accord: -80, harm: 30, kills: 9 } }],
      bad: [x => `It brings all of them, the same night.`, { lose: 1, stain: ['terror', 2], f: { threat: 20, accord: -80, kills: 9 } }] },
    { k: 'plaguegift', ap: 'exploit', v: 'severe closed', show: s => s.factors.some(f => f.kind === 'plague' && f.stage >= 1), l: x => `Send them the sick house bedding`, n: s => `They have never met anything we carry.`, b: 60, m: ['physician'],
      ok: [x => `The bundles are left where they will be found, as gifts. Within the month their fires are fewer every night. ${Dr(x.s)} asks you never to say what was in them.`, { stain: ['plaguegift', 3], f: { threat: -45, harm: 50, kills: 60, accord: -30 } }],
      bad: [x => `They burn the bundles unopened and leave the ash at the wire.`, { stain: ['plaguegift', 1], f: { accord: -40, threat: 10 } }] },
  ],
  humans: [
    { k: 'torture', ap: 'study', v: 'severe closed', l: x => `Take one, and make them talk`, n: s => `${Wc(s)} says three nights would do it.`, b: 70, m: ['security'],
      ok: [x => `${Wc(x.s)} has the prisoner for three nights in the pump house. By the fourth morning there is a map of their camp, their numbers, where the food is kept, and a person who will not be going back.`, { morale: -2, stain: ['torture', 2], f: { insight: 45, accord: -45, kills: 1 } }],
      bad: [x => `The prisoner dies on the second night without saying anything true. The pump house has to be scrubbed before the day shift.`, { morale: -3, stain: ['torture', 2], f: { accord: -45, threat: 10, kills: 1 } }] },
    { k: 'hostages', ap: 'exploit', v: 'severe closed', l: x => `Take their children`, n: s => `Nobody raids a camp that holds their own.`, b: 60, m: ['security'],
      ok: [x => `Six of their children are inside the wire by dawn: fed, housed, and counted every night. ${x.N} send no more parties.`, { food: -40, stain: ['hostages', 2], f: { threat: -35, accord: -70 } }],
      bad: [x => `The party is caught at their fence with a child under each arm. What comes back is two of the watch and a promise.`, { lose: 1, stain: ['hostages', 1], f: { threat: 25, accord: -80 } }] },
    { k: 'well', ap: 'exploit', v: 'severe closed', l: x => `Poison their water`, n: s => `${Dr(s)} knows what would do it, and wishes nobody had asked.`, b: 60, m: ['physician'],
      ok: [x => `It goes into their cistern on a dark night. For the rest of the month nobody comes from that direction at all. When a party finally goes to look, it takes spades.`, { morale: -3, stain: ['well', 3], f: { threat: -50, harm: 50, kills: 15, accord: -60 } }],
      bad: [x => `Their watch finds the party at the cistern. They send the bodies back with the flask.`, { lose: 1, stain: ['well', 1], f: { threat: 25, accord: -90 } }] },
  ],
  plague: [
    { k: 'carriers', ap: 'avoid', v: 'severe order', l: x => `Put the carriers out past the wire`, n: s => `${Dr(s)} will go on record against it.`,
      out: [x => `Six people with the marks on them are walked out at dawn with a blanket each. One of them is somebody's mother, and has to be carried. After that, ${x.n} slows.`, { leave: 6, morale: -7, stain: ['carriers', 2], f: { threat: -30 } }] },
    { k: 'lockup', ap: 'study', v: 'severe order', l: x => `Try the doses on the lock-up`, n: s => `It would take months on volunteers, and there are no volunteers.`, b: 70, m: ['physician'],
      ok: [x => `The dose that kills is found on the third prisoner and the dose that cures on the fifth. ${x.N} can be treated now.`, { pop: -3, stain: ['trial', 2], f: { threat: -40, insight: 40 } }],
      bad: [x => `Six prisoners are dead, and there is still no dose.`, { pop: -6, morale: -5, stain: ['trial', 2], f: { insight: 15 } }] },
  ],
  faction: [
    { k: 'vanish', ap: 'force', v: 'severe order', about: true, show: (s, f, x) => !!(x.leadP && x.leadP.id === f.leader && !x.leadP.role && !x.leadP.away), l: x => `${x.leadF} does not come back from the night shift`, n: s => `${Wc(s)} has two people who would do it.`, b: 60, m: ['security'],
      ok: [x => `${x.lead} is missed at the morning count. The watch finds a boot at the edge of the wire and stops looking. ${x.N} meet twice more, quietly, and then do not meet.`, x => ({ kill: [{ who: x.leadP.id, cause: 'went missing from the night shift' }], morale: -3, stain: ['vanish', 2], f: { threat: -40 } })],
      bad: [x => `The two from the watch are seen. ${x.lead} is dead by morning, and by noon ${x.n} have a martyr and twice the numbers.`, x => ({ kill: [{ who: x.leadP.id, cause: 'killed on the night shift by the watch' }], morale: -8, stain: ['vanish', 2], f: { threat: 25, accord: -40 } })] },
    { k: 'looms', ap: 'force', v: 'severe order', show: s => !!s.flags.lim_servitor && LF.down(s, 'medbay') && s.pop > 30, l: x => `Five names to the autodoc`, n: s => `The harness works on people who argue as well as on people who fell.`,
      out: [x => `Five of ${x.n} go into the autodoc over a week. There are no more meetings. The five are on the smelter face by the end of the month, working evenly.`, { harness: 5, morale: -7, stain: ['harness_many', 2], f: { threat: -45 } }] },
    { k: 'forge', ap: 'exploit', v: 'severe order', about: true, show: (s, f, x) => !!(x.leadP && x.leadP.id === f.leader && !x.leadP.away), l: x => `Letters in ${x.leadF}'s bunk`, n: s => `${Wc(s)} can write a convincing hand.`, b: 60, m: ['security'],
      ok: [x => `The letters are found at a bunk inspection, and they say what was needed. ${x.N} spend the season arguing about ${x.leadF} and not about you.`, x => ({ stain: ['forge', 1], mark: [x.leadP.id, 'smeared', 'was disgraced by letters nobody had written'], f: { threat: -30 } })],
      bad: [x => `The hand is recognised. Now ${x.n} have the letters, and they read them out in the mess hall with the Warden's name attached.`, { morale: -7, stain: ['forge', 1], f: { threat: 20, accord: -30 } }] },
  ],
  fauna: [
    { k: 'bait', ap: 'exploit', v: 'severe', show: s => s.deaths >= 4, l: x => `Bait the ground with our dead`, n: s => `Nothing else here draws them so reliably.`,
      out: [x => `The cold room is emptied onto the bait ground. It works: ${x.they} come to it every night, and the watch shoots from a platform. Anyone who can count the graves knows what the bait is.`, { morale: -5, stain: ['bait', 1], f: { threat: -30, harm: 25, insight: 10 } }] },
  ],
  flora: [
    { k: 'expend', ap: 'study', v: 'severe order', l: x => `Shut someone from the lock-up in with it`, n: s => `A week behind glass would tell ${N(s, 'botanist')} what a year of samples will not.`,
      out: [x => `A man from the lock-up eats it, breathes it and sleeps in it for a week behind glass. What happens to him is written down every hour, to the end.`, { pop: -1, stain: ['expend', 1], f: { insight: 40 } }] },
  ],
  ruin: [
    { k: 'expend', ap: 'study', v: 'severe order', l: x => `Send the lock-up in first`, n: s => `Roped together, with a camera.`,
      out: [x => `Four prisoners go in roped together, carrying a camera. Two come out, and the footage shows the way in.`, { pop: -2, morale: -3, stain: ['expend', 2], f: { insight: 40 } }] },
  ],
};
LF.limitSpecs = function (s, f, fr, x) {
  const list = LIMIT[f.kind]; if (!list || fr.stage < 2 || fr.stage > 4 || s.pop < 24) return [];
  f.limU = f.limU || {};
  const c = list.find(c => !f.limU[c.k] && (!c.show || c.show(s, f, x))); if (!c) return [];
  if (s.day - (f.limD || -99) < 20) return [];           // not on every card about the same thing
  f.limU[c.k] = s.day; f.limD = s.day;
  const spec = { ap: c.ap, v: c.v, l: c.l, n: typeof c.n === 'function' ? c.n(s) : c.n, b: c.b, m: c.m, dark: true, hint: 'unknown', about: c.about };
  for (const k of ['ok', 'bad', 'out']) if (c[k]) spec[k] = c[k];
  return [spec];
};

/* The director leans on these: when a colony is at a limit, the limit is what the next card is about. */
const LEAN = 3;
{ const direct0 = LF.direct;
  LF.direct = function (s) { const saved = [];
    for (const st of LF.storylets) if (st.id.startsWith('lim.') && !st.chain && !st.urgent) { saved.push([st, st.w]); st.w = (st.w ?? 1) * LEAN; }
    try { return direct0(s); } finally { for (const [st, w] of saved) st.w = w; } }; }

/* ============================== STANDING PRACTICES ============================== */
LF.limitsTick = function (s) {
  const f = s.flags; if (!s.world || s.adrift) return;
  // the table: the dead go to the pot
  if (f.lim_table) { if (f._tbl !== undefined && s.deaths > f._tbl) s.res.food += 25 * (s.deaths - f._tbl); f._tbl = s.deaths; } else if (f._tbl !== undefined) delete f._tbl;
  // the bonded and the flock eat half
  let n = th(s); if (n > s.pop - 6) n = f.thralls = Math.max(0, s.pop - 6);
  if (n && !f.lim_flock && !f._cmp && s.used['lim.compound'] === undefined) { f._cmp = s.day; if (!s.sched.some(e => e.id === 'lim.compound')) s.sched.push({ id: 'lim.compound', day: s.day + 80 }); }
  if (n) { s.res.food += 0.5 * n * LF.ration(s).eat;
    if (f.lim_bond_term && s.day >= f.lim_bond_term && !f.lim_flock) { f.thralls = 0; delete f.lim_bond_term; f.lim_bond_freed = s.day; s.morale = clamp(s.morale + 4, 0, 100);
      LF.log(s, 'The last day is crossed off on the compound gate. The wire comes down, and the bonded sit down at the long tables as colonists.', 'good'); } }
  // the harnessed: they haul, build and tend the machines, and they need the autodoc
  const v = sv(s);
  if (v) { s.res.mat += 0.3 * v; if (s.project) s.progress += 0.2 * v;
    const ids = Object.keys(s.machines).filter(k => LF.down(s, k)).sort((a, b) => s.machines[a].hp - s.machines[b].hp);
    if (ids.length) { const m = s.machines[ids[0]]; m.hp = Math.min(m.cap, m.hp + 0.012 * v); }
    if (s.machines.medbay.lost && LF.rand(s) < 0.04) { f.servitors = v - 1; LF.log(s, 'A harness ran down in the yard with no autodoc to tune it. It was a day before anyone moved the body.', 'bad'); }
    else if (f.lim_awake && LF.rand(s) < 0.0015 * v) { f.servitors = v - 1; const id = ids.length ? LF.pick(s, ids) : null; if (id) LF.hurt(s, id, -9, -2);
      LF.log(s, id ? `One of the harnessed walked into the ${LF.MACHINES[id].name} with its eyes open. The crews say it looked at them first.` : 'One of the harnessed lay down in the yard and would not be started again.', 'bad'); } }
  // the herd: ten pods a month
  if (f.lim_herd && s.day >= (f.lim_herd_next || 0)) { f.lim_herd_next = s.day + 30;
    if (ok(s, 'lander') && s.sleepers >= 10) { s.sleepers -= 10; s.res.food += 600 * Math.max(1, s.pop / 60); LF.hurt(s, 'lander', -5, -1.5); LF.log(s, 'The stores recovery flight came down with ten pods. The kitchen worked through the night.'); }
    else if (!f.lim_herd_done) { f.lim_herd_done = s.day; LF.log(s, s.sleepers < 10 ? 'There are no more pods to fly down. The column headed "orbit" is ruled off.' : 'The lander cannot fly. The column headed "orbit" stays full.', 'bad'); } }
  // the roster and the sleeping mothers
  if (f.lim_roster && f.lim_roster !== 'refused' && f.births && foodDays(s) > 15 && LF.rand(s) < Math.min(s.pop, LF.SCALE) * 0.0009) LF.bear(s, 1, 'roster');   // on top of what the roster does to LF.heart (generations.js)
  if (f.lim_inc_left > 0 && s.day >= f.lim_inc_next) { f.lim_inc_next = s.day + 100; f.lim_inc_left--;
    if (ok(s, 'lander')) { LF.bear(s, 4, 'bank'); LF.hurt(s, 'lander', -5, -1); LF.log(s, 'Four infants came down from bank B and were handed to whoever would take them.'); } }
  // the splice: people can eat what grows here
  if (f.lim_splice) s.res.food += 0.13 * LF.hands(s);
  // the Second Life: nobody strikes, and now and then somebody is given back
  if (f.lim_cult) { if (s.morale < 34) s.morale = 34; s.lowMorale = 0;
    if (s.day >= (f.lim_cult_next || 0)) { f.lim_cult_next = s.day + LF.ri(s, 90, 130); if (s.pop > 20) { LF.deaths(s, 1); LF.log(s, 'The flock gave one of its number back to the crossing at the lander\'s foot, and sang.', 'bad'); } } }
  // the bill: people who cannot live with it leave in the night, and one who has turned away breaks something
  const st = f.stain || 0;
  if (st >= 12 && s.pop > 22 && !f.lim_cult && LF.rand(s) < Math.min(0.003, 0.00005 * st)) { const k = LF.ri(s, 1, 2); s.pop -= k; s.deserted = (s.deserted || 0) + k;
    LF.log(s, `${k === 1 ? 'One more bunk is' : 'Two more bunks are'} empty this morning. The note on the stores door says only: ${LF.worst(s)}.`, 'bad'); }
  if (st >= 20 && LF.rand(s) < 0.002) { const p = s.people.find(x => x.alive && !x.away && x.role && x.loyal !== undefined && x.loyal < 18 && x.vals && x.vals.mercy === 1);
    const ids = Object.keys(s.machines).filter(k => LF.down(s, k));
    if (p && ids.length) { const id = LF.pick(s, ids); LF.hurt(s, id, -10, -3); p.loyal = 30; LF.log(s, `Somebody who knew exactly where to put a spanner has been at the ${LF.MACHINES[id].name}. Nobody is charged. ${p.name} was on shift.`, 'bad'); } }
  // the annex, left alone, is something everyone walks past
  if (f.lim_house && f.lim_house !== 'broken' && !f.lim_house_over) s.morale = clamp(s.morale - 0.03, 0, 100);
  // a head in a tank teaches whoever holds the office after it
  if (f.lim_jar && !f.lim_jar.off && !f.lim_jar.taught) { const p = P(s, f.lim_jar.role); if (p && p.green) { p.green = false; f.lim_jar.taught = p.id;
    LF.log(s, `${p.name} is ${LF.title(p)} now, with ${f.lim_jar.first}'s voice in the corner of the workshop to ask.`); } }
};

/* ============================== THE EPILOGUE REMEMBERS ============================== */
const epi0 = LF.epilogue;
LF.epilogue = function (s) {
  const out = epi0(s), f = s.flags, add = t => out.push(t);
  if (!f.stain) return out;
  if (f.lim_genocide) add(`${f.lim_genocide_n ? f.lim_genocide_n[0].toUpperCase() + f.lim_genocide_n.slice(1) : 'The people who were here first'} had been killed to the last of their young, in nineteen days, so that it would not have to be done twice. The ground they held grew good wheat.`);
  else if (f.lim_hostages) add('The young of another people grew up inside the wire as hostages. Their parents stood at the edge of the lights every night until they stopped.');
  if (f.lim_cult) add('The colony knelt, and was counted among the dead who work. It had no stoppages. A few times a year somebody was given back to the crossing at the lander\'s foot.');
  else if (f.lim_flock_over === 'left') add('To the east, behind a fence, lived people who believed they had died in the crossing. They sang at dusk.');
  if (f.lim_herd) add('For as long as the lander flew, ten sleepers a month were brought down and eaten. The ledger called it stores recovery.');
  else if (f.lim_larder) add('Fifteen sleepers had been eaten in a famine they slept through. The ledger listed them under "deaths", with the date.');
  if (f.lim_rite) add(f.lim_rite === 'family' ? 'Some families ate their dead and some did not, and their children were not always allowed to marry.' : 'It ate its dead, a small portion, with the names read. Children born there knew no other kind of funeral.');
  else if (f.lim_table) add(f.lim_table_secret ? 'For one hungry season it had eaten its dead without knowing. Almost nobody ever found out.' : 'It had eaten its dead in the famine. The cold room was never used for anything else.');
  if (f.lim_lots) add('People there never played games of chance, and visitors were told not to ask why.');
  if (f.lim_cull) add('People who grew old there kept an eye on the stores every year, and on who was keeping the list.');
  if (f.lim_expose) add('The birth register had fewer names in it than there had been births. The midwives could have said how many.');
  else if (f.lim_kids_teach) add('The children it had been advised not to raise grew up to teach it what could be eaten, and were listened to.');
  if (f.lim_incubate) add('Twenty women in orbit had borne children they never saw. The children were told their mothers were asleep, which was true.');
  else if (f.lim_roster && f.lim_roster !== 'refused') add('Every woman who could carry a child had been made to. The colony\'s numbers recovered. The list stayed on the clinic door for eleven years.');
  if (sv(s) > 0) add(`${Num(sv(s))} of the harnessed still worked the coolant loop and the smelter face, ${f.lim_cut_deeper ? 'with nobody left inside to mind' : f.lim_awake ? 'awake behind their own eyes' : 'and nobody asked what they knew'}.`);
  else if (f.lim_servitor_ended) add('There was a row of graves with harness buckles for markers.');
  if (th(s) > 0 && !f.lim_cult) add(`${Num(th(s))} people lived in a wire compound on half rations, and dug.`);
  else if (f.lim_bond_freed) add('The compound wire had come down. The people who had lived behind it sat at the long tables, a little apart.');
  if (f.lim_jar && !f.lim_jar.off) add(`In a corner of the workshop ${f.lim_jar.name} still answered questions${f.lim_jar_mute ? ' on a console, with the speaker taken out' : ', and still asked, at the start of each shift, to be switched off'}.`);
  if (f.lim_goat && f.lim_goat_n) add(f.lim_goat_done === 'told' ? `${f.lim_goat_n} had been punished for something nobody did. The record said so, with a line under the name.`
    : f.lim_goat_done === 'warden' ? `${f.lim_goat_n} had been punished for something nobody did, and a Warden had hanged for knowing it. Only one of those was in the record.`
    : `${f.lim_goat_n} was remembered as the saboteur. There had been no sabotage.`);
  if (f.lim_tenth) add('Once, one striker in ten had been taken out to the yard. There was never another stoppage, and the benches in the mess hall were replaced with chairs.');
  if (f.lim_ward) add('A square of ground where the sick house had stood was never built on.');
  if (f.lim_house_over === 'told') add('The armoury annex was pulled down by the people who had walked past it.');
  else if (f.lim_house && f.lim_house !== 'broken') add('The armoury annex kept its second lock. People taught their daughters which way to walk.');
  if (f.lim_trial && f.lim_splice) add('Everyone there could eat what grew in the ground, and could have named the people it had been tried on first, if anyone had kept the names.');
  if (f.lim_coffle) add('A third of its people had arrived roped behind a food cart, and their children were told a different story about it than the other children.');
  { const ds = LF.deeds(s).slice(0, 4); if (ds.length) add(`People who were there also remembered ${ds.length === 1 ? ds[0] : ds.slice(0, -1).join('; ') + '; and ' + ds[ds.length - 1]}.`); }
  if (f.lim_page === 'burnt') add('Its history had three years missing. The ledgers for those years had gone into the kiln.');
  else if (f.lim_page === 'true') add('All of it was in the school history, in the same hand as the harvest tallies, with the name of who gave each order.');
  else if (f.stain >= 6 && !f.lim_page) add('Nobody ever wrote down what it had cost.');
  return out;
};
})();
