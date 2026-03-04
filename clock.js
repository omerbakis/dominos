/* =============================================
   DOMINO'S PIZZA CLOCK - clock.js
   ============================================= */

const canvas = document.getElementById('clockCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const CX = W / 2;
const CY = H / 2;
const R  = 230; // pizza radius

// ---- Alarm state ----
let alarmHour   = 12;
let alarmMinute = 0;
let alarmActive = false;
let alarmTriggered = false;
let alarmAudio  = null;

// ---- Audio context for beeps ----
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playAlarmSound() {
  const ctx = getAudioCtx();
  // Play a joyful ascending melody resembling a pizza jingle
  const melody = [
    { freq: 523.25, dur: 0.15 }, // C5
    { freq: 659.25, dur: 0.15 }, // E5
    { freq: 783.99, dur: 0.15 }, // G5
    { freq: 1046.5, dur: 0.25 }, // C6
    { freq: 783.99, dur: 0.1  }, // G5
    { freq: 1046.5, dur: 0.35 }, // C6
  ];
  let t = ctx.currentTime + 0.05;
  melody.forEach(note => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, t);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur * 0.9);
    osc.start(t);
    osc.stop(t + note.dur);
    t += note.dur + 0.03;
  });
}

function startAlarmLoop() {
  playAlarmSound();
  if (!alarmTriggered) return;
  alarmAudio = setTimeout(startAlarmLoop, 2200);
}

function stopAlarmSound() {
  if (alarmAudio) { clearTimeout(alarmAudio); alarmAudio = null; }
}

// ---- Alarm control ----
function setAlarm() {
  const h = parseInt(document.getElementById('alarmHour').value);
  const m = parseInt(document.getElementById('alarmMinute').value);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    alert('Geçerli bir saat girin!');
    return;
  }
  alarmHour   = h;
  alarmMinute = m;
  alarmActive = true;
  alarmTriggered = false;

  const label = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  document.getElementById('alarmLabel').textContent = `Öğle Alarmı: ${label}`;
  document.getElementById('alarmBadge').style.display = 'block';
  document.getElementById('dismissBtn').style.display = 'inline-block';
  document.getElementById('setAlarmBtn').textContent = 'Güncelle';
}

function dismissAlarm() {
  stopAlarmSound();
  alarmTriggered = false;
  document.getElementById('alarmOverlay').classList.remove('show');
  document.getElementById('pulseRing').classList.remove('active');
}

// ---- Pizza slices colors ----
const SLICE_COLORS = [
  '#d4a84b', '#c99a3e', '#d4a84b', '#c99a3e',
  '#d4a84b', '#c99a3e', '#d4a84b', '#c99a3e',
];

// ---- Topping positions (normalized -1..1) ----
const TOPPINGS = [
  // Pepperoni (circles)
  { type: 'pepperoni', x: 0.25,  y: -0.55 },
  { type: 'pepperoni', x: -0.42, y: -0.35 },
  { type: 'pepperoni', x: 0.55,  y: 0.18  },
  { type: 'pepperoni', x: -0.15, y: 0.52  },
  { type: 'pepperoni', x: 0.15,  y: 0.15  },
  { type: 'pepperoni', x: -0.55, y: 0.28  },
  { type: 'pepperoni', x: 0.38,  y: -0.18 },
  { type: 'pepperoni', x: -0.2,  y: -0.22 },
  // Olives
  { type: 'olive', x: -0.38, y: 0.52  },
  { type: 'olive', x: 0.52,  y: -0.38 },
  // Bell pepper strips
  { type: 'pepper', x: 0.05,  y: -0.38, angle: 30  },
  { type: 'pepper', x: -0.28, y: 0.1,  angle: -45 },
  { type: 'pepper', x: 0.42,  y: 0.42, angle: 70  },
];

// ---- Hand configs ----
const HAND = {
  hour: {
    length: R * 0.52, width: 10,
    color: '#ff2244', shadow: 'rgba(255,30,60,0.7)',
  },
  minute: {
    length: R * 0.72, width: 7,
    color: '#fff',    shadow: 'rgba(255,255,255,0.5)',
  },
  second: {
    length: R * 0.82, width: 3,
    color: '#F5A623', shadow: 'rgba(245,166,35,0.9)',
  },
};

// ---- Helper: draw rounded rect ----
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---- Draw pizza base ----
function drawPizzaBase() {
  const nSlices = 8;
  // Outer crust
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.fillStyle = '#c8874a';
  ctx.fill();

  // Crust texture ring
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#b0743c';
  ctx.stroke();

  // Crust highlight
  ctx.beginPath();
  ctx.arc(CX, CY, R - 3, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,200,120,0.25)';
  ctx.stroke();

  // Pizza slices background (cheese)
  for (let i = 0; i < nSlices; i++) {
    const startAngle = (i / nSlices) * Math.PI * 2 - Math.PI / 2;
    const endAngle   = ((i + 1) / nSlices) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R - 14, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = SLICE_COLORS[i];
    ctx.fill();
    // Slice dividers
    ctx.strokeStyle = 'rgba(150,80,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Tomato sauce pool in center area
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.4);
  grad.addColorStop(0,   'rgba(180,30,10,0.25)');
  grad.addColorStop(0.7, 'rgba(180,30,10,0.1)');
  grad.addColorStop(1,   'rgba(180,30,10,0)');
  ctx.beginPath();
  ctx.arc(CX, CY, R - 14, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

// ---- Draw toppings ----
function drawToppings() {
  TOPPINGS.forEach(t => {
    const px = CX + t.x * (R - 30);
    const py = CY + t.y * (R - 30);

    if (t.type === 'pepperoni') {
      // Pepperoni disc
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      const pg = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, 18);
      pg.addColorStop(0, '#c0392b');
      pg.addColorStop(1, '#7b0c07');
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Fat spots on pepperoni
      for (let i = 0; i < 5; i++) {
        const a  = (i / 5) * Math.PI * 2;
        const sx = px + Math.cos(a) * 9;
        const sy = py + Math.sin(a) * 9;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,180,160,0.5)';
        ctx.fill();
      }
    } else if (t.type === 'olive') {
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#2d2d1e';
      ctx.fill();
      // Olive hole
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#c8874a';
      ctx.fill();
    } else if (t.type === 'pepper') {
      const rad = (t.angle || 0) * Math.PI / 180;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rad);
      roundRect(ctx, -18, -5, 36, 10, 5);
      ctx.fillStyle = '#3aaa35';
      ctx.fill();
      ctx.strokeStyle = '#2d8428';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  });
}

// ---- Draw hour markers ----
function drawMarkers() {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMain = i % 3 === 0;
    const len  = isMain ? 22 : 14;
    const wid  = isMain ? 4  : 2;
    const x1 = CX + Math.cos(angle) * (R - 24);
    const y1 = CY + Math.sin(angle) * (R - 24);
    const x2 = CX + Math.cos(angle) * (R - 24 - len);
    const y2 = CY + Math.sin(angle) * (R - 24 - len);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isMain ? '#fff' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = wid;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // 12 numeric labels (Domino's style - dots pattern)
  const labels = ['12','1','2','3','4','5','6','7','8','9','10','11'];
  ctx.save();
  ctx.font = 'bold 18px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  labels.forEach((lbl, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const tx = CX + Math.cos(angle) * (R - 55);
    const ty = CY + Math.sin(angle) * (R - 55);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(lbl, tx, ty);
  });
  ctx.restore();
}

// ---- Draw a clock hand ----
function drawHand(angle, cfg) {
  const x = CX + Math.cos(angle) * cfg.length;
  const y = CY + Math.sin(angle) * cfg.length;
  // Back nub
  const bx = CX - Math.cos(angle) * 20;
  const by = CY - Math.sin(angle) * 20;

  ctx.save();
  ctx.shadowColor = cfg.shadow;
  ctx.shadowBlur  = 12;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(x, y);
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth   = cfg.width;
  ctx.lineCap     = 'round';
  ctx.stroke();
  ctx.restore();
}

// ---- Draw center cap ---- 
function drawCenter() {
  // Domino's dot / center cap
  const cg = ctx.createRadialGradient(CX - 3, CY - 3, 1, CX, CY, 16);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(1, '#E31837');
  ctx.beginPath();
  ctx.arc(CX, CY, 14, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.shadowColor = 'rgba(227,24,55,0.8)';
  ctx.shadowBlur  = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Two dominos dots
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(CX, CY, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Main draw loop ----
function draw() {
  const now  = new Date();
  const sec  = now.getSeconds() + now.getMilliseconds() / 1000;
  const min  = now.getMinutes() + sec / 60;
  const hour = (now.getHours() % 12) + min / 60;

  ctx.clearRect(0, 0, W, H);

  // Draw pizza base
  drawPizzaBase();
  drawToppings();
  drawMarkers();

  // Hour hand
  drawHand((hour / 12) * Math.PI * 2 - Math.PI / 2, HAND.hour);
  // Minute hand
  drawHand((min  / 60) * Math.PI * 2 - Math.PI / 2, HAND.minute);
  // Second hand
  drawHand((sec  / 60) * Math.PI * 2 - Math.PI / 2, HAND.second);

  drawCenter();

  // ---- Update digital display ----
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('digitalTime').textContent = `${hh}:${mm}:${ss}`;

  // ---- Date ----
  const DAYS = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  document.getElementById('digitalDate').textContent =
    `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // ---- Alarm check ----
  if (alarmActive && !alarmTriggered) {
    if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute && now.getSeconds() === 0) {
      triggerAlarm();
    }
  }

  requestAnimationFrame(draw);
}

function triggerAlarm() {
  alarmTriggered = true;
  document.getElementById('alarmOverlay').classList.add('show');
  document.getElementById('pulseRing').classList.add('active');
  startAlarmLoop();
}

// ---- Background particles ----
function createParticles() {
  const container = document.getElementById('particles');
  const emojis = ['🍕','🍅','🧀','🫒','🌶️'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = 14 + Math.random() * 22;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      bottom:${-10 + Math.random()*10}%;
      font-size:${size}px;
      animation-duration:${8 + Math.random()*14}s;
      animation-delay:${Math.random()*12}s;
      border-radius:50%;
      background:transparent;
      display:flex; align-items:center; justify-content:center;
      opacity:0.15;
    `;
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    container.appendChild(el);
  }
}

// ---- Alarm input sync ----
document.getElementById('alarmHour').addEventListener('input', () => {
  const h = parseInt(document.getElementById('alarmHour').value);
  const m = parseInt(document.getElementById('alarmMinute').value);
  const label = `${String(h||0).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;
  document.getElementById('alarmLabel').textContent = `Öğle Alarmı: ${label}`;
});
document.getElementById('alarmMinute').addEventListener('input', () => {
  const h = parseInt(document.getElementById('alarmHour').value);
  const m = parseInt(document.getElementById('alarmMinute').value);
  const label = `${String(h||0).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`;
  document.getElementById('alarmLabel').textContent = `Öğle Alarmı: ${label}`;
});

// ---- Init ----
createParticles();
draw();
