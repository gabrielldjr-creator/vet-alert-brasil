import { Card } from "../components/Card";

export const metadata = {
  title: "Acesso restrito | Vet Alert Brasil",
  description:
    "Plataforma invite-only para médicos-veterinários. Acesso apenas via link mágico enviado ao e-mail profissional.",
};

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:gap-10 lg:px-10 lg:py-16">
      <section className="flex-1 space-y-6">
        <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
          Acesso exclusivo
        </p>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Inteligência epidemiológica regional para veterinários
          </h1>
          <p className="max-w-2xl text-lg text-slate-700">
            Vet Alert Brasil opera com convites controlados. Não há tela de login: o acesso é concedido apenas pelo link mágico enviado
            ao e-mail do profissional, mantendo a sessão invisível depois do primeiro acesso.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-2 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Contexto, não conduta</p>
            <p className="text-base text-slate-700">Alertas mostram frequência e padrão. Nenhuma orientação clínica é exibida.</p>
          </Card>
          <Card className="space-y-2 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Região primeiro</p>
            <p className="text-base text-slate-700">
              O CRMV define o estado padrão do painel para filtrar sinais por território antes de qualquer outro critério.
            </p>
          </Card>
        </div>
        <div className="rounded-2xl bg-slate-900 px-6 py-5 text-slate-50 shadow-lg">
          <p className="text-lg font-semibold">Sessão invisível para convidados.</p>
          <p className="mt-2 text-sm text-slate-100/80">
            O Firebase Auth mantém a sessão ativa em segundo plano após o link mágico inicial. Nenhuma credencial é solicitada nesta
            interface pública.
          </p>
        </div>
      </section>

      <section className="w-full max-w-xl">
      </section>
    </div>
  );
}
