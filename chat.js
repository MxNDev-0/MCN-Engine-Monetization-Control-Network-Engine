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
  onSnapshot,
  getDocs,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentChatId = null;
let currentUser = null;
let unsubscribeMessages = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "index.html";
    return;
  }

  currentUser = user;

  await setDoc(doc(db, "onlineUsers", user.uid), {
    email: user.email,
    online: true
  }, { merge: true });

  loadUsers();
});

/* ================= SAFE DOM HELPERS ================= */
function getEl(id) {
  return document.getElementById(id);
}

/* ================= NAV ================= */
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};

window.goBack = () => {
  location.href = "dashboard.html";
};

/* ================= LOAD USERS ================= */
async function loadUsers() {
  const usersListDiv = getEl("usersList");
  if (!usersListDiv) return;

  const snapshot = await getDocs(collection(db, "onlineUsers"));

  usersListDiv.innerHTML = "<h4>Users Online</h4>";

  snapshot.forEach(docSnap => {
    const user = docSnap.data();
    const uid = docSnap.id;

    if (uid === currentUser.uid) return;

    usersListDiv.innerHTML += `
      <div class="user-item"
        onclick="openChat('${uid}', '${user.email}')">
        ${user.email} 🟢
      </div>
    `;
  });
}

/* ================= OPEN CHAT ================= */
window.openChat = function (userId, email) {
  const chatHeader = getEl("chatHeader");
  const chatBox = getEl("chatBox");

  const myId = currentUser.uid;

  currentChatId = [myId, userId].sort().join("_");

  chatHeader.innerText = "Chat with " + email;

  loadMessages();
};

/* ================= SEND MESSAGE ================= */
window.sendMessage = async function () {
  const input = getEl("messageInput");
  const text = input.value.trim();

  if (!text || !currentChatId) {
    alert("Select user first");
    return;
  }

  await addDoc(collection(db, "chats", currentChatId, "messages"), {
    text,
    sender: currentUser.uid,
    email: currentUser.email,
    time: Date.now()
  });

  input.value = "";
};

/* ================= LOAD MESSAGES ================= */
function loadMessages() {
  const chatBox = getEl("chatBox");
  if (!chatBox) return;

  // 🛑 unsubscribe previous listener (VERY IMPORTANT FIX)
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const q = query(
    collection(db, "chats", currentChatId, "messages"),
    orderBy("time")
  );

  unsubscribeMessages = onSnapshot(q, (snapshot) => {

    chatBox.innerHTML = "";

    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const isMe = msg.sender === currentUser.uid;

      chatBox.innerHTML += `
        <div style="
          margin:5px 0;
          padding:8px;
          border-radius:5px;
          background:${isMe ? "#5bc0be" : "#0b132b"};
          text-align:${isMe ? "right" : "left"};
        ">
          ${msg.text}
        </div>
      `;
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}