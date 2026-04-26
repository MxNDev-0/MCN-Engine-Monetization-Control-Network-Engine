import { auth, db } from "./firebase.js";
import { app } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, setDoc, addDoc, collection,
  onSnapshot, deleteDoc,
  query, orderBy, getDocs, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= SAFE MONITOR ================= */
function log(msg) {
  let box = document.getElementById("monitor");

  if (!box) {
    console.error("Monitor missing");
    return;
  }

  const time = new Date().toLocaleTimeString();

  const line = document.createElement("div");
  line.textContent = `[${time}] ${msg}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ================= SAFE BOOT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("monitor");

  if (box) {
    box.innerHTML = "🟢 Initializing Admin Panel...";
  }

  setTimeout(() => {
    log("🚀 System ready");
    log("📡 Monitor online");
  }, 500);
});

/* ================= ERROR CATCHER (CRITICAL) ================= */
window.onerror = function (msg, url, line, col, error) {
  log("❌ JS ERROR: " + msg);
};

/* ================= BROADCAST ================= */
window.sendBroadcast = async () => {
  const title = document.getElementById("broadcastTitle").value;
  const message = document.getElementById("broadcastMessage").value;

  if (!title || !message) {
    log("⚠️ Fill broadcast fields");
    return;
  }

  try {
    await addDoc(collection(db, "broadcasts"), {
      title,
      message,
      createdAt: Date.now(),
      createdBy: auth.currentUser?.uid || "admin",
      active: true
    });

    log("🔔 Broadcast sent: " + title);

    broadcastTitle.value = "";
    broadcastMessage.value = "";

  } catch (err) {
    log("❌ Broadcast failed");
    console.error(err);
  }
};

/* ================= ADMIN GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "user";

    if (role !== "admin") {
      alert("Access denied");
      location.href = "dashboard.html";
    } else {
      log("🔐 Admin logged in");
      startSystem();
    }

  } catch (err) {
    log("❌ Admin check failed");
  }
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
}

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();
      box.innerHTML += `<div class="item">${u.email || "user"}</div>`;
    });
  });
}

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div class="item">
          ${p.text}
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("🗑 Post deleted");
};

window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("🧹 All posts cleared");
};

/* ================= AD REQUESTS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          ${ad.title}<br>
          ${ad.status || "pending"}
        </div>
      `;
    });
  });
}