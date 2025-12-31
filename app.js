/* =========================
   ✅ 너가 바꿀 곳(딱 1줄)
   ========================= */
const API_BASE = "https://s-chat-api.vercel.app";

/* 캐시 무효화 버전 */
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

/* =========================
   GPT 연결 유틸
   ========================= */

/* messages -> API history 변환 (최근 10개만) */
function toApiHistory(msgs) {
  return msgs.slice(-10).map(m => ({
    role: m.from === "s" ? "assistant" : "user",
    content: m.text
  }));
}

/* 서버(Vercel)로 보내서 S 답변 받기 */
async function fetchSReply(userText, msgs) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userText,
      history: toApiHistory(msgs)
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `API error (${res.status})`);
  return (data.text || "").trim() || "…";
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

  loginOverlay.classList.toggle("hidden", name !== "login");
  chatOverlay.classList.toggle("hidden", name !== "chat");

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go("chat"), 1000); // 로딩 1초
  }

  if (name === "chat") {
    initChat();
    setTimeout(() => chatInput?.focus(), 0);
  }
}

/* 로그인 버튼 */
btnPass.onclick = btnEnter.onclick = () => go("loading");

/* =========================
   말풍선 렌더
   ========================= */
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
  chatLog.innerHTML = "";
  messages.forEach(m => chatLog.appendChild(bubble(m.from, m.text)));
  chatLog.scrollTop = chatLog.scrollHeight;
}

/* =========================
   채팅 초기화 / 전송
   ========================= */
function initChat() {
  if (chatInited) return;
  chatInited = true;

  // 첫 인사 (원하면 여기도 GPT로 바꿀 수 있지만, 일단 고정)
  messages.push({ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" });
  render();
}

/* ✅ 보내기: 유저 입력 -> GPT 호출 -> S 답변 */
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 유저 말풍선
  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

  // S 생각중 말풍선(임시)
  messages.push({ from: "s", text: "…" });
  render();

  try {
    // 임시 '…' 제외하고 히스토리 구성
    const reply = await fetchSReply(text, messages.slice(0, -1));
    // 마지막 '…'를 실제 답으로 교체
    messages[messages.length - 1] = { from: "s", text: reply };
  } catch (e) {
    messages[messages.length - 1] = {
      from: "s",
      text: "지금은 잠시 연결이 불안정해. 조금만 다시 말해줄래?"
    };
  }

  render();
}

chatSend.onclick = () => { sendMessage(); };

chatInput.onkeydown = e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};

/* 클릭으로 다음 화면 (기존 로직 유지) */
document.onclick = () => {
  if (currentScreen === "chat" || currentScreen === "login" || currentScreen === "loading") return;
  go(flowNext[currentScreen]);
};

/* 시작 */
go("login");
