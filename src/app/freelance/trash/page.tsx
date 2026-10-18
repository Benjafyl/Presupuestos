import { AppShell } from "@/components/AppShell";
import { QuoteTrashList } from "@/components/QuoteTrashList";

export const dynamic = "force-dynamic";

export default function FreelanceTrashPage() {
  return (
    <AppShell mode="freelance">
      <QuoteTrashList accentClass="byl-accent" backHref="/freelance" mode="freelance" />
    </AppShell>
  );
}
