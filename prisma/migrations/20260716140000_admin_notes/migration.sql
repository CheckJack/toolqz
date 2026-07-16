-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNoteLink" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNoteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNoteAttachment" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNoteAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNote_createdById_idx" ON "AdminNote"("createdById");

-- CreateIndex
CREATE INDEX "AdminNote_visibility_idx" ON "AdminNote"("visibility");

-- CreateIndex
CREATE INDEX "AdminNote_updatedAt_idx" ON "AdminNote"("updatedAt");

-- CreateIndex
CREATE INDEX "AdminNote_pinned_idx" ON "AdminNote"("pinned");

-- CreateIndex
CREATE INDEX "AdminNoteLink_noteId_idx" ON "AdminNoteLink"("noteId");

-- CreateIndex
CREATE INDEX "AdminNoteAttachment_noteId_idx" ON "AdminNoteAttachment"("noteId");

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNoteLink" ADD CONSTRAINT "AdminNoteLink_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "AdminNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNoteAttachment" ADD CONSTRAINT "AdminNoteAttachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "AdminNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
