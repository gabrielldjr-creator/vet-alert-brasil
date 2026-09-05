export default function SapsaV2Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="sapsa-v2-route min-h-screen bg-slate-50">
    <style>{`body:has(.sapsa-v2-route) > div > header, body:has(.sapsa-v2-route) > div > footer { display: none; }`}</style>
    <div className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-4 font-semibold sm:px-6">SAPSA V2 · superfície institucional restrita</div></div>
    {children}
  </div>;
}
