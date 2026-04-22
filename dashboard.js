import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDoc,
  setDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;
let isAdmin = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadUsers();
  loadPrices();
  loadNotifications();
  initAdsSlider(); // ✅ restored ads slider
});

/* ================= USER ================= */
async function ensureUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: user.email.split("@")[0],
      role: "user"
    });
  }
}

async function loadUser() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) userData = snap.data();
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  onSnapshot(collection(db, "presence"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      if (!u.online) return;

      box.innerHTML += `<div>🟢 ${u.username}</div>`;
    });
  });
}

/* ================= LIVE CRYPTO PRICES ================= */
async function loadPrices() {
  const box = document.getElementById("priceBox");
  if (!box) return;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,eur,gbp"
    );

    const data = await res.json();

    box.innerHTML = `
      BTC: $${data.bitcoin.usd} | €${data.bitcoin.eur} | £${data.bitcoin.gbp}<br>
      ETH: $${data.ethereum.usd} | €${data.ethereum.eur} | £${data.ethereum.gbp}
    `;
  } catch {
    box.innerText = "Failed to load prices";
  }
}

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  const panel = document.getElementById("notifPanel");
  const badge = document.getElementById("notifCount");

  if (!panel || !badge) return;

  onSnapshot(collection(db, "notifications", user.uid, "items"), (snap) => {
    let count = 0;
    let html = "";

    snap.forEach(d => {
      const n = d.data();

      if (!n.seen) count++;

      html += `<div style="padding:6px;border-bottom:1px solid #333;">
        🔔 ${n.text}
      </div>`;
    });

    panel.innerHTML = html;

    if (count > 0) {
      badge.style.display = "inline-block";
      badge.innerText = count;
    } else {
      badge.style.display = "none";
    }
  });
}

/* ================= 🔔 TOGGLE NOTIFICATION PANEL ================= */
window.toggleNotif = function () {
  const panel = document.getElementById("notifPanel");
  if (!panel) return;

  panel.style.display =
    panel.style.display === "block" ? "none" : "block";
};

/* close when clicking outside */
document.addEventListener("click", (e) => {
  const panel = document.getElementById("notifPanel");
  const bell = document.querySelector(".notif-wrapper");

  if (!panel || !bell) return;

  if (!panel.contains(e.target) && !bell.contains(e.target)) {
    panel.style.display = "none";
  }
});

/* ================= ☰ MENU TOGGLE FIX ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= NAV ================= */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goMessages = () => location.href = "messages.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goAdmin = () => {
  if (!isAdmin) return alert("Admin only");
  location.href = "admin.html";
};

/* ================= ADS SLIDER (SAFE VERSION) ================= */
function initAdsSlider() {
  const slider = document.getElementById("adsSlider");
  if (!slider) return;

  let currentAd = 0;

  setInterval(() => {
    const total = slider.children.length;
    if (total === 0) return;

    currentAd = (currentAd + 1) % total;
    slider.style.transform = `translateX(-${currentAd * 100}%)`;
  }, 3000);
}