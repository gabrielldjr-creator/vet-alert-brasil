import { NextResponse } from "next/server";
import { isV2Enabled } from "../../../../lib/v2/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isV2Enabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const state = new URL(request.url).searchParams.get("state")?.toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(state)) return NextResponse.json({ error: "invalid_state" }, { status: 400 });

  const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });
  if (!response.ok) return NextResponse.json({ error: "territory_lookup_failed" }, { status: 502 });
  const data = await response.json() as Array<{ id: number; nome: string }>;
  return NextResponse.json(data.map((item) => ({ code: item.id, name: item.nome })));
}
