import { notFound, redirect } from "next/navigation";
import { QuotePayload } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { QuoteEditor } from "@/components/QuoteEditor";
import { freelanceSettings, freelanceTemplate } from "@/lib/freelance";
import { getPrisma } from "@/lib/prisma";
import { Currency, Revision, TaxMode, toDateInput } from "@/lib/quote-format";

type EditFreelanceQuotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFreelanceQuotePage({ params }: EditFreelanceQuotePageProps) {
  const { id } = await params;
  const quoteId = Number(id);

  const [clients, quote] = await Promise.all([
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
  if (quote.quoteMode !== "freelance") redirect(`/quotes/${quote.id}/edit`);

  const initialQuote: QuotePayload = {
    id: quote.id,
    quoteMode: "freelance",
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
    <AppShell mode="freelance">
      <QuoteEditor
        clients={clients}
        initialQuote={initialQuote}
        quoteMode="freelance"
        settings={freelanceSettings}
        template={freelanceTemplate}
        today={toDateInput(new Date())}
      />
    </AppShell>
  );
}
