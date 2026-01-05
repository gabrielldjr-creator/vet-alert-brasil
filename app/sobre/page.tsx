import { Card } from "../../components/Card";

export const metadata = {
  title: "Sobre | Vet Alert Brasil",
  description:
    "Entenda a missão do Vet Alert Brasil: criar alertas veterinários claros e acessíveis para tutores e profissionais.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Nossa missão</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Vet Alert Brasil nasce para simplificar a troca de informações entre tutores e profissionais, reduzindo ruído em momentos decisivos e ajudando equipes veterinárias a priorizar atendimentos com responsabilidade.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Valores</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Clareza e linguagem acessível para qualquer tutor.</li>
            <li>Respeito à privacidade: solicitamos apenas o necessário.</li>
            <li>Colaboração com profissionais para construir confiança.</li>
          </ul>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Próximos passos</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Adicionar fluxo seguro de contato e notificação para veterinários.</li>
            <li>Permitir que clínicas indiquem disponibilidade e áreas de atuação.</li>
            <li>Publicar orientações de primeiros cuidados para situações comuns.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
