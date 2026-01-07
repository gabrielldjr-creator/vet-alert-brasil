import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Alertas regionais | Vet Alert Brasil",
  description: "Painel regional com sinais agregados em tempo real para o piloto.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-sm text-slate-600">Carregando painel...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
