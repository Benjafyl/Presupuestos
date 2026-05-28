import { createClient } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { getPrisma } from "@/lib/prisma";

const inputClass = "h-9 w-full border border-neutral-300 bg-white px-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "text-xs font-bold uppercase text-neutral-700";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getPrisma().client.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase text-red-800">Clientes</p>
        <h1 className="text-2xl font-bold">Crear y guardar clientes</h1>
      </div>

      <form action={createClient} className="mb-6 grid gap-4 border border-neutral-300 bg-white p-4 lg:grid-cols-4">
        <label className="space-y-1 lg:col-span-2">
          <span className={labelClass}>Señores</span>
          <input className={inputClass} name="name" required />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>RUT cliente</span>
          <input className={inputClass} name="rut" />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Código proyecto</span>
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
          <span className={labelClass}>Atención</span>
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

      <div className="overflow-x-auto border border-neutral-300 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-700">
            <tr>
              <th className="border-b border-neutral-300 p-3">Cliente</th>
              <th className="border-b border-neutral-300 p-3">RUT</th>
              <th className="border-b border-neutral-300 p-3">Sucursal</th>
              <th className="border-b border-neutral-300 p-3">Comuna</th>
              <th className="border-b border-neutral-300 p-3">Atención</th>
              <th className="border-b border-neutral-300 p-3">Código proyecto</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-neutral-500" colSpan={6}>
                  No hay clientes guardados.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="border-b border-neutral-200 last:border-b-0">
                  <td className="p-3 font-semibold">{client.name}</td>
                  <td className="p-3">{client.rut}</td>
                  <td className="p-3">{client.branch}</td>
                  <td className="p-3">{client.commune}</td>
                  <td className="p-3">{client.attention}</td>
                  <td className="p-3 font-mono text-xs font-bold">{client.projectCode}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
