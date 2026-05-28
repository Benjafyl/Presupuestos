import { AppShell } from "@/components/AppShell";
import { QuoteList } from "@/components/QuoteList";

export const dynamic = "force-dynamic";

export default function FreelanceQuotesPage() {
  return (
    <AppShell mode="freelance">
      <QuoteList
        accentClass="text-blue-700"
        editHref={(id) => `/freelance/quotes/${id}/edit`}
        eyebrow="Cotizaciones freelance"
        mode="freelance"
        newHref="/freelance/quotes/new"
        title="Benjamín Yáñez - Presupuestos digitales"
      />
    </AppShell>
  );
}
