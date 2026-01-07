import Link from "next/link";

export function AccessRestricted() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccess = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await ensurePilotAuth();
      router.push("/alerta/novo");
    } catch (authError) {
      console.error("Erro ao iniciar sessão técnica", authError);
      setError(authError instanceof Error ? authError.message : "Falha ao iniciar sessão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-slate-900">Registrar alerta</h2>
      <p className="text-sm text-slate-600">Entrada direta para o formulário do piloto.</p>
      <Link
        href="/alerta/novo"
        data-testid="pilot-alert-link"
        className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
      >
        Registrar alerta agora
      </Link>
    </div>
  );
}
