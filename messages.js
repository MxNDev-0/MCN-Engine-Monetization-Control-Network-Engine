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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let chatId = null;
let currentChatUser = null;

const adminId = "pmXooqSVxdO53xiCugrqDijR6iI3";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

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

/* ================= LOAD MESSAGES ================= */
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

  // if message is for current user → mark read
  if (m.to === user.uid && m.read === false) {
    try {
      await updateDoc(doc(db, "dms", chatId, "messages", docSnap.id), {
        read: true
      });
    } catch (e) {
      console.log("read update failed");
    }
  }
});

/* ================= SEND MESSAGE ================= */
window.sendMsg = async function () {
  try {
    const input = document.getElementById("msgInput");

    if (!input.value.trim()) return;
    if (!user || !chatId) return;

    const text = input.value.trim();

    await addDoc(collection(db, "dms", chatId, "messages"), {
      text,
      from: user.uid,
      to: currentChatUser,
      read: false,
      createdAt: serverTimestamp()
    });

    // 🔥 ADMIN MONITOR EVENT (NO MESSAGE CONTENT)
    await addDoc(collection(db, "events"), {
      type: "dm",
      from: user.uid,
      to: currentChatUser,
      createdAt: serverTimestamp()
    });

    input.value = "";

  } catch (err) {
    console.error(err);
    alert("Message failed");
  }
};

/* ================= ENTER TO SEND ================= */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("msgInput");

  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMsg();
    });
  }
});

/* ================= INBOX SYSTEM ================= */
async function loadInbox() {
  const inbox = document.getElementById("inboxList");
  if (!inbox) return;

  inbox.innerHTML = "Loading...";

  try {
    const dmsRef = collection(db, "dms");
    const snapshot = await getDocs(dmsRef);

    inbox.innerHTML = "";

    snapshot.forEach(docSnap => {
      const id = docSnap.id;

      if (!id.includes(user.uid)) return;

      const parts = id.split("_");
      const otherUser = parts[0] === user.uid ? parts[1] : parts[0];

      const div = document.createElement("div");
      div.className = "inbox-item";
      div.textContent = otherUser;

      div.onclick = () => {
        openChat(otherUser);
      };

      inbox.appendChild(div);
    });

    if (inbox.innerHTML === "") {
      inbox.innerHTML = "<div style='padding:10px;'>No conversations yet</div>";
    }

  } catch (err) {
    console.error("Inbox error:", err);
    inbox.innerHTML = "Failed to load inbox";
  }
}