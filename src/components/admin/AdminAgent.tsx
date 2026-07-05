"use client";

import { AdminAssistantChat } from "@/components/admin/AdminAssistantChat";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export function AdminAgent() {
  return (
    <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col gap-4 sm:min-h-[calc(100dvh-8.5rem)]">
      <AdminPageHeader
        hideTitle
        title="Assistant"
        description="Manage tools, affiliates, and analytics by chat or voice."
      />

      <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <AdminAssistantChat variant="page" className="min-h-0 flex-1" persistKey="page" />
      </div>
    </div>
  );
}
