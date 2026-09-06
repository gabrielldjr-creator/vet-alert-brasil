import { AccessError, verifyRequestToken } from "../../../../lib/v2/server-auth";
import { isV2Enabled } from "../../../../lib/v2/config";
import { validateObservationV2 } from "../../../../lib/v2/schema";
import { persistObservationV2 } from "../../../../lib/v2/submission";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isV2Enabled()) return Response.json({ error: "V2 indisponível" }, { status: 404 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return Response.json({ error: "Content-Type inválido" }, { status: 415 });
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 16384) return Response.json({ error: "Payload excede o limite" }, { status: 413 });
  try {
    const token = await verifyRequestToken(request);
    const body: unknown = await request.json();
    if (JSON.stringify(body).length > 16384) return Response.json({ error: "Payload excede o limite" }, { status: 413 });
    const validation = validateObservationV2(body);
    if (!validation.ok) return Response.json({ error: "Payload inválido", details: validation.errors }, { status: 400 });
    const result = await persistObservationV2(validation.value, token.uid);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível receber a observação" }, { status: 503 });
  }
}
