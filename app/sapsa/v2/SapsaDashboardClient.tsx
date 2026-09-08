"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { Card } from "../../../components/Card";

type EconomicOperationalContextSummary = { moduleVersion: string; observationCount: number; suppressionApplied: true; accessToVeterinaryCare: Record<string, number>; accessToNecessaryInputsOrServices: Record<string, number>; abilityToImplementPreventiveMeasures: Record<string, number>; logisticalOrFinancialPressureAffectingCare: Record<string, number> };
type Summary = { label: string; acceptedObservations: number | null; eligibleObservations: number | null; suppressedCellCount: number; suspiciousRecordsExcluded: number; cells: Array<{ stateCode: string; species: string; signalGroup: string; observationCount: number; municipalityCount: number; periods: string[]; sourceChannelCount: number; classification: string; economicOperationalContextSummary?: EconomicOperationalContextSummary; explanation: { compatibleRecords: number; municipalities: number; timeBuckets: number; suspiciousRecordsExcluded: number } }>; methodology: { version: string; scientificallyValidated: boolean; qualityPolicy: string } };

const economicContextLabels = {
  accessToVeterinaryCare: ["Acesso ao atendimento veterinário", { adequate: "adequado", delayed: "com atraso", unavailable: "indisponível", unknown: "desconhecido" }],
  accessToNecessaryInputsOrServices: ["Acesso a insumos ou serviços", { adequate: "adequado", limited: "limitado", unknown: "desconhecido" }],
  abilityToImplementPreventiveMeasures: ["Capacidade de medidas preventivas", { not_limited: "não limitada", limited: "limitada", unknown: "desconhecida" }],
  logisticalOrFinancialPressureAffectingCare: ["Pressão afetando o cuidado", { not_observed: "não observada", observed: "observada", unknown: "desconhecida" }],
} as const;

function EconomicContextSummary({ summary }: { summary: EconomicOperationalContextSummary }) {
  return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold text-slate-900">Contexto econômico e operacional agregado · módulo v1</p><p className="mt-1">{summary.observationCount} registros com o módulo opcional. Categorias abaixo do limiar mínimo permanecem suprimidas.</p><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(economicContextLabels).map(([field, [label, valueLabels]]) => {
    const counts = summary[field as keyof Pick<EconomicOperationalContextSummary, keyof typeof economicContextLabels>] as Record<string, number>;
    const visible = Object.entries(valueLabels).flatMap(([value, valueLabel]) => counts[value] ? [`${valueLabel}: ${counts[value]}`] : []);
    return <div key={field}><dt className="font-medium text-slate-900">{label}</dt><dd>{visible.length ? visible.join("; ") : "Categorias suprimidas"}</dd></div>;
  })}</dl><p className="mt-3 text-xs">Leitura agregada; não é ranking, conclusão causal nem prova de risco individual.</p></div>;
}

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
    {state === "ready" && summary ? <><section className="grid gap-4 sm:grid-cols-4"><Card className="p-4"><p className="text-xs">Observações aceitas</p><p className="text-2xl font-semibold">{summary.acceptedObservations ?? "Suprimido"}</p></Card><Card className="p-4"><p className="text-xs">Elegíveis</p><p className="text-2xl font-semibold">{summary.eligibleObservations ?? "Suprimido"}</p></Card><Card className="p-4"><p className="text-xs">Células suprimidas</p><p className="text-2xl font-semibold">{summary.suppressedCellCount}</p></Card><Card className="p-4"><p className="text-xs">Suspeitos excluídos</p><p className="text-2xl font-semibold">{summary.suspiciousRecordsExcluded}</p></Card></section><section className="grid gap-4">{summary.cells.map((cell) => <Card key={`${cell.stateCode}-${cell.species}-${cell.signalGroup}`} className="p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{cell.stateCode} · {cell.species} · {cell.signalGroup}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{cell.classification}</span></div><p className="mt-3 text-sm text-slate-700">{cell.explanation.compatibleRecords} registros compatíveis; {cell.explanation.municipalities} municípios; {cell.explanation.timeBuckets} períodos; {cell.sourceChannelCount} canal(is) de origem; {cell.explanation.suspiciousRecordsExcluded} registros suspeitos desta célula excluídos.</p>{cell.economicOperationalContextSummary ? <EconomicContextSummary summary={cell.economicOperationalContextSummary} /> : null}</Card>)}</section><p className="text-xs text-slate-500">Metodologia {summary.methodology.version}; política de qualidade {summary.methodology.qualityPolicy}; limiares exploratórios, não validados cientificamente.</p></> : null}
  </div>;
}
