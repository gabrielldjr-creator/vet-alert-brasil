"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ensureAnonymousAuth } from "../../lib/auth";
import { Card } from "../../components/Card";

export default function AccessLinkClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateStatus = (nextStatus: typeof status, nextMessage = "") => {
      setTimeout(() => {
        setStatus(nextStatus);
        setMessage(nextMessage);
      }, 0);
    };

    const run = async () => {
      try {
        await ensureAnonymousAuth();
        updateStatus("ready");
        router.replace("/alerta/novo");
      } catch (error) {
        console.error("Erro ao iniciar sessão anônima", error);
        updateStatus("error", "Falha ao autenticar anonimamente. Verifique sua conexão.");
      }
    };

    run();
  }, [router]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Acesso imediato</p>
        <h1 className="text-3xl font-semibold text-slate-900">Ativando sessão</h1>
        <p className="text-sm text-slate-600">
          Este processo ativa a sessão anônima para uso imediato.
        </p>
      </div>

      <Card className="space-y-2 p-6 text-sm text-slate-700">
        {status === "checking" && <p>Iniciando sessão anônima...</p>}
        {status === "ready" && <p>Acesso confirmado. Redirecionando para registrar alerta...</p>}
        {status === "error" && <p className="text-rose-700">{message}</p>}
      </Card>
    </div>
  );
}
