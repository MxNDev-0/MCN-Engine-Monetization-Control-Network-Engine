import { auth, db } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

let currentUser;
let username = null;

// AUTH
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  currentUser = user;

  document.getElementById("userEmail").innerText = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { username: "" });
  }

  username = (await getDoc(ref)).data().username;

  if (user.email === ADMIN_EMAIL) {
    document.getElementById("adminPanel").style.display = "block";
    loadAdminStats();
  }

  loadChat();
  loadPosts();
});

// MENU
window.toggleMenu = () => {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
};

// USERNAME
window.setUsername = async () => {
  const name = prompt("Enter username:");
  if (!name) return;

  await setDoc(doc(db, "users", currentUser.uid), {
    username: name
  });

  username = name;
  alert("Username set!");
};

// CHANGE PASSWORD
window.changePassword = async () => {
  const newPass = prompt("Enter new password:");
  if (!newPass) return;

  await updatePassword(currentUser, newPass);
  alert("Password updated!");
};

// CHAT
window.sendMessage = async () => {
  const text = document.getElementById("chatInput").value;

  if (!username) {
    alert("Set username first");
    return;
  }

  if (!text) return;

  await addDoc(collection(db, "generalChat"), {
    text,
    name: username,
    time: Date.now()
  });

  document.getElementById("chatInput").value = "";
  loadChat();
};

// LOAD CHAT
async function loadChat() {
  const snap = await getDocs(collection(db, "generalChat"));
  const box = document.getElementById("chatBox");

  box.innerHTML = "";

  snap.forEach(doc => {
    const m = doc.data();

    box.innerHTML += `
      <div style="margin:5px;">
        <b>${m.name}</b>: ${m.text}
      </div>
    `;
  });
}

// POSTS (VISIBLE TO ALL)
async function loadPosts() {
  const snap = await getDocs(collection(db, "posts"));
  const div = document.getElementById("posts");

  div.innerHTML = "";

  snap.forEach(doc => {
    const p = doc.data();

    div.innerHTML += `
      <div class="post">
        <p>${p.text}</p>
      </div>
    `;
  });
}

// ADMIN STATS
async function loadAdminStats() {
  const users = await getDocs(collection(db, "users"));
  const posts = await getDocs(collection(db, "posts"));

  document.getElementById("totalUsers").innerText = users.size;
  document.getElementById("totalPosts").innerText = posts.size;
}

// NAV
window.logout = async () => {
  await signOut(auth);
  location.href = "index.html";
};