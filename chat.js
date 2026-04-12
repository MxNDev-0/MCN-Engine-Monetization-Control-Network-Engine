import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const chatBox = document.getElementById("chatBox");

// ================= AUTH =================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  loadMessages();
});

// ================= NAV =================
window.logout = () => signOut(auth);
window.goBack = () => window.location.href = "dashboard.html";

// ================= SEND MESSAGE =================
window.sendMessage = async function () {
  const input = document.getElementById("messageInput");
  const text = input.value;

  if (!text) return;

  await addDoc(collection(db, "messages"), {
    text: text,
    user: auth.currentUser.email,
    time: Date.now()
  });

  input.value = "";
};

// ================= LOAD MESSAGES (REALTIME) =================
function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("time"));

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach((doc) => {
      const msg = doc.data();

      chatBox.innerHTML += `
        <div style="margin:5px 0; padding:8px; background:#0b132b; border-radius:5px;">
          <b>${msg.user}</b><br>
          ${msg.text}
        </div>
      `;
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
    }
