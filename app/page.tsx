import { Card } from "../components/Card";
import { LoginForm } from "../components/LoginForm";

export const metadata = {
  title: "Acesso veterinário | Vet Alert Brasil",
  description:
    "Login exclusivo para médicos-veterinários. O estado do CRMV define a região padrão do painel e escopo dos alertas.",
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
            Vet Alert Brasil é uma plataforma restrita a profissionais com CRMV ativo. O estado informado define o escopo inicial do painel e garante que você veja sinais relevantes da sua região.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-2 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Contexto, não conduta</p>
            <p className="text-base text-slate-700">Alertas mostram frequência e padrão. Nenhuma orientação clínica é exibida.</p>
          </Card>
          <Card className="space-y-2 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Região primeiro</p>
            <p className="text-base text-slate-700">O CRMV define o estado padrão. Filtros sempre começam pelo território.</p>
          </Card>
        </div>
        <div className="rounded-2xl bg-slate-900 px-6 py-5 text-slate-50 shadow-lg">
          <p className="text-lg font-semibold">Preparado para Firebase Auth e Firestore.</p>
          <p className="mt-2 text-sm text-slate-100/80">
            Autenticação por e-mail/senha e consultas futuras serão restritas ao estado do CRMV, permitindo filtros adicionais por cidade, espécie e categoria.
          </p>
        </div>
      </section>

      <section className="w-full max-w-xl">
        <LoginForm />
      </section>
    </div>
  );
}
