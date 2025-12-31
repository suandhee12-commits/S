const screens = {
  login: "./images/01_login.png",
  loading: "./images/02_loading.png",
  profile: "./images/03_profile.jpg",
  chat: "./images/04_chat.png",
  chatAlt: "./images/05_chat_alt.png",
  invite: "./images/06_invite.png",
};

const bg = document.getElementById("bg");
const stage = document.getElementById("stage");

/* 화면 전환 */
function go(name) {
  if (!screens[name]) return;
  bg.src = screens[name];
  clearHotspots();
  mountHotspots(name);
}

/* 핫스팟 제거 */
function clearHotspots() {
  document.querySelectorAll(".hotspot.dynamic").forEach(el => el.remove());
}

/* 페이지별 핫스팟 */
function mountHotspots(name) {
  const map = hotspots[name];
  if (!map) return;

  map.forEach(h => {
    const btn = document.createElement("button");
    btn.className = "hotspot dynamic";
    btn.style.left = h.x * 100 + "%";
    btn.style.top = h.y * 100 + "%";
    btn.style.width = h.w * 100 + "%";
    btn.style.height = h.h * 100 + "%";
    btn.onclick = h.onClick;
    stage.appendChild(btn);
  });
}

/* 핫스팟 정의 (0~1 비율 좌표) */
const hotspots = {
  login: [
    {
      x: 0.62, y: 0.56, w: 0.18, h: 0.10,
      onClick: () => go("loading")
    }
  ],

  loading: [
    {
      x: 0, y: 0, w: 1, h: 1,
      onClick: () => go("profile")
    }
  ],

  profile: [
    {
      x: 0.78, y: 0.85, w: 0.18, h: 0.1,
      onClick: () => go("chat")
    }
  ],

  chat: [
    {
      x: 0.9, y: 0.9, w: 0.08, h: 0.08,
      onClick: () => go("chatAlt")
    }
  ],

  chatAlt: [
    {
      x: 0.05, y: 0.05, w: 0.1, h: 0.1,
      onClick: () => go("invite")
    }
  ],

  invite: [
    {
      x: 0.05, y: 0.05, w: 0.1, h: 0.1,
      onClick: () => go("profile")
    }
  ],
};

/* 초기 화면 */
go("login");