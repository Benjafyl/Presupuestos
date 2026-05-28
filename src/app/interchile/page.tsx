import { AppShell } from "@/components/AppShell";
import { QuoteList } from "@/components/QuoteList";
import { ensureCompanySettings, ensureTemplateText } from "@/lib/defaults";

export const dynamic = "force-dynamic";

export default async function InterchileQuotesPage() {
  await Promise.all([ensureCompanySettings(), ensureTemplateText()]);

  return (
    <AppShell mode="interchile">
      <QuoteList
        editHref={(id) => `/quotes/${id}/edit`}
        eyebrow="Listado de cotizaciones"
        mode="interchile"
        newHref="/quotes/new"
        title="Generador de Presupuestos InterchileClima"
      />
    </AppShell>
  );
}
