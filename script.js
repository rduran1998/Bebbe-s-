"use strict";

/* ============================================================
   PRODUCTION-STYLE SINGLE-FILE APP
   - No libraries
   - Modular sections
   - Smooth flight butterflies with bezier curves
   - Great defaults + easy personalization
============================================================ */

/* ----------------------------
   DOM helpers
---------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ----------------------------
   Elements
---------------------------- */
const els = {
  herName: $("#herName"),
  signature: $("#signature"),

  statusText: $("#statusText"),
  statusPill: $("#statusPill"),

  progressList: $("#progressList"),

  startCard: $("#startCard"),
  letterCard: $("#letterCard"),
  memoriesCard: $("#memoriesCard"),
  reasonsCard: $("#reasonsCard"),
  askCard: $("#askCard"),
  yayCard: $("#yayCard"),

  startBtn: $("#startBtn"),
  customizeBtn: $("#customizeBtn"),

  letterText: $("#letterText"),
  skipTypingBtn: $("#skipTypingBtn"),
  typingToggleBtn: $("#typingToggleBtn"),
  copyLetterBtn: $("#copyLetterBtn"),

  toMemoriesBtn: $("#toMemoriesBtn"),
  toReasonsBtn: $("#toReasonsBtn"),
  toAskBtn: $("#toAskBtn"),

  backToLetterBtn: $("#backToLetterBtn"),
  backToMemoriesBtn: $("#backToMemoriesBtn"),

  shuffleMemoriesBtn: $("#shuffleMemoriesBtn"),
  memoriesGrid: $("#memoriesGrid"),
  reasonsWrap: $("#reasonsWrap"),

  yesBtn: $("#yesBtn"),
  noBtn: $("#noBtn"),
  tinyHint: $("#tinyHint"),

  finalLine: $("#finalLine"),
  replayBtn: $("#replayBtn"),
  copyLinkBtn: $("#copyLinkBtn"),

  toast: $("#toast"),

  butterfliesLayer: $("#butterflies")
};

/* ----------------------------
   Personalization Config
   (edit these to make it feel real)
---------------------------- */
const CONFIG = {
  herNameDefault: "my love",
  yourSignature: "— (your name)",

  letter: [
    "I don’t know how to say this in a way that’s big enough…",
    "but I’ll try anyway.",
    "",
    "Being with you feels like coming home.",
    "You make ordinary days softer, brighter, and somehow more possible.",
    "",
    "I love the little things — the way you exist in the world,",
    "the way you care, the way you make me want to be better",
    "without ever asking me to stop being me.",
    "",
    "I made this because you matter to me. A lot.",
    "",
    "And I have one small question…"
  ].join("\n"),

  memories: [
    { title: "The first time I knew", text: "I remember thinking: I want to keep choosing you." },
    { title: "A tiny moment", text: "Even something simple felt special because it was with you." },
    { title: "Your smile", text: "The kind that makes the world feel quieter—in the best way." },
    { title: "When you supported me", text: "I carry that with me. You make me feel seen." },
    { title: "A favorite day", text: "Not because it was perfect, but because it was ours." },
    { title: "What I want more of", text: "More mornings, more jokes, more you, more us." }
  ],

  reasons: [
    { label: "your laugh", reveal: "because it turns bad days gentle" },
    { label: "your kindness", reveal: "because you make people feel safe" },
    { label: "how you love", reveal: "because it feels like home" },
    { label: "your mind", reveal: "because it’s beautiful and bright" },
    { label: "your voice", reveal: "because it calms me instantly" },
    { label: "you", reveal: "because you’re you. and I’m grateful." }
  ],

  finalLine: "Happy Valentine’s Day. I choose you. ❤️"
};

/* ----------------------------
   App State
---------------------------- */
const state = {
  step: "start",
  herName: CONFIG.herNameDefault,
  typingOn: true,
  typingTimer: null,

  reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,

  // butterfly controls
  butterflyInterval: null,
  butterflyBudget: 18, // cap on-screen
  butterflyCount: 0
};

/* ============================================================
   Utilities
============================================================ */
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function rand(min, max){ return min + Math.random() * (max - min); }
function randi(min, max){ return Math.floor(rand(min, max + 1)); }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function setText(el, txt){ el.textContent = txt; }

function showToast(msg){
  setText(els.toast, msg);
  els.toast.classList.add("is-show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove("is-show"), 1600);
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    return false;
  }
}

/* ============================================================
   Step navigation + progress
============================================================ */
const STEPS = ["start","letter","memories","reasons","ask","yay"];

function setProgress(step){
  state.step = step;
  $$(".progress__item", els.progressList).forEach((li) => {
    li.classList.toggle("is-active", li.dataset.step === step);
  });

  const labels = {
    start: "Ready when you are",
    letter: "Reading my heart",
    memories: "Walking memory lane",
    reasons: "Little truths",
    ask: "The question",
    yay: "Chosen ❤️"
  };
  setText(els.statusText, labels[step] || "…");
}

function hideAllCards(){
  [els.startCard, els.letterCard, els.memoriesCard, els.reasonsCard, els.askCard, els.yayCard]
    .forEach((c) => c.classList.add("is-hidden"));
}

function showCard(cardEl){
  cardEl.classList.remove("is-hidden");
  cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goTo(step){
  setProgress(step);
  hideAllCards();

  if(step === "start") showCard(els.startCard);
  if(step === "letter") showCard(els.letterCard);
  if(step === "memories") showCard(els.memoriesCard);
  if(step === "reasons") showCard(els.reasonsCard);
  if(step === "ask") showCard(els.askCard);
  if(step === "yay") showCard(els.yayCard);
}

/* ============================================================
   Typing effect
============================================================ */
function typeText(el, text, speed = 16){
  clearInterval(state.typingTimer);

  if(!state.typingOn || state.reducedMotion){
    el.textContent = text;
    return;
  }

  el.textContent = "";
  let i = 0;

  state.typingTimer = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if(i >= text.length) clearInterval(state.typingTimer);
  }, speed);
}

/* ============================================================
   Memories + Reasons builders
============================================================ */
function buildMemories(list){
  els.memoriesGrid.innerHTML = "";
  list.forEach((m, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.setAttribute("role","listitem");
    btn.setAttribute("aria-label", `Memory: ${m.title}`);

    btn.innerHTML = `
      <span class="tile__spark" aria-hidden="true"></span>
      <h3 class="tile__title">${escapeHtml(m.title)}</h3>
      <p class="tile__meta">Tap to open</p>
    `;

    btn.addEventListener("click", () => {
      showToast(m.text);
      const meta = $(".tile__meta", btn);
      if(meta) meta.textContent = "Opened ❤️";
      // subtle butterfly cameo
      if(Math.random() < 0.45) spawnButterfly({ burst: true });
    });

    els.memoriesGrid.appendChild(btn);
  });
}

function buildReasons(list){
  els.reasonsWrap.innerHTML = "";
  list.forEach((r) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = r.label;

    chip.addEventListener("click", () => {
      chip.classList.add("is-revealed");
      chip.textContent = `${r.label} — ${r.reveal}`;
      // cameo butterflies sometimes
      if(Math.random() < 0.55) spawnButterfly({ burst: true });
    }, { once: true });

    els.reasonsWrap.appendChild(chip);
  });
}

/* HTML escaping for safety */
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* Shuffle (Fisher-Yates) */
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   Butterfly system (pro-quality)
   - SVG butterfly art
   - Curved bezier path
   - Natural easing
   - Wing flap via CSS
   - Budget cap to avoid performance issues
============================================================ */
function butterflySVG(palette){
  const { a, b } = palette;
  // NOTE: unique gradient id per butterfly to avoid collisions
  const gid = `g_${Math.random().toString(16).slice(2)}`;

  return `
  <svg viewBox="0 0 64 64" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${a}"/>
        <stop offset="100%" stop-color="${b}"/>
      </linearGradient>
    </defs>

    <!-- left wing -->
    <path class="wing l" fill="url(#${gid})" opacity="0.92"
      d="M31 32
         C18 16, 9 18, 8 30
         C7 44, 18 50, 28 42
         C32 39, 33 35, 31 32Z"/>

    <!-- right wing -->
    <path class="wing r" fill="url(#${gid})" opacity="0.92"
      d="M33 32
         C46 16, 55 18, 56 30
         C57 44, 46 50, 36 42
         C32 39, 31 35, 33 32Z"/>

    <!-- body -->
    <path fill="rgba(255,255,255,0.55)"
      d="M31.6 25
         C32.2 23.2, 33.8 23.2, 34.4 25
         C35.9 29.6, 35.8 36.6, 34.4 41
         C33.8 42.8, 32.2 42.8, 31.6 41
         C30.2 36.6, 30.1 29.6, 31.6 25Z"/>

    <!-- antennae -->
    <path fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.35" stroke-linecap="round"
      d="M32.4 24 C30.8 18.8, 26.8 16.6, 23.4 14.4"/>
    <path fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.35" stroke-linecap="round"
      d="M33.6 24 C35.2 18.8, 39.2 16.6, 42.6 14.4"/>
  </svg>`;
}

const BUTTERFLY_PALETTES = [
  { a:"#ffd1dc", b:"#caa6ff" }, // blush -> lavender
  { a:"#ffb3c6", b:"#a0dcff" }, // pink -> sky
  { a:"#ffd6a5", b:"#ff8fab" }, // peach -> rose
  { a:"#c7f9cc", b:"#a0dcff" }, // mint -> sky (soft)
  { a:"#ffe6a7", b:"#ff6b9a" }  // warm -> vivid rose
];

function cubicBezier(p0, p1, p2, p3, t){
  // Bernstein polynomials
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: (uuu * p0.x) + (3 * uu * t * p1.x) + (3 * u * tt * p2.x) + (ttt * p3.x),
    y: (uuu * p0.y) + (3 * uu * t * p1.y) + (3 * u * tt * p2.y) + (ttt * p3.y)
  };
}

function easeInOutCubic(t){
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
}

function spawnButterfly({ burst = false } = {}){
  if(state.reducedMotion) return;
  if(state.butterflyCount >= state.butterflyBudget) return;

  const layer = els.butterfliesLayer;
  if(!layer) return;

  state.butterflyCount++;

  const wrap = document.createElement("div");
  wrap.className = "bfly";

  const palette = pick(BUTTERFLY_PALETTES);
  wrap.innerHTML = butterflySVG(palette);

  // size + opacity
  const scale = rand(0.55, 1.25);
  const baseSize = 54 * scale;
  wrap.style.width = `${baseSize}px`;
  wrap.style.height = `${baseSize}px`;
  wrap.style.opacity = `${rand(0.55, 0.95)}`;

  // choose direction
  const fromLeft = Math.random() < 0.5;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Avoid sunflower field: keep flight in upper ~62% of viewport
  const safeH = h * 0.62;

  const start = { x: fromLeft ? -140 : w + 140, y: rand(30, safeH) };
  const end   = { x: fromLeft ? w + 160 : -160, y: rand(40, safeH) };

  // control points (curved, airy)
  const cp1 = { x: start.x + (fromLeft ? rand(140, 380) : -rand(140, 380)), y: start.y + rand(-120, 120) };
  const cp2 = { x: end.x   + (fromLeft ? -rand(140, 380) : rand(140, 380)), y: end.y   + rand(-120, 120) };

  const duration = burst ? rand(5200, 7800) : rand(8800, 15000);
  const spinBias = fromLeft ? 1 : -1;
  const wobble = rand(4, 10) * spinBias;

  layer.appendChild(wrap);

  const startTime = performance.now();
  function tick(now){
    const t = clamp((now - startTime) / duration, 0, 1);
    const e = easeInOutCubic(t);

    const pos = cubicBezier(start, cp1, cp2, end, e);

    // “life” motion: small wave + slight yaw
    const wave = Math.sin(e * Math.PI * rand(2.5, 4.5)) * rand(6, 18);
    const yaw = (Math.sin(e * 10) * wobble) + (fromLeft ? 8 : -8);

    wrap.style.transform = `translate(${pos.x}px, ${pos.y + wave}px) rotate(${yaw}deg)`;

    if(t < 1){
      requestAnimationFrame(tick);
    }else{
      wrap.remove();
      state.butterflyCount = Math.max(0, state.butterflyCount - 1);
    }
  }

  requestAnimationFrame(tick);
}

function startButterflies(){
  if(state.reducedMotion) return;

  // gentle ramp-up
  for(let i=0;i<3;i++){
    setTimeout(() => spawnButterfly(), i * 650);
  }

  clearInterval(state.butterflyInterval);
  state.butterflyInterval = setInterval(() => {
    spawnButterfly();
    if(Math.random() < 0.35) spawnButterfly();
  }, 2100);
}

/* ============================================================
   “Not yet” button nudge (playful, not annoying)
============================================================ */
function noButtonNudge(){
  const moves = [
    {x: 14, y: -6}, {x: -18, y: 6}, {x: 18, y: 12}, {x: -10, y: -12}
  ];
  let i = 0;

  els.noBtn.addEventListener("click", () => {
    const m = moves[i % moves.length];
    els.noBtn.style.transform = `translate(${m.x}px, ${m.y}px)`;
    els.tinyHint.textContent = "Hehe… try the other one 😇";
    i++;
    if(Math.random() < 0.6) spawnButterfly({ burst: true });
  });
}

/* ============================================================
   Personalization
============================================================ */
function applyNames(){
  els.herName.textContent = state.herName;
  els.signature.textContent = CONFIG.yourSignature;
}

function personalize(){
  const her = prompt("Her name / nickname:", state.herName);
  if(her && her.trim()) state.herName = her.trim();

  const sig = prompt("Your sign-off (e.g. — Alex):", CONFIG.yourSignature);
  if(sig && sig.trim()) CONFIG.yourSignature = sig.trim();

  applyNames();
  showToast("Perfect 💌");
}

/* ============================================================
   Wire UI events
============================================================ */
function wire(){
  els.customizeBtn.addEventListener("click", personalize);

  els.startBtn.addEventListener("click", () => {
    goTo("letter");
    typeText(els.letterText, CONFIG.letter, 16);
    if(Math.random() < 0.8) spawnButterfly({ burst: true });
  });

  els.skipTypingBtn.addEventListener("click", () => {
    state.typingOn = false;
    els.typingToggleBtn.setAttribute("aria-pressed", "false");
    els.typingToggleBtn.textContent = "Typing: Off";
    typeText(els.letterText, CONFIG.letter);
    showToast("❤️");
  });

  els.typingToggleBtn.addEventListener("click", () => {
    state.typingOn = !state.typingOn;
    els.typingToggleBtn.setAttribute("aria-pressed", String(state.typingOn));
    els.typingToggleBtn.textContent = `Typing: ${state.typingOn ? "On" : "Off"}`;
    typeText(els.letterText, CONFIG.letter, 16);
  });

  els.copyLetterBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(CONFIG.letter);
    showToast(ok ? "Letter copied 💌" : "Couldn’t copy—try selecting it");
  });

  els.toMemoriesBtn.addEventListener("click", () => goTo("memories"));
  els.backToLetterBtn.addEventListener("click", () => goTo("letter"));

  els.shuffleMemoriesBtn.addEventListener("click", () => {
    buildMemories(shuffle(CONFIG.memories));
    showToast("Shuffled ✨");
  });

  els.toReasonsBtn.addEventListener("click", () => goTo("reasons"));
  els.backToMemoriesBtn.addEventListener("click", () => goTo("memories"));

  els.toAskBtn.addEventListener("click", () => goTo("ask"));

  els.yesBtn.addEventListener("click", () => {
    goTo("yay");
    els.finalLine.textContent = CONFIG.finalLine;
    // celebratory butterflies
    for(let i=0;i<4;i++) setTimeout(() => spawnButterfly({ burst: true }), i*240);
  });

  els.replayBtn.addEventListener("click", () => location.reload());

  els.copyLinkBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(location.href);
    showToast(ok ? "Link copied 💌" : "Couldn’t copy—share from your address bar");
  });

  noButtonNudge();

  // keyboard: allow Enter to progress from start
  els.startBtn.addEventListener("keydown", (e) => {
    if(e.key === "Enter") els.startBtn.click();
  });
}

/* ============================================================
   Init
============================================================ */
function init(){
  // names
  state.herName = CONFIG.herNameDefault;
  applyNames();

  // build UI
  buildMemories(CONFIG.memories);
  buildReasons(CONFIG.reasons);

  // go
  setProgress("start");
  wire();
  startButterflies();

  // if reduced motion: show subtle message
  if(state.reducedMotion){
    showToast("Animations reduced (device setting)");
  }
}

init();
