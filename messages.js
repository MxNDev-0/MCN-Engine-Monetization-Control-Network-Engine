import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let me = null;
let activeChat = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";
  me = u;

  await setPresence();
  loadChats();
});

/* ================= CHAT ID ================= */
function chatId(a, b) {
  return [a, b].sort().join("_");
}

/* ================= PRESENCE ================= */
async function setPresence() {
  const ref = doc(db, "users", me.uid);

  await setDoc(ref, {
    online: true,
    lastSeen: serverTimestamp()
  }, { merge: true });

  onDisconnect(ref).update({
    online: false,
    lastSeen: serverTimestamp()
  });
}

/* ================= LOAD CHAT LIST ================= */
function loadChats() {
  const q = query(collection(db, "chats"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatList");
    box.innerHTML = "";

    snap.forEach(d => {
      const c = d.data();

      if (!c.members.includes(me.uid)) return;

      const other = c.members.find(u => u !== me.uid);

      box.innerHTML += `
        <div class="chat-item" onclick="openChat('${other}')">
          <div class="chat-name">${other}</div>
          <div class="chat-last">${c.lastMessage || ""}</div>
        </div>
      `;
    });
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function(uid) {
  activeChat = chatId(me.uid, uid);

  document.getElementById("msgInput").disabled = false;
  document.getElementById("sendBtn").disabled = false;

  document.getElementById("chatName").innerText = uid;

  loadMessages();
  listenTyping(uid);
};

/* ================= LOAD MESSAGES ================= */
function loadMessages() {
  const q = query(
    collection(db, "chats", activeChat, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snap) => {
    const box = document.getElementById("messages");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      const isMe = m.senderId === me.uid;

      box.innerHTML += `
        <div class="msg ${isMe ? "me" : "other"}">
          ${m.text}<br>
          <small>${m.status || "sent"}</small>
        </div>
      `;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND MESSAGE ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !activeChat) return;

  await addDoc(collection(db, "chats", activeChat, "messages"), {
    text,
    senderId: me.uid,
    createdAt: serverTimestamp(),
    status: "sent"
  });

  await updateDoc(doc(db, "chats", activeChat), {
    lastMessage: text,
    lastUpdated: serverTimestamp(),
    members: arrayUnion(me.uid)
  });

  input.value = "";
};

/* ================= TYPING ================= */
document.getElementById("msgInput").addEventListener("input", async () => {
  if (!activeChat) return;

  await setDoc(doc(db, "typing", me.uid), {
    chatId: activeChat,
    typing: true
  });

  setTimeout(async () => {
    await setDoc(doc(db, "typing", me.uid), {
      chatId: activeChat,
      typing: false
    });
  }, 1500);
});

/* ================= LISTEN TYPING ================= */
function listenTyping(uid) {
  const ref = doc(db, "typing", uid);

  onSnapshot(ref, (snap) => {
    const d = snap.data();
    const el = document.getElementById("typing");

    if (d?.chatId === activeChat && d?.typing) {
      el.innerText = "typing...";
    } else {
      el.innerText = "";
    }
  });
}