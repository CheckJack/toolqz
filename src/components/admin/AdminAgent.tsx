"use client";

import { AdminAssistantChat } from "@/components/admin/AdminAssistantChat";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export function AdminAgent() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Assistant"
        description="Create tools, check analytics, manage affiliates — by chat or voice."
      />

      <div className="admin-card overflow-hidden">
        <AdminAssistantChat variant="page" className="min-h-[min(70vh,640px)]" persistKey="page" />
      </div>

      <div className="admin-card admin-card-pad text-sm text-muted">
        <p className="admin-section-title">What it can do</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            "Create & refresh tool listings from URLs",
            "Search affiliates and link CRM programs",
            "Click analytics and top performers",
            "Publish or delete (with confirmation)",
            "Draft blog posts and new categories",
            "Team messages live under Audience → Messages",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-[13px]">
              <span className="text-muted-dim">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
