-- CreateTable
CREATE TABLE "AdminChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminChatSession_userId_updatedAt_idx" ON "AdminChatSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AdminChatMessage_sessionId_createdAt_idx" ON "AdminChatMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminChatSession" ADD CONSTRAINT "AdminChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminChatMessage" ADD CONSTRAINT "AdminChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdminChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
