import Link from "next/link";

export function AccessButton({ label = "Registrar alerta" }: { label?: string }) {
  return (
    <Link
      href="/alerta/novo"
      className="rounded-lg border border-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
    >
      {label}
    </Link>
  );
}
