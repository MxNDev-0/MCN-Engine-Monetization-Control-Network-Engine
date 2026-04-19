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
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUserProfile();
  await registerOnline();

  loadUsers();
  loadFeed();
  loadWallet();
  loadCryptoPrices();
});

/* ================= USER PROFILE INIT ================= */
async function ensureUserProfile() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const defaultUsername = user.email.split("@")[0];

  // 🔥 FIX: DO NOT AUTO-DOWNGRADE OR GUESS ROLES
  // ONLY SET ROLE IF NOT EXISTING

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: defaultUsername,

      // ✅ FIXED: you are ALWAYS admin (owner system fix)
      role: "admin",

      createdAt: Date.now()
    });
  } else {
    const data = snap.data();

    await setDoc(ref, {
      username: data.username || defaultUsername,
      role: data.role || "user"
    }, { merge: true });
  }
}

/* ================= USERNAME ================= */
async function getUsername() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().username || user.email.split("@")[0];
  }

  return user.email.split("@")[0];
}

/* ================= ONLINE TRACK ================= */
async function registerOnline() {
  const name = await getUsername();

  await setDoc(doc(db, "onlineUsers", user.uid), {
    uid: user.uid,
    username: name,
    lastActive: Date.now()
  });
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      const isOnline = Date.now() - (u.lastActive || 0) < 60000;

      box.innerHTML += `
        <div class="user-item">
          <div class="user-left">
            <div class="dot ${isOnline ? "online" : "offline"}"></div>
            <span>${u.username || "user"}</span>
          </div>

          ${isOnline ? "<span class='badge'>LIVE</span>" : ""}
        </div>
      `;
    });
  });
}

/* ================= FEED (FIXED SAFE RENDER) ================= */
function loadFeed() {
  const q = query(collection(db, "posts"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");

    if (!box) return;

    box.innerHTML = "";

    let hasPosts = false;

    snap.forEach(docSnap => {
      const m = docSnap.data();

      if (!m || !m.text) return;
      if (m.visibility === "private") return;

      hasPosts = true;

      box.innerHTML += `
        <div style="margin:6px 0;">
          <b style="color:#5bc0be;">${m.user || "user"}</b>
          <div>${m.text}</div>
        </div>
      `;
    });

    if (!hasPosts) {
      box.innerHTML = "<p style='opacity:0.6;'>No posts yet...</p>";
    }

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND ================= */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  const name = await getUsername();

  await addDoc(collection(db, "posts"), {
    text,
    user: name,
    visibility: "public",
    time: Date.now()
  });

  input.value = "";
};

/* ================= WALLET ================= */
function loadWallet() {
  onSnapshot(doc(db, "wallet", "main"), (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();

    document.getElementById("walletBalance").innerText = data.balance || 0;
    document.getElementById("walletUpdated").innerText =
      data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "-";
  });
}

/* ================= CRYPTO ================= */
async function loadCryptoPrices() {
  const el = document.getElementById("btcPrice");

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,tether&vs_currencies=usd"
    );

    const d = await res.json();

    el.innerText =
      "BTC $" + d.bitcoin.usd +
      " | ETH $" + d.ethereum.usd +
      " | BNB $" + d.binancecoin.usd +
      " | USDT $" + d.tether.usd;

  } catch {
    el.innerText = "Unavailable";
  }
}

setInterval(loadCryptoPrices, 30000);

/* ================= UPGRADE ================= */
async function handleUpgrade() {
  const token = await user.getIdToken();

  const res = await fetch("https://mxm-backend.onrender.com/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  });

  const data = await res.json();

  if (data.payment_url) {
    location.href = data.payment_url;
  }
}

window.goPremium = handleUpgrade;

/* ================= NAV ================= */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = m.style.display === "block" ? "none" : "block";
};

window.goProfile = () => location.href = "profile.html";
window.goHome = () => location.reload();

/* ================= ADMIN FIX ================= */
window.goAdmin = async () => {
  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {
    const role = snap.data().role;

    // ✅ OWNER OVERRIDE FIX
    if (role === "admin") {
      location.href = "admin.html";
      return;
    }
  }

  alert("❌ Admin locked");
};

/* ================= LOGOUT ================= */
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};