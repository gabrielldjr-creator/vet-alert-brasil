import { Button } from "../components/Button";
import { Card } from "../components/Card";

export const metadata = {
  title: "Vet Alert Brasil | Alertas veterinários rápidos",
  description:
    "Alertas veterinários rápidos quando cada minuto importa. Interface simples para tutores relatarem casos e receberem apoio.",
};

const steps = [
  {
    title: "Relate o que aconteceu",
    detail: "Em poucas frases, descreva sintomas e quando começaram.",
  },
  {
    title: "Informe onde você está",
    detail: "Bairro ou cidade ajudam a priorizar retornos próximos.",
  },
  {
    title: "Envie com confiança",
    detail: "Sem dados sensíveis nesta fase. Foco na clareza para agilizar ajuda.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/70 p-8 shadow-xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6 text-slate-50">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 shadow-sm ring-1 ring-white/10">
              Respostas rápidas para emergências veterinárias
            </p>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Alertas veterinários rápidos quando cada minuto importa
              </h1>
              <p className="max-w-2xl text-lg text-slate-100/90">
                Interface simples para tutores compartilharem um alerta claro, mesmo com conexão instável, e receberem orientação de profissionais próximos.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/alerta/novo">Criar alerta veterinário</Button>
              <Button href="#como-funciona" variant="secondary" className="bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white">
                Como funciona
              </Button>
            </div>
            <div className="grid gap-4 text-sm text-slate-100/80 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-900">1</span>
                <div>
                  <p className="font-semibold text-white">Fluxo guiado</p>
                  <p>Campos diretos para não perder tempo decidindo o que escrever.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-900">2</span>
                <div>
                  <p className="font-semibold text-white">Pensado para celular</p>
                  <p>Layout estável, botões grandes e foco em legibilidade.</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="space-y-5 bg-white/95 p-6 shadow-lg backdrop-blur">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Compartilhe o essencial sem ruído.
            </div>
            <ul className="space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Sintomas e urgência</p>
                  <p className="text-sm">Descreva sinais observados, duração e se houve ingestão de algo incomum.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Localização aproximada</p>
                  <p className="text-sm">Bairro e cidade ajudam a direcionar o retorno mais rápido.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Contato seguro</p>
                  <p className="text-sm">Nenhum dado sensível nesta fase. Foco em clareza e segurança.</p>
                </div>
              </li>
            </ul>
            <div className="rounded-xl border border-dashed border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-4 text-sm text-slate-700">
              Construído com mentalidade offline-first: campos curtos, contraste alto e navegação simples para conexões instáveis.
            </div>
          </Card>
        </div>
      </section>

      <section id="como-funciona" className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Como funciona</h2>
            <p className="max-w-2xl text-base text-slate-700">
              Passos curtos para criar um alerta que ajude veterinários a compreender a situação rapidamente.
            </p>
          </div>
          <Button href="/alerta/novo" variant="secondary">
            Criar alerta agora
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="space-y-3 p-5">
              <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{step.title}</div>
              <p className="text-base text-slate-700">{step.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="space-y-4 p-6">
          <h3 className="text-xl font-semibold text-slate-900">Para tutores</h3>
          <p className="text-base text-slate-700">
            Formulário enxuto para relatar o que está acontecendo sem termos técnicos obrigatórios.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Orientações claras sobre o que informar.</li>
            <li>Sem coleta de dados sensíveis nesta etapa.</li>
            <li>Botões e textos grandes para uso em movimento.</li>
          </ul>
        </Card>
        <Card className="space-y-4 p-6">
          <h3 className="text-xl font-semibold text-slate-900">Para veterinários</h3>
          <p className="text-base text-slate-700">
            Alertas padronizados para facilitar a triagem e retorno com foco em responsabilidade.
          </p>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Em breve: filtros por localização e tipo de ocorrência para organizar sua disponibilidade.
          </div>
          <Button href="/sobre" variant="secondary" className="w-full sm:w-auto">
            Conhecer a missão
          </Button>
        </Card>
      </section>
    </div>
  );
}
