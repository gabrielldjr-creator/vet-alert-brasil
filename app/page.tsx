import { Button } from "../components/Button";
import { Card } from "../components/Card";

export const metadata = {
  title: "Vet Alert Brasil | Inteligência epidemiológica regional",
  description:
    "Alertas epidemiológicos anônimos para veterinários. Registre sinais em campo e acompanhe padrões regionais.",
};

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:gap-14 lg:px-10 lg:py-16">
      <section className="space-y-6">
        <p className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
          Vet Alert Brasil
        </p>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Inteligência epidemiológica regional, construída pelo campo.
          </h1>
          <p className="max-w-2xl text-lg text-slate-700">
            Registre sinais observados no consultório ou na fazenda e acompanhe padrões regionais em tempo real. Alertas 100% anônimos
            e sem orientação clínica.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/alerta/novo" className="w-full sm:w-auto px-6 py-3 text-base">
            Registrar alerta
          </Button>
          <Button
            href="/painel"
            variant="secondary"
            className="w-full sm:w-auto px-6 py-3 text-base"
          >
            Ver painel de alertas
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="space-y-3 p-5">
          <p className="text-2xl">📍</p>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Inteligência epidemiológica regional
          </p>
          <p className="text-sm text-slate-700">
            Sinais do campo e do consultório, agregados em tempo real. Sem orientação clínica. Apenas padrão e frequência.
          </p>
        </Card>
        <Card className="space-y-3 p-5">
          <p className="text-2xl">🔒</p>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Alertas 100% anônimos</p>
          <p className="text-sm text-slate-700">
            Nenhum nome, nenhuma propriedade, nenhum endereço. Apenas território, espécie e sinal.
          </p>
        </Card>
        <Card className="space-y-3 p-5">
          <p className="text-2xl">🩺</p>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Para veterinários em atividade</p>
          <p className="text-sm text-slate-700">
            Veja o que está acontecendo na sua região antes de iniciar o dia ou durante os atendimentos.
          </p>
        </Card>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-900 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide">Projeto piloto — Santa Catarina</p>
        <p className="mt-2 text-sm">Uso controlado para validação epidemiológica regional.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="space-y-3 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Como isso ajuda no dia a dia</p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Antecipar surtos e eventos atípicos</li>
            <li>• Ajustar atenção clínica com base no território</li>
            <li>• Evitar decisões isoladas sem contexto regional</li>
            <li>• Criar consciência coletiva do que está acontecendo no campo</li>
          </ul>
        </Card>
        <Card className="space-y-3 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Adicionar à tela inicial</p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Funciona como app no celular</li>
            <li>• Acesso rápido durante o dia</li>
            <li>• Sem login diário</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
