import { Suspense } from "react";
import { DashboardVetPanel } from "../../components/vet-panel/DashboardVetPanel";

export const metadata = {
  title: "Painel regional | Vet Alert Brasil",
  description:
    "Painel restrito para veterinários autenticados via link mágico. Alertas seguem o estado do CRMV do perfil verificado.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-slate-600">Carregando painel...</div>}>
      <DashboardVetPanel />
    </Suspense>
  );
}
