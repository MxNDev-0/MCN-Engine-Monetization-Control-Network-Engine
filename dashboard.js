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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const API = "https://mxm-backend.onrender.com";

let user = null;
let userData = null;
let isAdmin = false;

/* ================= CHAT STATE ================= */
let activeChatId = null;

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
  loadFeed();
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

/* ================= USERS LIST ================= */
function loadUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="cursor:pointer" onclick="openChat('${u.uid}')">
          🟢 ${u.username || "user"}
        </div>
      `;
    });
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function (uid) {
  getOrCreateChat(uid);
};

async function getOrCreateChat(otherUid) {
  const chatId = [user.uid, otherUid].sort().join("_");

  const ref = doc(db, "conversations", chatId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      users: [user.uid, otherUid],
      updatedAt: serverTimestamp(),
      lastMessage: ""
    });
  }

  activeChatId = chatId;
  loadMessages(chatId);
}

/* ================= LOAD MESSAGES ================= */
function loadMessages(chatId) {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(
    collection(db, "conversations", chatId, "messages"),
    orderBy("time", "asc")
  );

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();

      const isMe = m.senderId === user.uid;

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
            ${m.text}
          </div>

          <small style="font-size:10px;opacity:0.5;">
            ${m.status || "sent"}
          </small>
        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;

    markSeen(chatId);
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text || !activeChatId) return;

  const msgRef = await addDoc(
    collection(db, "conversations", activeChatId, "messages"),
    {
      text,
      senderId: user.uid,
      status: "sent",
      time: serverTimestamp()
    }
  );

  await setDoc(doc(db, "conversations", activeChatId), {
    lastMessage: text,
    updatedAt: serverTimestamp()
  }, { merge: true });

  input.value = "";

  setTimeout(async () => {
    await updateDoc(msgRef, { status: "delivered" });
  }, 800);
};

/* ================= SEEN SYSTEM ================= */
async function markSeen(chatId) {
  const q = query(collection(db, "conversations", chatId, "messages"));

  onSnapshot(q, (snap) => {
    snap.forEach(async (d) => {
      const m = d.data();

      if (m.senderId !== user.uid && m.status !== "seen") {
        await updateDoc(d.ref, { status: "seen" });
      }
    });
  });
}

/* ================= GLOBAL FEED (OPTIONAL KEEP) ================= */
function loadFeed() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();
      if (!m?.text) return;

      html += `
        <div style="margin:4px 0;padding:6px;background:#0b132b;border-radius:6px;">
          <b>${m.user}</b>: ${m.text}
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

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

/* ================= ADMIN ================= */
window.goAdmin = () => {
  if (!userData) return alert("Loading...");
  if (!isAdmin) return alert("❌ Admin only");
  location.href = "admin.html";
};

window.openDeveloper = () => {
  alert("Developer tools coming soon");
};