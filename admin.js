import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= WALLET ================= */
window.updateWallet = async () => {
  const balance = document.getElementById("balanceInput").value;

  await setDoc(doc(db, "wallet", "main"), {
    balance: Number(balance),
    updatedAt: Date.now()
  });

  alert("Wallet updated!");
};

/* ================= EARNINGS ================= */
window.addEarning = async () => {
  const source = document.getElementById("source").value;
  const amount = document.getElementById("amount").value;

  await addDoc(collection(db, "earningsLog"), {
    source,
    amount: Number(amount),
    date: Date.now()
  });

  alert("Earning added!");
};

/* ================= USERS ================= */
function loadUsers() {
  const box = document.getElementById("usersList");
  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:8px;margin:6px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <button onclick="toggleBan('${u.uid}', true)">Ban</button>
          <button onclick="toggleBan('${u.uid}', false)">Unban</button>
        </div>
      `;
    });
  });
}

/* ================= BAN / UNBAN ================= */
window.toggleBan = async (uid, status) => {
  await updateDoc(doc(db, "users", uid), {
    banned: status
  });

  alert(status ? "User banned ❌" : "User unbanned ✅");
};

/* ================= POSTS ================= */
function loadPosts() {
  const box = document.getElementById("postsList");
  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div style="padding:8px;margin:6px;background:#0b132b;border-radius:6px;">
          <b>${p.user}</b>
          <p>${p.text}</p>
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
};

/* ================= CLEAR ALL POSTS ================= */
window.clearAllPosts = async () => {
  const ok = confirm("Delete ALL posts? This cannot be undone.");
  if (!ok) return;

  const snap = await getDocs(collection(db, "posts"));
  const batch = writeBatch(db);

  snap.forEach(d => {
    batch.delete(d.ref);
  });

  await batch.commit();

  alert("All posts deleted ✅");
};

/* ================= UPGRADES ================= */
function loadUpgrades() {
  const box = document.getElementById("upgradeList");
  if (!box) return;

  onSnapshot(collection(db, "upgradeRequests"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:8px;margin:6px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <p>Status: ${u.status}</p>
          <button onclick="approveUpgrade('${u.uid}')">Approve</button>
        </div>
      `;
    });
  });
}

/* ================= APPROVE UPGRADE ================= */
window.approveUpgrade = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    premium: true
  });

  await updateDoc(doc(db, "upgradeRequests", uid), {
    status: "approved"
  });

  alert("User upgraded ✅");
};

/* ================= APPROVE ALL ================= */
window.approveAllUpgrades = async () => {
  const snap = await getDocs(collection(db, "upgradeRequests"));
  const batch = writeBatch(db);

  snap.forEach(d => {
    const data = d.data();

    batch.update(doc(db, "users", data.uid), {
      premium: true
    });

    batch.update(d.ref, {
      status: "approved"
    });
  });

  await batch.commit();

  alert("All upgrades approved 🚀");
};

/* ================= INIT ================= */
loadUsers();
loadPosts();
loadUpgrades();