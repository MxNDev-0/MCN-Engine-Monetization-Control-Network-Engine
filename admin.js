import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg) {
  const box = document.getElementById("monitor");
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");

  line.textContent = `[${time}] ${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= BOOT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");
  if (box) box.innerHTML = "🟢 Admin Monitor Initializing...";
});

/* ================= AUTH ================= */
let adminUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    alert("Access denied");
    return location.href = "dashboard.html";
  }

  adminUser = user;
  startSystem();
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadRejected();
  loadEventMonitor();
}

/* ================= MONITOR ================= */
function loadEventMonitor() {
  const box = document.getElementById("monitor");

  onSnapshot(query(collection(db, "events"), orderBy("createdAt", "asc")), (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const e = docSnap.data();

      if (e.type === "chat") {
        box.innerHTML += `
          <div>
            💬 <b>${e.username}</b>: ${e.text}
            <button class="mini-btn" onclick="replyToUser('${e.uid}','${e.username}')">➤</button>
          </div>
        `;
      }
    });
  });
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  onSnapshot(collection(db, "posts"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();

      box.innerHTML += `
        <div class="item" onclick="selectPost('${d.id}', \`${data.text}\`)">
          ${data.text}
          <button class="danger" onclick="event.stopPropagation(); deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.selectPost = (id, text) => {
  editPostId.value = id;
  editPostContent.value = text;
};

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
};

window.updatePost = async () => {
  const id = editPostId.value;
  const content = editPostContent.value;

  await fetch(`https://mxm-backend.onrender.com/blog/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
};

/* ================= ADS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const data = d.data();

      box.innerHTML += `
        <div class="item">
          ${data.title}
          <button onclick="acceptAd('${d.id}')">Accept</button>
          <button onclick="rejectAd('${d.id}', '${data.title}')">Reject</button>
        </div>
      `;
    });
  });
}

window.acceptAd = async (id) => {
  await deleteDoc(doc(db, "adRequests", id));
};

window.rejectAd = async (id, title) => {
  await addDoc(collection(db, "adRejected"), { title });
  await deleteDoc(doc(db, "adRequests", id));
};

window.clearAdRequests = async () => {
  const snap = await getDocs(collection(db, "adRequests"));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

/* ================= REJECTED ================= */
function loadRejected() {
  const box = document.getElementById("rejectedList");

  onSnapshot(collection(db, "adRejected"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      box.innerHTML += `<div class="item">❌ ${d.data().title}</div>`;
    });
  });
}

window.clearRejected = async () => {
  const snap = await getDocs(collection(db, "adRejected"));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      box.innerHTML += `<div class="item">${d.data().email}</div>`;
    });
  });
}

/* ================= DM ================= */
window.replyToUser = async (uid, username) => {
  const msg = prompt("Reply to " + username);
  if (!msg) return;

  await addDoc(collection(db, "dms"), {
    text: msg,
    to: uid,
    from: adminUser.uid,
    createdAt: serverTimestamp()
  });
};