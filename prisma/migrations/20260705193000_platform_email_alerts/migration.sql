-- CreateTable
CREATE TABLE "SystemMonitorState" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMonitorState_pkey" PRIMARY KEY ("key")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailBuildAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailTaskDigest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailMessageAlerts" BOOLEAN NOT NULL DEFAULT true;
