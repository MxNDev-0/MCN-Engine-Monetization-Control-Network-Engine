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
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let chatId = null;
let currentChatUser = null;

const adminId = "pmXooqSVxdO53xiCugrqDijR6iI3";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  openChat(adminId);
  loadInbox();
});

/* ================= OPEN CHAT ================= */
function openChat(otherUserId) {
  currentChatUser = otherUserId;
  chatId = [user.uid, otherUserId].sort().join("_");
  loadMessages();
}

/* ================= LOAD ================= */
function loadMessages() {
  const box = document.getElementById("chatBox");

  const q = query(
    collection(db, "dms", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(async (docSnap) => {
      const m = docSnap.data();

      // mark as read
      if (m.to === user.uid && m.read === false) {
        try {
          await updateDoc(doc(db, "dms", chatId, "messages", docSnap.id), {
            read: true
          });
        } catch {}
      }

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
  try {
    const input = document.getElementById("msgInput");

    if (!input.value.trim()) return;

    await addDoc(collection(db, "dms", chatId, "messages"), {
      text: input.value.trim(),
      from: user.uid,
      to: currentChatUser,
      read: false,
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "events"), {
      type: "dm",
      from: user.uid,
      to: currentChatUser,
      createdAt: serverTimestamp()
    });

    input.value = "";

  } catch (err) {
    alert("Message failed");
  }
};

/* ================= ENTER ================= */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("msgInput");

  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMsg();
    });
  }
});

/* ================= INBOX ================= */
async function loadInbox() {
  const inbox = document.getElementById("inboxList");

  const snapshot = await getDocs(collection(db, "dms"));

  inbox.innerHTML = "";

  snapshot.forEach(docSnap => {
    const id = docSnap.id;

    if (!id.includes(user.uid)) return;

    const parts = id.split("_");
    const otherUser = parts[0] === user.uid ? parts[1] : parts[0];

    const div = document.createElement("div");
    div.className = "inbox-item";
    div.textContent = otherUser;

    div.onclick = () => openChat(otherUser);

    inbox.appendChild(div);
  });
}