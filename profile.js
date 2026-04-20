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
  updateDoc,  
  doc,  
  getDoc,  
  setDoc,  
  deleteDoc,  
  where,  
  serverTimestamp  
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";  

let user = null;  

/* ================= AUTH ================= */  
onAuthStateChanged(auth, async (u) => {  
  if (!u) location.href = "index.html";  

  user = u;  

  loadPosts();  
  loadUsername();  

  // ✅ V17 STEP 1 INJECTION (INIT SOCIAL GRAPH SYSTEM)
  loadFriendRequests();
  loadFriends();
});  

/* ================= MENU ================= */  
window.toggleMenu = function () {  
  const menu = document.getElementById("dropdownMenu");  
  if (!menu) return;  

  menu.style.display = menu.style.display === "block" ? "none" : "block";  
};  

/* ================= USERNAME ================= */  
async function loadUsername() {  
  const snap = await getDoc(doc(db, "users", user.uid));  
  const el = document.getElementById("usernameDisplay");  

  if (snap.exists() && snap.data().username) {  
    el.innerText = snap.data().username;  
  } else {  
    el.innerText = "Not set";  
  }  
}  

/* ================= UPDATE USERNAME ================= */  
window.updateUsername = async () => {  
  const input = document.getElementById("usernameInput");  
  const username = input.value.trim();  

  if (!username) return alert("Enter username");  

  await setDoc(doc(db, "users", user.uid), { username }, { merge: true });  

  document.getElementById("usernameDisplay").innerText = username;  
  input.value = "";  
};  

/* ================= RESET PASSWORD ================= */  
window.resetPassword = async () => {  
  await sendPasswordResetEmail(auth, user.email);  
  alert("Reset email sent");  
};  

/* ================= CREATE POST ================= */  
window.createPost = async () => {  
  const input = document.getElementById("postInput");  
  const text = input.value.trim();  

  if (!text) return;  

  await addDoc(collection(db, "posts"), {  
    text,  
    user: user.email.split("@")[0],  
    visibility: "public",  
    time: Date.now()  
  });  

  input.value = "";  
};  

/* ================= LOAD POSTS ================= */  
function loadPosts() {  
  const q = query(collection(db, "posts"), orderBy("time"));  

  onSnapshot(q, (snap) => {  
    const box = document.getElementById("myPosts");  
    box.innerHTML = "";  

    snap.forEach(docSnap => {  
      const p = docSnap.data();  
      const id = docSnap.id;  

      if (p.user !== user.email.split("@")[0]) return;  

      const isPrivate = p.visibility === "private";  

      box.innerHTML += `  
        <div class="post">  

          <div style="display:flex;justify-content:space-between;align-items:center;">  
            <div style="display:flex;align-items:center;">  
              <div class="avatar"></div>  
              <div style="margin-left:8px;">${p.user}</div>  
            </div>  

            <div style="position:relative;">  
              <div style="cursor:pointer;font-size:18px;" onclick="togglePostMenu('${id}')">⋯</div>  

              <div class="menu-box" id="menu-${id}">  
                <button onclick="editPost('${id}','${p.text}')">✏️ Edit</button>  
                <button onclick="deletePost('${id}')">🗑 Delete</button>  
                <button onclick="togglePrivacy('${id}','${p.visibility}')">  
                  ${isPrivate ? "🌍 Make Public" : "🔒 Make Private"}  
                </button>  
              </div>  
            </div>  
          </div>  

          <div style="margin-top:8px;">${p.text}</div>  

        </div>  
      `;  
    });  
  });  
}  

/* ================= POST MENU TOGGLE ================= */  
window.togglePostMenu = function (id) {  
  const menu = document.getElementById("menu-" + id);  

  document.querySelectorAll(".menu-box").forEach(m => m.style.display = "none");  

  if (!menu) return;  

  menu.style.display = menu.style.display === "block" ? "none" : "block";  
};  

/* ================= EDIT POST ================= */  
window.editPost = async function (id, oldText) {  
  const newText = prompt("Edit post:", oldText);  
  if (!newText) return;  

  await updateDoc(doc(db, "posts", id), { text: newText });  
};  

/* ================= DELETE POST ================= */  
window.deletePost = async function (id) {  
  if (!confirm("Delete post?")) return;  

  await deleteDoc(doc(db, "posts", id));  
};  

/* ================= PRIVACY TOGGLE ================= */  
window.togglePrivacy = async function (id, current) {  
  const newState = current === "private" ? "public" : "private";  

  await updateDoc(doc(db, "posts", id), {  
    visibility: newState  
  });  
};  


/* =========================================================  
   🔥 V17 SOCIAL GRAPH SYSTEM  
========================================================= */  

/* ================= SEND FRIEND REQUEST ================= */  
window.sendFriendRequest = async function (toUid, toName) {  
  if (!user || user.uid === toUid) return;  

  await addDoc(collection(db, "friendRequests"), {  
    from: user.uid,  
    fromName: user.email.split("@")[0],  
    to: toUid,  
    toName,  
    status: "pending",  
    createdAt: serverTimestamp()  
  });  
};  

/* ================= LOAD FRIEND REQUESTS ================= */  
function loadFriendRequests() {  
  const box = document.getElementById("friendRequestsBox");  
  if (!box) return;  

  const q = query(  
    collection(db, "friendRequests"),  
    where("to", "==", user.uid),  
    where("status", "==", "pending")  
  );  

  onSnapshot(q, (snap) => {  
    let html = "";  

    snap.forEach(d => {  
      const r = d.data();  

      html += `  
        <div class="card">  
          <b>${r.fromName}</b> sent a friend request  

          <div style="margin-top:6px;display:flex;gap:6px;">  
            <button onclick="acceptFriend('${d.id}','${r.from}')">Accept</button>  
            <button onclick="rejectFriend('${d.id}')">Reject</button>  
          </div>  
        </div>  
      `;  
    });  

    box.innerHTML = html;  
  });  
}  

/* ================= ACCEPT FRIEND ================= */  
window.acceptFriend = async function (id, fromUid) {  
  await updateDoc(doc(db, "friendRequests", id), {  
    status: "accepted"  
  });  

  await addDoc(collection(db, "friends"), {  
    userA: user.uid,  
    userB: fromUid,  
    createdAt: serverTimestamp()  
  });  
};  

/* ================= REJECT FRIEND ================= */  
window.rejectFriend = async function (id) {  
  await updateDoc(doc(db, "friendRequests", id), {  
    status: "rejected"  
  });  
};  

/* ================= LOAD FRIENDS ================= */  
function loadFriends() {  
  const box = document.getElementById("friendsBox");  
  if (!box) return;  

  const q = query(collection(db, "friends"));  

  onSnapshot(q, (snap) => {  
    let html = "";  

    snap.forEach(d => {  
      const f = d.data();  

      if (f.userA !== user.uid && f.userB !== user.uid) return;  

      const friendId = f.userA === user.uid ? f.userB : f.userA;  

      html += `  
        <div class="card">  
          👤 ${friendId}  
          <button onclick="openProfile('${friendId}')">View</button>  
        </div>  
      `;  
    });  

    box.innerHTML = html;  
  });  
}  

/* ================= PROFILE NAV ================= */  
window.openProfile = function (uid) {  
  location.href = `user.html?uid=${uid}`;  
};