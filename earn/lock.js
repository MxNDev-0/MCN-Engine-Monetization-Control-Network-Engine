import { auth } from "../firebase.js";
import { db } from "../firebase.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let checked = false;

/* ================= GLOBAL LOCK ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    alert("Please login first");
    location.href = "../index.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const isPremium = snap.exists() && snap.data().premium === true;

  if (!isPremium) {

    alert(
      "⚠️ PREMIUM REQUIRED\n\n" +
      "This earning feature is locked.\n\n" +
      "Upgrade to access tools.\n\n" +
      "Payments are NON-REFUNDABLE and results are NOT guaranteed."
    );

    location.href = "../dashboard.html";
    return;
  }

  /* ✅ ACCESS GRANTED */
  checked = true;
});