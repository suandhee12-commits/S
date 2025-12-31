const V = "v=25"; // 캐시 방지: 이미지 바꾸면 숫자만 올려

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

// 말풍선 이미지 (파일명에 공백 있으니 %20)
const bubbles = {
  sShort: `./images/speech%20bubble%201.png?${V}`,
  sLong:  `./images/speech%20bubble%202.png?${V}`,
  uShort: `./images/speech%20bubble%203.png?${V}`,
  uLong:  `./images/speech%20bubble%204.png?${V}`,
};

const stage = document.getElementById("stage");
const bg = document.getElementById("bg");

// login
const loginOverlay = document.getElementById("loginOverlay");
const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw");
const btnPass = document.getElementById("btnPass");
const btnEnter = document.getElementById("btnEnter");

// chat
const chatOverlay = document.getElementById("chatOverlay");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

let currentScreen = "login";
let loadingTimer = null;

let chatInited = false;
let messages = [];

// ✅ 최근 N개만 보여서 “위로 사라짐”
const MAX_VISIBLE_MESSAGES = 6;

function go(name) {
  if (!screens[name]) return;

  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  setLoginOverlayVisible(name === "login");
  setChatOverlayVisible(name === "chat");

  if (name === "loading") {
    loadingTimer = setTimeout(() => {
      go(flowNext.loading); // chat
    }, 1000);
  }

  if (name === "chat") {
    initChatOnce();
    setTimeout(() => chatInput?.focus(), 0);
  }
}

function setLoginOverlayVisible(visible) {
  loginOverlay.classList.toggle("hidden", !visible);
  loginOverlay.setAttribute("aria-hidden", String(!visible));
  if (visible) setTimeout(() => loginId?.focus(), 0);
}

function setChatOverlayVisible(visible) {
  chatOverlay.classList.toggle("hidden", !visible);
  chatOverlay.setAttribute("aria-hidden", String(!visible));
}

function submitLogin() {
  go(flowNext.login); // loading
}

btnPass.addEventListener("click", submitLogin);
btnEnter.addEventListener("click", submitLogin);

document.addEventListener("keydown", (e) => {
  if (currentScreen === "login" && e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* =========================
   채팅 말풍선 규칙
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

  // 문장부호로 나누기
  const marks = ["!", "?", ".", "~", "…"];
  for (const m of marks) {
    const idx = t.indexOf(m);
    if (idx > 2 && idx < t.length - 2) {
      const a = t.slice(0, idx + 1).trim();
      const b = t.slice(idx + 1).trim();
      if (a && b) return [a, b];
    }
  }

  // 공백 기준
  const mid = Math.floor(t.length / 2);
  let cut = t.lastIndexOf(" ", mid);
  if (cut < 6) cut = t.indexOf(" ", mid);
  if (cut < 6) cut = mid;

  const a = t.slice(0, cut).trim();
  const b = t.slice(cut).trim();
  return [a || t, b || ""];
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

chatSend.addEventListener("click", sendUserMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendUserMessage();
  }
});

/* 클릭 진행 */
document.addEventListener("click", () => {
  if (currentScreen === "login") return;
  if (currentScreen === "loading") return;
  if (currentScreen === "chat") return;

  const next = flowNext[currentScreen];
  if (next) go(next);
});

go("login");
