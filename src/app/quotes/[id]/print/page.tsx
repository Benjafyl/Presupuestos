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
          --quote-font: Arial, "Liberation Sans", Helvetica, sans-serif;
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
          font-kerning: normal;
          font-stretch: normal;
          letter-spacing: normal;
          word-spacing: normal;
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
          font-synthesis: none;
          font-kerning: normal;
          font-variant-ligatures: none;
          letter-spacing: normal;
          word-spacing: normal;
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
          letter-spacing: normal;
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
          letter-spacing: normal;
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
          min-width: 0;
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
          white-space: nowrap;
        }

        .service-value {
          font-weight: 400;
          color: var(--quote-text);
          min-width: 0;
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
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
          table-layout: fixed;
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
          break-inside: avoid;
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
          white-space: nowrap;
        }

        .items-table th + th {
          border-left: 0;
        }

        .items-table td {
          border: 1px solid var(--quote-line);
          padding: 5px 5px;
          line-height: 1.22;
          vertical-align: top;
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
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
          white-space: nowrap;
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
          break-inside: avoid;
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
          padding: 20mm 14.5mm 16mm;
          color: #0f172a;
          font-family: Arial, "Liberation Sans", Helvetica, sans-serif;
          font-size: 11px;
          font-weight: 400;
          font-synthesis: none;
          font-kerning: normal;
          font-variant-ligatures: none;
          line-height: 1.32;
          letter-spacing: normal;
          word-spacing: normal;
        }

        .freelance-header {
          display: grid;
          grid-template-columns: 1fr 55mm;
          gap: 14mm;
          align-items: start;
          border-bottom: 1.6px solid #2563eb;
          padding-bottom: 8.5mm;
        }

        .freelance-brand {
          display: flex;
          align-items: center;
          gap: 4.2mm;
        }

        .freelance-logo {
          display: block;
          width: 19mm;
          height: 9mm;
          object-fit: cover;
          object-position: center;
        }

        .freelance-brand h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.08;
        }

        .freelance-brand p {
          margin: 1.1mm 0 0;
          color: #475569;
          font-size: 10.5px;
          font-weight: 400;
          line-height: 1.25;
        }

        .freelance-meta {
          text-align: right;
        }

        .freelance-meta h2 {
          margin: 0 0 5.2mm;
          color: #0f172a;
          font-size: 18.5px;
          font-weight: 700;
          line-height: 1.12;
        }

        .freelance-meta p {
          margin: 0 0 2.1mm;
          color: #0f172a;
          font-size: 10.5px;
          font-weight: 600;
          line-height: 1.2;
        }

        .freelance-meta strong {
          margin-right: 3.5mm;
          color: #0f172a;
          font-weight: 700;
        }

        .freelance-intro {
          margin: 6.8mm 0 6.2mm;
          border-left: 2.2px solid #2563eb;
          background: #eff6ff;
          padding: 3.2mm 5mm;
          color: #1e3a8a;
          font-size: 10.8px;
          font-weight: 700;
          line-height: 1.28;
        }

        .freelance-client {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3.6mm 4.3mm;
          margin-bottom: 6.5mm;
        }

        .freelance-client div {
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 1.7mm;
        }

        .freelance-client span {
          display: block;
          margin-bottom: 0.8mm;
          color: #64748b;
          font-size: 8.2px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .freelance-client strong {
          color: #111827;
          font-size: 10.4px;
          font-weight: 700;
          line-height: 1.22;
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
        }

        .freelance-description {
          margin-bottom: 6.2mm;
        }

        .freelance-description h3,
        .freelance-notes h3 {
          margin: 0 0 2.1mm;
          color: #0f172a;
          font-size: 11.2px;
          font-weight: 700;
          line-height: 1.2;
        }

        .freelance-description p,
        .freelance-notes p {
          margin: 0;
          color: #0f172a;
          font-size: 10px;
          line-height: 1.34;
        }

        .freelance-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-bottom: 5.8mm;
          font-size: 10px;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
          page-break-inside: auto;
        }

        .freelance-table thead {
          display: table-header-group;
        }

        .freelance-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
          page-break-after: auto;
        }

        .freelance-table th {
          border: 0;
          background: #2563eb;
          color: #fff;
          padding: 6px 5px;
          font-size: 9.8px;
          font-weight: 700;
          text-align: left;
          line-height: 1.15;
          white-space: nowrap;
        }

        .freelance-table th:nth-child(1),
        .freelance-table th:nth-child(2) {
          width: 10.5mm;
          text-align: center;
        }

        .freelance-table th:nth-child(4),
        .freelance-table th:nth-child(5) {
          width: 31mm;
          text-align: right;
        }

        .freelance-table td {
          border-bottom: 1px solid #cbd5e1;
          padding: 5px 5px;
          vertical-align: top;
          line-height: 1.2;
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
        }

        .freelance-table .money-cell {
          padding-right: 10px;
          text-align: right;
          white-space: nowrap;
        }

        .freelance-total-row td {
          border-bottom: 1px solid #94a3b8;
          color: #0f172a;
          font-weight: 700;
          text-align: right;
          padding-top: 5px;
          padding-bottom: 5px;
        }

        .freelance-grand-total td {
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 10.6px;
          font-weight: 700;
        }

        .freelance-notes {
          display: grid;
          gap: 3.2mm;
        }

        .freelance-notes > div {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .freelance-signature {
          margin-top: 5.2mm;
          padding-top: 0;
          color: #0f172a;
          font-size: 10.4px;
          font-weight: 700;
          line-height: 1.42;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .freelance-content-dense {
          padding-top: 16mm;
          padding-bottom: 10mm;
        }

        .freelance-content-dense .freelance-header {
          padding-bottom: 5.5mm;
        }

        .freelance-content-dense .freelance-intro {
          margin: 4.5mm 0;
          padding-top: 2.6mm;
          padding-bottom: 2.6mm;
        }

        .freelance-content-dense .freelance-client {
          margin-bottom: 4.5mm;
        }

        .freelance-content-dense .freelance-description {
          margin-bottom: 4.5mm;
        }

        .freelance-content-dense .freelance-table {
          margin-bottom: 4mm;
        }

        .freelance-content-dense .freelance-notes {
          gap: 2.5mm;
        }

        .freelance-content-dense .freelance-signature {
          margin-top: 3.5mm;
        }

        .freelance-density-tight {
          padding-top: 18mm;
          padding-bottom: 14mm;
          font-size: 10px;
        }

        .freelance-density-tight .freelance-header {
          padding-bottom: 6.5mm;
        }

        .freelance-density-tight .freelance-intro {
          margin: 5mm 0;
          padding-top: 2.7mm;
          padding-bottom: 2.7mm;
        }

        .freelance-density-tight .freelance-client {
          gap: 2.8mm 4mm;
          margin-bottom: 5mm;
        }

        .freelance-density-tight .freelance-description {
          margin-bottom: 5mm;
        }

        .freelance-density-tight .freelance-table {
          margin-bottom: 4.5mm;
          font-size: 9.3px;
        }

        .freelance-density-tight .freelance-table th,
        .freelance-density-tight .freelance-table td {
          padding-top: 4px;
          padding-bottom: 4px;
        }

        .freelance-density-tight .freelance-notes {
          gap: 2.5mm;
        }

        .freelance-density-tight .freelance-signature {
          margin-top: 4mm;
        }

        .freelance-density-compact {
          padding-top: 16mm;
          padding-bottom: 12mm;
          font-size: 9.5px;
        }

        .freelance-density-compact .freelance-header {
          padding-bottom: 5mm;
        }

        .freelance-density-compact .freelance-intro {
          margin: 4mm 0;
          padding-top: 2.2mm;
          padding-bottom: 2.2mm;
        }

        .freelance-density-compact .freelance-client {
          gap: 2.3mm 3.8mm;
          margin-bottom: 4mm;
        }

        .freelance-density-compact .freelance-description {
          margin-bottom: 4mm;
        }

        .freelance-density-compact .freelance-table {
          margin-bottom: 3.5mm;
          font-size: 8.8px;
        }

        .freelance-density-compact .freelance-table th,
        .freelance-density-compact .freelance-table td {
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .freelance-density-compact .freelance-notes {
          gap: 2mm;
        }

        .freelance-density-compact .freelance-signature {
          margin-top: 3mm;
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
