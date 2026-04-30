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
let unsubscribeMessages = null;

const adminId = "pmXooqSVxdO53xiCugrqDijR6iI3";

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  const params = new URLSearchParams(window.location.search);
  const uidFromUrl = params.get("uid");

  if (uidFromUrl) {
    openChat(uidFromUrl);
  } else {
    document.getElementById("chatBox").innerHTML = "";
  }

  loadInbox();
});

/* ================= OPEN CHAT ================= */
function openChat(otherUserId) {
  currentChatUser = otherUserId;

  chatId = [user.uid, otherUserId].sort().join("_");

  document.getElementById("inboxList").style.display = "none";

  loadMessages();
}

/* ================= LOAD MESSAGES ================= */
function loadMessages() {
  const box = document.getElementById("chatBox");

  if (unsubscribeMessages) unsubscribeMessages();

  const q = query(
    collection(db, "dms", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(async (docSnap) => {
      const m = docSnap.data();

      if (m.to === user.uid && m.read === false) {
        try {
          await updateDoc(doc(db, "dms", chatId, "messages", docSnap.id), {
            read: true
          });
        } catch (e) {}
      }

      const div = document.createElement("div");
      div.className = "msg " + (m.from === user.uid ? "me" : "them");
      div.textContent = m.text;

      box.appendChild(div);
    });

    setTimeout(() => {
      box.scrollTop = box.scrollHeight;
    }, 50);
  });
}

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
    const snapshot = await getDocs(collection(db, "dms"));

    if (snapshot.empty) {
      inbox.innerHTML = "<div style='padding:10px;'>No conversations yet</div>";
      return;
    }

    inbox.innerHTML = "";

    snapshot.forEach(docSnap => {
      const id = docSnap.id;

      if (!id.includes(user.uid)) return;

      const parts = id.split("_");
      const otherUser = parts[0] === user.uid ? parts[1] : parts[0];

      const div = document.createElement("div");
      div.className = "item";
      div.textContent = otherUser;

      div.onclick = () => openChat(otherUser);

      inbox.appendChild(div);
    });

  } catch (err) {
    console.error("Inbox error:", err);
    inbox.innerHTML = "Failed to load inbox";
  }
}

import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* DELETE CHAT */
window.deleteChat = async function () {
  if (!chatId) return;

  const confirmDelete = confirm("Delete this chat?");
  if (!confirmDelete) return;

  try {
    const snap = await getDocs(collection(db, "dms", chatId, "messages"));

    const deletes = [];
    snap.forEach(docSnap => {
      deletes.push(deleteDoc(doc(db, "dms", chatId, "messages", docSnap.id)));
    });

    await Promise.all(deletes);

    alert("Chat deleted");
    location.reload();

  } catch (e) {
    console.error(e);
    alert("Delete failed");
  }
};