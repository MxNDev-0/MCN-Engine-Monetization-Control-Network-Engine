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

// ==========================
// CONFIG
// ==========================
const ADMIN_EMAIL = "nc.maxiboro@gmail.com";

// ==========================
// ELEMENTS
// ==========================
const postsDiv = document.getElementById("posts");
const adminPanel = document.getElementById("adminPanel");

// ==========================
// AUTH CHECK
// ==========================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadPosts();

    // SHOW ADMIN PANEL
    if (user.email === ADMIN_EMAIL) {
      adminPanel.style.display = "block";
    }
  }
});

// ==========================
// LOGOUT
// ==========================
window.logout = function () {
  signOut(auth);
};

// ==========================
// CREATE POST
// ==========================
window.createPost = async function () {
  const text = document.getElementById("postText").value.trim();
  const link = document.getElementById("postLink").value.trim();

  if (!text || !link) {
    alert("Fill all fields");
    return;
  }

  try {
    await addDoc(collection(db, "posts"), {
      text: text,
      link: link,
      user: auth.currentUser.email,
      clicks: 0,
      likes: 0,
      comments: [],
      createdAt: new Date()
    });

    // CLEAR INPUT
    document.getElementById("postText").value = "";
    document.getElementById("postLink").value = "";

    loadPosts();
  } catch (err) {
    console.error(err);
    alert("Error creating post");
  }
};

// ==========================
// LOAD POSTS
// ==========================
async function loadPosts() {
  postsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const snapshot = await getDocs(collection(db, "posts"));

    postsDiv.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const id = docSnap.id;

      let commentsHTML = "";

      if (post.comments && post.comments.length > 0) {
        post.comments.forEach((c) => {
          commentsHTML += `
            <p><b>${c.user}:</b> ${c.text}</p>
          `;
        });
      }

      postsDiv.innerHTML += `
        <div class="post">
          <h4>${post.user}</h4>
          <p>${post.text}</p>

          <a href="${post.link}" target="_blank" onclick="trackClick('${id}')">
            Visit Link
          </a>

          <p>Clicks: ${post.clicks || 0}</p>
          <p>Likes: ${post.likes || 0}</p>

          <button onclick="likePost('${id}')">Like ❤️</button>

          <div style="margin-top:10px;">
            <input id="comment-${id}" placeholder="Write a comment">
            <button onclick="addComment('${id}')">Comment</button>
          </div>

          <div style="margin-top:10px;">
            ${commentsHTML}
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    postsDiv.innerHTML = "<p>Error loading posts</p>";
  }
}

// ==========================
// TRACK CLICKS 💰
// ==========================
window.trackClick = async function (id) {
  try {
    const ref = doc(db, "posts", id);
    await updateDoc(ref, {
      clicks: increment(1)
    });
  } catch (err) {
    console.error(err);
  }
};

// ==========================
// LIKE POST ❤️
// ==========================
window.likePost = async function (id) {
  try {
    const ref = doc(db, "posts", id);
    await updateDoc(ref, {
      likes: increment(1)
    });

    loadPosts();
  } catch (err) {
    console.error(err);
  }
};

// ==========================
// ADD COMMENT 💬
// ==========================
window.addComment = async function (id) {
  const input = document.getElementById(`comment-${id}`);
  const text = input.value.trim();

  if (!text) return;

  try {
    const ref = doc(db, "posts", id);

    await updateDoc(ref, {
      comments: arrayUnion({
        user: auth.currentUser.email,
        text: text
      })
    });

    input.value = "";
    loadPosts();
  } catch (err) {
    console.error(err);
  }
};
