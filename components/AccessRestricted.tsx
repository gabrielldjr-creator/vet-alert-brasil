import { Card } from "./Card";

export function AccessRestricted() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
          Acesso restrito
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          Plataforma exclusiva para veterinários convidados
        </h1>
        <p className="max-w-3xl text-lg text-slate-700">
          O Vet Alert Brasil opera somente por convite. O primeiro acesso é feito pelo link mágico enviado ao e-mail profissional
          do médico-veterinário convidado. Depois disso, a sessão permanece invisível via Firebase Auth.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Sem formulários públicos</p>
          <p className="text-base text-slate-700">
            Não há tela de login ou cadastro. Todo acesso começa pelo link seguro enviado diretamente ao profissional convidado.
          </p>
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Sessão automática</p>
          <p className="text-base text-slate-700">
            O Firebase Auth mantém a sessão de fundo após o primeiro acesso. Nenhuma credencial é solicitada ao usuário.
          </p>
        </Card>
      </div>

      <Card className="space-y-3 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Convites controlados</p>
        <p className="text-base text-slate-700">
          Se você é um veterinário convidado, acesse pelo link enviado. Caso precise de suporte ou novo convite, contate o time
          responsável pelo programa. Não solicitamos dados de login nesta interface.
        </p>
      </Card>
    </div>
  );
}
