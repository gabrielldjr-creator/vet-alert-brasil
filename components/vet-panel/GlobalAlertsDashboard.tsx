"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Card } from "../Card";
import { auth, db } from "../../lib/firebase";
import { stateOptions } from "../../lib/regions";
import { AlertRecord } from "./types";
import { BRANDING } from "../../lib/branding";

type RegionScope = "global" | "country" | "state";
type TimeWindow = "7d" | "30d" | "90d" | "custom";
type SortDirection = "asc" | "desc";
type SortColumn = "region" | "state" | "species" | "alertType" | "riskLevel" | "cases" | "confidence";

type FiltersState = {
  regionScope: RegionScope;
  state: string;
  species: string;
  alertType: string;
  riskLevel: string;
  sourceType: "all" | "veterinary" | "field_retail";
  timeWindow: TimeWindow;
  customStart: string;
  customEnd: string;
};

const defaultFilters: FiltersState = {
  regionScope: "global",
  state: "",
  species: "",
  alertType: "",
  riskLevel: "",
  sourceType: "all",
  timeWindow: "90d",
  customStart: "",
  customEnd: "",
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";
const normalizeState = (value?: string) => value?.trim().toUpperCase() ?? "";
const getAlertDate = (alert: AlertRecord) => alert.createdAt?.toDate?.() ?? alert.timestamp?.toDate?.() ?? null;

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};


type AlertRecordExtended = AlertRecord & { confidenceScore?: number | string; source?: string; signalType?: string };

const getSourceLabel = (source?: string) => {
  if (source === "agro_retail") return "VetAlert • Sinal de Campo";
  return "VetAlert • Sinal Veterinário";
};

const getRecordOriginLabel = (source?: string) => {
  if (source === "agro_retail") return "Coleta VetAlert (campo)";
  if (source === "pilot") return "Coleta VetAlert (clínica)";
  return source || "Origem não informada";
};

function AlertExpandedView({ alert }: { alert: AlertRecord }) {
  const record = alert as AlertRecordExtended;
  const rows: Array<{ label: string; value: string | number }> = [
    { label: "Fonte do sinal", value: getSourceLabel(record.source) },
    { label: "Região", value: alert.regionGroup ?? alert.context?.country ?? "Global" },
    { label: "Estado", value: alert.state ?? "Não informado" },
    { label: "Município", value: alert.city ?? alert.cityName ?? alert.municipality ?? "Não informado" },
    { label: "Espécie", value: alert.species ?? "Não informado" },
    { label: "Tipo de alerta", value: alert.alertType ?? "Não informado" },
    { label: "Grupo de alerta", value: alert.alertGroup ?? "Não informado" },
    { label: "Nível de risco", value: alert.severity ?? "Não informado" },
    { label: "Casos", value: alert.cases ?? "Não informado" },
    { label: "Rebanho", value: alert.herdCount ?? alert.context?.herdCountLabel ?? "Não informado" },
    { label: "Confiança", value: record.confidenceScore ?? "Não informado" },
    { label: "Origem do registro", value: getRecordOriginLabel(record.source) },
    { label: "Prescrição veterinária", value: String((alert.context as { retailSignal?: { veterinaryPrescription?: string } } | undefined)?.retailSignal?.veterinaryPrescription ?? "Não informado") },
    { label: "Produto vendido", value: String((alert.context as { retailSignal?: { productSold?: string } } | undefined)?.retailSignal?.productSold ?? "Não informado") },
    { label: "Categoria do produto", value: String((alert.context as { retailSignal?: { productCategory?: string } } | undefined)?.retailSignal?.productCategory ?? "Não informado") },
    { label: "Duração", value: String((alert.context as { retailSignal?: { durationType?: string; durationDays?: number | null } } | undefined)?.retailSignal?.durationType === "ongoing" ? `${(alert.context as { retailSignal?: { durationDays?: number | null } } | undefined)?.retailSignal?.durationDays ?? "-"} dia(s)` : (alert.context as { retailSignal?: { durationType?: string } } | undefined)?.retailSignal?.durationType === "recent" ? "Recente" : "Não informado") },
  ];

  const tags = alert.context?.alertDetails ?? [];

  return (
    <div className="space-y-3">
      <dl className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded border border-slate-200 bg-white px-3 py-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
            <dd className="text-sm text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded border border-slate-200 bg-white px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Classificações / tags</p>
        <p className="text-sm text-slate-800">{tags.length ? tags.join(" • ") : "Não informado"}</p>
      </div>
      <div className="rounded border border-slate-200 bg-white px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Observações</p>
        <p className="text-sm text-slate-800">{alert.context?.notes?.trim() ? alert.context.notes : "Não informado"}</p>
      </div>
    </div>
  );
}

function DistributionBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(2, width)}%` }} />
    </div>
  );
}

export function GlobalAlertsDashboard() {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortBy, setSortBy] = useState<SortColumn>("region");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
          return;
        }

        const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
        unsubscribeSnapshot?.();
        unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            setAlerts(
              snapshot.docs.map((docSnap) => ({
                ...(docSnap.data() as AlertRecord),
                id: docSnap.id,
              }))
            );
            setLoadState("ready");
          },
          () => {
            setAlerts([]);
            setLoadState("error");
          }
        );
      } catch {
        setAlerts([]);
        setLoadState("error");
      }
    });

    return () => {
      unsubscribeSnapshot?.();
      unsubscribeAuth();
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    if (filters.timeWindow === "7d") cutoff.setDate(cutoff.getDate() - 7);
    if (filters.timeWindow === "30d") cutoff.setDate(cutoff.getDate() - 30);
    if (filters.timeWindow === "90d") cutoff.setDate(cutoff.getDate() - 90);

    const start = filters.customStart ? new Date(`${filters.customStart}T00:00:00`) : null;
    const end = filters.customEnd ? new Date(`${filters.customEnd}T23:59:59`) : null;

    return alerts.filter((alert) => {
      const date = getAlertDate(alert);
      if (["7d", "30d", "90d"].includes(filters.timeWindow) && date && date < cutoff) return false;
      if (filters.timeWindow === "custom") {
        if (start && date && date < start) return false;
        if (end && date && date > end) return false;
      }

      if (filters.regionScope === "country") {
        if (normalize(alert.context?.country || "brasil") !== "brasil") return false;
      }

      if (filters.state && normalizeState(alert.state) !== normalizeState(filters.state)) return false;
      if (filters.species && normalize(alert.species) !== normalize(filters.species)) return false;
      if (filters.alertType && normalize(alert.alertType) !== normalize(filters.alertType)) return false;
      if (filters.riskLevel && normalize(alert.severity) !== normalize(filters.riskLevel)) return false;
      if (filters.sourceType === "field_retail" && (alert as AlertRecord & { source?: string }).source !== "agro_retail") return false;
      if (filters.sourceType === "veterinary" && (alert as AlertRecord & { source?: string }).source === "agro_retail") return false;
      return true;
    });
  }, [alerts, filters]);

  const speciesOptions = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.species).filter(Boolean) as string[])).sort(),
    [alerts]
  );
  const alertTypeOptions = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.alertType).filter(Boolean) as string[])).sort(),
    [alerts]
  );
  const riskOptions = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.severity).filter(Boolean) as string[])).sort(),
    [alerts]
  );

  const sortableAlerts = useMemo(() => {
    const rows = [...filteredAlerts];
    const modifier = sortDirection === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      const extract = (alert: AlertRecord) => {
        const record = alert as AlertRecord & { confidenceScore?: number | string; source?: string };
        switch (sortBy) {
          case "region":
            return alert.regionGroup ?? "";
          case "state":
            return alert.state ?? "";
          case "species":
            return alert.species ?? "";
          case "alertType":
            return alert.alertType ?? "";
          case "riskLevel":
            return alert.severity ?? "";
          case "cases":
            return alert.cases ?? 0;
          case "confidence":
            return toNumber(record.confidenceScore) ?? -1;
        }
      };

      const left = extract(a);
      const right = extract(b);
      if (typeof left === "number" && typeof right === "number") return (left - right) * modifier;
      return String(left).localeCompare(String(right), "pt-BR") * modifier;
    });

    return rows;
  }, [filteredAlerts, sortBy, sortDirection]);

  const analytics = useMemo(() => {
    const countBy = (key: (a: AlertRecord) => string) => {
      const result = new Map<string, number>();
      filteredAlerts.forEach((alert) => {
        const value = key(alert) || "Não informado";
        result.set(value, (result.get(value) ?? 0) + 1);
      });
      return Array.from(result.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    };

    const countByList = (extractor: (a: AlertRecord) => string[]) => {
      const result = new Map<string, number>();
      filteredAlerts.forEach((alert) => {
        extractor(alert)
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((item) => {
            result.set(item, (result.get(item) ?? 0) + 1);
          });
      });
      return Array.from(result.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    };

    const totalCases = filteredAlerts.reduce((sum, alert) => sum + (alert.cases ?? 0), 0);

    return {
      totals: {
        registros: filteredAlerts.length,
        estados: new Set(filteredAlerts.map((a) => a.state).filter(Boolean)).size,
        especies: new Set(filteredAlerts.map((a) => a.species).filter(Boolean)).size,
        tipos: new Set(filteredAlerts.map((a) => a.alertType).filter(Boolean)).size,
        casos: totalCases,
      },
      byRegion: countBy((a) => a.regionGroup ?? a.context?.country ?? "Global"),
      bySpecies: countBy((a) => a.species ?? "Não informado"),
      byAlertType: countBy((a) => a.alertType ?? "Não informado"),
      byRisk: countBy((a) => a.severity ?? "Não informado"),
      byState: countBy((a) => a.state ?? "Não informado"),
      byMunicipality: countBy((a) => a.city ?? a.cityName ?? a.municipality ?? "Não informado"),
      byAlertGroup: countBy((a) => a.alertGroup ?? "Não informado"),
      byHerd: countBy((a) => a.herdCount ?? a.context?.herdCountLabel ?? "Não informado"),
      byDetailTags: countByList((a) => a.context?.alertDetails ?? []),
      byExternalFactors: countByList((a) => a.arrival_context?.external_factors ?? []),
      byFeedType: countByList((a) => {
        const value = a.context?.feed?.feedType;
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
      }),
      byDrugCategory: countByList((a) => {
        const value = a.context?.pharma?.drugCategory;
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
      }),
      byEnvironmentSignals: countByList((a) => a.context?.environment?.environmentSignals ?? []),
    };
  }, [filteredAlerts]);

  const toggleSort = (column: SortColumn) => {
    if (column === sortBy) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const miniPanels = [
    { title: "Alertas por região", items: analytics.byRegion },
    { title: "Alertas por espécie", items: analytics.bySpecies },
    { title: "Alertas por tipo", items: analytics.byAlertType },
    { title: "Alertas por risco", items: analytics.byRisk },
    { title: "Alertas por município", items: analytics.byMunicipality },
    { title: "Alertas por grupo", items: analytics.byAlertGroup },
    { title: "Alertas por rebanho", items: analytics.byHerd },
    { title: "Tags de classificação", items: analytics.byDetailTags },
    { title: "Fatores externos", items: analytics.byExternalFactors },
    { title: "Tipo de alimentação", items: analytics.byFeedType },
    { title: "Categoria farmacológica", items: analytics.byDrugCategory },
    { title: "Sinais ambientais", items: analytics.byEnvironmentSignals },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{BRANDING.intelligence.productLong} • Painel de Inteligência</h1>
        <p className="text-base text-slate-600">Camada analítica SAPSA com leitura agregada dos sinais coletados no VetAlert.</p>
      </header>

      <Card className="border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Contexto de leitura</p>
        <p className="mt-1 text-sm text-slate-700">
          Este painel é de inteligência (SAPSA): utiliza apenas dados já registrados no VetAlert, sem alterar registros de
          entrada, sem reclassificar persistência e sem afetar fluxos de captação.
        </p>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[{ label: "Registros analisados", value: analytics.totals.registros }, { label: "Estados cobertos", value: analytics.totals.estados }, { label: "Espécies monitoradas", value: analytics.totals.especies }, { label: "Tipos de sinal", value: analytics.totals.tipos }, { label: "Casos informados", value: analytics.totals.casos }].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.value}</p>
          </Card>
        ))}
      </section>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">Filtros de inteligência</p>
          <p className="text-xs text-slate-500">Seleção analítica sem impacto na coleta VetAlert.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-700">
            <span>Região</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.regionScope} onChange={(e) => setFilters((p) => ({ ...p, regionScope: e.target.value as RegionScope }))}>
              <option value="global">Global</option>
              <option value="country">País (Brasil)</option>
              <option value="state">Estado</option>
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Estado</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.state} onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))}>
              <option value="">Todos</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Espécie</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.species} onChange={(e) => setFilters((p) => ({ ...p, species: e.target.value }))}>
              <option value="">Todas</option>
              {speciesOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Tipo de alerta</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.alertType} onChange={(e) => setFilters((p) => ({ ...p, alertType: e.target.value }))}>
              <option value="">Todos</option>
              {alertTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Nível de risco</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.riskLevel} onChange={(e) => setFilters((p) => ({ ...p, riskLevel: e.target.value }))}>
              <option value="">Todos</option>
              {riskOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Canal de coleta (VetAlert)</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.sourceType} onChange={(e) => setFilters((p) => ({ ...p, sourceType: e.target.value as "all" | "veterinary" | "field_retail" }))}>
              <option value="all">Todas</option>
              <option value="veterinary">VetAlert • Sinal Veterinário</option>
              <option value="field_retail">VetAlert • Sinal de Campo</option>
            </select>
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>Janela de tempo</span>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.timeWindow} onChange={(e) => setFilters((p) => ({ ...p, timeWindow: e.target.value as TimeWindow }))}>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="custom">Período personalizado</option>
            </select>
          </label>
        </div>

        {filters.timeWindow === "custom" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Data inicial</span>
              <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.customStart} onChange={(e) => setFilters((p) => ({ ...p, customStart: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Data final</span>
              <input type="date" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={filters.customEnd} onChange={(e) => setFilters((p) => ({ ...p, customEnd: e.target.value }))} />
            </label>
          </div>
        )}
      </Card>

      <section className="grid gap-4 lg:grid-cols-4">
        {miniPanels.map((panel) => {
          const items = panel.items.slice(0, 5);
          const max = Math.max(...items.map((i) => i.value), 0);
          return (
            <Card key={panel.title} className="space-y-3 p-4">
              <p className="text-sm font-semibold text-slate-900">{panel.title}</p>
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">Sem dados no período selecionado.</p>
              ) : (
                items.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="truncate pr-2">{item.label}</span>
                      <span>{item.value} ({sortableAlerts.length ? Math.round((item.value / sortableAlerts.length) * 100) : 0}%)</span>
                    </div>
                    <DistributionBar value={item.value} max={max} />
                  </div>
                ))
              )}
            </Card>
          );
        })}
      </section>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-700">Registros elegíveis no período selecionado: {sortableAlerts.length}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setViewMode("table")} className={`rounded-lg border px-3 py-1.5 text-sm ${viewMode === "table" ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}>
              Tabela analítica
            </button>
            <button type="button" onClick={() => setViewMode("cards")} className={`rounded-lg border px-3 py-1.5 text-sm ${viewMode === "cards" ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}>
              Cards executivos
            </button>
          </div>
        </div>

        {loadState === "loading" && <p className="text-sm text-slate-600">Carregando dados...</p>}
        {loadState === "error" && <p className="text-sm text-red-700">Erro ao carregar dados.</p>}
        {loadState === "ready" && sortableAlerts.length === 0 && (
          <p className="text-sm text-slate-600">Nenhum alerta encontrado para os filtros selecionados.</p>
        )}

        {loadState === "ready" && sortableAlerts.length > 0 && viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  {[
                    ["region", "Região / País"] as const,
                    ["state", "Estado / Localização"] as const,
                    ["species", "Espécie"] as const,
                    ["alertType", "Tipo de alerta"] as const,
                    ["riskLevel", "Nível de risco"] as const,
                    ["cases", "Contagens / Métricas"] as const,
                    ["confidence", "Confiança / Fonte"] as const,
                  ].map(([key, label]) => (
                    <th key={key} className="px-3 py-2">
                      <button type="button" className="font-semibold" onClick={() => toggleSort(key)}>
                        {label}
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold">Classificações / Tags</th>
                  <th className="px-3 py-2 font-semibold">Detalhamento</th>
                </tr>
              </thead>
              <tbody>
                {sortableAlerts.map((alert) => {
                  const record = alert as AlertRecord & { confidenceScore?: number | string; source?: string };
                  const tags = alert.context?.alertDetails ?? [];
                  return (
                    <tr
                      key={alert.id}
                      className="cursor-pointer border-b border-slate-100 align-top text-slate-700 transition hover:bg-emerald-50/40"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <td className="px-3 py-2">{alert.regionGroup ?? alert.context?.country ?? "Global"}</td>
                      <td className="px-3 py-2">
                        <p>{alert.state ?? "-"}</p>
                        <p className="text-xs text-slate-500">{alert.city ?? alert.cityName ?? alert.municipality ?? alert.localidadeAproximada ?? "-"}</p>
                      </td>
                      <td className="px-3 py-2">{alert.species ?? "-"}</td>
                      <td className="px-3 py-2">{alert.alertType ?? "-"}</td>
                      <td className="px-3 py-2">{alert.severity ?? "-"}</td>
                      <td className="px-3 py-2">
                        <p>Casos: {alert.cases ?? "-"}</p>
                        <p className="text-xs text-slate-500">Rebanho: {alert.herdCount ?? alert.context?.herdCountLabel ?? "-"}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p>Confiança: {record.confidenceScore ?? "-"}</p>
                        <p className="text-xs text-slate-500">Fonte: {record.source ?? "-"}</p>
                      </td>
                      <td className="px-3 py-2">{tags.length ? tags.join(" • ") : "-"}</td>
                      <td className="px-3 py-2">
                        <details onClick={(e) => e.stopPropagation()}>
                          <summary className="cursor-pointer text-xs text-emerald-700">Ver detalhes</summary>
                          <div className="mt-2"><AlertExpandedView alert={alert} /></div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {loadState === "ready" && sortableAlerts.length > 0 && viewMode === "cards" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortableAlerts.map((alert) => {
              const record = alert as AlertRecord & { confidenceScore?: number | string; source?: string };
              return (
                <Card
                  key={alert.id}
                  className="space-y-2 border-slate-200 p-4 transition hover:border-emerald-200"
                >
                  <p className="text-sm font-semibold text-slate-900">{alert.alertType ?? "-"}</p>
                  <p className="text-sm text-slate-700">{alert.species ?? "-"}</p>
                  <p className="text-xs text-slate-600">Região: {alert.regionGroup ?? alert.context?.country ?? "Global"}</p>
                  <p className="text-xs text-slate-600">Estado: {alert.state ?? "-"}</p>
                  <p className="text-xs text-slate-600">Localização: {alert.city ?? alert.cityName ?? alert.municipality ?? "-"}</p>
                  <p className="text-xs text-slate-600">Nível de risco: {alert.severity ?? "-"}</p>
                  <p className="text-xs text-slate-600">Contagens: {alert.cases ?? "-"}</p>
                  <p className="text-xs text-slate-600">Confiança: {record.confidenceScore ?? "-"}</p>
                  <p className="text-xs text-slate-600">Fonte: {record.source ?? "-"}</p>
                  <p className="text-xs text-slate-600">Tags: {(alert.context?.alertDetails ?? []).join(" • ") || "-"}</p>
                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-emerald-700"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    Abrir drill-down completo
                  </button>
                  <details onClick={(e) => e.stopPropagation()}>
                    <summary className="cursor-pointer text-xs text-emerald-700">Ver detalhes</summary>
                    <div className="mt-2"><AlertExpandedView alert={alert} /></div>
                  </details>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Densidade geográfica SAPSA (contagem por estado)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {analytics.byState.map((entry) => (
            <div key={entry.label} className="rounded-lg border border-slate-200 p-2 text-xs text-slate-700">
              <p className="font-semibold">{entry.label}</p>
              <p>{entry.value}</p>
            </div>
          ))}
        </div>
      </Card>
      {selectedAlert && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setSelectedAlert(null)}>
          <div onClick={(e) => e.stopPropagation()}><Card className="max-h-[85vh] w-full max-w-4xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Detalhamento do registro</p>
              <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={() => setSelectedAlert(null)}>Fechar</button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-4">
              <AlertExpandedView alert={selectedAlert} />
            </div>
          </Card></div>
        </div>
      )}

    </div>
  );
}
