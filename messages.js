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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let chatId = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  // 🔥 ADMIN UID (already correct)
  const adminId = "pmXooqSVxdO53xiCugrqDijR6iI3";

  chatId = [user.uid, adminId].sort().join("_");

  loadMessages();
});

/* ================= LOAD ================= */
function loadMessages() {
  const box = document.getElementById("chatBox");

  const q = query(
    collection(db, "dms", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

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

    // 🚫 prevent sending before auth/chat ready
    if (!user || !chatId) {
      console.log("Chat not ready yet");
      return;
    }

    await addDoc(collection(db, "dms", chatId, "messages"), {
      text: input.value.trim(),
      from: user.uid,
      createdAt: serverTimestamp()
    });

    input.value = "";

  } catch (err) {
    console.error("Send error:", err);
    alert("Message failed to send");
  }
};

/* ================= ENTER TO SEND ================= */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("msgInput");

  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMsg();
      }
    });
  }
});