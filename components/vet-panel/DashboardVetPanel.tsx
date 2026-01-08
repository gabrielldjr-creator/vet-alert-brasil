"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { Button } from "../Button";
import { Card } from "../Card";
import { ensurePilotAuth } from "../../lib/auth";
import { auth, db } from "../../lib/firebase";
import { VetPanelFilters } from "./VetPanelFilters";
import { VetPanelSummary } from "./VetPanelSummary";
import { VetPanelFeed } from "./VetPanelFeed";
import { AlertRecord, VetPanelFiltersState } from "./types";

const speciesOptions = [
  "Equinos",
  "Bovinos",
  "Suínos",
  "Aves",
  "Pequenos animais (cães/gatos)",
  "Animais silvestres",
  "Outros animais de produção",
];

const alertGroupOptions = [
  "Síndromes Clínicas",
  "Alertas Populacionais",
  "Ambientais / Toxicológicos",
  "Bem-estar / Manejo",
  "Síndromes Compatíveis com Zoonoses",
  "Outro",
];

const severityOptions = ["Atenção", "Preocupante", "Urgente"];

const timeWindowOptions = [
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

const neighboringStatesByUf: Record<string, string[]> = {
  AC: ["AM", "RO"],
  AL: ["BA", "PE", "SE"],
  AP: ["PA"],
  AM: ["AC", "RR", "RO", "PA", "MT"],
  BA: ["SE", "AL", "PE", "PI", "TO", "GO", "MG", "ES"],
  CE: ["PI", "PE", "PB", "RN"],
  DF: ["GO"],
  ES: ["BA", "MG", "RJ"],
  GO: ["DF", "MG", "MS", "MT", "TO", "BA"],
  MA: ["PA", "TO", "PI"],
  MT: ["RO", "AM", "PA", "TO", "GO", "MS"],
  MS: ["MT", "GO", "MG", "SP", "PR"],
  MG: ["BA", "ES", "RJ", "SP", "PR", "MS", "GO"],
  PA: ["AP", "AM", "RR", "MT", "TO", "MA"],
  PB: ["RN", "CE", "PE"],
  PR: ["SP", "MS", "SC"],
  PE: ["PB", "CE", "PI", "BA", "AL"],
  PI: ["MA", "TO", "BA", "PE", "CE"],
  RJ: ["ES", "MG", "SP"],
  RN: ["CE", "PB"],
  RS: ["SC"],
  RO: ["AC", "AM", "MT"],
  RR: ["AM", "PA"],
  SC: ["PR", "RS"],
  SP: ["MG", "RJ", "PR", "MS"],
  SE: ["AL", "BA"],
  TO: ["MA", "PI", "BA", "GO", "MT", "PA"],
};

const timeWindowLabel = (timeWindow: VetPanelFiltersState["timeWindow"]) => {
  switch (timeWindow) {
    case "24h":
      return "nas últimas 24h";
    case "7d":
      return "nos últimos 7 dias";
    case "30d":
      return "nos últimos 30 dias";
    default:
      return "no período selecionado";
  }
};

const getAlertTimestamp = (alert: AlertRecord) => {
  return alert.createdAt?.toDate?.() ?? alert.timestamp?.toDate?.();
};

const getScopeLabel = (scope: VetPanelFiltersState["stateScope"], state?: string) => {
  if (scope === "state" && state) {
    return `no estado ${state}`;
  }
  if (scope === "neighbors") {
    return "nos estados vizinhos";
  }
  return "em todo o Brasil";
};

export function DashboardVetPanel() {
  const [status, setStatus] = useState<"checking" | "restricted" | "ready">("checking");
  const [profile, setProfile] = useState<{ state?: string; city?: string } | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [filters, setFilters] = useState<VetPanelFiltersState>({
    stateScope: "state",
    species: "",
    alertGroup: "",
    severity: "",
    timeWindow: "7d",
  });
  const searchParams = useSearchParams();
  const registrationFlag = searchParams.get("registrado") === "1";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await ensurePilotAuth();
        } catch (authError) {
          console.error("Erro ao iniciar sessão técnica", authError);
          setStatus("restricted");
        }
        return;
      }

      try {
        const profileRef = doc(db, "vetProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          const fallbackProfile = {
            uid: user.uid,
            role: "vet",
            state: "SC",
            verified: false,
            createdAt: serverTimestamp(),
          };
          await setDoc(profileRef, fallbackProfile);
          setProfile(fallbackProfile);
          setStatus("ready");
          return;
        }

        setProfile(profileSnap.data() as { state?: string; city?: string });
        setStatus("ready");
      } catch (error) {
        console.error("Erro ao verificar perfil do veterinário", error);
        setStatus("restricted");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (status !== "ready") return;

    const baseQuery = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as AlertRecord),
        id: docSnap.id,
      }));
      setAlerts(data);
    });

    return () => unsubscribe();
  }, [status]);

  const filteredAlerts = useMemo(() => {
    const now = Date.now();
    const cutoff = new Date(now);
    if (filters.timeWindow === "24h") {
      cutoff.setHours(cutoff.getHours() - 24);
    } else if (filters.timeWindow === "7d") {
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff.setDate(cutoff.getDate() - 30);
    }

    const state = profile?.state;
    const scopeStates =
      filters.stateScope === "all" || !state
        ? null
        : new Set([state, ...(filters.stateScope === "neighbors" ? neighboringStatesByUf[state] || [] : [])]);

    return alerts.filter((alert) => {
      const createdAt = getAlertTimestamp(alert);
      if (!createdAt || createdAt < cutoff) return false;
      if (scopeStates && (!alert.state || !scopeStates.has(alert.state))) return false;
      if (filters.species && alert.species !== filters.species) return false;
      if (filters.alertGroup && alert.alertGroup !== filters.alertGroup) return false;
      if (filters.severity && alert.severity !== filters.severity) return false;
      return true;
    });
  }, [alerts, filters, profile?.state]);

  const summaryLines = useMemo(() => {
    if (filteredAlerts.length === 0) return [];

    const groupCounts = filteredAlerts.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.alertGroup || "Sem grupo";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const speciesCounts = filteredAlerts.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.species || "Espécie não informada";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0];
    const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0];
    const urgentCount = filteredAlerts.filter((alert) => alert.severity === "Urgente").length;
    const scopeLabel = getScopeLabel(filters.stateScope, profile?.state);
    const windowLabel = timeWindowLabel(filters.timeWindow);

    const lines = [
      `${filteredAlerts.length} alertas registrados ${windowLabel} ${scopeLabel}.`,
      topGroup ? `Grupo mais frequente: ${topGroup[0]} (${topGroup[1]}).` : null,
      topSpecies ? `Espécies mais citadas: ${topSpecies[0]} (${topSpecies[1]}).` : null,
      urgentCount ? `${urgentCount} alertas marcados como urgentes ${windowLabel}.` : null,
    ].filter((line): line is string => Boolean(line));

    return lines.slice(0, 3);
  }, [filteredAlerts, filters.stateScope, filters.timeWindow, profile?.state]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Verificando acesso</p>
          <p className="text-base text-slate-700">Confirmando sessão e perfil do veterinário...</p>
        </Card>
      </div>
    );
  }

  if (status === "restricted") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Acesso restrito</p>
          <p className="text-base text-slate-700">
            Este painel é reservado a médicos-veterinários convidados. Verifique seu link de acesso ou tente novamente.
          </p>
        </Card>
      </div>
    );
  }

  const stateScope = profile?.state ?? "UF";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Painel autenticado</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Alertas clínicos descritivos da sua região</h1>
            <p className="max-w-3xl text-base text-slate-700">
              Visualize alertas enviados por veterinários com informações descritivas, sem diagnósticos ou dados sensíveis. Ajuste o
              escopo regional, a janela de tempo e filtros rápidos para identificar padrões de atenção.
            </p>
          </div>
          <Button href="/alerta/novo">Registrar novo alerta</Button>
        </div>
        {registrationFlag && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            Alerta registrado com sucesso. O painel foi atualizado automaticamente.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <VetPanelSummary lines={summaryLines} />
        <Card className="p-6">
          <VetPanelFilters
            filters={filters}
            onChange={setFilters}
            stateLabel={stateScope}
            speciesOptions={speciesOptions}
            alertGroupOptions={alertGroupOptions}
            severityOptions={severityOptions}
            timeWindowOptions={timeWindowOptions}
          />
        </Card>
      </section>

      <VetPanelFeed alerts={filteredAlerts} />
    </div>
  );
}
