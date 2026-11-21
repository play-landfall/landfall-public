/* Landfall: which sound goes with what. UI only; reads state, never changes it, never draws on s.rng.
   Two layers, both played through js/music.js under the same switch as the music and well below it:
   - a bed: a quiet seamless loop for where the colony is (the ship until the lander is down, then the world's own
     ambience; a low drone instead while the star is dark), crossfaded slowly when it changes;
   - a card sound: one short sound as a decision comes up, chosen by the card (its id, then its group, then the
     kind of thing a generated frame is about). Many cards have none, on purpose.
   The files are sfx/<name>_<n>.mp3 (tools/sfx_el.py); GAIN evens them out (tools/sfx-levels.html measures it). */
(function () {
  // how many takes of each sound there are (tools/sfx_el.py SOUNDS)
  const N = { slow_heart: 1, barred_row: 1, yard_wait: 1, sabotage: 1, cryo_queue: 1, walk_out: 1, standoff: 1, long_night: 1, brawl: 1, night_council: 1, short_straw: 1, empty_chair: 1,
    bed_ship: 2, bed_barren: 2, bed_ruin: 2, bed_ice: 2, bed_drowned: 2, bed_jungle: 2, bed_garden: 2, bed_dark: 2,
    crowd_angry: 2, council: 2, trial: 1, funeral: 2, grave: 1, whisper: 2, sob: 1, cheer: 1, feast: 1, baby: 1, hymn: 1, chant: 1,
    footsteps: 2, snow_steps: 1, papers: 1, keys: 1, door: 1, chains: 1, kitchen: 1, cold_room: 1, empty_bins: 1, grain: 1, piano: 1,
    campfire: 1, clinic: 2, garden: 2, workshop: 2, build: 1, breakdown: 1, alarm: 1, cryo: 1, console: 2, mind: 2, hull_hit: 1, radar: 1,
    lander_up: 1, lander_down: 1, rover: 1, water: 1, radio: 2, beacon: 1, geiger: 1, hiss: 2, roar: 2, calls: 2, swarm: 1,
    feeding: 1, sea_beast: 1, creep: 2, spores: 1, drums: 2, underground: 2, pulse: 1, energy: 2, discharge: 1, machine_wake: 1,
    ice_storm: 1, rain: 1, gale: 1, dust: 1, meteor: 1, thaw: 1, flood: 1, fire: 1, blast: 1, shots: 2, collapse: 1, wind: 1,
    scale: 2, thin_mess: 1, pot: 1, ward_door: 1, slump: 1, mess_floor: 1, four_things: 1, refusal: 1, scale_yard: 1, two_lists: 1,
    bone_pit: 1, drag_marks: 1, warren: 1, prisoner: 1, gate_plea: 1, questioning: 1, wire_raid: 1, gate_bars: 1, hill_plan: 1, feral_young: 1, silent_crowd: 1, dead_hill: 1, flat_stone: 1,
    plate_crumble: 1, bolt_ring: 1, housing_scrape: 1, wire_brush: 1, cart_creak: 1, hot_wire: 1, duct_fan: 1, warm_jar: 1, weld_seam: 1, kettle_empty: 1, hum_round: 1, lamp_shutter: 1,
    sleep_lathe: 1, night_shift: 1, night_frame: 1, sleep_desk: 1, bunk_move: 1, relay_tick: 1, woken_press: 1, fourth_hour: 1, barred_door: 1, sleepwalk: 1, empty_shop: 1, roster_print: 1,
    trap_line: 1, spines: 1, jars: 1, bag: 1, wire_night: 1, seed_walk: 1, bearings: 1, three_ways: 1, black_ground: 1, open_gate: 1, far_beds: 1, tally_board: 1, two_orders: 1,
    schoolyard: 1, incubator: 1, recital: 1, row_court: 1,
    child_question: 1, newborn: 1, ship_fall: 1, white_sun: 1, ground_goes: 1, second_ship: 1, wont_wake: 1, yard_sitdown: 1, core_climb: 1, everything_walks: 1, no_thaw: 1, back_gate: 1,
    watering: 1, well_dig: 1, stove_roar: 1, boats_launch: 1,
    lab_hum: 1, tower_bell: 1,
    moon_watch: 1, chalk_door: 1, shutters_up: 1,
    low_hum: 1, drum_trace: 1,
    cradle_rock: 1, centrifuge: 1, nursery_row: 1,
    friend_listen: 1, chalk_tally: 1, lamp_ring: 1,
    pod_strike: 1, ship_voice: 1, power_down: 1,
    refuel: 1, tool_switch: 1, shift_bell: 1, survey_stakes: 1, long_party: 1,
    supper: 1, flight_deck: 1, bandage: 1 };
  // sounds that build (crowds, hums, weather): a long fade in rather than a start
  const SWELL = new Set(['flight_deck', 'supper', 'friend_listen', 'lamp_ring', 'nursery_row', 'moon_watch', 'schoolyard', 'recital', 'row_court', 'incubator', 'ship_fall', 'white_sun', 'ground_goes', 'second_ship', 'wont_wake', 'yard_sitdown', 'core_climb', 'everything_walks', 'no_thaw', 'crowd_angry', 'council', 'funeral', 'hymn', 'chant', 'drums', 'energy', 'pulse', 'ice_storm', 'rain', 'gale',
    'dust', 'swarm', 'calls', 'underground', 'radio', 'beacon', 'wind', 'flood', 'creep', 'feast', 'campfire', 'cold_room', 'water', 'warren', 'silent_crowd', 'dead_hill', 'feral_young', 'thin_mess', 'mess_floor', 'scale_yard', 'pot', 'relay_tick', 'sleepwalk', 'barred_door', 'empty_shop', 'bag', 'wire_night', 'black_ground', 'tally_board', 'two_orders']);
  // per-file loudness correction, from tools/sfx-levels.html (1 = as loud as the music)
  const GAIN = {
    supper_1: 1.54, flight_deck_1: 0.87, bandage_1: 0.35,   // the voyage out, measured with ffmpeg the way sfx-levels.html does it (2026-11-17)
    refuel_1: 0.33, tool_switch_1: 1.94, shift_bell_1: 0.42, survey_stakes_1: 0.57, long_party_1: 2.07,   // Tranche 2 orders, measured with ffmpeg the way sfx-levels.html does it
    schoolyard_1: 0.53, incubator_1: 4.89, recital_1: 2.17, row_court_1: 1.76,
    cart_creak_1: 0.53, hot_wire_1: 5.53,
    cradle_rock_1: 8, centrifuge_1: 0.68, nursery_row_1: 1.01,   // Not Mine (WO-9), measured with ffmpeg the way sfx-levels.html does it
    child_question_1: 0.25, newborn_1: 0.3, ship_fall_1: 0.27, white_sun_1: 1.7, ground_goes_1: 1.2, second_ship_1: 0.7, wont_wake_1: 0.47, yard_sitdown_1: 3.94,
    core_climb_1: 0.25, everything_walks_1: 0.51, no_thaw_1: 2.38, back_gate_1: 0.25,
    watering_1: 0.28, well_dig_1: 0.42, stove_roar_1: 0.25, boats_launch_1: 0.41,
    lab_hum_1: 0.51, tower_bell_1: 0.32,
    moon_watch_1: 7.83, chalk_door_1: 6.47, shutters_up_1: 0.29,   // the Red Month, measured with ffmpeg the way sfx-levels.html does it (2026-11-16)   // measured with ffmpeg the way sfx-levels.html does it (2026-11-16)
    friend_listen_1: 3.94, chalk_tally_1: 1.67, lamp_ring_1: 2.01,   // the Friend (WO-8), measured with ffmpeg the way sfx-levels.html does it   // measured with ffmpeg the way sfx-levels.html does it (2026-11-16)
    pod_strike_1: 0.25, ship_voice_1: 0.25, power_down_1: 0.25,   // Standing Orders (WO-7), measured with ffmpeg the same way   // measured with ffmpeg the way sfx-levels.html does it (2026-11-16)
    sabotage_1: 0.25, cryo_queue_1: 0.46, walk_out_1: 0.3, standoff_1: 3.45, long_night_1: 8, brawl_1: 0.25, night_council_1: 0.25, short_straw_1: 0.44, empty_chair_1: 0.35,
    bed_ship_1: 1.1, bed_ship_2: 1.46, bed_barren_1: 1.69, bed_barren_2: 5.43, bed_ruin_1: 0.38, bed_ruin_2: 0.84, bed_ice_1: 0.42, bed_ice_2: 0.47,
    bed_drowned_1: 2.33, bed_drowned_2: 0.46, bed_jungle_1: 2.32, bed_jungle_2: 2.47, bed_garden_1: 0.88, bed_garden_2: 1, bed_dark_1: 0.44, bed_dark_2: 0.88,
    crowd_angry_1: 0.35, crowd_angry_2: 0.68, council_1: 2.03, council_2: 5.78, trial_1: 0.35, funeral_1: 1.15, funeral_2: 1.09, grave_1: 3.82,
    whisper_1: 2.56, whisper_2: 2.13, sob_1: 1.37, cheer_1: 0.61, feast_1: 0.5, baby_1: 0.37, hymn_1: 2.93, chant_1: 0.52,
    footsteps_1: 1.22, footsteps_2: 0.9, snow_steps_1: 2.47, papers_1: 6.06, keys_1: 1.63, door_1: 1.16, chains_1: 0.7, kitchen_1: 0.58,
    cold_room_1: 0.43, empty_bins_1: 0.62, grain_1: 0.86, piano_1: 2.58, campfire_1: 7.19, clinic_1: 0.47, clinic_2: 7.24, garden_1: 0.9,
    garden_2: 1.21, workshop_1: 0.52, workshop_2: 0.63, build_1: 0.4, breakdown_1: 0.34, alarm_1: 0.26, cryo_1: 3.13, console_1: 0.42,
    console_2: 0.37, mind_1: 0.71, mind_2: 0.27, hull_hit_1: 1.33, radar_1: 0.51, lander_up_1: 0.25, lander_down_1: 0.25, rover_1: 0.26,
    water_1: 0.75, radio_1: 0.59, radio_2: 1.52, beacon_1: 0.26, geiger_1: 0.47, hiss_1: 0.47, hiss_2: 1.94, roar_1: 0.6,
    roar_2: 0.25, calls_1: 0.81, calls_2: 0.38, swarm_1: 0.84, feeding_1: 3.98, sea_beast_1: 0.44, creep_1: 3.39, creep_2: 1.11,
    spores_1: 6.38, drums_1: 0.94, drums_2: 0.25, underground_1: 3.84, underground_2: 0.44, pulse_1: 0.33, energy_1: 0.4, energy_2: 0.44,
    discharge_1: 0.61, machine_wake_1: 0.33, ice_storm_1: 0.71, rain_1: 1.02, gale_1: 0.27, dust_1: 0.93, meteor_1: 0.25, thaw_1: 1.21,
    flood_1: 0.77, fire_1: 0.27, blast_1: 0.35, shots_1: 3.71, shots_2: 0.3, collapse_1: 0.56, wind_1: 2.32,
    scale_1: 1.06, scale_2: 0.33, thin_mess_1: 0.73, pot_1: 0.55, ward_door_1: 0.25, slump_1: 0.39, mess_floor_1: 0.61, four_things_1: 2.76,
    refusal_1: 0.85, scale_yard_1: 0.63, two_lists_1: 2.17,
    slow_heart_1: 2.77, barred_row_1: 0.25, yard_wait_1: 2.86,
    bone_pit_1: 0.42, drag_marks_1: 0.65, warren_1: 0.75, prisoner_1: 0.38, gate_plea_1: 1.26, questioning_1: 0.78, wire_raid_1: 0.25, gate_bars_1: 1.54,
    hill_plan_1: 0.7, feral_young_1: 5.07, silent_crowd_1: 0.61, dead_hill_1: 2.84, flat_stone_1: 0.7,
    plate_crumble_1: 3.13, bolt_ring_1: 0.42, housing_scrape_1: 0.34, wire_brush_1: 0.42, duct_fan_1: 1.11, warm_jar_1: 6.29, weld_seam_1: 0.37, kettle_empty_1: 3.3, hum_round_1: 1.1, lamp_shutter_1: 1.42, low_hum_1: 2.15, drum_trace_1: 1.87,
    sleep_lathe_1: 0.84, night_shift_1: 0.25, night_frame_1: 1.32, sleep_desk_1: 1.09, bunk_move_1: 0.25, relay_tick_1: 8, woken_press_1: 0.25, fourth_hour_1: 8,
    barred_door_1: 0.75, sleepwalk_1: 2.16, empty_shop_1: 0.25, roster_print_1: 3.08,
    trap_line_1: 1.19, spines_1: 0.42, jars_1: 2.68, bag_1: 0.25, wire_night_1: 0.52, seed_walk_1: 0.32, bearings_1: 1.37, three_ways_1: 0.37, black_ground_1: 0.5,
    open_gate_1: 0.57, far_beds_1: 3.25, tally_board_1: 2.42, two_orders_1: 4.61 };


  // cards by id (exact), then by the group before the dot
  const ID = {
    // the voyage out (js/content-social.js): the wardroom supper, a second pair of hands, the flight deck at night
    'soc.jar': 'supper', 'soc.grace': 'supper', 'soc.names': 'supper', 'soc.coffee': 'supper', 'soc.door': 'supper', 'soc.line': 'supper',
    'soc.mould': 'clinic', 'soc.racks': 'garden', 'soc.broth': 'clinic', 'soc.dressing': 'bandage', 'soc.sap': 'workshop', 'soc.stores': 'keys',
    'soc.lights': 'flight_deck', 'soc.count': 'flight_deck', 'soc.sky': 'flight_deck', 'soc.scar': 'flight_deck', 'soc.stones': 'flight_deck', 'soc.cold': 'flight_deck',
    'arrive.name': 'console', 'land.eulogy': 'funeral',
    'crops.blight': 'creep', 'crops.seedvault': 'cold_room', 'crops.assay': 'papers',
    'mach.reactor': 'alarm', 'mach.cannibal': 'breakdown', 'mach.lander': 'lander_up', 'mach.biofilm': 'water',
    'sleep.manifest': 'papers', 'sleep.lights': 'radar',
    'state.famine': 'empty_bins', 'state.unrest': 'crowd_angry',
    'pol.rations': 'empty_bins', 'pol.theft': 'crowd_angry', 'pol.charter': 'council', 'pol.burial': 'grave', 'pol.faith': 'hymn',
    'pol.schism': 'crowd_angry', 'pol.daughter': 'fire', 'pol.accident': 'collapse', 'pol.accident2': 'collapse', 'pol.births': 'child_question',
    'pol.mutiny': 'crowd_angry',
    'fer.midden': 'grave', 'fer.gone': 'footsteps', 'fer.warren': 'underground', 'fer.caught': 'chains', 'fer.woke': 'sob', 'fer.ask': 'whisper', 'fer.raid': 'alarm',
    'fer.ours': 'calls', 'fer.choice': 'night_council', 'fer.young': 'wind', 'fer.lean': 'standoff', 'fer.truth': 'papers',
    'dw.first': 'trap_line', 'dw.fields': 'spines', 'dw.bench': 'jars', 'dw.hater': 'bag', 'dw.wall': 'wire_night', 'dw.walker': 'seed_walk', 'dw.place': 'bearings',
    'dw.choice': 'three_ways', 'dw.ash': 'black_ground', 'dw.open': 'open_gate', 'dw.siege': 'far_beds', 'dw.truth': 'tally_board',
    'wst.scales': 'scale', 'wst.well': 'thin_mess', 'wst.pot': 'pot', 'wst.open': 'ward_door', 'wst.chair': 'slump', 'wst.night': 'mess_floor',
    'wst.choice': 'four_things', 'wst.refuse': 'refusal', 'wst.weigh': 'scale', 'wst.scale': 'scale', 'wst.truth': 'scale_yard',
    'fer.midden': 'bone_pit', 'fer.gone': 'drag_marks', 'fer.warren': 'warren', 'fer.caught': 'prisoner', 'fer.woke': 'gate_plea', 'fer.ask': 'questioning', 'fer.raid': 'wire_raid',
    'fer.ours': 'gate_bars', 'fer.choice': 'hill_plan', 'fer.young': 'feral_young', 'fer.lean': 'silent_crowd', 'fer.truth': 'dead_hill',
    'hu.first': 'footsteps', 'hu.wire': 'wire_night', 'hu.seen': 'whisper', 'hu.roof': 'bunk_move', 'hu.trap': 'trap_line', 'hu.out': 'gate_bars', 'hu.two': 'night_council',
    'bt.cart': 'cart_creak', 'bt.wrong': 'thin_mess', 'bt.test': 'hot_wire', 'bt.refuse': 'refusal', 'bt.cold': 'cold_room', 'bt.second': 'two_lists', 'bt.fight': 'standoff',
    'bt.officer': 'clinic', 'bt.night': 'night_council', 'bt.out': 'gate_plea', 'bt.truth': 'papers',
    'rm.first': 'moon_watch', 'rm.date': 'chalk_door', 'rm.watch': 'wind', 'rm.after': 'wont_wake', 'rm.ward': 'ward_door', 'rm.out': 'standoff', 'rm.said': 'whisper',
    'rm.eyes': 'clinic', 'rm.before': 'shutters_up', 'rm.holds': 'night_council', 'rm.truth': 'papers',
    'qk.first': 'child_question', 'qk.scan': 'slow_heart', 'qk.well': 'build', 'qk.door': 'barred_row', 'qk.source': 'jars', 'qk.kin': 'papers', 'qk.hall': 'night_council',
    'qk.one': 'ward_door', 'qk.term': 'yard_wait', 'qk.rest': 'clinic', 'qk.truth': 'empty_chair', 'tg.vigil': 'silent_crowd', 'tg.carriers': 'two_lists',
    'nm.first': 'cradle_rock', 'nm.second': 'sob', 'nm.book': 'papers', 'nm.midwives': 'questioning', 'nm.nursery': 'nursery_row', 'nm.test': 'centrifuge', 'nm.cradle': 'baby',
    'nm.gate': 'gate_bars', 'nm.reckon': 'crowd_angry', 'nm.step': 'newborn', 'nm.truth': 'whisper',
    'hu.choice': 'barred_door', 'hu.ash': 'black_ground', 'hu.last': 'long_night', 'hu.truth': 'empty_shop', 'tg.noon': 'far_beds',
    'vo.first': 'calls', 'vo.names': 'calls', 'vo.gone': 'footsteps', 'vo.tape': 'radio', 'vo.hall': 'calls', 'vo.two': 'shots', 'vo.inside': 'trial',
    'vo.bill': 'crowd_angry', 'vo.back': 'wind', 'vo.truth': 'papers',
    'sd.dreams': 'sleep_lathe', 'sd.shift': 'night_shift', 'sd.frame': 'night_frame', 'sd.own': 'sleep_desk', 'sd.join': 'bunk_move', 'sd.relay': 'relay_tick', 'sd.woken': 'woken_press', 'sd.night': 'fourth_hour',
    'sd.doors': 'barred_door', 'sd.whole': 'sleepwalk', 'sd.truth': 'empty_shop',
    'rst.plate': 'plate_crumble', 'rst.racks': 'workshop', 'rst.bench': 'jars', 'rst.spares': 'empty_bins', 'rst.bolts': 'bolt_ring', 'rst.housing': 'housing_scrape', 'rst.hands': 'questioning', 'rst.ship': 'radio',
    'rst.out': 'gate_bars', 'rst.choice': 'night_council', 'rst.gives': 'wire_brush', 'rst.truth': 'empty_shop',
    'smp.dish': 'jars', 'smp.sleeve': 'clinic', 'smp.pod': 'creep', 'smp.ducts': 'duct_fan', 'smp.culture': 'warm_jar', 'smp.water': 'water', 'smp.reached': 'ward_door',
    'smp.choice': 'night_council', 'smp.door': 'weld_seam', 'smp.after': 'cold_room', 'smp.truth': 'empty_shop',
    'inf.teeth': 'low_hum', 'inf.blood': 'clinic', 'inf.needle': 'drum_trace', 'inf.lost': 'sob', 'inf.facing': 'wind', 'inf.worst': 'sleepwalk', 'inf.reactor': 'energy',
    'inf.shaft': 'blast', 'inf.leave': 'cart_creak', 'inf.road': 'campfire', 'inf.still': 'cold_room', 'inf.truth': 'empty_shop',
    'so.lander': 'console', 'so.pod': 'pod_strike', 'so.voice': 'ship_voice', 'so.aboard': 'radio', 'so.banks': 'power_down', 'so.list': 'ship_voice', 'so.strike': 'pod_strike',
    'so.console': 'console', 'so.choice': 'night_council', 'so.after': 'tally_board', 'so.truth': 'empty_shop',
    'kid.draw': 'papers', 'kid.wire': 'wind', 'kid.knows': 'whisper', 'kid.thread': 'clinic', 'kid.night': 'chant', 'kid.lock': 'chains', 'kid.hidden': 'crowd_angry',
    'kid.order': 'keys', 'kid.eve': 'whisper', 'kid.truth': 'papers', 'kid.grave': 'grave',
    'q.feud': 'whisper', 'q.wedding': 'cheer', 'q.earth': 'radio', 'q.walkabout': 'wind', 'q.firstborn': 'newborn', 'q.memorial': 'funeral',
    'q.handover': 'council',
    'bld.find': 'wind', 'bld.wake': 'machine_wake', 'bld.offer': 'discharge', 'bld.finish': 'machine_wake', 'bld.dream': 'energy',
    'bld.hum': 'energy', 'bld.warm': 'energy',
    'oth.signal': 'radio', 'oth.contact': 'footsteps', 'oth.demand': 'crowd_angry', 'oth.raid': 'shots', 'oth.story': 'campfire',
    'oth.carts': 'footsteps', 'oth.terms': 'council', 'oth.kin': 'council',
    'flare.warn': 'geiger', 'flare.strike': 'geiger', 'flare.super': 'geiger',
    'winter.warn': 'wind', 'winter.strike': 'ice_storm', 'winter.long': 'ice_storm',
    'storm.warn': 'wind', 'storm.strike': 'rain', 'storm.surge': 'gale',
    'plan.seeds': 'garden', 'plan.sprout': 'garden', 'plan.water': 'water', 'plan.housed': 'keys', 'plan.surplus': 'grain', 'plan.harvest': 'grain',
    'plan.ladle': 'feast', 'plan.sleepers': 'cryo', 'plan.prospect': 'rover',
    // the first season by world (content-season.js)
    'ssn.dry': 'dust', 'ssn.wet': 'watering', 'ssn.dig': 'well_dig', 'ssn.cold': 'wind', 'ssn.glass': 'garden', 'ssn.fuel': 'stove_roar',
    'ssn.weed': 'garden', 'ssn.tangle': 'creep', 'ssn.green': 'empty_bins', 'ssn.tide': 'boats_launch', 'ssn.catch': 'kitchen', 'ssn.reef': 'sea_beast',
    'aft.blame': 'crowd_angry', 'aft.gift': 'wind', 'aft.beds': 'clinic', 'aft.carcass': 'feeding', 'aft.cutting': 'creep',
    'aft.warm': 'feeding', 'aft.captive': 'hiss', 'aft.find': 'energy',
    'eat.graves': 'grave', 'eat.circle': 'kitchen', 'eat.missing': 'footsteps', 'eat.shakes': 'clinic', 'knf.cut': 'workshop', 'knf.note': 'papers', 'knf.strike': 'alarm', 'knf.hand': 'trial', 'col.two': 'crowd_angry',
    // the quiet ship and humanity (2026-11-16)
    'qs.silent': 'radio', 'qs.board': 'hull_hit', 'qs.two': 'whisper', 'qs.tell': 'footsteps',
    'qs.deep': 'creep', 'qs.walk': 'hull_hit', 'qs.count': 'slow_heart', 'qs.cups': 'kitchen', 'qs.late': 'radio', 'qs.blame': 'whisper', 'qs.answer': 'ship_voice', 'qs.kettle': 'kettle_empty', 'qs.collar': 'door', 'qs.ridge': 'moon_watch', 'qs.kin': 'crowd_angry', 'qs.nest': 'warren', 'qs.tune': 'hum_round', 'qs.keeper': 'ship_voice', 'qs.salvage': 'workshop', 'qs.fall': 'ship_fall', 'qs.lights': 'beacon', 'qs.second': 'radar', 'qs.air': 'cryo', 'qs.glass': 'ward_door', 'qs.guests': 'second_ship',
    'hum.numbers': 'papers', 'hum.game': 'calls', 'hum.penance': 'hymn', 'hum.pen': 'chains', 'hum.decent': 'crowd_angry', 'hum.tribute': 'drums', 'hum.record': 'console',
    // the Long Years, officers out of the chair and the standing order (2026-11-17)
    'late.fall': 'ship_fall', 'late.sun': 'white_sun', 'late.ground': 'ground_goes', 'late.fleet': 'second_ship', 'late.sleep': 'wont_wake', 'late.born': 'yard_sitdown', 'late.core': 'core_climb', 'late.tide': 'everything_walks',
    'late.winter': 'no_thaw', 'late.risen': 'back_gate', 'off.stranded': 'radio', 'off.relieve': 'keys', 'order.standing': 'papers',
    // the generations (2026-11-18): the empty cradles, the made children, the ones born here
    'fr.name': 'schoolyard', 'fr.dig': 'well_dig', 'fr.spring': 'whisper', 'fr.school': 'recital', 'fr.ear': 'friend_listen', 'fr.place': 'wire_night', 'fr.ask': 'silent_crowd',
    'fr.choice': 'night_council', 'fr.after': 'chalk_tally', 'fr.truth': 'lamp_ring',
    'gen.empty': 'clinic', 'gen.duty': 'roster_print', 'gen.refuser': 'keys', 'gen.roster6': 'schoolyard', 'gen.rosterage': 'crowd_angry', 'gen.bank': 'incubator', 'gen.tank6': 'child_question', 'gen.tankage': 'council',
    'gen.made': 'workshop', 'made.ask': 'recital', 'made.hurt': 'breakdown', 'made.six': 'night_shift', 'made.grown': 'papers', 'made.same': 'sob', 'made.more': 'sleep_lathe',
    'gen.grave': 'grave', 'gen.school': 'schoolyard', 'gen.strange': 'row_court', 'gen.adapt': 'clinic', 'gen.wire': 'tally_board', 'gen.outside': 'footsteps', 'gen.ofage': 'build', 'gen.lines': 'papers',
    'gen.vote': 'council', 'gen.rules': 'far_beds', 'gen.count': 'two_lists', 'gen.chair': 'empty_chair', 'gen.inherit': 'keys', 'gen.earth': 'console',
    'gen.minders': 'schoolyard', 'gen.packs': 'row_court', 'gen.mouths': 'thin_mess', 'gen.fever': 'clinic', 'gen.class': 'yard_sitdown', 'gen.elders': 'scale_yard', 'gen.last': 'grave',
    'off.promote': 'empty_chair', 'ebb.sand': 'sabotage', 'ebb.sleep': 'cryo_queue', 'ebb.walk': 'walk_out', 'ebb.walkers': 'standoff', 'ebb.night': 'long_night', 'ebb.knives': 'brawl', 'ebb.ways': 'night_council', 'ebb.rite': 'short_straw',
    'tg.holdfire': 'two_orders', 'tg.pending': 'roster_print', 'tg.three': 'alarm', 'tg.bothlists': 'two_lists', 'tg.after': 'funeral', 'tg.samevoice': 'radio', 'tg.penfeeds': 'grave', 'tg.knifelist': 'papers', 'tg.powers': 'trial', 'tg.sign': 'chant', 'tg.itknew': 'console', 'tg.roster': 'roster_print', 'tg.theysee': 'drums', 'tg.sametable': 'flat_stone',
    // the settlements and the Hush (js/settlements.js, js/thread-hush.js, 2026-11-18): sounds already on disk
    // buildings that matter (js/content-builds.js, WO-3)
    'bu.nolab': 'jars', 'bu.lab': 'lab_hum', 'bu.nocomms': 'radio', 'bu.comms': 'relay_tick', 'bu.nocan': 'empty_bins', 'bu.can': 'pot',
    'bu.nowatch': 'wire_night', 'bu.watch': 'tower_bell', 'bu.nohall': 'mess_floor', 'bu.hall': 'council',
    'stl.found': 'build', 'stl.who': 'short_straw', 'stl.council': 'council', 'stl.share': 'empty_bins', 'stl.watch': 'wire_night',
    'hsh.first': 'relay_tick', 'hsh.empty': 'empty_shop', 'hsh.calling': 'radio', 'hsh.log': 'roster_print', 'hsh.walker': 'gate_plea', 'hsh.second': 'two_lists',
    'hsh.choice': 'night_council', 'hsh.crowd': 'mess_floor', 'hsh.near': 'gate_bars', 'hsh.truth': 'dead_hill',
    'seat.down': 'console', 'ship.cargo': 'machine_wake',   // asked before the drop: no landing sound yet (Lachlan, 2026-11-16)
     'ship.orbit': 'alarm', 'ship.cabin': 'whisper', 'ship.pods': 'cryo', 'ship.dry': 'hiss', 'setup.load': 'machine_wake', 'setup.wake1': 'cryo', 'off.break': 'whisper', 'off.sick': 'clinic',
    'voy.cryo': 'cryo', 'voy.patch': 'workshop', 'voy.bearing': 'console', 'voy.mould': 'creep', 'voy.pursuit': 'radar',
    'voy.drift': 'console', 'voy.wake': 'cryo', 'voy.rock': 'hull_hit', 'voy.fab': 'workshop',
    'voy.fire': 'fire', 'voy.count': 'empty_bins', 'voy.spine': 'alarm', 'voy.sick': 'clinic', 'voy.dust': 'hull_hit', 'voy.dead': 'cold_room',
    'voy.scram': 'alarm', 'voy.vault': 'cold_room', 'voy.array': 'radar', 'voy.hold': 'door', 'voy.pass': 'console',   // five more incidents (2026-11-21): sounds already on disk
    'op.melt': 'thaw', 'op.film': 'creep', 'op.tide': 'sea_beast', 'op.dust': 'dust', 'op.spread': 'wind', 'op.pad': 'underground',
    'op.shard': 'energy', 'op.thaw': 'thaw', 'op.grey': 'creep', 'op.burn': 'lander_up', 'op.listen': 'radio', 'op.sky': 'console',
    'op.plan': 'council', 'op.ground': 'wind', 'op.broken': 'breakdown', 'op.flight': 'lander_up', 'op.key': 'keys', 'op.herd': 'cold_room',
    'op.lessons': 'campfire', 'op.spares': 'workshop', 'op.ward': 'clinic', 'op.lathe': 'workshop', 'op.trays': 'garden',
    'op.rover': 'rover', 'op.fuel': 'lander_up', 'op.yard': 'build', 'op.racks': 'garden', 'op.rations': 'empty_bins',
    'op.mast': 'radio', 'op.piano': 'piano', 'op.samples': 'papers', 'op.camp': 'build',
    'psg.walk': 'footsteps', 'psg.blame': 'crowd_angry', 'psg.tape': 'radio', 'psg.table': 'feast', 'psg.cure': 'clinic',
    'drk.minutes': 'console', 'drk.before': 'papers', 'drk.number': 'console', 'drk.told': 'council', 'drk.noon': 'wind', 'drk.count': 'cold_room', 'drk.rooms': 'door',
    'plan.year': 'council', 'x.wrong': 'crowd_angry', 'seed.held': 'whisper',
    'drk.lamps': 'campfire', 'drk.out': 'calls', 'drk.dawn': 'wind',
    'ch.second': 'cryo', 'ch.list': 'papers', 'ch.trial': 'trial', 'ch.night': 'keys', 'ch.hold': 'keys', 'ch.extend': 'papers',
    'ch.lists': 'papers', 'ch.powers': 'crowd_angry',
    'ep.equation': 'empty_bins', 'ep.hours': 'pulse', 'ep.guest': 'footsteps', 'ep.cure': 'clinic', 'ep.dreams': 'whisper', 'ep.vigil': 'campfire',
    'wk.pulse': 'pulse', 'wk.door': 'machine_wake', 'wk.switch': 'discharge', 'wk.tenants': 'hiss', 'wk.heat': 'underground',
    'wk.back': 'footsteps', 'wk.done': 'machine_wake',
    'web.sprung': 'roar',
    'ob.find': 'wind', 'ob.log': 'papers', 'ob.graves': 'grave', 'ob.heir': 'footsteps', 'ob.end': 'wind',
    'nb.split': 'campfire', 'nb.reckon': 'campfire', 'nb.between': 'chant',
    'os.orders': 'radio', 'os.mole': 'whisper', 'os.over': 'shots', 'os.wedding': 'cheer', 'os.need': 'council',
    'hg.blame': 'crowd_angry',
    'dm.reply': 'radio', 'dm.hard': 'shots',
    'tw.drip': 'thaw', 'tw.flood': 'flood', 'tw.held': 'hiss', 'tw.green': 'creep',
    'lie.odd': 'papers', 'lie.keeper': 'whisper', 'lie.truth': 'whisper', 'lie.talk': 'whisper', 'lie.out': 'crowd_angry', 'lie.files': 'papers', 'lie.waker': 'cryo', 'lie.plan': 'beacon',
    'bg.edit': 'clinic', 'bg.wire': 'footsteps', 'bg.price': 'sob', 'bg.tables': 'feast',
    'zone.back': 'footsteps', 'zone.take': 'energy', 'zone.edge': 'wind', 'ret.shed': 'whisper', 'ret.again': 'footsteps',
    'cong.first': 'hymn', 'cong.again': 'hymn', 'cong.ask': 'hymn', 'cong.split': 'crowd_angry',
    'body.found': 'sob', 'body.locked': 'whisper', 'body.truth': 'trial', 'body.blame': 'crowd_angry',
    'wc.find': 'garden', 'wc.eat': 'feeding', 'wc.turn': 'creep',
    'fall.scar': 'wind', 'fall.streaks': 'meteor', 'fall.night': 'meteor', 'fall.roofs': 'whisper', 'fall.after': 'workshop',
    'fl.turn': 'spores', 'fl.mid': 'spores',
    'x.drawn': 'calls', 'x.which': 'council', 'x.spreads': 'clinic', 'x.withers': 'creep', 'aft.press': 'shots', 'x.shelter': 'campfire', 'x.offer': 'council', 'x.gate': 'alarm', 'x.favour': 'sob', 'x.settle': 'council',
    'x.question': 'council', 'seed.exile': 'footsteps', 'seed.spared': 'footsteps',
    'und.keeps': 'underground', 'und.under': 'underground', 'und.trial': 'garden',
    'hive.knots': 'drums', 'hive.lean': 'drums', 'hive.raid': 'shots', 'hive.raid2': 'blast', 'hive.sick': 'clinic', 'hive.after': 'wind',
    'lim.count': 'empty_bins', 'lim.meat': 'cold_room', 'lim.stew': 'kitchen', 'lim.straws': 'whisper', 'lim.larder': 'cold_room',
    'lim.taste': 'feast', 'lim.edible': 'kitchen', 'lim.mouths': 'empty_bins', 'lim.bond': 'chains', 'lim.compound': 'chains',
    'lim.harness': 'chains', 'lim.harness2': 'chains', 'lim.harness3': 'chains', 'lim.jar': 'sob', 'lim.jar2': 'sob', 'lim.small': 'sob',
    'lim.roster': 'papers', 'lim.splice': 'papers', 'lim.goat': 'crowd_angry', 'lim.sheet': 'papers', 'lim.house': 'door',
    'lim.house2': 'door', 'lim.shepherd': 'cryo', 'lim.shepherd2': 'whisper', 'lim.camp': 'crowd_angry', 'lim.ward': 'door',
    'lim.born': 'baby', 'lim.born2': 'baby', 'lim.organ': 'cryo', 'lim.nest': 'papers', 'lim.coffle': 'chains', 'lim.count2': 'papers',
    'lim.refuse': 'keys', 'lim.page': 'papers',
    // generated cards that are not frames
    plan: 'council', done: 'build', away: 'footsteps',
  };
  const GROUP = {
    crops: 'garden', mach: 'workshop', sleep: 'cryo', fever: 'clinic', voy: 'console', setup: 'cryo', psg: 'whisper', drk: 'bed',
    ch: 'council', wk: 'energy', bld: 'energy', oth: 'footsteps', hive: 'drums', und: 'underground', nb: 'chant', os: 'council',
    hg: 'underground', dm: 'pulse', sm: 'mind', zone: 'energy', fl: 'creep', fall: 'meteor', web: 'calls', ob: 'wind', bg: 'creep',
    lim: 'whisper', cong: 'hymn',
    // generated frames by the kind of thing they are about
    flora: 'creep', plague: 'clinic', ruin: 'energy', natives: 'drums', humans: 'shots', faction: 'crowd_angry', echo: 'radio',
  };
  // fauna and the land sound different on each world
  const FAUNA = { barren: 'underground', ruin: 'hiss', ice: 'roar', drowned: 'sea_beast', jungle: 'swarm', garden: 'calls' };
  const LAND = { barren: 'dust', ruin: 'collapse', ice: 'ice_storm', drowned: 'flood', jungle: 'rain', garden: 'wind' };

  /* The orders (js/orders.js): every order has a sound, played when it is given. A function gets the arg. */
  const ORDER = { refuel: 'refuel', launch: 'lander_up', wake: 'cryo',
    rations: () => window.LF && LF.rationsDir < 0 ? 'thin_mess' : 'feast', hours: 'shift_bell', revoke: 'papers' };   // the Crew (T2-3): a cut or a rise of the ladle
  // the yard (T2-2): tools taken up, tools dropped and a cart turning, plate carted back, the queue chalked up
  Object.assign(ORDER, { build: 'build', switch: 'tool_switch', pause: 'tool_switch', cancel: 'cart_creak', stop: 'yard_wait', queue: 'papers', unqueue: 'papers', bqup: 'papers' });
  // past the wire (T2-5): a party leaving on foot, or packs, a cart and wind for a long one (LF.lastParty, set by the order); stakes and a chain for a survey; the signals room for the rest
  Object.assign(ORDER, { send: () => window.LF && LF.lastParty && LF.lastParty.far === 'long' ? 'long_party' : 'footsteps', survey: 'survey_stakes', recall: 'radio', redirect: 'radio' });
  const orderSound = (id, arg) => { const v = ORDER[id]; return typeof v === 'function' ? v(arg) : v || null; };
  function order(id, arg) {
    if (!window.LFMusic) return; const n = orderSound(id, arg); if (!n || !N[n]) return;
    const f = take(n); LFMusic.sfx(f, { gain: GAIN[f] || 1, swell: SWELL.has(n), card: true });
  }
  function cardSound(s) {
    const c = s.cur; if (!c || !c.id) return null;
    const n = pick(s, c);
    return n === 'footsteps' && s.world && s.world.type === 'ice' ? 'snow_steps' : n;   // on the ice, the walking is in snow
  }
  /* A party home from a dread's place (T2-5 visit hooks) sounds like what it found, keyed by the return card's own
     scene (s.cur.scene, the first of its list); anything else home from past the wire is footsteps. */
  const AWAY = { away_fer_hill: 'warren', away_smp_outfall: 'water', away_inf_crack: 'ground_goes', away_inf_stakes: 'low_hum',
    away_rm_seep: 'water', away_rm_line: 'moon_watch', away_bt_scav: 'slow_heart', away_bt_prints: 'drag_marks',
    away_stage: 'plate_crumble', away_circle: 'bearings', away_voices: 'calls', away_ring: 'wind', away_wild: 'pot' };
  function pick(s, c) {
    if (c.id === 'away' && c.scene) { const k = [].concat(c.scene).find(x => AWAY[x]); if (k) return AWAY[k]; }
    if (ID[c.id]) return ID[c.id];
    const g = c.id.split('.')[0], w = s.world && s.world.type;
    if (g === 'fauna') return FAUNA[w] || 'hiss';
    if (g === 'land') return LAND[w] || 'wind';
    if (g === 'cross') return FAUNA[w] || 'calls';
    const v = GROUP[g];
    return v === 'bed' ? null : v || null;   // the Dark's own cards lean on the dark bed, not a sound of their own
  }
  function bedOf(s) {
    if (!s || s.adrift || !s.world || LF.aloft(s)) return 'bed_ship';
    if (LF.cv && LF.cv(s, 'dark') >= 50) return 'bed_dark';
    return 'bed_' + s.world.type;
  }
  const file = (name, i) => `${name}_${i}`;
  const take = name => file(name, 1 + Math.floor(Math.random() * N[name]));

  let bedName = null, bedFile = null, heard = null, recent = [];
  function update(s, shown) {
    if (!window.LFMusic) return;
    const b = bedOf(s);
    if (b !== bedName) { bedName = b; bedFile = file(b, 1 + (((s && s.day) || 0) >> 7) % N[b]); }   // the take changes every few months, not on every visit
    LFMusic.bed(bedFile, GAIN[bedFile] || 1);
    // a card sound once per card, when the card itself is on screen
    const k = shown && s.cur && s.cur.phase === 'choose' ? `${s.day}:${s.cur.id}` : null;
    if (k && k !== heard) {
      heard = k;
      // A sound heard on one of the last few cards is left out, and the council's build card (about twenty a game)
      // only sometimes has one: a sound on every card stops meaning anything.
      const n = cardSound(s); if (!n || !N[n] || recent.includes(n) || (s.cur.id === 'plan' && Math.random() < 0.7)) return;
      recent = [n, ...recent].slice(0, 4);
      const f = take(n);
      LFMusic.sfx(f, { gain: GAIN[f] || 1, swell: SWELL.has(n), card: true });
    }
  }
  // a sound by name, for a move on a puzzle card (the walk: footsteps, weld_seam, creep, hiss, door)
  function play(n) { if (!window.LFMusic || !n || !N[n]) return; const f = take(n); LFMusic.sfx(f, { gain: GAIN[f] || 1, swell: SWELL.has(n), card: true }); }
  window.LFSound = { update, cardSound, bedOf, order, orderSound, play, ORDER, N, GAIN, files: () => Object.entries(N).flatMap(([n, k]) => Array.from({ length: k }, (_, i) => file(n, i + 1))) };
})();
