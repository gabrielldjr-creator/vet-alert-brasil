import Link from "next/link";
import { BRANDING } from "../lib/branding";

export function Footer() {
  return (
    <footer className="border-t border-emerald-50 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div>
          <div className="text-base font-semibold text-slate-800">{BRANDING.intake.productLong} • {BRANDING.intelligence.product}</div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            VetAlert capta sinais de campo; SAPSA apresenta inteligência agregada para análise operacional, sem recomendação clínica.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
          <Link className="hover:text-emerald-700" href="/">Início</Link>
          <Link className="hover:text-emerald-700" href="/global-alerts-dashboard">{BRANDING.intelligence.navLabelDashboard}</Link>
          <Link className="hover:text-emerald-700" href="/terminal">SAPSA • Terminal ao Vivo</Link>
          <Link className="hover:text-emerald-700" href="/privacidade">
            Política de Privacidade — VetAlert + SAPSA
          </Link>
        </div>
      </div>
    </footer>
  );
}
