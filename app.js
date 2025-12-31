// 6개 화면 이미지 경로
const screens = {
  login: "./images/01_login.png",
  loading: "./images/02_loading.png",
  profile: "./images/03_profile.jpg",
  chat: "./images/04_chat.png",
  chatAlt: "./images/05_chat_alt.png",
  invite: "./images/06_invite.png",
};

// DOM
const bg = document.getElementById("bg");
const stage = document.getElementById("stage");

// 로그인 오버레이 DOM
const loginOverlay = document.getElementById("loginOverlay");
const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw");
const btnPass = document.getElementById("btnPass");
const btnEnter = document.getElementById("btnEnter");

// 현재 화면 상태
let currentScreen = "login";

/* =========================
   화면 전환
========================= */
function go(name) {
  if (!screens[name]) return;

  currentScreen = name;
  bg.src = screens[name];

  // login 화면에서만 입력/버튼 보여주기
  setLoginOverlayVisible(name === "login");

  // 페이지별 핫스팟(필요하면 여기서 추가)
  clearDynamicHotspots();
  mountDynamicHotspots(name);
}

function setLoginOverlayVisible(visible) {
  if (!loginOverlay) return;

  loginOverlay.classList.toggle("hidden", !visible);
  loginOverlay.setAttribute("aria-hidden", String(!visible));

  if (visible) {
    // UX: 아이디에 포커스
    setTimeout(() => loginId?.focus(), 0);
  }
}

/* =========================
   로그인 동작
========================= */
function submitLogin() {
  const id = (loginId?.value ?? "").trim();
  const pw = (loginPw?.value ?? "").trim();

  // 지금은 데모: 값이 비어도 통과하게.
  // 막고 싶으면 아래 if 풀기
  // if (!id || !pw) {
  //   alert("아이디/비밀번호를 입력하세요.");
  //   return;
  // }

  // 다음 화면으로 이동 (원하면 profile로 바로 보내도 됨)
  go("loading");

  // 로딩 화면 잠깐 보여주고 다음으로
  setTimeout(() => go("profile"), 800);
}

/* 버튼 클릭 */
btnPass?.addEventListener("click", submitLogin);
btnEnter?.addEventListener("click", submitLogin);

/* Enter 키로도 로그인 */
document.addEventListener("keydown", (e) => {
  if (currentScreen !== "login") return;
  if (e.key === "Enter") {
    e.preventDefault();
    submitLogin();
  }
});

/* =========================
   (선택) 화면별 동적 핫스팟
   - 지금은 최소 동작만 넣어둠
========================= */

// 동적 핫스팟 제거
function clearDynamicHotspots() {
  stage.querySelectorAll(".hotspot.dynamic").forEach((el) => el.remove());
}

// 동적 핫스팟 생성
function addHotspot({ x, y, w, h, onClick, label }) {
  const btn = document.createElement("button");
  btn.className = "hotspot dynamic";
  btn.style.left = (x * 100) + "%";
  btn.style.top = (y * 100) + "%";
  btn.style.width = (w * 100) + "%";
  btn.style.height = (h * 100) + "%";
  btn.setAttribute("aria-label", label || "hotspot");
  btn.addEventListener("click", onClick);
  stage.appendChild(btn);
}

// 화면별 핫스팟 배치(원하면 계속 늘리면 됨)
function mountDynamicHotspots(name) {
  if (name === "profile") {
    // 예: 오른쪽 아래 버튼(대충) 누르면 채팅으로
    addHotspot({
      x: 0.83, y: 0.86, w: 0.14, h: 0.11,
      label: "to chat",
      onClick: () => go("chat"),
    });
  }

  if (name === "chat") {
    // 예: 우측 하단 버튼 누르면 chatAlt로
    addHotspot({
      x: 0.90, y: 0.88, w: 0.08, h: 0.10,
      label: "toggle chat alt",
      onClick: () => go("chatAlt"),
    });
  }

  if (name === "chatAlt") {
    // 예: 좌측 상단 뒤로가기 느낌
    addHotspot({
      x: 0.02, y: 0.03, w: 0.10, h: 0.10,
      label: "to invite",
      onClick: () => go("invite"),
    });
  }

  if (name === "invite") {
    // 예: 좌측 상단 뒤로가기 느낌
    addHotspot({
      x: 0.02, y: 0.03, w: 0.10, h: 0.10,
      label: "back to profile",
      onClick: () => go("profile"),
    });
  }

  // loading은 클릭해도 넘어가게 하고 싶으면:
  if (name === "loading") {
    addHotspot({
      x: 0, y: 0, w: 1, h: 1,
      label: "skip loading",
      onClick: () => go("profile"),
    });
  }
}

// 전역으로 노출(개발용 네비 버튼에서 쓰려고)
window.go = go;

// 초기 화면
go("login");
