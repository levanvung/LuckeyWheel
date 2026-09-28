let token = "";

const login = document.getElementById("login");
const dashboard = document.getElementById("dashboard");
const password = document.getElementById("password");
const status = document.getElementById("loginStatus");

document.getElementById("loginBtn").onclick = async () => {
  token = password.value;
  if (!token) return;
  await load();
};

document.getElementById("refreshBtn").onclick = load;

async function load(){
  status.textContent = "Đang kiểm tra...";
  const r = await fetch("/api/results", {
    headers: {Authorization:"Bearer " + token}
  });
  const data = await r.json();
  if(!r.ok){
    status.textContent = "❌ " + (data.error || "Không thể đăng nhập.");
    return;
  }
  login.classList.add("hidden");
  dashboard.classList.remove("hidden");
  document.getElementById("count").textContent = `Tổng số lượt: ${data.length}`;
  document.getElementById("rows").innerHTML = data.map((x,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${escapeHtml(x.name)}</td>
      <td>${escapeHtml(x.prize)}</td>
      <td>${new Date(x.createdAt).toLocaleString("vi-VN")}</td>
    </tr>
  `).join("");
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
password.addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("loginBtn").click()});