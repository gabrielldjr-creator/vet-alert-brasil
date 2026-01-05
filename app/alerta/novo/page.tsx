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

export const metadata = {
  title: "Criar alerta estruturado | Vet Alert Brasil",
  description:
    "Registre um alerta veterinário padronizado. Apenas sinais essenciais, sem dados sensíveis ou decisão clínica.",
};

export default function NovoAlertaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Fluxo de alerta estruturado</p>
        <h1 className="text-3xl font-semibold text-slate-900">Criar alerta veterinário</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Sinais rápidos para inteligência coletiva: espécies, categorias e fontes suspeitas em formato padronizado. Nenhum dado de tutor ou animal é solicitado.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            1
          </span>
          <span className="font-semibold text-slate-800">Estruture o sinal</span>
          <span className="text-slate-500">(nenhum envio automático neste passo)</span>
        </div>
        <form className="space-y-5">
          <Select name="especie" label="Espécie" defaultValue="" aria-label="Espécie" helper="Selecione apenas uma espécie por alerta para manter o padrão.">
            <option value="" disabled>
              Selecione a espécie
            </option>
            {speciesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select name="categoria" label="Categoria do evento" defaultValue="" aria-label="Categoria do evento" helper="Classificação rápida para facilitar agrupamentos futuros.">
            <option value="" disabled>
              Escolha a categoria
            </option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select name="fonte" label="Fonte suspeita" defaultValue="" aria-label="Fonte suspeita" helper="Sem diagnósticos: apenas a melhor suposição do profissional.">
            <option value="" disabled>
              Escolha a fonte
            </option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Input
            name="regiao"
            label="Região (município ou referência)"
            placeholder="Ex.: Pelotas (RS) ou região da campanha"
            autoComplete="off"
            helper="Localização aproximada suficiente para mapear padrões."
          />

          <Textarea
            name="nota"
            label="Nota curta (opcional)"
            placeholder="Resumo em poucas linhas sobre o que foi observado."
            rows={4}
            helper="Máximo de clareza com o mínimo de texto. Não inclua identificações."
          />

          <div className="flex flex-col gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">Nenhum dado sensível é coletado.</p>
            <p className="text-emerald-800">O envio final será ativado apenas após confirmação.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Este fluxo foi pensado para ser rápido em campo e preparar clusters automáticos.</p>
            <Button type="button" className="w-full sm:w-auto">
              Continuar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
