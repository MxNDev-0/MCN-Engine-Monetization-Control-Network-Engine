import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= SEND MESSAGE ================= */
export async function sendChatMessage(text, userData) {
  if (!text.trim()) return;

  await addDoc(collection(db, "chatMessages"), {
    text,
    uid: auth.currentUser.uid,
    email: auth.currentUser.email,
    role: userData?.role || "user",
    createdAt: serverTimestamp()
  });
}

/* ================= LISTEN MESSAGES ================= */
export function listenChat(callback) {
  const q = query(
    collection(db, "chatMessages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {
    const messages = [];

    snap.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    callback(messages);
  });
}