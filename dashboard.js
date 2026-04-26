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
  serverTimestamp,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= GLOBAL STATE ================= */
let user = null;
let userData = null;

window.userData = null; // 🔥 IMPORTANT (fix menu role check)

let lastBTC = null;
let lastETH = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await ensureUser();
  await loadUser();

  loadPrices();
  loadNotifications();
  loadBroadcasts();
  startLiveSystem();

  console.log("✅ Dashboard ready");
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

  if (snap.exists()) {
    userData = snap.data();
    window.userData = userData; // 🔥 CRITICAL FIX
  }
}

/* ================= BROADCAST ================= */
function loadBroadcasts() {
  const box = document.getElementById("broadcastBox");
  if (!box) return;

  const q = query(
    collection(db, "broadcasts"),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();

      box.innerHTML += `
        <div class="item">
          <b>🔔 ${data.title}</b><br>
          ${data.message}
        </div>
      `;
    });
  });
}

/* ================= PRICES ================= */
async function loadPrices() {
  const box = document.getElementById("priceBox");

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    const data = await res.json();

    box.innerHTML = `
      BTC: $${data.bitcoin.usd}<br>
      ETH: $${data.ethereum.usd}
    `;

    checkPriceChange(data);

  } catch {
    box.innerText = "Failed to load prices";
  }
}

function checkPriceChange(data) {
  if (lastBTC && lastETH) {
    if (data.bitcoin.usd !== lastBTC) {
      sendNotification("BTC price changed!");
    }
    if (data.ethereum.usd !== lastETH) {
      sendNotification("ETH price changed!");
    }
  }

  lastBTC = data.bitcoin.usd;
  lastETH = data.ethereum.usd;
}

/* ================= LIVE LOOP ================= */
function startLiveSystem() {
  setInterval(loadPrices, 30000);
}

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  const panel = document.getElementById("notifPanel");
  const badge = document.getElementById("notifCount");

  if (!panel) return;

  onSnapshot(collection(db, "notifications", user.uid, "items"), (snap) => {
    let count = 0;
    let html = "";

    snap.forEach(d => {
      const n = d.data();
      if (!n.seen) count++;
      html += `<div>🔔 ${n.text}</div>`;
    });

    panel.innerHTML = html;

    if (badge) {
      if (count > 0) {
        badge.style.display = "inline-block";
        badge.innerText = count;
      } else {
        badge.style.display = "none";
      }
    }
  });
}

/* ================= SEND NOTIFICATION ================= */
async function sendNotification(text) {
  await addDoc(collection(db, "notifications", user.uid, "items"), {
    text,
    seen: false,
    createdAt: serverTimestamp()
  });
}

/* ================= MENU (GLOBAL FIX) ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("menu");
  if (menu) menu.classList.toggle("active");
};

/* ================= NAVIGATION (GLOBAL FIX) ================= */
window.goHome = function () {
  location.href = "dashboard.html";
};

window.goProfile = function () {
  location.href = "profile.html";
};

window.goMessages = function () {
  location.href = "messages.html";
};

window.goAdSpace = function () {
  location.href = "ads.html";
};

window.goBlog = function () {
  location.href = "blog/index.html";
};

window.goFaq = function () {
  location.href = "faq.html";
};

window.goAbout = function () {
  location.href = "about.html";
};

window.goAdmin = function () {
  if (!window.userData || window.userData.role !== "admin") {
    alert("Admin only");
    return;
  }
  location.href = "admin.html";
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= ADS SLIDER ================= */
let currentAd = 0;

setInterval(() => {
  const slider = document.getElementById("adsSlider");
  if (!slider || !slider.children.length) return;

  currentAd = (currentAd + 1) % slider.children.length;
  slider.style.transform = `translateX(-${currentAd * 100}%)`;
}, 3000);