"use client";

import { FormEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Select } from "./Select";
import { auth, db } from "../lib/firebase";

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

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const nome = String(formData.get("nome") || "").trim();
    const crmvUF = String(formData.get("crmvUF") || "").trim();
    const crmvNumero = String(formData.get("crmvNumero") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const senha = String(formData.get("senha") || "");

    if (!nome || !crmvUF || !crmvNumero || !email || !senha) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    const crmv = `${crmvUF}-${crmvNumero}`;

    try {
      let result: UserCredential;
      try {
        result = await signInWithEmailAndPassword(auth, email, senha);
      } catch (authError) {
        console.error("Firebase Auth erro (login)", authError);
        if (authError instanceof FirebaseError && authError.code === "auth/user-not-found") {
          result = await createUserWithEmailAndPassword(auth, email, senha);
        } else {
          throw authError;
        }
      }

      const user = result.user;

      await setDoc(
        doc(db, "veterinarios", user.uid),
        {
          nome,
          email: user.email ?? email,
          crmv,
          estado: crmvUF,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      router.push("/dashboard");
    } catch (submitError) {
      console.error(submitError);
      setError("Não foi possível autenticar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Login</p>
        <h2 className="text-2xl font-semibold text-slate-900">Identifique-se com seu CRMV</h2>
        <p className="text-sm text-slate-600">
          Autenticação com Firebase (e-mail/senha). Se o e-mail não existir, criaremos seu acesso automaticamente.
        </p>
      </div>
      <form className="space-y-4" aria-label="Formulário de login de veterinários" onSubmit={handleSubmit}>
        <Input name="nome" label="Nome completo" autoComplete="name" placeholder="Nome e sobrenome" required />
        <div className="grid gap-3 sm:grid-cols-[140px,1fr]">
          <Select
            name="crmvUF"
            label="CRMV - Estado"
            defaultValue=""
            aria-label="Estado do CRMV"
            helper="Define a região padrão do painel."
            required
          >
            <option value="" disabled>
              Selecione UF
            </option>
            {states.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
          <Input
            name="crmvNumero"
            label="CRMV - Número"
            placeholder="Ex.: 12345"
            inputMode="numeric"
            autoComplete="off"
            helper="Usado para validar registro profissional futuramente."
            required
          />
        </div>
        <Input
          name="email"
          type="email"
          label="E-mail profissional"
          placeholder="email@dominio.com"
          autoComplete="email"
          required
        />
        <Input
          name="senha"
          type="password"
          label="Senha"
          placeholder="Mínimo 8 caracteres"
          autoComplete="current-password"
          required
        />
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          O estado informado aqui será salvo como região base e aplicado automaticamente ao painel após autenticação.
        </div>
        <Button type="submit" className="w-full">
          {loading ? "Autenticando..." : "Entrar e ir para o painel"}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <p className="text-xs text-slate-500">
          Ao continuar, você confirma ser médico-veterinário com CRMV ativo. Nenhuma área pública é exibida além desta página de login.
        </p>
      </form>
    </Card>
  );
}
