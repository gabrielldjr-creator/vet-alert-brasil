import { Suspense } from "react";
import { GlobalAlertsDashboard } from "../../components/vet-panel/GlobalAlertsDashboard";
import { BRANDING } from "../../lib/branding";

export const metadata = {
  title: `Painel Global de Alertas | ${BRANDING.intelligence.productLong}`,
  description: "Dados sanitários estruturados por região, espécie e classificação.",
};

export default function GlobalAlertsDashboardPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-slate-600">Carregando painel...</div>}>
      <GlobalAlertsDashboard />
    </Suspense>
  );
}
