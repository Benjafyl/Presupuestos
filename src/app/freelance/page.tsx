import { AppShell } from "@/components/AppShell";
import { QuoteList } from "@/components/QuoteList";

export const dynamic = "force-dynamic";

type FreelanceQuotesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FreelanceQuotesPage({ searchParams }: FreelanceQuotesPageProps) {
  const params = await searchParams;

  return (
    <AppShell mode="freelance">
      <QuoteList
        accentClass="text-blue-700"
        editHref={(id) => `/freelance/quotes/${id}/edit`}
        eyebrow="Cotizaciones freelance"
        mode="freelance"
        newHref="/freelance/quotes/new"
        searchParams={params}
        title="Benjamín Yáñez - Presupuestos digitales"
      />
    </AppShell>
  );
}
