import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const chatBox = document.getElementById("chatBox");

// ================= AUTH CHECK =================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// ================= SEND MESSAGE =================
window.sendMsg = async function () {
  const input = document.getElementById("msg");
  const text = input.value;

  if (!text) return;

  const user = auth.currentUser;

  await addDoc(collection(db, "messages"), {
    text: text,
    email: user.email,
    createdAt: Date.now()
  });

  input.value = "";
};

// ================= LOAD MESSAGES (REAL-TIME) =================
const q = query(collection(db, "messages"), orderBy("createdAt"));

onSnapshot(q, (snapshot) => {
  chatBox.innerHTML = "";

  snapshot.forEach(doc => {
    const msg = doc.data();

    chatBox.innerHTML += `
      <div class="msg">
        <strong>${msg.email}</strong>
        <p>${msg.text}</p>
      </div>
    `;
  });

  // AUTO SCROLL
  chatBox.scrollTop = chatBox.scrollHeight;
});
