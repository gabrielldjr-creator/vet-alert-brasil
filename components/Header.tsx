import Link from "next/link";

const links = [
  { href: "/alerta/novo", label: "Registrar alerta" },
  { href: "/dashboard", label: "Alertas regionais" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-50 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-emerald-800">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-base font-bold text-emerald-800">
            V
          </span>
          <div className="leading-tight">
            <div className="text-sm uppercase tracking-wide text-emerald-700">Vet Alert</div>
            <div className="text-base">Brasil</div>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
