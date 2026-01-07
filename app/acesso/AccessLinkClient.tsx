"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccessLinkClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/alerta/novo");
  }, [router]);

  return (
    <div className="px-4 py-10 text-sm text-slate-600">
      Redirecionando para o formulário do piloto...
    </div>
  );
}
