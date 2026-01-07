"use client";

import { useEffect, useState } from "react";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useRouter } from "next/navigation";

import { Card } from "../../components/Card";
import { AccessRestricted } from "../../components/AccessRestricted";
import { auth } from "../../lib/firebase";

export default function AccessLinkClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "error" | "restricted">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const href = window.location.href;
    const updateStatus = (nextStatus: typeof status, nextMessage = "") => {
      setTimeout(() => {
        setStatus(nextStatus);
        setMessage(nextMessage);
      }, 0);
    };

    if (!isSignInWithEmailLink(auth, href)) {
      updateStatus("restricted");
      return;
    }

    const params = new URL(href).searchParams;
    const email = params.get("email");
    if (!email) {
      updateStatus("error", "Este link precisa conter o e-mail autorizado. Abra o link original enviado pelo convite.");
      return;
    }

    const run = async () => {
      try {
        await signInWithEmailLink(auth, email, href);
        updateStatus("ready");
        router.replace("/alerta/novo");
      } catch (error) {
        console.error("Erro ao validar link mágico", error);
        updateStatus("error", "Não foi possível validar o link. Solicite um novo convite.");
      }
    };

    run();
  }, [router]);

  if (status === "restricted") {
    return <AccessRestricted />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Acesso convidado</p>
        <h1 className="text-3xl font-semibold text-slate-900">Validando link de acesso</h1>
        <p className="text-sm text-slate-600">
          Este processo confirma o convite e ativa a sessão invisível para uso imediato.
        </p>
      </div>

      <Card className="space-y-2 p-6 text-sm text-slate-700">
        {status === "checking" && <p>Verificando o link mágico...</p>}
        {status === "ready" && <p>Acesso confirmado. Redirecionando para registrar alerta...</p>}
        {status === "error" && <p className="text-rose-700">{message}</p>}
      </Card>
    </div>
  );
}
