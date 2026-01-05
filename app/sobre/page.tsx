import { Card } from "../../components/Card";

export const metadata = {
  title: "Sobre | Vet Alert Brasil",
  description:
    "Entenda a missão do Vet Alert Brasil: inteligência de alertas veterinários focada em contexto e padrões, sem recomendações clínicas.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Nossa missão</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Vet Alert Brasil é uma plataforma de inteligência para veterinários compartilharem sinais críticos com rapidez. Focamos em estrutura, recorrência e contexto — nunca em orientar condutas clínicas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Valores</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Contexto acima de prescrição: sem protocolos, apenas sinais.</li>
            <li>Minimização de dados: nenhum identificador de animais ou tutores.</li>
            <li>Velocidade sob pressão: interações curtas e foco na legibilidade.</li>
          </ul>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Próximos passos</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Habilitar filtros geográficos e temporais para leituras rápidas.</li>
            <li>Implementar detecção de agrupamentos e frequências por categoria.</li>
            <li>Disponibilizar histórico resumido para apoiar vigilância contínua.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
