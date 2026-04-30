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

  setTimeout(() => {
    log("System ready");
    log("Monitor online");
  }, 500);
});

/* ================= AUTH ================= */
let adminUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  const role = snap.exists() ? snap.data().role : "user";

  if (role !== "admin") {
    alert("Access denied");
    location.href = "dashboard.html";
    return;
  }

  adminUser = user;

  log("Admin verified");
  startSystem();
});

/* ================= SYSTEM ================= */
function startSystem() {
  loadUsers();
  loadPosts();
  loadAdRequests();
  loadEventMonitor();
  bridgeChatsToEvents();
}

/* ================= CHAT → EVENTS ================= */
function bridgeChatsToEvents() {
  onSnapshot(collection(db, "chats"), (snap) => {
    snap.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const m = change.doc.data();

        if (m._eventCreated) return;

        await addDoc(collection(db, "events"), {
          type: "chat",
          text: m.text,
          uid: m.uid,
          username: m.username,
          createdAt: m.createdAt || serverTimestamp()
        });

        try {
          await change.doc.ref.update({ _eventCreated: true });
        } catch {}
      }
    });
  });
}

/* ================= MONITOR ================= */
function loadEventMonitor() {
  const box = document.getElementById("monitor");
  if (!box) return;

  onSnapshot(query(collection(db, "events"), orderBy("createdAt", "asc")), (snap) => {
    box.innerHTML = "";

    snap.forEach(docSnap => {
      const e = docSnap.data();

      if (e.type === "chat") {
        box.innerHTML += `
          <div style="padding:6px;border-bottom:1px solid #222;">
            💬 <b onclick="openUser('${e.uid}')">${e.username}</b>: ${e.text}
            <button onclick="replyToUser('${e.uid}', '${e.username}')">↩</button>
          </div>
        `;
      }

      if (e.type === "log") {
        box.innerHTML += `
          <div style="color:#00ff66;">
            [LOG] ${e.text}
          </div>
        `;
      }
    });

    box.scrollTop = box.scrollHeight;
  });
}

/* ================= 🔥 DM SYSTEM ================= */
window.replyToUser = async (uid, username) => {
  const message = prompt(`Reply to ${username}`);

  if (!message || !message.trim()) return;

  const chatId = [adminUser.uid, uid].sort().join("_");

  await addDoc(collection(db, "dms", chatId, "messages"), {
    text: message,
    from: adminUser.uid,
    to: uid,
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, "notifications", uid, "items"), {
    text: `📩 Admin replied to you`,
    createdAt: serverTimestamp()
  });

  log(`DM sent to ${username}`);
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";
    snap.forEach(d => {
      box.innerHTML += `<div class="item">${d.data().email}</div>`;
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
      const data = d.data();

      box.innerHTML += `
        <div class="item">
          ${data.text}
          <button onclick="deletePost('${d.id}')">Delete</button>
          <button onclick="fillEditPost('${d.id}', \`${data.text}\`, \`${data.text}\`)">Edit</button>
        </div>
      `;
    });
  });
}

/* ================= DELETE POST ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  log("Post deleted");
};

/* ================= CLEAR ALL POSTS ================= */
window.clearAllPosts = async () => {
  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => batch.delete(d.ref));

  await batch.commit();
  log("All posts cleared");
};

/* ================= EDIT POST ================= */
window.fillEditPost = (id, text) => {
  document.getElementById("editPostId").value = id;
  document.getElementById("editPostContent").value = text;
};

window.updatePost = async () => {
  const id = document.getElementById("editPostId").value;
  const content = document.getElementById("editPostContent").value;

  if (!id) return alert("Select a post first");

  await fetch(`https://mxm-backend.onrender.com/blog/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });

  log("Post updated");
};

/* ================= ADS ================= */
function loadAdRequests() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      box.innerHTML += `
        <div class="item">
          ${d.data().title}
        </div>
      `;
    });
  });
}

/* ================= PROFILE ================= */
window.openUser = (uid) => {
  alert("Profile system coming next: " + uid);
};