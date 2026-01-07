import { redirect } from "next/navigation";

export const metadata = {
  title: "Registrar alerta | Vet Alert Brasil",
  description: "Entrada direta para registrar alertas epidemiológicos no piloto.",
};

export default function Home() {
  redirect("/alerta/novo");
}
