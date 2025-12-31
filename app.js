// ✅ 캐시 방지 버전 (이미지 교체했는데 옛날게 보이면 숫자 올려)
const V = "v=7";

// ✅ 네 GitHub /images 폴더 파일명 그대로
const screens = {
  login:    `./images/01_login.jpg?${V}`,
  loading:  `./images/02_loading.jpg?${V}`,
  profile:  `./images/03_profile.jpg?${V}`,
  chat:     `./images/04_chat.png?${V}`,
  chatAlt:  `./images/05_chat_alt.png?${V}`,
  invite:   `./images/06_invite.png?${V}`,
};

const bg = document.getElementById("bg");
const stage = document.getElementById("stage");

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

  // 로딩 타이머 정리
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }

  currentScreen = name;
  bg.src = screens[name];

  // login 화면에서만 입력/버튼 표시
  setLoginOverlayVisible(name === "login");

  // ✅ 로딩 화면(02_loading.jpg)은 3초 후 자동 이동
  if (name === "loading") {
    loadingTimer = setTimeout(() => {
      go("profile");
    }, 3000);
  }
}

function setLoginOverlayVisible(visible) {
  if (!loginOverlay) return;
  loginOverlay.classList.toggle("hidden", !visible);
  loginOverlay.setAttribute("aria-hidden", String(!visible));

  if (visible) {
    // UX: 아이디 자동 포커스
    setTimeout(() => loginId?.focus(), 0);
  }
}

/* =========================
   로그인 처리
========================= */
function submitLogin() {
  // 필요하면 검증 넣기 가능(지금은 입력 없어도 통과)
  // const id = (loginId?.value ?? "").trim();
  // const pw = (loginPw?.value ?? "").trim();
  // if (!id || !pw) return;

  go("loading");
}

// 버튼 클릭 시 다음 화면
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

// 외부에서 go 호출 못 하게 막고 싶으면 아래 줄 삭제해도 됨.
// 지금은 개발 편의상 남겨둠.
window.go = go;

// 시작 화면
go("login");
