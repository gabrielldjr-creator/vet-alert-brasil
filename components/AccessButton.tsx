"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
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

  const [error, setError] = useState("");
  const handleClick = async () => {
    if (isAuthenticated) {
      router.push("/alerta/novo");
      return;
    }

    try {
      setError("");
      await signInAnonymously(auth);
      router.push("/alerta/novo");
    } catch (authError) {
      console.error("Erro ao iniciar sessão anônima", authError);
      setError("Falha ao autenticar anonimamente. Verifique sua conexão.");
    }
  };

  return (
    <div className="hidden flex-col items-end gap-2 sm:flex">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        Acesso
      </button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
