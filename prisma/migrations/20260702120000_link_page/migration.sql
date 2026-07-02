-- CreateTable
CREATE TABLE "LinkPage" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL DEFAULT 'TOOLQZ',
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "backgroundType" TEXT NOT NULL DEFAULT 'gradient',
    "backgroundColor" TEXT NOT NULL DEFAULT '#272727',
    "gradientFrom" TEXT NOT NULL DEFAULT '#272727',
    "gradientTo" TEXT NOT NULL DEFAULT '#4b2559',
    "buttonColor" TEXT NOT NULL DEFAULT '#6db4e8',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#18181b',
    "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
    "showBranding" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkPageItem" (
    "id" TEXT NOT NULL,
    "linkPageId" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkPageItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkPageItem_linkPageId_sortOrder_idx" ON "LinkPageItem"("linkPageId", "sortOrder");

-- CreateIndex
CREATE INDEX "LinkPageItem_enabled_idx" ON "LinkPageItem"("enabled");

-- AddForeignKey
ALTER TABLE "LinkPageItem" ADD CONSTRAINT "LinkPageItem_linkPageId_fkey" FOREIGN KEY ("linkPageId") REFERENCES "LinkPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
