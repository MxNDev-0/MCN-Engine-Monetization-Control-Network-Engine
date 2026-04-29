import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let chatId = null;
let currentChatUser = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");

  if (uid) openChat(uid);

  loadInbox();
});

/* ================= OPEN CHAT ================= */
function openChat(other) {
  currentChatUser = other;
  chatId = [user.uid, other].sort().join("_");

  listenMessages();
}

/* ================= MESSAGES ================= */
function listenMessages() {
  const box = document.getElementById("chatBox");

  const q = query(
    collection(db, "dms", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();

      const div = document.createElement("div");
      div.className = "msg " + (m.from === user.uid ? "me" : "them");
      div.textContent = m.text;

      box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= SEND ================= */
window.sendMsg = async function () {
  const input = document.getElementById("msgInput");
  if (!input.value.trim()) return;

  await addDoc(collection(db, "dms", chatId, "messages"), {
    text: input.value,
    from: user.uid,
    to: currentChatUser,
    read: false,
    createdAt: serverTimestamp()
  });

  // inbox sync fix
  await setDoc(doc(db, "conversations", chatId), {
    participants: [user.uid, currentChatUser],
    lastMessage: input.value,
    updatedAt: serverTimestamp()
  }, { merge: true });

  input.value = "";
};

/* ================= FIXED INBOX ================= */
async function loadInbox() {
  const box = document.getElementById("inboxList");

  const snap = await getDocs(collection(db, "conversations"));

  box.innerHTML = "";

  snap.forEach(d => {
    const data = d.data();

    if (!data.participants.includes(user.uid)) return;

    const other = data.participants.find(x => x !== user.uid);

    const div = document.createElement("div");
    div.className = "item";
    div.innerText = other + " • " + (data.lastMessage || "");

    div.onclick = () => openChat(other);

    box.appendChild(div);
  });
}