import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function maskDatabaseUrl(value: string | undefined) {
  if (!value) return "DATABASE_URL no configurada";

  try {
    const url = new URL(value);
    const username = url.username ? `${url.username.slice(0, 18)}...` : "";
    return {
      protocol: url.protocol.replace(":", ""),
      username,
      host: url.host,
      database: url.pathname.replace(/^\//, ""),
      sslmode: url.searchParams.get("sslmode"),
    };
  } catch {
    return "DATABASE_URL invalida";
  }
}

export async function GET() {
  const prisma = getPrisma();

  try {
    const [clients, clientBranches, quotes, quoteItems, companySettings, templateTexts] = await Promise.all([
      prisma.client.count(),
      prisma.clientBranch.count(),
      prisma.quote.count(),
      prisma.quoteItem.count(),
      prisma.companySettings.count(),
      prisma.templateText.count(),
    ]);

    return Response.json({
      ok: true,
      database: maskDatabaseUrl(process.env.DATABASE_URL),
      counts: {
        clients,
        clientBranches,
        quotes,
        quoteItems,
        companySettings,
        templateTexts,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: maskDatabaseUrl(process.env.DATABASE_URL),
        error: error instanceof Error ? error.message : "Error desconocido",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
