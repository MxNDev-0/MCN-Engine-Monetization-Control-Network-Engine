import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const usersList = document.getElementById("usersList");
const chatBox = document.getElementById("chatBox");

let selectedUserId = null;

// ================= AUTH =================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadUsers();
  }
});

// ================= LOAD USERS =================
async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  usersList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const id = docSnap.id;

    if (auth.currentUser.uid === id) return;

    usersList.innerHTML += `
      <div class="user-item" onclick="selectUser('${id}', '${user.email}')">
        ${user.email}
      </div>
    `;
  });
}

// ================= SELECT USER =================
window.selectUser = function (userId, email) {
  selectedUserId = userId;
  chatBox.innerHTML = `<p>Chatting with ${email}</p>`;

  loadMessages();
};

// ================= LOAD MESSAGES =================
function loadMessages() {
  const chatId = getChatId(auth.currentUser.uid, selectedUserId);

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach((doc) => {
      const msg = doc.data();

      chatBox.innerHTML += `
        <div class="msg">
          <b>${msg.email}</b>: ${msg.text}
        </div>
      `;
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// ================= SEND MESSAGE =================
window.sendMsg = async function () {
  const input = document.getElementById("msg");
  const text = input.value;

  if (!text || !selectedUserId) return;

  const chatId = getChatId(auth.currentUser.uid, selectedUserId);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text,
    email: auth.currentUser.email,
    createdAt: Date.now()
  });

  input.value = "";
};

// ================= CHAT ID =================
function getChatId(a, b) {
  return a < b ? a + "_" + b : b + "_" + a;
}
