import { AppShell } from "@/components/AppShell";
import { QuoteTrashList } from "@/components/QuoteTrashList";

export const dynamic = "force-dynamic";

export default function FreelanceTrashPage() {
  return (
    <AppShell mode="freelance">
      <QuoteTrashList accentClass="text-blue-700" backHref="/freelance" mode="freelance" />
    </AppShell>
  );
}
