"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { Button } from "../Button";
import { Card } from "../Card";
import { ensurePilotAuth } from "../../lib/auth";
import { auth, db } from "../../lib/firebase";
import { mapAlertGroupLabel } from "./alertLabeling";
import { VetPanelFilters } from "./VetPanelFilters";
import { AlertRecord, VetPanelFiltersState } from "./types";

const PILOT_MODE = process.env.NEXT_PUBLIC_PILOT_MODE === "true" || process.env.NEXT_PUBLIC_PILOT_MODE === "1";
const STRATEGIC_ACCESS = process.env.NEXT_PUBLIC_STRATEGIC_VIEW === "true";
const MIN_STATE_THRESHOLD = 10;

const MACRO_REGION_BY_STATE: Record<string, VetPanelFiltersState["macroRegion"]> = {
  AC: "norte",
  AL: "nordeste",
  AP: "norte",
  AM: "norte",
  BA: "nordeste",
  CE: "nordeste",
  DF: "centro-oeste",
  ES: "sudeste",
  GO: "centro-oeste",
  MA: "nordeste",
  MT: "centro-oeste",
  MS: "centro-oeste",
  MG: "sudeste",
  PA: "norte",
  PB: "nordeste",
  PR: "sul",
  PE: "nordeste",
  PI: "nordeste",
  RJ: "sudeste",
  RN: "nordeste",
  RS: "sul",
  RO: "norte",
  RR: "norte",
  SC: "sul",
  SP: "sudeste",
  SE: "nordeste",
  TO: "norte",
};

const MACRO_REGION_OPTIONS = [
  { value: "all", label: "Brasil" },
  { value: "sul", label: "Região Sul" },
  { value: "sudeste", label: "Região Sudeste" },
  { value: "centro-oeste", label: "Região Centro-Oeste" },
  { value: "nordeste", label: "Região Nordeste" },
  { value: "norte", label: "Região Norte" },
] as const;

const speciesOptions = [
  "Equinos",
  "Bovinos",
  "Suínos",
  "Aves",
  "Pequenos animais (cães/gatos)",
  "Animais silvestres",
  "Outros animais de produção",
];

const severityOptions = ["Atenção", "Preocupante", "Urgente"];
const timeWindowOptions = [
  { value: "30d", label: "Período selecionado (30 dias)" },
  { value: "60d", label: "Período selecionado (60 dias)" },
  { value: "90d", label: "Período selecionado (90 dias)" },
];

type LayerType = "clinical" | "strategic";

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? "";
const normalizeState = (value?: string) => value?.trim().toUpperCase() ?? "";
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const formatPercent = (value: number) => `${Math.round(clamp(value))}%`;
const getAlertTimestamp = (alert: AlertRecord) => alert.createdAt?.toDate?.() ?? alert.timestamp?.toDate?.();

const asArray = (value: string[] | string | undefined) => {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
};

const getMacroRegion = (state?: string): VetPanelFiltersState["macroRegion"] | null => {
  const normalized = normalizeState(state);
  return MACRO_REGION_BY_STATE[normalized] ?? null;
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-500 transition-all" style={{ width: `${clamp(value)}%` }} />
    </div>
  );
}

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
  const palette = ["#334155", "#64748b", "#94a3b8", "#cbd5e1", "#475569"];

  const segments = data.reduce<string[]>((acc, item, index) => {
    const start = acc.length ? Number(acc[acc.length - 1].split(" ").at(-1)?.replace("deg", "") ?? "0") : 0;
    const end = start + (item.value / total) * 360;
    acc.push(`${palette[index % palette.length]} ${start}deg ${end}deg`);
    return acc;
  }, []);

  return (
    <div className="grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(${segments.join(", ")})` }}>
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-sm font-semibold text-slate-700">{data.length} perfis</div>
    </div>
  );
}

export function DashboardVetPanel() {
  const [status, setStatus] = useState<"checking" | "restricted" | "ready">("checking");
  const [profile, setProfile] = useState<{ state?: string; city?: string } | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [layer, setLayer] = useState<LayerType>("clinical");
  const [filters, setFilters] = useState<VetPanelFiltersState>({
    macroRegion: "all",
    stateScope: "all",
    species: "",
    alertGroup: "",
    severity: "",
    regionIBGE: "all",
    municipality: "all",
    timeWindow: "30d",
  });

  const searchParams = useSearchParams();
  const registrationFlag = searchParams.get("registrado") === "1";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const allowAccess = Boolean(user) || PILOT_MODE;
      if (PILOT_MODE) setStatus("ready");

      if (!user) {
        if (allowAccess) return;
        try {
          await ensurePilotAuth();
        } catch (authError) {
          console.error("Erro ao iniciar sessão técnica", authError);
          setStatus("restricted");
        }
        return;
      }

      try {
        setStatus("ready");
        const profileRef = doc(db, "vetProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          const fallbackProfile = { uid: user.uid, role: "vet", state: "SC", verified: false, createdAt: serverTimestamp() };
          await setDoc(profileRef, fallbackProfile);
          setProfile(fallbackProfile);
          return;
        }

        setProfile(profileSnap.data() as { state?: string; city?: string });
      } catch (error) {
        console.error("Erro ao verificar perfil do veterinário", error);
        if (!allowAccess) setStatus("restricted");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const baseQuery = query(collection(db, "alerts"), orderBy("createdAt", "desc"));

    const loadInitialAlerts = async () => {
      try {
        const snapshot = await getDocs(baseQuery);
        setAlerts(snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as AlertRecord), id: docSnap.id })));
      } catch (error) {
        console.error("Erro ao carregar registros", error);
      }
    };

    loadInitialAlerts();

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      setAlerts(snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as AlertRecord), id: docSnap.id })));
    });

    return () => unsubscribe();
  }, [status]);

  const prefilteredByWindow = useMemo(() => {
    const cutoff = new Date();
    const days = filters.timeWindow === "30d" ? 30 : filters.timeWindow === "60d" ? 60 : 90;
    cutoff.setDate(cutoff.getDate() - days);

    return alerts.filter((alert) => {
      const createdAt = getAlertTimestamp(alert);
      if (createdAt && createdAt < cutoff) return false;
      if (filters.species && normalizeText(alert.species) !== normalizeText(filters.species)) return false;
      if (filters.severity && normalizeText(alert.severity) !== normalizeText(filters.severity)) return false;
      return true;
    });
  }, [alerts, filters.severity, filters.species, filters.timeWindow]);

  const stateOptions = useMemo(() => {
    const counts = prefilteredByWindow.reduce<Record<string, number>>((acc, alert) => {
      const state = normalizeState(alert.state);
      const macro = getMacroRegion(state);
      if (!state || !macro) return acc;
      if (filters.macroRegion !== "all" && macro !== filters.macroRegion) return acc;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts)
      .filter((state) => counts[state] >= MIN_STATE_THRESHOLD)
      .sort()
      .map((state) => ({ value: state, label: state }));
  }, [filters.macroRegion, prefilteredByWindow]);

  const showStateOptions = stateOptions.length > 0;
  const activeStateScope = filters.stateScope !== "all" && stateOptions.some((option) => option.value === filters.stateScope) ? filters.stateScope : "all";

  const filteredAlerts = useMemo(() => {
    return prefilteredByWindow.filter((alert) => {
      const state = normalizeState(alert.state);
      const macro = getMacroRegion(state);
      if (!macro) return false;
      if (filters.macroRegion !== "all" && macro !== filters.macroRegion) return false;
      if (activeStateScope !== "all" && state !== activeStateScope) return false;
      return true;
    });
  }, [activeStateScope, filters.macroRegion, prefilteredByWindow]);

  const dashboardData = useMemo(() => {
    const source = filteredAlerts;
    const total = source.length || 1;

    const syndromeMap = source.reduce<Record<string, number>>((acc, alert) => {
      const grouped = mapAlertGroupLabel(alert.alertGroup) || alert.alertType || "Manifestações cutâneas crônicas";
      const safeGrouped = grouped === "Síndromes Compatíveis com Zoonoses" ? "Manifestações cutâneas crônicas" : grouped;
      acc[safeGrouped] = (acc[safeGrouped] || 0) + 1;
      return acc;
    }, {});

    const profileDistribution = Object.entries(syndromeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, value: (count / total) * 100 }));

    const sharedContext = {
      atendimentoTardio: (source.filter((a) => ["late", "very_late"].includes(a.arrival_context?.when_called ?? "")).length / total) * 100,
      adesaoTerapeutica:
        (source.filter((a) => (a.arrival_context?.external_factors ?? []).includes("recommendation_not_followed")).length / total) * 100,
      mudancasManejo:
        (source.filter((a) => Boolean(a.context?.recentChanges && normalizeText(a.context?.recentChanges) !== "nenhuma mudança")).length / total) * 100,
      cargaParasitaria: (source.filter((a) => normalizeText(a.context?.parasiteObservation).includes("alta carga")).length / total) * 100,
    };

    const therapeuticDistribution = Object.entries(
      source.reduce<Record<string, number>>((acc, alert) => {
        asArray(alert.context?.pharma?.drugCategory).forEach((category) => {
          const normalized = category.trim();
          if (!normalized) return;
          acc[normalized] = (acc[normalized] || 0) + 1;
        });
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, value: (count / total) * 100 }));

    const complexityScore =
      (source.reduce((acc, alert) => {
        const factors = [
          ["late", "very_late"].includes(alert.arrival_context?.when_called ?? ""),
          (alert.arrival_context?.external_factors ?? []).length > 0,
          asArray(alert.context?.pharma?.drugCategory).length > 0,
          (alert.context?.environment?.environmentSignals ?? []).length > 0,
        ].filter(Boolean).length;
        return acc + factors / 4;
      }, 0) /
        total) *
      100;

    return {
      profileDistribution,
      sharedContext,
      therapeuticDistribution,
      complexityScore,
      complexityTier: complexityScore < 34 ? "Baixo" : complexityScore < 67 ? "Moderado" : "Elevado",
    };
  }, [filteredAlerts]);

  const strategicData = useMemo(() => {
    const compareWindow = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return filteredAlerts.filter((alert) => {
        const date = getAlertTimestamp(alert);
        return date ? date >= cutoff : true;
      });
    };

    const last30 = compareWindow(30);
    const last90 = compareWindow(90);

    return {
      compositional30to90: (last30.length / (last90.length || 1)) * 100,
      preventiveOpportunityIndex:
        (last90.filter((a) => (a.arrival_context?.external_factors ?? []).includes("recommendation_not_followed")).length / (last90.length || 1)) * 100,
      byState: stateOptions.map((option) => option.label),
    };
  }, [filteredAlerts, stateOptions]);

  const scopeLabel = filters.macroRegion === "all" ? "Brasil" : MACRO_REGION_OPTIONS.find((o) => o.value === filters.macroRegion)?.label ?? "Brasil";

  if (status === "checking") {
    return <div className="px-4 py-16 text-center text-slate-700">Confirmando acesso ao painel...</div>;
  }

  if (status === "restricted") {
    return <div className="px-4 py-16 text-center text-slate-700">Acesso restrito para profissionais convidados.</div>;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">VetAlert • painel clínico agregado</p>
          <h1 className="text-3xl font-semibold text-slate-900">Radar clínico regional</h1>
          <p className="max-w-3xl text-base text-slate-600">Visão assistencial despersonalizada para apoiar decisões de rotina e planejamento.</p>
          <p className="text-xs text-slate-500">Escopo ativo: {scopeLabel}</p>
        </div>
        <Button href="/alerta/novo" className="bg-slate-700 text-white hover:bg-slate-800 focus-visible:outline-slate-700">
          Registrar novo sinal
        </Button>
      </section>

      <section className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setLayer("clinical")} className={`rounded-full border px-4 py-2 text-sm font-semibold ${layer === "clinical" ? "border-slate-500 bg-slate-100" : "border-slate-200"}`}>
          Clinical Radar View
        </button>
        <button type="button" onClick={() => setLayer("strategic")} className={`rounded-full border px-4 py-2 text-sm font-semibold ${layer === "strategic" ? "border-slate-500 bg-slate-100" : "border-slate-200"}`}>
          Strategic Intelligence View
        </button>
      </section>

      {registrationFlag && <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-800">Registro salvo. O painel foi atualizado.</div>}

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-6">
          <VetPanelFilters
            filters={filters}
            onChange={setFilters}
            speciesOptions={speciesOptions}
            alertGroupOptions={[]}
            municipalityOptions={[]}
            regionIBGEOptions={[]}
            severityOptions={severityOptions}
            timeWindowOptions={timeWindowOptions}
            macroRegionOptions={MACRO_REGION_OPTIONS as { value: string; label: string }[]}
            stateOptions={stateOptions}
            showStateOptions={showStateOptions}
          />
        </Card>

        <Card className="space-y-3 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota de uso</p>
          <p className="text-sm text-slate-700">Indicadores exibidos somente em formato agregado e despersonalizado.</p>
          <p className="text-sm text-slate-700">O contexto apresentado busca apoiar a prática clínica com linguagem neutra e colaborativa.</p>
          {profile?.state && <p className="text-xs text-slate-500">Perfil autenticado com base principal em {profile.state}.</p>}
        </Card>
      </section>

      {layer === "clinical" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Block 1</p>
            <p className="text-sm text-slate-600">Perfis clínicos predominantes no período selecionado.</p>
            <div className="flex items-center gap-4">
              <Donut data={dashboardData.profileDistribution.slice(0, 5)} />
              <div className="w-full space-y-2">
                {dashboardData.profileDistribution.slice(0, 4).map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>{item.label}</span>
                      <span className="font-semibold">{formatPercent(item.value)}</span>
                    </div>
                    <ProgressBar value={item.value} />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Block 2</p>
            <p className="text-sm text-slate-700">Contexto assistencial regional (dados agregados)</p>
            <p className="text-xs text-slate-500">Indicadores consolidados que refletem desafios compartilhados da rotina assistencial.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Atendimento em estágio avançado", value: dashboardData.sharedContext.atendimentoTardio },
                { label: "Limitação de adesão terapêutica", value: dashboardData.sharedContext.adesaoTerapeutica },
                { label: "Mudanças recentes de manejo", value: dashboardData.sharedContext.mudancasManejo },
                { label: "Alta carga parasitária relatada", value: dashboardData.sharedContext.cargaParasitaria },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(item.value)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Block 3</p>
            <p className="text-sm text-slate-600">Classes terapêuticas mais mencionadas no período.</p>
            <div className="space-y-2">
              {dashboardData.therapeuticDistribution.slice(0, 5).map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-semibold">{formatPercent(item.value)}</span>
                  </div>
                  <ProgressBar value={item.value} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Block 4</p>
            <div className="flex items-end justify-between">
              <p className="text-sm text-slate-600">Nível médio de complexidade</p>
              <p className="text-2xl font-semibold text-slate-900">{dashboardData.complexityTier}</p>
            </div>
            <ProgressBar value={dashboardData.complexityScore} />
          </Card>
        </section>
      )}

      {layer === "strategic" && (
        <section className="grid gap-6 lg:grid-cols-2">
          {!STRATEGIC_ACCESS ? (
            <Card className="p-6 lg:col-span-2">
              <p className="text-sm font-semibold text-slate-800">Strategic Intelligence View com acesso controlado.</p>
              <p className="mt-2 text-sm text-slate-600">Solicite habilitação para visualizar comparativos agregados de planejamento.</p>
            </Card>
          ) : (
            <>
              <Card className="space-y-2 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comparação composicional</p>
                <p className="text-sm text-slate-700">Participação relativa de 30 dias na composição ampliada: {formatPercent(strategicData.compositional30to90)}.</p>
              </Card>
              <Card className="space-y-2 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comparativo interestadual agregado</p>
                <p className="text-sm text-slate-700">Estados com base mínima no recorte atual: {strategicData.byState.join(", ") || "-"}.</p>
              </Card>
              <Card className="space-y-2 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Índice de oportunidade preventiva</p>
                <p className="text-2xl font-semibold text-slate-900">{formatPercent(strategicData.preventiveOpportunityIndex)}</p>
              </Card>
              <Card className="space-y-2 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Indicadores de planejamento operacional</p>
                <p className="text-sm text-slate-700">Leitura orientada a planejamento assistencial em escala agregada.</p>
                <p className="text-sm text-slate-700">Sem exibição de microcontagens ou recortes identificáveis.</p>
              </Card>
            </>
          )}
        </section>
      )}

      <Card className="border-slate-200 bg-slate-50 p-6 text-sm text-slate-800">
        Esta plataforma fornece análise agregada e observacional de registros clínicos despersonalizados. Não confirma diagnósticos e não substitui fluxos oficiais previstos em lei.
      </Card>
    </div>
  );
}
