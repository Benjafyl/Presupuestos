import Image from "next/image";
import { displayCode, formatMoney, quoteTotals, toDisplayDate } from "@/lib/quote-format";

type QuoteDocumentProps = {
  settings: {
    name: string;
    rut: string;
    address: string;
  };
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

function signatureLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => (
      <span className={index === 0 ? "signature-greeting" : "signature-name"} key={`${line}-${index}`}>
        {line}
      </span>
    ));
}

export function QuoteDocument({ settings, quote }: QuoteDocumentProps) {
  const totals = quoteTotals(quote.items);
  const code = displayCode(quote.code, quote.revision);
  const showsIva = quote.taxMode === "IVA_INCLUDED";

  return (
    <main className="quote-sheet quote-root">
      <header className="quote-header">
        <section className="quote-brand">
          <Image alt="Interchile Clima" height={114} priority src="/logo-interchileclima.jpeg" width={210} />
          <p>{settings.address}</p>
        </section>
        <section className="quote-meta">
          <h1 className="quote-title">COTIZACIÓN</h1>
          <div className="quote-meta-row">
            <strong className="quote-meta-label">Nº</strong>
            <strong className="quote-meta-value">{code}</strong>
          </div>
          <div className="quote-meta-row">
            <strong className="quote-meta-label">RUT:</strong>
            <strong className="quote-meta-value">{settings.rut}</strong>
          </div>
        </section>
      </header>

      <section className="service-box">
        <div className="service-title">DATOS SERVICIO</div>
        <div className="service-date">
          <strong className="service-label">Fecha:</strong>
          <span className="service-value">{toDisplayDate(quote.quoteDate)}</span>
        </div>
        <div className="service-grid">
          <div className="service-left">
            <div>
              <strong className="service-label">Señores</strong>
              <span className="service-value">{quote.clientName}</span>
            </div>
            <div>
              <strong className="service-label">Sucursal</strong>
              <span className="service-value">{quote.branch}</span>
            </div>
            <div>
              <strong className="service-label">Atención</strong>
              <span className="service-value">{quote.attention}</span>
            </div>
            <div>
              <strong className="service-label">PAGO</strong>
              <span className="service-value">{quote.payment}</span>
            </div>
          </div>
          <div className="service-right">
            <div>
              <strong className="service-label">RUT:</strong>
              <span className="service-value">{quote.clientRut}</span>
            </div>
            <div>
              <strong className="service-label">Comuna:</strong>
              <span className="service-value">{quote.commune}</span>
            </div>
            <div>
              <strong className="service-label">Ciudad:</strong>
              <span className="service-value">{quote.city}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="main-text">{quote.mainText}</section>

      <table className="items-table">
        <thead className="table-header">
          <tr>
            <th>Ítem</th>
            <th>QTY</th>
            <th>SERVICIO / DESCRIPCIÓN</th>
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
          <tr className="net-row">
            <td className="totals-label" colSpan={4}>{showsIva ? "Subtotal neto" : "Valor Total Neto"}</td>
            <td className="totals-value">{formatMoney(totals.net)}</td>
          </tr>
          {showsIva ? (
            <>
              <tr className="net-row">
                <td className="totals-label" colSpan={4}>IVA 19%</td>
                <td className="totals-value">{formatMoney(totals.iva)}</td>
              </tr>
              <tr className="net-row final-total-row">
                <td className="totals-label" colSpan={4}>Total con IVA incluido</td>
                <td className="totals-value">{formatMoney(totals.gross)}</td>
              </tr>
            </>
          ) : null}
        </tbody>
      </table>

      <section className="final-section">
        <h2 className="section-title">EXCLUSIONES</h2>
        <p>{lines(quote.exclusions)}</p>
      </section>
      <section className="final-section">
        <h2 className="section-title">GARANTÍA</h2>
        <p>{lines(quote.warranty)}</p>
      </section>
      <section className="final-section">
        <h2 className="section-title">PLAZO DE EJECUCIÓN</h2>
        <p>{lines(quote.executionTime)}</p>
      </section>
      <section className="signature">{signatureLines(quote.signature)}</section>
    </main>
  );
}
