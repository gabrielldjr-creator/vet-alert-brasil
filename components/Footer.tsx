import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-emerald-50 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div>
          <div className="text-base font-semibold text-slate-800">Vet Alert Brasil</div>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Construindo um caminho seguro para conectar tutores e veterinários com clareza e cuidado.
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-slate-700">
          <Link className="hover:text-emerald-700" href="/sobre">
            Sobre
          </Link>
          <Link className="hover:text-emerald-700" href="/privacidade">
            Privacidade
          </Link>
          <Link className="hover:text-emerald-700" href="/alerta/novo">
            Criar alerta
          </Link>
        </div>
      </div>
    </footer>
  );
}
