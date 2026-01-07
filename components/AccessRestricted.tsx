"use client";

import { useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "../lib/firebase";
import { Button } from "./Button";
import { Card } from "./Card";

export function AccessRestricted() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccess = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await signInAnonymously(auth);
      router.push("/alerta/novo");
    } catch (authError) {
      console.error("Erro ao iniciar sessão anônima", authError);
      setError("Não foi possível iniciar a sessão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
          Acesso imediato
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          Entrar e registrar alerta agora
        </h1>
        <p className="max-w-3xl text-lg text-slate-700">
          Clique para iniciar uma sessão anônima e registrar um alerta em segundos. Não há formulários de cadastro nem etapas
          intermediárias.
        </p>
      </div>

      <Card className="space-y-3 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Ação imediata</p>
        <p className="text-base text-slate-700">
          Assim que a sessão for iniciada, você será direcionado ao registro de alertas. Em seguida, o painel regional será
          atualizado automaticamente.
        </p>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="button" disabled={isSubmitting} onClick={handleAccess}>
          {isSubmitting ? "Ativando sessão..." : "Registrar alerta agora"}
        </Button>
      </Card>
    </div>
  );
}
