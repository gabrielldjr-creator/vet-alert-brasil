import { AlertCard } from "./AlertCard";
import { AlertRecord } from "./types";

export type VetPanelFeedProps = {
  alerts: AlertRecord[];
};

export function VetPanelFeed({ alerts }: VetPanelFeedProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Feed de alertas</p>
          <p className="text-sm text-slate-600">Lista ordenada do mais recente para o mais antigo.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
          {alerts.length ? `${alerts.length} alertas` : "Sem dados"}
        </span>
      </div>
      {alerts.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-600">
          <p className="font-semibold text-slate-800">Nenhum alerta no período selecionado</p>
          <p className="text-sm">Ajuste os filtros ou registre novos alertas para atualizar o painel.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}
