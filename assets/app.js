/* =====================================================================
   COOL I GUESS CREW — app logic
   - voting: shared via Cloudflare D1 (/api/*) when available,
     otherwise falls back to localStorage (local preview / pre-setup)
   - leaderboard + MTV TRL countdown
   ===================================================================== */

const LS_KEY = "cigc_votes_v1";
const LS_SEEN = "cigc_lastrank_v1";

/* ---- remote (shared) vote state ---- */
let REMOTE = false;          // true once /api/scores responds "configured"
let remoteScores = {};       // id -> count, from the server

async function fetchScores(){
  try{
    const r = await fetch("/api/scores?top=300", { headers:{ accept:"application/json" } });
    if(!r.ok) throw 0;
    const data = await r.json();
    if(!data || !data.configured) throw 0;
    REMOTE = true;
    remoteScores = {};
    (data.scores || []).forEach(s => { remoteScores[String(s.id)] = s.count; });
    return true;
  }catch(e){
    REMOTE = false;
    return false;
  }
}

/* ---- vote storage (remote-first, localStorage fallback) ---- */
function loadVotes(){
  const out = {};
  if(REMOTE){
    COLLECTION.forEach(it => { out[it.id] = remoteScores[it.id] || 0; });
    return out;
  }
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){}
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
    .sort((a,b) => b.count - a.count || Number(a.id) - Number(b.id));
}

/* ---- placeholder / image helper ---- */
function picMarkup(item, cls, eager){
  if (item.src){
    const load = eager ? `loading="eager" fetchpriority="high"` : `loading="lazy"`;
    return `<img src="${item.src}" alt="${item.title}" ${load} decoding="async">`;
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
let usedUrlPair = false;
let nextPairBuf = null;     // pre-picked + preloaded next matchup

function pickPair(){
  if (COLLECTION.length < 2) return [];
  let a = Math.floor(Math.random()*COLLECTION.length);
  let b = a;
  while (b === a) b = Math.floor(Math.random()*COLLECTION.length);
  return [COLLECTION[a], COLLECTION[b]];
}

// warm the browser cache so the next pair appears instantly
function preloadPair(pair){
  (pair || []).forEach(it => { if(it.src){ const im = new Image(); im.src = it.src; } });
}
function takePair(){
  if(nextPairBuf){ const p = nextPairBuf; nextPairBuf = null; return p; }
  return pickPair();
}

// a shared matchup link can pin a specific pair via ?vs=ID,ID
function pairFromUrl(){
  const raw = new URLSearchParams(location.search).get("vs");
  if(!raw) return null;
  const [x,y] = raw.split(",").map(s => s.trim());
  const a = COLLECTION.find(i => i.id === x);
  const b = COLLECTION.find(i => i.id === y);
  return (a && b && a !== b) ? [a,b] : null;
}

function renderVS(){
  const wrap = document.getElementById("vs");
  if(!wrap) return;

  let fromUrl = null;
  if(!usedUrlPair){ fromUrl = pairFromUrl(); usedUrlPair = true; }
  currentPair = fromUrl || takePair();
  if(fromUrl) showToast("your friend can't decide — help them pick! 👀");

  const [a,b] = currentPair;
  wrap.innerHTML = `
    ${pickCard(a)}
    <div class="vs-bolt">VS</div>
    ${pickCard(b)}
  `;
  wrap.querySelectorAll(".pick").forEach(btn=>{
    btn.addEventListener("click", ()=> castVote(btn.dataset.id));
  });
  renderShare();

  // prepare + preload the next matchup so the next click is instant
  nextPairBuf = pickPair();
  preloadPair(nextPairBuf);
}
function pickCard(item){
  return `<button class="pick" data-id="${item.id}">
            <div class="frame">${picMarkup(item, null, true)}</div>
            <div class="label">${item.title}</div>
            <div class="pickbtn">pick me!</div>
          </button>`;
}

async function castVote(id){
  const [a,b] = currentPair;
  const loser = (a && b) ? (a.id === id ? b.id : a.id) : null;
  const item = COLLECTION.find(i=>i.id===id);

  if(REMOTE){
    // optimistic update, then confirm with the server
    remoteScores[id] = (remoteScores[id] || 0) + 1;
    showToast(`✓ voted for "${item.title}"`);
    renderBoard();
    renderVS();
    try{
      const r = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json", "x-cigc-vote": "1" },
        body: JSON.stringify({ winner: id, loser })
      });
      if(r.ok){
        const d = await r.json();
        if(typeof d.count === "number"){ remoteScores[id] = d.count; renderBoard(); }
      }else if(r.status === 429){
        showToast("whoa, slow down a sec 💤");
      }
    }catch(e){ /* keep the optimistic count */ }
    return;
  }

  // local fallback
  addVote(id);
  showToast(`✓ voted for "${item.title}"`);
  renderBoard();
  renderVS();
}

/* ---- share this matchup ("help me pick") ---- */
function matchupUrl(){
  const [a,b] = currentPair;
  return `${location.origin}${location.pathname}?vs=${a.id},${b.id}`;
}
function shareMatchup(){
  const [a,b] = currentPair;
  const text = "i can't decide which one is cooler... this one or that one?? 👀 come help me pick 👉👈";
  const url = matchupUrl();
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(intent, "_blank", "noopener");
}
async function copyMatchup(){
  try{
    await navigator.clipboard.writeText(matchupUrl());
    showToast("link copied ✓ send it to a friend");
  }catch(e){
    showToast(matchupUrl());
  }
}
function renderShare(){
  const bar = document.getElementById("sharebar");
  if(!bar) return;
  bar.innerHTML = `
    <span class="share-q">can't decide? get a friend:</span>
    <button class="share x" onclick="shareMatchup()">🐦 help me pick — tweet it</button>
    <button class="share" onclick="copyMatchup()">🔗 copy link</button>
  `;
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
const COUNTDOWN_TOP = 100; // show the top of the chart, not all 2000

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
document.addEventListener("DOMContentLoaded", async ()=>{
  tickClock(); setInterval(tickClock, 10000);

  await fetchScores();   // shared votes if the API is live, else localStorage
  renderVS();
  renderBoard();
  renderCountdown();

  // keep the shared top fresh so everyone sees the same ranking
  if(REMOTE){
    setInterval(async ()=>{
      await fetchScores();
      renderBoard();
      renderCountdown();
    }, 25000);
  }
});
