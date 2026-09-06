"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../../lib/firebase";
import { stateOptions, type MunicipalityOption } from "../../../lib/regions";
import { V2_CONSENT_VERSION } from "../../../lib/v2/config";
import { validateObservationV2, type VeterinaryObservationV2Input } from "../../../lib/v2/schema";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Select } from "../../../components/Select";

const species = [
  ["bovinos", "Bovinos"], ["equinos", "Equinos"], ["suinos", "Suínos"], ["aves", "Aves"],
  ["pequenos_animais", "Pequenos animais"], ["silvestres", "Silvestres"], ["outros_producao", "Outros animais de produção"],
] as const;
const patterns = [
  ["respiratorio", "manifestacao_respiratoria_observada", "Manifestação respiratória observada"],
  ["digestivo", "manifestacao_digestiva_observada", "Manifestação digestiva observada"],
  ["locomotor", "alteracao_locomotora_observada", "Alteração locomotora observada"],
  ["neurologico", "alteracao_neurologica_observada", "Alteração neurológica observada"],
  ["dermatologico", "alteracao_dermatologica_observada", "Alteração dermatológica observada"],
  ["reprodutivo", "alteracao_reprodutiva_observada", "Alteração reprodutiva observada"],
  ["populacional", "aumento_percebido_ocorrencias", "Aumento percebido de ocorrências"],
  ["populacional", "mudanca_observada_periodo", "Mudança observada no período"],
] as const;
const bands = [["1", "1 animal"], ["2_5", "2 a 5 animais"], ["6_20", "6 a 20 animais"], ["mais_20", "Mais de 20 animais"]] as const;
const attention = [["observed", "Observado"], ["elevated", "Atenção elevada"], ["urgent", "Urgente — percepção profissional"]] as const;
const periods = [["ultimas_24h", "Últimas 24 horas"], ["ultimos_7d", "Últimos 7 dias"], ["ultimos_30d", "Últimos 30 dias"]] as const;

export default function AlertFormClientV2() {
  const router = useRouter();
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [step, setStep] = useState(0);
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [territoryError, setTerritoryError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);
  const stepHeadingRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [form, setForm] = useState({ stateCode: "", municipalityCode: "", species: "", signalGroup: "", observedPattern: "", animalCountBand: "", attentionLevel: "", observationPeriod: "", category: "", activeIngredient: "", exposure: "", interval: "" });

  useEffect(() => {
    let active = true;
    if (!form.stateCode) return;
    fetch(`/api/v2/territories?state=${encodeURIComponent(form.stateCode)}`)
      .then((response) => {
        if (!response.ok) throw new Error("territory_lookup_failed");
        return response.json() as Promise<MunicipalityOption[]>;
      })
      .then((items) => { if (active) { setMunicipalities(items); setTerritoryError(""); } })
      .catch(() => { if (active) { setMunicipalities([]); setTerritoryError("Não foi possível carregar os municípios. O município continua opcional; você pode enviar somente a UF."); } });
    return () => { active = false; };
  }, [form.stateCode]);

  useEffect(() => {
    if (onboardingStep >= 3) stepHeadingRef.current?.focus();
  }, [onboardingStep, step]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const selectedPattern = useMemo(() => patterns.find((item) => item[1] === form.observedPattern), [form.observedPattern]);
  const stepValid = step === 0
    ? Boolean(form.species && form.observedPattern && form.animalCountBand && form.attentionLevel)
    : step === 1 ? Boolean(form.stateCode && form.observationPeriod) : true;

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(""); setSubmitting(true);
    try {
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const token = await user.getIdToken();
      const therapeuticContext = Object.fromEntries(Object.entries({ category: form.category, activeIngredient: form.activeIngredient, exposure: form.exposure, interval: form.interval }).filter(([, value]) => value));
      const payload: VeterinaryObservationV2Input = {
        territory: { stateCode: form.stateCode, ...(form.municipalityCode ? { municipalityCode: form.municipalityCode } : {}) },
        species: form.species as VeterinaryObservationV2Input["species"],
        signalGroup: selectedPattern?.[0] as VeterinaryObservationV2Input["signalGroup"],
        observedPattern: form.observedPattern as VeterinaryObservationV2Input["observedPattern"],
        animalCountBand: form.animalCountBand as VeterinaryObservationV2Input["animalCountBand"],
        attentionLevel: form.attentionLevel as VeterinaryObservationV2Input["attentionLevel"],
        observationPeriod: form.observationPeriod as VeterinaryObservationV2Input["observationPeriod"],
        ...(Object.keys(therapeuticContext).length ? { therapeuticContext: therapeuticContext as VeterinaryObservationV2Input["therapeuticContext"] } : {}),
        consentVersion: V2_CONSENT_VERSION,
      };
      const validation = validateObservationV2(payload);
      if (!validation.ok) throw new Error("invalid_payload");
      const response = await fetch("/api/v2/observations", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(validation.value) });
      if (!response.ok) throw new Error("submission_failed");
      router.push("/v2/confirmacao");
    } catch { setError("Não foi possível registrar agora. Seus dados não foram enviados; tente novamente."); }
    finally { submittingRef.current = false; setSubmitting(false); }
  };

  if (onboardingStep < 3) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <Card className="space-y-5 border-emerald-100 bg-emerald-50/70 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">VetAlert V2 · piloto controlado</p>
          {onboardingStep === 0 ? <>
            <h1 className="text-3xl font-semibold text-slate-900">Registre o que você observa no campo.</h1>
            <p className="text-slate-700">O seu registro ajuda a transformar observações isoladas em uma leitura territorial mais completa. Você registra no VetAlert; o SAPSA organiza convergências por território, espécie e período.</p>
            {showHowItWorks ? <div className="rounded-xl bg-white p-4 text-sm text-slate-700"><p>O VetAlert recebe uma observação estruturada sem nomes ou texto livre. O SAPSA reúne apenas resultados agregados, aplica proteção de pequenas células e apresenta padrões para revisão humana.</p></div> : null}
            <div className="flex flex-wrap gap-3"><Button type="button" onClick={() => setOnboardingStep(1)}>Começar</Button><Button type="button" variant="secondary" onClick={() => setShowHowItWorks((value) => !value)} aria-expanded={showHowItWorks}>Como funciona</Button></div>
          </> : null}
          {onboardingStep === 1 ? <>
            <p className="text-sm font-semibold text-emerald-800">Confiança e uso</p>
            <h1 className="text-2xl font-semibold text-slate-900">Uma observação estruturada, para leitura agregada.</h1>
            <p className="text-slate-700">O formulário registra uma observação estruturada da rotina veterinária. A leitura para organizações é agregada e serve como contexto para revisão técnica. Ela não substitui a avaliação profissional nem o canal oficial aplicável.</p>
            <div className="flex justify-between gap-3"><Button type="button" variant="secondary" onClick={() => setOnboardingStep(0)}>Voltar</Button><Button type="button" onClick={() => setOnboardingStep(2)}>Continuar</Button></div>
          </> : null}
          {onboardingStep === 2 ? <>
            <p className="text-sm font-semibold text-emerald-800">Configuração mínima</p>
            <h1 className="text-2xl font-semibold text-slate-900">Defina seu foco inicial.</h1>
            <p className="text-sm text-slate-600">Escolha apenas território e espécie. Não solicitamos nome, CRMV, produtor, propriedade, GPS ou endereço.</p>
            <Select name="setupStateCode" label="Território de atuação (UF)" value={form.stateCode} onChange={(event) => setForm((current) => ({ ...current, stateCode: event.target.value, municipalityCode: "" }))} required><option value="">Selecione</option>{stateOptions.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            <Select name="setupSpecies" label="Espécie ou grupo de produção" value={form.species} onChange={(event) => update("species", event.target.value)} required><option value="">Selecione</option>{species.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            <div className="flex justify-between gap-3"><Button type="button" variant="secondary" onClick={() => setOnboardingStep(1)}>Voltar</Button><Button type="button" onClick={() => setOnboardingStep(3)} disabled={!form.stateCode || !form.species}>Continuar para o registro</Button></div>
          </> : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <Card className="space-y-3 border-emerald-100 bg-emerald-50/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">VetAlert V2 · piloto controlado</p>
        <h1 className="text-3xl font-semibold text-slate-900">Registre o que você observa no campo.</h1>
        <p className="text-slate-700">O seu registro ajuda a transformar observações isoladas em uma leitura territorial mais completa. Você registra no VetAlert; o SAPSA organiza convergências por território, espécie e período.</p>
        <p className="text-sm text-slate-600">A leitura institucional é agregada e serve como contexto para revisão técnica. Não substitui avaliação profissional nem o canal oficial aplicável.</p>
      </Card>

      <Card className="p-6">
        <div ref={stepHeadingRef} tabIndex={-1} className="mb-6 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" aria-busy={submitting} aria-live="polite"><p className="text-sm font-semibold">Etapa {step + 1} de 3</p><p className="text-sm text-slate-600">{step === 0 ? "O que foi observado?" : step === 1 ? "Em que território e período?" : "Revisar e enviar."}</p></div>
        {step === 0 ? <fieldset className="space-y-4"><legend className="text-xl font-semibold">Observação estruturada</legend>
          <Select name="species" label="Espécie" value={form.species} onChange={(event) => update("species", event.target.value)} required><option value="">Selecione</option>{species.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <Select name="observedPattern" label="Manifestação observada" value={form.observedPattern} onChange={(event) => update("observedPattern", event.target.value)} required><option value="">Selecione</option>{patterns.map(([, value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <Select name="animalCountBand" label="Faixa de animais envolvidos" value={form.animalCountBand} onChange={(event) => update("animalCountBand", event.target.value)} required><option value="">Selecione</option>{bands.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <Select name="attentionLevel" label="Nível de atenção percebido" helper="Percepção do profissional; não é classificação clínica automática." value={form.attentionLevel} onChange={(event) => update("attentionLevel", event.target.value)} required><option value="">Selecione</option>{attention.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        </fieldset> : null}
        {step === 1 ? <fieldset className="space-y-4"><legend className="text-xl font-semibold">Território, período e contexto opcional</legend>
          <p className="text-sm text-slate-600">Escolha o território. Não usamos GPS nem geolocalização por IP.</p>
          <Select name="stateCode" label="Estado" value={form.stateCode} onChange={(event) => setForm((current) => ({ ...current, stateCode: event.target.value, municipalityCode: "" }))} required><option value="">Selecione</option>{stateOptions.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
          <Select name="municipalityCode" label="Município (opcional)" value={form.municipalityCode} onChange={(event) => update("municipalityCode", event.target.value)} disabled={!form.stateCode}><option value="">Não informar</option>{municipalities.map((item) => <option key={item.code} value={String(item.code)}>{item.name}</option>)}</Select>
          {territoryError ? <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{territoryError}</p> : null}
          <Select name="observationPeriod" label="Período da observação" value={form.observationPeriod} onChange={(event) => update("observationPeriod", event.target.value)} required><option value="">Selecione</option>{periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Contexto terapêutico controlado (opcional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select name="therapeuticExposure" label="Exposição" value={form.exposure} onChange={(e) => update("exposure", e.target.value)}><option value="">Não informar</option><option value="sim">Sim</option><option value="nao">Não</option><option value="desconhecido">Desconhecido</option></Select>
            <Select name="therapeuticCategory" label="Categoria" value={form.category} onChange={(e) => update("category", e.target.value)}><option value="">Não informar</option><option value="antibiotico">Antibiótico</option><option value="antiparasitario">Antiparasitário</option><option value="anti_inflamatorio">Anti-inflamatório</option><option value="vacina">Vacina</option></Select>
            <Select name="activeIngredient" label="Princípio ativo" value={form.activeIngredient} onChange={(e) => update("activeIngredient", e.target.value)}><option value="">Não informar</option><option value="amoxicilina">Amoxicilina</option><option value="doxiciclina">Doxiciclina</option><option value="ivermectina">Ivermectina</option><option value="meloxicam">Meloxicam</option><option value="oxitetraciclina">Oxitetraciclina</option></Select>
            <Select name="therapeuticInterval" label="Intervalo" value={form.interval} onChange={(e) => update("interval", e.target.value)}><option value="">Não informar</option><option value="menos_24h">Menos de 24h</option><option value="1_3d">1–3 dias</option><option value="4_14d">4–14 dias</option><option value="mais_14d">Mais de 14 dias</option></Select>
          </div></details>
        </fieldset> : null}
        {step === 2 ? <section className="space-y-4"><h2 className="text-xl font-semibold">Revisão</h2><dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Espécie</dt><dd>{species.find(([value]) => value === form.species)?.[1]}</dd></div><div><dt className="font-semibold">Manifestação</dt><dd>{selectedPattern?.[2]}</dd></div><div><dt className="font-semibold">Território</dt><dd>{form.stateCode}{form.municipalityCode ? ` · IBGE ${form.municipalityCode}` : ""}</dd></div><div><dt className="font-semibold">Período</dt><dd>{periods.find(([value]) => value === form.observationPeriod)?.[1]}</dd></div></dl><p className="text-sm text-slate-600">Não informe nomes, CRMV, produtor, propriedade, empresa, marca ou fabricante. Este fluxo não possui campo livre.</p><p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">O VetAlert não é canal oficial do MAPA. Se a situação puder exigir comunicação obrigatória, consulte o canal oficial aplicável.</p></section> : null}
        {error ? <p ref={errorRef} tabIndex={-1} role="alert" className="mt-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 text-sm font-semibold text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-between gap-3"><Button type="button" variant="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || submitting}>Voltar</Button>{step < 2 ? <Button type="button" onClick={() => setStep((value) => value + 1)} disabled={!stepValid}>Continuar</Button> : <Button type="button" onClick={submit} disabled={submitting}>{submitting ? "Enviando…" : "Enviar observação"}</Button>}</div>
      </Card>
    </div>
  );
}
