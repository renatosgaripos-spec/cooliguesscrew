/* =====================================================================
   COOL I GUESS CREW — app logic
   - voting (localStorage, works on GitHub Pages with no backend)
   - leaderboard + MTV TRL countdown
   ===================================================================== */

const LS_KEY = "cigc_votes_v1";
const LS_SEEN = "cigc_lastrank_v1";

/* ---- vote storage ---- */
function loadVotes(){
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){}
  // merge baseline votes from data.js with stored deltas
  const out = {};
  COLLECTION.forEach(it => { out[it.id] = (it.votes||0) + (stored[it.id]||0); });
  return out;
}
function addVote(id){
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){}
  stored[id] = (stored[id]||0) + 1;
  localStorage.setItem(LS_KEY, JSON.stringify(stored));
}
function scoredSorted(){
  const v = loadVotes();
  return COLLECTION
    .map(it => ({ ...it, count: v[it.id] }))
    .sort((a,b) => b.count - a.count || a.title.localeCompare(b.title));
}

/* ---- placeholder / image helper ---- */
function picMarkup(item, cls){
  if (item.src){
    return `<img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async">`;
  }
  // fallback if an image is ever missing
  const tint = item.tint || "#d9d3e8";
  if (cls === "mini"){
    return `<div class="mini" style="background:${tint}">★</div>`;
  }
  return `<div class="ph" style="background:${tint}">
            <div class="big">★</div>
            <div>${item.title}</div>
            <div class="id">${item.id}</div>
          </div>`;
}

/* ---- menubar clock ---- */
function tickClock(){
  const el = document.getElementById("clock");
  if(!el) return;
  const d = new Date();
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2,"0");
  const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  el.textContent = `${h}:${m} ${ap}`;
}

/* =====================================================================
   INDEX PAGE
   ===================================================================== */
let currentPair = [];

function pickPair(){
  if (COLLECTION.length < 2) return [];
  let a = Math.floor(Math.random()*COLLECTION.length);
  let b = a;
  while (b === a) b = Math.floor(Math.random()*COLLECTION.length);
  return [COLLECTION[a], COLLECTION[b]];
}

function renderVS(){
  const wrap = document.getElementById("vs");
  if(!wrap) return;
  currentPair = pickPair();
  const [a,b] = currentPair;
  wrap.innerHTML = `
    ${pickCard(a)}
    <div class="vs-bolt">VS</div>
    ${pickCard(b)}
  `;
  wrap.querySelectorAll(".pick").forEach(btn=>{
    btn.addEventListener("click", ()=> castVote(btn.dataset.id));
  });
}
function pickCard(item){
  return `<button class="pick" data-id="${item.id}">
            <div class="frame">${picMarkup(item)}</div>
            <div class="label">${item.title}</div>
            <div class="pickbtn">pick me!</div>
          </button>`;
}

function castVote(id){
  addVote(id);
  const item = COLLECTION.find(i=>i.id===id);
  showToast(`✓ голос за "${item.title}"`);
  renderBoard();
  renderVS();
}

let toastTimer;
function showToast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast"; t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove("show"), 1600);
}

function renderBoard(){
  const ul = document.getElementById("board");
  if(!ul) return;
  const ranked = scoredSorted();
  const max = Math.max(1, ranked[0]?.count || 1);
  ul.innerHTML = ranked.slice(0,8).map((it,i)=>{
    const pct = Math.round((it.count/max)*100);
    return `<li class="row ${i===0?"top1":""}">
      <div class="rank">${i+1}</div>
      <div class="thumb">${picMarkup(it,"mini")}</div>
      <div class="meta">
        <div class="name">${it.title}</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="count">${it.count} ♥</div>
    </li>`;
  }).join("");
}

/* =====================================================================
   COUNTDOWN PAGE (MTV TRL)
   ===================================================================== */
const COUNTDOWN_TOP = 100; // показываем верхушку чарта, а не все 2000

function renderCountdown(){
  const body = document.getElementById("trl-body");
  if(!body) return;
  const ranked = scoredSorted().slice(0, COUNTDOWN_TOP);

  // movement vs last visit (just for flavor)
  let last = {};
  try { last = JSON.parse(localStorage.getItem(LS_SEEN)) || {}; } catch(e){}
  const moveFor = (id, idx) => {
    const prev = last[id];
    if (prev === undefined) return `<span style="color:#ffd23f">NEW</span>`;
    const diff = prev - idx;
    if (diff > 0) return `▲ ${diff}`;
    if (diff < 0) return `▼ ${Math.abs(diff)}`;
    return `= hold`;
  };

  body.innerHTML = ranked.map((it,i)=>`
    <div class="crow ${i===0?"n1":""}">
      <div class="num">${i+1}</div>
      <div class="pic">${picMarkup(it,"mini")}</div>
      <div class="info">
        <div class="t">${it.title}</div>
        <div class="v">${it.count} votes</div>
      </div>
      <div class="move">${moveFor(it.id,i)}</div>
    </div>
  `).join("");

  // save current ranking for next visit
  const snap = {}; ranked.forEach((it,i)=> snap[it.id]=i);
  localStorage.setItem(LS_SEEN, JSON.stringify(snap));
}

/* ---- boot ---- */
document.addEventListener("DOMContentLoaded", ()=>{
  tickClock(); setInterval(tickClock, 10000);
  renderVS();
  renderBoard();
  renderCountdown();
});
