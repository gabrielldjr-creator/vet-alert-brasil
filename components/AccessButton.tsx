"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "../lib/firebase";

export function AccessButton() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user));
    });

    return () => unsubscribe();
  }, []);

  const handleClick = () => {
    if (isAuthenticated) {
      router.push("/alerta/novo");
      return;
    }

    router.push("/acesso");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hidden rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:inline-flex"
    >
      Acesso
    </button>
  );
}
