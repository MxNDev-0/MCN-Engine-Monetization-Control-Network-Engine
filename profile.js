import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) {
    location.href = "index.html";
    return;
  }

  user = u;

  trackOnlineStatus();
  loadOnlineUsers();
});

/* ================= TRACK ONLINE ================= */
function trackOnlineStatus() {
  setInterval(async () => {
    await addDoc(collection(db, "presence"), {
      uid: user.uid,
      name: user.email.split("@")[0],
      lastSeen: Date.now()
    });
  }, 5000);
}

/* ================= LOAD ONLINE USERS ================= */
function loadOnlineUsers() {
  onSnapshot(collection(db, "presence"), (snap) => {

    const users = [];
    const now = Date.now();

    snap.forEach(doc => {
      const data = doc.data();

      if (now - data.lastSeen < 10000) {
        users.push(data);
      }
    });

    renderOnlineUsers(users);
  });
}

/* ================= RENDER USERS ================= */
function renderOnlineUsers(users) {
  const box = document.getElementById("onlineUsers");
  box.innerHTML = "";

  users.forEach(u => {
    if (u.uid === user.uid) return;

    const row = document.createElement("div");
    row.className = "user-row";

    row.innerHTML = `
      <div class="user-left">
        <span class="dot"></span>
        <span class="name">${u.name}</span>
      </div>

      <div class="user-actions">
        <button class="btn-add" onclick="sendFriendRequest('${u.uid}','${u.name}')">Add</button>
        <button class="btn-msg" onclick="openDM('${u.uid}')">Message</button>
      </div>
    `;

    box.appendChild(row);
  });
}

/* ================= ACTIONS ================= */
window.openDM = function(uid) {
  location.href = "messages.html?uid=" + uid;
};

window.sendFriendRequest = async function(toUid, toName) {
  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    to: toUid,
    toName,
    createdAt: serverTimestamp()
  });

  alert("Friend request sent");
};