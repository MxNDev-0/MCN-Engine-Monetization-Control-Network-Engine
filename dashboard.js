import { auth, db } from "./firebase.js";

import {
  signOut,
  onAuthStateChanged
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

let currentUser = null;
let nickname = "User";

// AUTH
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";

  currentUser = user;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      nickname: "User" + Math.floor(Math.random()*1000)
    });
  }

  nickname = (await getDoc(ref)).data().nickname;

  if (user.email === ADMIN_EMAIL) {
    document.getElementById("adminPanel").style.display = "block";
  }

  loadMessages();
});

// NAV
window.goProfile = () => window.location.href = "profile.html";

window.goUpgrade = () => {
  window.location.href = "https://nowpayments.io/payment/?iid=5153003613";
};

window.goSupport = () => window.location.href = "support.html";

window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// GENERAL CHAT
window.sendMessage = async () => {
  const input = document.getElementById("chatInput");
  const text = input.value;

  if (!text) return;

  await addDoc(collection(db, "generalChat"), {
    text,
    name: nickname,
    time: Date.now()
  });

  input.value = "";
};

// LOAD CHAT
async function loadMessages() {
  const snapshot = await getDocs(collection(db, "generalChat"));
  const box = document.getElementById("chatBox");

  box.innerHTML = "";

  snapshot.forEach(doc => {
    const msg = doc.data();

    box.innerHTML += `
      <div style="margin:5px;">
        <b>${msg.name}</b>: ${msg.text}
      </div>
    `;
  });
}