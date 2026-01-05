import { Card } from "../../components/Card";

export const metadata = {
  title: "Privacidade | Vet Alert Brasil",
  description:
    "Entenda como o Vet Alert Brasil lida com dados e privacidade. Alertas são sinais anônimos para apoiar inteligência coletiva.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Privacidade e LGPD</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Vet Alert Brasil opera com o mínimo de dados para leitura de padrões. Cada alerta é um sinal anônimo e estruturado, sem identificação de animais, tutores ou pacientes.
        </p>
      </div>

      <Card className="space-y-3 p-6 text-sm text-slate-700">
        <p>O fluxo atual não envia dados para servidores; é apenas a interface inicial.</p>
        <p>Quando a coleta for ativada, registraremos apenas campos estruturados do alerta (espécie, categoria, fonte suspeita, região e nota curta opcional).</p>
        <p>Seguiremos princípios da LGPD: finalidade clara, minimização de dados e revisão contínua dos controles de acesso.</p>
      </Card>
    </div>
  );
}
