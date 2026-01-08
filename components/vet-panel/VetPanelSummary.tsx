import { Card } from "../Card";

export type VetPanelSummaryProps = {
  lines: string[];
  subtitle?: string;
};

export function VetPanelSummary({ lines, subtitle }: VetPanelSummaryProps) {
  const displayLines = lines.length ? lines : ["Sem alertas suficientes para gerar um resumo."];

  return (
    <Card className="space-y-3 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Resumo do painel</p>
        <p className="text-sm text-slate-600">
          {subtitle || "Resumo descritivo, sem diagnósticos ou recomendações clínicas."}
        </p>
      </div>
      <ul className="space-y-2 text-sm text-slate-700">
        {displayLines.slice(0, 3).map((line, index) => (
          <li key={index} className="rounded-lg bg-slate-50 px-3 py-2">
            {line}
          </li>
        ))}
      </ul>
    </Card>
  );
}
