import { Card } from "./Card";

export function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-xl space-y-4 p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Acesso não autorizado</p>
        <h2 className="text-2xl font-semibold text-slate-900">Perfil de veterinário não encontrado</h2>
        <p className="text-base text-slate-700">
          A sessão foi reconhecida pelo Firebase Auth, mas o perfil não está ativo na lista de veterinários convidados. Use
          apenas o link mágico recebido ou contate o time responsável para validar seu acesso.
        </p>
      </Card>
    </div>
  );
}
