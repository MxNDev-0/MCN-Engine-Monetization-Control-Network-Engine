import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  addDoc,
  collection
} from "./firebase.js";

let currentUser = null;

/* AUTH */
window.register = async ()=>{
  const email = prompt("Email");
  const pass = prompt("Password");

  const user = await createUserWithEmailAndPassword(auth,email,pass);

  // create user profile in database
  await addDoc(collection(db,"users"),{
    uid:user.user.uid,
    email:user.user.email,
    role:"user",
    createdAt:new Date()
  });

  alert("Registered");
};

window.login = async ()=>{
  const email = prompt("Email");
  const pass = prompt("Password");

  await signInWithEmailAndPassword(auth,email,pass);

  alert("Logged in");
};

/* SESSION */
onAuthStateChanged(auth,(user)=>{
  currentUser = user;

  if(user){
    document.getElementById("dashboard").style.display="block";
  }else{
    document.getElementById("dashboard").style.display="none";
  }
});

/* AFFILIATE TRACKING */
window.trackClick = async (type)=>{
  if(!currentUser){
    alert("Login required");
    return;
  }

  let link = "";

  if(type==="forfans"){
    link = "https://forfans.me/chichiguy";
  }

  if(type==="fixedfloat"){
    link = "https://ff.io/?ref=s1nep47a";
  }

  // log click to Firestore
  await addDoc(collection(db,"clicks"),{
    uid: currentUser.uid,
    type,
    link,
    time: new Date()
  });

  window.open(link,"_blank");
};

/* LOGOUT */
window.logout = ()=>signOut(auth);
