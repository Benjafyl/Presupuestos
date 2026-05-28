import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = dirname(fileURLToPath(import.meta.url));
const dbPath = join(root, "..", "prisma", "dev.db");

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS CompanySettings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'INTERCHILE CLIMA SPA',
  rut TEXT NOT NULL DEFAULT '76.093.202-7',
  address TEXT NOT NULL DEFAULT 'Merced 838 A of 117 / Santiago',
  quotePrefix TEXT NOT NULL DEFAULT 'BYL',
  responsible TEXT NOT NULL DEFAULT 'BENJAMIN YAÑEZ LASALVIA',
  signatureDefault TEXT NOT NULL DEFAULT 'SALUDA ATENTAMENTE,\n\nBENJAMIN YAÑEZ LASALVIA\nINTERCHILE CLIMA SPA',
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Client (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rut TEXT,
  branch TEXT,
  commune TEXT,
  attention TEXT,
  city TEXT,
  payment TEXT,
  projectCode TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Quote (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quoteMode TEXT NOT NULL DEFAULT 'interchile',
  code TEXT NOT NULL,
  revision TEXT,
  currency TEXT NOT NULL DEFAULT 'CLP',
  taxMode TEXT NOT NULL DEFAULT 'NET',
  quoteDate DATETIME NOT NULL,
  projectCode TEXT,
  clientId INTEGER,
  clientName TEXT NOT NULL,
  clientRut TEXT,
  branch TEXT,
  commune TEXT,
  attention TEXT,
  city TEXT,
  payment TEXT,
  mainText TEXT NOT NULL,
  exclusions TEXT NOT NULL,
  warranty TEXT NOT NULL,
  executionTime TEXT NOT NULL,
  signature TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Quote_clientId_fkey FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS QuoteItem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quoteId INTEGER NOT NULL,
  position INTEGER NOT NULL,
  qty REAL NOT NULL,
  description TEXT NOT NULL,
  unitValue REAL NOT NULL,
  CONSTRAINT QuoteItem_quoteId_fkey FOREIGN KEY (quoteId) REFERENCES Quote(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS TemplateText (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mainText TEXT NOT NULL,
  exclusions TEXT NOT NULL,
  warranty TEXT NOT NULL,
  executionTime TEXT NOT NULL,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const quoteColumns = db.prepare("PRAGMA table_info(Quote)").all();
if (!quoteColumns.some((column) => column.name === "quoteMode")) {
  db.exec("ALTER TABLE Quote ADD COLUMN quoteMode TEXT NOT NULL DEFAULT 'interchile';");
}

if (!quoteColumns.some((column) => column.name === "taxMode")) {
  db.exec("ALTER TABLE Quote ADD COLUMN taxMode TEXT NOT NULL DEFAULT 'NET';");
}

const settingsCount = db.prepare("SELECT COUNT(*) AS count FROM CompanySettings").get().count;
if (settingsCount === 0) {
  db.prepare(`
    INSERT INTO CompanySettings (name, rut, address, quotePrefix, responsible, signatureDefault, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    "INTERCHILE CLIMA SPA",
    "76.093.202-7",
    "Merced 838 A of 117 / Santiago",
    "BYL",
    "BENJAMIN YAÑEZ LASALVIA",
    "SALUDA ATENTAMENTE,\n\nBENJAMIN YAÑEZ LASALVIA\nINTERCHILE CLIMA SPA",
  );
}

const templateCount = db.prepare("SELECT COUNT(*) AS count FROM TemplateText").get().count;
if (templateCount === 0) {
  db.prepare(`
    INSERT INTO TemplateText (mainText, exclusions, warranty, executionTime, updatedAt)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    "Nuestra propuesta considera pruebas de funcionamiento previas a la desconexión eléctrica de fuerza y control, desconexión de ductería, izaje del equipo mientras se reemplaza el techo, reinstalación de equipos compactos, realización de conexión eléctrica de fuerza y control, conexionado de ductos, anclaje a la nueva base de montaje, grúa, traslados y viáticos.",
    "REPARACIONES, INSTALACIÓN ELÉCTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO",
    "8 MESES",
    "A CONVENIR",
  );
}

db.prepare(`
  UPDATE TemplateText
  SET exclusions = ?, updatedAt = CURRENT_TIMESTAMP
  WHERE exclusions = ?
`).run(
  "EXCLUYE TODO ITEM NO CONSIDERADO EN ESTA PROPUESTA, IVA.",
  "REPARACIONES, INSTALACIÃ“N ELÃ‰CTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO",
);

db.prepare(`
  UPDATE TemplateText
  SET exclusions = ?, updatedAt = CURRENT_TIMESTAMP
  WHERE exclusions = ?
`).run(
  "EXCLUYE TODO ITEM NO CONSIDERADO EN ESTA PROPUESTA, IVA.",
  "REPARACIONES, INSTALACIÓN ELÉCTRICA, IVA Y TODO ITEM NO CONSIDERADO EN ESTE PRESUPUESTO",
);

db.close();
console.log(`SQLite local listo en ${dbPath}`);
