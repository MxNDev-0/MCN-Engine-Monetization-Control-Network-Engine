function showDashboard() {
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("authSection").style.display = "none";
}

function signup() {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      alert("Account created");
      showDashboard();
    })
    .catch(err => alert(err.message));
}

function login() {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      alert("Login successful");
      showDashboard();
    })
    .catch(err => alert(err.message));
}
