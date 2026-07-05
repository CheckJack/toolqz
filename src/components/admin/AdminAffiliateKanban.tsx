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

function AffiliateCard({
  program,
  overdue,
  canDrag,
  draggingId,
  moving,
  onStatusChange,
  showStatusSelect = false,
}: {
  program: AffiliateProgram;
  overdue: boolean;
  canDrag: boolean;
  draggingId: string | null;
  moving: boolean;
  onStatusChange: (id: string, status: AffiliateStatus) => Promise<boolean>;
  showStatusSelect?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleStatusSelect(next: AffiliateStatus) {
    if (next === program.status || moving) return;
    const ok = await onStatusChange(program.id, next);
    if (ok) toast(`Moved to ${next.replace(/_/g, " ")}`);
    else toast("Could not update status", "error");
  }

  return (
    <div
      className={`rounded-xl border border-dark-border bg-dark p-3 text-sm ${
        overdue ? "ring-1 ring-red-400/40" : ""
      } ${draggingId === program.id ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={() => router.push(`/admin/affiliates/${program.id}`)}
        className="text-left font-medium leading-snug hover:text-neon"
      >
        {program.companyName}
      </button>
      <p className="mt-1 text-xs text-muted">
        {program.assignedTo?.name ?? "Unassigned"}
        {program.tool ? ` · ${program.tool.name}` : ""}
      </p>
      {program.nextFollowUpAt && (
        <p className={`mt-1 text-xs ${overdue ? "text-red-400" : "text-muted"}`}>
          Follow-up {new Date(program.nextFollowUpAt).toLocaleDateString()}
        </p>
      )}
      {showStatusSelect && (
        <label className="mt-3 block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted">
            Status
          </span>
          <select
            value={program.status}
            disabled={!canDrag || moving}
            onChange={(e) => void handleStatusSelect(e.target.value as AffiliateStatus)}
            className="w-full rounded-lg border border-dark-border bg-dark-elevated px-2 py-2 text-xs text-white"
          >
            {AFFILIATE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      )}
      {(program.signupUrl || program.website) && (
        <a
          href={(program.signupUrl || program.website)!}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-block rounded border border-neon/30 bg-neon/10 px-2 py-0.5 text-xs font-medium text-neon hover:bg-neon/20"
        >
          Sign up ↗
        </a>
      )}
    </div>
  );
}

export function AdminAffiliateKanban({
  programs,
  onStatusChange,
  canDragProgram = () => true,
}: {
  programs: AffiliateProgram[];
  onStatusChange: (id: string, status: AffiliateStatus) => Promise<boolean>;
  canDragProgram?: (program: AffiliateProgram) => boolean;
}) {
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
    <>
      <div className="space-y-6 lg:hidden">
        {AFFILIATE_STATUSES.map((status) => {
          const cards = byStatus[status] ?? [];
          if (cards.length === 0) return null;

          return (
            <section
              key={status}
              className={`rounded-2xl border bg-dark-elevated ${columnColors[status] ?? "border-dark-border"}`}
            >
              <div className="border-b border-dark-border/50 px-4 py-3">
                <h3 className="text-sm font-semibold">{status.replace(/_/g, " ")}</h3>
                <p className="text-xs text-muted">{cards.length}</p>
              </div>
              <ul className="space-y-2 p-3">
                {cards.map((p) => {
                  const overdue = isFollowUpOverdue(p.nextFollowUpAt);
                  const canDrag = canDragProgram(p) && !moving;
                  return (
                    <li key={p.id}>
                      <AffiliateCard
                        program={p}
                        overdue={overdue}
                        canDrag={canDrag}
                        draggingId={draggingId}
                        moving={moving}
                        onStatusChange={onStatusChange}
                        showStatusSelect
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {programs.length === 0 && (
          <p className="rounded-2xl border border-dashed border-dark-border p-8 text-center text-sm text-muted">
            No affiliate programs match your filters.
          </p>
        )}
      </div>

      <div className="hidden gap-4 overflow-x-auto pb-2 lg:flex">
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
                        className={`${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                      >
                        <AffiliateCard
                          program={p}
                          overdue={overdue}
                          canDrag={canDrag}
                          draggingId={draggingId}
                          moving={moving}
                          onStatusChange={onStatusChange}
                        />
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
