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
let lastBTC = null;
let lastETH = null;

window.userData = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await ensureUser();
  await loadUser();

  loadPrices();
  loadNotifications();
  loadBroadcasts();
  loadChat();
  startLiveSystem();

  console.log("Dashboard ready");
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
    window.userData = userData;
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

    snapshot.forEach(docSnap => {
      const d = docSnap.data();

      box.innerHTML += `
        <div class="item">
          🔔 <b>${d.title}</b><br>
          ${d.message}
        </div>
      `;
    });
  });
}

/* ================= PRICES ================= */
async function loadPrices() {
  const box = document.getElementById("priceBox");
  if (!box) return;

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    const data = await res.json();

    box.innerHTML = `
      BTC: $${data.bitcoin.usd}<br>
      ETH: $${data.ethereum.usd}
    `;
  } catch {
    box.innerText = "Failed to load prices";
  }
}

function startLiveSystem() {
  setInterval(loadPrices, 30000);
}

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  const panel = document.getElementById("notifPanel");
  if (!panel) return;

  onSnapshot(collection(db, "notifications", user.uid, "items"), (snap) => {
    let html = "";

    snap.forEach(d => {
      html += `<div>🔔 ${d.data().text}</div>`;
    });

    panel.innerHTML = html;
  });
}

/* ================= CHAT SYSTEM (NEW UNIFIED EVENTS) ================= */
window.sendChat = async () => {
  const input = document.getElementById("chatInput");
  if (!input || !input.value.trim()) return;

  try {
    await addDoc(collection(db, "events"), {
      type: "chat",
      text: input.value,
      uid: user.uid,
      username: userData?.username || user.email,
      role: userData?.role || "user",
      createdAt: serverTimestamp()
    });

    input.value = "";
  } catch (err) {
    console.error(err);
  }
};

function loadChat() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  onSnapshot(
    query(collection(db, "events"), orderBy("createdAt", "asc")),
    (snap) => {
      box.innerHTML = "";

      snap.forEach(docSnap => {
        const m = docSnap.data();

        if (m.type !== "chat") return;

        box.innerHTML += `
          <div class="item">
            <b>${m.username}</b><br>
            ${m.text}
          </div>
        `;
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

/* ================= MENU FIX ================= */
window.toggleMenu = function () {
  document.getElementById("menu")?.classList.toggle("active");
};

window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= NAVIGATION ================= */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goMessages = () => location.href = "messages.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";

window.goAdmin = () => {
  if (!window.userData || window.userData.role !== "admin") {
    alert("Admin only");
    return;
  }
  location.href = "admin.html";
};

/* ================= ADS ================= */
let currentAd = 0;

setInterval(() => {
  const slider = document.getElementById("adsSlider");
  if (!slider) return;

  currentAd = (currentAd + 1) % slider.children.length;
  slider.style.transform = `translateX(-${currentAd * 100}%)`;
}, 3000);