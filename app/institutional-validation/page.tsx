import { Card } from "../../components/Card";

const stages = [
  { label: "Observação isolada", count: 1, municipalities: 1, note: "1 registro compatível" },
  { label: "Sinal recorrente", count: 2, municipalities: 1, note: "2 registros na janela" },
  { label: "Convergência emergente", count: 3, municipalities: 2, note: "distribuição territorial" },
  { label: "Convergência sustentada", count: 6, municipalities: 3, note: "persistência por 9 dias" },
];

export const metadata = { title: "Validação institucional | SAPSA" };

export default function InstitutionalValidationPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950">
        <p className="font-bold uppercase tracking-wide">Demonstração — dados 100% sintéticos</p>
        <p className="text-sm">Nenhuma métrica abaixo representa uma condição sanitária real.</p>
      </div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">SAPSA • validação institucional</p>
        <h1 className="text-3xl font-semibold text-slate-900">Evolução da convergência territorial</h1>
        <p className="mt-2 text-sm text-slate-600">Inteligência observacional; não é diagnóstico nem notificação sanitária oficial.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        {stages.map((stage, index) => (
          <Card key={stage.label} className="space-y-3 p-5">
            <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">{index + 1}</span>
            <h2 className="font-semibold text-slate-900">{stage.label}</h2>
            <p className="text-3xl font-semibold text-slate-800">{stage.count}</p>
            <p className="text-sm text-slate-600">{stage.municipalities} município(s) • {stage.note}</p>
          </Card>
        ))}
      </section>
      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Por que o sinal sintético recebeu esta classificação?</h2>
        <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li>6 registros compatíveis distribuídos</li><li>3 municípios na mesma região configurada</li>
          <li>Janela de 30 dias; persistência de 9 dias</li><li>2 registros com severidade contextual maior</li>
          <li>Corroboração veterinária + agro-retail</li><li>1 duplicata suspeita excluída (peso zero)</li>
        </ul>
        <p className="text-xs text-slate-500">Metodologia convergence-1.0 • limiares configuráveis e ainda não cientificamente validados.</p>
      </Card>
      <section className="grid gap-4 sm:grid-cols-3">
        {["Cobertura: 3 municípios", "Completude: 94%", "Suspeição: 1 de 7"].map((metric) => <Card key={metric} className="p-5 font-semibold text-slate-800">{metric}</Card>)}
      </section>
    </main>
  );
}
