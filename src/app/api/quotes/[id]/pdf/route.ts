import { NextRequest } from "next/server";
import { chromium } from "playwright";
import { ensureCompanySettings } from "@/lib/defaults";
import { getPrisma } from "@/lib/prisma";
import { displayCode, safeFilePart, uppercaseBusinessText } from "@/lib/quote-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PdfRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: PdfRouteContext) {
  const { id } = await context.params;
  const quote = await getPrisma().quote.findFirst({ where: { id: Number(id), deletedAt: null } });

  if (!quote) {
    return new Response("Presupuesto no encontrado", { status: 404 });
  }

  await ensureCompanySettings();

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const printUrl = new URL(`/quotes/${quote.id}/print`, request.url);
    await page.goto(printUrl.toString(), { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const code = safeFilePart(displayCode(quote.code, quote.revision));
    const client = safeFilePart(uppercaseBusinessText(quote.clientName) || "CLIENTE");
    const filename = `Presupuesto_${code}_${client}.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
        "X-Quote-Code": displayCode(quote.code, quote.revision),
      },
    });
  } finally {
    await browser.close();
  }
}
