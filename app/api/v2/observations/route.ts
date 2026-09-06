import { AccessError, verifyRequestToken } from "../../../../lib/v2/server-auth";
import { isV2Enabled } from "../../../../lib/v2/config";
import { validateObservationV2 } from "../../../../lib/v2/schema";
import { persistObservationV2 } from "../../../../lib/v2/submission";

export const runtime = "nodejs";

const json = (body: unknown, status: number) => Response.json(body, {
  status,
  headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
});

export async function POST(request: Request) {
  if (!isV2Enabled()) return json({ error: "V2 indisponível" }, 404);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Content-Type inválido" }, 415);
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 16384) return json({ error: "Payload excede o limite" }, 413);
  try {
    const token = await verifyRequestToken(request);
    const body: unknown = await request.json();
    if (JSON.stringify(body).length > 16384) return json({ error: "Payload excede o limite" }, 413);
    const validation = validateObservationV2(body);
    if (!validation.ok) return json({ error: "Payload inválido", details: validation.errors }, 400);
    const result = await persistObservationV2(validation.value, token.uid);
    return json(result, 201);
  } catch (error) {
    if (error instanceof AccessError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "JSON inválido" }, 400);
    return json({ error: "Não foi possível receber a observação" }, 503);
  }
}
