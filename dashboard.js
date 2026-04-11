import { auth, db } from "./firebase.js";
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

const postsDiv = document.getElementById("posts");

// ======================
// AUTH + USER CREATE
// ======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      premium: false
    });
  }

  loadPosts();
});

// ======================
// NAV
// ======================
window.logout = () => signOut(auth);
window.goHome = () => loadPosts();
window.goProfile = () => alert("Profile coming soon");

// ======================
// PREMIUM PAGE
// ======================
window.goPremium = function () {
  alert("Premium is $15 USDT. Redirecting...");

  window.open("https://nowpayments.io/payment/?iid=MXM_PREMIUM_15", "_blank");
};

// ======================
// ADMIN PANEL
// ======================
window.goAdmin = async function () {
  if (auth.currentUser.email !== ADMIN_EMAIL) {
    alert("Not admin ❌");
    return;
  }

  document.getElementById("adminPanel").style.display = "block";
  loadUsers();
};

// ======================
// CREATE POST
// ======================
window.createPost = async function () {
  const text = document.getElementById("postText").value;
  const link = document.getElementById("postLink").value;

  if (!text || !link) return alert("Fill all fields");

  await addDoc(collection(db, "posts"), {
    text,
    link,
    user: auth.currentUser.email,
    clicks: 0,
    likes: 0,
    comments: [],
    premium: false
  });

  loadPosts();
};

// ======================
// LOAD POSTS
// ======================
async function loadPosts() {
  postsDiv.innerHTML = "Loading...";

  const userRef = doc(db, "users", auth.currentUser.uid);
  const userSnap = await getDoc(userRef);

  const isPremium = userSnap.data()?.premium;

  const snapshot = await getDocs(collection(db, "posts"));

  postsDiv.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const id = docSnap.id;

    const locked = post.premium && !isPremium;

    postsDiv.innerHTML += `
      <div class="post">
        <h4>${post.user} ${post.premium ? "💎" : ""}</h4>

        <p class="${locked ? "locked" : ""}">
          ${post.text}
        </p>

        ${locked ? `
          <button class="unlock-btn" onclick="goPremium()">
            Unlock Premium
          </button>
        ` : `
          <a href="${post.link}" target="_blank" onclick="trackClick('${id}')">
            Visit Link
          </a>
        `}

        <p>Clicks: ${post.clicks}</p>
        <p>Likes: ${post.likes}</p>

        <button onclick="likePost('${id}')">Like ❤️</button>

        <input id="comment-${id}" placeholder="Comment">
        <button onclick="addComment('${id}')">Send</button>
      </div>
    `;
  });
}

// ======================
// TRACK CLICK
// ======================
window.trackClick = async (id) => {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { clicks: increment(1) });
};

// ======================
// LIKE
// ======================
window.likePost = async (id) => {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { likes: increment(1) });
  loadPosts();
};

// ======================
// COMMENT
// ======================
window.addComment = async (id) => {
  const input = document.getElementById(`comment-${id}`);
  const text = input.value;

  const ref = doc(db, "posts", id);

  await updateDoc(ref, {
    comments: arrayUnion({
      user: auth.currentUser.email,
      text
    })
  });

  input.value = "";
  loadPosts();
};

// ======================
// LOAD USERS (ADMIN)
// ======================
async function loadUsers() {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const id = docSnap.id;

    usersList.innerHTML += `
      <div class="user-card">
        <p>${user.email}</p>
        <p>Premium: ${user.premium}</p>

        <button onclick="togglePremium('${id}', ${user.premium})">
          Toggle Premium
        </button>
      </div>
    `;
  });
}

// ======================
// TOGGLE PREMIUM
// ======================
window.togglePremium = async function (id, status) {
  const ref = doc(db, "users", id);

  await updateDoc(ref, {
    premium: !status
  });

  loadUsers();
};
