"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { Textarea } from "../../../components/Textarea";
import { ProfileSetupCard } from "../../../components/ProfileSetupCard";
import { ensurePilotAuth } from "../../../lib/auth";
import { auth, db } from "../../../lib/firebase";
import { fetchMunicipalities, MunicipalityOption, stateOptions } from "../../../lib/regions";

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
      "Quadro parasitário / falha de controle parasitário",
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

const feedSensitiveAlerts = new Set([
  "Síndrome digestiva",
  "Sinais neurológicos",
  "Alterações reprodutivas",
  "Morte súbita sem causa aparente",
]);

const pharmaSensitiveAlerts = new Set([
  "Sinais neurológicos",
  "Alterações reprodutivas",
  "Morte súbita sem causa aparente",
  "Aumento anormal da mortalidade",
  "Síndrome neurológica com agressividade",
  "Síndrome febril com icterícia",
  "Quadro parasitário / falha de controle parasitário",
]);

const environmentalAlerts = new Set([
  "Suspeita de intoxicação",
  "Contaminação de água",
  "Contaminação ou mudança abrupta de ração/alimento",
  "Pulverização aérea próxima",
  "Queimadas / fumaça",
  "Enchentes, secas ou eventos climáticos extremos",
]);

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
  "Quadro parasitário / falha de controle parasitário": [
    "Alta carga parasitária",
    "Falha após vermifugação recente",
    "Recidiva rápida",
    "Perda de escore corporal",
    "Anemia / mucosas pálidas",
    "Prurido intenso",
    "Parasitas visíveis",
  ],
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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Falha ao iniciar sessão anônima:", error);
        });
      } else {
        user.getIdToken().catch((error) => {
          console.error("Falha ao obter token de autenticação:", error);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const [species, setSpecies] = useState("");
  const [alertType, setAlertType] = useState("");
  const [alertGroup, setAlertGroup] = useState(alertCategories[0].group);
  const [alertDetails, setAlertDetails] = useState<string[]>([]);
  const [herdCount, setHerdCount] = useState("");
  const [severity, setSeverity] = useState("");
  const [state, setState] = useState("SC");
  const [country, setCountry] = useState("Brasil");
  const [cityOptions, setCityOptions] = useState<MunicipalityOption[]>([]);
  const [cityCode, setCityCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [regionIBGE, setRegionIBGE] = useState("");
  const [localidadeAproximada, setLocalidadeAproximada] = useState("");
  const [cityError, setCityError] = useState("");
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [locationMessage, setLocationMessage] = useState("Detectando região...");
  const [isDetecting, setIsDetecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [eventOnset, setEventOnset] = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [feedChange, setFeedChange] = useState("");
  const [feedType, setFeedType] = useState<string[]>([]);
  const [feedOrigin, setFeedOrigin] = useState("");
  const [drugExposure, setDrugExposure] = useState("");
  const [drugCategory, setDrugCategory] = useState<string[]>([]);
  const [drugInterval, setDrugInterval] = useState("");
  const [environmentSignals, setEnvironmentSignals] = useState<string[]>([]);
  const [regionalPattern, setRegionalPattern] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const showsFeedModule = feedSensitiveAlerts.has(alertType);
  const showsPharmaModule = pharmaSensitiveAlerts.has(alertType);
  const showsEnvironmentalModule =
    environmentalAlerts.has(alertType) || alertGroup === "Ambientais / Toxicológicos";
  const SpeechRecognition = useMemo(() => {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }, []);

  const regionIBGEOptions = useMemo(() => {
    const groups = new Set(
      cityOptions.map((city) => city.microregion).filter((value): value is string => Boolean(value))
    );
    return Array.from(groups).sort((a, b) => a.localeCompare(b));
  }, [cityOptions]);

  const filteredMunicipalities = useMemo(() => {
    const trimmed = municipalitySearch.trim().toLowerCase();
    if (trimmed.length < 3) return [];
    return cityOptions.filter((city) => city.name.toLowerCase().includes(trimmed)).slice(0, 50);
  }, [cityOptions, municipalitySearch]);

  const handleMunicipalityInput = (value: string) => {
    setMunicipalitySearch(value);
    const match = cityOptions.find((city) => city.name === value);
    if (match) {
      setCityCode(match.code.toString());
      setCityName(match.name);
      if (match.microregion) {
        setRegionIBGE(match.microregion);
      }
      return;
    }
    setCityCode("");
    setCityName("");
  };

  useEffect(() => {
    let isActive = true;
    if (!state) {
      setCityOptions([]);
      setCityCode("");
      setCityName("");
      setMunicipalitySearch("");
      setRegionIBGE("");
      setLocalidadeAproximada("");
      setCityError("");
      return () => {
        isActive = false;
      };
    }

    setIsLoadingCities(true);
    setCityError("");
    fetchMunicipalities(state)
      .then((options) => {
        if (!isActive) return;
        setCityOptions(options);
      })
      .catch((error) => {
        console.error("Erro ao carregar municípios", error);
        if (!isActive) return;
        setCityOptions([]);
        setCityError("Não foi possível carregar municípios para este estado.");
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingCities(false);
      });

    return () => {
      isActive = false;
    };
  }, [state]);

  const goNext = () => setStep((current) => Math.min(current + 1, 6));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const handleSelection = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setErrors([]);
    if (step < 6) {
      goNext();
    }
  };

  const handleAlertTypeSelect = (value: string) => {
    setAlertType(value);
    setAlertDetails([]);
    setFeedChange("");
    setFeedType([]);
    setFeedOrigin("");
    setDrugExposure("");
    setDrugCategory([]);
    setDrugInterval("");
    setEnvironmentSignals([]);
    setErrors([]);
  };

  const casesCount = useMemo(() => {
    if (herdCount === "1") return 1;
    if (herdCount.startsWith("2")) return 2;
    if (herdCount.startsWith("6")) return 6;
    if (herdCount.startsWith("Mais")) return 21;
    return 0;
  }, [herdCount]);

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

  const handleSubmit = async (
    event?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    event?.preventDefault();
    const missing: string[] = [];
    if (!species) missing.push("Selecione a espécie");
    if (!alertType) missing.push("Escolha o tipo de alerta");
    if (!herdCount) missing.push("Informe número de animais afetados");
    if (!state) missing.push("Confirme o estado");
    if (!cityCode) missing.push("Selecione o município");
    if (!severity) missing.push("Classifique a gravidade");
    setErrors(missing);

    if (missing.length > 0) return;

    try {
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      await user.getIdToken();
      await addDoc(collection(db, "alerts"), {
        createdAt: serverTimestamp(),
        state,
        regionIBGE: regionIBGE || undefined,
        municipality: cityName || undefined,
        localidadeAproximada: localidadeAproximada ? localidadeAproximada.trim() : null,
        city: cityName || undefined,
        cityCode: cityCode ? Number(cityCode) : undefined,
        cityName: cityName || undefined,
        regionGroup: regionIBGE || undefined,
        species,
        alertGroup,
        alertType,
        severity,
        cases: casesCount,
        herdCount,
        context: {
          alertDetails,
          notes: notes.trim() ? notes.trim() : "",
          eventOnset,
          recentChanges,
          feed: showsFeedModule
            ? {
                feedChange,
                feedType,
                feedOrigin,
              }
            : null,
          pharma: showsPharmaModule
            ? {
                drugExposure,
                drugCategory,
                drugInterval,
              }
            : null,
          environment: showsEnvironmentalModule
            ? {
                environmentSignals,
                regionalPattern,
              }
            : null,
          herdCountLabel: herdCount,
          country,
        },
        source: "pilot",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar alerta:", error);
      setSubmitError("Erro ao salvar alerta. Tente novamente.");
    }
  };

  const handleSpeechToText = useCallback(() => {
    if (!SpeechRecognition) return;
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results as any[])
          .map((result: any) => result[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (!transcript) return;
        setNotes((current) => {
          const separator = current.trim() ? " " : "";
          return `${current}${separator}${transcript}`.slice(0, 250);
        });
      };
      recognition.onerror = () => {};
      recognition.start();
    } catch {
      // fail silently
    }
  }, [SpeechRecognition]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Fluxo de campo</p>
        <h1 className="text-3xl font-semibold text-slate-900">Registrar alerta</h1>
        <p className="text-sm text-slate-600">Alta visibilidade, poucos toques, foco em campo.</p>
      </div>

      <Card className="p-6 shadow-sm">
        <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
            <span>Passo {step + 1} de 7</span>
            <div className="flex gap-2" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
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
                    Atenção: "bg-yellow-500 border-yellow-500 text-white",
                    Preocupante: "bg-orange-500 border-orange-500 text-white",
                    Urgente: "bg-red-500 border-red-500 text-white",
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
                <p className="text-lg font-semibold text-slate-900">Contexto crítico (rápido)</p>
                <p className="text-sm text-slate-600">
                  Micro-perguntas condicionais para capturar causa sem digitação.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Linha do tempo</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {["Súbito", "Progressivo"].map((option) => {
                      const selected = eventOnset === option;
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
                          onClick={() => setEventOnset(option)}
                          aria-pressed={selected}
                        >
                          <span className="font-semibold">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {["Últimas 72h", "Últimos 7 dias", "Últimos 30 dias", "Nenhuma mudança recente"].map(
                      (option) => {
                        const selected = recentChanges === option;
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
                            onClick={() => setRecentChanges(option)}
                            aria-pressed={selected}
                          >
                            <span className="font-semibold">{option}</span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {showsEnvironmentalModule && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Exposição ambiental</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        "Nova pastagem",
                        "Acesso a lixo / resíduos",
                        "Proximidade de atividade agrícola",
                        "Mudança de fonte de água",
                        "Evento climático extremo recente",
                      ].map((signal) => {
                        const selected = environmentSignals.includes(signal);
                        return (
                          <button
                            key={signal}
                            type="button"
                            className={[
                              buttonBaseStyles,
                              selected ? buttonSelected : buttonUnselected,
                              "p-3 text-sm sm:text-base",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() =>
                              setEnvironmentSignals((current) =>
                                current.includes(signal)
                                  ? current.filter((item) => item !== signal)
                                  : [...current, signal]
                              )
                            }
                            aria-pressed={selected}
                          >
                            <span className="font-semibold">{signal}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showsFeedModule && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">Exposição alimentar</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {["Nenhuma mudança", "Nova ração", "Novo lote", "Novo fornecedor", "Novo feno / volumoso"].map(
                          (option) => {
                            const selected = feedChange === option;
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
                                onClick={() => setFeedChange(option)}
                                aria-pressed={selected}
                              >
                                <span className="font-semibold">{option}</span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de alimentação</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {["Ração comercial", "Silagem", "Feno", "Pastagem", "Suplemento"].map((option) => {
                          const selected = feedType.includes(option);
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
                              onClick={() =>
                                setFeedType((current) =>
                                  current.includes(option)
                                    ? current.filter((item) => item !== option)
                                    : [...current, option]
                                )
                              }
                              aria-pressed={selected}
                            >
                              <span className="font-semibold">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origem</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {["Marca conhecida", "Origem desconhecida / a granel / informal"].map((option) => {
                          const selected = feedOrigin === option;
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
                              onClick={() => setFeedOrigin(option)}
                              aria-pressed={selected}
                            >
                              <span className="font-semibold">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {showsPharmaModule && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Medicamentos / vacinas</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {["Sim", "Não", "Desconhecido"].map((option) => {
                        const selected = drugExposure === option;
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
                            onClick={() => setDrugExposure(option)}
                            aria-pressed={selected}
                          >
                            <span className="font-semibold">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {drugExposure === "Sim" && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qual categoria?</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {["Antibiótico", "Antiparasitário", "Anti-inflamatório", "Vacina", "Outro"].map(
                              (option) => {
                                const selected = drugCategory.includes(option);
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
                                    onClick={() =>
                                      setDrugCategory((current) =>
                                        current.includes(option)
                                          ? current.filter((item) => item !== option)
                                          : [...current, option]
                                      )
                                    }
                                    aria-pressed={selected}
                                  >
                                    <span className="font-semibold">{option}</span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intervalo</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {["< 24h", "1–3 dias", "4–14 dias", "> 14 dias"].map((option) => {
                              const selected = drugInterval === option;
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
                                  onClick={() => setDrugInterval(option)}
                                  aria-pressed={selected}
                                >
                                  <span className="font-semibold">{option}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Padrão regional</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {["Sim", "Não", "Desconhecido"].map((option) => {
                      const selected = regionalPattern === option;
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
                          onClick={() => setRegionalPattern(option)}
                          aria-pressed={selected}
                        >
                          <span className="font-semibold">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-600">Inteligência de cluster sem pedir diagnóstico.</p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Região e envio</p>
                <p className="text-sm text-slate-600">País, estado e município. Nunca endereço.</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Região</p>
                    <p className="text-xs text-slate-600">UF + município, sem endereço exato.</p>
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
                    helper="Use o estado CRMV."
                    required
                  >
                    {stateOptions.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <p className="text-xs text-slate-600 sm:col-span-2">
                    O município é a referência geográfica principal. A região epidemiológica é apenas informativa.
                  </p>
                  <div className="space-y-2">
                    <Input
                      name="city"
                      label="Município"
                      value={municipalitySearch}
                      onChange={(event) => handleMunicipalityInput(event.target.value)}
                      helper={cityError || "Digite 3+ letras para buscar e selecionar."}
                      placeholder="Comece digitando o município"
                      disabled={!state || isLoadingCities}
                      required
                      list="municipality-options"
                      autoComplete="off"
                    />
                    <datalist id="municipality-options">
                      {filteredMunicipalities.map((city) => (
                        <option key={city.code} value={city.name} />
                      ))}
                    </datalist>
                  </div>
                  <Select
                    name="regionIBGE"
                    label="Região epidemiológica (informativa)"
                    value={regionIBGE}
                    onChange={(event) => setRegionIBGE(event.target.value)}
                    helper="Opcional. Preenchida automaticamente quando disponível."
                    disabled={!state || isLoadingCities}
                  >
                    <option value="">{isLoadingCities ? "Carregando..." : "Selecione a região (opcional)"}</option>
                    {regionIBGEOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  name="localidadeAproximada"
                  label="Localidade aproximada (opcional)"
                  placeholder="Ex.: zona rural norte, bairro centro, interior"
                  value={localidadeAproximada}
                  onChange={(event) => setLocalidadeAproximada(event.target.value)}
                  maxLength={80}
                  helper="Não informar endereço exato."
                />

                <div className="rounded-xl bg-white p-3 text-sm text-slate-800 shadow-inner">
                  <p className="font-semibold text-emerald-800">{locationMessage}</p>
                  <p className="text-xs text-slate-600">Sem GPS detalhado ou dados de tutor.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Observação rápida (suspeita clínica) — opcional
                  </p>
                  <span className="text-xs text-slate-500">{notes.length}/250</span>
                </div>
                <div className="flex items-start gap-3">
                  <Textarea
                    name="notes"
                    placeholder="Suspeita clínica resumida (ex: “neurológico agudo”, “actinomicose”) + contexto breve."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value.slice(0, 250))}
                    rows={4}
                    maxLength={250}
                    helper="Suspeita clínica resumida (ex: “neurológico agudo”, “actinomicose”) + contexto breve. Máx. 250 caracteres."
                    containerClassName="flex-1"
                  />
                  <button
                    type="button"
                    className="mt-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSpeechToText}
                    disabled={!SpeechRecognition}
                  >
                    🎤 Ditado
                  </button>
                </div>
              </div>

            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">Revisão antes do envio</p>
                <p className="text-sm text-slate-600">
                  Confira cada item e confirme para registrar o alerta.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-900">
                <ul className="space-y-1">
                  <li>• Confira novamente a espécie antes de enviar.</li>
                  <li>• Alertas são anônimos e não substituem notificações oficiais.</li>
                  <li>• Erros são esperados no trabalho de campo — revise com calma.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-800 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sinal e espécie</p>
                    <ul className="space-y-1">
                      <li>• Sinal: {alertType || "—"}</li>
                      {alertDetails.length > 0 && <li>• Detalhes: {alertDetails.join(", ")}</li>}
                      <li>• Espécie: {species || "—"}</li>
                      <li>• Nº animais: {herdCount || "—"}</li>
                      <li>• Gravidade: {severity || "—"}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contexto</p>
                    <ul className="space-y-1">
                      <li>• Início: {eventOnset || "—"}</li>
                      <li>• Mudança recente: {recentChanges || "—"}</li>
                      <li>• Alimentação: {feedChange || "—"}</li>
                      <li>• Tipo de alimento: {feedType.length > 0 ? feedType.join(", ") : "—"}</li>
                      <li>• Origem: {feedOrigin || "—"}</li>
                      <li>• Medicamentos/vacinas: {drugExposure || "—"}</li>
                      <li>• Categoria: {drugCategory.length > 0 ? drugCategory.join(", ") : "—"}</li>
                      <li>• Intervalo: {drugInterval || "—"}</li>
                      <li>
                        • Ambiental: {environmentSignals.length > 0 ? environmentSignals.join(", ") : "—"}
                      </li>
                      <li>• Casos semelhantes: {regionalPattern || "—"}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-slate-800">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Região</p>
                    <ul className="space-y-1">
                      <li>
                        • País/UF: {country} / {state}
                      </li>
                      <li>• Região (IBGE): {regionIBGE || "—"}</li>
                      <li>• Município: {cityName || "—"}</li>
                      <li>• Localidade aproximada: {localidadeAproximada || "—"}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Observação</p>
                    <p className="rounded-xl bg-white p-3 text-sm text-slate-700 shadow-inner">
                      {notes.trim() ? notes.trim() : "Sem observações adicionais."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold">{submitError}</p>
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

          {step === 6 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={goBack}>
                Voltar para editar
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto px-6 py-3 text-base"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Registrando..." : "Confirmar e enviar"}
              </Button>
            </div>
          ) : (
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
              <Button type="button" className="w-full sm:w-auto px-6 py-3 text-base" onClick={handleNext}>
                Próximo
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
