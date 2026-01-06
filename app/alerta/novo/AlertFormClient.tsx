"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { Textarea } from "../../../components/Textarea";

const stateOptions = [
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

const speciesOptions = [
  "Equinos",
  "Bovinos",
  "Suínos",
  "Aves",
  "Pequenos animais (cães/gatos)",
  "Animais silvestres",
  "Outros animais de produção",
];

const alertCategories = [
  {
    group: "Síndromes Clínicas",
    options: [
      "Sinais neurológicos",
      "Síndrome respiratória",
      "Síndrome digestiva",
      "Lesões cutâneas / teciduais",
      "Alterações reprodutivas",
      "Morte súbita sem causa aparente",
    ],
  },
  {
    group: "Alertas Populacionais",
    options: [
      "Mesmo sintoma em vários animais",
      "Aumento anormal da mortalidade",
      "Padrão incomum para a estação",
      "Aumento repentino de atendimentos clínicos",
    ],
  },
  {
    group: "Ambientais / Toxicológicos",
    options: [
      "Suspeita de intoxicação",
      "Contaminação de água",
      "Contaminação ou mudança abrupta de ração/alimento",
      "Pulverização aérea próxima",
      "Queimadas / fumaça",
      "Enchentes, secas ou eventos climáticos extremos",
    ],
  },
  {
    group: "Bem-estar / Manejo",
    options: [
      "Dor intensa sem manejo adequado",
      "Falta de água",
      "Superlotação",
      "Colapso relacionado a transporte ou esforço",
      "Suspeita de maus-tratos ou negligência",
    ],
  },
  {
    group: "Síndromes Compatíveis com Zoonoses",
    options: [
      "Síndrome neurológica com agressividade",
      "Síndrome febril com icterícia",
      "Abortos associados a doença humana na propriedade",
      "Lesões cutâneas potencialmente transmissíveis",
    ],
  },
  { group: "Outro", options: ["Outro sinal preocupante (descrição livre)"] },
];

const herdCounts = ["1", "2 a 5", "6 a 20", "Mais de 20"];
const severityLevels = ["Leve", "Moderada", "Grave / urgente"];

const buttonBaseStyles =
  "rounded-xl border text-left text-base transition shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500";
const buttonUnselected = "border-slate-200 bg-white text-slate-800 hover:border-emerald-200";
const buttonSelected =
  "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100";

function QuickSelect({
  label,
  options,
  value,
  onChange,
  columns = 2,
  id,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
  id?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">Obrigatório</span>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        role="group"
        aria-labelledby={id}
      >
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              className={[
                buttonBaseStyles,
                selected ? buttonSelected : buttonUnselected,
                "p-3 text-sm sm:text-base",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(option)}
              aria-pressed={selected}
            >
              <span className="block font-semibold">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AlertFormClient() {
  const [species, setSpecies] = useState("");
  const [alertType, setAlertType] = useState("");
  const [herdCount, setHerdCount] = useState("");
  const [severity, setSeverity] = useState("Moderada");
  const [state, setState] = useState("RS");
  const [country, setCountry] = useState("Brasil");
  const [regionReference, setRegionReference] = useState("");
  const [locationMessage, setLocationMessage] = useState("Detectando região...");
  const [isDetecting, setIsDetecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const detectRegion = useCallback(async () => {
    setIsDetecting(true);
    setLocationMessage("Detectando região...");
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("Falha na detecção");
      const data = await response.json();
      setCountry(data.country_name || "Brasil");
      setState(data.region_code || data.region || state);
      setLocationMessage("Região detectada automaticamente");
    } catch {
      setLocationMessage("Não foi possível detectar. Ajuste manualmente.");
    } finally {
      setIsDetecting(false);
    }
  }, [state]);

  useEffect(() => {
    detectRegion();
  }, [detectRegion]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing: string[] = [];
    if (!species) missing.push("Selecione a espécie");
    if (!alertType) missing.push("Escolha o tipo de alerta");
    if (!herdCount) missing.push("Informe número de animais afetados");
    if (!state) missing.push("Confirme o estado");
    if (!severity) missing.push("Classifique a gravidade");
    setErrors(missing);

    if (missing.length === 0) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Registro único, rápido</p>
        <h1 className="text-3xl font-semibold text-slate-900">Alerta veterinário</h1>
        <p className="text-sm text-slate-600">
          Fluxo direto para vigilância epidemiológica. Sem dados sensíveis, sem diagnóstico.
        </p>
      </div>

      <Card className="p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div className="space-y-6">
              <QuickSelect
                label="Espécie"
                options={speciesOptions}
                value={species}
                onChange={setSpecies}
                columns={2}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Tipo de alerta</p>
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">Obrigatório</span>
                </div>
                <div className="grid gap-3">
                  {alertCategories.map((group) => (
                    <div key={group.group} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.group}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.options.map((option) => {
                          const selected = alertType === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              className={[
                                buttonBaseStyles,
                                selected ? buttonSelected : buttonUnselected,
                                "p-3 text-sm text-left sm:text-base",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => setAlertType(option)}
                              aria-pressed={selected}
                            >
                              <span className="block font-semibold">{option}</span>
                              <span className="mt-1 block text-xs text-slate-600">Sinal prioritário para vigilância.</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <QuickSelect
                label="Número de animais afetados"
                options={herdCounts}
                value={herdCount}
                onChange={setHerdCount}
                columns={4}
              />

              <QuickSelect
                label="Gravidade percebida"
                options={severityLevels}
                value={severity}
                onChange={setSeverity}
                columns={3}
              />
            </div>

            <div className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Região</p>
                  <p className="text-xs text-slate-600">Detectamos país e estado. Ajuste só se necessário.</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  onClick={detectRegion}
                  disabled={isDetecting}
                >
                  {isDetecting ? "Detectando..." : "Atualizar localização"}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  name="country"
                  label="País"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  autoComplete="country"
                  helper="Somente nível nacional/regional."
                  required
                />
                <Select
                  name="state"
                  label="Estado"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  aria-label="Estado"
                  helper="Sem município ou endereço."
                  required
                >
                  {stateOptions.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                name="regionReference"
                label="Referência de região"
                placeholder="Ex.: Oeste do PR, Alto Sertão, Zona da Mata"
                value={regionReference}
                onChange={(event) => setRegionReference(event.target.value)}
                maxLength={80}
                helper="Nunca peça endereço exato."
              />

              <div className="rounded-xl bg-white p-3 text-sm text-slate-700 shadow-inner">
                <p className="font-semibold text-emerald-800">{locationMessage}</p>
                <p className="text-xs text-slate-600">Sem coleta de GPS detalhado ou dados de tutor.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Observações (opcional)</p>
                  <span className="text-xs text-slate-500">{notes.length}/250</span>
                </div>
                <Textarea
                  name="notes"
                  placeholder="Resumo rápido do que foi visto. Máximo de 250 caracteres."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value.slice(0, 250))}
                  rows={4}
                  maxLength={250}
                />
              </div>

              <div className="rounded-xl bg-white p-3 text-sm text-emerald-900 shadow-sm">
                <p className="font-semibold">Regras de envio</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-700">
                  <li>Um toque para registrar.</li>
                  <li>Sem diagnóstico, apenas sinais.</li>
                  <li>Sem identificação de proprietário ou endereço.</li>
                </ul>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Complete os campos obrigatórios:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {submitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-semibold">Alerta registrado.</p>
              <p className="text-slate-800">Dados vinculados ao perfil verificado. Nenhuma outra ação necessária.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Fluxo pensado para ser concluído em menos de 60 segundos.</p>
            <Button type="submit" className="w-full sm:w-auto px-6 py-3 text-base">
              Registrar alerta
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
