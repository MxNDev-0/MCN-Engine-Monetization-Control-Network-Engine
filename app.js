import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "./firebase.js";

// REGISTER
window.register = async function () {
  const firstName = document.getElementById("firstName").value;
  const surname = document.getElementById("surname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const error = document.getElementById("error");

  error.textContent = "";

  if (!firstName || !surname || !email || !password || !confirmPassword) {
    error.textContent = "All fields are required!";
    return;
  }

  if (password !== confirmPassword) {
    error.textContent = "Passwords do not match!";
    return;
  }

  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCred.user.uid), {
      firstName,
      surname,
      email,
      isAdmin: false
    });

  } catch (err) {
    error.textContent = err.message;
  }
};

// LOGIN
window.login = async function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const error = document.getElementById("error");

  error.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      error.textContent = "User not found.";
    } else if (err.code === "auth/wrong-password") {
      error.textContent = "Incorrect password.";
    } else {
      error.textContent = err.message;
    }
  }
};

// LOGOUT
window.logout = function () {
  signOut(auth);
};

// RESET PASSWORD
window.resetPassword = async function () {
  const email = document.getElementById("loginEmail").value;

  if (!email) {
    alert("Enter your email first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent!");
  } catch (err) {
    alert(err.message);
  }
};

// SESSION (NO AUTO LOGOUT)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    const docSnap = await getDoc(doc(db, "users", user.uid));

    if (docSnap.exists()) {
      const data = docSnap.data();

      document.getElementById("welcome").innerText =
        "Welcome " + data.firstName;

      if (data.isAdmin === true) {
        document.getElementById("adminPanel").style.display = "block";
      }
    }

  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

// SEND MESSAGE
window.sendMessage = async function () {
  const msg = document.getElementById("message").value;
  const user = auth.currentUser;

  if (!msg) {
    alert("Message cannot be empty");
    return;
  }

  await addDoc(collection(db, "messages"), {
    text: msg,
    email: user.email,
    createdAt: new Date()
  });

  alert("Message sent!");
};

// LOAD MESSAGES (ADMIN)
window.loadMessages = async function () {
  const box = document.getElementById("messages");
  box.innerHTML = "";

  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const m = doc.data();
    box.innerHTML += `<p><b>${m.email}</b>: ${m.text}</p>`;
  });
};
