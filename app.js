const API_BASE = "https://s-chat-api.vercel.app";
const V = "vFINAL";

/* 화면/이미지 */
const screens = {
  login:   { src: `./images/01_login.jpg?${V}`, ar: "1502/887" },
  loading: { src: `./images/02_loading.jpg?${V}`, ar: "1502/887" },
  chat:    { src: `./images/04_chat.jpg?${V}`, ar: "1536/1024" },
  chatAlt: { src: `./images/05_chat_alt.jpg?${V}`, ar: "1536/1024" },
  profile: { src: `./images/03_profile.jpg?${V}`, ar: "1536/1024" },
  invite:  { src: `./images/06_invite.png?${V}`, ar: "1536/1024" },
};

const flowNext = {
  login: "loading",
  loading: "chat",
  chat: "chatAlt",
  chatAlt: "profile",
  profile: "invite",
  invite: "login",
};

/* 말풍선 이미지 */
const bubbles = {
  sShort: "./images/speech%20bubble%201.png",
  sLong:  "./images/speech%20bubble%202.png",
  uShort: "./images/speech%20bubble%203.png",
  uLong:  "./images/speech%20bubble%204.png",
};

/* DOM */
const stage = document.getElementById("stage");
const bg = document.getElementById("bg");
const mainVideo = document.getElementById("mainVideo");

const loginOverlay = document.getElementById("loginOverlay");
const chatOverlay = document.getElementById("chatOverlay");

const loginId = document.getElementById("loginId");
const btnPass = document.getElementById("btnPass");
const btnEnter = document.getElementById("btnEnter");

const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

/* state */
let currentScreen = "login";
let loadingTimer = null;
let chatInited = false;
let messages = [];
let sending = false;

/* ✅ 최종본: 튜닝 OFF */
const VIDEO_TUNE = false;
function setVideoTune(_) {
  // 최종본이라 아무것도 안 함(파란 윤곽선/드래그/휠 없음)
}

/* messages -> API history 변환 (최근 10개만) */
function toApiHistory(msgs) {
  return msgs
    .filter(m => m.text && m.text.trim() !== "…")
    .slice(-10)
    .map(m => ({
      role: m.from === "s" ? "assistant" : "user",
      content: m.text
    }));
}

/* 서버로 보내서 S 답변 받기 */
async function fetchSReply(userText, msgs) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userText,
      history: toApiHistory(msgs)
    })
  });

  let data = {};
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const msg = data?.error || data?.message || `API error (${res.status})`;
    throw new Error(msg);
  }

  const text = (data.text || data.reply || data.message || "").trim();
  return text || "…";
}

/* 화면 전환 */
function go(name) {
  if (!screens[name]) return;

  if (loadingTimer) clearTimeout(loadingTimer);

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  // ✅ 영상은 chat에서만 보이게 (좌표/크기는 CSS로 고정됨)
  const showVideo = (name === "chat");
  if (mainVideo) {
    mainVideo.classList.toggle("hidden", !showVideo);
    setVideoTune(showVideo && VIDEO_TUNE);

    if (showVideo) {
      mainVideo.muted = true;
      const p = mainVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      mainVideo.pause();
    }
  }

  // ✅ 오버레이 토글
  if (loginOverlay) loginOverlay.classList.toggle("hidden", name !== "login");
  if (chatOverlay) chatOverlay.classList.toggle("hidden", name !== "chat");

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go("chat"), 1000);
  }

  if (name === "chat") {
    initChat();
    setTimeout(() => chatInput?.focus(), 0);
  }
}

/* 말풍선 */
function isLong(text) {
  return text.length > 22 || (text.match(/[.!?]/g) || []).length >= 2;
}

function bubble(from, text) {
  const long = isLong(text);

  const wrap = document.createElement("div");
  wrap.className = `bubble-wrap ${from} ${long ? "long" : "short"}`;

  const img = document.createElement("img");
  img.className = "bubble-img";
  img.src = from === "s"
    ? (long ? bubbles.sLong : bubbles.sShort)
    : (long ? bubbles.uLong : bubbles.uShort);

  const txt = document.createElement("div");
  txt.className = "bubble-text";
  txt.textContent = text;

  wrap.append(img, txt);
  return wrap;
}

function render() {
  if (!chatLog) return;
  chatLog.innerHTML = "";
  messages.forEach(m => chatLog.appendChild(bubble(m.from, m.text)));
  chatLog.scrollTop = chatLog.scrollHeight;
}

/* 채팅 초기화 */
function initChat() {
  if (chatInited) return;
  chatInited = true;

  messages.push({ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" });
  render();
}

function lockSend(lock) {
  sending = lock;
  if (!chatSend) return;
  chatSend.disabled = lock;
  chatSend.style.opacity = lock ? "0.6" : "1";
}

async function sendMessage() {
  if (!chatInput) return;

  const text = chatInput.value.trim();
  if (!text) return;
  if (sending) return;

  lockSend(true);

  // 유저 말풍선 추가
  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

  // S 응답 대기 말풍선
  messages.push({ from: "s", text: "…" });
  render();

  try {
    const reply = await fetchSReply(text, messages);
    messages[messages.length - 1] = { from: "s", text: reply };
  } catch (err) {
    messages[messages.length - 1] = { from: "s", text: `에러: ${err.message}` };
  } finally {
    render();
    lockSend(false);
    setTimeout(() => chatInput?.focus(), 0);
  }
}

/* 버튼/엔터 연결 */
if (btnPass) btnPass.onclick = () => go("loading");
if (btnEnter) btnEnter.onclick = () => go("loading");

if (chatSend) chatSend.onclick = sendMessage;
if (chatInput) {
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

/* (선택) 화면 클릭으로 다음 화면 넘기기: 채팅/로그인/로딩은 제외 */
document.addEventListener("click", () => {
  if (currentScreen === "chat" || currentScreen === "login" || currentScreen === "loading") return;
  const next = flowNext[currentScreen];
  if (next) go(next);
});

/* 시작 */
go("login");
