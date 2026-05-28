import Link from "next/link";
import { Building2, Code2 } from "lucide-react";

export default function ModeSelectionPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Generador de presupuestos</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">¿Cómo quieres generar este presupuesto?</h1>
          <p className="mt-3 text-base text-neutral-600">
            Selecciona la identidad visual y el formato de cotización que quieres usar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            className="group border border-neutral-300 bg-white p-6 transition hover:border-red-800 hover:shadow-sm"
            href="/interchile"
          >
            <div className="mb-5 inline-flex size-11 items-center justify-center border border-red-800 text-red-800">
              <Building2 size={22} />
            </div>
            <h2 className="text-xl font-bold">Cotizar como Interchile Clima</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Presupuestos HVAC, climatización, instalaciones y servicios técnicos con el formato corporativo actual.
            </p>
            <span className="mt-6 inline-flex text-sm font-bold text-red-800">Entrar al generador</span>
          </Link>

          <Link
            className="group border border-neutral-300 bg-white p-6 transition hover:border-blue-700 hover:shadow-sm"
            href="/freelance"
          >
            <div className="mb-5 inline-flex size-11 items-center justify-center border border-blue-700 text-blue-700">
              <Code2 size={22} />
            </div>
            <h2 className="text-xl font-bold">Cotizar como Benjamín Yáñez</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Presupuestos freelance para desarrollo web, e-commerce, software, automatizaciones, chatbots y soluciones digitales.
            </p>
            <span className="mt-6 inline-flex text-sm font-bold text-blue-700">Entrar al generador</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
