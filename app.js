import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  collection,
  addDoc,
  db
} from "./firebase.js";

/* ======================
   POPUP MESSAGE SYSTEM
====================== */
function show(msg){
  const p = document.getElementById("popup");
  p.innerText = msg;
  p.style.display = "block";
  setTimeout(()=>p.style.display="none",3000);
}

/* ======================
   MODALS
====================== */
window.openRegister=()=>document.getElementById("registerModal").style.display="block";
window.openLogin=()=>document.getElementById("loginModal").style.display="block";
window.closeModal=(id)=>document.getElementById(id).style.display="none";

/* ======================
   REGISTER (FIXED)
====================== */
window.register = async ()=>{
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;

  if(pass !== confirm){
    show("Passwords do not match");
    return;
  }

  try{
    const userCred = await createUserWithEmailAndPassword(auth,email,pass);

    // Send verification email properly
    await sendEmailVerification(userCred.user);

    show("Account created! Check your email (spam folder too)");

  }catch(e){
    show(e.message);
  }
};

/* ======================
   LOGIN (FIXED FINAL)
====================== */
window.login = async ()=>{
  try{
    const userCred = await signInWithEmailAndPassword(
      auth,
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value
    );

    const user = userCred.user;

    // 🔥 FORCE REFRESH EMAIL STATUS
    await user.reload();

    // We DO NOT block dashboard anymore (important fix)
    if(!user.emailVerified){
      show("⚠ Email not verified (but login allowed)");
    } else {
      show("Login successful");
    }

  }catch(e){
    show("Wrong login details");
  }
};

/* ======================
   SESSION CONTROL
====================== */
onAuthStateChanged(auth,(user)=>{
  if(user){
    document.getElementById("auth")?.style && (document.getElementById("auth").style.display="none");
    document.getElementById("dashboard").style.display="block";
  } else {
    document.getElementById("dashboard").style.display="none";
  }
});

/* ======================
   LOGOUT
====================== */
window.logout = ()=>signOut(auth);

/* ======================
   RESET PASSWORD
====================== */
window.resetPassword = async ()=>{
  const email = document.getElementById("loginEmail").value;

  try{
    await sendPasswordResetEmail(auth,email);
    show("Password reset email sent");
  }catch(e){
    show(e.message);
  }
};

/* ======================
   RESEND EMAIL (FIXED)
====================== */
window.resendVerification = async ()=>{
  try{
    const user = auth.currentUser;

    if(!user){
      show("Login first");
      return;
    }

    await sendEmailVerification(user);

    show("Verification email sent (check inbox/spam)");

  }catch(e){
    show("Failed to send verification");
  }
};

/* ======================
   LINKS
====================== */
window.openLink = (type)=>{
  if(type==="earn"){
    window.open("https://forfans.me/chichiguy","_blank");
  }

  if(type==="float"){
    window.open("https://ff.io/?ref=s1nep47a","_blank");
  }
};

/* ======================
   MESSAGES
====================== */
window.sendMessage = async ()=>{
  const msg = document.getElementById("message");

  if(!msg.value){
    show("Message is empty");
    return;
  }

  await addDoc(collection(db,"messages"),{
    text: msg.value,
    time: new Date()
  });

  msg.value = "";
  show("Message sent!");
};

/* ======================
   IMAGE UPLOAD (LOCAL ONLY)
====================== */
window.uploadImage = ()=>{
  const file = document.getElementById("imgUpload").files[0];
  if(!file){
    show("No image selected");
    return;
  }

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "100px";
  img.style.margin = "5px";

  document.getElementById("gallery").appendChild(img);

  show("Image uploaded");
};

/* ======================
   PREMIUM
====================== */
window.premium = ()=>{
  alert("Premium coming soon 🚧");
};
