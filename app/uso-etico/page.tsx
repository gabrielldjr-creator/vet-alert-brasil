import Link from "next/link";
import { Card } from "../../components/Card";

export const metadata = {
  title: "Uso Ético | VetAlert + SAPSA",
  description:
    "Documento institucional sobre uso ético dos sinais observacionais nas camadas VetAlert e SAPSA.",
};

export default function UsoEticoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">Uso Ético dos Sinais Regionais (VetAlert + SAPSA)</h1>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Documento institucional de uso de dados sanitários observacionais
        </p>
        <p className="max-w-3xl text-base text-slate-700">
          Esta página apresenta os princípios de uso da infraestrutura de sinais VetAlert + SAPSA, com linguagem
          institucional, neutra e orientada à integridade informacional.
        </p>
      </header>

      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">1. Natureza do sistema</h2>
          <p className="text-sm text-slate-700">
            O Vet Alert Brasil opera como uma camada de infraestrutura de dados sanitários observacionais. O sistema integra,
            organiza e disponibiliza sinais regionais de forma estruturada para leitura situacional.
          </p>
          <p className="text-sm text-slate-700">
            A arquitetura atual contempla duas camadas complementares de captação: sinais veterinários (clínicos) e sinais de
            campo (comerciais de varejo agropecuário).
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">2. O que os sinais representam</h2>
          <p className="text-sm text-slate-700">
            Os sinais representam registros descritivos de observação em campo. Seu valor está na consolidação de contexto por
            região, espécie e classificação, sem caráter confirmatório.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>São dados observacionais e agregados.</li>
            <li>Descrevem recorrências e distribuição de registros.</li>
            <li>Permitem leitura de contexto sanitário em múltiplas fontes.</li>
          </ul>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">3. Uso responsável da informação</h2>
          <p className="text-sm text-slate-700">
            O uso responsável exige interpretação criteriosa por profissionais e instituições, com base em protocolos próprios,
            evidências complementares e contexto local.
          </p>
          <p className="text-sm text-slate-700">
            O sistema oferece uma base descritiva para monitoramento situacional, mantendo neutralidade analítica e transparência
            sobre origem dos sinais.
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">4. Limites do sistema</h2>
          <p className="text-sm text-slate-700">
            O Vet Alert Brasil não executa diagnóstico, não confirma ocorrência sanitária e não automatiza decisão de conduta.
            As informações publicadas mantêm escopo observacional e estatístico.
          </p>
          <p className="text-sm text-slate-700">
            A plataforma não substitui investigação técnica, notificação oficial obrigatória ou fluxos institucionais previstos
            em norma.
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">5. Comunicação responsável</h2>
          <p className="text-sm text-slate-700">
            A comunicação derivada dos sinais deve preservar precisão terminológica, sobriedade e ausência de alarmismo. A
            linguagem recomendada é informativa, contextual e proporcional ao dado disponível.
          </p>
          <p className="text-sm text-slate-700">
            Mensagens públicas ou privadas devem distinguir claramente registro observacional de confirmação técnica.
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">6. Papel da prevenção</h2>
          <p className="text-sm text-slate-700">
            A prevenção, neste contexto, corresponde à preparação informada e contínua. Sinais regionais apoiam vigilância
            situacional, planejamento operacional e priorização de acompanhamento técnico em campo.
          </p>
          <p className="text-sm text-slate-700">
            O objetivo é ampliar a capacidade de leitura antecipada do ambiente sanitário, sem antecipar conclusões.
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">7. Responsabilidade institucional</h2>
          <p className="text-sm text-slate-700">
            A governança do sistema está orientada por neutralidade, rastreabilidade, proteção de dados e uso ético da
            informação. Cada instituição usuária permanece responsável por suas decisões e por conformidade regulatória.
          </p>
          <p className="text-sm text-slate-700">
            O Vet Alert Brasil atua como infraestrutura de dados para leitura situacional multiorigem, mantendo posição técnica,
            não interpretativa e institucional.
          </p>
        </Card>
      </div>

      <Card className="space-y-5 p-6">
        <p className="text-sm text-slate-700">
          O Vet Alert Brasil consolida sinais regionais de múltiplas camadas para ampliar visibilidade sanitária com precisão,
          neutralidade e responsabilidade.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/alerta/novo"
            className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <span>Registrar Sinal Veterinário</span>
            <span className="text-xs font-medium text-emerald-600">Camada clínica</span>
          </Link>
          <Link
            href="/global-alerts-dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Ver Inteligência de Alertas de sinais regionais
          </Link>
        </div>
      </Card>
    </div>
  );
}
