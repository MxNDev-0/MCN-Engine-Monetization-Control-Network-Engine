import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

/* SIGNUP */
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPass").value;

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert("Signup successful");
  } catch (e) {
    alert(e.message);
  }
});

/* LOGIN */
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert("Login successful");
  } catch (e) {
    alert("Login failed: " + e.message);
  }
});

/* AUTH STATE */
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("dashboard").style.display = "block";
  } else {
    document.getElementById("dashboard").style.display = "none";
  }
});

/* LOGOUT */
window.logout = () => signOut(auth);
