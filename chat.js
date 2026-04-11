import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const chatBox = document.getElementById("chatBox");

// ================= CHECK LOGIN =================
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  loadMessages();
});

// ================= SEND MESSAGE =================
window.sendMsg = async function () {
  const msg = document.getElementById("msg").value;

  if (!msg.trim()) return;

  await addDoc(collection(db, "messages"), {
    text: msg,
    user: currentUser.email,
    uid: currentUser.uid,
    time: serverTimestamp()
  });

  document.getElementById("msg").value = "";
};

// ================= LOAD REALTIME CHAT =================
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("time"));

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const isMe = data.uid === currentUser.uid;

      chatBox.innerHTML += `
        <div style="
          margin:10px;
          padding:10px;
          border-radius:10px;
          max-width:70%;
          ${isMe ? "margin-left:auto;background:#5bc0be;color:black;" : "background:#0b132b;"}
        ">
          <b>${data.user}</b><br>
          ${data.text}
        </div>
      `;
    });

    // auto scroll
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
