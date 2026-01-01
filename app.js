const API_BASE = "https://s-chat-api.vercel.app"; // 끝에 / 붙이지 마
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

/* ✅ 튜닝 모드 ON/OFF (최종본 만들 땐 false로) */
const VIDEO_TUNE = true;
let videoTuneActive = VIDEO_TUNE;

function setVideoTune(on){
  videoTuneActive = !!on;
  stage.classList.toggle("tune", videoTuneActive);
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

  // ✅ 영상은 chat에서만 보여주기
  const showVideo = (name === "chat");
  if (mainVideo) {
    mainVideo.classList.toggle("hidden", !showVideo);
    setVideoTune(showVideo && VIDEO_TUNE);

    if (showVideo) {
      mainVideo.currentTime = 0;
      const p = mainVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      mainVideo.pause();
    }
  }

  loginOverlay.classList.toggle("hidden", name !== "login");
  chatOverlay.classList.toggle("hidden", name !== "chat");

  if (name === "login") setTimeout(() => loginId?.focus(), 0);

  if (name === "loading") {
    loadingTimer = setTimeout(() => go("chat"), 1000);
  }

  if (name === "chat") {
    initChat();
    setTimeout(() => chatInput?.focus(), 0);
  }
}

/* ✅ 영상 튜닝: 드래그(위치) + 휠(크기) + C(좌표 출력) */
(function setupVideoTuning(){
  if (!mainVideo) return;

  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  function clamp(n, min, max){
    return Math.max(min, Math.min(max, n));
  }

  function stageRect(){
    return stage.getBoundingClientRect();
  }

  function pxToPctX(px){
    const r = stageRect();
    return (px / r.width) * 100;
  }
  function pxToPctY(px){
    const r = stageRect();
    return (px / r.height) * 100;
  }

  function readPosPct(){
    const r = stageRect();
    const cs = getComputedStyle(mainVideo);
    const l = parseFloat(cs.left);
    const t = parseFloat(cs.top);
    return { lPct: (l / r.width) * 100, tPct: (t / r.height) * 100 };
  }

  function readSizePct(){
    const r = stageRect();
    const cs = getComputedStyle(mainVideo);
    const w = parseFloat(cs.width);
    const h = parseFloat(cs.height);
    return { wPct: (w / r.width) * 100, hPct: (h / r.height) * 100 };
  }

  function setLeftTopPct(leftPct, topPct){
    mainVideo.style.left = `${clamp(leftPct, 0, 100).toFixed(2)}%`;
    mainVideo.style.top  = `${clamp(topPct, 0, 100).toFixed(2)}%`;
  }

  function setSizePct(wPct, hPct){
    mainVideo.style.width  = `${clamp(wPct, 1, 100).toFixed(2)}%`;
    mainVideo.style.height = `${clamp(hPct, 1, 100).toFixed(2)}%`;
  }

  function logCss(){
    const { lPct, tPct } = readPosPct();
    const { wPct, hPct } = readSizePct();
    console.log(`[main-video] left:${lPct.toFixed(2)}%; top:${tPct.toFixed(2)}%; width:${wPct.toFixed(2)}%; height:${hPct.toFixed(2)}%;`);
  }

  mainVideo.addEventListener("pointerdown", (e) => {
    if (!videoTuneActive) return;

    dragging = true;
    mainVideo.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;

    const { lPct, tPct } = readPosPct();
    startLeft = lPct;
    startTop = tPct;
  });

  mainVideo.addEventListener("pointermove", (e) => {
    if (!dragging || !videoTuneActive) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    setLeftTopPct(startLeft + pxToPctX(dx), startTop + pxToPctY(dy));
  });

  mainVideo.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    logCss();
  });

  mainVideo.addEventListener("wheel", (e) => {
    if (!videoTuneActive) return;
    e.preventDefault();

    const step = (e.deltaY > 0) ? -0.5 : 0.5; // 위로 굴리면 커짐
    const { wPct, hPct } = readSizePct();

    if (e.shiftKey) setSizePct(wPct + step, hPct);     // 가로만
    else if (e.altKey) setSizePct(wPct, hPct + step);  // 세로만
    else setSizePct(wPct + step, hPct + step);         // 둘 다

    logCss();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if ((e.key === "c" || e.key === "C") && videoTuneActive) logCss();
    if ((e.key === "t" || e.key === "T") && VIDEO_TUNE) setVideoTune(!videoTuneActive);
  });
})();

/* 로그인 버튼 */
btnPass.onclick = btnEnter.onclick = () => go("loading");

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

function lockSend(lock) {
  sending = lock;
  chatSend.disabled = lock;
  chatSend.style.opacity = lock ? "0.6" : "1";
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || sending) return;

  lockSend(true);

  messages.push({ from: "user", text });
  chatInput.value = "";
  render();

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

chatSend.onclick = sendMessage;
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
