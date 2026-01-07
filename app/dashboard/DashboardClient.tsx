"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { db } from "../../lib/firebase";
import { stateOptions } from "../../lib/regions";

const speciesFilters = [
  "Equinos",
  "Bovinos",
  "Suínos",
  "Aves",
  "Pequenos animais (cães/gatos)",
  "Animais silvestres",
  "Outros animais de produção",
];

const alertGroups = [
  "Síndromes Clínicas",
  "Alertas Populacionais",
  "Ambientais / Toxicológicos",
  "Bem-estar / Manejo",
  "Síndromes Compatíveis com Zoonoses",
  "Outro",
];

const severityLevels = ["Atenção", "Preocupante", "Urgente"];
const periodOptions = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "14", label: "Últimos 14 dias" },
  { value: "30", label: "Últimos 30 dias" },
];

export function DashboardClient() {
  const [alerts, setAlerts] = useState<
    {
      id: string;
      createdAt?: { toDate: () => Date };
      timestamp?: { toDate: () => Date };
      state?: string;
      city?: string;
      species?: string;
      alertType?: string;
      alertGroup?: string;
      severity?: string;
      herdCount?: string;
    }[]
  >([]);
  const [viewMode, setViewMode] = useState<"estado" | "cidade">("estado");
  const [stateFilter, setStateFilter] = useState("SC");
  const [cityFilter, setCityFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("14");
  const searchParams = useSearchParams();
  const registrationFlag = searchParams.get("registrado") === "1";

  useEffect(() => {
    if (!stateFilter) return;

    const baseQuery = query(
      collection(db, "alerts"),
      where("state", "==", stateFilter),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as typeof alerts[number]),
        id: docSnap.id,
      }));
      setAlerts(data);
    });

    return () => unsubscribe();
  }, [stateFilter]);

  const now = useMemo(() => new Date(), []);
  const periodCutoff = useMemo(() => {
    const days = Number(periodFilter);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - (Number.isNaN(days) ? 14 : days));
    return cutoff;
  }, [now, periodFilter]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const createdAt = alert.createdAt?.toDate?.() ?? alert.timestamp?.toDate?.();
      if (!createdAt) return false;
      if (createdAt < periodCutoff) return false;
      if (speciesFilter && alert.species !== speciesFilter) return false;
      if (typeFilter && alert.alertGroup !== typeFilter) return false;
      if (severityFilter && alert.severity !== severityFilter) return false;
      if (viewMode === "cidade" && cityFilter && alert.city !== cityFilter) return false;
      return true;
    });
  }, [alerts, periodCutoff, speciesFilter, typeFilter, severityFilter, viewMode, cityFilter]);

  const cityOptions = useMemo(() => {
    const cities = new Set(
      alerts.map((alert) => alert.city).filter((city): city is string => Boolean(city && city.trim()))
    );
    return Array.from(cities).sort();
  }, [alerts]);

  const summary = useMemo(() => {
    const total = filteredAlerts.length;
    const urgent = filteredAlerts.filter((alert) => alert.severity === "Urgente").length;
    const byGroup = filteredAlerts.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.alertGroup || "Sem categoria";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topGroup = Object.entries(byGroup).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      urgent,
      topGroup: topGroup ? `${topGroup[0]} (${topGroup[1]})` : "Sem dados",
    };
  }, [filteredAlerts]);

  const citySummary = useMemo(() => {
    const byCity = filteredAlerts.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.city || "Sem cidade";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredAlerts]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Painel regional</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Alertas regionais recentes</h1>
            <p className="max-w-3xl text-base text-slate-700">
              Sinais agregados por estado, com filtros por cidade, espécie, tipo de alerta e gravidade.
            </p>
          </div>
          <Button href="/alerta/novo">Registrar novo alerta</Button>
        </div>
        {registrationFlag && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            Alerta registrado com sucesso. O painel foi atualizado automaticamente.
          </div>
        )}
        <div className="rounded-xl bg-slate-900 px-5 py-4 text-sm text-slate-50">
          Dados agregados em tempo real para acompanhamento regional.
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-6 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Filtros essenciais</p>
            <p className="text-sm text-slate-600">Selecione o estado para iniciar a análise regional.</p>
          </div>
          <div className="grid gap-5">
            <Select
              name="estado"
              label="Estado"
              value={stateFilter}
              onChange={(event) => {
                setStateFilter(event.target.value);
                setCityFilter("");
              }}
            >
              {stateOptions.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visualização</p>
              <div className="flex flex-wrap gap-2">
                {(["estado", "cidade"] as const).map((mode) => {
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        active ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700",
                      ].join(" ")}
                      onClick={() => setViewMode(mode)}
                    >
                      {mode === "estado" ? "Estado (padrão)" : "Cidade"}
                    </button>
                  );
                })}
              </div>
            </div>

            {viewMode === "cidade" && (
              <Select
                name="cidade"
                label="Cidade (opcional)"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                helper="Somente cidades do estado selecionado."
              >
                <option value="">Todas as cidades</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Espécie</p>
              <div className="flex flex-wrap gap-2">
                {speciesFilters.map((option) => {
                  const active = speciesFilter === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        active ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700",
                      ].join(" ")}
                      onClick={() => setSpeciesFilter(active ? "" : option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Select
                name="categoria"
                label="Tipo de alerta"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="">Todos</option>
                {alertGroups.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <Select
                name="gravidade"
                label="Gravidade"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
              >
                <option value="">Todas</option>
                {severityLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              name="periodo"
              label="Período"
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Visão rápida</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alertas no período</p>
                <p className="text-2xl font-semibold text-slate-900">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Urgentes</p>
                <p className="text-2xl font-semibold text-slate-900">{summary.urgent}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria dominante</p>
                <p className="text-sm font-semibold text-slate-900">{summary.topGroup}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Alertas recentes</p>
                <p className="text-sm text-slate-600">Resumo por evento, sem dados sensíveis.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                {filteredAlerts.length ? `${filteredAlerts.length} sinais` : "Sem dados"}
              </span>
            </div>
            {filteredAlerts.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-600">
                <p className="font-semibold text-slate-800">Nenhum alerta no período</p>
                <p className="text-sm">Registre um novo alerta para alimentar o painel regional.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAlerts.slice(0, 6).map((alert) => {
                  const createdAt = alert.timestamp?.toDate();
                  return (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{alert.alertType || "Alerta registrado"}</p>
                        <p className="text-xs text-slate-500">
                          {alert.species || "Espécie não informada"} · {alert.alertGroup || "Sem categoria"}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {alert.city ? `${alert.city} · ` : ""}
                        {alert.state} · {alert.severity}
                        {createdAt ? ` · ${createdAt.toLocaleDateString("pt-BR")}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {viewMode === "cidade" && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Cidades com mais alertas</p>
              {citySummary.length === 0 ? (
                <p className="text-sm text-slate-600">Sem dados suficientes para resumo por cidade.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {citySummary.map(([city, count]) => (
                    <li key={city} className="flex items-center justify-between">
                      <span>{city}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
