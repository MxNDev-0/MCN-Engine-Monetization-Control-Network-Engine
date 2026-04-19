import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const usersList = document.getElementById("usersList");

// AUTH
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
  else loadUsers();
});

async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  usersList.innerHTML = "";

  snapshot.forEach(doc => {
    const user = doc.data();
    const id = doc.id;

    if (auth.currentUser.uid === id) return;

    usersList.innerHTML += `
      <div class="user-card">
        <p>${user.username || user.email}</p>
        <button onclick="startChat('${id}')">Chat</button>
      </div>
    `;
  });
}

// START CHAT
window.startChat = function (userId) {
  window.location.href = `chat.html?uid=${userId}`;
};