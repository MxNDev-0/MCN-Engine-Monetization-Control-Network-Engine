import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  getDocs,
  setDoc,
  where,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= LOG ================= */
function log(msg, color = "#fff") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.innerHTML = `[${time}] ${msg}`;
  line.style.color = color;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) return location.href = "index.html";

  user = u;

  log("System booting...");
  log("User authenticated");

  ensureUserExists(); // 🔥 IMPORTANT FIX

  loadOnlineUsers();
  loadFriendRequests();
  loadFriends();
  loadChat();
});

/* ================= ENSURE USER ================= */
async function ensureUserExists() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      username: user.email.split("@")[0],
      createdAt: serverTimestamp()
    });
  }
}

/* ================= ONLINE USERS ================= */
function loadOnlineUsers() {
  const box = document.getElementById("onlineUsers");
  if (!box) return;

  onSnapshot(collection(db, "users"), (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const uid = docSnap.id;

      if (uid === user.uid) return;

      const div = document.createElement("div");
      div.className = "item";

      div.innerHTML = `
        🟢 <b>${data.username || "User"}</b>
        <button onclick="sendFriendRequest('${uid}','${data.username}')">Add</button>
        <button onclick="startDM('${uid}')">Message</button>
      `;

      box.appendChild(div);
    });
  });
}

/* ================= FRIEND REQUEST ================= */
window.sendFriendRequest = async (toUid, name) => {
  await addDoc(collection(db, "friendRequests"), {
    from: user.uid,
    fromName: user.email.split("@")[0],
    to: toUid,
    status: "pending",
    createdAt: serverTimestamp()
  });

  log("Friend request sent");
};

/* ================= LOAD REQUESTS ================= */
function loadFriendRequests() {
  const box = document.getElementById("friendRequestsBox");
  if (!box) return;

  const q = query(
    collection(db, "friendRequests"),
    where("to", "==", user.uid),
    where("status", "==", "pending")
  );

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const r = docSnap.data();

      const div = document.createElement("div");

      div.innerHTML = `
        <b>${r.fromName}</b>
        <button onclick="acceptRequest('${docSnap.id}','${r.from}','${r.fromName}')">Accept</button>
        <button onclick="rejectRequest('${docSnap.id}')">Reject</button>
      `;

      box.appendChild(div);
    });
  });
}

/* ================= ACCEPT ================= */
window.acceptRequest = async (id, fromUid, name) => {
  await addDoc(collection(db, "friends"), {
    user1: user.uid,
    user2: fromUid,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "friendRequests", id), {
    status: "accepted"
  });

  log("Friend added: " + name);
};

/* ================= REJECT ================= */
window.rejectRequest = async (id) => {
  await updateDoc(doc(db, "friendRequests", id), {
    status: "rejected"
  });

  log("Request rejected");
};

/* ================= LOAD FRIENDS ================= */
function loadFriends() {
  const box = document.getElementById("friendsBox");
  if (!box) return;

  onSnapshot(collection(db, "friends"), async (snap) => {
    box.innerHTML = "";

    for (const d of snap.docs) {
      const f = d.data();

      let friendId = null;

      if (f.user1 === user.uid) friendId = f.user2;
      if (f.user2 === user.uid) friendId = f.user1;

      if (!friendId) continue;

      const snapUser = await getDoc(doc(db, "users", friendId));
      const name = snapUser.exists() ? snapUser.data().username : "User";

      const div = document.createElement("div");

      div.innerHTML = `
        <b>${name}</b>
        <button onclick="startDM('${friendId}')">Chat</button>
      `;

      box.appendChild(div);
    }
  });
}

/* ================= START DM ================= */
window.startDM = function (uid) {
  location.href = "messages.html?uid=" + uid;
};

/* ================= CHAT ================= */
function loadChat() {
  const q = query(collection(db, "chats"), orderBy("createdAt"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        const m = change.doc.data();

        log(`💬 <b>${m.username}</b>: ${m.text}`, "#5bc0be");
      }
    });
  });
}

window.sendChat = async function () {
  const input = document.getElementById("chatInput");
  if (!input.value.trim()) return;

  const text = input.value;

  log(`💬 <b>You</b>: ${text}`, "#5bc0be");

  input.value = "";

  await addDoc(collection(db, "chats"), {
    text,
    uid: user.uid,
    username: user.email.split("@")[0],
    createdAt: serverTimestamp()
  });
};

/* ================= UI BUTTON FIX ================= */
window.openRequests = function () {
  document.getElementById("requestsPopup").style.display = "block";
};

window.openFriends = function () {
  document.getElementById("friendsPopup").style.display = "block";
};

window.closePopup = function (id) {
  document.getElementById(id).style.display = "none";
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent (check spam)");
};