import { Card } from "./Card";

export function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-xl space-y-4 p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Acesso não autorizado</p>
        <h2 className="text-2xl font-semibold text-slate-900">Acesso VetAlert não habilitado para esta conta</h2>
        <p className="text-base text-slate-700">
          A sessão foi reconhecida, mas não há habilitação ativa para intake VetAlert neste usuário. Utilize o link de convite
          oficial ou contate o time responsável.
        </p>
        <p className="text-sm text-slate-600">
          A camada SAPSA Intelligence segue com acesso conforme política de perfil e governança de dados.
        </p>
      </Card>
    </div>
  );
}
