"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  quoteTableRows,
  quoteTotals,
  QuoteItemRowType,
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
const AUTOSAVE_DELAY_MS = 900;

type SaveState = "idle" | "saving" | "saved" | "error";

function blankItem() {
  return { rowType: "item" as QuoteItemRowType, qty: 1, description: "", unitValue: 0 };
}

function blankSection() {
  return { rowType: "section" as QuoteItemRowType, qty: 0, description: "NUEVO TITULO", unitValue: 0 };
}

function isBlankDefaultItem(item: QuotePayload["items"][number]) {
  return item.rowType !== "section" && Number(item.qty) === 1 && !item.description.trim() && Number(item.unitValue) === 0;
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const prefix = isFreelance ? freelanceSettings.quotePrefix : settings.quotePrefix;
  const signatureDefault = isFreelance ? freelanceSettings.signatureDefault : settings.signatureDefault;
  const defaultProjectCode = isFreelance ? "WEB" : "PT";
  const previewRed = isFreelance ? "bg-blue-700" : "bg-red-800";
  const accentText = isFreelance ? "text-blue-700" : "text-red-800";
  const selectedButton = isFreelance ? "bg-blue-700 text-white" : "bg-red-800 text-white";
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

  const formRef = useRef(form);
  const changeVersionRef = useRef(0);
  const savingRef = useRef(false);
  const autoSaveFailedRef = useRef(false);

  const totals = useMemo(() => quoteTotals(form.items), [form.items]);
  const tableRows = useMemo(() => quoteTableRows(form.items.map((item, index) => ({ ...item, position: index + 1 }))), [form.items]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  function markChanged() {
    changeVersionRef.current += 1;
    autoSaveFailedRef.current = false;
    setIsDirty(true);
    setSaveState("idle");
  }

  function update<K extends keyof QuotePayload>(key: K, value: QuotePayload[K]) {
    markChanged();
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, key: "qty" | "description" | "unitValue", value: string) {
    markChanged();
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

    markChanged();
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
    markChanged();
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

  function addItem() {
    markChanged();
    setForm((current) => ({ ...current, items: [...current.items, blankItem()] }));
  }

  function addSection() {
    markChanged();
    setForm((current) => {
      if (current.items.length === 1 && isBlankDefaultItem(current.items[0])) {
        return { ...current, items: [blankSection()] };
      }

      return { ...current, items: [...current.items, blankSection()] };
    });
  }

  function addSectionAtStart() {
    markChanged();
    setForm((current) => {
      if (current.items.length === 1 && isBlankDefaultItem(current.items[0])) {
        return { ...current, items: [blankSection()] };
      }

      return { ...current, items: [blankSection(), ...current.items] };
    });
  }

  const persist = useCallback(async (manual = false) => {
    if (savingRef.current || (!manual && (!isDirty || autoSaveFailedRef.current))) return;

    const snapshot = formRef.current;
    const savedVersion = changeVersionRef.current;
    savingRef.current = true;
    setIsSaving(true);
    setSaveState("saving");

    try {
      const result = await saveQuote(snapshot);
      setForm((current) => ({
        ...current,
        id: result.id,
        clientId: result.clientId ?? current.clientId,
      }));

      if (savedVersion === changeVersionRef.current) {
        setIsDirty(false);
      }
      setSaveState("saved");

      if (!snapshot.id) {
        router.replace(isFreelance ? `/freelance/quotes/${result.id}/edit` : `/quotes/${result.id}/edit`);
      }
    } catch {
      autoSaveFailedRef.current = true;
      setSaveState("error");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [isDirty, isFreelance, router]);

  useEffect(() => {
    if (!isDirty || savingRef.current || autoSaveFailedRef.current) return;

    const timeout = window.setTimeout(() => {
      void persist();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [isDirty, persist]);

  function submit() {
    void persist(true);
  }

  const codeWithRevision = displayCode(form.code, form.revision);
  const saveStatus =
    saveState === "saving"
      ? "Guardando cambios..."
      : saveState === "error"
        ? "No se pudo guardar automaticamente. Usa Guardar ahora para reintentar."
        : isDirty
          ? "Cambios pendientes..."
          : saveState === "saved"
            ? "Cambios guardados automaticamente"
            : "Autoguardado activo";

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
            <button className="button-primary" disabled={isSaving} type="button" onClick={submit}>
              <Save size={16} /> {isSaving ? "Guardando..." : "Guardar ahora"}
            </button>
          </div>
        </div>

        <p
          aria-live="polite"
          className={`text-sm ${saveState === "error" ? "text-red-700" : saveState === "saving" || isDirty ? "text-neutral-600" : "text-green-700"}`}
        >
          {saveStatus}
        </p>

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
                {tableRows.map((row, rowIndex) => {
                  if (row.kind === "section") {
                    return (
                      <tr className="bg-neutral-100" key={`section-${row.sourceIndex}`}>
                        <td className="border border-neutral-300 p-2 text-xs font-bold uppercase text-neutral-600" colSpan={5}>
                          <input
                            className="h-8 w-full border border-neutral-200 bg-white px-2 font-bold uppercase"
                            value={form.items[row.sourceIndex]?.description ?? ""}
                            onChange={(event) => updateItem(row.sourceIndex, "description", event.target.value)}
                          />
                        </td>
                        <td className="border border-neutral-300 p-1 text-center">
                          <button
                            aria-label="Eliminar titulo"
                            className="inline-flex size-8 items-center justify-center border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                            type="button"
                            onClick={() => {
                              markChanged();
                              setForm((current) => ({
                                ...current,
                                items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== row.sourceIndex) : [blankItem()],
                              }));
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (row.kind === "subtotal") {
                    return (
                      <tr className="bg-neutral-50" key={`subtotal-${rowIndex}`}>
                        <td className="border border-neutral-300 p-2 text-right text-xs font-bold uppercase" colSpan={4}>
                          {row.label}
                        </td>
                        <td className="border border-neutral-300 p-2 text-right font-bold">{formatMoney(row.total)}</td>
                        <td className="border border-neutral-300 p-1"></td>
                      </tr>
                    );
                  }

                  const item = row.item;

                  return (
                    <tr key={`item-${row.sourceIndex}`}>
                      <td className="border border-neutral-300 p-1 text-center font-semibold">{row.itemPosition}</td>
                      <td className="border border-neutral-300 p-1">
                        <input className="h-8 w-full border border-neutral-200 px-2 text-right" min="0" step="0.01" type="number" value={item.qty} onChange={(event) => updateItem(row.sourceIndex, "qty", event.target.value)} />
                      </td>
                      <td className="border border-neutral-300 p-1">
                        <input className="h-8 w-full border border-neutral-200 px-2" value={item.description} onChange={(event) => updateItem(row.sourceIndex, "description", event.target.value)} />
                      </td>
                      <td className="border border-neutral-300 p-1">
                        <input className="h-8 w-full border border-neutral-200 px-2 text-right" min="0" step="0.01" type="number" value={item.unitValue} onChange={(event) => updateItem(row.sourceIndex, "unitValue", event.target.value)} />
                      </td>
                      <td className="border border-neutral-300 p-2 text-right font-bold">{formatMoney(row.total)}</td>
                      <td className="border border-neutral-300 p-1 text-center">
                        <button
                          aria-label="Eliminar item"
                          className="inline-flex size-8 items-center justify-center border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                          type="button"
                          onClick={() => {
                            markChanged();
                            setForm((current) => ({
                              ...current,
                              items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== row.sourceIndex) : [blankItem()],
                            }));
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="button-secondary"
              type="button"
              onClick={addItem}
            >
              <Plus size={16} /> Agregar item
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={addSection}
            >
              <Plus size={16} /> Agregar titulo
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={addSectionAtStart}
            >
              <Plus size={16} /> Agregar titulo arriba
            </button>
          </div>
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
                <Image alt="BYL" className="mb-2 h-6 w-16 object-cover object-center" height={90} src="/logo-byl.png" width={220} />
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
              <p className="text-base font-bold">PRESUPUESTO</p>
              <p className="font-bold">Nro {codeWithRevision}</p>
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
              {tableRows.map((row, index) => {
                if (row.kind === "section") {
                  return (
                    <tr key={`preview-section-${row.sourceIndex}`}>
                      <td className={`border border-black px-1 font-bold uppercase text-white ${previewRed}`} colSpan={5}>
                        {row.title}
                      </td>
                    </tr>
                  );
                }

                if (row.kind === "subtotal") {
                  return (
                    <tr key={`preview-subtotal-${index}`}>
                      <td className="border border-black text-right font-bold" colSpan={4}>{row.label}</td>
                      <td className="border border-black text-right font-bold">{formatMoney(row.total)}</td>
                    </tr>
                  );
                }

                return (
                  <tr key={`preview-item-${row.sourceIndex}`}>
                    <td className="border border-black text-center">{row.itemPosition}</td>
                    <td className="border border-black text-center">{row.item.qty}</td>
                    <td className="border border-black px-1">{row.item.description}</td>
                    <td className="border border-black text-right">{formatMoney(Number(row.item.unitValue) || 0)}</td>
                    <td className="border border-black text-right font-bold">{formatMoney(row.total)}</td>
                  </tr>
                );
              })}
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
