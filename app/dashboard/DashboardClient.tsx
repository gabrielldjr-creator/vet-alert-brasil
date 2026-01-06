"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { AccessDenied } from "../../components/AccessDenied";
import { AccessRestricted } from "../../components/AccessRestricted";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { categoryOptions, speciesOptions } from "../../lib/alerts/schema";
import { auth, db } from "../../lib/firebase";

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

export function DashboardClient() {
  const [status, setStatus] = useState<"checking" | "restricted" | "denied" | "ready">("checking");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("restricted");
        return;
      }

      try {
        const profileRef = doc(db, "vetProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        setStatus(profileSnap.exists() ? "ready" : "denied");
      } catch (error) {
        console.error("Erro ao verificar perfil do veterinário", error);
        setStatus("denied");
      }
    });

    return () => unsubscribe();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Verificando acesso</p>
          <p className="text-base text-slate-700">Confirmando sessão e perfil do veterinário...</p>
        </Card>
      </div>
    );
  }

  if (status === "restricted") {
    return <AccessRestricted />;
  }

  if (status === "denied") {
    return <AccessDenied />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Painel autenticado</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Alertas recentes da sua região CRMV</h1>
            <p className="max-w-3xl text-base text-slate-700">
              Exibição preparada para carregar sinais já filtrados pelo estado registrado no perfil verificado do veterinário. Filtros
              adicionais seguem a ordem: região, espécie e tipo de evento.
            </p>
          </div>
          <Button href="/alerta/novo">Registrar novo alerta</Button>
        </div>
        <div className="rounded-xl bg-slate-900 px-5 py-4 text-sm text-slate-50">
          Sessão restrita a médicos-veterinários convidados. O estado do CRMV define automaticamente o escopo inicial dos alertas
          exibidos.
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Filtros com região primeiro</p>
            <p className="text-sm text-slate-600">Aplicação futura direta em consultas Firestore com escopo por estado.</p>
          </div>
          <form className="grid gap-4" aria-label="Filtros do painel">
            <div className="grid gap-3 lg:grid-cols-[240px,1fr]">
              <Select
                name="estado"
                label="Estado (CRMV)"
                defaultValue="RS"
                aria-label="Estado base"
                helper="Valor padrão vem do CRMV registrado no perfil verificado."
              >
                {states.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
              <Input
                name="cidade"
                label="Cidade ou região (opcional)"
                placeholder="Filtrar por município ou microrregião"
                autoComplete="off"
                helper="Escopo regional antes de espécie ou evento."
              />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Select
                name="especie"
                label="Espécie"
                defaultValue=""
                aria-label="Espécie"
                helper="Só aparece depois de definir região."
              >
                <option value="" disabled>
                  Selecionar espécie
                </option>
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                name="categoria"
                label="Tipo de evento"
                defaultValue=""
                aria-label="Tipo de evento"
                helper="Filtra após região e espécie."
              >
                <option value="" disabled>
                  Selecionar tipo
                </option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Consultas futuras considerarão primeiro o estado do CRMV.</p>
              <Button type="button" variant="secondary">
                Aplicar filtros
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Resultados recentes</p>
              <p className="text-sm text-slate-600">Sinais agregados por tempo e região.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
              Sem dados em exibição
            </span>
          </div>
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-600">
            <p className="font-semibold text-slate-800">Nenhum alerta carregado</p>
            <p className="text-sm">Quando conectado ao Firestore, sinais serão listados aqui já filtrados por UF do CRMV.</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Estrutura pronta para agrupar frequências e detectar clusters regionais sem exibir dados sensíveis.
          </div>
        </Card>
      </section>
    </div>
  );
}
