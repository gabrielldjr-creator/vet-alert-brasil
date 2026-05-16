import Link from "next/link";
import { BRANDING } from "../lib/branding";

const intakeLinks = [
  { href: "/alerta/novo", label: BRANDING.intake.navLabelVet },
  { href: "/agro-signals/new", label: BRANDING.intake.navLabelAgro },
];

const intelligenceLinks = [
  { href: "/global-alerts-dashboard", label: BRANDING.intelligence.navLabelDashboard },
  { href: "/terminal", label: BRANDING.intelligence.navLabelTerminal },
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
            <div className="text-sm uppercase tracking-wide text-emerald-700">{BRANDING.intake.product}</div>
            <div className="text-base">Brasil · {BRANDING.intelligence.product}</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 sm:flex" aria-label="Navegação de produtos">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">VetAlert</span>
              {intakeLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-2 py-1 transition-colors hover:bg-emerald-100 hover:text-emerald-900">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">SAPSA</span>
              {intelligenceLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-2 py-1 transition-colors hover:bg-slate-200 hover:text-slate-900">
                  {link.label}
                </Link>
              ))}
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
              {BRANDING.policyLabel}
            </span>
          </nav>
          <Link
            href="/uso-etico"
            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            {BRANDING.ethicsLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
