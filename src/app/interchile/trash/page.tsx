import { AppShell } from "@/components/AppShell";
import { QuoteTrashList } from "@/components/QuoteTrashList";

export const dynamic = "force-dynamic";

export default function InterchileTrashPage() {
  return (
    <AppShell mode="interchile">
      <QuoteTrashList backHref="/interchile" mode="interchile" />
    </AppShell>
  );
}
