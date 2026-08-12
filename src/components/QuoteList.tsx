import Link from "next/link";
import { Copy, FileDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { deleteQuote, deleteSelectedQuotes, duplicateQuote } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { getPrisma } from "@/lib/prisma";
import { displayCode, formatMoney, quoteTotals, QuoteMode, toDisplayDate } from "@/lib/quote-format";
import { purgeExpiredDeletedQuotes } from "@/lib/quote-trash";

const PAGE_SIZE = 25;
const inputClass = "h-9 w-full border border-neutral-300 bg-white px-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "text-xs font-bold uppercase text-neutral-700";

type QuoteListSearchParams = {
  q?: string | string[];
  client?: string | string[];
  branch?: string | string[];
  currency?: string | string[];
  page?: string | string[];
};

type QuoteListProps = {
  mode: QuoteMode;
  eyebrow: string;
  title: string;
  newHref: string;
  editHref: (id: number) => string;
  accentClass?: string;
  searchParams?: QuoteListSearchParams;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeForKey(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function uniqueOptions(values: Array<string | null | undefined>) {
  const options = new Map<string, string>();

  for (const value of values) {
    const clean = String(value ?? "").trim();
    if (!clean) continue;
    const key = normalizeForKey(clean);
    if (!options.has(key)) options.set(key, clean);
  }

  return Array.from(options.values()).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function containsInsensitive(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

function equalsInsensitive(value: string) {
  return { equals: value, mode: "insensitive" as const };
}

export async function QuoteList({
  mode,
  eyebrow,
  title,
  newHref,
  editHref,
  accentClass = "text-red-800",
  searchParams,
}: QuoteListProps) {
  await purgeExpiredDeletedQuotes();

  const prisma = getPrisma();
  const query = firstParam(searchParams?.q).trim();
  const selectedClient = firstParam(searchParams?.client).trim();
  const selectedBranch = firstParam(searchParams?.branch).trim();
  const selectedCurrency = firstParam(searchParams?.currency).trim().toUpperCase();
  const requestedPage = Math.max(1, Number(firstParam(searchParams?.page)) || 1);

  const where: Prisma.QuoteWhereInput = { quoteMode: mode, deletedAt: null };
  const andFilters: Prisma.QuoteWhereInput[] = [];

  if (query) {
    andFilters.push({
      OR: [
        { code: containsInsensitive(query) },
        { revision: containsInsensitive(query) },
        { clientName: containsInsensitive(query) },
        { clientRut: containsInsensitive(query) },
        { branch: containsInsensitive(query) },
        { commune: containsInsensitive(query) },
        { attention: containsInsensitive(query) },
        { city: containsInsensitive(query) },
        { projectCode: containsInsensitive(query) },
      ],
    });
  }

  if (selectedClient) {
    andFilters.push({ clientName: equalsInsensitive(selectedClient) });
  }

  if (selectedBranch) {
    andFilters.push({ branch: equalsInsensitive(selectedBranch) });
  }

  if (selectedCurrency === "CLP" || selectedCurrency === "UF") {
    andFilters.push({ currency: selectedCurrency });
  }

  if (andFilters.length > 0) where.AND = andFilters;

  const [filterRows, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where: { quoteMode: mode, deletedAt: null },
      select: { clientName: true, branch: true },
      orderBy: [{ clientName: "asc" }, { branch: "asc" }],
    }),
    prisma.quote.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const quotes = await prisma.quote.findMany({
    where,
    include: { items: { orderBy: { position: "asc" } } },
    orderBy: [{ clientName: "asc" }, { branch: "asc" }, { quoteDate: "desc" }, { updatedAt: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const clientOptions = uniqueOptions(filterRows.map((row) => row.clientName));
  const branchOptions = uniqueOptions(
    filterRows
      .filter((row) => !selectedClient || normalizeForKey(row.clientName) === normalizeForKey(selectedClient))
      .map((row) => row.branch),
  );
  const trashHref = mode === "freelance" ? "/freelance/trash" : "/interchile/trash";
  const hasFilters = Boolean(query || selectedClient || selectedBranch || selectedCurrency);
  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedClient) params.set("client", selectedClient);
    if (selectedBranch) params.set("branch", selectedBranch);
    if (selectedCurrency) params.set("currency", selectedCurrency);
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "?";
  }

  const groupedQuotes = Array.from(
    quotes
      .reduce(
        (groups, quote) => {
          const clientName = quote.clientName.trim() || "Cliente sin nombre";
          const clientKey = normalizeForKey(clientName) || `CLIENT-${quote.id}`;
          const branchName = quote.branch?.trim() || "Sin sucursal";
          const branchKey = normalizeForKey(branchName) || `BRANCH-${quote.id}`;
          const group =
            groups.get(clientKey) ??
            ({
              key: clientKey,
              name: clientName,
              branches: new Map<string, { key: string; name: string; quotes: typeof quotes }>(),
            } satisfies {
              key: string;
              name: string;
              branches: Map<string, { key: string; name: string; quotes: typeof quotes }>;
            });
          const branch =
            group.branches.get(branchKey) ??
            ({
              key: branchKey,
              name: branchName,
              quotes: [],
            } satisfies { key: string; name: string; quotes: typeof quotes });

          branch.quotes.push(quote);
          group.branches.set(branchKey, branch);
          groups.set(clientKey, group);
          return groups;
        },
        new Map<
          string,
          {
            key: string;
            name: string;
            branches: Map<string, { key: string; name: string; quotes: typeof quotes }>;
          }
        >(),
      )
      .values(),
  )
    .map((group) => ({
      ...group,
      branches: Array.from(group.branches.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase ${accentClass}`}>{eyebrow}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="button-secondary" href={trashHref}>
            <Trash2 size={16} /> Papelera
          </Link>
          <Link className="button-primary" href={newHref}>
            <Plus size={16} /> Nueva cotizacion
          </Link>
        </div>
      </div>

      <form className="mb-4 grid gap-3 border border-neutral-300 bg-white p-4 lg:grid-cols-[1.5fr_1fr_1fr_140px_auto_auto]" method="get">
        <label className="space-y-1">
          <span className={labelClass}>Buscar presupuesto</span>
          <input className={inputClass} defaultValue={query} name="q" placeholder="Codigo, cliente, sucursal, proyecto..." />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Cliente</span>
          <select className={inputClass} defaultValue={selectedClient} name="client">
            <option value="">Todos</option>
            {clientOptions.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Sucursal</span>
          <select className={inputClass} defaultValue={selectedBranch} name="branch">
            <option value="">Todas</option>
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Moneda</span>
          <select className={inputClass} defaultValue={selectedCurrency} name="currency">
            <option value="">Todas</option>
            <option value="CLP">CLP</option>
            <option value="UF">UF</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="button-primary h-9" type="submit">
            <Search size={16} /> Filtrar
          </button>
        </div>
        <div className="flex items-end">
          <Link className="button-secondary h-9" href="?">
            Limpiar
          </Link>
        </div>
      </form>

      <form action={deleteSelectedQuotes} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
          <span>
            Mostrando {firstItem}-{lastItem} de {totalCount} presupuestos{hasFilters ? " filtrados" : ""}
          </span>
          <ConfirmSubmitButton
            label="Eliminar seleccionados"
            message="Eliminar los presupuestos seleccionados? Se moveran a la papelera por 5 dias."
            title="Eliminar presupuestos seleccionados"
          />
        </div>

        <div className="space-y-3">
          {groupedQuotes.length === 0 ? (
            <div className="border border-neutral-300 bg-white p-8 text-center text-neutral-500">
              No hay cotizaciones para los filtros seleccionados.
            </div>
          ) : (
            groupedQuotes.map((clientGroup) => {
              const quoteCount = clientGroup.branches.reduce((count, branch) => count + branch.quotes.length, 0);
              return (
                <details key={clientGroup.key} className="border border-neutral-300 bg-white">
                  <summary className="grid cursor-pointer list-none gap-3 p-4 text-sm md:grid-cols-[2fr_1fr_1fr]">
                    <div>
                      <p className="text-[11px] font-bold uppercase text-neutral-500">Cliente</p>
                      <p className="font-bold">{clientGroup.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-neutral-500">Sucursales</p>
                      <p className="font-semibold">{clientGroup.branches.length}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-neutral-500">Presupuestos</p>
                      <p className="font-semibold">{quoteCount}</p>
                    </div>
                  </summary>
                  <div className="space-y-3 border-t border-neutral-200 p-4">
                    {clientGroup.branches.map((branchGroup) => (
                      <details key={branchGroup.key} className="border border-neutral-200 bg-white">
                        <summary className="grid cursor-pointer list-none gap-3 bg-neutral-50 p-3 text-sm md:grid-cols-[2fr_1fr]">
                          <div>
                            <p className="text-[11px] font-bold uppercase text-neutral-500">Sucursal</p>
                            <p className="font-semibold">{branchGroup.name}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase text-neutral-500">Presupuestos</p>
                            <p className="font-semibold">{branchGroup.quotes.length}</p>
                          </div>
                        </summary>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[980px] border-collapse text-sm">
                            <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-700">
                              <tr>
                                <th className="w-12 border-b border-neutral-300 p-3">Sel.</th>
                                <th className="border-b border-neutral-300 p-3">Codigo</th>
                                <th className="border-b border-neutral-300 p-3">Fecha</th>
                                <th className="border-b border-neutral-300 p-3">Moneda</th>
                                <th className="border-b border-neutral-300 p-3 text-right">Valor total neto</th>
                                <th className="border-b border-neutral-300 p-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {branchGroup.quotes.map((quote) => {
                                const total = quoteTotals(quote.items).net;
                                return (
                                  <tr key={quote.id} className="border-b border-neutral-200 last:border-b-0">
                                    <td className="p-3">
                                      <input className="size-4" name="quoteIds" type="checkbox" value={quote.id} />
                                    </td>
                                    <td className="p-3 font-mono text-xs font-bold">{displayCode(quote.code, quote.revision)}</td>
                                    <td className="p-3">{toDisplayDate(quote.quoteDate)}</td>
                                    <td className="p-3">{quote.currency}</td>
                                    <td className="p-3 text-right font-bold">{formatMoney(total)}</td>
                                    <td className="p-3">
                                      <div className="flex justify-end gap-2">
                                        <Link className="button-secondary" href={editHref(quote.id)} title="Editar">
                                          <Pencil size={16} /> Editar
                                        </Link>
                                        <button
                                          className="button-secondary"
                                          formAction={duplicateQuote.bind(null, quote.id)}
                                          type="submit"
                                          title="Duplicar"
                                        >
                                          <Copy size={16} /> Duplicar
                                        </button>
                                        <Link className="button-secondary" href={`/api/quotes/${quote.id}/pdf`} title="Exportar PDF">
                                          <FileDown size={16} /> PDF
                                        </Link>
                                        <ConfirmSubmitButton
                                          formAction={deleteQuote.bind(null, quote.id)}
                                          message={`Eliminar el presupuesto ${displayCode(quote.code, quote.revision)}? Se movera a la papelera por 5 dias.`}
                                          title="Eliminar presupuesto"
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-neutral-600">
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage <= 1 ? (
              <span className="button-secondary pointer-events-none opacity-50">Anterior</span>
            ) : (
              <Link className="button-secondary" href={pageHref(currentPage - 1)}>
                Anterior
              </Link>
            )}
            {currentPage >= totalPages ? (
              <span className="button-secondary pointer-events-none opacity-50">Siguiente</span>
            ) : (
              <Link className="button-secondary" href={pageHref(currentPage + 1)}>
                Siguiente
              </Link>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
