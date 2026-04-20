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
  setDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const API = "https://mxm-backend.onrender.com";

let user = null;
let userData = null;
let isAdmin = false;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadUsers();
  loadChatV6();
  setupPresence();
  setupTypingListener();
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

      box.innerHTML += `
        <div class="user-item">
          🟢 ${u.username || "user"}
        </div>
      `;
    });
  });
}

/* ================= CHAT V6 ================= */
function loadChatV6() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data() || {};

      const text = m.text ?? "[message removed]";
      const userName = m.user ?? "unknown";

      const time = m.time?.toDate
        ? m.time.toDate().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "";

      const isMe = user && user.email
        ? userName === user.email.split("@")[0]
        : false;

      html += `
        <div style="
          display:flex;
          flex-direction:column;
          align-items:${isMe ? "flex-end" : "flex-start"};
          margin:6px 0;
        ">
          <div style="
            max-width:75%;
            padding:8px 10px;
            border-radius:12px;
            background:${isMe ? "#5bc0be" : "#1c2541"};
            color:${isMe ? "#000" : "#fff"};
            font-size:13px;
            word-break:break-word;
          ">
            ${text}
          </div>

          <small style="font-size:10px;opacity:0.5;">
            ${userName}${time ? " • " + time : ""}
          </small>
        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  });
}

/* ================= TYPING SYSTEM ================= */
let typingTimeout;

window.handleTyping = async function () {
  if (!user) return;

  await setDoc(doc(db, "typing", user.uid), {
    uid: user.uid,
    username: user.email.split("@")[0],
    typing: true,
    updatedAt: serverTimestamp()
  });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(async () => {
    await deleteDoc(doc(db, "typing", user.uid));
  }, 1500);
};

document.addEventListener("input", (e) => {
  if (e.target.id === "chatInput") {
    handleTyping();
  }
});

/* ================= TYPING UI ================= */
function setupTypingListener() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  onSnapshot(collection(db, "typing"), (snap) => {
    let users = [];

    snap.forEach(d => {
      const t = d.data();
      if (t.uid !== user.uid) {
        users.push(t.username || "user");
      }
    });

    let indicator = document.getElementById("typingIndicator");

    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "typingIndicator";
      indicator.style.fontSize = "11px";
      indicator.style.opacity = "0.6";
      indicator.style.marginTop = "5px";
      box.parentNode.appendChild(indicator);
    }

    indicator.innerText = users.length
      ? "⌨️ Someone is typing..."
      : "";
  });
}

/* ================= PRESENCE SYSTEM ================= */
function setupPresence() {
  if (!user) return;

  const ref = doc(db, "presence", user.uid);

  setDoc(ref, {
    uid: user.uid,
    username: user.email.split("@")[0],
    online: true,
    lastSeen: serverTimestamp()
  });

  window.addEventListener("beforeunload", async () => {
    await setDoc(ref, {
      uid: user.uid,
      username: user.email.split("@")[0],
      online: false,
      lastSeen: serverTimestamp()
    }, { merge: true });
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp()
  });

  input.value = "";
};

/* ================= MENU ================= */
window.toggleMenu = function () {
  document.getElementById("menu").classList.toggle("active");
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* ================= NAV ================= */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdSpace = () => location.href = "ads.html";
window.support = () => alert("Support coming soon");
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.goBlog = () => location.href = "blog/index.html";

window.goAdmin = () => {
  if (!userData) return alert("Loading...");
  if (!isAdmin) return alert("❌ Admin only");
  location.href = "admin.html";
};

window.openDeveloper = () => {
  alert("Developer tools coming soon");
};