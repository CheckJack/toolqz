-- AlterTable
ALTER TABLE "Tool" ADD COLUMN "listingType" TEXT NOT NULL DEFAULT 'EDITORIAL';

-- Backfill: tools with a tracking URL are affiliate partners
UPDATE "Tool" SET "listingType" = 'AFFILIATE' WHERE "affiliateUrl" IS NOT NULL AND TRIM("affiliateUrl") != '';
