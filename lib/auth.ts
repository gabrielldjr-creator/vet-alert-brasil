import {
  browserLocalPersistence,
  inMemoryPersistence,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";

import { auth } from "./firebase";

let authPromise: Promise<typeof auth.currentUser> | null = null;

export async function ensureAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authPromise) {
    authPromise = (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn("Persistência local indisponível, usando memória.", error);
        await setPersistence(auth, inMemoryPersistence);
      }
      const credential = await signInAnonymously(auth);
      return credential.user;
    })();
  }

  try {
    return await authPromise;
  } finally {
    authPromise = null;
  }
}
