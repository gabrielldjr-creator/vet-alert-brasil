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

// Evita inicializar o Firebase duas vezes (Next.js faz hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth (inclui Anonymous Auth, que você já ativou no console)
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);
