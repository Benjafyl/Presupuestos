-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Quote" ADD COLUMN "deleteExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Quote_quoteMode_deletedAt_idx" ON "Quote"("quoteMode", "deletedAt");

-- CreateIndex
CREATE INDEX "Quote_deleteExpiresAt_idx" ON "Quote"("deleteExpiresAt");
