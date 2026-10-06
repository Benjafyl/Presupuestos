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
  uppercaseBusinessText,
} from "@/lib/quote-format";
import { branchIdentity, canonicalBranchName } from "@/lib/client-branches";
import { freelanceSettings } from "@/lib/freelance";
import { purgeExpiredDeletedQuotes, quoteTrashExpiresAt } from "@/lib/quote-trash";

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
  clientBranchId?: number | null;
  saveClient: boolean;
  saveBranch?: boolean;
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
  const clientName = uppercaseBusinessText(payload.clientName) || "CLIENTE SIN NOMBRE";
  const branch = payload.quoteMode === "interchile" ? uppercaseBusinessText(payload.branch) : payload.branch.trim();
  const items = payload.items
    .map((item, index) => {
      const rowType: QuoteItemRowType =
        item.rowType === "section" || item.rowType === "subtotal" ? item.rowType : "item";
      const isTextRow = rowType === "section" || rowType === "subtotal";

      return {
        rowType,
        position: index + 1,
        qty: isTextRow ? 0 : parseNumber(item.qty),
        description: item.description.trim(),
        unitValue: isTextRow ? 0 : parseNumber(item.unitValue),
      };
    })
    .filter((item) =>
      item.rowType === "section" || item.rowType === "subtotal"
        ? item.description
        : item.description || item.qty > 0 || item.unitValue > 0,
    );

  return {
    quoteMode: payload.quoteMode,
    code,
    revision: payload.revision || null,
    currency: payload.currency,
    taxMode: payload.taxMode,
    quoteDate: parseQuoteDate(payload.quoteDate),
    projectCode: nullable(payload.projectCode),
    clientName,
    clientRut: nullable(payload.clientRut),
    branch: nullable(branch),
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

function quoteIdsFromFormData(formData: FormData) {
  return formData
    .getAll("quoteIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function clientIdsFromFormData(formData: FormData) {
  return formData
    .getAll("clientIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function revalidateQuoteLists() {
  revalidatePath("/");
  revalidatePath("/interchile");
  revalidatePath("/interchile/trash");
  revalidatePath("/freelance");
  revalidatePath("/freelance/trash");
}

export async function saveQuote(payload: QuotePayload) {
  const prisma = getPrisma();
  const settings = await ensureCompanySettings();
  const prefix = payload.quoteMode === "freelance" ? freelanceSettings.quotePrefix : settings.quotePrefix;
  const clean = cleanQuotePayload(payload, prefix);

  const result = await prisma.$transaction(async (tx) => {
    let clientId = payload.clientId ?? null;
    let clientBranchId: number | null = null;
    if (payload.saveClient && payload.clientName.trim()) {
      const clientData = { name: clean.clientName, rut: clean.clientRut };
      if (clientId) {
        await tx.client.update({ where: { id: clientId }, data: clientData });
      } else {
        const client = await tx.client.create({ data: clientData });
        clientId = client.id;
      }
    }

    if (payload.saveBranch && (!clientId || !clean.branch)) {
      throw new Error("Selecciona o guarda un cliente e ingresa el nombre de la sucursal.");
    }
    if (clientId) {
      // Serialize catalogue writes for this client so simultaneous saves reuse a branch.
      if (payload.saveBranch) {
        await tx.$queryRaw`SELECT "id" FROM "Client" WHERE "id" = ${clientId} FOR UPDATE`;
      }
      const branches = await tx.clientBranch.findMany({ where: { clientId }, orderBy: { id: "asc" } });
      const key = branchIdentity(clean);
      const matchingBranch = key ? branches.find((branch) => branchIdentity(branch) === key) : undefined;
      clientBranchId = matchingBranch?.id ?? null;
      if (payload.saveBranch) {
        const branchData = {
          branch: canonicalBranchName(clean),
          commune: clean.commune,
          city: clean.city,
        };
        const savedBranch = matchingBranch
          ? await tx.clientBranch.update({ where: { id: matchingBranch.id }, data: branchData })
          : await tx.clientBranch.create({ data: { clientId, ...branchData } });
        clientBranchId = savedBranch.id;
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
      clientBranchId,
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
      ? await tx.quote.update({
          where: { id: payload.id },
          data: {
            ...quoteData,
            items: {
              deleteMany: {},
              create: clean.items,
            },
          },
        })
      : await tx.quote.create({
          data: {
            ...quoteData,
            items: {
              create: clean.items,
            },
          },
        });

    return { id: quote.id, clientId, clientBranchId };
  });
  const quote = result;

  revalidatePath("/");
  revalidatePath("/interchile");
  revalidatePath("/freelance");
  revalidatePath("/clients");
  revalidatePath(`/quotes/${quote.id}/edit`);
  revalidatePath(`/quotes/${quote.id}/print`);
  revalidatePath(`/freelance/quotes/${quote.id}/edit`);
  return result;
}

export async function duplicateQuote(id: number) {
  const prisma = getPrisma();
  await purgeExpiredDeletedQuotes();
  const quote = await prisma.quote.findFirst({
    where: { id, deletedAt: null },
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
      clientBranchId: quote.clientBranchId,
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

  revalidateQuoteLists();
  redirect(quote.quoteMode === "freelance" ? `/freelance/quotes/${copy.id}/edit` : `/quotes/${copy.id}/edit`);
}

export async function deleteQuote(id: number) {
  const prisma = getPrisma();
  await purgeExpiredDeletedQuotes();
  const deletedAt = new Date();
  await prisma.quote.update({
    where: { id },
    data: {
      deletedAt,
      deleteExpiresAt: quoteTrashExpiresAt(deletedAt),
    },
  });

  revalidateQuoteLists();
}

export async function deleteSelectedQuotes(formData: FormData) {
  const ids = quoteIdsFromFormData(formData);
  if (ids.length === 0) return;

  const prisma = getPrisma();
  await purgeExpiredDeletedQuotes();
  const deletedAt = new Date();
  await prisma.quote.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: {
      deletedAt,
      deleteExpiresAt: quoteTrashExpiresAt(deletedAt),
    },
  });

  revalidateQuoteLists();
}

export async function restoreQuote(id: number) {
  const prisma = getPrisma();
  await purgeExpiredDeletedQuotes();
  await prisma.quote.update({
    where: { id },
    data: {
      deletedAt: null,
      deleteExpiresAt: null,
    },
  });

  revalidateQuoteLists();
}

export async function restoreSelectedQuotes(formData: FormData) {
  const ids = quoteIdsFromFormData(formData);
  if (ids.length === 0) return;

  const prisma = getPrisma();
  await purgeExpiredDeletedQuotes();
  await prisma.quote.updateMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    data: {
      deletedAt: null,
      deleteExpiresAt: null,
    },
  });

  revalidateQuoteLists();
}

export async function permanentlyDeleteQuote(id: number) {
  const prisma = getPrisma();
  await prisma.quote.deleteMany({ where: { id, deletedAt: { not: null } } });

  revalidateQuoteLists();
}

export async function permanentlyDeleteSelectedQuotes(formData: FormData) {
  const ids = quoteIdsFromFormData(formData);
  if (ids.length === 0) return;

  const prisma = getPrisma();
  await prisma.quote.deleteMany({ where: { id: { in: ids }, deletedAt: { not: null } } });

  revalidateQuoteLists();
}

export async function createClient(formData: FormData) {
  const prisma = getPrisma();
  const clientData = {
    name: uppercaseBusinessText(text(formData.get("name"))) || "CLIENTE SIN NOMBRE",
    rut: nullable(text(formData.get("rut"))),
  };
  const location = {
    branch: nullable(uppercaseBusinessText(text(formData.get("branch")))),
    commune: nullable(text(formData.get("commune"))),
    city: nullable(text(formData.get("city"))),
  };
  const branchData = { ...location, branch: canonicalBranchName(location) };

  await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({ data: clientData });

    if (branchData.branch) {
      await tx.clientBranch.create({
        data: {
          clientId: client.id,
          ...branchData,
        },
      });
    }
  });

  revalidatePath("/clients");
  revalidatePath("/quotes/new");
}

export async function deleteClient(id: number) {
  const prisma = getPrisma();
  await prisma.client.delete({ where: { id } });

  revalidatePath("/clients");
  revalidatePath("/quotes/new");
  revalidatePath("/freelance/quotes/new");
}

export async function deleteSelectedClients(formData: FormData) {
  const ids = clientIdsFromFormData(formData);
  if (ids.length === 0) return;

  const prisma = getPrisma();
  await prisma.client.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/clients");
  revalidatePath("/quotes/new");
  revalidatePath("/freelance/quotes/new");
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
