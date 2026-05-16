import type { Metadata } from "next";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import "./globals.css";
import { BRANDING } from "../lib/branding";

export const metadata: Metadata = {
  title: `${BRANDING.intake.productLong} + ${BRANDING.intelligence.product} | Acesso restrito`,
  description:
    "Plataforma de leitura situacional exclusiva para médicos-veterinários. Estado do CRMV define a região base do painel.",
  applicationName: `${BRANDING.intake.productLong} / ${BRANDING.intelligence.product}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
