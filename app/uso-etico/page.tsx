import Link from "next/link";
import { Card } from "../../components/Card";

export const metadata = {
  title: "Uso Ético dos Sinais Regionais do VetAlert | Vet Alert Brasil",
  description:
    "Consciência clínica regional para prevenção responsável, com linguagem ética e não alarmista sobre sinais regionais.",
};

export default function UsoEticoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">Uso Ético dos Sinais Regionais do VetAlert</h1>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Consciência clínica regional para prevenção responsável
        </p>
        <p className="max-w-3xl text-base text-slate-700">
          Esta página é aberta e informativa para médicos-veterinários. O conteúdo abaixo descreve limites e usos éticos de
          sinais agregados, com linguagem técnica, calma e objetiva.
        </p>
      </header>

      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">1. O que o VetAlert é — e o que não é</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>O VetAlert é um painel de sinais regionais agregados, descritivos e observacionais.</li>
            <li>O VetAlert oferece consciência clínica regional, não conclusões.</li>
            <li>O VetAlert não é uma sirene.</li>
            <li>O VetAlert não é um sistema de alarme.</li>
            <li>O VetAlert não realiza diagnósticos.</li>
            <li>O VetAlert não confirma concentrações de ocorrências.</li>
          </ul>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">2. O que os sinais regionais representam</h2>
          <p className="text-sm text-slate-700">
            Os sinais regionais descrevem padrões observacionais que ajudam a compor um cenário clínico regional. Eles indicam:
          </p>
          <p className="text-sm text-slate-700">
            Os sinais funcionam como um pulso clínico regional, não como confirmação de eventos.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>repetição de quadros em uma mesma região;</li>
            <li>recorrência temporal de sinais semelhantes;</li>
            <li>pressão clínica regional percebida por profissionais;</li>
            <li>contexto situacional descritivo, sem confirmação de eventos.</li>
          </ul>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            3. Como o médico-veterinário pode usar essa informação de forma ética
          </h2>
          <p className="text-sm text-slate-700">
            Os sinais regionais podem apoiar a contextualização clínica, sempre com responsabilidade e sem extrapolações. Eles
            ajudam a:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>contextualizar conversas com proprietários;</li>
            <li>reforçar a consciência preventiva em períodos específicos;</li>
            <li>antecipar ações responsáveis de manejo e observação.</li>
          </ul>
          <p className="text-sm text-slate-700">
            O julgamento clínico individual é soberano. O VetAlert não substitui avaliação clínica nem orienta decisões
            diagnósticas.
          </p>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">4. Exemplos de linguagem segura com proprietários</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Exemplos adequados</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>“Estamos observando sinais semelhantes em outros pontos da região.”</li>
                <li>“Este é um período que merece mais atenção preventiva.”</li>
                <li>“Vale reforçar manejo e observação neste momento.”</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Exemplos inadequados (não utilizar)</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>“Há uma concentração de ocorrências.”</li>
                <li>“O VetAlert confirmou.”</li>
                <li>“Isso prova que…”</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">5. Prevenção como prática regional, não reação</h2>
          <p className="text-sm text-slate-700">
            Prevenção é uma prática contínua de antecipação, consciência situacional e ajustes de manejo, com responsabilidade
            compartilhada entre profissionais e proprietários. A prevenção regional é um exercício de prudência, não de
            precipitação.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Prevenção não é alarmismo.</li>
            <li>Prevenção não é intervenção excessiva.</li>
          </ul>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-slate-900">6. Limites éticos do uso do VetAlert</h2>
          <p className="text-sm text-slate-700">O VetAlert não deve ser usado para:</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>gerar medo;</li>
            <li>pressionar proprietários;</li>
            <li>justificar procedimentos desnecessários;</li>
            <li>substituir diagnóstico;</li>
            <li>reivindicar autoridade.</li>
          </ul>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Responsabilidade profissional e sistemas oficiais</p>
            <p>
              O uso do VetAlert é complementar e não substitui o cumprimento das obrigações éticas, legais e técnicas do
              médico-veterinário junto aos Conselhos Regionais e Federal, bem como aos órgãos municipais, estaduais e federais.
            </p>
            <p>Cada médico-veterinário permanece responsável por:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>investigação clínica e situacional adequada;</li>
              <li>realização dos procedimentos diagnósticos pertinentes;</li>
              <li>registro técnico fidedigno;</li>
              <li>comunicação tempestiva ao fluxo oficial, quando obrigatória;</li>
              <li>observância das normas, resoluções e programas oficiais vigentes.</li>
            </ul>
            <p>
              O VetAlert não substitui fluxos oficiais, não confirma eventos de campo e não exime responsabilidades profissionais.
            </p>
          </div>
        </Card>
      </div>

      <Card className="space-y-5 p-6">
        <p className="text-sm text-slate-700">
          O VetAlert não é uma sirene nem um sistema de alarme.
          <br />
          É um instrumento de consciência clínica regional que apoia o médico-veterinário na prevenção responsável.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/alerta/novo"
            className="inline-flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <span>Registrar um sinal</span>
            <span className="text-xs font-medium text-emerald-600">Check-in clínico rápido</span>
          </Link>
          <Link
            href="/global-alerts-dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Ver Alerts Intelligence de sinais regionais
          </Link>
        </div>
      </Card>
    </div>
  );
}
