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
let userData = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUserProfile();
  await loadUserData();
  await registerOnline();

  loadUsers();
  loadFeed();
  loadWallet();
  loadCryptoPrices();

  setupDebugAccess(); // 🔥 NEW
});

/* ================= USER PROFILE ================= */
async function ensureUserProfile() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const defaultUsername = user.email.split("@")[0];

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: defaultUsername,
      role: "user",
      isPremium: false,
      createdAt: Date.now()
    });
  }
}

/* ================= LOAD USER DATA ================= */
async function loadUserData() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    userData = snap.data();
  }
}

/* ================= USERNAME ================= */
async function getUsername() {
  return userData?.username || user.email.split("@")[0];
}

/* ================= ONLINE ================= */
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
  if (!box) return;

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

/* ================= FEED (FULLY FIXED) ================= */
function loadFeed() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(
    collection(db, "posts"),
    orderBy("time", "desc") // 🔥 FIXED
  );

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = "<p style='opacity:0.6;'>No messages yet...</p>";
      return;
    }

    let count = 0;

    snap.forEach(docSnap => {
      const m = docSnap.data();
      if (!m || !m.text) return;

      const visibility = m.visibility || "public";

      // 🔐 Visibility control
      if (visibility === "admin-only" && userData?.role !== "admin") return;
      if (visibility === "premium" && !userData?.isPremium) return;

      count++;

      box.innerHTML += `
        <div style="margin:8px 0; padding:8px; background:#0b132b; border-radius:6px;">
          <b style="color:#5bc0be;">${m.user || "user"}</b>
          <div>${m.text}</div>
        </div>
      `;
    });

    if (count === 0) {
      box.innerHTML = "<p style='opacity:0.6;'>No visible messages</p>";
    }

    box.scrollTop = box.scrollHeight;
  }, (err) => {
    console.error("Feed error:", err);
    box.innerHTML = "<p style='color:red;'>Failed to load chat</p>";
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

/* ================= DEBUG SYSTEM ================= */
function setupDebugAccess() {
  const btn = document.getElementById("debugBtn");
  if (!btn) return;

  if (userData?.role === "admin" || userData?.isPremium) {
    btn.style.display = "block";

    btn.onclick = async () => {
      console.clear();
      console.log("🛠 MCN Debug Start");

      console.log("User:", user.email);
      console.log("Role:", userData?.role);
      console.log("Premium:", userData?.isPremium);

      const snap = await getDoc(doc(db, "users", user.uid));
      console.log("User Data:", snap.data());

      console.log("✅ Debug Complete");
    };

  } else