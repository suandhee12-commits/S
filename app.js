const V = "vFINAL";

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

const bubbles = {
  sShort: "./images/speech%20bubble%201.png",
  sLong:  "./images/speech%20bubble%202.png",
  uShort: "./images/speech%20bubble%203.png",
  uLong:  "./images/speech%20bubble%204.png",
};

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

let currentScreen = "login";
let loadingTimer = null;
let chatInited = false;
let messages = [];

/* ===== 화면 전환 ===== */
function go(name) {
  if (!screens[name]) return;

  if (loadingTimer) clearTimeout(loadingTimer);

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  loginOverlay.classList.toggle("hidden", name !== "login");
  chatOverlay.classList.toggle("hidden", name !== "chat");

  if (name === "login") setTimeout(() => loginId.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go("chat"), 1000);
  }

  if (name === "chat") {
    initChat();
    setTimeout(() => chatInput.focus(), 0);
  }
}

/* 로그인 */
btnPass.onclick = btnEnter.onclick = () => go("loading");

/* 채팅 */
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

function initChat() {
  if (chatInited) return;
  chatInited = true;
  messages.push({ from: "s", text: "오~ 잘 왔어! 너무 보고 싶었어~" });
  render();
}

chatSend.onclick = () => {
  const text = chatInput.value.trim();
  if (!text) return;

  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

  setTimeout(() => {
    messages.push({ from: "s", text: "응응, 계속 말해줘. 나 듣고 있어." });
    render();
  }, 400);
};

chatInput.onkeydown = e => {
  if (e.key === "Enter") {
    e.preventDefault();
    chatSend.click();
  }
};

/* 클릭으로 다음 화면 */
document.onclick = () => {
  if (currentScreen === "chat" || currentScreen === "login" || currentScreen === "loading") return;
  go(flowNext[currentScreen]);
};

go("login");
