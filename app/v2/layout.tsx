import Link from "next/link";

export default function VetAlertV2Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="vetalert-v2-route min-h-screen bg-slate-50">
    <style>{`body:has(.vetalert-v2-route) > div > header, body:has(.vetalert-v2-route) > div > footer { display: none; }`}</style>
    <div className="border-b border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/v2/onboarding" className="font-semibold text-emerald-800">VetAlert V2</Link>
        <nav aria-label="Navegação VetAlert V2" className="flex gap-4 text-sm"><Link href="/v2/onboarding">Início</Link><Link href="/v2/privacidade">Privacidade</Link></nav>
      </div>
    </div>
    {children}
    <div className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-600 sm:px-6">Registro veterinário observacional · leitura institucional somente agregada.</div></div>
  </div>;
}
