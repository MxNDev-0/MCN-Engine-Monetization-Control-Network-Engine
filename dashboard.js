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
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;
let userData = null;
let isAdmin = false;

/* AUTH */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  await ensureUser();
  await loadUser();

  isAdmin = userData?.role === "admin";

  loadUsers();
  loadChat();
  loadPrices();
});

/* USER */
async function ensureUser() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      username: user.email.split("@")[0],
      role: "user"
    });
  }
}

async function loadUser() {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) userData = snap.data();
}

/* USERS */
function loadUsers() {
  const box = document.getElementById("onlineUsers");

  onSnapshot(collection(db, "presence"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      if (!u.online) return;

      box.innerHTML += `<div>🟢 ${u.username}</div>`;
    });
  });
}

/* ================= CHAT V14 STABLE ================= */
function loadChat() {
  const box = document.getElementById("chatBox");
  if (!box) return;

  const q = query(collection(db, "posts"), orderBy("time", "asc"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const m = d.data();
      const id = d.id;

      if (!m?.text) return;

      const userName = m.user || "user";
      const isMe = userName === user.email.split("@")[0];
      const likes = m.likes || [];

      html += `
        <div style="margin:8px 0;padding:8px;border-radius:8px;background:#1c2541;">
          <b>${userName}</b>

          <div style="margin:5px 0;">
            ${m.text}
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button onclick="likeMsg('${id}')">👍 ${likes.length}</button>
            ${isMe ? `<button onclick="editMsg('${id}')">Edit</button>` : ""}
            ${isAdmin ? `<button onclick="deletePost('${id}')">Delete</button>` : ""}
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  });
}

/* SEND */
window.sendMessage = async function () {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  if (!text) return;

  await addDoc(collection(db, "posts"), {
    text,
    user: user.email.split("@")[0],
    time: serverTimestamp(),
    likes: []
  });

  input.value = "";
};

/* LIKE */
window.likeMsg = async function (id) {
  const ref = doc(db, "posts", id);
  const snap = await getDoc(ref);

  const data = snap.data();
  const likes = data.likes || [];

  const uid = user.uid;

  const updated = likes.includes(uid)
    ? likes.filter(l => l !== uid)
    : [...likes, uid];

  await updateDoc(ref, { likes: updated });
};

/* EDIT */
window.editMsg = async function (id) {
  const newText = prompt("Edit message:");
  if (!newText) return;

  await updateDoc(doc(db, "posts", id), {
    text: newText
  });
};

/* DELETE */
window.deletePost = async function (id) {
  if (!isAdmin) return alert("Admin only");

  await deleteDoc(doc(db, "posts", id));
};

/* MENU FIX */
window.toggleMenu = function () {
  const menu = document.getElementById("menu");
  if (!menu) return;
  menu.classList.toggle("active");
};

/* LOGOUT */
window.logout = async function () {
  await signOut(auth);
  location.href = "index.html";
};

/* NAV */
window.goHome = () => location.href = "dashboard.html";
window.goProfile = () => location.href = "profile.html";
window.goAdSpace = () => location.href = "ads.html";
window.goBlog = () => location.href = "blog/index.html";
window.goFaq = () => location.href = "faq.html";
window.goAbout = () => location.href = "about.html";
window.support = () => alert("Support coming soon");

window.goMessages = () => location.href = "messages.html";

window.goAdmin = () => {
  if (!isAdmin) return alert("Admin only");
  location.href = "admin.html";
};

/* PRICES */
async function loadPrices() {
  const box = document.getElementById("priceBox");

  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,eur,gbp");
    const data = await res.json();

    box.innerHTML = `
      BTC: $${data.bitcoin.usd} / €${data.bitcoin.eur} / £${data.bitcoin.gbp}<br>
      ETH: $${data.ethereum.usd} / €${data.ethereum.eur} / £${data.ethereum.gbp}
    `;
  } catch {
    box.innerText = "Failed to load prices";
  }
}

/* ================= FRIEND SYSTEM V15 ================= */

/* SEND FRIEND REQUEST */
window.sendFriendRequest = async function (toUid, toName) {
  if (!user) return;

  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    fromName: user.email.split("@")[0],
    to: toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Friend request sent");
};

/* LOAD FRIEND REQUESTS */
window.loadFriendRequests = function () {
  const box = document.getElementById("friendRequestsBox");
  if (!box) return;

  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", user.uid)
  );

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const r = d.data();
      const id = d.id;

      if (r.status !== "pending") return;

      html += `
        <div style="padding:8px;margin:6px;background:#1c2541;border-radius:8px;">
          <b>${r.fromName}</b> sent you a friend request

          <div style="margin-top:6px;">
            <button onclick="acceptFriend('${id}','${r.from}','${r.to}')">Accept</button>
            <button onclick="rejectFriend('${id}')">Reject</button>
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  });
};

/* ACCEPT FRIEND */
window.acceptFriend = async function (id, fromUid, toUid) {
  await updateDoc(doc(db, "friendRequests", id), {
    status: "accepted"
  });

  await addDoc(collection(db, "friends"), {
    users: [fromUid, toUid],
    createdAt: serverTimestamp()
  });

  alert("Friend added");
};

/* REJECT FRIEND */
window.rejectFriend = async function (id) {
  await updateDoc(doc(db, "friendRequests", id), {
    status: "rejected"
  });

  alert("Request rejected");
};

/* LOAD FRIEND LIST */
window.loadFriends = function () {
  const box = document.getElementById("friendsBox");
  if (!box) return;

  const q = query(collection(db, "friends"));

  onSnapshot(q, (snap) => {
    let html = "";

    snap.forEach(d => {
      const f = d.data();

      if (!f.users.includes(user.uid)) return;

      const friendId = f.users.find(u => u !== user.uid);

      html += `
        <div style="padding:8px;margin:6px;background:#0b132b;border-radius:8px;">
          👤 Friend UID: ${friendId}
          <button onclick="openDM('${friendId}')">💬 Message</button>
        </div>
      `;
    });

    box.innerHTML = html;
  });
};