import { auth, db } from "./firebase.js";

import {
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const chatBox = document.getElementById("chatBox");

// GET USER ID FROM URL
const urlParams = new URLSearchParams(window.location.search);
const otherUserId = urlParams.get("uid");

let chatId = "";

// AUTH
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (!otherUserId) {
    alert("No user selected");
    return;
  }

  // CREATE UNIQUE CHAT ID
  chatId = user.uid < otherUserId
    ? user.uid + "_" + otherUserId
    : otherUserId + "_" + user.uid;

  // CREATE CHAT DOCUMENT IF NOT EXISTS
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [user.uid, otherUserId]
    });
  }

  loadMessages();
});

// SEND MESSAGE
window.sendMsg = async function () {
  const input = document.getElementById("msg");
  const text = input.value;

  if (!text) return;

  const user = auth.currentUser;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: text,
    sender: user.uid,
    email: user.email,
    createdAt: Date.now()
  });

  input.value = "";
};

// LOAD MESSAGES
function loadMessages() {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach(doc => {
      const msg = doc.data();

      const isMe = msg.sender === auth.currentUser.uid;

      chatBox.innerHTML += `
        <div class="msg" style="
          background: ${isMe ? '#5bc0be' : '#0b132b'};
          text-align: ${isMe ? 'right' : 'left'};
        ">
          <small>${msg.email}</small>
          <p>${msg.text}</p>
        </div>
      `;
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
