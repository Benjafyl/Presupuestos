-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'INTERCHILE CLIMA SPA',
    "rut" TEXT NOT NULL DEFAULT '76.093.202-7',
    "address" TEXT NOT NULL DEFAULT 'Merced 838 A of 117 / Santiago',
    "quotePrefix" TEXT NOT NULL DEFAULT 'BYL',
    "responsible" TEXT NOT NULL DEFAULT 'BENJAMIN YAÑEZ LASALVIA',
    "signatureDefault" TEXT NOT NULL DEFAULT 'SALUDA ATENTAMENTE,

BENJAMIN YAÑEZ LASALVIA
INTERCHILE CLIMA SPA',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "branch" TEXT,
    "commune" TEXT,
    "attention" TEXT,
    "city" TEXT,
    "payment" TEXT,
    "projectCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "quoteMode" TEXT NOT NULL DEFAULT 'interchile',
    "code" TEXT NOT NULL,
    "revision" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "taxMode" TEXT NOT NULL DEFAULT 'NET',
    "quoteDate" TIMESTAMP(3) NOT NULL,
    "projectCode" TEXT,
    "clientId" INTEGER,
    "clientName" TEXT NOT NULL,
    "clientRut" TEXT,
    "branch" TEXT,
    "commune" TEXT,
    "attention" TEXT,
    "city" TEXT,
    "payment" TEXT,
    "mainText" TEXT NOT NULL,
    "exclusions" TEXT NOT NULL,
    "warranty" TEXT NOT NULL,
    "executionTime" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "rowType" TEXT NOT NULL DEFAULT 'item',
    "position" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "unitValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateText" (
    "id" SERIAL NOT NULL,
    "mainText" TEXT NOT NULL,
    "exclusions" TEXT NOT NULL,
    "warranty" TEXT NOT NULL,
    "executionTime" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateText_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

