import { notFound } from "next/navigation";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { isV2Enabled } from "../../../lib/v2/config";

export const dynamic = "force-dynamic";

export default function ConfirmationV2Page() {
  if (!isV2Enabled()) notFound();
  return <div className="mx-auto max-w-xl px-4 py-16"><Card className="space-y-4 p-6"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Observação registrada</p><h1 className="text-2xl font-semibold">O registro foi recebido.</h1><p className="text-slate-700">Ele será usado de forma agregada para compor uma leitura territorial. A decisão técnica continua com os responsáveis.</p><p className="text-sm text-slate-600">O VetAlert não substitui avaliação profissional nem comunicação obrigatória pelo canal oficial aplicável.</p><Button href="/v2/onboarding">Registrar outra observação</Button></Card></div>;
}
