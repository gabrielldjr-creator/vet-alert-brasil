import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "./firebase-admin";
import { hasSapsaRole } from "./security";

export class AccessError extends Error {
  constructor(public status: 401 | 403, message: string) { super(message); }
}

export async function verifyRequestToken(request: Request): Promise<DecodedIdToken> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new AccessError(401, "Autenticação obrigatória");
  try {
    return await getAdminAuth().verifyIdToken(header.slice(7), true);
  } catch {
    throw new AccessError(401, "Token inválido ou expirado");
  }
}

export function requireSapsaRole(token: DecodedIdToken) {
  if (!hasSapsaRole(token as Record<string, unknown>)) throw new AccessError(403, "Papel SAPSA obrigatório");
}
