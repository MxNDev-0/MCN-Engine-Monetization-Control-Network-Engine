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
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

const postsDiv = document.getElementById("posts");

let isPremiumUser = false;

// AUTH
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadPosts();
  }
});

// LOGOUT
window.logout = () => signOut(auth);

// NAV
window.goHome = () => location.reload();
window.goProfile = () => alert("Profile coming soon");

// CREATE POST (NOW HAS PREMIUM OPTION)
window.createPost = async function () {
  const text = document.getElementById("postText").value;
  const link = document.getElementById("postLink").value;
  const premium = document.getElementById("isPremium").checked;

  if (!text || !link) return alert("Fill all fields");

  await addDoc(collection(db, "posts"), {
    text,
    link,
    user: auth.currentUser.email,
    clicks: 0,
    likes: 0,
    comments: [],
    premium: premium,
    createdAt: new Date()
  });

  loadPosts();
};

// LOAD POSTS
async function loadPosts() {
  postsDiv.innerHTML = "";

  const snapshot = await getDocs(collection(db, "posts"));

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const id = docSnap.id;

    const isLocked = post.premium && !isPremiumUser;

    postsDiv.innerHTML += `
      <div class="post">
        <h4>
          ${post.user}
          ${post.premium ? `<span class="premium-badge">PREMIUM</span>` : ""}
        </h4>

        <div class="${isLocked ? "locked" : ""}">
          <p>${post.text}</p>
        </div>

        ${isLocked ? `
          <button class="unlock-btn" onclick="unlockPremium()">
            Unlock Premium 💎
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

// FAKE PREMIUM UNLOCK (we will connect payment later)
window.unlockPremium = function () {
  const code = prompt("Enter Premium Code:");

  if (code === "MXM2026") {
    isPremiumUser = true;
    alert("Premium Activated 💎");
    loadPosts();
  } else {
    alert("Invalid code");
  }
};

// CLICK TRACK
window.trackClick = async function (id) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { clicks: increment(1) });
};

// LIKE
window.likePost = async function (id) {
  const ref = doc(db, "posts", id);
  await updateDoc(ref, { likes: increment(1) });
  loadPosts();
};

// COMMENT
window.addComment = async function (id) {
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
