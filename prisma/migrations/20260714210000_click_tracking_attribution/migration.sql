-- AlterTable
ALTER TABLE "Click" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Click" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Click" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Click" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "Click" ADD COLUMN "utmTerm" TEXT;
ALTER TABLE "Click" ADD COLUMN "sourcePage" TEXT;
ALTER TABLE "Click" ADD COLUMN "listingType" TEXT;
ALTER TABLE "Click" ADD COLUMN "affiliateProgramId" TEXT;
ALTER TABLE "Click" ADD COLUMN "isBot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Click" ADD COLUMN "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "Click_isBot_idx" ON "Click"("isBot");
CREATE INDEX "Click_utmSource_idx" ON "Click"("utmSource");
CREATE INDEX "Click_affiliateProgramId_idx" ON "Click"("affiliateProgramId");

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
