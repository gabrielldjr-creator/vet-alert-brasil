import { Card } from "../../components/Card";

export const metadata = {
  title: "Privacidade | Vet Alert Brasil",
  description:
    "Entenda como o Vet Alert Brasil lida com dados e privacidade. Nenhum dado sensível é coletado na etapa inicial de alertas.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Privacidade e LGPD</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Estamos construindo o Vet Alert Brasil com foco em segurança e transparência. Esta página receberá a política completa de privacidade e tratamento de dados assim que o fluxo de coleta estiver ativo.
        </p>
      </div>

      <Card className="space-y-3 p-6 text-sm text-slate-700">
        <p>O formulário atual não envia dados a nenhum servidor ou terceiro.</p>
        <p>Quando implementarmos notificações, limitaremos a coleta a informações essenciais para retorno do profissional.</p>
        <p>Seguiremos princípios da LGPD: finalidade clara, minimização de dados e possibilidade de revisão ou exclusão.</p>
      </Card>
    </div>
  );
}
