-- CreateTable
CREATE TABLE "AdminPlaybookSnippet" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "aliases" TEXT,
    "tags" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPlaybookSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPlaybookSnippet_category_idx" ON "AdminPlaybookSnippet"("category");

-- CreateIndex
CREATE INDEX "AdminPlaybookSnippet_pinned_idx" ON "AdminPlaybookSnippet"("pinned");

-- CreateIndex
CREATE INDEX "AdminPlaybookSnippet_sortOrder_idx" ON "AdminPlaybookSnippet"("sortOrder");

-- AddForeignKey
ALTER TABLE "AdminPlaybookSnippet" ADD CONSTRAINT "AdminPlaybookSnippet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
