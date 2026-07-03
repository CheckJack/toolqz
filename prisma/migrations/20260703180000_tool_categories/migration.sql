-- CreateTable
CREATE TABLE "ToolCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ToolCategory_slug_key" ON "ToolCategory"("slug");

-- CreateIndex
CREATE INDEX "ToolCategory_published_sortOrder_idx" ON "ToolCategory"("published", "sortOrder");
