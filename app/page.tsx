import { Button } from "../components/Button";
import { Card } from "../components/Card";

export const metadata = {
  title: "Vet Alert Brasil | Monitoramento clínico regional",
  description:
    "Monitoramento clínico regional com registros anonimizados e agregados por veterinários.",
};

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:gap-12 lg:px-10 lg:py-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          Monitoramento clínico regional — visão compartilhada entre veterinários.
        </h1>
        <p className="max-w-2xl text-base text-slate-700 sm:text-lg">
          Sinais clínicos suspeitos registrados de forma anônima por veterinários da sua região, atualizados em tempo real.
        </p>
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Camada pré-diagnóstica de vigilância clínica agregada.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">O que hoje não é visível</h2>
        <Card className="space-y-3 border-slate-200 p-6">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Casos atendidos de forma isolada não revelam padrões regionais</li>
            <li>• A confirmação diagnóstica ocorre após o impacto inicial</li>
            <li>• Alertas oficiais surgem quando o evento já está estabelecido</li>
            <li>• Entre a suspeita individual e o laudo, há um vazio informacional</li>
          </ul>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Onde o Vet Alert atua</h2>
        <Card className="space-y-3 border-slate-200 p-6">
          <p className="text-sm text-slate-700">
            O Vet Alert Brasil opera exclusivamente no intervalo entre a suspeita clínica individual e a confirmação diagnóstica
            formal.
          </p>
          <p className="text-sm font-semibold text-slate-900">Não substitui certeza. Amplia percepção.</p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Como isso se traduz na prática</h2>
        <Card className="space-y-3 border-slate-200 p-6">
          <p className="text-sm text-slate-700">
            “Antes de iniciar os atendimentos do dia, o veterinário pode verificar se há registros recentes de quadros
            semelhantes em sua região.
          </p>
          <p className="text-sm text-slate-700">Isso não define diagnóstico, mas altera o nível de atenção clínica.”</p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Limites claros de atuação</h2>
        <Card className="space-y-3 border-slate-200 p-6">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Não realiza diagnóstico</li>
            <li>• Não atribui causa</li>
            <li>• Não recomenda conduta</li>
            <li>• Não substitui exames laboratoriais</li>
            <li>• Não atua como notificação oficial</li>
            <li>• Não interfere na autonomia clínica</li>
          </ul>
          <p className="text-sm text-slate-600">O uso do sistema não altera responsabilidades legais existentes.</p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Hierarquia da informação clínica</h2>
        <Card className="space-y-4 border-slate-200 p-6">
          <ol className="space-y-2 text-sm text-slate-700">
            <li>1. Suspeita clínica individual</li>
            <li>2. Vigilância sindrômica clínica agregada (Vet Alert Brasil)</li>
            <li>3. Confirmação diagnóstica e notificação oficial</li>
          </ol>
          <p className="text-sm text-slate-700">Cada camada cumpre uma função distinta e não substitui as demais.</p>
          <p className="text-sm text-slate-600">
            Doenças de notificação obrigatória devem seguir os protocolos oficiais independentemente do uso do Vet Alert
            Brasil.
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Dados e ética</h2>
        <Card className="space-y-3 border-slate-200 p-6">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Registros anonimizados</li>
            <li>• Dados exclusivamente agregados</li>
            <li>• Nenhum dado de tutor coletado</li>
            <li>• Nenhuma decisão automatizada</li>
            <li>• Conformidade com LGPD</li>
          </ul>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Acesso ao piloto</h2>
        <Card className="flex flex-col gap-4 border-slate-200 p-6">
          <p className="text-sm text-slate-700">
            Sistema em fase piloto, com participação voluntária de médicos veterinários.
          </p>
          <div>
            <Button
              href="/acesso"
              variant="secondary"
              className="border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-slate-50"
            >
              Acessar o sistema
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
