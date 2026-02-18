import { AlertRecord } from "./types";
import { mapAlertGroupLabel, mapAlertTypeLabel } from "./alertLabeling";

const severityStyles: Record<string, string> = {
  Urgente: "border-amber-400 bg-amber-50 text-amber-900",
  Preocupante: "border-amber-200 bg-amber-50/60 text-amber-900",
  Atenção: "border-slate-200 bg-white text-slate-800",
};

const severityPillStyles: Record<string, string> = {
  Urgente: "bg-amber-200 text-amber-900",
  Preocupante: "bg-amber-100 text-amber-900",
  Atenção: "bg-slate-100 text-slate-700",
};

const formatDisplayDate = (date?: Date) => {
  if (!date) return "Período selecionado";
  return date.toLocaleDateString("pt-BR");
};

const getAlertTimestamp = (alert: AlertRecord) => {
  return alert.createdAt?.toDate?.() ?? alert.timestamp?.toDate?.();
};

export type AlertCardProps = {
  alert: AlertRecord;
};

export function AlertCard({ alert }: AlertCardProps) {
  const createdAt = getAlertTimestamp(alert);
  const severityStyle = severityStyles[alert.severity ?? ""] ?? severityStyles["Atenção"];
  const pillStyle = severityPillStyles[alert.severity ?? ""] ?? severityPillStyles["Atenção"];
  const signalLabel =
    mapAlertTypeLabel(alert.alertType) || mapAlertGroupLabel(alert.alertGroup) || "Sinal relatado";
  const speciesLabel = alert.species || "Espécie não informada";
  const stateLabel = alert.state || "UF";
  const regionLabel = alert.regionIBGE || alert.regionGroup;
  const herdCountLabel = alert.context?.herdCountLabel ?? alert.herdCount;
  const casesLabel = alert.cases ? `${alert.cases} casos` : herdCountLabel ? `${herdCountLabel} casos` : "Casos não informados";
  const detailsLabel = alert.context?.alertDetails?.length ? alert.context.alertDetails.join(", ") : null;
  const parasiteObservation = alert.context?.parasiteObservation?.trim() || null;
  const environmentSignalsLabel = alert.context?.environment?.environmentSignals?.length
    ? alert.context.environment.environmentSignals.join(", ")
    : null;

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${severityStyle}`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide">
        <span>{formatDisplayDate(createdAt)}</span>
        <span>{stateLabel}</span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{speciesLabel}</p>
        <p className="text-sm text-slate-700">{signalLabel}</p>
        {alert.alertGroup && alert.alertType && (
          <p className="text-xs text-slate-500">{mapAlertGroupLabel(alert.alertGroup)}</p>
        )}
        {regionLabel && (
          <p className="text-xs text-slate-500">{[stateLabel, regionLabel].filter(Boolean).join(" • ")}</p>
        )}
      </div>
      <div className="mt-3 space-y-2 text-xs text-slate-700">
        {detailsLabel && (
          <p>
            <span className="font-semibold text-slate-800">Detalhes rápidos:</span> {detailsLabel}
          </p>
        )}
        {(parasiteObservation || alert.context?.eventOnset || alert.context?.recentChanges || alert.context?.notes) && (
          <p>
            <span className="font-semibold text-slate-800">Observação clínica registrada (não exibida publicamente)</span>
          </p>
        )}
        {(alert.context?.feed?.feedChange || alert.context?.feed?.feedType || alert.context?.feed?.feedOrigin) && (
          <div>
            <p className="font-semibold text-slate-800">Alimentação</p>
            <ul className="mt-1 space-y-1">
              {alert.context.feed?.feedChange && <li>• Mudança: {alert.context.feed.feedChange}</li>}
              {alert.context.feed?.feedType && <li>• Tipo: {alert.context.feed.feedType}</li>}
              {alert.context.feed?.feedOrigin && <li>• Origem: {alert.context.feed.feedOrigin}</li>}
            </ul>
          </div>
        )}
        {(alert.context?.pharma?.drugExposure ||
          alert.context?.pharma?.drugCategory ||
          alert.context?.pharma?.drugInterval) && (
          <div>
            <p className="font-semibold text-slate-800">Medicamentos / vacinas</p>
            <ul className="mt-1 space-y-1">
              {alert.context.pharma?.drugExposure && <li>• Exposição: {alert.context.pharma.drugExposure}</li>}
              {alert.context.pharma?.drugCategory && <li>• Categoria: {alert.context.pharma.drugCategory}</li>}
              {alert.context.pharma?.drugInterval && <li>• Intervalo: {alert.context.pharma.drugInterval}</li>}
            </ul>
          </div>
        )}
        {(environmentSignalsLabel || alert.context?.environment?.regionalPattern) && (
          <div>
            <p className="font-semibold text-slate-800">Ambiente</p>
            <ul className="mt-1 space-y-1">
              {environmentSignalsLabel && <li>• Sinais: {environmentSignalsLabel}</li>}
              {alert.context?.environment?.regionalPattern && <li>• Observação clínica registrada (não exibida publicamente)</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className={`rounded-full px-3 py-1 font-semibold ${pillStyle}`}>
          {alert.severity || "Atenção"}
        </span>
        <span className="font-medium text-slate-700">{casesLabel}</span>
      </div>
    </div>
  );
}
