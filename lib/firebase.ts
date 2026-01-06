import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfIsNkHdxXMS06HuL5L0COnvsrT8L0Y",
  authDomain: "vet-alert-brasil.firebaseapp.com",
  projectId: "vet-alert-brasil",
  storageBucket: "vet-alert-brasil.appspot.com",
  messagingSenderId: "687132341294",
  appId: "1:687132341294:web:250963ab8cda6db47e9bbf",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
