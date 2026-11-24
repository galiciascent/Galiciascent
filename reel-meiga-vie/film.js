// La Meiga de Galicia Scent: three 15 s Black Friday reels from one file.
// reel-meiga-vie / -sab / -dom pick the day from the folder name. Pure function of time (lib/motion.js).
// 112 bpm, 1 beat = 0.536 s, 28 beats. Layout 9x16: text zone y 260..860, Meiga bottom right, bubbles left.
import * as M from './lib/motion.js';
import { drawMeiga } from './meiga.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, wobble, font, layout, glyph, text, fill, cover, rrect, hash01, mulberry32, bump } = M;
const DAY = (location.pathname.match(/reel-meiga-(vie|sab|dom)/) || [, 'vie'])[1];

const C = { night: '#0C0907', coal: '#1A1410', cream: '#F0E6D6', paper: '#F4F0EA', gold: '#E3AA64', brown: '#8A5A22', mute: '#7A7068' };
const DISPLAY = 'Display', UI = 'UI';
const dfont = (size, italic = false) => `${italic ? 'italic ' : ''}600 ${Math.round(size)}px ${DISPLAY}`;
const ufont = (size, w = 700) => font(size, w, UI);
const CX = W / 2;
const FEET = 1480, MS = 0.78;               // Meiga's feet line and scale

// ---------------------------------------------------------------- helpers
function richLayout(ctx, segs, size) {
  let x = 0; const out = [];
  for (const [str, it, col] of segs) {
    const f = dfont(size, it); const L = layout(ctx, str, f, 0);
    for (const g of L.glyphs) out.push({ ch: g.ch, cx: x + g.cx, f, col });
    x += L.width;
  }
  return { glyphs: out, width: x };
}
// a line of display type rising glyph by glyph; out = [u0, u1] drops it away
function riseLine(ctx, segs, size, x, base, u, u0, out = null, align = 'center') {
  const L = richLayout(ctx, segs, size);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(0, base - size * 1.25, W, size * 1.65); ctx.clip();
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * 0.025, SPRING.gentle);
    if (k <= 0) return;
    let y = base + (1 - k) * size * 1.1;
    if (out) y += E.inCubic(prog(u, out[0] + j * 0.01, out[1] + j * 0.01)) * size * 1.5;
    glyph(ctx, g.ch, x0 + g.cx, y, g.f, g.col);
  });
  ctx.restore();
}
function caps(ctx, str, x, y, size, color, u, u0, out = null, track = 0.26) {
  let k = E.outCubic(prog(u, u0, u0 + 0.5));
  if (out) k *= 1 - prog(u, out[0], out[1]);
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k;
  text(ctx, str, x, y + (1 - k) * 16, ufont(size), color, 'center', size * track);
  ctx.restore();
}
function pill(ctx, label, y, u, u0, out = null) {
  let k = springU(u, u0, SPRING.snappy);
  if (out) k *= 1 - E.inBack(prog(u, out[0], out[1]));
  if (k <= 0.01) return;
  const fs = 36;
  ctx.font = ufont(fs); ctx.letterSpacing = `${fs * 0.2}px`;
  const tw = ctx.measureText(label).width; ctx.letterSpacing = '0px';
  const pw = tw + 76, ph = 82, px = CX - pw / 2;
  ctx.save(); ctx.translate(CX, y + ph / 2); ctx.scale(k, k); ctx.translate(-CX, -(y + ph / 2));
  rrect(ctx, px, y, pw, ph, ph / 2); ctx.fillStyle = C.gold; ctx.fill();
  text(ctx, label, CX + fs * 0.1, y + ph / 2 + fs * 0.36, ufont(fs), C.night, 'center', fs * 0.2);
  ctx.restore();
}
// a big number that drops with weight and settles
function bigDrop(ctx, segs, size, y, u, u0, out = null) {
  const k = springU(u, u0 - 0.3, SPRING.bouncy);
  if (k <= 0 || (out && u >= out[1])) return;
  const q = 0.06 * wobble(u - u0, 2.4, 5);
  let a = clamp(k * 2);
  let dy = -(1 - k) * 460;
  if (out) { const o = E.inBack(prog(u, out[0], out[1]), 1.3); dy += o * 900; a *= 1 - o * 0.3; }
  ctx.save(); ctx.globalAlpha = a; ctx.translate(CX, y); ctx.scale(1 + q, 1 - q); ctx.translate(-CX, -y);
  const L = richLayout(ctx, segs, size);
  L.glyphs.forEach((g) => glyph(ctx, g.ch, CX - L.width / 2 + g.cx, y + dy, g.f, g.col));
  ctx.restore();
}
// a real product photo on a card
function card(ctx, img, x, y, w, rot, u, u0, out = null, label = null) {
  let k = springU(u, u0, SPRING.bouncy);
  if (out) k *= 1 - E.inBack(prog(u, out[0], out[1]));
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * k); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  rrect(ctx, -w / 2 - 8, -w / 2 - 8, w + 16, w + 16 + (label ? 64 : 0), 18); ctx.fillStyle = C.paper; ctx.fill();
  ctx.shadowColor = 'transparent';
  cover(ctx, img, -w / 2, -w / 2, w, w, { radius: 12 });
  if (label) text(ctx, label, 0, w / 2 + 48, dfont(44), C.coal, 'center');
  ctx.restore();
}

// ---------------------------------------------------------------- speech: bubbles + voice
// [u0, u1, lines]; syllables are voiced by 'tok' hits and drive the mouth.
const LINES = {
  vie: [[0.4, 3.7, ['¡Eh, tú!']], [14, 19.6, ['¡Y con tu frasco,', 'un decant de regalo!']]],
  sab: [[0.3, 3.9, ['¿No sabes qué', 'perfume elegir?']], [12, 15.8, ['¡Pruébalos', 'antes!']]],
  dom: [[0.8, 3.9, ['¡Corre, corre!']], [16, 19.4, ['¿A qué', 'esperas?']], [19.8, 23.4, ['¡Entra en', 'galiciascent.com!']]],
}[DAY];
const sylCount = (s) => Math.max(1, (s.toLowerCase().match(/[aeiouáéíóú]+/g) || []).length);
const SYL = [];
LINES.forEach(([u0, u1, lines]) => {
  const n = lines.reduce((a, l) => a + sylCount(l), 0);
  const span = Math.min(n * 0.34, (u1 - u0) - 0.9);
  for (let i = 0; i < n; i++) SYL.push(u0 + 0.35 + (span * i) / n);
});
const PITCH = ['E5', 'G5', 'A5', 'B5', 'D6', 'E6'];
const VOICE = SYL.map((u, i) => [u, 'voz', 'tok', { pitch: PITCH[Math.floor(hash01(i, 5) * PITCH.length)], gain: 0.22 }]);
const talk = (u) => SYL.reduce((m, s) => Math.max(m, bump(u, s + 0.09, 0.16)), 0);

function bubble(ctx, [u0, u1, lines], u, mouth) {
  const k = springU(u, u0, SPRING.bouncy) * (1 - E.inBack(prog(u, u1 - 0.3, u1)));
  if (k <= 0.01) return;
  const fs = 54, lh = 64;
  ctx.font = ufont(fs, 700);
  const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const bw = tw + 80, bh = lines.length * lh + 56;
  const bx = 80, by = 1010 - bh;
  const ax = bx + bw * 0.55, ay = by + bh;
  ctx.save(); ctx.translate(ax, ay); ctx.scale(k, k); ctx.translate(-ax, -ay);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = C.paper;
  rrect(ctx, bx, by, bw, bh, 38); ctx.fill();
  // tail toward the mouth
  ctx.beginPath(); ctx.moveTo(ax - 40, ay - 4); ctx.quadraticCurveTo(ax + 40, ay + 60, mouth[0] - 60, mouth[1] - 40); ctx.quadraticCurveTo(ax + 50, ay + 10, ax + 30, ay - 4); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  lines.forEach((l, i) => text(ctx, l, bx + 40, by + 40 + lh * (i + 0.75), ufont(fs, 700), C.coal, 'left'));
  ctx.restore();
}

// ---------------------------------------------------------------- magic: perfume mist from the atomizer
function mist(ctx, from, to, u, u0, len = 2) {
  const p = prog(u, u0, u0 + len);
  if (p <= 0 || p >= 1) return;
  const rnd = mulberry32(Math.floor(u0 * 100));
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 26; i++) {
    const d = rnd() * 0.5, sp = rnd();
    const q = clamp((p - d * 0.6) / (1 - d * 0.6));
    if (q <= 0) continue;
    const e = E.outCubic(q);
    const x = lerp(from[0], to[0] + (sp - 0.5) * 700, e), y = lerp(from[1], to[1] + (rnd() - 0.5) * 300, e) - Math.sin(q * Math.PI) * 120;
    const r = lerp(20, 140 + rnd() * 120, e), a = 0.5 * Math.sin(q * Math.PI);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(251,227,168,${a})`); g.addColorStop(1, 'rgba(227,170,100,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (i % 3 === 0) {           // glints
      const s = 10 * (1 - q) + 4;
      ctx.fillStyle = `rgba(255,240,200,${0.9 * (1 - q)})`;
      ctx.beginPath(); for (let j = 0; j < 8; j++) { const aa = (j / 8) * Math.PI * 2, rr = j % 2 ? s * 0.35 : s; ctx.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- background
let STARS = null;
function backdrop(ctx, u, t) {
  fill(ctx, C.night);
  const g = ctx.createRadialGradient(CX, 640, 60, CX, 760, 1100);
  g.addColorStop(0, 'rgba(227,170,100,0.20)'); g.addColorStop(1, 'rgba(227,170,100,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.cream;
  STARS.forEach(([x, y, r, ph]) => { ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + ph)); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
  ctx.globalAlpha = 1;
  // floor glow under Meiga
  const fg = ctx.createRadialGradient(760, FEET, 10, 760, FEET, 340);
  fg.addColorStop(0, 'rgba(227,170,100,0.25)'); fg.addColorStop(1, 'rgba(227,170,100,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, FEET - 300, W, 600);
}

// ---------------------------------------------------------------- Meiga's performance per day
const MX = 760;
function pose(u, t) {
  const S = { t, mouth: { open: 0.75 * talk(u), smile: 0.6 }, blink: bump(u, 2.6, 0.12) + bump(u, 9.3, 0.12) + bump(u, 17.2, 0.12) };
  let x = MX, hop = 0, squash = 0;
  const jump = (u0, h = 90) => { const p = prog(u, u0, u0 + 0.9); hop += Math.sin(p * Math.PI) * h; squash += 0.12 * wobble(u - u0 - 0.9, 2.5, 6) - 0.06 * bump(u, u0 + 0.45, 0.4); };
  const spray = (u0) => bump(u, u0 + 0.15, 0.3);
  if (DAY === 'vie') {
    const pop = springU(u, -0.2, SPRING.bouncy); hop -= (1 - pop) * 700;
    S.armL = [lerp(0.3, 1.4, prog(u, 0, 0.4)) * (1 - prog(u, 3.6, 4.2)) + 0.25, 0.1]; S.handL = u < 4 ? 'point' : 'open';
    S.lookX = u < 4 ? -0.6 : 0; S.brow = u < 4 ? 0.6 : 0;
    S.armR = [lerp(0.4, 2.0, prog(u, 3.6, 4.0)) * (1 - prog(u, 6, 6.6)) + 0.4, 0.4]; S.spray = spray(4);
    if (u > 5.6 && u < 9.5) { S.happy = 1; S.mouth = { open: 0.8, smile: 1 }; jump(6); jump(7.6, 60); S.armL = [2.4, 0.3]; }
    if (u >= 10 && u < 14) { S.armL = [2.1 - 0.3 * wobble(u - 10, 1.5, 3), 0.2]; S.handL = 'point'; S.lookX = -0.5; S.lookY = -0.8; S.wink = u > 12 ? 1 : 0; }
    if (u >= 14 && u < 20) { S.armL = [1.0, 0.8]; S.lookX = -0.6; }
    S.armR = u >= 19.6 && u < 22 ? [1.9, 0.4] : S.armR; S.spray = Math.max(S.spray || 0, spray(20));
    if (u >= 23.5) { S.happy = 1; S.armL = [2.5 + 0.25 * Math.sin(t * 9), 0.5]; S.mouth = { open: 0.5, smile: 1 }; S.blush = 0.7; }
  } else if (DAY === 'sab') {
    const pop = springU(u, -0.6, SPRING.gentle); hop -= (1 - pop) * 400;
    if (u < 4) { S.armL = [0.9, 2.3]; S.lookY = -0.7; S.lookX = -0.4; S.brow = -0.3; S.browUp = 0.6; S.hatTilt = -0.06; }
    S.armR = [lerp(0.4, 2.0, prog(u, 3.6, 4.0)) * (1 - prog(u, 5.5, 6.2)) + 0.4, 0.4]; S.spray = spray(4);
    if (u >= 5 && u < 12) { S.lookX = -0.7; S.lookY = -0.7; S.mouth = { open: 0.3, round: 1, smile: 0.2 }; S.armL = [0.6, 0.6]; }
    if (u >= 12 && u < 16) { S.wink = 1; S.armL = [1.3, 1.6]; S.blush = 0.6; }
    if (u >= 16 && u < 23.5) { S.happy = u > 17 ? 1 : 0; jump(16.2, 70); S.armL = [2.3, 0.3]; S.mouth = { open: 0.6, smile: 1 }; }
    if (u >= 23.5) { S.happy = 1; S.armL = [2.5 + 0.25 * Math.sin(t * 9), 0.5]; S.blush = 0.7; }
  } else {
    // runs in from the left, panicking
    const run = E.outCubic(prog(u, -0.6, 3.0));
    x = lerp(160, MX, run); S.step = run < 0.98 ? (u * 0.9) % 1 : null; S.lean = 0.14 * (1 - run);
    S.sweat = u < 10 ? 1 : 0; S.brow = -0.7; S.browUp = 0.8; S.armL = [1.0 + 0.4 * Math.sin(u * 5.6), 1.2]; S.armR = [0.9 - 0.4 * Math.sin(u * 5.6), 1.0];
    if (u >= 4 && u < 10) { jump(4.2, 80); jump(5.8, 80); S.armL = [2.5, 0.2]; S.armR = [2.4, 0.2]; S.mouth = { open: 0.9, round: 0.9, smile: -0.3 }; }
    if (u >= 10 && u < 16) { S.sweat = 0; S.brow = 0.6; S.browUp = 0; S.armL = [2.0, 0.2]; S.handL = 'point'; S.lookX = -0.5; S.lookY = -0.8; S.armR = [0.4, 0.6]; }
    if (u >= 16 && u < 19.8) { S.brow = 0.7; S.browUp = 0; S.armL = [0.5, 1.9]; S.armR = [0.5, 1.9]; S.step = u > 16.5 ? (u * 0.5) % 1 : null; S.lookX = -0.3; }
    if (u >= 19.8 && u < 23.5) { S.brow = 0.3; S.armL = [1.0, -0.2]; S.handL = 'point'; S.lookX = -0.6; S.lookY = 0.5; S.armR = [0.4, 0.6]; }
    if (u >= 23.5) { S.happy = 1; S.armL = [2.5 + 0.25 * Math.sin(t * 9), 0.5]; S.brow = 0; S.browUp = 0; S.blush = 0.7; S.armR = [0.4, 0.6]; }
  }
  S.hop = hop; S.squash = squash;
  return { S, x };
}
function meiga(ctx, u, t) {
  const { S, x } = pose(u, t);
  ctx.save(); ctx.translate(x, FEET); ctx.scale(MS, MS);
  const out = drawMeiga(ctx, S);
  ctx.restore();
  return out;
}

// ---------------------------------------------------------------- text zone per day (y 260..860)
function zoneVie(ctx, u, IMG) {
  pill(ctx, 'BLACK FRIDAY · 27–30 NOV', 300, u, 5, [9.4, 9.9]);
  riseLine(ctx, [['¡Hoy ', false, C.cream], ['empieza!', true, C.gold]], 150, CX, 560, u, 5.5, [9.4, 9.9]);
  caps(ctx, 'EN GALICIA SCENT', CX, 660, 40, C.cream, u, 6.5, [9.4, 9.8]);
  bigDrop(ctx, [['-20', false, C.gold], [' %', true, C.gold]], 340, 600, u, 10, [13.6, 14.1]);
  riseLine(ctx, [['en ', false, C.cream], ['decants', true, C.cream]], 120, CX, 760, u, 11.4, [13.6, 14.0]);
  pill(ctx, 'DECANT DE REGALO CON TU FRASCO', 262, u, 15.4, [19.6, 20.0]);
  card(ctx, IMG.decantAfeef, CX, 590, 430, -0.05, u, 14.2, [19.6, 20.1]);
}
function zoneSab(ctx, u, IMG) {
  const P = [[IMG.yara, 'Yara Elixir', 300, 400, -0.08], [IMG.eclaire, 'Éclaire', 690, 400, 0.07], [IMG.mayar, 'Mayar', 300, 700, 0.05], [IMG.odyssey, 'Odyssey Mega', 690, 690, -0.06]];
  P.forEach(([img, name, x, y, r], i) => card(ctx, img, x, y - 20, 270, r, u, 5 + i * 0.9, [11.4 + i * 0.08, 12]));
  caps(ctx, 'DECANTS DE', CX, 400, 44, C.gold, u, 12.4, [15.6, 16]);
  riseLine(ctx, [['5 y 10 ', false, C.cream], ['ml', true, C.gold]], 190, CX, 600, u, 12.6, [15.6, 16]);
  caps(ctx, 'PARA PROBAR ANTES DE COMPRAR', CX, 690, 34, C.cream, u, 13.4, [15.6, 16]);
  pill(ctx, 'BLACK FRIDAY · ESTE FINDE', 300, u, 16, [23, 23.5]);
  bigDrop(ctx, [['-20', false, C.gold], [' %', true, C.gold]], 300, 640, u, 16.6, [23, 23.5]);
  riseLine(ctx, [['en ', false, C.cream], ['decants', true, C.cream]], 110, CX, 780, u, 17.6, [23, 23.4]);
  caps(ctx, 'IDEALES PARA REGALAR EN NAVIDAD', CX, 870, 34, C.gold, u, 19, [23, 23.4]);
}
function zoneDom(ctx, u, IMG) {
  riseLine(ctx, [['¡El Black Friday', false, C.cream]], 110, CX, 400, u, 4, [9.4, 9.9]);
  riseLine(ctx, [['acaba ', false, C.cream], ['mañana!', true, C.gold]], 150, CX, 580, u, 4.8, [9.4, 9.9]);
  caps(ctx, 'LUNES 30 DE NOVIEMBRE', CX, 680, 40, C.gold, u, 6, [9.4, 9.8]);
  bigDrop(ctx, [['-20', false, C.gold], [' %', true, C.gold]], 320, 560, u, 10, [15.6, 16]);
  riseLine(ctx, [['en ', false, C.cream], ['decants', true, C.cream]], 116, CX, 710, u, 11, [15.6, 16]);
  caps(ctx, '+ DECANT DE REGALO CON TU FRASCO', CX, 810, 34, C.cream, u, 12.4, [15.6, 16]);
  card(ctx, IMG.jasmere, CX, 520, 460, 0.04, u, 16.2, [23, 23.5]);
}
function endCard(ctx, u, IMG) {
  const k = springU(u, 23.6, SPRING.gentle);
  if (k <= 0) return;
  const size = 420, y = 250;
  ctx.save(); ctx.globalAlpha = clamp(k * 1.5);
  ctx.translate(CX, y + size / 2); ctx.scale(lerp(0.8, 1, k), lerp(0.8, 1, k)); ctx.translate(-CX, -(y + size / 2));
  ctx.beginPath(); ctx.arc(CX, y + size / 2, size * 0.5, 0, Math.PI * 2); ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(IMG.logo, CX - size / 2, y, size, size);
  ctx.restore();
  riseLine(ctx, [['galiciascent', false, C.cream], ['.com', true, C.gold]], 92, CX, 790, u, 24.2);
  caps(ctx, { vie: 'DEL 27 AL 30 DE NOVIEMBRE', sab: 'BLACK FRIDAY HASTA EL LUNES 30', dom: 'SOLO HASTA EL LUNES 30' }[DAY], CX, 870, 36, C.gold, u, 24.8);
}

// ---------------------------------------------------------------- hits
const COMMON = [[23.6, 'end card', 'impact', { gain: 0.5 }], [24.2, 'web', 'bell', { pitch: 'E6' }]];
const HITS = [...VOICE, ...COMMON, ...{
  vie: [[0, 'pop up', 'boing', { pitch: 'C5', to: 'C6' }], [4.1, 'spray', 'whoosh', { len: 0.6, from: 3000, to: 900 }], [5, 'pill', 'click'], [5.5, 'hoy empieza', 'pop', { pitch: 'A5' }],
    [6, 'jump', 'boing', { pitch: 'E5', to: 'E6', gain: 0.18 }], [7.6, 'jump', 'boing', { pitch: 'G5', to: 'G6', gain: 0.16 }], [10, '-20 %', 'impact'], [11.4, 'en decants', 'pop', { pitch: 'E5' }],
    [12, 'wink', 'blip', { pitch: 'E6' }], [14.2, 'card', 'thud'], [15.4, 'regalo', 'coins'], [20.1, 'spray', 'whoosh', { len: 0.6, from: 3000, to: 900 }], [23.2, 'into end', 'riser', { len: 0.4 }]],
  sab: [[0.3, 'thinking', 'tok', { pitch: 'C5', gain: 0.15 }], [4.1, 'spray', 'whoosh', { len: 0.6, from: 3000, to: 900 }], [5, 'Yara', 'pop', { pitch: 'E5' }], [5.9, 'Éclaire', 'pop', { pitch: 'G5' }],
    [6.8, 'Mayar', 'pop', { pitch: 'B5' }], [7.7, 'Odyssey', 'pop', { pitch: 'E6' }], [11.5, 'cards out', 'whoosh', { len: 0.4 }], [12, 'wink', 'blip', { pitch: 'E6' }], [12.6, '5 y 10 ml', 'thud'],
    [16, 'pill', 'click'], [16.6, '-20 %', 'impact'], [17.6, 'en decants', 'pop', { pitch: 'A5' }], [19, 'navidad', 'bell', { pitch: 'B5' }], [23.2, 'into end', 'riser', { len: 0.4 }]],
  dom: [[0, 'run', 'type', { len: 1.4 }], [4, 'el black friday', 'thud'], [4.8, 'acaba mañana', 'impact', { gain: 0.45 }], [5.8, 'panic jump', 'boing', { pitch: 'E5', to: 'E6', gain: 0.18 }],
    [6, 'lunes 30', 'click'], [10, '-20 %', 'impact'], [11, 'en decants', 'pop', { pitch: 'A5' }], [12.4, 'regalo', 'coins'], [16.2, 'card', 'thud'], [17, 'tap', 'tick'], [18, 'tap', 'tick'], [19, 'tap', 'tick'],
    [19.8, 'point', 'blip', { pitch: 'E6' }], [23.2, 'into end', 'riser', { len: 0.4 }]],
}[DAY]];

// ---------------------------------------------------------------- film
let GRAIN = null;
M.film({
  fonts: [dfont(100), dfont(100, true), ufont(40), ufont(40, 500)],
  images: {
    yara: 'assets/products/yara-elixir.jpg', eclaire: 'assets/products/eclaire.jpg', mayar: 'assets/products/mayar.jpg',
    odyssey: 'assets/products/odyssey-mega.jpg', decantAfeef: 'assets/products/decant-afeef.jpg', jasmere: 'assets/products/jasmere.jpg', logo: 'assets/logo/logo.png',
  },
  hits: HITS,
  async init() {
    const r = mulberry32(42);
    STARS = Array.from({ length: 70 }, () => [r() * W, r() * 1500, 1 + r() * 2.5, r() * 6]);
    const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256;
    const gx = gc.getContext('2d'); const id = gx.createImageData(256, 256); const rnd = mulberry32(11);
    for (let i = 0; i < id.data.length; i += 4) { const v = rnd() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0); GRAIN = gc;
  },
  draw(ctx, u, t, IMG) {
    backdrop(ctx, u, t);
    if (u < 23.4) ({ vie: zoneVie, sab: zoneSab, dom: zoneDom })[DAY](ctx, u, IMG);
    else endCard(ctx, u, IMG);
    const out = meiga(ctx, u, t);
    const target = [CX, 520];
    if (out.nozzle) { mist(ctx, out.nozzle, target, u, 4.1, 2.2); if (DAY === 'vie') mist(ctx, out.nozzle, [CX, 500], u, 20.1, 2.4); }
    LINES.forEach((L) => bubble(ctx, L, u, out.mouth));
  },
  post(ctx, u, t) {
    const f = Math.floor(t * 24);
    ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(hash01(f, 3) * 256), oy = Math.floor(hash01(f, 7) * 256);
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(GRAIN, x, y);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },
});
