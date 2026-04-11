import {
  auth,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

// 🔥 PROTECT DASHBOARD PAGE
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// LOGOUT
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};
