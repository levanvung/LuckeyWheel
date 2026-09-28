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

function drawWheel() {
  const n = prizes.length;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = 190;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i=0;i<n;i++) {
    const a0 = rotation + i * 2*Math.PI/n;
    const a1 = rotation + (i+1) * 2*Math.PI/n;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a0,a1); ctx.closePath();
    ctx.fillStyle = i%2 ? "#ffcf33" : "#ff6b35"; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.stroke();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate((a0+a1)/2);
    ctx.textAlign="right"; ctx.fillStyle="#fff"; ctx.font="bold 16px Arial";
    let label = prizes[i].replace(/[🎁😄]/g,"").trim();
    if (label.length > 20) label = label.slice(0,20)+"…";
    ctx.fillText(label, r-12, 6);
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx,cy,28,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fillStyle="#6f1ab6"; ctx.fill();
}

drawWheel();

function normalize(s){return s.trim().replace(/\s+/g," ");}

async function spin() {
  if (spinning) return;
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
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra.");

    const targetIndex = data.index;
    const n = prizes.length;
    const segment = 2*Math.PI/n;
    // Pointer is at -PI/2. Make the selected segment center land there.
    const targetAngle = -Math.PI/2 - (targetIndex + 0.5)*segment;
    const current = rotation % (2*Math.PI);
    let delta = targetAngle - current;
    while (delta < 0) delta += 2*Math.PI;
    const finalRotation = rotation + 6*2*Math.PI + delta;
    const start = rotation;
    const duration = 4200;
    const t0 = performance.now();

    function animate(now){
      const p = Math.min(1,(now-t0)/duration);
      const ease = 1-Math.pow(1-p,4);
      rotation = start + (finalRotation-start)*ease;
      drawWheel();
      if(p<1) requestAnimationFrame(animate);
      else{
        rotation = finalRotation;
        drawWheel();
        statusEl.textContent = "Hoàn tất!";
        resultEl.textContent = "🎉 " + data.prize;
        spinning = false;
      }
    }
    requestAnimationFrame(animate);
  } catch(e) {
    statusEl.textContent = "❌ " + e.message;
    spinning = false; spinBtn.disabled = false;
  }
}

spinBtn.addEventListener("click", spin);
nameInput.addEventListener("keydown", e => { if(e.key==="Enter") spin(); });