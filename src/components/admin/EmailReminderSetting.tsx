"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

interface EmailReminderSettingProps {
  enabled: boolean;
  saving?: boolean;
  onChange: (enabled: boolean) => void;
  footerLink?: { href: string; label: string };
}

export function EmailReminderSetting({
  enabled,
  saving = false,
  onChange,
  footerLink,
}: EmailReminderSettingProps) {
  return (
    <div className="admin-card admin-card-pad">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-dark-border bg-dark text-muted"
          }`}
        >
          <Mail className="h-4 w-4" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">Follow-up email reminders</p>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-dark-border/80 text-muted"
                  }`}
                >
                  {enabled ? "Enabled" : "Off"}
                </span>
              </div>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
                Email when assigned affiliate follow-ups are due. In-app alerts always appear in
                the header bell.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Follow-up email reminders"
              disabled={saving}
              onClick={() => onChange(!enabled)}
              className={`admin-switch shrink-0 disabled:opacity-50 ${enabled ? "admin-switch-on" : ""}`}
            >
              <span className="admin-switch-thumb" aria-hidden />
            </button>
          </div>

          {footerLink && (
            <Link href={footerLink.href} className="admin-link-accent mt-3 inline-block text-[12px]">
              {footerLink.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
