import Link from "next/link";
import { Copy, FileDown, Pencil, Plus } from "lucide-react";
import { deleteQuote, duplicateQuote } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { getPrisma } from "@/lib/prisma";
import { displayCode, formatMoney, quoteTotals, QuoteMode, toDisplayDate } from "@/lib/quote-format";

type QuoteListProps = {
  mode: QuoteMode;
  eyebrow: string;
  title: string;
  newHref: string;
  editHref: (id: number) => string;
  accentClass?: string;
};

export async function QuoteList({
  mode,
  eyebrow,
  title,
  newHref,
  editHref,
  accentClass = "text-red-800",
}: QuoteListProps) {
  const quotes = await getPrisma().quote.findMany({
    where: { quoteMode: mode },
    include: { items: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase ${accentClass}`}>{eyebrow}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <Link className="button-primary" href={newHref}>
          <Plus size={16} /> Nueva cotización
        </Link>
      </div>

      <div className="overflow-x-auto border border-neutral-300 bg-white">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-700">
            <tr>
              <th className="border-b border-neutral-300 p-3">Código</th>
              <th className="border-b border-neutral-300 p-3">Cliente</th>
              <th className="border-b border-neutral-300 p-3">Fecha</th>
              <th className="border-b border-neutral-300 p-3">Moneda</th>
              <th className="border-b border-neutral-300 p-3 text-right">Valor total neto</th>
              <th className="border-b border-neutral-300 p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-neutral-500" colSpan={6}>
                  No hay cotizaciones guardadas todavía.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const total = quoteTotals(quote.items).net;
                return (
                  <tr key={quote.id} className="border-b border-neutral-200 last:border-b-0">
                    <td className="p-3 font-mono text-xs font-bold">{displayCode(quote.code, quote.revision)}</td>
                    <td className="p-3 font-semibold">{quote.clientName}</td>
                    <td className="p-3">{toDisplayDate(quote.quoteDate)}</td>
                    <td className="p-3">{quote.currency}</td>
                    <td className="p-3 text-right font-bold">{formatMoney(total)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Link className="button-secondary" href={editHref(quote.id)} title="Editar">
                          <Pencil size={16} /> Editar
                        </Link>
                        <form action={duplicateQuote.bind(null, quote.id)}>
                          <button className="button-secondary" type="submit" title="Duplicar">
                            <Copy size={16} /> Duplicar
                          </button>
                        </form>
                        <Link className="button-secondary" href={`/api/quotes/${quote.id}/pdf`} title="Exportar PDF">
                          <FileDown size={16} /> PDF
                        </Link>
                        <form action={deleteQuote.bind(null, quote.id)}>
                          <ConfirmSubmitButton
                            message={`¿Eliminar el presupuesto ${displayCode(quote.code, quote.revision)}? Esta acción no se puede deshacer.`}
                            title="Eliminar presupuesto"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
