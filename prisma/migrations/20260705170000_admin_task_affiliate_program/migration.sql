-- AlterTable
ALTER TABLE "AdminTask" ADD COLUMN "affiliateProgramId" TEXT;

-- CreateIndex
CREATE INDEX "AdminTask_affiliateProgramId_idx" ON "AdminTask"("affiliateProgramId");

-- AddForeignKey
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
