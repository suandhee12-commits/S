const V = "v=12"; // 캐시 방지: 이미지 교체하면 숫자만 올려

// images 폴더 파일명 그대로 (01~05는 jpg, 06은 png)
const screens = {
  login:    `./images/01_login.jpg?${V}`,
  loading:  `./images/02_loading.jpg?${V}`,
  profile:  `./images/03_profile.jpg?${V}`,
  chat:     `./images/04_chat.jpg?${V}`,
  chatAlt:  `./images/05_chat_alt.jpg?${V}`,
  invite:   `./images/06_invite.png?${V}`,
};

// 흐름: 1-2-4-5-3-6
const flowNext = {
  login: "loading",
  loading: "chat",
  chat: "chatAlt",
  chatAlt: "profile",
  profile: "invite",
  invite: "login",
};

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

// 채팅 데이터
let chatInited = false;
let messages = [];

/* =========================
   화면 전환
========================= */
function go(name) {
  if (!screens[name]) return;

  // 타이머 정리
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }

  currentScreen = name;
  bg.src = screens[name];

  // 오버레이 제어
  setLoginOverlayVisible(name === "login");
  setChatOverlayVisible(name === "chat");

  // 로딩(02)은 1초 후 자동으로 04로 이동
  if (name === "loading") {
    loadingTimer = setTimeout(() => {
      go(flowNext.loading); // chat
    }, 1000);
  }

  // 채팅 화면 진입 시 초기 메시지 1회
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
    { from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" }, // ✅ S가 먼저 인사
  ];
  renderChat();
}

function renderChat() {
  if (!chatLog) return;

  chatLog.innerHTML = "";
  for (const m of messages) {
    const row = document.createElement("div");
    row.className = `msg-row ${m.from === "s" ? "s" : "user"}`;

    if (m.from === "s") {
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = "S"; // 나중에 이미지로 교체 가능
      row.appendChild(avatar);

      const bubble = document.createElement("div");
      bubble.className = "bubble s";
      bubble.textContent = m.text;
      row.appendChild(bubble);
    } else {
      const bubble = document.createElement("div");
      bubble.className = "bubble user";
      bubble.textContent = m.text;
      row.appendChild(bubble);
    }

    chatLog.appendChild(row);
  }

  // 항상 최신으로 스크롤
  chatLog.scrollTop = chatLog.scrollHeight;
}

function sendUserMessage() {
  if (currentScreen !== "chat") return;
  const text = (chatInput?.value ?? "").trim();
  if (!text) return;

  messages.push({ from: "user", text });
  chatInput.value = "";
  renderChat();

  // (선택) S의 간단 자동응답
  setTimeout(() => {
    messages.push({ from: "s", text: pickSReply(text) });
    renderChat();
  }, 350);
}

function pickSReply(userText) {
  // 아주 간단한 룰 기반
  const t = userText.toLowerCase();
  if (t.includes("오랜만") || t.includes("오랜") || t.includes("롱")) return "맞아… 진짜 오랜만이다. 오늘은 뭐 하고 싶어?";
  if (t.includes("보고") || t.includes("그리")) return "나도! 그래서 더 반가워 🙂";
  if (t.includes("?")) return "음… 그건 이렇게 생각해볼까?";
  return "응응! 계속 말해줘. 나 듣고 있어.";
}

// 보내기 버튼
chatSend?.addEventListener("click", sendUserMessage);

// 채팅 입력에서 Enter = 보내기
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendUserMessage();
  }
});

/* =========================
   페이지 진행(클릭으로 넘기기)
   - login: 버튼으로만
   - loading: 자동
   - chat: 채팅해야 하니 자동 진행 금지
   - 나머지(5/3/6): 화면 아무 곳 클릭하면 다음
========================= */
document.addEventListener("click", () => {
  if (currentScreen === "login") return;
  if (currentScreen === "loading") return;
  if (currentScreen === "chat") return;

  const next = flowNext[currentScreen];
  if (next) go(next);
});

// 시작 화면
go("login");
