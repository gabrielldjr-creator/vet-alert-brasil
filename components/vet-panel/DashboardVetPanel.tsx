"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { Button } from "../Button";
import { Card } from "../Card";
import { ensurePilotAuth } from "../../lib/auth";
import { auth, db } from "../../lib/firebase";
import { VetPanelFilters } from "./VetPanelFilters";
import { AlertRecord, VetPanelFiltersState } from "./types";

const PILOT_MODE =
  process.env.NEXT_PUBLIC_PILOT_MODE === "true" || process.env.NEXT_PUBLIC_PILOT_MODE === "1";

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
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

const getAlertTimestamp = (alert: AlertRecord) => {
  return alert.createdAt?.toDate?.() ?? alert.timestamp?.toDate?.();
};

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? "";

const normalizeState = (value?: string) => value?.trim().toUpperCase() ?? "";

const includesValue = (value: string[] | string | undefined, expected: string) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.some((item) => normalizeText(item) === normalizeText(expected));
  return normalizeText(value) === normalizeText(expected);
};

const asArray = (value: string[] | string | undefined) => {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const formatPercent = (value: number) => `${Math.round(clamp(value))}%`;

const getScopeLabel = (scope: VetPanelFiltersState["stateScope"]) => {
  if (scope === "SC") return "Santa Catarina (SC)";
  if (scope === "MT") return "Mato Grosso (MT)";
  return "Brasil";
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-500 transition-all" style={{ width: `${clamp(value)}%` }} />
    </div>
  );
}

function Donut({ value }: { value: number }) {
  const safe = clamp(value);
  return (
    <div
      className="grid h-28 w-28 place-items-center rounded-full"
      style={{
        background: `conic-gradient(rgb(71 85 105) ${safe * 3.6}deg, rgb(226 232 240) 0deg)`,
      }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-lg font-semibold text-slate-800">
        {formatPercent(safe)}
      </div>
    </div>
  );
}

function MetricCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-4 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function DashboardVetPanel() {
  const [status, setStatus] = useState<"checking" | "restricted" | "ready">("checking");
  const [profile, setProfile] = useState<{ state?: string; city?: string } | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [filters, setFilters] = useState<VetPanelFiltersState>({
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
  const [referenceNow, setReferenceNow] = useState(() => new Date());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const allowAccess = Boolean(user) || PILOT_MODE;

      if (PILOT_MODE) {
        setStatus("ready");
      }

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
        if (!allowAccess) {
          setStatus("restricted");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (status !== "ready") return;

    const baseQuery = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
    let isActive = true;

    const loadInitialAlerts = async () => {
      try {
        const snapshot = await getDocs(baseQuery);
        if (!isActive) return;
        const data = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as AlertRecord),
          id: docSnap.id,
        }));
        setAlerts(data);
      } catch (error) {
        console.error("Erro ao carregar registros", error);
      }
    };

    loadInitialAlerts();

    const unsubscribe = onSnapshot(
      baseQuery,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as AlertRecord),
          id: docSnap.id,
        }));
        setAlerts(data);
      },
      (error) => {
        console.error("Erro ao sincronizar registros", error);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [status]);

  useEffect(() => {
    setReferenceNow(new Date());
  }, [filters.timeWindow]);

  const filteredAlerts = useMemo(() => {
    const cutoff = new Date(referenceNow);
    if (filters.timeWindow === "24h") {
      cutoff.setHours(cutoff.getHours() - 24);
    } else if (filters.timeWindow === "7d") {
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff.setDate(cutoff.getDate() - 30);
    }

    const scopeStates =
      filters.stateScope === "all" ? null : new Set([normalizeState(filters.stateScope)]);

    return alerts.filter((alert) => {
      const createdAt = getAlertTimestamp(alert);
      if (createdAt && createdAt < cutoff) return false;
      if (scopeStates) {
        const alertState = normalizeState(alert.state);
        if (!alertState || !scopeStates.has(alertState)) return false;
      }
      if (filters.species && normalizeText(alert.species) !== normalizeText(filters.species)) return false;
      if (filters.severity && normalizeText(alert.severity) !== normalizeText(filters.severity)) return false;
      return true;
    });
  }, [alerts, filters, referenceNow]);

  const alertsWithoutTimeLimit = useMemo(() => {
    const scopeStates = filters.stateScope === "all" ? null : new Set([normalizeState(filters.stateScope)]);
    return alerts.filter((alert) => {
      if (scopeStates) {
        const alertState = normalizeState(alert.state);
        if (!alertState || !scopeStates.has(alertState)) return false;
      }
      if (filters.species && normalizeText(alert.species) !== normalizeText(filters.species)) return false;
      if (filters.severity && normalizeText(alert.severity) !== normalizeText(filters.severity)) return false;
      return true;
    });
  }, [alerts, filters.severity, filters.species, filters.stateScope]);

  const dashboardData = useMemo(() => {
    const source = filteredAlerts;
    const total = source.length || 1;

    const opi =
      (source.reduce((acc, alert) => {
        const whenCalled = alert.arrival_context?.when_called;
        const factors = alert.arrival_context?.external_factors ?? [];
        const situation = alert.arrival_context?.situation_found;

        const lateAttendance = whenCalled === "late" || whenCalled === "very_late" || factors.includes("delayed_call");
        const socioeconomicPressure = factors.includes("financial_limitation");
        const protocolDeviation = factors.includes("recommendation_not_followed") || factors.includes("previous_management");
        const delayedIntervention = situation === "critical" || whenCalled === "very_late";

        const score = [lateAttendance, socioeconomicPressure, protocolDeviation, delayedIntervention].filter(Boolean).length / 4;
        return acc + score;
      }, 0) /
        total) *
      100;

    const poiFromWindow = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const scoped = alertsWithoutTimeLimit.filter((alert) => {
        const createdAt = getAlertTimestamp(alert);
        return createdAt ? createdAt >= cutoff : true;
      });
      if (scoped.length === 0) return 0;
      const matched = scoped.filter((alert) => {
        const factors = alert.arrival_context?.external_factors ?? [];
        const feedChange = alert.context?.feed?.feedChange;
        const drugCategory = alert.context?.pharma?.drugCategory;
        const drugInterval = alert.context?.pharma?.drugInterval;

        const preventiveProtocolNotFollowed = factors.includes("recommendation_not_followed");
        const vaccinationTimingDeviation = includesValue(drugCategory, "Vacina") && Boolean(drugInterval);
        const feedChanged = Boolean(feedChange && normalizeText(feedChange) !== normalizeText("Nenhuma mudança"));
        const recurrentDrugClassUsageReported = Boolean(alert.context?.pharma?.drugExposure === "Sim" || drugInterval === "< 24h" || drugInterval === "1–3 dias");

        return (
          preventiveProtocolNotFollowed ||
          vaccinationTimingDeviation ||
          feedChanged ||
          recurrentDrugClassUsageReported
        );
      }).length;

      return (matched / scoped.length) * 100;
    };

    const poi30 = poiFromWindow(30);
    const poi60 = poiFromWindow(60);
    const poi90 = poiFromWindow(90);

    const classFrequency = source.reduce<Record<string, number>>((acc, alert) => {
      asArray(alert.context?.pharma?.drugCategory).forEach((category) => {
        const normalized = category.trim();
        if (!normalized) return;
        acc[normalized] = (acc[normalized] || 0) + 1;
      });
      return acc;
    }, {});

    const topClassEntry = Object.entries(classFrequency).sort((a, b) => b[1] - a[1])[0] ?? ["Sem classificação", 0];
    const topClassPercentage = total > 0 ? (topClassEntry[1] / total) * 100 : 0;

    const classTrend = (() => {
      const topClass = topClassEntry[0];
      if (topClass === "Sem classificação") return 0;
      const now = new Date();
      const cutoff30 = new Date(now);
      cutoff30.setDate(cutoff30.getDate() - 30);
      const cutoff90 = new Date(now);
      cutoff90.setDate(cutoff90.getDate() - 90);

      const recent = alertsWithoutTimeLimit.filter((alert) => {
        const timestamp = getAlertTimestamp(alert);
        return timestamp ? timestamp >= cutoff30 : false;
      });
      const baseline = alertsWithoutTimeLimit.filter((alert) => {
        const timestamp = getAlertTimestamp(alert);
        return timestamp ? timestamp >= cutoff90 : false;
      });

      const recentRate = recent.length
        ? (recent.filter((alert) => includesValue(alert.context?.pharma?.drugCategory, topClass)).length / recent.length) * 100
        : 0;
      const baseRate = baseline.length
        ? (baseline.filter((alert) => includesValue(alert.context?.pharma?.drugCategory, topClass)).length / baseline.length) * 100
        : 0;

      return recentRate - baseRate;
    })();

    const complexityScore =
      (source.reduce((acc, alert) => {
        const hasStressFactor = (alert.arrival_context?.external_factors ?? []).includes("financial_limitation");
        const hasTreatmentFactor = alert.context?.pharma?.drugExposure === "Sim" || asArray(alert.context?.pharma?.drugCategory).length > 0;
        const hasLateCall = ["late", "very_late"].includes(alert.arrival_context?.when_called ?? "");
        const hasEnvironment = (alert.context?.environment?.environmentSignals ?? []).length > 0;

        const multiFactorCase = [hasStressFactor, hasTreatmentFactor, hasLateCall, hasEnvironment].filter(Boolean).length >= 3;
        const combinedCondition = hasStressFactor && hasTreatmentFactor && hasLateCall;

        const score = [multiFactorCase, combinedCondition, hasEnvironment].filter(Boolean).length / 3;
        return acc + score;
      }, 0) /
        total) *
      100;

    const complexityTier = complexityScore < 34 ? "Baixo" : complexityScore < 67 ? "Moderado" : "Elevado";

    const contextualRisk = {
      transporteRecente:
        (source.filter((alert) => normalizeText(alert.alertType).includes("transporte") || normalizeText(alert.context?.recentChanges).includes("72h")).length /
          total) *
        100,
      mudancaAlimentar:
        (source.filter((alert) => {
          const feedChange = alert.context?.feed?.feedChange;
          return Boolean(feedChange && normalizeText(feedChange) !== normalizeText("Nenhuma mudança"));
        }).length /
          total) *
        100,
      altaCargaParasitaria:
        (source.filter((alert) => {
          const obs = normalizeText(alert.context?.parasiteObservation);
          return obs.includes("alta carga") || normalizeText(alert.alertType).includes("parasit");
        }).length /
          total) *
        100,
      pressaoEconomica:
        (source.filter((alert) => (alert.arrival_context?.external_factors ?? []).includes("financial_limitation")).length / total) * 100,
    };

    return {
      opi,
      poi30,
      poi60,
      poi90,
      topClass: topClassEntry[0],
      topClassPercentage,
      classTrend,
      complexityScore,
      complexityTier,
      contextualRisk,
      sampleSize: source.length,
    };
  }, [alertsWithoutTimeLimit, filteredAlerts]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Verificando acesso</p>
          <p className="text-base text-slate-700">Confirmando sessão e perfil do veterinário...</p>
        </Card>
      </div>
    );
  }

  if (status === "restricted") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Acesso restrito</p>
          <p className="text-base text-slate-700">
            Este painel é reservado a médicos-veterinários convidados. Verifique seu link de acesso ou tente novamente.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <Card className="border-slate-200 bg-slate-50 p-6 text-sm text-slate-800">
        <p>
          Este painel apresenta indicadores operacionais agregados e despersonalizados.
          <br />
          Não constitui vigilância sanitária, notificação oficial ou confirmação diagnóstica.
          <br />
          Para suspeitas de doenças de notificação obrigatória, utilize exclusivamente os canais oficiais.
        </p>
      </Card>

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Painel operacional veterinário</p>
          <h1 className="text-3xl font-semibold text-slate-900">Inteligência de gestão clínica regional</h1>
          <p className="max-w-3xl text-base text-slate-600">
            Visão agregada para preparo de rotina, organização de condutas e leitura de contexto de manejo no estado selecionado.
          </p>
          <p className="text-xs text-slate-500">Escopo ativo: {getScopeLabel(filters.stateScope)}</p>
        </div>
        <Button href="/alerta/novo" className="bg-slate-700 text-white hover:bg-slate-800 focus-visible:outline-slate-700">
          Registrar novo sinal
        </Button>
      </section>

      {registrationFlag && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-800">
          Registro salvo com sucesso. Os indicadores foram atualizados automaticamente.
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <MetricCard
          title="Índice de Pressão Operacional Regional"
          description="Composição percentual baseada em atendimento tardio, pressão econômica, desvio de protocolo e intervenção tardia."
        >
          <div className="flex items-center justify-between gap-4">
            <Donut value={dashboardData.opi} />
            <div className="w-full space-y-3 text-sm text-slate-600">
              <p>Leitura consolidada para priorização de preparo assistencial em campo.</p>
              <ProgressBar value={dashboardData.opi} />
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Indicador de Oportunidades Preventivas"
          description="Percentual de oportunidades associadas a conduta preventiva, calendário, alimentação e recorrência terapêutica."
        >
          <div className="space-y-3">
            {[
              { label: "30 dias", value: dashboardData.poi30 },
              { label: "60 dias", value: dashboardData.poi60 },
              { label: "90 dias", value: dashboardData.poi90 },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.label}</span>
                  <span className="font-semibold">{formatPercent(item.value)}</span>
                </div>
                <ProgressBar value={item.value} />
              </div>
            ))}
          </div>
        </MetricCard>

        <MetricCard
          title="Padrões Terapêuticos Agregados"
          description="Sinalização consolidada por classe terapêutica, sem associação a condição específica."
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              Classe terapêutica mais frequente: <span className="font-semibold text-slate-900">{dashboardData.topClass}</span> ({formatPercent(dashboardData.topClassPercentage)})
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              Tendência de recorrência: <span className="font-semibold text-slate-900">{dashboardData.classTrend >= 0 ? "↑" : "↓"} {formatPercent(Math.abs(dashboardData.classTrend))}</span> em relação à base de 90 dias.
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Nível Médio de Complexidade dos Atendimentos"
          description="Composição baseada em multifatores de manejo, contexto de intervenção e variáveis ambientais."
        >
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <p className="text-sm text-slate-600">Faixa atual</p>
              <p className="text-2xl font-semibold text-slate-900">{dashboardData.complexityTier}</p>
            </div>
            <ProgressBar value={dashboardData.complexityScore} />
            <div className="grid grid-cols-3 text-xs text-slate-500">
              <span>Baixo</span>
              <span className="text-center">Moderado</span>
              <span className="text-right">Elevado</span>
            </div>
          </div>
        </MetricCard>
      </section>

      <section>
        <Card className="space-y-5 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contexto de Manejo e Ambiente</p>
            <p className="text-sm text-slate-600">Fatores contextuais agregados para planejamento de rotina clínica.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Transporte recente", value: dashboardData.contextualRisk.transporteRecente },
              { label: "Mudança alimentar", value: dashboardData.contextualRisk.mudancaAlimentar },
              { label: "Alta carga parasitária relatada", value: dashboardData.contextualRisk.altaCargaParasitaria },
              { label: "Pressão econômica relatada", value: dashboardData.contextualRisk.pressaoEconomica },
            ].map((item) => (
              <div key={item.label} className="space-y-2 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{formatPercent(item.value)}</p>
                <ProgressBar value={item.value} />
              </div>
            ))}
          </div>
        </Card>
      </section>

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
          />
        </Card>
        <Card className="space-y-3 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cobertura do painel</p>
          <p className="text-sm text-slate-700">Indicadores calculados no escopo ativo, sempre em formato agregado e despersonalizado.</p>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            Registros considerados na agregação atual: <span className="font-semibold">{dashboardData.sampleSize}</span>
          </div>
          {profile?.state && <p className="text-xs text-slate-500">Perfil autenticado com base principal em {profile.state}.</p>}
        </Card>
      </section>
    </div>
  );
}
