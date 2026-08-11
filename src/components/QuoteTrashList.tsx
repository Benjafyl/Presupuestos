import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import {
  permanentlyDeleteQuote,
  permanentlyDeleteSelectedQuotes,
  restoreQuote,
  restoreSelectedQuotes,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { getPrisma } from "@/lib/prisma";
import { displayCode, formatMoney, quoteTotals, QuoteMode, toDisplayDate } from "@/lib/quote-format";
import { daysUntilDelete, purgeExpiredDeletedQuotes } from "@/lib/quote-trash";

type QuoteTrashListProps = {
  mode: QuoteMode;
  backHref: string;
  accentClass?: string;
};

export async function QuoteTrashList({ mode, backHref, accentClass = "text-red-800" }: QuoteTrashListProps) {
  await purgeExpiredDeletedQuotes();

  const quotes = await getPrisma().quote.findMany({
    where: { quoteMode: mode, deletedAt: { not: null } },
    include: { items: { orderBy: { position: "asc" } } },
    orderBy: { deletedAt: "desc" },
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase ${accentClass}`}>Papelera de presupuestos</p>
          <h1 className="text-2xl font-bold">Presupuestos eliminados</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Puedes restaurarlos durante 5 dias. Despues se eliminan permanentemente.
          </p>
        </div>
        <Link className="button-secondary" href={backHref}>
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <form action={restoreSelectedQuotes} className="space-y-3">
        <div className="flex flex-wrap justify-end gap-2">
          <button className="button-secondary" type="submit">
            <RotateCcw size={16} /> Restaurar seleccionados
          </button>
          <ConfirmSubmitButton
            formAction={permanentlyDeleteSelectedQuotes}
            label="Eliminar definitivo"
            message="Eliminar definitivamente los presupuestos seleccionados? Esta accion no se puede deshacer."
            title="Eliminar definitivamente seleccionados"
          />
        </div>

        <div className="overflow-x-auto border border-neutral-300 bg-white">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-700">
              <tr>
                <th className="w-12 border-b border-neutral-300 p-3">Sel.</th>
                <th className="border-b border-neutral-300 p-3">Codigo</th>
                <th className="border-b border-neutral-300 p-3">Cliente</th>
                <th className="border-b border-neutral-300 p-3">Fecha</th>
                <th className="border-b border-neutral-300 p-3 text-right">Valor total neto</th>
                <th className="border-b border-neutral-300 p-3">Eliminado</th>
                <th className="border-b border-neutral-300 p-3">Dias restantes</th>
                <th className="border-b border-neutral-300 p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-neutral-500" colSpan={8}>
                    No hay presupuestos en papelera.
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const total = quoteTotals(quote.items).net;
                  return (
                    <tr key={quote.id} className="border-b border-neutral-200 last:border-b-0">
                      <td className="p-3">
                        <input className="size-4" name="quoteIds" type="checkbox" value={quote.id} />
                      </td>
                      <td className="p-3 font-mono text-xs font-bold">{displayCode(quote.code, quote.revision)}</td>
                      <td className="p-3 font-semibold">{quote.clientName}</td>
                      <td className="p-3">{toDisplayDate(quote.quoteDate)}</td>
                      <td className="p-3 text-right font-bold">{formatMoney(total)}</td>
                      <td className="p-3">{quote.deletedAt ? toDisplayDate(quote.deletedAt) : "-"}</td>
                      <td className="p-3">{daysUntilDelete(quote.deleteExpiresAt)} dias</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button className="button-secondary" formAction={restoreQuote.bind(null, quote.id)} type="submit">
                            <RotateCcw size={16} /> Restaurar
                          </button>
                          <ConfirmSubmitButton
                            formAction={permanentlyDeleteQuote.bind(null, quote.id)}
                            label="Definitivo"
                            message={`Eliminar definitivamente el presupuesto ${displayCode(quote.code, quote.revision)}? Esta accion no se puede deshacer.`}
                            title="Eliminar definitivo"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </form>
    </>
  );
}
