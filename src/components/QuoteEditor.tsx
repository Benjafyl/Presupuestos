"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Copy, Eye, FileDown, Plus, Save, Trash2 } from "lucide-react";
import { QuotePayload, saveQuote } from "@/app/actions";
import {
  buildQuoteCode,
  Currency,
  CURRENCY_OPTIONS,
  displayCode,
  formatMoney,
  IVA_INCLUDED_EXCLUSIONS_TEXT,
  NET_EXCLUSIONS_TEXT,
  quoteTotals,
  QuoteMode,
  REVISION_OPTIONS,
  Revision,
  TaxMode,
  TAX_MODE_OPTIONS,
} from "@/lib/quote-format";
import { freelanceSettings } from "@/lib/freelance";

type ClientOption = {
  id: number;
  name: string;
  rut: string | null;
  branch: string | null;
  commune: string | null;
  attention: string | null;
  city: string | null;
  payment: string | null;
  projectCode: string | null;
};

type Settings = {
  quotePrefix: string;
  signatureDefault: string;
};

type Template = {
  mainText: string;
  exclusions: string;
  warranty: string;
  executionTime: string;
};

type QuoteEditorProps = {
  initialQuote?: QuotePayload;
  clients: ClientOption[];
  settings: Settings;
  template: Template;
  today: string;
  quoteMode?: QuoteMode;
};

const fieldClass =
  "h-9 w-full border border-neutral-300 bg-white px-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-900";
const areaClass =
  "min-h-24 w-full border border-neutral-300 bg-white p-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-900";
const labelClass = "text-xs font-bold uppercase text-neutral-700";

function blankItem() {
  return { qty: 1, description: "", unitValue: 0 };
}

function isDefaultNetExclusions(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  return (
    normalized === NET_EXCLUSIONS_TEXT ||
    normalized === "REPARACIONES, INSTALACION ELECTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO" ||
    normalized === "EXCLUYE TODO ITEM NO CONSIDERADO EN ESTA PROPUESTA, IVA."
  );
}

export function QuoteEditor({
  initialQuote,
  clients,
  settings,
  template,
  today,
  quoteMode = "interchile",
}: QuoteEditorProps) {
  const isFreelance = quoteMode === "freelance";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState("");
  const prefix = isFreelance ? freelanceSettings.quotePrefix : settings.quotePrefix;
  const signatureDefault = isFreelance ? freelanceSettings.signatureDefault : settings.signatureDefault;
  const defaultProjectCode = isFreelance ? "WEB" : "PT";
  const previewRed = isFreelance ? "bg-blue-700" : "bg-red-800";
  const accentText = isFreelance ? "text-blue-700" : "text-red-800";
  const selectedButton = isFreelance ? "bg-blue-700 text-white" : "bg-red-800 text-white";
  const editHref = (id: number) => (isFreelance ? `/freelance/quotes/${id}/edit` : `/quotes/${id}/edit`);
  const printHref = (id: number) => (isFreelance ? `/freelance/quotes/${id}/print` : `/quotes/${id}/print`);
  const labels = isFreelance
    ? {
        eyebrow: "Generador Benjamin Yanez",
        newTitle: "Nueva cotizacion freelance",
        editTitle: "Editar cotizacion freelance",
        mainText: "Descripcion del proyecto",
        exclusions: "Observaciones",
        warranty: "Condiciones comerciales",
        executionTime: "Plazo / vigencia",
        clientName: "Cliente",
        payment: "Condicion de pago",
      }
    : {
        eyebrow: "Generador InterchileClima",
        newTitle: "Nueva cotizacion",
        editTitle: "Editar cotizacion",
        mainText: "Texto principal editable",
        exclusions: "Exclusiones",
        warranty: "Garantia",
        executionTime: "Plazo de ejecucion",
        clientName: "Senores",
        payment: "Pago",
      };

  const [form, setForm] = useState<QuotePayload>(
    initialQuote ?? {
      quoteMode,
      code: buildQuoteCode(prefix, defaultProjectCode, today),
      revision: "",
      currency: "CLP",
      taxMode: "NET",
      quoteDate: today,
      projectCode: defaultProjectCode,
      clientId: null,
      saveClient: true,
      clientName: "",
      clientRut: "",
      branch: "",
      commune: "",
      attention: "",
      city: "",
      payment: isFreelance ? "50% anticipo / 50% entrega" : "A CONVENIR",
      mainText: template.mainText,
      exclusions: template.exclusions,
      warranty: template.warranty,
      executionTime: template.executionTime,
      signature: signatureDefault,
      items: [blankItem()],
    },
  );

  const totals = useMemo(() => quoteTotals(form.items), [form.items]);

  function update<K extends keyof QuotePayload>(key: K, value: QuotePayload[K]) {
    setSavedMessage("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, key: "qty" | "description" | "unitValue", value: string) {
    setSavedMessage("");
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: key === "description" ? value : value === "" ? "" : Number(value) }
          : item,
      ),
    }));
  }

  function selectClient(value: string) {
    const clientId = value ? Number(value) : null;
    const client = clients.find((item) => item.id === clientId);

    setSavedMessage("");
    setForm((current) => ({
      ...current,
      clientId,
      clientName: client?.name ?? current.clientName,
      clientRut: client?.rut ?? "",
      branch: client?.branch ?? "",
      commune: client?.commune ?? "",
      attention: client?.attention ?? "",
      city: client?.city ?? "",
      payment: client?.payment ?? current.payment,
      projectCode: client?.projectCode ?? current.projectCode,
      code: client?.projectCode ? buildQuoteCode(prefix, client.projectCode, current.quoteDate) : current.code,
    }));
  }

  function regenerateCode() {
    update("code", buildQuoteCode(prefix, form.projectCode, form.quoteDate));
  }

  function updateTaxMode(taxMode: TaxMode) {
    setSavedMessage("");
    setForm((current) => {
      let exclusions = current.exclusions;

      if (!isFreelance && taxMode === "NET" && (!exclusions.trim() || exclusions.trim() === IVA_INCLUDED_EXCLUSIONS_TEXT)) {
        exclusions = NET_EXCLUSIONS_TEXT;
      }

      if (!isFreelance && taxMode === "IVA_INCLUDED" && isDefaultNetExclusions(exclusions)) {
        exclusions = IVA_INCLUDED_EXCLUSIONS_TEXT;
      }

      return { ...current, taxMode, exclusions };
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await saveQuote(form);
      setSavedMessage("Cotizacion guardada.");
      if (!form.id) {
        router.push(editHref(result.id));
      } else {
        router.refresh();
      }
    });
  }

  const codeWithRevision = displayCode(form.code, form.revision);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div>
            <p className={`text-xs font-bold uppercase ${accentText}`}>{labels.eyebrow}</p>
            <h1 className="text-2xl font-bold text-neutral-950">{form.id ? labels.editTitle : labels.newTitle}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.id ? (
              <>
                <Link className="button-secondary" href={printHref(form.id)} target="_blank">
                  <Eye size={16} /> Vista previa
                </Link>
                <Link className="button-secondary" href={`/api/quotes/${form.id}/pdf`}>
                  <FileDown size={16} /> Exportar PDF
                </Link>
              </>
            ) : null}
            <button className="button-primary" disabled={isPending} type="button" onClick={submit}>
              <Save size={16} /> {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {savedMessage ? <p className="border border-green-300 bg-green-50 p-2 text-sm text-green-800">{savedMessage}</p> : null}

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-1 lg:col-span-2">
            <span className={labelClass}>Codigo editable</span>
            <input className={fieldClass} value={form.code} onChange={(event) => update("code", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Fecha</span>
            <input className={fieldClass} type="date" value={form.quoteDate} onChange={(event) => update("quoteDate", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Revision</span>
            <select className={fieldClass} value={form.revision} onChange={(event) => update("revision", event.target.value as Revision)}>
              {REVISION_OPTIONS.map((option) => (
                <option key={option || "none"} value={option}>
                  {option || "Sin revision"}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Codigo proyecto</span>
            <input className={fieldClass} value={form.projectCode} onChange={(event) => update("projectCode", event.target.value)} />
          </label>
          <div className="flex items-end">
            <button className="button-secondary h-9" type="button" onClick={regenerateCode}>
              <Copy size={16} /> Generar codigo
            </button>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <span className={labelClass}>Moneda</span>
            <div className="grid grid-cols-2 border border-neutral-300">
              {CURRENCY_OPTIONS.map((currency) => (
                <button
                  className={`h-9 text-sm font-bold ${form.currency === currency ? selectedButton : "bg-white text-neutral-900"}`}
                  key={currency}
                  type="button"
                  onClick={() => update("currency", currency as Currency)}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <span className={labelClass}>IVA</span>
            <div className="grid grid-cols-2 border border-neutral-300">
              {TAX_MODE_OPTIONS.map((option) => (
                <button
                  className={`h-9 text-sm font-bold ${form.taxMode === option.value ? selectedButton : "bg-white text-neutral-900"}`}
                  key={option.value}
                  type="button"
                  onClick={() => updateTaxMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="space-y-4 border-t border-neutral-200 pt-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-1 lg:col-span-2">
              <span className={labelClass}>Cliente guardado</span>
              <select className={fieldClass} value={form.clientId ?? ""} onChange={(event) => selectClient(event.target.value)}>
                <option value="">Ingresar datos manualmente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold text-neutral-800">
              <input checked={form.saveClient} className="size-4" type="checkbox" onChange={(event) => update("saveClient", event.target.checked)} />
              Guardar/actualizar cliente
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <label className="space-y-1 lg:col-span-2">
              <span className={labelClass}>{labels.clientName}</span>
              <input className={fieldClass} value={form.clientName} onChange={(event) => update("clientName", event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>RUT cliente</span>
              <input className={fieldClass} value={form.clientRut} onChange={(event) => update("clientRut", event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{isFreelance ? "Proyecto" : "Sucursal"}</span>
              <input className={fieldClass} value={form.branch} onChange={(event) => update("branch", event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Comuna</span>
              <input className={fieldClass} value={form.commune} onChange={(event) => update("commune", event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Atencion</span>
              <input className={fieldClass} value={form.attention} onChange={(event) => update("attention", event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Ciudad</span>
              <input className={fieldClass} value={form.city} onChange={(event) => update("city", event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{labels.payment}</span>
              <input className={fieldClass} value={form.payment} onChange={(event) => update("payment", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t border-neutral-200 pt-5">
          <label className="space-y-1">
            <span className={labelClass}>{labels.mainText}</span>
            <textarea className={areaClass} value={form.mainText} onChange={(event) => update("mainText", event.target.value)} />
          </label>

          <div className="overflow-x-auto border border-neutral-300">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className={`${previewRed} text-white`}>
                <tr>
                  <th className="w-14 border border-neutral-700 p-2">Item</th>
                  <th className="w-20 border border-neutral-700 p-2">QTY</th>
                  <th className="border border-neutral-700 p-2">SERVICIO / DESCRIPCION</th>
                  <th className="w-32 border border-neutral-700 p-2">Valor {form.currency}</th>
                  <th className="w-32 border border-neutral-700 p-2">Total {form.currency}</th>
                  <th className="w-12 border border-neutral-700 p-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-neutral-300 p-1 text-center font-semibold">{index + 1}</td>
                    <td className="border border-neutral-300 p-1">
                      <input className="h-8 w-full border border-neutral-200 px-2 text-right" min="0" step="0.01" type="number" value={item.qty} onChange={(event) => updateItem(index, "qty", event.target.value)} />
                    </td>
                    <td className="border border-neutral-300 p-1">
                      <input className="h-8 w-full border border-neutral-200 px-2" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                    </td>
                    <td className="border border-neutral-300 p-1">
                      <input className="h-8 w-full border border-neutral-200 px-2 text-right" min="0" step="0.01" type="number" value={item.unitValue} onChange={(event) => updateItem(index, "unitValue", event.target.value)} />
                    </td>
                    <td className="border border-neutral-300 p-2 text-right font-bold">{formatMoney(totals.itemTotals[index] ?? 0)}</td>
                    <td className="border border-neutral-300 p-1 text-center">
                      <button
                        aria-label="Eliminar item"
                        className="inline-flex size-8 items-center justify-center border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== index) : [blankItem()] }))}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="button-secondary" type="button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, blankItem()] }))}>
            <Plus size={16} /> Agregar item
          </button>
        </section>

        <section className="grid gap-4 border-t border-neutral-200 pt-5 lg:grid-cols-3">
          <label className="space-y-1">
            <span className={labelClass}>{labels.exclusions}</span>
            <textarea className={areaClass} value={form.exclusions} onChange={(event) => update("exclusions", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>{labels.warranty}</span>
            <textarea className={areaClass} value={form.warranty} onChange={(event) => update("warranty", event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>{labels.executionTime}</span>
            <textarea className={areaClass} value={form.executionTime} onChange={(event) => update("executionTime", event.target.value)} />
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className={labelClass}>Firma</span>
            <textarea className={areaClass} value={form.signature} onChange={(event) => update("signature", event.target.value)} />
          </label>
        </section>
      </section>

      <aside className="h-fit border border-neutral-300 bg-white p-4 xl:sticky xl:top-4">
        <p className="mb-3 text-xs font-bold uppercase text-neutral-700">Vista previa</p>
        <div className={`quote-preview ${isFreelance ? "freelance-preview" : ""} space-y-3 text-[11px] text-neutral-950`}>
          <div className="flex items-start justify-between gap-4">
            {isFreelance ? (
              <div>
                <Image alt="BYL" className="mb-2 h-12 w-12 object-contain" height={96} src="/logo-byl.png" width={96} />
                <p className="font-bold text-blue-900">{freelanceSettings.name}</p>
                <p className="text-neutral-600">{freelanceSettings.area}</p>
              </div>
            ) : (
              <div>
                <Image alt="Interchile Clima" className="h-auto w-36" height={78} src="/logo-interchileclima.jpeg" width={144} />
                <p className="mt-2 font-semibold">Merced 838 A of 117 / Santiago</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-base font-bold">{isFreelance ? "PRESUPUESTO" : "COTIZACION"}</p>
              <p className="font-bold">Nº {codeWithRevision}</p>
              <p className="mt-2 font-bold">{isFreelance ? freelanceSettings.email : "RUT: 76.093.202-7"}</p>
            </div>
          </div>
          <div className={`border p-2 ${isFreelance ? "border-blue-700" : "border-red-800"}`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p><b>{labels.clientName}</b> {form.clientName}</p>
              <p><b>Fecha:</b> {form.quoteDate}</p>
              <p><b>{isFreelance ? "Proyecto" : "Sucursal"}</b> {form.branch}</p>
              <p><b>RUT:</b> {form.clientRut}</p>
              <p><b>Atencion</b> {form.attention}</p>
              <p><b>Comuna:</b> {form.commune}</p>
              <p><b>{labels.payment}</b> {form.payment}</p>
              <p><b>Ciudad:</b> {form.city}</p>
            </div>
          </div>
          <p className={`${previewRed} p-2 font-bold text-white`}>{form.mainText}</p>
          <table className="w-full border-collapse">
            <thead className={`${previewRed} text-white`}>
              <tr>
                <th className="border border-black">Item</th>
                <th className="border border-black">QTY</th>
                <th className="border border-black">SERVICIO / DESCRIPCION</th>
                <th className="border border-black">Valor {form.currency}</th>
                <th className="border border-black">Total {form.currency}</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black text-center">{index + 1}</td>
                  <td className="border border-black text-center">{item.qty}</td>
                  <td className="border border-black px-1">{item.description}</td>
                  <td className="border border-black text-right">{formatMoney(Number(item.unitValue) || 0)}</td>
                  <td className="border border-black text-right font-bold">{formatMoney(totals.itemTotals[index] ?? 0)}</td>
                </tr>
              ))}
              <tr>
                <td className="border border-black text-right font-bold" colSpan={4}>{form.taxMode === "NET" ? "Valor Total Neto" : "Subtotal neto"}</td>
                <td className="border border-black text-right font-bold">{formatMoney(totals.net)}</td>
              </tr>
              {form.taxMode === "IVA_INCLUDED" ? (
                <>
                  <tr>
                    <td className="border border-black text-right font-bold" colSpan={4}>IVA 19%</td>
                    <td className="border border-black text-right font-bold">{formatMoney(totals.iva)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black text-right font-bold" colSpan={4}>Total con IVA incluido</td>
                    <td className="border border-black text-right font-bold">{formatMoney(totals.gross)}</td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
          <div className="space-y-3 whitespace-pre-wrap font-semibold">
            <p>{labels.exclusions.toUpperCase()}{"\n"}{form.exclusions}</p>
            <p>{labels.warranty.toUpperCase()}{"\n"}{form.warranty}</p>
            <p>{labels.executionTime.toUpperCase()}{"\n"}{form.executionTime}</p>
            <p>{form.signature}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
