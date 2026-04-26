/* ================= IMPORT ================= */
import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= UI ELEMENT ================= */
function showMessage(text, color = "#5bc0be") {
  let msg = document.getElementById("authMessage");

  if (!msg) {
    msg = document.createElement("div");
    msg.id = "authMessage";
    msg.style.marginTop = "10px";
    msg.style.fontSize = "14px";
    document.querySelector(".center-box").appendChild(msg);
  }

  msg.style.color = color;
  msg.innerText = text;
}

/* ================= BUTTON STATE ================= */
function setLoading(btn, state, text) {
  if (!btn) return;

  if (state) {
    btn.disabled = true;
    btn.dataset.original = btn.innerText;
    btn.innerText = text || "Processing...";
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.innerText = btn.dataset.original || "Submit";
    btn.style.opacity = "1";
  }
}

/* ================= SIGNUP ================= */
window.signup = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const btn = event.target;

  if (!email || !password) {
    return showMessage("Please fill all fields", "#ff6b6b");
  }

  setLoading(btn, true, "Creating account...");

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    showMessage("Account created successfully!", "#00ff88");

    setTimeout(() => {
      document.getElementById("loginModal").style.display = "none";
      window.location.href = "dashboard.html";
    }, 1200);

  } catch (err) {
    showMessage(err.message, "#ff6b6b");
  }

  setLoading(btn, false);
};

/* ================= LOGIN ================= */
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const btn = event.target;

  if (!email || !password) {
    return showMessage("Please fill all fields", "#ff6b6b");
  }

  setLoading(btn, true, "Logging in...");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    showMessage("Login successful!", "#00ff88");

    setTimeout(() => {
      document.getElementById("loginModal").style.display = "none";
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (err) {
    showMessage(err.message, "#ff6b6b");
  }

  setLoading(btn, false);
};