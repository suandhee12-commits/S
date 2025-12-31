const DEBUG = true; // ✅ 좌표 다 맞추면 false
const V = "v=60";

const screens = {
  login:   { src: `./images/01_login.jpg?${V}`,    ar: "1502/887"  },
  loading: { src: `./images/02_loading.jpg?${V}`,  ar: "1502/887"  },
  chat:    { src: `./images/04_chat.jpg?${V}`,     ar: "1536/1024" },
  chatAlt: { src: `./images/05_chat_alt.jpg?${V}`, ar: "1536/1024" },
  profile: { src: `./images/03_profile.jpg?${V}`,  ar: "1536/1024" },
  invite:  { src: `./images/06_invite.png?${V}`,   ar: "1536/1024" },
};

const flowNext = {
  login: "loading",
  loading: "chat",
  chat: "chatAlt",
  chatAlt: "profile",
  profile: "invite",
  invite: "login",
};

const bubbles = {
  sShort: `./images/speech%20bubble%201.png?${V}`,
  sLong:  `./images/speech%20bubble%202.png?${V}`,
  uShort: `./images/speech%20bubble%203.png?${V}`,
  uLong:  `./images/speech%20bubble%204.png?${V}`,
};

const stage = document.getElementById("stage");
const bg = document.getElementById("bg");

// overlays
const loginOverlay = document.getElementById("loginOverlay");
const chatOverlay = document.getElementById("chatOverlay");

// login
const loginId = document.getElementById("loginId");
const btnPass = document.getElementById("btnPass");
const btnEnter = document.getElementById("btnEnter");

// chat
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// debug
const debugHud = document.getElementById("debugHud");
const debugText = document.getElementById("debugText");
const copyHud = document.getElementById("copyHud");

// debug boxes
const dbg_chatLog = document.getElementById("dbg_chatLog");
const dbg_chatInput = document.getElementById("dbg_chatInput");
const dbg_chatSend = document.getElementById("dbg_chatSend");

let currentScreen = "login";
let loadingTimer = null;

// chat state
let chatInited = false;
let messages = [];

function setVisible(el, visible) {
  el.classList.toggle("hidden", !visible);
  el.setAttribute("aria-hidden", String(!visible));
}

/* ===== 화면 전환 ===== */
function go(name) {
  if (!screens[name]) return;

  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  setVisible(loginOverlay, name === "login");
  setVisible(chatOverlay, name === "chat");

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go(flowNext.loading), 1000);
  }

  if (name === "chat") {
    initChatOnce();
    setTimeout(() => chatInput?.focus(), 0);
  }

  updateDebugVisibility();
  writeHud();
}

function submitLogin() { go(flowNext.login); }
btnPass.addEventListener("click", submitLogin);
btnEnter.addEventListener("click", submitLogin);

document.addEventListener("keydown", (e) => {
  if (currentScreen === "login" && e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* ===== 채팅 (표시만 유지) ===== */
function isLongText(text) {
  const t = (text || "").trim();
  if (t.length >= 22) return true;
  const punct = (t.match(/[.!?~…]/g) || []).length;
  return punct >= 2;
}

function splitToTwoLines(text) {
  const t = (text || "").trim();
  if (!t) return ["", ""];
  const marks = ["!", "?", ".", "~", "…"];
  for (const m of marks) {
    const idx = t.indexOf(m);
    if (idx > 2 && idx < t.length - 2) {
      const a = t.slice(0, idx + 1).trim();
      const b = t.slice(idx + 1).trim();
      if (a && b) return [a, b];
    }
  }
  const mid = Math.floor(t.length / 2);
  let cut = t.lastIndexOf(" ", mid);
  if (cut < 6) cut = t.indexOf(" ", mid);
  if (cut < 6) cut = mid;
  return [t.slice(0, cut).trim() || t, t.slice(cut).trim() || ""];
}

function bubbleSrc(from, long) {
  if (from === "s") return long ? bubbles.sLong : bubbles.sShort;
  return long ? bubbles.uLong : bubbles.uShort;
}

function createBubbleMessage(from, text) {
  const long = isLongText(text);
  const wrap = document.createElement("div");
  wrap.className = `bubble-wrap ${from === "s" ? "s" : "user"} ${long ? "long" : "short"}`;

  const img = document.createElement("img");
  img.className = "bubble-img";
  img.alt = "speech-bubble";
  img.src = bubbleSrc(from, long);

  const txt = document.createElement("div");
  txt.className = "bubble-text";
  if (long) {
    const [a, b] = splitToTwoLines(text);
    txt.textContent = a + (b ? "\n" + b : "");
  } else {
    txt.textContent = text;
  }

  wrap.appendChild(img);
  wrap.appendChild(txt);
  return wrap;
}

function renderChat() {
  chatLog.innerHTML = "";
  for (const m of messages) chatLog.appendChild(createBubbleMessage(m.from, m.text));
  chatLog.scrollTop = chatLog.scrollHeight;
}

function initChatOnce() {
  if (chatInited) return;
  chatInited = true;
  messages = [{ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" }];
  renderChat();
}

function autoReply(userText) {
  const t = (userText || "").toLowerCase();
  if (t.includes("오랜") || t.includes("오랜만")) return "진짜 오랜만이다…\n요즘 뭐 하고 지냈어?";
  if (t.includes("보고") || t.includes("그리")) return "나도! 그래서 더 반가워.";
  if (t.includes("?")) return "흠… 그건 조금 더\n자세히 말해줄래?";
  return "응응, 계속 말해줘.\n나 듣고 있어.";
}

function sendUserMessage() {
  if (currentScreen !== "chat") return;
  const text = (chatInput.value || "").trim();
  if (!text) return;

  messages.push({ from: "user", text });
  chatInput.value = "";
  renderChat();

  setTimeout(() => {
    messages.push({ from: "s", text: autoReply(text) });
    renderChat();
  }, 350);
}

chatSend.addEventListener("click", sendUserMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendUserMessage();
  }
});

/* ===== 화면 클릭 진행 ===== */
document.addEventListener("click", () => {
  if (currentScreen === "login") return;
  if (currentScreen === "loading") return;
  if (currentScreen === "chat") return;

  const next = flowNext[currentScreen];
  if (next) go(next);
});

/* =========================
   ✅ 디버그: 채팅 화면에서만 파란박스 + HUD
========================= */
function updateDebugVisibility() {
  if (!DEBUG) {
    debugHud?.classList.add("hidden");
    dbg_chatLog?.classList.add("hidden");
    dbg_chatInput?.classList.add("hidden");
    dbg_chatSend?.classList.add("hidden");
    return;
  }

  const onChat = currentScreen === "chat";

  debugHud.classList.toggle("hidden", !onChat);
  debugHud.setAttribute("aria-hidden", String(!onChat));

  dbg_chatLog.classList.toggle("hidden", !onChat);
  dbg_chatInput.classList.toggle("hidden", !onChat);
  dbg_chatSend.classList.toggle("hidden", !onChat);

  if (onChat) {
    syncDbgToEl(chatLog, dbg_chatLog);
    syncDbgToEl(chatInput, dbg_chatInput);
    syncDbgToEl(chatSend, dbg_chatSend);
  }
}

function syncDbgToEl(targetEl, dbgEl) {
  const stageRect = stage.getBoundingClientRect();
  const r = targetEl.getBoundingClientRect();
  dbgEl.style.left = `${r.left - stageRect.left}px`;
  dbgEl.style.top = `${r.top - stageRect.top}px`;
  dbgEl.style.width = `${r.width}px`;
  dbgEl.style.height = `${r.height}px`;
}

let active = null;

function isOnResizeHandle(e, rect) {
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return x > rect.width - 22 && y > rect.height - 22;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function onPointerDown(e) {
  const box = e.currentTarget;
  e.preventDefault();

  const rect = box.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const isResize = isOnResizeHandle(e, rect);

  active = {
    box,
    mode: isResize ? "resize" : "move",
    startX: e.clientX,
    startY: e.clientY,
    startLeft: rect.left - stageRect.left,
    startTop: rect.top - stageRect.top,
    startW: rect.width,
    startH: rect.height,
    stageW: stageRect.width,
    stageH: stageRect.height,
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp, { once: true });
}

function onPointerMove(e) {
  if (!active) return;

  const dx = e.clientX - active.startX;
  const dy = e.clientY - active.startY;

  if (active.mode === "move") {
    const left = clamp(active.startLeft + dx, 0, active.stageW - active.startW);
    const top = clamp(active.startTop + dy, 0, active.stageH - active.startH);
    active.box.style.left = `${left}px`;
    active.box.style.top = `${top}px`;
  } else {
    const w = clamp(active.startW + dx, 20, active.stageW - active.startLeft);
    const h = clamp(active.startH + dy, 20, active.stageH - active.startTop);
    active.box.style.width = `${w}px`;
    active.box.style.height = `${h}px`;
  }

  applyDbgToReal();
  writeHud();
}

function onPointerUp() {
  window.removeEventListener("pointermove", onPointerMove);
  active = null;
}

function applyDbgToReal() {
  // dbg 좌표를 실제 요소에 반영
  applyBoxToEl(dbg_chatLog, chatLog);
  applyBoxToEl(dbg_chatInput, chatInput);
  applyBoxToEl(dbg_chatSend, chatSend);
}

function applyBoxToEl(dbgEl, targetEl) {
  const stageRect = stage.getBoundingClientRect();
  const r = dbgEl.getBoundingClientRect();

  const leftPx = r.left - stageRect.left;
  const topPx = r.top - stageRect.top;
  const wPx = r.width;
  const hPx = r.height;

  const left = (leftPx / stageRect.width) * 100;
  const top = (topPx / stageRect.height) * 100;
  const width = (wPx / stageRect.width) * 100;
  const height = (hPx / stageRect.height) * 100;

  // inline style로 반영(디버그 중 즉시 눈으로 확인)
  targetEl.style.left = `${left}%`;
  targetEl.style.top = `${top}%`;
  targetEl.style.width = `${width}%`;
  targetEl.style.height = `${height}%`;
}

function writeHud() {
  if (!DEBUG || currentScreen !== "chat") return;

  const lines = [
    cssLineFromEl(".chat-log", chatLog),
    cssLineFromEl(".chat-input", chatInput),
    cssLineFromEl(".chat-send", chatSend),
  ];

  debugText.textContent = lines.join("\n");
}

function cssLineFromEl(selector, el) {
  const left = (parseFloat(el.style.left) || 0).toFixed(2);
  const top = (parseFloat(el.style.top) || 0).toFixed(2);
  const width = (parseFloat(el.style.width) || 0).toFixed(2);
  const height = (parseFloat(el.style.height) || 0).toFixed(2);
  return `${selector} { left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; }`;
}

copyHud?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(debugText.textContent || "");
    copyHud.textContent = "복사됨!";
    setTimeout(() => (copyHud.textContent = "복사"), 900);
  } catch {
    copyHud.textContent = "복사 실패";
    setTimeout(() => (copyHud.textContent = "복사"), 900);
  }
});

dbg_chatLog.addEventListener("pointerdown", onPointerDown);
dbg_chatInput.addEventListener("pointerdown", onPointerDown);
dbg_chatSend.addEventListener("pointerdown", onPointerDown);

window.addEventListener("resize", () => {
  if (currentScreen === "chat" && DEBUG) {
    syncDbgToEl(chatLog, dbg_chatLog);
    syncDbgToEl(chatInput, dbg_chatInput);
    syncDbgToEl(chatSend, dbg_chatSend);
    writeHud();
  }
});

go("login");
