import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultMainText =
  "Nuestra propuesta considera pruebas de funcionamiento previas a la desconexion electrica de fuerza y control, desconexion de ducteria, izaje del equipo mientras se reemplaza el techo, reinstalacion de equipos compactos, realizacion de conexion electrica de fuerza y control, conexionado de ductos, anclaje a la nueva base de montaje, grua, traslados y viaticos.";
const defaultExclusions = "EXCLUYE TODO ITEM NO CONSIDERADO EN ESTA PROPUESTA, IVA.";
const defaultWarranty = "8 MESES";
const defaultExecutionTime = "A CONVENIR";
const defaultSignature = "SALUDA ATENTAMENTE,\n\nBENJAMIN YANEZ LASALVIA\nINTERCHILE CLIMA SPA";

async function main() {
  const settingsCount = await prisma.companySettings.count();
  if (settingsCount === 0) {
    await prisma.companySettings.create({
      data: {
        name: "INTERCHILE CLIMA SPA",
        rut: "76.093.202-7",
        address: "Merced 838 A of 117 / Santiago",
        quotePrefix: "BYL",
        responsible: "BENJAMIN YANEZ LASALVIA",
        signatureDefault: defaultSignature,
      },
    });
  }

  const templateCount = await prisma.templateText.count();
  if (templateCount === 0) {
    await prisma.templateText.create({
      data: {
        mainText: defaultMainText,
        exclusions: defaultExclusions,
        warranty: defaultWarranty,
        executionTime: defaultExecutionTime,
      },
    });
  }

  await prisma.templateText.updateMany({
    where: {
      exclusions: {
        in: [
          "REPARACIONES, INSTALACION ELECTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO",
          "REPARACIONES, INSTALACIÃ“N ELÃ‰CTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO",
          "REPARACIONES, INSTALACIÃƒâ€œN ELÃƒâ€°CTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO",
        ],
      },
    },
    data: {
      exclusions: defaultExclusions,
    },
  });

  console.log("Base PostgreSQL lista para Presupuestos.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
