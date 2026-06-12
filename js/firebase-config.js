import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATh__GVE-RamS1_fbe486AeXf-o6XOwCk",
  authDomain: "projeto-web-e2392.firebaseapp.com",
  projectId: "projeto-web-e2392",
  storageBucket: "projeto-web-e2392.firebasestorage.app",
  messagingSenderId: "536633207634",
  appId: "1:536633207634:web:fc8506b46cd58e9b92a88b",
  measurementId: "G-ZK5F1LZ2KF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);