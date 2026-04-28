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
  if (!u) return location.href = "index.html";

  user = u;

  // 🔥 chat with admin
  const adminId = "pmXooqSVxdO53xiCugrqDijR6iI3"; // ⚠️ REPLACE THIS

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
  const input = document.getElementById("msgInput");
  if (!input.value.trim()) return;

  await addDoc(collection(db, "dms", chatId, "messages"), {
    text: input.value,
    from: user.uid,
    createdAt: serverTimestamp()
  });

  input.value = "";
};