const DEBUG = true; // ✅ 좌표 조정 끝나면 false로 바꾸면 흔적 사라짐
const V = "v=30";

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

let currentScreen = "login";
let loadingTimer = null;

// chat state
let chatInited = false;
let messages = [];
const MAX_VISIBLE_MESSAGES = 6;

/* =========================
   화면 전환
========================= */
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

  // 디버그 박스는 해당 화면에서만 보이게
  updateDebugVisibility();

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go(flowNext.loading), 1000);
  }

  if (name === "chat") {
    initChatOnce();
    setTimeout(() => chatInput?.focus(), 0);
  }
}

function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
  el.setAttribute("aria-hidden", String(!visible));
}

/* =========================
   로그인
========================= */
function submitLogin() { go(flowNext.login); }
btnPass?.addEventListener("click", submitLogin);
btnEnter?.addEventListener("click", submitLogin);

document.addEventListener("keydown", (e) => {
  if (currentScreen === "login" && e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* =========================
   채팅
========================= */
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
  const visible = messages.slice(-MAX_VISIBLE_MESSAGES);
  for (const m of visible) chatLog.appendChild(createBubbleMessage(m.from, m.text));
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

chatSend?.addEventListener("click", sendUserMessage);
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendUserMessage();
  }
});

/* =========================
   페이지 클릭 진행
========================= */
document.addEventListener("click", () => {
  if (currentScreen === "login") return;
  if (currentScreen === "loading") return;
  if (currentScreen === "chat") return;
  const next = flowNext[currentScreen];
  if (next) go(next);
});

/* =========================
   ✅ 디버그: 드래그/리사이즈로 좌표 뽑기
========================= */
const debugHud = document.getElementById("debugHud");
const debugText = document.getElementById("debugText");

// 디버그 박스들
const dbg = {
  chatLog: document.getElementById("dbg_chatLog"),
  chatInput: document.getElementById("dbg_chatInput"),
  chatSend: document.getElementById("dbg_chatSend"),
  loginId: document.getElementById("dbg_loginId"),
  loginPw: document.getElementById("dbg_loginPw"),
  loginPass: document.getElementById("dbg_loginPass"),
  loginEnter: document.getElementById("dbg_loginEnter"),
};

function updateDebugVisibility() {
  if (!DEBUG) {
    debugHud?.classList.add("hidden");
    Object.values(dbg).forEach(el => el?.classList.add("hidden"));
    return;
  }

  debugHud?.classList.remove("hidden");
  debugHud?.setAttribute("aria-hidden", "false");

  // 현재 화면에 맞는 박스만 보여주기
  const onLogin = currentScreen === "login";
  const onChat = currentScreen === "chat";

  // login
  dbg.loginId.classList.toggle("hidden", !onLogin);
  dbg.loginPw.classList.toggle("hidden", !onLogin);
  dbg.loginPass.classList.toggle("hidden", !onLogin);
  dbg.loginEnter.classList.toggle("hidden", !onLogin);

  // chat
  dbg.chatLog.classList.toggle("hidden", !onChat);
  dbg.chatInput.classList.toggle("hidden", !onChat);
  dbg.chatSend.classList.toggle("hidden", !onChat);

  // 박스 초기 위치는 실제 요소의 현재 %를 복제
  if (onLogin) {
    syncDbgToCss("login-id", dbg.loginId);
    syncDbgToCss("login-pw", dbg.loginPw);
    syncDbgToCss("login-btn-pass", dbg.loginPass);
    syncDbgToCss("login-btn-enter", dbg.loginEnter);
  }
  if (onChat) {
    syncDbgToCss("chat-log", dbg.chatLog);
    syncDbgToCss("chat-input", dbg.chatInput);
    syncDbgToCss("chat-send", dbg.chatSend);
  }

  writeHud();
}

function syncDbgToCss(className, el) {
  // 실제 적용 중인 스타일 값을 읽어 debug 박스에 반영
  const temp = document.createElement("div");
  temp.className = className;
  temp.style.position = "absolute";
  temp.style.visibility = "hidden";
  stage.appendChild(temp);

  const cs = getComputedStyle(temp);
  // stage 기준 픽셀 값
  el.style.left = cs.left;
  el.style.top = cs.top;
  el.style.width = cs.width;
  el.style.height = cs.height;

  stage.removeChild(temp);
}

let active = null;

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

function isOnResizeHandle(e, rect) {
  // 오른쪽 아래 18x18 영역이면 resize로 판정
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return x > rect.width - 22 && y > rect.height - 22;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

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

  writeHud();
}

function onPointerUp() {
  window.removeEventListener("pointermove", onPointerMove);
  active = null;
}

function pxToPct(px, total) {
  return (px / total) * 100;
}

function writeHud() {
  if (!DEBUG || !debugText) return;

  const stageRect = stage.getBoundingClientRect();

  const visibleBoxes = Object.values(dbg).filter(el => !el.classList.contains("hidden"));
  const lines = [];

  for (const el of visibleBoxes) {
    const r = el.getBoundingClientRect();
    const leftPx = r.left - stageRect.left;
    const topPx = r.top - stageRect.top;
    const wPx = r.width;
    const hPx = r.height;

    const left = pxToPct(leftPx, stageRect.width).toFixed(2);
    const top = pxToPct(topPx, stageRect.height).toFixed(2);
    const width = pxToPct(wPx, stageRect.width).toFixed(2);
    const height = pxToPct(hPx, stageRect.height).toFixed(2);

    const target = el.dataset.target;
    lines.push(`.${target} { left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; }`);
  }

  debugText.textContent = lines.join("\n");
}

// 이벤트 바인딩
Object.values(dbg).forEach((el) => {
  el.addEventListener("pointerdown", onPointerDown);
});

go("login");
