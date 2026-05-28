import { notFound } from "next/navigation";
import { FreelanceQuoteDocument } from "@/components/FreelanceQuoteDocument";
import { QuoteDocument } from "@/components/QuoteDocument";
import { ensureCompanySettings } from "@/lib/defaults";
import { getPrisma } from "@/lib/prisma";

type PrintQuotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PrintQuotePage({ params }: PrintQuotePageProps) {
  const { id } = await params;
  const [settings, quote] = await Promise.all([
    ensureCompanySettings(),
    getPrisma().quote.findUnique({
      where: { id: Number(id) },
      include: { items: { orderBy: { position: "asc" } } },
    }),
  ]);

  if (!quote) notFound();

  return (
    <>
      <style>{`
        :root {
          --quote-font: var(--font-nunito-sans), "Nunito Sans", "Inter", Arial, Helvetica, sans-serif;
          --quote-red: #a33a36;
          --quote-red-dark: #8f302d;
          --quote-line: #444;
          --quote-line-soft: #5f5f5f;
          --quote-text: #050505;
        }

        @page {
          size: A4;
          margin: 0;
        }

        html,
        body {
          margin: 0;
          background: #e5e5e5;
          font-family: var(--quote-font);
          color: var(--quote-text);
        }

        .quote-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          padding: 21mm 12mm 18mm;
          box-sizing: border-box;
          font-family: var(--quote-font);
          font-size: 10.5px;
          font-weight: 400;
          line-height: 1.28;
        }

        .quote-header {
          display: grid;
          grid-template-columns: 1fr 48mm;
          gap: 20mm;
          align-items: start;
          margin-bottom: 4mm;
        }

        .quote-brand {
          padding-top: 2mm;
          text-align: left;
        }

        .quote-brand img {
          display: block;
          width: 60mm;
          height: auto;
          margin-left: 2mm;
        }

        .quote-brand p {
          margin: 2mm 0 0;
          font-size: 9.5px;
          font-weight: 600;
        }

        .quote-meta {
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
        }

        .quote-title {
          margin: 0 0 4.2mm;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.2px;
          line-height: 1.15;
        }

        .quote-meta-row {
          display: grid;
          grid-template-columns: 14mm 1fr;
          gap: 3mm;
          margin-bottom: 4.6mm;
          align-items: baseline;
        }

        .quote-meta-label,
        .quote-meta-value {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1px;
        }

        .service-box {
          position: relative;
          border: 1.2px solid var(--quote-red);
          margin-top: 0;
          margin-bottom: 5mm;
          padding: 1.2mm 1.2mm 1.6mm;
          min-height: 23mm;
        }

        .service-title {
          position: absolute;
          top: -4.6mm;
          left: 0;
          font-size: 9.8px;
          font-weight: 600;
          letter-spacing: 0;
        }

        .service-date {
          position: absolute;
          top: -5.2mm;
          right: -1.2px;
          width: 62mm;
          height: 5mm;
          border: 1.2px solid var(--quote-red);
          border-bottom: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 0 1.5mm;
          box-sizing: border-box;
          text-align: right;
          background: #fff;
          font-size: 11.6px;
          font-weight: 400;
        }

        .service-grid {
          display: grid;
          grid-template-columns: 1fr 58mm;
          gap: 1mm 18mm;
          font-size: 11.6px;
          font-weight: 400;
        }

        .service-left,
        .service-right {
          display: grid;
          gap: 1mm;
        }

        .service-left div,
        .service-right div {
          display: grid;
          min-height: 4.6mm;
        }

        .service-left div {
          grid-template-columns: 22mm 1fr;
        }

        .service-right div {
          text-align: right;
          grid-template-columns: 1fr 26mm;
        }

        .service-label {
          font-weight: 600;
          color: var(--quote-text);
        }

        .service-value {
          font-weight: 400;
          color: var(--quote-text);
        }

        .main-text {
          margin: 0 0 0;
          background: var(--quote-red);
          color: #fff;
          padding: 2.8mm 1.3mm;
          font-size: 12.4px;
          font-weight: 700;
          line-height: 1.2;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.4px;
          page-break-inside: auto;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        .table-header {
          display: table-header-group;
          background: var(--quote-red);
          color: #fff;
          font-size: 12.3px;
          font-weight: 600;
        }

        .items-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        .items-table th {
          border: 0;
          border-left: 0;
          border-right: 0;
          border-top: 0;
          border-bottom: 1px solid var(--quote-red-dark);
          padding: 5px 4px;
          font-weight: 600;
          line-height: 1.18;
          vertical-align: middle;
        }

        .items-table th + th {
          border-left: 0;
        }

        .items-table td {
          border: 1px solid var(--quote-line);
          padding: 5px 5px;
          line-height: 1.22;
          vertical-align: top;
        }

        .items-table th:nth-child(1),
        .items-table th:nth-child(2) {
          width: 10mm;
        }

        .items-table th:nth-child(4),
        .items-table th:nth-child(5) {
          width: 31mm;
        }

        .center {
          text-align: center;
        }

        .number,
        .items-table .money-cell,
        .items-table .totals-value {
          text-align: right;
          padding-right: 10px;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        .item-total {
          font-weight: 650;
        }

        .net-row td {
          padding-top: 6px;
          padding-bottom: 6px;
          font-weight: 600;
          text-align: right;
          border-color: var(--quote-line);
          line-height: 1.24;
        }

        .totals-label {
          padding-right: 6px;
          font-weight: 600;
        }

        .totals-value {
          font-size: 13px;
          font-style: normal;
          font-weight: 650;
        }

        .final-total-row td {
          font-size: 11.8px;
          font-weight: 650;
        }

        .final-total-row .totals-value {
          font-size: 13.6px;
          font-weight: 700;
        }

        .final-section {
          margin-top: 4.2mm;
          page-break-inside: avoid;
        }

        .section-title {
          margin: 0 0 1.8mm;
          font-size: 10.2px;
          font-weight: 600;
          letter-spacing: 0;
        }

        .final-section p {
          margin: 0;
          font-size: 9.5px;
          font-weight: 500;
          line-height: 1.25;
          text-transform: uppercase;
        }

        .signature {
          display: grid;
          gap: 1.3mm;
          margin-top: 8.2mm;
          font-size: 11.4px;
          font-weight: 600;
          line-height: 1.35;
          page-break-inside: avoid;
        }

        .signature-greeting {
          margin-bottom: 4.2mm;
          font-weight: 600;
        }

        .signature-name {
          font-weight: 700;
        }

        @media print {
          html,
          body {
            background: #fff;
          }

          .quote-sheet {
            margin: 0;
            box-shadow: none;
          }
        }

        .freelance-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          box-sizing: border-box;
          padding: 19mm 15mm 17mm;
          color: #111827;
          font-family: var(--quote-font);
          font-size: 11px;
          line-height: 1.35;
        }

        .freelance-header {
          display: grid;
          grid-template-columns: 1fr 54mm;
          gap: 16mm;
          align-items: start;
          border-bottom: 2px solid #1d4ed8;
          padding-bottom: 8mm;
        }

        .freelance-brand {
          display: flex;
          align-items: center;
          gap: 4mm;
        }

        .freelance-logo {
          display: block;
          width: 18mm;
          height: 18mm;
          object-fit: contain;
        }

        .freelance-brand h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
        }

        .freelance-brand p {
          margin: 1mm 0 0;
          color: #475569;
          font-size: 11px;
          font-weight: 500;
        }

        .freelance-meta {
          text-align: right;
        }

        .freelance-meta h2 {
          margin: 0 0 5mm;
          color: #0f172a;
          font-size: 22px;
          font-weight: 800;
        }

        .freelance-meta p {
          margin: 0 0 2mm;
          color: #334155;
          font-size: 11.5px;
        }

        .freelance-meta strong {
          margin-right: 3mm;
          color: #0f172a;
          font-weight: 700;
        }

        .freelance-intro {
          margin: 7mm 0;
          border-left: 3px solid #1d4ed8;
          background: #eff6ff;
          padding: 4mm 5mm;
          color: #1e3a8a;
          font-size: 12px;
          font-weight: 600;
        }

        .freelance-client {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4mm;
          margin-bottom: 7mm;
        }

        .freelance-client div {
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 2mm;
        }

        .freelance-client span {
          display: block;
          margin-bottom: 1mm;
          color: #64748b;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .freelance-client strong {
          color: #111827;
          font-size: 11px;
          font-weight: 700;
        }

        .freelance-description {
          margin-bottom: 6mm;
        }

        .freelance-description h3,
        .freelance-notes h3 {
          margin: 0 0 2mm;
          color: #0f172a;
          font-size: 12px;
          font-weight: 800;
        }

        .freelance-description p,
        .freelance-notes p {
          margin: 0;
          color: #334155;
          font-size: 11px;
        }

        .freelance-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 7mm;
          font-size: 10.5px;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        .freelance-table thead {
          background: #1d4ed8;
          color: #fff;
        }

        .freelance-table th {
          border: 0;
          padding: 6px 5px;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
        }

        .freelance-table th:nth-child(1),
        .freelance-table th:nth-child(2) {
          width: 11mm;
          text-align: center;
        }

        .freelance-table th:nth-child(4),
        .freelance-table th:nth-child(5) {
          width: 32mm;
          text-align: right;
        }

        .freelance-table td {
          border-bottom: 1px solid #cbd5e1;
          padding: 6px 5px;
          vertical-align: top;
        }

        .freelance-table .money-cell {
          padding-right: 10px;
          text-align: right;
        }

        .freelance-total-row td {
          border-bottom: 1px solid #94a3b8;
          color: #0f172a;
          font-weight: 700;
          text-align: right;
        }

        .freelance-grand-total td {
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 800;
        }

        .freelance-notes {
          display: grid;
          gap: 5mm;
          page-break-inside: avoid;
        }

        .freelance-signature {
          margin-top: 9mm;
          border-top: 1px solid #cbd5e1;
          padding-top: 5mm;
          color: #0f172a;
          font-size: 11.5px;
          font-weight: 700;
          line-height: 1.45;
          page-break-inside: avoid;
        }
      `}</style>
      {quote.quoteMode === "freelance" ? (
        <FreelanceQuoteDocument quote={quote} />
      ) : (
        <QuoteDocument settings={settings} quote={quote} />
      )}
    </>
  );
}
