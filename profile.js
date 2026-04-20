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
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadUsername();
  loadPosts();
});

/* ================= HAMBURGER MENU (FIXED 100%) ================= */
window.toggleMenu = function () {
  const menu = document.getElementById("dropdownMenu");

  if (!menu) return;

  if (menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    menu.style.display = "block";
  }
};

/* ================= USERNAME ================= */
async function loadUsername() {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const display = document.getElementById("usernameDisplay");

  if (snap.exists() && snap.data().username) {
    display.innerText = snap.data().username;
  } else {
    display.innerText = "Not set";
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

/* ================= PASSWORD RESET ================= */
window.resetPassword = async () => {
  if (!user?.email) return;

  await sendPasswordResetEmail(auth, user.email);
  alert("Reset email sent 📩");
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

/* ================= LOAD POSTS (FIXED FACEBOOK STYLE MENU) ================= */
function loadPosts() {
  const q = query(collection(db, "posts"), orderBy("time"));
  const box = document.getElementById("myPosts");

  onSnapshot(q, (snap) => {
    box.innerHTML = "";

    snap.forEach(d => {
      const p = d.data();
      const id = d.id;

      if (p.user !== user.email.split("@")[0]) return;

      const isPrivate = p.visibility === "private";

      box.innerHTML += `
        <div class="post" style="position:relative;">

          <div class="post-header">
            <div class="avatar"></div>
            <div>${p.user}</div>
          </div>

          <div style="margin-top:6px;">
            ${p.text}
          </div>

          <!-- TOP RIGHT 3 DOTS (FIXED) -->
          <div onclick="toggleMenu_${id}()" style="
            position:absolute;
            top:8px;
            right:10px;
            font-size:20px;
            cursor:pointer;
            user-select:none;
          ">⋯</div>

          <!-- DROPDOWN -->
          <div id="menu_${id}" style="
            display:none;
            position:absolute;
            top:30px;
            right:10px;
            background:#1c2541;
            border-radius:8px;
            overflow:hidden;
            z-index:999;
            min-width:140px;
          ">

            <button onclick="editPost('${id}')" style="width:100%;padding:8px;background:none;border:none;color:white;text-align:left;">✏️ Edit</button>

            <button onclick="deletePost('${id}')" style="width:100%;padding:8px;background:none;border:none;color:white;text-align:left;">🗑 Delete</button>

            <button onclick="toggleVisibility('${id}','${p.visibility}')" style="width:100%;padding:8px;background:none;border:none;color:white;text-align:left;">
              ${isPrivate ? "🔓 Make Public" : "🔒 Make Private"}
            </button>

          </div>

        </div>
      `;
    });
  });
}

/* ================= MENU TOGGLE (DYNAMIC SAFE) ================= */
window.toggleMenu = window.toggleMenu; // keep safe

/* dynamic toggle generator */
window.toggleMenuFactory = function (id) {
  return function () {
    const m = document.getElementById("menu_" + id);
    if (!m) return;

    m.style.display = m.style.display === "block" ? "none" : "block";
  };
};

/* attach dynamic toggles */
window.toggleMenu_ = function (id) {
  const m = document.getElementById("menu_" + id);
  if (!m) return;

  m.style.display = m.style.display === "block" ? "none" : "block";
};

/* ================= EDIT ================= */
window.editPost = async (id) => {
  const newText = prompt("Edit post:");
  if (!newText) return;

  await updateDoc(doc(db, "posts", id), {
    text: newText
  });
};

/* ================= DELETE ================= */
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
};

/* ================= TOGGLE PRIVATE/PUBLIC ================= */
window.toggleVisibility = async (id, current) => {
  const newState = current === "private" ? "public" : "private";

  await updateDoc(doc(db, "posts", id), {
    visibility: newState
  });
};