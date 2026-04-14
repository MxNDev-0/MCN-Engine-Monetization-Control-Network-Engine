import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let user = null;

onAuthStateChanged(auth, (u) => {
  if (!u) location.href = "index.html";
  user = u;
});

/* MENU */
window.toggleMenu = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "block") ? "none" : "block";
};

function closeMenu() {
  document.getElementById("menu").style.display = "none";
}

/* NAV */
window.goDashboard = () => {
  closeMenu();
  location.href = "dashboard.html";
};

/* USERNAME */
window.setUsername = () => {
  closeMenu();
  const name = prompt("Enter username:");
  if (name) alert("Username saved (v2 will store it)");
};

/* PASSWORD */
window.changePassword = async () => {
  closeMenu();
  const newPass = prompt("Enter new password:");

  if (!newPass) return;

  try {
    await updatePassword(user, newPass);
    alert("Password updated");
  } catch (err) {
    alert(err.message);
  }
};

/* ADMIN */
window.openMySection = () => {
  closeMenu();

  if (user.email !== "nc.maxiboro@gmail.com") {
    alert("❌ Access denied");
    return;
  }

  alert("Welcome Admin Office");
};

/* SUPPORT */
window.contactSupport = () => {
  closeMenu();
  alert("Contact: mxm-support@email.com");
};