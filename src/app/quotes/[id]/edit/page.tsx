import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { QuoteEditor } from "@/components/QuoteEditor";
import { ensureCompanySettings, ensureTemplateText } from "@/lib/defaults";
import { getPrisma } from "@/lib/prisma";
import { QuotePayload } from "@/app/actions";
import { Currency, Revision, TaxMode, toDateInput } from "@/lib/quote-format";

type EditQuotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const quoteId = Number(id);

  const [settings, template, clients, quote] = await Promise.all([
    ensureCompanySettings(),
    ensureTemplateText(),
    getPrisma().client.findMany({
      orderBy: { name: "asc" },
      include: { branches: { orderBy: [{ branch: "asc" }, { commune: "asc" }] } },
    }),
    getPrisma().quote.findFirst({
      where: { id: quoteId, deletedAt: null },
      include: { items: { orderBy: { position: "asc" } } },
    }),
  ]);

  if (!quote) notFound();
  if (quote.quoteMode === "freelance") redirect(`/freelance/quotes/${quote.id}/edit`);

  const initialQuote: QuotePayload = {
    id: quote.id,
    quoteMode: "interchile",
    code: quote.code,
    revision: (quote.revision ?? "") as Revision,
    currency: quote.currency as Currency,
    taxMode: quote.taxMode as TaxMode,
    quoteDate: toDateInput(quote.quoteDate),
    projectCode: quote.projectCode ?? "",
    clientId: quote.clientId,
    clientBranchId: quote.clientBranchId,
    saveClient: false,
    clientName: quote.clientName,
    clientRut: quote.clientRut ?? "",
    branch: quote.branch ?? "",
    commune: quote.commune ?? "",
    attention: quote.attention ?? "",
    city: quote.city ?? "",
    payment: quote.payment ?? "",
    mainText: quote.mainText,
    exclusions: quote.exclusions,
    warranty: quote.warranty,
    executionTime: quote.executionTime,
    signature: quote.signature,
    items: quote.items.map((item) => ({
      id: item.id,
      rowType: item.rowType === "section" || item.rowType === "subtotal" ? item.rowType : "item",
      qty: item.qty,
      description: item.description,
      unitValue: item.unitValue,
    })),
  };

  return (
    <AppShell>
      <QuoteEditor
        clients={clients}
        initialQuote={initialQuote}
        settings={settings}
        template={template}
        today={toDateInput(new Date())}
      />
    </AppShell>
  );
}
