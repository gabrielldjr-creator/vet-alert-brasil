"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8fIsNkHdxXMS06HulU5l0CONvsrT8l0Y",
  authDomain: "vet-alert-brasil.firebaseapp.com",
  projectId: "vet-alert-brasil",
  storageBucket: "vet-alert-brasil.firebasestorage.app",
  messagingSenderId: "687132341294",
  appId: "1:687132341294:web:250963ab8cda6bd47e9bbf",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
