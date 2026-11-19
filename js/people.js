/* Landfall — notable colonists.
   Everyone in the colony has a name, but the colony only starts using it once somebody does, finds or survives
   something that matters. From then on they are a person on the roster: a deed, a perk, and the option of being
   attached to a risky choice or sent out with a party. Up to three perks; the more they have done, the more
   there is to lose. The ten officers (people with a role) live in the same list and can earn deeds too. */
(function () {
'use strict';
const { rand, ri, pick, clamp } = LF, H = LF.h;

/* ap/kind: bonus to a generated choice of that approach, or against that kind of threat. any: to every test.
   w: multipliers on what an expedition they are with comes back as. reward: on what it brings home. */
LF.PERKS = {
  pathfinder: { name: 'Pathfinder', desc: 'Parties they go with seldom vanish.', w: { silence: 0.45 } },
  survivor:   { name: 'Survivor', desc: 'Hard to kill. Parties they go with lose fewer.', w: { partial: 0.7 } },
  scavenger:  { name: 'Scavenger', desc: 'Parties they go with bring back a quarter more.', reward: 1.25 },
  medic:      { name: 'Field medic', desc: '+10% against disease. Nothing is carried home.', kind: 'plague', v: 10, w: { diseased: 0.3 } },
  speaker:    { name: 'Go-between', desc: '+10% when making terms. Strangers trust them.', ap: 'accord', v: 10, w: { stranger: 1.6, followed: 0.6 } },
  marksman:   { name: 'Dead shot', desc: '+10% when force is used.', ap: 'force', v: 10 },
  observer:   { name: 'Naturalist', desc: '+10% when studying. Finds more in the field.', ap: 'study', v: 10, w: { triumph: 1.3 } },
  fixer:      { name: 'Fixer', desc: '+10% when taking what can be used.', ap: 'exploit', v: 10 },
  steady:     { name: 'Steady hand', desc: '+5% to anything they are part of.', any: 5, w: { changed: 0.5 } },
  touched:    { name: 'Touched', desc: '+10% where ruins are concerned. Not entirely ours any more.', kind: 'ruin', v: 10, w: { changed: 1.5, triumph: 1.3 } },
  guide:      { name: 'Knows the country', desc: 'Parties they go with find the way, and find more.', w: { silence: 0.5, triumph: 1.25 } },
};
const RANKS = ['', 'Known by name', 'Veteran', 'Renowned'];
LF.rank = p => RANKS[Math.min(3, (p.deeds || []).length)];
LF.title = p => p.role ? (p.seat && p.key && LF.SEATS[p.seat] ? LF.SEATS[p.seat].lead : p.title || LF.ROLES[p.role].title) : (p.perks && p.perks.length ? LF.PERKS[p.perks[0]].name : 'Colonist');
LF.notables = s => s.people.filter(p => p.alive && !p.role);
LF.laidUp = (s, p) => !!p.hurt && p.hurt > s.day;
/* ---------- who can be sent to do what (Lachlan, 2026-11-15) ----------
   Every mission is one or more kinds of work. An officer can go on the kinds their seat knows (Command goes anywhere);
   someone known by name has a trade, from their first perk, and goes on the kinds that trade knows. The strip on a card
   offers only the people who can do some of its work, and shows their occupation, not their quirks; on each option an
   attached person only counts, and only goes, if that option is work they can do. */
LF.SKILL_WORD = { explore: 'exploring', research: 'research', fix: 'repairs', build: 'building', fight: 'fighting', talk: 'talks', heal: 'medicine', grow: 'the fields' };
LF.SEAT_SKILL = { command: ['talk'], security: ['explore', 'fight'], engineer: ['fix', 'build'], doctor: ['research', 'heal'], scientist: ['explore', 'research', 'build'], crew: ['fix', 'grow'] };
LF.TRADE = { marksman: ['Rifleman', ['fight', 'explore']], medic: ['Medic', ['heal', 'research']], fixer: ['Mechanic', ['fix', 'build']], observer: ['Surveyor', ['explore', 'research']],
  speaker: ['Envoy', ['talk']], pathfinder: ['Scout', ['explore']], guide: ['Guide', ['explore']], steady: ['Builder', ['build', 'fix']], survivor: ['Field hand', ['grow', 'explore']],
  scavenger: ['Salvager', ['fix', 'explore']], touched: ['Diviner', ['research', 'talk']] };
const officerOf = p => !!(p.seat && p.role);
LF.job = p => officerOf(p) ? LF.title(p) : (LF.TRADE[(p.perks || [])[0]] || ['Colonist'])[0];
LF.skills = p => officerOf(p) ? LF.SEAT_SKILL[p.seat] : [...new Set([].concat(...(p.perks || []).map(k => (LF.TRADE[k] || [0, []])[1])))];
LF.canDo = (p, kinds) => { if (!kinds || !kinds.length) return true; const k = LF.skills(p); return !k || kinds.some(x => k.includes(x)); };
// the work in a test: what the departments it names do, or what its approach is, or what it says (test.kind / ch.kind)
const TEST_SKILL = { security: ['fight'], engineer: ['fix', 'build'], doctor: ['heal', 'research'], scientist: ['research'], crew: ['fix', 'grow'], command: ['talk'] };   // exploring comes from a party or an approach, not from who is named
const AP_SKILL = { force: ['fight'], study: ['research', 'explore'], accord: ['talk'], exploit: ['fix', 'build'], avoid: ['explore'] };
LF.workOf = function (ap, test, send, kind) {
  let k = [].concat(kind || (test && test.kind) || []);
  if (!k.length && ap) k = AP_SKILL[ap] || [];
  if (!k.length && test) for (const m of test.mods || []) if (m.k === 'role') k = k.concat(TEST_SKILL[LF.SEAT_OF[m.role] || m.role] || []);
  if (send) k = k.concat('explore');
  return k.length ? [...new Set(k)] : (test || ap ? null : send ? ['explore'] : []);   // null: a test of no particular work, anyone may go
};
const optWork = o => LF.workOf(o.ch.ap, o.ch.test, o.ch.send || o.send, o.ch.kind);
/* What the card as a whole needs: the work of every open option that tests or sends. null: anyone. */
LF.cardWork = function (s) { if (!s.cur || s.cur.phase !== 'choose') return null; let all = [];
  for (const o of LF.choices(s)) { if (o.lock || !(o.odds || o.send)) continue; const w = optWork(o); if (w === null) return null; all = all.concat(w); }
  return all.length ? [...new Set(all)] : null; };
/* Before an option is resolved: whoever was marked but can't do that work stays behind. */
LF.fitAttach = function (s, ch) { const c = s.cur; if (!c || !c.attach || !c.attach.length) return; const w = LF.workOf(ch.ap, ch.test, ch.send, ch.kind);
  c.attach = c.attach.filter(id => { const p = H.byPid(s, id); return p && LF.canDo(p, w); }); };
/* Who can be sent in person (Lachlan, 2026-11-16): the officers only, one at a time. Someone known by name is no longer
   on the strip: they lead parties, earn deeds and can be raised to an empty chair, but they are not a bonus to spend.
   An officer who went is spent for a while after (p.spent, LF.SENT_REST): not for the next card, at the least. */
LF.SENT_REST = 2 * LF.MONTH;
LF.spent = (s, p) => !!p.spent && p.spent > s.day;
const couldGo = (s, p) => p.alive && p.seat && p.role && (s.cur && s.cur.aboard ? p.orbit : !p.orbit && !p.away && !LF.laidUp(s, p));
// A card marked alone (the voyage out, js/content-social.js) is a conversation: nobody is sent in person.
const alone = s => !!(s.cur && LF.byId[s.cur.id] && LF.byId[s.cur.id].alone);
LF.available = s => { if (LF.aloft(s) || alone(s)) return [];
  const w = s.cur && s.cur.aboard ? null : LF.cardWork(s);   // a card aboard the ship: only who is up there
  return s.people.filter(p => couldGo(s, p) && !LF.spent(s, p) && LF.canDo(p, w)); };
/* The ones who would be on the strip if they had not just been out: shown greyed, with how long. */
LF.resting = s => { if (LF.aloft(s) || alone(s)) return []; const w = s.cur && s.cur.aboard ? null : LF.cardWork(s);
  return s.people.filter(p => couldGo(s, p) && LF.spent(s, p) && LF.canDo(p, w)); };
const CAP = 10; // a small colony only has room for so many legends

/* Somebody does, finds or survives something. who: a person, or null for someone stepping out of the crowd.
   txt is a past-tense phrase that follows the name. Returns the person, or null if nobody new can emerge. */
LF.deed = function (s, who, txt, perk, chips) {
  let p = who, fresh = false;
  if (!p) { if (LF.notables(s).length >= CAP || s.pop < 14) return null; p = LF.makePerson(s, null); fresh = true; }
  if (!p.alive) return null;
  p.deeds.push({ d: s.day, txt }); p.known = p.known || s.day;
  let gained = null;
  if (perk && LF.PERKS[perk] && !p.perks.includes(perk) && p.perks.length < 3) { p.perks.push(perk); gained = perk; }
  LF.log(s, fresh ? `${p.name} ${txt}. People have started using the name.` : `${p.name} ${txt}.`, 'good');
  if (fresh) LF.chron(s, `${p.name} ${txt}.`);
  if (chips) chips.push({ t: fresh ? `${p.name}: now known by name${gained ? ' · ' + LF.PERKS[gained].name : ''}` : gained ? `${p.name}: ${LF.PERKS[gained].name}` : `${p.name}: another story`, good: true });
  return p;
};

/* ---------- attaching people to a choice ---------- */
LF.attach = function (s, pid) {
  const c = s.cur; if (!c || c.phase !== 'choose') return;
  c.attach = c.attach || []; const i = c.attach.indexOf(pid);
  // one at a time: a second name takes the first one's place; a card with two: true takes two (Lachlan, 2026-11-19: the ship's two hard jobs)
  const most = LF.sendMost(s);
  if (i >= 0) c.attach.splice(i, 1); else if (LF.available(s).some(p => p.id === pid)) c.attach = c.attach.concat(pid).slice(-most);
};
LF.sendMost = s => (s.cur && !s.cur.gen && LF.byId[s.cur.id] && LF.byId[s.cur.id].two) ? 2 : 1;
LF.attached = s => ((s.cur && s.cur.attach) || []).map(id => H.byPid(s, id)).filter(p => p && p.alive && (s.cur.aboard ? p.orbit : !p.away));
/* Who did it, for an outcome's words (Lachlan, 2026-11-19; DESIGN.md "The scale"): the officer sent in person if one was, else whoever
   the department's word names (N: the officer at the post, a stand-in, or the department). sentFirst gives the first name. */
LF.sentName = (s, role) => { const p = LF.attached(s)[0]; return p ? p.name : LF.h.N(s, role); };
LF.sentFirst = (s, role) => { const p = LF.attached(s)[0]; return p ? p.first : LF.h.F(s, role); };
/* What the officer sent in person adds (Lachlan, 2026-11-19; DESIGN.md "The odds"). Offices named on a card count only through the
   officer who goes: the card's own figure for that department (two old offices of one seat: the first whole, the rest half), bent
   by how they are (LF.offMods), their strength (LF.EDGE) and how they stand with you. Sent on work the card does not name their
   department for, an officer adds +5 (or a perk's figure). An officer not sent adds nothing, and costs nothing. */
LF.attachMods = function (s, ap, kind, test, c) {
  const parts = [], work = LF.workOf(ap, test, null, null), roles = ((test && test.mods) || []).filter(m => m.k === 'role');
  for (const p of LF.attached(s)) { if (!LF.canDo(p, work)) continue;   // not their kind of work: they stay behind on this option
    const mine = p.seat ? roles.filter(m => (LF.SEAT_OF[m.role] || m.role) === p.seat) : [];
    if (mine.length) {
      let v = Math.max(...mine.map(m => m.v)) + (p.trait === 'brilliant' ? 5 : 0);   // one seat counts once: its best figure on the card
      let label = `${p.name}, ${LF.title(p)}`;
      if (test && test.aboard && !p.orbit) { v = 5; label = `${p.name}, by radio from the ground`; }
      else if (LF.green && LF.green(s, p)) { v = Math.max(5, v - 5); label = `${p.name}, new to the post`; }
      parts.push({ label, v });
      if (LF.offMods) for (const q of LF.offMods(s, p)) parts.push({ label: q.label, v: q.v });
      if (LF.edgeMods) for (const q of LF.edgeMods(s, test, c, p)) { const e = Math.round(q.rel * 100); if (e) parts.push({ label: q.label, v: e }); }
      if (p.loyal !== undefined && p.loyal < 25) parts.push({ label: `${p.first} has turned away from you`, v: -5 });
      else if (p.loyal >= 75) parts.push({ label: `${p.first} stands with you`, v: 5 });
    } else {
      let best = 5, nm = 'there in person';
      for (const k of p.perks) { const K = LF.PERKS[k]; const v = Math.max(K.ap && K.ap === ap ? K.v : 0, K.kind && K.kind === kind ? K.v : 0, K.any || 0); if (v > best) { best = v; nm = K.name.toLowerCase(); } }
      parts.push({ label: `${p.name}, ${nm}`, v: best });
    }
    if (p.deeds.length >= 3) parts.push({ label: `${p.first} has done this before`, v: 5 }); }
  return parts;
};
/* The odds as the player sees them and the dice use them (Lachlan, 2026-11-19; DESIGN.md "The odds"): the base, plus every modifier
   in flat percentage points, held between 5% and 95%. Where the cap cuts, a last line says so, so the lines always add up to the figure. */
LF.withAttach = function (s, odds, ap, kind, test, c) {
  if (!odds) return odds; const add = LF.attachMods(s, ap, kind, test, c), parts = odds.parts.filter(x => !x.cap).concat(add);
  const raw = (odds.raw === undefined ? odds.p : odds.raw) + add.reduce((a, x) => a + x.v, 0), p = clamp(raw, 5, 95);
  if (raw !== p) parts.push({ label: raw > p ? 'No better than 95%' : 'No worse than 5%', v: p - raw, cap: 1 });
  return Object.assign({}, odds, { p, raw, parts });
};
const AP_PERK = { force: 'marksman', study: 'observer', accord: 'speaker', exploit: 'fixer', avoid: 'pathfinder' };
/* What a deed makes of someone, when the card does not say: the work that was done (2026-11-16: with no arc and no
   approach every new name came out a "Steady hand", 554 of 1,200 perks in the sim). */
const WORK_PERK = { fight: 'marksman', heal: 'medic', fix: 'fixer', build: 'steady', research: 'observer', explore: 'pathfinder', talk: 'speaker', grow: 'survivor' };
const ANY_PERK = ['steady', 'scavenger', 'guide', 'survivor', 'fixer', 'observer', 'speaker', 'pathfinder'];
const perkOf = (s, o) => { if (o.perk) return o.perk; if (o.f && o.f.kind === 'plague') return 'medic'; if (o.f && o.f.kind === 'ruin' && o.ap === 'study') return 'touched';
  if (AP_PERK[o.ap]) return AP_PERK[o.ap]; const w = (o.work || []).map(k => WORK_PERK[k]).filter(Boolean);
  return w.length ? w[Math.floor(rand(s) * w.length)] : ANY_PERK[Math.floor(rand(s) * ANY_PERK.length)]; };
const AP_DEED = { force: n => `held the line against ${n}`, study: n => `was the first to make sense of ${n}`, accord: n => `was the one who found terms with ${n}`, exploit: n => `found a use for ${n}`, avoid: n => `got people out of the way of ${n}` };
/* After a tested choice: what it did to the people who were sent in by name, and whether it made anyone new.
   o: { success, title, ap, f (factor or null), crisis, lostCrew, stake } */
const carried = (s, p, o, d, body, chips) => { p.hurt = s.day + d; if (LF.shift) LF.shift(s, p, 'body', body); const m = Math.max(1, Math.round(d / LF.MONTH));
  chips.push({ t: `${p.name} hurt: laid up ${m} month${m > 1 ? 's' : ''}`, good: false }); LF.log(s, `${p.name} was carried back from "${o.title}".`, 'bad'); };
LF.afterTest = function (s, o, chips) {
  const perk = perkOf(s, o);
  const did = o.f ? (o.f.kind === 'plague' && o.ap === 'accord' ? `nursed the sick of ${o.f.name} and never caught it` : (AP_DEED[o.ap] || AP_DEED.force)(o.f.name)) : `kept their head through "${o.title}"`;
  for (const p of LF.attached(s)) {
    // Going in person is a real bet (Lachlan, 2026-11-16: "sending doesn't seem to have much risk"). Where there is danger
    // in it, one time in ten they are carried back even from a success; a failure kills one in seven and lays up a third.
    if (o.success) { if (!o.safe && rand(s) < 0.1) carried(s, p, o, ri(s, 20, 40), -10, chips); else if (rand(s) < 0.35) LF.deed(s, p, did, perk, chips); continue; }
    if (o.safe) { if (rand(s) < 0.2) LF.deed(s, p, `stuck at it through "${o.title}" when it would not come right`, 'steady', chips); continue; }   // a failure with no danger in it
    const r = rand(s), tough = p.perks.includes('survivor') ? 0.4 : 1;
    if (r < 0.14 * tough) { LF.killPerson(s, p, `lost when "${o.title}" went wrong`); chips.push({ t: `${p.name} dead`, good: false }); }
    else if (r < 0.5) carried(s, p, o, ri(s, 40, 80), -22, chips);
    else if (r < 0.62) LF.deed(s, p, `came through "${o.title}" when it went wrong`, 'survivor', chips);
  }
  // Nobody was sent by name: now and then the moment picks someone out of the crowd.
  if (o.success && rand(s) < (o.crisis ? 0.5 : 0.18)) LF.deed(s, null, did, perk, chips);
  else if (!o.success && o.lostCrew && rand(s) < 0.5) LF.deed(s, null, `was the only one of ${o.stake} to walk away${o.f ? ' from ' + o.f.name : ''}`, 'survivor', chips);
};
})();
