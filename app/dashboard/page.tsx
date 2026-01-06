import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Painel regional | Vet Alert Brasil",
  description:
    "Painel restrito para veterinários autenticados via link mágico. Alertas seguem o estado do CRMV do perfil verificado.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
