import { saveSettings } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { ensureCompanySettings, ensureTemplateText } from "@/lib/defaults";

const inputClass = "h-9 w-full border border-neutral-300 bg-white px-2 text-sm outline-none focus:border-neutral-900";
const textareaClass = "min-h-28 w-full border border-neutral-300 bg-white p-2 text-sm outline-none focus:border-neutral-900";
const labelClass = "text-xs font-bold uppercase text-neutral-700";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, template] = await Promise.all([ensureCompanySettings(), ensureTemplateText()]);

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase text-red-800">Configuración</p>
        <h1 className="text-2xl font-bold">Empresa y textos por defecto</h1>
      </div>

      <form action={saveSettings} className="space-y-6 bg-white">
        <section className="grid gap-4 border border-neutral-300 p-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClass}>Nombre empresa</span>
            <input className={inputClass} defaultValue={settings.name} name="name" />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>RUT</span>
            <input className={inputClass} defaultValue={settings.rut} name="rut" />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className={labelClass}>Dirección</span>
            <input className={inputClass} defaultValue={settings.address} name="address" />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Prefijo de cotización</span>
            <input className={inputClass} defaultValue={settings.quotePrefix} name="quotePrefix" />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Responsable</span>
            <input className={inputClass} defaultValue={settings.responsible} name="responsible" />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className={labelClass}>Firma por defecto</span>
            <textarea className={textareaClass} defaultValue={settings.signatureDefault} name="signatureDefault" />
          </label>
        </section>

        <section className="grid gap-4 border border-neutral-300 p-4">
          <label className="space-y-1">
            <span className={labelClass}>Texto principal por defecto</span>
            <textarea className={textareaClass} defaultValue={template.mainText} name="mainText" />
          </label>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-1">
              <span className={labelClass}>Exclusiones</span>
              <textarea className={textareaClass} defaultValue={template.exclusions} name="exclusions" />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Garantía</span>
              <textarea className={textareaClass} defaultValue={template.warranty} name="warranty" />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Plazo de ejecución</span>
              <textarea className={textareaClass} defaultValue={template.executionTime} name="executionTime" />
            </label>
          </div>
        </section>

        <button className="button-primary" type="submit">
          Guardar configuración
        </button>
      </form>
    </AppShell>
  );
}
