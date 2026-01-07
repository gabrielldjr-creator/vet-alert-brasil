"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "./firebase";

const SESSION_ID_KEY = "vet-alert-session-id";
const SESSION_EMAIL_PREFIX = "vet-session-";
const SESSION_EMAIL_DOMAIN = "vetalert.local";
const SESSION_PASSWORD = "vet-alert-piloto-2025";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const nextId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(SESSION_ID_KEY, nextId);
    return nextId;
  } catch (error) {
    console.warn("Storage indisponível, usando sessão volátil.", error);
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }
}

function mapAuthError(code?: string) {
  switch (code) {
    case "auth/network-request-failed":
      return "Falha de rede. Verifique sua conexão e tente novamente.";
    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
    case "auth/operation-not-allowed":
      return "Auth por e-mail não habilitado no Firebase.";
    case "auth/invalid-email":
      return "Sessão técnica inválida. Limpe o cache e recarregue a página.";
    default:
      return "Falha ao iniciar sessão. Recarregue a página e tente novamente.";
  }
}

export async function ensurePilotAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
    const sessionId = getOrCreateSessionId();
    const email = `${SESSION_EMAIL_PREFIX}${sessionId}@${SESSION_EMAIL_DOMAIN}`;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, SESSION_PASSWORD);
      return credential.user;
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === "auth/email-already-in-use") {
        const credential = await signInWithEmailAndPassword(auth, email, SESSION_PASSWORD);
        return credential.user;
      }
      throw error;
    }
  } catch (error: unknown) {
    const authError = error as { code?: string };
    throw new Error(mapAuthError(authError.code));
  }
}
