/* Landfall — the settlement, seen from above.
   LF.scene(s) returns one SVG string: a two-ink block print assembled from small interchangeable pieces. Nothing
   is drawn by hand per colony. The world type picks the horizon, the ground marks and the wild growth; the landing
   site adds a river, a ridge, canyon walls or the anomaly; everything else is read from the state: which machines
   still run, what has been built and what is half built, how many people there are and where they sleep, the
   season in the fields, graves, parties away, and whatever has been found beyond the wire.
   Every piece is a function (x, y, ...) -> SVG, anchored where it meets the ground, in three classes of paint:
   ink (k), paper (p) and rust (r), with l-suffixed stroke versions. To add a piece: write the function, push it
   into the list in LF.scene with a caption. No DOM here, so tools/sim.js can exercise it. */
(function () {
'use strict';
const W = 360, H = 300, HZ = 80;
const f = n => Math.round(n * 10) / 10;
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const at = (x, y, body, sc) => `<g transform="translate(${f(x)} ${f(y)})${sc && sc !== 1 ? ` scale(${f(sc)})` : ''}">${body}</g>`;
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- pieces: the ship ---------- */
const smoke = (x, y, n) => { let o = ''; for (let i = 0; i < (n || 3); i++) o += `<circle class="kl sm" style="animation-delay:${-i * 1.3}s" cx="${x + i * 2.5}" cy="${y - i * 6}" r="${2 + i * 1.1}"/>`; return o; };
const wreck = w => `<path class="kl" d="M${-w} 0L${-w * 0.6} -6L${-w * 0.2} -2L${w * 0.3} -8L${w * 0.7} -3L${w} 0"/><path class="rl" d="M${-w * 0.5} -9l5 6M${-w * 0.5 + 5} -9l-5 6"/>`;
const P = {
  lander: st => st === 'lost' ? `<path class="k" d="M-13 0L-10 -14L4 -17L12 -8L14 0Z"/><path class="pl" d="M-8 -4L8 -6M-6 -9L5 -12"/><path class="kl" d="M-13 0l-6 5M14 0l6 5"/>`
    // the lander of art/craft/lander.png, side on: blunt stern and ramp to the left, wedge nose to the right, on its legs
    : `<path class="kl" d="M-11 -7l-3 7M-4 -7l1 7M6 -7l3 7M-16 0h4M-5 0h4M7 0h4M-15 -7L-20 0"/><path class="k" d="M-15 -7L-14 -17L3 -18L16 -10L15 -7Z"/><path class="r" d="M-14.6 -11.5H12.8L14.6 -9.5H-14.8Z"/><path class="p" d="M6 -15.2L11.6 -12.6H6Z"/><path class="pl" d="M-12 -14H1"/>${st === 'bad' ? '<path class="pl" d="M-7 -8l2 -3l2 2l3 -4"/>' : ''}`,
  reactor: st => st === 'lost' ? wreck(11) : `<path class="k" d="M-12 0V-5A12 11 0 0 1 12 -5V0Z"/><path class="kl" d="M-12 -3l-5 3M12 -3l5 3M0 -16V-21"/><circle class="${st === 'bad' ? 'p' : 'r'}" cx="0" cy="-7" r="3.6"/><path class="pl" d="M-9 -3H-5M5 -3H9"/>${st === 'bad' ? '' : '<path class="rl gl" d="M0 -24v-4M-7 -21l-3 -3M7 -21l3 -3"/>'}`,
  fabricator: st => st === 'lost' ? wreck(11) : `<path class="k" d="M-11 0V-10H5V-14H11V0Z"/><path class="pl" d="M-8 -6H2M-8 -3H2"/><path class="kl" d="M8 -14V-21H-4v4"/><rect class="r" x="6" y="-6" width="3" height="6"/>${st === 'bad' ? '' : smoke(9, -24, 2)}`,
  reclaimer: st => st === 'lost' ? wreck(9) : `<path class="k" d="M-6 0V-15Q0 -19 6 -15V0Z"/><path class="pl" d="M-6 -10H6M-6 -5H6"/><path class="kl" d="M6 -8H12V0M-6 -12H-11V0"/>${st === 'bad' ? '<path class="rl" d="M10 -2l3 3M-12 -3l-2 4"/>' : ''}`,
  hydroponics: st => st === 'lost' ? wreck(17) : `<path class="k" d="M-18 0V-6Q-18 -13 -11 -13H11Q18 -13 18 -6V0Z"/><path class="pl" d="M-12 -9V-3M-6 -9V-3M0 -9V-3M6 -9V-3M12 -9V-3"/>${st === 'bad' ? '<path class="rl" d="M-15 -14l4 4M9 -15l3 5"/>' : ''}`,
  medbay: st => st === 'lost' ? wreck(8) : `<path class="k" d="M-9 0V-6Q-9 -11 -4 -11H4Q9 -11 9 -6V0Z"/><path class="${st === 'bad' ? 'pl' : 'rl'}" style="stroke-width:2.2" d="M0 -9V-3M-3 -6H3"/>`,
  pod: v => `<rect class="k" x="-9" y="-7" width="18" height="7" rx="3.5"/><path class="pl" d="M-4 -7V0M3 -7V0"/>${v ? '<path class="kl" d="M9 -5h3"/>' : ''}`,
  /* ---------- pieces: what the colony built ---------- */
  house: v => (v % 3 === 2 ? `<path class="k" d="M-10 0V-6L-5 -11H5L10 -6V0Z"/><path class="pl" d="M-9 -6H9"/><rect class="r" x="-2" y="-5" width="3" height="5"/><rect class="k" x="4" y="-14" width="2.4" height="5"/>`
    : `<path class="k" d="M-7 0V-6L0 -12L7 -6V0Z"/><path class="pl" d="M-6.5 -6H6.5"/><rect class="${v % 3 ? 'r' : 'p'}" x="-1.5" y="-4.6" width="3" height="4.6"/>`),
  dome: () => `<path class="p" d="M-9 0A9 9 0 0 1 9 0Z"/><path class="kl" d="M-9 0A9 9 0 0 1 9 0ZM0 -9V0M-6.5 -6.2Q0 -2 6.5 -6.2M-4.5 0Q-4 -6 0 -9M4.5 0Q4 -6 0 -9"/><path class="rl" d="M-5 -1v-2M-2 -1v-3M2 -1v-3M5 -1v-2"/>`,
  soillab: () => `<rect class="k" x="-10" y="-8" width="20" height="8" rx="3"/><path class="pl" d="M-5 -8V0M3 -5H7"/><path class="kl" d="M6 -8V-16M3 -15H9"/><circle class="r" cx="6" cy="-17" r="1.6"/>`,
  well: () => `<path class="kl" d="M-5 -1V-11M5 -1V-11M-6 -11H6M0 -11V-5"/><ellipse class="k" cx="0" cy="-1" rx="6.5" ry="2.8"/><ellipse class="p" cx="0" cy="-1.4" rx="3.6" ry="1.2"/><rect class="r" x="-1.3" y="-6" width="2.6" height="2.6"/>`,
  smelter: () => `<path class="k" d="M-11 0L-8 -11H3L6 0Z"/><rect class="k" x="5" y="-24" width="5" height="24"/><path class="pl" d="M5 -18H10M5 -12H10"/><path class="r" d="M-5 0V-4Q-2.5 -7 0 -4V0Z"/>${smoke(8, -28, 4)}`,
  machineshop: () => `<path class="k" d="M-15 0V-8L-9 -13V-8L-3 -13V-8L3 -13V-8L9 -13V0Z"/><path class="pl" d="M-12 -4H6"/><circle class="kl" cx="14" cy="-5" r="4.5"/><path class="kl" d="M14 -9.5V-0.5M9.5 -5H18.5"/><rect class="r" x="-2" y="-5" width="4" height="5"/>`,
  turbine: i => `<path class="kl" style="stroke-width:1.6" d="M0 0V-22"/><g><path class="k" d="M0 -22L-1.5 -34L1.5 -34ZM0 -22L10.4 -15L8.9 -12.6ZM0 -22L-10.4 -15L-8.9 -12.6Z"/><animateTransform attributeName="transform" type="rotate" from="${i * 37} 0 -22" to="${360 + i * 37} 0 -22" dur="${7 + i}s" repeatCount="indefinite"/></g><circle class="r" cx="0" cy="-22" r="1.6"/>`,
  engine: () => `<path class="k" d="M-5 0L-2 -34H2L5 0Z"/><path class="rl gl" d="M0 -38v-5M-6 -34l-4 -3M6 -34l4 -3M-9 -24h-4M9 -24h4"/><path class="rl" d="M-3 -8H3M-2.5 -16H2.5M-2 -24H2"/>`,
  school: () => `<path class="k" d="M-16 0V-7L-12 -12H8L12 -7V0Z"/><path class="pl" d="M-15 -7H11M-9 -4V0M-3 -4V0"/><path class="k" d="M10 0V-18L13 -22L16 -18V0Z"/><circle class="r" cx="13" cy="-15" r="1.7"/><rect class="p" x="2" y="-5" width="3.4" height="5"/>`,
  cellar: () => `<path class="k" d="M-10 0Q-10 -9 0 -9Q10 -9 10 0Z"/><path class="p" d="M-3 0V-4.5Q0 -6.5 3 -4.5V0Z"/><path class="kl" d="M0 -5V0"/>`,
  vault: () => `<path class="k" d="M-12 0L-9 -10L-2 -14L7 -11L12 0Z"/><path class="p" d="M-3.5 0V-6H3.5V0Z"/><path class="rl" d="M-3.5 -3H3.5"/>`,
  scaffold: pr => `<path class="kl" d="M-9 0V-14M9 0V-14M-9 -14H9M-9 -7H9M-9 0L9 -7M-9 -7L9 -14M0 0V-14"/><path class="k" d="M-9 0V${f(-14 * pr)}H9V0Z" opacity=".85"/><path class="rl" d="M12 0V-18M12 -18h-7"/>`,
  flag: m => `<path class="kl" d="M0 0V-26"/><path class="r" d="M0 ${f(-26 + (1 - m) * 12)}l10 3l-10 3Z"/>`,
  banner: () => `<path class="kl" d="M0 0V-18"/><path class="k" d="M0 -18h8l-2.5 3l2.5 3h-8Z"/>`,
  person: v => `<circle class="k" cx="0" cy="-5.2" r="1.3"/><path class="kl" d="M0 -4V-1.6M-1.4 0L0 -1.8L1.4 0${v ? 'M-1.6 -3.2H1.6' : ''}"/>`,
  grave: v => v ? `<path class="kl" d="M0 0V-5M-1.6 -3.4H1.6"/>` : `<path class="k" d="M-1.5 0V-3.4Q0 -5.4 1.5 -3.4V0Z"/>`,
  tent: () => `<path class="p" d="M-9 0L0 -11L9 0Z"/><path class="kl" d="M-9 0L0 -11L9 0ZM0 -11V0"/><path class="kl" d="M9 0V-16"/><path class="r" d="M9 -16h6v4h-6Z"/>`,
  lamp: () => `<path class="kl" d="M0 0V-10"/><circle class="r" cx="0" cy="-12" r="2.2"/><path class="rl gl" d="M0 -17v-3M-4.5 -14.5l-2.5 -2M4.5 -14.5l2.5 -2"/>`,
  post: () => `<path class="kl" d="M0 0V-4"/>`,
  stake: () => `<path class="k" d="M-1.2 0V-6L0 -8L1.2 -6V0Z"/>`,
  /* ---------- pieces: the wild, by world ---------- */
  boulder: v => `<path class="k" d="M-6 0Q-7 -5 -2 -6Q4 -8 6 -3Q7 0 6 0Z"/><path class="pl" d="M-3 -3.4Q0 -5 3 -3"/>${v ? '<circle class="r" cx="-4" cy="-.6" r="1"/><circle class="r" cx="2.6" cy="-.4" r=".8"/>' : ''}`,
  lichen: () => `<circle class="r" cx="-2" cy="-1" r="1.1"/><circle class="k" cx="1.4" cy="-1.6" r=".9"/><circle class="k" cx="0" cy="0" r=".7"/><circle class="r" cx="3" cy="0" r=".7"/>`,
  pillar: v => v ? `<path class="k" d="M-2.5 0V-13L0 -15L2.5 -12V0Z"/><path class="pl" d="M-2.5 -5H2.5M-2.5 -9H2.5"/>` : `<path class="kl" style="stroke-width:1.8" d="M-7 0Q-7 -12 2 -13"/><path class="k" d="M3 0h6v-3h-6Z"/><path class="rl" d="M4 -1.5h4"/>`,
  rib: () => `<path class="kl" d="M-8 0Q-7 -11 0 -12M-3 0Q-3 -8 3 -9M2 0Q2 -5 6 -6"/>`,
  shard: v => `<path class="k" d="M-5 0L-2 -${10 + v * 4}L1 -4L3 -8L6 0Z"/><path class="pl" d="M-2 -${8 + v * 4}L-1 -1M3 -6L3.4 -1"/>`,
  drift: () => `<path class="kl" d="M-8 0Q-3 -4 2 -1.5Q5 0 9 -1.5"/>`,
  reed: () => `<path class="kl" d="M-3 0Q-4 -6 -2 -10M0 0V-11M3 0Q4 -5 2.4 -8"/><ellipse class="r" cx="0" cy="-11" rx="1" ry="2.2"/>`,
  frond: v => `<path class="k" d="M0 0Q-1 -8 0 -${11 + v * 3}Q1 -8 0 0ZM0 -3Q-9 -6 -11 -12Q-4 -10 0 -3ZM0 -3Q9 -6 11 -12Q4 -10 0 -3ZM0 -2Q-10 -1 -13 -5Q-6 -5 0 -2ZM0 -2Q10 -1 13 -5Q6 -5 0 -2Z"/>${v ? '<circle class="r" cx="0" cy="-5" r="1.5"/>' : ''}`,
  tree: v => `<path class="kl" style="stroke-width:1.6" d="M0 0V-6"/><circle class="k" cx="0" cy="-11" r="6.5"/><path class="pl" d="M-3.4 -12.6Q-1 -15.4 2.4 -14"/>${v ? '<circle class="r" cx="2.6" cy="-9" r="1.1"/><circle class="r" cx="-2.6" cy="-8.4" r="1"/>' : ''}`,
  tuft: () => `<path class="kl" d="M-3 0L-4 -4M0 0V-5M3 0L4 -4"/>`,
  /* ---------- pieces: what is out there ---------- */
  beast: v => `<path class="k" d="M-12 0L-11 -7Q-9 -13 -1 -12Q6 -14 9 -9L14 -10L12 -5L10 0H7L6 -4H-5L-7 0Z"/><circle class="r" cx="9.6" cy="-8.4" r="1.1"/>${v ? '<path class="pl" d="M-7 -8Q-2 -10 3 -8"/>' : ''}`,
  growth: n => { let o = ''; for (let i = 0; i < n; i++) { const a = -1.3 + i * 2.6 / Math.max(1, n - 1), l = 9 + (i * 7) % 8; o += `<path class="rl" style="stroke-width:1.5" d="M0 0Q${f(Math.sin(a) * l * 0.3)} ${f(-l * 0.7)} ${f(Math.sin(a) * l)} ${f(-Math.cos(a) * l - 2)}"/><circle class="k" cx="${f(Math.sin(a) * l)}" cy="${f(-Math.cos(a) * l - 2)}" r="1.4"/>`; } return o; },
  monolith: v => v ? `<path class="k" d="M-4 0L-2.5 -30H2.5L4 0Z"/><path class="rl" d="M-2 -8H2M-1.8 -16H1.8M-1.5 -24H1.5"/>` : `<path class="kl" style="stroke-width:3" d="M-11 0V-12A11 11 0 0 1 11 -12V0"/><circle class="r" cx="0" cy="-13" r="2.4"/>`,
  huts: () => `<path class="k" d="M-13 0L-9 -8L-5 0ZM-3 0L2 -10L7 0ZM8 0L11.5 -7L15 0Z"/><path class="pl" d="M2 -3V0"/>${smoke(2, -13, 2)}`,
  stockade: () => `<path class="k" d="M-13 0V-7L-11 -9L-9 -7L-7 -9L-5 -7L-3 -9L-1 -7L1 -9L3 -7L5 -9L7 -7L9 -9L11 -7L13 -9V0Z"/><path class="kl" d="M0 -8V-21"/><path class="k" d="M0 -21h7v4h-7Z"/>${smoke(-7, -12, 2)}`,
  trail: () => `<path class="kl" style="stroke-dasharray:1 4" d="M0 0"/>`,
};

/* ---------- horizons, one per world ---------- */
function horizon(type, r) {
  let d = `M0 ${HZ}`, x = 0;
  if (type === 'drowned') { let o = `<path class="kl" d="M0 ${HZ}H${W}"/>`;
    for (let i = 0; i < 5; i++) { const w = 14 + r() * 26, cx = 20 + r() * (W - 40); o += `<path class="k" d="M${f(cx - w)} ${HZ}Q${f(cx - w * 0.2)} ${f(HZ - 5 - r() * 9)} ${f(cx + w)} ${HZ}Z"/>`; }
    for (let i = 0; i < 16; i++) { const cx = r() * W, y = HZ - 3 - r() * 16; o += `<path class="kl" d="M${f(cx)} ${f(y)}q3 -2 6 0q3 2 6 0"/>`; }
    return o; }
  while (x < W) {
    if (type === 'barren') { const w = 18 + r() * 34, h = 6 + r() * 20; d += `L${f(x + 3)} ${f(HZ - h)}L${f(x + w - 3)} ${f(HZ - h + r() * 3)}L${f(x + w)} ${HZ}`; x += w + r() * 10; }
    else if (type === 'ruin') { const w = 5 + r() * 16, h = 5 + r() * 30; d += r() < 0.4 ? `L${f(x)} ${f(HZ - h)}L${f(x + w * 0.6)} ${f(HZ - h + 4)}L${f(x + w)} ${f(HZ - h * 0.4)}L${f(x + w)} ${HZ}` : `L${f(x + w * 0.5)} ${f(HZ - h * 0.4)}L${f(x + w)} ${HZ}`; x += w + r() * 5; }
    else if (type === 'ice') { const w = 22 + r() * 36, h = 14 + r() * 30; d += `L${f(x + w * (0.35 + r() * 0.3))} ${f(HZ - h)}L${f(x + w)} ${f(HZ - r() * 5)}`; x += w; }
    else if (type === 'jungle') { const w = 9 + r() * 12, h = 9 + r() * 14; d += `Q${f(x + w / 2)} ${f(HZ - h - 8)} ${f(x + w)} ${f(HZ - h * 0.45)}`; x += w; }
    else { const w = 50 + r() * 70, h = 8 + r() * 14; d += `Q${f(x + w / 2)} ${f(HZ - h * 2)} ${f(x + w)} ${f(HZ - r() * 4)}`; x += w; }
  }
  let o = `<path class="k" d="${d}L${W} ${HZ}Z"/>`;
  if (type === 'ice') for (let i = 0; i < 9; i++) { const cx = r() * W; o += `<path class="pl" d="M${f(cx)} ${HZ - 3}l${f(3 + r() * 5)} -${f(6 + r() * 12)}"/>`; }
  if (type === 'garden') for (let i = 0; i < 12; i++) { const cx = r() * W; o += at(cx, HZ - 4 - r() * 5, `<circle class="p" r="${f(1.4 + r() * 1.6)}"/>`); }
  if (type === 'barren') for (let i = 0; i < 8; i++) { const cx = r() * W; o += `<path class="pl" d="M${f(cx)} ${HZ - 2}v-${f(3 + r() * 7)}"/>`; }
  return o;
}
const WILD = { // [piece, variant chance, density]
  barren: [['boulder', 0.5, 5], ['lichen', 0, 6], ['tuft', 0, 1]],
  ruin: [['pillar', 0.5, 4], ['rib', 0, 2], ['boulder', 0, 3], ['lichen', 0, 2]],
  ice: [['shard', 0.5, 5], ['drift', 0, 6], ['boulder', 0, 1]],
  drowned: [['reed', 0, 6], ['boulder', 0, 3], ['tuft', 0, 3]],
  jungle: [['frond', 0.35, 10], ['tree', 0.3, 3], ['tuft', 0, 2]],
  garden: [['tree', 0.4, 6], ['tuft', 0, 6], ['boulder', 0, 1]],
};
const KIND_WORD = { fauna: 'seen beyond the wire', flora: 'growing toward the camp', plague: 'in the colony', ruin: 'on the horizon', natives: 'their fires at night', humans: 'their smoke on the horizon', faction: 'meeting in the camp' };
const RES_WORD = { destroyed: 'gone', accord: 'at peace with the colony', contained: 'held back', harnessed: 'put to use', lost: 'the colony lives in what it left' };

LF.scene = function (s) {
  if (!s.world) return '';
  const w = s.world, r = rng((s.seed | 0) ^ 0x51ed), flip = (s.seed & 1) === 1, fx = x => flip ? W - x : x;
  const season = LF.date(s.day).season, fl = s.flags, items = [], back = [];
  const put = (x, y, body, cap, sc, cls) => items.push({ y, h: `<g${cap ? ` data-act="spot" data-v="${esc(cap)}"` : ''}${cls ? ` class="${cls}"` : ''}>${at(fx(x), y, body, sc)}</g>` });
  const fresh = id => s.lastBuilt && s.lastBuilt.id === id && s.day - s.lastBuilt.d < 2 ? 'new' : '';
  const built = id => s.built[id] ? `built ${LF.dateStr(s.built[id]).toLowerCase()}` : '';
  const pts = [[180, 172]];                                   // everything the wire has to go round
  const place = (x, y) => { pts.push([x, y]); };

  /* the ship */
  const ms = id => { const m = s.machines[id]; return m.lost ? 'lost' : m.hp < 40 ? 'bad' : 'ok'; };
  const mcap = id => `${LF.MACHINES[id].name} · ${LF.machineWord(s, id).toLowerCase()}`;
  put(180, 172, P.lander(ms('lander')), mcap('lander'), 1.15);
  put(202, 160, P.flag(s.morale / 100), s.morale < 30 ? 'The colony flag, low on its pole' : 'The colony flag');
  for (const [id, x, y] of [['reactor', 138, 160], ['fabricator', 226, 158], ['hydroponics', 236, 190], ['reclaimer', 150, 194], ['medbay', 196, 204]]) { put(x, y, P[id](ms(id)), mcap(id), 1.05); place(x, y); }

  /* where people sleep: cargo pods until there are houses */
  const roofs = Math.ceil(LF.heads(s) / 9), houses = s.built.housing ? Math.min(21, Math.max(6, roofs - 2)) : 0, pods = s.built.housing ? Math.min(3, Math.max(0, roofs - houses)) : Math.min(10, Math.max(3, roofs - 3));
  for (let i = 0; i < pods; i++) { const x = 96 + (i % 5) * 21 + (i >= 5 ? 9 : 0), y = 218 + (i >= 5 ? 11 : 0); put(x, y, P.pod(i % 2), 'Cargo pods · where people sleep'); place(x, y); }
  for (let i = 0; i < houses; i++) { const x = 60 + (i % 7) * 18 + (Math.floor(i / 7) % 2) * 8, y = 244 + Math.floor(i / 7) * 14; put(x, y, P.house(i + (s.seed & 3)), `Permanent housing · ${built('housing')}`, 1, fresh('housing')); place(x, y); }

  /* what has been built, and what is going up */
  const SITE = { greenhouse: [286, 172], soillab: [322, 196], wells: [108, 184], smelter: [66, 152], machineshop: [54, 190], school: [200, 238], fields: [290, 262], housing: [100, 250], turbines: [300, 102], shelter: [320, 130], spares: [226, 158], shuttle: [180, 172] };
  if (s.built.greenhouse) for (let i = 0; i < 3; i++) put(272 + i * 16, 172 + (i % 2) * 5, P.dome(), `Greenhouse domes · ${built('greenhouse')}`, 1.05, fresh('greenhouse'));
  if (s.built.soillab) put(322, 196, P.soillab(), `Soil laboratory · ${built('soillab')}`, 1, fresh('soillab'));
  if (s.built.wells) { put(108, 184, P.well(), `Wells · ${built('wells')}`, 1.1, fresh('wells')); put(258, 224, P.well(), `Wells · ${built('wells')}`, 1, fresh('wells')); }
  if (s.built.smelter) put(66, 152, P.smelter(), `Kiln and smelter · ${built('smelter')}`, 1.1, fresh('smelter'));
  if (s.built.machineshop) put(54, 190, P.machineshop(), `Machine shop · ${built('machineshop')}`, 1.05, fresh('machineshop'));
  if (s.built.school) put(200, 238, P.school(), `School and clinic · ${built('school')}`, 1.05, fresh('school'));
  if (fl.builders_power) put(300, 104, P.engine(), 'The Builders\' machine · it gives power, and asks nothing yet', 1.1);
  if (s.built.turbines) for (let i = 0; i < 4; i++) put(268 + i * 22, 100 + (i % 2) * 6, P.turbine(i), `Turbine field · ${built('turbines')}`, 0.9, fresh('turbines'));
  if (s.built.shelter) { const c = w.climate, cap = `${LF.projName(s, 'shelter')} · ${built('shelter')}`;
    if (c === 'storm') back.push(`<g data-act="spot" data-v="${esc(cap)}"><path class="kl" style="stroke-width:4" d="M${fx(26)} 250Q${fx(8)} 190 ${fx(30)} 132"/><path class="pl" style="stroke-dasharray:1 5" d="M${fx(26)} 250Q${fx(8)} 190 ${fx(30)} 132"/></g>`);
    else for (let i = 0; i < 3; i++) put(306 + i * 19, 130 + (i % 2) * 6, c === 'flare' ? P.vault() : P.cellar(), cap, 1, fresh('shelter')); }
  for (const id of Object.keys(SITE)) if (s.built[id]) place(SITE[id][0], SITE[id][1]);
  if (s.project && SITE[s.project] && !['spares', 'shuttle'].includes(s.project)) { const [x, y] = SITE[s.project], pr = s.progress / LF.cost(s, s.project).labor;
    put(x, y + (s.project === 'fields' ? -18 : 0), P.scaffold(pr), `${LF.projName(s, s.project)} · ${pr > 0.6 ? 'nearly finished' : 'going up'}`, 1.1); place(x, y); }

  /* fields: a few trial plots at first, then open ground. The season shows in them. */
  const plots = s.built.fields ? 6 : fl.first_sow === 'all' ? 4 : fl.first_sow ? 2 : 0, blight = s.used['crops.blight'] !== undefined && s.day - s.used['crops.blight'] < 60, hungry = s.res.food <= 0;
  for (let i = 0; i < plots; i++) { const big = !!s.built.fields, x = (big ? 232 : 250) + (i % 3) * (big ? 40 : 30), y = (big ? 262 : 232) + Math.floor(i / 3) * 18, pw = big ? 34 : 24, ph = 13;
    let rows = ''; const n = big ? 8 : 6, stage = hungry ? 0 : season;
    for (let k = 0; k < n; k++) { const px = -pw / 2 + 2 + k * (pw - 4) / (n - 1);
      rows += stage === 3 || stage === 0 && !big ? `<path class="kl" style="stroke-dasharray:1.5 2.5" d="M${f(px + 3)} -${ph - 2}L${f(px)} -1.5"/>` : stage === 0 ? `<path class="kl" d="M${f(px + 3)} -${ph - 2}L${f(px)} -1.5"/>`
        : `<path class="kl" style="stroke-width:${stage === 2 ? 2.4 : 1.5}" d="M${f(px + 3)} -${ph - 2}L${f(px)} -1.5"/>${stage === 2 ? `<circle class="r" cx="${f(px + 3)}" cy="-${ph - 1}" r="1.2"/>` : ''}`; }
    if (blight && i % 2 === 0) rows += `<circle class="r" cx="-5" cy="-6" r="3"/><circle class="r" cx="6" cy="-4" r="2.2"/>`;
    put(x, y, `<path class="p" d="M${-pw / 2} 0L${-pw / 2 + 4} -${ph}H${pw / 2 + 4}L${pw / 2} 0Z"/><path class="kl" d="M${-pw / 2} 0L${-pw / 2 + 4} -${ph}H${pw / 2 + 4}L${pw / 2} 0Z"/>${rows}`,
      (big ? 'Open fields' : 'The first plots') + ' · ' + (hungry ? 'bare' : blight ? 'rust in the wheat' : ['turned for sowing', 'coming up', 'ripe', 'stubble'][season]), 1, big ? fresh('fields') : ''); place(x, y); }
  if (fl.und_pact || fl.crops_symbiotic) put(300, 228, `<circle class="rl" r="5"/><circle class="rl" r="9" style="stroke-dasharray:2 3"/>`, 'Rings in the soil · the Understory', 1);

  /* the dead */
  const graves = Math.min(26, Math.round(s.deaths * 0.7));
  for (let i = 0; i < graves; i++) { const x = 34 + (i % 7) * 6 + (Math.floor(i / 7) % 2) * 3, y = 108 + Math.floor(i / 7) * 6; put(x, y, P.grave(i % 3 === 1), `The burial ground · ${s.deaths} dead`); }
  if (graves) place(52, 116);

  /* the wire goes round everything there is */
  const cx = 186, cy = 196; let k = 0.5;
  for (const [x, y] of pts) k = Math.max(k, Math.hypot((x - cx) / 172, (y - cy) / 108) + 0.1);
  k = Math.min(1, k); const rx = 172 * k, ry = 108 * k, walled = s.factors.some(x => x.wall);
  const inWire = (x, y, m) => Math.hypot((x - cx) / (rx * m), (y - cy) / (ry * m)) < 1;
  let wire = `<ellipse class="kl" style="stroke-dasharray:${walled ? 'none' : '5 4'};stroke-width:${walled ? 2.6 : 1}" cx="${fx(cx)}" cy="${cy}" rx="${f(rx)}" ry="${f(ry)}" data-act="spot" data-v="${walled ? 'The wall' : 'The wire'}"/>`;
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; if (y > HZ + 8) items.push({ y, h: at(fx(x), y, walled ? P.stake() : P.post()) }); }

  /* landing site: river, ridge, canyon walls, or the thing the survey saw */
  let site = '';
  if (fl.site_delta || w.type === 'drowned') { const x0 = fl.site_delta ? 56 : 30; // open water along one side
    const d = `M${fx(x0 - 40)} ${HZ}Q${fx(x0 + 10)} 130 ${fx(x0 - 34)} 190Q${fx(x0 - 60)} 250 ${fx(x0 - 20)} ${H}L${fx(-10)} ${H}L${fx(-10)} ${HZ}Z`;
    site += `<g data-act="spot" data-v="Open water"><path fill="url(#lf-waves)" d="${d}"/><path class="kl" style="stroke-width:1.6" d="${d}"/></g>`; }
  if (fl.site_highland) for (let i = 0; i < 3; i++) site += `<path class="kl" style="stroke-dasharray:${7 - i} 3;stroke-width:${1.6 - i * 0.3}" d="M-5 ${284 + i * 6}Q90 ${262 + i * 7} 180 ${286 + i * 5}T365 ${276 + i * 7}"/>`;
  if (fl.site_deep) for (const sd of [0, 1]) { const X = x => sd ? W - x : x; site += `<path class="k" d="M${X(-2)} ${HZ - 30}L${X(20)} ${HZ - 12}L${X(12)} 130L${X(24)} 190L${X(10)} 250L${X(18)} ${H}L${X(-2)} ${H}Z"/><path class="pl" d="M${X(4)} 100L${X(10)} 128M${X(6)} 160L${X(16)} 190M${X(3)} 220L${X(8)} 248"/>`; }
  if (fl.site_coast) { const f0 = s.factors.find(x => x.id === w.rumour); if (!f0 || f0.kind !== 'ruin') site += `<g data-act="spot" data-v="What the survey saw from orbit">${at(fx(326), HZ + 2, `<path class="rl" style="stroke-width:1.6" d="M-9 0Q0 -22 9 0M-5 0Q0 -12 5 0"/>`)}</g>`; }

  /* the wild: thinned where the colony has cleared it */
  let wild = '';
  for (const [piece, vc, dens] of WILD[w.type] || WILD.barren) for (let i = 0; i < dens * 15; i++) {
    const x = r() * W, y = HZ + 10 + r() * (H - HZ - 12), v = r() < vc ? 1 : 0, sc = 0.75 + r() * 0.5 + (y - HZ) / 500;
    if (inWire(x, y, 1.1) || ((fl.site_delta || w.type === 'drowned') && x < (fl.site_delta ? 62 : 36))) continue;
    if (fl.site_deep && (x < 26 || x > W - 26)) continue;
    items.push({ y, h: at(fx(x), y, P[piece](v), sc) }); }
  // ground stipple inside the clearing, so it does not read as a hole
  let stip = ''; for (let i = 0; i < 70; i++) { const x = r() * W, y = HZ + 14 + r() * (H - HZ - 18); if (inWire(x, y, 0.97)) stip += `<circle class="k" cx="${f(fx(x))}" cy="${f(y)}" r=".7" opacity=".55"/>`; }
  // paths from the lander to whatever is used daily
  let paths = '';
  const walk = [[138, 160], [236, 190], [108, 222]].concat(s.built.greenhouse ? [[286, 172]] : [], s.built.fields || plots ? [[270, 240]] : [], s.built.housing ? [[110, 244]] : [], s.built.smelter ? [[70, 154]] : [], s.built.school ? [[200, 236]] : []);
  for (const [x, y] of walk) paths += `<path class="kl" style="stroke-dasharray:1 3.4;stroke-width:1.5" d="M${fx(180)} 176Q${fx((180 + x) / 2 + (y - 176) * 0.15)} ${f((176 + y) / 2 + 5)} ${fx(x)} ${y + 2}"/>`;

  /* people: one figure for every eight or so, near where the work is */
  const spots = [[160, 180], [208, 182], [176, 214], [240, 206], [128, 204], [150, 236]].concat(plots ? [[262, 244], [300, 250]] : [], s.built.smelter ? [[86, 164]] : [], s.project && SITE[s.project] ? [[SITE[s.project][0] - 14, SITE[s.project][1] + 4], [SITE[s.project][0] + 15, SITE[s.project][1] + 5]] : []);
  const folk = Math.min(26, Math.round(LF.hands(s) / 7));
  for (let i = 0; i < folk; i++) { const [bx, by] = spots[i % spots.length], x = bx + (r() - 0.5) * 26, y = by + (r() - 0.5) * 14; items.push({ y, h: `<g class="fk" style="animation-delay:${f(-r() * 4)}s">${at(fx(x), y, P.person(i % 4 === 0))}</g>` }); }

  /* what is out there, at the edges, closer as it presses harder */
  const EDGE = [[344, 178], [22, 236], [330, 276], [40, 150], [200, 292], [348, 232]]; let far = '', ei = 0, hi = 0;
  for (const F of s.factors) { if (F.stage < 1 || F.kind === 'land') continue;
    const cap = `${F.Name} · ${F.res ? RES_WORD[F.res] : KIND_WORD[F.kind] || 'out there'}`, near = F.res === 'lost' ? 1 : F.res ? 0 : LF.clamp(F.threat / 100, 0, 1);
    if (F.res === 'destroyed') continue;
    if (F.kind === 'ruin' || F.kind === 'natives' || F.kind === 'humans') { const x = [36, 250, 160, 320][hi++ % 4], body = F.kind === 'ruin' ? P.monolith(F.sub.length % 2) : F.kind === 'natives' ? P.huts() : P.stockade();
      far += `<g data-act="spot" data-v="${esc(cap)}">${at(fx(x), HZ + 3, body, F.kind === 'ruin' ? 1 : 0.8)}</g>`; continue; }
    if (F.kind === 'plague') { put(262, 150, P.tent(), cap, 1); continue; }
    if (F.kind === 'faction') { put(170, 262, P.banner(), cap, 1); for (let i = 0; i < 4; i++) put(160 + i * 6, 266 + (i % 2) * 3, P.person(1), cap); continue; }
    const [ex, ey] = EDGE[ei++ % EDGE.length], a = Math.atan2(ey - cy, ex - cx), wx = cx + Math.cos(a) * rx * 1.08, wy = cy + Math.sin(a) * ry * 1.08;
    const x = ex + (wx - ex) * near * 0.85, y = Math.max(HZ + 16, ey + (wy - ey) * near * 0.85);
    if (F.kind === 'fauna') { put(x, y, P.beast(F.sev > 1), cap, 0.8 + F.sev * 0.12); if (near > 0.5) put(x + 16, y + 7, P.beast(0), cap, 0.7); }
    else put(x, y, P.growth(3 + Math.round(near * 6)), cap, 1 + near * 0.5);
  }
  /* parties away: a line of footprints off the map, and a lamp on the ridge for the overdue */
  s.away.forEach((a, i) => { const [ex, ey] = [[352, 120], [8, 120], [352, 292]][i % 3], a0 = Math.atan2(ey - cy, ex - cx), x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry;
    back.push(`<path class="kl" style="stroke-dasharray:1.5 5;stroke-width:1.8" data-act="spot" data-v="${esc(`${a.n} away · ${a.to}`)}" d="M${f(fx(x0))} ${f(y0)}Q${f(fx((x0 + ex) / 2))} ${f((y0 + ey) / 2 - 8)} ${fx(ex)} ${ey}"/>`);
    if (a.silent) put(x0, y0 - 2, P.lamp(), `A lamp for the party sent to ${a.to} · overdue`); });

  /* sky: the sun this world has, the ship still in orbit, the season */
  let sky = '';
  for (let i = 0; i < (season === 3 ? 9 : 4); i++) { const y = 8 + i * (season === 3 ? 7 : 13); sky += `<path class="kl" style="stroke-width:.8;stroke-dasharray:${f(20 + r() * 50)} ${f(8 + r() * 30)}" d="M0 ${y}H${W}"/>`; }
  const sx = fx(104), sy = season === 3 ? 52 : 30, hot = w.climate === 'flare';
  sky += `<circle class="${hot ? 'r' : 'p'}" cx="${sx}" cy="${sy}" r="${hot ? 12 : 9}"/><circle class="kl" cx="${sx}" cy="${sy}" r="${hot ? 12 : 9}"/>`;
  if (hot) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; sky += `<path class="rl" d="M${f(sx + Math.cos(a) * 15)} ${f(sy + Math.sin(a) * 15)}L${f(sx + Math.cos(a) * 21)} ${f(sy + Math.sin(a) * 21)}"/>`; }
  if (s.sleepers > 0) sky += `<g data-act="spot" data-v="${esc(`The ${w.ship} · ${s.sleepers} asleep in orbit`)}"><circle fill="transparent" cx="${fx(250)}" cy="22" r="12"/><path class="k" d="M${fx(250) - 6} 22L${fx(250)} 19.6L${fx(250) + 6} 22L${fx(250)} 24.4Z"/><path class="kl" d="M${fx(250)} 15v14"/></g>`;
  let weather = '';
  if (w.climate === 'winter' && season === 3) for (let i = 0; i < 60; i++) weather += `<path class="kl" style="stroke-width:.9" d="M${f(r() * W)} ${f(r() * H)}l2 2m-2 0l2 -2"/>`;

  items.sort((a, b) => a.y - b.y);
  return `<svg class="scene" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The settlement from above">
<defs><filter id="lf-cut" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="${s.seed & 255}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>
<pattern id="lf-waves" width="18" height="8" patternUnits="userSpaceOnUse"><path class="kl" style="stroke-width:1" d="M0 4q4.5 -4 9 0t9 0"/></pattern></defs>
<g filter="url(#lf-cut)">${sky}${horizon(w.type, r)}${far}<path class="kl" style="stroke-width:1.4" d="M0 ${HZ}H${W}"/>${site}${stip}${paths}${back.join('')}${wire}${wild}${items.map(i => i.h).join('')}${weather}</g></svg>`;
};
})();
