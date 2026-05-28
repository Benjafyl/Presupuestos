import { getPrisma } from "@/lib/prisma";
import { NET_EXCLUSIONS_TEXT } from "@/lib/quote-format";

export const defaultMainText =
  "Nuestra propuesta considera pruebas de funcionamiento previas a la desconexión eléctrica de fuerza y control, desconexión de ductería, izaje del equipo mientras se reemplaza el techo, reinstalación de equipos compactos, realización de conexión eléctrica de fuerza y control, conexionado de ductos, anclaje a la nueva base de montaje, grúa, traslados y viáticos.";

export const defaultExclusions = NET_EXCLUSIONS_TEXT;

export const defaultWarranty = "8 MESES";
export const defaultExecutionTime = "A CONVENIR";
export const defaultSignature =
  "SALUDA ATENTAMENTE,\n\nBENJAMIN YAÑEZ LASALVIA\nINTERCHILE CLIMA SPA";

export async function ensureCompanySettings() {
  const prisma = getPrisma();
  const existing = await prisma.companySettings.findFirst({ orderBy: { id: "asc" } });

  if (existing) return existing;

  return prisma.companySettings.create({
    data: {
      name: "INTERCHILE CLIMA SPA",
      rut: "76.093.202-7",
      address: "Merced 838 A of 117 / Santiago",
      quotePrefix: "BYL",
      responsible: "BENJAMIN YAÑEZ LASALVIA",
      signatureDefault: defaultSignature,
    },
  });
}

export async function ensureTemplateText() {
  const prisma = getPrisma();
  const existing = await prisma.templateText.findFirst({ orderBy: { id: "asc" } });

  if (existing) return existing;

  return prisma.templateText.create({
    data: {
      mainText: defaultMainText,
      exclusions: defaultExclusions,
      warranty: defaultWarranty,
      executionTime: defaultExecutionTime,
    },
  });
}
