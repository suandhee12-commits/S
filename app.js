const API_BASE = "https://s-chat-api.vercel.app";
const V = "vFINAL";

/* 화면 */
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

/* 상태 */
let currentScreen = "login";
let loadingTimer = null;

/* =========================
   영상 튜닝 모드
   ========================= */
const VIDEO_TUNE = false;
let tuneOn = VIDEO_TUNE;

function setTune(on){
  tuneOn = on;
  stage.classList.toggle("tune", on);
}

/* =========================
   화면 전환
   ========================= */
function go(name){
  if (!screens[name]) return;

  currentScreen = name;
  stage.style.aspectRatio = screens[name].ar;
  bg.src = screens[name].src;

  const showVideo = (name === "chat");
  mainVideo.classList.toggle("hidden", !showVideo);

  setTune(showVideo && VIDEO_TUNE);

  if (showVideo){
    mainVideo.muted = true;
    mainVideo.play().catch(()=>{});
  } else {
    mainVideo.pause();
  }

  loginOverlay.classList.toggle("hidden", name !== "login");
  chatOverlay.classList.toggle("hidden", name !== "chat");

  if (name === "loading"){
    clearTimeout(loadingTimer);
    loadingTimer = setTimeout(()=>go("chat"), 1000);
  }
}

/* =========================
   영상 튜닝 (핵심)
   ========================= */
(function(){
  let dragging = false;
  let sx = 0, sy = 0;
  let sl = 0, st = 0;

  const rect = () => stage.getBoundingClientRect();
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  function pos(){
    const r = rect();
    const cs = getComputedStyle(mainVideo);
    return {
      l: parseFloat(cs.left)/r.width*100,
      t: parseFloat(cs.top)/r.height*100
    };
  }
  function size(){
    const r = rect();
    const cs = getComputedStyle(mainVideo);
    return {
      w: parseFloat(cs.width)/r.width*100,
      h: parseFloat(cs.height)/r.height*100
    };
  }
  function log(){
    const p = pos(), s = size();
    console.log(
      `[main-video] left:${p.l.toFixed(2)}%; top:${p.t.toFixed(2)}%; width:${s.w.toFixed(2)}%; height:${s.h.toFixed(2)}%;`
    );
  }

  mainVideo.addEventListener("pointerdown", e=>{
    if (!tuneOn) return;
    dragging = true;
    mainVideo.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY;
    const p = pos(); sl = p.l; st = p.t;
  });

  mainVideo.addEventListener("pointermove", e=>{
    if (!dragging || !tuneOn) return;
    const r = rect();
    mainVideo.style.left = `${clamp(sl + (e.clientX-sx)/r.width*100,0,100)}%`;
    mainVideo.style.top  = `${clamp(st + (e.clientY-sy)/r.height*100,0,100)}%`;
  });

  mainVideo.addEventListener("pointerup", ()=>{
    dragging = false;
    log();
  });

  mainVideo.addEventListener("wheel", e=>{
    if (!tuneOn) return;
    e.preventDefault();
    e.stopPropagation();

    const step = (e.deltaY > 0) ? -0.8 : 0.8;
    const s = size();

    let w = s.w, h = s.h;
    if (e.shiftKey) w += step;
    else if (e.altKey) h += step;
    else { w += step; h += step; }

    mainVideo.style.width  = `${clamp(w,1,100)}%`;
    mainVideo.style.height = `${clamp(h,1,100)}%`;
    log();
  }, { passive:false });

  window.addEventListener("keydown", e=>{
    if (e.key === "c" || e.key === "C") log();
    if (e.key === "t" || e.key === "T") setTune(!tuneOn);
  });
})();

/* 버튼 */
btnPass.onclick = btnEnter.onclick = ()=>go("loading");

/* 시작 */
go("login");
