// Ámbar: the Galicia Scent mascot, a 10 ml decant vial with amber perfume inside, a gold atomizer
// cap, big eyes on the glass and noodle arms. Drawn entirely in code; pure: same S, same pixels.
//
// drawAmbar(ctx, S) paints in MODEL units: feet on y = 0, centre x = 0, +y down, top of cap ~ -700.
// The caller sets translate/scale first.
// S (all optional; wink 0/1 closes the right eye):
//   lean (rad, whole body about the feet), squash (-0.3..0.3: + = squashed), hop (px up),
//   armL, armR: [shoulder, elbow] radians (0 = hanging down; + swings forward/up and outward),
//   handL, handR: 'mitt' | 'point' | 'wave' (open), blink 0..1, happy 0..1 (^^ eyes),
//   lookX, lookY (-1..1), brow (-1 worried .. 1 determined), browUp 0..1,
//   mouth: { open 0..1, wide -1..1, round 0..1, smile -1..1 }, slosh (rad, liquid tilt), t (s),
//   sweat 0..1, blush 0..1, capTilt (rad)

const TAU = Math.PI * 2;
export const PAL = {
  glass: 'rgba(244,240,234,0.20)', glassEdge: '#F4F0EA', glassShade: 'rgba(26,20,16,0.35)',
  liq0: '#F2C27A', liq1: '#E3AA64', liq2: '#A86A2A', liqDeep: '#7A4A1C',
  gold0: '#FBE3A8', gold1: '#E3AA64', gold2: '#B9803A', gold3: '#7A5122',
  white: '#FFFDF8', ink: '#1A1410', pupil: '#1A1410', mouth: '#4A2410', tongue: '#E8796A',
  label: '#F0E6D6', labelInk: '#8A5A22', blush: 'rgba(232,121,106,0.45)', sweat: '#BFE3F2',
};
const BODY = { w: 270, h: 470, top: -480, r: 70 };

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function arm(ctx, side, [sh, el], hand, t) {
  // side -1 = left (viewer's left), +1 = right. Shoulder on the glass edge.
  const sx = side * (BODY.w / 2 - 6), sy = -270;
  const L1 = 96, L2 = 88;
  // angle 0 = straight down; positive rotates outward/up
  const a1 = Math.PI / 2 - side * sh;            // canvas angle of upper arm
  const ex = sx + Math.cos(a1) * L1 * side * side, ey = sy + Math.sin(a1) * L1;
  const a2 = a1 - side * el;
  const hx = ex + Math.cos(a2) * L2, hy = ey + Math.sin(a2) * L2;
  const ax1 = sx + Math.cos(a1) * L1, ay1 = sy + Math.sin(a1) * L1;
  // noodle: quadratic through the elbow
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = PAL.gold3; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ax1, ay1, hx, hy); ctx.stroke();
  ctx.strokeStyle = PAL.gold1; ctx.lineWidth = 22;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ax1, ay1, hx, hy); ctx.stroke();
  // hand
  const ha = Math.atan2(hy - ay1, hx - ax1);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ha);
  ctx.fillStyle = PAL.white; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6;
  if (hand === 'point') {
    rr(ctx, -6, -22, 46, 44, 20); ctx.fill(); ctx.stroke();
    rr(ctx, 30, -10, 52, 20, 10); ctx.fill(); ctx.stroke();
  } else if (hand === 'wave') {
    ctx.beginPath(); ctx.ellipse(18, 0, 34, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (let k = -1; k <= 1; k++) {
      ctx.save(); ctx.rotate(k * 0.45 + 0.08 * Math.sin(t * 18 + k));
      rr(ctx, 36, -8, 34, 16, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  } else {
    ctx.beginPath(); ctx.ellipse(16, 0, 32, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function eyes(ctx, S) {
  const { blink = 0, happy = 0, wink = 0, lookX = 0, lookY = 0, brow = 0, browUp = 0 } = S;
  for (const side of [-1, 1]) {
    const cx = side * 62, cy = -320, rx = 46, ry = 58;
    ctx.save();
    if (happy > 0.5 || (side === 1 && wink > 0.5)) {
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 34, cy + 10); ctx.quadraticCurveTo(cx, cy - 40, cx + 34, cy + 10); ctx.stroke();
    } else {
      const open = 1 - blink;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, Math.max(3, ry * open), 0, 0, TAU);
      ctx.fillStyle = PAL.white; ctx.fill();
      ctx.lineWidth = 7; ctx.strokeStyle = PAL.ink; ctx.stroke();
      if (open > 0.15) {
        ctx.save(); ctx.clip();
        const px = cx + lookX * 16, py = cy + lookY * 20 + 6;
        ctx.beginPath(); ctx.ellipse(px, py, 26, 32, 0, 0, TAU); ctx.fillStyle = PAL.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(px + 9, py - 12, 9, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(px - 8, py + 10, 4, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    // brow: determined = inner end down
    const by = cy - ry - 26 - browUp * 22;
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - side * 30, by + brow * 14 * 1);
    ctx.quadraticCurveTo(cx, by - 10, cx + side * 30, by - brow * 10);
    ctx.stroke();
    ctx.restore();
  }
}

function mouth(ctx, M = {}) {
  const { open = 0, wide = 0, round = 0, smile = 0.4 } = M;
  const cx = 0, cy = -215;
  const w = 52 * (1 + 0.35 * wide - 0.4 * round), h = 8 + 52 * open * (1 + 0.3 * round);
  ctx.save();
  ctx.lineWidth = 8; ctx.strokeStyle = PAL.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (open < 0.06) {
    ctx.beginPath(); ctx.moveTo(cx - w, cy - smile * 6); ctx.quadraticCurveTo(cx, cy + smile * 36, cx + w, cy - smile * 6); ctx.stroke();
  } else {
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w, cy - smile * 8);
      ctx.quadraticCurveTo(cx, cy - 10 + smile * 10, cx + w, cy - smile * 8);
      ctx.quadraticCurveTo(cx + w * 0.7, cy + h, cx, cy + h + smile * 10);
      ctx.quadraticCurveTo(cx - w * 0.7, cy + h, cx - w, cy - smile * 8);
      ctx.closePath();
    };
    shape(); ctx.fillStyle = PAL.mouth; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.ellipse(cx, cy + h + 6, w * 0.6, h * 0.45, 0, 0, TAU); ctx.fillStyle = PAL.tongue; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(cx - w, cy - 14, w * 2, 12 + smile * 4);
    ctx.restore();
    shape(); ctx.stroke();
  }
  ctx.restore();
}

export function drawAmbar(ctx, S = {}) {
  const { lean = 0, squash = 0, hop = 0, armL = [0.25, 0.3], armR = [0.25, 0.3], handL = 'mitt', handR = 'mitt',
    slosh = 0, t = 0, sweat = 0, blush = 0, capTilt = 0 } = S;
  ctx.save();
  ctx.translate(0, -hop);
  ctx.rotate(lean);
  ctx.scale(1 + squash * 0.6, 1 - squash);

  // feet
  ctx.fillStyle = PAL.gold2; ctx.strokeStyle = PAL.gold3; ctx.lineWidth = 6;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 62, -14, 52, 22, 0, 0, TAU); ctx.fill(); ctx.stroke(); }

  // arms behind? no: arms in front, drawn after body
  const { w, h, top, r } = BODY, x = -w / 2;
  // neck + shoulders of the vial
  ctx.fillStyle = PAL.glass;
  rr(ctx, -62, top - 46, 124, 60, 18); ctx.fill();
  // body glass
  rr(ctx, x, top, w, h, [r * 0.7, r * 0.7, r, r]); ctx.fill();

  // liquid with tilted, wavy surface
  ctx.save();
  rr(ctx, x + 10, top + 10, w - 20, h - 24, [r * 0.6, r * 0.6, r - 8, r - 8]); ctx.clip();
  const lv = top + 52;
  const g = ctx.createLinearGradient(0, lv, 0, 0);
  g.addColorStop(0, PAL.liq0); g.addColorStop(0.45, PAL.liq1); g.addColorStop(1, PAL.liq2);
  ctx.fillStyle = g;
  ctx.beginPath();
  const tilt = Math.tan(slosh) * w * 0.5;
  ctx.moveTo(x, lv + tilt);
  for (let k = 0; k <= 12; k++) {
    const px = x + (w * k) / 12;
    const py = lv + tilt - (2 * tilt * k) / 12 + Math.sin(t * 6 + k * 0.9) * 5;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, 10); ctx.lineTo(x, 10); ctx.closePath(); ctx.fill();
  // bubbles (deterministic from t)
  ctx.fillStyle = 'rgba(255,240,210,0.55)';
  for (let k = 0; k < 6; k++) {
    const ph = (t * 0.35 + k * 0.173) % 1;
    const bx = x + 40 + ((k * 97) % (w - 80)), by = -30 - ph * (h - 170);
    ctx.beginPath(); ctx.arc(bx + Math.sin(t * 3 + k) * 6, by, 5 + (k % 3) * 3, 0, TAU); ctx.fill();
  }
  ctx.restore();

  // glass rim + highlights
  ctx.lineWidth = 8; ctx.strokeStyle = PAL.glassEdge;
  rr(ctx, x, top, w, h, [r * 0.7, r * 0.7, r, r]); ctx.stroke();
  rr(ctx, -62, top - 46, 124, 60, 18); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 34, top + 60); ctx.lineTo(x + 34, top + 200); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + 34, top + 232); ctx.lineTo(x + 34, top + 262); ctx.stroke();

  // label band with the GS monogram
  ctx.fillStyle = PAL.label; rr(ctx, x + 50, -108, w - 100, 64, 10); ctx.fill();
  ctx.strokeStyle = PAL.gold1; ctx.lineWidth = 4; rr(ctx, x + 57, -101, w - 114, 50, 6); ctx.stroke();
  ctx.fillStyle = PAL.labelInk; ctx.font = 'italic 600 44px Display'; ctx.textAlign = 'center';
  ctx.fillText('GS', 0, -62);

  // cap: gold atomizer
  ctx.save();
  ctx.translate(0, top - 46); ctx.rotate(capTilt);
  const cg = ctx.createLinearGradient(-80, 0, 80, 0);
  cg.addColorStop(0, PAL.gold3); cg.addColorStop(0.3, PAL.gold0); cg.addColorStop(0.6, PAL.gold1); cg.addColorStop(1, PAL.gold3);
  ctx.fillStyle = cg; ctx.strokeStyle = PAL.gold3; ctx.lineWidth = 6;
  rr(ctx, -82, -150, 164, 154, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAL.gold2; ctx.fillRect(-82, -40, 164, 14);
  rr(ctx, -30, -186, 60, 40, 10); ctx.fillStyle = cg; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(30, -168, 7, 0, TAU); ctx.fillStyle = PAL.gold3; ctx.fill();
  ctx.restore();

  // face on the glass
  eyes(ctx, S);
  if (blush > 0) {
    ctx.fillStyle = PAL.blush; ctx.globalAlpha = blush;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 98, -238, 30, 16, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  mouth(ctx, S.mouth);
  if (sweat > 0) {
    ctx.globalAlpha = sweat; ctx.fillStyle = PAL.sweat; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(120, -420); ctx.quadraticCurveTo(150, -370, 132, -352); ctx.quadraticCurveTo(108, -360, 120, -420); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  arm(ctx, -1, armL, handL, t);
  arm(ctx, 1, armR, handR, t);
  ctx.restore();
}
