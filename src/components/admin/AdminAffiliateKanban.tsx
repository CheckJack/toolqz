"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AFFILIATE_STATUSES, AffiliateProgram, AffiliateStatus } from "@/types/affiliate";
import { isFollowUpOverdue } from "@/lib/affiliates";
import { useToast } from "@/components/admin/Toast";

const columnColors: Record<string, string> = {
  PENDING: "border-yellow-400/30",
  IN_PROGRESS: "border-blue-400/30",
  APPLIED: "border-purple-400/30",
  ACTIVE: "border-neon/30",
  REJECTED: "border-red-400/30",
  PAUSED: "border-dark-border",
  NOT_AVAILABLE: "border-orange-400/30",
  ON_HOLD: "border-amber-400/30",
};

export function AdminAffiliateKanban({
  programs,
  onStatusChange,
  canDragProgram = () => true,
}: {
  programs: AffiliateProgram[];
  onStatusChange: (id: string, status: AffiliateStatus) => Promise<boolean>;
  canDragProgram?: (program: AffiliateProgram) => boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const byStatus = AFFILIATE_STATUSES.reduce(
    (acc, status) => {
      acc[status] = programs.filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, AffiliateProgram[]>
  );

  async function handleDrop(targetStatus: AffiliateStatus) {
    if (!draggingId || moving) return;
    const program = programs.find((p) => p.id === draggingId);
    if (!program || program.status === targetStatus) {
      setDraggingId(null);
      setOverStatus(null);
      return;
    }

    setMoving(true);
    const ok = await onStatusChange(draggingId, targetStatus);
    setMoving(false);
    setDraggingId(null);
    setOverStatus(null);

    if (ok) toast(`Moved to ${targetStatus.replace(/_/g, " ")}`);
    else toast("Could not update status", "error");
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      <p className="sr-only">Drag cards between columns to change status</p>
      {AFFILIATE_STATUSES.map((status) => {
        const cards = byStatus[status] ?? [];
        const isOver = overStatus === status;
        return (
          <div
            key={status}
            className={`w-64 shrink-0 rounded-2xl border bg-dark-elevated transition ${
              columnColors[status] ?? "border-dark-border"
            } ${isOver ? "ring-2 ring-neon/40" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStatus(status);
            }}
            onDragLeave={() => setOverStatus((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              void handleDrop(status);
            }}
          >
            <div className="border-b border-dark-border/50 px-3 py-3">
              <h3 className="text-sm font-semibold">{status.replace(/_/g, " ")}</h3>
              <p className="text-xs text-muted">{cards.length}</p>
            </div>
            <ul className="max-h-[60vh] min-h-[4rem] space-y-2 overflow-y-auto p-2">
              {cards.length === 0 ? (
                <li className="rounded-lg border border-dashed border-dark-border p-3 text-center text-xs text-muted">
                  Drop here
                </li>
              ) : (
                cards.map((p) => {
                  const overdue = isFollowUpOverdue(p.nextFollowUpAt);
                  const canDrag = canDragProgram(p) && !moving;
                  return (
                    <li
                      key={p.id}
                      draggable={canDrag}
                      onDragStart={() => canDrag && setDraggingId(p.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverStatus(null);
                      }}
                      className={`${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${draggingId === p.id ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`rounded-xl border border-dark-border bg-dark p-3 text-sm ${
                          overdue ? "ring-1 ring-red-400/40" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/affiliates/${p.id}`)}
                          className="text-left font-medium leading-snug hover:text-neon"
                        >
                          {p.companyName}
                        </button>
                        <p className="mt-1 text-xs text-muted">
                          {p.assignedTo?.name ?? "Unassigned"}
                          {p.tool ? ` · ${p.tool.name}` : ""}
                        </p>
                        {p.nextFollowUpAt && (
                          <p className={`mt-1 text-xs ${overdue ? "text-red-400" : "text-muted"}`}>
                            Follow-up {new Date(p.nextFollowUpAt).toLocaleDateString()}
                          </p>
                        )}
                        {(p.signupUrl || p.website) && (
                          <a
                            href={(p.signupUrl || p.website)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-block rounded border border-neon/30 bg-neon/10 px-2 py-0.5 text-xs font-medium text-neon hover:bg-neon/20"
                          >
                            Sign up ↗
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
