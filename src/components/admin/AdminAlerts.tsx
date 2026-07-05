"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ListTodo,
  Loader2,
  MessageSquare,
  Rocket,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useToast } from "@/components/admin/Toast";

type AlertAction = "daily-tasks" | "build-monitor" | "uptime-check" | "follow-ups";

interface AlertCard {
  action: AlertAction;
  title: string;
  description: string;
  icon: typeof ListTodo;
  force?: boolean;
  note?: string;
}

const ALERT_CARDS: AlertCard[] = [
  {
    action: "daily-tasks",
    title: "Daily task digest",
    description:
      "Email each team member their open tasks (to-do and in progress). Normally sent at 9:00 Lisbon time.",
    icon: ListTodo,
  },
  {
    action: "build-monitor",
    title: "Deploy status email",
    description:
      "Check the latest Hostinger build and email the current deploy status to everyone with build alerts enabled.",
    icon: Rocket,
    force: true,
  },
  {
    action: "uptime-check",
    title: "Site health email",
    description:
      "Ping the live site and database, then email the current health status to everyone with build alerts enabled.",
    icon: CheckCircle2,
    force: true,
  },
  {
    action: "follow-ups",
    title: "Affiliate follow-ups",
    description:
      "Process due CRM follow-ups: in-app notifications for assignees plus a digest email to members who opted in.",
    icon: Users,
  },
];

function formatResult(action: AlertAction, data: Record<string, unknown>): string {
  switch (action) {
    case "daily-tasks":
      return `Sent ${data.emailsSent ?? 0} email(s) to ${data.users ?? 0} user(s) · ${data.usersWithTasks ?? 0} had open tasks`;
    case "build-monitor":
      if (data.skipped) return `Skipped: ${String(data.reason ?? "nothing to send")}`;
      return `Sent ${data.emailsSent ?? 0} email(s), ${data.notificationsCreated ?? 0} in-app notification(s) · build ${String(data.status ?? "—")}`;
    case "uptime-check":
      return `Sent ${data.emailsSent ?? 0} email(s), ${data.notificationsCreated ?? 0} in-app notification(s) · site ${data.healthy ? "healthy" : "unhealthy"} (HTTP ${data.statusCode ?? "—"})`;
    case "follow-ups":
      return `Checked ${data.checked ?? 0} program(s) · ${data.digestItems ?? 0} due · ${data.emailsSent ?? 0} digest email(s) · ${data.inAppCreated ?? 0} in-app notification(s)`;
    default:
      return "Done";
  }
}

export function AdminAlerts() {
  const { toast } = useToast();
  const [running, setRunning] = useState<AlertAction | null>(null);
  const [results, setResults] = useState<Partial<Record<AlertAction, string>>>({});

  async function runAlert(card: AlertCard) {
    setRunning(card.action);
    try {
      const res = await fetch("/api/admin/alerts/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: card.action, force: card.force }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Request failed";
        toast(message, "error");
        setResults((prev) => ({ ...prev, [card.action]: message }));
        return;
      }

      const summary = formatResult(card.action, data as Record<string, unknown>);
      setResults((prev) => ({ ...prev, [card.action]: summary }));
      toast(summary, "success");
    } catch {
      toast("Could not run alert", "error");
      setResults((prev) => ({ ...prev, [card.action]: "Network error" }));
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email alerts"
        hideTitle
        description="Trigger platform emails manually — no external cron required. Team messages still send automatically when you post in Messages."
      />

      <div className="rounded-xl border border-dark-border/80 bg-dark-card/40 p-4 text-[13px] leading-relaxed text-muted sm:p-5">
        <p className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-neon/80" aria-hidden />
          <span>
            <span className="text-white">Team messages</span> email recipients when someone sends a
            team message — use{" "}
            <Link href="/admin/messages" className="text-neon hover:underline">
              Messages
            </Link>{" "}
            as usual; no button needed here.
          </span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ALERT_CARDS.map((card) => {
          const Icon = card.icon;
          const isRunning = running === card.action;
          const result = results[card.action];

          return (
            <div
              key={card.action}
              className="flex flex-col rounded-xl border border-dark-border/80 bg-dark-card/60 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-neon">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-medium text-white">{card.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{card.description}</p>
                  {card.note && (
                    <p className="mt-2 text-[12px] text-muted/80">{card.note}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => void runAlert(card)}
                  className="admin-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  {isRunning ? "Sending…" : "Send now"}
                </button>
              </div>

              {result && (
                <p
                  className={`mt-3 text-[12px] leading-relaxed ${
                    result.includes("error") || result.includes("Failed") || result.includes("missing")
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {result}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
