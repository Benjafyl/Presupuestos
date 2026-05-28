import { AppShell } from "@/components/AppShell";
import { QuoteEditor } from "@/components/QuoteEditor";
import { ensureCompanySettings, ensureTemplateText } from "@/lib/defaults";
import { getPrisma } from "@/lib/prisma";
import { toDateInput } from "@/lib/quote-format";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const [settings, template, clients] = await Promise.all([
    ensureCompanySettings(),
    ensureTemplateText(),
    getPrisma().client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell>
      <QuoteEditor
        clients={clients}
        settings={settings}
        template={template}
        today={toDateInput(new Date())}
      />
    </AppShell>
  );
}
