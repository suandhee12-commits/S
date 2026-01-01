/* =========================
   ✅ 너가 바꿀 곳(딱 1줄)
   ========================= */
const API_BASE = "https://s-chat-api.vercel.app"; // 끝에 / 붙이지 마

/* 캐시 무효화 버전 */
const V = "vFIX1";

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
  sShort: `./images/speech%20bubble%201.png?${V}`,
  sLong:  `./images/speech%20bubble%202.png?${V}`,
  uShort: `./images/speech%20bubble%203.png?${V}`,
  uLong:  `./images/speech%20bubble%204.png?${V}`,
};

/* DOM */
const stage = document.getElementById("stage");
const bg = document.getElementById("bg");

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
let sending = false; // 중복 호출 방지

/* =========================
   API
   ========================= */
function toApiHistory(msgs) {
  return msgs
    .filter(m => (m?.text || "").trim() !== "")
    .slice(-10)
    .map(m => ({
      role: m.from === "s" ? "assistant" : "user",
      content: m.text
    }));
}

async function fetchSReply(userText, msgs) {
  const res = await fetch(`${API_BASE}/chat`, {
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
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const text = (data.text || data.reply || data.message || "").trim();
  return text || "…";
}

/* =========================
   화면 전환
   ========================= */
function go(name) {
  if (!screens[name]) return;

  if (loadingTimer) clearTimeout(loadingTimer);

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  // 오버레이는 login / chat만 사용 (나머지는 배경만)
  loginOverlay.classList.toggle("hidden", name !== "login");
  chatOverlay.classList.toggle("hidden", name !== "chat");

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go("chat"), 1000);
  }

  if (name === "chat") initChat();
}

/* 로그인: 버튼 클릭 */
btnPass.onclick = () => go("loading");
btnEnter.onclick = () => go("loading");

/* ✅ 로그인: 엔터키로도 넘어가기 */
loginId.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    go("loading");
  }
});

/* =========================
   말풍선 렌더
   ========================= */
function isLong(text) {
  const t = text || "";
  return t.length > 22 || (t.match(/[.!?]/g) || []).length >= 2;
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

/* ✅ 텍스트 길어지면 말풍선(이미지 포함) 세로로 늘리기 */
function adjustBubbleHeights() {
  const wraps = chatLog.querySelectorAll(".bubble-wrap");

  wraps.forEach(wrap => {
    const img = wrap.querySelector(".bubble-img");
    const txt = wrap.querySelector(".bubble-text");
    if (!img || !txt) return;

    const run = () => {
      // 현재 폭 기준 원본 비율로 "기본 높이" 계산
      const baseH =
        Number(wrap.dataset.baseH) ||
        (wrap.dataset.baseH = String(wrap.clientWidth * (img.naturalHeight / img.naturalWidth)));

      // bubble-text absolute top/bottom 고려
      const cs = getComputedStyle(txt);
      const top = parseFloat(cs.top) || 0;
      const bottom = parseFloat(cs.bottom) || 0;

      const available = baseH - top - bottom;
      const need = txt.scrollHeight;

      if (need > available) {
        const extra = (need - available) + 10; // 여유
        wrap.style.height = `${baseH + extra}px`;

        // CSS 안 건드리고 JS로 이미지도 함께 늘림
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "fill";
      } else {
        wrap.style.height = "";
        img.style.width = "";
        img.style.height = "";
        img.style.objectFit = "";
      }
    };

    // 이미지 로드 전이면 로드 후 계산
    if (!img.naturalWidth || !img.naturalHeight) {
      img.addEventListener("load", run, { once: true });
      return;
    }
    run();
  });
}

function render() {
  chatLog.innerHTML = "";
  messages.forEach(m => chatLog.appendChild(bubble(m.from, m.text)));
  chatLog.scrollTop = chatLog.scrollHeight;

  // 레이아웃 확정 후 높이 보정 (2번 raf가 안전)
  requestAnimationFrame(() => requestAnimationFrame(adjustBubbleHeights));
}

/* =========================
   채팅 초기화 / 전송
   ========================= */
function initChat() {
  if (chatInited) return;
  chatInited = true;

  messages.push({ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" });
  render();
}

function lockSend(on) {
  sending = on;
  chatSend.disabled = on;
  chatInput.disabled = on;
}

async function sendMessage() {
  if (sending) return;

  const text = (chatInput.value || "").trim();
  if (!text) return;

  lockSend(true);

  // 유저 말풍선
  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

  // S 생각중(임시)
  messages.push({ from: "s", text: "…" });
  render();

  try {
    const reply = await fetchSReply(text, messages.slice(0, -1)); // 임시 '…' 제외
    messages[messages.length - 1] = { from: "s", text: reply };
    render();
  } catch (e) {
    console.error(e);
    messages[messages.length - 1] = { from: "s", text: "잠깐만… 지금은 연결이 조금 불안정해." };
    render();
  } finally {
    lockSend(false);
    chatInput.focus();
  }
}

/* 채팅: 버튼/엔터 */
chatSend.onclick = sendMessage;

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

/* 배경 화면(프로필/초대 등)에서 클릭하면 다음 화면 */
document.addEventListener("click", (e) => {
  // 입력 중/버튼 클릭은 그냥 통과
  if (e.target === loginId || e.target === chatInput || e.target === btnPass || e.target === btnEnter || e.target === chatSend) return;

  if (currentScreen === "chat" || currentScreen === "login" || currentScreen === "loading") return;
  go(flowNext[currentScreen] || "login");
});

/* 시작 */
go("login");
