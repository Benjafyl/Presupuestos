import { AppShell } from "@/components/AppShell";
import { QuoteList } from "@/components/QuoteList";
import { ensureCompanySettings, ensureTemplateText } from "@/lib/defaults";

export const dynamic = "force-dynamic";

type InterchileQuotesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function InterchileQuotesPage({ searchParams }: InterchileQuotesPageProps) {
  await Promise.all([ensureCompanySettings(), ensureTemplateText()]);
  const params = await searchParams;

  return (
    <AppShell mode="interchile">
      <QuoteList
        editHref={(id) => `/quotes/${id}/edit`}
        eyebrow="Listado de cotizaciones"
        mode="interchile"
        newHref="/quotes/new"
        searchParams={params}
        title="Generador de Presupuestos InterchileClima"
      />
    </AppShell>
  );
}
