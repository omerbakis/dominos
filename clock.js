/* =============================================
   DOMINO'S PIZZA CLOCK — clock.js
   "Bu Öğlen Pizza Var" Campaign
   ============================================= */

/* ────────────────────────────────────────────
   CANVAS SETUP
────────────────────────────────────────────── */
// Main big clock
const mainCanvas = document.getElementById('clockCanvas');
const mainCtx = mainCanvas ? mainCanvas.getContext('2d') : null;
const MW = mainCanvas ? mainCanvas.width : 480;
const MH = mainCanvas ? mainCanvas.height : 480;
const MCX = MW / 2;
const MCY = MH / 2;
const MR = 218;   // main pizza radius

// Small hero clock
const heroCanvas = document.getElementById('heroCanvas');
const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
const HW = heroCanvas ? heroCanvas.width : 340;
const HH = heroCanvas ? heroCanvas.height : 340;
const HCX = HW / 2;
const HCY = HH / 2;
const HR = 155;

/* ────────────────────────────────────────────
   ALARM STATE
────────────────────────────────────────────── */
let alarmHour = 12;
let alarmMinute = 0;
let alarmActive = false;
let alarmTriggered = false;
let alarmTimer = null;
let audioCtx = null;

/* ────────────────────────────────────────────
   AUDIO
────────────────────────────────────────────── */
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playJingle() {
  const a = getAudio();
  const melody = [
    [523.25, 0.12], [659.25, 0.12], [783.99, 0.12],
    [1046.5, 0.22], [783.99, 0.08], [1046.5, 0.3],
    [880, 0.1], [1174.7, 0.35],
  ];
  let t = a.currentTime + 0.04;
  melody.forEach(([freq, dur]) => {
    const osc = a.createOscillator();
    const g = a.createGain();
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
function stopJingle() {
  clearTimeout(alarmTimer);
  alarmTimer = null;
}

/* ────────────────────────────────────────────
   ALARM CONTROL
────────────────────────────────────────────── */
function setAlarm() {
  const h = parseInt(document.getElementById('alarmHour').value);
  const m = parseInt(document.getElementById('alarmMinute').value);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    alert('Geçerli bir saat girin!'); return;
  }
  alarmHour = h; alarmMinute = m;
  alarmActive = true; alarmTriggered = false;

  const label = `${pad(h)}:${pad(m)}`;
  document.getElementById('alarmBadge').style.display = 'flex';
  document.getElementById('dismissBtn').style.display = 'inline-block';
  document.getElementById('setAlarmBtn').textContent = 'Güncelle';
}

function dismissAlarm() {
  stopJingle();
  alarmTriggered = false;
  document.getElementById('alarmOverlay').classList.remove('show');
  document.getElementById('pulseRing').classList.remove('active');
}

function triggerAlarm() {
  alarmTriggered = true;
  document.getElementById('alarmOverlay').classList.add('show');
  document.getElementById('pulseRing').classList.add('active');
  startJingleLoop();
  launchConfetti();
}

/* ────────────────────────────────────────────
   CONFETTI
────────────────────────────────────────────── */
function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';
  const COLORS = ['#E31837', '#006491', '#ffffff', '#FFD700', '#E31837', '#006491'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.2 + Math.random() * 1.5}s;
      animation-delay: ${Math.random() * 0.6}s;
    `;
    container.appendChild(el);
  }
}

/* ────────────────────────────────────────────
   PIZZA DRAWING UTILITIES
────────────────────────────────────────────── */
const SLICE_COLORS = ['#d4a84b', '#c99a3e', '#d4a84b', '#c99a3e', '#d4a84b', '#c99a3e', '#d4a84b', '#c99a3e'];

function drawPizzaBase(ctx, cx, cy, r) {
  const n = 8;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#c8874a'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(14, r * 0.095);
  ctx.strokeStyle = '#b0743c'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,200,120,0.2)'; ctx.stroke();

  for (let i = 0; i < n; i++) {
    const sa = (i / n) * Math.PI * 2 - Math.PI / 2;
    const ea = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 12, sa, ea); ctx.closePath();
    ctx.fillStyle = SLICE_COLORS[i]; ctx.fill();
    ctx.strokeStyle = 'rgba(140,70,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  }
  const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.45);
  gr.addColorStop(0, 'rgba(180,30,10,0.22)');
  gr.addColorStop(1, 'rgba(180,30,10,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();
}

const SCALE_BASE = 230; // original design radius
function normToScale(r) { return r / SCALE_BASE; }

function drawToppings(ctx, cx, cy, r) {
  const s = normToScale(r);
  const TOPS = [
    { type: 'pepperoni', x: 0.25, y: -0.55 },
    { type: 'pepperoni', x: -0.42, y: -0.35 },
    { type: 'pepperoni', x: 0.55, y: 0.18 },
    { type: 'pepperoni', x: -0.15, y: 0.52 },
    { type: 'pepperoni', x: 0.15, y: 0.15 },
    { type: 'pepperoni', x: -0.55, y: 0.28 },
    { type: 'pepperoni', x: 0.38, y: -0.18 },
    { type: 'pepperoni', x: -0.2, y: -0.22 },
    { type: 'olive', x: -0.38, y: 0.52 },
    { type: 'olive', x: 0.52, y: -0.38 },
    { type: 'pepper', x: 0.05, y: -0.38, angle: 30 },
    { type: 'pepper', x: -0.28, y: 0.1, angle: -45 },
    { type: 'pepper', x: 0.42, y: 0.42, angle: 70 },
  ];

  TOPS.forEach(t => {
    const px = cx + t.x * (r - 22);
    const py = cy + t.y * (r - 22);

    if (t.type === 'pepperoni') {
      const pr = 18 * s;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      const pg = ctx.createRadialGradient(px - 3 * s, py - 3 * s, 1, px, py, pr);
      pg.addColorStop(0, '#c0392b'); pg.addColorStop(1, '#7b0c07');
      ctx.fillStyle = pg; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        ctx.beginPath(); ctx.arc(px + Math.cos(a) * 9 * s, py + Math.sin(a) * 9 * s, 2.2 * s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,160,140,0.45)'; ctx.fill();
      }
    } else if (t.type === 'olive') {
      const or = 11 * s;
      ctx.beginPath(); ctx.arc(px, py, or, 0, Math.PI * 2);
      ctx.fillStyle = '#2d2d1e'; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, 4 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#c8874a'; ctx.fill();
    } else if (t.type === 'pepper') {
      const rad = (t.angle || 0) * Math.PI / 180;
      const pw = 36 * s, ph = 10 * s, pr = 5 * s;
      ctx.save(); ctx.translate(px, py); ctx.rotate(rad);
      ctx.beginPath();
      ctx.moveTo(-pw / 2 + pr, -ph / 2);
      ctx.lineTo(pw / 2 - pr, -ph / 2); ctx.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + pr);
      ctx.lineTo(pw / 2, ph / 2 - pr); ctx.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - pr, ph / 2);
      ctx.lineTo(-pw / 2 + pr, ph / 2); ctx.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - pr);
      ctx.lineTo(-pw / 2, -ph / 2 + pr); ctx.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + pr, -ph / 2);
      ctx.closePath();
      ctx.fillStyle = '#3aaa35'; ctx.fill();
      ctx.strokeStyle = '#2d8428'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
  });
}

function drawMarkers(ctx, cx, cy, r) {
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2 - Math.PI / 2;
    const main = i % 3 === 0;
    const len = (main ? 20 : 12) * normToScale(r);
    const wid = main ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (r - 20), cy + Math.sin(angle) * (r - 20));
    ctx.lineTo(cx + Math.cos(angle) * (r - 20 - len), cy + Math.sin(angle) * (r - 20 - len));
    ctx.strokeStyle = main ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = wid; ctx.lineCap = 'round'; ctx.stroke();
  }
  // Numbers
  const labels = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const fsize = Math.max(11, 17 * normToScale(r));
  ctx.save();
  ctx.font = `bold ${fsize}px Nunito, Open Sans, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 3;
  labels.forEach((lbl, i) => {
    const angle = i / 12 * Math.PI * 2 - Math.PI / 2;
    const dist = r - 50 * normToScale(r);
    ctx.fillText(lbl, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
  });
  ctx.restore();
}

function drawHand(ctx, cx, cy, angle, length, width, color, shadow) {
  const x = cx + Math.cos(angle) * length;
  const y = cy + Math.sin(angle) * length;
  const bx = cx - Math.cos(angle) * 18;
  const by = cy - Math.sin(angle) * 18;
  ctx.save();
  ctx.shadowColor = shadow; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.stroke(); ctx.restore();
}

function drawDominoCenter(ctx, cx, cy, r) {
  const scale = normToScale(r);
  const TW = 54 * scale, TH = 30 * scale, TR = 4 * scale;
  const TX = cx - TW / 2, TY = cy - TH / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 10;

  // Blue half
  ctx.beginPath();
  ctx.moveTo(TX + TR, TY); ctx.lineTo(TX + TW / 2, TY);
  ctx.lineTo(TX + TW / 2, TY + TH); ctx.lineTo(TX + TR, TY + TH);
  ctx.quadraticCurveTo(TX, TY + TH, TX, TY + TH - TR);
  ctx.lineTo(TX, TY + TR); ctx.quadraticCurveTo(TX, TY, TX + TR, TY);
  ctx.closePath(); ctx.fillStyle = '#006491'; ctx.fill();

  // Red half
  ctx.beginPath();
  ctx.moveTo(TX + TW / 2, TY); ctx.lineTo(TX + TW - TR, TY);
  ctx.quadraticCurveTo(TX + TW, TY, TX + TW, TY + TR);
  ctx.lineTo(TX + TW, TY + TH - TR);
  ctx.quadraticCurveTo(TX + TW, TY + TH, TX + TW - TR, TY + TH);
  ctx.lineTo(TX + TW / 2, TY + TH); ctx.closePath();
  ctx.fillStyle = '#E31837'; ctx.fill();
  ctx.shadowBlur = 0;

  // Dots — blue side (2)
  const BX = cx - TW / 4;
  [cy - 7 * scale, cy + 7 * scale].forEach(dotY => {
    ctx.beginPath(); ctx.arc(BX, dotY, 4.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'white'; ctx.fill();
  });
  // Dot — red side (1)
  ctx.beginPath(); ctx.arc(cx + TW / 4, cy, 5.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'white'; ctx.fill();

  // Divider
  ctx.beginPath();
  ctx.moveTo(cx, TY + 3); ctx.lineTo(cx, TY + TH - 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.restore();
}

/* ────────────────────────────────────────────
   DRAW SINGLE CLOCK FRAME
────────────────────────────────────────────── */
function renderClock(ctx, cx, cy, r, now) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hour = (now.getHours() % 12) + min / 60;

  ctx.clearRect(cx - r - 30, cy - r - 30, (r + 30) * 2, (r + 30) * 2);

  drawPizzaBase(ctx, cx, cy, r);
  drawToppings(ctx, cx, cy, r);
  drawMarkers(ctx, cx, cy, r);

  // Hour — Red #E31837
  drawHand(ctx, cx, cy, hour / 12 * Math.PI * 2 - Math.PI / 2, r * 0.52, 10 * normToScale(r), '#E31837', 'rgba(227,24,55,0.75)');
  // Minute — Blue #006491
  drawHand(ctx, cx, cy, min / 60 * Math.PI * 2 - Math.PI / 2, r * 0.73, 7 * normToScale(r), '#006491', 'rgba(0,100,145,0.65)');
  // Second — White
  drawHand(ctx, cx, cy, sec / 60 * Math.PI * 2 - Math.PI / 2, r * 0.83, 2.5 * normToScale(r), '#ffffff', 'rgba(255,255,255,0.7)');

  drawDominoCenter(ctx, cx, cy, r);
}

/* ────────────────────────────────────────────
   NOON COUNTDOWN
────────────────────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }

function getNoonCountdown(now) {
  let noon = new Date(now);
  noon.setHours(12, 0, 0, 0);
  if (now >= noon) {
    // next day noon
    noon.setDate(noon.getDate() + 1);
  }
  const diff = Math.max(0, noon - now);
  const hh = Math.floor(diff / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  return { hh, mm, ss, diff };
}

/* ────────────────────────────────────────────
   MAIN LOOP
────────────────────────────────────────────── */
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function tick() {
  const now = new Date();

  // ── Render canvases ──
  if (mainCtx) {
    mainCtx.clearRect(0, 0, MW, MH);
    renderClock(mainCtx, MCX, MCY, MR, now);
  }
  if (heroCtx) {
    heroCtx.clearRect(0, 0, HW, HH);
    renderClock(heroCtx, HCX, HCY, HR, now);
  }

  // ── Digital time ──
  const el = document.getElementById('digitalTime');
  if (el) el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // ── Date ──
  const dateEl = document.getElementById('digitalDate');
  if (dateEl) {
    dateEl.textContent = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`.toUpperCase();
  }

  // ── Noon countdown ──
  const { hh, mm, ss, diff } = getNoonCountdown(now);
  const cdTime = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;

  const cdEl = document.getElementById('countdownTime');
  const cdSub = document.getElementById('countdownSub');
  const hcEl = document.getElementById('heroCountdown');

  if (hcEl) hcEl.textContent = cdTime;
  if (cdEl) {
    if (diff === 0) {
      cdEl.textContent = 'ŞIMDI!';
      if (cdSub) cdSub.textContent = '🍕 Pizza zamanı!';
    } else {
      cdEl.textContent = cdTime;
      if (cdSub) {
        const isToday = new Date().getHours() < 12;
        cdSub.textContent = isToday ? 'Bugün öğlene kalan ⏱️' : 'Yarın öğlene kalan ⏱️';
      }
    }
  }

  // ── Alarm check ──
  if (alarmActive && !alarmTriggered) {
    if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute && now.getSeconds() === 0) {
      triggerAlarm();
    }
  }

  requestAnimationFrame(tick);
}

/* ────────────────────────────────────────────
   ALARM INPUT SYNC
────────────────────────────────────────────── */
['alarmHour', 'alarmMinute'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => {
    const h = parseInt(document.getElementById('alarmHour').value) || 0;
    const m = parseInt(document.getElementById('alarmMinute').value) || 0;
  });
});

/* ────────────────────────────────────────────
   INIT
────────────────────────────────────────────── */
tick();
