import AccessLinkClient from "./AccessLinkClient";

export const metadata = {
  title: "Acesso por convite | Vet Alert Brasil",
  description:
    "Validação do link mágico para médicos-veterinários convidados. Sem login ou formulário público.",
};

export default function AcessoPage() {
  return <AccessLinkClient />;
}
