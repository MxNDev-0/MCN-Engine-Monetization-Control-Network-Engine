import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  collection,
  addDoc
} from "./firebase.js";

// POPUP
function show(msg){
  const p=document.getElementById("popup");
  p.innerText=msg;
  p.style.display="block";
  setTimeout(()=>p.style.display="none",3000);
}

// MODALS
window.openRegister=()=>document.getElementById("registerModal").style.display="block";
window.openLogin=()=>document.getElementById("loginModal").style.display="block";
window.closeModal=(id)=>document.getElementById(id).style.display="none";

// REGISTER
window.register = async ()=>{
  const email=document.getElementById("regEmail").value;
  const pass=document.getElementById("regPassword").value;
  const confirm=document.getElementById("regConfirm").value;

  if(pass!==confirm){
    show("Passwords do not match");
    return;
  }

  try{
    const user=await createUserWithEmailAndPassword(auth,email,pass);
    await sendEmailVerification(user.user);
    show("Verification email sent!");
  }catch(e){
    show(e.message);
  }
};

// LOGIN
window.login = async ()=>{
  try{
    const user=await signInWithEmailAndPassword(
      auth,
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value
    );

    if(!user.user.emailVerified){
      show("Verify your email first");
      return;
    }

  }catch(e){
    show("Invalid login");
  }
};

// SESSION
onAuthStateChanged(auth,(user)=>{
  if(user && user.emailVerified){
    document.getElementById("dashboard").style.display="block";
  }
});

// LOGOUT
window.logout=()=>signOut(auth);

// RESET
window.resetPassword=async ()=>{
  const email=document.getElementById("loginEmail").value;
  await sendPasswordResetEmail(auth,email);
  show("Reset email sent");
};

// LINKS
window.openLink=(type)=>{
  if(type==="earn"){
    window.open("https://forfans.me/chichiguy");
  }
  if(type==="float"){
    window.open("https://ff.io/?ref=s1nep47a");
  }
};

// MESSAGE
window.sendMessage=async ()=>{
  const msg=document.getElementById("message");

  if(!msg.value){
    show("Empty message");
    return;
  }

  await addDoc(collection(db,"messages"),{
    text:msg.value
  });

  msg.value="";
  show("Message sent!");
};

// IMAGE (LOCAL PREVIEW)
window.uploadImage=()=>{
  const file=document.getElementById("imgUpload").files[0];
  const img=document.createElement("img");
  img.src=URL.createObjectURL(file);
  img.style.width="100px";
  document.getElementById("gallery").appendChild(img);
};
