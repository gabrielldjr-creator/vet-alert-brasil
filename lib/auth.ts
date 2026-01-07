import { browserLocalPersistence, setPersistence, signInAnonymously } from "firebase/auth";

import { auth } from "./firebase";

export async function ensureAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInAnonymously(auth);
  return credential.user;
}
