import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";
  user = u;

  // ✅ MARK ONLINE
  await setDoc(doc(db, "onlineUsers", user.uid), {
    email: user.email,
    lastActive: Date.now()
  });

  // ✅ REMOVE WHEN LEAVING
  window.addEventListener("beforeunload", async () => {
    try {
      await deleteDoc(doc(db, "onlineUsers", user.uid));
    } catch (e) {}
  });

  loadFeed();
  loadWallet();
  loadCryptoPrices(); // ✅ FIXED
  trackOnlineUsers(); // ✅ FIXED
});

/* ================= USERS (FIXED CLEAN DISPLAY) ================= */
function trackOnlineUsers() {
  const usersRef = collection(db, "onlineUsers");

  onSnapshot(usersRef, (snap) => {
    const box = document.getElementById("onlineUsers");
    if (!box) return;

    let html = "";
    let count = 0;

    snap.forEach(docSnap => {
      const u = docSnap.data();
      count++;

      html += `<div>🟢 ${u.email}</div>`;
    });

    box.innerHTML = `
      <div style="font-weight:bold;margin-bottom:5px;">
        Total Online: ${count}
      </div>
      ${html}
    `;
  });
}

/* ================= CHAT ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: Date.now()
  });

  input.value = "";
};

/* ================= FEED ================= */
function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const m = docSnap.data();

      box.innerHTML += `
        <div style="margin:6px 0;">
          <b style="color:#5bc0be;">${m.user}</b>
          <div>${m.text}</div>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= WALLET ================= */
function loadWallet() {
  const walletRef = doc(db, "wallet", "main");

  onSnapshot(walletRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();

      document.getElementById("walletBalance").innerText = data.balance || 0;

      document.getElementById("walletUpdated").innerText =
        data.lastUpdated
          ? new Date(data.lastUpdated).toLocaleString()
          : "-";
    }
  });
}

/* ================= ✅ FIXED CRYPTO (BTC + ETH + BNB + USDT) ================= */
async function loadCryptoPrices() {
  const el = document.getElementById("btcPrice");
  if (!el) return;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether&vs_currencies=usd"
    );

    const data = await res.json();

    if (!data.bitcoin) throw new Error("API failed");

    el.innerText =
      "BTC: $" + data.bitcoin.usd +
      " | ETH: $" + data.ethereum.usd +
      " | BNB: $" + data.binancecoin.usd +
      " | USDT: $" + data.tether.usd;

  } catch (err) {
    // ✅ fallback (important)
    el.innerText = "Crypto prices unavailable (API limit)";
  }
}

/* refresh every 30s */
setInterval(loadCryptoPrices, 30000);

/* ================= UPGRADE ================= */
const UPGRADE_LINK = "https://nowpayments.io/payment/?iid=5153003613";

window.goPremium = async () => {
  if (!user) return;

  window.open(UPGRADE_LINK, "_blank");

  await setDoc(doc(db, "upgradeRequests", user.uid), {
    uid: user.uid,
    email: user.email,
    status: "pending",
    createdAt: Date.now()
  });

  alert("Upgrade request sent.");
};

/* FIX BUTTON */
window.upgrade = () => window.goPremium();

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

function closeMenu() {
  const m = document.getElementById("menu");
  if (m) m.style.display = "none";
}

window.goProfile = () => {
  closeMenu();
  location.href = "profile.html";
};

window.goHome = () => {
  closeMenu();
  location.reload();
};

window.goAdmin = () => {
  closeMenu();

  if (!user) return;

  if (user.email !== "nc.maxiboro@gmail.com") {
    alert("❌ Admin panel locked");
  } else {
    location.href = "admin.html";
  }
};

/* ================= LOGOUT ================= */
window.logout = async () => {
  if (user) {
    try {
      await deleteDoc(doc(db, "onlineUsers", user.uid));
    } catch (e) {}
  }

  signOut(auth).then(() => location.href = "index.html");
};