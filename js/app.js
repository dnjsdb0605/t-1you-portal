const state = {
  sites: [],
  q: "",
  cat: "전체",
  favOnly: false,
  favs: new Set(JSON.parse(localStorage.getItem("school-favs") || "[]")),
  dark: localStorage.getItem("school-theme") || "light",
};

const $ = (s) => document.querySelector(s);

function faviconURL(u) {
  try {
    const d = new URL(u).hostname;
    return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  } catch { return ""; }
}

function saveFavs() {
  localStorage.setItem("school-favs", JSON.stringify([...state.favs]));
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  return state.sites.filter((s) => {
    if (state.cat !== "전체" && s.category !== state.cat) return false;
    if (state.favOnly && !state.favs.has(s.id)) return false;
    if (!q) return true;
    return (s.name + " " + s.desc + " " + (s.tags || []).join(" ")).toLowerCase().includes(q);
  });
}

function renderCats() {
  const cats = ["전체", ...new Set(state.sites.map((s) => s.category))];
  const box = $("#cats");
  box.innerHTML = "";
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "btn" + (state.cat === c ? " active" : "");
    b.textContent = c;
    b.onclick = () => { state.cat = c; render(); };
    box.appendChild(b);
  });
}

function cardEl(s) {
  const div = document.createElement("div");
  div.className = "card";
  const fav = faviconURL(s.url);
  const initial = s.name.trim()[0] || "S";
  const isFav = state.favs.has(s.id);
  div.innerHTML = `
    <div class="favicon">${fav ? `<img src="${fav}" alt="" loading="lazy" onerror="this.remove()">` : ""}<span>${initial}</span></div>
    <div class="card-body">
      <div class="card-name"><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></div>
      <div class="card-desc">${s.desc || ""}</div>
      <div class="card-meta">
        <span class="badge">${s.category}</span>
        <a class="open" href="${s.url}" target="_blank" rel="noopener">바로가기 ↗</a>
      </div>
    </div>`;
  const star = document.createElement("button");
  star.className = "star" + (isFav ? " on" : "");
  star.title = isFav ? "즐겨찾기 해제" : "즐겨찾기 추가";
  star.textContent = isFav ? "★" : "☆";
  star.onclick = () => {
    if (state.favs.has(s.id)) state.favs.delete(s.id);
    else state.favs.add(s.id);
    saveFavs();
    render();
  };
  div.prepend(star);
  // favicon span 숨기기 (이미지 로드 성공 시)
  const img = div.querySelector("img");
  if (img) img.addEventListener("load", () => { const sp = div.querySelector(".favicon span"); if (sp) sp.style.display = "none"; });
  return div;
}

function render() {
  document.documentElement.dataset.theme = state.dark;
  $("#themeBtn").textContent = state.dark === "dark" ? "☀️ 라이트" : "🌙 다크";
  $("#favBtn").classList.toggle("active", state.favOnly);
  renderCats();
  const list = filtered();
  $("#count").textContent = `총 ${state.sites.length}개 · 표시 ${list.length}개 · 즐겨찾기 ${state.favs.size}개`;

  const wrap = $("#sections");
  wrap.innerHTML = "";
  if (!list.length) {
    wrap.innerHTML = `<div class="empty">검색 결과가 없습니다. 다른 키워드로 검색하거나 <code>data/sites.json</code>에 사이트를 추가하세요.</div>`;
    return;
  }
  const byCat = {};
  list.forEach((s) => { (byCat[s.category] ||= []).push(s); });
  Object.keys(byCat).sort().forEach((cat) => {
    const h = document.createElement("h2");
    h.className = "section-title";
    h.textContent = `${cat} (${byCat[cat].length})`;
    const g = document.createElement("div");
    g.className = "grid";
    byCat[cat].forEach((s) => g.appendChild(cardEl(s)));
    wrap.append(h, g);
  });
}

async function init() {
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#favBtn").onclick = () => { state.favOnly = !state.favOnly; render(); };
  $("#themeBtn").onclick = () => {
    state.dark = state.dark === "dark" ? "light" : "dark";
    localStorage.setItem("school-theme", state.dark);
    render();
  };
  $("#resetBtn").onclick = () => {
    state.q = ""; state.cat = "전체"; state.favOnly = false;
    $("#q").value = "";
    render();
  };
  try {
    const res = await fetch("data/sites.json");
    state.sites = await res.json();
  } catch (e) {
    $("#sections").innerHTML = `<div class="empty">data/sites.json을 불러오지 못했습니다. 파일을 확인하세요.</div>`;
    return;
  }
  render();
}
init();
