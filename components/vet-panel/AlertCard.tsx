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
  const casesLabel = alert.herdCount ? `${alert.herdCount} casos` : "Casos não informados";

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
