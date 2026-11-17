/* Landfall — the starfield, drawn in the browser. UI only.
   Replaces the old starfield plate on the title card and the intro's space shots: sharp at any size and screen
   density, and it moves. Seeded, so a seed always gets the same sky. Three depths of stars (far ones many and faint,
   near ones few and bright, each depth moving at its own rate for parallax), a faint band of the galaxy with dust
   lanes, and a handful of bright stars with a soft glow and a slow shimmer. Star colours follow real temperatures
   (blue-white through yellow to orange), weighted the way a naked-eye sky is. Each depth is painted once to an
   offscreen tile that wraps, so a frame is a few drawImage calls. Reduced motion: one still frame.
   LFStars.mount(canvas, { seed, vx, vy, band }) -> stop(). vx, vy: drift of the nearest depth in CSS px per second. */
(function () {
'use strict';
const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// colour by temperature class, with how common each is among the stars you can see
const TINT = [[0.10, [170, 195, 255]], [0.22, [205, 220, 255]], [0.30, [248, 247, 255]], [0.20, [255, 244, 228]], [0.12, [255, 222, 180]], [0.06, [255, 196, 150]]];
const tint = r => { let x = r(); for (const [w, c] of TINT) { if ((x -= w) <= 0) return c; } return TINT[2][1]; };
const DEPTHS = [{ n: 1.1, mag: [0.25, 0.7], size: [0.35, 0.8], speed: 0.18 }, { n: 0.35, mag: [0.4, 0.95], size: [0.5, 1.1], speed: 0.45 }, { n: 0.07, mag: [0.6, 1], size: [0.8, 1.6], speed: 1 }];
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* A star on a tile that wraps: drawn again across any edge it touches. */
function dot(g, x, y, rad, c, a, W, H) {
  g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const xs = [x].concat(x < rad ? [x + W] : x > W - rad ? [x - W] : []), ys = [y].concat(y < rad ? [y + H] : y > H - rad ? [y - H] : []);
  for (const px of xs) for (const py of ys) { g.beginPath(); g.arc(px, py, rad, 0, 6.2832); g.fill(); }
}
function tile(W, H, depth, r, dpr, band) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), area = (W / dpr) * (H / dpr) / 1000, n = Math.round(area * depth.n * (band ? 1.25 : 1));
  for (let i = 0; i < n; i++) {
    let x = r() * W, y = r() * H;
    // more of the far stars crowd into the galaxy's band
    if (band && depth === DEPTHS[0] && r() < 0.45) { const t = r(); x = t * W; y = band.y0 * H + (band.y1 - band.y0) * H * t + (r() + r() + r() - 1.5) * band.w * H * 0.6; y = ((y % H) + H) % H; }
    const m = Math.pow(r(), 2.6), a = depth.mag[0] + (depth.mag[1] - depth.mag[0]) * m, rad = (depth.size[0] + (depth.size[1] - depth.size[0]) * m) * dpr;
    dot(g, x, y, rad, tint(r), a, W, H);
  }
  return c;
}
/* The galaxy: a soft diagonal band, brighter at its core, cut by darker dust. Painted once, larger than the view. */
function galaxy(W, H, r, band) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), x0 = 0, y0 = band.y0 * H, x1 = W, y1 = band.y1 * H, ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(W, H) * 1.2;
  g.translate(W / 2, (y0 + y1) / 2); g.rotate(ang);
  const glow = (w, a, col, off) => { const gr = g.createLinearGradient(0, -w + off, 0, w + off);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(${col},${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-len / 2, -w + off, len, 2 * w); };
  glow(band.w * H * 1.6, 0.05, '120,135,190', 0);
  glow(band.w * H * 0.9, 0.07, '170,170,200', 0);
  // a brighter core along part of its length
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) { const px = (r() - 0.5) * len * 0.7, py = (r() + r() - 1) * band.w * H * 0.5, rr = (0.08 + r() * 0.16) * band.w * H * 3;
    const gr = g.createRadialGradient(px, py, 0, px, py, rr), warm = r() < 0.5;
    gr.addColorStop(0, warm ? 'rgba(220,190,160,0.035)' : 'rgba(160,175,230,0.03)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px - rr, py - rr, 2 * rr, 2 * rr); }
  // dust lanes
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) { const px = (r() - 0.5) * len * 0.8, py = (r() - 0.5) * band.w * H * 0.35, rx = (0.1 + r() * 0.25) * band.w * H * 2.5, ry = rx * (0.15 + r() * 0.2);
    g.save(); g.translate(px, py); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
  return c;
}
/* A bright star's glow: a small core, a soft halo and faint spikes, painted once per colour. */
function glint(c, dpr) {
  const s = Math.round(48 * dpr), cv = document.createElement('canvas'); cv.width = cv.height = s;
  const g = cv.getContext('2d'), m = s / 2, col = `${c[0]},${c[1]},${c[2]}`;
  let gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, `rgba(${col},0.55)`); gr.addColorStop(0.08, `rgba(${col},0.22)`); gr.addColorStop(0.3, `rgba(${col},0.05)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = 'lighter';
  for (const [w, h] of [[s, 1.2 * dpr], [1.2 * dpr, s * 0.7]]) { gr = w > h ? g.createLinearGradient(0, 0, s, 0) : g.createLinearGradient(0, m - h / 2 - s * 0.35, 0, m + s * 0.35);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},0.35)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr;
    g.fillRect(m - w / 2, m - h / 2, w, h); }
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(m, m, 1.1 * dpr, 0, 6.2832); g.fill();
  return cv;
}

function mount(canvas, o) {
  o = Object.assign({ seed: 1, vx: -6, vy: 0, band: true }, o || {});
  const g = canvas.getContext('2d'), still = reduce();
  let W = 0, H = 0, dpr = 1, tiles = [], gal = null, bright = [], raf = 0, t0 = performance.now(), alive = true;
  function build() {
    const box = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(box.width * dpr)); H = Math.max(1, Math.round(box.height * dpr));
    canvas.width = W; canvas.height = H;
    const r = rng(o.seed >>> 0), band = o.band ? { y0: 0.15 + r() * 0.3, y1: 0.55 + r() * 0.35, w: 0.16 + r() * 0.06 } : null;
    if (r() < 0.5 && band) [band.y0, band.y1] = [band.y1, band.y0];
    tiles = DEPTHS.map(d => tile(W, H, d, r, dpr, band));
    gal = band ? galaxy(Math.round(W * 1.3), Math.round(H * 1.3), r, band) : null;
    const nb = Math.max(4, Math.round((W / dpr) * (H / dpr) / 45000)), cache = new Map();
    bright = []; for (let i = 0; i < nb; i++) { const c = tint(r), k = c.join(); if (!cache.has(k)) cache.set(k, glint(c, dpr));
      bright.push({ x: r(), y: r(), img: cache.get(k), s: 0.35 + Math.pow(r(), 3) * 0.75, ph: r() * 6.28, f: 0.3 + r() * 0.7 }); }
  }
  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000, vx = o.vx * dpr, vy = o.vy * dpr;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#03050a'; g.fillRect(0, 0, W, H);
    // the galaxy is far enough off to barely move: it slides to and fro within its margin
    if (gal) { const s = DEPTHS[0].speed * 0.35, tri = (d, m) => { const q = ((d % (2 * m)) + 2 * m) % (2 * m); return q < m ? q : 2 * m - q; };
      g.drawImage(gal, -tri(W * 0.15 - vx * s * t, W * 0.3), -tri(H * 0.15 - vy * s * t, H * 0.3)); }
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < tiles.length; i++) {
      const sp = DEPTHS[i].speed, ox = (((vx * sp * t) % W) + W) % W, oy = (((vy * sp * t) % H) + H) % H;
      g.drawImage(tiles[i], ox - W, oy - H); g.drawImage(tiles[i], ox, oy - H); g.drawImage(tiles[i], ox - W, oy); g.drawImage(tiles[i], ox, oy);
    }
    for (const b of bright) {
      const sp = DEPTHS[2].speed * 1.1, x = ((b.x * W + vx * sp * t) % W + W) % W, y = ((b.y * H + vy * sp * t) % H + H) % H;
      const sz = b.img.width * b.s * (1 + 0.06 * Math.sin(t * b.f + b.ph));
      g.globalAlpha = 0.85 + 0.15 * Math.sin(t * b.f * 1.7 + b.ph); g.drawImage(b.img, x - sz / 2, y - sz / 2, sz, sz);
    }
    g.globalAlpha = 1;
    if (!still) raf = requestAnimationFrame(frame);
  }
  build(); frame(t0);
  const ro = window.ResizeObserver ? new ResizeObserver(() => { const b = canvas.getBoundingClientRect(); if (Math.round(b.width * dpr) !== W || Math.round(b.height * dpr) !== H) { build(); if (still) frame(performance.now()); } }) : null;
  if (ro) ro.observe(canvas);
  return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); };
}
window.LFStars = { mount };
})();
