"use client";

import { AdminAssistantChat } from "@/components/admin/AdminAssistantChat";

export function AdminAgent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          Chat with your TOOLQZ assistant — create draft tools, list your directory, and more.
        </p>
      </div>

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-4 sm:p-6">
        <AdminAssistantChat variant="page" className="min-h-[min(70vh,640px)]" />
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-elevated p-5 text-sm text-muted">
        <p className="font-medium text-white">Capabilities</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong className="text-white">Talk or type</strong> — mic button uses your browser (free)
          </li>
          <li>
            <strong className="text-white">Tools</strong> — create, update, publish, or delete listings
          </li>
          <li>
            <strong className="text-white">Affiliates</strong> — search CRM programs and create linked tool drafts
          </li>
          <li>
            <strong className="text-white">Analytics</strong> — clicks, top tools, referrers
          </li>
          <li>
            <strong className="text-white">Blog &amp; categories</strong> — draft posts and new categories
          </li>
          <li>Publish/delete always ask for your confirmation first</li>
          <li>Team messages: Admin → Messages</li>
        </ul>
      </div>
    </div>
  );
}
