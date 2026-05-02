import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc, getDoc, addDoc, collection, onSnapshot,
  deleteDoc, updateDoc, query, orderBy,
  getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= MONITOR ================= */
function log(msg, type = "ok") {
  const box = document.getElementById("monitor");
  if (!box) return;

  const color =
    type === "error" ? "red" :
    type === "warn" ? "orange" :
    type === "ai" ? "#00c3ff" :
    "#00ff88";

  const div = document.createElement("div");
  div.style.color = color;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      location.href = "index.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      alert("User not found");
      location.href = "index.html";
      return;
    }

    const data = snap.data();

    if (data.role !== "admin") {
      alert("Access denied");
      location.href = "index.html";
      return;
    }

    log("Admin online");

    startAIMonitor();

    loadPosts();
    loadUsers();
    loadAds();
    loadRejectedAds();

  } catch (err) {
    console.error("AUTH ERROR:", err);
    log("Auth error: " + err.message, "error");
  }
});

/* ================= AI MONITOR ================= */
function startAIMonitor() {
  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type !== "added") return;

      const e = change.doc.data();
      log(`Event: ${e.type}`, "ai");
    });
  }, (err) => {
    log("Event monitor error: " + err.message, "error");
  });
}

/* ================= BLOG ================= */
window.createBlog = async () => {
  try {
    const title = document.getElementById("blogTitle").value;
    const content = document.getElementById("blogContent").value;
    const image = document.getElementById("blogImage").value;

    if (!title || !content) {
      alert("Title and content required");
      return;
    }

    const ref = await addDoc(collection(db, "posts"), {
      title,
      content,
      image,
      createdAt: new Date(),              // ✅ FIXED
      serverTime: serverTimestamp()       // ✅ ADDED
    });

    log("Blog created: " + ref.id);

  } catch (err) {
    log("Create blog error: " + err.message, "error");
  }
};

/* ================= POSTS (FIXED) ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  if (!box) {
    console.error("postsList not found in HTML");
    return;
  }

  const q = query(collection(db, "posts")); // ✅ FIXED

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    if (snap.empty) {
      box.innerHTML = `<div class="item">No posts found</div>`;
      return;
    }

    const docs = [];

    snap.forEach(d => {
      docs.push({ id: d.id, ...d.data() });
    });

    docs.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    docs.forEach(p => {
      const safeTitle = encodeURIComponent(p.title || "");
      const safeContent = encodeURIComponent(p.content || "");

      box.innerHTML += `
        <div class="item">
          <b>${p.title || "Untitled"}</b><br>

          <button class="small-btn"
            onclick="fillEdit('${p.id}', '${safeTitle}', '${safeContent}')">
            Edit
          </button>

          <button class="small-btn"
            onclick="deletePost('${p.id}')">
            Delete
          </button>
        </div>
      `;
    });

  }, (err) => {
    console.error("POST LOAD ERROR:", err);
    log("Posts error: " + err.message, "error");
    box.innerHTML = `<div class="item">Failed to load posts</div>`;
  });
}

/* ================= EDIT ================= */
window.fillEdit = (id, title, content) => {
  try {
    document.getElementById("editPostId").value = id;
    document.getElementById("editPostTitle").value = decodeURIComponent(title);
    document.getElementById("editPostContent").value = decodeURIComponent(content);
  } catch (err) {
    log("Edit fill error", "error");
  }
};

window.updatePost = async () => {
  try {
    const id = document.getElementById("editPostId").value;
    if (!id) return alert("No post selected");

    await updateDoc(doc(db, "posts", id), {
      title: document.getElementById("editPostTitle").value,
      content: document.getElementById("editPostContent").value
    });

    log("Post updated");

  } catch (err) {
    log("Update error: " + err.message, "error");
  }
};

window.deletePost = async (id) => {
  try {
    await deleteDoc(doc(db, "posts", id));
    log("Post deleted", "warn");
  } catch (err) {
    log("Delete error: " + err.message, "error");
  }
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), snap => {
    box.innerHTML = "";
    snap.forEach(u => {
      box.innerHTML += `<div class="item">${u.data().email}</div>`;
    });
  });
}

/* ================= ADS ================= */
function loadAds() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), snap => {
    box.innerHTML = "";
    snap.forEach(d => {
      const ad = d.data();

      box.innerHTML += `
        <div class="item">
          <b>${ad.title}</b><br>
          <button class="small-btn" onclick="acceptAd('${d.id}')">Accept</button>
          <button class="small-btn" onclick="rejectAd('${d.id}')">Reject</button>
        </div>
      `;
    });
  });
}

window.acceptAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "accepted" });
  log("Ad accepted");
};

window.rejectAd = async (id) => {
  await updateDoc(doc(db, "adRequests", id), { status: "rejected" });
  log("Ad rejected", "warn");
};

/* ================= REJECTED ================= */
function loadRejectedAds() {
  const box = document.getElementById("rejectedList");
  if (!box) return;

  onSnapshot(collection(db, "adRequests"), snap => {
    box.innerHTML = "";
    snap.forEach(d => {
      if (d.data().status === "rejected") {
        box.innerHTML += `<div class="item">❌ ${d.data().title}</div>`;
      }
    });
  });
}

window.clearRejected = async () => {
  const snap = await getDocs(collection(db, "adRequests"));
  const batch = writeBatch(db);

  snap.forEach(d => {
    if (d.data().status === "rejected") batch.delete(d.ref);
  });

  await batch.commit();
  log("Rejected ads cleared");
};