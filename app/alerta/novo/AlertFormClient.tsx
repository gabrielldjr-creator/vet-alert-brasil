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

const herdCounts = ["1", "2 a 5", "6 a 20", "Mais de 20 (surto)"];
const severityLevels = ["Atenção", "Preocupante", "Urgente"];

const detailOptions: Record<string, string[]> = {
  "Suspeita de intoxicação": [
    "Ração concentrada",
    "Silagem / feno / pasto",
    "Água",
    "Agrotóxico",
    "Produto químico",
    "Plantas tóxicas",
    "Medicamento",
    "Outro agente",
  ],
  "Contaminação ou mudança abrupta de ração/alimento": [
    "Lote de ração",
    "Feno / volumoso",
    "Mistura caseira",
    "Suplemento",
    "Nova formulação",
  ],
  "Contaminação de água": [
    "Poço",
    "Fonte superficial",
    "Tanque / reservatório",
    "Distribuição local",
    "Outra",
  ],
  "Pulverização aérea próxima": [
    "Herbicida",
    "Inseticida",
    "Fungicida",
    "Produto desconhecido",
  ],
  "Queimadas / fumaça": ["Queimada controlada", "Queimada irregular", "Fumaça de longe"],
  "Enchentes, secas ou eventos climáticos extremos": [
    "Enchente",
    "Seca",
    "Frente fria intensa",
    "Onda de calor",
    "Tempestade / granizo",
  ],
  "Aumento anormal da mortalidade": ["Mesma propriedade", "Propriedades vizinhas", "Região mais ampla"],
  "Padrão incomum para a estação": ["Clima atípico", "Pasto incomum", "Insetos / vetores"],
  "Síndrome digestiva": [
    "Diarreia",
    "Diarreia hemorrágica",
    "Cólica em grupo",
    "Salivação intensa",
  ],
  "Síndrome respiratória": ["Dispneia", "Tosse em grupo", "Secreção nasal"],
  "Sinais neurológicos": ["Ataxia", "Tremores", "Convulsões", "Paralisia", "Alteração comportamental"],
  "Lesões cutâneas / teciduais": ["Necrose", "Úlceras", "Edema", "Dermatite"],
  "Alterações reprodutivas": ["Abortos", "Infertilidade", "Retenção de placenta", "Natimortos"],
};

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
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">Obrigatório</span>
        </div>
      ) : null}
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
  const [alertGroup, setAlertGroup] = useState(alertCategories[0].group);
  const [alertDetails, setAlertDetails] = useState<string[]>([]);
  const [herdCount, setHerdCount] = useState("");
  const [severity, setSeverity] = useState("");
  const [state, setState] = useState("RS");
  const [country, setCountry] = useState("Brasil");
  const [regionReference, setRegionReference] = useState("");
  const [locationMessage, setLocationMessage] = useState("Detectando região...");
  const [isDetecting, setIsDetecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState(0);

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

  const goNext = () => setStep((current) => Math.min(current + 1, 4));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const handleSelection = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrors([]);
    if (step < 4) {
      goNext();
    }
  };

  const handleAlertTypeSelect = (value: string) => {
    setAlertType(value);
    setAlertDetails([]);
    setErrors([]);
    if (step < 4) {
      goNext();
    }
  };

  const validateCurrentStep = () => {
    const missing: string[] = [];
    if (step === 0 && !alertType) missing.push("Escolha o tipo de alerta");
    if (step === 1 && !species) missing.push("Selecione a espécie");
    if (step === 2 && !herdCount) missing.push("Informe número de animais afetados");
    if (step === 3 && !severity) missing.push("Classifique a gravidade");
    return missing;
  };

  const handleNext = () => {
    const missing = validateCurrentStep();
    setErrors(missing);
    if (missing.length === 0) {
      goNext();
    }
  };

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
      setStep(0);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Fluxo de campo</p>
        <h1 className="text-3xl font-semibold text-slate-900">Registrar alerta</h1>
        <p className="text-sm text-slate-600">Alta visibilidade, poucos toques, foco em campo.</p>
      </div>

      <Card className="p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
            <span>Passo {step + 1} de 5</span>
            <div className="flex gap-2" aria-hidden>
              {[0, 1, 2, 3, 4].map((index) => (
                <span
                  key={index}
                  className={`h-1 w-10 rounded-full transition ${
                    step >= index ? "bg-emerald-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Tipo de sinal observado</p>
                <p className="text-sm text-slate-600">Selecione a categoria, depois o sinal específico.</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Categoria de alerta">
                {alertCategories.map((group) => {
                  const active = alertGroup === group.group;
                  return (
                    <button
                      key={group.group}
                      type="button"
                      className={[
                        "rounded-xl border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500",
                        active ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-800",
                      ].join(" ")}
                      aria-pressed={active}
                      onClick={() => setAlertGroup(group.group)}
                    >
                      {group.group}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opções da categoria</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {alertCategories
                    .find((group) => group.group === alertGroup)
                    ?.options.map((option) => {
                      const selected = alertType === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={[
                            buttonBaseStyles,
                            selected ? buttonSelected : buttonUnselected,
                            "p-3 text-left text-sm sm:text-base",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => handleAlertTypeSelect(option)}
                          aria-pressed={selected}
                        >
                          <span className="block font-semibold">{option}</span>
                        </button>
                      );
                    })}
                </div>
                {detailOptions[alertType]?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Detalhe rápido (opcional)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {detailOptions[alertType].map((detail) => {
                        const selected = alertDetails.includes(detail);
                        return (
                          <button
                            key={detail}
                            type="button"
                            className={[
                              buttonBaseStyles,
                              selected ? buttonSelected : buttonUnselected,
                              "p-2.5 text-sm sm:text-base",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              setAlertDetails((current) =>
                                current.includes(detail)
                                  ? current.filter((item) => item !== detail)
                                  : [...current, detail]
                              );
                            }}
                            aria-pressed={selected}
                          >
                            <span className="block font-semibold">{detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Espécie</p>
                <p className="text-sm text-slate-600">Botões grandes, alto contraste.</p>
              </div>
              <QuickSelect
                label=""
                options={speciesOptions}
                value={species}
                onChange={handleSelection(setSpecies)}
                columns={1}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Número de animais afetados</p>
                <p className="text-sm text-slate-600">Seleção direta, sem digitação.</p>
              </div>
              <QuickSelect
                label=""
                options={herdCounts}
                value={herdCount}
                onChange={handleSelection(setHerdCount)}
                columns={2}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Gravidade percebida</p>
                <p className="text-sm text-slate-600">Cores fortes apenas aqui.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {severityLevels.map((level) => {
                  const selected = severity === level;
                  const severityStyles = {
                    Atenção: "bg-slate-50 border-slate-200 text-slate-900",
                    Preocupante: "bg-amber-50 border-amber-200 text-amber-900",
                    Urgente: "bg-red-50 border-red-200 text-red-900",
                  } as const;

                  return (
                    <button
                      key={level}
                      type="button"
                      className={[
                        "rounded-xl border p-4 text-left text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 sm:text-base",
                        selected
                          ? "ring-2 ring-offset-1 ring-emerald-600"
                          : "hover:border-emerald-200 hover:bg-emerald-50",
                        severityStyles[level as keyof typeof severityStyles],
                        "min-h-[64px]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleSelection(setSeverity)(level)}
                      aria-pressed={selected}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Região e envio</p>
                <p className="text-sm text-slate-600">Somente país + estado, sem endereço.</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Região</p>
                    <p className="text-xs text-slate-600">País e estado apenas.</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                    onClick={detectRegion}
                    disabled={isDetecting}
                  >
                    {isDetecting ? "Detectando..." : "Atualizar"}
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
                  placeholder="Ex.: Oeste do PR, Alto Sertão"
                  value={regionReference}
                  onChange={(event) => setRegionReference(event.target.value)}
                  maxLength={80}
                  helper="Nunca pedir endereço exato."
                />

                <div className="rounded-xl bg-white p-3 text-sm text-slate-800 shadow-inner">
                  <p className="font-semibold text-emerald-800">{locationMessage}</p>
                  <p className="text-xs text-slate-600">Sem GPS detalhado ou dados de tutor.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Observação rápida (opcional)</p>
                  <span className="text-xs text-slate-500">{notes.length}/250</span>
                </div>
                <Textarea
                  name="notes"
                  placeholder="Resumo curto, máximo 250 caracteres."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value.slice(0, 250))}
                  rows={4}
                  maxLength={250}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
                <p className="font-semibold">Revisão rápida</p>
                <ul className="mt-2 space-y-1">
                  <li>• Sinal: {alertType || "—"}</li>
                  {alertDetails.length > 0 && <li>• Detalhes: {alertDetails.join(", ")}</li>}
                  <li>• Espécie: {species || "—"}</li>
                  <li>• Nº animais: {herdCount || "—"}</li>
                  <li>• Gravidade: {severity || "—"}</li>
                  <li>
                    • Região: {country} / {state}
                  </li>
                </ul>
              </div>
            </div>
          )}

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
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-2"
                onClick={goBack}
                disabled={step === 0}
              >
                Voltar
              </Button>
              <span>Fluxo concluído em menos de 60s.</span>
            </div>
            {step < 4 ? (
              <Button type="button" className="w-full sm:w-auto px-6 py-3 text-base" onClick={handleNext}>
                Próximo
              </Button>
            ) : (
              <Button type="submit" className="w-full sm:w-auto px-6 py-3 text-base">
                Registrar alerta
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
