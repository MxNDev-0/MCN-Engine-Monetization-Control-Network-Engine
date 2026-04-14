import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let username = "";

onAuthStateChanged(auth, (user) => {
  if (!user) location.href = "index.html";

  listenChat();
  listenUsers();
  listenPosts();
});

/* CHAT FIXED */
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "chat"), {
    name: "user",
    text,
    time: Date.now()
  });

  input.value = "";
};

/* REAL TIME CHAT */
function listenChat() {
  const q = query(collection(db, "chat"), orderBy("time"));

  onSnapshot(q, (snap) => {
    const box = document.getElementById("chatBox");
    box.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      box.innerHTML += `<div><b>${m.name}</b>: ${m.text}</div>`;
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* USERS */
function listenUsers() {
  onSnapshot(collection(db, "users"), (snap) => {
    const box = document.getElementById("onlineUsers");
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      if (u.username) box.innerHTML += `<div>🟢 ${u.username}</div>`;
    });
  });
}

/* POSTS */
function listenPosts() {
  onSnapshot(collection(db, "posts"), (snap) => {
    const box = document.getElementById("posts");
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      box.innerHTML += `<div><b>${p.user}</b><p>${p.text}</p></div>`;
    });
  });
}

window.logout = () => signOut(auth).then(() => location.href = "index.html");