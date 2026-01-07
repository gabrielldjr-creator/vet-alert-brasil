import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Painel" },
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
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-1 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
            >
              {link.label}
            </Link>
          ))}
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            Acesso restrito a veterinários
          </span>
        </nav>
        <Link
          href="/acesso"
          className="hidden rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:inline-flex"
        >
          Entenda o acesso
        </Link>
      </div>
    </header>
  );
}
