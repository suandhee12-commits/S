// ✅ 캐시 방지 버전 (이미지 바꿨는데 옛날게 보이면 숫자만 올려)
const V = "v=9";

// ✅ images 폴더 파일명 그대로 (01~05는 jpg, 06은 png)
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
  invite: "login", // 원하면 마지막은 멈추게 바꿔도 됨
};

const bg = document.getElementById("bg");

// 로그인 오버레이
const loginOverlay = document.getElementById("loginOverlay");
const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw");
const btnPass = document.getElementById("btnPass");
const btnEnter = document.getElementById("btnEnter");

let currentScreen = "login";
let loadingTimer = null;

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

  // login 화면에서만 입력/버튼 표시
  setLoginOverlayVisible(name === "login");

  // ✅ 2번(loading)은 1초 후 자동으로 다음(04_chat) 이동
  if (name === "loading") {
    loadingTimer = setTimeout(() => {
      go(flowNext.loading); // chat
    }, 1000);
  }
}

function setLoginOverlayVisible(visible) {
  if (!loginOverlay) return;
  loginOverlay.classList.toggle("hidden", !visible);
  loginOverlay.setAttribute("aria-hidden", String(!visible));

  if (visible) {
    setTimeout(() => loginId?.focus(), 0);
  }
}

/* =========================
   로그인 처리
========================= */
function submitLogin() {
  // 지금은 데모라 값 없어도 통과
  go(flowNext.login); // loading
}

// 로그인 버튼 클릭 → 다음 화면
btnPass?.addEventListener("click", submitLogin);
btnEnter?.addEventListener("click", submitLogin);

// Enter 키로도 로그인
document.addEventListener("keydown", (e) => {
  if (currentScreen !== "login") return;
  if (e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* =========================
   화면 진행(클릭으로 넘기기)
   - 로그인 화면은 버튼으로만
   - 로딩은 자동
   - 나머지(4/5/3/6)는 화면 아무 곳 클릭하면 다음으로
========================= */
document.addEventListener("click", (e) => {
  // 로그인: 입력칸 클릭도 있어야 해서 자동 진행 금지
  if (currentScreen === "login") return;

  // 로딩: 자동 진행만
  if (currentScreen === "loading") return;

  // 나머지 화면: 어디든 클릭하면 다음
  const next = flowNext[currentScreen];
  if (next) go(next);
});

// 시작 화면
go("login");
