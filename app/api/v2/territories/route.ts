import { NextResponse } from "next/server";
import { isV2Enabled } from "../../../../lib/v2/config";
import { getOfficialMunicipalitiesByState, IBGE_MUNICIPALITY_CATALOG_VERSION } from "../../../../lib/v2/municipalities";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const responseOptions = { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-IBGE-Catalog-Version": IBGE_MUNICIPALITY_CATALOG_VERSION } };
  if (!isV2Enabled()) return NextResponse.json({ error: "not_found" }, { status: 404, ...responseOptions });
  const state = new URL(request.url).searchParams.get("state")?.toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(state)) return NextResponse.json({ error: "invalid_state" }, { status: 400, ...responseOptions });
  const municipalities = getOfficialMunicipalitiesByState(state);
  if (!municipalities.length) return NextResponse.json({ error: "invalid_state" }, { status: 400, ...responseOptions });
  return NextResponse.json(municipalities, responseOptions);
}
