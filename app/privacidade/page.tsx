import { Card } from "../../components/Card";

export const metadata = {
  title: "Privacidade | Vet Alert Brasil",
  description:
    "Alertas são sinais anônimos e restritos a veterinários autenticados. Estado do CRMV define o escopo regional exibido.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Privacidade e LGPD</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Vet Alert Brasil é exclusivo para médicos-veterinários autenticados. Cada alerta é um sinal anônimo e regionalizado pelo estado do CRMV informado no login.
        </p>
      </div>

      <Card className="space-y-3 p-6 text-sm text-slate-700">
        <p>O fluxo atual não envia dados: é apenas a interface inicial para estruturação de sinais.</p>
        <p>Quando a coleta for ativada, salvaremos apenas campos estruturados (estado CRMV, região, espécie, categoria, fonte suspeita e nota curta opcional).</p>
        <p>Todos os acessos serão autenticados, priorizando minimização de dados e segregação regional para atender à LGPD.</p>
      </Card>
    </div>
  );
}
