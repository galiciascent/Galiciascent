// La Meiga de Galicia Scent: a Galician perfume witch, drawn in code. Pure: same S, same pixels.
// drawMeiga(ctx, S) paints in MODEL units: feet on y = 0, centre x = 0, +y down; hat tip ~ -860.
// Returns canvas-space points { nozzle: [x, y], mouth: [x, y], hatTip: [x, y] } for effects and bubbles.
// S (all optional):
//   lean (rad, about the feet), hop (px), squash (-0.3..0.3), step (0..1 running cycle phase; null = standing),
//   armL, armR: [shoulder, elbow] (radians; shoulder 0 = hanging, + raises outward), handL: 'open' | 'chin' | 'point',
//   decant (true: the right hand holds a decant), spray 0..1 (finger on the atomizer),
//   blink, happy, wink (0..1), lookX, lookY (-1..1), brow (-1 worried .. 1 determined), browUp 0..1,
//   mouth: { open 0..1, round 0..1, smile -1..1 }, sweat 0..1, blush 0..1, hatTilt (rad), t (s)
const TAU = Math.PI * 2;
export const PAL = {
  cloak0: '#3D2C5C', cloak1: '#231940', cloakLine: '#120C20', trim: '#E3AA64', trimDark: '#B9803A',
  skin: '#F6D2B4', skinShade: '#E8B998', hair: '#6B3A1E', hairDark: '#4A2614', boot: '#1A1410',
  ink: '#1A1410', white: '#FFFDF8', mouth: '#4A2410', tongue: '#E8796A', blush: 'rgba(232,121,106,0.45)',
  liq: '#E3AA64', glass: '#F4F0EA', gold: '#C8913F', sweat: '#BFE3F2',
};
const SH = { y: -262, x: 104 };

function pt(ctx, x, y) { const p = ctx.getTransform().transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; }

function boots(ctx, step) {
  ctx.fillStyle = PAL.boot;
  for (const s of [-1, 1]) {
    let lift = 0, fx = 0;
    if (step != null) { const ph = (step + (s > 0 ? 0.5 : 0)) % 1; lift = Math.max(0, Math.sin(ph * TAU)) * 46; fx = Math.cos(ph * TAU) * 26; }
    ctx.beginPath(); ctx.ellipse(s * 58 + fx, -12 - lift, 48, 22, 0, 0, TAU); ctx.fill();
  }
}

function cloak(ctx, t, sway) {
  const w = 172 + Math.sin(t * 3) * 4;
  ctx.beginPath();
  ctx.moveTo(-w + sway * 20, -6);
  ctx.quadraticCurveTo(-150, -230, -62, -330);
  ctx.lineTo(62, -330);
  ctx.quadraticCurveTo(150, -230, w + sway * 20, -6);
  ctx.quadraticCurveTo(0, 14, -w + sway * 20, -6);
  const g = ctx.createLinearGradient(0, -330, 0, 0); g.addColorStop(0, PAL.cloak0); g.addColorStop(1, PAL.cloak1);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = PAL.cloakLine; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = PAL.trim; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(-w + 8 + sway * 20, -14); ctx.quadraticCurveTo(0, 4, w - 8 + sway * 20, -14); ctx.stroke();
  // collar clasp
  ctx.fillStyle = PAL.trim; ctx.beginPath(); ctx.arc(0, -318, 16, 0, TAU); ctx.fill();
  ctx.strokeStyle = PAL.trimDark; ctx.lineWidth = 4; ctx.stroke();
  // little gold stars on the cloak
  ctx.fillStyle = PAL.trim;
  [[-86, -130, 9], [66, -206, 8], [96, -74, 7], [-40, -232, 6], [20, -96, 6]].forEach(([x, y, r], i) => {
    const k = 0.75 + 0.25 * Math.sin(t * 4 + i * 2);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.beginPath();
    for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU - Math.PI / 2, rr = j % 2 ? r * 0.45 : r * 1.4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
}

function decantInHand(ctx, spray) {
  // vial drawn in hand space, standing up regardless of arm angle handled by caller
  ctx.fillStyle = PAL.glass; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(-20, -92, 40, 96, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAL.liq; ctx.beginPath(); ctx.roundRect(-15, -66, 30, 66, 7); ctx.fill();
  ctx.fillStyle = '#FFF4DC'; ctx.fillRect(-11, -60, 5, 40);
  ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.roundRect(-16, -122, 32, 32, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-8, -136 + spray * 8, 16, 16, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7A5122'; ctx.beginPath(); ctx.arc(14, -110, 4, 0, TAU); ctx.fill();
}

function arm(ctx, side, [sh, el], hand, holds, spray, out) {
  const sx = side * SH.x, sy = SH.y, L1 = 104, L2 = 96;
  const a1 = Math.PI / 2 - side * sh, a2 = a1 - side * el;
  const ex = sx + Math.cos(a1) * L1, ey = sy + Math.sin(a1) * L1;
  const hx = ex + Math.cos(a2) * L2, hy = ey + Math.sin(a2) * L2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = PAL.cloakLine; ctx.lineWidth = 46;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = PAL.cloak0; ctx.lineWidth = 36;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  // cuff
  ctx.strokeStyle = PAL.trim; ctx.lineWidth = 12;
  const cx = hx - Math.cos(a2) * 18, cy = hy - Math.sin(a2) * 18;
  ctx.beginPath(); ctx.moveTo(cx + Math.cos(a2 + Math.PI / 2) * 20, cy + Math.sin(a2 + Math.PI / 2) * 20); ctx.lineTo(cx - Math.cos(a2 + Math.PI / 2) * 20, cy - Math.sin(a2 + Math.PI / 2) * 20); ctx.stroke();
  // hand
  ctx.save(); ctx.translate(hx, hy);
  if (holds) {
    decantInHand(ctx, spray);
    out.nozzle = pt(ctx, 14, -112);
  }
  ctx.rotate(a2);
  ctx.fillStyle = PAL.skin; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5;
  if (hand === 'point') {
    ctx.beginPath(); ctx.ellipse(6, 0, 26, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(18, -9, 50, 18, 9); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(8, 0, 28, 26, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function face(ctx, S) {
  const { blink = 0, happy = 0, wink = 0, lookX = 0, lookY = 0, brow = 0, browUp = 0, mouth = {}, blush = 0, sweat = 0 } = S;
  const cy = -450;
  for (const side of [-1, 1]) {
    const ex = side * 52, ey = cy;
    if (happy > 0.5 || (side === 1 && wink > 0.5)) {
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - 26, ey + 8); ctx.quadraticCurveTo(ex, ey - 28, ex + 26, ey + 8); ctx.stroke();
    } else {
      const o = 1 - blink;
      ctx.beginPath(); ctx.ellipse(ex, ey, 30, Math.max(3, 38 * o), 0, 0, TAU); ctx.fillStyle = PAL.white; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      if (o > 0.2) {
        ctx.save(); ctx.clip();
        const px = ex + lookX * 10, py = ey + 6 + lookY * 12;
        ctx.beginPath(); ctx.ellipse(px, py, 17, 22, 0, 0, TAU); ctx.fillStyle = PAL.ink; ctx.fill();
        ctx.beginPath(); ctx.arc(px + 6, py - 8, 6, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.restore();
      }
    }
    const by = ey - 52 - browUp * 16;
    ctx.strokeStyle = PAL.hairDark; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex - side * 22, by + brow * 10); ctx.quadraticCurveTo(ex, by - 8, ex + side * 24, by - brow * 6); ctx.stroke();
  }
  if (blush > 0) {
    ctx.globalAlpha = blush; ctx.fillStyle = PAL.blush;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 86, cy + 42, 20, 11, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  const { open = 0, round = 0, smile = 0.5 } = mouth;
  const my = cy + 66, w = 32 * (1 - 0.4 * round), h = 6 + 40 * open * (1 + 0.3 * round);
  ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (open < 0.05) {
    ctx.beginPath(); ctx.moveTo(-w, my - smile * 4); ctx.quadraticCurveTo(0, my + smile * 26, w, my - smile * 4); ctx.stroke();
  } else {
    const shape = () => { ctx.beginPath(); ctx.moveTo(-w, my - smile * 6); ctx.quadraticCurveTo(0, my - 6 + smile * 6, w, my - smile * 6); ctx.quadraticCurveTo(w * 0.7, my + h, 0, my + h + smile * 6); ctx.quadraticCurveTo(-w * 0.7, my + h, -w, my - smile * 6); ctx.closePath(); };
    shape(); ctx.fillStyle = PAL.mouth; ctx.fill();
    ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(0, my + h + 4, w * 0.6, h * 0.45, 0, 0, TAU); ctx.fillStyle = PAL.tongue; ctx.fill(); ctx.restore();
    shape(); ctx.stroke();
  }
  if (sweat > 0) {
    ctx.globalAlpha = sweat; ctx.fillStyle = PAL.sweat; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(96, -540); ctx.quadraticCurveTo(124, -494, 106, -478); ctx.quadraticCurveTo(84, -486, 96, -540); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawMeiga(ctx, S = {}) {
  const { lean = 0, hop = 0, squash = 0, step = null, armL = [0.2, 0.2], armR = [0.4, 0.6], handL = 'open', handR = 'open',
    decant = true, spray = 0, hatTilt = 0, t = 0 } = S;
  const out = { nozzle: null };
  ctx.save();
  ctx.translate(0, -hop); ctx.rotate(lean); ctx.scale(1 + squash * 0.6, 1 - squash);
  boots(ctx, step);
  cloak(ctx, t, lean * 4);
  // hair behind the head
  ctx.fillStyle = PAL.hair;
  const hs = Math.sin(t * 2.6) * 0.04;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 122, -400, 52, 118, s * (0.2 + hs), 0, TAU); ctx.fill(); }
  // left arm behind? keep both in front for readability
  // head
  ctx.beginPath(); ctx.arc(0, -450, 140, 0, TAU); ctx.fillStyle = PAL.skin; ctx.fill(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6; ctx.stroke();
  // fringe
  ctx.fillStyle = PAL.hair;
  ctx.beginPath(); ctx.moveTo(-136, -480); ctx.quadraticCurveTo(-90, -600, 0, -590); ctx.quadraticCurveTo(90, -600, 136, -480);
  ctx.quadraticCurveTo(70, -540, 10, -520); ctx.quadraticCurveTo(-60, -545, -136, -480); ctx.fill();
  face(ctx, S);
  out.mouth = pt(ctx, 0, -380);
  // hat
  ctx.save(); ctx.translate(0, -562); ctx.rotate(hatTilt + Math.sin(t * 2) * 0.03);
  ctx.beginPath(); ctx.ellipse(0, 0, 232, 46, 0, 0, TAU); ctx.fillStyle = '#2A1E40'; ctx.fill(); ctx.strokeStyle = PAL.cloakLine; ctx.lineWidth = 6; ctx.stroke();
  const tipSway = Math.sin(t * 2.2) * 18;
  ctx.beginPath(); ctx.moveTo(-122, -10); ctx.quadraticCurveTo(-60, -200, 40 + tipSway, -300); ctx.quadraticCurveTo(70, -250, 122, -10); ctx.closePath();
  const hg = ctx.createLinearGradient(-120, 0, 120, 0); hg.addColorStop(0, PAL.cloak1); hg.addColorStop(1, PAL.cloak0);
  ctx.fillStyle = hg; ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAL.trim; ctx.fillRect(-118, -48, 238, 32);
  ctx.fillStyle = PAL.ink; ctx.font = 'italic 600 30px Display'; ctx.textAlign = 'center'; ctx.fillText('GS', 0, -23);
  out.hatTip = pt(ctx, 40 + tipSway, -300);
  ctx.restore();
  arm(ctx, -1, armL, handL, false, 0, out);
  arm(ctx, 1, armR, handR, decant, spray, out);
  ctx.restore();
  return out;
}
