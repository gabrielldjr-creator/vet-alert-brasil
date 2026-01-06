import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { Textarea } from "../../../components/Textarea";
import {
  categoryOptions,
  sourceOptions,
  speciesOptions,
} from "../../../lib/alerts/schema";

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
  title: "Criar alerta estruturado | Vet Alert Brasil",
  description:
    "Registro restrito a veterinários autenticados. Estrutura curta priorizando região (CRMV), espécie, categoria e fonte suspeita.",
};

export default function NovoAlertaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Fluxo de alerta estruturado</p>
        <h1 className="text-3xl font-semibold text-slate-900">Criar alerta veterinário</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Apenas para veterinários autenticados. A região parte do estado do CRMV registrado no perfil verificado e nenhum dado de
          tutor ou animal é solicitado. O objetivo é sinalizar padrões, não orientar condutas.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            1
          </span>
          <span className="font-semibold text-slate-800">Estruture o sinal</span>
          <span className="text-slate-500">Região primeiro, depois espécie e categoria.</span>
        </div>
        <form className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[170px,1fr]">
            <Select
              name="estado"
              label="Estado (CRMV)"
              defaultValue="RS"
              aria-label="Estado do CRMV"
              helper="Valor bloqueado pelo perfil verificado para manter escopo regional."
            >
              {states.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
            <Input
              name="regiao"
              label="Cidade ou referência"
              placeholder="Ex.: Pelotas (RS) ou região da campanha"
              autoComplete="off"
              helper="Regionalização vem antes de espécie ou evento."
            />
          </div>

          <Select
            name="especie"
            label="Espécie"
            defaultValue=""
            aria-label="Espécie"
            helper="Selecione apenas uma espécie por alerta para manter o padrão."
          >
            <option value="" disabled>
              Selecione a espécie
            </option>
            {speciesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            name="categoria"
            label="Categoria do evento"
            defaultValue=""
            aria-label="Categoria do evento"
            helper="Classificação rápida para facilitar agrupamentos futuros."
          >
            <option value="" disabled>
              Escolha a categoria
            </option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            name="fonte"
            label="Fonte suspeita"
            defaultValue=""
            aria-label="Fonte suspeita"
            helper="Sem diagnósticos: apenas a melhor suposição do profissional."
          >
            <option value="" disabled>
              Escolha a fonte
            </option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Textarea
            name="nota"
            label="Nota curta (opcional)"
            placeholder="Resumo em poucas linhas sobre o que foi observado."
            rows={4}
            helper="Máximo de clareza com o mínimo de texto. Não inclua identificações."
          />

          <div className="flex flex-col gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">Nenhum dado sensível é coletado.</p>
            <p className="text-emerald-800">O envio final será ativado apenas após autenticação e confirmação.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Fluxo preparado para clusters automáticos por região e tempo.</p>
            <Button type="button" className="w-full sm:w-auto">
              Continuar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
