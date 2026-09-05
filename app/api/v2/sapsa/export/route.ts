import { isV2Enabled } from "../../../../../lib/v2/config";
import { renderSapsaCsv } from "../../../../../lib/v2/export";
import { AccessError, requireSapsaRole, verifyRequestToken } from "../../../../../lib/v2/server-auth";
import { auditSapsaExport, loadSapsaSummary } from "../../../../../lib/v2/sapsa-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isV2Enabled()) return Response.json({ error: "V2 indisponível" }, { status: 404 });
  try {
    const token = await verifyRequestToken(request);
    requireSapsaRole(token);
    const summary = await loadSapsaSummary();
    const csv = renderSapsaCsv(summary);
    await auditSapsaExport(token.uid, summary.cells.length);
    return new Response(csv, { headers: { "Cache-Control": "private, no-store", "Content-Disposition": "attachment; filename=sapsa-v2-aggregated.csv", "Content-Type": "text/csv; charset=utf-8" } });
  } catch (error) {
    if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Exportação indisponível" }, { status: 503 });
  }
}
