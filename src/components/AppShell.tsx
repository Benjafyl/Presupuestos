import Link from "next/link";
import { FileText, Home, Settings, Users } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  mode?: "interchile" | "freelance";
};

export function AppShell({ children, mode = "interchile" }: AppShellProps) {
  const isFreelance = mode === "freelance";
  const homeHref = isFreelance ? "/freelance" : "/interchile";
  const title = isFreelance ? "Benjamín Yáñez Presupuestos" : "InterchileClima Presupuestos";
  const accent = isFreelance ? "text-blue-700" : "text-red-800";

  return (
    <div className={`min-h-screen bg-neutral-50 text-neutral-950 ${isFreelance ? "freelance-mode" : ""}`}>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link className={`text-sm font-black uppercase tracking-normal ${accent}`} href={homeHref}>
            {title}
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link className="button-secondary" href="/">
              <Home size={16} /> Inicio
            </Link>
            <Link className="button-secondary" href={homeHref}>
              <FileText size={16} /> Cotizaciones
            </Link>
            {isFreelance ? null : (
              <>
                <Link className="button-secondary" href="/clients">
                  <Users size={16} /> Clientes
                </Link>
                <Link className="button-secondary" href="/settings">
                  <Settings size={16} /> Configuración
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
