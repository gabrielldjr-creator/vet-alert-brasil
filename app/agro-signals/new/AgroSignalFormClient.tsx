"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/Card";
import { Select } from "../../../components/Select";
import { Input } from "../../../components/Input";
import { Textarea } from "../../../components/Textarea";
import { Button } from "../../../components/Button";
import { auth, db } from "../../../lib/firebase";
import { fetchMunicipalities, MunicipalityOption, stateOptions } from "../../../lib/regions";

const speciesOptions = ["Bovinos", "Equinos", "Suínos", "Aves", "Pequenos animais", "Silvestres", "Outros"];
const symptomOptions = ["Diarreia", "Febre", "Sem apetite", "Claudicação", "Sintoma respiratório", "Mortalidade", "Outro"];
const productCategoryOptions = ["Antibiótico", "Vermífugo", "Suplemento", "Anti-inflamatório", "Vacina", "Outro"];

export default function AgroSignalFormClient() {
  const router = useRouter();
  const [species, setSpecies] = useState("");
  const [symptom, setSymptom] = useState("");
  const [symptomDescription, setSymptomDescription] = useState("");
  const [productSold, setProductSold] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [state, setState] = useState("SC");
  const [cityCode, setCityCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [hasPrescription, setHasPrescription] = useState("");
  const [durationType, setDurationType] = useState<"recent" | "ongoing" | "">("");
  const [durationDays, setDurationDays] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingCities(true);
      try {
        const data = await fetchMunicipalities(state);
        if (!active) return;
        setMunicipalities(data);
      } catch {
        if (!active) return;
        setMunicipalities([]);
      } finally {
        if (active) setLoadingCities(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [state]);

  const municipalityOptions = useMemo(
    () => municipalities.map((m) => ({ value: String(m.code), label: m.name })),
    [municipalities]
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!species || !symptom || !productSold || !productCategory || !state || !cityCode || !hasPrescription || !durationType) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (durationType === "ongoing" && !durationDays) {
      setError("Informe a quantidade de dias para duração contínua.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedMunicipality = municipalities.find((m) => String(m.code) === cityCode);
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      await user.getIdToken();

      await addDoc(collection(db, "alerts"), {
        createdAt: serverTimestamp(),
        source: "agro_retail",
        signalType: "field_retail",
        state,
        cityCode: Number(cityCode),
        city: selectedMunicipality?.name || cityName || undefined,
        cityName: selectedMunicipality?.name || cityName || undefined,
        municipality: selectedMunicipality?.name || cityName || undefined,
        species,
        alertType: symptom,
        severity: "Não classificado",
        alertGroup: "Sinal de Campo",
        cases: null,
        herdCount: "Não informado",
        context: {
          country: "Brasil",
          notes: notes.trim(),
          alertDetails: [
            `Sintoma reportado: ${symptom}`,
            ...(symptomDescription.trim() ? [`Detalhe sintoma: ${symptomDescription.trim()}`] : []),
            `Produto vendido: ${productSold.trim()}`,
            `Categoria do produto: ${productCategory}`,
            `Prescrição veterinária: ${hasPrescription}`,
            `Duração: ${durationType === "recent" ? "Recente" : `${durationDays} dia(s)`}`,
          ],
          retailSignal: {
            productSold: productSold.trim(),
            productCategory,
            veterinaryPrescription: hasPrescription,
            durationType,
            durationDays: durationType === "ongoing" ? Number(durationDays) : null,
          },
        },
      });

      router.push("/global-alerts-dashboard");
    } catch {
      setError("Erro ao salvar sinal. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Novo Sinal de Campo</h1>
          <p className="mt-1 text-sm text-slate-600">Registro comercial de sinal observado no ponto de venda.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Select label="Espécie" value={species} onChange={(e) => setSpecies(e.target.value)} required>
            <option value="">Selecione</option>
            {speciesOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>

          <Select label="Sintoma reportado" value={symptom} onChange={(e) => setSymptom(e.target.value)} required>
            <option value="">Selecione</option>
            {symptomOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>

          <Textarea label="Descrição adicional do sintoma" value={symptomDescription} onChange={(e) => setSymptomDescription(e.target.value)} />

          <Input label="Produto vendido" value={productSold} onChange={(e) => setProductSold(e.target.value)} required />

          <Select label="Categoria do produto" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} required>
            <option value="">Selecione</option>
            {productCategoryOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Estado" value={state} onChange={(e) => { setState(e.target.value); setCityCode(""); setCityName(""); }} required>
              {stateOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>

            <Select label="Município" value={cityCode} onChange={(e) => { setCityCode(e.target.value); setCityName(municipalities.find((m) => String(m.code) === e.target.value)?.name ?? ""); }} required>
              <option value="">{loadingCities ? "Carregando..." : "Selecione"}</option>
              {municipalityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>

          <Select label="Prescrição veterinária?" value={hasPrescription} onChange={(e) => setHasPrescription(e.target.value)} required>
            <option value="">Selecione</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </Select>

          <Select label="Duração do problema" value={durationType} onChange={(e) => setDurationType(e.target.value as "recent" | "ongoing" | "")} required>
            <option value="">Selecione</option>
            <option value="recent">Recente</option>
            <option value="ongoing">Contínuo (dias)</option>
          </Select>

          {durationType === "ongoing" && (
            <Input type="number" min={1} label="Quantidade de dias" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required />
          )}

          <Textarea label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Registrar Sinal de Campo"}</Button>
            <Button type="button" variant="secondary" href="/global-alerts-dashboard">Voltar à Inteligência de Alertas</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
