import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "./firebase.js";

// 🔥 AUTO REDIRECT IF ALREADY LOGGED IN
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

// LOGIN
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("pass").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = "dashboard.html";
  } catch (e) {
    alert(e.message);
  }
});

// SIGNUP
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("pass").value;

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("Account created. Now login.");
  } catch (e) {
    alert(e.message);
  }
});
