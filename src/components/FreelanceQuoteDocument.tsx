import Image from "next/image";
import { freelanceSettings } from "@/lib/freelance";
import { displayCode, formatMoney, quoteTotals, toDisplayDate } from "@/lib/quote-format";

type FreelanceQuoteDocumentProps = {
  quote: {
    code: string;
    revision: string | null;
    currency: string;
    taxMode: string;
    quoteDate: Date;
    clientName: string;
    clientRut: string | null;
    branch: string | null;
    commune: string | null;
    attention: string | null;
    city: string | null;
    payment: string | null;
    mainText: string;
    exclusions: string;
    warranty: string;
    executionTime: string;
    signature: string;
    items: {
      position: number;
      qty: number;
      description: string;
      unitValue: number;
    }[];
  };
};

function lines(value: string) {
  return value.split("\n").map((line, index) => (
    <span key={`${line}-${index}`}>
      {line}
      <br />
    </span>
  ));
}

export function FreelanceQuoteDocument({ quote }: FreelanceQuoteDocumentProps) {
  const totals = quoteTotals(quote.items);
  const showsIva = quote.taxMode === "IVA_INCLUDED";
  const code = displayCode(quote.code, quote.revision);
  const densityClass =
    quote.items.length >= 10 ? "freelance-density-compact" : quote.items.length >= 6 ? "freelance-density-tight" : "";

  return (
    <main className={`freelance-sheet ${densityClass}`}>
      <header className="freelance-header">
        <section className="freelance-brand">
          <Image
            alt="BYL"
            className="freelance-logo"
            height={90}
            priority
            src="/logo-byl.png"
            width={220}
          />
          <div>
            <h1>{freelanceSettings.name}</h1>
            <p>{freelanceSettings.area}</p>
            <p>{freelanceSettings.email}</p>
          </div>
        </section>
        <section className="freelance-meta">
          <h2>Presupuesto</h2>
          <p><strong>Nro</strong> {code}</p>
          <p><strong>Fecha</strong> {toDisplayDate(quote.quoteDate)}</p>
        </section>
      </header>

      <section className="freelance-intro">
        <p>{freelanceSettings.services}</p>
      </section>

      <section className="freelance-client">
        <div>
          <span>Cliente</span>
          <strong>{quote.clientName}</strong>
        </div>
        <div>
          <span>RUT</span>
          <strong>{quote.clientRut || "-"}</strong>
        </div>
        <div>
          <span>Proyecto</span>
          <strong>{quote.branch || "-"}</strong>
        </div>
        <div>
          <span>Atención</span>
          <strong>{quote.attention || "-"}</strong>
        </div>
        <div>
          <span>Ubicación</span>
          <strong>{[quote.commune, quote.city].filter(Boolean).join(", ") || "-"}</strong>
        </div>
        <div>
          <span>Pago</span>
          <strong>{quote.payment || "-"}</strong>
        </div>
      </section>

      <section className="freelance-description">
        <h3>Descripción del proyecto</h3>
        <p>{quote.mainText}</p>
      </section>

      <table className="freelance-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>QTY</th>
            <th>Servicio / Descripción</th>
            <th>Valor {quote.currency}</th>
            <th>Total {quote.currency}</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, index) => (
            <tr key={item.position}>
              <td className="center">{item.position}</td>
              <td className="center">{formatMoney(item.qty).replace(",00", "")}</td>
              <td>{item.description}</td>
              <td className="money-cell">{formatMoney(item.unitValue)}</td>
              <td className="money-cell item-total">{formatMoney(totals.itemTotals[index] ?? 0)}</td>
            </tr>
          ))}
          <tr className="freelance-total-row">
            <td colSpan={4}>{showsIva ? "Subtotal neto" : "Valor Total Neto"}</td>
            <td className="money-cell">{formatMoney(totals.net)}</td>
          </tr>
          {showsIva ? (
            <>
              <tr className="freelance-total-row">
                <td colSpan={4}>IVA 19%</td>
                <td className="money-cell">{formatMoney(totals.iva)}</td>
              </tr>
              <tr className="freelance-total-row freelance-grand-total">
                <td colSpan={4}>Total con IVA incluido</td>
                <td className="money-cell">{formatMoney(totals.gross)}</td>
              </tr>
            </>
          ) : null}
        </tbody>
      </table>

      <section className="freelance-notes">
        <div>
          <h3>Observaciones</h3>
          <p>{lines(quote.exclusions)}</p>
        </div>
        <div>
          <h3>Condiciones comerciales</h3>
          <p>{lines(quote.warranty)}</p>
        </div>
        <div>
          <h3>Plazo / vigencia</h3>
          <p>{lines(quote.executionTime)}</p>
        </div>
      </section>

      <footer className="freelance-signature">{lines(quote.signature)}</footer>
    </main>
  );
}
