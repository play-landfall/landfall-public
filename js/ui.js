/* Landfall — browser UI. One column, built for a phone, and no navigation: the game takes the player to the view
   the next decision belongs to (Colony, World or People), lets them look it over, then brings the card in at the
   top, pushing the view down under it. Every rule lives in core.js / gen.js / council.js. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = (n, cls) => `<img src="art/icons/${n}.png" alt="" ${cls ? `class="${cls}"` : ''}>`;
const SAVE = 'landfall.save.v' + LF.VERSION;
// How long the player looks a view over before its decision comes up. A tap brings it early. Tune in playtest.
const REVIEW_MS = 10000;
// After a choice, the card holds for a few seconds before the outcome resolves. UI-only: nothing is decided or saved until it ends.
let hold = null, holdTimer = 0, reveal = false;
// review: the view is up and the card has not arrived yet. spot: the caption of whatever was last tapped in a view.
// since: days run before this card. mark: the day of the last decision, so the view can say what happened meanwhile.
// shown: the view on screen, so a change of view gets its transition and a re-render does not.
let review = null, reviewTimer = 0, spot = '', since = 0, mark = 0, shown = '', swap = false, stockOpen = '', peek = '';   // peek: a view the player tapped to look at while a card waits
// naming: the survey has been read and the card that names the world is up (the arrival screen comes first).
let naming = false;
// ordOpen: the order row opened in place (its key); ordHold: an order being confirmed (the same short bar a card uses).
let ordOpen = '', ordHold = null, ordTimer = 0, ordSaid = null;
let whoOpen = '';   // the person whose full entry is open on the Crew view (T2-3)
const surveying = () => !!s.arrival && !naming && s.cur && s.cur.id === 'arrive.name' && s.cur.phase === 'choose';
let s, showOdds = (() => { try { return localStorage.getItem('landfall.odds') === '1'; } catch (e) { return false; } })();
const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// the play log (js/log.js): one row per event in Lachlan's sheet, public copy only
const log = (t, x) => { if (window.LFLog) LFLog.ev(t, s, x); };
let overSeen = -1;
/* Every decision, from every path (a card, a generated card, a council card, a pick-several card), goes to the sheet with
   the ids of its card, option and outcome (js/decisions.js). A party that later loses an officer sends a 'death'. */
LF.onPick = (g, r) => log(r.late ? 'death' : r.order ? 'order' : 'choice', { card: r.t, pick: r.l, outcome: r.hit === null ? '' : r.hit ? 'success' : 'failure',
  detail: r.ck + (r.died.length ? ', died: ' + r.died.join(' ') : ''), key: r.ok, cid: r.cid, oid: r.oid, rid: r.rid, sent: r.sent.join(' '), died: r.died.join(' ') });
function load() { try { const j = JSON.parse(localStorage.getItem(SAVE)); if (j && j.v === LF.VERSION) return j; } catch (e) {} return null; }
function save() { try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch (e) {} }
/* The threads the player met in their last two games (those that woke), so the next world deals different ones (LF.plot reads s.avoid). */
function seenThreads() { let past = []; try { past = JSON.parse(localStorage.getItem('landfall.seen')) || []; } catch (e) {}
  if (s && s.threads) { const now = Object.keys(s.threads).filter(id => s.threads[id].woke); if (now.length) past = [now].concat(past).slice(0, 2); }
  try { localStorage.setItem('landfall.seen', JSON.stringify(past)); } catch (e) {}
  return [].concat(...past).filter((id, i, a) => a.indexOf(id) === i); }
function fresh(quiet) { clearTimeout(holdTimer); clearTimeout(reviewTimer); hold = null; review = null; spot = ''; shown = ''; const met = seenThreads(); s = LF.newGame((Date.now() % 2147483647) | 0); s.avoid = met; if (LF.proDeal) LF.proDeal(s, proSeen()); save(); log('new', { detail: s.premise }); pre = null; if (quiet) return; render(); window.scrollTo(0, 0); if (needCrew()) splash(); else intro(); }
function cutscene(shots, title) { if (!window.LFIntro) return; if (window.LFBoot) LFBoot.prefetch(shots.map(x => LFBoot.scene(x.pic))); LFIntro.play(shots, null, title); }
function intro() { if (!window.LFIntro) return;
  if (!(LF.proOn && LF.proOn(s))) return cutscene(LFIntro.opening(s), true);
  const sh = LFIntro.departure(s); if (window.LFBoot) LFBoot.prefetch(sh.map(x => LFBoot.scene(x.pic)).concat(s.pro.deck.map(id => LFBoot.scene(id.replace(/\./g, '_')))));
  LFIntro.play(sh, () => { window.scrollTo(0, 0); proGo(); }, !s.cast); }   // the title card was shown before the ship and crew were chosen (splash)
/* The title card alone: a new game shows it first, then the ship and the crew; the departure plays once they are chosen. */
function splash() { if (window.LFIntro) LFIntro.play([], null, true); }
/* The voyage out (content-social.js): three cards aboard in the first five years from Earth, then the long sleep and
   the cutscene of what went wrong, then the adrift screen. The cards the player saw lately are dealt last. */
function proSeen() { try { return JSON.parse(localStorage.getItem('landfall.proSeen')) || []; } catch (e) { return []; } }
function proGo() {
  if (LF.proNext(s)) { try { localStorage.setItem('landfall.proSeen', JSON.stringify(proSeen().concat(s.cur.id).slice(-9))); } catch (e) {} save(); return arrive(true); }
  save(); window.scrollTo(0, 0); render(); cutscene(LFIntro.opening(s, true)); }
/* ---------- before the voyage: the ship, then the crew (Lachlan, 2026-11-18; DESIGN.md "Before the voyage") ----------
   A new game opens on "Select your ship" (only the Ariadne is fitted out) and then "Select your crew": randomise, or go
   through the six seats and take one of the two officers for each. The picks become s.cast (LF.castPick reads it), the
   voyage out is dealt again for that crew, and the departure plays. pre is UI state only: until s.cast is set a reload
   comes back to the ship. */
let pre = null;
const needCrew = () => !!(s && s.adrift && !s.cast && s.pro && !s.pro.done && !s.pro.i && !s.cur);
const SHIP_FACTS = a => [['Length', '182 metres'], ['Crew', `${a.kit.pop} awake at landfall, ${a.kit.sleepers} in cold sleep`], ['Key crew', 'Six officers, two on watch at a time'],
  ['Drive', 'Antimatter, one long burn out and one in'], ['Power', 'Fusion plant'], ['Range', 'Ten light years'], ['Lander', 'One, with fuel for two flights down'], ['Built', '2140, Huntsville orbital yards']];
const SEAT_ASKS = { command: 'One of them thinks first of the mission, the other of the people.', security: 'One of them watches the people inside the wire, the other what is outside it.',
  engineer: 'One of them makes a machine last with what there is, the other wants it done properly.', doctor: 'One of them minds how the patient feels, the other whether they get better and whether it spreads.',
  scientist: 'One of them wants to know what a thing is, the other what use it is.', crew: 'One of them promises only what the ground will give, the other feeds people first and worries after.' };
const facePainted = key => !!key && !(LF.UNPAINTED_FACES || LF.UNPAINTED || []).includes(key);
const castImg = (c, cls) => !facePainted(c.key) || !SCENES.has('cast_' + c.key) ? `<span class="face none">${ic('people')}</span>`
  : `<img class="${cls || 'face'}" src="art/scenes/cast_${c.key}${SCENES.has('cast_' + c.key + '_ship') ? '_ship' : ''}.webp" alt="" decoding="async">`;
/* What an officer brings and what it costs, while in the chair (LF.EDGE, 2026-11-19). */
const edgeHTML = k => { const e = LF.EDGE && LF.EDGE[k]; return e ? `<div class="edge"><span class="up">${esc(e.up)}</span></div>` : ''; };
/* A seat's two on the crew pick (Lachlan, 2026-11-19): tap one to put them in the chair; that tile reads the seat's lead
   title and the other its second, and one button under both confirms. */
const seatCard = (c, i, k, on) => `<div class="file pick${on ? ' on' : ''}" style="--i:${i}" data-act="pre" data-v="sel${i}" role="button" tabindex="0" aria-pressed="${on}">${castImg(c)}<div class="t"><span class="lbl">${esc(on ? LF.SEATS[k].lead : LF.SEATS[k].second)}</span><b>${esc(c.first)} ${esc(c.last)}</b>${fileFacts(c.key)}<p>${esc(LF.BIO[c.key])}</p>${edgeHTML(c.key)}</div></div>`;
const fileCard = (c, i, btn, seat) => `<div class="file" style="--i:${i}">${castImg(c)}<div class="t"><b>${esc(c.first)} ${esc(c.last)}</b>${seat ? '' : `<span class="lbl">${esc(c.title || '')}</span>`}${fileFacts(c.key)}<p>${esc(LF.BIO[c.key])}</p>${seat ? edgeHTML(c.key) : ''}${btn || ''}</div></div>`;
function preHTML() { pre = pre || { step: 'ship', picks: {} }; const a = s.adrift, st = pre.step;
  if (st === 'ship') return `<div class="banner"><img class="scene" src="art/ship_new.webp" alt=""></div><div class="card enter dossier"><div class="lbl tone">Outbound from Earth</div><h2>Select your ship</h2>
    <div class="shipcard on"><b>${esc(a.ship)}</b><span class="lbl">Colony ship · the only one fitted out</span>
      <dl class="facts">${SHIP_FACTS(a).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
    <button class="opt go" data-act="pre" data-v="crew">Take the ${esc(a.ship)}</button></div>`;
  if (st === 'crew') return `<div class="card enter dossier"><div class="lbl tone">The ${esc(a.ship)}</div><h2>Select your crew</h2>
    <p>Six officers keep the ship with you and run the colony's six departments when you land. Two were trained for each post, and they are not alike: each is good at something different. Take one of each to head the department. The other comes too as their second, and takes the chair if the first is lost. After those two there is nobody.</p>
    <button class="opt go" data-act="pre" data-v="seat0">Choose the command crew</button>
    <button class="opt go" data-act="pre" data-v="random">Randomise</button>
    <button class="pbtn back" data-act="pre" data-v="ship">Back to the ship</button></div>`;
  if (st === 'review') return `<div class="card enter dossier"><div class="lbl tone">The ${esc(a.ship)} · crew file</div><h2>Your command crew</h2>
    ${LF.SEAT_ORDER.map((k, i) => { const c = LF.CAST[k][pre.picks[k] || 0], d = LF.CAST[k][1 - (pre.picks[k] || 0)]; return `<div class="file small" style="--i:${i}">${castImg(c)}<div class="t"><span class="lbl sp sp-${k}">${esc(LF.SEATS[k].lead)}</span><b>${esc(c.first)} ${esc(c.last)}</b><span class="who">${esc(LF.SEATS[k].second)}: ${esc(d.first)} ${esc(d.last)}</span>${edgeHTML(c.key)}</div></div>`; }).join('')}
    <button class="opt go" data-act="pre" data-v="go">Begin the voyage</button>
    <button class="opt go" data-act="pre" data-v="${pre.rolled ? 'random' : 'seat0'}">${pre.rolled ? 'Roll again' : 'Change them'}</button>
    ${pre.rolled ? '<button class="pbtn back" data-act="pre" data-v="seat0">Choose them yourself</button>' : ''}</div>`;
  const n = +st.slice(4), k = LF.SEAT_ORDER[n], S = LF.SEATS[k], sel = pre.sel && pre.sel[k] !== undefined ? pre.sel[k] : pre.picks[k] || 0;
  return `<div class="card enter dossier"><div class="lbl tone">Command crew · ${n + 1} of ${LF.SEAT_ORDER.length}</div><h2 class="sp sp-${k}">${esc(S.name)}</h2>
    <p>${esc(S.does)} ${esc(SEAT_ASKS[k])}</p>
    ${LF.CAST[k].map((c, i) => seatCard(c, i, k, i === sel)).join('')}
    <button class="opt go" data-act="pre" data-v="pick${sel}">${esc(LF.CAST[k][sel].first)} as ${esc(S.lead)}</button>
    <button class="pbtn back" data-act="pre" data-v="${n ? 'seat' + (n - 1) : 'crew'}">Back</button></div>`; }
function preGo(v) { pre = pre || { step: 'ship', picks: {} };
  if (v.startsWith('sel')) { const k = LF.SEAT_ORDER[+pre.step.slice(4)], i = +v.slice(3), S = LF.SEATS[k]; pre.sel = pre.sel || {}; pre.sel[k] = i;
    // a tile tapped: swap the titles and the button in place, so nothing replays its entrance or scrolls
    document.querySelectorAll('#view .file.pick').forEach(el => { const on = el.dataset.v === v; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.querySelector('.lbl').textContent = on ? S.lead : S.second; });
    const go = document.querySelector('#view [data-act="pre"][data-v^="pick"]'); if (go) { go.dataset.v = 'pick' + i; go.textContent = `${LF.CAST[k][i].first} as ${S.lead}`; }
    return; }
  window.scrollTo(0, 0);
  if (v === 'random') { pre.picks = {}; for (const k of LF.SEAT_ORDER) pre.picks[k] = Math.random() < 0.5 ? 0 : 1; pre.rolled = true; pre.step = 'review'; }
  else if (v.startsWith('pick')) { const n = +pre.step.slice(4); pre.picks[LF.SEAT_ORDER[n]] = +v.slice(4); pre.rolled = false; pre.step = n + 1 < LF.SEAT_ORDER.length ? 'seat' + (n + 1) : 'review'; }
  else if (v === 'go') { s.cast = {}; for (const k of LF.SEAT_ORDER) s.cast[k] = pre.picks[k] || 0; pre = null; if (LF.proDeal) LF.proDeal(s, proSeen()); save();
    log('crew', { detail: LF.SEAT_ORDER.map(k => LF.CAST[k][s.cast[k]].first).join(' ') }); render(); return intro(); }
  else pre.step = v;
  render(); }

/* The crew file (Lachlan, 2026-11-17): before the first card, the six officers two at a time, like leafing through a dossier. */
let dossier = -1;
const fileFacts = k => { const f = LF.FILE && LF.FILE[k]; return f ? `<span class="who">${f.age} · ${esc(f.from)}</span>` : ''; };   // the three-line record is no longer shown on the file cards (Lachlan, 2026-11-19)
function dossierHTML() { const pg = LF.FILE_PAGES[dossier], seats = pg.seats;
  return `<div class="card enter dossier"><div class="lbl tone">The ${esc(s.adrift.ship)} · crew file · ${dossier + 1} of ${LF.FILE_PAGES.length}</div><h2>${esc(pg.name)}</h2>${dossier === 0 ? '<p>Six officers keep the ship with you, all awake for the first two years and then two at a time. Nobody can replace them.</p>' : ''}
    ${seats.map((seat, i) => { const c = LF.CAST[seat][LF.castPick(s, seat)]; return `<div class="file" style="--i:${i}"><img class="face" src="art/scenes/cast_${c.key}${SCENES.has('cast_' + c.key + '_ship') ? '_ship' : ''}.webp" alt="" decoding="async"><div class="t"><b>${esc(c.first)} ${esc(c.last)}</b><span class="lbl">${esc(LF.SEATS[seat].lead)}</span>${fileFacts(c.key)}<p>${esc(LF.BIO[c.key])}</p></div></div>`; }).join('')}
    <button class="opt go" data-act="dossier">${dossier < LF.FILE_PAGES.length - 1 ? 'Next' : 'Begin the voyage'}</button></div>`; }
function dossierGo() { if (dossier < 0) return; dossier++; window.scrollTo(0, 0); if (dossier >= LF.FILE_PAGES.length) { dossier = -1; return proGo(); } render(); }
function proHTML() { const y = LF.proYear(s);
  return cardHTML() + `<section class="vw"><div class="lbl vname">Under way</div><div class="box"><div class="row">${ic('people')}<div class="t"><b>The ${esc(s.adrift.ship)}</b><small>Year ${y} out from Earth. ${y <= 2 ? 'All six officers awake to run the ship in' : 'Two officers on watch, four in the cold'}, everyone else asleep in the cryo banks.</small></div></div></div></section>`; }

const bar = (v, cls, mark) => `<div class="bar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i>${mark !== undefined ? `<b style="left:${mark}%"></b>` : ''}</div>`;
const months = d => LF.monthsWord(Math.max(1, Math.ceil(Math.max(0, d) / LF.MONTH)));
const KIND_ICON = { fauna: 'fauna', flora: 'flora', plague: 'plague', ruin: 'ruin', natives: 'natives', humans: 'humans', faction: 'faction' };
const PILL = { food: 'Food', water: 'Water', energy: 'Power', industry: 'Industry', people: 'People' };

/* ---------- chrome: where and when, and nothing else ---------- */
// Between the burn and orbit: the crossing's cards are up and there is no world to look at yet.
const underWay = () => !!s.world && !!s.voyage && !s.arrival && !s.world.catalogue && !s.world.zone;
/* The sound button in the header (Lachlan, 2026-11-16): music, beds and card sounds all on one switch (js/music.js). */
const SPEAKER = '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>';
function soundBtn() { const b = $('soundBtn'); if (!b) return; const on = !!(window.LFMusic && LFMusic.on);
  b.classList.toggle('off', !on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
  b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${SPEAKER}${on
    ? '<path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg>`; }
function renderChrome() {
  soundBtn();
  $('app').classList.toggle('pre', LF.aloft(s));
  if (s.adrift) { $('planet').textContent = s.adrift.ship; $('date').textContent = dossier >= 0 || needCrew() ? 'Outbound from Earth' : s.cur && LF.proYear && LF.proYear(s) ? `Year ${LF.proYear(s)} out from Earth` : 'Adrift · no destination'; return; }
  const d = LF.date(s.day), under = underWay();
  $('planet').textContent = under ? s.world.ship : s.world.planet;
  $('date').textContent = under ? `Under way · ${s.world.star}` : LF.aloft(s) ? 'In orbit' : `Year ${d.year} · month ${d.month} · ${LF.SEASONS[d.season]}`;
}

/* ---------- the dilemma card ---------- */
const DIFF = p => p >= 75 ? 'Easy' : p >= 55 ? 'Fair' : p >= 40 ? 'Hard' : 'Desperate';
const DANGER = ['', 'Low', 'Moderate', 'High', 'Severe', 'Extreme'];
const COST = { food: 'food', mat: 'materials', parts: 'spares' };
const INFO = { time: 'time', yield: 'good', danger: 'danger', people: 'people', cord: 'star' };
const NUMW = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const daysWord = n => { const m = Math.round(n / LF.MONTH); return m < 1 ? 'The same month' : m === 1 ? 'A month later' : `${NUMW[m] || m} months later`; };
// Scene art (art/scenes/<id>.webp, listed in js/scenes.js): one per storylet and frame, by id with dots as
// underscores. Cards with no picture of their own (council, finished builds, returning parties) borrow from the
// stock library, picked by title so the same card always shows the same picture.
const SCENES = new Set(LF.SCENES || []);
// Never the hollow or per-officer variants: those come only through hollow() and castScene() (a borrowed pool matched lib_group_00_hollow at 90% humanity)
const libPool = p => (LF.SCENES || []).filter(k => k.startsWith(p) && !k.endsWith('_hollow') && !k.includes('@'));
const BORROW = { plan: () => libPool('lib_group_00'), done: () => libPool('lib_building_'), 'plan.harvest': () => libPool('lib_crop_'),
  // crossing incidents with no picture of their own borrow the nearest one
  'voy.dead': () => libPool('voy_cryo'), 'voy.petition': () => libPool('voy_wake'), 'voy.spine': () => libPool('voy_plan'), 'voy.dust': () => libPool('voy_plan'),
  away: () => libPool('lib_landscape_').concat(libPool('lib_group_06')),
  // the quiet ship's boarding (2026-11-16): until each has its own picture
  'qs.deep': () => libPool('qs_board'), 'qs.air': () => libPool('qs_board'), 'qs.glass': () => libPool('qs_board'), 'qs.guests': () => libPool('qs_board'), 'qs.lights': () => libPool('qs_silent'), 'qs.second': () => libPool('qs_silent') };
// A scene that shows a seat's officer has a variant per officer (<scene>@<castkey>, js/scenes-cast.js): the person the
// card is about, else whoever holds the seat now. With nobody, or no variant painted, the plain scene.
/* An officer's picture at the age the game year makes them (AGE_FROM; the portraits and the scene variants both have a
   _mid and an _old, tools/scenes.py AGED): the oldest one painted that the year has reached, else the picture itself. */
const AGE_FROM = [[10, '_old']];   // one change, at year ten, for all twelve (Lachlan, 2026-11-18, by way of the art session): the _mid pictures are retired
function aged(k) { const y = s && s.day ? LF.date(s.day).year : 1, a = AGE_FROM.find(x => y >= x[0] && SCENES.has(k + x[1])); return a ? k + a[1] : k; }
const painted = key => !!key && !(LF.UNPAINTED || []).includes(key);
function castScene(k, c) {
  const seat = (LF.SCENE_SEAT || {})[k]; if (!seat || !s.people) return k;
  const x = c.ctx || {}, byPid = id => s.people.find(p => p.id === id), up = (x.ids || []).map(byPid).filter(Boolean), down = up.filter(p => !p.orbit);
  const p = seat !== 'any' ? LF.officer(s, seat) : x.pid ? byPid(x.pid) : down.length === 1 ? down[0] : up.length === 1 ? up[0] : null;
  return p && painted(p.key) && SCENES.has(k + '@' + p.key) ? aged(k + '@' + p.key) : k;
}
/* Below 10% humanity (LF.grim past half) a picture with a hollow version (<id>_hollow.webp: the same scene repainted
   gaunt, shadowed and wrong; Lachlan, 2026-11-16) shows that instead: the officers' portraits and the cards most seen. */
const hollow = k => LF.grim && s && s.world && LF.grim(s) >= 0.5 && SCENES.has(k + '_hollow') ? k + '_hollow' : k;
// A finished build is painted for each kind of world (art session, 2026-11-18): built_<x>~<world.type>, the plain one as the fallback.
const worldly = k => k && k.startsWith('built_') && !k.includes('@') && s && s.world && SCENES.has(k + '~' + s.world.type) ? k + '~' + s.world.type : k;
function sceneOf(c) { const k = worldly(sceneOf0(c)); return k ? hollow(k) : k; }
// A lander run (Lachlan, 2026-11-16): nothing shows the landing before it happens; the landing shows the officer who
// came down, else the system, else the colonists, else the lander coming in.
const LANDED = d => d.key && SCENES.has('seat_down@' + d.key) ? aged('seat_down@' + d.key) : d.pid ? 'seat_down' : d.sys ? 'ship_cargo' : d.people ? 'plan_sleepers' : 'built_shuttle';
const PREFLIGHT = { 'seat.down': 'ship_orbit', 'ship.cargo': 'ship_cargo' };
function sceneOf0(c) {
  { const k = [].concat(c.scene || (LF.byId[c.id] || {}).scene || []).find(x => SCENES.has(x)); if (k) return castScene(k, c); }   // a party's return with a picture of its own (gen.js card, T2-5): the first of its list that is painted
  if (c.landed && c.down) return LANDED(c.down);
  if (PREFLIGHT[c.id] && SCENES.has(PREFLIGHT[c.id])) return PREFLIGHT[c.id];
  if (c.id === 'plan.sleepers') return c.phase === 'result' ? 'plan_sleepers' : 'sleep_manifest';   // the wake card: the banks while choosing, the landing after
  const k = String(c.id).replace(/\./g, '_');
  // A voyage card's crew photo is painted for each pair of leads: soc_<id>@<keyA>+<keyB>, the plain one for the first two officers.
  if (k.startsWith('soc_') && c.ctx && c.ctx.a && LF.castPick) { const ky = x => { const seat = Object.keys(LF.CAST).find(z => LF.CAST[z][0].key === x); return seat ? LF.CAST[seat][LF.castPick(s, seat)].key : x; };
    const v = `${k}@${ky(c.ctx.a)}+${ky(c.ctx.b)}`; if (SCENES.has(v)) return v; }
  if (SCENES.has(k)) return castScene(k, c);
  if (c.build && SCENES.has('built_' + c.build)) return castScene('built_' + c.build, c);   // a finished build has its own picture
  const pool = BORROW[c.id] ? BORROW[c.id]() : [];
  if (!pool.length) return null;
  let h = 0; for (const ch of String(c.title || '')) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return pool[Math.abs(h) % pool.length];
}
/* Text in one line (an option's note): any speech tag read as Name: "line" (js/speak.js). */
function said(text) { if (LF.revoice) text = LF.revoice(s, text); return esc(LF.unmark ? LF.unmark(s, text) : text); }
/* A card's text: narration as paragraphs, speech as a face, a name and post, and the line in a bubble (Lachlan, 2026-11-19;
   DESIGN.md "Who is speaking"; LF.talk in js/speak.js). Key crew in gold on their navy; colonists on their grey; a blank for one not painted. */
function talkFace(w) {
  if (w.kind === 'officer') { const key = w.p ? w.p.key : w.castKey;
    if (key && facePainted(key) && SCENES.has('cast_' + key)) return `<img class="face off" src="art/scenes/${w.p ? castFace(w.p) : hollow(aged('cast_' + key))}.webp" alt="" loading="lazy" decoding="async">`;
    return `<span class="face off icon">${ic('notable')}</span>`; }
  if (w.kind === 'machine') return `<span class="face icon">${ic('machines')}</span>`;
  if (w.kind === 'unknown') return `<span class="face static" aria-hidden="true"></span>`;   // a voice nobody can put a face to: a screen of static (Lachlan, 2026-11-19)
  // a roster portrait not painted yet is simply not there: the blank takes its place, so a painting that lands is picked up as it is
  return w.pic ? `<img class="face" src="${w.pic}" alt="" loading="lazy" decoding="async" onerror="this.outerHTML='<span class=&quot;face blank&quot;></span>'">` : `<span class="face blank"></span>`;
}
function talkHTML(text) {
  if (LF.revoice) text = LF.revoice(s, text);
  if (!LF.talk) return `<p class="narr">${esc(text)}</p>`;
  return LF.talk(s, text).map(b => { if (!b.say) return `<p class="narr">${esc(b.text)}</p>`;
    const w = b.say, cls = w.kind === 'officer' ? ' k' : w.kind === 'note' ? ' note' : '';
    if (w.kind === 'note') return `<div class="talk note"><span class="face icon">${ic('log')}</span><div><div class="who">${esc(w.name)}</div><div class="bub">${esc(b.lines.join('\n'))}</div></div></div>`;
    return `<div class="talk${cls}">${talkFace(w)}<div><div class="who">${esc(w.name)}${w.post ? `<span>${esc(w.post)}</span>` : ''}</div><div class="bub">${esc(b.lines.join('\n'))}</div></div></div>`; }).join('');
}
function cardHTML() {
  const def = LF.view(s), pic = sceneOf(s.cur);
  let h = `<div class="card${reveal ? ' enter' : ''}" id="card">${pic ? `<img class="scene" src="art/scenes/${pic}.webp" alt="" decoding="async">` : ''}<div class="lbl tone">${esc((LF.byId[s.cur.id] || {}).kicker || def.tone || '')}${s.cur.phase === 'choose' && since ? ` · ${daysWord(since).toLowerCase()}` : ''}</div>${LF.storyLine(s) ? `<div class="story">${esc(LF.storyLine(s))}</div>` : ''}<h2>${esc(def.title)}</h2>`;
  if (s.cur.phase === 'choose') {
    h += talkHTML(def.text);
    { let a = ''; try { a = LF.askOf ? LF.askOf(s) : ''; } catch (e) { a = ''; } if (a) h += `<p class="ask">${esc(a)}</p>`; }   // what the card asks, in one sentence (js/asks.js)
    const opts = LF.choices(s), av = LF.available(s), rest = LF.resting(s), on = s.cur.attach || [];
    if (!hold && (av.length || rest.length) && opts.some(o => !o.lock && (o.odds || o.send))) h += `<div class="att"><div class="lbl">${ic('notable', 'h3i')}Send an officer · one at a time</div>${av.map(p =>
      `<button data-act="attach" data-v="${p.id}" class="${on.includes(p.id) ? 'on' : ''}"><b>${esc(LF.seatTag(p))}</b><span>${esc(LF.green(s, p) ? 'New to the post' : LF.job(p))}</span></button>`).join('')}${rest.map(p =>
      `<button disabled class="spent"><b>${esc(LF.seatTag(p))}</b><span>Just back · ${esc(LF.monthsWord((p.spent - s.day) / LF.MONTH))}</span></button>`).join('')}
      <small>${on.length ? 'Shares the risk, and rests two months after.' : 'Only an officer you send adds to the odds. They can be hurt or killed.'}</small></div>`;
    // What the colony has of whatever this card spends or turns on, in words, against what is asked.
    const g = s.adrift ? [] : LF.relevant(s);   // the voyage out has no colony stores to show
    if (g.length) h += `<div class="stock">${g.map(x => `<span class="${x.lv === 0 ? 'hot' : ''}">${ic(x.k)}${esc(x.w)}</span>`).join('')}</div>`;
    const pk = LF.byId[s.cur.id] && !s.cur.gen ? LF.byId[s.cur.id].pick : 0, picked = s.cur.picked || [];
    for (const o of opts) {
      const tips = [];
      for (const [k, t] of o.info || []) tips.push(`<span class="${k === 'danger' ? 'hot' : ''}">${ic(INFO[k] || 'unknown')}${esc(t)}</span>`);
      if (o.odds) tips.push(`<span class="${o.odds.p < 40 ? 'hot' : ''}">${ic('difficulty')}${o.odds.p}% · ${DIFF(o.odds.p)}</span>`);
      if (o.send) tips.push(`<span>${ic('people')}${o.send.n} go${o.send.lead ? ', led' : ''}</span>`, `<span>${ic('time')}${o.send.months} month${o.send.months > 1 ? 's' : ''}</span>`, `<span class="${o.send.danger >= 4 ? 'hot' : ''}">${ic('danger')}${DANGER[o.send.danger]}</span>`);
      const cost = o.cost || o.ch.cost; if (cost) for (const k in cost) tips.push(`<span class="${cost[k] > s.res[k] * 0.4 ? 'hot' : ''}">${ic(k)}${esc(LF.amount(s, k, -cost[k]))}</span>`);
      // how the figure is made, in percentage points that add up to it: the base, then every line (DESIGN.md "The odds")
      const mods = o.odds && o.odds.parts.length ? `<div class="mods">${o.odds.base !== undefined ? `<span>${o.odds.base}% to start</span>` : ''}${o.odds.parts.map(m => `<span class="${m.v > 0 ? 'up' : 'dn'}">${m.v > 0 ? '+' : '\u2212'}${Math.abs(m.v)}% ${esc(m.label)}</span>`).join('')}</div>` : '';
      const st = pk ? (picked.includes(o.i) ? ' on' : picked.length >= pk ? ' full' : '') : !hold ? '' : hold.i === o.i ? ' picked' : ' gone';
      const face = pk && o.ch.pid ? faceOf(LF.h.byPid(s, o.ch.pid(s))) : null;
      h += `<button class="opt${st}${o.odds ? ' roll' : ''}" data-act="${pk ? 'pick' : 'choose'}" data-v="${o.i}" ${o.lock || hold ? 'disabled' : ''}>${face || ic(LF.tenor(s, o))}<span class="b"><span class="l">${esc(o.label)}</span>${o.note ? `<em${o.ch && o.ch.officer ? ' class="who"' : ''}>${said(o.note)}</em>` : ''}`
        + (tips.length ? `<span class="tips">${tips.join('')}</span>` : '') + mods
        + (o.against && !o.lock ? `<span class="why">Against the colony's ${esc(o.against.toLowerCase())} character</span>` : '')
        + (o.lock ? `<span class="why">${esc(o.lock)}</span>` : '') + `</span></button>`;
      if (hold && hold.i === o.i) h += procHTML();
    }
    if (pk) h += `<button class="opt go" data-act="pickgo" ${picked.length === pk ? '' : 'disabled'}>${picked.length === pk ? esc(LF.byId[s.cur.id].pickLabel || 'Confirm') : `Choose ${pk - picked.length} more`}</button>`;
  } else {
    const r = s.cur.result;
    if (r.p !== undefined) h += `<div class="verdict ${r.success ? 'good' : 'bad'}">${esc(r.label)}: ${r.success ? 'it works' : 'it goes wrong'}</div>`;
    else if (r.label) h += `<div class="verdict">${esc(r.label)}</div>`;
    h += talkHTML(r.text) + `<div class="chips">${r.chips.map(c => `<span class="${c.good ? 'good' : 'bad'}">${esc(c.t)}</span>`).join('')}</div>`;
    if (s.cur.id === 'recap') h += moraleHTML() + humHTML() + yearHTML();
    // Year 0 (Lachlan, 2026-11-16): at landfall, how other colonies answered the crossing and the descent.
    if (s.cur.id === 'landfall.site') h += yearHTML((s.ylog || []).filter(e => e.cid).map(e => ({ cid: e.cid, oid: e.oid, t: e.t, l: e.l, sent: e.sent, died: e.died })));
    h += `<button class="opt go" data-act="dismiss">${r.then ? 'There is more' : 'Go on'}</button>`;
  }
  return h + `</div>`;
}
const holdP = () => Math.min(1, (performance.now() - hold.t0) / hold.ms);
function procHTML() {
  return `<div class="proc" role="status"><span class="lbl">${hold.say}</span><div class="pbar"><i style="transform:scaleX(${holdP()})"></i></div></div>`;
}
// The bar is filled from the clock rather than a CSS animation, so a re-render mid-hold (say, a tapped caption) picks it up where it was.
function fillBar() { if (!hold) return; const i = document.querySelector('.pbar i'); if (i) i.style.transform = `scaleX(${holdP()})`; requestAnimationFrame(fillBar); }
function startHold(i) {
  const o = LF.choices(s).find(x => x.i === i); if (!o || o.lock) return;
  const ms = o.send ? 4500 : o.odds ? 4000 + Math.round(Math.random() * 1000) : 3000;
  hold = { i, ms, t0: performance.now(), say: o.send ? 'The party sets out' : o.odds ? 'Out of your hands now' : LF.aloft(s) ? 'Word goes round the ship' : 'Word goes round the colony' };
  requestAnimationFrame(fillBar);
  holdTimer = setTimeout(() => { const card = s.cur.id; LF.choose(s, hold.i);
    hold = null; reveal = true; save(); render(); toCard(); }, ms);
}
/* How everyone else did (js/log.js): fetched once per ending, then drawn into the end card when it arrives. */
let peers = { key: '', lines: null };
function peersHTML() {
  const key = s.seed + ':' + s.over.day;
  if (peers.key !== key) { peers = { key, lines: null };
    if (window.LFLog) LFLog.peers(s, lines => { if (peers.key !== key) return; peers.lines = lines;
      const el = document.getElementById('peers'); if (el && lines.length) { el.innerHTML = peersInner(lines); el.classList.add('in'); } }); }
  return `<div class="peers${peers.lines && peers.lines.length ? ' in' : ''}" id="peers">${peers.lines && peers.lines.length ? peersInner(peers.lines) : ''}</div>`;
}
/* The recap: how other colonies answered this year's cards (js/log.js LFLog.year), fetched once per recap. */
let yearPeers = { key: '', lines: null };
function yearHTML(picks) {
  const key = s.seed + ':' + s.day + ':' + s.cur.id;
  if (yearPeers.key !== key) { yearPeers = { key, lines: null };
    if (window.LFLog && LFLog.year) LFLog.year(s, picks || s.cur.year || [], lines => { if (yearPeers.key !== key) return; yearPeers.lines = lines;
      const el = document.getElementById('peers'); if (el && lines.length) { el.innerHTML = peersInner(lines); el.classList.add('in'); } }); }
  return `<div class="peers${yearPeers.lines && yearPeers.lines.length ? ' in' : ''}" id="peers">${yearPeers.lines && yearPeers.lines.length ? peersInner(yearPeers.lines) : ''}</div>`;
}
const peersInner = lines => `<div class="lbl">The other colonies</div>${lines.map(l => `<p>${esc(l)}</p>`).join('')}`;
function endHTML() {
  const title = { win: 'The Cord Is Cut', dead: s.over.after ? 'After the Cord' : 'The Last Camp' }[s.over.kind] || 'The Record Stops';
  return `<div class="card end" id="card"><div class="lbl tone">${LF.dateStr(s.over.day)}</div><h2>${title}</h2><div class="epi">${LF.epilogue(s).map(p => `<p>${esc(p)}</p>`).join('')}</div>${peersHTML()}
    ${s.over.kind === 'win' ? `<div class="note">You can keep playing, and the colony can still fail.</div><button class="opt go" data-act="continue">Keep going</button>` : ''}<button class="opt go" data-act="new">Found a new colony</button></div>`;
}

/* ---------- adrift: choosing a world from a telescope's guesses ---------- */
function readingHTML(r, reveal) {
  const D = LF.PROPS[r.k], pc = v => Math.max(0, Math.min(100, 100 * (v - D.min) / (D.max - D.min)));
  const miss = reveal && (r.actual < r.lo || r.actual > r.hi);
  return `<div class="rd"><div class="rh">${ic(r.k === 'water' ? 'water' : r.k)}<b>${D.name}</b><span>${LF.fmt(r.k, r.lo)} to ${LF.fmt(r.k, r.hi)}${D.unit}</span></div>
    <div class="eb"><i style="left:${pc(r.lo)}%;width:${Math.max(1.5, pc(r.hi) - pc(r.lo))}%"></i>${reveal ? `<b class="${miss ? 'miss' : ''}" style="left:${pc(r.actual)}%"></b>` : ''}</div>
    <small>${reveal ? `<span class="${miss ? 'bad' : 'good'}">Actual: ${LF.fmt(r.k, r.actual)}${D.unit}${miss ? ' · outside the estimate' : ''}</span>` : `${esc(LF.gloss(r.k, r))} · confidence ${r.conf}%`}</small></div>`;
}
function adriftHTML() {
  const a = s.adrift, n = a.cands.length;
  let h = `<div class="banner"><img class="scene" src="art/adrift.webp" alt=""></div><div class="card"><div class="lbl tone">Forty-one years out</div><h2>Adrift</h2>
    <p>${esc((LF.PREMISES[s.premise] || LF.PREMISES.dead).text(a.ship))}

There is reaction mass for one more burn. The long-range array has found ${['', 'one', 'two', 'three', 'four', 'five', 'six'][n]} stars within reach, each with one world that might do. They have catalogue numbers and no names. Nothing better than this ship's own telescope has ever looked at any of them.</p>
    <p class="note" style="padding:0">Each bar is the array's estimate, with its confidence: the chance the truth lies inside the bar. The truth is rarely in the middle. A longer burn costs sleepers, stores and machine life. The real survey waits until you arrive, and so does a name.</p></div>
    <h3>${ic('array', 'h3i')}Stars in reach · nearest first</h3>`;
  // Every reading on every candidate, straight away: opening them one by one was only button clicking.
  a.cands.forEach((c, i) => { const R = LF.transitRisk(c);
    h += `<div class="box cand"><div class="ch">${ic('world')}<span class="t"><b>${esc(c.star)}</b><small>${c.ly.toFixed(1)} light-years · ${c.years} years at the engine's rating</small></span></div>
      <div class="mini">${c.readings.map(r => { const D = LF.PROPS[r.k], pc = v => 100 * (v - D.min) / (D.max - D.min);
        return `<div><span>${D.name.split(' ').pop()} <em>${LF.fmt(r.k, r.lo)} to ${LF.fmt(r.k, r.hi)}${D.unit.trim()} · ${r.conf}%</em></span><div class="eb"><i style="left:${pc(r.lo)}%;width:${Math.max(2, pc(r.hi) - pc(r.lo))}%"></i></div></div>`; }).join('')}</div>
      <small class="burn">The burn, at its rated pace: ${R.lo} to ${R.hi}% of the sleepers lost, ${R.wear} wear on every machine${c.j > 0.25 ? ', a few of the watch' : ''}. How the ship crosses is decided once it is under way.</small>
      <button class="opt go" data-act="embark" data-v="${i}">Burn for ${esc(c.star)}</button></div>`; });
  return h;
}
/* The arrival (Lachlan, 2026-11-19): first the crossing report alone, then two tabs, the world (its picture and what the
   survey saw) and the orbital report (the readings against the truth, and what orbit can say). Both end on the name. */
let arrStep = 0, arrTab = 'world', arrSeen = false;   // arrSeen: the orbital report has been opened, so the name can be given (Lachlan, 2026-11-19)
const ORBIT_PIC = { barren: 'lib_planet_05', ice: 'lib_planet_01', drowned: 'lib_planet_02', jungle: 'lib_planet_04', garden: 'lib_planet_09', ruin: 'lib_planet_10' };
function arrivalHTML() {
  const w = s.world, R = w.report;
  const head = `<div class="card"><div class="lbl tone">${w.transit.ly.toFixed(1)} light-years later</div><h2>Orbit over ${esc(w.planet)}</h2>`;
  if (arrStep === 0) return `${head}<p>${esc(LF.transitText(s))}</p><p>The ship makes one full survey from orbit before anyone goes down. After this, what the colony learns it learns on foot.</p></div>
    <button class="opt go" data-act="arrnext">Next</button>`;
  const pic = (LF.SCENES || []).includes(`orbit_${w.type}`) ? `orbit_${w.type}` : ORBIT_PIC[w.type] || 'lib_planet_09';
  const tab = arrTab === 'world'
    ? `<div class="banner"><img class="scene planet" src="art/scenes/${pic}.webp" alt=""></div>
      ${LF.planetStory ? `<h3>${ic('world', 'h3i')}What the survey saw</h3><div class="card">${LF.planetStory(s).map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}`
    : `<h3>${ic('array', 'h3i')}The readings, and the truth</h3><div class="box">${w.readings.map(r => readingHTML(r, true)).join('')}</div>
    ${LF.arrivalNotes(s).map(t => `<div class="note">${esc(t)}</div>`).join('')}
    ${R ? `<h3>${ic('world', 'h3i')}The orbital report</h3><div class="box">
      <div class="rd"><div class="rh">${ic('parts')}<b>Metal</b><span>${R.ore.conf}% sure</span></div><small>${esc(R.ore.text)}</small></div>
      <div class="rd"><div class="rh">${ic('water')}<b>Water</b></div><small>${esc(R.water)}</small></div>
      <div class="rd"><div class="rh">${ic('danger')}<b>Weather</b><span>${R.weather.conf}% sure</span></div><small>${esc(R.weather.text)}</small></div>
      ${LF.anomaly(s) ? `<div class="rd"><div class="rh">${ic('unknown')}<b>The anomaly</b></div><small>${esc(LF.anomaly(s).charAt(0).toUpperCase() + LF.anomaly(s).slice(1))}. Orbit cannot say what it is.</small></div>` : ''}
      <div class="rd"><div class="rh">${ic('lander')}<b>Landing zones</b></div>${R.zones.map(z => `<small><b>${esc(z.name.charAt(0).toUpperCase() + z.name.slice(1))}</b>: ${esc(z.see)}.</small>`).join('')}</div>
      <div class="rd"><div class="rh">${ic('array')}<b>Big enough to name</b></div>${R.features.map(f => `<small><b>${esc(f.name.charAt(0).toUpperCase() + f.name.slice(1))}</b>: ${esc(f.see)}.</small>`).join('')}</div></div>` : ''}`;
  return `<div class="lbl vname">Orbit over ${esc(w.planet)}</div>
    <div class="seg arrtabs">${[['world', 'The world'], ['report', 'Orbital report']].map(([k, n]) => `<button data-act="arrtab" data-v="${k}" class="${k === arrTab ? 'on' : k === 'report' ? 'hot' : ''}">${n}</button>`).join('')}</div>
    ${tab}${arrSeen ? '<button class="opt go" data-act="arrive">Give it a name</button>' : ''}`;
}

/* ---------- the three views ---------- */
function threatRows() {
  const known = s.factors.filter(f => f.stage >= 1 && ['fauna', 'flora', 'ruin', 'plague'].includes(f.kind) && f.res !== 'destroyed');   // gone is gone (Lachlan, 2026-11-16)
  if (!known.length) return '';
  return `<h3>${ic('danger', 'h3i')}Out there</h3><div class="box">` + known.map(f => { const rel = f.kind === 'plague' ? '' : f.accord >= 40 ? ' · on terms' : f.accord <= -30 ? ' · hostile' : '';
    const st = f.res ? { destroyed: 'ended', accord: 'at peace', contained: 'held back', harnessed: 'in use', lost: 'lost to it' }[f.res] : ['', 'first signs', 'active', 'entrenched'][Math.min(3, f.stage)] + rel;
    const und = f.insight >= 60 ? 'well understood' : f.insight >= 25 ? 'partly understood' : 'not understood';
    return `<div class="row">${ic(KIND_ICON[f.kind] || 'unknown')}<div class="t"><b>${esc(f.Name)}</b><small>${st}${!f.res ? ` · ${und}` : ''}</small>${f.res ? '' : bar(f.threat, 'rust')}</div></div>`; }).join('') + `</div>`;
}
/* Groups: anyone out there or in here who acts as one. Natives and other humans once met, the factions the
   colony's own choices raised, the signature peoples, and the returned. */
/* part (T2-3): 'out' the groups outside the wire, with what last moved each (LF.groupWhy), for the reputation block; 'in'
   the factions and the returned; nothing, all of them. */
function groupRows(part) {
  const rows = [];
  // Broken, wiped out or disbanded is off the list (Lachlan, 2026-11-16): a movement that has stopped meeting, for whatever reason, is not a group any more.
  for (const f of s.factors) { if (f.stage < 1 || !['natives', 'humans', 'faction'].includes(f.kind) || f.res === 'destroyed' || (f.kind === 'faction' && f.res && f.res !== 'lost')) continue;
    const st = f.res ? { destroyed: 'broken', accord: 'at peace with the colony', contained: 'kept at a distance', harnessed: 'working with the colony', lost: 'the stronger party now' }[f.res]
      : f.kind === 'faction' ? `want a ${f.sub === 'order' ? 'more ordered' : f.sub === 'free' ? 'freer' : f.sub === 'mercy' ? 'more merciful' : f.sub === 'severe' ? 'harder' : f.sub === 'open' ? 'more open' : f.sub === 'closed' ? 'more closed' : f.sub} colony`
      : f.accord >= 40 ? 'on good terms' : f.accord >= 10 ? 'wary, but talking' : f.accord <= -30 ? 'hostile' : 'unknown quantities';
    const lead = f.leader && LF.h.byPid(s, f.leader); rows.push([f.kind === 'faction' ? 'faction' : KIND_ICON[f.kind], f.Name, st + (lead && lead.alive ? ` · led by ${lead.name}` : ''), f.kind === 'faction' ? '' : LF.groupWhy ? LF.groupWhy(s, f) : '', f.kind === 'faction' ? 'in' : 'out']); }
  if (s.used['oth.contact'] !== undefined) rows.push(['humans', 'The Reach', s.flags.oth_merged ? 'part of the colony now' : s.flags.oth_enemy ? 'hostile' : s.flags.oth_treaty || s.flags.oth_trade ? 'on terms' : 'the other ship\'s people', '', 'out']);
  if (s.used['hive.drums'] !== undefined && !s.flags.hive_destroyed && !s.flags.hive_poisoned) rows.push(['natives', 'The drummers', s.flags.hive_treaty ? 'a line of knots between you, honoured' : s.flags.hive_enemy ? 'at war with the colony' : 'many bodies, and the drums at night', '', 'out']);
  if (s.flags.returned && !s.flags.returned_gone) rows.push(['away', 'The returned', `${s.flags.returned} who came back changed from ${s.flags.returned_to}`, '', 'in']);
  const shown = part ? rows.filter(r => r[4] === part) : rows;
  if (!shown.length) return '';
  return `<h3>${ic('faction', 'h3i')}${part === 'out' ? 'How they see the colony' : part === 'in' ? 'Factions' : 'Groups and factions'}</h3><div class="box">${shown.map(([i, n, t, w]) => `<div class="row">${ic(i)}<div class="t"><b>${esc(n)}</b><small>${esc(t)}</small>${w ? `<small class="deed">${esc(w)}</small>` : ''}</div></div>`).join('')}</div>`;
}
/* Key settlers: the people the colony has had reason to name. One at landfall; up to twenty. */
/* Stand-in portraits until key settlers get their own (NEXT.md item 11): the scene library's portraits, dealt to
   people in the order they joined the colony through a shuffle fixed by the seed, so a face never changes hands. */
const FACES = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
/* Parties out past the wire: who, where to, how far along, and when they're due. The numbers match the map. */
function partyRows() { if (!s.away.length) return '';   // sorted by when they are due; the numbers are the map's
  return `<h3>${ic('away', 'h3i')}Out past the wire</h3><div class="box">${s.away.slice().sort((a, b) => a.due - b.due).map(a => { const P = LF.party(s, a);
    return `<div class="row party${P.silent ? ' late' : ''}"><span class="pnum">${P.n}</span><div class="t"><b>${esc(P.who)}, to ${esc(P.to)}</b><small>${esc(P.state.charAt(0).toUpperCase() + P.state.slice(1))}.${P.with.length ? ` With ${esc(P.with.join(' and '))}.` : ''}${P.danger ? ` Danger: ${DANGER[P.danger].toLowerCase()}.` : ''}</small></div>${P.lead ? faceOf(P.lead) || '' : ''}</div>`; }).join('')}</div>`; }
/* ---------- places (js/places.js, T2-4): tap one on the map, or its row in the list under it, to open it ---------- */
const POI_IC = { wreck: 'parts', crater: 'haz', spring: 'water', ridge: 'map', ore: 'mat', cave: 'unknown', ruin: 'ruin', growth: 'flora', herd: 'fauna', camp: 'humans', signal: 'tech', track: 'boot', mark: 'compass', town: 'colony' };
const POI_STATE = { rumoured: 'word of it only', located: 'found, nobody has been', visited: 'visited', 'worked out': 'worked out', gone: 'gone' };
const placeIc = p => ic(p.owner === 'natives' ? 'natives' : POI_IC[p.kind] || 'compass');
const placeFar = p => `${LF.monthsWord(p.months).replace(/^a /, 'A ').replace(/^\w/, c => c.toUpperCase())} away${p.bearing ? `, ${p.bearing}` : ''}`;
let poiOpen = '', poiAll = false;
const FIND_SAY = k => LF.FINDS[k].say;
const threadSay = p => { const T = !p.been.length && LF.placeThread && LF.placeThread(s, p); return T ? `${T.name ? T.name.charAt(0).toUpperCase() + T.name.slice(1) : 'What the colony is living through'} may show itself here. A party that gets there and back brings home what it saw, and what it is gets plainer.` : ''; };
function placeHTML(p) {
  const been = p.been.length ? p.been.map(b => `${b.t}, ${LF.dateStr(b.d).replace(/^Year/, 'year')}`).join('. ') + '.' : 'Nobody from the colony has been there.';
  return `<div class="box place" id="place"><div class="row">${placeIc(p)}<div class="t"><b>${esc(p.name)}</b><small>${esc(p.kindWord.replace(/^\w/, c => c.toUpperCase()))} · ${esc(POI_STATE[p.state] || p.state)}</small></div><button class="pbtn" data-act="poi" data-v="">Close</button></div>`
    + (p.known ? `<p class="pknown">${esc(p.known)}</p>` : '')
    + (LF.findOf && LF.findOf(s, p) ? `<p class="pneed">${esc(FIND_SAY(LF.findOf(s, p)))}</p>` : '')
    + (threadSay(p) ? `<p class="pneed">${esc(threadSay(p))}</p>` : '')
    + `<div class="tips"><span>${ic('time')}${esc(placeFar(p))}</span><span class="${p.danger >= 4 ? 'hot' : ''}">${ic('danger')}${esc(p.dangerWord)}</span></div>`
    + `<small class="phow">${esc(LF.poiHow(s, p))}</small><small class="phow">${esc(been)}</small>`
    + sendHTML(p) + `</div>`;
}
/* T2-5: the send order for this place (js/orders.js order.send, rows whose arg starts with the place's id): a small party,
   and a large one under each who could lead it, greyed with the reason when they cannot go. */
function sendHTML(p) {
  if (!LF.orders || (s.over && !s.over.cont)) return '';
  const rows = LF.orders(s, 'world').filter(o => o.id === 'send' && String(o.arg).split('|')[0] === p.id);
  if (!rows.length) return '';
  return `<div class="psend orders" data-poi="${esc(p.id)}"><div class="lbl">Send a party</div>${saidHTML('place')}${rows.map(ordRowHTML).join('')}</div>`;
}
/* Every place the colony knows of, as tiles under the map (2026-11-18, Lachlan: the map is small on a phone): what the yard
   is waiting on first (js/places.js LF.FINDS), then the ones nobody has been to, nearest first; folded after six. A tap
   opens the place across the grid under its own tile (grid-auto-flow: dense lets the next tile fill the gap beside it). */
const TILE_STATE = { rumoured: 'Word of it only', located: 'Nobody has been', visited: 'Visited', 'worked out': 'Worked out', gone: 'Gone' };
const DOTS = n => `<span class="dots" aria-label="${esc(LF.poiDanger(n))}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? (n >= 4 ? 'on hot' : 'on') : ''}"></i>`).join('')}</span>`;
function tileHTML(p) {
  const k = LF.findOf ? LF.findOf(s, p) : null, a = s.away.find(x => x.poi === p.id), P = a && LF.party(s, a), T = !k && !p.been.length && LF.placeThread ? LF.placeThread(s, p) : null;
  const far = `${p.months} month${p.months === 1 ? '' : 's'}`;
  return `<button class="tile${p.id === poiOpen ? ' on' : ''}${p.state === 'gone' ? ' gone' : ''}${['visited', 'worked out'].includes(p.state) ? ' done' : ''}${k ? ' want' : ''}" data-act="poi" data-v="${esc(p.id)}">`
    + `<span class="th">${placeIc(p)}${P ? `<span class="pnum">${P.n}</span>` : ''}${p.state !== 'gone' ? DOTS(p.danger) : ''}</span>`
    + `<b>${esc(p.name)}</b><small>${esc(TILE_STATE[p.state] || p.state)}</small><small class="far">${esc(far)}${p.bearing ? ' · ' + esc(p.bearing.replace(/(north|south|east|west)/g, m => m[0].toUpperCase()).replace(/-/g, '')) : ''}</small>`
    + (k ? `<span class="need">${esc(LF.FINDS[k].tag)}</span>` : T ? `<span class="need ev">${esc(T.dread ? 'Evidence' : 'A lead')}</span>` : '') + `</button>`;
}
function placesHTML(list) { if (!list.length) return '';
  const ord = { rumoured: 1, located: 0, visited: 2, 'worked out': 3, gone: 4 }, want = p => LF.findOf && LF.findOf(s, p) ? 0 : !p.been.length && LF.placeThread && LF.placeThread(s, p) ? 1 : 2;
  const L = list.filter(p => p.owner !== 'colony').sort((a, b) => (want(a) - want(b)) || (ord[a.state] - ord[b.state]) || (a.months - b.months) || (b.d || 0) - (a.d || 0));
  if (!L.length) return '';
  let shown = poiAll ? L : L.slice(0, 6); const open = poiOpen && L.find(p => p.id === poiOpen);
  if (open && !shown.includes(open)) shown = shown.concat(open);
  const fresh = L.filter(p => !['visited', 'worked out', 'gone'].includes(p.state)).length;
  return `<h3>${ic('map', 'h3i')}Places<span class="h3n">${fresh ? `${fresh} nobody has been to` : 'all visited'}</span></h3><div class="tiles">${shown.map(p => tileHTML(p) + (open === p ? placeHTML(p) : '')).join('')}</div>`
    + (L.length > 6 ? `<button class="pbtn more tmore" data-act="poimore">${poiAll ? 'Fewer' : `${L.length - shown.length} more`}</button>` : ''); }
/* What work the card's options are, and so who could be offered: "Needs exploring or fighting". */
/* The six officers grow older with the colony (Lachlan, 2026-11-16): from year 12 the portrait is cast_<key>_mid, from
   year 25 cast_<key>_old, each with its own hollow version (tools/scenes.py AGED; aged() above). By the game year only: no state.
   A promoted colonist has no key and keeps the stand-in face. */
// Aboard (still in orbit) the picture is cast_<key>_ship, the ship jumpsuit, where it has been painted.
const castFace = p => p.orbit && SCENES.has('cast_' + p.key + '_ship') ? 'cast_' + p.key + '_ship' : hollow(aged('cast_' + p.key));
function faceOf(p) {
  if (p && p.key && !facePainted(p.key)) return null;   // one of the twelve whose portrait is not painted yet: the icon, never a stranger's face
  if (p && facePainted(p.key) && SCENES.has('cast_' + p.key)) return `<img class="face" src="art/scenes/${castFace(p)}.webp" alt="" loading="lazy" decoding="async">`;   // the officers have a face of their own
  const deck = FACES.slice(); let h = s.seed | 0;
  for (let i = deck.length - 1; i > 0; i--) { h = (Math.imul(h, 1103515245) + 12345) | 0; const q = (h >>> 8) % (i + 1); [deck[i], deck[q]] = [deck[q], deck[i]]; }
  const k = `lib_portrait_${String(deck[(+p.id.slice(1)) % deck.length]).padStart(2, '0')}`;
  return SCENES.has(k) ? `<img class="face" src="art/scenes/${k}.webp" alt="" loading="lazy" decoding="async">` : null;
}
function settlerHTML(p) {
  const st = p.orbit ? 'aboard the ship' : p.away ? 'away with a party' : LF.laidUp(s, p) ? `hurt · back in ${months(p.hurt - s.day)}` : p.role ? p.trait + (p.green ? ' · new to the job' : '') : LF.rank(p);
  // Who they are: what they hold, what they want, how they stand with you, who they are tied to, and what changed them.
  const bonds = LF.bondLine ? LF.bondLine(s, p) : '';
  const who = p.vals ? `<small>${p.nature ? esc(p.nature) : `${LF.pastOf(p) ? esc(LF.pastOf(p)) + ' ' : ''}${esc(LF.creed(p))} ${esc(LF.want(p))}`}</small><small>${esc(p.first)} ${LF.standing(p)}${p.sore && p.loyal < 45 && s.day - p.sore.d < 240 ? `, and has not forgotten “${esc(p.sore.t)}”` : ''}.${bonds ? ' ' + esc(bonds) : ''}</small>`
    + (p.arcs || []).map(a => `<small class="deed">${LF.dateStr(a.d)} · ${esc(a.txt)}.</small>`).join('') + (LF.hookOn(s, p) ? `<small class="deed">${esc(p.first)} ${esc(p.hook.txt)}.</small>` : '') : '';
  const last = p.deeds.length ? p.deeds[p.deeds.length - 1].txt : (Object.values(p.marks).find(m => m.txt) || {}).txt;
  return `<div class="row">${faceOf(p) || ic(LF.laidUp(s, p) ? 'hurt' : p.away ? 'away' : p.deeds.length >= 3 ? 'laurel' : p.role ? 'people' : 'notable')}<div class="t"><b>${esc(p.name)}</b><small>${esc(LF.title(p))} · ${st}${(p.role ? p.perks : p.perks.slice(1)).length ? ' · ' + (p.role ? p.perks : p.perks.slice(1)).map(k => LF.PERKS[k].name).join(', ') : ''}</small>` + who
    + (p.seat && p.role && p.body !== undefined && !p.orbit ? `<small class="stats">${Object.keys(LF.STATS).map(k => `<span class="${k !== 'native' && p[k] < 45 ? 'low' : ''}">${LF.STATS[k].name}: ${LF.statWord(p, k)}</span>`).join('')}</small>` : '')
    + (last ? `<small class="deed">${esc(last.charAt(0).toUpperCase() + last.slice(1))}.</small>` : '') + `</div></div>`;
}
const VIEW_NAME = { colony: 'The colony', world: 'The country', people: 'The people', ship: 'The ship' };
const TABS = [['colony', 'Colony', 'colony'], ['world', 'World', 'world'], ['people', 'Crew', 'people'], ['ship', 'Ship', 'ship']];
/* The four views as tabs (Lachlan, 2026-11-15: a Ship tab, and the crew page to look at). The game still takes the
   player to each card's own view; a tab only lets them look at another while the card waits. */
function tabsHTML(v) { return `<nav class="tabs">${TABS.map(([k, n, i]) => `<button data-act="tab" data-v="${k}" class="${k === v ? 'on' : ''}">${ic(i)}<span>${n}</span></button>`).join('')}</nav>`; }
const SYS_IC = { reactor: 'machines', fabricator: 'parts', reclaimer: 'water', hydroponics: 'food', medbay: 'medbay', lander: 'lander' };
/* ---------- orders (js/orders.js): a short list on each view, given while the card waits ---------- */
const ORDER_TITLE = { colony: 'Orders for the yard', world: 'Orders past the wire', people: 'Orders for the colony', ship: 'Orders for the lander' };
/* A panel's orders are drawn by the panel (the yard, T2-2; a place, T2-5), except a row its order puts in the box too
   (inBox: the send order's party to the nearest place nobody has been, under its boxLabel). */
const inBox = o => { const O = LF.ORDERS[o.id] || {}; return !O.panel || (O.inBox && O.inBox(s, o.arg)); };
const saidHTML = v => ordSaid && ordSaid.v === v ? `<div class="chips osaid">${ordSaid.chips.map(c => `<span class="${c.good ? 'good' : 'bad'}">${esc(c.t)}</span>`).join('')}</div><p class="onote">${esc(ordSaid.text)}</p>` : '';
function ordersHTML(v, title) {
  if (!LF.orders || !s.world || LF.aloft(s) || (s.over && !s.over.cont)) return '';
  const rows = LF.orders(s, v).filter(inBox).map(o => { const O = LF.ORDERS[o.id]; return O.panel && O.boxLabel ? Object.assign({}, o, { label: O.boxLabel(s, o.arg) }) : o; });
  if (!rows.length) return '';
  return `<h3>${ic('log', 'h3i')}${esc(title || ORDER_TITLE[v] || 'Orders')}</h3><div class="orders">${saidHTML(v) || (v === 'world' && !poiOpen ? saidHTML('place') : '')}${rows.map(ordRowHTML).join('')}</div>`;
}
function ordRowHTML(o) {
    const open = ordOpen === o.key && !o.lock, busy = ordHold && ordHold.key === o.key;
    const tips = (o.info || []).map(([k, x]) => `<span class="${k === 'danger' ? 'hot' : ''}">${ic(INFO[k] || 'unknown')}${esc(x)}</span>`);
    if (o.cost) for (const k in o.cost) if (o.cost[k]) tips.push(`<span class="${o.cost[k] > s.res[k] * 0.4 ? 'hot' : ''}">${ic(k)}${esc(LF.amount(s, k, -o.cost[k]))}</span>`);
    return `<button class="opt ord${open ? ' open' : ''}" data-act="ord" data-v="${esc(o.key)}" ${o.lock || ordHold ? 'disabled' : ''}>${ic(o.lock ? 'unknown' : 'good')}<span class="b"><span class="l">${esc(o.label)}</span>`
      + (open || o.lock ? (o.note && open ? `<em>${esc(o.note)}</em>` : '') : '') + (tips.length && (open || !o.lock) ? `<span class="tips">${tips.join('')}</span>` : '')
      + (o.lock ? `<span class="why">${esc(o.lock)}</span>` : '') + `</span></button>`
      + (busy ? `<div class="proc" role="status"><span class="lbl">The order goes out</span><div class="pbar"><i style="transform:scaleX(${ordP()})"></i></div></div>`
        : open ? `<div class="ordgo"><button class="opt go" data-act="ordgo" data-v="${esc(o.key)}">Give the order</button><button class="opt" data-act="ord" data-v="">Not now</button></div>` : '');
}
const ordP = () => ordHold ? Math.min(1, (performance.now() - ordHold.t0) / ordHold.ms) : 0;
function fillOrd() { if (!ordHold) return; const i = document.querySelector('.orders .pbar i'); if (i) i.style.transform = `scaleX(${ordP()})`; requestAnimationFrame(fillOrd); }
/* While an order panel is open the review timer stops, so the card never slides in over a half-given order. */
function pauseReview() { if (!review || review.ready || review.left !== undefined) return; clearTimeout(reviewTimer); review.left = Math.max(800, review.ms - (performance.now() - review.t0)); }
function resumeReview() { if (!review || review.ready || review.left === undefined) return; const left = review.left; delete review.left; review.t0 = performance.now() - (review.ms - left); reviewTimer = setTimeout(due, left); requestAnimationFrame(fillReview); }
const ordRow = key => { for (const v of LF.VIEWS) { const o = LF.orders(s, v).find(x => x.key === key); if (o) return Object.assign({ v }, o); } return null; };
function giveOrder(key) {
  const o = ordRow(key); if (!o || o.lock || ordHold) return;
  ordHold = { key, t0: performance.now(), ms: reduced() ? 300 : o.hold || 1800 }; requestAnimationFrame(fillOrd);
  ordTimer = setTimeout(() => { ordHold = null; ordOpen = ''; const c0 = s.cur;
    const r = LF.order(s, o.id, o.arg);
    if (r.ok) { ordSaid = { v: (LF.ORDERS[o.id] || {}).panel || o.v, text: r.text, chips: r.chips }; if (window.LFSound && LFSound.order) LFSound.order(o.id, o.arg); }
    save();
    if (s.cur !== c0) { clearTimeout(reviewTimer); review = null; peek = ''; reveal = true; render(); toCard(); return; }   // a launch: the landing is told at once
    render(); resumeReview(); }, ordHold.ms);
  render();
}
/* The lander as it stands: fuelled on the pad, dry, grounded under its tarpaulin, or lost (tools/craft.py SHOTS). */
function landerPic() { const L = s.machines.lander;
  const k = !L || L.lost ? 'lander_gone' : s.flags.lander_grounded ? 'lander_grounded' : (s.fuel || 0) > 0 ? 'lander_pad' : 'lander_dry';
  return SCENES.has(k) ? `<img class="scene" src="art/scenes/${k}.webp" alt="" decoding="async">` : ''; }
function landerHTML() {
  const L = s.machines.lander, tank = LF.TANK ? LF.TANK(s) : 2, f = s.fuel || 0;
  const pips = Array.from({ length: Math.max(tank, f) }, (_, i) => `<i class="${i < f ? 'on' : s.refuel && i < f + s.refuel.n ? 'due' : ''}"></i>`).join('');
  const word = !L || L.lost ? 'Lost' : s.flags.lander_grounded ? 'Grounded' : LF.machineWord(s, 'lander');
  const line = !L || L.lost ? 'There is no lander.' : s.flags.lander_grounded ? 'Grounded under a tarpaulin, its batteries pulled.'
    : s.refuel ? 'The digester is filling the tanks. They read full at the start of next month.'
    : f ? `Fuel for ${String(NUMW[f] || f).toLowerCase()} flight${f === 1 ? '' : 's'}.` : LF.hasDigester && LF.hasDigester(s) ? 'Tanks dry. The digester can fill them from the stores.' : s.project === 'digester' ? 'Tanks dry. The digester is going up behind the pad.' : 'Tanks dry. Fuel needs a digester.';
  return `<div class="lander">${landerPic()}<div class="lrow"><div class="t"><b>The lander · ${esc(word)}</b><small>${esc(line)}${s.flown ? ` ${NUMW[s.flown] || s.flown} flight${s.flown === 1 ? '' : 's'} flown since landfall.` : ''}</small></div>${L && !L.lost ? `<span class="pips" aria-label="Fuel ${f} of ${tank}">${pips}</span>` : ''}</div></div>`;
}
/* The Ship view: the lander and its fuel, the systems still in the hold, the officers aboard, the banks. */
function shipView() {
  const w = s.world, L = s.machines.lander, up = LF.inOrbit(s), aboard = LF.aboard(s), downs = Object.keys(s.machines).filter(id => id !== 'lander' && !aboard.includes(id));
  const sys = id => { const m = s.machines[id], M = LF.MACHINES[id]; return `<div class="row${m.lost ? ' gone' : ''}">${ic(SYS_IC[id] || 'machines')}<div class="t"><b>${esc(M.name)}</b><small>${m.lost ? 'Lost' : LF.machineWord(s, id)} · ${esc(M.role)}</small></div></div>`; };
  const dmg = LF.shipDamage ? LF.shipDamage(s) : [];
  // The Ariadne in orbit over the planet (Lachlan, 2026-11-16); dimmed while she has gone dark.
  return `${landerHTML()}${ordersHTML('ship')}<div class="banner orbit"><img class="scene" src="art/pieces/limb_${w.type}.webp" alt="">${s.flags.ship_down ? '' : `<img class="craft${s.flags.qs_dark ? ' dark' : ''}" src="art/pieces/ship.webp" alt="The ${esc(w.ship)}">`}</div>
    ${LF.shipPlan ? `<div class="plan">${LF.shipPlan(s)}${dmg.length ? `<div class="chips">${dmg.map(d => `<span class="bad">${esc(d)}</span>`).join('')}</div>` : ''}</div>` : ''}
    <p class="mood">${esc(LF.shipLine(s))}</p>
    <h3>${ic('people', 'h3i')}Aboard</h3>${up.length ? `<div class="box six">${up.map(p => `<div class="seat"><span class="lbl">${esc(LF.SEATS[p.seat].name)}</span>${settlerHTML(p)}<small class="does">${esc(LF.seatLine(s, p.seat))}</small></div>`).join('')}</div>` : `<div class="note">None of your officers is aboard. The ship runs herself.</div>`}
    <h3>${ic('ship', 'h3i')}In the hold</h3>${aboard.length ? `<div class="box">${aboard.map(sys).join('')}</div><div class="note">Each launch brings one system down, and one officer.</div>` : `<div class="note">Nothing left in the hold.</div>`}
    <h3>${ic('sleepers', 'h3i')}The cryo banks</h3><div class="box"><div class="row">${ic('sleepers')}<div class="t"><b>${s.sleepers} asleep</b><small>${s.sleepers ? 'Every flight can bring twenty down. Every season a few pods fail.' : s.flags.ship_down ? 'The banks came down with the ship.' : 'The banks are empty.'}</small></div></div></div>
    <h3>${ic('machines', 'h3i')}On the ground</h3><div class="box">${downs.map(sys).join('')}</div>`;
}
/* ---------- the yard (T2-2, js/orders.js): what is going up, what is paused and queued, what could be built ----------
   Its orders carry panel: 'yard' and are drawn here rather than in the Orders box: each build is one row, and a tap opens
   it with the council's voice and the orders that fit (start or switch, queue). Confirming runs the same hold bar. */
const yardRows = () => LF.orders(s, 'colony').filter(o => (LF.ORDERS[o.id] || {}).panel === 'yard');
function yardTips(o, id) {
  const tips = (o ? o.info : []).map(([k, x]) => `<span class="${k === 'danger' ? 'hot' : ''}">${ic(INFO[k] || 'unknown')}${esc(x)}</span>`);
  const c = o && o.cost; if (c) for (const k in c) if (c[k]) tips.push(`<span class="${c[k] > s.res[k] ? 'hot' : ''}">${ic(k)}${esc(LF.amount(s, k, -c[k]))}</span>`);
  return tips.length ? `<span class="tips">${tips.join('')}</span>` : '';
}
const yBtn = (o, txt) => o ? `<button class="ybtn${ordOpen === o.key ? ' on' : ''}" data-act="ord" data-v="${esc(o.key)}" ${o.lock || ordHold ? 'disabled' : ''}>${esc(txt)}</button>` : '';
const yBusy = () => `<div class="proc" role="status"><span class="lbl">The order goes out</span><div class="pbar"><i style="transform:scaleX(${ordP()})"></i></div></div>`;
/* The confirm under a block, for whichever of its orders is open: its note, its chips, give it or not now. */
function yConfirm(list) {
  for (const o of list) { if (!o) continue;
    if (ordHold && ordHold.key === o.key) return yBusy();
    if (ordOpen === o.key && !o.lock) return `<div class="yopen"><p class="onote">${esc(o.note)}</p>${yardTips(o)}</div>
      <div class="ordgo"><button class="opt go" data-act="ordgo" data-v="${esc(o.key)}">${esc(o.label)}</button><button class="opt" data-act="ord" data-v="">Not now</button></div>`; }
  return '';
}
const yBar = f => `<div class="bar rust"><i style="width:${Math.round(100 * f)}%"></i></div>`;
/* One build in the list, opened or not: its head, and when open its voice and the orders that fit. */
function yPick(id, go, qu, head, open, parkedNow, lock, lower) {
  if (!open) return head;
  if (ordHold && [go, qu].some(o => o && ordHold.key === o.key)) return head + yBusy();
  const btns = [go && !go.lock ? `<button class="opt go" data-act="ordgo" data-v="${esc(go.key)}">${esc(s.project ? `Pause the ${lower(s.project)}, ${parkedNow ? 'resume' : 'start'} this` : parkedNow ? 'Resume it' : 'Start it')}</button>` : '',
    qu && !qu.lock ? `<button class="opt${go && !go.lock ? '' : ' go'}" data-act="ordgo" data-v="${esc(qu.key)}">${esc((s.bq || []).length ? 'Queue it after that' : `Queue it after the ${lower(s.project)}`)}</button>` : ''].filter(Boolean);
  const qlock = qu && qu.lock && qu.lock !== lock ? `<span class="why">Queue: ${esc(qu.lock)}</span>` : '';
  return head + `<div class="yopen"><p class="onote">${esc(LF.yardVoice(s, id))}</p><p class="onote">${esc(LF.yardDesc(s, id))}</p>${qlock}</div>`
    + (btns.length ? `<div class="ordgo ycol">${btns.join('')}<button class="opt" data-act="ord" data-v="">Not now</button></div>` : '');
}
let yWait = false;   // the folded "Not yet" list stays as the player left it across redraws
document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('ywait')) yWait = e.target.open; }, true);
function yardHTML() {
  if (!LF.yardList || !s.world || LF.aloft(s) || (s.over && !s.over.cont)) return '';
  const rows = yardRows(), get = (id, arg) => rows.find(o => o.id === id && (arg === undefined || o.arg === arg));
  const said = ordSaid && ordSaid.v === 'yard' ? `<div class="chips osaid">${ordSaid.chips.map(c => `<span class="${c.good ? 'good' : 'bad'}">${esc(c.t)}</span>`).join('')}</div><p class="onote">${esc(ordSaid.text)}</p>` : '';
  const lower = id => LF.projName(s, id).toLowerCase(), stop = get('stop');
  // the one in hand
  let hand;
  if (s.project) { const id = s.project, f = LF.yardFrac(s, id), pa = get('pause'), ca = get('cancel', id);
    hand = `<div class="box yard"><div class="lbl">Going up</div><div class="yh"><b>${esc(LF.projName(s, id))}</b><span>${esc(LF.yardHow(f))} · ${esc(LF.buildSpan(LF.yardLeft(s, id)).replace(/^About/, 'about'))} left</span></div>${yBar(f)}
      <small class="ydesc">${esc(LF.yardDesc(s, id))}</small><div class="ybtns">${yBtn(pa, 'Pause')}${yBtn(ca, 'Cancel')}${yBtn(stop, 'Salvage')}</div>${yConfirm([pa, ca, stop])}</div>`; }
  else hand = `<div class="box yard"><div class="lbl">Going up</div><div class="yh"><b>Nothing</b></div><small class="ydesc">The crews are on salvage.${s.salv ? ' They are out with the sledges for the rest of the month, and the yard is filling.' : s.bq && s.bq.length ? ` The ${esc(lower(s.bq[0]))} is next, once the yard holds its materials.` : ''}</small>
      ${stop && !stop.lock ? `<div class="ybtns">${yBtn(stop, 'Send them out with the sledges')}</div>${yConfirm([stop])}` : ''}</div>`;
  // paused, each with its bar
  const pk = Object.keys(s.parked || {}).map(id => { const f = LF.yardFrac(s, id), go = get(s.project ? 'switch' : 'build', id), ca = get('cancel', id);
    return `<div class="box yard parked"><div class="lbl">Paused · ${esc(LF.dateStr(s.parked[id].d).toLowerCase())}</div><div class="yh"><b>${esc(LF.projName(s, id))}</b><span>${esc(LF.yardHow(f))}</span></div>${yBar(f)}
      ${go && go.lock ? `<span class="why">${esc(go.lock)}</span>` : ''}<div class="ybtns">${yBtn(go, 'Resume')}${yBtn(ca, 'Cancel')}</div>${yConfirm([go, ca])}</div>`; }).join('');
  // the queue, in order
  const q = (s.bq || []).map((id, n) => { const up = get('bqup', id), dr = get('unqueue', id);
    return `<div class="row yq"><span class="qn">${n + 1}</span><div class="t"><b>${esc(LF.projName(s, id))}</b><small>${n ? 'After that' : 'Next, when the crews are free'}${s.parked && s.parked[id] ? ' · paused, its materials in it' : ` · ${LF.cost(s, id).mat} materials when it starts`}</small></div>${yBtn(up, 'First')}${yBtn(dr, 'Drop')}</div>${yConfirm([up, dr])}`; }).join('');
  // the list: each build once, its voice and the orders that fit
  const ready = [], waiting = [];   // builds that cannot start yet fold away under their own heading (Lachlan, 2026-11-19)
  LF.yardList(s).forEach(id => {
    const go = get(s.project ? 'switch' : 'build', id), qu = s.project ? get('queue', id) : null, key = 'pick:' + id, open = ordOpen === key || [go, qu].some(o => o && (ordOpen === o.key || ordHold && ordHold.key === o.key));
    const T = LF.PITCH[id], who = T && LF.h.P(s, T.by), parkedNow = s.parked && s.parked[id], lock = go ? go.lock : 'Not now';
    const blocked = lock && !(qu && !qu.lock), into = blocked ? waiting : ready;
    if (blocked && open) yWait = true;
    const lab = `${LF.projName(s, id)}${parkedNow ? ' (paused)' : ''}`, wants = who ? `${who.name} wants it` : T ? `${LF.seatWord(s, T.by).replace(/^./, c => c.toUpperCase())} wants it` : '';
    const head = `<button class="opt ord yb${open ? ' open' : ''}${blocked ? ' locked' : ''}" data-act="ord" data-v="${esc(key)}" ${ordHold ? 'disabled' : ''}>${ic(lock ? 'unknown' : 'build')}<span class="b"><span class="l">${esc(lab)}</span>`
      + `${wants ? `<small class="who">${esc(wants)}</small>` : ''}${lock && !open ? '' : yardTips(go, id)}${lock ? `<span class="why">${esc(lock)}</span>` : ''}</span></button>`;   // a locked build shows only what it waits on until it is opened
    into.push(yPick(id, go, qu, head, open, parkedNow, lock, lower));
  });
  const list = ready.join(''), wait = waiting.length ? `<details class="standing ywait"${yWait ? ' open' : ''}><summary>${ic('unknown', 'h3i')}Not yet · ${waiting.length}</summary><div class="orders ylist">${waiting.join('')}</div></details>` : '';
  // standing, folded, with the day each was finished
  const built = Object.keys(s.built).filter(id => LF.PROJECTS[id]).sort((a, b) => s.built[a] - s.built[b]);
  const stand = built.length ? `<details class="standing"><summary>${ic('colony', 'h3i')}Standing · ${built.length}</summary><div class="box">${built.map(id => `<div class="row"><div class="t"><b>${esc(LF.projName(s, id))}</b><small>Finished ${esc(LF.dateStr(s.built[id]).toLowerCase())}. ${esc(LF.yardDesc(s, id))}</small></div></div>`).join('')}</div></details>` : '';
  return `<h3>${ic('build', 'h3i')}The yard</h3><div class="yardp">${said}${hand}${pk}${q ? `<div class="box yqueue"><div class="lbl">Queued</div>${q}</div>` : ''}</div>
    ${list || wait ? `<h3>${ic('mat', 'h3i')}What could be built</h3>${list ? `<div class="orders ylist">${list}</div>` : ''}${wait}` : ''}${stand}`;
}
function colonyView() {
  const A = LF.ARCHETYPES[s.world.type], pil = LF.pillars(s), d = LF.date(s.day), cut = Object.values(pil).filter(Boolean).length;
  return `<div class="view">${LF.colonyView ? LF.colonyView(s) : LF.scene(s)}<div class="cap"><b>${esc(spot || (s.world.zone || '').replace(/^the /, 'The '))}</b><div class="lbl">${spot ? 'Tap anything in the settlement' : `${A.name} · ${LF.SEASONS[d.season]}, year ${d.year}`}</div></div></div>
    ${yardHTML()}${ordersHTML('colony')}<p class="mood">${esc(LF.mood(s))}</p>
    <div class="cords">${Object.keys(PILL).map(k => `<span class="${pil[k] ? 'cut' : k === 'people' && s.built.school ? 'half' : ''}">${PILL[k]}${!pil[k] && k === 'people' ? ` ${LF.heads(s)}/${LF.peopleNeed(s)}` : ''}</span>`).join('')}</div>
    <div class="note" style="text-align:center">${cut === 5 ? 'All five cords are cut. The colony can outlive the ship.' : !cut ? 'No cord is cut yet. Cut all five and the colony can outlive the ship.' : `${NUMW[cut]} of five cords cut. Cut all five and the colony can outlive the ship.`}${pil.people ? '' : s.built.school ? ` The school is built; the people cord is cut at ${LF.peopleNeed(s)} colonists, and ${LF.heads(s)} live here.` : ` The people cord needs a school and ${LF.peopleNeed(s)} colonists; ${LF.heads(s)} live here.`}</div>
    ${LF.aboutMachines(s) ? shipTable() : ''}`;
}
/* The ship's machines: a plain table until they get a view of their own. Shown when a decision is about them. */
function shipTable() {
  return `<h3>${ic('machines', 'h3i')}Ship machinery</h3><table class="tbl"><tbody>${Object.keys(LF.MACHINES).map(id => { const m = s.machines[id], w = LF.machineWord(s, id);
    return `<tr class="${m.lost ? 'gone' : ''}"><th>${LF.MACHINES[id].name}</th><td class="${m.lost || w === 'Failing' ? 'bad' : ''}">${w}</td></tr>`; }).join('')}</tbody></table>`;
}
/* The Record: what the colony is still asking, what it has closed, and where two of its stories met (LF.theRecord; LF.record is the ledger). */
function recordHTML() {
  if (!LF.theRecord) return ''; const R = LF.theRecord(s); if (!R.open.length && !R.closed.length) return '';
  return `<h3>${ic('unknown', 'h3i')}The Record</h3><div class="box">`
    + R.open.map(o => `<div class="row">${ic('unknown')}<div class="t"><b>${esc(o.title)}</b><small>${esc(o.q)}</small>${o.notes.map(n => `<small class="deed">${esc(n)}</small>`).join('')}</div></div>`).join('')
    + R.closed.map(c => `<div class="entry"><span class="lbl">${esc(c.title)} · ${LF.dateStr(c.d)}</span>${esc(c.txt)}</div>`).join('')
    + (R.met.length ? `<div class="note">Where things met: ${R.met.slice(-3).map(m => esc(m.t)).join(' · ')}</div>` : '') + `</div>`;
}
function worldView() {
  const A = LF.ARCHETYPES[s.world.type], places = LF.pois ? LF.pois(s) : [], open = poiOpen && places.find(p => p.id === poiOpen);
  return `<div class="view">${LF.worldView ? LF.worldView(s) : LF.worldMap(s)}<div class="cap"><b>${esc(spot || s.world.planet)}</b><div class="lbl">${spot ? 'Tap anything on the map' : `${A.name} · the country round the landing site`}</div></div></div>
    ${placesHTML(places)}${open && open.owner === 'colony' ? placeHTML(open) : ''}${ordersHTML('world')}<p class="mood">${esc(LF.vibes(s)[4].t)}${s.away.length ? ' ' + esc(LF.mood(s).split('. ').filter(t => / away |overdue/.test(t)).join('. ')) : ''}</p>${partyRows()}${threatRows()}${recordHTML()}`;
}
/* The colony's humanity (js/humanity.js): a bar, a word and a line. Shown on the People view and the recap. */
function humHTML() {
  if (!LF.hum || !s.world || LF.aloft(s)) return '';
  const v = LF.hum(s);
  return `<div class="hum${v < 20 ? ' low' : ''}"><div class="hl"><span class="lbl">Humanity</span><b>${esc(LF.humWord(v))}</b></div>${bar(v, 'humbar')}<small>${esc(LF.humLine(s))}</small></div>`;
}
/* Morale (js/ebb.js): the same bar, so the player can see the low ebb coming. */
function moraleHTML() {
  if (!s.world || LF.aloft(s) || !LF.moraleLine) return '';
  const v = Math.round(s.morale);
  return `<div class="hum${v < 20 ? ' low' : ''}"><div class="hl"><span class="lbl">Morale</span><b>${esc(LF.moraleWord2(v))}</b></div>${bar(v, 'humbar')}<small>${esc(LF.moraleLine(s))}</small></div>`;
}
/* ---------- the Crew view (T2-3): reputation, the last year, people folded to a line ---------- */
/* What the colony is known as, the two bars, how the groups outside see it and the deeds that weigh most. No numbers for regard. */
function reputationHTML() {
  const deeds = LF.weighs ? LF.weighs(s) : [];
  return `<p class="mood">${esc(LF.knownAs ? LF.knownAs(s) : '')}</p>${moraleHTML()}${humHTML()}${groupRows('out')}`
    + (deeds.length ? `<h3>${ic('laurel', 'h3i')}What it will be remembered for</h3><div class="box">${deeds.map(d => `<div class="entry">${esc(d.charAt(0).toUpperCase() + d.slice(1))}.</div>`).join('')}</div>` : '');
}
/* The last year as a record (LF.history): dated, newest first, six shown and the rest folded. */
const HIST_SHOWN = 6;
function historyHTML() {
  const h = LF.history ? LF.history(s) : []; if (!h.length) return '';
  const line = e => `<div class="entry${e.k === 'chron' ? '' : ' pick'}"><span class="lbl">${LF.dateStr(e.d)}</span>${esc(e.t)}</div>`;
  const rest = h.slice(HIST_SHOWN);
  return `<h3>${ic('log', 'h3i')}The last year</h3><div class="box hist">${h.slice(0, HIST_SHOWN).map(line).join('')}`
    + (rest.length ? `<details><summary>${rest.length === 1 ? 'One more' : `${rest.length} more`} from the year</summary>${rest.map(line).join('')}</details>` : '') + `</div>`;
}
/* A person in one line: face, name, office and state. A tap opens the full entry (settlerHTML) in place. */
function whoHTML(p) {
  if (whoOpen === p.id) return `<div class="who open" data-act="who" data-v="${esc(p.id)}" role="button" tabindex="0" aria-expanded="true">${settlerHTML(p)}</div>`;
  const low = p.seat && p.role && !p.orbit ? ['body', 'mind'].filter(k => p[k] !== undefined && p[k] < 45).map(k => `${LF.STATS[k].name.toLowerCase()} ${LF.statWord(p, k)}`) : [];
  const st = p.seat && p.role ? LF.dutyWord(s, p) : p.away ? 'away with a party' : LF.laidUp(s, p) ? `hurt, back in ${months(p.hurt - s.day)}` : LF.rank(p);
  return `<div class="who" data-act="who" data-v="${esc(p.id)}" role="button" tabindex="0" aria-expanded="false"><div class="row">${faceOf(p) || ic(LF.laidUp(s, p) ? 'hurt' : p.away ? 'away' : p.role ? 'people' : 'notable')}<div class="t"><b>${esc(p.name)}</b><small>${esc(LF.title(p))} · <span class="${st === 'on duty' ? '' : 'duty'}">${esc(st)}</span>${low.length ? ` · <span class="duty">${esc(low.join(', '))}</span>` : ''}</small></div></div></div>`;
}
/* An officer's own page (js/profile.js): who they are, how they are, and what they make of the colony, of you and of the
   others. Opened by a tap on one of the twelve; the People view is this page until it is closed. */
function profileHTML(p, f) {
  const sec = (h, body) => body ? `<div class="psec"><span class="lbl">${esc(h)}</span>${body}</div>` : '';
  const q = (t, seat) => `<p class="say sp sp-${seat || p.seat}">${esc(t)}</p>`;
  const stats = p.role && p.body !== undefined && !p.orbit ? `<small class="stats">${Object.keys(LF.STATS).map(k => `<span class="${k !== 'native' && p[k] < 45 ? 'low' : ''}">${LF.STATS[k].name}: ${LF.statWord(p, k)}</span>`).join('')}</small>` : '';
  const last = p.deeds.length ? p.deeds[p.deeds.length - 1].txt : (Object.values(p.marks).find(m => m.txt) || {}).txt;
  return `<div class="box profile enter"><button class="pbtn back" data-act="who" data-v="${esc(p.id)}">Back to the crew</button>
    <div class="phead">${faceOf(p) || ic('people')}<div class="t"><b>${esc(f.name)}</b><span class="lbl sp sp-${p.seat}">${esc(f.title)} · ${esc(f.seat)}</span><small>${f.age ? `Age ${f.age} · ` : ''}${esc(f.from)}</small><small>${esc(LF.dutyWord(s, p))}${(p.perks || []).length ? ' · ' + p.perks.map(k => LF.PERKS[k].name).join(', ') : ''}</small>${p.role ? edgeHTML(p.key) : ''}</div></div>
    ${sec('Their normal', `<p>${esc(f.normal)}</p>${f.record.length ? `<ul class="rec">${f.record.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}`)}
    ${sec('Right now', (f.where ? `<p>${esc(f.where)}</p>` : '') + (f.now ? q(f.now) : '') + stats + (last ? `<small class="deed">${esc(last.charAt(0).toUpperCase() + last.slice(1))}.</small>` : '') + (p.arcs || []).map(a => `<small class="deed">${LF.dateStr(a.d)} · ${esc(a.txt)}.</small>`).join(''))}
    ${sec('On the colony', q(f.colony))}
    ${sec('On you', q(f.you) + `<small>${esc(f.standing)}${f.sore ? ` ${esc(p.first)} has not forgotten “${esc(f.sore)}”.` : ''}</small>`)}
    ${sec('On the others', f.others.map(o => `<div class="pon"><b>${esc(o.name)}</b><span class="lbl sp sp-${o.seatKey}">${esc(o.seat)}</span>${o.gone ? `<p>${esc(o.line)}</p>` : q(o.line)}</div>`).join('') + (f.bonds ? `<small>${esc(f.bonds)}</small>` : ''))}
    <button class="pbtn back" data-act="who" data-v="${esc(p.id)}">Back to the crew</button></div>`;
}
function peopleView() {
  const op = whoOpen && s.people.find(p => p.id === whoOpen), pf = op && op.alive && op.role && LF.profile ? LF.profile(s, op) : null;
  if (pf) return profileHTML(op, pf);
  const key = LF.keySettlers(s).sort((a, b) => (b.deeds.length - a.deeds.length) || (a.known || 0) - (b.known || 0)), gone0 = s.people.filter(p => !p.alive && (p.known || !p.role)), dead = gone0.filter(p => !p.left), left = gone0.filter(p => p.left);
  const six = LF.SEAT_ORDER.map(k => { const p = LF.officer(s, k), S = LF.SEATS[k], line = LF.seatLine(s, k);
    return `<div class="seat${p && LF.seatState(s, k) === 'here' ? '' : ' off'}"><span class="lbl sp sp-${k}">${esc(S.name)}</span>${p ? whoHTML(p) : `<div class="row">${ic('people')}<div class="t"><b>Nobody</b><small>${LF.seatGone(s, k) ? 'Gone, and nobody to replace them' : 'Vacant'}</small></div></div>`}<small class="does">${esc(line || S.does)}</small></div>`; }).join('');
  const others = key.filter(p => !p.seat || !p.role);
  return `${reputationHTML()}${ordersHTML('people')}${historyHTML()}
    <p class="mood">${esc(LF.rosterLine(s))} ${esc(LF.vibes(s)[1].t)}${LF.genLine ? ' ' + esc(LF.genLine(s)) : ''}</p>
    <h3>${ic('notable', 'h3i')}Your officers</h3><div class="box six">${six}</div>
    ${groupRows('in')}
    ${others.length ? `<h3>${ic('notable', 'h3i')}Known by name</h3><div class="box">${others.map(whoHTML).join('')}</div>` : ''}
    <h3>What the colony has become</h3><div class="box">${Object.keys(LF.DOC).map(ax => { const v = s.val[ax];
      return `<div class="axis"><span class="${v <= -3 ? 'set' : ''}">${LF.DOC[ax][1]}</span><div class="track"><i style="left:${50 + v * 100 / 12}%"></i></div><span class="${v >= 3 ? 'set' : ''}">${LF.DOC[ax][0]}</span></div>`; }).join('')}</div>
    ${dead.length ? `<h3>On the wall</h3><div class="box">${dead.slice(-6).map(p => `<div class="entry" style="opacity:.6"><span class="lbl">${esc(LF.title(p))} · ${LF.dateStr(p.died || 0)}</span><b>${esc(p.name)}</b>: ${esc(p.cause || 'gone')}</div>`).join('')}</div>` : ''}
    ${left.length ? `<h3>Gone from the colony</h3><div class="box">${left.slice(-4).map(p => `<div class="entry" style="opacity:.6"><span class="lbl">${esc(LF.title(p))} · ${LF.dateStr(p.left)}</span><b>${esc(p.name)}</b>: ${esc(p.cause || 'gone')}</div>`).join('')}</div>` : ''}`;
}
/* Before landfall: under way, or in orbit with the lander still aboard. */
function aloftHTML() {
  const w = s.world, t = w.transit, V = s.voyage || {};
  if (underWay()) return `<div class="lbl vname">Under way</div><div class="box"><div class="row">${ic('array')}<div class="t"><b>${esc(w.star)}</b><small>${t.ly.toFixed(1)} light-years · ${t.years} years${V.mode && LF.CROSSING && LF.CROSSING[V.mode] ? ' · ' + LF.CROSSING[V.mode].short : ''}</small></div></div>
    <div class="row">${ic('people')}<div class="t"><b>The ${esc(w.ship)}</b><small>${s.sleepers} asleep in the cryo banks</small></div></div></div>`;
  return `<div class="lbl vname">In orbit</div><div class="banner"><img class="scene" src="art/pieces/limb_${w.type}.webp" alt=""></div>
    <div class="box"><div class="row">${ic('world')}<div class="t"><b>${esc(w.planet)}</b><small>${w.catalogue && w.catalogue !== w.planet ? esc(w.catalogue) + ' · ' : ''}${t.years} years from the last star</small></div></div>
    <div class="row">${ic('lander')}<div class="t"><b>The ${esc(w.ship)}</b><small>The lander has not gone down. ${s.sleepers} asleep in the cryo banks.</small></div></div></div>`;
}
/* What happened between the last decision and this one: the reports and the colony's own news. */
function meanwhile() {
  const e = s.log.filter(x => x.d > mark && x.k !== 'event').slice(-4);
  return e.length ? `<h3>Meanwhile</h3><div class="box">${e.map(x => `<div class="entry ${x.k}">${esc(x.t)}</div>`).join('')}</div>` : '';
}
/* The stock bar, at the top of the Colony and World views: the numbers, how each moved over the last month, the
   harvest, and what any one of them is when tapped (LF.stockBar, LF.stockNote). */
function stockHTML() {
  const sg = d => d > 0 ? `+${LF.short(d)}` : d < 0 ? `−${LF.short(-d)}` : '0', mo = LF.toHarvest(s);   // LF.short: a city's figures still fit four to a phone's width
  return `<div class="hud">${LF.stockBar(s).map(x => `<button data-act="stock" data-v="${x.k}" class="${stockOpen === x.k ? 'on' : ''}"><span class="lbl">${x.name}</span><b>${LF.short(x.v)}</b>`
    + `<i class="${x.d > 0 ? 'up' : x.d < 0 ? 'dn' : ''}">${x.k === 'pop' && !x.d ? '&nbsp;' : sg(x.d)}</i></button>`).join('')}</div>`
    + `<div class="hud-foot"><span>${ic('time')}Next harvest: ${mo === 1 ? 'this month' : `${mo} months`}</span><span>vs last month</span></div>`
    + (stockOpen ? `<p class="hud-note">${esc(LF.stockNote(s, stockOpen))}</p>` : '');
}
function playHTML() {
  const over = s.over && !s.over.cont, aloft = LF.aloft(s) && !over, v = aloft ? 'aloft' : over ? 'colony' : peek || (s.cur && s.cur.view) || 'colony';
  if (v !== shown) { swap = !!shown && !reduced(); shown = v; } else swap = false;
  // Nobody is on the ground yet: there is no colony, country or settled people to show, only the ship.
  if (aloft) return (s.cur ? cardHTML() : '') + `<section class="vw${swap ? ' swap' : ''}">${aloftHTML()}</section>`;
  const body = { colony: colonyView, world: worldView, people: peopleView, ship: shipView }[v]();
  // The card sits on top and the view below it: while the view is looked over, a slim bar holds the card's place.
  let h = over ? endHTML()
    : review ? `<div class="next"><button class="arrive${review.ready ? ' ready' : ''}" data-act="early"${review.ready ? '' : ' disabled'}><span class="lbl">${review.ready ? 'Decision needed' : since ? esc(daysWord(since)) : 'Now'} · ${esc(s.cur.tone === 'council' || s.cur.plan ? 'the council wants an answer' : 'something needs an answer')}</span><span class="pbar"><i style="transform:scaleX(${reviewP()})"></i></span></button></div>`
    : s.cur ? cardHTML() : '';
  return h + (over ? '' : tabsHTML(v)) + `<section class="vw${swap ? ' swap' : ''}"><div class="lbl vname">${VIEW_NAME[v]}</div>${body}${over ? '' : meanwhile()}</section>` + (review && review.ready && !over ? '<div class="decide-gap"></div><button class="decide go" data-act="early">Decision needed</button>' : '');
}

/* ---------- the turn: run the days, go to the view, look it over, then the card ---------- */
const reviewP = () => !review || review.ready ? 1 : review.left !== undefined ? 1 - review.left / review.ms : Math.min(1, (performance.now() - review.t0) / review.ms);
function fillReview() { if (!review) return; const i = document.querySelector('.arrive .pbar i'); if (i) i.style.transform = `scaleX(${reviewP()})`; requestAnimationFrame(fillReview); }
function toCard() { const c = $('card'); if (c) c.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); }
/* The bar is full (Lachlan, 2026-11-17): the card does not come by itself. The strip turns into "Decision needed" and a
   button waits at the foot of the screen; until it is tapped the player can still give orders, launch, send a party or look round. */
function due() { if (!review || review.ready) return; clearTimeout(reviewTimer); review.ready = true; delete review.left; render(); }
function bringCard() { if (!review) return; if (ordHold) return; ordOpen = ''; poiOpen = ''; ordSaid = null; clearTimeout(reviewTimer); review = null; reveal = true; render(); toCard(); }
/* A decision has arrived: show its view first. quick: it follows straight on from an outcome, so the card comes at once. */
function arrive(quick) {
  clearTimeout(reviewTimer); spot = ''; peek = ''; ordOpen = ''; ordSaid = null; poiOpen = '';
  if (quick || LF.aloft(s)) { review = null; reveal = true; render(); if (!surveying()) toCard(); else window.scrollTo(0, 0); return; }
  review = { t0: performance.now(), ms: REVIEW_MS }; window.scrollTo(0, 0); render(); requestAnimationFrame(fillReview);
  if (window.LFBoot) LFBoot.prefetch(LFBoot.scene(sceneOf(s.cur)));   // the card's picture, while the view is looked over
  reviewTimer = setTimeout(due, REVIEW_MS);
}
/* The days run in the rules, instantly, until something needs the player. There is no button for it. */
function proceed() {
  if (s.adrift || surveying() || (s.over && !s.over.cont)) { render(); return; }
  let days = 0, n = 0;
  while (!s.cur && !(s.over && !s.over.cont) && n++ < 40) days += LF.advance(s);
  since = days; save();
  if (s.over && !s.over.cont) { if (overSeen !== s.over.day) { overSeen = s.over.day; log('over', { outcome: s.over.kind, detail: `${s.deaths} dead` }); }
    review = null; window.scrollTo(0, 0); render(); return; }
  arrive(false);
}
function render() {
  if (window.LFTheme && LFTheme.grim) LFTheme.grim(s && s.world && !s.adrift && LF.grim ? LF.grim(s) : 0);   // low humanity drains the colours (theme.js)
  renderChrome();
  // the stock bar rides in the sticky header on all four views (Tranche 2), so food and fuel are in sight when spending them
  { const over = s.over && !s.over.cont, v = peek || (s.cur && s.cur.view) || 'colony', on = !s.adrift && !surveying() && !LF.aloft(s) && !over;
    $('hud').innerHTML = on ? stockHTML() : ''; document.documentElement.style.setProperty('--head', ($('app').querySelector('header').offsetHeight || 64) + 'px'); }
  const y = window.scrollY, was = document.querySelector('#view > .vw'), top0 = was && was.getBoundingClientRect().top;
  $('view').innerHTML = s.adrift ? (needCrew() ? preHTML() : dossier >= 0 ? dossierHTML() : s.cur ? proHTML() : adriftHTML()) : surveying() ? arrivalHTML() : playHTML();
  window.scrollTo(0, y);
  // A card that arrives (or changes size as it resolves) pushes the view down: the view glides from where it was.
  const vw = document.querySelector('#view > .vw');
  if (reveal && was && vw && !vw.classList.contains('swap') && !reduced() && vw.animate) {
    const dy = top0 - vw.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) vw.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,0,0,1)' });
  }
  reveal = false;
  if (window.LFMusic) LFMusic.update(s, { review: !!review });
  if (window.LFSound) LFSound.update(s, !!s.cur && !review && !surveying() && !(s.over && !s.over.cont));   // the bed, and a card's sound once the card itself is up
}
/* ---------- input ---------- */
function menu(open) {
  const sh = $('sheet'), opening = sh.hidden; sh.hidden = !open; if (!open) return;
  sh.classList.toggle('in', opening);
  sh.innerHTML = `<div class="box"><h3 style="margin-top:0">Landfall</h3>
    <div class="row"><div class="t"><b>Music</b><small>Quiet score and sound that follow how the colony is doing.</small></div><button class="pbtn" data-act="music">${window.LFMusic && LFMusic.on ? 'On' : 'Off'}</button></div>
    <div class="row" style="border:0;padding-bottom:2px"><div class="t"><b>Colours</b><small>${LFTheme.THEMES[LFTheme.current].name}</small></div></div>
    <div class="sws">${Object.entries(LFTheme.THEMES).map(([k, t]) => `<button data-act="theme" data-v="${k}" class="${k === LFTheme.current ? 'on' : ''}" style="background:${t.paper}" aria-label="${t.name}"><i style="background:${t.rust}"></i></button>`).join('')}</div>
    <div class="row"><div class="t"><b>New colony</b><small>Abandon this one. The same ship, different candidates.</small></div><button class="pbtn" data-act="new">Start</button></div>
    <button class="opt go" data-act="menu">Close</button></div>`;
}
function act(a, v, el) {
  if (a === 'embark' && s.adrift) { LF.embark(s, +v); log('embark', { detail: `${s.world.star}, ${s.world.transit.years} years` }); naming = false; arrStep = 0; arrTab = 'world'; arrSeen = false; save(); window.scrollTo(0, 0); return s.cur ? arrive(true) : proceed(); }
  else if (a === 'arrive') { naming = true; window.scrollTo(0, 0); return arrive(true); }
  else if (a === 'arrnext') { arrStep = 1; arrTab = 'world'; window.scrollTo(0, 0); return render(); }
  else if (a === 'arrtab') { arrTab = v === 'report' ? 'report' : 'world'; if (arrTab === 'report') arrSeen = true; return render(); }
  else if (a === 'sound') { if (window.LFMusic) LFMusic.toggle(); soundBtn(); if (!$('sheet').hidden) menu(true); return; }
  else if (a === 'dossier') return dossierGo();
  else if (a === 'pre') return preGo(v);
  else if (s.adrift && !s.cur && a !== 'menu' && a !== 'new' && a !== 'odds' && a !== 'music' && a !== 'theme') return;
  else if (a === 'early') { if (review && review.ready) bringCard(); return; }   // never before the bar is full (Lachlan, 2026-11-17)
  else if (a === 'spot') { spot = v; if (poiOpen) { poiOpen = ''; if (!ordOpen) resumeReview(); } }
  else if (a === 'poi') { poiOpen = poiOpen === v ? '' : v || ''; const p = poiOpen && LF.poi(s, poiOpen); spot = p ? p.name : '';   // a place opens under the map; the card waits while it is open
    if (poiOpen) pauseReview(); else if (!ordOpen) resumeReview(); render(); const el = poiOpen && document.getElementById('place'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' }); return; }
  else if (a === 'poimore') poiAll = !poiAll;
  else if (a === 'ord') { if (ordHold) return; ordOpen = ordOpen === v ? '' : v; ordSaid = null; if (ordOpen) pauseReview(); else resumeReview(); }
  else if (a === 'ordgo') return giveOrder(v);
  else if (a === 'stock') stockOpen = stockOpen === v ? '' : v;
  else if (a === 'who') { whoOpen = whoOpen === v ? '' : v; const wp = whoOpen && s.people.find(p => p.id === whoOpen); if (wp && wp.key && wp.role) setTimeout(() => { const e = document.querySelector('.profile'); if (e) e.scrollIntoView({ block: 'start' }); }, 0); }
  else if (a === 'tab') { if (poiOpen) { poiOpen = ''; if (!ordOpen) resumeReview(); } if (ordOpen && !ordHold) { ordOpen = ''; resumeReview(); } ordSaid = null; peek = v === ((s.cur && s.cur.view) || 'colony') ? '' : v; spot = ''; }
  else if (a === 'menu') return menu($('sheet').hidden);
  else if (a === 'theme') { LFTheme.set(v); menu(true); }
  else if (a === 'music') { if (window.LFMusic) LFMusic.toggle(); soundBtn(); menu(true); }
  else if (a === 'odds') { showOdds = !showOdds; try { localStorage.setItem('landfall.odds', showOdds ? '1' : '0'); } catch (e) {} menu(true); }
  else if (a === 'new') { if (!s || s.over || s.day < 5 || confirm('Abandon this colony and start another?')) { menu(false); return fresh(); } }
  else if (a === 'attach') { if (!hold) LF.attach(s, v); }
  else if (a === 'pick') { LF.pickToggle(s, +v); }
  else if (a === 'pickgo') { if (!LF.pickConfirm(s)) return; }
  else if (a === 'choose' && s.cur && s.cur.phase === 'choose') { if (hold || review) return;
    // the landing site is chosen: the lander goes down while the choice resolves underneath
    if (s.cur.id === 'landfall.site' && window.LFIntro && LF.zone) cutscene(LFIntro.descent(s, (LF.zone(s, +v) || {}).name));
    startHold(+v); }
  else if (a === 'dismiss' && s.cur && s.cur.phase === 'result') { mark = s.day; LF.dismiss(s); since = 0; save();
    if (s.adrift) return proGo();   // the voyage out: the next card, or the long sleep
    // the crossing is over: the ship makes orbit, and the survey is read before the world is named
    if (surveying()) { window.scrollTo(0, 0); render(); if (window.LFIntro) cutscene(LFIntro.arrival(s)); return; }
    return s.cur ? arrive(true) : proceed(); }
  else if (a === 'continue') { s.over.cont = true; log('continue'); save(); return proceed(); }
  render();
}
document.addEventListener('click', e => {
  if (e.target.id === 'sheet') return menu(false);
  const el = e.target.closest('[data-act]'); if (el && !el.disabled) act(el.dataset.act, el.dataset.v, el);
});
document.addEventListener('keydown', e => {
  if (dossier >= 0) { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); dossierGo(); } return; }
  if (e.code === 'Space') { e.preventDefault(); if (review) { if (review.ready) act('early'); } else if (s.cur && s.cur.phase === 'result') act('dismiss'); }
  else if ((s.adrift && !s.cur) || surveying()) return;
  else if (s.cur && s.cur.phase === 'choose' && e.key >= '1' && e.key <= '9') { const o = LF.choices(s)[+e.key - 1]; if (o && !o.lock) act('choose', o.i); }
  else if (s.cur && s.cur.phase === 'result' && e.key === 'Enter') act('dismiss');
});

s = load(); if (s) { LF.dropCut(s); if (LF.migrateOrders) LF.migrateOrders(s); LF.renameCast(s); }
// Saved after every choice already; this also covers swiping the installed app away mid-card.
document.addEventListener('visibilitychange', () => { if (document.hidden && s) save(); });
const isNew = !s; if (isNew) fresh(true);
const proFresh = !isNew && s.adrift && !s.cur && LF.proOn && LF.proOn(s) && !s.pro.i;   // closed before the first card of the voyage out: play it from the title
// The first screen's pictures arrive behind a loading bar on the first visit; everything else loads as it is needed.
const firstPics = s.adrift ? ['art/adrift.webp'].concat(window.LFIntro && isNew ? (LF.proOn && LF.proOn(s) ? LFIntro.departure(s) : LFIntro.opening(s)).map(x => LFBoot.scene(x.pic)).concat('sfx/burn.mp3') : []) : s.cur ? [LFBoot.scene(sceneOf(s.cur))] : [];
const start = () => { log('open', { detail: isNew ? 'no saved game' : (s.over && !s.over.cont) ? 'on the end screen' : 'resumed' }); if (s.adrift || surveying() || (s.over && !s.over.cont)) render(); else if (s.cur) arrive(true); else proceed(); if (needCrew()) { if (isNew || proFresh) splash(); /* then the ship and the crew; the departure plays after (preGo) */ } else if (isNew || proFresh) intro(); else if (s.adrift && !s.cur && LF.proOn && LF.proOn(s)) proGo(); };
if (window.LFBoot) LFBoot.first(firstPics.filter(Boolean), start); else start();
window.LFUI = { get state() { return s; }, get hold() { return hold; }, get review() { return review; }, render, bringCard, due, REVIEW_MS };
})();
