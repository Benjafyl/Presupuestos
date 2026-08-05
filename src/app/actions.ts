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
  clientBranchId?: number | null;
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

function hasBranchData(data: {
  branch: string | null;
  commune: string | null;
  attention: string | null;
  city: string | null;
  payment: string | null;
  projectCode: string | null;
}) {
  return Boolean(data.branch || data.commune || data.attention || data.city || data.payment || data.projectCode);
}

export async function saveQuote(payload: QuotePayload) {
  const prisma = getPrisma();
  const settings = await ensureCompanySettings();
  const prefix = payload.quoteMode === "freelance" ? freelanceSettings.quotePrefix : settings.quotePrefix;
  const clean = cleanQuotePayload(payload, prefix);

  let clientId = payload.clientId ?? null;
  let clientBranchId = payload.clientBranchId ?? null;
  if (payload.saveClient && payload.clientName.trim()) {
    const clientData = {
      name: clean.clientName,
      rut: clean.clientRut,
      // Keep legacy fields in sync for older quotes/screens while branches become the source of truth.
      branch: clean.branch,
      commune: clean.commune,
      attention: clean.attention,
      city: clean.city,
      payment: clean.payment,
      projectCode: clean.projectCode,
    };
    const branchData = {
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

    if (clientId && hasBranchData(branchData)) {
      const selectedBranch = clientBranchId
        ? await prisma.clientBranch.findFirst({ where: { id: clientBranchId, clientId } })
        : null;

      if (selectedBranch) {
        await prisma.clientBranch.update({
          where: { id: selectedBranch.id },
          data: branchData,
        });
      } else {
        const existingBranch = await prisma.clientBranch.findFirst({
          where: {
            clientId,
            branch: branchData.branch,
            commune: branchData.commune,
            projectCode: branchData.projectCode,
          },
          orderBy: { updatedAt: "desc" },
        });

        if (existingBranch) {
          await prisma.clientBranch.update({
            where: { id: existingBranch.id },
            data: branchData,
          });
          clientBranchId = existingBranch.id;
        } else {
          const branch = await prisma.clientBranch.create({
            data: {
              clientId,
              ...branchData,
            },
          });
          clientBranchId = branch.id;
        }
      }
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
  revalidatePath("/clients");
  revalidatePath(`/quotes/${quote.id}/edit`);
  revalidatePath(`/quotes/${quote.id}/print`);
  revalidatePath(`/freelance/quotes/${quote.id}/edit`);
  return { id: quote.id, clientId, clientBranchId };
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

  revalidatePath("/");
  revalidatePath("/interchile");
  revalidatePath("/freelance");
  redirect(quote.quoteMode === "freelance" ? `/freelance/quotes/${copy.id}/edit` : `/quotes/${copy.id}/edit`);
}

export async function createClient(formData: FormData) {
  const prisma = getPrisma();
  const clientData = {
    name: text(formData.get("name")) || "Cliente sin nombre",
    rut: nullable(text(formData.get("rut"))),
    branch: nullable(text(formData.get("branch"))),
    commune: nullable(text(formData.get("commune"))),
    attention: nullable(text(formData.get("attention"))),
    city: nullable(text(formData.get("city"))),
    payment: nullable(text(formData.get("payment"))),
    projectCode: nullable(text(formData.get("projectCode"))),
  };
  const branchData = {
    branch: clientData.branch,
    commune: clientData.commune,
    attention: clientData.attention,
    city: clientData.city,
    payment: clientData.payment,
    projectCode: clientData.projectCode,
  };

  await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({ data: clientData });

    if (hasBranchData(branchData)) {
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
