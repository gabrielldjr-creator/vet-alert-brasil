import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function createAdminApp(): App {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential = encoded ? cert(JSON.parse(encoded) as { projectId: string; clientEmail: string; privateKey: string }) : applicationDefault();
  return initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID ?? "vet-alert-brasil" });
}

export function getAdminApp() {
  return getApps()[0] ?? createAdminApp();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
