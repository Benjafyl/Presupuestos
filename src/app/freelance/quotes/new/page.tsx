import { AppShell } from "@/components/AppShell";
import { QuoteEditor } from "@/components/QuoteEditor";
import { freelanceSettings, freelanceTemplate } from "@/lib/freelance";
import { getPrisma } from "@/lib/prisma";
import { toDateInput } from "@/lib/quote-format";

export const dynamic = "force-dynamic";

export default async function NewFreelanceQuotePage() {
  const clients = await getPrisma().client.findMany({
    orderBy: { name: "asc" },
    include: { branches: { orderBy: [{ branch: "asc" }, { commune: "asc" }] } },
  });

  return (
    <AppShell mode="freelance">
      <QuoteEditor
        clients={clients}
        quoteMode="freelance"
        settings={freelanceSettings}
        template={freelanceTemplate}
        today={toDateInput(new Date())}
      />
    </AppShell>
  );
}
