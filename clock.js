/* =============================================
   DOMINO'S PIZZA CLOCK — clock.js  (Rich Edition)
   "Bu Öğlen Pizza Var" Campaign
   ============================================= */

/* ── CANVAS SETUP ── */
const mainCanvas = document.getElementById('clockCanvas');
const mainCtx = mainCanvas ? mainCanvas.getContext('2d') : null;
const MW = mainCanvas ? mainCanvas.width : 480;
const MH = mainCanvas ? mainCanvas.height : 480;
const MCX = MW / 2, MCY = MH / 2, MR = 218;

const heroCanvas = document.getElementById('heroCanvas');
const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
const HW = heroCanvas ? heroCanvas.width : 340;
const HH = heroCanvas ? heroCanvas.height : 340;
const HCX = HW / 2, HCY = HH / 2, HR = 155;

/* ── ALARM STATE ── */
let alarmHour = 12, alarmMinute = 0;
let alarmActive = false, alarmTriggered = false;
let alarmTimer = null, audioCtx = null;

/* ── AUDIO ── */
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playJingle() {
  const a = getAudio();
  const melody = [
    [523.25, 0.12], [659.25, 0.12], [783.99, 0.12],
    [1046.5, 0.22], [783.99, 0.08], [1046.5, 0.30],
    [880, 0.10], [1174.7, 0.35],
  ];
  let t = a.currentTime + 0.04;
  melody.forEach(([freq, dur]) => {
    const osc = a.createOscillator(), g = a.createGain();
    osc.connect(g); g.connect(a.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
    osc.start(t); osc.stop(t + dur);
    t += dur + 0.025;
  });
}
function startJingleLoop() {
  playJingle();
  if (!alarmTriggered) return;
  alarmTimer = setTimeout(startJingleLoop, 2800);
}
function stopJingle() { clearTimeout(alarmTimer); alarmTimer = null; }

/* ── ALARM CONTROL ── */
function setAlarm() {
  const h = parseInt(document.getElementById('alarmHour').value);
  const m = parseInt(document.getElementById('alarmMinute').value);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) { alert('Geçerli bir saat girin!'); return; }
  alarmHour = h; alarmMinute = m; alarmActive = true; alarmTriggered = false;
  document.getElementById('alarmBadge').style.display = 'flex';
  document.getElementById('dismissBtn').style.display = 'inline-block';
  document.getElementById('setAlarmBtn').textContent = 'Güncelle';
}
function dismissAlarm() {
  stopJingle(); alarmTriggered = false;
  document.getElementById('alarmOverlay').classList.remove('show');
  document.getElementById('pulseRing').classList.remove('active');
}
function triggerAlarm() {
  alarmTriggered = true;
  document.getElementById('alarmOverlay').classList.add('show');
  document.getElementById('pulseRing').classList.add('active');
  startJingleLoop(); launchConfetti();
}

/* ── CONFETTI ── */
function launchConfetti() {
  const c = document.getElementById('confettiContainer');
  if (!c) return;
  c.innerHTML = '';
  const COLS = ['#E31837', '#006491', '#ffffff', '#FFD700', '#E31837', '#006491'];
  for (let i = 0; i < 55; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${Math.random() * 100}%;
      background:${COLS[Math.floor(Math.random() * COLS.length)]};
      width:${5 + Math.random() * 9}px;
      height:${5 + Math.random() * 9}px;
      border-radius:${Math.random() > .5 ? '50%' : '2px'};
      animation-duration:${1.2 + Math.random() * 1.5}s;
      animation-delay:${Math.random() * .6}s;
    `;
    c.appendChild(el);
  }
}

/* ══════════════════════════════════════════
   PIZZA DRAWING — Rich Edition
══════════════════════════════════════════ */
const BASE_R = 218; // reference radius for scaling
function SC(r) { return r / BASE_R; }

/* ── CRUST + CHEESE BASE ── */
function drawPizzaBase(ctx, cx, cy, r) {
  const s = SC(r);

  /* 1 — Deep cast shadow beneath the pizza */
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 32 * s;
  ctx.shadowOffsetY = 10 * s;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#5a2800'; ctx.fill();
  ctx.restore();

  /* 2 — Crust body: dark outer edges → golden top */
  const cg = ctx.createRadialGradient(cx - r * .12, cy - r * .12, r * .5, cx, cy, r);
  cg.addColorStop(0, '#ebb55e');
  cg.addColorStop(0.68, '#c47830');
  cg.addColorStop(0.85, '#9e5520');
  cg.addColorStop(1, '#6b3008');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = cg; ctx.fill();

  /* 3 — Bake char marks on crust */
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.22;
    const d = r - 9 * s;
    const ex = cx + Math.cos(a) * d;
    const ey = cy + Math.sin(a) * d;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 9 * s, 4 * s, a, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(45,12,0,0.3)';
    ctx.fill();
  }

  /* 4 — Crust bubble bumps (raised dough texture) */
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const bx = cx + Math.cos(a) * (r - 7 * s);
    const by = cy + Math.sin(a) * (r - 7 * s);
    const br = (2.8 + Math.abs(Math.sin(i * 3.1)) * 2) * s;
    const bg = ctx.createRadialGradient(bx - br * .4, by - br * .4, 0, bx, by, br);
    bg.addColorStop(0, 'rgba(255,225,155,0.5)');
    bg.addColorStop(1, 'rgba(120,55,10,0.0)');
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();
  }

  /* 5 — Sauce ring just inside crust */
  ctx.beginPath(); ctx.arc(cx, cy, r - 17 * s, 0, Math.PI * 2);
  const sauceRing = ctx.createRadialGradient(cx, cy, r - 22 * s, cx, cy, r - 14 * s);
  sauceRing.addColorStop(0, '#c44010');
  sauceRing.addColorStop(1, '#a02c08');
  ctx.fillStyle = sauceRing; ctx.fill();

  /* 6 — Cheese slices (alternating tones for texture) */
  const nSlices = 8;
  const cheeseA = ['#d9aa50', '#c49840', '#d9aa50', '#c49840', '#d9aa50', '#c49840', '#d9aa50', '#c49840'];
  for (let i = 0; i < nSlices; i++) {
    const sa = (i / nSlices) * Math.PI * 2 - Math.PI * .5;
    const ea = ((i + 1) / nSlices) * Math.PI * 2 - Math.PI * .5;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 17 * s, sa, ea);
    ctx.closePath();
    ctx.fillStyle = cheeseA[i]; ctx.fill();
  }

  /* 7 — Cheese radial depth + gloss */
  const cheeseGloss = ctx.createRadialGradient(cx - r * .22, cy - r * .22, 0, cx, cy, r - 17 * s);
  cheeseGloss.addColorStop(0, 'rgba(255,245,190,0.48)');
  cheeseGloss.addColorStop(0.35, 'rgba(220,175,65,0.10)');
  cheeseGloss.addColorStop(0.75, 'rgba(160,90,5,0.20)');
  cheeseGloss.addColorStop(1, 'rgba(90,35,0,0.40)');
  ctx.beginPath(); ctx.arc(cx, cy, r - 17 * s, 0, Math.PI * 2);
  ctx.fillStyle = cheeseGloss; ctx.fill();

  /* 8 — Browned melt spots on cheese */
  const meltPos = [
    [0.08, -0.30], [-0.36, 0.16], [0.44, 0.34],
    [-0.18, -0.56], [0.28, -0.10], [-0.50, -0.20],
    [0.12, 0.64], [-0.62, 0.28], [0.55, -0.50],
  ];
  meltPos.forEach(([bx, by]) => {
    const px = cx + bx * (r - 24 * s), py = cy + by * (r - 24 * s);
    const mg = ctx.createRadialGradient(px, py, 0, px, py, 25 * s);
    mg.addColorStop(0, 'rgba(130,62,5,0.32)');
    mg.addColorStop(1, 'rgba(130,62,5,0)');
    ctx.beginPath();
    ctx.ellipse(px, py, 25 * s, 16 * s, bx * 2, 0, Math.PI * 2);
    ctx.fillStyle = mg; ctx.fill();
  });

  /* 9 — Slice cut lines (dark + light ridge) */
  for (let i = 0; i < nSlices; i++) {
    const a = (i / nSlices) * Math.PI * 2 - Math.PI * .5;
    const ex = cx + Math.cos(a) * (r - 17 * s);
    const ey = cy + Math.sin(a) * (r - 17 * s);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(90,40,0,0.50)';
    ctx.lineWidth = 2.8 * s; ctx.stroke();
    // highlight
    const o = 0.007;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a + o) * (r - 17 * s), cy + Math.sin(a + o) * (r - 17 * s));
    ctx.strokeStyle = 'rgba(255,215,100,0.14)';
    ctx.lineWidth = 1.5 * s; ctx.stroke();
  }

  /* 10 — Crust-cheese border ring */
  ctx.beginPath(); ctx.arc(cx, cy, r - 17 * s, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(160,48,8,0.55)';
  ctx.lineWidth = 5 * s; ctx.stroke();

  /* 11 — Top specular blob */
  const spec = ctx.createRadialGradient(cx - r * .28, cy - r * .28, 0, cx - r * .1, cy - r * .1, r * .6);
  spec.addColorStop(0, 'rgba(255,255,230,0.26)');
  spec.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r - 17 * s, 0, Math.PI * 2);
  ctx.fillStyle = spec; ctx.fill();
}

/* ── TOPPINGS ── */
function drawToppings(ctx, cx, cy, r) {
  const s = SC(r);
  const TOPS = [
    { type: 'pepperoni', x: 0.22, y: -0.54 },
    { type: 'pepperoni', x: -0.44, y: -0.32 },
    { type: 'pepperoni', x: 0.58, y: 0.16 },
    { type: 'pepperoni', x: -0.14, y: 0.54 },
    { type: 'pepperoni', x: 0.16, y: 0.16 },
    { type: 'pepperoni', x: -0.58, y: 0.26 },
    { type: 'pepperoni', x: 0.40, y: -0.20 },
    { type: 'pepperoni', x: -0.20, y: -0.24 },
    { type: 'olive', x: -0.38, y: 0.52 },
    { type: 'olive', x: 0.52, y: -0.38 },
    { type: 'pepper', x: 0.04, y: -0.40, angle: 30 },
    { type: 'pepper', x: -0.30, y: 0.08, angle: -45 },
    { type: 'pepper', x: 0.44, y: 0.42, angle: 70 },
  ];

  TOPS.forEach(t => {
    const px = cx + t.x * (r - 26 * s);
    const py = cy + t.y * (r - 26 * s);

    if (t.type === 'pepperoni') {
      const pr = 20 * s;
      // Soft drop shadow
      ctx.beginPath(); ctx.arc(px + 2 * s, py + 3 * s, pr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // Body
      const pg = ctx.createRadialGradient(px - 6 * s, py - 6 * s, 1 * s, px, py, pr);
      pg.addColorStop(0, '#e04848');
      pg.addColorStop(0.45, '#b52020');
      pg.addColorStop(1, '#680808');
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = pg; ctx.fill();
      // Darker rim
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(60,0,0,0.5)'; ctx.lineWidth = 1.8 * s; ctx.stroke();
      // Grease fat spots
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        const sx = px + Math.cos(a) * 11 * s, sy = py + Math.sin(a) * 11 * s;
        const fg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 4 * s);
        fg.addColorStop(0, 'rgba(255,185,145,0.7)');
        fg.addColorStop(1, 'rgba(255,185,145,0)');
        ctx.beginPath(); ctx.arc(sx, sy, 4 * s, 0, Math.PI * 2);
        ctx.fillStyle = fg; ctx.fill();
      }
      // Center dark dimple
      ctx.beginPath(); ctx.arc(px, py, 5 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70,0,0,0.40)'; ctx.fill();
      // Specular glint
      ctx.beginPath(); ctx.arc(px - 6 * s, py - 6 * s, 5 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,200,180,0.35)'; ctx.fill();

    } else if (t.type === 'olive') {
      const or = 14 * s;
      // Shadow
      ctx.beginPath(); ctx.arc(px + 1.5 * s, py + 2.5 * s, or, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // Olive body
      const og = ctx.createRadialGradient(px - 4 * s, py - 4 * s, 1 * s, px, py, or);
      og.addColorStop(0, '#4a4a2a'); og.addColorStop(1, '#181806');
      ctx.beginPath(); ctx.arc(px, py, or, 0, Math.PI * 2);
      ctx.fillStyle = og; ctx.fill();
      // Rim
      ctx.beginPath(); ctx.arc(px, py, or, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
      // Pimento (red center)
      ctx.beginPath(); ctx.arc(px, py, 6 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#cc3a18'; ctx.fill();
      ctx.beginPath(); ctx.arc(px - 2 * s, py - 2 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,160,130,0.6)'; ctx.fill();
      // Highlight
      ctx.beginPath(); ctx.arc(px - 5 * s, py - 5 * s, 4 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(110,110,65,0.5)'; ctx.fill();

    } else if (t.type === 'pepper') {
      const angle = ((t.angle || 0) * Math.PI) / 180;
      const pw = 42 * s, ph = 13 * s, pr2 = 6 * s;
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
      // Shadow
      ctx.beginPath();
      ctx.ellipse(2 * s, 2.5 * s, pw * .5, ph * .5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
      // Strip
      ctx.beginPath();
      ctx.moveTo(-pw / 2 + pr2, -ph / 2); ctx.lineTo(pw / 2 - pr2, -ph / 2);
      ctx.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + pr2);
      ctx.lineTo(pw / 2, ph / 2 - pr2); ctx.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - pr2, ph / 2);
      ctx.lineTo(-pw / 2 + pr2, ph / 2); ctx.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - pr2);
      ctx.lineTo(-pw / 2, -ph / 2 + pr2); ctx.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + pr2, -ph / 2);
      ctx.closePath();
      const pGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
      pGrad.addColorStop(0, '#65d848');
      pGrad.addColorStop(0.5, '#3ea824');
      pGrad.addColorStop(1, '#207010');
      ctx.fillStyle = pGrad; ctx.fill();
      // Rim
      ctx.strokeStyle = 'rgba(20,80,5,0.5)'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      // Highlight stripe
      ctx.beginPath();
      ctx.ellipse(0, -ph * .22, pw * .28, ph * .2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,255,145,0.35)'; ctx.fill();
      ctx.restore();
    }
  });
}

/* ── HOUR MARKERS ── */
function drawMarkers(ctx, cx, cy, r) {
  const s = SC(r);
  // Minute ticks (60 total)
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI * .5;
    const isHour = i % 5 === 0;
    const isQuad = i % 15 === 0;
    const len = isQuad ? 22 * s : (isHour ? 14 * s : 6 * s);
    const wid = isQuad ? 4.5 * s : (isHour ? 2.5 * s : 1.2 * s);
    const col = isQuad
      ? 'rgba(255,255,255,0.98)'
      : (isHour ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.28)');
    ctx.save();
    if (isQuad) { ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 5; }
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (r - 20 * s), cy + Math.sin(angle) * (r - 20 * s));
    ctx.lineTo(cx + Math.cos(angle) * (r - 20 * s - len), cy + Math.sin(angle) * (r - 20 * s - len));
    ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }

  // Numerals
  const lbls = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const fsz = Math.max(11, 18 * s);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lbls.forEach((lbl, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI * .5;
    const dist = r - 52 * s;
    const isQ = i % 3 === 0;
    ctx.font = `${isQ ? 900 : 700} ${isQ ? fsz * 1.12 : fsz}px Nunito, 'Open Sans', sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 6;
    ctx.fillStyle = isQ ? '#ffffff' : 'rgba(255,255,255,0.72)';
    ctx.fillText(lbl, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
  });
  ctx.restore();
}

/* ── TAPERED CLOCK HAND ── */
function drawHand(ctx, cx, cy, angle, length, baseW, color, glow) {
  const tipX = cx + Math.cos(angle) * length;
  const tipY = cy + Math.sin(angle) * length;
  const butX = cx - Math.cos(angle) * baseW * 1.1;
  const butY = cy - Math.sin(angle) * baseW * 1.1;
  const px = -Math.sin(angle), py = Math.cos(angle);

  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = 20;

  // Main tapered body
  ctx.beginPath();
  ctx.moveTo(butX + px * baseW, butY + py * baseW);
  ctx.bezierCurveTo(
    cx + px * baseW * .9, cy + py * baseW * .9,
    tipX + px * 0.5, tipY + py * 0.5,
    tipX, tipY
  );
  ctx.bezierCurveTo(
    tipX - px * 0.5, tipY - py * 0.5,
    cx - px * baseW * .9, cy - py * baseW * .9,
    butX - px * baseW, butY - py * baseW
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Shine on top half of hand
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(butX + px * baseW * .5, butY + py * baseW * .5);
  ctx.bezierCurveTo(
    cx + px * baseW * .4, cy + py * baseW * .4,
    tipX + px * .3, tipY + py * .3,
    tipX, tipY
  );
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = baseW * 0.4;
  ctx.lineCap = 'round'; ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/* ── SECOND HAND ── */
function drawSecondHand(ctx, cx, cy, angle, length) {
  const s = SC(length / 0.83);
  const tipX = cx + Math.cos(angle) * length;
  const tipY = cy + Math.sin(angle) * length;
  const butX = cx - Math.cos(angle) * 22 * s;
  const butY = cy - Math.sin(angle) * 22 * s;

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(butX, butY); ctx.lineTo(tipX, tipY);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * s; ctx.lineCap = 'round'; ctx.stroke();
  // Counterweight
  ctx.beginPath(); ctx.arc(butX, butY, 6 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

/* ── DOMINO TILE CENTER ── */
function drawDominoCenter(ctx, cx, cy, r) {
  const s = SC(r);
  const TW = 66 * s, TH = 36 * s, TR = 7 * s;
  const TX = cx - TW / 2, TY = cy - TH / 2;

  function rRect(x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y); ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad); ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  ctx.save();
  // Outer shadow
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 16 * s; ctx.shadowOffsetY = 4 * s;
  rRect(TX, TY, TW, TH, TR);
  ctx.fillStyle = '#111'; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Blue half gradient
  rRect(TX, TY, TW / 2, TH, TR);
  const bg = ctx.createLinearGradient(TX, TY, TX, TY + TH);
  bg.addColorStop(0, '#1890c0'); bg.addColorStop(.5, '#006491'); bg.addColorStop(1, '#003e5a');
  ctx.fillStyle = bg; ctx.fill();

  // Red half gradient
  rRect(TX + TW / 2, TY, TW / 2, TH, TR);
  const rg = ctx.createLinearGradient(TX + TW / 2, TY, TX + TW / 2, TY + TH);
  rg.addColorStop(0, '#ff4a60'); rg.addColorStop(.5, '#E31837'); rg.addColorStop(1, '#7a0018');
  ctx.fillStyle = rg; ctx.fill();

  // Metal divider
  ctx.beginPath(); ctx.moveTo(cx, TY + 3); ctx.lineTo(cx, TY + TH - 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 1, TY + 3); ctx.lineTo(cx + 1, TY + TH - 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1 * s; ctx.stroke();

  // Blue dots (2)
  const BX = cx - TW / 4;
  [[BX, cy - 9 * s], [BX, cy + 9 * s]].forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(dx + 1, dy + 1.5, 5.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.beginPath(); ctx.arc(dx, dy, 5 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'white'; ctx.fill();
    ctx.beginPath(); ctx.arc(dx - 1.5 * s, dy - 1.5 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
  });

  // Red dot (1)
  const RX = cx + TW / 4;
  ctx.beginPath(); ctx.arc(RX + 1, cy + 1.5, 6.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
  ctx.beginPath(); ctx.arc(RX, cy, 6 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'white'; ctx.fill();
  ctx.beginPath(); ctx.arc(RX - 2 * s, cy - 2 * s, 2.2 * s, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();

  // Outer border glow
  rRect(TX, TY, TW, TH, TR);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5 * s; ctx.stroke();

  ctx.restore();
}

/* ══════════════════════════════════════════
   RENDER A CLOCK FRAME
══════════════════════════════════════════ */
function renderClock(ctx, cx, cy, r, now) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hour = (now.getHours() % 12) + min / 60;
  const s = SC(r);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawPizzaBase(ctx, cx, cy, r);
  drawToppings(ctx, cx, cy, r);
  drawMarkers(ctx, cx, cy, r);

  // Hour hand (red #E31837)
  drawHand(ctx, cx, cy,
    hour / 12 * Math.PI * 2 - Math.PI * .5,
    r * 0.50, 11 * s,
    '#E31837', 'rgba(227,24,55,0.85)'
  );
  // Minute hand (blue #006491)
  drawHand(ctx, cx, cy,
    min / 60 * Math.PI * 2 - Math.PI * .5,
    r * 0.73, 7 * s,
    '#006491', 'rgba(0,100,145,0.75)'
  );
  // Second hand (white)
  drawSecondHand(ctx, cx, cy, sec / 60 * Math.PI * 2 - Math.PI * .5, r * 0.83);

  drawDominoCenter(ctx, cx, cy, r);
}

/* ══════════════════════════════════════════
   NOON COUNTDOWN
══════════════════════════════════════════ */
function pad(n) { return String(n).padStart(2, '0'); }

function getNoonCountdown(now) {
  let noon = new Date(now);
  noon.setHours(12, 0, 0, 0);
  if (now >= noon) { noon.setDate(noon.getDate() + 1); }
  const diff = Math.max(0, noon - now);
  return {
    hh: Math.floor(diff / 3600000),
    mm: Math.floor((diff % 3600000) / 60000),
    ss: Math.floor((diff % 60000) / 1000),
    diff,
  };
}

/* ══════════════════════════════════════════
   MAIN TICK LOOP
══════════════════════════════════════════ */
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function tick() {
  const now = new Date();

  if (mainCtx) renderClock(mainCtx, MCX, MCY, MR, now);
  if (heroCtx) renderClock(heroCtx, HCX, HCY, HR, now);

  // Digital time
  const el = document.getElementById('digitalTime');
  if (el) el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Date
  const de = document.getElementById('digitalDate');
  if (de) de.textContent =
    `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`.toUpperCase();

  // Countdown
  const { hh, mm, ss, diff } = getNoonCountdown(now);
  const cdT = document.getElementById('countdownTime');
  const cdS = document.getElementById('countdownSub');
  const hcEl = document.getElementById('heroCountdown');
  const cdStr = diff === 0 ? 'ŞIMDI!' : `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  if (hcEl) hcEl.textContent = cdStr;
  if (cdT) cdT.textContent = cdStr;
  if (cdS) cdS.textContent = diff === 0
    ? '🍕 Pizza zamanı!' : (now.getHours() < 12 ? 'Bugün öğlene kalan ⏱️' : 'Yarın öğlene kalan ⏱️');

  // Alarm check
  if (alarmActive && !alarmTriggered) {
    if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute && now.getSeconds() === 0) {
      triggerAlarm();
    }
  }

  requestAnimationFrame(tick);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
tick();
