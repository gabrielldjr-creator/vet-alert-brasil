import { Card } from "../../components/Card";

export const metadata = {
  title: "Acesso por convite | VetAlert + SAPSA",
  description:
    "Validação de convite para superfícies VetAlert (intake) e SAPSA (inteligência), sem alteração de autenticação técnica.",
};

export default function AcessoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10">
      <Card className="space-y-4 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Controle de acesso</p>
        <h1 className="text-2xl font-semibold text-slate-900">Acesso por convite</h1>
        <p className="text-sm text-slate-700">
          VetAlert é a camada de registro de sinais. SAPSA é a camada de inteligência agregada. O acesso continua sendo
          concedido por convite e perfil habilitado.
        </p>
      </Card>
    </div>
  );
}
