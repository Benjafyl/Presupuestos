export type Currency = "UF" | "CLP";
export type Revision = "" | "REV01" | "REV02" | "REV03";
export type TaxMode = "NET" | "IVA_INCLUDED";
export type QuoteMode = "interchile" | "freelance";
export type QuoteItemRowType = "item" | "section";

export const REVISION_OPTIONS: Revision[] = ["", "REV01", "REV02", "REV03"];
export const CURRENCY_OPTIONS: Currency[] = ["CLP", "UF"];
export const TAX_MODE_OPTIONS: { value: TaxMode; label: string }[] = [
  { value: "NET", label: "Neto / IVA excluido" },
  { value: "IVA_INCLUDED", label: "Con IVA incluido" },
];

export const NET_EXCLUSIONS_TEXT = "EXCLUYE TODO ITEM NO CONSIDERADO EN ESTA PROPUESTA, IVA.";
export const IVA_INCLUDED_EXCLUSIONS_TEXT = "EXCLUYE TODO ITEM NO CONSIDERADO EN ESTA PROPUESTA.";
export const IVA_RATE = 0.19;

export function toDateInput(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDisplayDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

export function dateCode(dateInput: string) {
  const [year, month, day] = dateInput.split("-");
  return `${day}${month}${year}`;
}

export function normalizeProjectCode(projectCode: string) {
  return projectCode
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
}

export function buildQuoteCode(prefix: string, projectCode: string, dateInput: string) {
  const cleanPrefix = normalizeProjectCode(prefix || "BYL");
  const cleanProject = normalizeProjectCode(projectCode || "XX");
  return `${cleanPrefix}${cleanProject}-${dateCode(dateInput)}`;
}

export function displayCode(code: string, revision?: string | null) {
  return revision ? `${code} ${revision}` : code;
}

export function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const clean = value.trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function itemTotal(qty: number, unitValue: number) {
  return roundMoney(qty * unitValue);
}

export function isSectionRow(item: { rowType?: string | null }) {
  return item.rowType === "section";
}

export function quoteTotals(items: { rowType?: string | null; qty: number | string; unitValue: number | string }[]) {
  const itemTotals = items.map((item) => (isSectionRow(item) ? 0 : itemTotal(Number(item.qty) || 0, Number(item.unitValue) || 0)));
  const net = roundMoney(itemTotals.reduce((sum, value) => sum + value, 0));
  const iva = roundMoney(net * IVA_RATE);
  const gross = roundMoney(net + iva);

  return { itemTotals, net, iva, gross };
}

export type QuoteTableItem = {
  rowType?: string | null;
  position: number;
  qty: number | string;
  description: string;
  unitValue: number | string;
};

export type QuoteTableRow =
  | {
      kind: "section";
      sourceIndex: number;
      title: string;
    }
  | {
      kind: "item";
      sourceIndex: number;
      itemPosition: number;
      total: number;
      item: QuoteTableItem;
    }
  | {
      kind: "subtotal";
      label: string;
      total: number;
    };

export function quoteTableRows(items: QuoteTableItem[]) {
  const rows: QuoteTableRow[] = [];
  let itemPosition = 1;
  let activeSection = "";
  let sectionSubtotal = 0;
  let sectionItemCount = 0;

  function flushSubtotal() {
    if (!activeSection || sectionItemCount === 0) return;
    rows.push({
      kind: "subtotal",
      label: `Subtotal ${activeSection}`,
      total: roundMoney(sectionSubtotal),
    });
  }

  items.forEach((item, index) => {
    if (isSectionRow(item)) {
      flushSubtotal();
      activeSection = item.description.trim();
      sectionSubtotal = 0;
      sectionItemCount = 0;
      rows.push({
        kind: "section",
        sourceIndex: index,
        title: activeSection || "Titulo",
      });
      return;
    }

    const total = itemTotal(Number(item.qty) || 0, Number(item.unitValue) || 0);
    rows.push({
      kind: "item",
      sourceIndex: index,
      itemPosition,
      total,
      item,
    });
    itemPosition += 1;

    if (activeSection) {
      sectionSubtotal = roundMoney(sectionSubtotal + total);
      sectionItemCount += 1;
    }
  });

  flushSubtotal();

  return rows;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function safeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
