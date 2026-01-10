import { AlertRecord } from "./types";

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

const formatRelativeTime = (date?: Date) => {
  if (!date) return "agora";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
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
  const signalLabel = alert.alertType || alert.alertGroup || "Sinal relatado";
  const speciesLabel = alert.species || "Espécie não informada";
  const stateLabel = alert.state || "UF";
  const regionLabel = alert.regionIBGE || alert.regionGroup;
  const municipalityLabel = alert.municipality || alert.cityName || alert.city;
  const localidadeLabel = alert.localidadeAproximada;
  const herdCountLabel = alert.context?.herdCountLabel ?? alert.herdCount;
  const casesLabel = alert.cases ? `${alert.cases} casos` : herdCountLabel ? `${herdCountLabel} casos` : "Casos não informados";
  const detailsLabel = alert.context?.alertDetails?.length ? alert.context.alertDetails.join(", ") : null;
  const environmentSignalsLabel = alert.context?.environment?.environmentSignals?.length
    ? alert.context.environment.environmentSignals.join(", ")
    : null;

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${severityStyle}`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide">
        <span>{formatRelativeTime(createdAt)}</span>
        <span>{stateLabel}</span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{speciesLabel}</p>
        <p className="text-sm text-slate-700">{signalLabel}</p>
        {alert.alertGroup && alert.alertType && (
          <p className="text-xs text-slate-500">{alert.alertGroup}</p>
        )}
        {(regionLabel || municipalityLabel) && (
          <p className="text-xs text-slate-500">
            {[stateLabel, regionLabel, municipalityLabel].filter(Boolean).join(" • ")}
            {localidadeLabel ? ` — ${localidadeLabel}` : ""}
          </p>
        )}
      </div>
      <div className="mt-3 space-y-2 text-xs text-slate-700">
        {detailsLabel && (
          <p>
            <span className="font-semibold text-slate-800">Detalhes rápidos:</span> {detailsLabel}
          </p>
        )}
        {alert.context?.eventOnset && (
          <p>
            <span className="font-semibold text-slate-800">Início observado:</span> {alert.context.eventOnset}
          </p>
        )}
        {alert.context?.recentChanges && (
          <p>
            <span className="font-semibold text-slate-800">Mudanças recentes:</span> {alert.context.recentChanges}
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
              {alert.context?.environment?.regionalPattern && (
                <li>• Padrão regional: {alert.context.environment.regionalPattern}</li>
              )}
            </ul>
          </div>
        )}
        {alert.context?.notes && (
          <p>
            <span className="font-semibold text-slate-800">Observações:</span> {alert.context.notes}
          </p>
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
