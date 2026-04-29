import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= MONITOR LOG ================= */
function log(msg, color = "#fff") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.innerHTML = `[${time}] ${msg}`;
  line.style.color = color;
  line.style.fontSize = "13px";

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  log("System booting...");
  log("User authenticated");

  loadUsername();
  loadFriendRequests();
  loadFriends();
  loadNotifications();
  monitorAdRequests();
  loadChat();
  startCryptoMonitor();

  loadDMCount();
});

/* ================= CHAT SYSTEM ================= */
function loadChat() {
  const q = query(collection(db, "chats"), orderBy("createdAt"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const m = change.doc.data();
        log(`💬 <b>${m.username}</b>: ${m.text}`, "#5bc0be");
      }
    });
  });
}

window.sendChat = async function () {
  const input = document.getElementById("chatInput");
  if (!input || !input.value.trim()) return;

  const text = input.value;

  log(`💬 <b>You</b>: ${text}`, "#5bc0be");

  input.value = "";

  try {
    await addDoc(collection(db, "chats"), {
      text: text,
      uid: user.uid,
      username: user.email.split("@")[0],
      createdAt: serverTimestamp()
    });
  } catch (e) {
    log("Message failed to send", "#ff4d4d");
  }
};

/* ================= 🔥 FIXED DM COUNT SYSTEM ================= */
function loadDMCount() {
  const el = document.getElementById("msgCount");
  const badge = document.getElementById("msgBadge");

  if (!el) return;

  const unreadMap = new Map();

  onSnapshot(collection(db, "dms"), (snap) => {

    snap.forEach(chatDoc => {
      const chatId = chatDoc.id;

      if (!chatId.includes(user.uid)) return;

      const messagesRef = collection(db, "dms", chatId, "messages");

      onSnapshot(messagesRef, (msgSnap) => {

        let unread = 0;

        msgSnap.forEach(m => {
          const data = m.data();

          if (data.to === user.uid && data.read === false) {
            unread++;
          }
        });

        unreadMap.set(chatId, unread);

        updateTotalUnread();
      });

    });

  });

  function updateTotalUnread() {
    let total = 0;

    unreadMap.forEach(val => {
      total += val;
    });

    el.innerText = total;

    if (total > 0) {
      el.style.color = "#ff4d4d";
      el.style.fontWeight = "bold";

      if (badge) badge.innerHTML = "🔴 NEW";
    } else {
      el.style.color = "#fff";
      el.style.fontWeight = "normal";

      if (badge) badge.innerHTML = "";
    }
  }
}

/* ================= CRYPTO ================= */
let lastBTC = null;
let lastETH = null;

async function fetchCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,ngn"
    );

    const data = await res.json();

    const btc = data.bitcoin.usd;
    const eth = data.ethereum.usd;

    log(`BTC → $${btc.toLocaleString()} | ₦${data.bitcoin.ngn.toLocaleString()}`, "#ccc");
    log(`ETH → $${eth.toLocaleString()} | ₦${data.ethereum.ngn.toLocaleString()}`, "#ccc");

    lastBTC = btc;
    lastETH = eth;

  } catch (e) {
    log("Crypto fetch failed", "#ff4d4d");
  }
}

function startCryptoMonitor() {
  fetchCrypto();
  setInterval(fetchCrypto, 30000);
}

/* ================= USER ================= */
async function loadUsername() {
  const snap = await getDoc(doc(db, "users", user.uid));
  const el = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    el.innerText = snap.data().username;
  } else {
    el.innerText = "Not set";
  }
}

/* ================= UPDATE USERNAME ================= */
window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  const username = input.value.trim();

  if (!username) return alert("Enter username");

  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });

  document.getElementById("usernameDisplay").innerText = username;
  input.value = "";

  log("Username updated");
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent");

  log("Password reset email sent");
};

/* ================= NOTIFICATIONS ================= */
function loadNotifications() {
  const ref = collection(db, "notifications", user.uid, "items");

  onSnapshot(query(ref, orderBy("createdAt", "desc")), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const data = change.doc.data();
        log(data.text || "New notification", "#ccc");
      }
    });
  });
}

/* ================= ADS ================= */
function monitorAdRequests() {
  const q = query(
    collection(db, "adRequests"),
    where("userId", "==", user.uid)
  );

  onSnapshot(q, (snap) => {
    let active = "No active ads";

    snap.forEach(d => {
      const ad = d.data();

      if (ad.status === "approved") {
        active = "Active";
        log("✅ Ad approved", "#00ff88");
      }

      if (ad.status === "rejected") {
        log("❌ Ad rejected", "#ff4d4d");
      }

      if (ad.status === "pending") {
        log("⏳ Ad pending", "#ffaa00");
      }
    });

    const el = document.getElementById("adStatus");
    if (el) el.innerText = active;
  });
}

/* ================= FRIENDS ================= */
window.sendFriendRequest = async function (toUid, toName) {
  if (!user || user.uid === toUid) return;

  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    fromName: user.email.split("@")[0],
    to: toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  log("Friend request sent");
};