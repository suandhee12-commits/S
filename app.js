/* =========================
   ✅ 너가 바꿀 곳(딱 1줄)
   ========================= */
const API_BASE = "https://s-chat-api.vercel.app"; // 끝에 / 붙이지 마

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

const bubbles = {
  uShort: `./images/bubble_user_short.png?${V}`,
  uLong:  `./images/bubble_user_long.png?${V}`,
  sShort: `./images/bubble_s_short.png?${V}`,
  sLong:  `./images/bubble_s_long.png?${V}`,
};

/* DOM */
const stage = document.getElementById("stage");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const loginBtn = document.getElementById("loginBtn");

/* 상태 */
let currentScreen = "login";
let chatInited = false;
let sending = false;
let messages = [];

/* 화면 전환 */
function go(screenName) {
  currentScreen = screenName;

  // 배경 이미지 교체
  const sc = screens[screenName] || screens.login;
  stage.style.backgroundImage = `url("${sc.src}")`;
  stage.style.aspectRatio = sc.ar;

  // 화면별 UI 토글
  document.body.dataset.screen = screenName;

  if (screenName === "chat") initChat();
}

/* 로그인 -> 로딩 -> 채팅 */
loginBtn.onclick = () => {
  go("loading");
  setTimeout(() => go("chat"), 1200);
};

/* 채팅 alternate 화면 전환 */
document.getElementById("btnProfile")?.addEventListener("click", () => go("profile"));
document.getElementById("btnInvite")?.addEventListener("click", () => go("invite"));
document.getElementById("btnBack")?.addEventListener("click", () => go("chatAlt"));
document.getElementById("btnBack2")?.addEventListener("click", () => go("chatAlt"));

/* profile/invite -> chatAlt -> chat */
const flowNext = { profile: "invite", invite: "chatAlt", chatAlt: "chat" };

/* 말풍선 길이 판단(너가 원하는 기준으로 바꿔도 됨) */
function isLong(text) {
  return (text || "").length >= 20;
}

/* 말풍선 DOM */
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

function adjustBubbleHeights() {
  const wraps = chatLog.querySelectorAll(".bubble-wrap");

  wraps.forEach(wrap => {
    const img = wrap.querySelector(".bubble-img");
    const txt = wrap.querySelector(".bubble-text");
    if (!img || !txt) return;

    // 이미지 로드 전이면 로드 후 다시 계산
    if (!img.naturalWidth || !img.naturalHeight) {
      img.addEventListener("load", adjustBubbleHeights, { once: true });
      return;
    }

    // 현재 폭 기준으로 "원래 말풍선 높이" 계산(비율 유지)
    const baseH =
      Number(wrap.dataset.baseH) ||
      (wrap.dataset.baseH = String(wrap.clientWidth * (img.naturalHeight / img.naturalWidth)));

    // bubble-text의 top/bottom(absolute) 값을 고려해 텍스트가 쓸 수 있는 공간 계산
    const cs = getComputedStyle(txt);
    const top = parseFloat(cs.top) || 0;
    const bottom = parseFloat(cs.bottom) || 0;
    const available = baseH - top - bottom;

    const need = txt.scrollHeight;

    if (need > available) {
      const extra = (need - available) + 8; // 약간의 여유
      wrap.style.height = `${baseH + extra}px`;

      // CSS 수정 없이 JS에서 바로 이미지도 함께 늘리기
      img.style.height = "100%";
      img.style.width = "100%";
      img.style.objectFit = "fill";
    } else {
      wrap.style.height = "";
      img.style.height = "";
      img.style.width = "";
      img.style.objectFit = "";
    }
  });
}

function render() {
  chatLog.innerHTML = "";
  messages.forEach(m => chatLog.appendChild(bubble(m.from, m.text)));
  chatLog.scrollTop = chatLog.scrollHeight;

  // 렌더된 뒤 레이아웃이 확정된 다음 말풍선 높이 보정
  requestAnimationFrame(() => requestAnimationFrame(adjustBubbleHeights));
}

/* =========================
   채팅 초기화 / 전송
   ========================= */
function initChat() {
  if (chatInited) return;
  chatInited = true;

  messages.push({ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" });
  render()
}

/* 전송 잠금 */
function lockSend(on) {
  sending = on;
  sendBtn.disabled = on;
  chatInput.disabled = on;
}

/* API 호출 */
async function fetchSReply(userText, historyMessages) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: historyMessages
        .filter(m => m.text && m.text.trim() !== "")
        .slice(-10)
        .map(m => ({
          role: m.from === "s" ? "assistant" : "user",
          content: m.text
        })),
      userText
    })
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.reply || "…";
}

/* 메시지 전송 */
async function sendMessage() {
  if (sending) return;

  const text = (chatInput.value || "").trim();
  if (!text) return;

  lockSend(true);

  // 유저 말풍선
  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

  // S 생각중 말풍선(임시)
  messages.push({ from: "s", text: "…" });
  render();

  try {
    // ✅ 임시 '…' 제외한 히스토리로 요청
    const reply = await fetchSReply(text, messages.slice(0, -1));
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

/* 버튼 / 엔터 */
sendBtn.onclick = sendMessage;

chatInput.onkeydown = (e) => {
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
