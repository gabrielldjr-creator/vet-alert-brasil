import { createHmac } from "node:crypto";

export const SAPSA_ROLES = new Set(["sapsa_analyst", "admin"]);

export function hasSapsaRole(claims: Record<string, unknown>) {
  const direct = typeof claims.role === "string" ? [claims.role] : [];
  const multiple = Array.isArray(claims.roles) ? claims.roles.filter((role): role is string => typeof role === "string") : [];
  return [...direct, ...multiple].some((role) => SAPSA_ROLES.has(role));
}

export function hmacDigest(secret: string, namespace: string, value: string) {
  if (secret.length < 32) throw new Error("VETALERT_V2_INTEGRITY_SECRET deve ter ao menos 32 caracteres");
  return createHmac("sha256", secret).update(`${namespace}:${value}`, "utf8").digest("hex");
}

export function stableFingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableFingerprint).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableFingerprint(nested)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
