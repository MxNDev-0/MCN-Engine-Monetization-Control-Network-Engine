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
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let user = null;

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (u) => {
  if (!u) location.href = "index.html";

  user = u;

  loadPosts();
  loadUsername();
});

/* ================= MENU FIX (STABLE) ================= */
window.toggleMenu = function () {
  const menu =
    document.getElementById("dropdownMenu") ||
    document.getElementById("menu");

  if (!menu) return;

  const isOpen =
    menu.style.display === "block" ||
    menu.classList.contains("active");

  menu.style.display = isOpen ? "none" : "block";
  menu.classList.toggle("active");
};

/* ================= USERNAME LOAD ================= */
async function loadUsername() {
  if (!user) return;

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

  if (!username) {
    alert("Enter username");
    return;
  }

  try {
    await setDoc(
      doc(db, "users", user.uid),
      { username },
      { merge: true }
    );

    document.getElementById("usernameDisplay").innerText = username;

    input.value = "";
    alert("Username updated ✅");

  } catch (err) {
    console.error(err);
    alert("Failed to update username");
  }
};

/* ================= RESET PASSWORD ================= */
window.resetPassword = async () => {
  if (!user?.email) return;

  try {
    await sendPasswordResetEmail(auth, user.email);
    alert("Password reset link sent 📩");
  } catch (err) {
    console.error(err);
    alert("Failed to send reset email");
  }
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

/* ================= LOAD POSTS (CLEAN V15 FIX) ================= */
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

          <div class="post-header">
            <div class="avatar"></div>
            <div>${p.user}</div>
          </div>

          <div>${p.text}</div>

          <div style="margin-top:6px;">
            <span class="${isPrivate ? "tag-private" : "tag-public"}">
              ${isPrivate ? "🔒 Private" : "🌍 Public"}
            </span>
          </div>

          <!-- 3 DOT MENU ONLY -->
          <div class="dot-menu" onclick="toggleVisibilityMenu('${id}')">⋮</div>

          <div class="visibility-menu" id="menu-${id}" style="display:none;flex-direction:column;">
            <button onclick="setPublic('${id}')">🌍 Public</button>
            <button onclick="setPrivate('${id}')">🔒 Private</button>
          </div>

        </div>
      `;
    });
  });
}

/* ================= TOGGLE MENU (FIXED) ================= */
window.toggleVisibilityMenu = (id) => {
  const el = document.getElementById("menu-" + id);
  if (!el) return;

  const isVisible = el.style.display === "flex";

  document.querySelectorAll(".visibility-menu").forEach(m => {
    m.style.display = "none";
  });

  el.style.display = isVisible ? "none" : "flex";
};

/* ================= VISIBILITY ================= */
window.setPublic = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "public"
  });

  document.getElementById("menu-" + id).style.display = "none";
};

window.setPrivate = async (id) => {
  await updateDoc(doc(db, "posts", id), {
    visibility: "private"
  });

  document.getElementById("menu-" + id).style.display = "none";
};