// Alternative mascots for Galicia Scent, drawn in code. Feet / base on y = 0, +y down, centre x = 0.
// Each takes S: { happy 0..1, open 0..1 (mouth), armL, armR (radians up from hanging), t, wink }
const TAU = Math.PI * 2;
const INK = '#1A1410', WHITE = '#FFFDF8', MOUTH = '#4A2410', TONGUE = '#E8796A';

function face(ctx, cx, cy, s, S, eyeGap = 46) {
  const { happy = 0, open = 0, wink = 0, look = 0 } = S;
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeGap * s, ey = cy;
    if (happy > 0.5 || (side === 1 && wink)) {
      ctx.strokeStyle = INK; ctx.lineWidth = 9 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - 26 * s, ey + 8 * s); ctx.quadraticCurveTo(ex, ey - 30 * s, ex + 26 * s, ey + 8 * s); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(ex, ey, 30 * s, 38 * s, 0, 0, TAU); ctx.fillStyle = WHITE; ctx.fill();
      ctx.lineWidth = 6 * s; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ex + look * 8 * s, ey + 6 * s, 17 * s, 22 * s, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 6 * s, ey - 4 * s, 6 * s, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }
  const my = cy + 62 * s, w = 34 * s, h = 6 * s + 40 * s * open;
  ctx.lineWidth = 6 * s; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  if (open < 0.05) {
    ctx.beginPath(); ctx.moveTo(cx - w, my); ctx.quadraticCurveTo(cx, my + 24 * s, cx + w, my); ctx.stroke();
  } else {
    const shape = () => { ctx.beginPath(); ctx.moveTo(cx - w, my); ctx.quadraticCurveTo(cx, my - 6 * s, cx + w, my); ctx.quadraticCurveTo(cx + w * 0.7, my + h, cx, my + h); ctx.quadraticCurveTo(cx - w * 0.7, my + h, cx - w, my); ctx.closePath(); };
    shape(); ctx.fillStyle = MOUTH; ctx.fill();
    ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(cx, my + h, w * 0.6, h * 0.45, 0, 0, TAU); ctx.fillStyle = TONGUE; ctx.fill(); ctx.restore();
    shape(); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(232,121,106,0.4)';
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + side * 78 * s, cy + 42 * s, 18 * s, 10 * s, 0, 0, TAU); ctx.fill(); }
}
function noodle(ctx, x0, y0, ang, len, color, dark, hand = WHITE) {
  const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
  const mx = (x0 + x1) / 2 + Math.cos(ang + 1.2) * 18, my = (y0 + y1) / 2 + Math.sin(ang + 1.2) * 18;
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.arc(x1, y1, 26, 0, TAU); ctx.fillStyle = hand; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}

// ---------------------------------------------------------------- Nube: a puff of golden perfume mist
export function drawNube(ctx, S = {}) {
  const { t = 0, armL = 0.4, armR = 0.4, happy = 0 } = S;
  const bob = Math.sin(t * 2.4) * 14;
  ctx.save(); ctx.translate(0, -60 + bob);
  // mist tail curling down to the base
  ctx.strokeStyle = 'rgba(246,217,160,0.85)'; ctx.lineWidth = 34; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -120); ctx.bezierCurveTo(60, -40, -60, 0, 10, 40); ctx.stroke();
  // puffs
  const puffs = [[0, -330, 150], [-120, -280, 105], [120, -280, 105], [-70, -420, 100], [80, -430, 95], [0, -200, 120], [-150, -200, 70], [150, -205, 70]];
  const g = ctx.createRadialGradient(-40, -380, 30, 0, -280, 280);
  g.addColorStop(0, '#FFF4DC'); g.addColorStop(0.6, '#F6D9A0'); g.addColorStop(1, '#E3AA64');
  ctx.fillStyle = '#B9803A';
  puffs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y + 6, r + 8, 0, TAU); ctx.fill(); });
  ctx.fillStyle = g;
  puffs.forEach(([x, y, r], i) => { ctx.beginPath(); ctx.arc(x + Math.sin(t * 3 + i) * 3, y, r, 0, TAU); ctx.fill(); });
  // sparkles
  ctx.fillStyle = '#FBE3A8';
  [[-210, -430], [220, -380], [-200, -120], [190, -110]].forEach(([x, y], i) => {
    const k = 0.6 + 0.4 * Math.sin(t * 5 + i * 1.7);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.beginPath();
    for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU, r = j % 2 ? 8 : 26; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
  noodle(ctx, -150, -230, Math.PI / 2 + armL * 1.2 + 0.3, 110, '#F6D9A0', '#B9803A');
  noodle(ctx, 150, -230, Math.PI / 2 - armR * 1.2 - 0.3, 110, '#F6D9A0', '#B9803A');
  face(ctx, 0, -330, 1.25, { ...S, happy });
  ctx.restore();
}

// ---------------------------------------------------------------- Rosa: a Damask rose
export function drawRosa(ctx, S = {}) {
  const { t = 0, armL = 0.3, armR = 0.3 } = S;
  ctx.save();
  // stem + pot-free feet: two leaves as feet
  ctx.strokeStyle = '#3F5A2A'; ctx.lineWidth = 26; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(14, -150, 0, -250); ctx.stroke();
  ctx.fillStyle = '#5E7F3A'; ctx.strokeStyle = '#2E4420'; ctx.lineWidth = 5;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 52, -14, 56, 20, s * 0.1, 0, TAU); ctx.fill(); ctx.stroke(); }
  // leaf arms
  for (const [side, a] of [[-1, armL], [1, armR]]) {
    ctx.save(); ctx.translate(side * 8, -170); ctx.rotate(side * (1.3 - a * 1.4));
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 70, -50, side * 150, 0); ctx.quadraticCurveTo(side * 70, 40, 0, 0);
    ctx.fillStyle = '#6E9444'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4 * side, 0); ctx.lineTo(side * 130, 0); ctx.strokeStyle = '#2E4420'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  // bloom: rings of petals
  ctx.translate(0, -430);
  const ring = (n, R, r, c0, c1, rot) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rot;
      ctx.save(); ctx.rotate(a); ctx.translate(0, -R);
      const g = ctx.createRadialGradient(0, r * 0.3, 2, 0, 0, r);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#7A2236'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
    }
  };
  ring(9, 170, 100, '#E6849A', '#B8435E', 0.1 + Math.sin(t) * 0.02);
  ring(7, 110, 92, '#F0A2B3', '#C9566F', 0.35);
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU);
  const fg = ctx.createRadialGradient(-30, -40, 20, 0, 0, 160); fg.addColorStop(0, '#FAD3DB'); fg.addColorStop(1, '#E68AA0');
  ctx.fillStyle = fg; ctx.fill(); ctx.strokeStyle = '#7A2236'; ctx.lineWidth = 5; ctx.stroke();
  face(ctx, 0, -20, 1.15, S);
  // dew drop
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(-120, -150, 12, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- Meiga: a Galician perfume witch
export function drawMeiga(ctx, S = {}) {
  const { t = 0, armL = 0.3, armR = 0.3 } = S;
  ctx.save();
  // cloak
  ctx.beginPath(); ctx.moveTo(-170, 0); ctx.quadraticCurveTo(-150, -260, -60, -330); ctx.lineTo(60, -330); ctx.quadraticCurveTo(150, -260, 170, 0); ctx.closePath();
  const cg = ctx.createLinearGradient(0, -330, 0, 0); cg.addColorStop(0, '#3A2A55'); cg.addColorStop(1, '#22183A');
  ctx.fillStyle = cg; ctx.fill(); ctx.strokeStyle = '#120C20'; ctx.lineWidth = 6; ctx.stroke();
  // gold trim + stars
  ctx.strokeStyle = '#E3AA64'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-166, -12); ctx.lineTo(166, -12); ctx.stroke();
  ctx.fillStyle = '#E3AA64'; [[-90, -120], [70, -200], [100, -70]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); });
  // arms: one holds a little decant
  noodle(ctx, -110, -250, Math.PI / 2 + armL * 1.3 + 0.2, 120, '#3A2A55', '#120C20', '#F6D2B4');
  const ra = Math.PI / 2 - armR * 1.3 - 0.2;
  noodle(ctx, 110, -250, ra, 120, '#3A2A55', '#120C20', '#F6D2B4');
  const hx = 110 + Math.cos(ra) * 120, hy = -250 + Math.sin(ra) * 120;
  ctx.save(); ctx.translate(hx + 10, hy - 40); ctx.rotate(0.15);
  ctx.fillStyle = '#E3AA64'; ctx.fillRect(-16, -40, 32, 70); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 4; ctx.strokeRect(-16, -40, 32, 70);
  ctx.fillStyle = '#B9803A'; ctx.fillRect(-12, -62, 24, 22); ctx.restore();
  // head
  ctx.beginPath(); ctx.arc(0, -440, 140, 0, TAU);
  ctx.fillStyle = '#F6D2B4'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  // hair
  ctx.fillStyle = '#6B3A1E';
  ctx.beginPath(); ctx.ellipse(-120, -400, 50, 110, 0.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(120, -400, 50, 110, -0.2, 0, TAU); ctx.fill();
  face(ctx, 0, -440, 1.0, S, 50);
  // hat
  ctx.save(); ctx.translate(0, -545); ctx.rotate(Math.sin(t * 2) * 0.05);
  ctx.beginPath(); ctx.ellipse(0, 0, 230, 46, 0, 0, TAU); ctx.fillStyle = '#2A1E40'; ctx.fill(); ctx.strokeStyle = '#120C20'; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-120, -10); ctx.quadraticCurveTo(-60, -200, 40, -300); ctx.quadraticCurveTo(70, -250, 120, -10); ctx.closePath();
  ctx.fillStyle = '#3A2A55'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#E3AA64'; ctx.fillRect(-116, -46, 234, 30);
  ctx.font = 'italic 600 30px Display'; ctx.fillStyle = '#1A1410'; ctx.textAlign = 'center'; ctx.fillText('GS', 0, -22);
  ctx.restore();
  ctx.restore();
}
