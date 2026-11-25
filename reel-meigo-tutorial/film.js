// El Meigo de Galicia Scent: four Black Friday reels driven by the owner's recorded voice.
// Folder picks the video: reel-meigo-tutorial | -vie2 | -sab2 | -dom2. Pure function of time.
// Timing is in SECONDS of the voice track (v = t - LEAD), taken from Whisper word timings (words.json).
import * as M from './lib/motion.js';
import { drawMeiga as drawMeigo } from './meiga.js';

const { W, H, E, prog, lerp, clamp, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32, bump, wobble } = M;
const VID = (location.pathname.match(/reel-meigo-(tutorial|vie2|sab2|dom2|frascos)/) || [, 'tutorial'])[1];
const LEAD = 0.3;
const C = { night: '#0C0907', coal: '#1A1410', cream: '#F0E6D6', paper: '#F4F0EA', gold: '#E3AA64', goldHi: '#FBE3A8', brown: '#8A5A22', mute: '#7A7068' };
const DISPLAY = 'Display', UI = 'UI';
const dfont = (s, it = false) => `${it ? 'italic ' : ''}600 ${Math.round(s)}px ${DISPLAY}`;
const ufont = (s, w = 700) => font(s, w, UI);
const CX = W / 2;
const SP = { snappy: { stiffness: 380, damping: 30 }, bouncy: { stiffness: 260, damping: 13 }, gentle: { stiffness: 120, damping: 20 } };
const sp = (v, v0, cfg = SP.gentle) => M.spring(v - v0, cfg);
const pr = (v, a, b) => prog(v, a, b);
const S2U = (s) => (s + LEAD) / 0.535693;          // voice seconds -> beats for the HITS list

// ---------------------------------------------------------------- type helpers
function richLayout(ctx, segs, size) {
  let x = 0; const out = [];
  for (const [str, it, col] of segs) { const f = dfont(size, it); const L = layout(ctx, str, f, 0); for (const g of L.glyphs) out.push({ ch: g.ch, cx: x + g.cx, f, col }); x += L.width; }
  return { glyphs: out, width: x };
}
function rise(ctx, segs, size, x, base, v, v0, out = null, align = 'center') {
  const L = richLayout(ctx, segs, size); const x0 = align === 'center' ? x - L.width / 2 : x;
  if (out && v > out[1] + 0.3) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.25, W, size * 1.65); ctx.clip();
  ctx.shadowColor = 'rgba(15,8,4,0.9)'; ctx.shadowBlur = size * 0.22; ctx.shadowOffsetY = size * 0.04;
  L.glyphs.forEach((g, j) => {
    const k = sp(v, v0 + j * 0.018); if (k <= 0) return;
    let y = base + (1 - k) * size * 1.1;
    if (out) y += E.inCubic(pr(v, out[0] + j * 0.008, out[1] + j * 0.008)) * size * 1.5;
    glyph(ctx, g.ch, x0 + g.cx, y, g.f, g.col);
  });
  ctx.restore();
}
function caps(ctx, str, x, y, size, color, v, v0, out = null, track = 0.24, align = 'center') {
  let k = E.outCubic(pr(v, v0, v0 + 0.3)); if (out) k *= 1 - pr(v, out[0], out[1]); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; ctx.shadowColor = 'rgba(15,8,4,0.95)'; ctx.shadowBlur = 16; text(ctx, str, x, y + (1 - k) * 14, ufont(size), color, align, size * track); ctx.restore();
}
function pill(ctx, label, cx, y, v, v0, out = null, { fs = 36, bg = C.gold, fg = C.night } = {}) {
  let k = sp(v, v0, SP.snappy); if (out) k *= 1 - E.inBack(pr(v, out[0], out[1])); if (k <= 0.01) return;
  ctx.font = ufont(fs); ctx.letterSpacing = `${fs * 0.18}px`; const tw = ctx.measureText(label).width; ctx.letterSpacing = '0px';
  const pw = tw + 70, ph = fs * 2.2, px = cx - pw / 2;
  ctx.save(); ctx.translate(cx, y + ph / 2); ctx.scale(k, k); ctx.translate(-cx, -(y + ph / 2));
  rrect(ctx, px, y, pw, ph, ph / 2); ctx.fillStyle = bg; ctx.fill();
  text(ctx, label, cx + fs * 0.09, y + ph / 2 + fs * 0.36, ufont(fs), fg, 'center', fs * 0.18);
  ctx.restore();
}
function drop(ctx, segs, size, cx, y, v, v0, out = null) {
  const k = M.spring(v - v0 + 0.16, SP.bouncy); if (k <= 0 || (out && v > out[1])) return;
  const q = 0.06 * wobble((v - v0) / 0.536, 2.4, 5); let dy = -(1 - k) * 460, a = clamp(k * 2);
  if (out) { const o = E.inBack(pr(v, out[0], out[1]), 1.3); dy += o * 900; }
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, y); ctx.scale(1 + q, 1 - q); ctx.translate(-cx, -y);
  ctx.shadowColor = 'rgba(15,8,4,0.9)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
  const L = richLayout(ctx, segs, size); L.glyphs.forEach((g) => glyph(ctx, g.ch, cx - L.width / 2 + g.cx, y + dy, g.f, g.col)); ctx.restore();
}
function card(ctx, img, x, y, w, rot, v, v0, out = null, label = null, price = null, from = [0, 300]) {
  let k = sp(v, v0, SP.bouncy); let ox = 0;
  if (out) { const o = E.inBack(pr(v, out[0], out[1]), 1.2); k *= 1 - o; }
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x + from[0] * (1 - k), y + from[1] * (1 - k)); ctx.rotate(rot * k); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  const lh = label ? w * 0.2 : 0;
  rrect(ctx, -w / 2 - 8, -w / 2 - 8, w + 16, w + 16 + lh, 18); ctx.fillStyle = C.paper; ctx.fill(); ctx.shadowColor = 'transparent';
  cover(ctx, img, -w / 2, -w / 2, w, w, { radius: 12 });
  if (label) text(ctx, label, 0, w / 2 + lh * 0.62, dfont(w * 0.12), C.coal, 'center');
  if (price) {
    // [normal, Black Friday]: the normal price struck through above the -20 % price
    const [old, now] = Array.isArray(price) ? price : [null, price]; ctx.save(); ctx.font = ufont(38); const pw = Math.max(ctx.measureText(now).width, 120) + 56;
    ctx.translate(w / 2 - pw / 2 + 30, -w / 2 + 16); ctx.rotate(0.12); rrect(ctx, -pw / 2, -50, pw, 104, 30); ctx.fillStyle = C.gold; ctx.fill();
    if (old) { ctx.font = ufont(24, 500); const ow = ctx.measureText(old).width; text(ctx, old, 0, -14, ufont(24, 500), 'rgba(26,20,16,0.7)', 'center');
    ctx.strokeStyle = '#B23A2A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-ow / 2 - 4, -22); ctx.lineTo(ow / 2 + 4, -22); ctx.stroke(); }
    text(ctx, now, 0, old ? 32 : 14, ufont(38), C.night, 'center', 1); ctx.restore(); }
  ctx.restore();
}
// gold badge with up to 3 lines, pops with a bounce, tilted
function sticker(ctx, lines, x, y, rot, v, v0, out = null, { w = 340, big = -1 } = {}) {
  let k = sp(v, v0, SP.bouncy); if (out) k *= 1 - E.inBack(pr(v, out[0], out[1])); if (k <= 0.01) return;
  lines = lines.filter((l) => l !== '');
  w = Math.max(...lines.map((l, i) => { ctx.font = i === big ? dfont(86) : ufont(30); ctx.letterSpacing = i === big ? '0px' : '3px'; const m = ctx.measureText(l).width; ctx.letterSpacing = '0px'; return m; })) + 70;
  x = Math.min(x, W - 30 - w / 2);
  const lh = lines.map((l, i) => (i === big ? 88 : 40)); const h = lh.reduce((a, b) => a + b, 0) + 50;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  rrect(ctx, -w / 2, -h / 2, w, h, 26); ctx.fillStyle = C.gold; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C.goldHi; ctx.lineWidth = 4; rrect(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 20); ctx.stroke();
  let yy = -h / 2 + 25;
  lines.forEach((l, i) => { yy += lh[i]; text(ctx, l, 0, yy - (i === big ? 14 : 10), i === big ? dfont(86) : ufont(30), C.night, 'center', i === big ? 0 : 3); });
  ctx.restore();
}
function check(ctx, x, y, s, k, color = C.night) {
  if (k <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.18; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); const p1 = [x - s * 0.4, y], p2 = [x - s * 0.1, y + s * 0.3], p3 = [x + s * 0.45, y - s * 0.35];
  const a = clamp(k * 2), b = clamp(k * 2 - 1); ctx.moveTo(...p1); ctx.lineTo(lerp(p1[0], p2[0], a), lerp(p1[1], p2[1], a)); if (b > 0) ctx.lineTo(lerp(p2[0], p3[0], b), lerp(p2[1], p3[1], b)); ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------- magic: wand beam, tap ripple, flash
function star(ctx, x, y, r, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#FFF1CC'; ctx.beginPath(); for (let j = 0; j < 8; j++) { const q = (j / 8) * Math.PI * 2, rr = j % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } ctx.fill(); ctx.restore(); }
function beam(ctx, from, to, v, v0, len = 0.45) {
  const p = pr(v, v0 - len, v0); if (!from || p <= 0 || p >= 1) return;
  for (let i = 0; i < 9; i++) { const q = clamp(p - i * 0.05); if (q <= 0) continue; const e = E.inOutSine(q);
    const x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(e * Math.PI) * 160; star(ctx, x, y, 22 - i * 2, 1 - i * 0.1); }
}
function ripple(ctx, x, y, v, v0) {
  const p = pr(v, v0, v0 + 0.7); if (p <= 0 || p >= 1) return;
  ctx.save(); for (let i = 0; i < 2; i++) { const q = clamp(p * 1.3 - i * 0.25); if (q <= 0) continue;
    ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = C.gold; ctx.lineWidth = 10 * (1 - q) + 2; ctx.beginPath(); ctx.arc(x, y, 20 + q * 90, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 0.5 * (1 - p); ctx.fillStyle = C.goldHi; ctx.beginPath(); ctx.arc(x, y, 30 * (1 - p) + 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3, r = 40 + p * 120; star(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 14 * (1 - p), 1 - p); }
}
function flash(ctx, v, v0) { const a = 0.55 * (1 - pr(v, v0, v0 + 0.35)); if (v < v0 || a <= 0) return; ctx.fillStyle = `rgba(251,227,168,${a})`; ctx.fillRect(0, 0, W, H); }
function shake(ctx, v, v0, amp = 18) { const d = v - v0; if (d < 0 || d > 0.4) return; const k = amp * (1 - d / 0.4); ctx.translate(Math.sin(d * 90) * k, Math.cos(d * 70) * k); }

// ---------------------------------------------------------------- background
let GRAIN = null, VOENV = null;
// The shop panorama (assets/fondos/botica.png, 8256x2048): the camera walks along it.
// Landmarks (source x): entrance 0-1030, shelves 1450-3350, counter 3400-4900, pedestals 5160-5930, arches 4750-6450, nook 7020, window 7740.
const CAMS = {
  tutorial: [[0, 900], [3.6, 2300], [10.0, 2900], [15.4, 3500], [21.2, 4300], [30.4, 5500], [34.4, 7300]],
  vie2: [[0, 800], [2.6, 1900], [6.5, 3900], [8.0, 5500], [12.2, 4300], [14.6, 6900], [15.8, 7500]],
  sab2: [[0, 5600], [4.9, 2500], [10.2, 4100], [15.9, 6900], [20.9, 7450], [26.9, 7700]],
  dom2: [[0, 900], [1.0, 2400], [4.0, 4000], [7.6, 5500], [14.8, 7400]],
  frascos: [[0, 2100], [3.8, 3700], [6.8, 5250], [11.1, 5800], [15.6, 6500], [19.4, 7050], [21.5, 7550]],
}[VID];
const BGS = 1920 * 1.06 / 2048, BGW = 1080 / BGS;
function camX(v) {
  let x = CAMS[0][1];
  for (let i = 1; i < CAMS.length; i++) { const [k, nx] = CAMS[i]; const e = E.inOutSine(pr(v, k - 0.45, k + 0.85)); x += (nx - CAMS[i - 1][1]) * e; }
  return Math.max(BGW / 2, Math.min(8256 - BGW / 2, x));
}
const camSpeed = (v) => Math.abs(camX(v + 0.05) - camX(v - 0.05)) / 0.1;
function backdrop(ctx, t, v) {
  const x = camX(v);
  ctx.drawImage(IMGS.botica, x - BGW / 2, 0, BGW, 2048, 0, -40, W, 2048 * BGS);
  // legibility: warm dark veil at the top where the type lives, soft vignette around
  const g = ctx.createLinearGradient(0, 0, 0, 1250); g.addColorStop(0, 'rgba(18,9,4,0.62)'); g.addColorStop(0.75, 'rgba(18,9,4,0.28)'); g.addColorStop(1, 'rgba(18,9,4,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1250);
  const r = ctx.createRadialGradient(CX, 900, 400, CX, 960, 1250); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(15,8,4,0.45)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- the Meigo
const voice = (t) => (VOENV ? VOENV[Math.max(0, Math.min(VOENV.length - 1, Math.round(t * 60)))] || 0 : 0);
function meigo(ctx, t, x, feet, s, S) {
  const vv = voice(t);
  S.t = t; S.blink = S.blink ?? (bump(t % 3.7, 3.5, 0.1));
  if (vv > 0.06) S.mouth = { open: Math.min(1, vv * 0.9), round: 0.3 + 0.3 * Math.sin(t * 23), smile: S.happy ? 0.9 : 0.5 };
  else S.mouth = S.mouth || { open: 0, smile: 0.6 };
  feet += 160; s *= 1.15;
  const v = t - LEAD;
  if (camSpeed(v) > 120 && S.step == null) { S.step = (t * 1.7) % 1; S.lean = (S.lean || 0) + 0.05; }
  ctx.save(); ctx.fillStyle = 'rgba(20,10,4,0.35)'; ctx.beginPath(); ctx.ellipse(x, feet - 4, 190 * s, 34 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x, feet); ctx.scale(s, s); const out = drawMeigo(ctx, S); ctx.restore(); return out;
}
// talking-arm gesture: a little beat while speaking
const gest = (t, a = 0.25) => a * Math.sin(t * 5.3) * clamp(voice(t) * 2);
function endCard(ctx, v, t, v0, line) {
  const k = sp(v, v0); if (k <= 0) return null;
  const size = 380, y = 270;
  ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(CX, y + size / 2); ctx.scale(lerp(0.8, 1, k), lerp(0.8, 1, k)); ctx.translate(-CX, -(y + size / 2));
  ctx.beginPath(); ctx.arc(CX, y + size / 2, size * 0.5, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(IMGS.logo, CX - size / 2, y, size, size); ctx.restore();
  rise(ctx, [['galiciascent', false, C.cream], ['.com', true, C.gold]], 96, CX, 760, v, v0 + 0.25);
  pill(ctx, line, CX, 800, v, v0 + 0.6, null, { fs: 24 });
  return meigo(ctx, t, CX, 1480, 0.62, { happy: 1, armL: [2.5 + 0.25 * Math.sin(t * 9), 0.5], armR: [0.5, 0.6], blush: 0.6 });
}

// ---------------------------------------------------------------- TUTORIAL: the phone
const PH = { x: 70, y: 340, w: 600 };
PH.s = PH.w / 1170; PH.h = 1992 * PH.s;
function phoneFrame(ctx, k) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
  rrect(ctx, PH.x - 22, PH.y - 22, PH.w + 44, PH.h + 44, 70); ctx.fillStyle = '#16110D'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = C.gold; ctx.lineWidth = 4; rrect(ctx, PH.x - 20, PH.y - 20, PH.w + 40, PH.h + 40, 68); ctx.stroke(); ctx.restore();
}
// show image `img` scrolled by `sy` source px; returns mapper src->canvas
function screen(ctx, img, sy, alpha = 1) {
  ctx.save(); rrect(ctx, PH.x, PH.y, PH.w, PH.h, 50); ctx.clip(); ctx.globalAlpha = alpha;
  ctx.drawImage(img, 0, sy, 1170, 1992, PH.x, PH.y, PH.w, PH.h); ctx.restore();
}
const map = (sx, sy, scroll) => [PH.x + sx * PH.s, PH.y + (sy - scroll) * PH.s];
function ring(ctx, x, y, w, h, v, v0, out) {
  let k = E.outBack(pr(v, v0, v0 + 0.35)); if (out) k *= 1 - pr(v, out[0], out[1]); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k); ctx.strokeStyle = C.gold; ctx.lineWidth = 7; ctx.setLineDash([18, 10]); ctx.lineDashOffset = -v * 60;
  rrect(ctx, x - w / 2 * k, y - h / 2, w * k, h, 16); ctx.stroke(); ctx.restore();
}
function tutorial(ctx, v, t, IMG) {
  // --- hook: Meigo big, then shrinks to the right as the phone arrives
  const toSide = E.inOutCubic(pr(v, 4.6, 5.8));
  const mx = lerp(CX, 900, toSide), ms = lerp(0.92, 0.56, toSide);
  rise(ctx, [['¿Un perfume árabe', false, C.cream]], 96, CX, 400, v, -0.45, [4.6, 5.0]);
  rise(ctx, [['por menos de ', false, C.cream], ['6 €', true, C.gold]], 130, CX, 560, v, 3.2, [4.6, 5.0]);
  caps(ctx, 'TE ENSEÑO CÓMO', CX, 660, 40, C.gold, v, 4.7, [5.3, 5.7]);
  const end = v > 34.3;
  // --- phone
  const pk = sp(v, 5.4) * (1 - E.inBack(pr(v, 34.2, 34.8)));
  let scr = null, scroll = 0;
  if (pk > 0.01) {
    ctx.save(); const ox = -(1 - pk) * 900; ctx.translate(ox, 0);
    phoneFrame(ctx);
    if (v < 10.0) { scr = IMG.c1; scroll = 0; }
    else if (v < 13.1) { scr = IMG.c2; scroll = 1250 * E.inOutCubic(pr(v, 10.6, 11.9)); }
    else if (v < 21.2) { scr = IMG.c3; scroll = 1700 * E.inOutCubic(pr(v, 14.9, 15.8)) * (1 - E.inOutCubic(pr(v, 19.9, 20.4))); }
    else { scr = IMG.c6; scroll = 0; }
    screen(ctx, scr, scroll);
    // screen-change wipe: a gold sweep on each new page
    for (const v0 of [10.0, 13.1, 21.2]) { const p = pr(v, v0 - 0.15, v0 + 0.2); if (p > 0 && p < 1) { ctx.save(); rrect(ctx, PH.x, PH.y, PH.w, PH.h, 50); ctx.clip(); ctx.fillStyle = `rgba(227,170,100,${0.5 * Math.sin(p * Math.PI)})`; ctx.fillRect(PH.x, PH.y, PH.w, PH.h); ctx.restore(); } }
    // annotations on the real screens
    if (v >= 13.1 && v < 21.2) {
      const [ax, ay] = map(306, 2514, scroll), [bx, by] = map(861, 2514, scroll);
      ring(ctx, ax, ay, 300, 110, v, 16.6, [18.4, 18.8]); ring(ctx, bx, by, 300, 110, v, 17.4, [18.4, 18.8]);
    }
    // cart badge
    if (v >= 20.2 && v < 21.2) { const [cx, cy] = map(1053, 236, scroll); const k = sp(v, 20.3, SP.bouncy); ctx.save(); ctx.translate(cx + 14, cy - 14); ctx.scale(k, k); ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fillStyle = C.coal; ctx.fill(); text(ctx, '1', 0, 8, ufont(22), '#fff', 'center'); ctx.restore(); }
    if (v >= 21.2) { const [tx, ty] = map(585, 1283, 0), [dx, dy] = map(585, 1123, 0); ring(ctx, tx, ty, 590, 70, v, 22.0, [26.6, 27]); ring(ctx, dx, dy, 590, 64, v, 25.6, [26.9, 27.3]); }
    ctx.restore();
    ctx.save(); ctx.translate(ox, 0); ctx.restore();
  }
  // step label
  const steps = [[6.1, '1 · ENTRA EN LA WEB'], [10.2, '2 · ELIGE TU DECANT'], [15.4, '3 · TAMAÑO Y CARRITO'], [20.4, '4 · EL -20 % SE APLICA SOLO'], [30.4, '5 · PAGA Y LISTO']];
  steps.forEach(([v0, s], i) => { const nx = steps[i + 1] ? steps[i + 1][0] : 34.2; if (v >= v0 - 0.1 && v < nx + 0.3) pill(ctx, 'PASO ' + s, CX, 250, v, v0, [nx - 0.2, nx + 0.1], { fs: 30 }); });
  // stickers to the right of the phone
  if (v > 19.2 && v < 21) sticker(ctx, ['¡AÑADIDO', 'AL CARRITO!'], 880, 560, 0.08, v, 19.3, [20.6, 20.9], { w: 330 });
  sticker(ctx, ['DEL 27 AL 30', '-20 %', 'SE DESCUENTA SOLO'], 880, 560, -0.06, v, 21.7, [26.9, 27.2], { w: 340, big: 1 });
  if (v > 25.4 && v < 27.3) { sticker(ctx, ['SIN CÓDIGOS', '', ''], 880, 830, 0.05, v, 25.5, [26.9, 27.2], { w: 320 }); }
  if (v > 25.4 && v < 27.3) check(ctx, 900, 745, 70, pr(v, 25.7, 26.2), C.gold);
  card(ctx, IMG.decantAfeef, 870, 520, 260, 0.06, v, 27.6, [30.2, 30.6], null, null, [400, 0]);
  sticker(ctx, ['CON TU FRASCO', 'DECANT DE REGALO'], 870, 790, -0.05, v, 28.3, [30.2, 30.6], { w: 360 });
  sticker(ctx, ['ENVÍO EN', '24–48 H', 'A TODA ESPAÑA'], 880, 600, 0.06, v, 31.5, [34.0, 34.4], { w: 330, big: 1 });
  if (end) return endCard(ctx, v, t, 34.4, 'BLACK FRIDAY · DEL 27 AL 30 DE NOVIEMBRE');
  // Meigo with his wand (the decant): taps are beams from the nozzle
  const taps = [[9.4, 585, 70, () => IMG.c1, 0], [12.6, 890, 2300, null, 1250], [16.74, 306, 2514, null, 1700], [19.3, 780, 2736, null, 1700], [20.9, 1053, 236, null, 0], [30.9, 585, 1658, null, 0]];
  const near = taps.find(([v0]) => v > v0 - 0.7 && v < v0 + 0.3);
  const S = { armL: [0.4 + gest(t), 0.6], armR: [0.5 + gest(t + 1), 0.7], lookX: v > 5.5 ? -0.7 : 0 };
  if (near) { S.armR = [1.7, 0.2]; S.spray = bump(v, near[0], 0.15); S.lookX = -0.8; S.lookY = -0.3; }
  if (v < 4.6) { S.armL = [1.0 + gest(t, 0.4), 1.2]; S.brow = 0.4; }
  if (v > 18.6 && v < 19.8) { S.happy = 1; }
  const out = meigo(ctx, t, mx, 1480, ms, S);
  taps.forEach(([v0, sx, sy, , scr0]) => { const p = map(sx, sy, scr0); p[0] += -(1 - pk) * 900; beam(ctx, out.nozzle, p, v, v0); ripple(ctx, p[0], p[1], v, v0); });
  return out;
}

// ---------------------------------------------------------------- VIERNES 2: ¡Alto! + cuenta atrás
function vie2(ctx, v, t, IMG) {
  ctx.save(); ctx.translate(0, 110); shake(ctx, v, 0.0, 26); shake(ctx, v, 3.98, 20);
  // ¡ALTO! stamp
  const ak = sp(v, -0.5, SP.bouncy), aout = E.inBack(pr(v, 2.4, 2.65));
  if (v < 2.7 && ak > 0) { ctx.save(); ctx.translate(CX, 420); ctx.rotate(-0.08); ctx.scale(lerp(2.4, 1, ak) * (1 - aout), lerp(2.4, 1, ak) * (1 - aout)); ctx.globalAlpha = clamp(ak * 2);
    const L = richLayout(ctx, [['¡ALTO!', false, C.gold]], 260); L.glyphs.forEach((g) => glyph(ctx, g.ch, -L.width / 2 + g.cx, 90, g.f, g.col)); ctx.restore(); }
  rise(ctx, [['No compres ni un perfume más', false, C.cream]], 62, CX, 640, v, 0.3, [2.4, 2.65]);
  rise(ctx, [['sin ver ', false, C.cream], ['esto', true, C.gold]], 90, CX, 740, v, 1.6, [2.4, 2.65]);
  // 3 2 1
  [[2.66, '3'], [3.06, '2'], [3.68, '1']].forEach(([v0, n], i, a) => { const nx = a[i + 1] ? a[i + 1][0] : 3.98; if (v < v0 - 0.05 || v > nx) return;
    const k = sp(v, v0 - 0.05, SP.bouncy); ctx.save(); ctx.translate(CX, 600); ctx.scale(k, k); ctx.globalAlpha = 1 - pr(v, nx - 0.08, nx);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, -90, 230, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr(v, v0, nx)); ctx.stroke();
    glyph(ctx, n, 0, 30, dfont(380), C.cream); ctx.restore(); });
  // ¡Hoy empieza!
  rise(ctx, [['¡Hoy ', false, C.cream], ['empieza!', true, C.gold]], 150, CX, 470, v, 3.98, [6.5, 6.8]);
  pill(ctx, 'BLACK FRIDAY · 27–30 NOV', CX, 540, v, 4.88, [6.5, 6.8]);
  drop(ctx, [['-20', false, C.gold], [' %', true, C.gold]], 320, CX, 560, v, 6.84, [8.0, 8.3]);
  rise(ctx, [['en ', false, C.cream], ['decants', true, C.cream]], 110, CX, 700, v, 7.42, [8.0, 8.3]);
  const P = [[IMG.yara, 'Yara Elixir', 290, 420, -0.07, 8.22, [-500, 0]], [IMG.eclaire, 'Éclaire', 700, 420, 0.06, 9.52, [500, 0]], [IMG.mayar, 'Mayar', 290, 800, 0.05, 10.0, [-500, 0]], [IMG.odyssey, 'Odyssey Mega', 700, 800, -0.06, 10.54, [500, 0]]];
  const hop = 30 * Math.max(0, wobble((v - 11.46) / 0.5, 2, 4));
  P.forEach(([img, n, x, y, r, v0, from]) => card(ctx, img, x, y - (v > 11.46 ? hop : 0), 280, r, v, v0, [12.0, 12.35], n, ['5,49 €', '4,39 €'], from));
  card(ctx, IMG.decantAfeef, CX, 520, 440, -0.04, v, 12.3, [14.5, 14.8], null, null, [0, 400]);
  pill(ctx, '+ DECANT DE REGALO CON TU FRASCO', CX, 820, v, 13.4, [14.5, 14.8], { fs: 30 });
  rise(ctx, [['Hasta el ', false, C.cream], ['lunes 30', true, C.gold]], 120, CX, 560, v, 14.7, [15.7, 15.9]);
  flash(ctx, v, 3.98);
  ctx.restore();
  if (v > 15.8) return endCard(ctx, v, t, 15.86, 'BLACK FRIDAY · DEL 27 AL 30 DE NOVIEMBRE');
  const big = v < 2.6;
  const S = { armL: [0.4 + gest(t), 0.6], armR: [0.5 + gest(t + 1), 0.7] };
  if (v < 2.5) { S.armL = [2.4, 0.0]; S.brow = 0.8; S.lookX = 0; }
  if (v > 3.9 && v < 6.8) { S.happy = 1; S.armL = [2.4, 0.3]; S.armR = [2.0, 0.4]; }
  if (v > 11.4 && v < 12.2) { S.happy = 1; S.armL = [2.4, 0.3]; }
  const s = big ? 0.85 : 0.5, x = big ? CX : 880, f = 1480;
  const tr = E.inOutCubic(pr(v, 2.4, 2.9));
  return meigo(ctx, t, lerp(CX, 880, tr), f - (v > 3.98 && v < 5 ? 60 * Math.sin(pr(v, 3.98, 4.6) * Math.PI) : 0), lerp(0.85, 0.5, tr), S);
}

// ---------------------------------------------------------------- SÁBADO 2: test de perfume
function door(ctx, x, y, w, h, label, col, v, v0, open) {
  const k = sp(v, v0, SP.bouncy); if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y + h); ctx.scale(k, k); ctx.translate(-x, -(y + h));
  ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + w / 2); ctx.arc(x, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y + h); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 8; ctx.stroke();
  text(ctx, label, x, y + h * 0.62, ufont(34), C.cream, 'center', 5);
  ctx.beginPath(); ctx.arc(x + w * 0.3, y + h * 0.75, 9, 0, 7); ctx.fillStyle = C.gold; ctx.fill();
  ctx.restore();
}
function chip(ctx, label, x, y, v, v0, out) { pill(ctx, label, x, y, v, v0, out, { fs: 30, bg: C.cream, fg: C.coal }); }
function sab2(ctx, v, t, IMG) {
  ctx.save(); ctx.translate(0, 90);
  const dOut = v > 4.9;
  if (!dOut) {
    door(ctx, 210, 380, 230, 420, 'DULCE', '#8E3B5A', v, -0.4);
    door(ctx, 540, 380, 230, 420, 'FRESCO', '#C17A1E', v, 0.6);
    door(ctx, 870, 380, 230, 420, 'INTENSO', '#2A1E40', v, 1.5);
    caps(ctx, '¿DULCE, FRESCO O INTENSO?', CX, 300, 38, C.gold, v, -0.45, [4.6, 4.9]);
    // pause button with a filling ring
    const pk = sp(v, 2.2, SP.bouncy) * (1 - pr(v, 3.5, 3.7));
    if (pk > 0.01) { ctx.save(); ctx.translate(CX, 590); ctx.scale(pk, pk); ctx.beginPath(); ctx.arc(0, 0, 150, 0, 7); ctx.fillStyle = 'rgba(12,9,7,0.85)'; ctx.fill();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, 0, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr(v, 2.3, 3.5)); ctx.stroke();
      ctx.fillStyle = C.cream; rrect(ctx, -50, -60, 34, 120, 8); ctx.fill(); rrect(ctx, 16, -60, 34, 120, 8); ctx.fill(); ctx.restore(); }
    caps(ctx, '¡PAUSA Y ELIGE!', CX, 900, 52, C.cream, v, 2.3, [3.5, 3.7]);
    rise(ctx, [['¿Ya?', true, C.gold]], 160, CX, 960, v, 3.64, [4.6, 4.9]);
  }
  const blocks = [
    [4.98, 10.2, IMG.yara, 'DULCE', 'Yara Elixir', ['5,49 €', '4,39 €'], [['FRESA', 7.16], ['VAINILLA', 7.84], ['CARAMELO', 8.72]], '¡Una delicia!', 9.18],
    [10.28, 15.95, IMG.decantOdyssey, 'FRESCO', 'Odyssey Mega', ['5,49 €', '4,39 €'], [['NARANJA', 12.32], ['JENGIBRE', 13.0], ['MENTA', 13.9]], 'Para el día a día', 14.22],
    [16.04, 21.0, IMG.decantFahad, 'INTENSO', 'Fahad', ['6,99 €', '5,59 €'], [['PIMIENTA NEGRA', 18.0], ['INCIENSO', 18.84], ['PACHULÍ', 19.72]], 'Pura elegancia', 20.2],
  ];
  blocks.forEach(([a, b, img, tag, name, price, notes, quip, qv]) => {
    if (v < a - 0.1 || v > b + 0.4) return;
    const out = [b - 0.15, b + 0.25];
    pill(ctx, 'SI ERES ' + tag, CX, 250, v, a, out, { fs: 30 });
    card(ctx, img, 400, 600, 470, -0.04, v, a + 0.3, out, name, price, [0, 500]);
    caps(ctx, 'DECANT 5 ML · PRECIO CON EL -20 %', 400, 960, 28, C.gold, v, a + 0.8, out);
    notes.forEach(([n, nv], i) => chip(ctx, n, 840, 430 + i * 120, v, nv, out));
    if (qv) rise(ctx, [[quip, true, C.gold]], 76, CX, 1010, v, qv, out);
  });
  if (v > 20.9 && v < 23.6) {
    const out = [23.1, 23.4];
    rise(ctx, [['¿Cuál te ', false, C.cream], ['ha salido?', true, C.gold]], 110, CX, 420, v, 21.1, out);
    // a comment box with the three answers
    const k = sp(v, 22.1, SP.bouncy) * (1 - pr(v, out[0], out[1]));
    if (k > 0.01) { ctx.save(); ctx.translate(CX, 640); ctx.scale(k, k); rrect(ctx, -420, -110, 840, 220, 40); ctx.fillStyle = C.paper; ctx.fill();
      text(ctx, 'Comenta:', -370, -40, ufont(34), C.mute, 'left'); const n = Math.floor(pr(v, 22.4, 23.0) * 14); text(ctx, 'Yo soy… INTENSO'.slice(0, n), -370, 40, ufont(52), C.coal, 'left');
      ctx.restore(); }
    ['DULCE', 'FRESCO', 'INTENSO'].forEach((n, i) => chip(ctx, n, 230 + i * 310, 820, v, 22.3 + i * 0.12, out));
  }
  if (v > 23.2 && v < 27.1) {
    drop(ctx, [['-20', false, C.gold], [' %', true, C.gold]], 300, CX, 560, v, 25.18, [26.8, 27.1]);
    rise(ctx, [['Pruébalo en ', false, C.cream], ['decant', true, C.gold]], 96, CX, 330, v, 23.4, [26.8, 27.1]);
    caps(ctx, 'EN DECANTS · ESTE FINDE', CX, 700, 40, C.cream, v, 26.0, [26.8, 27.1]);
  }
  ctx.restore();
  if (v > 26.9) return endCard(ctx, v, t, 27.0, 'COMENTA: ¿DULCE, FRESCO O INTENSO?');
  const S = { armL: [0.4 + gest(t), 0.6], armR: [0.5 + gest(t + 1), 0.7] };
  if (v < 2.2) { S.armL = [0.9, 2.3]; S.lookY = -0.6; S.browUp = 0.6; }
  if (v > 3.6 && v < 4.9) { S.happy = 1; S.armL = [1.2, 1.8]; S.armR = [1.2, 1.8]; }
  if (blocks.some(([a, , , , , , , , qv]) => v > qv - 0.1 && v < qv + 0.9)) { S.happy = 1; S.armL = [2.3, 0.3]; }
  if (v > 21 && v < 23.3) { S.armL = [1.4, 0.1]; S.handL = 'point'; S.lookX = -0.6; S.wink = v > 22 ? 1 : 0; }
  return meigo(ctx, t, 900, 1480, 0.5, S);
}

// ---------------------------------------------------------------- DOMINGO 2: tic tac
function clockFace(ctx, x, y, r, v, t) {
  const sw = 0.14 * Math.sin(t * 9) * (1 - pr(v, 1.0, 1.4)); const k = sp(v, -0.5, SP.bouncy) * (1 - E.inBack(pr(v, 1.0, 1.35)));
  if (k <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.scale(k, k);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 22; ctx.strokeStyle = C.gold; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillStyle = C.coal; ctx.beginPath(); ctx.arc(Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.82, i % 3 ? 6 : 12, 0, 7); ctx.fill(); }
  const tick = Math.floor(v / 0.27); ctx.strokeStyle = C.coal; ctx.lineCap = 'round';
  ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(-0.5) * r * 0.45, -Math.cos(-0.5) * r * 0.45); ctx.stroke();
  ctx.lineWidth = 10; const a2 = tick * (Math.PI / 15); ctx.strokeStyle = '#B23A2A'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a2) * r * 0.7, -Math.cos(a2) * r * 0.7); ctx.stroke();
  ctx.restore();
}
function dom2(ctx, v, t, IMG) {
  ctx.save(); ctx.translate(0, 110); [0, 0.26, 0.54, 0.64].forEach((a) => shake(ctx, v, a, 10));
  clockFace(ctx, CX, 560, 250, v, t);
  rise(ctx, [['¡Se acaba', false, C.cream]], 140, CX, 440, v, 1.08, [3.9, 4.2]);
  rise(ctx, [['mañana!', true, C.gold]], 190, CX, 640, v, 1.9, [3.9, 4.2]);
  pill(ctx, 'LUNES 30 DE NOVIEMBRE', CX, 720, v, 3.1, [3.9, 4.2]);
  drop(ctx, [['-20', false, C.gold], [' %', true, C.gold]], 320, CX, 560, v, 4.2, [7.5, 7.8]);
  rise(ctx, [['en ', false, C.cream], ['decants', true, C.cream]], 110, CX, 700, v, 4.84, [7.5, 7.8]);
  pill(ctx, '+ DECANT DE REGALO CON TU FRASCO', CX, 790, v, 5.6, [7.5, 7.8], { fs: 30 });
  // three taps on a mini phone
  if (v > 7.6 && v < 15.0) {
    const out = [14.5, 14.85];
    caps(ctx, 'COMPRAR ES FACILÍSIMO', CX, 290, 40, C.gold, v, 7.86, out);
    const k = sp(v, 8.0) * (1 - E.inBack(pr(v, out[0], out[1])));
    const s = 0.34, w = 1170 * s, h = 1700 * s, x = 110, y = 340;
    if (k > 0.01) {
      ctx.save(); ctx.translate(-(1 - k) * 700, 0);
      rrect(ctx, x - 16, y - 16, w + 32, h + 32, 50); ctx.fillStyle = '#16110D'; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); rrect(ctx, x, y, w, h, 36); ctx.clip();
      const img = v < 11.5 ? IMG.c3 : IMG.c6, sy = v < 11.5 ? 1800 : 0;
      ctx.drawImage(img, 0, sy, 1170, 1700, x, y, w, h); ctx.restore();
      const m = (sx, sy2, scr) => [x + sx * s, y + (sy2 - scr) * s];
      [[9.3, 306, 2514, 1800], [10.5, 780, 2736, 1800], [11.7, 585, 1283, 0]].forEach(([v0, a, b, scr]) => { const [px, py] = m(a, b, scr); ripple(ctx, px, py, v, v0); });
      ctx.restore();
    }
    [['ELIGE TU DECANT', 9.22], ['AL CARRITO', 10.38], ['-20 % AUTOMÁTICO', 11.58]].forEach(([l, v0], i) => {
      const kk = sp(v, v0, SP.bouncy) * (1 - pr(v, out[0], out[1])); if (kk <= 0.01) return;
      const yy = 420 + i * 170; ctx.save(); ctx.translate(780, yy); ctx.scale(kk, kk);
      ctx.beginPath(); ctx.arc(-170, 0, 46, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); text(ctx, String(i + 1), -170, 18, dfont(60), C.night, 'center');
      text(ctx, l, -105, 12, ufont(30), C.cream, 'left', 2); ctx.restore();
      check(ctx, 780 - 170 + 76, yy - 40, 40, pr(v, 13.4 + i * 0.2, 13.7 + i * 0.2), C.gold);
    });
    rise(ctx, [['¡Tres toques ', false, C.cream], ['y listo!', true, C.gold]], 84, 760, 1000, v, 13.4, out);
  }
  ctx.restore();
  if (v > 14.8) return endCard(ctx, v, t, 14.86, 'ÚLTIMO DÍA: LUNES 30 DE NOVIEMBRE');
  const S = { armL: [0.4 + gest(t), 0.6], armR: [0.5 + gest(t + 1), 0.7], sweat: v < 4 ? 1 : 0, brow: v < 4 ? -0.7 : 0, browUp: v < 4 ? 0.8 : 0 };
  let hop = 0;
  if (v < 1.1) { S.armL = [2.5, 0.2]; S.armR = [2.4, 0.2]; S.step = (t * 1.8) % 1; S.mouth = { open: 0.8, round: 1 }; }
  if (v > 1.0 && v < 4) { hop = 50 * Math.abs(Math.sin(v * 6)); S.armL = [2.3, 0.2]; }
  if (v > 4.1 && v < 7.6) { S.armL = [2.0, 0.2]; S.handL = 'point'; S.lookX = -0.5; S.lookY = -0.8; }
  return meigo(ctx, t, 900, 1480 - hop, 0.5, S);
}

// ---------------------------------------------------------------- FRASCOS: full bottles + gift decant
function frascos(ctx, v, t, IMG) {
  ctx.save(); ctx.translate(0, 90); shake(ctx, v, 1.58, 14); shake(ctx, v, 19.6, 16);
  // hook: a little decant that grows into a full bottle
  if (v < 4.0) {
    const g = E.inOutCubic(pr(v, 1.5, 2.4));
    const w = lerp(220, 520, g);
    card(ctx, g < 0.5 ? IMG.decantYara : IMG.cedrus, CX, 560, w, -0.03, v, -0.45, [3.6, 3.95]);
    rise(ctx, [['¿Ya sabes cuál es ', false, C.cream]], 72, CX, 230, v, -0.4, [1.5, 1.7]);
    rise(ctx, [['tu perfume?', true, C.gold]], 110, CX, 330, v, 0.1, [1.5, 1.7]);
    rise(ctx, [['¡Llévatelo ', false, C.cream], ['en grande!', true, C.gold]], 96, CX, 260, v, 1.6, [3.6, 3.95]);
    pill(ctx, 'FRASCOS COMPLETOS · 100 ML', CX, 920, v, 2.83, [3.6, 3.95]);
  }
  // gift: bottle + decant
  if (v > 3.8 && v < 7.1) {
    const out = [6.6, 6.95];
    card(ctx, IMG.cedrus, 360, 560, 400, -0.06, v, 3.9, out, null, null, [-400, 0]);
    rise(ctx, [['+', true, C.gold]], 160, 640, 620, v, 4.4, out);
    card(ctx, IMG.decantYara, 830, 560, 240, 0.08, v, 4.8, out, null, null, [400, 0]);
    pill(ctx, '+ DECANT DE REGALO PARA PROBAR OTRO', CX, 860, v, 5.0, out, { fs: 28 });
    caps(ctx, 'CON CADA FRASCO · BLACK FRIDAY 27–30 NOV', CX, 260, 30, C.gold, v, 4.0, out);
  }
  const blocks = [
    [6.9, 11.1, IMG.cedrus, 'Cedrus Blanc', '32,99 €', [['CEDRO', 7.72], ['BERGAMOTA', 8.24], ['FLOR DE NARANJO', 9.03]], 'Fresco y elegante', 9.9],
    [11.19, 15.7, IMG.freeze, 'Freeze in Flames', '37,99 €', [['MARACUYÁ', 12.68], ['FRAMBUESA', 13.3], ['HIERBABUENA', 14.1]], '¡Fuego y hielo!', 14.8],
    [15.74, 19.5, IMG.hawas, 'Hawas Gold Digger', '41,99 €', [['PERA', 16.9], ['CANELA', 17.38], ['VAINILLA', 18.05]], '¡Puro oro!', 18.76],
  ];
  blocks.forEach(([a, b, img, name, price, notes, quip, qv]) => {
    if (v < a - 0.1 || v > b + 0.4) return;
    const out = [b - 0.15, b + 0.25];
    pill(ctx, 'ÚLTIMAS UNIDADES', CX, 240, v, a, out, { fs: 28, bg: '#B23A2A', fg: '#fff' });
    card(ctx, img, 400, 590, 470, -0.04, v, a + 0.2, out, name, price, [0, 500]);
    notes.forEach(([n, nv], i) => chip(ctx, n, 840, 430 + i * 120, v, nv, out));
    rise(ctx, [[quip, true, C.gold]], 76, CX, 1010, v, qv, out);
  });
  if (v > 19.4 && v < 21.8) {
    const out = [21.4, 21.7];
    [[IMG.cedrus, 230, -0.08, 19.55], [IMG.freeze, 540, 0.04, 19.7], [IMG.hawas, 850, 0.08, 19.85]].forEach(([img, x, r, v0]) => card(ctx, img, x, 560, 280, r, v, v0, out));
    const k = sp(v, 19.84, SP.bouncy) * (1 - pr(v, out[0], out[1]));
    if (k > 0.01) { ctx.save(); ctx.translate(CX, 830); ctx.rotate(-0.06); ctx.scale(lerp(2, 1, k), lerp(2, 1, k)); ctx.globalAlpha = clamp(k * 2);
      rrect(ctx, -330, -70, 660, 140, 24); ctx.fillStyle = '#B23A2A'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; rrect(ctx, -318, -58, 636, 116, 18); ctx.stroke();
      text(ctx, '¡QUEDAN MUY POCOS!', 0, 18, ufont(52), '#fff', 'center', 2); ctx.restore(); }
  }
  ctx.restore();
  if (v > 21.5) return endCard(ctx, v, t, 21.57, 'FRASCOS + DECANT DE REGALO · 27–30 NOV');
  const S = { armL: [0.4 + gest(t), 0.6], armR: [0.5 + gest(t + 1), 0.7] };
  if (v < 1.5) { S.armL = [0.9, 2.3]; S.lookY = -0.6; S.browUp = 0.6; S.lookX = -0.5; }
  if (v > 1.5 && v < 3.0) { S.happy = 1; S.armL = [2.4, 0.3]; S.armR = [2.0, 0.4]; }
  if (blocks.some(([, , , , , , , qv]) => v > qv - 0.1 && v < qv + 0.8)) { S.happy = 1; S.armL = [2.3, 0.3]; }
  if (v > 19.5 && v < 21.5) { S.sweat = 1; S.brow = -0.6; S.browUp = 0.8; S.armL = [2.4, 0.2]; S.armR = [2.3, 0.2]; }
  return meigo(ctx, t, 900, 1480, 0.5, S);
}

// ---------------------------------------------------------------- hits (sound), in beats
const HITS = {
  tutorial: [[0, 'hook', 'boing', { pitch: 'C5', to: 'C6' }], [S2U(3.2), '6 €', 'coins'], [S2U(5.4), 'phone in', 'whoosh', { len: 0.5 }],
    ...[9.4, 12.6, 16.74, 19.3, 20.9, 30.9].flatMap((s) => [[S2U(s) - 0.6, 'wand', 'whoosh', { len: 0.3, from: 3000, to: 1400, gain: 0.15 }], [S2U(s), 'tap', 'pop', { pitch: 'E6' }]]),
    [S2U(10.0), 'page', 'click'], [S2U(13.1), 'page', 'click'], [S2U(21.2), 'page', 'click'], [S2U(19.4), 'añadido', 'bell', { pitch: 'A5' }], [S2U(21.7), '-20', 'impact', { gain: 0.45 }],
    [S2U(25.7), 'check', 'blip', { pitch: 'E6' }], [S2U(28.3), 'regalo', 'coins'], [S2U(31.5), 'envío', 'thud'], [S2U(34.4), 'end', 'impact', { gain: 0.5 }], [S2U(34.7), 'web', 'bell', { pitch: 'E6' }]],
  vie2: [[0, 'alto', 'impact'], [S2U(2.66), '3', 'thud'], [S2U(3.06), '2', 'thud'], [S2U(3.68), '1', 'thud'], [S2U(3.98), 'hoy', 'impact'], [S2U(4.88), 'pill', 'click'], [S2U(6.84), '-20', 'impact', { gain: 0.5 }],
    [S2U(8.22), 'yara', 'whoosh', { len: 0.3 }], [S2U(9.52), 'eclaire', 'whoosh', { len: 0.3 }], [S2U(10.0), 'mayar', 'whoosh', { len: 0.3 }], [S2U(10.54), 'odyssey', 'whoosh', { len: 0.3 }], [S2U(11.46), 'todos', 'boing', { pitch: 'E5', to: 'E6' }],
    [S2U(12.3), 'regalo', 'thud'], [S2U(13.4), 'regalo pill', 'coins'], [S2U(14.7), 'lunes', 'click'], [S2U(15.86), 'end', 'impact', { gain: 0.5 }]],
  sab2: [[S2U(0.5), 'dulce', 'pop', { pitch: 'C6' }], [S2U(0.95), 'fresco', 'pop', { pitch: 'E6' }], [S2U(1.75), 'intenso', 'pop', { pitch: 'G5' }], [S2U(2.2), 'pausa', 'thud'], [S2U(3.64), 'ya', 'blip', { pitch: 'E6' }],
    ...[4.98, 10.28, 16.04].flatMap((s) => [[S2U(s), 'block', 'whoosh', { len: 0.4 }], [S2U(s + 0.3), 'card', 'thud']]),
    ...[7.16, 7.84, 8.72, 12.32, 13.0, 13.9, 18.0, 18.84, 19.72].map((s) => [S2U(s), 'note', 'tick']),
    [S2U(9.18), 'delicia', 'bell', { pitch: 'A5' }], [S2U(14.22), 'dia', 'bell', { pitch: 'B5' }], [S2U(20.2), 'elegancia', 'bell', { pitch: 'E5' }], [S2U(22.1), 'comment', 'pop', { pitch: 'A5' }], [S2U(22.4), 'typing', 'type', { len: 0.6 }],
    [S2U(25.18), '-20', 'impact', { gain: 0.45 }], [S2U(27.0), 'end', 'impact', { gain: 0.5 }]],
  frascos: [[0, 'hook', 'pop', { pitch: 'C6' }], [S2U(1.58), 'grande', 'impact', { gain: 0.45 }], [S2U(2.83), 'pill', 'click'], [S2U(3.9), 'bottle', 'whoosh', { len: 0.4 }], [S2U(4.8), 'decant', 'whoosh', { len: 0.3 }], [S2U(5.0), 'regalo', 'coins'],
    ...[6.9, 11.19, 15.74].flatMap((s) => [[S2U(s), 'block', 'whoosh', { len: 0.4 }], [S2U(s + 0.2), 'card', 'thud']]),
    ...[7.72, 8.24, 9.03, 12.68, 13.3, 14.1, 16.9, 17.38, 18.05].map((s) => [S2U(s), 'note', 'tick']),
    [S2U(9.9), 'quip', 'bell', { pitch: 'A5' }], [S2U(14.8), 'quip', 'bell', { pitch: 'B5' }], [S2U(18.76), 'oro', 'coins'], [S2U(19.84), 'pocos', 'impact', { gain: 0.5 }], [S2U(21.57), 'end', 'impact', { gain: 0.5 }]],
  dom2: [[0, 'tic', 'tick'], [S2U(0.26), 'tac', 'tick'], [S2U(0.54), 'tic', 'tick'], [S2U(0.64), 'tac', 'tick'], [S2U(1.08), 'acaba', 'impact', { gain: 0.45 }], [S2U(3.1), 'lunes', 'click'],
    [S2U(4.2), '-20', 'impact', { gain: 0.5 }], [S2U(5.6), 'regalo', 'coins'], [S2U(8.0), 'phone', 'whoosh', { len: 0.4 }], [S2U(9.3), 'tap1', 'pop', { pitch: 'C6' }], [S2U(10.5), 'tap2', 'pop', { pitch: 'E6' }], [S2U(11.7), 'tap3', 'pop', { pitch: 'G6' }],
    [S2U(13.4), 'check', 'bell', { pitch: 'E6' }], [S2U(14.86), 'end', 'impact', { gain: 0.5 }]],
}[VID];

// ---------------------------------------------------------------- film
let IMGS = null;
M.film({
  fonts: [dfont(100), dfont(100, true), ufont(40), ufont(40, 500)],
  images: {
    c1: 'caps/01-inicio.png', c2: 'caps/02-decants-full.png', c3: 'caps/03-producto-full.png', c6: 'caps/06-carrito.png',
    yara: 'assets/products/yara-elixir.jpg', eclaire: 'assets/products/eclaire.jpg', mayar: 'assets/products/mayar.jpg', odyssey: 'assets/products/odyssey-mega.jpg',
    decantAfeef: 'assets/products/decant-afeef.jpg', decantOdyssey: 'assets/products/decant-odyssey.jpg', decantFahad: 'assets/products/decant-fahad.jpg', botica: 'assets/fondos/botica.png', decantYara: 'assets/products/decant-yara.jpg', cedrus: 'assets/products/frasco-rayhaan-cedrus-blanc.jpg', freeze: 'assets/products/frasco-riiffs-freeze-in-flames.jpg', hawas: 'assets/products/frasco-rasasi-hawas-gold-digger.jpg', logo: 'assets/logo/logo.png',
  },
  hits: HITS,
  async init(ctx, IMG) {
    IMGS = IMG;
    try { const r = await fetch('vo_env.json'); if (r.ok) VOENV = await r.json(); } catch {}
    const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256; const gx = gc.getContext('2d'); const id = gx.createImageData(256, 256); const rnd = mulberry32(11);
    for (let i = 0; i < id.data.length; i += 4) { const q = rnd() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = q; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); GRAIN = gc;
  },
  draw(ctx, u, t, IMG) {
    const v = t - LEAD;
    backdrop(ctx, t, v);
    ({ tutorial, vie2, sab2, dom2, frascos })[VID](ctx, v, t, IMG);
  },
  post(ctx, u, t) {
    const f = Math.floor(t * 24); ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(hash01(f, 3) * 256), oy = Math.floor(hash01(f, 7) * 256);
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(GRAIN, x, y);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },
});
