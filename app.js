// 캐시 방지 (이미지 바꿨는데 옛날게 보이면 숫자만 올리면 됨)
const V = "v=20";

// 화면별 이미지 + 종횡비(오버레이 좌표 정확도를 위해 stage 비율을 화면마다 교체)
const screens = {
  login:   { src: `./images/01_login.jpg?${V}`,    ar: "1502/887"  },
  loading: { src: `./images/02_loading.jpg?${V}`,  ar: "1502/887"  },
  chat:    { src: `./images/04_chat.jpg?${V}`,     ar: "1536/1024" },
  chatAlt: { src: `./images/05_chat_alt.jpg?${V}`, ar: "1536/1024" },
  profile: { src: `./images/03_profile.jpg?${V}`,  ar: "1536/1024" },
  invite:  { src: `./images/06_invite.png?${V}`,   ar: "1536/1024" },
};

// 진행: 1-2-4-5-3-6
const flowNext = {
  login: "loading",
  loading: "chat",
  chat: "chatAlt",
  chatAlt: "profile",
  profile: "invite",
  invite: "login",
};

// 말풍선 이미지 (spaces -> %20)
const bubbles = {
  sShort:  `./images/speech%20bubble%201.png?${V}`, // S 짧음
  sLong:   `./images/speech%20bubble%202.png?${V}`, // S 김(2줄)
  uShort:  `./images/speech%20bubble%203.png?${V}`, // User 짧음
  uLong:   `./images/speech%20bubble%204.png?${V}`, // User 김(2줄)
};

const stage = document.getElementById("stage");
const bg = document.getElementById("bg");

// 로그인 오버레이
const loginOverlay = document.getElementById("loginOverlay");
const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw");
const btnPass = document.getElementById("btnPass");
const btnEnter = document.getElementById("btnEnter");

// 채팅 오버레이
const chatOverlay = document.getElementById("chatOverlay");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

let currentScreen = "login";
let loadingTimer = null;

// 채팅 상태
let chatInited = false;
let messages = []; // {from:"s"|"user", text:string}

const MAX_VISIBLE_MESSAGES = 7; // ✅ 길어지면 위로 사라지게: 최근 N개만 보여줌

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

  // ✅ 화면마다 stage 비율 변경(오버레이 좌표 맞추기)
  stage.style.aspectRatio = screens[name].ar;

  bg.src = screens[name].src;

  setLoginOverlayVisible(name === "login");
  setChatOverlayVisible(name === "chat");

  // 02_loading은 1초 후 자동 → 04_chat
  if (name === "loading") {
    loadingTimer = setTimeout(() => {
      go(flowNext.loading);
    }, 1000);
  }

  if (name === "chat") {
    initChatOnce();
    setTimeout(() => chatInput?.focus(), 0);
  }
}

function setLoginOverlayVisible(visible) {
  if (!loginOverlay) return;
  loginOverlay.classList.toggle("hidden", !visible);
  loginOverlay.setAttribute("aria-hidden", String(!visible));
  if (visible) setTimeout(() => loginId?.focus(), 0);
}

function setChatOverlayVisible(visible) {
  if (!chatOverlay) return;
  chatOverlay.classList.toggle("hidden", !visible);
  chatOverlay.setAttribute("aria-hidden", String(!visible));
}

/* =========================
   로그인 처리
========================= */
function submitLogin() {
  // 데모: 값 없어도 통과
  go(flowNext.login); // loading
}

btnPass?.addEventListener("click", submitLogin);
btnEnter?.addEventListener("click", submitLogin);

document.addEventListener("keydown", (e) => {
  if (currentScreen === "login" && e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* =========================
   채팅 처리
========================= */
function initChatOnce() {
  if (chatInited) return;
  chatInited = true;

  messages = [
    { from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" },
  ];
  renderChat();
}

function isLongText(text) {
  // “길다” 기준: 글자 수가 어느 정도 이상이거나 문장부호가 여러 개면 2줄 처리
  const t = (text || "").trim();
  if (t.length >= 22) return true;
  const punct = (t.match(/[.!?~…]/g) || []).length;
  return punct >= 2;
}

function splitToTwoLines(text) {
  const t = (text || "").trim();
  if (!t) return ["", ""];

  // 1) 우선 문장부호 기준으로 나누기
  const idx = Math.max(
    t.indexOf("!"),
    t.indexOf("?"),
    t.indexOf("."),
    t.indexOf("~"),
    t.indexOf("…")
  );
  if (idx > 2 && idx < t.length - 2) {
    const a = t.slice(0, idx + 1).trim();
    const b = t.slice(idx + 1).trim();
    if (a && b) return [a, b];
  }

  // 2) 공백 기준으로 가운데 근처에서 나누기
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
  if (!chatLog) return;

  chatLog.innerHTML = "";

  // ✅ 최근 N개만 보여서 “위로 사라지는” 효과
  const visible = messages.slice(-MAX_VISIBLE_MESSAGES);

  for (const m of visible) {
    chatLog.appendChild(createBubbleMessage(m.from, m.text));
  }
}

function sendUserMessage() {
  if (currentScreen !== "chat") return;

  const text = (chatInput?.value ?? "").trim();
  if (!text) return;

  messages.push({ from: "user", text });
  chatInput.value = "";
  renderChat();

  // (선택) 간단 자동응답: 원치 않으면 이 블록 삭제하면 됨
  setTimeout(() => {
    messages.push({ from: "s", text: autoReply(text) });
    renderChat();
  }, 350);
}

function autoReply(userText) {
  const t = (userText || "").toLowerCase();
  if (t.includes("오랜") || t.includes("오랜만")) return "진짜 오랜만이다… 요즘 뭐 하고 지냈어?";
  if (t.includes("보고") || t.includes("그리")) return "나도! 그래서 더 반가워.";
  if (t.includes("?")) return "흠… 그건 조금 더 자세히 말해줄래?";
  return "응응, 계속 말해줘. 나 듣고 있어.";
}

chatSend?.addEventListener("click", sendUserMessage);

chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendUserMessage();
  }
});

/* =========================
   화면 진행(클릭)
   - login: 버튼으로만
   - loading: 자동
   - chat: 채팅해야 하니 클릭으로 넘기지 않음
   - chatAlt/profile/invite: 화면 아무 곳 클릭하면 다음
========================= */
document.addEventListener("click", () => {
  if (currentScreen === "login") return;
  if (currentScreen === "loading") return;
  if (currentScreen === "chat") return;

  const next = flowNext[currentScreen];
  if (next) go(next);
});

// 시작
go("login");
