"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { Card } from "../../../components/Card";

type Summary = { label: string; acceptedObservations: number | null; eligibleObservations: number | null; suppressedCellCount: number; suspiciousRecordsExcluded: number; cells: Array<{ stateCode: string; species: string; signalGroup: string; observationCount: number; municipalityCount: number; periods: string[]; classification: string; explanation: { compatibleRecords: number; municipalities: number; timeBuckets: number; suspiciousRecordsExcluded: number } }>; methodology: { version: string; scientificallyValidated: boolean } };

export default function SapsaDashboardClient() {
  const [state, setState] = useState<"loading" | "denied" | "ready" | "error">("loading");
  const [summary, setSummary] = useState<Summary | null>(null);
  useEffect(() => {
    let active = true;
    const load = async (user: typeof auth.currentUser) => {
      if (!user) { if (active) setState("denied"); return; }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/v2/sapsa/summary", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (response.status === 401 || response.status === 403) { if (active) setState("denied"); return; }
        if (!response.ok) throw new Error("summary_failed");
        if (active) { setSummary(await response.json() as Summary); setState("ready"); }
      } catch { if (active) setState("error"); }
    };
    const unsubscribe = onAuthStateChanged(auth, load);
    return () => { active = false; unsubscribe(); };
  }, []);

  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6"><header><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SAPSA · acesso por papel</p><h1 className="text-3xl font-semibold">Convergência territorial para revisão</h1><p className="mt-2 text-slate-600">Inteligência observacional agregada. Não é diagnóstico, previsão, prevalência ou notificação oficial.</p></header>
    {state === "loading" ? <Card className="p-6">Verificando autorização…</Card> : null}
    {state === "denied" ? <Card className="border-red-100 bg-red-50 p-6"><h2 className="font-semibold">Acesso não autorizado</h2><p className="text-sm">É necessário papel institucional SAPSA atribuído no servidor.</p></Card> : null}
    {state === "error" ? <Card className="p-6">Resumo indisponível.</Card> : null}
    {state === "ready" && summary ? <><section className="grid gap-4 sm:grid-cols-4"><Card className="p-4"><p className="text-xs">Observações aceitas</p><p className="text-2xl font-semibold">{summary.acceptedObservations ?? "Suprimido"}</p></Card><Card className="p-4"><p className="text-xs">Elegíveis</p><p className="text-2xl font-semibold">{summary.eligibleObservations ?? "Suprimido"}</p></Card><Card className="p-4"><p className="text-xs">Células suprimidas</p><p className="text-2xl font-semibold">{summary.suppressedCellCount}</p></Card><Card className="p-4"><p className="text-xs">Suspeitos excluídos</p><p className="text-2xl font-semibold">{summary.suspiciousRecordsExcluded}</p></Card></section><section className="grid gap-4">{summary.cells.map((cell) => <Card key={`${cell.stateCode}-${cell.species}-${cell.signalGroup}`} className="p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{cell.stateCode} · {cell.species} · {cell.signalGroup}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{cell.classification}</span></div><p className="mt-3 text-sm text-slate-700">{cell.explanation.compatibleRecords} registros compatíveis; {cell.explanation.municipalities} municípios; {cell.explanation.timeBuckets} períodos; {cell.explanation.suspiciousRecordsExcluded} registros suspeitos excluídos.</p></Card>)}</section><p className="text-xs text-slate-500">Metodologia {summary.methodology.version}; limiares exploratórios, não validados cientificamente.</p></> : null}
  </div>;
}
