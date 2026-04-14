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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH CHECK ================= */
onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";
  user = u;

  loadFeed();
  loadWallet(); // NEW
  loadBTCPrice(); // NEW
});

/* ================= CHAT SYSTEM ================= */
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
          <div style="color:#fff;">${m.text}</div>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= WALLET (READ ONLY) ================= */
function loadWallet() {
  const walletRef = doc(db, "wallet", "main");

  onSnapshot(walletRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();

      const balanceEl = document.getElementById("walletBalance");
      const updatedEl = document.getElementById("walletUpdated");

      if (balanceEl) balanceEl.innerText = data.balance || 0;

      if (updatedEl) {
        updatedEl.innerText = data.lastUpdated
          ? new Date(data.lastUpdated).toLocaleString()
          : "-";
      }
    }
  });
}

/* ================= LIVE BTC PRICE ================= */
async function loadBTCPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );

    const data = await res.json();

    const btcEl = document.getElementById("btcPrice");

    if (btcEl) {
      btcEl.innerText = data.bitcoin.usd;
    }
  } catch (err) {
    const btcEl = document.getElementById("btcPrice");
    if (btcEl) btcEl.innerText = "Error";
  }
}

/* refresh BTC every 30 seconds */
setInterval(loadBTCPrice, 30000);

/* ================= 🚀 UPGRADE SYSTEM (NOWPAYMENTS + FIREBASE) ================= */

const UPGRADE_LINK = "https://nowpayments.io/payment/?iid=5153003613";

/**
 * Upgrade button handler
 */
window.goPremium = async () => {
  if (!user) return;

  // Open payment page
  window.open(UPGRADE_LINK, "_blank");

  // Save upgrade request in Firebase
  await setDoc(doc(db, "upgradeRequests", user.uid), {
    uid: user.uid,
    email: user.email,
    status: "pending",
    source: "NOWPayments",
    createdAt: Date.now()
  });

  alert("Upgrade request sent. Complete payment to activate premium.");
};

/**
 * Admin approval (future use)
 */
window.confirmUpgrade = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    premium: true,
    upgradedAt: Date.now()
  });

  alert("User upgraded successfully!");
};

/* ================= MENU ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "block") ? "none" : "block";
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
    alert("✅ Admin access");
    location.href = "admin.html";
  }
};

/* ================= LOGOUT ================= */
window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};
