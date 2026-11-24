// Galicia Scent: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// Timing in beats (u) on the measured grid (96 bpm, 1 beat = 0.625 s); docs/shotlist.md is the plan.
// Two cuts from one file: this folder is the brand cut; reel-galiciascent-bf/ loads this same file
// and gets the Black Friday version (scene 6 and the end card change).
import * as M from './lib/motion.js';

const { W, H, FORMAT, E, prog, lerp, clamp, springU, springKeys, SPRING, wobble, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32 } = M;

const BF = /-bf\//.test(location.pathname);

// Brand tokens from galiciascent.com (assets/brand.json). Gold is the one accent.
const C = { night: '#0C0907', coal: '#1A1410', cream: '#F0E6D6', paper: '#F4F0EA', gold: '#E3AA64', brown: '#8A5A22', mute: '#7A7068' };
const DISPLAY = 'Display', UI = 'UI';
const dfont = (size, italic = false) => `${italic ? 'italic ' : ''}600 ${Math.round(size)}px ${DISPLAY}`;
const ufont = (size, w = 700) => font(size, w, UI);
const S = FORMAT.safe;            // 9x16: x 72..1008, y 250..1490
const CX = W / 2;

const PRODUCTS = [
  { img: 'yara', brand: 'LATTAFA', name: 'Yara Elixir' },
  { img: 'eclaire', brand: 'LATTAFA', name: 'Éclaire' },
  { img: 'mayar', brand: 'LATTAFA', name: 'Mayar' },
  { img: 'odyssey', brand: 'ARMAF', name: 'Odyssey Mega' },
  { img: 'cdn', brand: 'ARMAF', name: 'Club de Nuit Intense' },
];

const HITS = [
  [0, 'Perfumes', 'impact', { gain: 0.5 }],
  [1, 'árabes', 'bell', { pitch: 'D6', gain: 0.18 }],
  [4, 'originales', 'pop', { pitch: 'A5' }],
  [5, 'LATTAFA', 'tick'],
  [6, 'ARMAF', 'tick'],
  [7, 'RASASI', 'tick'],
  [7.5, 'gold rule', 'swell', { len: 0.5 }],
  [8, 'card opens', 'impact'],
  [10, 'Éclaire', 'whoosh', { len: 0.4 }],
  [12, 'Mayar', 'whoosh', { len: 0.4 }],
  [14, 'Odyssey', 'whoosh', { len: 0.4, from: 2400, to: 600 }],
  [16, 'Club de Nuit', 'whoosh', { len: 0.4 }],
  [18, 'decants', 'thud'],
  [18.5, 'Pruébalo antes', 'pop', { pitch: 'E5' }],
  [20, 'DECANTS 5 Y 10 ML', 'click'],
  [21.5, 'panel wipe', 'whoosh', { len: 0.5, from: 600, to: 2400 }],
  ...(BF
    ? [[22, 'BLACK FRIDAY pill', 'click'], [24, '-20 %', 'impact'], [26, 'en decants', 'pop', { pitch: 'A5' }], [26.5, 'decant de regalo', 'coins']]
    : [[22, 'Lleva 3', 'click'], [24, 'Lleva 5', 'click'], [26, 'Envío gratis', 'bell', { pitch: 'A5' }]]),
  [27.5, 'into end', 'riser', { len: 0.5 }],
  [28, 'logo', 'impact', { gain: 0.55 }],
  [28.5, 'light sweep', 'bell', { pitch: 'D6' }],
  [29, 'galiciascent.com', 'tick'],
];

// ---------------------------------------------------------------- helpers
// Rich line: segments [str, italic?, color]. Glyphs rise from under a clip line on a spring.
function richLayout(ctx, segs, size) {
  let x = 0; const out = [];
  for (const [str, it, col] of segs) {
    const f = dfont(size, it); const L = layout(ctx, str, f, 0);
    for (const g of L.glyphs) out.push({ ch: g.ch, cx: x + g.cx, f, col });
    x += L.width;
  }
  return { glyphs: out, width: x };
}
function riseLine(ctx, segs, size, x, base, u, u0, { align = 'left', stagger = 0.025, exit = null } = {}) {
  const L = richLayout(ctx, segs, size);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.25, W, size * 1.6); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * stagger, SPRING.gentle);
    if (k <= 0) return;
    let y = base + (1 - k) * size * 1.1;
    if (exit) y -= E.inCubic(prog(u, exit[0] + j * 0.01, exit[1] + j * 0.01)) * size * 1.4;
    glyph(ctx, g.ch, x0 + g.cx, y, g.f, g.col);
  });
  ctx.restore();
  return L.width;
}
// Tracked caps label fading up word by word.
function caps(ctx, str, x, y, size, color, u, u0, align = 'left', track = 0.28) {
  const k = E.outCubic(prog(u, u0, u0 + 0.6));
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  text(ctx, str, x, y + (1 - k) * 18, ufont(size), color, align, size * track);
  ctx.restore();
}
function vignette(ctx, a = 0.55) {
  const g = ctx.createRadialGradient(CX, H * 0.45, W * 0.3, CX, H * 0.5, H * 0.75);
  g.addColorStop(0, 'rgba(12,9,7,0)'); g.addColorStop(1, `rgba(12,9,7,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function warmGlow(ctx, x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(227,170,100,${a})`); g.addColorStop(1, 'rgba(227,170,100,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- 1-2 hook: Jasmere   (u 0..8)
function sceneHook(ctx, u, IMG) {
  fill(ctx, C.night);
  // log-space push-in, already moving on frame 0
  const z = 1.0 * (1.12 / 1.0) ** prog(u, -1, 8);
  cover(ctx, IMG.jasmere, 0, 0, W, H * 0.66, { fx: 0.6, fy: 0.5, zoom: z });
  // fade the photo into the night colour under the type
  const g = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.66);
  g.addColorStop(0, 'rgba(12,9,7,0)'); g.addColorStop(1, C.night);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  vignette(ctx, 0.5);

  const size = 176, x = S.x + 8, b1 = 1060;
  riseLine(ctx, [['Perfumes', false, C.cream]], size, x, b1, u, -0.3);
  riseLine(ctx, [['árabes', true, C.gold]], size, x, b1 + size * 0.92, u, 1);
  riseLine(ctx, [['originales.', false, C.cream]], size * 0.66, x + 4, b1 + size * 0.92 + 140, u, 4);

  // the three houses, one per beat
  const y = 1440, names = ['LATTAFA', 'ARMAF', 'RASASI'], cs = 42;
  ctx.font = ufont(cs); ctx.letterSpacing = `${cs * 0.3}px`;
  let cx = x + 6;
  names.forEach((n, i) => {
    caps(ctx, n, cx, y, cs, C.gold, u, 5 + i);
    ctx.font = ufont(cs); ctx.letterSpacing = `${cs * 0.3}px`;
    const end = cx + ctx.measureText(n).width - cs * 0.3;
    cx = end + 64;
    if (i < 2) caps(ctx, '·', end + 32, y, cs, C.mute, u, 5 + i + 0.5, 'center', 0);
  });
  ctx.letterSpacing = '0px';

  // gold rule sweeps across: it becomes the frame of the first card
  const r = E.inOutCubic(prog(u, 7.2, 7.95));
  if (r > 0) { ctx.fillStyle = C.gold; ctx.fillRect(0, CARD.y + CARD.h / 2 - 2, W * r, 4); }
}

// ---------------------------------------------------------------- 3-4 parade   (u 8..18)
const CARD = { w: 800, h: 800, y: 380 };
function sceneParade(ctx, u, IMG) {
  fill(ctx, C.night);
  warmGlow(ctx, CX, CARD.y + CARD.h * 0.45, 760, 0.16);
  caps(ctx, 'PERFUMES COMPLETOS', CX, 310, 40, C.gold, u, 8.2, 'center', 0.3);

  // index chased by a spring: both cards are on screen during each whip
  const p = springKeys(u, [[8, 0], [10, 1], [12, 2], [14, 3], [16, 4]], SPRING.snappy);
  const open = springU(u, 7.85, SPRING.gentle);         // card opens out of the gold rule
  const out = E.inBack(prog(u, 17.4, 18), 1.3);          // last card leaves left
  const push = 1 + 0.06 * E.inOutSine(prog(u, 16.3, 17.6));
  const spacing = W * 1.02;

  PRODUCTS.forEach((P, i) => {
    const d = i - p;
    if (Math.abs(d) > 1.2) return;
    const x = CX + d * spacing - out * W * 1.1 - CARD.w / 2;
    const sc = (1 - 0.1 * Math.min(1, Math.abs(d))) * (i === 4 ? push : 1);
    const h = CARD.h * clamp(open);
    const y = CARD.y + (CARD.h - h) / 2;
    ctx.save();
    ctx.translate(x + CARD.w / 2, CARD.y + CARD.h / 2); ctx.scale(sc, sc); ctx.translate(-(x + CARD.w / 2), -(CARD.y + CARD.h / 2));
    // gold hairline frame, then the real product photo
    rrect(ctx, x - 3, y - 3, CARD.w + 6, h + 6, 22); ctx.fillStyle = C.gold; ctx.fill();
    if (h > 2) cover(ctx, IMG[P.img], x, y, CARD.w, h, { radius: 20, zoom: 1.02 });
    ctx.restore();

    // name card under the photo travels with it
    const tx = x + CARD.w / 2, a = clamp(1 - Math.abs(d) * 1.4) * clamp(open * 1.5 - 0.3);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    text(ctx, P.brand, tx, CARD.y + CARD.h + 100, ufont(40), C.gold, 'center', 40 * 0.3);
    const size = P.name.length > 14 ? 96 : 120;
    text(ctx, P.name, tx, CARD.y + CARD.h + 100 + size * 1.1, dfont(size), C.cream, 'center');
    ctx.restore();
  });
}

// ---------------------------------------------------------------- 5 decants   (u 18..22)
function sceneDecants(ctx, u, IMG) {
  fill(ctx, C.paper);
  const k = springU(u, 17.55, SPRING.gentle);
  const w = 860, h = 860, x = CX - w / 2, y = lerp(H * 0.62, 280, k);
  const q = 0.03 * wobble(u - 18.2, 2.2, 6);
  ctx.save(); ctx.translate(CX, y + h); ctx.scale(1 + q, 1 - q); ctx.translate(-CX, -(y + h));
  ctx.shadowColor = 'rgba(26,20,16,0.25)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
  rrect(ctx, x, y, w, h, 20); ctx.fillStyle = C.paper; ctx.fill();
  ctx.shadowColor = 'transparent';
  cover(ctx, IMG.decantYara, x, y, w, h, { radius: 20, zoom: 1.0 + 0.05 * prog(u, 18, 22) });
  ctx.restore();

  const b = 1300;
  riseLine(ctx, [['Pruébalo ', false, C.coal], ['antes', true, C.brown]], 140, CX, b, u, 18.5, { align: 'center' });
  caps(ctx, 'DECANTS DE 5 Y 10 ML', CX, b + 120, 42, C.brown, u, 19.5, 'center', 0.28);
}

// ---------------------------------------------------------------- 6 offer   (u 21.5..28)
function sceneOffer(ctx, u, IMG) {
  // dark panel pushes up over the decants scene (both on screen during the wipe)
  const wipe = E.inOutCubic(prog(u, 21.4, 22.05));
  const top = lerp(H, 0, wipe);
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, H - top); ctx.clip();
  ctx.translate(0, top * 0.25);
  ctx.drawImage(IMG.afeefBlur, 0, 0, W, H);
  warmGlow(ctx, CX, H * 0.45, 820, 0.12);
  const fade = E.inCubic(prog(u, 27.4, 28));           // gathers into the logo
  ctx.restore();
  if (wipe > 0 && wipe < 1) { ctx.fillStyle = C.gold; ctx.fillRect(0, top - 2, W, 4); }
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, H - top); ctx.clip(); ctx.translate(0, top * 0.25);
  if (BF) offerBF(ctx, u); else offerBrand(ctx, u);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
function offerBrand(ctx, u) {
  const x = S.x + 8, size = 136;
  caps(ctx, 'PACKS DE DECANTS', x + 4, 420, 40, C.gold, u, 21.8);
  riseLine(ctx, [['Lleva 3,', false, C.cream]], size, x, 600, u, 22);
  riseLine(ctx, [['ahorra ', false, C.cream], ['5 %', true, C.gold]], size, x, 600 + size, u, 22.4);
  riseLine(ctx, [['Lleva 5,', false, C.cream]], size, x, 960, u, 24);
  riseLine(ctx, [['ahorra ', false, C.cream], ['15 %', true, C.gold]], size, x, 960 + size, u, 24.4);
  // rule + shipping line
  const r = E.outCubic(prog(u, 25.6, 26.3));
  ctx.fillStyle = C.gold; ctx.fillRect(x + 4, 1210, 300 * r, 3);
  riseLine(ctx, [['Envío ', false, C.cream], ['gratis', true, C.gold]], 112, x, 1340, u, 26);
  riseLine(ctx, [['a toda España', false, C.cream]], 112, x, 1340 + 112, u, 26.3);
}
function offerBF(ctx, u) {
  // pill, as on the site's banner
  const pk = springU(u, 21.85, SPRING.snappy);
  if (pk > 0) {
    const label = 'BLACK FRIDAY · 27–30 NOV', fs = 34;
    ctx.font = ufont(fs); ctx.letterSpacing = `${fs * 0.22}px`;
    const tw = ctx.measureText(label).width; ctx.letterSpacing = '0px';
    const pw = tw + 72, ph = 78, px = CX - pw / 2, py = 470;
    ctx.save(); ctx.translate(CX, py + ph / 2); ctx.scale(pk, pk); ctx.translate(-CX, -(py + ph / 2));
    rrect(ctx, px, py, pw, ph, ph / 2); ctx.fillStyle = C.gold; ctx.fill();
    text(ctx, label, CX + fs * 0.11, py + ph / 2 + fs * 0.36, ufont(fs), C.night, 'center', fs * 0.22);
    ctx.restore();
  }
  // -20 % drops with weight and settles
  const dk = springU(u, 23.7, SPRING.bouncy);
  if (dk > 0) {
    const size = 330, base = 900;
    const q = 0.06 * wobble(u - 24, 2.4, 5);
    ctx.save(); ctx.translate(CX, base); ctx.scale(1 + q, 1 - q); ctx.translate(-CX, -base);
    ctx.globalAlpha = clamp(dk * 2);
    const y = base - (1 - dk) * 420;
    const L = richLayout(ctx, [['-20', false, C.gold], [' %', true, C.gold]], size);
    L.glyphs.forEach((g) => glyph(ctx, g.ch, CX - L.width / 2 + g.cx, y, g.f, g.col));
    ctx.restore();
  }
  riseLine(ctx, [['en ', false, C.cream], ['decants', true, C.cream]], 120, CX, 1060, u, 26, { align: 'center' });
  const r = E.outCubic(prog(u, 26.3, 26.9));
  ctx.fillStyle = C.gold; ctx.fillRect(CX - 150 * r, 1128, 300 * r, 3);
  caps(ctx, '+ DECANT DE REGALO', CX, 1230, 44, C.cream, u, 26.5, 'center', 0.2);
  caps(ctx, 'CON TU FRASCO', CX, 1300, 44, C.cream, u, 26.8, 'center', 0.2);
}

// ---------------------------------------------------------------- 7 end card   (u 28..32)
function sceneEnd(ctx, u, IMG) {
  fill(ctx, '#000');
  const k = springU(u, 27.8, SPRING.gentle);
  const s = lerp(0.86, 1, k) * (1 + 0.025 * prog(u, 28, 32));
  const size = 720, x = CX - size / 2, y = 330;
  ctx.save();
  ctx.globalAlpha = clamp(k * 1.4);
  ctx.translate(CX, y + size / 2); ctx.scale(s, s); ctx.translate(-CX, -(y + size / 2));
  ctx.beginPath(); ctx.arc(CX, y + size / 2, size * 0.5, 0, Math.PI * 2); ctx.clip();
  ctx.globalCompositeOperation = 'screen';           // the logo's black ground drops out
  ctx.drawImage(IMG.logo, x, y, size, size);
  // diagonal light sweep across the logo
  const sw = prog(u, 28.3, 29.4);
  if (sw > 0 && sw < 1) {
    const sx = lerp(x - 300, x + size + 300, E.inOutSine(sw));
    const g = ctx.createLinearGradient(sx - 160, y, sx + 160, y + size * 0.3);
    g.addColorStop(0, 'rgba(227,170,100,0)'); g.addColorStop(0.5, 'rgba(255,226,170,0.55)'); g.addColorStop(1, 'rgba(227,170,100,0)');
    ctx.beginPath(); ctx.arc(CX, y + size / 2, size * 0.47, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  riseLine(ctx, [['galiciascent', false, C.cream], ['.com', true, C.gold]], 96, CX, 1200, u, 29, { align: 'center' });
  caps(ctx, BF ? 'DEL 27 AL 30 DE NOVIEMBRE' : 'PERFUMES ÁRABES ORIGINALES', CX, 1310, 38, BF ? C.cream : C.gold, u, 29.6, 'center', 0.24);
  if (BF) caps(ctx, 'ENVÍO GRATIS A ESPAÑA', CX, 1385, 36, C.gold, u, 30.2, 'center', 0.28);
}

// ---------------------------------------------------------------- film
let GRAIN = null;
M.film({
  fonts: [dfont(100), dfont(100, true), ufont(40), ufont(40, 500)],
  images: {
    jasmere: 'assets/products/jasmere.jpg', yara: 'assets/products/yara-elixir.jpg', eclaire: 'assets/products/eclaire.jpg',
    mayar: 'assets/products/mayar.jpg', odyssey: 'assets/products/odyssey-mega.jpg', cdn: 'assets/products/cdn-intense.jpg',
    decantYara: 'assets/products/decant-yara.jpg', afeef: 'assets/products/decant-afeef.jpg', logo: 'assets/logo/logo.png',
  },
  hits: HITS,
  async init(ctx, IMG) {
    // blurred, darkened backdrop for the offer, computed once
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const b = c.getContext('2d');
    b.filter = 'blur(28px) brightness(0.32) saturate(0.9)';
    cover(b, IMG.afeef, -60, -60, W + 120, H + 120, { fx: 0.5, fy: 0.5 });
    IMG.afeefBlur = c;
    // seeded film grain tile
    const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256;
    const gx = gc.getContext('2d'); const id = gx.createImageData(256, 256); const rnd = mulberry32(11);
    for (let i = 0; i < id.data.length; i += 4) { const v = rnd() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0); GRAIN = gc;
  },
  draw(ctx, u, t, IMG) {
    if (u < 8) sceneHook(ctx, u, IMG);
    else if (u < 18) sceneParade(ctx, u, IMG);
    else if (u < 28) { sceneDecants(ctx, u, IMG); if (u > 21.4) sceneOffer(ctx, u, IMG); }
    else sceneEnd(ctx, u, IMG);
  },
  post(ctx, u, t) {
    if (!GRAIN) return;
    const f = Math.floor(t * 24);
    ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(hash01(f, 3) * 256), oy = Math.floor(hash01(f, 7) * 256);
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(GRAIN, x, y);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },
});
