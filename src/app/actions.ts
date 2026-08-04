"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureCompanySettings, ensureTemplateText } from "@/lib/defaults";
import { getPrisma } from "@/lib/prisma";
import {
  buildQuoteCode,
  Currency,
  parseNumber,
  QuoteItemRowType,
  QuoteMode,
  Revision,
  TaxMode,
  toDateInput,
} from "@/lib/quote-format";
import { freelanceSettings } from "@/lib/freelance";

export type QuoteItemPayload = {
  id?: number;
  rowType?: QuoteItemRowType;
  qty: number | string;
  description: string;
  unitValue: number | string;
};

export type QuotePayload = {
  id?: number;
  quoteMode: QuoteMode;
  code: string;
  revision: Revision;
  currency: Currency;
  taxMode: TaxMode;
  quoteDate: string;
  projectCode: string;
  clientId?: number | null;
  saveClient: boolean;
  clientName: string;
  clientRut: string;
  branch: string;
  commune: string;
  attention: string;
  city: string;
  payment: string;
  mainText: string;
  exclusions: string;
  warranty: string;
  executionTime: string;
  signature: string;
  items: QuoteItemPayload[];
};

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function nullable(value: string) {
  return value.trim() ? value.trim() : null;
}

function parseQuoteDate(input: string) {
  if (!input) return new Date();
  const [year, month, day] = input.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function cleanQuotePayload(payload: QuotePayload, prefix: string) {
  const code = payload.code.trim() || buildQuoteCode(prefix, payload.projectCode, payload.quoteDate);
  const items = payload.items
    .map((item, index) => {
      const rowType: QuoteItemRowType = item.rowType === "section" ? "section" : "item";

      return {
        rowType,
        position: index + 1,
        qty: rowType === "section" ? 0 : parseNumber(item.qty),
        description: item.description.trim(),
        unitValue: rowType === "section" ? 0 : parseNumber(item.unitValue),
      };
    })
    .filter((item) => (item.rowType === "section" ? item.description : item.description || item.qty > 0 || item.unitValue > 0));

  return {
    quoteMode: payload.quoteMode,
    code,
    revision: payload.revision || null,
    currency: payload.currency,
    taxMode: payload.taxMode,
    quoteDate: parseQuoteDate(payload.quoteDate),
    projectCode: nullable(payload.projectCode),
    clientName: payload.clientName.trim() || "Cliente sin nombre",
    clientRut: nullable(payload.clientRut),
    branch: nullable(payload.branch),
    commune: nullable(payload.commune),
    attention: nullable(payload.attention),
    city: nullable(payload.city),
    payment: nullable(payload.payment),
    mainText: payload.mainText.trim(),
    exclusions: payload.exclusions.trim(),
    warranty: payload.warranty.trim(),
    executionTime: payload.executionTime.trim(),
    signature: payload.signature.trim(),
    items,
  };
}

export async function saveQuote(payload: QuotePayload) {
  const prisma = getPrisma();
  const settings = await ensureCompanySettings();
  const prefix = payload.quoteMode === "freelance" ? freelanceSettings.quotePrefix : settings.quotePrefix;
  const clean = cleanQuotePayload(payload, prefix);

  let clientId = payload.clientId ?? null;
  if (payload.saveClient && payload.clientName.trim()) {
    const clientData = {
      name: clean.clientName,
      rut: clean.clientRut,
      branch: clean.branch,
      commune: clean.commune,
      attention: clean.attention,
      city: clean.city,
      payment: clean.payment,
      projectCode: clean.projectCode,
    };

    if (clientId) {
      await prisma.client.update({ where: { id: clientId }, data: clientData });
    } else {
      const client = await prisma.client.create({ data: clientData });
      clientId = client.id;
    }
  }

  const quoteData = {
    quoteMode: clean.quoteMode,
    code: clean.code,
    revision: clean.revision,
    currency: clean.currency,
    taxMode: clean.taxMode,
    quoteDate: clean.quoteDate,
    projectCode: clean.projectCode,
    clientId,
    clientName: clean.clientName,
    clientRut: clean.clientRut,
    branch: clean.branch,
    commune: clean.commune,
    attention: clean.attention,
    city: clean.city,
    payment: clean.payment,
    mainText: clean.mainText,
    exclusions: clean.exclusions,
    warranty: clean.warranty,
    executionTime: clean.executionTime,
    signature: clean.signature,
  };

  const quote = payload.id
    ? await prisma.quote.update({
        where: { id: payload.id },
        data: {
          ...quoteData,
          items: {
            deleteMany: {},
            create: clean.items,
          },
        },
      })
    : await prisma.quote.create({
        data: {
          ...quoteData,
          items: {
            create: clean.items,
          },
        },
      });

  revalidatePath("/");
  revalidatePath("/interchile");
  revalidatePath("/freelance");
  revalidatePath(`/quotes/${quote.id}/edit`);
  revalidatePath(`/quotes/${quote.id}/print`);
  revalidatePath(`/freelance/quotes/${quote.id}/edit`);
  return { id: quote.id, clientId };
}

export async function duplicateQuote(id: number) {
  const prisma = getPrisma();
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });

  if (!quote) redirect("/");

  const copy = await prisma.quote.create({
    data: {
      quoteMode: quote.quoteMode,
      code: `${quote.code}-COPIA`,
      revision: quote.revision,
      currency: quote.currency,
      taxMode: quote.taxMode,
      quoteDate: quote.quoteDate,
      projectCode: quote.projectCode,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientRut: quote.clientRut,
      branch: quote.branch,
      commune: quote.commune,
      attention: quote.attention,
      city: quote.city,
      payment: quote.payment,
      mainText: quote.mainText,
      exclusions: quote.exclusions,
      warranty: quote.warranty,
      executionTime: quote.executionTime,
      signature: quote.signature,
      items: {
        create: quote.items.map((item) => ({
          position: item.position,
          rowType: item.rowType,
          qty: item.qty,
          description: item.description,
          unitValue: item.unitValue,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/interchile");
  revalidatePath("/freelance");
  redirect(quote.quoteMode === "freelance" ? `/freelance/quotes/${copy.id}/edit` : `/quotes/${copy.id}/edit`);
}

export async function createClient(formData: FormData) {
  const prisma = getPrisma();
  await prisma.client.create({
    data: {
      name: text(formData.get("name")) || "Cliente sin nombre",
      rut: nullable(text(formData.get("rut"))),
      branch: nullable(text(formData.get("branch"))),
      commune: nullable(text(formData.get("commune"))),
      attention: nullable(text(formData.get("attention"))),
      city: nullable(text(formData.get("city"))),
      payment: nullable(text(formData.get("payment"))),
      projectCode: nullable(text(formData.get("projectCode"))),
    },
  });

  revalidatePath("/clients");
  revalidatePath("/quotes/new");
}

export async function saveSettings(formData: FormData) {
  const prisma = getPrisma();
  const settings = await ensureCompanySettings();
  const template = await ensureTemplateText();

  await prisma.companySettings.update({
    where: { id: settings.id },
    data: {
      name: text(formData.get("name")) || "INTERCHILE CLIMA SPA",
      rut: text(formData.get("rut")) || "76.093.202-7",
      address: text(formData.get("address")) || "Merced 838 A of 117 / Santiago",
      quotePrefix: text(formData.get("quotePrefix")) || "BYL",
      responsible: text(formData.get("responsible")) || "BENJAMIN YAÑEZ LASALVIA",
      signatureDefault: text(formData.get("signatureDefault")),
    },
  });

  await prisma.templateText.update({
    where: { id: template.id },
    data: {
      mainText: text(formData.get("mainText")),
      exclusions: text(formData.get("exclusions")),
      warranty: text(formData.get("warranty")),
      executionTime: text(formData.get("executionTime")),
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}

export async function newQuoteDefaults() {
  const [settings, template] = await Promise.all([ensureCompanySettings(), ensureTemplateText()]);
  const today = toDateInput(new Date());

  return {
    settings,
    template,
    today,
    code: buildQuoteCode(settings.quotePrefix, "PT", today),
  };
}
