import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Painel regional | Vet Alert Brasil",
  description:
    "Painel restrito para veterinários autenticados. Alertas são exibidos automaticamente pelo estado do CRMV informado no login.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
