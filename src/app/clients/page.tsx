import Link from "next/link";
import { createClient, deleteSelectedClients } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { getPrisma } from "@/lib/prisma";

const inputClass = "h-9 w-full border border-neutral-300 bg-white px-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "text-xs font-bold uppercase text-neutral-700";

type ClientsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ClientBranchRow = {
  key: string;
  branch: string | null;
  commune: string | null;
  attention: string | null;
  city: string | null;
  payment: string | null;
  projectCodes: string[];
};

type ClientGroup = {
  key: string;
  name: string;
  ruts: string[];
  clientIds: number[];
  branches: ClientBranchRow[];
  updatedAt: Date;
};

export const dynamic = "force-dynamic";

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

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function textIncludes(value: string | null | undefined, query: string) {
  return normalizeForKey(value).includes(normalizeForKey(query));
}

function branchGroupKey(branch: {
  branch: string | null;
  commune: string | null;
  attention: string | null;
  city: string | null;
  payment: string | null;
}) {
  return [branch.branch, branch.commune, branch.attention, branch.city, branch.payment].map(normalizeForKey).join("|");
}

function dedupeBranches(branches: ClientBranchRow[]) {
  const grouped = new Map<string, ClientBranchRow>();

  for (const branch of branches) {
    const key = branchGroupKey(branch) || branch.key;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...branch, key, projectCodes: [...branch.projectCodes] });
      continue;
    }

    for (const projectCode of branch.projectCodes) {
      if (projectCode && !existing.projectCodes.includes(projectCode)) existing.projectCodes.push(projectCode);
    }
  }

  return Array.from(grouped.values()).map((branch) => ({
    ...branch,
    projectCodes: branch.projectCodes.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })),
  }));
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const clients = await getPrisma().client.findMany({
    orderBy: { updatedAt: "desc" },
    include: { branches: { orderBy: [{ branch: "asc" }, { commune: "asc" }, { projectCode: "asc" }] } },
  });

  const groupsByName = new Map<string, ClientGroup>();

  for (const client of clients) {
    const key = normalizeForKey(client.name) || `CLIENT-${client.id}`;
    const group =
      groupsByName.get(key) ??
      ({
        key,
        name: client.name,
        ruts: [],
        clientIds: [],
        branches: [],
        updatedAt: client.updatedAt,
      } satisfies ClientGroup);

    if (!group.clientIds.includes(client.id)) group.clientIds.push(client.id);
    if (client.rut && !group.ruts.includes(client.rut)) group.ruts.push(client.rut);
    if (client.updatedAt > group.updatedAt) group.updatedAt = client.updatedAt;

    const branchRows =
      client.branches.length > 0
        ? client.branches.map((branch) => ({
            key: `${client.id}-${branch.id}`,
            branch: branch.branch,
            commune: branch.commune,
            attention: branch.attention,
            city: branch.city,
            payment: branch.payment,
            projectCodes: branch.projectCode ? [branch.projectCode] : [],
          }))
        : [
            {
              key: `${client.id}-legacy`,
              branch: client.branch,
              commune: client.commune,
              attention: client.attention,
              city: client.city,
              payment: client.payment,
              projectCodes: client.projectCode ? [client.projectCode] : [],
            },
          ];

    group.branches.push(...branchRows);
    groupsByName.set(key, group);
  }

  const groups = Array.from(groupsByName.values())
    .map((group) => ({
      ...group,
      branches: dedupeBranches(group.branches).sort((a, b) =>
        `${a.branch ?? ""} ${a.commune ?? ""}`.localeCompare(
          `${b.branch ?? ""} ${b.commune ?? ""}`,
          "es",
          { sensitivity: "base" },
        ),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  const filteredGroups = query
    ? groups.filter((group) => {
        const branchText = group.branches
          .map((branch) => [branch.branch, branch.commune, branch.attention, branch.city, branch.payment, ...branch.projectCodes].join(" "))
          .join(" ");
        return (
          textIncludes(group.name, query) ||
          group.ruts.some((rut) => textIncludes(rut, query)) ||
          textIncludes(branchText, query)
        );
      })
    : groups;

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase text-red-800">Clientes</p>
        <h1 className="text-2xl font-bold">Crear y guardar clientes</h1>
      </div>

      <form action={createClient} className="mb-6 grid gap-4 border border-neutral-300 bg-white p-4 lg:grid-cols-4">
        <label className="space-y-1 lg:col-span-2">
          <span className={labelClass}>Senores</span>
          <input className={inputClass} name="name" required />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>RUT cliente</span>
          <input className={inputClass} name="rut" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Codigo proyecto</span>
          <input className={inputClass} name="projectCode" placeholder="PT" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Sucursal</span>
          <input className={inputClass} name="branch" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Comuna</span>
          <input className={inputClass} name="commune" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Atencion</span>
          <input className={inputClass} name="attention" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Ciudad</span>
          <input className={inputClass} name="city" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Pago</span>
          <input className={inputClass} defaultValue="A CONVENIR" name="payment" />
        </label>
        <div className="flex items-end">
          <button className="button-primary h-9" type="submit">
            Guardar cliente
          </button>
        </div>
      </form>

      <div className="mb-4 border border-neutral-300 bg-white p-4">
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" method="get">
          <label className="space-y-1">
            <span className={labelClass}>Buscar cliente, sucursal, comuna o codigo</span>
            <input className={inputClass} defaultValue={query} name="q" placeholder="Ej: Falabella, Temuco, R00F1" />
          </label>
          <div className="flex items-end">
            <button className="button-primary h-9" type="submit">
              Buscar
            </button>
          </div>
          <div className="flex items-end">
            <Link className="button-secondary h-9" href="/clients">
              Limpiar
            </Link>
          </div>
        </form>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm text-neutral-600">
        <span>
          {filteredGroups.length} clientes / {filteredGroups.reduce((total, group) => total + group.branches.length, 0)} sucursales
        </span>
        <span>Haz clic en un cliente para ver sus sucursales.</span>
      </div>

      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="border border-neutral-300 bg-white p-8 text-center text-neutral-500">No hay clientes guardados.</div>
        ) : (
          filteredGroups.map((group) => {
            const communes = uniqueValues(group.branches.map((branch) => branch.commune)).slice(0, 3);
            const summaryCommunes = communes.length > 0 ? communes.join(", ") : "-";
            return (
              <details key={group.key} className="border border-neutral-300 bg-white">
                <summary className="grid cursor-pointer list-none gap-3 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-neutral-500">Cliente</p>
                    <p className="font-bold">{group.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-neutral-500">RUT</p>
                    <p>{group.ruts.length > 0 ? group.ruts.join(", ") : "-"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-neutral-500">Sucursales</p>
                    <p className="font-semibold">{group.branches.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-neutral-500">Comunas</p>
                    <p>{summaryCommunes}</p>
                  </div>
                </summary>
                <div className="border-t border-neutral-200 p-4">
                  <div className="mb-3 flex justify-end">
                    <form action={deleteSelectedClients}>
                      {group.clientIds.map((id) => (
                        <input key={id} name="clientIds" type="hidden" value={id} />
                      ))}
                      <ConfirmSubmitButton
                        message={`Eliminar el cliente ${group.name} y todas sus sucursales guardadas?`}
                        title="Eliminar cliente"
                      />
                    </form>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-sm">
                      <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-700">
                        <tr>
                          <th className="border-b border-neutral-300 p-3">Sucursal</th>
                          <th className="border-b border-neutral-300 p-3">Comuna</th>
                          <th className="border-b border-neutral-300 p-3">Atencion</th>
                          <th className="border-b border-neutral-300 p-3">Ciudad</th>
                          <th className="border-b border-neutral-300 p-3">Pago</th>
                          <th className="border-b border-neutral-300 p-3">Codigos proyecto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.branches.map((branch) => (
                          <tr key={branch.key} className="border-b border-neutral-200 last:border-b-0">
                            <td className="p-3">{branch.branch || "-"}</td>
                            <td className="p-3">{branch.commune || "-"}</td>
                            <td className="p-3">{branch.attention || "-"}</td>
                            <td className="p-3">{branch.city || "-"}</td>
                            <td className="p-3">{branch.payment || "-"}</td>
                            <td className="p-3 font-mono text-xs font-bold">
                              {branch.projectCodes.length > 0 ? branch.projectCodes.join(", ") : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
