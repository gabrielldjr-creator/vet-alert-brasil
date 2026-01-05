import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { Textarea } from "../../../components/Textarea";

export const metadata = {
  title: "Criar alerta veterinário | Vet Alert Brasil",
  description:
    "Preencha um alerta veterinário de forma simples e segura. Sem dados sensíveis nesta etapa inicial.",
};

export default function NovoAlertaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Etapa 1 de 3</p>
        <h1 className="text-3xl font-semibold text-slate-900">Criar alerta veterinário</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Compartilhe apenas o essencial para que o profissional entenda a situação rapidamente. Nenhum dado sensível é solicitado nesta etapa.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            1
          </span>
          <span className="font-semibold text-slate-800">Detalhes iniciais do alerta</span>
          <span className="text-slate-500">(nenhum envio automático neste passo)</span>
        </div>
        <form className="space-y-5">
          <Input
            name="tipo"
            label="Tipo de alerta"
            placeholder="Ex.: emergência, orientação rápida, intoxicação"
            autoComplete="off"
          />
          <Select name="especie" label="Espécie" defaultValue="" aria-label="Espécie">
            <option value="" disabled>
              Selecione a espécie
            </option>
            <option value="cavalo">Cavalo</option>
            <option value="cao">Cão</option>
            <option value="gato">Gato</option>
            <option value="outro">Outro</option>
          </Select>
          <Input
            name="localizacao"
            label="Localização"
            placeholder="Bairro, cidade ou referência próxima"
            autoComplete="off"
          />
          <Textarea
            name="situacao"
            label="Situação resumida"
            placeholder="Descreva sintomas, horário de início e qualquer detalhe relevante."
            rows={5}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Nada é enviado automaticamente. Você poderá revisar antes de compartilhar.
            </p>
            <Button type="button" className="w-full sm:w-auto">
              Continuar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
