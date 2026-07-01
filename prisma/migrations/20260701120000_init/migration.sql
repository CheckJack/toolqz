-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "lastLoginAt" TIMESTAMP(3),
    "emailFollowUpReminders" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "highlights" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "affiliateUrl" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "screenshots" TEXT NOT NULL DEFAULT '[]',
    "whoIsItFor" TEXT NOT NULL DEFAULT '',
    "notForYouIf" TEXT,
    "howItWorks" TEXT NOT NULL DEFAULT '[]',
    "pricing" TEXT NOT NULL DEFAULT '[]',
    "pros" TEXT NOT NULL DEFAULT '[]',
    "cons" TEXT NOT NULL DEFAULT '[]',
    "faq" TEXT NOT NULL DEFAULT '[]',
    "lastReviewed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolSlugRedirect" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolSlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "signupUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "commission" TEXT,
    "isRecurring" BOOLEAN,
    "cookieDuration" TEXT,
    "affiliateNetwork" TEXT,
    "affiliateUrl" TEXT,
    "commissionNotes" TEXT,
    "notes" TEXT,
    "contactEmail" TEXT,
    "rejectionReason" TEXT,
    "applicationId" TEXT,
    "source" TEXT DEFAULT 'manual',
    "contactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "followUpNotifiedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "toolId" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateActivity" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamConversation" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamConversationRead" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamConversationRead_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT NOT NULL,
    "source" TEXT,
    "affiliateProgramId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerInquiry" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "productType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'popup',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ToolSlugRedirect_oldSlug_key" ON "ToolSlugRedirect"("oldSlug");

-- CreateIndex
CREATE INDEX "ToolSlugRedirect_toolId_idx" ON "ToolSlugRedirect"("toolId");

-- CreateIndex
CREATE INDEX "Click_toolId_idx" ON "Click"("toolId");

-- CreateIndex
CREATE INDEX "Click_clickedAt_idx" ON "Click"("clickedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProgram_toolId_key" ON "AffiliateProgram"("toolId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_status_idx" ON "AffiliateProgram"("status");

-- CreateIndex
CREATE INDEX "AffiliateProgram_assignedToId_idx" ON "AffiliateProgram"("assignedToId");

-- CreateIndex
CREATE INDEX "AffiliateProgram_category_idx" ON "AffiliateProgram"("category");

-- CreateIndex
CREATE INDEX "AffiliateProgram_nextFollowUpAt_idx" ON "AffiliateProgram"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "AffiliateActivity_affiliateId_idx" ON "AffiliateActivity"("affiliateId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_idx" ON "AdminAuditLog"("entity");

-- CreateIndex
CREATE INDEX "AdminNotification_userId_readAt_idx" ON "AdminNotification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_entityId_type_idx" ON "AdminNotification"("entityId", "type");

-- CreateIndex
CREATE INDEX "TeamConversation_userAId_idx" ON "TeamConversation"("userAId");

-- CreateIndex
CREATE INDEX "TeamConversation_userBId_idx" ON "TeamConversation"("userBId");

-- CreateIndex
CREATE INDEX "TeamConversation_updatedAt_idx" ON "TeamConversation"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamConversation_userAId_userBId_key" ON "TeamConversation"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "TeamMessage_conversationId_createdAt_idx" ON "TeamMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "FinanceEntry_type_idx" ON "FinanceEntry"("type");

-- CreateIndex
CREATE INDEX "FinanceEntry_occurredAt_idx" ON "FinanceEntry"("occurredAt");

-- CreateIndex
CREATE INDEX "PartnerInquiry_createdAt_idx" ON "PartnerInquiry"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerInquiry_email_idx" ON "PartnerInquiry"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_subscribedAt_idx" ON "NewsletterSubscriber"("subscribedAt");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");

-- AddForeignKey
ALTER TABLE "ToolSlugRedirect" ADD CONSTRAINT "ToolSlugRedirect_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateActivity" ADD CONSTRAINT "AffiliateActivity_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateActivity" ADD CONSTRAINT "AffiliateActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamConversation" ADD CONSTRAINT "TeamConversation_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamConversation" ADD CONSTRAINT "TeamConversation_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TeamConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMessage" ADD CONSTRAINT "TeamMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamConversationRead" ADD CONSTRAINT "TeamConversationRead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TeamConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamConversationRead" ADD CONSTRAINT "TeamConversationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_affiliateProgramId_fkey" FOREIGN KEY ("affiliateProgramId") REFERENCES "AffiliateProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

