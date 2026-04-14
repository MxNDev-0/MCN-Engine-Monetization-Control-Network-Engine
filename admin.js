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
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= YOUR EXISTING WALLET SYSTEM ================= */
window.updateWallet = async () => {
  const balance = document.getElementById("balanceInput").value;

  await setDoc(doc(db, "wallet", "main"), {
    balance: Number(balance),
    updatedAt: Date.now()
  });

  alert("Wallet updated!");
};

/* ================= YOUR EXISTING EARNINGS SYSTEM ================= */
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

/* =========================================================
   🔥 NEW ADMIN CONTROL SYSTEM (ADDED - SAFE EXTENSION)
========================================================= */

/* ================= USERS LIST ================= */
function loadUsers() {
  const box = document.getElementById("usersList");

  if (!box) return;

  onSnapshot(collection(db, "onlineUsers"), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const u = d.data();

      box.innerHTML += `
        <div style="padding:6px;margin:5px;background:#1c2541;border-radius:6px;">
          <b>${u.email}</b>
          <button onclick="banUser('${u.uid}')">Ban</button>
        </div>
      `;
    });
  });
}

/* ================= BAN USER ================= */
window.banUser = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    banned: true
  });

  alert("User banned ❌");
};

/* ================= POSTS CONTROL ================= */
function loadPosts() {
  const box = document.getElementById("postsList");

  if (!box) return;

  onSnapshot(query(collection(db, "posts"), orderBy("time")), (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();

      box.innerHTML += `
        <div style="padding:6px;margin:5px;background:#0b132b;border-radius:6px;">
          <b>${p.user}</b>
          <p>${p.text}</p>
          <button onclick="deletePost('${d.id}')">Delete</button>
        </div>
      `;
    });
  });
}

/* ================= DELETE POST ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
};

/* ================= CLEAR ALL POSTS ================= */
window.clearAllPosts = async () => {
  alert("Please delete manually per post (safe mode active)");
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
        <div style="padding:6px;margin:5px;background:#1c2541;border-radius:6px;">
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

  alert("User upgraded ✅");
};

/* ================= INIT LOADERS ================= */
loadUsers();
loadPosts();
loadUpgrades();