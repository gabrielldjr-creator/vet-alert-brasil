import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { categoryOptions, sourceOptions, speciesOptions } from "../lib/alerts/schema";

export const metadata = {
  title: "Vet Alert Brasil | Inteligência de alertas veterinários",
  description:
    "Plataforma de sinais veterinários em tempo real. Veterinários registram e acompanham alertas estruturados para reconhecer padrões rapidamente.",
};

const workflow = [
  {
    title: "Registrar sinal",
    detail: "Campos curtos e padronizados para espécie, categoria, fonte suspeita e região.",
  },
  {
    title: "Visualizar padrões",
    detail: "Filtros rápidos por espécie, categoria e origem para entender o que está emergindo na sua área.",
  },
  {
    title: "Preparar clusters",
    detail: "Estrutura pensada para futura detecção de agregações sem expor dados sensíveis.",
  },
];

const highlights = [
  {
    title: "Contexto, não protocolos",
    description: "A plataforma mostra frequência e recorrência. Nenhuma orientação clínica é exibida ou sugerida.",
  },
  {
    title: "Toque rápido em campo",
    description: "Superfícies grandes, alto contraste e textos diretos para uso sob pressão.",
  },
  {
    title: "Dados mínimos",
    description: "Sem identificação de animais ou tutores. Apenas sinais agregados para inteligência coletiva.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900/70 p-8 shadow-xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6 text-slate-50">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 shadow-sm ring-1 ring-white/10">
              Inteligência de alertas veterinários
            </p>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Contexto em tempo real para veterinários em campo
              </h1>
              <p className="max-w-2xl text-lg text-slate-100/90">
                Vet Alert Brasil é uma plataforma de sinais estruturados. Focada em velocidade, clareza e identificação de padrões — sem recomendações clínicas.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/alerta/novo">Registrar alerta</Button>
              <Button href="#painel" variant="secondary" className="bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white">
                Ver painel base
              </Button>
            </div>
            <div className="grid gap-4 text-sm text-slate-100/80 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="flex flex-col gap-2 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="space-y-5 bg-white/95 p-6 shadow-lg backdrop-blur">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Base de criação rápida (UI)
            </div>
            <ul className="space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Estrutura fixa</p>
                  <p className="text-sm">Espécie, categoria do evento, fonte suspeita e região — nada além do necessário.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Sem instruções clínicas</p>
                  <p className="text-sm">O foco é leitura de padrão e frequência. Decisões permanecem com o profissional.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Pronto para clusters</p>
                  <p className="text-sm">Modelagem pensada para agrupar sinais semelhantes e detectar concentrações futuras.</p>
                </div>
              </li>
            </ul>
            <div className="rounded-xl border border-dashed border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-4 text-sm text-slate-700">
              Interface preparada para conexões instáveis: campos curtos, contraste alto e navegação direta.
            </div>
          </Card>
        </div>
      </section>

      <section id="painel" className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Painel de alertas (visual base)</h2>
            <p className="max-w-2xl text-base text-slate-700">
              Layout preparado para listar alertas recentes por espécie, categoria e fonte suspeita. Não há dados carregados nesta versão inicial.
            </p>
          </div>
          <Button href="/alerta/novo" variant="secondary">
            Novo alerta
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
          <Card className="space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Filtros rápidos</p>
              <p className="text-sm text-slate-600">Seletores prontos para uso offline-first. Nenhum filtro ativa busca ainda.</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Espécies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {speciesOptions.map((option) => (
                    <span
                      key={option.value}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categorias</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryOptions.map((option) => (
                    <span
                      key={option.value}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100"
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fontes suspeitas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sourceOptions.map((option) => (
                    <span
                      key={option.value}
                      className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-white ring-1 ring-slate-800"
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-slate-50">
              Estrutura pensada para agrupar sinais no tempo e espaço, sem expor informações pessoais.
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Resultados</p>
                <p className="text-base text-slate-700">Exibição futura de alertas recentes na sua região.</p>
              </div>
              <Button href="/alerta/novo" variant="secondary" className="hidden sm:inline-flex">
                Registrar sinal
              </Button>
            </div>
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-600">
              <p className="font-semibold text-slate-800">Nenhum alerta exibido ainda</p>
              <p className="text-sm">Quando conectado a dados, os alertas aparecerão aqui com agrupamentos em tempo real.</p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Próximo passo: sumarizar frequências por região e detectar aglomerações com base na estrutura acima.
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Estrutura mínima de cada alerta</h2>
          <p className="max-w-3xl text-base text-slate-700">
            Todo alerta é um sinal anônimo com campos curtos. Isso acelera o registro e prepara o terreno para análises de cluster.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {workflow.map((item) => (
            <Card key={item.title} className="space-y-3 p-5">
              <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{item.title}</div>
              <p className="text-base text-slate-700">{item.detail}</p>
            </Card>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-900 px-6 py-5 text-slate-50 shadow-lg">
          <p className="text-lg font-semibold">Sem decisões automáticas.</p>
          <p className="mt-2 text-sm text-slate-100/80">A plataforma oferece contexto e recorrência. A conduta permanece 100% com a equipe veterinária.</p>
        </div>
      </section>
    </div>
  );
}
