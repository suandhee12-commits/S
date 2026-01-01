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
const glitchOverlay = document.getElementById("glitchOverlay"); // ✅ 글리치 오버레이

const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw"); // (HTML에 있으면 사용)
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

// ✅ 채팅 전송 카운트 & 글리치 상태
let userSendCount = 0;
let glitching = false;

/* ✅ 최종본: 튜닝 OFF */
const VIDEO_TUNE = false;
function setVideoTune(_) {
  // 최종본이라 아무것도 안 함
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

function lockSend(lock) {
  sending = lock;
  if (!chatSend) return;
  chatSend.disabled = lock;
  chatSend.style.opacity = lock ? "0.6" : "1";
}

/* ✅ 3초 “화려한 찢김 + RGB + 빛” 글리치 전환 */
function glitchTo(nextScreen) {
  if (glitching) return;
  if (!screens[nextScreen]) return;

  glitching = true;
  lockSend(true);

  if (!glitchOverlay || !bg) {
    go(nextScreen);
    glitching = false;
    lockSend(false);
    return;
  }

  const fromSrc = bg.currentSrc || bg.src;
  const toSrc = screens[nextScreen].src;

  glitchOverlay.classList.remove("hidden");
  glitchOverlay.classList.add("on");
  glitchOverlay.innerHTML = "";

  // 베이스(현재 화면)
  const base = document.createElement("img");
  base.className = "glitch-base";
  base.src = fromSrc;

  // RGB 레이어(현재 화면)
  const baseRgb = document.createElement("img");
  baseRgb.className = "glitch-base glitch-rgb";
  baseRgb.src = fromSrc;
  baseRgb.style.opacity = "0.9";

  // 빛 플래시 레이어
  const flash = document.createElement("div");
  flash.className = "glitch-flash";

  glitchOverlay.append(base, baseRgb, flash);

  // 찢김 슬라이스(다음 화면 조각들)
  const SLICE_COUNT = 16; // 많을수록 화려
  for (let i = 0; i < SLICE_COUNT; i++) {
    const s = document.createElement("img");
    s.className = "glitch-slice glitch-rgb";
    s.src = toSrc;

    // 랜덤 가로 찢김 영역(퍼센트)
    const top = Math.random() * 92;
    const h = 2 + Math.random() * 10; // 2%~12%
    const bottom = Math.min(100, top + h);

    s.style.clipPath = `polygon(0% ${top}%, 100% ${top}%, 100% ${bottom}%, 0% ${bottom}%)`;

    // 각 슬라이스 타이밍/세기 다르게
    const delay = (Math.random() * 0.9).toFixed(3); // 0~0.9s
    s.style.animationDelay = `${delay}s`;

    // 슬라이스마다 방향 다르게 튀게
    const dx = (Math.random() * 60 - 30).toFixed(1);
    s.style.transform = `translateX(${dx}px)`;

    glitchOverlay.appendChild(s);
  }

  // 3초 유지 후 실제 화면 전환
  setTimeout(() => {
    go(nextScreen);

    glitchOverlay.classList.remove("on");
    glitchOverlay.classList.add("hidden");
    glitchOverlay.innerHTML = "";

    glitching = false;
    lockSend(false);
  }, 3000);
}

/* 화면 전환 */
function go(name) {
  if (!screens[name]) return;

  if (loadingTimer) clearTimeout(loadingTimer);

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  // ✅ 영상은 chat에서만 보이게
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

  if (name === "login") {
    setTimeout(() => loginId?.focus(), 0);
  }

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

  userSendCount = 0;
  glitching = false;

  messages.push({ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" });
  render();
}

/* 보내기 */
async function sendMessage() {
  if (!chatInput) return;

  const text = chatInput.value.trim();
  if (!text) return;
  if (sending || glitching) return;

  lockSend(true);

  // 유저 말풍선 추가
  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

  // ✅ 유저 전송 횟수 카운트
  userSendCount += 1;

  // ✅ 5번째 전송이면 3초 글리치 후 invite로
  if (currentScreen === "chat" && userSendCount >= 5) {
    glitchTo("invite");
    return;
  }

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

// 로그인 입력에서 Enter로 넘어가고 싶으면(선택)
if (loginId) {
  loginId.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // 비번칸이 있으면 거기로, 없으면 로딩으로
      if (loginPw) loginPw.focus();
      else go("loading");
    }
  });
}
if (loginPw) {
  loginPw.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go("loading");
    }
  });
}

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
  if (glitching) return;
  const next = flowNext[currentScreen];
  if (next) go(next);
});

/* 시작 */
go("login");
