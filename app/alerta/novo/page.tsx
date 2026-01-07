import AlertFormClient from "./AlertFormClient";

export const metadata = {
  title: "Registrar alerta veterinário | Vet Alert Brasil",
  description:
    "Formulário rápido para registrar alertas epidemiológicos veterinários no piloto.",
};

export default function NovoAlertaPage() {
  return <AlertFormClient />;
}
