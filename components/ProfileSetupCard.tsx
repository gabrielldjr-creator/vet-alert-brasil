"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../lib/firebase";
import { stateOptions } from "../lib/regions";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Select } from "./Select";

type ProfileSetupCardProps = {
  defaultState?: string;
  defaultCity?: string;
  onComplete: (profile: { state: string; city?: string }) => void;
  title?: string;
  description?: string;
};

export function ProfileSetupCard({
  defaultState = "",
  defaultCity = "",
  onComplete,
  title = "Complete seu perfil regional",
  description = "Confirme o estado CRMV para liberar o registro imediato de alertas.",
}: ProfileSetupCardProps) {
  const [stateValue, setStateValue] = useState(defaultState);
  const [cityValue, setCityValue] = useState(defaultCity);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stateValue) {
      setError("Informe o estado CRMV para continuar.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("Sessão expirada. Acesse novamente com o link recebido.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await setDoc(
        doc(db, "vetProfiles", user.uid),
        {
          email: user.email ?? "",
          state: stateValue,
          city: cityValue ? cityValue.trim() : "",
          role: "vet",
          verified: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      onComplete({ state: stateValue, city: cityValue ? cityValue.trim() : "" });
    } catch (profileError) {
      console.error("Erro ao criar perfil do veterinário", profileError);
      setError("Não foi possível salvar o perfil. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <Card className="space-y-3 p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Primeiro acesso</p>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Select
            label="Estado CRMV (obrigatório)"
            name="estadoCrmv"
            value={stateValue}
            onChange={(event) => setStateValue(event.target.value)}
            helper="Usado para filtrar alertas regionais."
          >
            <option value="">Selecione</option>
            {stateOptions.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>

          <Input
            label="Cidade (opcional)"
            name="cidade"
            value={cityValue}
            onChange={(event) => setCityValue(event.target.value)}
            placeholder="Ex.: Campo Grande"
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ativando..." : "Ativar sessão"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
