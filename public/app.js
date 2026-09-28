const prizes = [
  "DIP",
  "SMT",
  "SMT",
  "SMT",
  "FINAL"
];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("name");
const spinBtn = document.getElementById("spinBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

let rotation = 0;
let spinning = false;

// Audio setup
const applauseAudio = new Audio("/applause.mp3");
applauseAudio.preload = "auto";

function playApplause() {
  try {
    applauseAudio.currentTime = 0;
    const playPromise = applauseAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => playSynthApplause());
    }
  } catch (e) {
    playSynthApplause();
  }
}

// Fallback synthesizer using Web Audio API in case mp3 is blocked
function playSynthApplause() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const actx = new AudioCtx();
    if (actx.state === "suspended") actx.resume();
    for (let i = 0; i < 35; i++) {
      setTimeout(() => {
        const dur = 0.08;
        const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * dur), actx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (data.length * 0.3));
        }
        const src = actx.createBufferSource();
        src.buffer = buf;
        const flt = actx.createBiquadFilter();
        flt.type = "bandpass";
        flt.frequency.value = 850 + Math.random() * 650;
        flt.Q.value = 3;
        const gn = actx.createGain();
        gn.gain.value = 0.25 + Math.random() * 0.35;
        src.connect(flt);
        flt.connect(gn);
        gn.connect(actx.destination);
        src.start();
      }, i * (45 + Math.random() * 75));
    }
  } catch (err) {}
}

// Unlock audio on initial user interaction
function unlockAudio() {
  try {
    applauseAudio.load();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const dummy = new AudioCtx();
      if (dummy.state === "suspended") dummy.resume();
    }
  } catch (e) {}
}

// Fireworks Engine
const fwCanvas = document.getElementById("fireworksCanvas");
const fwCtx = fwCanvas ? fwCanvas.getContext("2d") : null;
let fwParticles = [];
let fwRunning = false;

function resizeFw() {
  if (!fwCanvas) return;
  fwCanvas.width = window.innerWidth;
  fwCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeFw);
resizeFw();

const CELEBRATION_COLORS = [
  "#ff1744", "#ffea00", "#00e676", "#00e5ff",
  "#d500f9", "#ff9100", "#ffffff", "#ff4081", "#76ff03"
];

function createFireworkSparks(x, y, count = 75) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7.5 + 2.5;
    const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
    fwParticles.push({
      type: "spark",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      alpha: 1,
      decay: Math.random() * 0.016 + 0.012,
      size: Math.random() * 2.8 + 1.6,
      gravity: 0.12,
      friction: 0.95
    });
  }
}

function createRocket(startX, targetY) {
  const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
  fwParticles.push({
    type: "rocket",
    x: startX,
    y: fwCanvas.height,
    vx: (Math.random() - 0.5) * 3,
    vy: -(Math.random() * 4 + 13),
    targetY,
    color
  });
}

function createConfettiCannon(originX, direction) {
  for (let i = 0; i < 45; i++) {
    const angle = direction === "left"
      ? (Math.random() * 0.35 + 0.1) * Math.PI
      : (Math.random() * 0.35 + 0.55) * Math.PI;
    const speed = Math.random() * 12 + 8;
    const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
    fwParticles.push({
      type: "confetti",
      x: originX,
      y: fwCanvas.height * 0.85,
      vx: Math.cos(angle) * speed * (direction === "left" ? 1 : -1),
      vy: -Math.abs(Math.sin(angle) * speed),
      color,
      w: Math.random() * 9 + 6,
      h: Math.random() * 6 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
      decay: Math.random() * 0.007 + 0.005,
      gravity: 0.16,
      friction: 0.96
    });
  }
}

function updateFireworks() {
  if (!fwRunning || !fwCtx) return;
  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);

  for (let i = fwParticles.length - 1; i >= 0; i--) {
    const p = fwParticles[i];

    if (p.type === "rocket") {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;

      fwCtx.fillStyle = p.color;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      fwCtx.fill();

      if (p.vy >= -1 || p.y <= p.targetY) {
        createFireworkSparks(p.x, p.y, 80);
        fwParticles.splice(i, 1);
      }
    } else if (p.type === "spark") {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.friction;
      p.vy = p.vy * p.friction + p.gravity;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        fwParticles.splice(i, 1);
      } else {
        fwCtx.save();
        fwCtx.globalAlpha = Math.max(0, p.alpha);
        fwCtx.fillStyle = p.color;
        fwCtx.shadowBlur = 8;
        fwCtx.shadowColor = p.color;
        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fwCtx.fill();
        fwCtx.restore();
      }
    } else if (p.type === "confetti") {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.friction;
      p.vy = p.vy * p.friction + p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > fwCanvas.height + 20) {
        fwParticles.splice(i, 1);
      } else {
        fwCtx.save();
        fwCtx.globalAlpha = Math.max(0, p.alpha);
        fwCtx.translate(p.x, p.y);
        fwCtx.rotate((p.rotation * Math.PI) / 180);
        fwCtx.fillStyle = p.color;
        fwCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        fwCtx.restore();
      }
    }
  }

  if (fwParticles.length > 0) {
    requestAnimationFrame(updateFireworks);
  } else {
    fwRunning = false;
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
  }
}

function triggerFireworks() {
  if (!fwCanvas) return;
  fwRunning = true;

  // Wave 1: Immediate rockets & confetti
  createRocket(fwCanvas.width * 0.3, fwCanvas.height * 0.25);
  createRocket(fwCanvas.width * 0.7, fwCanvas.height * 0.3);
  createConfettiCannon(0, "left");
  createConfettiCannon(fwCanvas.width, "right");

  // Wave 2
  setTimeout(() => {
    createRocket(fwCanvas.width * 0.5, fwCanvas.height * 0.2);
    createRocket(fwCanvas.width * 0.2, fwCanvas.height * 0.35);
  }, 450);

  // Wave 3
  setTimeout(() => {
    createRocket(fwCanvas.width * 0.8, fwCanvas.height * 0.25);
    createConfettiCannon(0, "left");
    createConfettiCannon(fwCanvas.width, "right");
  }, 1000);

  // Wave 4
  setTimeout(() => {
    createFireworkSparks(fwCanvas.width * 0.38, fwCanvas.height * 0.26, 90);
    createFireworkSparks(fwCanvas.width * 0.62, fwCanvas.height * 0.22, 90);
  }, 1600);

  requestAnimationFrame(updateFireworks);
}

function drawWheel() {
  const n = prizes.length;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 190;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < n; i++) {
    const a0 = rotation + i * 2 * Math.PI / n;
    const a1 = rotation + (i + 1) * 2 * Math.PI / n;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath();
    ctx.fillStyle = i % 2 ? "#ffcf33" : "#ff6b35"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((a0 + a1) / 2);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial";
    let label = prizes[i].replace(/[🎁😄]/g, "").trim();
    if (label.length > 20) label = label.slice(0, 20) + "…";
    ctx.fillText(label, r - 12, 6);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fillStyle = "#6f1ab6"; ctx.fill();
}

drawWheel();

function normalize(s) { return s.trim().replace(/\s+/g, " "); }
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

async function spin() {
  if (spinning) return;
  unlockAudio();

  const name = normalize(nameInput.value);
  if (!name) {
    statusEl.textContent = "⚠️ Vui lòng nhập tên trước khi quay.";
    nameInput.focus(); return;
  }

  spinning = true; spinBtn.disabled = true;
  statusEl.textContent = "Đang quay...";
  resultEl.textContent = "";

  try {
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");

    const targetIndex = data.index;
    const n = prizes.length;
    const segment = 2 * Math.PI / n;
    // Pointer is at -PI/2. Make the selected segment center land there.
    const targetAngle = -Math.PI / 2 - (targetIndex + 0.5) * segment;
    const current = rotation % (2 * Math.PI);
    let delta = targetAngle - current;
    while (delta < 0) delta += 2 * Math.PI;
    const finalRotation = rotation + 6 * 2 * Math.PI + delta;
    const start = rotation;
    const duration = 4200;
    const t0 = performance.now();

    function animate(now) {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 4);
      rotation = start + (finalRotation - start) * ease;
      drawWheel();
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        rotation = finalRotation;
        drawWheel();
        statusEl.textContent = "Hoàn tất!";

        const prizeUpper = String(data.prize || "").toUpperCase();
        const isSMT = prizeUpper.includes("SMT");
        const isFinal = prizeUpper.includes("FINAL");

        // Khi quay vào SMT hoặc FINAL: kích hoạt hiệu ứng pháo hoa cùng âm thanh vỗ tay
        if (isSMT || isFinal) {
          triggerFireworks();
          playApplause();
        }

        // Khi quay vào SMT: hiển thị icon nhếch mép
        if (isSMT) {
          resultEl.innerHTML = `<span>🎉 ${escapeHtml(data.prize)}</span><span class="smirk-icon" title="Nhếch mép 😏">😏</span>`;
        } else {
          resultEl.textContent = "🎉 " + data.prize;
        }

        spinning = false;
      }
    }
    requestAnimationFrame(animate);
  } catch (e) {
    statusEl.textContent = "❌ " + e.message;
    spinning = false; spinBtn.disabled = false;
  }
}

spinBtn.addEventListener("click", spin);
nameInput.addEventListener("keydown", e => { if (e.key === "Enter") spin(); });
nameInput.addEventListener("input", () => {
  if (!spinning) spinBtn.disabled = false;
});