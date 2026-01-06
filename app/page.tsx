import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";

const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

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
        <Card className="space-y-5 p-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Login</p>
            <h2 className="text-2xl font-semibold text-slate-900">Identifique-se com seu CRMV</h2>
            <p className="text-sm text-slate-600">Campos prontos para autenticação por e-mail/senha. Nenhum dado é enviado nesta versão.</p>
          </div>
          <form className="space-y-4" aria-label="Formulário de login de veterinários">
            <Input name="nome" label="Nome completo" autoComplete="name" placeholder="Nome e sobrenome" required />
            <div className="grid gap-3 sm:grid-cols-[140px,1fr]">
              <Select
                name="crmvUF"
                label="CRMV - Estado"
                defaultValue=""
                aria-label="Estado do CRMV"
                helper="Define a região padrão do painel."
                required
              >
                <option value="" disabled>
                  Selecione UF
                </option>
                {states.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
              <Input
                name="crmvNumero"
                label="CRMV - Número"
                placeholder="Ex.: 12345"
                inputMode="numeric"
                autoComplete="off"
                helper="Usado para validar registro profissional futuramente."
                required
              />
            </div>
            <Input
              name="email"
              type="email"
              label="E-mail profissional"
              placeholder="email@dominio.com"
              autoComplete="email"
              required
            />
            <Input
              name="senha"
              type="password"
              label="Senha"
              placeholder="Mínimo 8 caracteres"
              autoComplete="current-password"
              required
            />
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              O estado informado aqui será salvo como região base e aplicado automaticamente ao painel após autenticação.
            </div>
            <Button type="submit" className="w-full">
              Entrar e ir para o painel
            </Button>
            <p className="text-xs text-slate-500">
              Ao continuar, você confirma ser médico-veterinário com CRMV ativo. Nenhuma área pública é exibida além desta página de login.
            </p>
          </form>
        </Card>
      </section>
    </div>
  );
}
