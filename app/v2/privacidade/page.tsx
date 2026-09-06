import { notFound } from "next/navigation";
import { Card } from "../../../components/Card";
import { isV2Enabled } from "../../../lib/v2/config";

export const dynamic = "force-dynamic";

export default function VetAlertV2PrivacyPage() {
  if (!isV2Enabled()) notFound();
  return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><Card className="space-y-4 p-6"><h1 className="text-3xl font-semibold">Privacidade do piloto V2</h1><p>O formulário V2 não solicita nome, CRMV, contato, produtor, propriedade, empresa, marca, fabricante, endereço, GPS ou texto livre.</p><p>Um identificador técnico de autenticação é verificado pelo servidor e transformado em digest protegido para controle de abuso; ele não é copiado para a observação nem exibido no SAPSA. Provedores de infraestrutura ainda podem registrar IP, navegador e horários em logs operacionais.</p><p>A leitura institucional é agregada, usa supressão de pequenas células e não apresenta registros individuais. Retenção, acesso e exclusão dependem da governança operacional documentada antes do piloto.</p><p>Este desenho prioriza minimização e controle de acesso; não representa declaração de conformidade jurídica concluída nem promessa de anonimato absoluto.</p></Card></div>;
}
