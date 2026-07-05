-- AlterTable
ALTER TABLE "AdminPlaybookSnippet" ADD COLUMN "sensitive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "AdminPlaybookSnippet_sensitive_idx" ON "AdminPlaybookSnippet"("sensitive");
