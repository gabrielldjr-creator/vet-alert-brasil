import AlertFormClient from "./AlertFormClient";

export const metadata = {
  title: "Registrar alerta veterinário | Vet Alert Brasil",
  description:
    "Formulário profissional, rápido e sem fricção para veterinários autenticados registrarem alertas epidemiológicos.",
};

export default function NovoAlertaPage() {
  return <AlertFormClient />;
}
