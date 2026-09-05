import { isV2Enabled } from "../../../../../lib/v2/config";
import { AccessError, requireSapsaRole, verifyRequestToken } from "../../../../../lib/v2/server-auth";
import { loadSapsaSummary } from "../../../../../lib/v2/sapsa-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isV2Enabled()) return Response.json({ error: "V2 indisponível" }, { status: 404 });
  try {
    const token = await verifyRequestToken(request);
    requireSapsaRole(token);
    const summary = await loadSapsaSummary();
    return Response.json(summary, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Resumo indisponível" }, { status: 503 });
  }
}
