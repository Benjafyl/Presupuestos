-- CreateTable
CREATE TABLE "ClientBranch" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "branch" TEXT,
    "commune" TEXT,
    "attention" TEXT,
    "city" TEXT,
    "payment" TEXT,
    "projectCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientBranch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "clientBranchId" INTEGER;

-- Backfill one branch record from the current client location fields.
INSERT INTO "ClientBranch" (
    "clientId",
    "branch",
    "commune",
    "attention",
    "city",
    "payment",
    "projectCode",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "branch",
    "commune",
    "attention",
    "city",
    "payment",
    "projectCode",
    "createdAt",
    "updatedAt"
FROM "Client"
WHERE
    "branch" IS NOT NULL
    OR "commune" IS NOT NULL
    OR "attention" IS NOT NULL
    OR "city" IS NOT NULL
    OR "payment" IS NOT NULL
    OR "projectCode" IS NOT NULL;

-- Link existing quotes to the best matching branch for that client when possible.
UPDATE "Quote" q
SET "clientBranchId" = b."id"
FROM "ClientBranch" b
WHERE
    q."clientId" = b."clientId"
    AND q."clientBranchId" IS NULL
    AND COALESCE(q."branch", '') = COALESCE(b."branch", '')
    AND COALESCE(q."commune", '') = COALESCE(b."commune", '');

-- CreateIndex
CREATE INDEX "ClientBranch_clientId_idx" ON "ClientBranch"("clientId");

-- AddForeignKey
ALTER TABLE "ClientBranch" ADD CONSTRAINT "ClientBranch_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientBranchId_fkey" FOREIGN KEY ("clientBranchId") REFERENCES "ClientBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
