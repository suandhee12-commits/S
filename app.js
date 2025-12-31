const DEBUG = true;
const V = "v=50";

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

// hud
const debugHud = document.getElementById("debugHud");
const debugText = document.getElementById("debugText");
const copyHud = document.getElementById("copyHud");

let currentScreen = "login";
let loadingTimer = null;

// chat state
let chatInited = false;
let messages = []; // ✅ 이제 제한 없이 쌓임

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

  if (DEBUG) showHud(true);

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go(flowNext.loading), 1000);
  }

  if (name === "chat") {
    initChatOnce();
    setTimeout(() => chatInput?.focus(), 0);
  }

  // HUD 텍스트 갱신(현재 화면 기준)
  writeHud();
}

function setVisible(el, visible) {
  el.classList.toggle("hidden", !visible);
  el.setAttribute("aria-hidden", String(!visible));
}

function showHud(on) {
  if (!debugHud) return;
  debugHud.classList.toggle("hidden", !on);
  debugHud.setAttribute("aria-hidden", String(!on));
}

/* ===== 로그인 ===== */
function submitLogin() { go(flowNext.login); }
btnPass.addEventListener("click", submitLogin);
btnEnter.addEventListener("click", submitLogin);

document.addEventListener("keydown", (e) => {
  if (currentScreen === "login" && e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* ===== 채팅 ===== */
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

  // ✅ 새 메시지 오면 항상 아래로
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

/* ===== HUD: 현재 적용 좌표를 항상 보여주기 ===== */
function writeHud() {
  if (!DEBUG || !debugText) return;

  // 지금 화면에서 실제 요소의 % 계산해서 보여줌
  const stageRect = stage.getBoundingClientRect();

  const targets = [];
  if (currentScreen === "chat") {
    targets.push({ name: "chat-log", el: chatLog });
    targets.push({ name: "chat-input", el: chatInput });
    targets.push({ name: "chat-send", el: chatSend });
  } else if (currentScreen === "login") {
    targets.push({ name: "login-id", el: document.getElementById("loginId") });
    targets.push({ name: "login-pw", el: document.getElementById("loginPw") });
    targets.push({ name: "login-btn-pass", el: document.getElementById("btnPass") });
    targets.push({ name: "login-btn-enter", el: document.getElementById("btnEnter") });
  } else {
    debugText.textContent = "이 화면에서는 좌표 HUD가 표시할 항목이 없어요.\n(로그인/채팅 화면에서 확인 가능)";
    return;
  }

  const lines = targets.map(({ name, el }) => {
    const r = el.getBoundingClientRect();
    const leftPx = r.left - stageRect.left;
    const topPx = r.top - stageRect.top;
    const wPx = r.width;
    const hPx = r.height;

    const left = (leftPx / stageRect.width * 100).toFixed(2);
    const top = (topPx / stageRect.height * 100).toFixed(2);
    const width = (wPx / stageRect.width * 100).toFixed(2);
    const height = (hPx / stageRect.height * 100).toFixed(2);

    return `.${name} { left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; }`;
  });

  debugText.textContent = lines.join("\n");
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

window.addEventListener("resize", () => writeHud());

go("login");
